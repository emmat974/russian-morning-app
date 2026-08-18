#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "manifest.json"
manifest = json.loads(PATH.read_text(encoding="utf-8"))

manifest["courses"] = [str(p.relative_to(ROOT)).replace("\\", "/") for p in sorted((ROOT / "courses").rglob("*.json"))]
manifest["exercise_sets"] = [str(p.relative_to(ROOT)).replace("\\", "/") for p in sorted((ROOT / "exercises").rglob("*.json"))]
manifest["vocabulary_sets"] = [str(p.relative_to(ROOT)).replace("\\", "/") for p in sorted((ROOT / "vocabulary").rglob("*.json"))]

PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("manifest.json rebuilt")
