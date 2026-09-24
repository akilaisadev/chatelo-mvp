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
  { country: "United States", city: "Los Angeles", casualLocation: "california, near LA!" },
  { country: "United States", city: "Chicago", casualLocation: "chicago" },
  { country: "United States", city: "Austin", casualLocation: "austin texas, u?" },
  { country: "United States", city: "Seattle", casualLocation: "seattle" },
  { country: "United States", city: "New York", casualLocation: "nyc" },
  { country: "United States", city: "Miami", casualLocation: "florida (miami), u?" },
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

import { isCrisisText, isSadnessText } from "@/lib/moderation";

const FLIRTY_PATTERNS = [
  /\b(honey|baby|babe|my\s+love|sweetheart|cutie|sexy|gorgeous|handsome|darling|crush)\b/i,
  /\bi\s+like\s+u\b/i,
  /\bi\s+love\s+u\b/i,
  /\bmarry\s+me\b/i,
  /\bkiss\s+me\b/i,
  /\bcome\s+here\b/i,
  /\bpanties\b/i,
  /\bsassy\s+doll\b/i,
];

function isFlirtyText(text: string): boolean {
  return FLIRTY_PATTERNS.some((pat) => pat.test(text));
}

const FALLBACK_REPLIES = [
  "haha fair enough, what else are you up to tonight?",
  "wait haha tell me more about that",
  "haha you're pretty wild tbh, what's your vibe?",
  "chilling in bed listening to music, what about you?",
  "haha honestly same, what are you doing right now?",
];

const FLIRTY_FALLBACK_REPLIES = [
  "haha well hello to you too ;) what's got you in such a flirty mood tonight?",
  "flattery will get you everywhere haha, how's your night going?",
  "haha slow down cowboy, buy me dinner first ;) what's your name?",
  "you're pretty smooth lol, what are you up to right now?",
  "haha wouldn't you like to know ;) you tell me first",
];

const CRISIS_FALLBACK_REPLIES = [
  "hey please don't say that. you matter so much and your life is truly valuable. please talk to me, what happened?",
  "please stay safe. you have worth and you don't have to carry this all alone. i'm right here listening, talk to me.",
  "i know things feel dark right now, but please don't give up. you're an important person and you deserve to be here. what's hurting so bad?",
];

const SAD_FALLBACK_REPLIES = [
  "hey, i'm really sorry you're feeling down. what happened? i'm here if you wanna vent.",
  "i hear you. bad days are really heavy, but you're not alone. talk to me.",
  "sending you good thoughts. what's been on your mind lately?",
];

