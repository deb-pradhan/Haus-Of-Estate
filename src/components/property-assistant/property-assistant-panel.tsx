"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CircleStop,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthSession } from "@/lib/auth/client";
import { useLeadModals } from "@/components/lead-modal/modal-context";
import type { BuyerInitialBrief } from "@/components/lead-modal/buyer-modal";
import type { PropertyAssistantUIMessage } from "@/lib/property-assistant/contracts";
import type { AssistantRouteScope } from "./analytics";
import { emitAssistantAnalytics } from "./analytics";
import {
  AssistantKnowledgeResults,
  AssistantPropertyResults,
  AssistantToolLoading,
  readRecognizedFilters,
  type AssistantPropertyResult,
} from "./result-parts";
import {
  buyerBriefFromProperty,
  buyerBriefFromRecognizedFilters,
} from "./handoff";
import {
  clearAssistantConversation,
  clearAssistantForSignedOutUser,
  hydrateAssistantMessagesForUser,
  markAssistantForReopen,
  prepareAssistantRequestMessages,
  readAssistantDraft,
  writeAssistantDraft,
  writeAssistantMessages,
} from "./session-storage";

const QUICK_PROMPTS = [
  "Show me ready two-bedroom homes",
  "What off-plan apartments are available?",
  "What should I know before buying abroad?",
  "How can Haus help me sell or let?",
] as const;

const transport = new DefaultChatTransport<PropertyAssistantUIMessage>({
  api: "/api/property-assistant",
  prepareSendMessagesRequest: ({ messages }) => ({
    body: {
      messages: prepareAssistantRequestMessages(messages as UIMessage[]),
    },
  }),
});

export function latestRecognizedSearchBrief(
  messages: PropertyAssistantUIMessage[],
) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex];
    for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = message.parts[partIndex];
      if (part.type === "tool-searchPublishedProperties" && part.state === "output-available") {
        const brief = buyerBriefFromRecognizedFilters(
          readRecognizedFilters(part.output),
        );
        if (brief) return brief;
      }
    }
  }
  return undefined;
}

function ToolPart({
  part,
  routeScope,
  onPropertyAdviser,
}: {
  part: PropertyAssistantUIMessage["parts"][number];
  routeScope: AssistantRouteScope;
  onPropertyAdviser: (property: AssistantPropertyResult) => void;
}) {
  if (part.type === "tool-searchPublishedProperties") {
    if (part.state === "output-available") {
      return (
        <AssistantPropertyResults
          output={part.output}
          routeScope={routeScope}
          onAdviser={onPropertyAdviser}
        />
      );
    }
    if (part.state === "input-streaming" || part.state === "input-available") {
      return <AssistantToolLoading label="Searching current Haus listings..." />;
    }
    if (part.state === "output-error" || part.state === "output-denied") {
      return <p className="text-xs text-muted-foreground">Property results are unavailable right now.</p>;
    }
  }

  if (part.type === "tool-getPublishedProperty") {
    if (part.state === "output-available") {
      return (
        <AssistantPropertyResults
          output={part.output}
          routeScope={routeScope}
          onAdviser={onPropertyAdviser}
        />
      );
    }
    if (part.state === "input-streaming" || part.state === "input-available") {
      return <AssistantToolLoading label="Checking the published property details..." />;
    }
    if (part.state === "output-error" || part.state === "output-denied") {
      return <p className="text-xs text-muted-foreground">Those property details are unavailable right now.</p>;
    }
  }

  if (part.type === "tool-searchApprovedKnowledge") {
    if (part.state === "output-available") {
      return <AssistantKnowledgeResults output={part.output} />;
    }
    if (part.state === "input-streaming" || part.state === "input-available") {
      return <AssistantToolLoading label="Checking approved Haus guidance..." />;
    }
    if (part.state === "output-error" || part.state === "output-denied") {
      return <p className="text-xs text-muted-foreground">Haus guidance is unavailable right now.</p>;
    }
  }

  return null;
}

