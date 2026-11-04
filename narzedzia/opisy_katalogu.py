"""
Zanders Atelier — opisy materiałów ze strony głównej do Katalogu materiałów.

Uruchamiać z katalogu głównego repo:  python narzedzia/opisy_katalogu.py
(po każdej zmianie opisów w dane/kategorie-materialow-zrodlo.html — dawna sekcja „Kategorie materiałów” strony głównej, jedyne źródło tekstu).

Bierze z dane/kategorie-materialow-zrodlo.html każdy blok <div class="material-info" id="<id>-info">:
  - tytuł (h3), treść opisu (HTML bez wygenerowanych bloków KATALOG/PRODUCENCI i bez zdjęcia),
  - zdjęcie kategorii (.material-image img) — dla płyt/frontów/blatów (zdjęcia z pokazu na stronie głównej).
Galerie odmian dokłada strona katalogu z dane/katalog-zrodla.json.

Wynik: dane/opisy-materialow.json  {id: {"title", "html", "image"}}
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SRC = os.path.join('dane', 'kategorie-materialow-zrodlo.html')   # dawna sekcja ze strony głównej
OUT = os.path.join('dane', 'opisy-materialow.json')


def block_end(doc, start):
    """Indeks końca diva otwartego w `start` (liczenie zagnieżdżeń <div …> / </div>)."""
    depth, i = 0, start
    for m in re.finditer(r'<div\b|</div>', doc[start:]):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0:
            return start + m.end()
    return len(doc)


def main():
    doc = open(SRC, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'<div class="material-info" id="([a-z0-9-]+)-info"[^>]*>', doc):
        mid = m.group(1)
        if mid in out:            # „blaty-info” występuje na stronie dwa razy — bierzemy pierwszy
            continue
        inner = doc[m.end():block_end(doc, m.start()) - len('</div>')]
        inner = re.sub(r'<!-- (KATALOG|PRODUCENCI):[^:]+:START -->.*?<!-- \1:[^:]+:END -->', '', inner, flags=re.S)
        img = re.search(r'<div class="material-image">\s*<img[^>]*src="([^"]+)"', inner)
        inner = re.sub(r'<div class="material-image">.*?</div>', '', inner, count=1, flags=re.S)
        title = re.search(r'<h3>(.*?)</h3>', inner, re.S)
        inner = re.sub(r'<h3>.*?</h3>', '', inner, count=1, flags=re.S)
        html = re.sub(r'\s+', ' ', inner).strip()
        html = re.sub(r'^(<div class="(material-content|main-description)">\s*)', r'\1', html)
        out[mid] = {
            'title': re.sub(r'<[^>]+>', '', title.group(1)).strip() if title else mid,
            'html': html,
            'image': img.group(1) if img else '',
        }
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('opisów:', len(out), '| ze zdjęciem:', [k for k, v in out.items() if v['image']])


if __name__ == '__main__':
    sys.exit(main())
