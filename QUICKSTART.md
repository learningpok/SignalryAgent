
---

## Calibration Workflow (Human-in-the-Loop)

Your system learns from your feedback! Here's how:

### 1. Mark Signals as Relevant or Noise

- Open http://localhost:3000
- Click on signals
- Press 👍 **Relevant** or 👎 **Noise**
- Feedback is automatically saved to SQLite

### 2. Export Feedback as Ground Truth
```bash
python3 export_feedback.py
```

This converts your feedback into evaluation data.

### 3. Measure Precision
```bash
python3 eval.py
```

This shows:
- **Precision@3/5**: Are top signals matching your preferences?
- **Signal Type Accuracy**: Is intent classification correct?
- **Calibration Guidance**: What to adjust

### 4. Tune Weights (if needed)

If precision is low, adjust weights in `process.py`:
```python
priority_score = 0.45*severity + 0.35*recurrence + 0.20*business
```

Increase weight for what you care about most:
- `severity`: Technical issues, problems, bugs
- `recurrence`: Repeated topics, momentum
- `business`: Strategic insights, high-value content

### 5. Re-run and Verify
```bash
python3 main.py      # Regenerate signals with new weights
python3 eval.py      # Check if precision improved
```

---

## The Learning Loop
```
Mark feedback (👍/👎) → Export → Eval → Tune weights → Repeat
```

This is how the system learns what YOU consider important.

