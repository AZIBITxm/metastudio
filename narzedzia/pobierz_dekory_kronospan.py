"""
Zanders Atelier — pobranie dekorów KRONOSPAN (kolekcja Kronodesign) do katalogu płyt i blatów.

Uruchamiać z katalogu głównego repo:  python narzedzia/pobierz_dekory_kronospan.py

Źródło: publiczna strona dekorów Kronospan (https://kronospan.com/pl_PL/decors/by_collection/kronodesign/).
Strona wczytuje listę przez własny endpoint POST /pl_PL/ajax/decors/init_decores (te same filtry
co na stronie: products, material_reproduction…). Pytamy go kilka razy z różnymi filtrami:
  - wszystkie dekory (kod, nazwa, struktura, miniatura, link do strony dekoru),
  - filtr „Produkt” → w czym dekor jest dostępny (płyty laminowane, blaty, obrzeża…),
  - filtr „Odwzorowanie materiału” → grupa (drewno / kamień i materiały / kolory).
Zapisujemy dekory dostępne jako płyta laminowana, blat albo front (akrylowy, lakierowany, PET).

Wynik:
  dane/dekory/kronospan.json            — lista dekorów (strona katalogu + konsultant)
  materiały/dekory/kronospan/<KOD>.webp — próbka 600 px (kwadrat)
"""
import io
import json
import os
import sys
import time
import urllib.request
import http.cookiejar

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
BASE = 'https://kronospan.com'
PAGE = BASE + '/pl_PL/decors/by_collection/kronodesign/'
API = BASE + '/pl_PL/ajax/decors/init_decores'
UA = 'ZandersAtelierMaterialCatalog/1.0 (furniture workshop zandersatelier.com)'
OUT_JSON = os.path.join('dane', 'dekory', 'kronospan.json')
OUT_IMG = os.path.join('materiały', 'dekory', 'kronospan')
SIZE = 600
PAUSE = 1.0

# Filtr „Produkt” Kronospan (id → nasz klucz, wspólny z egger.json)
PRODUCTS = {
    'plyty': [1, 2],                      # płyta wiórowa laminowana MF PB, płyta MDF laminowana MF MDF
    'blaty': [683, 684, 686, 688],        # blaty zaokrąglone / prostokątne / Slim Line / HPL
    'obrzeza': [15, 689, 690],
    'laminaty': [8],
    'kompakt': [12],
    'panele-wnekowe': [692],
    # fronty (Katalog → Fronty): płyty akrylowe, lakierowane MDF, MDF z folią PET / Mirror Gloss
    'front-akryl': [682, 5],
    'front-lakier': [773, 774],
    'front-pet': [727, 732, 605],
}
FRONTS = ('front-akryl', 'front-lakier', 'front-pet')
# Filtr „Odwzorowanie materiału” (grupa → nasza grupa). Serwer przyjmuje id OPCJI („213-3” = Dąb),
# nie id grupy — pytamy o każdą opcję i zapisujemy jej polską nazwę w tags (Kronospan nazywa dekory
# po angielsku, a klient szuka „dąb”, „szary”). Kolejność = pierwszeństwo grupy.
GROUPS = {'drewno': [213], 'kamien-materialy': [216, 244, 248, 245], 'kolory': [210]}
EMPTY = {k: [] for k in ('collections', 'products', 'decors', 'textures', 'decor_combinations',
                         'applications', 'material_reproduction', 'decor_features')}

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def req(url, data=None, binary=False):
    for attempt in range(5):
        try:
            headers = {'User-Agent': UA}
            body = None
            if data is not None:
                body = json.dumps(data).encode()
                headers.update({'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Referer': PAGE})
            with opener.open(urllib.request.Request(url, data=body, headers=headers), timeout=60) as r:
                out = r.read()
            time.sleep(PAUSE)
            return out if binary else out.decode('utf-8', 'ignore')
        except Exception as e:
            print('  ponawiam', url[:80], e)
            time.sleep(10 * (attempt + 1))
    raise RuntimeError('nie udało się: ' + url)


def query(**filters):
    return json.loads(req(API, dict(EMPTY, **filters)))


def items(**filters):
    """Wszystkie pozycje (z każdej kolekcji) dla podanych filtrów."""
    return [it for c in query(**filters)['data'] for it in (c.get('items') or [])]


def codes(**filters):
    return {it['decor_number'] for it in items(**filters)}


def save_image(d, src):
    path = os.path.join(OUT_IMG, d['code'] + '.webp')
    if not os.path.exists(path):
        try:
            raw = req(BASE + src.replace('350x350', '600x600'), binary=True)
            im = Image.open(io.BytesIO(raw))
        except Exception:
            im = Image.open(io.BytesIO(req(BASE + src, binary=True)))   # zapasowo mniejsza miniatura
        ImageOps.fit(im.convert('RGB'), (SIZE, SIZE), Image.LANCZOS).save(path, 'WEBP', quality=80, method=6)
    d['image'] = 'materiały/dekory/kronospan/' + d['code'] + '.webp'


def main():
    os.makedirs(OUT_IMG, exist_ok=True)
    req(PAGE)                                  # ciasteczko sesji, jak w przeglądarce
    first = query()
    every = [it for c in first['data'] for it in (c.get('items') or [])]
    tags, grp = {}, {g: set() for g in GROUPS}
    for mg in first['filters']['material_reproduction']:
        for opt in mg.get('options') or []:
            found = codes(material_reproduction=[opt['id']])
            for c in found:
                tags.setdefault(c, [])
                if opt['title'] not in tags[c] and opt['title'] != 'Inne':
                    tags[c].append(opt['title'])
            for g, ids in GROUPS.items():
                if mg['id'] in ids:
                    grp[g] |= found
    print('pozycji (z powtórzeniami między kolekcjami):', len(every))
    prod = {k: codes(products=v) for k, v in PRODUCTS.items()}

    by_code = {}
    for it in every:
        c = it['decor_number']
        d = by_code.setdefault(c, {
            'producer': 'Kronospan', 'code': c, 'structures': [], 'name': it['decor_title'].strip(),
            'url': BASE + '/pl_PL' + it['decor_url'], '_img': it['decor_image'],
        })
        for t in [it.get('top_texture')] + [x.get('decor_texture_abbr') for x in it.get('textures') or []]:
            t = (t or '').split('/')[0].strip()
            if t and t not in d['structures']:
                d['structures'].append(t)

    out = []
    for c, d in by_code.items():
        d['products'] = [k for k in PRODUCTS if c in prod[k]]
        if not any(p in d['products'] for p in ('plyty', 'blaty', 'laminaty') + FRONTS):
            continue
        d['group'] = next((g for g in GROUPS if c in grp[g]), 'kolory')
        d['tags'] = tags.get(c, [])
        d['structure'] = ' / '.join(d.pop('structures')[:3])
        try:
            save_image(d, d.pop('_img'))
        except Exception as e:
            print('  błąd grafiki', c, e)
            continue
        out.append(d)
        if len(out) % 25 == 0:
            print('  zapisano', len(out))
    out.sort(key=lambda d: (d['group'], d['name']))
    json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GOTOWE — dekorów:', len(out), '| płyty', sum('plyty' in d['products'] for d in out),
          '| blaty', sum('blaty' in d['products'] for d in out))


if __name__ == '__main__':
    sys.exit(main())
