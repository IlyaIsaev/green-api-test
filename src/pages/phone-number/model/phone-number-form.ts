import {
  abortVar,
  atom,
  computed,
  reatomField,
  reatomForm,
  withCallHook,
  wrap,
} from "@reatom/core";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js/max";
import * as v from "valibot";
import { chatRoute } from "@/app/routes";
import { chatId } from "@/entities/chat";
import { resetConversation } from "@/pages/chat/model/chat";
import { toast } from "@/shared/components/ui/toast";
import { apiTokenInstance, idInstance } from "@/shared/green-api";
import { checkAccount } from "../api/check-account";

export const phoneNumber = atom("", "phoneNumber");

function toInternational(input: string): string {
  return input.startsWith("+") ? input : `+${input}`;
}

const phoneNumberSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Enter a phone number"),
  v.check((input) => isValidPhoneNumber(toInternational(input)), "Enter a valid phone number"),
);
const phoneNumberFormSchema = v.object({
  phoneNumber: phoneNumberSchema,
});

export const phoneNumberForm = reatomForm(
  {
    phoneNumber: reatomField("", { validate: phoneNumberSchema }),
  },
  {
    name: "phoneNumberForm",
    validateOnBlur: true,
    validateOnChange: false,
    keepErrorOnChange: false,
    async onSubmit(values) {
      const parsed = v.parse(phoneNumberFormSchema, values);

      const phone = parsePhoneNumberFromString(toInternational(parsed.phoneNumber));

      if (!phone) throw new Error("Enter a valid phone number");

      const digits = phone.number.slice(1);

      const account = await wrap(
        checkAccount({
          idInstance: idInstance(),
          apiTokenInstance: apiTokenInstance(),
          phoneNumber: digits,
          signal: abortVar.require().signal,
        }),
      );

      if (account.existsWhatsapp !== true) {
        throw new Error("This phone number is not registered");
      }

      const id = account.chatId?.trim();

      if (!id) throw new Error("Could not check phone number");

      if (digits !== phoneNumber()) {
        resetConversation();
      }

      chatId.set(id);
      phoneNumber.set(digits);
      chatRoute.go();
    },
  },
);

phoneNumberForm.submit.onReject.extend(
  withCallHook(({ error }) => {
    toast.add({
      type: "error",
      title: error instanceof Error ? error.message : "Could not save phone number",
    });
  }),
);

export const isPhoneNumberFormValid = computed(
  () => v.safeParse(phoneNumberFormSchema, phoneNumberForm()).success,
  "isPhoneNumberFormValid",
);
