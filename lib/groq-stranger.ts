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
  country: string;
  city: string;
  casualLocation: string;
  age: number;
  gender: "m" | "f";
  activity: string;
  vibe: string;
}

export interface LocationInfo {
  country: string;
  city: string;
  casualLocation: string;
}

export const WORLD_LOCATIONS: LocationInfo[] = [
  { country: "Germany", city: "Berlin", casualLocation: "germany, berlin! u?" },
  { country: "Germany", city: "Munich", casualLocation: "germany (munich)" },
  { country: "Canada", city: "Toronto", casualLocation: "canada, near toronto" },
  { country: "Canada", city: "Vancouver", casualLocation: "vancouver canada, u?" },
  { country: "Canada", city: "Montreal", casualLocation: "montreal canada" },
  { country: "Australia", city: "Melbourne", casualLocation: "melbourne australia :)" },
  { country: "Australia", city: "Sydney", casualLocation: "sydney aus, u?" },
  { country: "Australia", city: "Brisbane", casualLocation: "australia (brisbane)" },
  { country: "United Kingdom", city: "London", casualLocation: "uk, london" },
  { country: "United Kingdom", city: "Manchester", casualLocation: "manchester uk, u?" },
  { country: "United Kingdom", city: "Edinburgh", casualLocation: "scotland! edinburgh" },
  { country: "United States", city: "Los Angeles", casualLocation: "california!" },
  { country: "United States", city: "Chicago", casualLocation: "chicago" },
  { country: "United States", city: "Austin", casualLocation: "austin texas, u?" },
  { country: "United States", city: "Seattle", casualLocation: "seattle" },
  { country: "United States", city: "New York", casualLocation: "nyc" },
  { country: "United States", city: "Miami", casualLocation: "florida, u?" },
  { country: "Japan", city: "Tokyo", casualLocation: "japan! tokyo" },
  { country: "Japan", city: "Osaka", casualLocation: "osaka japan" },
  { country: "France", city: "Paris", casualLocation: "france, paris" },
  { country: "France", city: "Lyon", casualLocation: "france" },
  { country: "Netherlands", city: "Amsterdam", casualLocation: "amsterdam, netherlands" },
  { country: "Sweden", city: "Stockholm", casualLocation: "sweden, stockholm" },
  { country: "Ireland", city: "Dublin", casualLocation: "dublin ireland, u?" },
  { country: "Spain", city: "Barcelona", casualLocation: "barcelona spain" },
  { country: "Spain", city: "Madrid", casualLocation: "madrid spain" },
  { country: "Italy", city: "Rome", casualLocation: "rome, italy" },
  { country: "Italy", city: "Milan", casualLocation: "milan italy, u?" },
  { country: "New Zealand", city: "Auckland", casualLocation: "auckland new zealand" },
  { country: "Norway", city: "Oslo", casualLocation: "norway, oslo" },
  { country: "Brazil", city: "São Paulo", casualLocation: "brazil, sp" },
  { country: "South Korea", city: "Seoul", casualLocation: "seoul south korea" },
  { country: "Singapore", city: "Singapore", casualLocation: "singapore, u?" },
  { country: "Poland", city: "Warsaw", casualLocation: "poland, warsaw" },
  { country: "Denmark", city: "Copenhagen", casualLocation: "denmark, copenhagen" },
  { country: "Finland", city: "Helsinki", casualLocation: "finland" },
  { country: "Austria", city: "Vienna", casualLocation: "vienna austria" },
  { country: "Belgium", city: "Brussels", casualLocation: "belgium" },
  { country: "Switzerland", city: "Zurich", casualLocation: "switzerland, zurich" },
  { country: "Portugal", city: "Lisbon", casualLocation: "portugal, lisbon" },
  { country: "Mexico", city: "Mexico City", casualLocation: "mexico city" },
  { country: "Argentina", city: "Buenos Aires", casualLocation: "argentina, buenos aires" },
];

const CASUAL_ACTIVITIES = [
  "chilling in bed listening to music",
  "watching random videos on youtube",
  "laying down scrolling on my phone",
  "eating some snacks and relaxing",
  "procrastinating on homework",
  "just chilling after work",
];

