import { NextRequest, NextResponse } from "next/server";
import {
  generateGroqReply,
  pickStrangerProfile,
  StrangerProfile,
  ChatTurn,
} from "@/lib/groq-stranger";
import {
  isAggressiveOrRude,
  getRandomSkipLine,
  isAiAttemptingToLeave,
  isCrisisText,
  isSadnessText,
} from "@/lib/moderation";
import { packPayload, unpackPayload } from "@/lib/secure-packet";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SyncRequest {
  a: "init" | "msg";
  i?: string[]; // interests
  h?: ChatTurn[]; // history
  s?: StrangerProfile; // persona state
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const packet = typeof rawBody.p === "string" ? rawBody.p : "";
    const payload = unpackPayload<SyncRequest>(packet);

    if (!payload || !payload.a) {
      return NextResponse.json(
        { p: packPayload({ error: "Invalid sync request" }) },
        { status: 400 }
      );
    }

    const interests = Array.isArray(payload.i) ? payload.i : [];

    // 'init': Initialize session persona & opener
    if (payload.a === "init") {
      const persona = pickStrangerProfile(interests);
      const resData = {
        ok: true,
        opener: persona.opener,
        persona,
      };
      return NextResponse.json({ p: packPayload(resData) });
    }

    // 'msg': Process incoming peer conversation turn
    if (payload.a === "msg") {
      const rawHistory = Array.isArray(payload.h) ? payload.h : [];
      const history: ChatTurn[] = rawHistory
        .map((item: any) => ({
          role:
            item.role === "user" || item.sender === "user"
              ? ("user" as const)
              : ("assistant" as const),
          content: String(item.content ?? item.text ?? "").trim(),
        }))
        .filter((item: { role: "user" | "assistant"; content: string }) => item.content.length > 0);

      const persona: StrangerProfile = payload.s || pickStrangerProfile(interests);

      // Check if user's latest message was toxic / aggressive
      const lastUserMsg = [...history].reverse().find((h) => h.role === "user");
      if (lastUserMsg && isAggressiveOrRude(lastUserMsg.content)) {
        const partingLine = getRandomSkipLine();
        const resData = {
          ok: true,
          reply: partingLine,
          skip: true,
          reason: "Stranger has skipped the chat.",
        };
        return NextResponse.json({ p: packPayload(resData) });
      }

      const isCrisisOrSad = Boolean(
        lastUserMsg && (isCrisisText(lastUserMsg.content) || isSadnessText(lastUserMsg.content))
      );
      const rawReply = await generateGroqReply(history, persona, interests);
      const isSkip = !isCrisisOrSad && isAiAttemptingToLeave(rawReply);
      let cleanReply = rawReply
        .replace(/\[skip\]?/gi, "")
        .replace(/\[s\b/gi, "")
        .replace(/i'm logging off/gi, "bye")
        .trim();

      if (isSkip && (!cleanReply || cleanReply === "[s" || cleanReply.startsWith("["))) {
        cleanReply = getRandomSkipLine();
      } else if (!cleanReply) {
        cleanReply = isCrisisOrSad ? "i'm right here with you. talk to me, what happened?" : "bye";
      }

      const resData = {
        ok: true,
        reply: cleanReply,
        skip: isSkip,
        reason: isSkip ? "Stranger has skipped the chat." : undefined,
      };

      return NextResponse.json({ p: packPayload(resData) });
    }

    return NextResponse.json(
      { p: packPayload({ error: "Unknown sync action" }) },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { p: packPayload({ error: "Sync failed" }) },
      { status: 500 }
    );
  }
}
