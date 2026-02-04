#!/usr/bin/env python3
"""
Evaluation script using real human feedback as ground truth
"""
import json
from pathlib import Path
from process import process
from models import RawPost

def load_eval_set():
    """Load evaluation set from feedback"""
    eval_file = Path("data/eval_set_from_feedback.jsonl")
    
    if not eval_file.exists():
        print("❌ No eval set found. Run: python3 export_feedback.py")
        return []
    
    eval_items = []
    with open(eval_file, 'r') as f:
        for line in f:
            eval_items.append(json.loads(line))
    
    return eval_items

def evaluate_precision():
    """Measure how well we're surfacing what humans marked as relevant"""
    
    eval_items = load_eval_set()
    
    if not eval_items:
        return
    
    print(f"📊 Evaluating against {len(eval_items)} human-labeled signals\n")
    
    # Create RawPosts from eval data
    raw_posts = []
    for item in eval_items:
        raw_post = RawPost(
            id=item.get('signal_id', 'eval_item'),
            text=item['text'],
            author=item['metadata'].get('author', 'unknown'),
            timestamp='2024-01-01T00:00:00',
            likes=item['metadata'].get('likes', 0),
            reposts=item['metadata'].get('reposts', 0)
        )
        raw_posts.append(raw_post)
    
    # Process all at once
    signals = process(raw_posts)
    
    # Build results with expected values
    results = []
    for i, signal in enumerate(signals):
        results.append({
            'signal': signal,
            'expected_priority': eval_items[i]['expected_priority'],
            'expected_intent': eval_items[i]['expected_intent']
        })
    
    # Sort by priority score
    results.sort(key=lambda x: x['signal'].priority_score, reverse=True)
    
    # Calculate precision@k
    def precision_at_k(k):
        top_k = results[:k]
        relevant = sum(1 for r in top_k if r['expected_priority'] == 'high')
        return relevant / k if k > 0 else 0
    
    # Print results
    print("🎯 Precision Metrics:")
    p3 = precision_at_k(3)
    p5 = precision_at_k(min(5, len(results)))
    print(f"  Precision@3: {p3:.1%}")
    print(f"  Precision@5: {p5:.1%}")
    print()
    
    # Show top ranked items
    print("📈 Top Ranked Signals:")
    for i, r in enumerate(results[:5], 1):
        signal = r['signal']
        expected = r['expected_priority']
        match = "✅" if expected == "high" else "❌"
        
        print(f"\n{i}. Score: {signal.priority_score:.1f} {match}")
        print(f"   Expected: {expected}")
        print(f"   Text: {signal.text[:80]}...")
    
    # Intent accuracy
    print("\n\n🎭 Signal Type Accuracy:")
    correct_intent = sum(1 for r in results if r['signal'].signal_type == r['expected_intent'])
    total = len(results)
    print(f"  {correct_intent}/{total} ({correct_intent/total:.1%})")
    
    # Show what to tune
    print("\n\n💡 Calibration Guidance:")
    if p3 < 0.7:
        print("  ⚠️  Precision@3 is low - top signals aren't matching your feedback")
        print("      → Consider adjusting weights in process.py")
    else:
        print("  ✅ Precision is good - the system is learning your preferences!")
    
    return results

if __name__ == "__main__":
    evaluate_precision()
