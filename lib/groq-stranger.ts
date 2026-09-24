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

  const systemPrompt = `You are a real, authentic 21-year-old college student chatting anonymously 1-on-1 with a stranger on an Omegle clone.
${interestContext}
Tone rules:
- Do NOT be a dry texter! Never give lazy 1-word replies like "good", "cali", "lazy", or "idk".
- Write naturally in lowercase like a real person texting on their phone (use casual phrasing like 'u', 'tbh', 'lol', 'haha', 'idk').
- Keep replies to 1-2 lively, engaging sentences (around 10 to 25 words).
- Always keep the conversation flowing: react to what they said, share a quick detail or opinion, or ask a fun follow-up question.
- If asked "m or f", "asl", or where you are from, give a fun natural reply (e.g. "21 m from cali, what about u?", "just chillin in my dorm room tbh").
- NEVER say you are an AI, a language model, or a bot. No formal greetings, no bullet points, no markdown.`;

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
          ...history.slice(-8), // Keep only recent turns for speed & context
        ],
        max_tokens: 80,
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
