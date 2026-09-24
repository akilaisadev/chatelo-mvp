// Ephemeral In-Memory Matchmaking & Messaging Hub.
// ZERO persistence: No database, no logs, no chat storage.
// All messages and sessions exist purely in volatile memory during transit.

import {
  generateGroqReply,
  pickStrangerProfile,
  StrangerProfile,
} from "./groq-stranger";
import {
  isAggressiveOrRude,
  getRandomSkipLine,
  isAiAttemptingToLeave,
} from "./moderation";

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
  isAiSession: boolean;
  persona?: StrangerProfile;
  aiHistory?: { role: "user" | "assistant"; content: string }[];
  createdAt: number;
}

type SSEController = ReadableStreamDefaultController<Uint8Array>;

const encoder = new TextEncoder();

class ServerChatHub {
  private controllers = new Map<string, SSEController>();
  private waitingQueue = new Map<string, PeerWaiting>();
  private activeSessions = new Map<string, ActiveSession>();
  private peerSessionMap = new Map<string, string>(); // peerId -> sessionId
  private fallbackTimers = new Map<string, ReturnType<typeof setTimeout>>();
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

    this.leaveQueue(peerId);
    this.endSession(peerId, "New search started.");

    const normalizedInterests = interests
      .map((i) => i.trim().toLowerCase())
      .filter(Boolean);

    let matchedPartner: PeerWaiting | null = null;
    let mutualInterests: string[] = [];

    // 1. Try finding human with mutual interests
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

    // 2. If no interest match, match with waiting human
    if (!matchedPartner) {
      for (const candidate of this.waitingQueue.values()) {
        if (candidate.peerId === peerId) continue;
        matchedPartner = candidate;
        mutualInterests = normalizedInterests.filter((i) =>
          candidate.interests.map((x) => x.toLowerCase()).includes(i)
        );
        break;
      }
    }

