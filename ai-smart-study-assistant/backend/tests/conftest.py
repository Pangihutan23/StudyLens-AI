import os
import tempfile
from pathlib import Path

# Tests never touch the personal database or call the live Gemini API.
test_root = tempfile.TemporaryDirectory(prefix='smart-study-tests-')
os.environ['DATABASE_URL'] = f'sqlite:///{Path(test_root.name) / "tests.db"}'
os.environ['STORAGE_DIR'] = str(Path(test_root.name) / 'storage')
os.environ['GEMINI_API_KEY'] = ''

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture
def client():
    Base.metadata.drop_all(engine)
    with TestClient(app) as client:
        yield client


@pytest.fixture
def mock_ai(monkeypatch):
    from app.config import settings
    from app.services.gemini_service import gemini

    def embed(texts, query=False):
        # Simple deterministic vectors, used only in automated tests.
        return [[1.0 if i == 0 else (0.5 if 'biology' in text.lower() and i == 1 else 0.0) for i in range(settings.dimensions)] for text in texts]
    monkeypatch.setattr(gemini, 'embed', embed)
    monkeypatch.setattr(gemini, 'generate', lambda prompt, schema=None: '## Key ideas\nBiology studies living organisms. [Lecture.pdf, p. 1]')
    return gemini
