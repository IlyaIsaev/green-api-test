import { expect, test, type Page } from "@playwright/test";

const MOCK_ID_INSTANCE = "1234567890";
const MOCK_API_TOKEN_INSTANCE = "test-token";
const MOCK_CHAT_ID = "123456789012345@lid";
const MOCK_PHONE_CHAT_ID = "12133734253@c.us";
const MOCK_ID_MESSAGE = "1763115112345";
const MOCK_RECEIPT_ID = 1234567;
const MOCK_INCOMING_ID_MESSAGE = "INCOMING1";

async function mockSetSettings(page: Page) {
  await page.route("**/setSettings/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: { saveSettings: true },
    });
  });
}

async function mockCheckAccount(page: Page) {
  await page.route("**/checkWhatsapp/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: { existsWhatsapp: true, chatId: MOCK_CHAT_ID },
    });
  });
}

async function openChat(page: Page) {
  await mockSetSettings(page);
  await mockCheckAccount(page);
  await page.goto("/green-api");

  await page.getByLabel("id Instance").fill(MOCK_ID_INSTANCE);
  await page.getByLabel("api Token Instance").fill(MOCK_API_TOKEN_INSTANCE);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL("/phone-number");

  await page.getByLabel("Phone number").fill("+12133734253");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL("/chat");
}

async function mockSendMessage(
  page: Page,
  status = 200,
  json: unknown = { idMessage: MOCK_ID_MESSAGE },
) {
  await page.route("**/sendMessage/**", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      json,
    });
  });
}

async function mockIdleReceive(page: Page) {
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

function incomingNotification(overrides?: {
  chatId?: string;
  idMessage?: string;
  text?: string;
  typeWebhook?: string;
  receiptId?: number;
}) {
  return {
    receiptId: overrides?.receiptId ?? MOCK_RECEIPT_ID,
    body: {
      typeWebhook: overrides?.typeWebhook ?? "incomingMessageReceived",
      idMessage: overrides?.idMessage ?? MOCK_INCOMING_ID_MESSAGE,
      senderData: { chatId: overrides?.chatId ?? MOCK_CHAT_ID },
      messageData: {
        typeMessage: "textMessage",
        textMessageData: { textMessage: overrides?.text ?? "hi" },
      },
    },
  };
}

async function mockReceiveQueue(page: Page, notifications: unknown[]) {
  let nextIndex = 0;
  const deletedUrls: string[] = [];

  await page.route("**/receiveNotification/**", async (route) => {
    if (nextIndex >= notifications.length) {
      await route.fulfill({ status: 200, body: "" });

      return;
    }

    const notification = notifications[nextIndex];
    nextIndex += 1;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: notification,
    });
  });

  await page.route("**/deleteNotification/**", async (route) => {
    deletedUrls.push(route.request().url());

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: { result: true },
    });
  });

  return deletedUrls;
}

