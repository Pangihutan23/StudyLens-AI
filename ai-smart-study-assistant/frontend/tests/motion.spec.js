import { test, expect } from "@playwright/test";
import { themeFixtures } from "./helpers/themeFixtures";

test("document cards reveal and remain available after switching tools", async ({
  page,
}) => {
  await themeFixtures(page);
  await page.goto("/?tool=documents");
  const card = page.locator(".document-card").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute("data-reveal", "visible");
  await expect(card).toHaveCSS("opacity", "1");
  await page.getByRole("tab", { name: "Chat", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Workspace tools" })
    .getByRole("button", { name: "My Documents", exact: true })
    .click();
  await expect(card).toHaveAttribute("data-reveal", "visible");
});

test("reduced motion keeps workspace content readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await themeFixtures(page);
  await page.goto("/?tool=documents");
  const card = page.locator(".document-card").first();
  await expect(card).toHaveAttribute("data-reveal", "visible");
  await expect(card).toHaveCSS("opacity", "1");
  await expect(card).toHaveCSS("transform", "none");
});

test("content remains usable without Intersection Observer", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.IntersectionObserver = undefined;
  });
  await themeFixtures(page);
  await page.goto("/?tool=documents");
  await expect(page.locator(".document-card").first()).toHaveAttribute(
    "data-reveal",
    "visible",
  );
  await expect(
    page.getByRole("button", {
      name: "Delete Learning foundations.pdf",
      exact: true,
    }),
  ).toBeVisible();
});
