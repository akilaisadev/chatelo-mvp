"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { StrangerManager, ChatMessage } from "@/lib/stranger-engine";
import { sounds } from "@/lib/audio";
import { AppTopbar } from "@/components/app-topbar";
import { ChatLobby } from "@/components/chat-lobby";
import { ChatSession } from "@/components/chat-session";

export function AnonymousChat() {
  const [chatStatus, setChatStatus] = useState<
    "idle" | "searching" | "connected" | "disconnected"
  >("idle");
  const [statusNotice, setStatusNotice] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);
  const [mutualInterests, setMutualInterests] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stopConfirm, setStopConfirm] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const managerRef = useRef<StrangerManager | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);
  const stopConfirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Initialize the stranger engine once.
  useEffect(() => {
    const mgr = new StrangerManager({
      onStatusChange: (status, notice) => {
        setChatStatus(status);
        if (notice) setStatusNotice(notice);

        if (status === "connected") {
          sounds.playConnect();
          setStopConfirm(false);
          setTimeout(() => textInputRef.current?.focus(), 120);
        } else if (status === "disconnected") {
          sounds.playDisconnect();
          setStopConfirm(false);
        }
      },
      onMessage: (msg) => {
        sounds.playMessage();
        setMessages((prev) => [...prev, msg]);
      },
      onTyping: (typing) => setIsStrangerTyping(typing),
      onMutualInterests: (mutual) => setMutualInterests(mutual),
    });

    managerRef.current = mgr;
    return () => {
      mgr.destroy();
    };
  }, []);

  const startChat = useCallback(() => {
    setMessages([]);
    setMutualInterests([]);
    setStatusNotice("");
    setStopConfirm(false);
    setEmojiOpen(false);
    setInputText("");
    managerRef.current?.startSearch(interests);
  }, [interests]);

  const handleStopAction = useCallback(() => {
    if (chatStatus === "searching") {
      managerRef.current?.disconnect(false, "Search cancelled.");
      setChatStatus("idle");
      return;
    }

    if (chatStatus === "connected") {
      if (!stopConfirm) {
        setStopConfirm(true);
        if (stopConfirmTimeoutRef.current)
          clearTimeout(stopConfirmTimeoutRef.current);
        stopConfirmTimeoutRef.current = setTimeout(
          () => setStopConfirm(false),
          3000,
        );
      } else {
        if (stopConfirmTimeoutRef.current)
          clearTimeout(stopConfirmTimeoutRef.current);
        setStopConfirm(false);
        managerRef.current?.disconnect(true, "The line went dead.");
      }
      return;
    }

    if (chatStatus === "disconnected") {
      startChat();
    }
  }, [chatStatus, stopConfirm, startChat]);

  // Keyboard shortcuts: ESC to stop/skip, SPACE to start from the lobby.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // The emoji picker wins before any chat shortcut.
        if (emojiOpen) {
          setEmojiOpen(false);
          return;
        }
        if (chatStatus !== "idle") {
          e.preventDefault();
          handleStopAction();
        }
        return;
      }

      if (e.key === " " && chatStatus === "idle" && !e.repeat) {
        const el = document.activeElement;
        const tag = el?.tagName ?? "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
        e.preventDefault();
        startChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatStatus, emojiOpen, handleStopAction, startChat]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  const hangUpToLobby = () => {
    managerRef.current?.disconnect(true);
    setChatStatus("idle");
    setStopConfirm(false);
    setEmojiOpen(false);
  };

  const handleSend = () => {
    if (chatStatus !== "connected") return;
    const text = inputText.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        sender: "you",
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    managerRef.current?.sendMessage(text);
    managerRef.current?.sendTyping(false);
    setInputText("");
    textInputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (chatStatus === "connected") {
      managerRef.current?.sendTyping(value.trim().length > 0);
    }
  };

  const addInterest = (raw: string) => {
    const clean = raw.trim().toLowerCase().replace(/^[~#,]+/, "");
    if (clean && !interests.includes(clean) && interests.length < 8) {
      setInterests([...interests, clean]);
      setInterestInput("");
    }
  };

  const removeInterest = (tag: string) => {
    setInterests(interests.filter((t) => t !== tag));
  };

  const inSession = chatStatus !== "idle";

  return (
    <div className="min-h-dvh">
      <AppTopbar
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        inSession={inSession}
        onHangUp={hangUpToLobby}
      />

      {!inSession ? (
        <ChatLobby
          interests={interests}
          interestInput={interestInput}
          onInterestInput={setInterestInput}
          onAddInterest={addInterest}
          onRemoveInterest={removeInterest}
          onStart={startChat}
        />
      ) : (
        <ChatSession
          chatStatus={chatStatus}
          statusNotice={statusNotice}
          messages={messages}
          isStrangerTyping={isStrangerTyping}
          mutualInterests={mutualInterests}
          interests={interests}
          stopConfirm={stopConfirm}
          inputText={inputText}
          emojiOpen={emojiOpen}
          onToggleEmoji={() => setEmojiOpen((open) => !open)}
          textInputRef={textInputRef}
          onInputChange={handleInputChange}
          onInputKeyDown={handleInputKeyDown}
          onSend={handleSend}
          onStopAction={handleStopAction}
        />
      )}
    </div>
  );
}