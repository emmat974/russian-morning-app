#!/usr/bin/env python3
from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]

def load(path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

errors = []
manifest = load(ROOT / "manifest.json")
taxonomy = load(ROOT / "error-taxonomy.json")
known_error_tags = {x["id"] for x in taxonomy["error_tags"]}

course_ids = set()
for rel in manifest["courses"]:
    p = ROOT / rel
    if not p.exists():
        errors.append(f"Missing course file: {rel}")
        continue
    c = load(p)
    cid = c.get("id")
    if cid in course_ids:
        errors.append(f"Duplicate course id: {cid}")
    course_ids.add(cid)

exercise_ids = set()
for rel in manifest["exercise_sets"]:
    p = ROOT / rel
    if not p.exists():
        errors.append(f"Missing exercise file: {rel}")
        continue
    data = load(p)
    for e in data.get("items", []):
        eid = e.get("id")
        if eid in exercise_ids:
            errors.append(f"Duplicate exercise id: {eid}")
        exercise_ids.add(eid)
        if e.get("lesson_id") not in course_ids:
            errors.append(f"{eid}: unknown lesson_id {e.get('lesson_id')}")
        for tag in e.get("error_tags", []):
            if tag not in known_error_tags:
                errors.append(f"{eid}: unknown error_tag {tag}")
        if e.get("type") in {"multiple_choice","comprehension","classify"} and e.get("options"):
            if e.get("answer") not in e["options"]:
                errors.append(f"{eid}: answer missing from options")

for rel in manifest["vocabulary_sets"]:
    p = ROOT / rel
    if not p.exists():
        errors.append(f"Missing vocabulary file: {rel}")
    else:
        load(p)

curr = manifest.get("curriculum", {})
for cid in curr.get("active_course_ids", []) + curr.get("preview_course_ids", []):
    if cid not in course_ids:
        errors.append(f"Curriculum references unknown course: {cid}")

if set(curr.get("active_course_ids", [])) & set(curr.get("preview_course_ids", [])):
    errors.append("A course cannot be both active and preview")

mix = manifest.get("adaptive_engine", {}).get("recommended_mix", {})
if mix and abs(sum(mix.values()) - 1.0) > 1e-9:
    errors.append(f"Adaptive mix must sum to 1.0, got {sum(mix.values())}")

if errors:
    print("Validation failed:")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print(f"OK: {len(course_ids)} courses, {len(exercise_ids)} exercises, {len(known_error_tags)} error tags.")
