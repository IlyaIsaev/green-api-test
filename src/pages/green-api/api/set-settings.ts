import * as v from "valibot";
import { UNIVERSAL_API_URL } from "@/shared/green-api";

const setSettingsResponseSchema = v.object({
  saveSettings: v.boolean(),
});

type SetSettings = {
  idInstance: string;
  apiTokenInstance: string;
  signal: AbortSignal;
};

export async function setSettings({
  idInstance,
  apiTokenInstance,
  signal,
}: SetSettings): Promise<v.InferOutput<typeof setSettingsResponseSchema>> {
  if (!idInstance || !apiTokenInstance) throw new Error("Missing Green API credentials");

  const url = `${UNIVERSAL_API_URL}/waInstance${encodeURIComponent(idInstance)}/setSettings/${encodeURIComponent(apiTokenInstance)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      webhookUrl: "",
      outgoingWebhook: "yes",
      stateWebhook: "yes",
      incomingWebhook: "yes",
    }),
    signal,
  });

  if (!response.ok) throw new Error("Could not save settings");

  const body: unknown = await response.json().catch(() => null);

  if (body === null) throw new Error("Could not save settings");

  const parsed = v.safeParse(setSettingsResponseSchema, body);

  if (!parsed.success || parsed.output.saveSettings !== true)
    throw new Error("Could not save settings");

  return parsed.output;
}
