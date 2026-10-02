import * as v from "valibot";
import { UNIVERSAL_API_URL } from "@/shared/green-api";

const deleteNotificationResponseSchema = v.object({
  result: v.boolean(),
});

type DeleteNotification = {
  idInstance: string;
  apiTokenInstance: string;
  receiptId: number;
  signal: AbortSignal;
};

export async function deleteNotification({
  idInstance,
  apiTokenInstance,
  receiptId,
  signal,
}: DeleteNotification): Promise<v.InferOutput<typeof deleteNotificationResponseSchema>> {
  if (!idInstance || !apiTokenInstance) throw new Error("Missing Green API credentials");

  const url = `${UNIVERSAL_API_URL}/waInstance${encodeURIComponent(idInstance)}/deleteNotification/${encodeURIComponent(apiTokenInstance)}/${encodeURIComponent(String(receiptId))}`;

  const response = await fetch(url, { method: "DELETE", signal });

  if (!response.ok) throw new Error("Could not receive message");

  const body: unknown = await response.json().catch(() => null);

  if (body === null) throw new Error("Could not receive message");

  const parsed = v.safeParse(deleteNotificationResponseSchema, body);

  if (!parsed.success || parsed.output.result !== true)
    throw new Error("Could not receive message");

  return parsed.output;
}
