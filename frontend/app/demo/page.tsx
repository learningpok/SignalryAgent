"use client";

import { useState, useEffect } from "react";

// Types matching backend schema
interface Signal {
  id: string;
  source: string;
  actor: string;
  text: string;
  timestamp: string;
  source_id: string;
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

interface Stats {
  total: number;
  pending: number;
  approved: number;
  discarded: number;
  outcomes_logged: number;
  momentum_flags: number;
}

const API_URL = "http://localhost:8000";

const urgencyColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const intentLabels: Record<string, string> = {
  exploring: "🔍 Exploring",
  evaluating: "⚖️ Evaluating",
  requesting: "🙋 Requesting",
  churning: "🚪 Churning",
  advocating: "📣 Advocating",
};

export default function DemoPage() {
  const [signals, setSignals] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  const fetchSignals = async () => {
    try {
      const res = await fetch(`${API_URL}/signals?status=${filter}&limit=50`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setSignals(data.signals);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch signals");
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  const runPipeline = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/signals/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: ["pump", "token", "shipping", "building", "need", "broken", "scam"] }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      await fetchSignals();
      await fetchStats();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run pipeline");
    } finally {
      setLoading(false);
    }
  };

  const approveSignal = async (signalId: string) => {
    try {
      await fetch(`${API_URL}/signals/${signalId}/approve`, { method: "POST" });
      await fetchSignals();
      await fetchStats();
      setSelectedSignal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    }
  };

  const discardSignal = async (signalId: string) => {
    try {
      await fetch(`${API_URL}/signals/${signalId}/discard`, { method: "POST" });
      await fetchSignals();
      await fetchStats();
      setSelectedSignal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to discard");
    }
  };

  useEffect(() => {
    fetchSignals();
    fetchStats();
  }, [filter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm">S</div>
            <span className="text-xl font-semibold">Signalry</span>
            <span className="text-xs text-white/50 ml-2 px-2 py-0.5 rounded bg-white/5 border border-white/10">Demo</span>
          </div>
          <a href="/" className="text-sm text-white/60 hover:text-white transition">← Back to Home</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Pending", value: stats.pending, color: "text-yellow-400" },
              { label: "Approved", value: stats.approved, color: "text-green-400" },
              { label: "Discarded", value: stats.discarded, color: "text-red-400" },
              { label: "Outcomes", value: stats.outcomes_logged, color: "text-blue-400" },
              { label: "Momentum 🔥", value: stats.momentum_flags, color: "text-orange-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button onClick={runPipeline} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
            {loading ? "Processing..." : "▶ Run Pipeline"}
          </button>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["pending", "approved", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-md text-sm transition ${filter === f ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => { fetchSignals(); fetchStats(); }} className="px-3 py-2 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg transition">↻ Refresh</button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <strong>Error:</strong> {error}
            <div className="text-xs mt-1 text-red-400/70">Make sure backend is running: uvicorn api:app --reload --port 8000</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5"><h2 className="font-semibold">Signals ({signals.length})</h2></div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {signals.length === 0 ? (
                <div className="p-8 text-center text-white/40">No signals yet. Click "Run Pipeline" to process mock data.</div>
              ) : (
                signals.map((item) => (
                  <button key={item.signal.id} onClick={() => setSelectedSignal(item)} className={`w-full text-left p-4 hover:bg-white/5 transition ${selectedSignal?.signal.id === item.signal.id ? "bg-white/10" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${urgencyColors[item.classification.urgency]}`}>{item.classification.urgency.toUpperCase()}</span>
                          <span className="text-xs text-white/50">{intentLabels[item.classification.intent_stage] || item.classification.intent_stage}</span>
                          {item.classification.momentum_flag && <span className="text-xs">🔥</span>}
                        </div>
                        <div className="text-sm text-white/80 truncate"><span className="text-violet-400">@{item.signal.actor}</span>: {item.signal.text.slice(0, 80)}{item.signal.text.length > 80 && "..."}</div>
                        <div className="text-xs text-white/40 mt-1">Pain: {item.classification.primary_pain}</div>
                      </div>
                      <div className="text-xs text-white/30">{Math.round(item.classification.confidence * 100)}%</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5"><h2 className="font-semibold">Signal Details</h2></div>
            {!selectedSignal ? (
              <div className="p-8 text-center text-white/40">Select a signal to view details</div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedSignal.status === "approved" ? "bg-green-500/20 text-green-400" : selectedSignal.status === "discarded" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{selectedSignal.status.toUpperCase()}</span>
                  {selectedSignal.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => approveSignal(selectedSignal.signal.id)} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition">✓ Approve</button>
                      <button onClick={() => discardSignal(selectedSignal.signal.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition">✗ Discard</button>
                    </div>
                  )}
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-violet-400 font-medium">@{selectedSignal.signal.actor}</span>
                    <span className="text-xs text-white/30">{new Date(selectedSignal.signal.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-white/90">{selectedSignal.signal.text}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-lg p-3"><div className="text-xs text-white/50 mb-1">Intent Stage</div><div className="font-medium">{intentLabels[selectedSignal.classification.intent_stage] || selectedSignal.classification.intent_stage}</div></div>
                  <div className="bg-black/30 rounded-lg p-3"><div className="text-xs text-white/50 mb-1">Urgency</div><div className="font-medium capitalize">{selectedSignal.classification.urgency}</div></div>
                  <div className="bg-black/30 rounded-lg p-3"><div className="text-xs text-white/50 mb-1">Confidence</div><div className="font-medium">{Math.round(selectedSignal.classification.confidence * 100)}%</div></div>
                  <div className="bg-black/30 rounded-lg p-3"><div className="text-xs text-white/50 mb-1">Momentum</div><div className="font-medium">{selectedSignal.classification.momentum_flag ? "🔥 Yes" : "No"}</div></div>
                </div>
                <div className="bg-black/30 rounded-lg p-3"><div className="text-xs text-white/50 mb-1">Primary Pain</div><div className="font-medium">{selectedSignal.classification.primary_pain}</div></div>
                <div className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-lg p-3"><div className="text-xs text-violet-300 mb-1">Recommended Action</div><div className="text-white/90">{selectedSignal.classification.recommended_action}</div></div>
                <div className="text-xs text-white/30 font-mono">ID: {selectedSignal.signal.id}</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
