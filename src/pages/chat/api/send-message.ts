import * as v from "valibot";
import { universalApiUrl } from "@/shared/green-api";

const sendMessageResponseSchema = v.object({
  idMessage: v.string(),
});

type SendMessage = {
  idInstance: string;
  apiTokenInstance: string;
  chatId: string;
  message: string;
  signal: AbortSignal;
};

export async function sendMessage({
  idInstance,
  apiTokenInstance,
  chatId,
  message,
  signal,
}: SendMessage) {
  if (!idInstance || !apiTokenInstance) throw new Error("Missing Green API credentials");

  if (!chatId) throw new Error("Missing chat");

  const url = `${universalApiUrl}/waInstance${encodeURIComponent(idInstance)}/sendMessage/${encodeURIComponent(apiTokenInstance)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
    signal,
  });

  if (!response.ok) throw new Error("Could not send message");

  const body: unknown = await response.json().catch(() => null);

  if (body === null) throw new Error("Could not send message");

  const parsed = v.safeParse(sendMessageResponseSchema, body);

  if (!parsed.success) throw new Error("Could not send message");

  return parsed.output;
}
