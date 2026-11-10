// Browser-only data for design verification. No production API or personal data is changed.
export const ids = {
  document: "2a36510c-9798-4a8f-b989-9a4a0aba7900",
  session: "b931fa69-b780-4c60-99a3-d8629a31e001",
  summary: "c931fa69-b780-4c60-99a3-d8629a31e002",
  quiz: "d931fa69-b780-4c60-99a3-d8629a31e003",
  attempt: "e931fa69-b780-4c60-99a3-d8629a31e004",
};
export async function themeFixtures(page) {
  const created_at = "2026-11-10T00:00:00Z";
  const document = {
    id: ids.document,
    title: "Learning foundations.pdf",
    size: 245760,
    page_count: 12,
    status: "ready",
    created_at,
  };
  const session = {
    id: ids.session,
    title: "Explain the central idea",
    document_ids: [ids.document],
    created_at,
  };
  const summary = {
    id: ids.summary,
    document_id: ids.document,
    document_title: document.title,
    summary_type: "Structured Study Notes",
    language: "English",
    created_at,
    content:
      "## Learning foundations\nLearning connects new ideas with existing knowledge.\n\n### Key ideas\n- Recall helps identify gaps.\n- Practice makes those gaps easier to address.\n\n> Review the source before drawing conclusions.\n\n```text\nRead → Recall → Review\n```\n\n| Concept | Purpose |\n| --- | --- |\n| Recall | Check understanding |\n\n[Further reading](https://example.com)",
  };
  const source = {
    document_id: ids.document,
    document_title: document.title,
    page: 3,
  };
  const messages = [
    {
      id: "theme-user",
      role: "user",
      content: "Explain the central idea.",
      sources: [],
    },
    {
      id: "theme-assistant",
      role: "assistant",
      content:
        "## Make ideas meaningful\nConnect new information with what you already know, then use practice to check your understanding. [Learning foundations.pdf, p. 3]\n\n- Explain an idea in your own words.\n- Revisit the parts that remain unclear.",
      sources: [source],
    },
  ];
  const questions = Array.from({ length: 5 }, (_, index) => ({
    id: `theme-question-${index}`,
    question: `Which activity helps check understanding? ${index + 1}`,
    options: [
      "Recall an idea in your own words",
      "Skip all practice",
      "Avoid reviewing gaps",
      "Read without reflection",
    ],
  }));
  const quiz = {
    id: ids.quiz,
    title: "Learning foundations practice",
    document_id: ids.document,
    document_title: document.title,
    difficulty: "Medium",
    created_at,
    questions,
  };
  const attempt = {
    id: ids.attempt,
    quiz_id: ids.quiz,
    title: quiz.title,
    document_title: document.title,
    percentage: 80,
    score: 4,
    total: 5,
    created_at,
    questions: questions.map((q, i) => ({
      ...q,
      correct_answer: 0,
      selected_answer: i === 4 ? 1 : 0,
      correct: i !== 4,
      explanation:
        "Recall gives you a way to check your understanding and identify gaps.",
      source_page: 3,
    })),
  };
  const data = {
    "/health": {
      status: "ok",
      ai_configured: false,
      model: "Configured generation model",
      embedding_model: "gemini-embedding-001",
      embedding_dimensions: 768,
      max_upload_mb: 25,
    },
    "/documents": [document],
    "/chat/sessions": [session],
    [`/chat/sessions/${ids.session}`]: { ...session, messages },
    "/summaries": [summary],
    [`/summaries/${ids.summary}`]: summary,
    "/quizzes": [quiz],
    [`/quizzes/${ids.quiz}`]: quiz,
    "/quizzes/results": [
      { ...attempt, questions: undefined },
      {
        ...attempt,
        id: "previous-attempt",
        percentage: 60,
        score: 3,
        questions: undefined,
      },
    ],
    [`/quizzes/results/${ids.attempt}`]: attempt,
    "/dashboard/stats": {
      documents: 1,
      conversations: 1,
      summaries: 1,
      quizzes_completed: 2,
      average_score: 70,
    },
    "/dashboard/activity": [
      { id: ids.document, type: "document", title: document.title, created_at },
      { id: ids.session, type: "chat", title: session.title, created_at },
      { id: ids.summary, type: "summary", title: document.title, created_at },
      {
        id: ids.attempt,
        type: "attempt",
        title: quiz.title,
        percentage: 80,
        created_at,
      },
    ],
  };
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.slice(url.pathname.indexOf("/api") + 4);
    return Object.hasOwn(data, endpoint)
      ? route.fulfill({ json: { data: data[endpoint] } })
      : route.fulfill({
          status: 404,
          json: { error: { message: "No test fixture for this endpoint." } },
        });
  });
}
