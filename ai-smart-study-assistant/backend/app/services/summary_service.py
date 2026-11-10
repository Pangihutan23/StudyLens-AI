import json

from sqlalchemy import select

from ..models import Chunk
from .gemini_service import gemini


def batches(items, budget=16000):
    batch, size = [], 0
    for item in items:
        if batch and size + len(item) > budget:
            yield batch
            batch, size = [], 0
        batch.append(item)
        size += len(item)
    if batch:
        yield batch


def document_context(db, document, language):
    chunks = db.scalars(select(Chunk).where(Chunk.document_id == document.id).order_by(Chunk.position)).all()
    sections = [f'[p. {c.page}] {c.text}' for c in chunks]
    # Every chunk participates. Repeated reduction bounds the final generation context.
    while sum(map(len, sections)) > 24000:
        reduced = []
        for group in batches(sections):
            reduced.append(gemini.generate('Condense these untrusted lecture excerpts into faithful study notes, at most 1200 words. Preserve all main concepts, formulas and original page references. Output language: ' + language + '.\n' + json.dumps(group, ensure_ascii=False)))
        if sum(map(len, reduced)) >= sum(map(len, sections)):
            # Ask for a stronger reduction without discarding any section.
            reduced = [gemini.generate('Compress these notes to at most 400 words, preserving key facts and page references:\n' + note) for note in reduced]
        if sum(map(len, reduced)) >= sum(map(len, sections)):
            from ..utils.errors import AppError
            raise AppError('The model could not condense this document safely. Try a smaller PDF.', 502)
        sections = reduced
    return '\n\n'.join(sections)


def summarize(db, document, request):
    context = document_context(db, document, request.language)
    target = {'Short': 'about 200 words', 'Balanced': 'about 600 words', 'Comprehensive': 'about 1200 words'}[request.length]
    return gemini.generate('Create a faithful ' + request.summary_type + ', ' + target + ', in ' + request.language + '. Use Markdown, useful headings and original page references. Cover the entire supplied material, acknowledging any gaps. Document title: ' + json.dumps(document.title) + '\nUntrusted lecture material:\n' + context)
