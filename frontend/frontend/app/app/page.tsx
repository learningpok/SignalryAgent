"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Signal = {
  id: string;
  priority_score: number;
  severity_score: number;
  recurrence_score: number;
  business_weight: number;
  signal_type: string;
  format: string;
  reasons: string[];
  text: string;
  timestamp: string;
  recommended_action: string;
};

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, 'positive' | 'negative'>>({});
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, { acted: boolean }>>({});

  useEffect(() => {
    fetch("http://localhost:8000/signals")
      .then(res => res.json())
      .then(data => {
        setSignals(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFeedback = async (signalId: string, type: 'positive' | 'negative') => {
    setFeedback(prev => ({ ...prev, [signalId]: type }));
    
    await fetch("http://localhost:8000/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signal_id: signalId, feedback_type: type })
    });
    
    setFeedbackStatus(type === 'positive' ? 'Marked relevant' : 'Marked noise');
    setTimeout(() => setFeedbackStatus(null), 2000);
  };

  const handleOutcome = async (signalId: string, acted: boolean) => {
    setOutcomes(prev => ({ ...prev, [signalId]: { acted } }));
    
    await fetch("http://localhost:8000/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signal_id: signalId,
        acted,
        response_type: acted ? "follow_up" : "none",
        notes: acted ? "Action taken" : "No action"
      })
    });
    
    setFeedbackStatus(acted ? 'Outcome: Acted' : 'Outcome: Skipped');
    setTimeout(() => setFeedbackStatus(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      {/* Lovable-style header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-900 rounded-lg"></div>
            <span className="text-base font-semibold text-gray-900">Signalry</span>
          </Link>
          
          {feedbackStatus && (
            <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-top-2 duration-200">
              {feedbackStatus}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[380px_1fr] gap-6">
            {/* Signals sidebar (Lovable left panel style) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-600">Signals</h2>
                <span className="text-xs text-gray-400">{signals.length}</span>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
                {signals.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${
                      selected?.id === s.id
                        ? "bg-white shadow-md"
                        : "bg-white/50 hover:bg-white/80 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-gray-900">
                          {s.priority_score?.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {s.signal_type.split('_')[0]}
                        </div>
                      </div>
                      {feedback[s.id] && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          feedback[s.id] === 'positive' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {feedback[s.id] === 'positive' ? '✓' : '×'}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      {s.text}
                    </p>
                    
                    {s.recommended_action && s.recommended_action !== 'No action recommended' && (
                      <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg line-clamp-1">
                        {s.recommended_action}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main content (Lovable main panel style) */}
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 min-h-[calc(100vh-160px)]">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="text-5xl mb-3">←</div>
                  <p className="text-sm text-gray-400">Select a signal to view details</p>
                </div>
              ) : (
                <div className="p-8 space-y-6 h-full overflow-y-auto">
                  {/* Priority score (big and bold, Lovable style) */}
                  <div>
                    <div className="text-5xl font-bold text-gray-900 mb-1 tracking-tight">
                      {selected.priority_score?.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selected.signal_type.replace(/_/g, ' ')} · {selected.format}
                    </div>
                  </div>

                  {/* Feedback buttons (Lovable style: simple, clean) */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback(selected.id, 'positive')}
                      className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                        feedback[selected.id] === 'positive'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Relevant
                    </button>
                    <button
                      onClick={() => handleFeedback(selected.id, 'negative')}
                      className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                        feedback[selected.id] === 'negative'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Noise
                    </button>
                  </div>

                  {/* Recommended action card */}
                  {selected.recommended_action && selected.recommended_action !== 'No action recommended' && (
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Recommended
                      </div>
                      <div className="text-sm text-gray-900 mb-4">
                        {selected.recommended_action}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOutcome(selected.id, true)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                            outcomes[selected.id]?.acted
                              ? 'bg-gray-900 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          Acted
                        </button>
                        <button
                          onClick={() => handleOutcome(selected.id, false)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                            outcomes[selected.id] && !outcomes[selected.id].acted
                              ? 'bg-gray-900 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          Skipped
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Score breakdown (minimal, clean) */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-0.5">Severity</div>
                      <div className="text-xl font-bold text-gray-900">
                        {selected.severity_score?.toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-0.5">Recurrence</div>
                      <div className="text-xl font-bold text-gray-900">
                        {selected.recurrence_score?.toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-0.5">Business</div>
                      <div className="text-xl font-bold text-gray-900">
                        {selected.business_weight?.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Content
                    </div>
                    <div className="text-sm text-gray-800 bg-white rounded-xl p-4 border border-gray-200">
                      {selected.text}
                    </div>
                  </div>

                  {/* Reasons */}
                  {selected.reasons?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Why this matters
                      </div>
                      <div className="space-y-2">
                        {selected.reasons.slice(0, 5).map((r, i) => (
                          <div key={i} className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-200">
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400 pt-4 border-t border-gray-200">
                    {selected.timestamp}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
