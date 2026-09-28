import { wrap } from "@reatom/core";
import { bindField, reatomComponent } from "@reatom/react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Spinner } from "@/shared/components/ui/spinner";
import { isPhoneNumberFormValid, phoneNumberForm } from "../model/phone-number-form";

export const PhoneNumberPage = reatomComponent(() => {
  const phoneNumberField = bindField(phoneNumberForm.fields.phoneNumber);
  const isCheckingAccount = !phoneNumberForm.submit.ready();

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Phone number</CardTitle>
        </CardHeader>
        <form
          autoComplete="off"
          onSubmit={wrap((event) => {
            event.preventDefault();

            phoneNumberForm.submit();
          })}
        >
          <CardContent className="mb-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="phoneNumber" className="uppercase">
                  Phone number
                </FieldLabel>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  value={phoneNumberField.value}
                  onChange={phoneNumberField.onChange}
                  onBlur={phoneNumberField.onBlur}
                  onFocus={phoneNumberField.onFocus}
                  aria-invalid={phoneNumberField.error !== undefined}
                />
                <FieldError errors={[{ message: phoneNumberField.error }]} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!isPhoneNumberFormValid() || isCheckingAccount}>
              {isCheckingAccount && <Spinner data-icon="inline-start" />}
              Submit
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}, "PhoneNumberPage");

export default PhoneNumberPage;
