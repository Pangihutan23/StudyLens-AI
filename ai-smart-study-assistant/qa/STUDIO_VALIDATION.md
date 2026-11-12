# One-page studio verification — 12 November 2026

- Retains the original charcoal, white `#F5FAFF` and blue `#58A6FF` palette. No purple accent was introduced.
- `/` opens the study workspace directly. The separate landing page and Launch App entry point are removed.
- Chat, Summarize and Practice switch within the same page. The icon rail opens documents, learning history, dashboard and settings in that workspace.
- Existing `/app/...` bookmarks redirect with saved session, summary, quiz and attempt identifiers preserved.
- Previously visited tools stay mounted. Draft questions, settings and quiz state survive switching tools; a completed background request does not change the selected tool.
- Independent result parameters prevent summaries and quizzes from fetching each other's saved records. Internal links preserve results from other tools.
- Chat supports upload in place, document selection, language, questions, source references, saved chats and copying/downloading answers. Document mutations refresh the mounted selectors; a deleted document is removed from selection.
- The desktop source/answer panels are side by side. On mobile they stack vertically without overlap. Keyboard tabs support Left/Right, Home and End; focus outlines and reduced-motion preferences are retained.

## Checks

- `npm run build`: passes, including the shared palette audit.
- Playwright: **22 tests passed** across desktop and mobile. Coverage includes all tools, Markdown and chart colors, overflow, generated answers, summary download, quiz submission/review, keyboard navigation, browser history, legacy links, background completion and inline upload/delete synchronization.
- Screenshots inspected: desktop and mobile workspace, saved summaries, settings and all generated tool views. A legacy mobile positioning rule detected during visual inspection was corrected and covered by a panel overlap assertion.
- Screenshots use browser-only API fixtures, not personal documents or live Gemini responses. No backend, API key, personal database, uploaded file or FAISS index was changed for this UI work. No live generation requests were needed.

Main previews: [Desktop](studio-desktop.png), [Mobile](studio-mobile.png). Additional tool screenshots are in `studio/`.
