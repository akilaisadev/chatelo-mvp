"use client";

import { Volume2, ArrowLeft, VolumeX } from "lucide-react";

interface AppTopbarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  /** True when a chat session (searching/connected/disconnected) is active. */
  inSession: boolean;
  onHangUp: () => void;
}

const ghostIcon =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/70 hover:text-ink active:scale-95";

export function AppTopbar({
  soundEnabled,
  onToggleSound,
  inSession,
  onHangUp,
}: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              if (inSession) {
                e.preventDefault();
                onHangUp();
              }
            }}
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Chatelo — return to the lobby"
          >
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-signal" />
            <span className="text-lg font-bold tracking-tight text-ink">
              Chatelo
            </span>
          </a>

          {inSession && (
            <span className="hidden items-center gap-2 rounded-full border border-line bg-card px-3 py-1 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-signal" />
              <span className="text-xs font-medium text-muted">
                One line, two people
              </span>
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          {!inSession && (
            <span className="mr-2 hidden text-xs font-medium text-muted md:inline">
              No account · No history
            </span>
          )}

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Mute the chimes" : "Unmute the chimes"}
            aria-pressed={soundEnabled}
            title={soundEnabled ? "Mute chimes" : "Unmute chimes"}
            className={`${ghostIcon} ${soundEnabled ? "" : "text-signalText"}`}
          >
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>

          {inSession && (
            <button
              type="button"
              onClick={onHangUp}
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink text-ink transition-colors hover:bg-ink hover:text-paper active:scale-[0.98] sm:w-auto sm:gap-1.5 sm:px-4"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Hang up</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}