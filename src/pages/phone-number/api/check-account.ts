import * as v from "valibot";
import { UNIVERSAL_API_URL } from "@/shared/green-api";

const checkAccountResponseSchema = v.object({
  existsWhatsapp: v.optional(v.boolean()),
  chatId: v.optional(v.string()),
});

type CheckAccount = {
  idInstance: string;
  apiTokenInstance: string;
  phoneNumber: string;
  signal: AbortSignal;
};

export async function checkAccount({
  idInstance,
  apiTokenInstance,
  phoneNumber,
  signal,
}: CheckAccount): Promise<v.InferOutput<typeof checkAccountResponseSchema>> {
  if (!idInstance || !apiTokenInstance) throw new Error("Missing Green API credentials");

  // WhatsApp instances 404 on checkAccount; checkWhatsapp is the equivalent.
  const url = `${UNIVERSAL_API_URL}/waInstance${encodeURIComponent(idInstance)}/checkWhatsapp/${encodeURIComponent(apiTokenInstance)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
    signal,
  });

  if (!response.ok) throw new Error("Could not check phone number");

  const body: unknown = await response.json().catch(() => null);

  if (body === null) throw new Error("Could not check phone number");

  const parsed = v.safeParse(checkAccountResponseSchema, body);

  if (!parsed.success) throw new Error("This phone number is not registered");

  return parsed.output;
}
