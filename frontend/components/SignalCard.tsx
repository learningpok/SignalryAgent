/**
 * SignalCard — expanded view of a single signal with classification and actions.
 * Light theme matching landing page aesthetic.
 */

const API = "http://localhost:8000";

interface SignalItem {
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
}

interface SignalCardProps {
  item: SignalItem;
  onAction?: () => void;
}

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-500 border-gray-200",
};

const INTENT_COLORS: Record<string, string> = {
  exploring: "bg-blue-100 text-blue-700 border-blue-200",
  evaluating: "bg-purple-100 text-purple-700 border-purple-200",
  requesting: "bg-emerald-100 text-emerald-700 border-emerald-200",
  churning: "bg-red-100 text-red-700 border-red-200",
  advocating: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export default function SignalCard({ item, onAction }: SignalCardProps) {
  const { signal, classification, status } = item;

  const approve = async () => {
    await fetch(`${API}/signals/${signal.id}/approve`, { method: "POST" });
    onAction?.();
  };

  const discard = async () => {
    await fetch(`${API}/signals/${signal.id}/discard`, { method: "POST" });
    onAction?.();
  };

  return (
    <div className="mt-2.5 bg-white border border-gray-200 rounded-[10px] px-3.5 py-3 text-[12.5px] space-y-2.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-[13px]">{signal.actor}</span>
          <span className="text-[10px] px-1.5 py-px rounded bg-gray-100 text-gray-500 border border-gray-200">
            {signal.source}
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          {new Date(signal.timestamp).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Full text */}
      <p className="text-[13px] text-gray-600 leading-relaxed">{signal.text}</p>

      {/* Classification badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${URGENCY_COLORS[classification.urgency] || URGENCY_COLORS.low}`}>
          {classification.urgency}
        </span>
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${INTENT_COLORS[classification.intent_stage] || ""}`}>
          {classification.intent_stage}
        </span>
        <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
          {classification.primary_pain}
        </span>
        {classification.momentum_flag && (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full border bg-amber-100 text-amber-700 border-amber-200">
            momentum
          </span>
        )}
      </div>

      {/* Recommended action — orange left border */}
      {classification.recommended_action && (
        <div className="text-[12.5px] text-gray-600 bg-gray-50 border-l-2 border-orange-400 rounded-r-lg px-3 py-2">
          {classification.recommended_action}
        </div>
      )}

      {/* Actions */}
      {status === "pending" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={approve}
            className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-medium rounded-lg transition"
          >
            Approve
          </button>
          <button
            onClick={discard}
            className="flex-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-[12px] font-medium rounded-lg transition"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
