from pathlib import Path
import json, sys
p=Path(sys.argv[1]); out=Path(sys.argv[2])
data=json.loads(p.read_text(encoding="utf-8"))
for key in ["location","eligibility","registration_questions","links","partners","themes","phases","prizes","total_prize","faq","contact_details","announcements","resolved_flags"]:
    (out/f"{key}.json").write_text(json.dumps(data.get(key), ensure_ascii=False, indent=2), encoding="utf-8")
