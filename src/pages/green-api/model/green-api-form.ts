import { abortVar, computed, reatomField, reatomForm, withCallHook, wrap } from "@reatom/core";
import * as v from "valibot";
import { phoneNumberRoute } from "@/app/routes";
import { toast } from "@/shared/components/ui/toast";
import { apiTokenInstance, idInstance } from "@/shared/green-api";
import { setSettings } from "../api/set-settings";

const idInstanceSchema = v.pipe(v.string(), v.trim(), v.nonEmpty("Enter an instance ID"));
const apiTokenInstanceSchema = v.pipe(v.string(), v.trim(), v.nonEmpty("Enter an API token"));
const greenApiFormSchema = v.object({
  idInstance: idInstanceSchema,
  apiTokenInstance: apiTokenInstanceSchema,
});

export const greenApiForm = reatomForm(
  {
    idInstance: reatomField("", { validate: idInstanceSchema }),
    apiTokenInstance: reatomField("", { validate: apiTokenInstanceSchema }),
  },
  {
    name: "greenApiForm",
    validateOnBlur: true,
    validateOnChange: false,
    keepErrorOnChange: false,
    async onSubmit(values) {
      const parsed = v.parse(greenApiFormSchema, values);

      await wrap(
        setSettings({
          idInstance: parsed.idInstance,
          apiTokenInstance: parsed.apiTokenInstance,
          signal: abortVar.require().signal,
        }),
      );

      idInstance.set(parsed.idInstance);
      apiTokenInstance.set(parsed.apiTokenInstance);

      phoneNumberRoute.go();
    },
  },
);

greenApiForm.submit.onReject.extend(
  withCallHook(({ error }) => {
    toast.add({
      type: "error",
      title: error instanceof Error ? error.message : "Could not save settings",
    });
  }),
);

export const isGreenApiFormValid = computed(
  () => v.safeParse(greenApiFormSchema, greenApiForm()).success,
  "isGreenApiFormValid",
);
