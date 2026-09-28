import { test, expect } from "@playwright/test";
test("create PIN, log a Chest set, view progress, retain data and load offline", async ({
  page,
  context,
  browserName,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Exercises", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("PIN", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await page.getByRole("switch", { name: "Use a passcode" }).click();
  await page.getByLabel("New PIN", { exact: true }).fill("1234");
  await page.getByLabel("Confirm new PIN", { exact: true }).fill("1234");
  await page
    .getByRole("button", { name: "Enable passcode", exact: true })
    .click();
  await page.getByRole("link", { name: "Exercises", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Exercises", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/exercises.png", fullPage: true });
  await page.getByRole("link", { name: "Chest 23 exercises" }).click();
  await page.getByRole("link", { name: "Incline Dumbbell Press" }).click();
  await page.getByLabel("Weight", { exact: true }).fill("30");
  await page.getByLabel("Reps", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Log set", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Progress chart with 1 sessions" }),
  ).toBeVisible();
  await expect(
    page.getByText("New personal record!", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/exercise-detail.png",
    fullPage: true,
  });
  await page.reload();
  await page.getByLabel("PIN", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await expect(page.getByLabel("Weight", { exact: true })).toHaveValue("30");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  if (browserName === "webkit") {
    test.info().annotations.push({
      type: "limitation",
      description:
        "WebKit automation reports an internal error when reloading with context.setOffline; physical iPhone offline check remains required.",
    });
    expect(
      await page.evaluate(
        async () =>
          !!(await caches.match(new URL("index.html", location.href).href, {
            ignoreSearch: true,
          })),
      ),
    ).toBe(true);
    return;
  }
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel("PIN", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Progress chart with 1 sessions" }),
  ).toBeVisible();
});

test("custom exercises, plan ordering, backup, and settings work", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Chest 23 exercises" }).click();
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await page.getByRole("button", { name: "Add exercise", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("My Cable Press");
  await page
    .getByLabel("Optional video")
    .setInputFiles("tests/fixtures/clip.mp4");
  await page.getByRole("button", { name: "Save exercise" }).click();
  await expect(
    page.getByRole("link", { name: "My Cable Press" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Plans", exact: true }).click();
  await page
    .getByRole("button", { name: "Create a plan", exact: true })
    .click();
  await page.getByLabel("Plan name").fill("Push");
  await page.getByLabel("Find exercises").fill("My Cable Press");
  await page
    .getByRole("button", { name: "My Cable Press", exact: true })
    .click();
  await page.getByRole("button", { name: "Save plan" }).click();
  await page.getByRole("button", { name: "Start plan" }).click();
  await expect(
    page.getByRole("heading", { name: "Today's queue" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await page.getByLabel("Weight unit").selectOption("lb");
  await page.getByLabel("Appearance").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Body weight", { exact: true }).fill("180");
  await page
    .getByLabel("New progress photo")
    .setInputFiles("public/icons/icon-192.png");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("180 lb", { exact: true }).first()).toBeVisible();
  await page.screenshot({
    path: `test-results/profile-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.evaluate(() =>
    Object.defineProperty(navigator, "canShare", {
      value: () => false,
      configurable: true,
    }),
  );
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const download = await downloadEvent;
  const backupPath = test.info().outputPath("backup.json");
  await download.saveAs(backupPath);
  page.on("dialog", (dialog) =>
    dialog.accept(dialog.type() === "prompt" ? "RESET" : undefined),
  );
  await page.getByRole("button", { name: "Reset app", exact: true }).click();

  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await page.getByLabel("Import backup").setInputFiles(backupPath);
  await expect(
    page.getByText("0 sets · 1 workouts · 1 plans · 2 media files"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await expect(
    page.getByText("Backup restored", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("180 lb", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".progress-photo img")).toHaveCount(1);
  await page.getByRole("link", { name: "Plans", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Push", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Exercises", exact: true }).click();
  await page.getByRole("link", { name: "Chest 24 exercises" }).click();
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await page.getByRole("link", { name: "My Cable Press" }).click();
  await expect(page.locator(".carousel video")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await page.getByRole("button", { name: "Play video fullscreen" }).click();
  await expect(
    page.getByRole("button", { name: "Done", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
});
