#!/usr/bin/env python3
from pathlib import Path
import json, sys, hashlib
ROOT=Path(__file__).resolve().parents[1]
def load(p):
    with open(p,encoding='utf-8') as f:return json.load(f)
errors=[]
activity_types=set(load(ROOT/'catalog/activity-types.json')['activity_types'])
block_types=set(load(ROOT/'catalog/lesson-block-types.json')['block_types'])
course_ids=set(); course_count=0
for p in (ROOT/'courses').rglob('*.json'):
    c=load(p); course_count+=1; cid=c.get('id')
    if cid in course_ids: errors.append(f'duplicate course id {cid}')
    course_ids.add(cid)
    blocks=c.get('content_blocks',[])
    if len(blocks)<6: errors.append(f'{cid}: course not rich enough ({len(blocks)} blocks)')
    total_text=sum(len(' '.join(b.get('body',[])))+sum(len(x) for x in b.get('items',[]) if isinstance(x,str)) for b in blocks)
    if total_text<800: errors.append(f'{cid}: explanatory content too short ({total_text} chars)')
    for b in blocks:
        if b.get('type') not in block_types: errors.append(f'{cid}: unknown block type {b.get("type")}')
    for pre in c.get('prerequisites',[]):
        # checked later once all ids known
        pass
# second course pass prerequisites
for p in (ROOT/'courses').rglob('*.json'):
    c=load(p)
    for pre in c.get('prerequisites',[]):
        if pre not in course_ids: errors.append(f'{c["id"]}: unknown prerequisite {pre}')
# taxonomy
err_tags={x['id'] for x in load(ROOT/'error-taxonomy.json')['error_tags']}
activity_ids=set(); activity_count=0; types_seen=set()
for p in (ROOT/'exercises').rglob('*.json'):
    d=load(p)
    for e in d.get('items',[]):
        activity_count+=1; eid=e.get('id')
        if eid in activity_ids: errors.append(f'duplicate activity id {eid}')
        activity_ids.add(eid)
        if e.get('lesson_id') not in course_ids: errors.append(f'{eid}: unknown lesson {e.get("lesson_id")}')
        at=e.get('activity_type')
        types_seen.add(at)
        if at not in activity_types: errors.append(f'{eid}: unknown activity type {at}')
        for tag in e.get('error_tags',[]):
            if tag not in err_tags: errors.append(f'{eid}: unknown error tag {tag}')
        if not e.get('skill_dimensions'): errors.append(f'{eid}: no skill_dimensions')
# pronunciation refs
pron=load(ROOT/'pronunciation/targets.json')['targets']; pids={x['id'] for x in pron}
for p in (ROOT/'exercises').rglob('*.json'):
    for e in load(p).get('items',[]):
        for field in ('pronunciation_target_id','audio_target_id'):
            if e.get(field) and e[field] not in pids: errors.append(f'{e["id"]}: missing {field} {e[field]}')
# content mix sanity
if 'pronunciation_repeat_word' not in types_seen and 'pronunciation_repeat_sentence' not in types_seen: errors.append('no pronunciation activities')
if 'listen_type' not in types_seen: errors.append('no listening/dictation activities')
if 'phrase_completion' not in types_seen: errors.append('no phrase completion activities')
# adaptive percentages
profiles=load(ROOT/'adaptive/session-profiles.json')['profiles']
for pr in profiles:
    mix=pr.get('target_mix')
    if mix and abs(sum(mix.values())-1)>0.001: errors.append(f'{pr["id"]}: target mix sums to {sum(mix.values())}')
if errors:
    print('VALIDATION FAILED')
    for x in errors: print(' -',x)
    sys.exit(1)
print(f'OK v0.3: {course_count} courses, {activity_count} activities, {len(pron)} pronunciation targets, {len(err_tags)} error tags, {len(types_seen)} activity types used.')
