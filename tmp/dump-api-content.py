from pathlib import Path
import json,sys
D=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
def show(label, value):
    print(f"--- {label} ---")
    print(value if isinstance(value,str) else json.dumps(value,ensure_ascii=False,indent=2))
show("ABOUT",D["about"])
show("LOCATION",D["location"])
show("ELIGIBILITY",D["eligibility"])
show("REGISTRATION QUESTIONS",D["registration_questions"])
show("LINKS",D["links"])
show("PARTNERS",D["partners"])
show("CONTACT DETAILS",D["contact_details"])
show("ANNOUNCEMENTS",D["announcements"])
show("RULES",D["rules"])
