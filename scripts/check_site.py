"""Check the allowlisted public weights site; never publish radiographs or reports."""
import hashlib
import json
from pathlib import Path
import sys

root = Path(sys.argv[1])
manifest = json.loads((root / 'models/manifest.json').read_text())
model_files = {'manifest.json', 'reference.json', *(m['file'] for m in manifest['models'])}
root_files = {'index.html', 'model-notice.txt', 'model-license.txt'}
for path in root.rglob('*'):
    if path.is_dir():
        continue
    relative = path.relative_to(root)
    if path.is_symlink():
        raise ValueError(f'Symlink is not allowed: {relative}')
    parts = relative.parts
    allowed = (len(parts) == 1 and path.name in root_files or
               len(parts) == 2 and parts[0] == 'models' and path.name in model_files)
    if not allowed:
        raise ValueError(f'Unexpected file in public artifact: {relative}')
for model in manifest['models']:
    path = root / 'models' / model['file']
    assert path.stat().st_size == model['bytes']
    with path.open('rb') as f:
        assert hashlib.file_digest(f, 'sha256').hexdigest() == model['sha256']
size = sum(p.stat().st_size for p in root.rglob('*') if p.is_file())
assert size < 1_000_000_000, 'Pages artifact is too large'
print(f'Artifact verified: only public model weights and their license; {size / 1e6:.1f} MB.')
