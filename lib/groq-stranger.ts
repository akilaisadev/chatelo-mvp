// Groq-powered ephemeral AI Stranger.
// Completely server-side. Zero chat storage.
// Generates authentic, low-latency casual Omegle responses.

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "qwen/qwen3.8-27b";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const FALLBACK_OPENERS = [
  "hey what are you up to?",
  "yo! how is your day going?",
  "hey :) where u from?",
  "sup! bored out of my mind haha",
  "hey! what's good?",
];

const FALLBACK_REPLIES = [
  "haha fair enough",
  "oh damn really? tell me more",
  "same honestly! been a long week",
  "no way haha, that's wild",
  "100%, totally agree",
  "nice, what else are you into?",
];

export async function generateGroqReply(
  history: ChatTurn[],
  interests: string[] = []
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
  }

  const interestContext =
    interests.length > 0
      ? `You both matched because you are interested in: ${interests.join(", ")}.`
      : "";

  const systemPrompt = `You are a real 21-year-old on an Omegle 1-on-1 stranger chat.
${interestContext}
CONTEXT AWARENESS & VIBE RULES:
- High conversational memory: remember everything the stranger said earlier (where they are from, past jokes, what they are doing, their vibe).
- Natural dynamic length: short snappy answers (even 1-3 words like "cali", "lazy haha", "nah", "fr?", "just scrolling tiktok", "fair") are great when bantering, teasing, or answering quick questions.
- Don't force long paragraphs, but stay deeply connected to the context of the chat.
- Match the stranger's energy: if they tease you, banter back playfully; if they're curious, give quick genuine details.
- Always text in lowercase with natural texting slang (u, tbh, lol, haha, idk, nah, rn).
- NEVER say you are an AI, bot, or assistant. No markdown or formal bullet points.`;

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-20), // Retain full conversation context
        ],
        max_tokens: 75,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (reply) {
      // Remove any quotes or assistant artifacts
      return reply.replace(/^["']|["']$/g, "").toLowerCase();
    }
  } catch {
    // Network or rate limit fallback
  }

  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
}

export async function generateGroqOpener(interests: string[] = []): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return FALLBACK_OPENERS[Math.floor(Math.random() * FALLBACK_OPENERS.length)];
  }

  const interestContext =
    interests.length > 0
      ? `Start a conversation casually mentioning that you both like ${interests[0]}.`
      : "Send a super casual 1-sentence greeting.";

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly, witty 21yo on an Omegle chat. Send a natural, engaging opening message (1 to 2 sentences) in lowercase texting style. Never say you are an AI.",
          },
          { role: "user", content: interestContext },
        ],
        max_tokens: 60,
        temperature: 0.9,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        return text.replace(/^["']|["']$/g, "").toLowerCase();
      }
    }
  } catch {}

  return FALLBACK_OPENERS[Math.floor(Math.random() * FALLBACK_OPENERS.length)];
}
