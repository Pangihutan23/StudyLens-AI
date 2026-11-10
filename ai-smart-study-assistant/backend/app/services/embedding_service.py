import os
from threading import RLock
from uuid import uuid4

import faiss
import numpy as np
from sqlalchemy import select

from ..config import settings
from ..models import Chunk
from ..utils.errors import AppError
from .gemini_service import gemini

vector_lock = RLock()


def normalized(vectors):
    matrix = np.asarray(vectors, dtype='float32')
    if matrix.ndim != 2 or matrix.shape[1] != settings.dimensions or not np.isfinite(matrix).all():
        raise AppError('Invalid embedding dimensions returned by Gemini. Document was not indexed.', 502)
    if np.any(np.linalg.norm(matrix, axis=1) < 1e-8):
        raise AppError('Gemini returned an empty embedding. Document was not indexed.', 502)
    faiss.normalize_L2(matrix)
    return matrix


def embed_chunks(chunks):
    vectors = []
    for start in range(0, len(chunks), 32):
        vectors.extend(gemini.embed([c['text'] for c in chunks[start:start + 32]]))
    return normalized(vectors)


def index_path(document_id):
    return settings.storage / 'vectorstore' / f'{document_id}.faiss'


def write_index(document_id, matrix):
    index = faiss.IndexFlatIP(settings.dimensions)
    index.add(matrix)
    path = index_path(document_id)
    temporary = path.with_suffix(f'.{uuid4().hex}.tmp')
    try:
        faiss.write_index(index, str(temporary))
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)
    return index


def search(db, documents, question, limit=8):
    query = normalized(gemini.embed([question], query=True))
    found = []
    with vector_lock:
        for doc in documents:
            if doc.embedding_model != settings.embedding_model or doc.dimensions != settings.dimensions:
                raise AppError('Embedding settings changed. Delete and re-upload the affected documents before using AI.', 409)
            chunks = db.scalars(select(Chunk).where(Chunk.document_id == doc.id).order_by(Chunk.position)).all()
            if not chunks:
                raise AppError('This document has no indexed text. Please upload it again.', 409)
            path = index_path(doc.id)
            try:
                index = faiss.read_index(str(path))
                if index.d != settings.dimensions or index.ntotal != len(chunks):
                    raise ValueError('Index out of sync')
            except (RuntimeError, ValueError):
                # SQLite is the authoritative source; derived index files are safely rebuildable.
                matrix = np.vstack([np.frombuffer(c.embedding, dtype='float32') for c in chunks])
                index = write_index(doc.id, normalized(matrix))
            scores, positions = index.search(query, min(limit, len(chunks)))
            for score, position in zip(scores[0], positions[0]):
                chunk = chunks[int(position)]
                found.append({'document_id': doc.id, 'document_title': doc.title, 'page': chunk.page, 'text': chunk.text, 'score': float(score)})
    return sorted(found, key=lambda c: c['score'], reverse=True)[:limit]