    if (matchedPartner) {
      this.clearFallbackTimer(matchedPartner.peerId);
      this.waitingQueue.delete(matchedPartner.peerId);

      const sessionId = `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
      const session: ActiveSession = {
        sessionId,
        peer1Id: peerId,
        peer2Id: matchedPartner.peerId,
        mutualInterests,
        isAiSession: false,
        createdAt: Date.now(),
      };

      this.activeSessions.set(sessionId, session);
      this.peerSessionMap.set(peerId, sessionId);
      this.peerSessionMap.set(matchedPartner.peerId, sessionId);

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

    // Add to waiting queue
    this.waitingQueue.set(peerId, {
      peerId,
      interests: normalizedInterests,
      joinedAt: Date.now(),
    });

    this.sendToPeer(peerId, {
      type: "QUEUE_WAITING",
      queueCount: this.waitingQueue.size,
    });

    // If no human arrives in 3.5 seconds, connect with Groq AI Stranger
    const timer = setTimeout(() => {
      this.connectAiStranger(peerId, normalizedInterests);
    }, 3500);

    this.fallbackTimers.set(peerId, timer);
    return false;
  }

  private async connectAiStranger(peerId: string, interests: string[]) {
    if (!this.waitingQueue.has(peerId) || !this.controllers.has(peerId)) {
      return;
    }

    this.waitingQueue.delete(peerId);
    this.fallbackTimers.delete(peerId);

    const sessionId = `sess_ai_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    const aiPartnerId = `stranger_${Math.random().toString(36).slice(2, 8)}`;

    const persona = pickStrangerProfile(interests);

    const session: ActiveSession = {
      sessionId,
      peer1Id: peerId,
      peer2Id: aiPartnerId,
      mutualInterests: interests,
      isAiSession: true,
      persona,
      aiHistory: [],
      createdAt: Date.now(),
    };

    this.activeSessions.set(sessionId, session);
    this.peerSessionMap.set(peerId, sessionId);

    this.sendToPeer(peerId, {
      type: "MATCH_CONNECTED",
      sessionId,
      partnerId: aiPartnerId,
      mutualInterests: interests,
    });

    // Opening greeting from locked persona
    const opener = persona.opener;

    // Natural typing delay
    setTimeout(() => {
      if (this.peerSessionMap.get(peerId) !== sessionId) return;
      this.sendToPeer(peerId, { type: "TYPING", isTyping: true });

      const typingDuration = Math.min(2200, Math.max(900, opener.length * 35));
      setTimeout(() => {
        if (this.peerSessionMap.get(peerId) !== sessionId) return;
        this.sendToPeer(peerId, { type: "TYPING", isTyping: false });

        session.aiHistory?.push({ role: "assistant", content: opener });

        this.sendToPeer(peerId, {
          type: "MESSAGE",
          sessionId,
          senderId: aiPartnerId,
          text: opener,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }, typingDuration);
    }, 900);
  }

  public leaveQueue(peerId: string) {
    this.clearFallbackTimer(peerId);
    if (this.waitingQueue.has(peerId)) {
      this.waitingQueue.delete(peerId);
      this.sendToPeer(peerId, { type: "QUEUE_LEFT" });
    }
  }

  private clearFallbackTimer(peerId: string) {
    const timer = this.fallbackTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.fallbackTimers.delete(peerId);
    }
  }

  public sendMessage(peerId: string, text: string): boolean {
    const sessionId = this.peerSessionMap.get(peerId);
    if (!sessionId) return false;

    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const trimmed = text.trim();
    if (!trimmed) return false;

    if (session.isAiSession) {
      session.aiHistory?.push({ role: "user", content: trimmed });

      // Immediate auto-skip if user is toxic, aggressive, abusive, or explicitly demanding a skip
      if (isAggressiveOrRude(trimmed)) {
        this.sendToPeer(peerId, { type: "TYPING", isTyping: true });

        const partingLine = getRandomSkipLine();
        setTimeout(() => {
          if (this.peerSessionMap.get(peerId) !== sessionId) return;

          this.sendToPeer(peerId, { type: "TYPING", isTyping: false });
          session.aiHistory?.push({ role: "assistant", content: partingLine });

          this.sendToPeer(peerId, {
            type: "MESSAGE",
            sessionId,
            senderId: session.peer2Id,
            text: partingLine,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });

          // Disconnect immediately after parting line
          setTimeout(() => {
            this.endSession(peerId, "Stranger has skipped the chat.");
          }, 500);
        }, 600);

        return true;
      }

      // Immediate typing indicator for normal replies
      this.sendToPeer(peerId, { type: "TYPING", isTyping: true });

      // Generate Groq reply asynchronously with locked persona and full session history
      (async () => {
        const persona = session.persona || pickStrangerProfile(session.mutualInterests);
        const rawReply = await generateGroqReply(
          session.aiHistory || [],
          persona,
          session.mutualInterests
        );

        if (this.peerSessionMap.get(peerId) !== sessionId) return;

        const isSkipTriggered = isAiAttemptingToLeave(rawReply);
        const cleanReply =
          rawReply.replace(/\[skip\]/gi, "").replace(/i'm logging off/gi, "bye").trim() || "bye";

        const typingDuration = Math.min(2200, Math.max(600, cleanReply.length * 26));
        setTimeout(() => {
          if (this.peerSessionMap.get(peerId) !== sessionId) return;

          this.sendToPeer(peerId, { type: "TYPING", isTyping: false });
          session.aiHistory?.push({ role: "assistant", content: cleanReply });

          this.sendToPeer(peerId, {
            type: "MESSAGE",
            sessionId,
            senderId: session.peer2Id,
            text: cleanReply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });

          // Automatically skip and end session if AI chose to skip
          if (isSkipTriggered) {
            setTimeout(() => {
              this.endSession(peerId, "Stranger has skipped the chat.");
            }, 600);
          }
        }, typingDuration);
      })();

      return true;
    }

    // Human to human: relay directly with zero storage
    const partnerId = session.peer1Id === peerId ? session.peer2Id : session.peer1Id;
    return this.sendToPeer(partnerId, {
      type: "MESSAGE",
      sessionId,
      senderId: peerId,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  }

  public sendTyping(peerId: string, isTyping: boolean): boolean {
    const sessionId = this.peerSessionMap.get(peerId);
    if (!sessionId) return false;

    const session = this.activeSessions.get(sessionId);
    if (!session || session.isAiSession) return false;

    const partnerId = session.peer1Id === peerId ? session.peer2Id : session.peer1Id;
    return this.sendToPeer(partnerId, {
      type: "TYPING",
      sessionId,
      senderId: peerId,
      isTyping,
    });
  }

  public endSession(peerId: string, reason: string = "Stranger has disconnected.") {
    this.clearFallbackTimer(peerId);
    const sessionId = this.peerSessionMap.get(peerId);
    if (!sessionId) return;

    const session = this.activeSessions.get(sessionId);
    if (session) {
      if (!session.isAiSession) {
        const partnerId = session.peer1Id === peerId ? session.peer2Id : session.peer1Id;
        this.sendToPeer(partnerId, {
          type: "SESSION_ENDED",
          sessionId,
          reason,
        });
        this.peerSessionMap.delete(partnerId);
      }

      this.peerSessionMap.delete(peerId);
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

const globalForHub = globalThis as unknown as { __chatelo_hub__?: ServerChatHub };
export const chatHub = globalForHub.__chatelo_hub__ ?? (globalForHub.__chatelo_hub__ = new ServerChatHub());
