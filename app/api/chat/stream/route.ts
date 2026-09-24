import { NextRequest } from "next/server";
import { chatHub } from "@/lib/server-chat-hub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const peerId = searchParams.get("peerId");

  if (!peerId) {
    return new Response("Missing peerId parameter", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      chatHub.registerPeer(peerId, controller);
    },
    cancel() {
      chatHub.unregisterPeer(peerId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
