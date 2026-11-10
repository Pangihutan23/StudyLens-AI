from unittest.mock import MagicMock

import httpx
import pytest
from google.genai import errors

from app.config import settings
from app.services.gemini_service import GeminiService
from app.utils.errors import AppError


def test_sdk_client_configuration(monkeypatch):
    monkeypatch.setattr(settings, 'api_key', 'not-a-real-api-key')
    # Client construction validates SDK options without sending a network request.
    with GeminiService()._client() as client:
        assert client is not None


@pytest.mark.parametrize('code,status', [(429,429),(503,503),(403,502),(404,502)])
def test_api_errors_and_retry_budget(monkeypatch, code, status):
    service = GeminiService()
    context = MagicMock()
    monkeypatch.setattr(service, '_client', lambda: context)
    monkeypatch.setattr('app.services.gemini_service.time.sleep', lambda _: None)
    calls = []
    def action(client):
        calls.append(1)
        raise errors.APIError(code, {'error': {'message': 'provider detail that should not be exposed'}})
    with pytest.raises(AppError) as exc:
        service._call(action)
    assert exc.value.status == status
    assert 'provider detail' not in exc.value.message
    assert len(calls) == (3 if code in (429,503) else 1)


def test_network_timeout_retry(monkeypatch):
    service = GeminiService()
    monkeypatch.setattr(service, '_client', lambda: MagicMock())
    monkeypatch.setattr('app.services.gemini_service.time.sleep', lambda _: None)
    calls=[]
    def action(_):
        calls.append(1)
        raise httpx.ReadTimeout('internal connection data')
    with pytest.raises(AppError) as exc:
        service._call(action)
    assert exc.value.status == 504 and len(calls) == 3


def test_generation_schema_and_gemini3_options(monkeypatch):
    from app.schemas import GeneratedQuiz
    service = GeminiService()
    client = MagicMock()
    client.models.generate_content.return_value.text = '{"questions": []}'
    monkeypatch.setattr(settings, 'model', 'gemini-3.8-flash')
    monkeypatch.setattr(service, '_call', lambda action: action(client))
    assert service.generate('Test prompt', schema=GeneratedQuiz) == '{"questions": []}'
    config = client.models.generate_content.call_args.kwargs['config']
    assert config.response_mime_type == 'application/json'
    assert str(config.thinking_config.thinking_level).lower().endswith('low')
    assert config.temperature is None
