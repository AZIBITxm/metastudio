"""
Zanders Atelier — przygotowanie zdjęć i filmów dla strony.

Co robi (uruchamiać z katalogu głównego repo:  python narzedzia/przygotuj_media.py):
  1. Realizacje (galeria/<nr>/): z oryginałów robi wersje WebP w 3 szerokościach
     (640 / 1280 / 2048 px dłuższego boku) z poprawionym obrotem z EXIF, miniatury
     (mN.* / vN.*) w WebP, filmy przekompresowane do 720p (H.264, faststart) i plakaty.
     Wynik trafia do galeria/<nr>/web/ — oryginały zostają nietknięte jako źródło.
  2. Z plików opis.txt (pl / en / de) buduje dane/realizacje.json: tytuły, opisy i listę
     mediów w kolejności (zdjęcie N, film N, …) — strona nie musi już zgadywać nazw plików.
  3. Odtwarza kafelki realizacji w index-pl.html i index-de.html (między znacznikami
     <!-- REALIZACJE:START --> i <!-- REALIZACJE:END -->): prawdziwe tytuły, alt-y,
     srcset, width/height, loading="lazy".
  4. Grafiki stałe (baner, tła, logo, materiały, konsultant) -> WebP w podkatalogach web/.

Pliki już przerobione (nowsze od oryginału) są pomijane, więc skrypt można uruchamiać
po każdym dodaniu realizacji.  Nowa realizacja = nowy folder galeria/<nr>/ z plikami
1.jpg (okładka), 2.jpg…, miniaturami m1.jpg…, opcjonalnie filmami N.mp4 + vN.png, opis.txt.
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

WIDTHS = [640, 1280, 2048]          # dłuższy bok wersji zdjęć
IMG_EXT = ('.jpg', '.jpeg', '.png', '.webp')
VID_EXT = ('.mp4', '.mov', '.webm')
LANGS = ('pl', 'en', 'de')


def ffmpeg_bin(name):
    found = shutil.which(name)
    if found:
        return found
    base = os.path.expandvars(r'%LOCALAPPDATA%\Microsoft\WinGet\Packages')
    for dirpath, _, files in os.walk(base):
        if name + '.exe' in files:
            return os.path.join(dirpath, name + '.exe')
    sys.exit(f'Brak {name} — zainstaluj: winget install Gyan.FFmpeg')


def fresh(src, dst):
    return os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)


def open_upright(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)      # zdjęcia z telefonu mają obrót w EXIF
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    return im


def save_webp(im, dst, quality=80):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'WEBP', quality=quality, method=6)


def resized(im, long_edge):
    w, h = im.size
    if max(w, h) <= long_edge:
        return im
    s = long_edge / max(w, h)
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS)


def image_variants(src, out_dir, stem):
    """Zwraca listę [{w,h,src}] wersji zdjęcia (bez duplikatów, gdy oryginał jest mały)."""
    im = None
    out, seen = [], set()
    for L in WIDTHS:
        dst = os.path.join(out_dir, f'{stem}-{L}.webp')
        if not fresh(src, dst):
            if im is None:
                im = open_upright(src)
            r = resized(im, L)
            if r.size in seen:
                continue
            save_webp(r, dst, 82 if L <= 640 else 80)
        with Image.open(dst) as done:
            size = done.size
        if size in seen:
            os.remove(dst)
            continue
        seen.add(size)
        out.append({'w': size[0], 'h': size[1], 'src': dst.replace(os.sep, '/')})
    return out


def find(folder, stem, exts):
    for f in os.listdir(folder):
        b, e = os.path.splitext(f)
        if b == stem and e.lower() in exts:
            return os.path.join(folder, f)
    return None


def thumb(src, dst):
    if not fresh(src, dst):
        save_webp(open_upright(src), dst, 85)
    return dst.replace(os.sep, '/')


def probe(path):
    r = subprocess.run([FFPROBE, '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                        'stream=width,height:stream_side_data=rotation', '-of', 'json', path],
                       capture_output=True, text=True)
    st = json.loads(r.stdout)['streams'][0]
    w, h = st['width'], st['height']
    rot = 0
    for sd in st.get('side_data_list', []) or []:
        rot = int(sd.get('rotation', 0) or 0)
    if abs(rot) == 90:
        w, h = h, w
    return w, h


def video(src, out_dir, stem):
    dst = os.path.join(out_dir, f'{stem}.mp4')
    poster = os.path.join(out_dir, f'{stem}-poster.webp')
    if not fresh(src, dst):
        os.makedirs(out_dir, exist_ok=True)
        print('  film', src, '->', dst, flush=True)
        # krótszy bok max 720 px, bez powiększania; dźwięk zostaje (AAC 96k)
        vf = "scale='if(gt(iw,ih),-2,min(720,iw))':'if(gt(iw,ih),min(720,ih),-2)'"
        subprocess.run([FFMPEG, '-y', '-v', 'error', '-i', src, '-vf', vf, '-c:v', 'libx264',
                        '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
                        '-b:a', '96k', '-movflags', '+faststart', dst], check=True)
    if not fresh(dst, poster):
        tmp = os.path.join(out_dir, f'{stem}-poster.png')
        subprocess.run([FFMPEG, '-y', '-v', 'error', '-ss', '0.5', '-i', dst, '-frames:v', '1', tmp],
                       check=True)
        save_webp(open_upright(tmp), poster, 80)
        os.remove(tmp)
    w, h = probe(dst)
    return dst.replace(os.sep, '/'), poster.replace(os.sep, '/'), w, h


# ---------------------------------------------------------------- opis.txt

HEADER = re.compile(r'^\s*(pl|en|de)\b[^:]{0,40}$', re.I)
SEPARATOR = re.compile(r'^\s*(-{3,}|_{3,})\s*$')


def parse_opis(path):
    """{'pl': (tytuł, opis), ...} — nagłówki typu 'de (poprawione tłumaczenie)' też łapie."""
    if not path:
        return {}
    with open(path, encoding='utf-8-sig') as f:
        lines = f.read().replace('\r\n', '\n').split('\n')
    sections, cur = {}, None
    for line in lines:
        m = HEADER.match(line)
        if m and len(line.strip()) <= 45:
            cur = m.group(1).lower()
            sections[cur] = []
            continue
        if cur and not SEPARATOR.match(line):
            sections[cur].append(line.rstrip())
    out = {}
    for lang, body in sections.items():
        text = '\n'.join(body).strip()
        title = next((l.strip() for l in body if l.strip() and ':' not in l), '')
        if text:
            out[lang] = {'title': title, 'text': text}
    return out


# ---------------------------------------------------------------- realizacje

def build_gallery(nr):
    folder = os.path.join('galeria', str(nr))
    web = os.path.join(folder, 'web')
    files = os.listdir(folder)
    nums = set()
    for f in files:
        m = re.fullmatch(r'([mv]?)(\d+)\.(\w+)', f, re.I)
        if m:
            nums.add(int(m.group(2)))
    media = []
    for n in sorted(nums):
        full = find(folder, str(n), IMG_EXT)
        mth = find(folder, f'm{n}', IMG_EXT)
        vid = find(folder, str(n), VID_EXT)
        vth = find(folder, f'v{n}', IMG_EXT)
        # zdjęcie pokazywane w oknie realizacji, gdy ma miniaturę mN (tak działała stara galeria)
        if full and mth:
            media.append({'type': 'image', 'n': n,
                          'thumb': thumb(mth, os.path.join(web, f'm{n}.webp')),
                          'sizes': image_variants(full, web, str(n))})
        if vid and vth:
            src, poster, w, h = video(vid, web, str(n))
            media.append({'type': 'video', 'n': n, 'thumb': thumb(vth, os.path.join(web, f'v{n}.webp')),
                          'src': src, 'poster': poster, 'w': w, 'h': h})
    cover_src = find(folder, '1', IMG_EXT)
    cover = image_variants(cover_src, web, '1') if cover_src else []
    opis_path = find(folder, 'opis', ('.txt',)) or find(folder, 'OPIS', ('.txt',))
    opis = parse_opis(opis_path)
    return {'id': str(nr), 'cover': cover, 'opis': opis, 'media': media}


def tiles_html(items, lang):
    cta = {'pl': 'SPRAWDŹ ', 'de': 'ANSEHEN '}[lang]
    out = []
    for i, it in enumerate(items):
        o = it['opis'].get(lang) or it['opis'].get('en') or it['opis'].get('pl') or {}
        title = html.escape(o.get('title') or 'Realizacja')
        cov = it['cover']
        main = i < 4
        cls = 'main-gallery-item' if main else 'extended-gallery-item'
        style = '' if main else ' style="display: none;"'
        srcset = ', '.join(f"{c['src']} {c['w']}w" for c in cov)
        mid = cov[min(1, len(cov) - 1)]
        out.append(
            f'        <div class="gallery-item {cls}" data-gallery="{it["id"]}"{style}>\n'
            f'            <img src="{mid["src"]}" srcset="{srcset}" sizes="(max-width: 768px) 100vw, 33vw"'
            f' width="{mid["w"]}" height="{mid["h"]}" loading="lazy" decoding="async" alt="{title}" />\n'
            f'            <div class="gallery-item-info">\n'
            f'                <h3>{title}</h3>\n'
            f'                <div class="gallery-cta">\n'
            f'                    <span class="cta-text">{cta}</span>\n'
            f'                    <span class="cta-icon">→</span>\n'
            f'                </div>\n'
            f'            </div>\n'
            f'        </div>')
    return '\n'.join(out)


def inject_tiles(items):
    for page, lang in (('index-pl.html', 'pl'), ('index-de.html', 'de')):
        with open(page, encoding='utf-8') as f:
            s = f.read()
        start, end = '<!-- REALIZACJE:START -->', '<!-- REALIZACJE:END -->'
        if start not in s:
            print(f'  {page}: brak znaczników {start}/{end} — kafelków nie ruszam')
            continue
        a = s.index(start) + len(start)
        b = s.index(end)
        s = s[:a] + '\n' + tiles_html(items, lang) + '\n        ' + s[b:]
        with open(page, 'w', encoding='utf-8', newline='\n') as f:
            f.write(s)
        print(f'  {page}: kafelki odtworzone ({len(items)})')


# ---------------------------------------------------------------- grafiki stałe

STATIC = [
    # (źródło, [dłuższe boki]) — None = rozmiar oryginalny
    ('tlo/baner1.png', [1280, 1920, 2880]),
    ('tlo/banerm.png', [None]),
    ('tlo/baner22.jpg', [None]),
    ('tlo/baner24.jpg', [None]),
    ('tlo/pasek.png', [None]),
    ('logo/logo2.png', [300]),
    ('logo/fundacja/logo2.png', [None]),
    ('multimedia/konsultant.png', [240]),
    ('materiały/fronty/płyty.png', [800]),
    ('materiały/fronty/fronty.png', [800]),
    ('materiały/fronty/blaty.png', [800]),
]


def build_static():
    for src, sizes in STATIC:
        d, f = os.path.split(src)
        stem = os.path.splitext(f)[0]
        for L in sizes:
            dst = os.path.join(d, 'web', f'{stem}.webp' if L is None else f'{stem}-{L}.webp')
            if fresh(src, dst):
                continue
            im = open_upright(src)
            if L:
                im = resized(im, L)
            save_webp(im, dst, 82)
            print('  ', dst, im.size, os.path.getsize(dst) // 1024, 'KB')


if __name__ == '__main__':
    FFMPEG, FFPROBE = ffmpeg_bin('ffmpeg'), ffmpeg_bin('ffprobe')
    print('Grafiki stałe…')
    build_static()
    ids = sorted((int(d) for d in os.listdir('galeria') if d.isdigit()))
    items = []
    for nr in ids:
        print(f'Realizacja {nr}…', flush=True)
        items.append(build_gallery(nr))
    os.makedirs('dane', exist_ok=True)
    with open('dane/realizacje.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump({'realizacje': items}, f, ensure_ascii=False, indent=1)
    print('dane/realizacje.json zapisany')
    inject_tiles(items)
