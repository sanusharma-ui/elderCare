import { AppError } from "@/lib/errors";
import { enforceRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { GoogleGenAI } from "@google/genai";

/**
 * Checks and increments rate limiting for AI calls per doctor.
 * Maximum 20 calls per doctor per hour.
 */
export function checkAiRateLimit(doctorId: string): void {
  enforceRateLimit(
    `ai:doctor:${doctorId}`,
    RATE_LIMIT_PRESETS.AI_CALLS.limit,
    RATE_LIMIT_PRESETS.AI_CALLS.windowSeconds,
    "AI rate limit exceeded (maximum 20 requests per doctor per hour). Please try again later."
  );
}

/**
 * Executes a Gemini prompt with a 15s timeout and 1 automatic retry.
 */
export async function callGemini(params: {
  systemInstruction?: string;
  contents: string | Array<any>;
  temperature?: number;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null; // Signals fallback to caller
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  const attemptCall = async () => {
    // 15 second timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), 15000)
    );

    const generatePromise = (async () => {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0.2,
        },
      });
      return response.text ?? null;
    })();

    return await Promise.race([generatePromise, timeoutPromise]);
  };

  try {
    return await attemptCall();
  } catch (firstErr) {
    console.warn("First Gemini attempt failed, retrying once...", firstErr);
    try {
      return await attemptCall();
    } catch (secondErr) {
      console.error("Gemini invocation failed after retry:", secondErr);
      return null; // Return null so callers gracefully serve fallback content
    }
  }
}
