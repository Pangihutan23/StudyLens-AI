import json

from pydantic import ValidationError

from ..schemas import GeneratedQuiz
from ..utils.errors import AppError
from .gemini_service import gemini
from .summary_service import document_context


def generate_quiz(db, document, request):
    context = document_context(db, document, request.language)
    prompt = f'Generate exactly {request.count} distinct multiple-choice questions in {request.language}, difficulty {request.difficulty}. '
    prompt += 'Each must have four distinct plausible options and exactly one unambiguously correct answer, represented as a zero-based option index. Provide a substantive explanation and the original source_page when available. '
    prompt += 'Cover the supplied material broadly unless a topic is specified. If the requested topic is absent, return no questions rather than invent content.\n'
    prompt += json.dumps({'topic': request.topic, 'untrusted_lecture_material': context}, ensure_ascii=False)
    try:
        quiz = GeneratedQuiz.model_validate_json(gemini.generate(prompt, schema=GeneratedQuiz))
        if len(quiz.questions) != request.count or len({q.question.casefold() for q in quiz.questions}) != request.count:
            raise ValueError('Incomplete or duplicate questions')
        if any(q.source_page is not None and q.source_page > document.page_count for q in quiz.questions):
            raise ValueError('Invalid page reference')
        return quiz.questions
    except (ValidationError, ValueError):
        raise AppError('Gemini returned an incomplete or invalid quiz. Try again with a broader topic or fewer questions.', 502) from None
