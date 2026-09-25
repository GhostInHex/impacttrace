import json, sys
from datetime import datetime, timezone
from pathlib import Path
D=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
def dt(s):
    if not s: return None
    return datetime.fromisoformat(s.replace("Z","+00:00")).astimezone(timezone.utc).isoformat()
print('EVENT')
for k in ['_id','name','tagline','type','industry','mode','min_team_size','max_team_size','start_datetime','end_datetime','created_at','updated_at','organizer_name','slug','total_participants','total_views','is_registration_open','is_completed','is_winners_announced']:
    print(f'{k}: {D.get(k)}')
print('\nABOUT\n' + D.get('about',''))
print('\nLOCATION')
for k,v in D.get('location',{}).items(): print(f'{k}: {v}')
print('\nELIGIBILITY\n' + D.get('eligibility',{}).get('details',''))
print('\nREGISTRATION QUESTIONS')
for q in D.get('registration_questions',[]): print(f"- [{q.get('type')}] {q.get('label')} required={q.get('required')} desc={q.get('description')}")
print('\nPHASES')
for p in D.get('phases',[]):
    print(f"- {p.get('name')}: {p.get('start_datetime')} -> {p.get('end_datetime')} type={p.get('type')} offline={p.get('is_offline')} elimination={p.get('is_elimination_round')}")
    print('  desc:', p.get('description'))
    for q in p.get('submission_questions') or []: print(f"  submission: [{q.get('type')}] {q.get('label')} required={q.get('required')}")
print('\nTHEMES / PROBLEMS')
for th in D.get('themes',[]):
    print(f"Theme: {th.get('name')}\n{ th.get('description','')}")
    for pr in th.get('problem_statements',[]):
        print(f"  * {pr.get('name')}\n    {pr.get('description')}\n    file: {pr.get('file')}")
print('\nPARTNERS')
for p in D.get('partners',[]): print(f"- {p.get('name')} ({p.get('partnership_type')}) {p.get('website','')}")
print('\nPRIZES')
for p in D.get('prizes',[]): print(f"- {p.get('name')}: {p.get('value')} {p.get('currency')} ({p.get('type')}); max={p.get('max_winners')}; sponsor={p.get('sponsor')}; {p.get('description','')}")
print('\nFAQ')
for q in D.get('faq',[]): print(f"Q: {q.get('question')}\nA: {q.get('answer')}")
print('\nCONTACT')
for c in D.get('contact_details',[]): print(json.dumps(c,ensure_ascii=False))
print('\nANNOUNCEMENTS (title/date only)')
for a in D.get('announcements',[]): print(f"- {a.get('created_at')} | {a.get('title')}")
print('\nLATEST ANNOUNCEMENT')
if D.get('announcements'):
    a=D['announcements'][-1]
    print(a.get('title'))
    print(a.get('description'))
print('\nLINKS')
print(json.dumps(D.get('links'),ensure_ascii=False,indent=2))
print('\nFLAGS')
print(json.dumps(D.get('resolved_flags'),ensure_ascii=False,indent=2))
