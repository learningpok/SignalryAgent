#!/usr/bin/env python3
"""
Export feedback as ground truth for evaluation
"""
import json
from feedback_store import get_all_feedback
from store import get_top_items

def export_feedback_to_eval():
    """Convert feedback into eval_set.jsonl format"""
    
    # Get all feedback
    feedback_records = get_all_feedback()
    
    if not feedback_records:
        print("No feedback found. Mark some signals first!")
        return
    
    # Get all signals
    signals = get_top_items(100)
    signal_map = {s.id: s for s in signals}
    
    # Build eval set
    eval_items = []
    for fb in feedback_records:
        signal_id = fb['signal_id']
        if signal_id not in signal_map:
            continue
        
        signal = signal_map[signal_id]
        
        # Map feedback to expected priority
        expected_priority = "high" if fb['feedback_type'] == "positive" else "low"
        
        eval_item = {
            "text": signal.text,
            "metadata": {
                "likes": getattr(signal, 'likes', 0),
                "reposts": getattr(signal, 'reposts', 0),
                "author": getattr(signal, 'author', 'unknown')
            },
            "expected_intent": signal.signal_type,
            "expected_priority": expected_priority,
            "signal_id": signal_id,
            "feedback_timestamp": fb['timestamp']
        }
        
        eval_items.append(eval_item)
    
    # Write to file
    output_file = "data/eval_set_from_feedback.jsonl"
    with open(output_file, 'w') as f:
        for item in eval_items:
            f.write(json.dumps(item) + '\n')
    
    print(f"✅ Exported {len(eval_items)} feedback items to {output_file}")
    print(f"\nBreakdown:")
    print(f"  👍 Relevant: {sum(1 for i in eval_items if i['expected_priority'] == 'high')}")
    print(f"  👎 Noise: {sum(1 for i in eval_items if i['expected_priority'] == 'low')}")
    
    return eval_items

if __name__ == "__main__":
    export_feedback_to_eval()
