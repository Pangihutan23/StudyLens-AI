import { test, expect } from "@playwright/test";
import path from "node:path";

async function ready(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Study smarter",
  );
}

test("header tracks the current section through links, manual scroll and history", async ({
  page,
}) => {
  await ready(page);
  const nav = page.locator("#landing-navigation");
  const home = nav.locator('a[href="#home"]');
  const features = nav.locator('a[href="#features"]');
  await expect(home).toHaveAttribute("aria-current", "location");
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  if (await toggle.isVisible()) await toggle.click();
  await features.click();
  await expect(page).toHaveURL(/#features$/);
  await expect(features).toHaveAttribute("aria-current", "location");
  if (await toggle.isVisible())
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await page.goBack();
  await expect(home).toHaveAttribute("aria-current", "location");
  await page.goForward();
  await expect(features).toHaveAttribute("aria-current", "location");

  // Scroll without changing the URL: the highlight must follow the actual section.
  await page
    .locator("#how-it-works")
    .evaluate((section) =>
      section.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await expect(nav.locator('a[href="#how-it-works"]')).toHaveAttribute(
    "aria-current",
    "location",
  );
  await page
    .locator("#about")
    .evaluate((section) =>
      section.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  await expect(nav.locator('a[href="#about"]')).toHaveAttribute(
    "aria-current",
    "location",
  );
  await expect(nav.locator('[aria-current="location"]')).toHaveCount(1);
});

test("neon capsule, transparent launch link and mobile menu preserve accessible navigation", async ({
  page,
}, info) => {
  await ready(page);
  const nav = page.locator("#landing-navigation");
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  const mobile = await toggle.isVisible();
  if (mobile) {
    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(nav).toBeVisible();
  }
  await expect(nav.locator(".nav-pill")).toHaveCount(4);
  const home = nav.locator('a[href="#home"]');
  const features = nav.locator('a[href="#features"]');
  await expect(home).toHaveCSS("color", "rgb(88, 166, 255)");
  await expect(features).toHaveCSS("color", "rgb(245, 250, 255)");
  await expect(page.locator(".landing-nav")).toHaveCSS(
    "border-color",
    "rgb(245, 250, 255)",
  );
  await expect(page.locator(".landing-nav")).toHaveCSS(
    "border-radius",
    "999px",
  );
  await expect(page.locator(".landing-nav")).toHaveCSS(
    "backdrop-filter",
    "blur(12px)",
  );
  await home.focus();
  await page.keyboard.press("Tab");
  await expect(features).toBeFocused();
  await expect(features).toHaveCSS("outline-style", "solid");

  const launch = nav.getByRole("link", { name: "Launch App", exact: true });
  await expect(launch).toHaveCSS("background-image", "none");
  await expect(launch).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(launch).toHaveCSS("color", "rgb(245, 250, 255)");
  await expect(launch).toHaveCSS("font-weight", "700");
  if (!mobile) {
    await features.hover();
    await expect(features).toHaveCSS("color", "rgb(88, 166, 255)");
    await launch.hover();
    await expect(launch).toHaveCSS("background-image", "none");
    await expect(launch).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(launch).toHaveCSS("text-shadow", /88, 166, 255/);
  }
  await page.screenshot({
    path: path.resolve("..", "qa", `header-${info.project.name}.png`),
  });

  if (mobile) {
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
  } else {
    // The added pill padding must also fit the existing tablet breakpoint.
    for (const width of [701, 768, 960]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(() => {
          const header = document.querySelector(".landing-nav");
          const logo = header.querySelector(".logo").getBoundingClientRect();
          const menu = header.querySelector("nav").getBoundingClientRect();
          return logo.right <= menu.left && menu.right <= window.innerWidth;
        }),
      ).toBeTruthy();
    }
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
  await launch.click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: "Welcome to your study space." }),
  ).toBeVisible();
});
