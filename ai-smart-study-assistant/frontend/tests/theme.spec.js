import { test, expect } from "@playwright/test";
import path from "node:path";
import { ids, themeFixtures } from "./helpers/themeFixtures";

test("every page and generated view uses the exact shared neon palette", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await themeFixtures(page);
  const views = [
    ["landing", "/", "Study smarter"],
    ["dashboard", "/app", "Welcome to your study space."],
    ["documents", "/app/documents", "My documents"],
    ["chat", `/app/chat?session=${ids.session}`, "AI chat assistant"],
    ["summaries", `/app/summaries?id=${ids.summary}`, "Intelligent summaries"],
    ["quiz", `/app/quizzes?id=${ids.quiz}`, "Practice with purpose"],
    [
      "quiz-review",
      `/app/quizzes?attempt=${ids.attempt}`,
      "Practice with purpose",
    ],
    ["history", "/app/history", "Your learning story"],
    ["settings", "/app/settings", "Workspace settings"],
  ];
  for (const [name, url, title] of views) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    await expect(page.locator(".loading,.skeleton")).toHaveCount(0);
    const audit = await page.evaluate(() => {
      const white = "rgb(245, 250, 255)",
        blue = "rgb(88, 166, 255)";
      const invalid = [];
      for (const element of document.querySelectorAll("body *")) {
        if (
          ["SCRIPT", "STYLE"].includes(element.tagName) ||
          !element.getClientRects().length
        )
          continue;
        const ownText = [...element.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
        );
        const style = getComputedStyle(element);
        if (ownText && ![white, blue].includes(style.color))
          invalid.push({
            element: element.tagName,
            className: element.getAttribute("class"),
            color: style.color,
          });
        if (element.matches("svg.lucide") && style.color !== blue)
          invalid.push({
            icon: element.getAttribute("class"),
            color: style.color,
          });
        if (
          element.matches("input,textarea") &&
          getComputedStyle(element, "::placeholder").color !== white
        )
          invalid.push({
            placeholder: element.tagName,
            color: getComputedStyle(element, "::placeholder").color,
          });
        if (element.matches(".recharts-text") && style.fill !== white)
          invalid.push({ chartText: style.fill });
      }
      return {
        invalid,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    expect(audit.invalid, `Unexpected colors on ${name}`).toEqual([]);
    expect(audit.overflow, `Horizontal overflow on ${name}`).toBeFalsy();
    await page.screenshot({
      path: path.resolve(
        "..",
        "qa",
        "neon",
        `${name}-${info.project.name}.png`,
      ),
      fullPage: true,
    });
  }
});

test("generated quiz review and document dialog keep readable white text and blue controls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await themeFixtures(page);
  await page.goto("/app/documents");
  await page
    .getByRole("button", {
      name: "Delete Learning foundations.pdf",
      exact: true,
    })
    .click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("heading")).toHaveCSS(
    "color",
    "rgb(245, 250, 255)",
  );
  await expect(
    modal.getByRole("button", { name: "Delete document", exact: true }),
  ).toHaveCSS("color", "rgb(245, 250, 255)");
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await page.goto(`/app/quizzes?attempt=${ids.attempt}`);
  await expect(page.getByText("4 of 5 correct", { exact: true })).toBeVisible();
  await expect(page.locator(".review-options .incorrect")).toHaveCSS(
    "border-style",
    "dashed",
  );
  await expect(page.locator(".review-options .incorrect")).toHaveCSS(
    "color",
    "rgb(245, 250, 255)",
  );
});
