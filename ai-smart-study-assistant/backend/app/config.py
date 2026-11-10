import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / '.env')


class Settings:
    api_key = os.getenv('GEMINI_API_KEY', '').strip()
    model = os.getenv('GEMINI_MODEL', 'gemini-3.8-flash').strip()
    embedding_model = os.getenv('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001').strip()
    dimensions = int(os.getenv('GEMINI_EMBEDDING_DIMENSIONS', '768'))
    database_url = os.getenv('DATABASE_URL', f'sqlite:///{BASE_DIR / "study_assistant.db"}')
    origins = [s.strip() for s in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if s.strip()]
    storage = Path(os.getenv('STORAGE_DIR', str(BASE_DIR / 'storage'))).resolve()
    max_bytes = int(os.getenv('MAX_UPLOAD_MB', '25')) * 1024 * 1024
    timeout = int(os.getenv('AI_TIMEOUT_SECONDS', '60'))

    def __init__(self):
        if self.dimensions not in (768, 1536, 3072):
            raise ValueError('Embedding dimensions must be 768, 1536 or 3072.')
        if not self.model or not self.embedding_model or self.timeout < 1 or self.max_bytes < 1:
            raise ValueError('Invalid AI or upload configuration.')
        for folder in ('uploads', 'vectorstore'):
            (self.storage / folder).mkdir(parents=True, exist_ok=True)


settings = Settings()
