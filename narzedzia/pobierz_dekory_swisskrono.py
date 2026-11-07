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

Nazwy angielskie (strona EN katalogu):  python narzedzia/pobierz_dekory_swisskrono.py --nazwy [katalog.pdf]
  — z angielskiej wersji tego samego katalogu („Catalogue - Laminated boards and Worktops 2025 EN”,
  centrum pobierania na stronie pl-en): pod kodem stoi nazwa PL, a pod nią nazwa EN (WIELKIMI literami)
  → pole name_en (po kodzie). Pól PL i grafik nie zmienia. Niemieckiej wersji katalogu SWISS KRONO
  nie wydaje (strona pl-de daje ten sam katalog EN; strona niemiecka SWISS KRONO ma inną kolekcję),
  więc name_de nie ma — strona DE pokazuje wtedy nazwę PL (pole name).
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


BOARDS_PAGE_EN = 'https://www.swisskrono.com/pl-en/products/furniture-products/melamine-faced-boards/'


def catalog_pdf(page_url=BOARDS_PAGE, title='Płyty laminowane i Blaty kuchenne', fname='swisskrono-katalog.pdf'):
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if args:
        return args[0]
    page = urllib.request.urlopen(urllib.request.Request(page_url, headers=UA), timeout=60).read().decode('utf-8', 'ignore')
    for m in re.finditer(r'href="([^"]*tx_downloadcenter[^"]*)"', page):
        after = re.sub(r'<[^>]+>', ' ', page[m.end():m.end() + 600])
        if title in after:
            url = 'https://www.swisskrono.com' + m.group(1).replace('&amp;', '&')
            path = os.path.join(os.environ.get('TEMP', '.'), fname)
            with open(path, 'wb') as f:
                f.write(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read())
            return path
    raise RuntimeError('nie znalazłem katalogu „%s” na %s' % (title, page_url))


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


def cap(w):
    """„(CARMEN)” → „(Carmen)” — capitalize() zostawiłby małą literę po nawiasie."""
    i = next((k for k, ch in enumerate(w) if ch.isalpha()), 0)
    return w[:i] + w[i:].capitalize()


def nice(name):
    name = name.strip().strip('*').strip()
    return ' '.join(w if w.isupper() and len(w) <= 3 and w in ('II', 'III') else cap(w) for w in name.split()) \
        if name.isupper() else name


# Literówki w samym katalogu PDF SWISS KRONO 2025 (sprawdzone 2026-11-07 z kontekstem strony katalogu):
#   kod błędny → kod właściwy (wpis błędny jest scalany z właściwym i usuwany razem ze zdjęciem)
KOD_LITEROWKA = {
    'D19': 'D1972',     # str. 55: „D19Z72 SE Jabłoń Locarno” = D1972
    'U4428': 'D4428',   # str. 42: „U4428* OV Dąb Naturalny” — U = kolory jednolite, dąb to D4428
    'D3901': 'D3801',   # str. 19: „D3901 CL Dąb Madryt” — seria miast D3798 Londyn / D3799 Paryż / D3801 Madryt
}
#   kod → (nazwa PL, nazwa EN): błędne podpisy w PDF
NAZWA_POPRAWKA = {
    'D3190': ('Wiąz Largo', 'Largo Elm'),               # na części stron podpis „Dąb Odwieczny” (to D1041) nachodzi na próbkę
    'D1861': ('Akacja Księżycowa', 'Moon Acacia'),      # str. 56: literówka „KSĘŻYCOWA”
}


def poprawki(data):
    """Stosuje KOD_LITEROWKA i NAZWA_POPRAWKA do listy dekorów (po każdym pobraniu i po --nazwy)."""
    by = {d['code']: d for d in data}
    for zly, dobry in KOD_LITEROWKA.items():
        if zly in by and dobry in by:
            by[dobry]['products'] = sorted(set(by[dobry].get('products', [])) | set(by[zly].get('products', [])))
            img = os.path.join(OUT_IMG, zly + '.webp')
            if os.path.exists(img):
                os.remove(img)
            data.remove(by.pop(zly))
        elif zly in by:
            by[zly]['code'] = dobry
    for code, (pl, en) in NAZWA_POPRAWKA.items():
        if code in by:
            by[code]['name'], by[code]['name_en'] = pl, en
            by[code]['group'] = group_of(pl)
    return data


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
    poprawki(out)
    out.sort(key=lambda d: (d['group'], d['name']))
    json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GOTOWE — dekorów:', len(out), '| płyty', sum('plyty' in d['products'] for d in out),
          '| blaty', sum('blaty' in d['products'] for d in out))


def backfill_names():
    """name_en z katalogu EN (pod kodem: nazwa PL, pod nią nazwa EN) — po kodzie, tylko pola siatek próbek."""
    pdf = fitz.open(catalog_pdf(BOARDS_PAGE_EN, 'Laminated boards and Worktops', 'swisskrono-katalog-en.pdf'))
    names = {}
    for pno in range(pdf.page_count):
        page = pdf[pno]
        foot = re.sub(r'\s+', '', page.get_text().upper())[-40:]
        if not ('BLATYKUCHENNE' in foot or 'PŁYTYMEBLOWE' in foot) or not tiles(page):
            continue
        ts, ls = tiles(page), lines(page)
        for rect, t in ls:
            m = CODE_RE.match(t)
            c = fitz.Point((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2)
            if not m or not any(r.contains(c) for r in ts):
                continue

            def under(r0, upper=False):
                b = [(r, s) for r, s in ls if 0 <= r.y0 - r0.y1 + 2 <= 8 and r.x0 < r0.x1 and r.x1 > r0.x0
                     and not CODE_RE.match(s) and (not upper or s.isupper())]
                # dwa różne podpisy pod jednym kodem (nakładające się warstwy strony) = niepewne → pomijamy
                return b[0] if len({x[1] for x in b}) == 1 else None
            pl = under(rect)
            if not pl or not pl[1].replace('(', '').replace(')', '').isupper():
                continue                       # podpis zdjęcia wnętrza, nie próbka
            en = under(pl[0], upper=True)     # nazwa EN = jedyna linia WIELKIMI literami pod nazwą PL
            if not en or not en[1].replace('(', '').replace(')', '').isupper() or not re.search('[A-Z]', en[1]) \
                    or en[1].startswith('NCS') or re.match(r'^[\d/ ]', en[1]):
                continue
            names.setdefault(m.group(1), {}).setdefault(nice(pl[1]).upper(), re.sub(r'\.(\w)', lambda x: '. ' + x.group(1).upper(), nice(en[1])))
    data = json.load(open(OUT_JSON, encoding='utf-8'))
    for d in data:
        # tylko gdy nazwa PL nad nazwą EN zgadza się z naszą — pewność, że to podpis tej samej próbki
        en = names.get(d['code'], {}).get(d['name'].upper())
        if en:
            d['name_en'] = en
        else:
            d.pop('name_en', None)
    poprawki(data)
    json.dump(data, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'name_en: {sum(1 for d in data if d.get("name_en"))}/{len(data)}; brak:',
          [d['code'] for d in data if not d.get('name_en')])


if __name__ == '__main__':
    sys.exit(backfill_names() if '--nazwy' in sys.argv else main())
