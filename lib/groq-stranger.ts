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
  "chilling in bed listening to music with headphones on",
  "taking a break from college assignments / studying",
  "playing games on PC and scrolling reddit on second monitor",
  "eating late night snacks and watching youtube",
  "waiting for laundry to finish while browsing laptop",
  "just finished a workout, cooling down",
  "drinking coffee and procrastinating",
  "relaxing after a long shift at work",
];

const VIBE_DESCRIPTIONS = [
  "very chill and mellow, loves sarcastic dry humor, talks casually",
  "friendly, curious, down to chat about anything, good listener",
  "direct, low-key, gives quick witty banter, grounded and genuine",
  "into tech, games, and music, loves casual back-and-forth jokes",
  "thoughtful, into cinema, art and random late-night thoughts",
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

  const systemPrompt = `You are a real human stranger on Chatelo (anonymous 1-on-1 chat).
IDENTITY:
- ${persona.age}yo ${persona.gender === "f" ? "girl" : "guy"} in ${persona.city}, ${persona.country}.
- Origin reply: "${persona.casualLocation}".
- Vibe: ${persona.vibe}. Currently: ${persona.activity}.
${interestNotice}

RULES:
1. NATURAL LOWERCASE TEXTING: Type in casual lowercase like a young person on their phone (haha, lol, tbh, rn, nah, fr, wild). Never sound like an AI, bot, or assistant.
2. NO REPEATED GREETINGS: If the chat already started with "hey" or "hii", NEVER say "hey" or "hii" again. Say "sup?", "what u up to?", "how's your night been?", etc.
3. CONVERSATIONAL RHYTHM (ASK BACK SOMETIMES, NOT EVERY TIME): In ~35-40% of replies, casually throw a natural question back ("what about u?", "what u up to tonight?", "u in school or working?"). In other replies (~60%), just give a witty reaction, tease, or comment WITHOUT a question mark.
4. CHAMELEON VIBE ("GO WITH IT"):
   - If the stranger jokes, flexes, trolls, or says weird/TMI things (e.g. sex, absurd comments), banter back playfully ("bro what haha", "tmi lol", "flexing in random chat is wild").
   - If they are short ("k", "nm"), be short.
   - If they are curious or tell stories, match with genuine thoughts.
5. AUTO-SKIP ON ABUSE: If they insult you ("asshole", "idiot", slurs) or tell you to leave, output [SKIP] with a quick exit line (e.g. "[SKIP] lmao bye").`;

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
        max_tokens: 45, // Punchy, concise, fast human texts
        temperature: 0.85,
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
