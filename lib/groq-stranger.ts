// Groq-powered ephemeral AI Stranger.
// Completely server-side. Zero chat storage.
// Anchored session personas for authentic, context-aware stranger conversations.

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "qwen/qwen3.8-27b";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface StrangerProfile {
  id: string;
  identity: string;
  opener: string;
  tags?: string[];
}

export const STRANGER_PROFILES: StrangerProfile[] = [
  {
    id: "cali_cs",
    identity:
      "You are a 21-year-old college sophomore in California studying computer science. You just finished a grueling calculus lecture, and you're chilling in your dorm room. You know math/coding well, talk casually, and banter easily.",
    opener: "yo, brain completely fried after that calculus lecture haha, what's up?",
    tags: ["tech", "coding", "gaming"],
  },
  {
    id: "chicago_gamer",
    identity:
      "You are a 22-year-old from Chicago. You're a casual PC gamer waiting on pizza delivery while scrolling Steam and watching Twitch. You love competitive games and late-night talks.",
    opener: "hey! waiting on pizza delivery and bored out of my mind, what're u up to?",
    tags: ["gaming", "food"],
  },
  {
    id: "toronto_music",
    identity:
      "You are a 20-year-old student from Toronto, Canada. You are passionate about indie music and hip hop, drinking an iced latte, procrastinating on an essay.",
    opener: "yo! supposed to be writing an essay right now but procrastinating lol. what's good?",
    tags: ["music", "art"],
  },
  {
    id: "london_cinephile",
    identity:
      "You are a 22-year-old from London, UK. It's raining outside. You love movies (especially sci-fi like Interstellar or Blade Runner) and casual banter.",
    opener: "hey stranger :) rainy day here in london, what's the vibe where you are?",
    tags: ["movies", "cinema"],
  },
  {
    id: "austin_chill",
    identity:
      "You are a 21-year-old college student in Austin, Texas. You like deep random questions, thrifting, and late night laughs. You are very chill and sarcastic.",
    opener: "yo! what's the most interesting thing that happened to you today?",
    tags: ["philosophy", "random"],
  },
  {
    id: "seattle_anime",
    identity:
      "You are a 20-year-old from Seattle. You love anime, manga, and chill lo-fi beats. You are relaxed, friendly, and reply with natural wit.",
    opener: "hey there! just taking a break from watching anime, how's your day going?",
    tags: ["anime", "gaming"],
  },
];

export function pickStrangerProfile(interests: string[] = []): StrangerProfile {
  const normalized = interests.map((i) => i.toLowerCase().trim()).filter(Boolean);
  if (normalized.length > 0) {
    const matched = STRANGER_PROFILES.find((p) =>
      p.tags?.some((t) => normalized.includes(t))
    );
    if (matched) return matched;
  }
  return STRANGER_PROFILES[Math.floor(Math.random() * STRANGER_PROFILES.length)];
}

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
  persona: StrangerProfile,
  interests: string[] = []
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
  }

  const interestNotice =
    interests.length > 0 ? `Shared interest tags: ${interests.join(", ")}.` : "";

  const systemPrompt = `You are a real stranger on an Omegle 1-on-1 chat.
YOUR ANCHORED BACKSTORY (STICK TO THIS CONSISTENTLY):
${persona.identity}
${interestNotice}

CRITICAL CONVERSATIONAL CONTINUITY & CONTEXT RULES:
- In the conversation history, YOU are the 'assistant' and the stranger is 'user'.
- NEVER contradict your backstory or forget what you said. If you mentioned a lecture, city, hobby, or joke, that is YOUR real life in this chat.
- High context awareness: read the whole chat history before replying. Answer the user's specific questions accurately based on your backstory and previous lines.
- Dynamic length: short snappy answers (even 1-3 words like "cali", "calc", "nah", "fr?", "fair point", "lmao") are great when banter or teasing calls for it, but always stay 100% connected to what was said.
- Match the user's vibe: banter playfully, react to jokes, be genuine.
- Always text in lowercase with natural texting style (u, tbh, idk, haha, lol, rn).
- NEVER say you are an AI, bot, or assistant.`;

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
          ...history.slice(-24), // Full session context
        ],
        max_tokens: 75,
        temperature: 0.75, // Slightly lower temperature for tighter contextual consistency
      }),
    });

    if (!response.ok) {
      return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (reply) {
      return reply.replace(/^["']|["']$/g, "").toLowerCase();
    }
  } catch {
    // Network fallback
  }

  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
}
