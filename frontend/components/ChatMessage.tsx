/**
 * ChatMessage — shared chat bubble component.
 * Reuses the frosted glass aesthetic from the landing page agent demo.
 */

import { ReactNode } from "react";

interface ChatMessageProps {
  role: "agent" | "user";
  children: ReactNode;
}

export default function ChatMessage({ role, children }: ChatMessageProps) {
  const isAgent = role === "agent";

  return (
    <div
      className={`flex gap-2.5 max-w-[92%] animate-[chatIn_0.4s_cubic-bezier(.16,1,.3,1)_forwards] ${
        isAgent ? "self-start" : "self-end flex-row-reverse"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
          isAgent
            ? "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-300 border border-indigo-500/15"
            : "bg-white/[0.08] text-gray-400 border border-white/[0.08]"
        }`}
      >
        {isAgent ? "S" : "U"}
      </div>

      {/* Bubble */}
      <div
        className={`px-4 py-3 rounded-xl text-[13.5px] leading-relaxed ${
          isAgent
            ? "bg-white/[0.04] border border-white/[0.06] rounded-tl-[4px] text-[#8B8B9E]"
            : "bg-indigo-500/10 border border-indigo-500/[0.12] rounded-tr-[4px] text-[#F0F0F5]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
