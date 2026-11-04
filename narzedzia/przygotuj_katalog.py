"""
Zanders Atelier — katalog odmian materiałów (zdjęcia pod opisami w „Kategorie materiałów”).

Uruchamiać z katalogu głównego repo:  python narzedzia/przygotuj_katalog.py

Źródło prawdy: dane/katalog-zrodla.json — lista zdjęć (materiał, odmiana, podpis PL/DE/EN,
autor, licencja, strona źródłowa, adres pobrania). Zdjęcia pochodzą z Wikimedia Commons
(wolne licencje CC/PD) i Unsplash (Unsplash License) — oba pozwalają na użytek komercyjny;
przy CC BY / CC BY-SA trzeba podać autora i licencję — robi to podpis w powiększeniu.

Co robi:
  1. Pobiera brakujące zdjęcia i zapisuje materiały/katalog/<slug>-480.webp (miniatura 4:3)
     oraz <slug>-1600.webp (powiększenie). Pliki już istniejące są pomijane.
     Własne zdjęcie zamiast pobranego: wrzuć plik materiały/katalog/zrodla/<slug>.jpg
     (albo .png/.webp) — ma pierwszeństwo przed adresem z JSON-a; w JSON-ie zmień
     "source" na "Zanders Atelier", wtedy podpis nie pokazuje cudzego autora.
  2. Wstawia galerię odmian do index-pl.html, index-de.html, index-en.html na końcu bloku
     <div class="material-info" id="<materiał>-info"> (między znacznikami
     <!-- KATALOG:<materiał>:START --> i <!-- KATALOG:<materiał>:END -->).
     Ponowne uruchomienie podmienia galerie — można dowolnie zmieniać JSON i odpalać znowu.
  3. Z dane/producenci.json wstawia blok „Producenci i katalogi” (karty producentów z linkami do
     katalogów PDF / kolekcji na stronach producentów) na końcu bloku danego materiału
     (znaczniki <!-- PRODUCENCI:<materiał>:START/END -->). Decyzja Adama 2026-11-04: przy płytach
     laminowanych i frontach akrylowych producenci ZASTĘPUJĄ galerię zdjęć poglądowych.
"""
import html
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SRC = os.path.join('dane', 'katalog-zrodla.json')
PROD = os.path.join('dane', 'producenci.json')
OUT = os.path.join('materiały', 'katalog')
OWN = os.path.join(OUT, 'zrodla')
UA = {'User-Agent': 'ZandersAtelierMaterialCatalog/1.0 (zandersatelier.com)'}
THUMB = (480, 360)
BIG = 1600

PAGES = {'pl': 'index-pl.html', 'de': 'index-de.html', 'en': 'index-en.html'}
TXT = {
    'pl': {'title': 'Odmiany — zdjęcia', 'note': 'Zdjęcia poglądowe — kliknij, aby powiększyć (autor i licencja w podpisie).',
           'photo': 'Fot.'},
    'de': {'title': 'Varianten — Fotos', 'note': 'Beispielfotos — zum Vergrößern anklicken (Fotograf und Lizenz in der Bildunterschrift).',
           'photo': 'Foto:'},
    'en': {'title': 'Variants — photos', 'note': 'Example photos — click to enlarge (photographer and licence in the caption).',
           'photo': 'Photo:'},
}


def clean_author(a):
    a = (a or '').split('\n')[0].strip()
    a = re.sub(r'^-+', '', a).strip()
    m = re.search(r'\b(\w+ R) at de\.wikipedia', a)
    if m:
        a = m.group(1)
    a = re.sub(r'\s*\d{1,2}:\d{2},.*$', '', a)          # podpis z datą z Wikipedii
    a = a.replace('~', '').strip(' .-')
    return a or 'Wikimedia Commons'


