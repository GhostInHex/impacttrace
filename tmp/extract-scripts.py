from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin
import re, sys
class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls=[]
    def handle_starttag(self, tag, attrs):
        if tag == "script":
            d=dict(attrs)
            if d.get("src"): self.urls.append(d["src"])
source=Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
p=Scripts(); p.feed(source)
urls=[]
for u in p.urls:
    if u.startswith("/"):
        u="https://hackculture.io"+u
    if u not in urls: urls.append(u)
for u in urls: print(u)
Path(sys.argv[2]).write_text("\n".join(urls)+"\n", encoding="utf-8")
print(f"count={len(urls)}", file=sys.stderr)
