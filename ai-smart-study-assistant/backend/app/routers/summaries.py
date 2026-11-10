from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Summary
from ..schemas import SummaryInput
from ..services.summary_service import summarize
from ..utils.records import public, ready_document, require

router = APIRouter(prefix='/api/summaries', tags=['Summaries'])


@router.post('/generate', status_code=201)
def generate(request: SummaryInput, db: Session = Depends(get_db)):
    document = ready_document(db, request.document_id)
    content = summarize(db, document, request)
    summary = Summary(document_id=document.id, document_title=document.title, summary_type=request.summary_type, length=request.length, language=request.language, content=content)
    db.add(summary)
    db.commit()
    return {'data': public(summary)}


@router.get('')
def listing(db: Session = Depends(get_db)):
    return {'data': [public(s, exclude=('content',)) for s in db.scalars(select(Summary).order_by(Summary.created_at.desc()))]}


@router.get('/{summary_id}')
def detail(summary_id: UUID, db: Session = Depends(get_db)):
    return {'data': public(require(db, Summary, summary_id))}
