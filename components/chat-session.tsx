"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Smile, PhoneOff } from "lucide-react";
import type { ChatMessage } from "@/lib/stranger-engine";

type SessionStatus = "idle" | "searching" | "connected" | "disconnected";

const EMOJIS = [
  "🙂", "😀", "😁", "😂", "🤣", "😊", "😇", "🥰", "😍", "😘",
  "😉", "😎", "🤔", "🤨", "😌", "😅", "🥳", "😭", "😴", "🤯",
  "😱", "🥺", "😡", "🙃", "😜", "🤪", "😏", "😒", "🙄", "🫡",
  "👍", "👎", "👏", "🙏", "🤝", "💪", "✌️", "🤞", "🤙", "👌",
  "💛", "🧡", "❤️", "💜", "💙", "💚", "🤍", "💯", "✨", "🔥",
  "🎉", "🚀", "🌟", "🍕", "☕", "🎵", "🎮", "⚽", "🎬", "📚",
  "🌍", "🌙", "🌈", "❓", "❗", "💡", "🎯", "🕶️", "🧠", "👀",
];

interface ChatSessionProps {
  chatStatus: SessionStatus;
  statusNotice: string;
  messages: ChatMessage[];
  isStrangerTyping: boolean;
  mutualInterests: string[];
  interests: string[];
  stopConfirm: boolean;
  inputText: string;
  emojiOpen: boolean;
  onToggleEmoji: () => void;
  textInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStopAction: () => void;
}

const stopButtonStyles = (
  chatStatus: SessionStatus,
  stopConfirm: boolean,
) => {
  if (chatStatus === "searching") {
    return "border-lineStrong bg-card text-ink hover:border-ink";
  }
  if (chatStatus === "connected" && !stopConfirm) {
    return "border-ink bg-paper text-ink hover:bg-ink hover:text-paper";
  }
  if (chatStatus === "connected" && stopConfirm) {
    return "border-signal bg-signal text-ink animate-pulse";
  }
  return "border-signal bg-signal text-ink hover:bg-signalHover";
};

const stopLabel = (chatStatus: SessionStatus, stopConfirm: boolean) => {
  if (chatStatus === "searching") return "Cancel";
  if (chatStatus === "connected" && !stopConfirm) return "Stop";
  if (chatStatus === "connected" && stopConfirm) return "Really?";
  return "New line";
};

