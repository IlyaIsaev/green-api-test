import { expect, test, type Page } from "@playwright/test";

async function mockSetSettings(page: Page, json: unknown = { saveSettings: true }, status = 200) {
  await page.route("**/setSettings/**", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      json,
    });
  });
}

async function persistedValue(page: Page, key: string) {
  return page.evaluate((storageKey) => {
    const stored = localStorage.getItem(storageKey);

    if (stored === null) return null;

    return JSON.parse(stored).data as unknown;
  }, key);
}

test.describe("Green API form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/green-api");
  });

  test("should disable submit when fields are empty", async ({ page }) => {
    await expect(page.getByText("Green API")).toBeVisible();
    await expect(page.getByText("This app works only with WhatsApp.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("should enable submit when fields are valid", async ({ page }) => {
    await page.getByLabel("id Instance").fill("12345");
    await page.getByLabel("api Token Instance").fill("token");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("should mask the API token and toggle visibility when the show button is clicked", async ({
    page,
  }) => {
    const tokenField = page.getByLabel("api Token Instance");
    await tokenField.fill("token");

    await expect(tokenField).toHaveCSS("-webkit-text-security", "disc");
    await expect(page.getByRole("button", { name: "Show API token" })).toBeVisible();

    await page.getByRole("button", { name: "Show API token" }).click();

    await expect(tokenField).toHaveCSS("-webkit-text-security", "none");
    await expect(tokenField).toHaveValue("token");
    await expect(page.getByRole("button", { name: "Hide API token" })).toBeVisible();

    await page.getByRole("button", { name: "Hide API token" }).click();

    await expect(tokenField).toHaveCSS("-webkit-text-security", "disc");
    await expect(page.getByRole("button", { name: "Show API token" })).toBeVisible();
  });

  test("should show instance ID required error when the field is blurred empty", async ({
    page,
  }) => {
    await page.getByLabel("id Instance").focus();
    await page.getByLabel("id Instance").blur();

    await expect(page.getByRole("alert")).toHaveText("Enter an instance ID");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should show API token required error when the field is blurred empty", async ({ page }) => {
    await page.getByLabel("api Token Instance").focus();
    await page.getByLabel("api Token Instance").blur();

    await expect(page.getByRole("alert")).toHaveText("Enter an API token");
  });

  test("should not show instance ID error while the field is focused", async ({ page }) => {
    const idField = page.getByLabel("id Instance");
    await idField.fill("   ");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(idField).toBeFocused();
  });

  test("should show instance ID required error when whitespace is blurred", async ({ page }) => {
    const idField = page.getByLabel("id Instance");
    await idField.fill("   ");
    await idField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter an instance ID");
  });

  test("should show instance ID required error when the field is cleared and blurred", async ({
    page,
  }) => {
    const idField = page.getByLabel("id Instance");
    await idField.fill("123");
    await idField.blur();
    await idField.fill("");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(idField).toBeFocused();

    await idField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter an instance ID");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should show API token required error when the field is cleared and blurred", async ({
    page,
  }) => {
    const tokenField = page.getByLabel("api Token Instance");
    await tokenField.fill("token");
    await tokenField.blur();
    await tokenField.fill("");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(tokenField).toBeFocused();

    await tokenField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter an API token");
  });

  test("should hide API token error when a token is typed after the field is blurred empty", async ({
    page,
  }) => {
    const tokenField = page.getByLabel("api Token Instance");
    await tokenField.focus();
    await tokenField.blur();
    await expect(page.getByRole("alert")).toHaveText("Enter an API token");

    await tokenField.fill("token");

    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("should hide instance ID error when a value is typed after the field is blurred empty", async ({
    page,
  }) => {
    const idField = page.getByLabel("id Instance");
    await idField.focus();
    await idField.blur();
    await expect(page.getByRole("alert")).toHaveText("Enter an instance ID");

    await idField.fill("abc");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(idField).toBeFocused();
  });

  test("should accept a non-digit instance ID", async ({ page }) => {
    await mockSetSettings(page);

    const idField = page.getByLabel("id Instance");
    await idField.fill("abc");
    await idField.blur();

    await expect(page.getByRole("alert")).toHaveCount(0);

    await page.getByLabel("api Token Instance").fill("token");

    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL("/phone-number");
  });

  test("should navigate to phone number when all fields are valid", async ({ page }) => {
    await mockSetSettings(page);

    await page.getByLabel("id Instance").fill("12345");
    await page.getByLabel("api Token Instance").fill("token");

    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL("/phone-number");
  });

  test("should stay on the form when Enter is pressed with invalid fields", async ({ page }) => {
    await page.getByLabel("id Instance").press("Enter");

    await expect(page).toHaveURL("/green-api");
  });

  test("should not prefill fields when the page is reloaded", async ({ page }) => {
    await page.getByLabel("id Instance").fill("12345");
    await page.getByLabel("api Token Instance").fill("token");

    await page.reload();

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByLabel("id Instance")).toHaveValue("");
    await expect(page.getByLabel("api Token Instance")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test.describe("submit", () => {
    test("should send setSettings to the universal API URL", async ({ page }) => {
      await mockSetSettings(page);
      await page.getByLabel("id Instance").fill("12345");
      await page.getByLabel("api Token Instance").fill("token");

      const settingsRequest = page.waitForRequest("**/setSettings/**");
      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
      await page.getByRole("button", { name: "Submit" }).click();
      const request = await settingsRequest;

      expect(request.url()).toBe("https://api.greenapi.com/waInstance12345/setSettings/token");
      expect(request.postDataJSON()).toEqual({
        webhookUrl: "",
        outgoingWebhook: "yes",
        stateWebhook: "yes",
        incomingWebhook: "yes",
      });
      await expect(page).toHaveURL("/phone-number");
      expect(await persistedValue(page, "apiUrl")).toBeNull();
      expect(await persistedValue(page, "idInstance")).toBeNull();
      expect(await persistedValue(page, "apiTokenInstance")).toBeNull();
    });

    test("should show a spinner in the submit button while settings are being saved", async ({
      page,
    }) => {
      const settingsHeld = Promise.withResolvers<void>();

      await page.route("**/setSettings/**", async (route) => {
        await settingsHeld.promise;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          json: { saveSettings: true },
        });
      });

      const submit = page.getByRole("button", { name: "Submit" });
      await page.getByLabel("id Instance").fill("12345");
      await page.getByLabel("api Token Instance").fill("token");
      await expect(submit).toBeEnabled();
      await expect(submit.getByRole("status")).toHaveCount(0);

      await submit.click();

      await expect(submit).toBeDisabled();
      await expect(submit.getByRole("status", { name: "Loading" })).toBeVisible();

      settingsHeld.resolve();
      await expect(page).toHaveURL("/phone-number");
    });

    test("should stay on the form when setSettings fails", async ({ page }) => {
      await mockSetSettings(page, { saveSettings: true }, 400);
      await page.getByLabel("id Instance").fill("12345");
      await page.getByLabel("api Token Instance").fill("token");

      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page).toHaveURL("/green-api");
      await expect(
        page.locator('[data-slot="toast"]').filter({ hasText: "Could not save settings" }),
      ).toBeVisible();
      expect(await persistedValue(page, "apiUrl")).toBeNull();
      expect(await persistedValue(page, "idInstance")).toBeNull();
      expect(await persistedValue(page, "apiTokenInstance")).toBeNull();
    });

    test("should stay on the form when setSettings does not save", async ({ page }) => {
      await mockSetSettings(page, { saveSettings: false });
      await page.getByLabel("id Instance").fill("12345");
      await page.getByLabel("api Token Instance").fill("token");

      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page).toHaveURL("/green-api");
      await expect(
        page.locator('[data-slot="toast"]').filter({ hasText: "Could not save settings" }),
      ).toBeVisible();
      expect(await persistedValue(page, "apiUrl")).toBeNull();
      expect(await persistedValue(page, "idInstance")).toBeNull();
      expect(await persistedValue(page, "apiTokenInstance")).toBeNull();
    });
  });
});