export function PropertyAssistantPanel({
  open,
  onOpenChange,
  prefill,
  routeScope,
  launcherRef,
  returnFocusId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill: { value: string; revision: number } | null;
  routeScope: AssistantRouteScope;
  launcherRef: RefObject<HTMLButtonElement | null>;
  returnFocusId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useAuthSession();
  const { openBuyerWithBrief } = useLeadModals();
  const [input, setInput] = useState(
    () => prefill?.value ?? readAssistantDraft(),
  );
  const [hydratedOwnerId, setHydratedOwnerId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    stop,
    status,
    error,
    clearError,
  } = useChat<PropertyAssistantUIMessage>({
    id: "haus-property-assistant-v1",
    messages: [],
    transport,
  });

  const busy = status === "submitted" || status === "streaming";
  const userId =
    typeof session?.user?.id === "string" ? session.user.id : undefined;
  const isAuthenticated = Boolean(userId);
  const assistantSessionReady = Boolean(
    userId && hydratedOwnerId === userId,
  );
  const visibleMessages = useMemo(
    () => (assistantSessionReady ? messages : []),
    [assistantSessionReady, messages],
  );
  const recognizedSearchBrief = useMemo(
    () => latestRecognizedSearchBrief(visibleMessages),
    [visibleMessages],
  );

  useEffect(() => {
    if (authStatus === "loading") return;
    const timer = window.setTimeout(() => {
      if (!userId) {
        clearAssistantForSignedOutUser();
        setMessages([]);
        setHydratedOwnerId(null);
        return;
      }
      setMessages(
        hydrateAssistantMessagesForUser(
          userId,
        ) as PropertyAssistantUIMessage[],
      );
      setHydratedOwnerId(userId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authStatus, setMessages, userId]);

  useEffect(() => {
    if (!assistantSessionReady) return;
    writeAssistantMessages(messages as UIMessage[]);
  }, [assistantSessionReady, messages]);

  useEffect(() => {
    const viewport = transcriptRef.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, status]);

  function updateInput(value: string) {
    const bounded = value.slice(0, 1_000);
    setInput(bounded);
    writeAssistantDraft(bounded);
  }

  function continueToLogin() {
    writeAssistantDraft(input.trim());
    markAssistantForReopen();
    const query = searchParams.toString();
    const returnTo = `${pathname}${query ? `?${query}` : ""}`;
    router.push(`/auth/login?${new URLSearchParams({ returnTo }).toString()}`);
  }

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || busy || authStatus === "loading") return;
    if (!isAuthenticated) {
      continueToLogin();
      return;
    }
    if (!assistantSessionReady) return;
    clearError();
    updateInput("");
    void sendMessage({ text: question });
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function clearConversation() {
    if (busy) void stop();
    setMessages([]);
    setInput("");
    clearError();
    clearAssistantConversation();
    inputRef.current?.focus();
  }

  function closePanel(restoreFocus: boolean) {
    onOpenChange(false);
    if (!restoreFocus) return;
    window.setTimeout(() => {
      const target = document.getElementById(returnFocusId);
      (target instanceof HTMLElement ? target : launcherRef.current)?.focus();
    }, 0);
  }

  function handoffToAdviser(brief?: BuyerInitialBrief) {
    emitAssistantAnalytics({
      name: "property_assistant_adviser_handoff",
      routeScope,
    });
    closePanel(false);
    window.setTimeout(
      () => openBuyerWithBrief(brief),
      0,
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) onOpenChange(true);
        else closePanel(true);
      }}
    >
      <SheetContent
        side="right"
        className="h-dvh w-full max-w-none gap-0 border-l border-border bg-background p-0 sm:w-[29rem] sm:max-w-[calc(100vw-1rem)]"
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <SheetHeader className="shrink-0 border-b border-border bg-estate-700 px-5 py-4 pr-14 text-left text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <SheetTitle className="font-serif text-xl font-medium text-white">
                Haus Property Assistant
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs text-white/70">
                AI-assisted property discovery
              </SheetDescription>
            </span>
          </div>
          <SheetClose
            className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            aria-label="Close Haus Property Assistant"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </SheetClose>
        </SheetHeader>

        <div className="shrink-0 border-b border-border bg-gold-400/10 px-5 py-3">
          <p className="flex gap-2 text-xs leading-relaxed text-estate-800">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" aria-hidden="true" />
            Responses are AI-generated and can be wrong. Prices and availability must be confirmed with an adviser.
          </p>
        </div>

        <div
          ref={transcriptRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5"
          role="log"
          aria-relevant="additions text"
          aria-label="Assistant conversation"
        >
          {visibleMessages.length === 0 ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="font-serif text-lg font-medium text-estate-700">
                  What would you like to explore?
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Ask about current Haus listings or approved property guidance.
                </p>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      updateInput(prompt);
                      inputRef.current?.focus();
                    }}
                    className="min-h-11 rounded-full border border-estate-700/25 bg-surface px-3 py-2 text-left text-xs font-medium leading-snug text-estate-700 transition-colors hover:bg-estate-700/5"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div className="max-w-[92%] space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      {message.role === "user" ? (
                        <><UserRound className="h-3 w-3" /> You</>
                      ) : (
                        <><Sparkles className="h-3 w-3 text-gold-600" /> Ask Haus</>
                      )}
                    </div>
                    {message.parts.map((part, index) => {
                      if (part.type === "text" && part.text.trim()) {
                        return (
                          <p
                            key={`${message.id}-text-${index}`}
                            className={
                              message.role === "user"
                                ? "whitespace-pre-wrap rounded-lg rounded-tr-sm bg-estate-700 px-4 py-3 text-sm leading-relaxed text-white"
                                : "whitespace-pre-wrap rounded-lg rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground"
                            }
                          >
                            {part.text}
                          </p>
                        );
                      }
                      return (
                        <ToolPart
                          key={`${message.id}-part-${index}`}
                          part={part}
                          routeScope={routeScope}
                          onPropertyAdviser={(property) =>
                            handoffToAdviser(buyerBriefFromProperty(property))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ask Haus is working...
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3">
                  <p className="text-sm text-foreground">
                    The assistant could not complete that answer. Your conversation remains on this device.
                  </p>
                  <button
                    type="button"
                    onClick={() => void regenerate()}
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-estate-700 underline-offset-4 hover:underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {visibleMessages.length > 0 && (
            <div className="mb-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handoffToAdviser(recognizedSearchBrief)}
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-estate-700 underline-offset-4 hover:underline"
              >
                Continue with an adviser <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={clearConversation}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear assistant conversation"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <label htmlFor="haus-assistant-input" className="sr-only">
              Ask about Haus properties
            </label>
            <textarea
              ref={inputRef}
              id="haus-assistant-input"
              value={input}
              onChange={(event) => updateInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              rows={2}
              disabled={busy}
              placeholder="Ask about current properties..."
              className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-estate-700 focus:ring-2 focus:ring-estate-700/15 disabled:opacity-60"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => void stop()}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border text-estate-700 hover:bg-muted"
                aria-label="Stop generating"
              >
                <CircleStop className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
              disabled={
                !input.trim() ||
                authStatus === "loading" ||
                (isAuthenticated && !assistantSessionReady)
              }
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-estate-700 text-white hover:bg-estate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={isAuthenticated ? "Send question" : "Sign in to ask this question"}
              >
                <Send className="h-5 w-5" />
              </button>
            )}
          </form>
          {!isAuthenticated && authStatus !== "loading" && (
            <p className="mt-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={continueToLogin}
                className="font-semibold text-estate-700 underline underline-offset-2"
              >
                Sign in
              </button>{" "}
              before the assistant generates an answer. Your draft will stay here.
            </p>
          )}
          <p className="mt-2 flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Do not enter bank, payment, passport or other sensitive information. For personal advice, contact a qualified adviser. <Link href="/contact" className="font-medium text-estate-700 underline">Contact Haus</Link>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
