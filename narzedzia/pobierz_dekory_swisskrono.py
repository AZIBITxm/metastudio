"""
Zanders Atelier — dekory SWISS KRONO z oficjalnego katalogu PDF „Płyty laminowane i Blaty kuchenne” (PL).

Uruchamiać z katalogu głównego repo:
    python narzedzia/pobierz_dekory_swisskrono.py [ścieżka/do/katalogu.pdf]
Bez ścieżki narzędzie pobiera katalog z centrum pobierania SWISS KRONO (strona płyt laminowanych).

Dlaczego PDF, a nie strona: wyszukiwarka dekorów SWISS KRONO działa przez adresy, które ich robots.txt
zabrania odwiedzać robotom (tx_sk_search, ?filter, ?data), a mapa strony z dekorami jest pusta.
Katalog PDF jest publiczny (centrum pobierania) i zawiera wszystkie dekory płyt i blatów z kodami.

Jak czytamy katalog: strony „DEKORY …” (płyty) i „UNIKOLORY / … BLATY KUCHENNE” (blaty) to siatki
próbek; pod każdą próbką podpis: KOD[*] STRUKTURA(Y) / NAZWA PL / NAZWA EN. Próbka = zdjęcie (albo
wypełniony prostokąt przy kolorach jednolitych), w którego obrysie leży podpis. Wycinamy górną część
próbki (bez podpisu), renderujemy w wysokiej rozdzielczości.
Strony z siatkami rozpoznajemy po treści (stopka „PŁYTY MEBLOWE” / „BLATY KUCHENNE” + kody w polach siatki),
żeby nowe wydanie katalogu nie wymagało zmian w kodzie.

Wynik:
  dane/dekory/swisskrono.json            — lista dekorów
  materiały/dekory/swisskrono/<KOD>.webp — próbka 600 px
"""
import io
import json
import os
import re
import sys
import urllib.request

import fitz  # PyMuPDF
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
BOARDS_PAGE = 'https://www.swisskrono.com/pl-pl/produkty/produkty-meblowe/plyty-laminowane/'
UA = {'User-Agent': 'ZandersAtelierMaterialCatalog/1.0 (furniture workshop zandersatelier.com)'}
OUT_JSON = os.path.join('dane', 'dekory', 'swisskrono.json')
OUT_IMG = os.path.join('materiały', 'dekory', 'swisskrono')
SIZE = 600
CODE_RE = re.compile(r'^([DUK]\d{2,6})(\*?)\s*(.*)$')
WOOD = ('DĄB', 'BUK', 'JESION', 'ORZECH', 'SOSNA', 'KLON', 'WIĄZ', 'KASZTAN', 'OLCHA', 'GRUSZA', 'JABŁOŃ',
        'WENGE', 'DREWNO', 'CZEREŚNIA', 'WIŚNIA', 'BRZOZA', 'AKACJA', 'TEAK', 'MODRZEW', 'ŚWIERK', 'LIPA')
STONE = ('MARMUR', 'MAMRMUR', 'BETON', 'GRANIT', 'KAMIEŃ', 'TRAWERTYN', 'TERRAZZO', 'KWARCYT', 'ŁUPEK',
         'CALACATTA', 'KASKADA', 'WYDMY', 'FILC', 'PŁÓTNO', 'LEN', 'TYTAN', 'METALIK', 'MIEDZIANY', 'TKANE',
         'MELAFIR', 'ENIGMA')


def catalog_pdf():
    if len(sys.argv) > 1:
        return sys.argv[1]
    page = urllib.request.urlopen(urllib.request.Request(BOARDS_PAGE, headers=UA), timeout=60).read().decode('utf-8', 'ignore')
    for m in re.finditer(r'href="([^"]*tx_downloadcenter[^"]*)"', page):
        after = re.sub(r'<[^>]+>', ' ', page[m.end():m.end() + 600])
        if 'Płyty laminowane i Blaty kuchenne' in after:
            url = 'https://www.swisskrono.com' + m.group(1).replace('&amp;', '&')
            path = os.path.join(os.environ.get('TEMP', '.'), 'swisskrono-katalog.pdf')
            with open(path, 'wb') as f:
                f.write(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read())
            return path
    raise RuntimeError('nie znalazłem katalogu „Płyty laminowane i Blaty kuchenne” na ' + BOARDS_PAGE)


def tiles(page):
    """Prostokąty próbek: zdjęcia i wypełnione prostokąty (kolory jednolite), min. 120 pt."""
    out = [fitz.Rect(i['bbox']) for i in page.get_image_info()]
    out += [d['rect'] for d in page.get_drawings() if d.get('fill')]
    pr = page.rect
    out = [r & pr for r in out]
    return [r for r in out if 120 <= r.width < pr.width * 0.9 and 120 <= r.height < pr.height * 0.9]


def lines(page):
    res = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            t = ' '.join(s['text'] for s in l['spans']).strip()
            if t:
                res.append((fitz.Rect(l['bbox']), re.sub(r'\s+', ' ', t)))
    return res


