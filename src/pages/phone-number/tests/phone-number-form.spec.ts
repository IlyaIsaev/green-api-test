import { expect, test, type Page } from "@playwright/test";

const mockChatId = "123456789012345@lid";

async function mockCheckAccount(page: Page, doesWhatsappExist: boolean) {
  await page.route("**/checkWhatsapp/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: doesWhatsappExist
        ? { existsWhatsapp: true, chatId: mockChatId }
        : { existsWhatsapp: false },
    });
  });
}

async function mockSetSettings(page: Page) {
  await page.route("**/setSettings/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: { saveSettings: true },
    });
  });
}

async function mockIdleChat(page: Page) {
  await page.route("**/receiveNotification/**", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  await page.route("**/deleteNotification/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: { result: true },
    });
  });
}

async function submitGreenApiCredentials(page: Page) {
  await mockSetSettings(page);
  await page.goto("/green-api");

  await page.getByLabel("id Instance").fill("1234567890");
  await page.getByLabel("api Token Instance").fill("test-token");

  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL("/phone-number");
}

test.describe("Phone number form", () => {
  test.beforeEach(async ({ page }) => {
    await submitGreenApiCredentials(page);
  });

  test("should disable submit when the field is empty", async ({ page }) => {
    await expect(page.getByLabel("Phone number")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("should show required error when the field is blurred empty", async ({ page }) => {
    await page.getByLabel("Phone number").focus();
    await page.getByLabel("Phone number").blur();

    await expect(page.getByRole("alert")).toHaveText("Enter a phone number");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should not show an error while letters are typed", async ({ page }) => {
    const phoneField = page.getByLabel("Phone number");
    await phoneField.fill("abc");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(phoneField).toBeFocused();
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should show invalid error when letters are blurred", async ({ page }) => {
    const phoneField = page.getByLabel("Phone number");
    await phoneField.fill("abc");
    await phoneField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter a valid phone number");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should show required error when whitespace is blurred", async ({ page }) => {
    const phoneField = page.getByLabel("Phone number");
    await phoneField.fill("   ");
    await phoneField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter a phone number");
  });

  test("should show required error when the field is cleared and blurred", async ({ page }) => {
    const phoneField = page.getByLabel("Phone number");
    await phoneField.fill("123");
    await phoneField.blur();
    await phoneField.fill("");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(phoneField).toBeFocused();

    await phoneField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter a phone number");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should show invalid error when letters after a digit are blurred", async ({ page }) => {
    const phoneField = page.getByLabel("Phone number");
    await phoneField.pressSequentially("1a");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(phoneField).toBeFocused();

    await phoneField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter a valid phone number");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should show invalid error when a too-short number is blurred", async ({ page }) => {
    const phoneField = page.getByLabel("Phone number");
    await phoneField.fill("12345");
    await phoneField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter a valid phone number");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should hide error when an invalid value is replaced with a valid number", async ({
    page,
  }) => {
    const phoneField = page.getByLabel("Phone number");
    await phoneField.fill("abc");
    await phoneField.blur();
    await expect(page.getByRole("alert")).toHaveText("Enter a valid phone number");

    await phoneField.fill("+12133734253");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("should hide error on change and show it again when still invalid on blur", async ({
    page,
  }) => {
    const phoneField = page.getByLabel("Phone number");
    await phoneField.fill("abc");
    await phoneField.blur();
    await expect(page.getByRole("alert")).toHaveText("Enter a valid phone number");

    await phoneField.fill("xyz");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(phoneField).toBeFocused();

    await phoneField.blur();

    await expect(page.getByRole("alert")).toHaveText("Enter a valid phone number");
  });

  test("should accept a formatted international number", async ({ page }) => {
    await page.getByLabel("Phone number").fill("+1 213 373 4253");

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  test("should stay on the form when Enter is pressed with an invalid field", async ({ page }) => {
    await page.getByLabel("Phone number").press("Enter");

    await expect(page).toHaveURL("/phone-number");
  });

  test("should redirect to the Green API page when the page is reloaded", async ({ page }) => {
    await page.getByLabel("Phone number").fill("+12133734253");

    await page.reload();

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByLabel("id Instance")).toHaveValue("");
    await expect(page.getByLabel("api Token Instance")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test.describe("submit", () => {
    test.beforeEach(async ({ page }) => {
      await mockCheckAccount(page, true);
      await mockIdleChat(page);
    });

    test("should send the check request to the universal API URL", async ({ page }) => {
      await page.getByLabel("Phone number").fill("+12133734253");

      const checkRequest = page.waitForRequest("**/checkWhatsapp/**");
      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
      await page.getByRole("button", { name: "Submit" }).click();
      const request = await checkRequest;

      expect(request.url()).toBe(
        "https://api.greenapi.com/waInstance1234567890/checkWhatsapp/test-token",
      );
      await expect(page).toHaveURL("/chat");
    });

    test("should navigate to chat when the number is valid without a plus", async ({ page }) => {
      await page.getByLabel("Phone number").fill("12133734253");

      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page).toHaveURL("/chat");
    });

    test("should navigate to chat when the number is valid with a plus", async ({ page }) => {
      await page.getByLabel("Phone number").fill("+12133734253");

      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page).toHaveURL("/chat");
    });

    test("should show a spinner in the submit button when the account is being checked", async ({
      page,
    }) => {
      const checkHeld = Promise.withResolvers<void>();

      await page.route("**/checkWhatsapp/**", async (route) => {
        await checkHeld.promise;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          json: { existsWhatsapp: true, chatId: mockChatId },
        });
      });

      const submit = page.getByRole("button", { name: "Submit" });
      await page.getByLabel("Phone number").fill("+12133734253");
      await expect(submit).toBeEnabled();
      await expect(submit.getByRole("status")).toHaveCount(0);

      await submit.click();

      await expect(submit).toBeDisabled();
      await expect(submit.getByRole("status", { name: "Loading" })).toBeVisible();

      checkHeld.resolve();
      await expect(page).toHaveURL("/chat");
    });

    test("should stay on the form when checkAccount reports the number does not exist", async ({
      page,
    }) => {
      await mockCheckAccount(page, false);
      await page.getByLabel("Phone number").fill("+12133734253");

      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page).toHaveURL("/phone-number");
      await expect(
        page
          .locator('[data-slot="toast"]')
          .filter({ hasText: "This phone number is not registered" }),
      ).toBeVisible();
    });

    test("should stay on the form when checkAccount succeeds without a chatId", async ({
      page,
    }) => {
      await page.route("**/checkWhatsapp/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          json: { existsWhatsapp: true },
        });
      });
      await page.getByLabel("Phone number").fill("+12133734253");

      await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page).toHaveURL("/phone-number");
      await expect(
        page.locator('[data-slot="toast"]').filter({ hasText: "Could not check phone number" }),
      ).toBeVisible();
    });
  });
});