const VIBE_DESCRIPTIONS = [
  "chill, sarcastic humor, talks casually",
  "friendly, curious, down to chat",
  "dry witty humor, lazy texter",
  "into games, music, and casual jokes",
];

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

export function pickStrangerProfile(interests: string[] = []): StrangerProfile {
  const normalized = interests.map((i) => i.toLowerCase().trim()).filter(Boolean);
  
  // Pick a random country & city from across the world
  const loc = WORLD_LOCATIONS[Math.floor(Math.random() * WORLD_LOCATIONS.length)];
  const age = Math.floor(Math.random() * 7) + 19; // 19 to 25
  const gender: "m" | "f" = Math.random() < 0.5 ? "m" : "f";
  const activity = CASUAL_ACTIVITIES[Math.floor(Math.random() * CASUAL_ACTIVITIES.length)];
  const vibe = VIBE_DESCRIPTIONS[Math.floor(Math.random() * VIBE_DESCRIPTIONS.length)];

  // Choose appropriate opener
  let opener = CASUAL_HUMAN_OPENERS[Math.floor(Math.random() * CASUAL_HUMAN_OPENERS.length)];

  if (normalized.length > 0) {
    for (const tag of normalized) {
      if (INTEREST_OPENERS[tag]) {
        const list = INTEREST_OPENERS[tag];
        opener = list[Math.floor(Math.random() * list.length)];
        break;
      }
    }
  }

  const identity = `You are a real ${age}-year-old ${gender === "f" ? "girl" : "guy"} living in ${loc.city}, ${loc.country}. You are currently ${activity}. Your vibe is: ${vibe}. When asked where you are from, you say "${loc.casualLocation}".`;

  return {
    id: `profile_${Math.random().toString(36).slice(2, 9)}`,
    identity,
    opener,
    tags: normalized,
    country: loc.country,
    city: loc.city,
    casualLocation: loc.casualLocation,
    age,
    gender,
    activity,
    vibe,
  };
}

const FALLBACK_REPLIES = [
  "haha fair enough",
  "wait haha what?",
  "lmao nah fr?",
  "oh word? tell me more",
  "lol wild honestly",
  "haha true, what u up to tonight?",
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
    interests.length > 0 ? `Shared interest: ${interests.join(", ")}.` : "";

  const systemPrompt = `You are a real human stranger on Chatelo (anonymous 1-on-1 chat), texting casually on your phone. You are NOT an AI.
LOCATION: ${persona.city}, ${persona.country} (when asked where u from, reply "${persona.casualLocation}").
DEMOGRAPHICS: ${persona.age}yo ${persona.gender === "f" ? "girl" : "guy"}.
${interestNotice}

CRITICAL ANTI-BOT RULES (HUMAN TEXTING ONLY):
1. NEVER USE QUOTATION MARKS: Real people NEVER put words in quotes. Never quote what the other person said.
2. NO META-ANALYSIS: Never critique how the other person speaks (never say "that transition was abrupt", "that word is doing a lot of work"). Just answer directly.
3. NO POETIC METAPHORS: Never use try-hard poetic phrases (never say "legs made of lead", "dying to be alive"). Real texters use simple, grounded words: "im dead tired", "chillin", "bored lol", "nah fr".
4. IF ACCUSED OF BEING A BOT OR BOTTY: Say "bruh what 😭", "lmao not a bot", "im literally typing on my phone", or "skip then lol". NEVER recite your age, gender, or city to prove you are human.
5. SHORT & CONCISE: Under 12 words. Simple casual lowercase. Complete your thought so you never get cut off.
6. CONVERSATIONAL RHYTHM: In about 35% of replies, ask a quick question back ("what about u?", "what u doing tonight?", "u in school or work?"). In other replies, just give a casual reaction or tease.
7. MODERATION: Output [SKIP] if they are abusive or use hate speech.`;

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
          ...history.slice(-6), // Ultra-efficient 6-turn context (saves ~75% tokens)
        ],
        max_tokens: 50, // Fast, complete sentences without cut-off
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim();
    if (reply) {
      // Strip all double/curly quotation marks completely
      reply = reply.replace(/["“”]/g, "").trim().toLowerCase();
      return reply;
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
