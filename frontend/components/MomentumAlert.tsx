/**
 * MomentumAlert — cross-channel correlation alert card.
 * Light theme matching landing page aesthetic.
 */

interface MomentumCluster {
  pain: string;
  signal_count: number;
  unique_actors: number;
  sources: string[];
  signals: Array<{
    signal: { id: string; actor: string; text: string; source: string };
    classification: { urgency: string };
  }>;
}

interface MomentumAlertProps {
  clusters: MomentumCluster[];
}

const SOURCE_COLORS: Record<string, string> = {
  intercom: "bg-blue-50 text-blue-600 border-blue-200",
  slack: "bg-purple-50 text-purple-600 border-purple-200",
  hubspot: "bg-orange-50 text-orange-600 border-orange-200",
  x: "bg-gray-50 text-gray-600 border-gray-200",
  telegram: "bg-sky-50 text-sky-600 border-sky-200",
  discord: "bg-indigo-50 text-indigo-600 border-indigo-200",
};

export default function MomentumAlert({ clusters }: MomentumAlertProps) {
  if (!clusters.length) return null;

  return (
    <div className="mt-2.5 space-y-2.5">
      {clusters.map((cluster) => (
        <div
          key={cluster.pain}
          className="bg-white border border-amber-200 rounded-[10px] px-3.5 py-3 text-[12.5px] shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-100 text-amber-600 text-[10px]">
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" />
              </svg>
            </div>
            <span className="font-semibold text-amber-700 text-[13px]">
              Momentum: {cluster.pain}
            </span>
          </div>

          {/* Summary line */}
          <p className="text-gray-600 mb-2">
            <strong className="text-gray-900">{cluster.signal_count} signals</strong> from{" "}
            <strong className="text-gray-900">{cluster.unique_actors} actors</strong> across{" "}
            {cluster.sources.map((src, i) => (
              <span key={src}>
                {i > 0 && (i === cluster.sources.length - 1 ? " and " : ", ")}
                <span className={`inline-flex text-[9px] px-1.5 py-px rounded border ${SOURCE_COLORS[src] || SOURCE_COLORS.x}`}>
                  {src}
                </span>
              </span>
            ))}
          </p>

          {/* Signal previews */}
          <div className="space-y-1">
            {cluster.signals.slice(0, 3).map((item) => (
              <div
                key={item.signal.id}
                className="flex items-start gap-2 py-1 border-t border-gray-100 first:border-t-0"
              >
                <span className="text-[11px] text-gray-500 shrink-0 w-20 truncate">
                  {item.signal.actor}
                </span>
                <span className="text-[11px] text-gray-600 truncate">
                  {item.signal.text.slice(0, 80)}{item.signal.text.length > 80 ? "\u2026" : ""}
                </span>
              </div>
            ))}
            {cluster.signals.length > 3 && (
              <div className="text-[11px] text-gray-500 pt-1">
                +{cluster.signals.length - 3} more signals
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
