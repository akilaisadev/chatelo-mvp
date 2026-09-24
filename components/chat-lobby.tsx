"use client";

import { X, ArrowRight } from "lucide-react";

const SUGGESTED_INTERESTS = [
  "music",
  "gaming",
  "tech",
  "movies",
  "philosophy",
  "anime",
];

const STEPS = [
  {
    no: "01",
    title: "Pick up",
    body: "Hit start. No login, no profile, nothing to fill in — the line opens with one click.",
  },
  {
    no: "02",
    title: "Match",
    body: "Add a topic for a head start. The operator pairs you with one person, topic first if it works.",
  },
  {
    no: "03",
    title: "Talk",
    body: "Plain text only. It\u2019s you and a stranger, and nobody else is on the line.",
  },
  {
    no: "04",
    title: "Leave",
    body: "Either side can hang up any time. When it\u2019s over, it\u2019s gone — nothing is stored.",
  },
];

interface ChatLobbyProps {
  interests: string[];
  interestInput: string;
  onInterestInput: (value: string) => void;
  onAddInterest: (raw: string) => void;
  onRemoveInterest: (tag: string) => void;
  onStart: () => void;
}

export function ChatLobby({
  interests,
  interestInput,
  onInterestInput,
  onAddInterest,
  onRemoveInterest,
  onStart,
}: ChatLobbyProps) {
  return (
    <div className="pb-12">
      {/* Hero */}
      <section
        aria-label="Start a conversation"
        className="mx-auto flex max-w-4xl flex-col items-center px-4 pt-16 text-center sm:px-6 md:pt-24 lg:pt-28"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-xs font-semibold text-muted">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-signal" />
          A private line to one stranger
        </p>

        <h1 className="mt-8 text-[clamp(2.9rem,10vw,6rem)] font-bold leading-[0.98] tracking-[-0.045em]">
          Two people.
          <br />
          One conversation.
          <br />
          <span className="rounded-[0.2em] bg-signal px-[0.22em] text-ink box-decoration-clone">
            Zero records.
          </span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">
          Chatelo connects you to one random person, optionally on a topic you
          both care about. No account, no profile, nothing saved. When one of
          you walks away, the line goes dead.
        </p>

        <div className="mt-10 flex items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="group inline-flex h-14 items-center gap-3 rounded-full bg-signal px-8 text-base font-bold text-ink transition-all hover:bg-signalHover active:scale-[0.98]"
          >
            Start talking
            <span
              aria-hidden="true"
              className="hidden rounded-full border border-ink/20 bg-ink/5 px-2 py-0.5 font-mono text-[10px] font-medium tracking-normal text-ink/70 sm:inline-flex"
            >
              SPACE
            </span>
          </button>
        </div>

        <a
          href="#topics"
          className="mt-5 text-sm font-medium text-muted underline decoration-lineStrong underline-offset-4 transition-colors hover:text-ink"
        >
          Want a topic to match on? Tune the line first
        </a>
      </section>

      {/* How it works */}
      <section
        aria-label="How it works"
        className="mx-auto mt-20 max-w-6xl px-4 sm:px-6 md:mt-28 lg:px-8"
      >
        <div className="border-t border-line pt-10">
          <p className="text-sm font-semibold text-ink">How the line works</p>
          <div className="mt-8 grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.no}>
                <p className="text-4xl font-bold tracking-tight text-lineStrong">
                  {step.no}
                </p>
                <p className="mt-3 text-base font-semibold text-ink">
                  {step.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Match on a topic */}
      <section
        id="topics"
        aria-label="Choose a topic to match on"
        className="mx-auto mt-20 max-w-6xl scroll-mt-24 px-4 sm:px-6 md:mt-28 lg:px-8"
      >
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-sm font-semibold text-ink">
              Match on a topic
              <span className="ml-1.5 text-muted">(optional)</span>
            </p>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
              Type one interest and press Enter. If a matching stranger picks
              up, you both see the shared tag at the top of the line. Skip it
              for a total surprise.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-line bg-card p-5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="interest-input"
                  className="text-sm font-semibold text-ink"
                >
                  Topics
                </label>
                <span className="font-mono text-xs tabular-nums text-faint">
                  {interests.length} / 8
                </span>
              </div>

              <div className="mt-4 flex min-h-[52px] flex-wrap items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 transition-colors focus-within:border-ink">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-sm font-medium text-paper"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => onRemoveInterest(tag)}
                      aria-label={`Remove topic ${tag}`}
                      className="text-paper/50 transition-colors hover:text-signal"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
                <input
                  id="interest-input"
                  type="text"
                  value={interestInput}
                  onChange={(e) => onInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      onAddInterest(interestInput);
                    } else if (
                      e.key === "Backspace" &&
                      !interestInput &&
                      interests.length > 0
                    ) {
                      onRemoveInterest(interests[interests.length - 1]);
                    }
                  }}
                  placeholder={
                    interests.length === 0
                      ? "e.g. music, film, the meaning of a handshake"
                      : "another one..."
                  }
                  className="min-w-[8rem] flex-1 bg-transparent py-1 text-[15px] text-ink placeholder:text-faint focus:outline-none"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-faint">Try</span>
                {SUGGESTED_INTERESTS.filter(
                  (s) => !interests.includes(s),
                ).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onAddInterest(tag)}
                    className="rounded-full border border-lineStrong px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    +{tag}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col justify-between gap-4 border-t border-line pt-5 sm:flex-row sm:items-center">
                <p className="max-w-sm text-sm text-muted">
                  Matching is best effort. With no live peer around, a curious
                  stranger on this build answers instead.
                </p>
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-ink px-6 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper active:scale-[0.98]"
                >
                  Start with these topics
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-line md:mt-28">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-signal" />
            <span className="text-lg font-bold tracking-tight">Chatelo</span>
          </div>

          <div className="max-w-md space-y-2 text-sm text-muted">
            <p>
              A private line to one stranger. No account, no history, no trace.
            </p>
            <p className="text-sm text-faint">
              MVP build — the switchboard runs entirely in your browser, and
              this page works peer-to-peer between open tabs.
            </p>
          </div>

          <p className="font-mono text-xs uppercase tracking-label text-faint">
            Don&apos;t share what you wouldn&apos;t hand a stranger.
          </p>
        </div>
      </footer>
    </div>
  );
}