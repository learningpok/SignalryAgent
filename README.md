# Signalry — Feedback Intelligence Agent

**Signal detection, not sentiment mining.**

Signalry is an agentic system that monitors X/Twitter for explicit user intent, classifies signals using a strict schema, detects momentum patterns, and recommends what to prioritize — all with human-in-the-loop approval.

## What it does

```
X posts → Filter (explicit intent only) → Classify → Detect momentum → Human review queue → Outcome log
```

**Core loop:** signal → interpretation → suggested action → outcome logging

## What it does NOT do

- No sentiment analysis — explicit intent only
- No auto-posting — generates suggestions, never acts
- No dashboards — CLI + JSON output
- No prediction — prioritization based on signal evidence

## Quick start

```bash
# Clone and enter
git clone <repo-url>
cd signalry

# Run with mock data (no API keys needed)
python3 -m signalry run

# View the review queue
python3 -m signalry queue

# Approve a signal (use first 8 chars of ID)
python3 -m signalry approve sig_006

# Log outcome after taking action
python3 -m signalry log sig_006 --responded --type reply --notes "Sent DM"

# View stats
python3 -m signalry stats

# Export all data as JSON
python3 -m signalry export
```

## Run with real X data

Requires a Twitter API v2 bearer token:

```bash
export X_BEARER_TOKEN="your_token_here"
python3 -m signalry run --live --keywords "pump,token,signal,feedback"
```

## Run with real LLM classification

Requires an Anthropic API key:

```bash
export ANTHROPIC_API_KEY="your_key_here"
python3 -m signalry run --live
```

## Output schema (strict)

Every classified signal produces:

```json
{
  "intent_stage": "exploring|evaluating|requesting|churning|advocating",
  "primary_pain": "brief description of core pain",
  "urgency": "critical|high|medium|low",
  "confidence": 0.0-1.0,
  "momentum_flag": true/false,
  "recommended_action": "one specific action"
}
```

## Run tests

```bash
python3 -m unittest discover tests/ -v
```

48 tests covering: filtering, schema validation, momentum heuristics, dedup, end-to-end pipeline.

## Project structure

```
signalry/
├── signalry/
│   ├── __init__.py
│   ├── __main__.py      # CLI entry point
│   ├── models.py         # Data models (Signal, Classification, Outcome)
│   ├── ingest.py         # Signal ingestion (mock + real X connector)
│   ├── filter.py         # Intent filtering (explicit intent only)
│   ├── classify.py       # LLM classification (mock + real Anthropic)
│   ├── momentum.py       # Momentum detection (clustering + persistence)
│   ├── queue.py          # SQLite review queue + outcome logging
│   └── pipeline.py       # Core pipeline orchestration
├── tests/
│   └── test_core.py      # Unit tests (48 tests)
├── data/
│   └── mock_posts.json   # Sample X posts for development
├── docs/
│   └── RUNBOOK.md        # Operations guide
├── pyproject.toml
└── README.md
```

## Design decisions

- **Mock-first development**: Everything works offline with mock data. Real connectors are a config switch, not a code change.
- **SQLite for persistence**: No external DB dependency. Delete the file to reset.
- **Deterministic filter before LLM**: Fast heuristics gate what the LLM sees. Cheaper, faster, testable.
- **Strict schema enforcement**: Every output matches the PRD schema. No drift.
- **Human-in-the-loop**: The system NEVER acts autonomously. It suggests, you decide.

## v1 scope

- Platform: X (Twitter) only
- Classification: mock (keyword heuristics) or live (Claude API)
- Ingestion: mock (JSON file) or live (Twitter API v2)
- Storage: SQLite
- Interface: CLI only
