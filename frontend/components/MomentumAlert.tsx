/**
 * MomentumAlert — cross-channel correlation alert card.
 * Shows cluster summary with linked signals.
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
  intercom: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  slack: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  hubspot: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  x: "bg-white/[0.06] text-gray-400 border-white/[0.08]",
  telegram: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  discord: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function MomentumAlert({ clusters }: MomentumAlertProps) {
  if (!clusters.length) return null;

  return (
    <div className="mt-2.5 space-y-2.5">
      {clusters.map((cluster) => (
        <div
          key={cluster.pain}
          className="bg-[#1C1C20] border border-amber-500/15 rounded-[10px] px-3.5 py-3 text-[12.5px]"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/15 text-amber-400 text-[10px]">
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" />
              </svg>
            </div>
            <span className="font-semibold text-amber-300 text-[13px]">
              Momentum: {cluster.pain}
            </span>
          </div>

          {/* Summary line */}
          <p className="text-[#8B8B9E] mb-2">
            <strong className="text-[#F0F0F5]">{cluster.signal_count} signals</strong> from{" "}
            <strong className="text-[#F0F0F5]">{cluster.unique_actors} actors</strong> across{" "}
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
                className="flex items-start gap-2 py-1 border-t border-white/[0.04] first:border-t-0"
              >
                <span className="text-[11px] text-[#5C5C6F] shrink-0 w-20 truncate">
                  {item.signal.actor}
                </span>
                <span className="text-[11px] text-[#8B8B9E] truncate">
                  {item.signal.text.slice(0, 80)}{item.signal.text.length > 80 ? "\u2026" : ""}
                </span>
              </div>
            ))}
            {cluster.signals.length > 3 && (
              <div className="text-[11px] text-[#5C5C6F] pt-1">
                +{cluster.signals.length - 3} more signals
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
