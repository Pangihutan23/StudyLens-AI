import { test, expect } from "@playwright/test";
import { themeFixtures } from "./helpers/themeFixtures";
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
}
test("all study tools share one responsive workspace", async ({ page }) => {
  await themeFixtures(page);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Workspace tools" });
  for (const [label, title] of [
    ["My Documents", "My documents"],
    ["AI Summarizer", "Intelligent summaries"],
    ["Quiz Generator", "Practice with purpose"],
    ["Learning History", "Your learning story"],
    ["Dashboard", "Welcome to your study space."],
    ["Settings", "Workspace settings"],
  ]) {
    await nav.getByRole("button", { name: label, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/");
    await noOverflow(page);
  }
  await page
    .getByLabel("Output language")
    .last()
    .selectOption("Bahasa Indonesia");
  await page.reload();
  await expect(page.getByLabel("Output language")).toHaveValue(
    "Bahasa Indonesia",
  );
  expect(errors).toEqual([]);
});

// UI-only fixtures exercise generated content safely; production has no mock mode.
test("AI chat, summary download and quiz answer review with test-only API fixtures", async ({
  page,
}) => {
  const doc = {
    id: "0b0c7fa8-2de6-4b00-8912-e94f8d617b36",
    title: "Biology lecture.pdf",
    page_count: 12,
    size: 64000,
    status: "ready",
    created_at: "2026-11-10T00:00:00Z",
  };
  const session = {
    id: "e8565db0-b386-4893-82a4-566606636562",
    title: "What are cells?",
    document_ids: [doc.id],
  };
  const messages = [
    { id: "user-1", role: "user", content: "What are cells?", sources: [] },
    {
      id: "assistant-1",
      role: "assistant",
      content:
        "## Cells\nCells are the basic units of life. [Biology lecture.pdf, p. 2]",
      sources: [{ document_id: doc.id, document_title: doc.title, page: 2 }],
    },
  ];
  const summary = {
    id: "summary-test",
    document_id: doc.id,
    document_title: doc.title,
    summary_type: "Key Points",
    language: "English",
    created_at: doc.created_at,
    content:
      "## Key ideas\n- Cells are the basic units of life.\n- Cell membranes regulate transport.",
  };
  const questions = Array.from({ length: 5 }, (_, i) => ({
    id: `q-${i}`,
    question: `Which statement about cells is correct? ${i + 1}`,
    options: [
      "Cells are basic units of life",
      "Cells are rocks",
      "Cells are light",
      "Cells cannot divide",
    ],
  }));
  const quiz = {
    id: "quiz-test",
    title: "Biology practice",
    difficulty: "Medium",
    questions,
  };
  const result = {
    id: "attempt-test",
    title: quiz.title,
    percentage: 100,
    score: 5,
    total: 5,
    questions: questions.map((q) => ({
      ...q,
      selected_answer: 0,
      correct_answer: 0,
      correct: true,
      explanation: "The lecture describes cells as the basic units of life.",
      source_page: 2,
    })),
  };
  const fulfill = (route, data) => route.fulfill({ json: { data } });
  await page.route("**/api/documents", (route) => fulfill(route, [doc]));
  await page.route("**/api/chat/sessions", (route) => fulfill(route, []));
  await page.route(`**/api/chat/sessions/${session.id}`, (route) =>
    fulfill(route, { ...session, messages }),
  );
  await page.route("**/api/chat", (route) =>
    fulfill(route, { session, messages }),
  );
  await page.route("**/api/summaries", (route) => fulfill(route, []));
  await page.route("**/api/summaries/generate", (route) =>
    fulfill(route, summary),
  );
  await page.route("**/api/summaries/summary-test", (route) =>
    fulfill(route, summary),
  );
  await page.route("**/api/quizzes", (route) => fulfill(route, []));
  await page.route("**/api/quizzes/generate", (route) => fulfill(route, quiz));
  await page.route("**/api/quizzes/quiz-test", (route) => fulfill(route, quiz));
  await page.route("**/api/quizzes/quiz-test/submit", (route) =>
    fulfill(route, result),
  );
  await page.route("**/api/quizzes/results/attempt-test", (route) =>
    fulfill(route, result),
  );
  await page.goto("/app/chat");
  await expect(
    page.getByRole("heading", { name: "Your study material", exact: true }),
  ).toBeVisible();
  const contextButton = page.getByRole("button", {
    name: "Context",
    exact: true,
  });
  if (await contextButton.isVisible()) await contextButton.click();
  await page
    .getByRole("checkbox", { name: `Use ${doc.title} as AI context` })
    .check();
  if (await contextButton.isVisible()) await contextButton.click();
  await page
    .getByRole("textbox", { name: "Your question" })
    .fill("What are cells?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(
    page.getByRole("heading", { name: "Cells", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Biology lecture.pdf · p. 2", { exact: true }),
  ).toBeVisible();
  await page.goto("/app/summaries");
  await page.getByLabel("Source document").selectOption(doc.id);
  await page.getByRole("button", { name: "Generate summary" }).click();
  await expect(
    page.getByRole("heading", { name: "Key ideas", exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("study-notes.md");
  await page.goto("/app/quizzes");
  await page.getByLabel("Source document").selectOption(doc.id);
  await page.getByRole("button", { name: "Generate practice quiz" }).click();
  await expect(page.getByText("Why this answer?", { exact: true })).toHaveCount(
    0,
  );
  for (let i = 0; i < 5; i++) {
    await expect(
      page.getByRole("heading", { name: questions[i].question, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("radio", {
        name: "A Cells are basic units of life",
        exact: true,
      })
      .check();
    if (i < 4)
      await page.getByRole("button", { name: "Next question" }).click();
  }
  await page.getByRole("button", { name: "Submit quiz", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Submit answers", exact: true })
    .click();
  await expect(page.getByText("5 of 5 correct", { exact: true })).toBeVisible();
  await expect(page.getByText("Why this answer?", { exact: true })).toHaveCount(
    5,
  );
  await noOverflow(page);
});
