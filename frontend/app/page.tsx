"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const IntercomIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 17.5c0 .275-.225.5-.5.5s-.5-.225-.5-.5v-4c0-.275.225-.5.5-.5s.5.225.5.5v4zm3 0c0 .275-.225.5-.5.5s-.5-.225-.5-.5v-5c0-.275.225-.5.5-.5s.5.225.5.5v5zm3 0c0 .275-.225.5-.5.5s-.5-.225-.5-.5v-4c0-.275.225-.5.5-.5s.5.225.5.5v4zm3-1c0 .275-.225.5-.5.5s-.5-.225-.5-.5v-3c0-.275.225-.5.5-.5s.5.225.5.5v3zm-12 1c0 .275-.225.5-.5.5s-.5-.225-.5-.5v-4c0-.275.225-.5.5-.5s.5.225.5.5v4zm-3-1c0 .275-.225.5-.5.5s-.5-.225-.5-.5v-3c0-.275.225-.5.5-.5s.5.225.5.5v3z"/>
  </svg>
);

const FarcasterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.24 0.24H5.76C2.5763 0.24 0 2.8163 0 6V18C0 21.1837 2.5763 23.76 5.76 23.76H18.24C21.4237 23.76 24 21.1837 24 18V6C24 2.8163 21.4237 0.24 18.24 0.24ZM19.06 17.53H17.51V11.29L12 14.95L6.49 11.29V17.53H4.94V8.47H6.49L12 12.13L17.51 8.47H19.06V17.53Z"/>
  </svg>
);

const ZendeskIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 18.75H10.5V24L24 18.75zM24 5.25V18h-.008L10.5.75v12.75H24V5.25zM0 5.25h13.5V.75L0 5.25zM13.5 6H0v12.75L13.5 6z"/>
  </svg>
);

const SalesforceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M10.006 5.415a4.195 4.195 0 0 1 3.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.45 0-.884-.06-1.305-.165a3.818 3.818 0 0 1-3.33 1.965c-.6 0-1.17-.135-1.68-.389a4.612 4.612 0 0 1-4.06 2.444c-2.22 0-4.08-1.58-4.53-3.67a4.29 4.29 0 0 1-1.065.135C1.17 16.624 0 15.195 0 13.205c0-1.665 1.17-3.03 2.79-3.36a4.844 4.844 0 0 1-.165-1.275c0-2.58 2.07-4.68 4.62-4.68 1.44 0 2.73.66 3.585 1.71"/>
  </svg>
);

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
  </svg>
);

type Persona = "crypto" | "product" | "sales";
type AppState = "select" | "loading" | "dashboard" | "launching";

interface Monitor { name: string; icon: React.FC; color: string; }
interface Insight { source: string; metric: string; value: string; highlight?: boolean; }
interface Conversation { question: string; answer: string; insights: Insight[]; }
interface PersonaConfig { id: Persona; title: string; subtitle: string; emoji: string; monitors: Monitor[]; conversations: Conversation[]; }

