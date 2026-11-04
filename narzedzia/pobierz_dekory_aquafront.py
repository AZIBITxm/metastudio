"""
Zanders Atelier — kolory frontów AQUAFRONT (AQUAAKRYL, AQUAHPL, AQUADECOR) do katalogu materiałów.

Uruchamiać z katalogu głównego repo:  python narzedzia/pobierz_dekory_aquafront.py

Źródło: publiczne API sklepu z próbkami Aquafront (WooCommerce Store API,
https://aquafront.eu/wp-json/wc/store/v1/products) — każdy kolor to produkt „próbka/listek” z kategorią
(kolekcja), nazwą „Nazwa KOD” i zdjęciem frontu. robots.txt pozwala (blokuje tylko koszyk/admin).
Pomijamy kategorię „wzorniki-aquafront” (zestawy wzorników, nie kolory).

Kolekcje → rodzaj frontu w katalogu:
  aquaakryl-soft-cat (standard, soft, ultra, grand, szkło, szkło dekor, 3D) → front-akryl
  aquahpl (woods, minerals, metallics)                                   → front-hpl
  aquadecor (lustro, ryfla, struktura)                                   → front-dekor

Wynik:
  dane/dekory/aquafront.json            — lista kolorów
  materiały/dekory/aquafront/<KOD>.webp — kadr 600 px ze środka zdjęcia frontu
"""
import html
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
API = 'https://aquafront.eu/wp-json/wc/store/v1/products?per_page=100&page=%d'
UA = {'User-Agent': 'ZandersAtelierMaterialCatalog/1.0 (furniture workshop zandersatelier.com)'}
OUT_JSON = os.path.join('dane', 'dekory', 'aquafront.json')
OUT_IMG = os.path.join('materiały', 'dekory', 'aquafront')
SIZE = 600
PAUSE = 1.0

KIND = {'aquaakryl-soft-cat': 'front-akryl', '3d': 'front-akryl', 'aquahpl': 'front-hpl', 'aquadecor': 'front-dekor'}
SERIES = {'standard': 'Standard', 'soft': 'Soft (mat)', 'ultra': 'Ultra', 'grand': 'Grand', 'szklo': 'Szkło',
          'szklo-dekor': 'Szkło dekor', '3d': '3D', 'woods': 'HPL Woods', 'minerals': 'HPL Minerals',
          'metallics': 'HPL Metallics', 'lustro': 'Lustro', 'ryfla': 'Ryfla', 'struktura': 'Struktura'}
WOOD = ('dąb', 'orzech', 'topola', 'jabłoń', 'buk', 'jesion', 'sosna', 'wiąz', 'drewno', 'teak', 'klon', 'wenge',
        'olcha', 'akacja', 'grusza', 'cedr', 'modrzew', 'świerk', 'heban', 'palisander', 'wiśnia', 'oak', 'wood')
STONE = ('kamień', 'marmur', 'beton', 'granit', 'trawertyn', 'łupek', 'blacha', 'rdza', 'metal', 'stal', 'tkanina',
         'onyks', 'terrazzo', 'lustro', 'złoto', 'brąz', 'miedź', 'srebr', 'tytan', 'kwarc', 'ryfla',
         'plisowan', 'meteoryt', 'piaskowiec', 'cement', 'tynk', 'len')


def get(url, binary=False):
    for attempt in range(5):
        try:
            safe = urllib.parse.quote(url, safe=':/?&=%#+,')      # nazwy plików bywają z polskimi znakami / „—”
            with urllib.request.urlopen(urllib.request.Request(safe, headers=UA), timeout=60) as r:
                data = r.read()
            time.sleep(PAUSE)
            return data if binary else data.decode('utf-8', 'ignore')
        except Exception as e:
            print('  ponawiam', url[:80], e)
            time.sleep(10 * (attempt + 1))
    raise RuntimeError('nie udało się: ' + url)


def split_name(name):
    """„Popielaty GRAND G85384” → („Popielaty”, „G85384”); kod = ostatnie słowo z cyfrą."""
    words = html.unescape(name).split()
    code = words[-1] if words and re.search(r'\d', words[-1]) else ''
    rest = [w for w in words[:-1] if w.upper() not in ('GRAND', 'SOFT', 'ULTRA')] if code else words
    return ' '.join(rest).strip() or name, code


def group_of(name, slugs):
    low = name.lower()
    if 'woods' in slugs or any(w in low for w in WOOD):
        return 'drewno'
    if 'minerals' in slugs or 'metallics' in slugs or any(w in low for w in STONE):
        return 'kamien-materialy'
    return 'kolory'


def save_image(src, path):
    im = Image.open(io.BytesIO(get(src, binary=True))).convert('RGB')
    w, h = im.size
    side = int(min(w, h) * 0.62)          # front stoi pośrodku jasnego tła — kadr ze środka
    box = ((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2)
    ImageOps.fit(im.crop(box), (SIZE, SIZE), Image.LANCZOS).save(path, 'WEBP', quality=80, method=6)


def main():
    os.makedirs(OUT_IMG, exist_ok=True)
    items, page = [], 1
    while True:
        batch = json.loads(get(API % page))
        if not batch:
            break
        items += batch
        page += 1
    print('produktów w sklepie:', len(items))
    out, seen = [], set()
    for p in items:
        slugs = [c['slug'] for c in p.get('categories') or []]
        kind = next((KIND[s] for s in slugs if s in KIND), None)
        if not kind or not p.get('images'):
            continue
        name, code = split_name(p['name'])
        code = code or str(p['id'])
        if code in seen:
            continue
        seen.add(code)
        series = next((SERIES[s] for s in slugs if s in SERIES), '')
        path = os.path.join(OUT_IMG, re.sub(r'[^\w-]', '_', code) + '.webp')
        if not os.path.exists(path):
            try:
                save_image(p['images'][0]['src'], path)
            except Exception as e:
                print('  błąd grafiki', code, e)
                continue
        out.append({
            'producer': 'Aquafront', 'code': code, 'structure': series, 'name': name,
            'group': group_of(name, slugs), 'products': [kind],
            'tags': [series] if series else [],
            'url': p.get('permalink') or 'https://aquafront.eu/',
            'image': path.replace(os.sep, '/'),
        })
        if len(out) % 25 == 0:
            print('  zapisano', len(out))
    out.sort(key=lambda d: (d['products'][0], d['group'], d['name']))
    json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GOTOWE — kolorów:', len(out), {k: sum(k in d['products'] for d in out) for k in set(KIND.values())})


if __name__ == '__main__':
    sys.exit(main())
