import * as v from "valibot";
import { universalApiUrl } from "@/shared/green-api";

const receiveNotificationResponseSchema = v.object({
  receiptId: v.number(),
  body: v.unknown(),
});

export const RECEIVE_TIMEOUT_SECONDS = 20;

type ReceiveNotification = {
  idInstance: string;
  apiTokenInstance: string;
  signal: AbortSignal;
};

export async function receiveNotification({
  idInstance,
  apiTokenInstance,
  signal,
}: ReceiveNotification) {
  if (!idInstance || !apiTokenInstance) throw new Error("Missing Green API credentials");

  const url = `${universalApiUrl}/waInstance${encodeURIComponent(idInstance)}/receiveNotification/${encodeURIComponent(apiTokenInstance)}?receiveTimeout=${RECEIVE_TIMEOUT_SECONDS}`;

  const response = await fetch(url, { method: "GET", signal });

  if (!response.ok) throw new Error("Could not receive message");

  const text = await response.text().catch(() => "");

  if (!text.trim()) return null;

  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch {
    return null;
  }

  if (payload === null) return null;

  const parsed = v.safeParse(receiveNotificationResponseSchema, payload);

  if (!parsed.success) throw new Error("Could not receive message");

  return parsed.output;
}
