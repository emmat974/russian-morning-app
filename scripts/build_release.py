#!/usr/bin/env python3
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
exclude={'manifest-lock.json'}
def sha(p):
 h=hashlib.sha256(); h.update(p.read_bytes()); return h.hexdigest()
files=[]
for p in sorted(ROOT.rglob('*')):
 if not p.is_file(): continue
 rel=str(p.relative_to(ROOT)).replace('\\','/')
 if rel in exclude or rel.startswith('.git/'): continue
 files.append({'path':rel,'sha256':sha(p),'size':p.stat().st_size})
out={'schema_version':'1.0.0','content_version':json.loads((ROOT/'release.json').read_text())['content_version'],'files':files}
(ROOT/'manifest-lock.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'built manifest-lock.json: {len(files)} files')