const PERSONAS: PersonaConfig[] = [
  {
    id: "crypto", title: "Crypto / Web3", subtitle: "Degen, builder, trader", emoji: "🪙",
    monitors: [
      { name: "Twitter / X", icon: TwitterIcon, color: "#000000" },
      { name: "Discord", icon: DiscordIcon, color: "#5865F2" },
      { name: "Telegram", icon: TelegramIcon, color: "#229ED9" },
      { name: "Farcaster", icon: FarcasterIcon, color: "#8465CB" },
    ],
    conversations: [
      { question: "What's CT saying about our launch?", answer: "Strong momentum on Crypto Twitter:", insights: [
        { source: "twitter", metric: "Mentions (24h)", value: "847", highlight: true },
        { source: "discord", metric: "New joins", value: "+312" },
        { source: "telegram", metric: "Whale alerts", value: "23 wallets" },
      ]},
    ],
  },
  {
    id: "product", title: "Product", subtitle: "PM, designer, researcher", emoji: "🎯",
    monitors: [
      { name: "Slack", icon: SlackIcon, color: "#4A154B" },
      { name: "Intercom", icon: IntercomIcon, color: "#1F8DED" },
      { name: "Zendesk", icon: ZendeskIcon, color: "#03363D" },
      { name: "Twitter / X", icon: TwitterIcon, color: "#000000" },
    ],
    conversations: [
      { question: "What's causing the most churn?", answer: "Top 3 churn drivers this week:", insights: [
        { source: "intercom", metric: "Onboarding drop-off", value: "Stage 2", highlight: true },
        { source: "zendesk", metric: "Too complex tickets", value: "34 tickets" },
        { source: "slack", metric: "Internal escalations", value: "12 threads" },
      ]},
    ],
  },
  {
    id: "sales", title: "Sales & Ops", subtitle: "AE, SDR, RevOps", emoji: "📈",
    monitors: [
      { name: "Salesforce", icon: SalesforceIcon, color: "#00A1E0" },
      { name: "Slack", icon: SlackIcon, color: "#4A154B" },
      { name: "Intercom", icon: IntercomIcon, color: "#1F8DED" },
      { name: "Gmail", icon: GmailIcon, color: "#EA4335" },
    ],
    conversations: [
      { question: "Any deals at risk this quarter?", answer: "3 deals need attention:", insights: [
        { source: "salesforce", metric: "Acme Corp ($50k)", value: "No response 14d", highlight: true },
        { source: "intercom", metric: "TechStart", value: "Competitor mentioned" },
        { source: "gmail", metric: "BigCo renewal", value: "Pricing concerns" },
      ]},
    ],
  },
];

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function LoadingScreen({ persona, onComplete }: { persona: PersonaConfig; onComplete: () => void }) {
  const [connected, setConnected] = useState(0);
  useEffect(() => {
    const run = async () => {
      for (let i = 0; i < persona.monitors.length; i++) {
        await sleep(600);
        setConnected(i + 1);
      }
      await sleep(500);
      onComplete();
    };
    run();
  }, [persona, onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <div className="text-gray-500 mb-6">Connecting to your channels...</div>
        <div className="flex justify-center gap-3">
          {persona.monitors.map((m, i) => (
            <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all ${i < connected ? "opacity-100 scale-100" : "opacity-20 scale-90"}`} style={{ backgroundColor: m.color }}>
              <m.icon />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ persona, onComplete }: { persona: PersonaConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"idle"|"user"|"thinking"|"insights">("idle");
  const [showInsights, setShowInsights] = useState(false);
  const conv = persona.conversations[0];

  useEffect(() => {
    const run = async () => {
      await sleep(500); setPhase("user");
      await sleep(1200); setPhase("thinking");
      await sleep(1500); setPhase("insights"); setShowInsights(true);
    };
    run();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-12">
        <div className="col-span-3 border-r border-gray-100 bg-gray-50/50 p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">S</span>
            </div>
            <span className="font-semibold">Signalry</span>
          </div>
          <div className="text-xs text-gray-400 uppercase mb-2">Monitors</div>
          {persona.monitors.map((m, i) => (
            <button key={i} onClick={onComplete} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white hover:shadow transition mb-1">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: m.color }}><m.icon /></div>
              <span className="text-sm text-gray-700">{m.name}</span>
              <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full" />
            </button>
          ))}
        </div>
        <div className="col-span-9 flex flex-col h-[400px]">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="font-semibold">Agent</div>
            <div className="text-xs text-emerald-600">● Monitoring {persona.monitors.length} channels</div>
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {phase !== "idle" && (
              <div className="flex justify-end"><div className="bg-black text-white rounded-2xl px-4 py-3">{conv.question}</div></div>
            )}
            {phase === "thinking" && (
              <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-4 py-3 text-gray-500">Analyzing signals...</div></div>
            )}
            {showInsights && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl px-4 py-3 shadow-sm">
                  <div className="mb-3">{conv.answer}</div>
                  <div className="space-y-2">
                    {conv.insights.map((ins, i) => (
                      <button key={i} onClick={onComplete} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left hover:shadow transition ${ins.highlight ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">{ins.metric}</div>
                          <div className="font-semibold">{ins.value}</div>
                        </div>
                        {ins.highlight && <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">Priority</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex gap-3">
              <div onClick={onComplete} className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-gray-400 text-sm cursor-text hover:bg-gray-50">Ask about your signals...</div>
              <button onClick={onComplete} className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white hover:bg-gray-800">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaunchingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
          <span className="text-white font-bold text-3xl">S</span>
        </div>
        <h1 className="text-4xl font-bold mb-3">Launching Soon</h1>
        <p className="text-gray-500 mb-8">You just experienced what Signalry can do.<br/>Be first in line when we launch.</p>
        {!submitted ? (
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full px-5 py-4 border rounded-2xl text-center" required />
            <button type="submit" className="w-full px-5 py-4 bg-black text-white font-semibold rounded-2xl hover:bg-gray-800">Join the waitlist</button>
          </form>
        ) : (
          <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-emerald-700 text-xl font-semibold">You're on the list!</div>
          </div>
        )}
        <div className="mt-8 pt-6 border-t">
          <a href="https://twitter.com/signalry" className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl">
            <TwitterIcon /> Follow @signalry
          </a>
        </div>
      </div>
    </div>
  );
}

function PersonaSelector({ onSelect }: { onSelect: (p: Persona) => void }) {
  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
        {PERSONAS.map((p) => (
          <button key={p.id} onClick={() => onSelect(p.id)} className="group p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition bg-white text-left">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">{p.emoji}</div>
              <div><h3 className="font-semibold">{p.title}</h3><p className="text-gray-500 text-sm">{p.subtitle}</p></div>
            </div>
            <div className="flex gap-1.5 mt-4">
              {p.monitors.map((m, i) => (
                <div key={i} className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: m.color }}><m.icon /></div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [state, setState] = useState<AppState>("select");
  const [persona, setPersona] = useState<PersonaConfig | null>(null);

  const select = useCallback((id: Persona) => {
    const p = PERSONAS.find((x) => x.id === id);
    if (p) { setPersona(p); setState("loading"); }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-sky-50/30">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center"><span className="text-white font-semibold text-sm">S</span></div>
            <span className="font-semibold">Signalry</span>
          </div>
          <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg">Get early access</button>
        </div>
      </nav>

      {state === "loading" && persona && <LoadingScreen persona={persona} onComplete={() => setState("dashboard")} />}

      {state === "select" && (
        <div className="pt-20">
          <section className="pt-12 pb-8 px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Your AI agent that identifies what matters.</h1>
            <p className="text-lg text-gray-500">Across all your channels & tools.</p>
          </section>
          <PersonaSelector onSelect={select} />
        </div>
      )}

      {state === "dashboard" && persona && (
        <div className="pt-24 pb-12 px-6"><div className="max-w-5xl mx-auto"><Dashboard persona={persona} onComplete={() => setState("launching")} /></div></div>
      )}

      {state === "launching" && <LaunchingSoon />}
    </div>
  );
}