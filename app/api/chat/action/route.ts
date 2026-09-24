import { NextRequest, NextResponse } from "next/server";
import { chatHub } from "@/lib/server-chat-hub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, peerId } = body;

    if (!peerId) {
      return NextResponse.json({ error: "peerId is required" }, { status: 400 });
    }

    switch (action) {
      case "match": {
        const interests = Array.isArray(body.interests) ? body.interests : [];
        const immediateMatch = chatHub.joinQueue(peerId, interests);
        return NextResponse.json({ ok: true, matched: immediateMatch });
      }

      case "cancel_search": {
        chatHub.leaveQueue(peerId);
        return NextResponse.json({ ok: true });
      }

      case "message": {
        const text = typeof body.text === "string" ? body.text : "";
        if (!text.trim()) {
          return NextResponse.json({ error: "Empty message" }, { status: 400 });
        }
        const sent = chatHub.sendMessage(peerId, text);
        return NextResponse.json({ ok: sent });
      }

      case "typing": {
        const isTyping = Boolean(body.isTyping);
        chatHub.sendTyping(peerId, isTyping);
        return NextResponse.json({ ok: true });
      }

      case "leave": {
        chatHub.endSession(peerId, "Stranger has skipped the chat.");
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    online: chatHub.getOnlineCount(),
  });
}
