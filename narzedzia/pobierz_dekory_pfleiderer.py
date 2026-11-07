"""
Zanders Atelier — pobranie dekorów PFLEIDERER do katalogu płyt i blatów.

Uruchamiać z katalogu głównego repo:  python narzedzia/pobierz_dekory_pfleiderer.py

Źródło: publiczna wyszukiwarka dekorów Pfleiderer (https://www.pfleiderer.com/pl-pl/produkty/wyszukiwarka-produktow/dekory).
  1. Lista wszystkich dekorów: endpoint wyszukiwarki (PRODUCTFINDER_API ze strony, parametry
     tx_epim_productfinder[f|start|num]) — kod, polska nazwa, grupa, gatunek drewna/kamienia, link.
  2. Dla każdego dekoru strona szczegółów: zdjęcie „Fragment dekoru 1.270 x 1.270 mm” (największy
     kwadratowy wariant) i adres zakładki „Dostępność” (EndproduktFinderApi paginate — z cHash
     przypisanym do dekoru, dlatego trzeba wejść na stronę dekoru).
  3. „Dostępność” → pole tgroup (Płyty melaminowane, Blaty robocze, Płyty lakierowane, HPL…) = products.
Zapisujemy dekory dostępne jako płyta (melaminowana albo lakierowana), blat lub laminat HPL.

Wynik:
  dane/dekory/pfleiderer.json            — lista dekorów (strona katalogu + konsultant)
  materiały/dekory/pfleiderer/<KOD>.webp — próbka 600 px (kwadrat)
Ponowne uruchomienie pomija już pobrane grafiki (ale odświeża listę i dostępność).

Nazwy niemieckie i angielskie (strony DE/EN katalogu):  python narzedzia/pobierz_dekory_pfleiderer.py --nazwy
  — ta sama wyszukiwarka w wersji /dach-de/ i /global-en/ (robots.txt blokuje /de/* i /en/*, te nie):
  name_de/name_en (pole subtitle) i tags_de/tags_en (gatunek drewna/kamienia — do wyszukiwania).
  Kilka zapytań, bez stron dekorów i grafik; pól PL nie zmienia.
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
BASE = 'https://www.pfleiderer.com'
FINDER = BASE + '/pl-pl/produkty/wyszukiwarka-produktow/dekory'
UA = {'User-Agent': 'ZandersAtelierMaterialCatalog/1.0 (furniture workshop zandersatelier.com)'}
OUT_JSON = os.path.join('dane', 'dekory', 'pfleiderer.json')
OUT_IMG = os.path.join('materiały', 'dekory', 'pfleiderer')
SIZE = 600
PAUSE = 0.8

GROUPS = {
    'Dekory drewnopodobne': 'drewno',
    'Dekory kamienne': 'kamien-materialy', 'Kreatywne': 'kamien-materialy', 'Real Metal': 'kamien-materialy',
    'Dekory jednobarwne metaliczne': 'kamien-materialy',
    'Biały': 'kolory', 'Biały Frontowy': 'kolory', 'Dekory jednobarwne': 'kolory',
}


def product_key(tgroup):
    t = tgroup.lower()
    if 'melamin' in t:
        return 'plyty'
    if 'blat' in t and 'akcesori' not in t:
        return 'blaty'
    if 'lakier' in t:
        return 'lakierowane'
    if 'kompakt' in t:
        return 'kompakt'
    if 'hpl' in t:
        return 'laminaty'
    if 'obrze' in t:
        return 'obrzeza'
    return None


def get(url, binary=False):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                data = r.read()
            time.sleep(PAUSE)
            return data if binary else data.decode('utf-8', 'ignore')
        except Exception as e:
            if getattr(e, 'code', None) == 404:
                raise
            print('  ponawiam', url[:90], e)
            time.sleep(10 * (attempt + 1))
    raise RuntimeError('nie udało się: ' + url)


def finder_entities(finder=FINDER):
    page = get(finder)
    api = html.unescape(re.search(r"PRODUCTFINDER_API = '([^']+)'", page).group(1))
    p = 'tx_epim_productfinder'
    ents, start, total = [], 0, None
    while total is None or start < total:          # strony po 100 (za duże num serwer ignoruje → 12)
        data = json.loads(get(f'{BASE}{api}&{p}%5Bf%5D=&{p}%5Bstart%5D={start}&{p}%5Bnum%5D=100'))
        total = data['total']
        if not data['entities']:
            break
        ents += data['entities']
        start += len(data['entities'])
    print('dekorów w wyszukiwarce:', total, '| pobrano', len(ents))
    return ents


def best_image(page, slug):
    """Największy kwadratowy wariant zdjęcia dekoru; pierwszeństwo ma „decor-detail-1-270…”
    (fragment 1,27 × 1,27 m — widać rysunek), potem inne zdjęcia tego dekoru (np. 100 × 100 mm)."""
    best = (0, 0, None)
    for tag in re.findall(r'<source[^>]+>', page):
        src = re.search(r'data-src="([^"]+)"', tag)
        w = re.search(r'width="(\d+)"', tag)
        h = re.search(r'height="(\d+)"', tag)
        if not (src and w and h) or w.group(1) != h.group(1):
            continue
        name = src.group(1).lower()
        if slug not in name or 'csm_' not in name:
            continue
        rank = (1 if 'decor-detail-1-270' in name else 0, int(w.group(1)))
        if rank > best[:2]:
            best = rank + (src.group(1),)
    return best[2]


def availability(page):
    m = re.search(r'(/pl-pl/produkty/dekory/szczegoly\?tx_epim_efapi%5Baction%5D=paginate[^"\' ]+)', page)
    if not m:
        return [], []
    data = json.loads(get(BASE + html.unescape(m.group(1))))
    av = data.get('available') or {}
    products = []
    for t in av.get('tgroup') or []:
        k = product_key(str(t))
        if k and k not in products:
            products.append(k)
    return products, [str(s) for s in av.get('struktur') or []]


def main():
    os.makedirs(OUT_IMG, exist_ok=True)
    out, skipped = [], 0
    ents = finder_entities()
    for n, e in enumerate(ents, 1):
        code, slug = e['title'].strip(), e['slug']
        try:
            page = get(e['detail_link'])
            products, structures = availability(page)
        except Exception as ex:
            print('  błąd', code, ex)
            continue
        if not any(p in products for p in ('plyty', 'lakierowane', 'blaty', 'laminaty')):   # laminaty = HPL (Katalog → Laminaty HPL)
            skipped += 1
            continue
        fv = e.get('filterValues') or {}
        d = {
            'producer': 'Pfleiderer', 'code': code, 'structure': ' / '.join(structures[:3]),
            'name': (e.get('subtitle') or '').strip() or code,
            'group': next((GROUPS[g] for g in fv.get('group', []) if g in GROUPS), 'kolory'),
            'products': products,
            'tags': [t for t in (fv.get('wood', []) + fv.get('stone', [])) if t != 'Pozostałe'],
            'url': e['detail_link'],
        }
        path = os.path.join(OUT_IMG, code + '.webp')
        if not os.path.exists(path):
            src = best_image(page, slug) or e.get('image_src')
            try:
                im = Image.open(io.BytesIO(get(BASE + src, binary=True))).convert('RGB')
                ImageOps.fit(im, (SIZE, SIZE), Image.LANCZOS).save(path, 'WEBP', quality=80, method=6)
            except Exception as ex:
                print('  błąd grafiki', code, ex)
                continue
        d['image'] = 'materiały/dekory/pfleiderer/' + code + '.webp'
        out.append(d)
        if n % 25 == 0:
            print(f'  {n}/{len(ents)} — w katalogu {len(out)}, pominięte (nie płyta/blat) {skipped}')
            json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    out.sort(key=lambda d: (d['group'], d['name']))
    json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GOTOWE — dekorów:', len(out), '| płyty', sum('plyty' in d['products'] for d in out),
          '| lakierowane', sum('lakierowane' in d['products'] for d in out),
          '| blaty', sum('blaty' in d['products'] for d in out), '| pominięte', skipped)


FINDERS = {
    'de': BASE + '/dach-de/produkte/produktfinder/dekore',
    'en': BASE + '/global-en/products/product-finder/decors',
}
OTHER = ('Sonstige', 'Andere', 'Other', 'Others')


def backfill_names():
    """Uzupełnia name_de/name_en i tags_de/tags_en w istniejącym pfleiderer.json (po kodzie dekoru)."""
    data = json.load(open(OUT_JSON, encoding='utf-8'))
    for lang, finder in FINDERS.items():
        ents = {e['title'].strip(): e for e in finder_entities(finder)}
        for d in data:
            e = ents.get(d['code'])
            if not e:
                continue
            name = (e.get('subtitle') or '').strip()
            if name:
                d['name_' + lang] = name
            if (e.get('detail_link') or '').startswith('https://'):
                d['url_' + lang] = e['detail_link']          # link „u producenta” na stronie DE/EN
            fv = e.get('filterValues') or {}
            tags = [t for t in (fv.get('wood', []) + fv.get('stone', [])) if t not in OTHER]
            if tags:
                d['tags_' + lang] = tags
        print(f'{lang}: nazwy {sum(1 for d in data if d.get("name_" + lang))}/{len(data)}; brak:',
              [d['code'] for d in data if not d.get('name_' + lang)])
    json.dump(data, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    sys.exit(backfill_names() if '--nazwy' in sys.argv else main())
