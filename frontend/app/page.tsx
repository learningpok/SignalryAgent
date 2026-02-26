"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LiveDemo from "../components/LiveDemo";
import "./landing.css";

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [transformActive, setTransformActive] = useState(false);
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);
  const metricsRef = useRef<HTMLElement | null>(null);
  const transformRef = useRef<HTMLDivElement | null>(null);
  const metricCountedRef = useRef(false);

  // 1. Mouse glow — set CSS vars on root
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", e.clientX + "px");
      document.documentElement.style.setProperty("--my", e.clientY + "px");
    };
    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, []);

  // 2. Nav scroll — toggle scrolled state
  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // 3. Reveal on scroll — IntersectionObserver for .reveal elements
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    revealRefs.current.forEach((el) => {
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // 4. Metric counter animation
  const animateCounters = useCallback(() => {
    if (metricCountedRef.current) return;
    metricCountedRef.current = true;
    const els = document.querySelectorAll<HTMLElement>(".metric-number");
    els.forEach((el) => {
      const text = el.textContent || "";
      const num = parseInt(text);
      const suffix = text.replace(/[0-9]/g, "");
      let count = 0;
      const step = Math.ceil(num / 40);
      const interval = setInterval(() => {
        count += step;
        if (count >= num) {
          count = num;
          clearInterval(interval);
        }
        el.textContent = count + suffix;
      }, 30);
    });
  }, []);

  useEffect(() => {
    const section = metricsRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateCounters();
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, [animateCounters]);

  // 5. Transform stage activation on scroll
  useEffect(() => {
    const el = transformRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTransformActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const addRevealRef = (index: number) => (el: HTMLDivElement | null) => {
    revealRefs.current[index] = el;
  };

  const LinkIcon = () => (
    <svg viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );

  return (
    <div className="landing-page" style={{ position: "relative" }}>
      <div className="landing-glow-bg" />

      {/* NAV */}
      <nav className={`landing-nav${navScrolled ? " scrolled" : ""}`}>
        <div className="container">
          <a href="#" className="logo">
            Signal<span>ry</span>
          </a>
          <div className="nav-links">
            <a href="#demo">Agent</a>
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="/login" className="btn-nav">Try the Copilot</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          <span className="dot" />
          Now processing signals
        </div>
        <h1>
          Cut the noise.
          <br />
          Focus on what <em>actually matters.</em>
        </h1>
        <p className="hero-sub">
          The AI agent that{"\u2019"}s present everywhere you are {"\u2014"} and
          tells you what matters.
        </p>
        <div className="hero-ctas">
          <a href="/login" className="btn-primary" style={{ textDecoration: "none" }}>Try the Copilot</a>
          <button
            className="btn-secondary"
            onClick={() =>
              document
                .getElementById("demo")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            See the agent in action {"\u2193"}
          </button>
        </div>
      </section>

      {/* AGENT DEMO — Chat Copilot */}
      <section className="agent-demo" id="demo">
        <div className="container reveal" ref={addRevealRef(0)}>
          <div className="section-label">The Agent</div>
          <h2 className="section-heading">
            Your ops copilot.
            <br />
            <em>It challenges you.</em>
          </h2>
          <p className="agent-demo-sub">
            Signalry isn{"\u2019"}t a dashboard. It{"\u2019"}s a copilot that
            reads every channel, finds what matters, and pushes back when your
            priorities are wrong.
          </p>

          <LiveDemo />
        </div>
      </section>

      {/* PROBLEM — animated transformation */}
      <section className="problem-section" id="problem">
        <div className="container">
          <div className="problem-top reveal" ref={addRevealRef(1)}>
            <div className="section-label">The Problem</div>
            <h2
              className="section-heading"
              style={{ maxWidth: 700, margin: "0 auto" }}
            >
              6 channels. 6,000 messages a day.
              <br />
              <em>Zero clarity.</em>
            </h2>
            <p>
              Slack, Zendesk, X, Telegram, Intercom, Discord {"\u2014"} your
              customers talk everywhere. A billing outage shows up in three
              places. Nobody connects the dots.{" "}
              <strong>The agent does.</strong>
            </p>
          </div>

          <div
            className={`transform-stage${transformActive ? " active" : ""}`}
            ref={transformRef}
          >
            {/* Row 1: phase labels */}
            <div className="phase-row">
              <div className="phase-label before">
                Before {"\u2014"} Raw chaos
              </div>
              <div />
              <div className="phase-label after">
                After {"\u2014"} Agent output
              </div>
            </div>

            {/* Col 1: Chaos cards */}
            <div className="chaos-cards">
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7" />
                </svg>
                <span className="src">Slack</span>
                <span className="preview">
                  {"\u201C"}billing is down again{"\u201D"}
                </span>
                <span className="urgency u-r" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="22 7 12 13 2 7" />
                </svg>
                <span className="src">Zendesk</span>
                <span className="preview">
                  {"\u201C"}can{"\u2019"}t export CSV{"\u201D"}
                </span>
                <span className="urgency u-am" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1" />
                </svg>
                <span className="src">X</span>
                <span className="preview">
                  {"\u201C"}@acme payments broken{"\u201D"}
                </span>
                <span className="urgency u-r" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span className="src">Telegram</span>
                <span className="preview">
                  {"\u201C"}anyone else seeing 500s?{"\u201D"}
                </span>
                <span className="urgency u-r" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12" />
                </svg>
                <span className="src">Intercom</span>
                <span className="preview">
                  {"\u201C"}need Slack integration{"\u201D"}
                </span>
                <span className="urgency u-am" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
                <span className="src">Discord</span>
                <span className="preview">
                  {"\u201C"}dark mode when?{"\u201D"}
                </span>
                <span className="urgency u-tm" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="22 7 12 13 2 7" />
                </svg>
                <span className="src">Zendesk</span>
                <span className="preview">
                  {"\u201C"}billing 500 error{"\u201D"}
                </span>
                <span className="urgency u-r" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8" />
                </svg>
                <span className="src">Slack</span>
                <span className="preview">
                  {"\u201C"}csv export hangs{"\u201D"}
                </span>
                <span className="urgency u-am" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12" />
                </svg>
                <span className="src">Intercom</span>
                <span className="preview">
                  {"\u201C"}onboarding confusing{"\u201D"}
                </span>
                <span className="urgency u-g" />
              </div>
              <div className="msg-card">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="src">Discord</span>
                <span className="preview">
                  {"\u201C"}gm, love the product{"\u201D"}
                </span>
                <span className="urgency u-tm" />
              </div>
            </div>

            {/* Col 2: Agent column (arrow in → orb → arrow out) */}
            <div className="agent-col">
              <div className="agent-arrow arr-in">
                <div className="agent-arrow-line" />
              </div>
              <div className="agent-arrow-label">10 signals</div>
              <div className="agent-proc-orb" style={{ position: "relative" }}>
                <div className="agent-proc-ring" />
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v4" />
                  <path d="M12 19v4" />
                  <path d="M1 12h4" />
                  <path d="M19 12h4" />
                  <path d="M4.22 4.22l2.83 2.83" />
                  <path d="M16.95 16.95l2.83 2.83" />
                  <path d="M4.22 19.78l2.83-2.83" />
                  <path d="M16.95 7.05l2.83-2.83" />
                </svg>
                <span className="agent-proc-label">Agent</span>
              </div>
              <div className="agent-proc-status">
                Filtering {"\u00B7"} Scoring {"\u00B7"} Ranking
              </div>
              <div className="agent-arrow-label">4 decisions</div>
              <div className="agent-arrow arr-out">
                <div className="agent-arrow-line" />
              </div>
            </div>

            {/* Col 3: Ranked output */}
            <div className="ranked-output">
              <div className="ranked-card">
                <div className="ranked-num rn-high">9.2</div>
                <div className="ranked-body">
                  <span className="ranked-tag tag-incident">Incident</span>
                  <div className="ranked-text">
                    Billing endpoint 500 errors {"\u2014"} 12 enterprise
                    accounts
                  </div>
                  <div className="ranked-sources">
                    <LinkIcon />
                    Correlated: Slack + Zendesk + X
                  </div>
                  <div className="ranked-reason">
                    {"\u2192"} $840K ARR at risk {"\u00B7"} 3 reports in 2hrs
                  </div>
                </div>
              </div>
              <div className="ranked-card">
                <div className="ranked-num rn-high">8.4</div>
                <div className="ranked-body">
                  <span className="ranked-tag tag-bug">Bug</span>
                  <div className="ranked-text">
                    CSV export broken for large accounts
                  </div>
                  <div className="ranked-sources">
                    <LinkIcon />
                    Correlated: Zendesk + Slack
                  </div>
                  <div className="ranked-reason">
                    {"\u2192"} 6 reports, 4 customers {"\u00B7"} recurring
                  </div>
                </div>
              </div>
              <div className="ranked-card">
                <div className="ranked-num rn-med">6.7</div>
                <div className="ranked-body">
                  <span className="ranked-tag tag-feature">Feature</span>
                  <div className="ranked-text">
                    Slack integration {"\u2014"} blocking 3 deals
                  </div>
                  <div className="ranked-sources">
                    <LinkIcon />
                    Intercom
                  </div>
                  <div className="ranked-reason">
                    {"\u2192"} $580K pipeline blocked
                  </div>
                </div>
              </div>
              <div className="ranked-card">
                <div className="ranked-num rn-low">3.1</div>
                <div className="ranked-body">
                  <span
                    className="ranked-tag"
                    style={{
                      background: "var(--gd)",
                      color: "var(--g)",
                    }}
                  >
                    Low
                  </span>
                  <div className="ranked-text">
                    Dark mode, onboarding, praise {"\u2014"} deprioritized
                  </div>
                  <div className="ranked-sources">
                    <LinkIcon />
                    Discord + Intercom {"\u2014"} no pattern
                  </div>
                  <div className="ranked-reason">
                    {"\u2192"} Free tier, isolated requests
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="transform-counter reveal" ref={addRevealRef(2)}>
            <div className="tc-item">
              <div className="tc-num">10</div>
              <div className="tc-label">Raw messages in</div>
            </div>
            <div className="tc-item">
              <div className="tc-num" style={{ color: "var(--ac)" }}>
                4
              </div>
              <div className="tc-label">Decisions out</div>
            </div>
            <div className="tc-item">
              <div className="tc-num" style={{ color: "var(--r)" }}>
                60%
              </div>
              <div className="tc-label">Noise eliminated</div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="solution-section" id="solution">
        <div className="container reveal" ref={addRevealRef(3)}>
          <div className="solution-header">
            <div className="section-label">The Solution</div>
            <h2
              className="section-heading"
              style={{ maxWidth: 640, margin: "0 auto" }}
            >
              One agent. Every channel.
              <br />
              <em>Explainable decisions.</em>
            </h2>
            <p>
              Signalry connects to all your channels, reads every signal, and
              outputs a single ranked list of what your team should focus on
              right now {"\u2014"} with full reasoning for every score.
            </p>
          </div>
          <div className="solution-grid">
            <div className="sol-card">
              <div className="sol-card-num">01</div>
              <h3>Omnichannel ingestion</h3>
              <p>
                One agent watches Slack, Zendesk, X, Telegram, Intercom,
                Discord. It deduplicates cross-channel signals so the same issue
                reported in 3 places shows up once {"\u2014"} with full context.
              </p>
            </div>
            <div className="sol-card">
              <div className="sol-card-num">02</div>
              <h3>Explainable scoring</h3>
              <p>
                Every signal gets a priority score based on severity, recurrence,
                and business impact (ARR, tier, churn risk). You always know{" "}
                <em>why</em> something ranks. No black boxes.
              </p>
            </div>
            <div className="sol-card">
              <div className="sol-card-num">03</div>
              <h3>Human-in-the-loop</h3>
              <p>
                The agent proposes. You decide. Approve, discard, or override.
                Every action is logged. The agent learns from your decisions and
                gets sharper over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section
        className="metrics-section"
        id="metrics"
        ref={metricsRef as React.RefObject<HTMLElement>}
      >
        <div className="container reveal" ref={addRevealRef(4)}>
          <div className="section-label">Early results</div>
          <h2 className="section-heading">
            Built for precision, <em>not volume</em>
          </h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-number">95%+</div>
              <div className="metric-label">
                Noise correctly filtered {"\u2014"}
                <br />
                you only see what matters
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-number">100%</div>
              <div className="metric-label">
                Priority precision {"\u2014"}
                <br />
                top signals are truly critical
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-number">86%</div>
              <div className="metric-label">
                Signal classification accuracy {"\u2014"}
                <br />
                deterministic heuristics, no LLM
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container reveal" ref={addRevealRef(5)}>
          <div className="cta-box">
            <h2>
              Stop observing feedback.
              <br />
              Start <em>deciding</em> from it.
            </h2>
            <p className="cta-sub">
              Signalry is in private alpha. We{"\u2019"}re onboarding teams that
              drown in signal and need to focus.
            </p>
            <a href="/login" className="btn-primary" style={{ textDecoration: "none" }}>Request early access</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="container">
          <p>
            {"\u00A9"} 2025 Signalry. Built for teams that care about what
            matters.
          </p>
          <a href="#">hello@signalry.io</a>
        </div>
      </footer>
    </div>
  );
}
