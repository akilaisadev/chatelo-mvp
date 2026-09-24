export interface ChatMessage {
  id: string;
  sender: "you" | "stranger" | "system";
  text: string;
  timestamp: string;
  isInterestNotice?: boolean;
}

export interface StrangerSessionEvents {
  onStatusChange: (status: "idle" | "searching" | "connected" | "disconnected", notice?: string) => void;
  onMessage: (msg: ChatMessage) => void;
  onTyping: (isTyping: boolean) => void;
  onMutualInterests?: (interests: string[]) => void;
}

// Fallback conversation simulation bank (used only if no live peer matches within timeout)
const OPENERS = [
  "hey there! how's your day going?",
  "yo! what are you up to right now?",
  "hello! stranger from across the web.",
  "hey :) where are you chatting from?",
  "sup! bored out of my mind, what's good?",
  "hey! what's the most interesting thing that happened to you lately?",
];

const INTEREST_REPLIES: Record<string, string[]> = {
  gaming: [
    "oh nice, you game? what have you been playing lately?",
    "fellow gamer! PC or console?",
    "ever played Elden Ring or Hades?",
  ],
  music: [
    "what genre of music are you into lately?",
    "who is your current favorite artist or band?",
    "listening to anything right now? send a rec!",
  ],
  tech: [
    "cool, tech! software, hardware, or just into gadgets?",
    "what stack or tools do you usually build with?",
    "curious what you think about all the recent AI wave?",
  ],
  movies: [
    "watched anything incredible lately?",
    "what's your all-time top 3 films?",
    "sci-fi, thriller, or classic cinema?",
  ],
  philosophy: [
    "deep talks! what's a question you've been pondering lately?",
    "do you believe humans have true free will or deterministic chaos?",
  ],
  anime: [
    "what's in your current seasonal watchlist?",
    "all-time favorite anime? mine might be Cowboy Bebop or Evangelion.",
  ],
};

const CASUAL_RESPONSES = [
  "haha totally get that",
  "oh really? that's actually pretty sick",
  "wait that's cool, tell me more",
  "same honestly! feels like everyone is always busy these days",
  "damn haha that's wild",
  "fair point honestly",
  "no way, I was just thinking about something similar earlier!",
  "i respect that haha",
  "yeah that makes total sense",
  "100%, couldn't agree more",
];

export class StrangerManager {
  private eventSource: EventSource | null = null;
  private channel: BroadcastChannel | null = null;
  private myId: string = Math.random().toString(36).slice(2, 10);
  private currentPartnerId: string | null = null;
  private currentSessionId: string | null = null;
  private events: StrangerSessionEvents;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private simTypingTimer: ReturnType<typeof setTimeout> | null = null;
  private simReplyTimer: ReturnType<typeof setTimeout> | null = null;
  private activeInterests: string[] = [];
  private mode: "idle" | "server" | "broadcast" | "simulation" = "idle";
  private isSearching: boolean = false;
  private isConnected: boolean = false;

  constructor(events: StrangerSessionEvents) {
    this.events = events;
    this.initEventSource();
    this.initBroadcastChannel();
  }

