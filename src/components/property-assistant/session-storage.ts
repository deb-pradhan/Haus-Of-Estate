import type { UIMessage } from "ai";

const STORAGE_VERSION = "v1";
export const ASSISTANT_DRAFT_KEY = `haus:property-assistant:${STORAGE_VERSION}:draft`;
export const ASSISTANT_MESSAGES_KEY = `haus:property-assistant:${STORAGE_VERSION}:messages`;
export const ASSISTANT_REOPEN_KEY = `haus:property-assistant:${STORAGE_VERSION}:reopen`;
export const ASSISTANT_OWNER_KEY = `haus:property-assistant:${STORAGE_VERSION}:owner`;

const MAX_DRAFT_LENGTH = 1_000;
const MAX_MESSAGE_TEXT_LENGTH = 4_000;
const MAX_REQUEST_MESSAGE_TEXT_LENGTH = 1_600;
const MAX_STORED_MESSAGES = 12;
const MAX_REQUEST_MESSAGES = 7;
const MAX_STORED_BYTES = 80_000;

function storageAvailable() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export function readAssistantDraft() {
  if (!storageAvailable()) return "";
  try {
    return (window.sessionStorage.getItem(ASSISTANT_DRAFT_KEY) || "").slice(
      0,
      MAX_DRAFT_LENGTH,
    );
  } catch {
    return "";
  }
}

export function writeAssistantDraft(value: string) {
  if (!storageAvailable()) return;
  try {
    const bounded = value.slice(0, MAX_DRAFT_LENGTH);
    if (bounded) window.sessionStorage.setItem(ASSISTANT_DRAFT_KEY, bounded);
    else window.sessionStorage.removeItem(ASSISTANT_DRAFT_KEY);
  } catch {
    // The assistant still works when browser storage is unavailable.
  }
}

export function markAssistantForReopen() {
  if (!storageAvailable()) return;
  try {
    window.sessionStorage.setItem(ASSISTANT_REOPEN_KEY, "1");
  } catch {
    // Authentication can continue even when browser storage is unavailable.
  }
}

export function consumeAssistantReopenMarker() {
  if (!storageAvailable()) return false;
  try {
    const reopen = window.sessionStorage.getItem(ASSISTANT_REOPEN_KEY) === "1";
    window.sessionStorage.removeItem(ASSISTANT_REOPEN_KEY);
    return reopen;
  } catch {
    return false;
  }
}

export function plainTextAssistantMessages(messages: UIMessage[]): UIMessage[] {
  const textOnly = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .flatMap((message, messageIndex) => {
      const text = message.parts
        .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
        .map((part) => part.text)
        .join("")
        .trim()
        .slice(0, MAX_MESSAGE_TEXT_LENGTH);
      if (!text) return [];
      return [
        {
          id: /^[A-Za-z0-9_-]{1,128}$/.test(message.id)
            ? message.id
            : `assistant-message-${messageIndex}`,
          role: message.role,
          parts: [{ type: "text" as const, text }],
        },
      ];
    });

  const alternating: UIMessage[] = [];
  for (const message of textOnly) {
    const previous = alternating.at(-1);
    if (previous?.role === message.role) {
      const previousText = previous.parts[0];
      const nextText = message.parts[0];
      if (previousText?.type === "text" && nextText?.type === "text") {
        alternating[alternating.length - 1] = {
          ...message,
          parts: [
            {
              type: "text",
              text: `${previousText.text}\n\n${nextText.text}`.slice(
                -MAX_MESSAGE_TEXT_LENGTH,
              ),
            },
          ],
        };
      }
      continue;
    }
    alternating.push(message);
  }

  return alternating.slice(-MAX_STORED_MESSAGES);
}

export function prepareAssistantRequestMessages(
  messages: UIMessage[],
): UIMessage[] {
  const bounded = plainTextAssistantMessages(messages);
  while (bounded.at(-1)?.role === "assistant") bounded.pop();
  while (bounded[0]?.role === "assistant") bounded.shift();

  const requestMessages = bounded.slice(-MAX_REQUEST_MESSAGES);
  while (requestMessages[0]?.role === "assistant") requestMessages.shift();

  return requestMessages.map((message) => ({
    ...message,
    parts: message.parts.flatMap((part) =>
      part.type === "text"
        ? [
            {
              type: "text" as const,
              text: part.text.slice(0, MAX_REQUEST_MESSAGE_TEXT_LENGTH),
            },
          ]
        : [],
    ),
  }));
}

