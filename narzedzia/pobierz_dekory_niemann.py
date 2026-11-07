"""
Zanders Atelier — kolory frontów akrylowych Niemann Polska ACRYLUX (połysk i mat) do katalogu materiałów.

Uruchamiać z katalogu głównego repo:  python narzedzia/pobierz_dekory_niemann.py
Opisy serii po niemiecku/angielsku (structure_de/_en, bez pobierania):  python narzedzia/pobierz_dekory_niemann.py --nazwy

Źródło: publiczne strony produktów Niemann Polska — galeria kolorów pod opisem produktu
(<img alt="Nazwa KOD"> z /files/gallery/<id>/...). Pobieramy większy wariant miniatury (/img2/w800-h600/...).
robots.txt pozwala (blokuje tylko katalogi techniczne).

Wynik:
  dane/dekory/niemann.json            — lista kolorów (rodzaj: front-akryl)
  materiały/dekory/niemann/<KOD>.webp — próbka 600 px
"""
import html
import io
import json
import os
import re
import sys
import time
import urllib.request

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
BASE = 'https://www.niemannpolska.pl'
PAGES = [
    ('/oferta/plyty-meblowe/acrylux-2/', 'Acrylux połysk'),
    ('/oferta/plyty-meblowe/acrylux-mat-anti-fingerprint/', 'Acrylux mat anti-fingerprint'),
]
UA = {'User-Agent': 'ZandersAtelierMaterialCatalog/1.0 (furniture workshop zandersatelier.com)'}
OUT_JSON = os.path.join('dane', 'dekory', 'niemann.json')
OUT_IMG = os.path.join('materiały', 'dekory', 'niemann')
SIZE = 600
PAUSE = 1.0
WOOD = ('dąb', 'orzech', 'jesion', 'drewno', 'buk', 'sosna', 'wiąz', 'teak', 'klon', 'oak', 'wood')
STONE = ('marmur', 'kamień', 'beton', 'granit', 'metal', 'stal', 'onyks', 'miedź', 'złot', 'srebr', 'tytan')


def get(url, binary=False):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                data = r.read()
            time.sleep(PAUSE)
            return data if binary else data.decode('utf-8', 'ignore')
        except Exception as e:
            print('  ponawiam', url[:80], e)
            time.sleep(10 * (attempt + 1))
    raise RuntimeError('nie udało się: ' + url)


def group_of(name):
    low = name.lower()
    if any(w in low for w in WOOD):
        return 'drewno'
    if any(w in low for w in STONE):
        return 'kamien-materialy'
    return 'kolory'


def main():
    os.makedirs(OUT_IMG, exist_ok=True)
    out = {}
    for path, series in PAGES:
        page = get(BASE + path)
        n = 0
        # galeria kolorów: miniatury w340-h240 z alt „Nazwa KOD [*uwaga]”
        for alt, src in re.findall(r'<img alt="([^"]*)" src="(/img2/w340-h240[^"]+/files/gallery/\d+/[^"]+)"', page):
            alt = html.unescape(alt).split('*')[0].strip()
            m = re.match(r'(.+?)\s+([A-Z]{0,3}\d{3,6}[A-Z]?)$', alt)
            if not m:
                continue
            name, code = m.group(1).strip(), m.group(2)
            key = code + ('-mat' if 'mat' in series else '')
            if key in out:
                continue
            file_path = '/files/' + src.split('/files/', 1)[1]
            img_path = os.path.join(OUT_IMG, key + '.webp')
            if not os.path.exists(img_path):
                try:
                    raw = get(BASE + '/img2/w800-h600' + file_path, binary=True)
                except Exception:
                    raw = get(BASE + src, binary=True)
                im = Image.open(io.BytesIO(raw)).convert('RGB')
                ImageOps.fit(im, (SIZE, SIZE), Image.LANCZOS).save(img_path, 'WEBP', quality=80, method=6)
            out[key] = {
                'producer': 'Niemann', 'code': code, 'structure': series, 'name': name.capitalize() if name.isupper() else name,
                'group': group_of(name), 'products': ['front-akryl'], 'tags': ['Acrylux', series],
                'url': BASE + path, 'image': img_path.replace(os.sep, '/'),
            }
            n += 1
        print(f'  {series}: {n}')
    data = sorted(out.values(), key=lambda d: (d['structure'], d['group'], d['name']))
    json.dump(data, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GOTOWE — kolorów:', len(data))


# Opisowe nazwy serii po niemiecku / angielsku (strony DE/EN katalogu; --nazwy). Niemann Polska ma tylko
# stronę polską, więc nazw kolorów nie tłumaczymy.
STRUCTURE_LANG = {
    'Acrylux połysk': ('Acrylux Hochglanz', 'Acrylux high gloss'),
    'Acrylux mat anti-fingerprint': ('Acrylux matt Anti-Fingerprint', 'Acrylux matt anti-fingerprint'),
}
def backfill_names():
    """Uzupełnia structure_de/structure_en w istniejącym pliku — tylko słowa opisowe serii (słownik
    STRUCTURE_LANG, tłumaczenie własne). Nazw kolorów NIE tłumaczymy: producent ma tylko stronę polską,
    a nazwa własna dekoru bez oficjalnej wersji zostaje po polsku (strona DE/EN pokazuje pole name)."""
    data = json.load(open(OUT_JSON, encoding='utf-8'))
    for d in data:
        tr = STRUCTURE_LANG.get(d.get('structure'))
        for i, lang in enumerate(('de', 'en')):
            if tr:
                d['structure_' + lang] = tr[i]
            else:
                d.pop('structure_' + lang, None)
    json.dump(data, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('structure_de/en:', sum(1 for d in data if d.get('structure_en')), '/', len(data))


if __name__ == '__main__':
    sys.exit(backfill_names() if '--nazwy' in sys.argv else main())
