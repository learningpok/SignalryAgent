/**
 * ChatMessage — shared chat bubble component.
 * Light theme matching landing page aesthetic.
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
            ? "bg-indigo-100 text-indigo-600 border border-indigo-200"
            : "bg-gray-100 text-gray-500 border border-gray-200"
        }`}
      >
        {isAgent ? "S" : "U"}
      </div>

      {/* Bubble */}
      <div
        className={`px-4 py-3 rounded-xl text-[13.5px] leading-relaxed ${
          isAgent
            ? "bg-white border border-gray-200 shadow-sm rounded-tl-[4px] text-gray-600"
            : "bg-indigo-50 border border-indigo-100 rounded-tr-[4px] text-gray-900"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
