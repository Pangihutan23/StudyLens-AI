import { test, expect } from "@playwright/test";
import path from "node:path";

test("scroll reveals content once and preserves it when leaving the viewport", async ({
  page,
}, info) => {
  await page.goto("/");
  const closing = page.locator(".closing-cta");
  await expect(closing).toHaveAttribute("data-reveal", "pending");
  await closing.scrollIntoViewIfNeeded();
  await expect(closing).toHaveAttribute("data-reveal", "visible");
  await expect(closing).toHaveCSS("opacity", "1");
  await expect(closing).toHaveCSS("transform", "none");
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  await expect(closing).toHaveAttribute("data-reveal", "visible");
  await expect(page.locator(".hero-content")).toHaveCSS("opacity", "1");
  if (info.project.name === "desktop") {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: path.resolve("..", "qa", "motion-preview.png"),
    });
  }
});

test("reduced motion keeps offscreen content visible and removes decorative motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const closing = page.locator(".closing-cta");
  await expect(closing).toHaveAttribute("data-reveal", "visible");
  await expect(closing).toHaveCSS("opacity", "1");
  await expect(closing).toHaveCSS("transform", "none");
  await expect(page.locator(".feature-card").first()).toHaveCSS(
    "translate",
    "none",
  );
  await expect(page.locator(".hero-content")).toHaveCSS("opacity", "1");
});

test("content remains readable when Intersection Observer is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.IntersectionObserver = undefined;
  });
  await page.goto("/");
  const closing = page.locator(".closing-cta");
  await expect(closing).toHaveAttribute("data-reveal", "visible");
  await expect(closing).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("link", { name: "Start Learning", exact: true }),
  ).toBeVisible();
});