def load_source(item):
    for ext in ('.jpg', '.jpeg', '.png', '.webp'):
        p = os.path.join(OWN, item['slug'] + ext)
        if os.path.exists(p):
            return Image.open(p)
    for attempt in range(6):
        try:
            req = urllib.request.Request(item['download'], headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            time.sleep(1.5)                      # Wikimedia ogranicza tempo pobierania
            return Image.open(io.BytesIO(data))
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 5:
                raise
            time.sleep(20 * (attempt + 1))


def make_images(item):
    t_path = os.path.join(OUT, f"{item['slug']}-480.webp")
    b_path = os.path.join(OUT, f"{item['slug']}-1600.webp")
    if not (os.path.exists(t_path) and os.path.exists(b_path)):
        im = ImageOps.exif_transpose(load_source(item)).convert('RGB')
        big = im.copy()
        big.thumbnail((BIG, BIG), Image.LANCZOS)
        big.save(b_path, 'WEBP', quality=80, method=6)
        ImageOps.fit(im, THUMB, Image.LANCZOS).save(t_path, 'WEBP', quality=78, method=6)
        print('  zapisano', item['slug'])
    with Image.open(b_path) as b:
        return b.size


def credit(item, lang):
    t = TXT[lang]
    if item['source'] == 'Zanders Atelier':
        return '', ''
    author = clean_author(item['author']) if item['source'] != 'Unsplash' else item['author']
    if not author or author == item['source']:          # brak autora w metadanych — sam serwis i licencja
        text = f"{t['photo']} {item['source']} · {item['license']}"
    else:
        text = f"{t['photo']} {author} · {item['source']} · {item['license']}"
    return text, item['page']


def gallery_html(mat, items, lang):
    t = TXT[lang]
    out = [f'<!-- KATALOG:{mat}:START -->',
           '<div class="material-gallery">',
           f'    <h4 class="material-gallery-title">{t["title"]}</h4>',
           '    <div class="material-gallery-track">']
    for it in items:
        name = html.escape(it[lang])
        ctext, curl = credit(it, lang)
        out.append(
            f'        <a class="material-swatch" href="materiały/katalog/{it["slug"]}-1600.webp" '
            f'data-w="{it["_w"]}" data-h="{it["_h"]}" data-name="{name}" '
            f'data-credit="{html.escape(ctext)}" data-credit-url="{html.escape(curl)}">'
            f'<img src="materiały/katalog/{it["slug"]}-480.webp" width="{THUMB[0]}" height="{THUMB[1]}" '
            f'loading="lazy" decoding="async" alt="{name}"><span class="material-swatch-name">{name}</span></a>')
    out += ['    </div>', f'    <p class="material-gallery-note">{t["note"]}</p>', '</div>',
            f'<!-- KATALOG:{mat}:END -->']
    return '\n'.join(out)


LINK_TXT = {
    'page': {'pl': 'Kolekcja na stronie producenta', 'de': 'Kollektion beim Hersteller', 'en': "Collection on manufacturer's site"},
    'pdf': {'pl': 'Katalog PDF', 'de': 'Katalog (PDF)', 'en': 'Catalogue (PDF)'},
    'sampler': {'pl': 'Wzornik kolorów', 'de': 'Farbmuster', 'en': 'Colour chart'},
    'downloads': {'pl': 'Katalogi do pobrania', 'de': 'Downloads', 'en': 'Downloads'},
}
PROD_TXT = {
    'pl': {'title': 'Producenci i katalogi', 'note': 'Linki prowadzą do oficjalnych stron producentów (otwierają się w nowej karcie).'},
    'de': {'title': 'Hersteller und Kataloge', 'note': 'Die Links führen zu den offiziellen Herstellerseiten (öffnen in neuem Tab).'},
    'en': {'title': 'Manufacturers and catalogues', 'note': "Links lead to the manufacturers' official websites (open in a new tab)."},
}


# Przycisk do pełnego katalogu dekorów (katalog-materialow.html) — na razie tylko wersja PL
CATALOG_LINK = {
    'plyty-laminowane': {'pl': ('katalog-materialow.html', 'Przeglądaj wszystkie dekory w naszym katalogu →')},
}


def producers_html(mat, producers, lang):
    t = PROD_TXT[lang]
    out = [f'<!-- PRODUCENCI:{mat}:START -->',
           '<div class="material-producers">',
           f'    <h4 class="material-producers-title">{t["title"]}</h4>',
           '    <div class="material-producers-grid">']
    for pr in producers:
        out.append('        <div class="producer-card">')
        if pr.get('logo'):
            out.append(f'            <img class="producer-logo" src="{pr["logo"]}" alt="{html.escape(pr["name"])} logo" loading="lazy">')
        out.append(f'            <h5 class="producer-name">{html.escape(pr["name"])}</h5>')
        out.append(f'            <p class="producer-desc">{html.escape(pr["desc"][lang])}</p>')
        out.append('            <div class="producer-links">')
        for ln in pr['links']:
            url = ln.get('url_en', ln['url']) if lang != 'pl' else ln['url']
            cls = 'producer-link producer-link--pdf' if ln['type'] == 'pdf' else 'producer-link'
            out.append(f'                <a class="{cls}" href="{html.escape(url)}" target="_blank" rel="noopener">'
                       f'{LINK_TXT[ln["type"]][lang]}</a>')
        out.append('            </div>')
        out.append('        </div>')
    out.append('    </div>')
    link = CATALOG_LINK.get(mat, {}).get(lang)
    if link:
        out.append(f'    <a class="material-catalog-link" href="{link[0]}">{link[1]}</a>')
    out += [f'    <p class="material-gallery-note">{t["note"]}</p>', '</div>',
            f'<!-- PRODUCENCI:{mat}:END -->']
    return '\n'.join(out)


def find_block_end(doc, start):
    """Indeks zamykającego </div> dla <div ...> zaczynającego się w `start`."""
    depth = 0
    for m in re.compile(r'<div\b|</div>').finditer(doc, start):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0:
            return m.start()
    raise ValueError('niezamknięty div')


def strip_generated(doc):
    """Usuwa wszystkie wcześniej wygenerowane bloki (galerie i producentów) — potem wstawiamy od nowa."""
    return re.sub(r'\n?[ \t]*<!-- (KATALOG|PRODUCENCI):([\w-]+):START -->.*?<!-- \1:\2:END -->', '', doc, flags=re.S)


def inject(doc, mat, block):
    m = re.search(rf'<div class="material-info" id="{re.escape(mat)}-info"', doc)
    if not m:
        print('  BRAK bloku', mat)
        return doc
    end = find_block_end(doc, m.start())
    indent = '                '
    block = '\n'.join(indent + ln for ln in block.split('\n'))
    return doc[:end].rstrip() + '\n' + block + '\n            ' + doc[end:]


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(OWN, exist_ok=True)
    items = json.load(open(SRC, encoding='utf-8'))
    for it in items:
        try:
            it['_w'], it['_h'] = make_images(it)
        except Exception as e:
            sys.exit(f"Błąd przy {it['slug']}: {e}")
    producers = {k: v for k, v in json.load(open(PROD, encoding='utf-8')).items() if not k.startswith('_')}
    groups = {}
    for it in items:
        groups.setdefault(it['material'], []).append(it)
    for lang, page in PAGES.items():
        raw = open(page, 'rb').read()
        nl = chr(13) + chr(10) if bytes([13, 10]) in raw else chr(10)
        doc = raw.decode('utf-8').replace(chr(13) + chr(10), chr(10))
        doc = strip_generated(doc)
        for mat, its in groups.items():
            doc = inject(doc, mat, gallery_html(mat, its, lang))
        for mat, prods in producers.items():
            doc = inject(doc, mat, producers_html(mat, prods, lang))
        open(page, 'w', encoding='utf-8', newline=nl).write(doc)   # zachowaj końce linii pliku (CRLF)
        print(page, 'galerie:', len(groups), 'producenci:', len(producers))


if __name__ == '__main__':
    main()
