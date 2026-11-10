from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChatMessage, ChatSession
from ..schemas import ChatInput
from ..services.rag_service import answer_question
from ..utils.records import public, ready_document, require

router = APIRouter(prefix='/api/chat', tags=['Chat'])


@router.post('')
def chat(request: ChatInput, db: Session = Depends(get_db)):
    documents = [ready_document(db, i) for i in dict.fromkeys(request.document_ids)]
    session = require(db, ChatSession, request.session_id) if request.session_id else None
    history = db.scalars(select(ChatMessage).where(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at)).all() if session else []
    content, sources = answer_question(db, documents, request.question, request.language, history)
    if session is None:
        session = ChatSession(title=request.question[:90], document_ids=[d.id for d in documents])
        db.add(session)
        db.flush()
    session.document_ids = [d.id for d in documents]
    user = ChatMessage(session_id=session.id, role='user', content=request.question, sources=[])
    assistant = ChatMessage(session_id=session.id, role='assistant', content=content, sources=sources)
    db.add_all([user, assistant])
    db.commit()
    return {'data': {'session': public(session), 'messages': [public(user), public(assistant)]}}


@router.get('/sessions')
def sessions(db: Session = Depends(get_db)):
    return {'data': [public(s) for s in db.scalars(select(ChatSession).order_by(ChatSession.created_at.desc()))]}


@router.get('/sessions/{session_id}')
def session_detail(session_id: UUID, db: Session = Depends(get_db)):
    session = require(db, ChatSession, session_id)
    messages = db.scalars(select(ChatMessage).where(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at)).all()
    return {'data': {**public(session), 'messages': [public(m) for m in messages]}}


@router.delete('/sessions/{session_id}')
def delete_session(session_id: UUID, db: Session = Depends(get_db)):
    db.delete(require(db, ChatSession, session_id))
    db.commit()
    return {'data': {'deleted': str(session_id)}}
