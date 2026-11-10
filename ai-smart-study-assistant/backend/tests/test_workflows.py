import json
from uuid import uuid4

import pymupdf
import pytest
from sqlalchemy import func, select

from app.config import settings
from app.database import SessionLocal
from app.models import Chunk, Document, QuizAnswer
from app.services.embedding_service import index_path
from app.utils.errors import AppError


def pdf_bytes(text='Biology studies living organisms. Cells are the basic units of life. Photosynthesis converts light energy to chemical energy.'):
    with pymupdf.open() as pdf:
        page = pdf.new_page()
        if text:
            page.insert_text((72, 72), text)
        return pdf.tobytes()


def upload(client, name='Lecture.pdf', text=None):
    response = client.post('/api/documents/upload', files={'file': (name, pdf_bytes() if text is None else pdf_bytes(text), 'application/pdf')})
    assert response.status_code == 201, response.text
    return response.json()['data']


def question_set():
    return {'questions': [{'question': f'Which statement about cells is correct? Question {i + 1}', 'options': ['Cells are basic units of life', 'Cells are rocks', 'Cells are light', 'Cells are not living'], 'correct_answer': 0, 'explanation': 'The lecture identifies cells as the basic units of life.', 'source_page': 1} for i in range(5)]}


def test_full_learning_workflow_and_real_stats(client, mock_ai, monkeypatch):
    assert client.get('/api/dashboard/stats').json()['data']['documents'] == 0
    doc = upload(client)
    assert doc['status'] == 'ready' and doc['page_count'] == 1
    assert index_path(doc['id']).exists()
    chat = client.post('/api/chat', json={'question': 'What are cells?', 'document_ids': [doc['id']]}).json()['data']
    assert chat['messages'][1]['sources'][0]['page'] == 1
    assert chat['messages'][1]['sources'][0]['document_id'] == doc['id']
    session_id = chat['session']['id']
    assert len(client.get(f'/api/chat/sessions/{session_id}').json()['data']['messages']) == 2
    response = client.post('/api/summaries/generate', json={'document_id': doc['id']})
    assert response.status_code == 201
    summary_id = response.json()['data']['id']
    assert 'Biology' in client.get(f'/api/summaries/{summary_id}').json()['data']['content']
    monkeypatch.setattr(mock_ai, 'generate', lambda *a, **k: json.dumps(question_set()))
    quiz_response = client.post('/api/quizzes/generate', json={'document_id': doc['id']})
    assert quiz_response.status_code == 201, quiz_response.text
    quiz = quiz_response.json()['data']
    assert len(quiz['questions']) == 5
    assert all('correct_answer' not in q and 'explanation' not in q for q in quiz['questions'])
    fetched = client.get(f'/api/quizzes/{quiz["id"]}').json()['data']
    assert 'correct_answer' not in fetched['questions'][0]
    answers = {q['id']: (0 if i < 3 else 1) for i, q in enumerate(quiz['questions'])}
    result = client.post(f'/api/quizzes/{quiz["id"]}/submit', json={'answers': answers})
    assert result.status_code == 201, result.text
    result = result.json()['data']
    assert (result['score'], result['percentage']) == (3, 60.0)
    assert result['questions'][0]['correct_answer'] == 0
    assert client.get(f'/api/quizzes/results/{result["id"]}').json()['data']['score'] == 3
    stats = client.get('/api/dashboard/stats').json()['data']
    assert stats == {'documents': 1, 'conversations': 1, 'summaries': 1, 'quizzes_completed': 1, 'average_score': 60.0}
    assert len(client.get('/api/dashboard/activity').json()['data']) == 5
    # Delete removes vectors and text, while preserving useful study artifacts.
    assert client.delete(f'/api/documents/{doc["id"]}').status_code == 200
    assert not index_path(doc['id']).exists()
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Chunk)) == 0
        assert db.scalar(select(func.count()).select_from(QuizAnswer)) == 5
    assert client.get(f'/api/summaries/{summary_id}').json()['data']['document_id'] is None
    assert client.get(f'/api/quizzes/{quiz["id"]}').status_code == 200
    assert client.delete(f'/api/chat/sessions/{session_id}').status_code == 200
    assert client.get(f'/api/chat/sessions/{session_id}').status_code == 404


def test_failed_embeddings_never_mark_ready(client, mock_ai, monkeypatch):
    def fail(*a, **k):
        raise AppError('Gemini quota exhausted.', 429)
    monkeypatch.setattr(mock_ai, 'embed', fail)
    response = client.post('/api/documents/upload', files={'file': ('test.pdf', pdf_bytes(), 'application/pdf')})
    assert response.status_code == 429
    doc = client.get('/api/documents').json()['data'][0]
    assert doc['status'] == 'error' and 'quota' in doc['error']
    assert not index_path(doc['id']).exists()
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Chunk)) == 0


