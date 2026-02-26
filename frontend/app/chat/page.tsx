"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "../../components/ChatMessage";
import BriefingCard from "../../components/BriefingCard";
import SignalCard from "../../components/SignalCard";
import MomentumAlert from "../../components/MomentumAlert";

const API = "http://localhost:8000";

interface ChatResponse {
  type: "briefing" | "momentum" | "summary";
  message: string;
  data: {
    signals?: Array<{
      signal: {
        id: string;
        source: string;
        actor: string;
        text: string;
        timestamp: string;
        metrics: Record<string, number>;
      };
      classification: {
        urgency: string;
        confidence: number;
        primary_pain: string;
        momentum_flag: boolean;
        intent_stage: string;
        recommended_action: string;
      };
      status: string;
    }>;
    clusters?: Array<{
      pain: string;
      signal_count: number;
      unique_actors: number;
      sources: string[];
      signals: Array<{
        signal: { id: string; actor: string; text: string; source: string };
        classification: { urgency: string };
      }>;
    }>;
    stats?: Record<string, number>;
    momentum_count?: number;
    critical_count?: number;
  };
}

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  response?: ChatResponse;
  expandedSignal?: number | null;
}

const PRESETS = [
  "What should I focus on right now?",
  "Show me critical signals from the last 24 hours",
  "Are there any momentum patterns?",
  "Give me a summary of today\u2019s signals",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || sending) return;

      const userMsg: Message = { id: Date.now().toString(), role: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);
      scrollToBottom();

      try {
        const res = await fetch(`${API}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data: ChatResponse = await res.json();

        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "agent",
          text: data.message,
          response: data,
          expandedSignal: null,
        };
        setMessages((prev) => [...prev, agentMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "agent",
            text: "Couldn\u2019t connect to the API. Make sure the backend is running on port 8000.",
          },
        ]);
      }

      setSending(false);
      scrollToBottom();
    },
    [sending, scrollToBottom]
  );

  const handleLogout = () => {
    document.cookie = "signalry_token=; path=/; max-age=0";
    window.location.href = "/";
  };

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleExpand = (msgId: string, idx: number) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, expandedSignal: m.expandedSignal === idx ? null : idx }
          : m
      )
    );
  };

  const handleAction = () => {
    // Refresh chat by re-asking the last user question
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) sendMessage(lastUser.text);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl shrink-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-serif font-semibold tracking-tight hover:opacity-80 transition">
              Signal<span className="text-indigo-400">ry</span>
            </a>
            <span className="text-xs text-gray-500 hidden sm:inline">Copilot</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/app" className="text-xs text-gray-500 hover:text-gray-300 transition">
              Signal Viewer
            </a>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-[#5C5C6F]">Monitoring 3 channels</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300 transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Chat body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {/* Empty state — presets */}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/15 flex items-center justify-center mb-5">
                <span className="text-xl font-bold text-indigo-300 font-serif">S</span>
              </div>
              <h2 className="text-lg font-semibold text-[#F0F0F5] mb-1">What deserves attention?</h2>
              <p className="text-sm text-[#5C5C6F] mb-8 text-center max-w-sm">
                Ask Signalry about your signals, priorities, and momentum patterns.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => sendMessage(preset)}
                    className="text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-[#8B8B9E] hover:bg-white/[0.06] hover:text-[#F0F0F5] hover:border-white/[0.1] transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role}>
              {msg.role === "user" ? (
                msg.text
              ) : (
                <>
                  <span>{msg.text}</span>

                  {/* Briefing / Summary — signal list */}
                  {msg.response &&
                    (msg.response.type === "briefing" || msg.response.type === "summary") &&
                    msg.response.data.signals &&
                    msg.response.data.signals.length > 0 && (
                      <>
                        <BriefingCard
                          signals={msg.response.data.signals}
                          onSelect={(item) => {
                            const idx = msg.response!.data.signals!.findIndex(
                              (s) => s.signal.id === item.signal.id
                            );
                            toggleExpand(msg.id, idx);
                          }}
                        />

                        {/* Expanded signal detail */}
                        {msg.expandedSignal != null &&
                          msg.response.data.signals[msg.expandedSignal] && (
                            <SignalCard
                              item={msg.response.data.signals[msg.expandedSignal]}
                              onAction={handleAction}
                            />
                          )}
                      </>
                    )}

                  {/* Momentum clusters */}
                  {msg.response?.type === "momentum" &&
                    msg.response.data.clusters &&
                    msg.response.data.clusters.length > 0 && (
                      <MomentumAlert clusters={msg.response.data.clusters} />
                    )}

                  {/* Stats footer */}
                  {msg.response?.data.stats && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#5C5C6F]">
                      <span>{msg.response.data.stats.total || 0} total</span>
                      <span>{msg.response.data.stats.pending || 0} pending</span>
                      {(msg.response.data.momentum_count ?? 0) > 0 && (
                        <span className="text-amber-400/70">
                          {msg.response.data.momentum_count} momentum
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </ChatMessage>
          ))}

          {/* Sending indicator */}
          {sending && (
            <ChatMessage role="agent">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5C5C6F] animate-[typingDot_1.2s_ease-in-out_infinite]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#5C5C6F] animate-[typingDot_1.2s_ease-in-out_0.15s_infinite]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#5C5C6F] animate-[typingDot_1.2s_ease-in-out_0.3s_infinite]" />
              </div>
            </ChatMessage>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask Signalry what matters\u2026"
            className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#F0F0F5] placeholder-[#5C5C6F] outline-none focus:border-indigo-500/30 transition"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center hover:scale-105 disabled:opacity-40 transition shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
