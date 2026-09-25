from pathlib import Path
import re, sys
root=Path(sys.argv[1])
terms=sys.argv[2:]
for path in sorted(root.glob('*.js')):
    text=path.read_text(encoding='utf-8',errors='replace')
    hits=[]
    for term in terms:
        for m in list(re.finditer(re.escape(term), text, re.I))[:20]:
            a=max(0,m.start()-180); b=min(len(text),m.end()+300)
            snippet=re.sub(r'\s+',' ',text[a:b])
            hits.append((term,snippet))
    if hits:
        print(f"### {path.name}")
        for term,snip in hits[:30]:
            print(f"[{term}] {snip}")
