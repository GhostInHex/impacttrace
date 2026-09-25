from pathlib import Path
import json, sys
p=Path(sys.argv[1])
data=json.loads(p.read_text(encoding="utf-8"))
print("top-level keys:")
for k,v in data.items():
    if isinstance(v,(list,dict)):
        print(f"- {k}: {type(v).__name__} ({len(v)})")
    else:
        text=str(v).replace("\n"," ")
        if len(text)>180: text=text[:177]+"..."
        print(f"- {k}: {text}")
