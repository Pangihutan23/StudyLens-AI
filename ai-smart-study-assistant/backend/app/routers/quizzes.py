from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Quiz, QuizAnswer, QuizAttempt, QuizQuestion
from ..schemas import QuizInput, Submission
from ..services.quiz_service import generate_quiz
from ..utils.errors import AppError
from ..utils.records import public, ready_document, require

router = APIRouter(prefix='/api/quizzes', tags=['Quizzes'])


def questions_for(db, quiz_id):
    return db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.position)).all()


def safe_quiz(db, quiz):
    return {**public(quiz), 'questions': [public(q, exclude=('correct_answer', 'explanation', 'source_page')) for q in questions_for(db, quiz.id)]}


@router.post('/generate', status_code=201)
def generate(request: QuizInput, db: Session = Depends(get_db)):
    document = ready_document(db, request.document_id)
    generated = generate_quiz(db, document, request)
    quiz = Quiz(document_id=document.id, document_title=document.title, title=request.topic or f'Study check · {document.title}', difficulty=request.difficulty, language=request.language, topic=request.topic)
    db.add(quiz)
    db.flush()
    for position, question in enumerate(generated):
        db.add(QuizQuestion(quiz_id=quiz.id, position=position, **question.model_dump()))
    db.commit()
    return {'data': safe_quiz(db, quiz)}


@router.get('')
def listing(db: Session = Depends(get_db)):
    return {'data': [public(q) for q in db.scalars(select(Quiz).order_by(Quiz.created_at.desc()))]}


def result_detail(db, attempt):
    quiz = require(db, Quiz, attempt.quiz_id)
    answers = {a.question_id: a for a in db.scalars(select(QuizAnswer).where(QuizAnswer.attempt_id == attempt.id))}
    review = [{**public(q), 'selected_answer': answers[q.id].selected_answer, 'correct': answers[q.id].correct} for q in questions_for(db, quiz.id)]
    return {**public(attempt), 'title': quiz.title, 'document_title': quiz.document_title, 'questions': review}


@router.get('/results')
def results(db: Session = Depends(get_db)):
    attempts = db.scalars(select(QuizAttempt).order_by(QuizAttempt.created_at.desc())).all()
    return {'data': [{**public(a), 'title': require(db, Quiz, a.quiz_id).title} for a in attempts]}


@router.get('/results/{attempt_id}')
def result(attempt_id: UUID, db: Session = Depends(get_db)):
    return {'data': result_detail(db, require(db, QuizAttempt, attempt_id))}


@router.get('/{quiz_id}')
def detail(quiz_id: UUID, db: Session = Depends(get_db)):
    return {'data': safe_quiz(db, require(db, Quiz, quiz_id))}


@router.post('/{quiz_id}/submit', status_code=201)
def submit(quiz_id: UUID, request: Submission, db: Session = Depends(get_db)):
    quiz = require(db, Quiz, quiz_id)
    questions = questions_for(db, quiz.id)
    answers = {str(k): v for k, v in request.answers.items()}
    if set(answers) != {q.id for q in questions}:
        raise AppError('Submit one answer entry for every quiz question; use null for skipped questions.', 422)
    score = sum(answers[q.id] == q.correct_answer for q in questions)
    attempt = QuizAttempt(quiz_id=quiz.id, score=score, total=len(questions), percentage=round(score / len(questions) * 100, 1))
    db.add(attempt)
    db.flush()
    for q in questions:
        db.add(QuizAnswer(attempt_id=attempt.id, question_id=q.id, selected_answer=answers[q.id], correct=answers[q.id] == q.correct_answer))
    db.commit()
    return {'data': result_detail(db, attempt)}
