"""Converts the MachoModular OTF files in the brand pack to WOFF2 for the web.

Run it in a throwaway virtual environment, outside the project folder:

    python3 -m venv "$SCRATCH/fontenv"
    "$SCRATCH/fontenv/bin/pip" install fonttools brotli
    "$SCRATCH/fontenv/bin/python" scripts/convert-fonts.py "/path/to/STEM RACING BRANDING SHARE"
"""
import os
import sys

from fontTools.ttLib import TTFont

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
default_pack = os.path.join(root, '..', 'STEM Racing', 'STEM RACING BRANDING SHARE')
pack = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else default_pack)
source_dir = os.path.join(pack, 'Fonts', 'Machomodular')
target_dir = os.path.join(root, 'public', 'fonts')

if not os.path.isdir(source_dir):
    sys.exit(f'MachoModular folder not found at {source_dir}')

os.makedirs(target_dir, exist_ok=True)

for weight in ('Light', 'Medium', 'Bold'):
    matches = [name for name in os.listdir(source_dir) if name.endswith(f'MachoModular_{weight}.otf')]
    if len(matches) != 1:
        sys.exit(f'Expected one MachoModular {weight} file in {source_dir}, found {len(matches)}')

    font = TTFont(os.path.join(source_dir, matches[0]))
    family = font['name'].getDebugName(1) or ''
    if 'MachoModular' not in family:
        sys.exit(f'{matches[0]} is "{family}", not MachoModular')

    target = os.path.join(target_dir, f'MachoModular-{weight}.woff2')
    font.flavor = 'woff2'
    font.save(target)
    print(f'wrote {os.path.relpath(target, root)} ({os.path.getsize(target)} bytes)')
