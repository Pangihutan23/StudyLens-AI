# AI Smart Study Assistant

A personal learning workspace built with React/Vite and FastAPI. Upload lecture PDFs, ask grounded questions with page references, create study notes, and practice with Gemini-generated quizzes. The interface uses charcoal surfaces, consistent neon-white text (`#F5FAFF`) and electric-blue accents (`#58A6FF`), locally served Inter/Playfair Display/JetBrains Mono fonts, and responsive layouts.

This is a **single-user local application**, without authentication. Keep both servers bound to localhost. The application contains no sample documents, fabricated analytics, or fallback AI answers.

## Requirements

- Windows PowerShell and VS Code
- **Python 3.11+** (Python 3.12 is used in the tested environment)
- **Node.js 22.12+** and npm
- A Google Gemini API key with access to a generation model and `gemini-embedding-001`
- An internet connection for Gemini requests and initial dependency installation

On this computer, `python` resolves to an older MSYS installation. Use **`py -3.12`** to create the environment, and the explicit virtual-environment executable afterward. No PowerShell activation or execution-policy changes are required.

## Install on Windows

Open two terminals in VS Code. The project is at:

```text
D:\Folder Projek\Asisten Belajar\ai-smart-study-assistant
```

Backend setup (first terminal):

```powershell
cd 'D:\Folder Projek\Asisten Belajar\ai-smart-study-assistant\backend'
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock.txt
Copy-Item .env.example .env
```

`requirements.lock.txt` captures the tested Python environment. `requirements.txt` lists supported dependency ranges if installing on another platform requires resolution. The frontend includes `package-lock.json` for reproducible installation.

Edit **`backend/.env`** in VS Code:

```dotenv
GEMINI_API_KEY=your_real_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIMENSIONS=768
DATABASE_URL=sqlite:///./study_assistant.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_UPLOAD_MB=25
AI_TIMEOUT_SECONDS=60
```

