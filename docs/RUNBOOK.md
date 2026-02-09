# Signalry Runbook

## Daily operation

### Morning scan
```bash
# Run the pipeline with default keywords
python3 -m signalry run

# Or with custom keywords
python3 -m signalry run --keywords "pump,rug,scam,token,shipping,building,need,broken"
```

### Review queue
```bash
# See what needs attention
python3 -m signalry queue

# Focus on most urgent
# Items are sorted: momentum first → urgency → confidence
```

### Act on signals
```bash
# Approve a signal (first 8 chars of ID is enough)
python3 -m signalry approve <id>

# After you've taken action, log the outcome
python3 -m signalry log <id> --responded --type reply --notes "What you did"

# Or if you decided not to act
python3 -m signalry log <id> --type none --notes "Not relevant after review"

# Discard signals that aren't worth acting on
python3 -m signalry discard <id>
```

### Check metrics
```bash
python3 -m signalry stats
```

Key metric: **response rate** = outcomes_logged / approved

## Going live

### Step 1: Twitter API
1. Get a Twitter API v2 bearer token at https://developer.twitter.com/
2. Set it: `export X_BEARER_TOKEN="your_token"`
3. Run: `python3 -m signalry run --live`

### Step 2: LLM classification
1. Get an Anthropic API key at https://console.anthropic.com/
2. Set it: `export ANTHROPIC_API_KEY="your_key"`
3. The `--live` flag activates both real ingestion and LLM classification

### Step 3: Automate (optional)
Add to crontab for periodic scanning:
```bash
# Every 30 minutes during business hours
0,30 9-18 * * 1-5 cd /path/to/signalry && python3 -m signalry run --live --quiet >> /var/log/signalry.log 2>&1
```

## Resetting

```bash
# Clear the database (fresh start)
rm data/signalry.db

# Re-run to repopulate
python3 -m signalry run
```

## Troubleshooting

### "No signals ingested"
- Check `data/mock_posts.json` exists (for offline mode)
- Check `X_BEARER_TOKEN` is set (for live mode)
- Try different keywords

### "All signals filtered"
- Your keywords match posts, but none have explicit intent
- Try broader keywords or check `signalry/filter.py` patterns

### Rate limits (live mode)
- Twitter API v2: 450 requests per 15-minute window
- Anthropic Claude: check your plan limits
- The pipeline processes in batches, so one run = one API call to Twitter

## 7-day evaluation checklist

Per the launch plan:

- [ ] Day 1: Run pipeline, review all signals, approve/discard each one
- [ ] Day 2: Log outcomes for all approved signals from Day 1
- [ ] Day 3: Check momentum patterns — are they real?
- [ ] Day 4: Adjust keywords based on what you're seeing
- [ ] Day 5: Run with real X data if not already
- [ ] Day 6: Review all metrics (response rate, approval rate, momentum accuracy)
- [ ] Day 7: Go / no-go decision

### Success criteria (from PRD)
- Detection: ≥90% of manually identified explicit intent signals caught
- Interpretation: ≥70% of primary_pain validated by human review
- Momentum: flags judged correct in ≥60% of cases
- Actions: no action without approval, no duplicate interventions
- Logging: 100% of approved actions have recorded outcomes
