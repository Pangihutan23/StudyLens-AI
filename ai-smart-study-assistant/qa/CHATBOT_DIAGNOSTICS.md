# Chatbot diagnostics — 12 November 2026

## Findings

- The existing upload `1.-diabetes-24-04-19.pdf` is ready: 23 pages, 21 indexed chunks, 768-dimensional `gemini-embedding-001` vectors, and an existing FAISS index.
- Backend port 8000 and frontend port 5173 are reachable. The API key is configured; its value is never included in these reports.
- Listing models and embedding a retrieval query both succeeded.
- A small generation request to the previously configured `gemini-3.8-flash` failed with provider HTTP 504 `DEADLINE_EXCEEDED`. This demonstrates a response deadline problem during the check; it does not establish permanent model unavailability.

## Live generation checks

| Model | Result in this workspace |
| --- | --- |
| `gemini-3.5-flash-lite` | Short generation succeeded in 7.3 seconds. RAG with the existing PDF succeeded in 4.8 seconds. Structured JSON succeeded. |
| `gemini-3.1-flash-lite` | Short generation succeeded in 5.2 seconds. |
| `gemini-3.8-flash` | Short generation failed with HTTP 504. |
| `gemini-2.5-flash` | Listed by the API, but generation returned HTTP 404 and said the model is no longer available to new users. |

The complete model listing is in [gemini-models.txt](gemini-models.txt). Listed methods describe the catalog; successful requests still depend on access, quota, configuration and service availability. Image, audio, live and embedding models serve different purposes from this app's text generation.

## Changes and verification

- Set the local `GEMINI_MODEL` to `gemini-3.5-flash-lite`; preserved the API key, embedding model, embedding dimensions and original document/index. Updated the default, example and setup instructions accordingly.
- Provider deadline errors now return an actionable 504 message. Missing models point to the local model checking tool.
- Added `backend/scripts/check_gemini.py` to list models and optionally probe generation. It does not print credentials, raw provider errors or generated document content.
- The existing backend reloaded and `/api/health` confirmed the new model.
- Live `POST /api/chat` succeeded with HTTP 200 in 4.9 seconds. The answer was in Bahasa Indonesia, grounded in the uploaded PDF, with 8 retrieved source references. A follow-up GET confirmed both messages were persisted. Only the newly created diagnostic conversation was then removed.
- Backend regression suite: **25 passed**, with one existing Starlette/httpx deprecation warning. Tests use temporary storage and do not access the personal database or live API.

No frontend change or document re-upload was needed. Performance measurements are individual observations, not ongoing guarantees.
