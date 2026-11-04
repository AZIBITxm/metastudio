"""
Zanders Atelier — pobranie dekorów EGGER do własnego katalogu materiałów.

Uruchamiać z katalogu głównego repo:  python narzedzia/pobierz_dekory_egger.py

Źródło: publiczne strony dekorów EGGER (mapa strony https://www.egger.com/sitemap/s/pimedp-0.xml,
wersja polska /pl/meble-i-aranzacja-wnetrz/dekory/...). Na każdej stronie EGGER udostępnia
grafikę dekoru do pobrania bez logowania („Pobierz grafiki dekorów”, anonymous=true).
Pobieramy: kod dekoru, kod struktury, nazwę PL, link do strony dekoru u producenta i grafikę dekoru.

Wynik:
  dane/dekory/egger.json            — lista dekorów (do strony katalogu i bazy wiedzy konsultanta)
  materiały/dekory/egger/<KOD>.webp — próbka dekoru 600 px (kwadrat)
Uzupełnienie samego pola products:  python narzedzia/pobierz_dekory_egger.py --products
Pobieranie jest grzeczne (przerwa między zapytaniami); już pobrane grafiki są pomijane.
"""
import html
import io
import json
import os
import re
import sys
import time
import urllib.request

from PIL import Image, ImageOps, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
UA = {'User-Agent': 'ZandersAtelierMaterialCatalog/1.0 (furniture workshop zandersatelier.com)'}
OUT_JSON = os.path.join('dane', 'dekory', 'egger.json')
OUT_IMG = os.path.join('materiały', 'dekory', 'egger')
SIZE = 600
PAUSE = 1.0

# Grupa wg litery kodu EGGER
GROUPS = {'H': 'drewno', 'Q': 'drewno', 'F': 'kamien-materialy', 'U': 'kolory', 'W': 'kolory'}

# W czym dekor jest dostępny (linki producttype=PG_… na stronie dekoru) → nasze klucze
PRODUCTS = {
    'PG_MELAMINFACEDBOARDS': 'plyty', 'PG_WORKTOPS': 'blaty', 'PG_EDGING': 'obrzeza',
    'PG_LAMINATES': 'laminaty', 'PG_COMPACTLAMINATE': 'kompakt', 'PG_SPLASHBACK': 'panele-wnekowe',
    'PG_WORKTOPACESSORIES': 'akcesoria-blatow',
}


def products_of(page_html):
    """Lista form, w jakich EGGER oferuje dekor. Nieznane kody PG_ zapisujemy małymi literami,
    żeby nic nie zginęło (np. przyszłe nowe produkty)."""
    found = []
    for pg, title in re.findall(r'producttype=(PG_[A-Z_]+)"[^>]*title="([^"]+)"', page_html):
        key = PRODUCTS.get(pg)
        if not key:
            t = html.unescape(title).lower()
            key = 'blaty' if t.startswith('blaty') else 'akcesoria-blatow' if 'blat' in t else 'panele-wnekowe' if 'wnęk' in t else pg[3:].lower()
        if key not in found:
            found.append(key)
    return found


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


def decor_urls():
    xml = get('https://www.egger.com/sitemap/s/pimedp-0.xml')
    urls = re.findall(r'<loc>([^<]+)', xml)
    return [u for u in urls if '/pl/meble-i-aranzacja-wnetrz/dekory/' in u]


def parse(page_html, url):
    title = re.search(r'<title>([^<]*)</title>', page_html)
    title = html.unescape(title.group(1)).strip() if title else ''
    m = re.match(r'([A-Z]\d+)\s+(\S+)\s+(.+)', title)          # "U646 ST9 Zieleń Niagara"
    if not m:
        return None
    code, structure, name = m.groups()
    thumb = None
    i = page_html.find('"code": "%s %s"' % (code, structure))
    blk = page_html[i:i + 4000] if i >= 0 else ''
    t = re.search(r'"thumbUrl":.*?"url": "(https://cdn\.egger\.com/img/pim/\d+/\d+)/', blk, re.S)
    if t:
        thumb = t.group(1)
    if not thumb:
        return None
    return {
        'producer': 'EGGER', 'code': code, 'structure': structure, 'name': name,
        'group': GROUPS.get(code[0], 'inne'),
        'products': products_of(page_html),
        'url': url.split('?')[0],
        'image_src': thumb + '/AR_4_3.webp?width=%d&srcext=png' % (SIZE * 2),
    }


