/**
 * BriefingCard — priority briefing showing top ranked signals.
 * Light theme matching landing page aesthetic.
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
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-emerald-100 text-emerald-700",
};

const SOURCE_COLORS: Record<string, string> = {
  intercom: "bg-blue-50 text-blue-600 border-blue-200",
  slack: "bg-purple-50 text-purple-600 border-purple-200",
  hubspot: "bg-orange-50 text-orange-600 border-orange-200",
  x: "bg-gray-50 text-gray-600 border-gray-200",
  telegram: "bg-sky-50 text-sky-600 border-sky-200",
  discord: "bg-indigo-50 text-indigo-600 border-indigo-200",
};

export default function BriefingCard({ signals, onSelect }: BriefingCardProps) {
  if (!signals.length) return null;

  return (
    <div className="mt-2.5 bg-white border border-gray-200 rounded-[10px] px-3.5 py-3 text-[12.5px] leading-[1.55] shadow-sm">
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
              i < signals.length - 1 ? "border-b border-gray-100" : ""
            } ${onSelect ? "cursor-pointer hover:bg-gray-50 -mx-1.5 px-1.5 rounded-lg transition" : ""}`}
          >
            <div
              className={`font-serif font-bold min-w-[32px] h-6 flex items-center justify-center rounded-md text-xs shrink-0 ${scoreClass}`}
            >
              {score}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-[12.5px] truncate">
                {item.classification.primary_pain || item.signal.text.slice(0, 60)}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-gray-500">
                  {item.signal.actor}
                </span>
                <span className={`text-[9px] px-1.5 py-px rounded border ${sourceClass}`}>
                  {item.signal.source}
                </span>
                {item.classification.momentum_flag && (
                  <span className="text-[9px] px-1.5 py-px rounded bg-amber-100 text-amber-700 border border-amber-200">
                    momentum
                  </span>
                )}
              </div>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                urgency === "critical"
                  ? "bg-red-100 text-red-700"
                  : urgency === "high"
                  ? "bg-orange-100 text-orange-700"
                  : urgency === "medium"
                  ? "bg-yellow-100 text-yellow-700"
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
