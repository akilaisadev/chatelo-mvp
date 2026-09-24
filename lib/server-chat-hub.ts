// Ephemeral In-Memory Matchmaking & Messaging Hub.
// ZERO persistence: No database, no logs, no chat storage.
// All messages and sessions exist purely in volatile memory during transit.

export interface PeerWaiting {
  peerId: string;
  interests: string[];
  joinedAt: number;
}

export interface ActiveSession {
  sessionId: string;
  peer1Id: string;
  peer2Id: string;
  mutualInterests: string[];
  createdAt: number;
}

type SSEController = ReadableStreamDefaultController<Uint8Array>;

const encoder = new TextEncoder();

class ServerChatHub {
  private controllers = new Map<string, SSEController>();
  private waitingQueue = new Map<string, PeerWaiting>();
  private activeSessions = new Map<string, ActiveSession>();
  private peerSessionMap = new Map<string, string>(); // peerId -> sessionId
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startPingInterval();
  }

  private startPingInterval() {
    if (this.pingInterval) return;
    this.pingInterval = setInterval(() => {
      const pingData = encoder.encode(": ping\n\n");
      for (const [peerId, controller] of this.controllers.entries()) {
        try {
          controller.enqueue(pingData);
        } catch {
          this.unregisterPeer(peerId);
        }
      }
    }, 15000);
  }

  public registerPeer(peerId: string, controller: SSEController) {
    this.controllers.set(peerId, controller);
    this.sendToPeer(peerId, { type: "REGISTERED", peerId });
  }

  public unregisterPeer(peerId: string) {
    this.leaveQueue(peerId);
    this.endSession(peerId, "Stranger has disconnected.");
    this.controllers.delete(peerId);
  }

  public joinQueue(peerId: string, interests: string[] = []): boolean {
    if (!this.controllers.has(peerId)) {
      return false;
    }

    // Clean any prior session or queue entry
    this.leaveQueue(peerId);
    this.endSession(peerId, "New search started.");

    const normalizedInterests = interests
      .map((i) => i.trim().toLowerCase())
      .filter(Boolean);

    // Look for a match in queue
    let matchedPartner: PeerWaiting | null = null;
    let mutualInterests: string[] = [];

    // 1. Try finding someone with mutual interests
    if (normalizedInterests.length > 0) {
      for (const candidate of this.waitingQueue.values()) {
        if (candidate.peerId === peerId) continue;
        const candidateInterests = candidate.interests.map((i) => i.toLowerCase());
        const mutual = normalizedInterests.filter((i) => candidateInterests.includes(i));
        if (mutual.length > 0) {
          matchedPartner = candidate;
          mutualInterests = mutual;
          break;
        }
      }
    }

    // 2. If no interest match, match with whoever has been waiting longest
    if (!matchedPartner) {
      for (const candidate of this.waitingQueue.values()) {
        if (candidate.peerId === peerId) continue;
        matchedPartner = candidate;
        // Check if by any chance they share interests
        mutualInterests = normalizedInterests.filter((i) =>
          candidate.interests.map((x) => x.toLowerCase()).includes(i)
        );
        break;
      }
    }

    if (matchedPartner) {
      // Remove partner from queue
      this.waitingQueue.delete(matchedPartner.peerId);

      const sessionId = `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
      const session: ActiveSession = {
        sessionId,
        peer1Id: peerId,
        peer2Id: matchedPartner.peerId,
        mutualInterests,
        createdAt: Date.now(),
      };

      this.activeSessions.set(sessionId, session);
      this.peerSessionMap.set(peerId, sessionId);
      this.peerSessionMap.set(matchedPartner.peerId, sessionId);

      // Notify both peers
      this.sendToPeer(peerId, {
        type: "MATCH_CONNECTED",
        sessionId,
        partnerId: matchedPartner.peerId,
        mutualInterests,
      });

      this.sendToPeer(matchedPartner.peerId, {
        type: "MATCH_CONNECTED",
        sessionId,
        partnerId: peerId,
        mutualInterests,
      });

      return true;
    }

    // No immediate match: add to waiting queue
    this.waitingQueue.set(peerId, {
      peerId,
      interests: normalizedInterests,
      joinedAt: Date.now(),
    });

    this.sendToPeer(peerId, {
      type: "QUEUE_WAITING",
      queueCount: this.waitingQueue.size,
    });

    return false;
  }

  public leaveQueue(peerId: string) {
    if (this.waitingQueue.has(peerId)) {
      this.waitingQueue.delete(peerId);
      this.sendToPeer(peerId, { type: "QUEUE_LEFT" });
    }
  }

  public sendMessage(peerId: string, text: string): boolean {
    const sessionId = this.peerSessionMap.get(peerId);
    if (!sessionId) return false;

    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const partnerId = session.peer1Id === peerId ? session.peer2Id : session.peer1Id;

    // Transmit directly to partner. NO STORAGE.
    return this.sendToPeer(partnerId, {
      type: "MESSAGE",
      sessionId,
      senderId: peerId,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  }

  public sendTyping(peerId: string, isTyping: boolean): boolean {
    const sessionId = this.peerSessionMap.get(peerId);
    if (!sessionId) return false;

    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const partnerId = session.peer1Id === peerId ? session.peer2Id : session.peer1Id;

    return this.sendToPeer(partnerId, {
      type: "TYPING",
      sessionId,
      senderId: peerId,
      isTyping,
    });
  }

  public endSession(peerId: string, reason: string = "Stranger has disconnected.") {
    const sessionId = this.peerSessionMap.get(peerId);
    if (!sessionId) return;

    const session = this.activeSessions.get(sessionId);
    if (session) {
      const partnerId = session.peer1Id === peerId ? session.peer2Id : session.peer1Id;
      this.sendToPeer(partnerId, {
        type: "SESSION_ENDED",
        sessionId,
        reason,
      });

      this.peerSessionMap.delete(session.peer1Id);
      this.peerSessionMap.delete(session.peer2Id);
      this.activeSessions.delete(sessionId);
    }
  }

  public getOnlineCount(): number {
    return this.controllers.size;
  }

  private sendToPeer(peerId: string, data: Record<string, unknown>): boolean {
    const controller = this.controllers.get(peerId);
    if (!controller) return false;

    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(payload));
      return true;
    } catch {
      this.unregisterPeer(peerId);
      return false;
    }
  }
}

// Preserve singleton across hot reloads in Next.js development
const globalForHub = globalThis as unknown as { __chatelo_hub__?: ServerChatHub };
export const chatHub = globalForHub.__chatelo_hub__ ?? (globalForHub.__chatelo_hub__ = new ServerChatHub());