def trim_white(im, thr=243):
    """Obcina jasny margines z krawędzi grafiki producenta (część plików EGGER go ma).
    Liczy średnią jasność całych wierszy/kolumn — odporne na pojedyncze piksele z kompresji."""
    g = im.convert('L')
    w, h = g.size
    rows = [ImageStat.Stat(g.crop((0, y, w, y + 1))).mean[0] for y in range(h)]
    cols = [ImageStat.Stat(g.crop((x, 0, x + 1, h))).mean[0] for x in range(w)]
    t = next((i for i, v in enumerate(rows) if v < thr), 0)
    b = h - next((i for i, v in enumerate(reversed(rows)) if v < thr), 0)
    l = next((i for i, v in enumerate(cols) if v < thr), 0)
    r = w - next((i for i, v in enumerate(reversed(cols)) if v < thr), 0)
    if (r - l) > w * 0.6 and (b - t) > h * 0.6:
        return im.crop((l, t, r, b))
    return im


def tile_strip(im, thr=243):
    """Obrzeża/akcenty EGGER pokazuje jako wąski pasek przez środek pustej planszy —
    wycinamy pasek i powielamy go w pionie na cały kwadrat (próbka pokazuje fakturę)."""
    g = im.convert('L')
    w, h = g.size
    rows = [ImageStat.Stat(g.crop((0, y, w, y + 1))).mean[0] for y in range(h)]
    dark = [y for y, v in enumerate(rows) if v < thr]
    if not dark:
        return im
    t, b = dark[0], dark[-1] + 1
    if not (t > 20 and (h - b) > 20 and (b - t) < h * 0.6):
        return im
    cols = [ImageStat.Stat(g.crop((x, t, x + 1, b))).mean[0] for x in range(w)]
    dc = [x for x, v in enumerate(cols) if v < thr]
    l, r = (dc[0], dc[-1] + 1) if dc else (0, w)
    band = im.crop((l + 2, t + 2, r - 2, b - 2)).resize((SIZE, max(1, b - t - 4)))
    out = Image.new('RGB', (SIZE, SIZE))
    y = 0
    while y < SIZE:
        out.paste(band, (0, y))
        y += band.height
    return out


def save_image(d):
    path = os.path.join(OUT_IMG, d['code'] + '.webp')
    if not os.path.exists(path):
        im = trim_white(Image.open(io.BytesIO(get(d['image_src'], binary=True))).convert('RGB'))
        tile_strip(ImageOps.fit(im, (SIZE, SIZE), Image.LANCZOS)).save(path, 'WEBP', quality=80, method=6)
    d['image'] = 'materiały/dekory/egger/' + d['code'] + '.webp'


def main():
    os.makedirs(OUT_IMG, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    urls = decor_urls()
    print('stron dekorów (PL):', len(urls))
    seen, out = set(), []
    for n, u in enumerate(urls, 1):
        code_guess = u.split('/dekory/')[1].split('?')[0].split('_')[0]
        if code_guess in seen:
            continue
        try:
            d = parse(get(u), u)
        except Exception as e:
            print('  błąd', u, e)
            continue
        if not d or d['code'] in seen:
            continue
        seen.add(d['code'])
        try:
            save_image(d)
        except Exception as e:
            print('  błąd grafiki', d['code'], e)
            continue
        out.append(d)
        if n % 25 == 0:
            print(f'  {n}/{len(urls)} — zebrano {len(out)}')
            json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    out.sort(key=lambda d: (d['group'], d['name']))
    json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GOTOWE — dekorów:', len(out))


def backfill_products():
    """Uzupełnia pole products w istniejącym egger.json (bez ponownego pobierania grafik)."""
    data = json.load(open(OUT_JSON, encoding='utf-8'))
    for n, d in enumerate(data, 1):
        try:
            d['products'] = products_of(get(d['url']))
        except Exception as e:
            print('  błąd', d['code'], e)
        if n % 50 == 0:
            print(f'  {n}/{len(data)}')
    json.dump(data, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('GOTOWE — uzupełniono', len(data))


if __name__ == '__main__':
    sys.exit(backfill_products() if '--products' in sys.argv else main())
