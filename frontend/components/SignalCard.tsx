/**
 * SignalCard — expanded view of a single signal with classification and actions.
 * Orange left-border for recommended action, matching signal viewer pattern.
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
    <div className="mt-2.5 bg-[#1C1C20] border border-white/[0.06] rounded-[10px] px-3.5 py-3 text-[12.5px] space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#F0F0F5] text-[13px]">{signal.actor}</span>
          <span className="text-[10px] px-1.5 py-px rounded bg-white/[0.05] text-[#5C5C6F] border border-white/[0.06]">
            {signal.source}
          </span>
        </div>
        <span className="text-[10px] text-[#5C5C6F]">
          {new Date(signal.timestamp).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Full text */}
      <p className="text-[13px] text-[#8B8B9E] leading-relaxed">{signal.text}</p>

      {/* Classification badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${URGENCY_COLORS[classification.urgency] || URGENCY_COLORS.low}`}>
          {classification.urgency}
        </span>
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${INTENT_COLORS[classification.intent_stage] || ""}`}>
          {classification.intent_stage}
        </span>
        <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/[0.04] text-[#8B8B9E]">
          {classification.primary_pain}
        </span>
        {classification.momentum_flag && (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/20">
            momentum
          </span>
        )}
      </div>

      {/* Recommended action — orange left border */}
      {classification.recommended_action && (
        <div className="text-[12.5px] text-[#8B8B9E] bg-white/[0.03] border-l-2 border-orange-400/70 rounded-r-lg px-3 py-2">
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
            className="flex-1 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-400 text-[12px] font-medium rounded-lg transition"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
