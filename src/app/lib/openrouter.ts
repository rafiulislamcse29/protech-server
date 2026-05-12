import { config } from "../config/index.js";
import { AppError } from "../errorHelpers/index.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Core OpenRouter chat completion call.
 */
export const chatCompletion = async (
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {},
): Promise<{ content: string; usage: OpenRouterResponse["usage"] }> => {
  if (!config.openRouter.apiKey) {
    throw new AppError("OpenRouter API key is not configured", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000); // 90 seconds

  let response: globalThis.Response;
  try {
    response = await fetch(
      `${config.openRouter.baseUrl}/chat/completions`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.openRouter.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": config.openRouter.siteUrl,
          "X-Title": config.openRouter.siteName,
        },
        body: JSON.stringify({
          model: config.openRouter.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1500,
          transforms: ["middle-out"],
        }),
      },
    );
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new AppError("AI request timed out after 60 seconds. Please try again.", 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const error = await response.text();
    throw new AppError(
      `OpenRouter API error: ${response.status} — ${error}`,
      502,
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices[0]?.message?.content ?? "";

  return { content, usage: data.usage };
};

/**
 * Robust wrapper that handles chat completion, JSON parsing, and automatic retries.
 */
export const getChatResponse = async <T>(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; retries?: number } = {},
): Promise<{ data: T; usage: OpenRouterResponse["usage"] }> => {
  const maxRetries = options.retries ?? 2;
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const { content, usage } = await chatCompletion(messages, options);
      const data = parseJsonFromAI<T>(content);
      return { data, usage };
    } catch (error) {
      lastError = error;
      console.warn(
        `AI Attempt ${i + 1} failed. ${i < maxRetries ? "Retrying..." : "All attempts exhausted."
        }`,
        error instanceof Error ? error.message : error,
      );

      if (i < maxRetries) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, i)),
        );
      }
    }
  }

  throw (
    lastError ||
    new AppError(
      "Failed to get a valid response from AI after multiple attempts.",
      502,
    )
  );
};

/**
 * Parse JSON from AI response — strips think blocks, markdown fences, and extracts the JSON object/array.
 */
export const parseJsonFromAI = <T>(raw: string): T => {
  if (!raw || raw.trim() === "") {
    throw new AppError("AI returned an empty response. Please try again.", 502);
  }

  let cleaned = raw.trim();

  // Strip <think>...</think> blocks leaked by reasoning models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Strip markdown code fences
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Extract the first complete JSON object or array
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    // Attempt to repair truncated JSON by closing open structures
    try {
      const repaired = repairTruncatedJson(cleaned);
      return JSON.parse(repaired) as T;
    } catch {
      // repair also failed — log and throw original error
    }

    console.error("--- AI JSON Parse Error ---");
    console.error("Raw content:", raw);
    console.error("Cleaned content:", cleaned);
    console.error("Error:", error);
    console.error("---------------------------");

    throw new AppError(
      `AI returned invalid JSON structure. Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
      502,
    );
  }
};

/**
 * Best-effort repair of truncated JSON by closing open strings, arrays, and objects.
 */
const repairTruncatedJson = (s: string): string => {
  let result = s.trimEnd();

  // Remove trailing comma before closing
  result = result.replace(/,\s*$/, "");

  // Count open braces and brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of result) {
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    else if (ch === "}") openBraces--;
    else if (ch === "[") openBrackets++;
    else if (ch === "]") openBrackets--;
  }

  // If we're inside an unterminated string, close it
  if (inString) result += '"';

  // Remove trailing comma again after string close
  result = result.replace(/,\s*$/, "");

  // Close open arrays and objects
  result += "]".repeat(Math.max(0, openBrackets));
  result += "}".repeat(Math.max(0, openBraces));

  return result;
};
