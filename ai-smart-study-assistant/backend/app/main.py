from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from starlette.exceptions import HTTPException

from .config import settings
from .database import Base, SessionLocal, engine
from .models import Document
from .routers import chat, dashboard, documents, quizzes, summaries
from .utils.errors import AppError


@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        for doc in db.scalars(select(Document).where(Document.status == 'processing')):
            doc.status, doc.error = 'error', 'Processing was interrupted by a server restart. Delete and upload this file again.'
        db.commit()
        identifiers = set(db.scalars(select(Document.id)).all())
        for folder in ('uploads', 'vectorstore'):
            for path in (settings.storage / folder).iterdir():
                if path.is_file() and path.stem not in identifiers:
                    path.unlink(missing_ok=True)
    yield
    engine.dispose()


app = FastAPI(title='AI Smart Study Assistant', version='1.0.0', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_methods=['GET', 'POST', 'DELETE'], allow_headers=['Content-Type'], allow_credentials=False)


@app.exception_handler(AppError)
async def app_error(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status, content={'error': {'message': exc.message}})


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc):
    fields = ['.'.join(map(str, e['loc'][1:])) for e in exc.errors()]
    return JSONResponse(status_code=422, content={'error': {'message': 'Please check the request fields: ' + ', '.join(fields)}})


@app.exception_handler(HTTPException)
async def http_error(request, exc):
    return JSONResponse(status_code=exc.status_code, content={'error': {'message': str(exc.detail)}})


@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    return JSONResponse(status_code=500, content={'error': {'message': 'An unexpected server error occurred. Please try again.'}})


@app.get('/api/health', tags=['Health'])
def health():
    return {'data': {'status': 'ok', 'ai_configured': bool(settings.api_key and settings.api_key != 'your_api_key_here'), 'model': settings.model, 'embedding_model': settings.embedding_model, 'embedding_dimensions': settings.dimensions, 'max_upload_mb': settings.max_bytes // 1024 // 1024}}


for router in (documents.router, chat.router, summaries.router, quizzes.router, dashboard.router):
    app.include_router(router)
