const provider = process.env.AI_PROVIDER || "gemini";

// Try models in order until one responds — handles quota/deprecation gracefully
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];

export async function chatCompletion(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string
): Promise<string> {
  if (provider === "gemini") {
    return geminiChat(messages, systemPrompt);
  }
  return claudeChat(messages, systemPrompt);
}

export async function analyzeImage(
  base64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  if (provider === "gemini") {
    return geminiVision(base64, mimeType, prompt);
  }
  return claudeVision(base64, mimeType, prompt);
}

async function geminiRequest(model: string, body: object): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${model} HTTP ${res.status}: ${err}`);
  }

  const data = await res.json();

  // Surface blocked/safety errors
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini ${model} returned empty response`);
  return text;
}

async function geminiChat(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  };

  let lastErr: Error | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      return await geminiRequest(model, body);
    } catch (err) {
      lastErr = err as Error;
      console.warn(`[ai] ${model} failed:`, (err as Error).message);
    }
  }
  throw lastErr ?? new Error("All Gemini models failed");
}

async function geminiVision(
  base64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: 1024 },
  };

  let lastErr: Error | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      return await geminiRequest(model, body);
    } catch (err) {
      lastErr = err as Error;
      console.warn(`[ai] vision ${model} failed:`, (err as Error).message);
    }
  }
  throw lastErr ?? new Error("All Gemini vision models failed");
}

async function claudeChat(
  messages: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude HTTP ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Claude returned empty response");
  return text;
}

async function claudeVision(
  base64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude vision HTTP ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Claude vision returned empty response");
  return text;
}
