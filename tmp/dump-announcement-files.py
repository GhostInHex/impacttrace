from pathlib import Path
import json,sys,re
D=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
out=Path(sys.argv[2])
for i,a in enumerate(D.get("announcements",[]),1):
    content=[]
    for k in ["_id","created_at","title","description"]:
        if k in a: content.append(f"{k}: {a[k]}")
    (out/f"{i:02}.txt").write_text("\n\n".join(content),encoding="utf-8")
    print(f"{i:02} {a.get('created_at')} {a.get('title')} ({len(a.get('description',''))})")
