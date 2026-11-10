import { test, expect } from "@playwright/test";
import path from "node:path";

const qa = path.resolve("..", "qa");
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
}
async function navigate(page, label) {
  if (
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: label, exact: true })
    .click();
}

test("landing, real backend, all workspace pages and responsive layout", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.log("Browser error:", m.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Study smarter",
  );
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page
      .locator(".hero > div")
      .filter({ has: page.getByRole("heading", { level: 1 }) }),
  ).toHaveCSS("opacity", "1");
  await noOverflow(page);
  await page.screenshot({
    path: path.join(qa, `landing-${info.project.name}.png`),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Start Learning", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome to your study space." }),
  ).toBeVisible();
  await expect(
    page.getByText("Cannot reach the study server.", { exact: false }),
  ).toHaveCount(0);
  await expect(page.locator(".connection.online")).toBeVisible();
  await expect(page.getByText("Uploaded PDFs", { exact: true })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: path.join(qa, `dashboard-${info.project.name}.png`),
    fullPage: true,
  });
  await navigate(page, "My Documents");
  await expect(
    page.getByRole("heading", { name: "My documents", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search documents" })
    .fill("__no_such_lecture_qa_5c92__");
  await expect(
    page.getByRole("heading", { name: "No matching documents" }),
  ).toBeVisible();
  await noOverflow(page);
  await navigate(page, "AI Chat Assistant");
  await expect(
    page.getByRole("heading", { name: "AI chat assistant", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send question" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Explain the main concepts simply" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Your question" }),
  ).toHaveValue("Explain the main concepts simply");
  await noOverflow(page);
  await page.screenshot({
    path: path.join(qa, `chat-${info.project.name}.png`),
    fullPage: true,
  });
  await navigate(page, "AI Summarizer");
  await expect(
    page.getByRole("heading", { name: "Intelligent summaries" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate summary" }),
  ).toBeDisabled();
  await page
    .getByLabel("Summary format")
    .selectOption("Structured Study Notes");
  await noOverflow(page);
  await navigate(page, "Quiz Generator");
  await expect(
    page.getByRole("heading", { name: "Practice with purpose" }),
  ).toBeVisible();
  await page.getByLabel("Questions", { exact: true }).selectOption("10");
  await expect(
    page.getByRole("button", { name: "Generate practice quiz" }),
  ).toBeDisabled();
  await noOverflow(page);
  await navigate(page, "Learning History");
  await expect(
    page.getByRole("heading", { name: "Your learning story" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quizzes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Quizzes", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await noOverflow(page);
  await page.goto("/app/settings");
  await expect(
    page.getByRole("heading", { name: "Workspace settings" }),
  ).toBeVisible();
  await page.getByLabel("Output language").selectOption("Bahasa Indonesia");
  await expect(
    page.getByRole("status").filter({ hasText: "Language preference saved." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Output language")).toHaveValue(
    "Bahasa Indonesia",
  );
  await noOverflow(page);
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
    page.getByRole("heading", { name: "AI chat assistant", exact: true }),
  ).toBeVisible();
  const contextButton = page.getByRole("button", {
    name: "Context",
    exact: true,
  });
  if (await contextButton.isVisible()) await contextButton.click();
  await page.getByText(doc.title, { exact: true }).click();
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
