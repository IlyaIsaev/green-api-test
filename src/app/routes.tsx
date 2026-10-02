import { reatomRoute, urlAtom } from "@reatom/core";
import { Fragment, lazy, Suspense } from "react";
import { chatId } from "@/entities/chat";
import { Spinner } from "@/shared/components/ui/spinner";
import { Toaster } from "@/shared/components/ui/toast";
import { apiTokenInstance, idInstance } from "@/shared/green-api";

const GreenApiPage = lazy(() => import("@/pages/green-api/ui/green-api-page"));
const PhoneNumberPage = lazy(() => import("@/pages/phone-number/ui/phone-number-page"));
const ChatPage = lazy(() => import("@/pages/chat/ui/chat-page"));

const PageFallback = () => (
  <div className="flex min-h-svh items-center justify-center bg-background">
    <Spinner className="size-8" />
  </div>
);

export const layoutRoute = reatomRoute({
  layout: true,
  render(self) {
    return (
      <div>
        <Suspense fallback={<PageFallback />}>
          {self.outlet().map((child, index) => (
            <Fragment key={index}>{child}</Fragment>
          ))}
        </Suspense>
        <Toaster />
      </div>
    );
  },
});

const hasGreenApiCredentials = (): boolean =>
  idInstance().trim() !== "" && apiTokenInstance().trim() !== "";

export const greenApiRoute = layoutRoute.reatomRoute({
  path: "green-api",
  render: () => <GreenApiPage />,
});

export const phoneNumberRoute = layoutRoute.reatomRoute({
  path: "phone-number",
  params() {
    if (!hasGreenApiCredentials()) {
      greenApiRoute.go(undefined, true);

      return null;
    }

    return {};
  },
  render: () => <PhoneNumberPage />,
});

export const chatRoute = layoutRoute.reatomRoute({
  path: "chat",
  params() {
    if (!hasGreenApiCredentials() || chatId().trim() === "") {
      greenApiRoute.go(undefined, true);

      return null;
    }

    return {};
  },
  render: () => <ChatPage />,
});

export function redirectToGreenApiOnLoad(): void {
  if (urlAtom().pathname === "/green-api") return;

  greenApiRoute.go(undefined, true);
}
