import "server-only";

import { stepCountIs, ToolLoopAgent } from "ai";
import type {
  AssistantRequest,
  PropertyAssistantUIMessage,
} from "@/lib/property-assistant/contracts";
import type { PropertyAssistantConfig } from "@/lib/property-assistant/config";
import { PropertyAssistantConfigurationError } from "@/lib/property-assistant/config";
import { PROPERTY_ASSISTANT_POLICY } from "@/lib/property-assistant/policy";
import { propertyAssistantTools } from "@/lib/property-assistant/tools";

export class PropertyAssistantInputError extends Error {
  constructor() {
    super("Invalid property assistant request");
    this.name = "PropertyAssistantInputError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizePropertyAssistantMessages(
  request: AssistantRequest,
  config: PropertyAssistantConfig,
): PropertyAssistantUIMessage[] {
  if (
    request.messages.length === 0 ||
    request.messages.length > config.maxMessages
  ) {
    throw new PropertyAssistantInputError();
  }

  let totalCharacters = 0;
  const messages: PropertyAssistantUIMessage[] = [];

  for (const [messageIndex, message] of request.messages.entries()) {
    if (messageIndex > 0 && request.messages[messageIndex - 1]?.role === message.role) {
      throw new PropertyAssistantInputError();
    }

    const textParts: Array<{ type: "text"; text: string }> = [];
    for (const part of message.parts) {
      if (!isRecord(part) || part.type !== "text") {
        throw new PropertyAssistantInputError();
      }
      const keys = Object.keys(part);
      if (
        keys.some(
          (key) => key !== "type" && key !== "text" && key !== "state",
        ) ||
        (part.state !== undefined &&
          part.state !== "done" &&
          part.state !== "streaming") ||
        typeof part.text !== "string"
      ) {
        throw new PropertyAssistantInputError();
      }

      const text = part.text.trim();
      if (
        text.length === 0 ||
        text.length > config.maxTextPartCharacters
      ) {
        throw new PropertyAssistantInputError();
      }
      totalCharacters += text.length;
      textParts.push({ type: "text", text });
    }

    if (textParts.length === 0) throw new PropertyAssistantInputError();
    messages.push({ id: message.id, role: message.role, parts: textParts });
  }

  const estimatedInputTokens =
    Math.ceil(totalCharacters / 4) + messages.length * 16;
  if (
    totalCharacters > config.maxInputCharacters ||
    estimatedInputTokens > config.maxEstimatedInputTokens ||
    messages[0]?.role !== "user" ||
    messages.at(-1)?.role !== "user"
  ) {
    throw new PropertyAssistantInputError();
  }

  return messages;
}

function withToolCallGuard<T extends object>(
  assistantTool: T,
  state: { calls: number },
  limit: number,
): T {
  const execute = Reflect.get(assistantTool, "execute");
  if (typeof execute !== "function") {
    throw new PropertyAssistantConfigurationError();
  }

  return {
    ...assistantTool,
    execute(...args: unknown[]) {
      state.calls += 1;
      if (state.calls > limit) {
        throw new Error("Property assistant tool limit reached");
      }
      return Reflect.apply(execute, assistantTool, args);
    },
  } as T;
}

export function createPropertyAssistantAgent(config: PropertyAssistantConfig) {
  const toolState = { calls: 0 };
  const tools = {
    searchPublishedProperties: withToolCallGuard(
      propertyAssistantTools.searchPublishedProperties,
      toolState,
      config.maxToolCalls,
    ),
    getPublishedProperty: withToolCallGuard(
      propertyAssistantTools.getPublishedProperty,
      toolState,
      config.maxToolCalls,
    ),
    searchApprovedKnowledge: withToolCallGuard(
      propertyAssistantTools.searchApprovedKnowledge,
      toolState,
      config.maxToolCalls,
    ),
  };

  return new ToolLoopAgent({
    id: "haus-property-assistant-v1",
    model: config.model,
    instructions: PROPERTY_ASSISTANT_POLICY,
    tools,
    activeTools: [
      "searchPublishedProperties",
      "getPublishedProperty",
      "searchApprovedKnowledge",
    ],
    toolOrder: [
      "searchPublishedProperties",
      "getPublishedProperty",
      "searchApprovedKnowledge",
    ],
    toolChoice: "auto",
    maxRetries: 0,
    maxOutputTokens: config.maxOutputTokens,
    stopWhen: [
      stepCountIs(config.maxSteps),
      ({ steps }) =>
        steps.reduce(
          (total, step) => total + (step.toolCalls?.length ?? 0),
          0,
        ) >= config.maxToolCalls,
    ],
  });
}

export type { PropertyAssistantUIMessage };
