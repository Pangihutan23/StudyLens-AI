# Validation record

Checked on 10 November 2026 on Windows, using Python 3.12 and Node 22.12.

- Backend: **24 tests passed**, with a dependency deprecation warning about Starlette's httpx test-client adapter. Tests use isolated temporary storage and mock Gemini; actual PyMuPDF extraction, SQLite transactions and FAISS indexing/retrieval are exercised.
- Frontend: **production build passed**, with lazy-loaded routes, Markdown renderer and analytics. No bundle-size warning remains.
- Browser: **4 Playwright tests passed** in Chromium, covering desktop and phone layouts. All workspace pages were navigated against the running local backend. AI interaction rendering, summary download and quiz review use test-only intercepted responses. No real study records were added by these browser tests.
- Local frontend returned HTTP 200 at port 5173, and the backend health endpoint responded at port 8000.
- Screenshots of landing, dashboard and chat were captured for both viewport sizes and visually reviewed.
- The official Google model documentation was checked; `gemini-3.8-flash` is the configurable generation default, with `gemini-embedding-001` at 768 dimensions for embeddings.

**Live Gemini generation and embedding have not been tested.** No Gemini key was provided. Configure `backend/.env`, restart FastAPI, and upload a text PDF to verify real model access and quota for your account. No hosted deployment was requested or performed.

See the project README for commands, architecture and known local-version limits. QA servers are stopped after verification; use the documented commands to start them again.

## Interface motion update

- Production frontend build passed after adding shared scroll reveals and page entrances.
- **10 browser tests passed** across desktop and phone viewports, including one-time scroll reveals, reduced motion, and the Intersection Observer fallback, plus the existing workspace and AI rendering flows.
- Workspace and clickable feature cards fade without positional movement, keeping touch targets stable during their entrance. Informational sections retain a short upward entrance; hover effects use CSS transitions.
- Screenshots were refreshed, with a landing preview at `qa/motion-preview.png`.
- This update reused the user's existing local servers and left them running. Backend logic and live Gemini access were not part of this UI verification.
