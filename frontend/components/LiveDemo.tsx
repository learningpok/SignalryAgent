"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:8000";

type Persona = "product" | "crypto" | "sales";

interface SignalData {
  signal: { id: string; source: string; actor: string; text: string };
  classification: {
    urgency: string;
    confidence: number;
    primary_pain: string;
    momentum_flag: boolean;
  };
}

interface MomentumCluster {
  pain: string;
  signal_count: number;
  unique_actors: number;
  sources: string[];
}

const PERSONA_CONFIG: Record<
  Persona,
  { label: string; channels: string[] }
> = {
  product: { label: "Product", channels: ["Intercom", "Slack", "Hubspot"] },
  crypto: { label: "Crypto", channels: ["X", "Telegram", "Discord"] },
  sales: { label: "Sales", channels: ["Hubspot", "Slack", "Intercom"] },
};

const SCORE_CLS: Record<string, string> = {
  critical: "s-r",
  high: "s-r",
  medium: "s-am",
  low: "s-g",
};

/* ── Static fallback when API is unavailable ────────────────────────── */

const STATIC_BRIEFING = [
  { score: "9.2", cls: "s-r", title: "API timeout on batch processing", meta: "3 enterprise reports \u00B7 Intercom + Slack" },
  { score: "8.4", cls: "s-r", title: "Rate limiter returning false 429s", meta: "4 customers \u00B7 cross-channel pattern" },
  { score: "6.7", cls: "s-am", title: "Pricing concerns from enterprise", meta: "3 accounts evaluating \u00B7 Hubspot + Slack" },
];

const STATIC_MOMENTUM = [
  { pain: "API reliability", count: 7, actors: 5, sources: "Intercom + Slack" },
  { pain: "Pricing concerns", count: 3, actors: 3, sources: "Hubspot + Slack" },
];

/* ── Component ──────────────────────────────────────────────────────── */

