from store import get_top_items


def surface(n: int = 5):
    """Print top N signal items with priority breakdown."""
    items = get_top_items(n)

    if not items:
        print("No signals found.")
        return

    print(f"\n{'='*72}")
    print(f"TOP {len(items)} SIGNALS")
    print(f"{'='*72}")

    for i, item in enumerate(items, 1):
        print(f"\n[{i}] @{item.author} ({item.account_tier})")
        print(f"    Priority: {item.priority_score:.1f}  [sev={item.severity_score:.0f} rec={item.recurrence_score:.0f} biz={item.business_weight:.0f}]")
        print(f"    Type: {item.signal_type} | Format: {item.format}")

        for reason in item.reasons[:3]:
            print(f"      • {reason}")

        snippet = item.text[:85].replace('\n', ' ')
        ellipsis = '...' if len(item.text) > 85 else '"'
        print(f'    "{snippet}{ellipsis}')

        ts = item.timestamp.strftime("%Y-%m-%d %H:%M")
        print(f"    [{ts}] {item.source_id}")