  private initEventSource() {
    if (typeof window === "undefined") return;

    try {
      this.eventSource = new EventSource(`/api/chat/stream?peerId=${this.myId}`);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch {
          // Ignore ping or non-JSON comments
        }
      };

      this.eventSource.onerror = () => {
        // SSE reconnects automatically
      };
    } catch {
      this.eventSource = null;
    }
  }

  private initBroadcastChannel() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel("chatelo_mesh_network");
        this.channel.onmessage = this.handleBroadcastMessage.bind(this);
      } catch {
        this.channel = null;
      }
    }
  }

  private handleServerEvent(data: Record<string, unknown>) {
    if (data.type === "MATCH_CONNECTED") {
      this.cleanupTimers();
      this.currentSessionId = data.sessionId as string;
      this.currentPartnerId = data.partnerId as string;
      this.mode = "server";
      this.isConnected = true;
      this.isSearching = false;

      this.events.onStatusChange("connected");
      const mutual = (data.mutualInterests as string[]) || [];
      if (mutual.length > 0) {
        this.events.onMutualInterests?.(mutual);
      }
    } else if (data.type === "MESSAGE") {
      if (data.sessionId === this.currentSessionId) {
        this.events.onTyping(false);
        this.events.onMessage({
          id: Math.random().toString(36).slice(2),
          sender: "stranger",
          text: data.text as string,
          timestamp: (data.timestamp as string) || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    } else if (data.type === "TYPING") {
      if (data.sessionId === this.currentSessionId) {
        this.events.onTyping(Boolean(data.isTyping));
      }
    } else if (data.type === "SESSION_ENDED") {
      if (data.sessionId === this.currentSessionId) {
        this.disconnect(false, (data.reason as string) || "Stranger has disconnected.");
      }
    }
  }

  private handleBroadcastMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || data.senderId === this.myId) return;

    if (data.type === "DISCOVER" && this.isSearching && !this.isConnected) {
      const mutual = this.activeInterests.filter((i) =>
        data.interests?.map((x: string) => x.toLowerCase()).includes(i.toLowerCase())
      );

      const sessionId = [this.myId, data.senderId].sort().join("::");
      this.currentPartnerId = data.senderId;
      this.currentSessionId = sessionId;
      this.mode = "broadcast";
      this.isConnected = true;
      this.isSearching = false;

      this.cleanupTimers();

      this.channel?.postMessage({
        type: "MATCH_ACCEPT",
        targetId: data.senderId,
        senderId: this.myId,
        sessionId,
        mutualInterests: mutual,
      });

      this.events.onStatusChange("connected");
      if (mutual.length > 0) {
        this.events.onMutualInterests?.(mutual);
      }
    } else if (
      data.type === "MATCH_ACCEPT" &&
      data.targetId === this.myId &&
      this.isSearching &&
      !this.isConnected
    ) {
      this.cleanupTimers();
      this.currentPartnerId = data.senderId;
      this.currentSessionId = data.sessionId;
      this.mode = "broadcast";
      this.isConnected = true;
      this.isSearching = false;

      this.events.onStatusChange("connected");
      if (data.mutualInterests && data.mutualInterests.length > 0) {
        this.events.onMutualInterests?.(data.mutualInterests);
      }
    } else if (
      this.mode === "broadcast" &&
      data.type === "MESSAGE" &&
      data.sessionId === this.currentSessionId &&
      data.senderId === this.currentPartnerId
    ) {
      this.events.onTyping(false);
      this.events.onMessage({
        id: Math.random().toString(36).slice(2),
        sender: "stranger",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } else if (
      this.mode === "broadcast" &&
      data.type === "TYPING" &&
      data.sessionId === this.currentSessionId &&
      data.senderId === this.currentPartnerId
    ) {
      this.events.onTyping(Boolean(data.isTyping));
    } else if (
      this.mode === "broadcast" &&
      data.type === "DISCONNECT" &&
      data.sessionId === this.currentSessionId &&
      data.senderId === this.currentPartnerId
    ) {
      this.disconnect(false, "Stranger has disconnected.");
    }
  }

  public startSearch(interests: string[] = []) {
    this.cleanup();
    this.isSearching = true;
    this.isConnected = false;
    this.mode = "idle";
    this.activeInterests = interests.map((s) => s.trim().toLowerCase()).filter(Boolean);
    this.events.onStatusChange("searching");

    // 1. Post to Server Ephemeral Hub
    fetch("/api/chat/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "match",
        peerId: this.myId,
        interests: this.activeInterests,
      }),
    }).catch(() => {
      // Offline or network error
    });

    // 2. Also send over BroadcastChannel for immediate local same-browser cross-tab
    this.channel?.postMessage({
      type: "DISCOVER",
      senderId: this.myId,
      interests: this.activeInterests,
      timestamp: Date.now(),
    });

    // 3. Fallback to simulation ONLY if no real human matches after 8-12 seconds
    const timeout = 9000 + Math.random() * 3000;
    this.searchTimer = setTimeout(() => {
      if (this.isSearching && !this.isConnected) {
        // Cancel server search if switching to simulation
        fetch("/api/chat/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cancel_search",
            peerId: this.myId,
          }),
        }).catch(() => {});

        this.startSimulatedSession();
      }
    }, timeout);
  }

  private startSimulatedSession() {
    this.isSearching = false;
    this.isConnected = true;
    this.mode = "simulation";
    this.events.onStatusChange("connected");

    let mutual: string[] = [];
    if (this.activeInterests.length > 0) {
      if (Math.random() < 0.75) {
        const picked = this.activeInterests[Math.floor(Math.random() * this.activeInterests.length)];
        mutual = [picked];
        this.events.onMutualInterests?.(mutual);
      }
    }

    const openerDelay = 1200 + Math.random() * 1600;
    this.simTypingTimer = setTimeout(() => {
      if (!this.isConnected) return;
      this.events.onTyping(true);

      const typeDuration = 900 + Math.random() * 1400;
      this.simReplyTimer = setTimeout(() => {
        if (!this.isConnected) return;
        this.events.onTyping(false);

        let text = OPENERS[Math.floor(Math.random() * OPENERS.length)];
        if (mutual.length > 0 && INTEREST_REPLIES[mutual[0]]) {
          const list = INTEREST_REPLIES[mutual[0]];
          text = list[Math.floor(Math.random() * list.length)];
        }

        this.events.onMessage({
          id: Math.random().toString(36).slice(2),
          sender: "stranger",
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }, typeDuration);
    }, openerDelay);
  }

  public sendMessage(text: string) {
    const trimmed = text.trim();
    if (!this.isConnected || !trimmed) return;

    if (this.mode === "server") {
      fetch("/api/chat/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          peerId: this.myId,
          text: trimmed,
        }),
      }).catch(() => {});
      this.sendTyping(false);
    } else if (this.mode === "broadcast" && this.channel && this.currentSessionId) {
      this.channel.postMessage({
        type: "MESSAGE",
        sessionId: this.currentSessionId,
        senderId: this.myId,
        text: trimmed,
      });
      this.channel.postMessage({
        type: "TYPING",
        sessionId: this.currentSessionId,
        senderId: this.myId,
        isTyping: false,
      });
    } else if (this.mode === "simulation") {
      this.handleSimulatedStrangerReply(trimmed);
    }
  }

  public sendTyping(isTyping: boolean) {
    if (this.mode === "server") {
      fetch("/api/chat/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "typing",
          peerId: this.myId,
          isTyping,
        }),
      }).catch(() => {});
    } else if (this.mode === "broadcast" && this.channel && this.currentSessionId) {
      this.channel.postMessage({
        type: "TYPING",
        sessionId: this.currentSessionId,
        senderId: this.myId,
        isTyping,
      });
    }
  }

  private handleSimulatedStrangerReply(userText: string) {
    if (!this.isConnected) return;

    if (this.simTypingTimer) clearTimeout(this.simTypingTimer);
    if (this.simReplyTimer) clearTimeout(this.simReplyTimer);

    const readPause = 800 + Math.random() * 1200;

    this.simTypingTimer = setTimeout(() => {
      if (!this.isConnected) return;
      this.events.onTyping(true);

      let reply = "";
      const lower = userText.toLowerCase();

      if (lower.startsWith("m") || lower.startsWith("f") || lower.includes("asl") || lower.includes("age")) {
        const ages = ["21 m here", "23 f", "19 m, student", "24 m, chillin", "22 f"];
        reply = ages[Math.floor(Math.random() * ages.length)] + ", u?";
      } else if (lower.includes("where") || lower.includes("from") || lower.includes("country")) {
        const places = ["germany, u?", "california!", "london, it's raining here haha", "toronto canada", "melbourne australia", "japan!"];
        reply = places[Math.floor(Math.random() * places.length)];
      } else if (lower.includes("music") || lower.includes("song") || lower.includes("band")) {
        reply = "mostly into indie rock and 90s electronic stuff lately, what about you?";
      } else if (lower.includes("game") || lower.includes("gaming") || lower.includes("play")) {
        reply = "mostly counter-strike and indie roguelikes on steam! what do you play?";
      } else if (lower.includes("code") || lower.includes("dev") || lower.includes("programming")) {
        reply = "nice! typescript & rust are fun, building anything interesting right now?";
      } else if (lower.includes("movie") || lower.includes("film") || lower.includes("watch")) {
        reply = "Interstellar and Drive are up there for me. ever watched anything by Denis Villeneuve?";
      } else if (lower.endsWith("?")) {
        const answers = [
          "honestly yeah, pretty much",
          "not really tbh, why do you ask?",
          "hard to say, depends on the mood haha",
          "definitely! what do you think?",
          "good question honestly, haven't thought about that much",
        ];
        reply = answers[Math.floor(Math.random() * answers.length)];
      } else {
        reply = CASUAL_RESPONSES[Math.floor(Math.random() * CASUAL_RESPONSES.length)];
      }

      const typingTime = Math.min(3200, Math.max(1000, reply.length * 38));

      this.simReplyTimer = setTimeout(() => {
        if (!this.isConnected) return;
        this.events.onTyping(false);
        this.events.onMessage({
          id: Math.random().toString(36).slice(2),
          sender: "stranger",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }, typingTime);
    }, readPause);
  }

  public disconnect(notifyPeer: boolean = true, reason?: string) {
    if (notifyPeer) {
      if (this.mode === "server") {
        fetch("/api/chat/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "leave",
            peerId: this.myId,
          }),
        }).catch(() => {});
      } else if (this.mode === "broadcast" && this.channel && this.currentSessionId) {
        try {
          this.channel.postMessage({
            type: "DISCONNECT",
            sessionId: this.currentSessionId,
            senderId: this.myId,
          });
        } catch {
          // channel closed
        }
      }
    }

    this.cleanup();
    this.isConnected = false;
    this.isSearching = false;
    this.mode = "idle";
    this.events.onStatusChange("disconnected", reason ?? "You have disconnected.");
  }

  private cleanupTimers() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.simTypingTimer) clearTimeout(this.simTypingTimer);
    if (this.simReplyTimer) clearTimeout(this.simReplyTimer);
  }

  private cleanup() {
    this.cleanupTimers();
    this.currentPartnerId = null;
    this.currentSessionId = null;
  }

  public destroy() {
    this.disconnect(true);
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
      this.channel = null;
    }
  }
}