test.describe("Chat page", () => {
  test.beforeEach(async ({ page }) => {
    await mockIdleReceive(page);
    await openChat(page);
  });

  test("should show the empty conversation state", async ({ page }) => {
    await expect(page.getByText("No messages yet")).toBeVisible();
    await expect(page.getByText("Type a message and press send")).toBeVisible();
  });

  test("should redirect to the Green API page when the page is reloaded", async ({ page }) => {
    await page.reload();

    await expect(page).toHaveURL("/green-api");
    await expect(page.getByLabel("id Instance")).toHaveValue("");
    await expect(page.getByLabel("api Token Instance")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  test("should disable send when the composer is empty", async ({ page }) => {
    const send = page.getByRole("button", { name: "Send" });
    const composer = page.getByRole("textbox", { name: "Message" });

    await expect(send).toBeDisabled();

    await composer.fill("   ");

    await expect(send).toBeDisabled();
  });

  test("should keep typed draft in the composer", async ({ page }) => {
    const composer = page.getByRole("textbox", { name: "Message" });

    await composer.fill("hello");

    await expect(composer).toHaveValue("hello");
    await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  test("should send the typed message and show it in the thread", async ({ page }) => {
    let sentBody: unknown;

    await page.route("**/sendMessage/**", async (route) => {
      sentBody = route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { idMessage: MOCK_ID_MESSAGE },
      });
    });

    const composer = page.getByRole("textbox", { name: "Message" });

    await composer.fill("hello");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("No messages yet")).toHaveCount(0);
    await expect(page.getByText("hello")).toBeVisible();
    await expect(page.locator('[data-slot="message"][data-align="end"]')).toContainText("hello");
    await expect(composer).toHaveValue("");
    expect(sentBody).toEqual({ chatId: MOCK_CHAT_ID, message: "hello" });
  });

  test("should send the typed message when Shift+Enter is pressed", async ({ page }) => {
    let sentBody: unknown;

    await page.route("**/sendMessage/**", async (route) => {
      sentBody = route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { idMessage: MOCK_ID_MESSAGE },
      });
    });

    const composer = page.getByRole("textbox", { name: "Message" });

    await composer.fill("hello");
    await composer.press("Shift+Enter");

    await expect(page.getByText("No messages yet")).toHaveCount(0);
    await expect(page.getByText("hello")).toBeVisible();
    await expect(page.locator('[data-slot="message"][data-align="end"]')).toContainText("hello");
    await expect(composer).toHaveValue("");
    expect(sentBody).toEqual({ chatId: MOCK_CHAT_ID, message: "hello" });
  });

  test("should insert a newline and not send when Enter is pressed", async ({ page }) => {
    let sent = false;

    await page.route("**/sendMessage/**", async (route) => {
      sent = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { idMessage: MOCK_ID_MESSAGE },
      });
    });

    const composer = page.getByRole("textbox", { name: "Message" });

    await composer.fill("hello");
    await composer.press("Enter");

    await expect(composer).toHaveValue("hello\n");
    await expect(page.getByText("No messages yet")).toBeVisible();
    expect(sent).toBe(false);
  });

  test("should keep the last message near the composer when the thread overflows", async ({
    page,
  }) => {
    let sendCount = 0;

    await page.route("**/sendMessage/**", async (route) => {
      sendCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { idMessage: `OUT${sendCount}` },
      });
    });

    const composer = page.getByRole("textbox", { name: "Message" });
    const send = page.getByRole("button", { name: "Send" });
    const overflowLineCount = 16;

    for (let i = 1; i <= overflowLineCount; i += 1) {
      await composer.fill(`line-${i}`);
      await send.click();
      await expect(composer).toHaveValue("");
    }

    const lastLine = `line-${overflowLineCount}`;
    const lastMessage = page.locator('[data-slot="message"]').filter({ hasText: lastLine });
    const viewport = page.locator('[data-slot="message-scroller-viewport"]');

    await expect(lastMessage).toBeVisible();
    await expect
      .poll(async () => viewport.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);
    await expect
      .poll(async () => viewport.evaluate((element) => getComputedStyle(element).scrollbarWidth))
      .toBe("none");

    const lastBox = await lastMessage.boundingBox();
    const composerBox = await composer.boundingBox();

    expect(lastBox).not.toBeNull();
    expect(composerBox).not.toBeNull();
    // boundingBox is non-null after the assertions above
    expect(composerBox!.y - (lastBox!.y + lastBox!.height)).toBeLessThan(80);
  });

  test("should pin the sent message near the composer after scrolling up", async ({ page }) => {
    let sendCount = 0;

    await page.route("**/sendMessage/**", async (route) => {
      sendCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { idMessage: `OUT${sendCount}` },
      });
    });

    const composer = page.getByRole("textbox", { name: "Message" });
    const send = page.getByRole("button", { name: "Send" });
    const overflowLineCount = 16;

    for (let i = 1; i <= overflowLineCount; i += 1) {
      await composer.fill(`line-${i}`);
      await send.click();
      await expect(composer).toHaveValue("");
    }

    const viewport = page.locator('[data-slot="message-scroller-viewport"]');

    await expect
      .poll(async () => viewport.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);

    await viewport.evaluate((element) => {
      element.scrollTop = 0;
    });
    await expect.poll(async () => viewport.evaluate((element) => element.scrollTop)).toBe(0);

    await composer.fill("from-history");
    await send.click();
    await expect(composer).toHaveValue("");

    const lastMessage = page.locator('[data-slot="message"]').filter({ hasText: "from-history" });

    await expect(lastMessage).toBeVisible();
    await expect
      .poll(async () => {
        const lastBox = await lastMessage.boundingBox();
        const composerBox = await composer.boundingBox();

        if (lastBox === null || composerBox === null) return Number.POSITIVE_INFINITY;

        return composerBox.y - (lastBox.y + lastBox.height);
      })
      .toBeLessThan(80);
  });

  test("should keep the draft and show a toast when send fails", async ({ page }) => {
    await mockSendMessage(page, 400, { error: "Bad Request" });

    const composer = page.getByRole("textbox", { name: "Message" });

    await composer.fill("hello");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(
      page.locator('[data-slot="toast"]').filter({ hasText: "Could not send message" }),
    ).toBeVisible();
    await expect(composer).toHaveValue("hello");
    await expect(page.getByText("No messages yet")).toBeVisible();
  });
});

