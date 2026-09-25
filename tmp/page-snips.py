from pathlib import Path
import re, sys
text=Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
terms=["code-cubicle", "eventId", "event_id", "eventType", "useParams", "params", "/api/v1/hackathon", "nO=", "hackathon?id", "slug", "eventSlug", "eventName", "where builders"]
for term in terms:
    print(f"--- {term} ---")
    matches=list(re.finditer(re.escape(term), text, re.I))
    print("count", len(matches))
    for m in matches[:10]:
        a=max(0,m.start()-350); b=min(len(text),m.end()+650)
        snippet=re.sub(r'\s+',' ',text[a:b])
        print(snippet.encode("utf-8", "replace").decode("utf-8"))
