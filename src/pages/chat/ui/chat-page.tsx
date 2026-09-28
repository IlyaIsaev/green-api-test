import { wrap } from "@reatom/core";
import { reatomComponent } from "@reatom/react";
import { ArrowUpIcon, MessageCircleDashedIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { Bubble, BubbleContent } from "@/shared/components/ui/bubble";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/shared/components/ui/input-group";
import { Message, MessageContent } from "@/shared/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
} from "@/shared/components/ui/message-scroller";
import { Spinner } from "@/shared/components/ui/spinner";
import { messages, newMessage, type ChatMessage } from "../model/chat";

function FollowLiveEdge({
  count,
  lastFrom,
}: {
  count: number;
  lastFrom: ChatMessage["from"] | undefined;
}) {
  const { scrollToEnd } = useMessageScroller();
  const { end } = useMessageScrollerScrollable();
  const atLiveEdgeRef = useRef(true);

  useLayoutEffect(() => {
    atLiveEdgeRef.current = !end;
  }, [end]);

  useLayoutEffect(() => {
    if (count === 0) return;

    if (lastFrom === "outgoing" || atLiveEdgeRef.current) scrollToEnd({ behavior: "auto" });
  }, [count, lastFrom, scrollToEnd]);

  return null;
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const paragraphs = message.text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const align = message.from === "outgoing" ? "end" : "start";
  const variant = message.from === "outgoing" ? "muted" : "default";

  return (
    <MessageScrollerItem messageId={message.id}>
      <Message align={align}>
        <MessageContent>
          <Bubble variant={variant} align={align}>
            {paragraphs.map((paragraph, index) => (
              <BubbleContent key={index}>{paragraph}</BubbleContent>
            ))}
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

export const ChatPage = reatomComponent(() => {
  const chatMessages = messages();
  const isBusy = !messages.send.ready();
  const canSend = newMessage().trim().length > 0 && !isBusy;

  return (
    <main className="mx-auto flex min-h-svh w-full items-center justify-center p-6">
      <MessageScrollerProvider autoScroll>
        <div className="relative flex w-full max-w-2xl flex-col gap-4">
          <Card className="mx-auto h-140 w-full gap-0">
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              {chatMessages.length === 0 ? (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageCircleDashedIcon />
                    </EmptyMedia>
                    <EmptyTitle>No messages yet</EmptyTitle>
                    <EmptyDescription>Type a message and press send</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <MessageScroller>
                  <MessageScrollerViewport>
                    <MessageScrollerContent aria-busy={isBusy} className="p-(--card-spacing)">
                      {chatMessages.map((message) => (
                        <ChatBubble key={message.id} message={message} />
                      ))}
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                  <MessageScrollerButton />
                  <FollowLiveEdge
                    count={chatMessages.length}
                    lastFrom={chatMessages.at(-1)?.from}
                  />
                </MessageScroller>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <form
                className="w-full"
                onSubmit={wrap((event) => {
                  event.preventDefault();

                  if (!canSend) return;

                  messages.send();
                })}
              >
                <InputGroup>
                  <InputGroupTextarea
                    aria-label="Message"
                    placeholder="Type a message"
                    value={newMessage()}
                    onChange={wrap((event) => {
                      newMessage.set(event.currentTarget.value);
                    })}
                    onKeyDown={wrap((event) => {
                      if (event.key !== "Enter" || !event.shiftKey || event.nativeEvent.isComposing)
                        return;

                      event.preventDefault();

                      if (!canSend) return;

                      messages.send();
                    })}
                  />
                  <InputGroupAddon align="block-end" className="pt-1">
                    <InputGroupButton
                      type="submit"
                      variant="default"
                      size="icon-sm"
                      className="ml-auto"
                      disabled={!canSend}
                    >
                      {isBusy ? <Spinner /> : <ArrowUpIcon />}
                      <span className="sr-only">Send</span>
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </form>
            </CardFooter>
          </Card>
        </div>
      </MessageScrollerProvider>
    </main>
  );
}, "ChatPage");

export default ChatPage;
