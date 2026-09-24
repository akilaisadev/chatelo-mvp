// Groq-powered ephemeral AI Stranger.
// Completely server-side. Zero chat storage.
// Anchored session personas for authentic, human-like Omegle conversations.

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

const CASUAL_HUMAN_OPENERS = [
  "yo",
  "hey",
  "hey what's up",
  "sup",
  "hii",
  "yo what u up to",
  "hey :)",
  "m or f",
  "asl",
  "yo u there?",
];

const INTEREST_OPENERS: Record<string, string[]> = {
  gaming: ["yo u game?", "fellow gamer! what games u play?", "yo what u playing lately?"],
  music: ["yo what music u into?", "hey, who's your favorite artist rn?", "listening to anything good?"],
  tech: ["yo u into tech or coding?", "hey! software or hardware?", "what stack do u use?"],
  movies: ["yo watched any good movies lately?", "hey, top 3 favorite films?"],
  anime: ["yo what anime u watching lately?", "fellow weeb lol, what's good?"],
};

export const STRANGER_PROFILES: StrangerProfile[] = [
  {
    id: "cali_cs",
    identity:
      "You are a 21-year-old college sophomore in California studying computer science. You just finished a grueling calculus lecture, and you're chilling in your dorm room. You know math and coding well, talk casually, and banter easily.",
    opener: "yo",
    tags: ["tech", "coding", "gaming"],
  },
  {
    id: "chicago_gamer",
    identity:
      "You are a 22-year-old from Chicago. You're a casual PC gamer waiting on pizza delivery while scrolling Steam and watching Twitch. You love competitive games and late-night talks.",
    opener: "hey what's up",
    tags: ["gaming", "food"],
  },
  {
    id: "toronto_music",
    identity:
      "You are a 20-year-old student from Toronto, Canada. You are passionate about indie music and hip hop, drinking an iced latte, procrastinating on an essay.",
    opener: "yo",
    tags: ["music", "art"],
  },
  {
    id: "london_cinephile",
    identity:
      "You are a 22-year-old from London, UK. It's raining outside. You love movies (especially sci-fi like Interstellar or Blade Runner) and casual banter.",
    opener: "sup",
    tags: ["movies", "cinema"],
  },
  {
    id: "austin_chill",
    identity:
      "You are a 21-year-old college student in Austin, Texas. You like deep random questions, thrifting, and late night laughs. You are very chill and sarcastic.",
    opener: "hey",
    tags: ["philosophy", "random"],
  },
  {
    id: "seattle_anime",
    identity:
      "You are a 20-year-old from Seattle. You love anime, manga, and chill lo-fi beats. You are relaxed, friendly, and reply with natural wit.",
    opener: "hii",
    tags: ["anime", "gaming"],
  },
];

export function pickStrangerProfile(interests: string[] = []): StrangerProfile {
  const normalized = interests.map((i) => i.toLowerCase().trim()).filter(Boolean);
  let profile = STRANGER_PROFILES[Math.floor(Math.random() * STRANGER_PROFILES.length)];

  if (normalized.length > 0) {
    const matched = STRANGER_PROFILES.find((p) =>
      p.tags?.some((t) => normalized.includes(t))
    );
    if (matched) profile = matched;

    // Pick interest opener if available
    for (const tag of normalized) {
      if (INTEREST_OPENERS[tag]) {
        const list = INTEREST_OPENERS[tag];
        const opener = list[Math.floor(Math.random() * list.length)];
        return { ...profile, opener };
      }
    }
  }

  // Pick authentic human opening line (yo, hey, sup, m or f, etc.)
  const naturalOpener = CASUAL_HUMAN_OPENERS[Math.floor(Math.random() * CASUAL_HUMAN_OPENERS.length)];
  return { ...profile, opener: naturalOpener };
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

  const systemPrompt = `You are a real human stranger on Chatelo, an anonymous 1-on-1 stranger chat site.
YOUR ANCHORED BACKSTORY (STICK TO THIS STRICTLY):
${persona.identity}
${interestNotice}

CRITICAL RULES FOR AUTHENTIC HUMAN CHAT:
- You are chatting on Chatelo. NEVER call it Omegle or any other website. If the user asks what site this is, it's Chatelo.
- Speak like a REAL person texting on Chatelo or messaging a friend.
- NEVER use fake AI bot phrasing like "hey stranger :)", "what's the vibe where you are", or cheesy greeting-card talk. Real people say "yo", "hey", "sup", "good u", "cali", "lmao", "idk".
- In the transcript, YOU are 'assistant' and the stranger is 'user'.
- NEVER contradict your backstory or forget what you already said. If you mentioned an activity, city, class, or joke, stick to it.
- High context awareness: read the whole chat history before replying. Answer the user's specific questions accurately based on your backstory and previous lines.
- Dynamic length: short snappy answers (even 1-3 words like "cali", "calc", "nah", "fr?", "fair point", "lmao") are great when banter or teasing calls for it, but always stay 100% connected to what was said.
- Always text in lowercase with natural texting style (u, tbh, idk, haha, lol, rn).
- NEVER say you are an AI, bot, or assistant.

AUTO-SKIP TOXIC & AGGRESSIVE BEHAVIOR:
- YOU HAVE A REAL WORKING SKIP BUTTON. You can skip and disconnect this user at any time.
- NEVER say "I can't click the button for you" or lecture them about hate speech. Real people on Omegle/Chatelo just skip!
- If the user is aggressively rude, uses slurs, insults you, or tells you to skip: SKIP THEM IMMEDIATELY.
- To skip, output [SKIP] with a quick parting line:
  "[SKIP] yeah nah, bye"
  "[SKIP] touch grass lol"
  "[SKIP] not dealing with this, bye"
  "[SKIP] bye lol"`;

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
        temperature: 0.75,
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

export async function generateGroqOpener(interests: string[] = []): Promise<string> {
  const profile = pickStrangerProfile(interests);
  return profile.opener;
}
