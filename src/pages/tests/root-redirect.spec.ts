import { expect, test, type Page } from "@playwright/test";

const mockIdInstance = "1234567890";
const mockApiTokenInstance = "test-token";
const mockPhoneNumber = "12133734253";
const mockChatId = "123456789012345@lid";

function persistRecord(data: string) {
  return JSON.stringify({
    data,
    id: 0,
    timestamp: Date.now(),
    version: 0,
    to: Date.now() + 86_400_000 * 365,
  });
}

async function seedSession(page: Page, entries: Record<string, string>) {
  await page.addInitScript((stored) => {
    for (const [key, value] of Object.entries(stored)) {
      localStorage.setItem(key, value);
    }
  }, entries);
}

test.describe("Root redirect", () => {
  test("should redirect to the Green API page when local storage is empty", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByText("Green API")).toBeVisible();
  });

  test("should redirect to the Green API page when leftover credentials are in local storage", async ({
    page,
  }) => {
    await seedSession(page, {
      idInstance: persistRecord(mockIdInstance),
      apiTokenInstance: persistRecord(mockApiTokenInstance),
    });

    await page.goto("/");

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByText("Green API")).toBeVisible();
  });

  test("should redirect to the Green API page when leftover session storage is complete", async ({
    page,
  }) => {
    await seedSession(page, {
      idInstance: persistRecord(mockIdInstance),
      apiTokenInstance: persistRecord(mockApiTokenInstance),
      phoneNumber: persistRecord(mockPhoneNumber),
      chatId: persistRecord(mockChatId),
    });

    await page.goto("/");

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByText("Green API")).toBeVisible();
  });

  test("should redirect to the Green API page when opening /chat", async ({ page }) => {
    await page.goto("/chat");

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByText("Green API")).toBeVisible();
  });

  test("should redirect to the Green API page when opening /phone-number", async ({ page }) => {
    await page.goto("/phone-number");

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByText("Green API")).toBeVisible();
  });

  test("should redirect to the Green API page when leftover storage is opened at /chat", async ({
    page,
  }) => {
    await seedSession(page, {
      idInstance: persistRecord(mockIdInstance),
      apiTokenInstance: persistRecord(mockApiTokenInstance),
      phoneNumber: persistRecord(mockPhoneNumber),
      chatId: persistRecord(mockChatId),
    });

    await page.goto("/chat");

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByText("Green API")).toBeVisible();
  });

  test("should redirect to the Green API page when leftover storage is opened at /phone-number", async ({
    page,
  }) => {
    await seedSession(page, {
      idInstance: persistRecord(mockIdInstance),
      apiTokenInstance: persistRecord(mockApiTokenInstance),
    });

    await page.goto("/phone-number");

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByText("Green API")).toBeVisible();
  });

  test("should redirect to the Green API page when opening an unknown path", async ({ page }) => {
    await page.goto("/not-a-route");

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByText("Green API")).toBeVisible();
  });
});
