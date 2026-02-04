"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl"></div>
            <span className="text-xl font-semibold text-gray-900">Signalry</span>
          </div>
          <Link
            href="/app"
            className="px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Open app
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            What deserves<br />attention now
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            AI agent that continuously monitors feedback, detects momentum, and tells you what to prioritize.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-base font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
          >
            Get started
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Main section: LEFT = Problem, RIGHT = AI Solution */}
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
          {/* LEFT: The Problem (Pain + Ecosystem) */}
          <div>
            <div className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
              The Problem
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Drowning in feedback.<br/>
              Missing what matters.
            </h2>
            
            {/* Pain points */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Signal buried in noise</div>
                  <div className="text-sm text-gray-600">
                    Thousands of messages daily. No way to know what's urgent vs. spam.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Reactive, not proactive</div>
                  <div className="text-sm text-gray-600">
                    By the time you notice a pattern, it's already a crisis.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Fragmented across tools</div>
                  <div className="text-sm text-gray-600">
                    Slack, Zendesk, Twitter, Discord, Linear, Intercom... no single view.
                  </div>
                </div>
              </div>
            </div>

            {/* Ecosystem chaos */}
            <div className="bg-white/40 backdrop-blur rounded-2xl p-6 border border-gray-200/50">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Your feedback ecosystem today
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg text-xs font-medium shadow-sm">Slack</span>
                <span className="px-3 py-1.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg text-xs font-medium shadow-sm">Zendesk</span>
                <span className="px-3 py-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg text-xs font-medium shadow-sm">Twitter</span>
                <span className="px-3 py-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg text-xs font-medium shadow-sm">Discord</span>
                <span className="px-3 py-1.5 bg-gradient-to-br from-blue-400 to-blue-500 text-white rounded-lg text-xs font-medium shadow-sm">Intercom</span>
                <span className="px-3 py-1.5 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg text-xs font-medium shadow-sm">Linear</span>
                <span className="px-3 py-1.5 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-lg text-xs font-medium shadow-sm">GitHub</span>
                <span className="px-3 py-1.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg text-xs font-medium shadow-sm">Email</span>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                → Overwhelm. Context switching. Missed opportunities.
              </div>
            </div>
          </div>

          {/* RIGHT: The AI Agent Solution */}
          <div>
            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
              AI Agent Solution
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Autonomous signal<br/>detection.
            </h2>

            <div className="bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 rounded-3xl p-8 relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-32 h-32 bg-orange-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
              </div>

              {/* AI Agent pipeline */}
              <div className="relative space-y-6">
                {/* Step 1: Continuous monitoring */}
                <div className="bg-white/70 backdrop-blur rounded-2xl p-5 border border-white/50 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-gray-900 rounded-xl shadow-lg flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z"></path>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step 1: Monitor</div>
                      <div className="text-sm font-semibold text-gray-900">Continuous aggregation</div>
                      <div className="text-xs text-gray-600 mt-0.5">24/7 across all sources</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                    <path d="M12 5v14m0 0l-7-7m7 7l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Step 2: AI Processing */}
                <div className="bg-white/70 backdrop-blur rounded-2xl p-5 border-2 border-orange-300 shadow-lg animate-pulse-slow">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl shadow-lg flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Step 2: AI Agent</div>
                      <div className="text-sm font-semibold text-gray-900">Interpret + Detect + Score</div>
                      <div className="text-xs text-gray-600 mt-0.5">Intent • Momentum • Priority</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                    <path d="M12 5v14m0 0l-7-7m7 7l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Step 3: Recommended actions */}
                <div className="bg-white/70 backdrop-blur rounded-2xl p-5 border border-white/50 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                        <path d="M22 4L12 14.01l-3-3"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Step 3: Recommend</div>
                      <div className="text-sm font-semibold text-gray-900">Smart action proposals</div>
                      <div className="text-xs text-gray-600 mt-0.5">Escalate • Interview • Monitor</div>
                    </div>
                  </div>
                </div>

                {/* Human approval badge (small, not hero) */}
                <div className="text-center pt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full border border-gray-200/50 text-xs text-gray-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>You approve before action</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Explainable AI
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every priority score shows severity, recurrence, and business impact breakdown.
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Agentic loops
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Continuous monitoring, not dashboards. Detects momentum before it's obvious.
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Context-aware
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Learns what matters for your business through outcome tracking.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-base font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
          >
            Try Signalry
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