Create a key in [Google AI Studio](https://aistudio.google.com/apikey). Choose a generation model available to your account using the [official model catalog](https://ai.google.dev/gemini-api/docs/models). The default is `gemini-3.5-flash-lite`: live checks on **12 November 2026** verified document-grounded chat and structured JSON with this workspace's key. The previously configured `gemini-3.8-flash` returned a provider response deadline error in a small generation check. Availability and latency vary by account and time. A model appearing in the catalog or the API model list does not guarantee successful generation: `gemini-2.5-flash` was listed but rejected generation for this key. Gemini 3 models use low thinking effort; generation temperature stays at the provider default. The implementation follows the official [Google Gen AI SDK](https://googleapis.github.io/python-genai/), [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), and [embedding documentation](https://ai.google.dev/gemini-api/docs/embeddings). Embeddings use retrieval-specific task types and explicit L2 normalization at 768 dimensions.

From the backend folder, list models without exposing your key:

```powershell
.\.venv\Scripts\python.exe scripts/check_gemini.py
```

Optionally verify generation access with small requests (consumes API quota):

```powershell
.\.venv\Scripts\python.exe scripts/check_gemini.py --probe gemini-3.5-flash-lite --probe gemini-3.1-flash-lite
```

After editing `.env`, restart the backend. Changing only `GEMINI_MODEL` does not require uploading existing documents again. Keep the embedding model and dimensions unchanged for existing indexes.

The dashboard and navigation work without an API key. PDF indexing and all AI features return a helpful setup error until a key is configured. There is no runtime mock mode. Settings reports whether a key is present, not whether live credentials have been verified.

Frontend setup (second terminal):

```powershell
cd 'D:\Folder Projek\Asisten Belajar\ai-smart-study-assistant\frontend'
npm ci
Copy-Item .env.example .env
```

The frontend environment contains only the backend URL:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api
```

**Never put a Gemini key in a `VITE_` variable.** These variables become public browser code. Existing `.env` files should be edited directly instead of copying over them.

## Start the application

Backend terminal:

```powershell
cd 'D:\Folder Projek\Asisten Belajar\ai-smart-study-assistant\backend'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend terminal:

```powershell
cd 'D:\Folder Projek\Asisten Belajar\ai-smart-study-assistant\frontend'
npm run dev
```

Open **http://localhost:5173**. API documentation is at **http://localhost:8000/docs**, with health at **http://localhost:8000/api/health**. Press `Ctrl+C` in each terminal to stop it. Restart FastAPI after changing backend environment variables and Vite after changing frontend variables.

## Using the workspace

1. Launch the app and open **My Documents**. Drop one or more PDFs into the upload area. Files upload in sequence; progress switches to processing while Gemini embeds the text.
2. Wait for **Ready to study**. Select PDFs as AI context, then open **AI Chat Assistant**. Choose up to 10 documents, set a language, and ask your question. Responses support Markdown, code blocks, copy/download, and retrieved document/page references. Saved conversations can be reopened or deleted.
3. Open **AI Summarizer**, select a document, choose one of five formats, detail level, and language. Copy/download Markdown or reopen saved summaries.
4. Open **Quiz Generator**. Choose 5/10/15/20 questions, difficulty, language, and optionally a topic. Navigate questions and select one answer each. Submit to see a Python-calculated score, answer review, explanations, and source pages. Skipped questions count as incorrect. Reopening a quiz starts a fresh attempt; saved attempts remain in **Learning History**.
5. Dashboard statistics and charts reflect actual persisted records. The activity feed shows the 40 latest learning events; quiz attempt history is available separately in full.

## Global design system

All pages share the canonical CSS variables in `frontend/src/index.css`: `--color-white`, `--color-neon-blue`, the four background tokens, `--border-neutral`, and shared white/blue glow tokens. Tailwind colors reference the same tokens. Components, Markdown, form states, chart labels, tooltips, source badges, quiz review and notifications all use this palette; surface transparency uses `color-mix` without dimming white text.

The landing header has a rounded capsule, a thin neon-white outline and backdrop blur. Navigation uses white text with blue active/hover states. Launch App stays transparent with bold white text. Primary workspace actions use dark surfaces and electric-blue borders/glow to preserve white-text contrast. Status meaning is conveyed through labels, icons and border styles.

Run `npm run audit:theme` from `frontend` to check the canonical palette, token references and component overrides. The production build runs this audit automatically. `tests/theme.spec.js` checks every page and generated content view on desktop/mobile using browser-only fixtures, and captures screenshots in `qa/neon/`. These fixtures do not change the real database or production AI responses.

## Interface motion

Framer Motion handles soft fade/slide entrances and page changes. The reusable `Reveal` component uses the native Intersection Observer API to show landing sections and workspace cards as they enter the viewport. Feature cards and study steps use short staggered delays. Each element reveals once and remains visible when you scroll back; keyboard focus also reveals its content.

CSS transitions provide card elevation, button feedback, moving link arrows, and smooth focus borders. Workspace cards and clickable feature cards use an opacity-only entrance so buttons stay in place during taps. Hover elevation is limited to devices with a precise pointer. The implementation honors `prefers-reduced-motion` and keeps content readable when Intersection Observer is unavailable. No additional animation dependency or backend configuration is needed.

Shared implementation: `frontend/src/components/common/Reveal.jsx`, `frontend/src/components/common/PageTransition.jsx`, `frontend/src/hooks/useIntersectionReveal.js`, and `frontend/src/index.css`. Adjust the entrance duration/distance in `Reveal.jsx`; CSS interaction transitions are near the end of `index.css`.

## Architecture and data

```text
frontend/src/
  components/common/     Shared UI, Markdown, modal, notifications
  components/layout/     Sidebar, navbar and application shell
  components/documents/  Document selection
  components/quiz/       Quiz player and scored review
  context/               Preferences and toast state
  hooks/                 Resource loading and refresh
  pages/                 Landing and every workspace page
  services/              Axios client and formatting
backend/app/
  config.py              Validated environment configuration
  database.py            SQLite connection, FK enforcement, WAL
  models/                Nine persisted SQLAlchemy tables
  schemas/               Pydantic requests and generated quiz validation
  routers/               REST APIs grouped by feature
  services/              PDF, Gemini, embeddings, RAG, summary and quiz logic
  utils/                 Safe errors and record serialization
backend/tests/           Offline service and endpoint tests
```

Uploads use UUID filenames; titles are display metadata only. PyMuPDF extracts text per page, cleans whitespace, and creates overlapping chunks with page references. Gemini generates embeddings in batches. Normalized vectors are stored in SQLite alongside chunks, and indexed in a per-document FAISS inner-product index. Each document records its embedding model and dimensions.

Retrieval searches only the selected documents and combines the strongest matches. A backend system instruction treats document text as untrusted and requires grounded answers. Retrieved sources are evidence supplied to the model; a retrieved page is not a guarantee that every generated claim is correct. Check original material when precision matters.

Long-document summaries process **all chunks** through hierarchical reduction and synthesis. Quiz generation uses the full or hierarchically reduced document, requests structured JSON, and validates the exact question count, option uniqueness, answer index, distinct questions, and page ranges. Answer keys and explanations are omitted from every pre-submission quiz API response. Semantic correctness still depends on the model; validation cannot prove a generated answer is academically correct.

SQLite stores documents, chunks, chat sessions/messages, summaries, quizzes/questions, and quiz attempts/answers. Files are in `backend/storage/uploads/` and `backend/storage/vectorstore/`. FAISS indices can be rebuilt from authoritative SQLite vectors after missing/corrupted files. Interrupted uploads become failed records on restart. Deletion removes a document and its chunks/vectors/files, while retaining summaries, conversations and quiz history with source-title snapshots. Derived orphan files are cleaned at startup.

Do not change the embedding model or dimensions for existing indexed documents without deleting and re-uploading them. Queries reject incompatible embeddings with a clear error. Back up the database and storage together while the server is stopped. Browser preferences (language and selected IDs) stay in localStorage; study data stays in SQLite.

## API

Successful responses have `{"data": ...}`. Errors have `{"error": {"message": "..."}}` with appropriate HTTP status codes. UUIDs and request fields are validated. See Swagger for complete schemas.

| Area      | Endpoints                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Documents | `POST /api/documents/upload` (multipart `file`), `GET /api/documents`, `GET /api/documents/{id}`, `DELETE /api/documents/{id}` |
| Chat      | `POST /api/chat`, `GET /api/chat/sessions`, `GET /api/chat/sessions/{id}`, `DELETE /api/chat/sessions/{id}`                    |
| Summaries | `POST /api/summaries/generate`, `GET /api/summaries`, `GET /api/summaries/{id}`                                                |
| Quizzes   | `POST /api/quizzes/generate`, `GET /api/quizzes`, `GET /api/quizzes/{id}`, `POST /api/quizzes/{id}/submit`                     |
| Results   | `GET /api/quizzes/results`, `GET /api/quizzes/results/{attempt_id}`                                                            |
| Dashboard | `GET /api/dashboard/stats`, `GET /api/dashboard/activity`                                                                      |
| Health    | `GET /api/health`                                                                                                              |

## Validation

Backend tests use temporary SQLite/storage and mock the Gemini service. They do not send documents or credentials to Google:

```powershell
cd 'D:\Folder Projek\Asisten Belajar\ai-smart-study-assistant\backend'
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend production build:

```powershell
cd 'D:\Folder Projek\Asisten Belajar\ai-smart-study-assistant\frontend'
npm run build
```

The built frontend is in `frontend/dist`. `npm run preview` serves that build locally, but does not start FastAPI. Add the preview origin to `CORS_ORIGINS` if using it for AI features.

Browser checks (keep the normal frontend and backend servers running in the other terminals):

```powershell
cd 'D:\Folder Projek\Asisten Belajar\ai-smart-study-assistant\frontend'
npx playwright install chromium
npm run test:e2e
```

Playwright checks every workspace route on desktop and a phone viewport, form states, navigation, language persistence, and horizontal overflow. AI interaction tests use **test-only intercepted API responses** to exercise context selection, citations, summary downloads, quiz navigation, and answer review. They do not replace the real application's backend or call Gemini. Screenshots are saved to `qa/`. The route checks read your real local backend and do not modify your documents/history. `STUDY_TEST_URL` can point the browser tests to another local frontend URL. `npm run format` formats frontend sources.

Automated tests cover PDF validation/extraction, embedding failure cleanup, real FAISS retrieval and index recovery, document selection, grounded prompt construction, summary section coverage, quiz schema rejection, hidden answer keys, scoring, cascading deletion, persistence across app startup, SDK client configuration, retry budgets, quota failures, timeouts, and empty-database statistics. Live Gemini generation and embedding require a real key and must be checked separately.

## Troubleshooting and current limits

- **Backend offline:** run the backend command from `backend`, then check `/api/health`. Verify the frontend API URL and exact allowed CORS origin.
- **Wrong Python / FAISS installation errors:** use 64-bit Python 3.12 via `py -3.12`. Do not use MSYS Python. Recreate `.venv` with the intended interpreter.
- **PowerShell blocks npm scripts:** use `npm.cmd ci` and `npm.cmd run dev` instead of changing system execution policy.
- **API key needed / model rejected:** set the key and available generation model in backend `.env`; restart the backend. Check Google AI Studio permissions and quota. Provider errors are sanitized so credentials are never exposed.
- **Gemini response deadline (504):** the provider did not finish before the configured deadline. Retry or choose a model verified by `scripts/check_gemini.py --probe MODEL`, then restart the backend. Increasing `AI_TIMEOUT_SECONDS` can allow longer requests but does not fix provider capacity problems.
- **429 quota errors:** wait for quota recovery or update your Google project limits. Transient failures retry at most three times with exponential backoff; repeated quota exhaustion remains an error.
- **Long requests:** each provider request has a configurable timeout. The browser waits up to 10 minutes per operation. Long PDFs require several AI calls and may cost more or outlast this browser timeout. Check saved history before retrying. Processing runs in the local API worker; there is no durable background-job queue or cancellation/resume UI in this version.
- **No readable text:** OCR is not included. Scanned, image-only, encrypted or corrupt PDFs are rejected with guidance. Documents with many unreadable pages are rejected rather than silently losing large sections. Diagrams/images and math rendered solely as images are not understood by the text pipeline. Small numbers of blank/title/image-only pages can be skipped.
- **Upload limits:** default 25 MB/file, maximum 500 pages and 2,000 chunks. Larger files must be split. Files are validated by extension, content type, PDF header and PyMuPDF parsing.
- **Failed upload:** a failure record remains visible so the cause is clear. Delete it and upload again after fixing the cause; failed embeddings never produce a ready document.
- **Port occupied:** stop the process already using 5173/8000 or explicitly adjust the ports and corresponding frontend/CORS environment values.
- **Single user:** no accounts, authorization, rate limiting, multi-tenant isolation, migrations, or hosted deployment are included. Use one local backend worker; perform schema upgrades with a migration before reusing an older database in a changed version.
- **Privacy:** files and history remain on disk, but extracted text is sent to Google for embeddings and AI generation. Treat local backups and `.env` as private. The `.gitignore` excludes keys, uploads, databases, vector indices, and environments.