export function ChatSession({
  chatStatus,
  statusNotice,
  messages,
  isStrangerTyping,
  mutualInterests,
  interests,
  stopConfirm,
  inputText,
  emojiOpen,
  onToggleEmoji,
  textInputRef,
  onInputChange,
  onInputKeyDown,
  onSend,
  onStopAction,
}: ChatSessionProps) {
  const canSend = chatStatus === "connected" && inputText.trim().length > 0;
  const streamRef = useRef<HTMLDivElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = streamRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isStrangerTyping, chatStatus]);

  useEffect(() => {
    if (!emojiOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const panel = emojiPanelRef.current;
      const trigger = (e.target as HTMLElement).closest(
        '[data-emoji-trigger]',
      );
      if (panel && !panel.contains(target) && !trigger) {
        onToggleEmoji();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [emojiOpen, onToggleEmoji]);

  const insertEmoji = (emoji: string) => {
    const ta = textInputRef.current;
    if (!ta || chatStatus !== "connected") return;
    const start = ta.selectionStart ?? inputText.length;
    const end = ta.selectionEnd ?? start;
    const next = inputText.slice(0, start) + emoji + inputText.slice(end);
    onInputChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* Session ruler */}
      <div className="border-b border-line bg-card/60">
        <div className="mx-auto flex min-h-[48px] max-w-3xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 sm:px-6">
          {chatStatus === "searching" ? (
            <>
              <StatusChip label="Searching" pulse />
              <p className="text-sm text-muted">
                Looking for one person
                {interests.length > 0 && ` on #${interests.join(", #")}`}
                ...
              </p>
            </>
          ) : chatStatus === "connected" ? (
            <>
              <StatusChip label="Line open" />
              <p className="text-sm text-muted">
                You&apos;re one of two on this line
              </p>
              {mutualInterests.length > 0 && (
                <p className="text-sm font-semibold text-signalText">
                  Both here for #{mutualInterests.join(", #")}
                </p>
              )}
            </>
          ) : (
            <>
              <StatusChip label="Line closed" />
              <p className="text-sm text-muted">
                {statusNotice || "The other side hung up."}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Stream */}
      <div ref={streamRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {messages.length === 0 && chatStatus !== "searching" && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
              <p className="text-base font-semibold text-ink">
                The line is silent
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted">
                Say the first thing that comes to mind — a stranger on the other
                end is waiting on yours.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <MessageRow key={m.id} message={m} />
          ))}

          {isStrangerTyping && (
            <div className="mt-2 flex items-center gap-2.5 py-2">
              <span className="h-2 w-2 rounded-full bg-signal" aria-hidden="true" />
              <span className="text-sm font-semibold text-signalText animate-typo-blink">
                Stranger is typing…
              </span>
            </div>
          )}

          {chatStatus === "disconnected" && (
            <div className="mt-8 rounded-2xl border border-signal bg-signalSoft px-6 py-5">
              <p className="flex items-center gap-2 text-base font-semibold text-signalText">
                <PhoneOff size={17} aria-hidden="true" />
                The line went dead
              </p>
              <p className="mt-1.5 text-sm text-muted">
                {statusNotice || "The other side left."} Press{" "}
                <kbd className="kbd-shortcut">ESC</kbd> or hit{" "}
                <span className="font-semibold text-ink">New line</span> to pick
                up another.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="relative border-t border-line bg-paper/95 backdrop-blur-md">
        {/* Emoji panel */}
        {emojiOpen && (
          <div
            ref={emojiPanelRef}
            role="dialog"
            aria-label="Pick an emoji"
            className="absolute bottom-[calc(100%+10px)] left-4 right-4 z-30 mx-auto max-w-2xl rounded-2xl border border-line bg-paper shadow-[0_-8px_40px_-20px_rgba(10,10,8,0.35)] sm:left-1/2 sm:right-auto sm:w-[26rem] sm:-translate-x-1/2"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-sm font-semibold text-ink">Emoji</p>
              <button
                type="button"
                onClick={onToggleEmoji}
                aria-label="Close emoji picker"
                className="rounded-full px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-line/70 hover:text-ink"
              >
                Close
              </button>
            </div>
            <div className="grid max-h-[240px] grid-cols-[repeat(auto-fill,minmax(2.1rem,1fr))] gap-0.5 overflow-y-auto p-2.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  aria-label={`Insert ${emoji}`}
                  className="flex h-9 items-center justify-center rounded-lg text-xl transition-transform hover:scale-125 hover:bg-card"
                >
                  <span aria-hidden="true">{emoji}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto flex max-w-3xl flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onStopAction}
            aria-label={
              chatStatus === "searching"
                ? "Cancel the search"
                : stopConfirm
                  ? "Confirm: disconnect from the stranger"
                  : "Disconnect from the stranger"
            }
            className={`flex h-12 w-full flex-col items-center justify-center rounded-full border px-5 text-sm font-bold transition-all active:scale-[0.98] sm:h-[52px] sm:w-auto sm:min-w-[104px] ${stopButtonStyles(chatStatus, stopConfirm)}`}
          >
            <span>{stopLabel(chatStatus, stopConfirm)}</span>
            <span aria-hidden="true" className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium opacity-60 sm:justify-center">
              <span className="rounded border border-current/20 px-1 py-px font-mono sm:hidden">ESC</span>
              <span className="hidden sm:inline">[ESC]</span>
            </span>
          </button>

          <div className="flex flex-1 items-center gap-1.5 rounded-full border border-lineStrong bg-card px-2 py-1.5 transition-colors focus-within:border-ink">
            <button
              type="button"
              data-emoji-trigger
              onClick={onToggleEmoji}
              disabled={chatStatus !== "connected"}
              aria-label={emojiOpen ? "Close emoji picker" : "Add an emoji"}
              aria-haspopup="dialog"
              aria-expanded={emojiOpen}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:text-faint ${
                emojiOpen ? "bg-signal text-ink" : "text-muted hover:bg-line/70 hover:text-ink"
              }`}
            >
              <Smile size={18} aria-hidden="true" />
            </button>

            <textarea
              ref={textInputRef}
              rows={1}
              value={inputText}
              disabled={chatStatus !== "connected"}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              aria-label="Message to the stranger"
              placeholder={
                chatStatus === "connected"
                  ? "Type a line — Enter sends"
                  : chatStatus === "searching"
                    ? "Waiting for the operator to connect you…"
                    : "The line is closed. New line to talk again."
              }
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] text-ink placeholder:text-faint focus:outline-none disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send the line"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-all hover:bg-signal hover:text-ink disabled:cursor-not-allowed disabled:bg-lineStrong disabled:text-paper disabled:hover:bg-lineStrong disabled:hover:text-paper active:scale-95"
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-faint sm:px-6">
          <span>
            <kbd className="kbd-shortcut">ESC</kbd> stop or skip
          </span>
          <span>
            <kbd className="kbd-shortcut">ENTER</kbd> send a line
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ label, pulse }: { label: string; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-sm font-semibold text-ink">
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full bg-signal ${pulse ? "animate-caret" : ""}`}
      />
      {label}
    </span>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  if (message.sender === "system") {
    return (
      <div className="my-6 flex items-center gap-4" role="status">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <p className="text-xs font-medium uppercase tracking-wide text-faint">
          {message.text}
        </p>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
    );
  }

  const isYou = message.sender === "you";
  return (
    <div className="my-3 flex items-baseline gap-2.5 leading-relaxed sm:gap-3.5">
      <span
        className={`shrink-0 text-sm font-bold ${
          isYou ? "text-ink" : "text-signalText"
        }`}
      >
        {isYou ? "You" : "Stranger"}
      </span>
      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[15px] text-ink">
        {message.text}
      </p>
      <time className="shrink-0 font-mono text-[10px] tabular-nums text-faint">
        {message.timestamp}
      </time>
    </div>
  );
}