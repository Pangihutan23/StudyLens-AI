from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Input(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')


class ChatInput(Input):
    question: str = Field(min_length=1, max_length=6000)
    document_ids: list[UUID] = Field(min_length=1, max_length=10)
    session_id: UUID | None = None
    language: str = Field(default='English', min_length=2, max_length=50)


class SummaryInput(Input):
    document_id: UUID
    summary_type: Literal['Short Summary', 'Detailed Summary', 'Key Points', 'Structured Study Notes', 'Beginner-Friendly Explanation'] = 'Key Points'
    length: Literal['Short', 'Balanced', 'Comprehensive'] = 'Balanced'
    language: str = Field(default='English', min_length=2, max_length=50)


class QuizInput(Input):
    document_id: UUID
    count: Literal[5, 10, 15, 20] = 5
    difficulty: Literal['Easy', 'Medium', 'Hard'] = 'Medium'
    language: str = Field(default='English', min_length=2, max_length=50)
    topic: str = Field(default='', max_length=200)


class GeneratedQuestion(Input):
    question: str = Field(min_length=5, max_length=2000)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_answer: int = Field(ge=0, le=3, strict=True)
    explanation: str = Field(min_length=5, max_length=4000)
    source_page: int | None = Field(default=None, ge=1)

    @field_validator('options')
    @classmethod
    def distinct_options(cls, value):
        value = [s.strip() for s in value]
        if any(not s for s in value) or len({s.casefold() for s in value}) != 4:
            raise ValueError('Four distinct, nonempty options are required.')
        return value


class GeneratedQuiz(Input):
    questions: list[GeneratedQuestion] = Field(min_length=5, max_length=20)


class Submission(Input):
    answers: dict[UUID, int | None]

    @field_validator('answers')
    @classmethod
    def answer_range(cls, value):
        if any(v is not None and (type(v) is not int or v not in range(4)) for v in value.values()):
            raise ValueError('Answers must be option indices 0–3 or null.')
        return value
