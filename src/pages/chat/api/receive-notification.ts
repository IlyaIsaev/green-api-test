import * as v from "valibot";
import { UNIVERSAL_API_URL } from "@/shared/green-api";

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

const jsonFromText = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export async function receiveNotification({
  idInstance,
  apiTokenInstance,
  signal,
}: ReceiveNotification): Promise<v.InferOutput<typeof receiveNotificationResponseSchema> | null> {
  if (!idInstance || !apiTokenInstance) throw new Error("Missing Green API credentials");

  const url = `${UNIVERSAL_API_URL}/waInstance${encodeURIComponent(idInstance)}/receiveNotification/${encodeURIComponent(apiTokenInstance)}?receiveTimeout=${RECEIVE_TIMEOUT_SECONDS}`;

  const response = await fetch(url, { method: "GET", signal });

  if (!response.ok) throw new Error("Could not receive message");

  const text = await response.text().catch(() => "");

  if (!text.trim()) return null;

  const payload = jsonFromText(text);

  if (payload === null) return null;

  const parsed = v.safeParse(receiveNotificationResponseSchema, payload);

  if (!parsed.success) throw new Error("Could not receive message");

  return parsed.output;
}