@pytest.mark.parametrize('name,content,mime,status', [('test.exe', b'%PDF-fake', 'application/pdf', 415), ('test.pdf', b'not a PDF', 'application/pdf', 415), ('test.pdf', b'%PDF-broken', 'application/pdf', 422), ('test.pdf', b'', 'application/pdf', 422)])
def test_reject_invalid_uploads(client, name, content, mime, status):
    response = client.post('/api/documents/upload', files={'file': (name, content, mime)})
    assert response.status_code == status
    assert 'error' in response.json()


def test_scanned_pdf_and_size_limit(client, monkeypatch):
    response = client.post('/api/documents/upload', files={'file': ('scan.pdf', pdf_bytes(''), 'application/pdf')})
    assert response.status_code == 422 and 'OCR' in response.json()['error']['message']
    monkeypatch.setattr(settings, 'max_bytes', 8)
    assert client.post('/api/documents/upload', files={'file': ('large.pdf', pdf_bytes(), 'application/pdf')}).status_code == 413


def test_selected_documents_and_missing_index_recovery(client, mock_ai, monkeypatch):
    first, second = upload(client, 'First.pdf'), upload(client, 'Second.pdf')
    index_path(second['id']).unlink()
    captured = []
    monkeypatch.setattr(mock_ai, 'generate', lambda prompt, **k: captured.append(prompt) or 'Grounded answer')
    response = client.post('/api/chat', json={'question': 'Explain cells', 'document_ids': [second['id']]})
    assert response.status_code == 200
    assert all(s['document_id'] == second['id'] for s in response.json()['data']['messages'][1]['sources'])
    assert 'First.pdf' not in captured[0] and 'Second.pdf' in captured[0]
    assert index_path(second['id']).exists()
    monkeypatch.setattr(settings, 'dimensions', 1536)
    assert client.post('/api/chat', json={'question': 'Explain cells', 'document_ids': [first['id']]}).status_code == 409


@pytest.mark.parametrize('kind', ['incomplete', 'duplicate-options', 'bad-page', 'malformed', 'duplicate-question'])
def test_reject_invalid_generated_quizzes(client, mock_ai, monkeypatch, kind):
    doc = upload(client)
    data = question_set()
    if kind == 'incomplete':
        data['questions'].pop()
    elif kind == 'duplicate-options':
        data['questions'][0]['options'] = ['same'] * 4
    elif kind == 'bad-page':
        data['questions'][0]['source_page'] = 900
    elif kind == 'duplicate-question':
        data['questions'][1]['question'] = data['questions'][0]['question']
    monkeypatch.setattr(mock_ai, 'generate', lambda *a, **k: 'not json' if kind == 'malformed' else json.dumps(data))
    assert client.post('/api/quizzes/generate', json={'document_id': doc['id']}).status_code == 502
    assert client.get('/api/quizzes').json()['data'] == []


def test_invalid_requests_and_no_key(client):
    assert client.get('/api/health').json()['data']['ai_configured'] is False
    assert client.post('/api/chat', json={'question': ' ', 'document_ids': []}).status_code == 422
    assert client.get('/api/documents/not-a-uuid').status_code == 422
    assert client.get(f'/api/documents/{uuid4()}').status_code == 404
    assert client.post('/api/documents/upload', files={'file': ('lecture.pdf', pdf_bytes(), 'application/pdf')}).status_code == 503


def test_long_document_summary_covers_last_page(client, mock_ai, monkeypatch):
    doc = upload(client)
    with SessionLocal() as db:
        for i in range(25):
            db.add(Chunk(document_id=doc['id'], page=i + 2, position=i + 1, text=f'SECTION_{i} ' + 'lecture content ' * 100, embedding=b''))
        db.commit()
    calls = []
    def generate(prompt, **kwargs):
        calls.append(prompt)
        return 'Condensed faithful notes with original page references.'
    monkeypatch.setattr(mock_ai, 'generate', generate)
    assert client.post('/api/summaries/generate', json={'document_id': doc['id']}).status_code == 201
    assert len(calls) > 2
    assert any('SECTION_24' in call for call in calls[:-1])


def test_pdf_path_safety_and_restart_persistence(client, mock_ai):
    doc = upload(client, '../../Unsafe.pdf')
    assert doc['title'] == 'Unsafe.pdf'
    assert (settings.storage / 'uploads' / f'{doc["id"]}.pdf').exists()
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app) as restarted:
        assert restarted.get(f'/api/documents/{doc["id"]}').json()['data']['status'] == 'ready'


def test_incomplete_submission_rejected(client, mock_ai, monkeypatch):
    doc = upload(client)
    monkeypatch.setattr(mock_ai, 'generate', lambda *a, **k: json.dumps(question_set()))
    quiz = client.post('/api/quizzes/generate', json={'document_id': doc['id']}).json()['data']
    assert client.post(f'/api/quizzes/{quiz["id"]}/submit', json={'answers': {}}).status_code == 422
    assert client.get('/api/quizzes/results').json()['data'] == []