def nice(name):
    name = name.strip().strip('*').strip()
    return ' '.join(w if w.isupper() and len(w) <= 3 and w in ('II', 'III') else w.capitalize() for w in name.split()) \
        if name.isupper() else name


def group_of(name):
    up = name.upper()
    if any(w in up for w in WOOD):
        return 'drewno'
    if any(w in up for w in STONE):
        return 'kamien-materialy'
    return 'kolory'


def main():
    pdf = fitz.open(catalog_pdf())
    os.makedirs(OUT_IMG, exist_ok=True)
    found = {}
    # od końca: najpierw właściwe strony dekorów (pełne nazwy wielkimi literami), na końcu zestawienia
    # kolekcji z początku katalogu (te same kody, nazwy skrócone, czasem zdjęcia wnętrz)
    for pno in reversed(range(pdf.page_count)):
        page = pdf[pno]
        foot = re.sub(r'\s+', '', page.get_text().upper())[-40:]   # stopka ma litery rozstrzelone spacjami
        kind = 'blaty' if 'BLATYKUCHENNE' in foot else 'plyty' if 'PŁYTYMEBLOWE' in foot else None
        ts = tiles(page)
        if not kind or not ts:
            continue
        ls = lines(page)
        hits = 0
        for i, (rect, t) in enumerate(ls):
            m = CODE_RE.match(t)
            if not m:
                continue
            c = fitz.Point((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2)
            box = [r for r in ts if r.contains(c)]
            if not box:
                continue
            tile = min(box, key=lambda r: r.width * r.height)
            code, star, structs = m.group(1), m.group(2), m.group(3)
            # nazwa PL = linia tuż pod kodem, zachodząca na niego w poziomie (podpisy bywają wyrównane do prawej)
            below = [(r, s) for r, s in ls if 0 <= r.y0 - rect.y1 + 2 <= 8 and r.x0 < rect.x1 and r.x1 > rect.x0
                     and not CODE_RE.match(s)]
            below.sort(key=lambda x: x[0].y0)
            raw = below[0][1] if below else ''
            # Próbki w katalogu mają nazwę WIELKIMI literami. Nazwa zwykłymi literami („Sosna bielona”)
            # to podpis pod zdjęciem wnętrza — tam pole siatki jest fragmentem zdjęcia, nie próbką.
            if not raw or not raw.replace('(', '').replace(')', '').isupper():
                continue
            name = nice(raw)
            label_top = rect.y0
            d = found.setdefault(code, {'producer': 'SWISS KRONO', 'code': code, 'structures': [], 'name': name,
                                        'products': [], 'url': BOARDS_PAGE, '_crop': None, '_swatch': False})
            for s in re.split(r'[;,\s]+', structs):
                if re.fullmatch(r'[A-Z]{2}', s) and s not in d['structures']:
                    d['structures'].append(s)
            for k in ([kind] + (['blaty' if kind == 'plyty' else 'plyty'] if star else [])):
                if k not in d['products']:
                    d['products'].append(k)
            swatch = tile.width <= 215 and tile.height <= 215      # pojedyncze pole siatki, nie zdjęcie wnętrza
            if d['_crop'] is None or (swatch and not d['_swatch']):
                d['_swatch'] = swatch
                # obszar próbki nad podpisem; nad kodem bywa ikonka (globus, kropka, „NEW”) ~20 pt —
                # odcinamy 26 pt nad kodem i 4 pt ramki; kwadrat ze środka
                area = fitz.Rect(tile.x0 + 4, tile.y0 + 4, tile.x1 - 4, max(tile.y0 + 60, label_top - 26))
                side = min(area.width, area.height)
                cx = (area.x0 + area.x1) / 2
                d['_crop'] = (pno, fitz.Rect(cx - side / 2, area.y0, cx + side / 2, area.y0 + side))
            hits += 1
        if hits:
            print(f'  strona {pno + 1} ({kind}): {hits}')

    out = []
    for code, d in found.items():
        pno, clip = d.pop('_crop')
        d.pop('_swatch')
        path = os.path.join(OUT_IMG, code + '.webp')
        zoom = SIZE / clip.width
        pix = pdf[pno].get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, alpha=False)
        im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
        ImageOps.fit(im, (SIZE, SIZE), Image.LANCZOS).save(path, 'WEBP', quality=80, method=6)
        d['image'] = 'materiały/dekory/swisskrono/' + code + '.webp'
        d['structure'] = ' / '.join(d.pop('structures')[:3])
        d['group'] = group_of(d['name'])
        out.append(d)
    out.sort(key=lambda d: (d['group'], d['name']))
    json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GOTOWE — dekorów:', len(out), '| płyty', sum('plyty' in d['products'] for d in out),
          '| blaty', sum('blaty' in d['products'] for d in out))


if __name__ == '__main__':
    sys.exit(main())