export default function LiveDemo() {
  const [persona, setPersona] = useState<Persona>("product");
  const [step, setStep] = useState(0);
  const [briefing, setBriefing] = useState<{ message: string; signals: SignalData[] } | null>(null);
  const [momentum, setMomentum] = useState<{ message: string; clusters: MomentumCluster[] } | null>(null);
  const [apiOk, setApiOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Scroll chat body to bottom when step changes
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [step, loading]);

  // Fetch data when persona changes
  useEffect(() => {
    clearTimers();
    setStep(0);
    setLoading(true);
    setBriefing(null);
    setMomentum(null);

    let cancelled = false;

    const load = async () => {
      try {
        await fetch(`${API}/signals/seed?persona=${persona}`, { method: "POST" });

        const bRes = await fetch(`${API}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "What should I focus on right now?" }),
        });
        const bData = await bRes.json();

        const mRes = await fetch(`${API}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Are there any momentum patterns?" }),
        });
        const mData = await mRes.json();

        if (!cancelled) {
          setBriefing({ message: bData.message, signals: bData.data?.signals || [] });
          setMomentum({ message: mData.message, clusters: mData.data?.clusters || [] });
          setApiOk(true);
        }
      } catch {
        if (!cancelled) setApiOk(false);
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; clearTimers(); };
  }, [persona, clearTimers]);

  // Auto-play steps after data loads
  useEffect(() => {
    if (loading) return;
    clearTimers();
    setStep(1);
    timersRef.current = [
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 6500),
      setTimeout(() => setStep(5), 10000),
    ];
    return clearTimers;
  }, [loading, clearTimers]);

  const config = PERSONA_CONFIG[persona];

  /* ── Render helpers ─────────────────────────────────────────────── */

  const renderBriefingRows = () => {
    if (!apiOk || !briefing?.signals.length) {
      return STATIC_BRIEFING.map((item, i) => (
        <div key={i} className="chat-data-row">
          <div className={`chat-data-score ${item.cls}`}>{item.score}</div>
          <div className="chat-data-body">
            <div className="chat-data-title">{item.title}</div>
            <div className="chat-data-meta">{item.meta}</div>
          </div>
        </div>
      ));
    }
    return briefing.signals.slice(0, 3).map((item) => {
      const score = (item.classification.confidence * 10).toFixed(1);
      const cls = SCORE_CLS[item.classification.urgency] || "s-am";
      return (
        <div key={item.signal.id} className="chat-data-row">
          <div className={`chat-data-score ${cls}`}>{score}</div>
          <div className="chat-data-body">
            <div className="chat-data-title">{item.classification.primary_pain}</div>
            <div className="chat-data-meta">
              {item.signal.actor} {"\u00B7"} {item.signal.source}
              {item.classification.momentum_flag && <> {"\u00B7"} <strong style={{ color: "var(--am)" }}>momentum</strong></>}
            </div>
          </div>
        </div>
      );
    });
  };

  const renderMomentumRows = () => {
    if (!apiOk || !momentum?.clusters.length) {
      return STATIC_MOMENTUM.map((c, i) => (
        <div key={i} className="chat-data-row">
          <div className="chat-data-score s-am">New</div>
          <div className="chat-data-body">
            <div className="chat-data-title">{"\u201C"}{c.pain}{"\u201D"} cluster</div>
            <div className="chat-data-meta">
              {c.count} signals from {c.actors} actors {"\u00B7"} {c.sources}
            </div>
          </div>
        </div>
      ));
    }
    return momentum.clusters.slice(0, 3).map((c) => (
      <div key={c.pain} className="chat-data-row">
        <div className="chat-data-score s-am">New</div>
        <div className="chat-data-body">
          <div className="chat-data-title">{"\u201C"}{c.pain}{"\u201D"} cluster</div>
          <div className="chat-data-meta">
            {c.signal_count} signals from {c.unique_actors} actors {"\u00B7"} {c.sources.join(" + ")}
          </div>
        </div>
      </div>
    ));
  };

  const briefingText = apiOk && briefing
    ? briefing.message
    : `I scanned signals across ${config.channels.length} channels. Here\u2019s what needs your attention:`;

  const momentumText = apiOk && momentum
    ? momentum.message
    : "I found 2 momentum patterns forming across your channels:";

  /* ── Animation style — override nth-child delays ────────────────── */
  const animIn = { animationDelay: "0s" };

  return (
    <>
      {/* Persona selector */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
        {(Object.keys(PERSONA_CONFIG) as Persona[]).map((p) => (
          <button
            key={p}
            onClick={() => setPersona(p)}
            style={{
              padding: "6px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: persona === p
                ? "1px solid rgba(129,140,248,.3)"
                : "1px solid rgba(255,255,255,.08)",
              background: persona === p
                ? "rgba(129,140,248,.12)"
                : "rgba(255,255,255,.04)",
              color: persona === p ? "#818CF8" : "#8B8B9E",
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            {PERSONA_CONFIG[p].label}
          </button>
        ))}
      </div>

      <div className="chat-window">
        {/* Top bar */}
        <div className="chat-topbar">
          <div className="chat-topbar-dot" />
          <div className="chat-topbar-name">Signalry Agent</div>
          <div className="chat-topbar-channels">
            {config.channels.map((ch) => (
              <span key={ch} className="chat-topbar-ch">{ch}</span>
            ))}
          </div>
          <div className="chat-topbar-status">
            Monitoring {config.channels.length} channels
          </div>
        </div>

        {/* Chat body */}
        <div className="chat-body" ref={bodyRef}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
              <div className="chat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {!loading && step >= 1 && (
            <div className="chat-msg user" style={animIn}>
              <div className="chat-avatar">B</div>
              <div className="chat-bubble">What should I focus on right now?</div>
            </div>
          )}

          {!loading && step >= 2 && (
            <div className="chat-msg agent" style={animIn}>
              <div className="chat-avatar">S</div>
              <div className="chat-bubble">
                {briefingText}
                <div className="chat-data">{renderBriefingRows()}</div>
              </div>
            </div>
          )}

          {!loading && step >= 3 && (
            <div className="chat-msg user" style={animIn}>
              <div className="chat-avatar">B</div>
              <div className="chat-bubble">Are there any momentum patterns forming?</div>
            </div>
          )}

          {!loading && step >= 4 && (
            <div className="chat-msg agent" style={animIn}>
              <div className="chat-avatar">S</div>
              <div className="chat-bubble">
                {momentumText}
                <div className="chat-data">{renderMomentumRows()}</div>
              </div>
            </div>
          )}

          {!loading && step >= 5 && (
            <div style={{
              textAlign: "center",
              padding: "16px 0 4px",
              animation: "chatIn .5s ease forwards",
            }}>
              <a
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "10px 28px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "white",
                  textDecoration: "none",
                  transition: "transform .15s",
                }}
              >
                Try it yourself {"\u2192"}
              </a>
            </div>
          )}
        </div>

        {/* Input bar — clicking opens real chat */}
        <div className="chat-input-bar" onClick={() => window.location.href = "/login"} style={{ cursor: "pointer" }}>
          <div className="chat-input">Ask about signals, trends, or priorities{"\u2026"}</div>
          <button className="chat-send">
            <svg viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
