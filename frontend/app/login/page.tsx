"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = "http://localhost:8000";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/chat";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Invalid invite code" }));
        setError(data.detail || "Invalid invite code");
        setLoading(false);
        return;
      }

      const { token } = await res.json();
      document.cookie = `signalry_token=${token}; path=/; max-age=${30 * 86400}; SameSite=Lax`;
      router.push(redirect);
    } catch {
      setError("Could not connect to the API. Is the backend running?");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-white">
            Signal<span className="text-indigo-400">ry</span>
          </h1>
          <p className="text-sm text-[#5C5C6F] mt-2">Private alpha access</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
        >
          <div>
            <label htmlFor="invite-code" className="block text-xs text-[#5C5C6F] uppercase tracking-wider mb-2">
              Invite code
            </label>
            <input
              id="invite-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your invite code"
              autoFocus
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-[#F0F0F5] placeholder-[#5C5C6F] outline-none focus:border-indigo-500/30 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full px-4 py-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-400 hover:to-indigo-600 disabled:opacity-40 transition"
          >
            {loading ? "Verifying..." : "Enter"}
          </button>
        </form>

        <p className="text-center text-xs text-[#5C5C6F] mt-6">
          Need access?{" "}
          <a href="mailto:hello@signalry.io" className="text-indigo-400 hover:text-indigo-300 transition">
            Request an invite
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-[#5C5C6F] text-sm">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
