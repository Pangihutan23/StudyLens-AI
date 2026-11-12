import { test, expect } from "@playwright/test";
import { ids, themeFixtures } from "./helpers/themeFixtures";
import path from "node:path";

test("one-page workspace opens directly with the original palette and no launch button", async ({
  page,
}, info) => {
  await themeFixtures(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Less searching.",
  );
  await expect(
    page.getByRole("heading", { name: "Your study material", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Launch|Start Learning/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("tab", { name: "Chat", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-neon-blue")
        .trim(),
    ),
  ).toBe("#58a6ff");
  await page
    .getByRole("textbox", { name: "Your question" })
    .fill("Keep this draft while I switch tools.");
  await page.getByRole("tab", { name: "Summarize", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Intelligent summaries" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Chat", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your question" }),
  ).toHaveValue("Keep this draft while I switch tools.");
  expect(new URL(page.url()).pathname).toBe("/");
  await page.goBack();
  await expect(
    page.getByRole("tab", { name: "Summarize", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.goForward();
  await expect(
    page.getByRole("tab", { name: "Chat", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("textbox", { name: "Your question" }).clear();
  await page.getByRole("heading", { level: 1 }).click();
  expect(
    await page.evaluate(() => {
      const source = document
        .querySelector(".chat-context")
        .getBoundingClientRect();
      const answer = document
        .querySelector(".chat-panel")
        .getBoundingClientRect();
      return innerWidth <= 820
        ? source.bottom <= answer.top
        : source.right <= answer.left;
    }),
    "Source and answer panels must not overlap",
  ).toBeTruthy();
  await page.screenshot({
    path: path.resolve("..", "qa", `studio-${info.project.name}.png`),
    fullPage: true,
  });
});

test("tabs support keyboard navigation and legacy links retain separate saved results", async ({
  page,
}) => {
  await themeFixtures(page);
  await page.goto(`/app/summaries?id=${ids.summary}`);
  await expect(page).toHaveURL(new RegExp(`summary=${ids.summary}`));
  await expect(
    page.getByRole("heading", { name: "Learning foundations", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Summarize", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Practice", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Practice with purpose" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("tab", { name: "Chat", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Practice", exact: true }),
  ).toBeFocused();
  await page.getByRole("tab", { name: "Summarize", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Learning foundations", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Learning foundations", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Workspace tools" })
    .getByRole("button", { name: "My Documents", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Use Learning foundations.pdf as AI context",
    })
    .check();
  await page
    .getByRole("link", { name: "Chat with selected", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`summary=${ids.summary}`));
  await page.getByRole("tab", { name: "Summarize", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Learning foundations", exact: true }),
  ).toBeVisible();
});

test("a chat completing in the background preserves the selected tab", async ({
  page,
}) => {
  await themeFixtures(page);
  let complete;
  const ready = new Promise((resolve) => {
    complete = resolve;
  });
  await page.route("**/api/chat", async (route) => {
    await ready;
    await route.fulfill({
      json: {
        data: {
          session: { id: ids.session },
          messages: [
            {
              id: "user-background",
              role: "user",
              content: "Explain the central idea.",
              sources: [],
            },
            {
              id: "assistant-background",
              role: "assistant",
              content: "A completed answer.",
              sources: [],
            },
          ],
        },
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("checkbox", {
      name: "Use Learning foundations.pdf as AI context",
    })
    .check();
  await page
    .getByRole("textbox", { name: "Your question" })
    .fill("Explain the central idea.");
  await page
    .getByRole("button", { name: "Send question", exact: true })
    .click();
  await page.getByRole("tab", { name: "Summarize", exact: true }).click();
  complete();
  await expect(page).toHaveURL(/session=/);
  await expect(
    page.getByRole("tab", { name: "Summarize", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Chat", exact: true }).click();
  await expect(page.locator(".message.assistant")).toBeVisible();
});

test("inline uploads and deletion update all mounted document selectors", async ({
  page,
}) => {
  await themeFixtures(page);
  const doc = {
    id: ids.document,
    title: "New lecture.pdf",
    size: 1200,
    page_count: 2,
    status: "ready",
    created_at: "2026-11-12T00:00:00Z",
  };
  let documents = [];
  await page.route("**/api/documents", (route) =>
    route.fulfill({ json: { data: documents } }),
  );
  await page.route("**/api/documents/upload", (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataBuffer().toString()).toContain(
      'name="file"',
    );
    documents = [doc];
    return route.fulfill({ status: 201, json: { data: doc } });
  });
  await page.route(`**/api/documents/${doc.id}`, (route) => {
    expect(route.request().method()).toBe("DELETE");
    documents = [];
    return route.fulfill({ json: { data: { deleted: doc.id } } });
  });
  await page.goto("/?tool=summaries");
  await expect(
    page.getByLabel("Source document").locator("option"),
  ).toHaveCount(1);
  await page.getByRole("tab", { name: "Chat", exact: true }).click();
  await page
    .getByLabel("Upload study PDFs")
    .setInputFiles({
      name: doc.title,
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7 browser-only fixture"),
    });
  await expect(
    page.getByRole("checkbox", { name: `Use ${doc.title} as AI context` }),
  ).toBeChecked();
  await page.getByRole("tab", { name: "Summarize", exact: true }).click();
  await page.getByLabel("Source document").selectOption(doc.id);
  await expect(
    page.getByRole("button", { name: "Generate summary", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("navigation", { name: "Workspace tools" })
    .getByRole("button", { name: "My Documents", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Delete ${doc.title}`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete document", exact: true })
    .click();
  await page.getByRole("tab", { name: "Chat", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: `Use ${doc.title} as AI context` }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Send question", exact: true }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "Summarize", exact: true }).click();
  await expect(page.getByLabel("Source document")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Generate summary", exact: true })).toBeDisabled();
});
