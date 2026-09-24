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

  // Violent / extreme hostile attacks
  /\bkys\b/i,
  /\bkill\s+your\s*self\b/i,
  /\bdie\s+(in\s+a\s+fire|bitch|hoe|fucker)\b/i,
  /\bshut\s+the\s+fuck\s+up\b/i,
  /\bstfu\b/i,
  /\bfuck\s+(you|u|ur|your)\s*(mom|mother|bitch|ass|face)?\b/i,
  /\bpiece\s+of\s+shit\b/i,
  /\basshole\b/i,
  /\bbitch\b/i,

  // Demands to skip
  /\b(skip\s+me|skip\s+u|go\s+and\s+skip|please\s+skip|just\s+skip\s+me)\b/i,
];

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

  return TOXIC_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function getRandomSkipLine(): string {
  return SKIP_PARTING_LINES[Math.floor(Math.random() * SKIP_PARTING_LINES.length)];
}

// Check if the AI model's response also intended to leave/skip
export function isAiAttemptingToLeave(reply: string): boolean {
  const lower = reply.toLowerCase();
  return (
    lower.includes("[skip]") ||
    lower.includes("logging off") ||
    lower.includes("i'm out") ||
    lower.includes("im out") ||
    lower.includes("not engaging with") ||
    lower.includes("cant click the button") ||
    lower.includes("can't click the button")
  );
}