export function writeAssistantMessages(messages: UIMessage[]) {
  if (!storageAvailable()) return;
  try {
    const plainText = plainTextAssistantMessages(messages);
    if (plainText.length === 0) {
      window.sessionStorage.removeItem(ASSISTANT_MESSAGES_KEY);
      return;
    }
    const serialised = JSON.stringify(plainText);
    if (serialised.length > MAX_STORED_BYTES) return;
    window.sessionStorage.setItem(ASSISTANT_MESSAGES_KEY, serialised);
  } catch {
    // The assistant still works when browser storage is unavailable.
  }
}

export function readAssistantMessages(): UIMessage[] {
  if (!storageAvailable()) return [];
  try {
    const raw = window.sessionStorage.getItem(ASSISTANT_MESSAGES_KEY);
    if (!raw || raw.length > MAX_STORED_BYTES) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const candidates = parsed.flatMap((message): UIMessage[] => {
      if (typeof message !== "object" || message === null) return [];
      const id = Reflect.get(message, "id");
      const role = Reflect.get(message, "role");
      const parts = Reflect.get(message, "parts");
      if (
        typeof id !== "string" ||
        id.length === 0 ||
        id.length > 128 ||
        (role !== "user" && role !== "assistant") ||
        !Array.isArray(parts)
      ) {
        return [];
      }

      const text = parts
        .flatMap((part): string[] => {
          if (typeof part !== "object" || part === null) return [];
          if (Reflect.get(part, "type") !== "text") return [];
          const value = Reflect.get(part, "text");
          return typeof value === "string" ? [value] : [];
        })
        .join("")
        .trim()
        .slice(0, MAX_MESSAGE_TEXT_LENGTH);
      if (!text) return [];
      return [{ id, role, parts: [{ type: "text", text }] }];
    });

    return candidates.slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function validOwnerId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 191 &&
    /^[A-Za-z0-9._:-]+$/.test(value)
  );
}

export function readAssistantOwner(): string | null {
  if (!storageAvailable()) return null;
  try {
    const owner = window.sessionStorage.getItem(ASSISTANT_OWNER_KEY);
    return validOwnerId(owner) ? owner : null;
  } catch {
    return null;
  }
}

function writeAssistantOwner(userId: string) {
  if (!storageAvailable() || !validOwnerId(userId)) return;
  window.sessionStorage.setItem(ASSISTANT_OWNER_KEY, userId);
}

function removeStoredAssistantConversation({
  clearDraft,
  clearOwner,
}: {
  clearDraft: boolean;
  clearOwner: boolean;
}) {
  if (!storageAvailable()) return;
  try {
    window.sessionStorage.removeItem(ASSISTANT_MESSAGES_KEY);
    if (clearDraft) window.sessionStorage.removeItem(ASSISTANT_DRAFT_KEY);
    if (clearOwner) window.sessionStorage.removeItem(ASSISTANT_OWNER_KEY);
  } catch {
    // Account isolation is retried when the panel mounts again.
  }
}

export function hydrateAssistantMessagesForUser(userId: string): UIMessage[] {
  if (!validOwnerId(userId)) return [];
  const storedOwner = readAssistantOwner();
  if (storedOwner !== userId) {
    removeStoredAssistantConversation({
      clearDraft: storedOwner !== null,
      clearOwner: true,
    });
    try {
      writeAssistantOwner(userId);
    } catch {
      return [];
    }
    return [];
  }
  return readAssistantMessages();
}

export function clearAssistantForSignedOutUser() {
  const hadAuthenticatedOwner = readAssistantOwner() !== null;
  removeStoredAssistantConversation({
    clearDraft: hadAuthenticatedOwner,
    clearOwner: true,
  });
}

export function clearAssistantConversation() {
  removeStoredAssistantConversation({ clearDraft: true, clearOwner: false });
}

export function clearAssistantSession() {
  removeStoredAssistantConversation({ clearDraft: true, clearOwner: true });
}
