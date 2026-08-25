import { expect, test } from "@playwright/test";

test("direct-file launch retains a visible animated galaxy fallback", async ({ page }) => {
  await page.goto(new URL("../index.html", import.meta.url).href);

  const galaxy = page.locator("#galaxy-background");
  await expect(galaxy).toHaveClass(/load-failed/);
  const fallback = await galaxy.evaluate(element => {
    const styles = getComputedStyle(element);
    return {
      backgroundImage: styles.backgroundImage,
      animationName: styles.animationName,
      animationDuration: styles.animationDuration,
    };
  });

  expect(fallback.backgroundImage).not.toBe("none");
  expect(fallback.animationName).not.toBe("none");
  expect(fallback.animationDuration).not.toBe("0s");

  const initialPosition = await galaxy.evaluate(element => getComputedStyle(element).backgroundPosition);
  await page.waitForTimeout(250);
  const movedPosition = await galaxy.evaluate(element => getComputedStyle(element).backgroundPosition);
  expect(movedPosition).not.toBe(initialPosition);
});

test("served launch retains the full 3D galaxy canvas", async ({ page }) => {
  await page.goto("/");

  const galaxy = page.locator("#galaxy-background");
  await expect(galaxy).toHaveClass(/is-ready/, { timeout: 10_000 });
  await expect(galaxy).not.toHaveClass(/load-failed/);
  await expect(page.locator("#galaxy-canvas")).toHaveCSS("opacity", "1", { timeout: 3_000 });
});

test("new public work is discoverable with live, source, and case-note paths", async ({ page }) => {
  await page.goto("/");

  const ssu = page.locator(".project-card", { has: page.getByRole("heading", { name: "Bangladesh Social Insurance Policy Projection Tool" }) });
  await expect(ssu).toBeVisible();
  await expect(ssu.getByRole("link", { name: /launch projection tool/i })).toHaveAttribute("href", "https://tnibir.github.io/SSU-Bangladesh/");
  await expect(ssu.getByRole("link", { name: /view source/i })).toHaveAttribute("href", "https://github.com/tnibir/SSU-Bangladesh");
  await ssu.getByRole("button", { name: /read case note/i }).click();
  await expect(page.getByRole("dialog", { name: /testing social-insurance policy scenarios/i })).toBeVisible();
  await page.getByRole("dialog", { name: /testing social-insurance policy scenarios/i }).getByRole("button", { name: /close case note/i }).click();

  const library = page.locator(".project-card", { has: page.getByRole("heading", { name: "Monitoring & MEAL Guideline Library" }) });
  await expect(library).toBeVisible();
  await expect(library.getByRole("link", { name: /explore library/i })).toHaveAttribute("href", "https://github.com/tnibir/Monitoring-Guideline");
  await library.getByRole("button", { name: /read case note/i }).click();
  await expect(page.getByRole("dialog", { name: /connecting senior meal guidance/i })).toBeVisible();
});

test("project filters retain the two additions in their relevant views", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "MEAL systems" }).click();
  await expect(page.getByRole("heading", { name: "Bangladesh Social Insurance Policy Projection Tool" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Monitoring & MEAL Guideline Library" })).toBeVisible();

  await page.getByRole("button", { name: "Digital products" }).click();
  await expect(page.getByRole("heading", { name: "Bangladesh Social Insurance Policy Projection Tool" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Monitoring & MEAL Guideline Library" })).toBeHidden();
});

test("the portfolio layer materially shields project copy from the 3D background", async ({ page }) => {
  await page.goto("/");

  const shield = await page.locator(".work-section").evaluate(element => {
    const overlay = getComputedStyle(element, "::after");
    const content = getComputedStyle(element.querySelector(":scope > .shell"));
    return {
      hasLayer: overlay.content !== "none" && overlay.backgroundImage !== "none",
      overlayZIndex: Number(overlay.zIndex),
      contentZIndex: Number(content.zIndex),
    };
  });

  expect(shield.hasLayer).toBe(true);
  expect(shield.contentZIndex).toBeGreaterThan(shield.overlayZIndex);
});

test("project descriptions retain readable contrast in the light theme", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });

  const ratio = await page.locator(".project-card p").first().evaluate(text => {
    const parseColor = color => {
      const values = color.match(/[\d.]+/g).slice(0, 3).map(Number);
      return color.startsWith("color(srgb") ? values.map(value => value * 255) : values;
    };
    const luminance = color => {
      const linear = parseColor(color).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const foreground = luminance(getComputedStyle(text).color);
    const background = luminance(getComputedStyle(text.closest(".project-card")).backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });

  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
