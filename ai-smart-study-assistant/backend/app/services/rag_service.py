import json

from .embedding_service import search
from .gemini_service import gemini


def answer_question(db, documents, question, language, history):
    # Recent history helps resolve follow-ups, but stays outside trusted system instructions.
    recent = [{'role': m.role, 'content': m.content[-3000:]} for m in history[-8:]]
    retrieval_query = question
    previous_questions = [m['content'] for m in recent if m['role'] == 'user']
    if previous_questions:
        retrieval_query = previous_questions[-1] + '\nFollow-up: ' + question
    matches = search(db, documents, retrieval_query)
    context = [{'document': m['document_title'], 'page': m['page'], 'excerpt': m['text']} for m in matches]
    prompt = 'Answer the question using only these retrieved excerpts. Cite [document title, p. N]. '
    prompt += 'If the excerpts do not contain the answer, say so. Reply in ' + language + '.\n'
    prompt += json.dumps({'question': question, 'conversation_history': recent, 'untrusted_document_excerpts': context}, ensure_ascii=False)
    content = gemini.generate(prompt)
    sources = []
    for match in matches:
        source = {k: match[k] for k in ('document_id', 'document_title', 'page')}
        if source not in sources:
            sources.append(source)
    return content, sources
