from pathlib import Path
import sys
pdf = Path(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
try:
    from pypdf import PdfReader
    reader = PdfReader(str(pdf))
    print(f"pages={len(reader.pages)}")
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        (out / f"page-{i}.txt").write_text(text, encoding="utf-8")
        print(f"page-{i}: chars={len(text)}")
except Exception as e:
    print(f"pypdf_error={type(e).__name__}: {e}")
    raise
