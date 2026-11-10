from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, LargeBinary, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


def now():
    return datetime.now(timezone.utc)


class Record:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Document(Record, Base):
    __tablename__ = 'documents'
    title: Mapped[str] = mapped_column(String(255))
    size: Mapped[int]
    page_count: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(default='processing')
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_model: Mapped[str]
    dimensions: Mapped[int]


class Chunk(Record, Base):
    __tablename__ = 'document_chunks'
    document_id: Mapped[str] = mapped_column(ForeignKey('documents.id', ondelete='CASCADE'), index=True)
    page: Mapped[int]
    position: Mapped[int]
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[bytes] = mapped_column(LargeBinary)


class ChatSession(Record, Base):
    __tablename__ = 'chat_sessions'
    title: Mapped[str]
    document_ids: Mapped[list] = mapped_column(JSON)


class ChatMessage(Record, Base):
    __tablename__ = 'chat_messages'
    session_id: Mapped[str] = mapped_column(ForeignKey('chat_sessions.id', ondelete='CASCADE'), index=True)
    role: Mapped[str]
    content: Mapped[str] = mapped_column(Text)
    sources: Mapped[list] = mapped_column(JSON, default=list)


class Summary(Record, Base):
    __tablename__ = 'summaries'
    document_id: Mapped[str | None] = mapped_column(ForeignKey('documents.id', ondelete='SET NULL'), nullable=True)
    document_title: Mapped[str]
    summary_type: Mapped[str]
    length: Mapped[str]
    language: Mapped[str]
    content: Mapped[str] = mapped_column(Text)


class Quiz(Record, Base):
    __tablename__ = 'quizzes'
    document_id: Mapped[str | None] = mapped_column(ForeignKey('documents.id', ondelete='SET NULL'), nullable=True)
    document_title: Mapped[str]
    title: Mapped[str]
    difficulty: Mapped[str]
    language: Mapped[str]
    topic: Mapped[str]


class QuizQuestion(Record, Base):
    __tablename__ = 'quiz_questions'
    quiz_id: Mapped[str] = mapped_column(ForeignKey('quizzes.id', ondelete='CASCADE'), index=True)
    position: Mapped[int]
    question: Mapped[str] = mapped_column(Text)
    options: Mapped[list] = mapped_column(JSON)
    correct_answer: Mapped[int]
    explanation: Mapped[str] = mapped_column(Text)
    source_page: Mapped[int | None] = mapped_column(nullable=True)


class QuizAttempt(Record, Base):
    __tablename__ = 'quiz_attempts'
    quiz_id: Mapped[str] = mapped_column(ForeignKey('quizzes.id', ondelete='CASCADE'), index=True)
    score: Mapped[int]
    total: Mapped[int]
    percentage: Mapped[float]


class QuizAnswer(Record, Base):
    __tablename__ = 'quiz_answers'
    attempt_id: Mapped[str] = mapped_column(ForeignKey('quiz_attempts.id', ondelete='CASCADE'), index=True)
    question_id: Mapped[str] = mapped_column(ForeignKey('quiz_questions.id', ondelete='CASCADE'))
    selected_answer: Mapped[int | None] = mapped_column(nullable=True)
    correct: Mapped[bool]
