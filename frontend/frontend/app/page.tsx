"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Signalry
          </h1>
          <p className="text-2xl text-gray-700 mb-4 font-medium">
            What deserves attention now
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            An agentic feedback intelligence system that interprets explicit user intent,
            detects momentum, and recommends what to prioritize.
          </p>
          <Link
            href="/app"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Open Dashboard →
          </Link>
        </div>

        {/* Value Prop */}
        <div className="text-center mb-20">
          <div className="inline-block bg-white rounded-2xl shadow-xl p-8 max-w-3xl">
            <p className="text-xl text-gray-800 mb-4">
              <span className="font-bold text-red-600">Existing tools observe feedback.</span>
            </p>
            <p className="text-2xl font-bold text-blue-600">
              Signalry decides what matters now.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-purple-500">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">
              Explainable Priority Scoring
            </h3>
            <p className="text-gray-600">
              Every signal gets a transparent score based on severity, recurrence, and business impact.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-500">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">
              Context-Aware Recommendations
            </h3>
            <p className="text-gray-600">
              The system suggests specific actions: escalate, interview, monitor, or archive.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-green-500">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">
              Human-in-the-Loop Learning
            </h3>
            <p className="text-gray-600">
              Mark signals as relevant or noise. System learns from your preferences and improves precision.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Complete PRD Loop
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm md:text-base">
            <div className="bg-blue-100 text-blue-800 px-6 py-3 rounded-lg font-semibold">
              Signal Detection
            </div>
            <div className="text-gray-400 text-2xl">→</div>
            <div className="bg-purple-100 text-purple-800 px-6 py-3 rounded-lg font-semibold">
              Intent Classification
            </div>
            <div className="text-gray-400 text-2xl">→</div>
            <div className="bg-indigo-100 text-indigo-800 px-6 py-3 rounded-lg font-semibold">
              Recommended Action
            </div>
            <div className="text-gray-400 text-2xl">→</div>
            <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-semibold">
              Human Approval
            </div>
            <div className="text-gray-400 text-2xl">→</div>
            <div className="bg-orange-100 text-orange-800 px-6 py-3 rounded-lg font-semibold">
              Outcome Logging
            </div>
            <div className="text-gray-400 text-2xl">→</div>
            <div className="bg-pink-100 text-pink-800 px-6 py-3 rounded-lg font-semibold">
              Metrics
            </div>
          </div>
        </div>

        {/* Metrics Preview */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
            <div className="text-5xl font-bold mb-2">70%+</div>
            <div className="text-blue-100 text-lg">Action Rate Target</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
            <div className="text-5xl font-bold mb-2">100%</div>
            <div className="text-purple-100 text-lg">Outcomes Logged</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-8 text-white">
            <div className="text-5xl font-bold mb-2">7/7</div>
            <div className="text-green-100 text-lg">PRD Steps Complete</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to focus on what matters?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Stop observing feedback. Start deciding what to prioritize.
          </p>
          <Link
            href="/app"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-all shadow-lg"
          >
            Open Dashboard →
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p className="mb-2">Built with: Explicit intent over inferred sentiment</p>
          <p>Prioritization over observation • Human-in-the-loop actions</p>
        </div>
      </div>
    </div>
  );
}
