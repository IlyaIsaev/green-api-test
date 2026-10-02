import {
  abortVar,
  action,
  atom,
  isAbort,
  sleep,
  withAbort,
  withAsync,
  withCallHook,
  withConnectHook,
  wrap,
} from "@reatom/core";
import * as v from "valibot";
import { chatId, phoneNumber } from "@/entities/chat";
import { toast } from "@/shared/components/ui/toast";
import { apiTokenInstance, idInstance } from "@/shared/green-api";
import { deleteNotification } from "../api/delete-notification";
import { receiveNotification } from "../api/receive-notification";
import { sendMessage } from "../api/send-message";

export type ChatMessage = {
  id: string;
  text: string;
  from: "outgoing" | "incoming";
};

const incomingMessageBodySchema = v.object({
  typeWebhook: v.literal("incomingMessageReceived"),
  idMessage: v.string(),
  senderData: v.object({
    chatId: v.string(),
  }),
  messageData: v.object({
    textMessageData: v.optional(v.object({ textMessage: v.string() })),
    extendedTextMessageData: v.optional(v.object({ text: v.string() })),
  }),
});

const addToMessages = (messages: readonly ChatMessage[], message: ChatMessage): ChatMessage[] => [
  ...messages,
  message,
];

const addIncomingToMessages = (messages: ChatMessage[], message: ChatMessage): ChatMessage[] => {
  if (messages.some((existing) => existing.id === message.id)) return messages;

  return addToMessages(messages, message);
};

// Bind on conversation id (senderData.chatId), not sender. Match CheckWhatsapp lid and phone @c.us.
function incomingChatMessage(
  body: unknown,
  currentChatId: string,
  currentPhoneNumber: string,
): ChatMessage | null {
  if (!currentChatId) return null;

  const parsed = v.safeParse(incomingMessageBodySchema, body);

  if (!parsed.success) return null;

  const conversationId = parsed.output.senderData.chatId;
  const isSelectedChat =
    conversationId === currentChatId ||
    (currentPhoneNumber !== "" && conversationId === `${currentPhoneNumber}@c.us`);

  if (!isSelectedChat) return null;

  const text =
    parsed.output.messageData.textMessageData?.textMessage ??
    parsed.output.messageData.extendedTextMessageData?.text ??
    "";
  const trimmed = text.trim();

  if (!trimmed) return null;

  return { id: parsed.output.idMessage, text: trimmed, from: "incoming" };
}

export const newMessage = atom("", "newMessage");

export const messages = atom<ChatMessage[]>([], "messages")
  .extend((target) => {
    const send = action(async () => {
      const message = newMessage().trim();

      if (!message) return;

      const sentMessage = await wrap(
        sendMessage({
          idInstance: idInstance(),
          apiTokenInstance: apiTokenInstance(),
          chatId: chatId().trim(),
          message,
          signal: abortVar.require().signal,
        }),
      );

      target.set((messages) =>
        addToMessages(messages, {
          id: sentMessage.idMessage,
          text: message,
          from: "outgoing",
        }),
      );

      newMessage.set("");
    }, `${target.name}.send`).extend(withAsync(), withAbort("first-in-win"));

    send.onReject.extend(
      withCallHook(({ error }) => {
        if (isAbort(error)) return;

        toast.add({
          type: "error",
          title: error instanceof Error ? error.message : "Could not send message",
        });
      }),
    );

    return { send };
  })
  .extend(
    withConnectHook(async (target) => {
      while (true) {
        try {
          const notification = await wrap(
            receiveNotification({
              idInstance: idInstance(),
              apiTokenInstance: apiTokenInstance(),
              signal: abortVar.require().signal,
            }),
          );

          if (!notification) continue;

          const incoming = incomingChatMessage(
            notification.body,
            chatId().trim(),
            phoneNumber().trim(),
          );

          if (incoming) {
            target.set((messages) => addIncomingToMessages(messages, incoming));
          }

          await wrap(
            deleteNotification({
              idInstance: idInstance(),
              apiTokenInstance: apiTokenInstance(),
              receiptId: notification.receiptId,
              signal: abortVar.require().signal,
            }),
          );
        } catch (error) {
          if (isAbort(error)) return;

          toast.add({
            type: "error",
            title: error instanceof Error ? error.message : "Could not receive message",
          });

          await wrap(sleep(5_000));
        }
      }
    }),
  );

export const resetMessages = action(() => {
  messages.set([]);
}, "resetMessages");
