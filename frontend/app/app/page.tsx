"use client";

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

interface Signal {
  id: string;
  source: string;
  actor: string;
  text: string;
  timestamp: string;
  source_id: string;
  reply_to: string | null;
  metrics: Record<string, number>;
}

interface Classification {
  signal_id: string;
  intent_stage: string;
  primary_pain: string;
  urgency: string;
  confidence: number;
  momentum_flag: boolean;
  recommended_action: string;
}

interface ReviewItem {
  signal: Signal;
  classification: Classification;
  status: string;
  reviewed_at: string | null;
}

type FilterTab = "pending" | "approved" | "all";

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-300 border-red-500/20",
  high: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
  low: "bg-white/[0.06] text-gray-500 border-white/[0.06]",
};

const INTENT_COLORS: Record<string, string> = {
  exploring: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  evaluating: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  requesting: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  churning: "bg-red-500/15 text-red-300 border-red-500/20",
  advocating: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
};

function ConfidenceCircle({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const score = (value * 10).toFixed(1);
  const num = value * 10;
  const ring = num >= 8
    ? "ring-emerald-400/40 text-emerald-300"
    : num >= 6
    ? "ring-orange-400/40 text-orange-300"
    : "ring-red-400/40 text-red-300";
  const dims = size === "md" ? "w-10 h-10" : "w-7 h-7";
  const text = size === "md" ? "text-xs" : "text-[10px]";
  return (
    <div className={`${dims} rounded-full flex items-center justify-center bg-white/[0.06] ring-1 ${ring}`}>
      <span className={`${text} font-semibold`}>{score}</span>
    </div>
  );
}

const handleLogout = () => {
  document.cookie = "signalry_token=; path=/; max-age=0";
  window.location.href = "/";
};

export default function SignalViewer() {
  const [signals, setSignals] = useState<ReviewItem[]>([]);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/signals?status=${filter}&limit=50`);
      const data = await res.json();
      setSignals(data.signals || []);
    } catch {
      setSignals([]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const runPipeline = async () => {
    setRunning(true);
    try {
      await fetch(`${API}/signals/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      await fetchSignals();
    } catch { /* ignore */ }
    setRunning(false);
  };

  const approveSignal = async (id: string) => {
    await fetch(`${API}/signals/${id}/approve`, { method: "POST" });
    setSelected(null);
    fetchSignals();
  };

  const discardSignal = async (id: string) => {
    await fetch(`${API}/signals/${id}/discard`, { method: "POST" });
    setSelected(null);
    fetchSignals();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-serif font-semibold tracking-tight">
              Signal<span className="text-indigo-400">ry</span>
            </span>
            <span className="text-xs text-gray-500 ml-2">Signal Viewer</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/chat" className="text-xs text-gray-500 hover:text-gray-300 transition">
              Copilot
            </a>
            <button
              onClick={runPipeline}
              disabled={running}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {running ? "Running..." : "Run Pipeline"}
            </button>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300 transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-1 w-fit border border-white/5">
          {(["pending", "approved", "all"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setFilter(tab); setSelected(null); }}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${
                filter === tab
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Signal List */}
          <div className="lg:col-span-2 space-y-1.5">
            {loading && signals.length === 0 && (
              <div className="text-center py-12 text-gray-500">Loading signals...</div>
            )}
            {!loading && signals.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No signals found. Click &quot;Run Pipeline&quot; to process new signals.
              </div>
            )}
            {signals.map((item) => (
              <button
                key={item.signal.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left px-4 py-3 rounded-2xl border backdrop-blur-sm transition-all duration-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${
                  selected?.signal.id === item.signal.id
                    ? "bg-white/10 border-white/15"
                    : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">@{item.signal.actor}</span>
                      <span className="text-xs text-gray-500">{item.signal.source}</span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{item.signal.text}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <ConfidenceCircle value={item.classification.confidence} />
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${URGENCY_COLORS[item.classification.urgency] || URGENCY_COLORS.low}`}>
                      {item.classification.urgency}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${INTENT_COLORS[item.classification.intent_stage] || ""}`}>
                      {item.classification.intent_stage}
                    </span>
                    {item.classification.momentum_flag && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/20">
                        momentum
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{new Date(item.signal.timestamp).toLocaleDateString()}</span>
                  {item.signal.metrics.likes != null && <span>{item.signal.metrics.likes} likes</span>}
                  {item.signal.metrics.retweets != null && <span>{item.signal.metrics.retweets} RTs</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selected ? (
              <div className="sticky top-24 bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-5 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">@{selected.signal.actor}</span>
                      <span className="text-xs text-gray-500">{selected.signal.source}</span>
                    </div>
                    <ConfidenceCircle value={selected.classification.confidence} size="md" />
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{selected.signal.text}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Primary Pain</div>
                    <div className="text-sm text-white">{selected.classification.primary_pain || "\u2014"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recommended Action</div>
                    <div className="text-sm text-gray-300 bg-white/[0.03] border-l-2 border-orange-400/70 rounded-r-lg px-3 py-2">
                      {selected.classification.recommended_action || "\u2014"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${(selected.classification.confidence * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 tabular-nums">{(selected.classification.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Metrics</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selected.signal.metrics).map(([key, val]) => (
                        <div key={key} className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2">
                          <div className="text-xs text-gray-500">{key}</div>
                          <div className="text-sm font-medium text-gray-200">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${URGENCY_COLORS[selected.classification.urgency] || URGENCY_COLORS.low}`}>
                      {selected.classification.urgency}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${INTENT_COLORS[selected.classification.intent_stage] || ""}`}>
                      {selected.classification.intent_stage}
                    </span>
                    {selected.classification.momentum_flag && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/20">
                        momentum
                      </span>
                    )}
                  </div>
                </div>

                {selected.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => approveSignal(selected.signal.id)}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => discardSignal(selected.signal.id)}
                      className="flex-1 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 text-sm font-medium rounded-xl transition"
                    >
                      Discard
                    </button>
                  </div>
                )}

                {selected.status !== "pending" && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    Status: <span className="text-gray-400">{selected.status}</span>
                    {selected.reviewed_at && (
                      <> &middot; {new Date(selected.reviewed_at).toLocaleString()}</>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="sticky top-24 bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                Select a signal to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
