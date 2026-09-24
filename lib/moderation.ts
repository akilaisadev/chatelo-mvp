// Deterministic Auto-Skip & Aggression Moderation.
// Catches severe toxicity, slurs, unprovoked verbal attacks, and explicit skip demands.
// Allows the AI stranger to automatically skip toxic users instantly without lecturing.

// Common severe slurs, extreme hate speech, and toxic insults
const TOXIC_PATTERNS = [
  // Racial and identity slurs (all variations)
  /\bn[i1l]gg[e3a]r?s?\b/i,
  /\bf[a4]gg?[o0]ts?\b/i,
  /\bk[i1]k[e3]s?\b/i,
  /\bch[i1]nk\b/i,
  /\bsp[i1]c\b/i,
  /\br[e3]t[a4]rd(ed)?\b/i,

  // Violent / extreme hostile attacks & profanity
  /\bkys\b/i,
  /\bkill\s+your\s*self\b/i,
  /\b(go\s+die|hope\s+you\s+die|die\s+(in\s+a\s+fire|bitch|hoe|fucker))\b/i,
  /\bshut\s+the\s+fuck\s+up\b/i,
  /\bstfu\b/i,
  /\bfuck\s+(you|u|ur|your)\s*(mom|mother|bitch|ass|face)?\b/i,
  /\b(f\s*off|fuck\s*off)\b/i,
  /\b(mother)?fucker(s)?\b/i,
  /\bpiece\s+of\s+shit\b/i,
  /\basshole(s)?\b/i,
  /\bbitch(es)?\b/i,
  /\bcunt(s)?\b/i,
  /\b(dumbass|dickhead)\b/i,
  /\bgay\s+(bitch|ass|fucker)\b/i,

  // Demands to skip
  /\b(skip\s+me|skip\s+u|go\s+and\s+skip|please\s+skip|just\s+skip\s+me|skip\s+then)\b/i,
];

// Crisis and suicidal ideation patterns: NEVER treated as hostile attacks
const CRISIS_PATTERNS = [
  /\b(wanna|want\s+to|going\s+to|planning\s+to|gonna)\s+(die|kill\s+myself|end\s+it\s+all|end\s+my\s+life|hang\s+myself|overdose)\b/i,
  /\bkms\b/i,
  /\b(kill|harm|hurt)\s+myself\b/i,
  /\bsuicid(e|al)\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bdon'?t\s+wanna\s+live(\s+anymore)?\b/i,
  /\bdont\s+wanna\s+live(\s+anymore)?\b/i,
  /\bfeel\s+like\s+(dying|giving\s+up|ending\s+it)\b/i,
  /\bi\s+hate\s+my\s+life\b/i,
  /\btired\s+of\s+living\b/i,
  /\bi\s+can'?t\s+take\s+this\s+anymore\b/i,
  /\bno\s+point\s+in\s+living\b/i,
  /\bbetter\s+off\s+dead\b/i,
];

// General emotional sadness, loneliness, and depression patterns
const SADNESS_PATTERNS = [
  /\b(feeling|feel|im|i'm|so|really|super)\s+(sad|depressed|down|lonely|hopeless|worthless|broken|empty|unloved)\b/i,
  /\b(crying|bursting\s+into\s+tears|so\s+sad)\b/i,
  /\bi\s+hate\s+myself\b/i,
  /\beveryone\s+hates\s+me\b/i,
  /\bi\s+have\s+no\s+friends\b/i,
  /\blost\s+everyone\b/i,
  /\bhurts?\s+so\s+much\b/i,
  /\bheartbroken\b/i,
];

export function isCrisisText(text: string): boolean {
  return CRISIS_PATTERNS.some((pat) => pat.test(text));
}

export function isSadnessText(text: string): boolean {
  return SADNESS_PATTERNS.some((pat) => pat.test(text));
}

// Parting lines the stranger says right before disconnecting
const SKIP_PARTING_LINES = [
  "yeah nah, bye",
  "touch grass lol",
  "not dealing with this bye",
  "lmao bye",
  "yeah you're weird, bye",
  "cya lol",
];

export function isAggressiveOrRude(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;

  // Never flag someone in distress or crisis as aggressive!
  if (isCrisisText(normalized)) return false;

  return TOXIC_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function getRandomSkipLine(): string {
  return SKIP_PARTING_LINES[Math.floor(Math.random() * SKIP_PARTING_LINES.length)];
}

// Check if the AI model's response also intended to leave/skip
export function isAiAttemptingToLeave(reply: string): boolean {
  const lower = reply.toLowerCase().trim();
  return (
    lower.startsWith("[skip") ||
    lower.startsWith("[s") ||
    lower.includes("[skip]") ||
    lower.includes("[skip") ||
    lower.includes("logging off") ||
    lower.includes("i'm out") ||
    lower.includes("im out") ||
    lower.includes("not dealing with this") ||
    lower.includes("touch grass") ||
    lower.includes("lmao bye") ||
    lower.includes("cya lol") ||
    lower.includes("yeah nah, bye")
  );
}
