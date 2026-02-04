# Signalry

**An agentic feedback intelligence system that interprets explicit user intent, detects momentum, and recommends what to prioritize.**

## Quick Start

### Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 main.py
uvicorn api:app --reload --port 8000
```

### Frontend
```bash
cd frontend/frontend
npm install
npm run dev
```

Open http://localhost:3000

## Key Features

- Explainable priority scoring (severity + recurrence + business weight)
- Context-aware action recommendations
- Human-in-the-loop learning (thumbs up/down)
- Outcome logging (acted/skipped)
- Metrics tracking (action rate, precision)

## PRD Compliance

Complete User Flow:
1. Signal detection
2. Intent classification
3. Recommended action
4. Human approval
5. Outcome logging
6. Metrics tracking

View metrics: http://localhost:8000/metrics

**Built with: Explicit intent over inferred sentiment.**