test.describe("Chat page receiving", () => {
  test("should show incoming text for the current chat and delete the notification", async ({
    page,
  }) => {
    const deletedUrls = await mockReceiveQueue(page, [incomingNotification()]);

    await openChat(page);

    await expect(page.getByText("No messages yet")).toHaveCount(0);
    await expect(page.locator('[data-slot="message"][data-align="start"]')).toContainText("hi");
    await expect
      .poll(() => deletedUrls.some((url) => url.includes(`/${MOCK_RECEIPT_ID}`)))
      .toBe(true);
  });

  test("should keep an incoming message near the composer when already at the live edge", async ({
    page,
  }) => {
    const receiveQueue: unknown[] = [];
    await mockReceiveQueue(page, receiveQueue);

    let sendCount = 0;

    await page.route("**/sendMessage/**", async (route) => {
      sendCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { idMessage: `OUT${sendCount}` },
      });
    });

    await openChat(page);

    const composer = page.getByRole("textbox", { name: "Message" });
    const send = page.getByRole("button", { name: "Send" });
    const overflowLineCount = 16;

    for (let i = 1; i <= overflowLineCount; i += 1) {
      await composer.fill(`line-${i}`);
      await send.click();
      await expect(composer).toHaveValue("");
    }

    const viewport = page.locator('[data-slot="message-scroller-viewport"]');

    await expect
      .poll(async () => viewport.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);

    await viewport.evaluate((element) => {
      element.dispatchEvent(new WheelEvent("wheel", { deltaY: 40, bubbles: true }));
    });

    receiveQueue.push(
      incomingNotification({
        idMessage: "IN-LIVE-EDGE",
        receiptId: 7654321,
        text: "live-edge-incoming",
      }),
    );

    const lastMessage = page
      .locator('[data-slot="message"]')
      .filter({ hasText: "live-edge-incoming" });

    await expect(lastMessage).toBeVisible();
    await expect
      .poll(async () => {
        const lastBox = await lastMessage.boundingBox();
        const composerBox = await composer.boundingBox();

        if (lastBox === null || composerBox === null) return Number.POSITIVE_INFINITY;

        return composerBox.y - (lastBox.y + lastBox.height);
      })
      .toBeLessThan(80);
  });

  test("should show incoming text when the webhook chatId is the phone JID", async ({ page }) => {
    const deletedUrls = await mockReceiveQueue(page, [
      incomingNotification({ chatId: MOCK_PHONE_CHAT_ID, text: "from-phone-jid" }),
    ]);

    await openChat(page);

    await expect(page.getByText("No messages yet")).toHaveCount(0);
    await expect(page.locator('[data-slot="message"][data-align="start"]')).toContainText(
      "from-phone-jid",
    );
    await expect
      .poll(() => deletedUrls.some((url) => url.includes(`/${MOCK_RECEIPT_ID}`)))
      .toBe(true);
  });

  test("should delete incoming text from another chat without showing it", async ({ page }) => {
    const deletedUrls = await mockReceiveQueue(page, [
      incomingNotification({
        chatId: "999000111@c.us",
        idMessage: "OTHER1",
        text: "other-peer-text",
      }),
    ]);

    await openChat(page);

    await expect
      .poll(() => deletedUrls.some((url) => url.includes(`/${MOCK_RECEIPT_ID}`)))
      .toBe(true);
    await expect(page.getByText("No messages yet")).toBeVisible();
    await expect(page.getByText("other-peer-text")).toHaveCount(0);
  });

  test("should delete non-incoming and file notifications without showing them", async ({
    page,
  }) => {
    const deletedUrls = await mockReceiveQueue(page, [
      {
        receiptId: 222,
        body: { typeWebhook: "outgoingMessageStatus" },
      },
      {
        receiptId: 333,
        body: {
          typeWebhook: "incomingMessageReceived",
          idMessage: "IMAGE1",
          senderData: { chatId: MOCK_CHAT_ID },
          messageData: {
            typeMessage: "imageMessage",
            imageMessageData: { downloadUrl: "https://example.com/photo.jpg" },
          },
        },
      },
    ]);

    await openChat(page);

    await expect(page.getByText("No messages yet")).toBeVisible();
    await expect.poll(() => deletedUrls.some((url) => url.includes("/222"))).toBe(true);
    await expect.poll(() => deletedUrls.some((url) => url.includes("/333"))).toBe(true);
  });

  test("should show a duplicate idMessage only once", async ({ page }) => {
    const notification = incomingNotification();
    await mockReceiveQueue(page, [notification, notification]);

    await openChat(page);

    await expect(page.getByText("hi")).toHaveCount(1);
    await expect(page.locator('[data-slot="message"][data-align="start"]')).toHaveCount(1);
  });

  test("should show a toast when receive fails and keep the composer usable", async ({ page }) => {
    await page.route("**/receiveNotification/**", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        json: { error: "Bad Request" },
      });
    });

    await openChat(page);

    await expect(
      page.locator('[data-slot="toast"]').filter({ hasText: "Could not receive message" }),
    ).toBeVisible();

    const composer = page.getByRole("textbox", { name: "Message" });

    await composer.fill("hello");

    await expect(composer).toHaveValue("hello");
    await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  test("should not immediately re-poll after an empty receive", async ({ page }) => {
    const receiveTimes: number[] = [];

    await page.route("**/receiveNotification/**", async (route) => {
      receiveTimes.push(Date.now());
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/deleteNotification/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { result: true },
      });
    });

    await openChat(page);
    await expect.poll(() => receiveTimes.length).toBe(1);
    await page.waitForTimeout(1_000);

    expect(receiveTimes).toHaveLength(1);
  });
});
