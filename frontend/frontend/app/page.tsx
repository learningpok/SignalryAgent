"use client";

import { useEffect, useState } from "react";

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
};

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, 'positive' | 'negative'>>({});
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/signals")
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSignals(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  const handleFeedback = async (signalId: string, type: 'positive' | 'negative') => {
    setFeedback(prev => ({ ...prev, [signalId]: type }));
    
    try {
      const response = await fetch("http://localhost:8000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signal_id: signalId,
          feedback_type: type
        })
      });
      
      if (response.ok) {
        setFeedbackStatus(`✅ Feedback saved: ${type === 'positive' ? 'Relevant' : 'Noise'}`);
        setTimeout(() => setFeedbackStatus(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save feedback:", err);
      setFeedbackStatus("❌ Failed to save feedback");
      setTimeout(() => setFeedbackStatus(null), 3000);
    }
  };

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold">Signalry</h1>
        <p className="text-gray-600 mt-1">What deserves attention now</p>
        {feedbackStatus && (
          <div className="mt-2 text-sm font-medium text-blue-600">
            {feedbackStatus}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50 text-red-700">
          <div className="font-bold">Error loading signals</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading signals...
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-xl p-5 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Signals</h2>
              <span className="text-sm text-gray-500">{signals.length} total</span>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {signals.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`w-full text-left border rounded-lg p-4 transition-all ${
                    selected?.id === s.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } ${
                    feedback[s.id] === 'positive' ? 'ring-2 ring-green-300' :
                    feedback[s.id] === 'negative' ? 'ring-2 ring-red-300' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {s.priority_score?.toFixed(1) || "0.0"}
                      </span>
                      <div className="text-xs">
                        <div className="font-medium text-gray-700">{s.signal_type}</div>
                        <div className="text-gray-500">{s.format}</div>
                      </div>
                    </div>
                    {feedback[s.id] && (
                      <span className="text-lg">
                        {feedback[s.id] === 'positive' ? '👍' : '👎'}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-700 line-clamp-2">
                    {s.text || "No text available"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-5 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            
            {!selected ? (
              <div className="text-center py-12 text-gray-400">
                ← Select a signal to inspect
              </div>
            ) : (
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {selected.priority_score?.toFixed(1) || "0.0"}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{selected.signal_type}</span>
                        {" · "}
                        <span>{selected.format}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeedback(selected.id, 'positive')}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          feedback[selected.id] === 'positive'
                            ? 'bg-green-500 text-white border-green-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-green-50 hover:border-green-400'
                        }`}
                      >
                        👍 Relevant
                      </button>
                      <button
                        onClick={() => handleFeedback(selected.id, 'negative')}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          feedback[selected.id] === 'negative'
                            ? 'bg-red-500 text-white border-red-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-red-50 hover:border-red-400'
                        }`}
                      >
                        👎 Noise
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 bg-purple-50">
                    <div className="text-xs text-gray-600 mb-1">Severity</div>
                    <div className="text-xl font-bold text-purple-700">
                      {selected.severity_score?.toFixed(1) || "0"}
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 bg-orange-50">
                    <div className="text-xs text-gray-600 mb-1">Recurrence</div>
                    <div className="text-xl font-bold text-orange-700">
                      {selected.recurrence_score?.toFixed(1) || "0"}
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 bg-green-50">
                    <div className="text-xs text-gray-600 mb-1">Business</div>
                    <div className="text-xl font-bold text-green-700">
                      {selected.business_weight?.toFixed(1) || "0"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Content</div>
                  <div className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selected.text || "No content"}
                  </div>
                </div>

                {selected.reasons && selected.reasons.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Why this matters
                    </div>
                    <ul className="space-y-2">
                      {selected.reasons.slice(0, 8).map((r, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-gray-400 pt-3 border-t">
                  {selected.timestamp || "No timestamp"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
