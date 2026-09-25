from pathlib import Path
import re,sys
text=Path(sys.argv[1]).read_text(encoding='utf-8',errors='replace')
for term in ['nO(', 'nO(e', 'nO(t', 'e2.slug', 'e2.id', 'eventType:e2', 'useParams()', 'api/v1/event', 'api/v1/events', 'api/v1/hackathon']:
    print(f"--- {term} ---")
    for m in list(re.finditer(re.escape(term), text, re.I))[:30]:
        a=max(0,m.start()-1000); b=min(len(text),m.end()+1800)
        sn=re.sub(r'\s+',' ',text[a:b])
        print(sn.encode('utf-8','replace').decode('utf-8'))
