from pathlib import Path
import sys
text = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
terms = ["Code Cubicle 6.0", "3 OCT", "11 OCT", "Cloudinary", "Qdrant", "Registration", "Where Builders", "problem", "venue", "prize", "rules", "2026-10"]
for term in terms:
    print(f"--- {term} ---")
    start = 0
    count = 0
    while True:
        pos = text.lower().find(term.lower(), start)
        if pos < 0 or count >= 5:
            break
        left = max(0, pos - 500)
        right = min(len(text), pos + 1200)
        snippet = text[left:right].replace("\\n", " ").replace('\\"', '"')
        print(snippet[:1800])
        print()
        start = pos + len(term)
        count += 1
