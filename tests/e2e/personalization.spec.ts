import { test, expect } from "@playwright/test";
test("optional PIN can be disabled and fresh visitors have independent data", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Exercises", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await page.getByLabel("App name", { exact: true }).fill("My Training");
  await expect(page).toHaveTitle("My Training");
  await page.getByRole("switch", { name: "Use a passcode" }).click();
  await page.getByLabel("New PIN", { exact: true }).fill("2468");
  await page.getByLabel("Confirm new PIN").fill("2468");
  await page.getByRole("button", { name: "Enable passcode" }).click();
  await expect(
    page.getByRole("switch", { name: "Use a passcode" }),
  ).toBeChecked();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page.getByLabel("PIN", { exact: true }).fill("2468");
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await page.getByRole("switch", { name: "Use a passcode" }).click();
  await expect(
    page.getByRole("switch", { name: "Use a passcode" }),
  ).not.toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Profile", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("PIN", { exact: true })).toHaveCount(0);
  await page.getByLabel("Body weight", { exact: true }).fill("80");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("80 kg", { exact: true }).first()).toBeVisible();
  const friend = await browser.newContext();
  const other = await friend.newPage();
  await other.goto("http://127.0.0.1:4173/");
  await expect(
    other.getByRole("heading", { name: "Exercises", exact: true }),
  ).toBeVisible();
  await expect(other).toHaveTitle("Coral Gym");
  await other.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(other.getByText("80 kg", { exact: true })).toHaveCount(0);
  await expect(
    other.getByRole("switch", { name: "Use a passcode" }),
  ).not.toBeChecked();
  await friend.close();
});
test("guides, YouTube links, grouped plans and photo scrubbing", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Download all videos" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Abs 17 exercises" }).click();
  await page.getByRole("link", { name: "Incline Bench Sit-Ups" }).click();
  await expect(page.locator(".carousel video")).toHaveAttribute(
    "src",
    /demos\/incline-bench-sit-ups\/loop.mp4/,
  );
  await expect
    .poll(() =>
      page
        .locator(".carousel video")
        .evaluate((v: HTMLVideoElement) => v.duration),
    )
    .toBe(4);
  await page.getByRole("button", { name: "Form cues and notes" }).click();
  await expect(page.getByText("Step 1:", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/instructions-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Manage YouTube links" }).click();
  await page.getByLabel("Video title", { exact: true }).fill("My tutorial");
  await page
    .getByLabel("YouTube URL", { exact: true })
    .fill("https://youtu.be/dQw4w9WgXcQ");
  await page
    .getByRole("button", { name: "Add YouTube link", exact: true })
    .click();
  await page.getByRole("button", { name: "Save links", exact: true }).click();
  await expect(page.getByRole("link", { name: /My tutorial/ })).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  await page.goto("/#/plans");
  await page
    .getByRole("button", { name: "Create a plan", exact: true })
    .click();
  await expect(
    page.locator(".plan-muscle-group summary").filter({ hasText: "Chest" }),
  ).toBeVisible();
  await page
    .locator(".plan-muscle-group summary")
    .filter({ hasText: "Chest" })
    .click();
  await expect(
    page.getByRole("button", { name: "Incline Dumbbell Press", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await page.getByLabel("Date", { exact: true }).fill("2025-01-01");
  await page.getByLabel("Body weight", { exact: true }).fill("80");
  await page
    .getByLabel("New progress photo")
    .setInputFiles("public/icons/icon-192.png");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Progress photo from 2025-01-01" }),
  ).toBeVisible();
  await page.getByLabel("Date", { exact: true }).fill("2025-02-01");
  await page.getByLabel("Body weight", { exact: true }).fill("78");
  await page
    .getByLabel("New progress photo")
    .setInputFiles("public/icons/icon-512.png");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".photo-caption")).toContainText("78 kg");
  const slider = page.getByRole("slider", { name: "Progress timeline" });
  await slider.focus();
  await slider.press("Home");
  await expect(page.locator(".photo-caption")).toContainText("80 kg");
  await slider.press("ArrowRight");
  await expect(page.locator(".photo-caption")).toContainText("78 kg");
  await page.screenshot({
    path: `test-results/photos-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("img", { name: "Progress photo from 2025-02-01" }),
  ).toBeVisible();
});
