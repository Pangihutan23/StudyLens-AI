from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Chunk, Document
from ..services.embedding_service import embed_chunks, index_path, vector_lock, write_index
from ..services.pdf_service import extract_chunks
from ..utils.errors import AppError
from ..utils.records import public, require

router = APIRouter(prefix='/api/documents', tags=['Documents'])


@router.post('/upload', status_code=201)
def upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    title = Path((file.filename or 'document.pdf').replace('\\', '/')).name[:255]
    if not title.lower().endswith('.pdf') or file.content_type not in ('application/pdf', 'application/octet-stream'):
        raise AppError('Only PDF files are supported.', 415)
    identifier = str(uuid4())
    path = settings.storage / 'uploads' / f'{identifier}.pdf'
    size = 0
    try:
        with path.open('wb') as out:
            while block := file.file.read(1024 * 1024):
                size += len(block)
                if size > settings.max_bytes:
                    raise AppError(f'PDF exceeds the {settings.max_bytes // (1024 * 1024)} MB limit.', 413)
                if size == len(block) and not block.lstrip().startswith(b'%PDF-'):
                    raise AppError('The file does not contain a valid PDF header.', 415)
                out.write(block)
        if size == 0:
            raise AppError('The uploaded file is empty.', 422)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    finally:
        file.file.close()
    doc = Document(id=identifier, title=title, size=size, embedding_model=settings.embedding_model, dimensions=settings.dimensions)
    db.add(doc)
    db.commit()
    try:
        count, chunks = extract_chunks(path)
        matrix = embed_chunks(chunks)
        with vector_lock:
            # A user may delete a processing upload from another browser tab.
            db.refresh(doc)
            for chunk, vector in zip(chunks, matrix):
                db.add(Chunk(document_id=doc.id, **chunk, embedding=vector.tobytes()))
            write_index(doc.id, matrix)
            doc.page_count, doc.status = count, 'ready'
            db.commit()
    except Exception as exc:
        db.rollback()
        index_path(identifier).unlink(missing_ok=True)
        existing = db.get(Document, identifier)
        message = exc.message if isinstance(exc, AppError) else 'Document processing failed. Please delete this upload and try again.'
        if existing:
            existing.status, existing.error = 'error', message
            db.commit()
        raise AppError(message, exc.status if isinstance(exc, AppError) else 500) from None
    return {'data': public(doc)}


@router.get('')
def listing(db: Session = Depends(get_db)):
    return {'data': [public(d) for d in db.scalars(select(Document).order_by(Document.created_at.desc()))]}


@router.get('/{document_id}')
def detail(document_id: UUID, db: Session = Depends(get_db)):
    return {'data': public(require(db, Document, document_id))}


@router.delete('/{document_id}')
def delete(document_id: UUID, db: Session = Depends(get_db)):
    with vector_lock:
        doc = require(db, Document, document_id)
        if doc.status == 'processing':
            raise AppError('This PDF is still processing. Wait for processing to finish before deleting it.', 409)
        db.delete(doc)
        db.commit()
        index_path(str(document_id)).unlink(missing_ok=True)
        (settings.storage / 'uploads' / f'{document_id}.pdf').unlink(missing_ok=True)
    return {'data': {'deleted': str(document_id)}}
