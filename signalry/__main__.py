#!/usr/bin/env python3
"""
Signalry CLI — the main way to interact with the agent.

Usage:
    python -m signalry run                    # Process signals with default keywords
    python -m signalry run --keywords "pump,token,shipping"
    python -m signalry queue                  # View pending review items
    python -m signalry approve <signal_id>    # Approve a signal
    python -m signalry discard <signal_id>    # Discard a signal
    python -m signalry log <signal_id>        # Log outcome for approved signal
    python -m signalry stats                  # View queue statistics
    python -m signalry export                 # Export all items as JSON
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime

from .models import Outcome, ResponseType
from .pipeline import Pipeline
from .queue import ReviewQueue


def cmd_run(args):
    """Run the signal processing pipeline."""
    keywords = [k.strip() for k in args.keywords.split(",")]
    since = None
    if args.since:
        since = datetime.fromisoformat(args.since)

    pipe = Pipeline(live=args.live)
    result = pipe.run(keywords=keywords, since=since)

    # Print summary
    c = result["counts"]
    print(f"\n{'='*60}")
    print(f"  SIGNALRY — Pipeline Run")
    print(f"{'='*60}")
    print(f"  Ingested:    {c['ingested']}")
    print(f"  Filtered:    {c['filtered']} (explicit intent only)")
    print(f"  Classified:  {c['classified']}")
    print(f"  Queued:      {c['queued']} new")
    print(f"  Duplicates:  {c['duplicates_skipped']} skipped")
    print(f"{'='*60}")

    # Momentum
    if result["momentum"]:
        print(f"\n  🔥 MOMENTUM DETECTED:")
        for m in result["momentum"]:
            print(f"    • {m['pain']}: {m['signal_count']} signals from {m['unique_actors']} actors")
        print()

    # Show items
    if result["items"] and not args.quiet:
        print(f"\n  📋 CLASSIFIED SIGNALS:\n")
        for item in result["items"]:
            sig = item["signal"]
            cls = item["classification"]
            momentum = " 🔥" if cls["momentum_flag"] else ""
            print(f"  [{cls['urgency'].upper()}] [{cls['intent_stage']}]{momentum}")
            print(f"  @{sig['actor']}: {sig['text'][:100]}{'...' if len(sig['text']) > 100 else ''}")
            print(f"  Pain: {cls['primary_pain']}")
            print(f"  Action: {cls['recommended_action']}")
            print(f"  Confidence: {cls['confidence']}  ID: {sig['id'][:8]}...")
            print()

    if args.json:
        print(json.dumps(result, indent=2, default=str))


def cmd_queue(args):
    """View pending review items."""
    queue = ReviewQueue()

    if args.status == "all":
        items = queue.list_all(limit=args.limit)
    elif args.status == "approved":
        items = queue.list_approved(limit=args.limit)
    else:
        items = queue.list_pending(limit=args.limit)

    if not items:
        print(f"\n  No {args.status} items in queue.\n")
        return

    print(f"\n{'='*60}")
    print(f"  REVIEW QUEUE — {args.status.upper()} ({len(items)} items)")
    print(f"{'='*60}\n")

    for item in items:
        sig = item.signal
        cls = item.classification
        momentum = " 🔥" if cls.momentum_flag else ""
        status_icon = {"pending": "⏳", "approved": "✅", "discarded": "❌"}.get(item.status, "?")

        print(f"  {status_icon} [{cls.urgency.value.upper()}] [{cls.intent_stage.value}]{momentum}")
        print(f"  @{sig.actor}: {sig.text[:100]}{'...' if len(sig.text) > 100 else ''}")
        print(f"  Pain: {cls.primary_pain}")
        print(f"  Action: {cls.recommended_action}")
        print(f"  Confidence: {cls.confidence}  ID: {sig.id[:8]}...")
        print()


def cmd_approve(args):
    """Approve a signal for action."""
    queue = ReviewQueue()
    # Support partial ID matching
    items = queue.list_all(limit=500)
    match = [i for i in items if i.signal.id.startswith(args.signal_id)]

    if not match:
        print(f"  ❌ No signal found matching ID: {args.signal_id}")
        sys.exit(1)
    if len(match) > 1:
        print(f"  ⚠️  Multiple matches. Be more specific:")
        for m in match:
            print(f"    {m.signal.id[:12]}  @{m.signal.actor}")
        sys.exit(1)

    queue.approve(match[0].signal.id)
    print(f"  ✅ Approved: {match[0].signal.id[:12]}... @{match[0].signal.actor}")


def cmd_discard(args):
    """Discard a signal."""
    queue = ReviewQueue()
    items = queue.list_all(limit=500)
    match = [i for i in items if i.signal.id.startswith(args.signal_id)]

    if not match:
        print(f"  ❌ No signal found matching ID: {args.signal_id}")
        sys.exit(1)

    queue.discard(match[0].signal.id)
    print(f"  ❌ Discarded: {match[0].signal.id[:12]}... @{match[0].signal.actor}")


def cmd_log(args):
    """Log outcome for an approved signal."""
    queue = ReviewQueue()
    items = queue.list_all(limit=500)
    match = [i for i in items if i.signal.id.startswith(args.signal_id)]

    if not match:
        print(f"  ❌ No signal found matching ID: {args.signal_id}")
        sys.exit(1)

    outcome = Outcome(
        signal_id=match[0].signal.id,
        responded=args.responded,
        response_type=ResponseType(args.type),
        notes=args.notes or "",
    )
    queue.log_outcome(outcome)
    print(f"  📝 Outcome logged for {match[0].signal.id[:12]}...")


def cmd_stats(args):
    """View queue statistics."""
    queue = ReviewQueue()
    stats = queue.stats()

    print(f"\n{'='*60}")
    print(f"  SIGNALRY — Queue Stats")
    print(f"{'='*60}")
    print(f"  Total signals:     {stats['total']}")
    print(f"  Pending review:    {stats['pending']}")
    print(f"  Approved:          {stats['approved']}")
    print(f"  Discarded:         {stats['discarded']}")
    print(f"  Outcomes logged:   {stats['outcomes_logged']}")
    print(f"  Momentum flags:    {stats['momentum_flags']}")
    print(f"{'='*60}\n")


def cmd_export(args):
    """Export all items as JSON."""
    queue = ReviewQueue()
    items = queue.list_all(limit=1000)
    data = [item.to_dict() for item in items]
    print(json.dumps(data, indent=2, default=str))


def main():
    parser = argparse.ArgumentParser(
        prog="signalry",
        description="Signalry — Feedback Intelligence Agent",
    )
    subs = parser.add_subparsers(dest="command")

    # run
    p_run = subs.add_parser("run", help="Process signals")
    p_run.add_argument("--keywords", default="pump,token,shipping,building,rug,scam,need,looking for,bug,broken",
                       help="Comma-separated keywords to match")
    p_run.add_argument("--since", help="ISO timestamp to filter from")
    p_run.add_argument("--live", action="store_true", help="Use real X API + LLM (requires keys)")
    p_run.add_argument("--quiet", action="store_true", help="Only show summary, not individual items")
    p_run.add_argument("--json", action="store_true", help="Also print full JSON output")
    p_run.set_defaults(func=cmd_run)

    # queue
    p_queue = subs.add_parser("queue", help="View review queue")
    p_queue.add_argument("--status", choices=["pending", "approved", "all"], default="pending")
    p_queue.add_argument("--limit", type=int, default=20)
    p_queue.set_defaults(func=cmd_queue)

    # approve
    p_approve = subs.add_parser("approve", help="Approve a signal")
    p_approve.add_argument("signal_id", help="Signal ID (or prefix)")
    p_approve.set_defaults(func=cmd_approve)

    # discard
    p_discard = subs.add_parser("discard", help="Discard a signal")
    p_discard.add_argument("signal_id", help="Signal ID (or prefix)")
    p_discard.set_defaults(func=cmd_discard)

    # log
    p_log = subs.add_parser("log", help="Log outcome for a signal")
    p_log.add_argument("signal_id", help="Signal ID (or prefix)")
    p_log.add_argument("--responded", action="store_true", default=False)
    p_log.add_argument("--type", choices=["reply", "follow_up", "none"], default="none")
    p_log.add_argument("--notes", help="Qualitative notes")
    p_log.set_defaults(func=cmd_log)

    # stats
    p_stats = subs.add_parser("stats", help="Queue statistics")
    p_stats.set_defaults(func=cmd_stats)

    # export
    p_export = subs.add_parser("export", help="Export all items as JSON")
    p_export.set_defaults(func=cmd_export)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(0)

    args.func(args)


if __name__ == "__main__":
    main()
