# CLAUDE.md — Project Context for Signalry

Read this file before making any changes to the codebase.

## What is Signalry?

Signalry is a **Feedback Intelligence Agent** — it monitors X/Twitter for explicit user intent signals, classifies them, detects momentum, and recommends what to prioritize. Human-in-the-loop approval required for all actions.

**Mission:** Help teams decide what deserves attention now by reducing noisy, low-impact feedback.

## Non-Negotiables (do not violate)

1. **v1 platform scope: X (Twitter) only** — no other sources yet
2. **Explicit intent signals only** — no sentiment mining, no vibes
3. **Strict output schema** — every classification must have: `intent_stage`, `primary_pain`, `urgency`, `confidence`, `recommended_action`, `momentum_flag`
4. **Human-in-the-loop** — NEVER auto-post or take action; only generate suggestions
5. **No dashboards/UI for v1** — CLI + files + minimal API only
6. **Read-only integrations** — aggregate signals, do not replace workflows

## Architecture

```
Ingest → Filter → Classify → Momentum → Queue → (Human Review) → Outcome Log
```

| Module | Purpose |
|--------|---------|
| `ingest.py` | Fetch raw posts (mock or real X API) |
| `filter.py` | Keep only explicit intent, discard noise |
| `classify.py` | Produce structured classification (mock heuristics or LLM) |
| `momentum.py` | Detect clusters/repeats within time window |
| `queue.py` | SQLite store for human review + outcome logging |
| `pipeline.py` | Orchestrates the full loop |
| `__main__.py` | CLI interface |

## How to extend

### Adding a new intent pattern
Edit `signalry/filter.py` → `INTENT_PATTERNS` list. Add a regex. Run tests.

### Adding a new pain category
Edit `signalry/classify.py` → `MockClassifier.classify()` method. Update the keyword→pain mapping.

### Adding a new data source (NOT v1, but designed for it)
1. Create a new class implementing `IngestorBase` in `ingest.py`
2. Add it to the `get_ingestor()` factory
3. Do NOT change filter/classify/momentum — they're source-agnostic

## What NOT to build (v1 scope)

- ❌ Multiple data sources (Slack, Discord, Telegram)
- ❌ Web UI or dashboard
- ❌ Auto-posting or autonomous actions
- ❌ Sentiment analysis
- ❌ Prediction models
- ❌ User auth / multi-tenancy
- ❌ Complex config files (hardcode, change code when needed)

## Commands

```bash
# Run pipeline with mock data
python3 -m signalry run

# Run with real X + LLM (needs env vars)
export X_BEARER_TOKEN="..."
export ANTHROPIC_API_KEY="..."
python3 -m signalry run --live

# View queue, approve, log outcomes
python3 -m signalry queue
python3 -m signalry approve <id>
python3 -m signalry log <id> --responded --type reply --notes "..."

# Run tests (48 tests)
python3 -m unittest discover tests/ -v
```

## Code style

- Python 3.10+
- Type hints on function signatures
- Dataclasses for models
- No external dependencies for core (requests/anthropic only for live mode)
- Tests for any new filtering logic, schema changes, or momentum heuristics

## Current state (updated: 2026-02-09)

- ✅ Core pipeline working (mock mode)
- ✅ 48 tests passing
- ✅ CLI complete
- ⏳ Not yet pushed to GitHub
- ⏳ Not yet running with real X data
- ⏳ No frontend/landing page in this repo

## Token launch context

This agent is part of a token launch (7-day timeline). The agent is the "hero" — it demonstrates real signal detection capability. Prioritize:
1. Working demo with real X data
2. Clean, explainable output
3. Momentum detection that's visually compelling

Do NOT get distracted by:
- Landing page (separate workstream)
- Token contract details
- Multi-agent interactions (future)
