/**
 * BriefingCard — priority briefing showing top ranked signals.
 * Matches the landing page .chat-data card styling.
 */

interface SignalItem {
  signal: {
    id: string;
    source: string;
    actor: string;
    text: string;
    timestamp: string;
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

interface BriefingCardProps {
  signals: SignalItem[];
  onSelect?: (item: SignalItem) => void;
}

const SCORE_STYLE: Record<string, string> = {
  critical: "bg-red-500/15 text-red-500",
  high: "bg-orange-500/12 text-amber-600",
  medium: "bg-yellow-500/10 text-yellow-500",
  low: "bg-emerald-500/10 text-emerald-500",
};

const SOURCE_COLORS: Record<string, string> = {
  intercom: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  slack: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  hubspot: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  x: "bg-white/[0.06] text-gray-400 border-white/[0.08]",
};

export default function BriefingCard({ signals, onSelect }: BriefingCardProps) {
  if (!signals.length) return null;

  return (
    <div className="mt-2.5 bg-[#1C1C20] border border-white/[0.06] rounded-[10px] px-3.5 py-3 text-[12.5px] leading-[1.55]">
      {signals.map((item, i) => {
        const score = (item.classification.confidence * 10).toFixed(1);
        const urgency = item.classification.urgency;
        const scoreClass = SCORE_STYLE[urgency] || SCORE_STYLE.medium;
        const sourceClass = SOURCE_COLORS[item.signal.source] || SOURCE_COLORS.x;

        return (
          <div
            key={item.signal.id}
            onClick={() => onSelect?.(item)}
            className={`flex items-start gap-2 py-1.5 ${
              i < signals.length - 1 ? "border-b border-white/[0.04]" : ""
            } ${onSelect ? "cursor-pointer hover:bg-white/[0.02] -mx-1.5 px-1.5 rounded-lg transition" : ""}`}
          >
            <div
              className={`font-serif font-bold min-w-[32px] h-6 flex items-center justify-center rounded-md text-xs shrink-0 ${scoreClass}`}
            >
              {score}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#F0F0F5] text-[12.5px] truncate">
                {item.classification.primary_pain || item.signal.text.slice(0, 60)}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-[#5C5C6F]">
                  {item.signal.actor}
                </span>
                <span className={`text-[9px] px-1.5 py-px rounded border ${sourceClass}`}>
                  {item.signal.source}
                </span>
                {item.classification.momentum_flag && (
                  <span className="text-[9px] px-1.5 py-px rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    momentum
                  </span>
                )}
              </div>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                urgency === "critical"
                  ? "bg-red-500/15 text-red-300"
                  : urgency === "high"
                  ? "bg-orange-500/15 text-orange-300"
                  : urgency === "medium"
                  ? "bg-yellow-500/15 text-yellow-300"
                  : "text-gray-500"
              }`}
            >
              {urgency}
            </span>
          </div>
        );
      })}
    </div>
  );
}
