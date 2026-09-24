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
} from "@/lib/moderation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, interests = [] } = body;

    if (action === "profile") {
      const persona = pickStrangerProfile(interests);
      return NextResponse.json({ ok: true, persona });
    }

    if (action === "opener") {
      const persona: StrangerProfile = body.persona || pickStrangerProfile(interests);
      return NextResponse.json({ ok: true, opener: persona.opener, persona });
    }

    if (action === "reply") {
      const rawHistory = Array.isArray(body.history) ? body.history : [];
      const history: ChatTurn[] = rawHistory
        .map((item: any) => ({
          role:
            item.role === "user" || item.sender === "user"
              ? ("user" as const)
              : ("assistant" as const),
          content: String(item.content ?? item.text ?? "").trim(),
        }))
        .filter((item: { role: "user" | "assistant"; content: string }) => item.content.length > 0);
      const persona: StrangerProfile = body.persona || pickStrangerProfile(interests);

      // Check if user's latest message was toxic / aggressive / demands skip
      const lastUserMsg = [...history].reverse().find((h) => h.role === "user");
      if (lastUserMsg && isAggressiveOrRude(lastUserMsg.content)) {
        const partingLine = getRandomSkipLine();
        return NextResponse.json({
          ok: true,
          reply: partingLine,
          skip: true,
          reason: "Stranger has skipped the chat.",
        });
      }

      const rawReply = await generateGroqReply(history, persona, interests);
      const isSkip = isAiAttemptingToLeave(rawReply);
      const cleanReply =
        rawReply.replace(/\[skip\]/gi, "").replace(/i'm logging off/gi, "bye").trim() || "bye";

      return NextResponse.json({
        ok: true,
        reply: cleanReply,
        skip: isSkip,
        reason: isSkip ? "Stranger has skipped the chat." : undefined,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
