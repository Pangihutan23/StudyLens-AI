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

## Landing header update

- Preserved landing layout, content, fonts and backend functionality while updating navigation pills, header blur, Launch App gradient and the upper-page blue atmosphere.
- Active navigation follows section links, manual scrolling and browser history; mobile Escape closes the menu and restores focus to its toggle.
- Production build passed. **10 landing header and motion checks passed** across desktop and phone viewports, including tablet spacing and keyboard navigation.
- Desktop and mobile previews are saved as `qa/header-desktop.png`, `qa/header-mobile.png`, and a clean desktop view at `qa/header-preview.png`.
- Verification used the frontend only. The temporary frontend server was stopped afterward.

## Global neon design update

- Centralized all frontend colors: neon white `#F5FAFF`, electric blue `#58A6FF`, and the requested dark surfaces. Old text shades and component color literals were removed; charts, Markdown, dialogs, statuses and form states share the new tokens.
- Added `npm run audit:theme`, also run by the production build. The audit checks canonical values, missing/invalid token references and component color overrides.
- **16 frontend browser tests passed**, including every page, populated chat/summary views, quiz play/review, document dialogs, keyboard navigation, mobile responsiveness and existing AI interaction rendering. Browser API fixtures are confined to tests; no backend or Gemini generation code was changed.
- Screenshots in `qa/neon/` were visually reviewed across the landing page, dashboard, documents, chat, summaries, quiz, results, history and settings. Populated screens use explicitly isolated test data.
- The landing header is a neon-white outlined capsule, and Launch App is transparent bold white text. Shared primary actions keep white text readable on dark surfaces with blue borders/glow.
- Final production build and theme audit passed without CSS warnings. Four focused all-page theme checks passed again after the last decorative-icon and disabled-input adjustments.
- The final landing viewport is `qa/neon-preview.png`. The temporary frontend preview server was stopped after verification; no backend server was started for this update.
