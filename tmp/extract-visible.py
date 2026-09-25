from pathlib import Path
from html.parser import HTMLParser
import re, sys
class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip += 1
    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript", "svg"} and self.skip:
            self.skip -= 1
    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)
source = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
parser = TextExtractor()
parser.feed(source)
text = "\n".join(parser.parts)
lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
lines = [line for line in lines if line]
Path(sys.argv[2]).write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"visible_lines={len(lines)}")
