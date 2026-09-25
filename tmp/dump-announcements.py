from pathlib import Path
import json,sys,re
D=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
for i,a in enumerate(D.get("announcements",[]),1):
    print(f"--- announcement {i} ---")
    for k in ["_id","created_at","updated_at","title","type","is_pinned","pinned","status","visibility"]:
        if k in a: print(f"{k}: {a[k]}")
    for k,v in a.items():
        if isinstance(v,str) and k not in {"_id","created_at","updated_at","title","type","is_pinned","pinned","status","visibility"}:
            clean=re.sub(r'\s+',' ',v)
            print(f"{k}: {clean[:1200]}")
    print()
