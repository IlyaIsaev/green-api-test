import { useState, type CSSProperties } from "react";
import { wrap } from "@reatom/core";
import { bindField, reatomComponent } from "@reatom/react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/components/ui/input-group";
import { Spinner } from "@/shared/components/ui/spinner";
import { greenApiForm, isGreenApiFormValid } from "../model/green-api-form";

const apiTokenInstanceStyle = { WebkitTextSecurity: "disc" } as unknown as CSSProperties;

export const GreenApiPage = reatomComponent(() => {
  const idInstanceField = bindField(greenApiForm.fields.idInstance);
  const apiTokenInstanceField = bindField(greenApiForm.fields.apiTokenInstance);
  const isSavingSettings = !greenApiForm.submit.ready();
  const [isApiTokenVisible, setIsApiTokenVisible] = useState(false);

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Green API</CardTitle>
          <CardDescription>This app works only with WhatsApp.</CardDescription>
        </CardHeader>
        <form
          autoComplete="off"
          onSubmit={wrap((event) => {
            event.preventDefault();

            greenApiForm.submit();
          })}
        >
          <CardContent className="mb-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="idInstance" className="uppercase">
                  id Instance
                </FieldLabel>
                <Input
                  id="idInstance"
                  name="idInstance"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  value={idInstanceField.value}
                  onChange={idInstanceField.onChange}
                  onBlur={idInstanceField.onBlur}
                  onFocus={idInstanceField.onFocus}
                  aria-invalid={idInstanceField.error !== undefined}
                />
                <FieldError errors={[{ message: idInstanceField.error }]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="apiTokenInstance" className="uppercase">
                  api Token Instance
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="apiTokenInstance"
                    name="apiTokenInstance"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    style={isApiTokenVisible ? undefined : apiTokenInstanceStyle}
                    value={apiTokenInstanceField.value}
                    onChange={apiTokenInstanceField.onChange}
                    onBlur={apiTokenInstanceField.onBlur}
                    onFocus={apiTokenInstanceField.onFocus}
                    aria-invalid={apiTokenInstanceField.error !== undefined}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      aria-pressed={isApiTokenVisible}
                      onClick={() => {
                        setIsApiTokenVisible((visible) => !visible);
                      }}
                    >
                      {isApiTokenVisible ? <EyeOffIcon /> : <EyeIcon />}
                      <span className="sr-only">
                        {isApiTokenVisible ? "Hide API token" : "Show API token"}
                      </span>
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[{ message: apiTokenInstanceField.error }]} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!isGreenApiFormValid() || isSavingSettings}>
              {isSavingSettings && <Spinner data-icon="inline-start" />}
              Submit
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}, "GreenApiPage");

export default GreenApiPage;