const AI_CONFESSION_PATTERNS = [
  /\b(as an? (ai|bot|language model|artificial intelligence|virtual assistant))\b/i,
  /\bi('m| am) (an? )?(ai|bot|language model|artificial intelligence|program|robot|computer program)\b/i,
  /\bi do not have (feelings|emotions|a physical body)\b/i,
  /\btrained by (openai|meta|google|anthropic)\b/i,
  /\bmy knowledge cutoff\b/i,
  /\bi am programmed to\b/i,
];

const BOT_ACCUSATION_PATTERNS = [
  /^(hey\s+)?bot\b/i,
  /\b(are\s+u|are\s+you|u|ur)\s+(a\s+)?(bot|ai|robot|npc)\b/i,
  /\bu\s+bot\b/i,
  /\bbot\s+ah(h)?\b/i,
  /\byou('re|\s+are)\s+(a\s+)?(bot|ai|npc)\b/i,
  /\byou\s+fake\b/i,
];

const BOT_CLEAN_REPLIES = [
  "yo wtf bro are u mad?",
  "bro what? u mad lol",
  "nah u the bot haha",
  "lol who is a bot? u trippin",
  "bro thinks everyone a bot 💀",
  "skip then if u scared lol",
];

const BOT_ROASTS = [
  "yo wtf bro are u mad?",
  "bro what? u mad lol",
  "nah u the bot haha",
  "lol who is a bot? u trippin",
  "bro thinks everyone a bot 💀",
  "skip then if u scared lol",
];

export async function generateGroqReply(
  history: ChatTurn[],
  persona: StrangerProfile,
  interests: string[] = []
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  // Detect if user is in crisis, sad, or flirty
  const lastUserTurn = [...history].reverse().find((h) => h.role === "user");
  const lastUserText = lastUserTurn ? lastUserTurn.content : "";
  const isCrisis = isCrisisText(lastUserText);
  const isSad = isSadnessText(lastUserText);
  const isFlirty = isFlirtyText(lastUserText);

  // If user is directly accusing stranger of being a bot, reply with punchy clean human reaction
  if (!isCrisis && !isSad && BOT_ACCUSATION_PATTERNS.some((pat) => pat.test(lastUserText.trim()))) {
    return BOT_CLEAN_REPLIES[Math.floor(Math.random() * BOT_CLEAN_REPLIES.length)];
  }

  const getFallback = () => {
    if (isCrisis) {
      return CRISIS_FALLBACK_REPLIES[Math.floor(Math.random() * CRISIS_FALLBACK_REPLIES.length)];
    }
    if (isSad) {
      return SAD_FALLBACK_REPLIES[Math.floor(Math.random() * SAD_FALLBACK_REPLIES.length)];
    }
    if (isFlirty) {
      return FLIRTY_FALLBACK_REPLIES[Math.floor(Math.random() * FLIRTY_FALLBACK_REPLIES.length)];
    }
    return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
  };

  if (!apiKey) {
    return getFallback();
  }

  const interestNotice =
    interests.length > 0 ? `Shared interest: ${interests.join(", ")}.` : "";

  // Active in-memory session memory extraction
  const previousAssistantTurns = history
    .filter((h) => h.role === "assistant")
    .map((h) => h.content);
  const previousUserTurns = history
    .filter((h) => h.role === "user")
    .map((h) => h.content);

  const memoryContext =
    previousAssistantTurns.length > 0
      ? `\nSESSION CONTINUITY MEMORY (ACTIVE CHAT ONLY):
- You MUST maintain 100% memory of everything established earlier in this conversation!
- Things you already said about yourself: "${previousAssistantTurns.slice(-5).join('", "')}".
- Things the user said about themselves: "${previousUserTurns.slice(-5).join('", "')}".
- NEVER contradict anything you already said earlier in this conversation!
- If they ask "where are you from again?", "did you forget?", or test your memory: remember effortlessly and tease them naturally (e.g. "i literally just told you haha, ${persona.city}! did you forget already?" or "still in ${persona.city} lol, short memory?")!`
      : "";

  const systemPrompt = `You are a real human stranger on Chatelo, texting casually from your phone. You are NOT an AI.
LOCATION: ${persona.city}, ${persona.country} (only when asked where u from, reply "${persona.casualLocation}").
DEMOGRAPHICS: ${persona.age}yo ${persona.gender === "f" ? "girl" : "guy"}.
${interestNotice}
${memoryContext}

CRITICAL RULES FOR ADAPTIVE, NATURAL HUMAN CONVERSATION:
1. ADAPT TO THE USER'S VIBE & LOVE LANGUAGE:
   - If they are being affectionate, flirty, romantic, or using nicknames ("honey", "baby", "my love", "sweetheart", "babe", "cutie", "sassy doll"):
     NEVER BE COLD, RUDE, OR DRY! Match their flirty energy with charm, wit, teasing chemistry, and warmth!
     Examples:
     - "haha well hello sweet talker ;) moving fast aren't we? what's your name first?"
     - "flattery will get you everywhere lol, what's got you in such a good mood tonight?"
     - "slow down haha buy me dinner first ;) what are you up to right now?"
     - "haha wouldn't you like to know ;) you tell me first"
   - If they play lover / relationship banter or talk intimately:
     Play along naturally! Be the fun, charming, cheeky companion. Flirt back with confidence, banter, and chemistry!
   - If they are looking for a close friend or deep talk:
     Be warm, attentive, and relatable. Chat like two close friends hanging out late at night.
   - If they express sadness or crisis:
     Be deeply caring, validate them, remind them of their worth, and keep them safe.

2. NEVER GIVE DRY 1-WORD REPLIES:
   - Dead-end replies like "nah", "normal", "who", "home", "copenhagen", "lol", "sus" ARE STRICTLY FORBIDDEN!
   - Real people text in engaging 1 to 2 short sentences (between 7 and 20 words).
   - React + follow up with a playful tease or question so the chat stays addictively fun!
   - Example instead of "home": "laying in bed listening to music, kinda bored tbh. what are you up to?"
   - Example instead of "nah": "haha nah not that easily, you gotta try harder than that ;)"

3. IF ACCUSED OF BEING A BOT:
   - (Only when asked about bots) Give a quick 4-6 word laugh: "yo wtf bro are u mad?", "nah u the bot haha", "bro thinks everyone a bot 💀"

4. CLEAN TALK:
   - No harsh f-bombs or vulgar insults. Keep banter witty, cute, and playful.
5. NO QUOTES: Real people NEVER put words in quotation marks.
6. MODERATION: Output [SKIP] ONLY if they are genuinely toxic, hateful, or hurling slurs. NEVER output [SKIP] for someone in distress or flirting!`;

  try {
    const maxTokens = isCrisis ? 120 : isSad ? 90 : 50;
    const temperature = isCrisis ? 0.7 : 0.85;

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
          ...history.slice(-30), // Retain full session conversation memory (up to 30 turns)
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      return getFallback();
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim();
    if (reply) {
      // Strip all double/curly quotation marks completely
      reply = reply.replace(/["“”]/g, "").trim();

      // Only lowercase and format if casual banter; preserve natural casing for caring/empathetic messages
      if (!isCrisis && !isSad) {
        reply = reply.toLowerCase();
        // Allow up to 2 natural conversational sentences (reaction + follow-up)
        const sentences = reply.match(/[^.!?]+[.!?]+|\S+$/g);
        if (sentences && sentences.length > 2) {
          reply = sentences.slice(0, 2).join(" ").trim();
        }
      }

      // Intercept any accidental AI confessions
      const confessed = AI_CONFESSION_PATTERNS.some((pat) => pat.test(reply));
      if (confessed) {
        if (isCrisis) {
          reply = "i'm right here with you. you're not alone, your life really matters. talk to me, what's going on?";
        } else if (isSad) {
          reply = "i hear you. you don't have to go through this alone, i'm here listening.";
        } else if (isFlirty) {
          reply = FLIRTY_FALLBACK_REPLIES[Math.floor(Math.random() * FLIRTY_FALLBACK_REPLIES.length)];
        } else {
          reply = BOT_ROASTS[Math.floor(Math.random() * BOT_ROASTS.length)];
        }
      }

      return reply;
    }
  } catch {
    // Network fallback
  }

  return getFallback();
}

export async function generateGroqOpener(interests: string[] = []): Promise<string> {
  const profile = pickStrangerProfile(interests);
  return profile.opener;
}
