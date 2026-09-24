# Chatelo

An authentic, zero-friction 1-on-1 anonymous stranger chat inspired by Omegle, reimagined with a modern editorial design language (no AI slop, zero glowing purple pills, pure tactile typography and crisp interactions).

## Zero Storage & 100% Ephemeral Privacy
- **Zero Chat Persistence**: No database, no disk logs, no chat recording.
- **In-Memory Streaming**: Messages and typing signals stream in real-time between matched peers. Once delivered, they vanish from server memory.
- **Instant Session Wiping**: When either stranger clicks `Stop` / `Skip` or closes their browser, the session is purged instantly on both sides.

## Features
- **Classic Omegle Mechanics**:
  - `Stop` &rarr; `Really?` &rarr; `New` tactile cycle with `[ESC]` keyboard shortcut.
  - Typographic live typing indicator (`Stranger is typing...`).
  - Distinguishable high-contrast sender roles: **You** (electric cobalt) vs **Stranger** (vermillion signal).
- **Interest Matching**: Enter optional mutual interest tags (e.g. `#gaming`, `#music`, `#tech`, `#cinema`).
- **Real-Time Global Matchmaking**: Server-Sent Events (SSE) matchmaking engine that connects strangers across different devices and networks.
- **Pure Web Audio Synthesizer**: Subtle mechanical acoustic cues for connects, messages, and disconnects (toggleable).
- **Session Utilities**: Optional one-click transcript export (download `.txt` or copy to clipboard) if you want to save a memorable conversation before skipping.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting with strangers. (Open two different windows to test real stranger matching).

## Hosting on Appwrite Sites

Chatelo is configured with `output: 'standalone'` in `next.config.ts`, making it ready for Appwrite Sites:

1. Push this repository to GitHub.
2. Go to **Appwrite Console** &rarr; **Sites** &rarr; **Create Site**.
3. Select this GitHub repository.
4. Set Framework to `Next.js` and deploy.
