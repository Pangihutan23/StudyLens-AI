from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChatSession, Document, Quiz, QuizAttempt, Summary
from ..utils.records import public

router = APIRouter(prefix='/api/dashboard', tags=['Dashboard'])


@router.get('/stats')
def stats(db: Session = Depends(get_db)):
    def count(model):
        return db.scalar(select(func.count()).select_from(model))
    return {'data': {'documents': count(Document), 'conversations': count(ChatSession), 'summaries': count(Summary), 'quizzes_completed': count(QuizAttempt), 'average_score': round(db.scalar(select(func.avg(QuizAttempt.percentage))) or 0, 1)}}


@router.get('/activity')
def activity(db: Session = Depends(get_db)):
    entries = []
    for model, kind in [(Document, 'document'), (ChatSession, 'chat'), (Summary, 'summary'), (Quiz, 'quiz'), (QuizAttempt, 'attempt')]:
        for item in db.scalars(select(model).order_by(model.created_at.desc()).limit(20)):
            record = public(item, exclude=('content',))
            title = record.get('title') or record.get('document_title') or 'Quiz completed'
            entries.append({'id': item.id, 'type': kind, 'title': title, 'created_at': record['created_at'], 'percentage': record.get('percentage')})
    return {'data': sorted(entries, key=lambda x: x['created_at'], reverse=True)[:40]}
