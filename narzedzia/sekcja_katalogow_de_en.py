"""
Zanders Atelier — sekcja „Katalog Materiałów / Katalog Akcesoriów” na stronach index-de.html i index-en.html.

Uruchamiać z katalogu głównego repo:  python narzedzia/sekcja_katalogow_de_en.py
(po każdej zmianie sekcji #project w index-pl.html, opisów materiałów albo grup akcesoriów).

Wzorem jest sekcja <section id="project"> z index-pl.html (kafelki 3D, przełącznik, opisy). Skrypt podmienia w niej:
  - napisy interfejsu (tytuły katalogów, „przełącz”, „Otwórz katalog →”, strzałki, aria-label),
  - kafelki materiałów: nazwy i podpisy (jak w katalogu), opisy pod spodem = dane/opisy-materialow-<lang>.json,
  - kafelki akcesoriów: nazwy grup i opisy = dane/akcesoria-<lang>.json, liczba rozwiązań w danym języku,
  - linki do katalog-materialow-<lang>.html / katalog-akcesoriow-<lang>.html,
i wstawia gotową sekcję w miejsce <section id="project"> w index-de.html / index-en.html.
Pozycja menu #project dostaje nazwę katalogu.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

UI = {
    'de': {
        'mat': 'Materialkatalog', 'acc': 'Zubehörkatalog', 'hint': 'wechseln', 'switch_to': 'Wechseln zu', 'open': 'Katalog öffnen →',
        'swipe_mat': 'Materialkatalog — wischen, um zu wählen', 'swipe_acc': 'Zubehörkatalog — wischen, um zu wählen',
        'prev': 'Zurück', 'next': 'Weiter', 'menu': 'Materialkatalog',
        'cards': {'plyty': ('Melaminbeschichtete Platten', 'Korpusse, Fronten, Einbauten'),
                  'fronty': ('Möbelfronten', 'Acryl, lackiert, furniert und mehr'),
                  'blaty': ('Arbeitsplatten', 'Küchen, Schreibtische, Bäder')},
        'n': lambda n: f'{n} {"Lösung" if n == 1 else "Lösungen"}',
    },
    'en': {
        'mat': 'Materials Catalogue', 'acc': 'Accessories Catalogue', 'hint': 'switch', 'switch_to': 'Switch to', 'open': 'Open catalogue →',
        'swipe_mat': 'Materials catalogue — swipe to choose', 'swipe_acc': 'Accessories catalogue — swipe to choose',
        'prev': 'Previous', 'next': 'Next', 'menu': 'Materials Catalogue',
        'cards': {'plyty': ('Laminated boards', 'carcasses, fronts, built-ins'),
                  'fronty': ('Furniture fronts', 'acrylic, lacquered, veneered and more'),
                  'blaty': ('Worktops', 'kitchens, desks, bathrooms')},
        'n': lambda n: f'{n} {"solution" if n == 1 else "solutions"}',
    },
}
PL = {'mat': 'Katalog Materiałów', 'acc': 'Katalog Akcesoriów'}


def section(doc):
    s = doc.index('<section id="project">')
    e = doc.index('</section>', s) + len('</section>')
    return s, e


def sub1(s, a, b, count=None):
    n = s.count(a)
    if not n or (count is not None and n != count):
        raise SystemExit(f'nie znaleziono (lub zła liczba {n}): {a[:80]}')
    return s.replace(a, b)


def build(lang, pl_sec):
    t = UI[lang]
    opisy = json.load(open(f'dane/opisy-materialow-{lang}.json', encoding='utf-8'))
    tr = json.load(open(f'dane/akcesoria-{lang}.json', encoding='utf-8'))
    s = pl_sec
    # tytuły i przełącznik
    s = sub1(s, f'<span class="cat-title-txt">{PL["mat"]}</span>', f'<span class="cat-title-txt">{t["mat"]}</span>')
    s = sub1(s, f'aria-label="Przełącz na: {PL["acc"]}"', f'aria-label="{t["switch_to"]}: {t["acc"]}"')
    s = sub1(s, f'<span class="cat-switch-label">{PL["acc"]}</span>', f'<span class="cat-switch-label">{t["acc"]}</span>')
    s = sub1(s, '<span class="cat-switch-hint">przełącz</span>', f'<span class="cat-switch-hint">{t["hint"]}</span>')
    s = sub1(s, f'data-title="{PL["mat"]}"', f'data-title="{t["mat"]}"')
    s = sub1(s, f'data-title="{PL["acc"]}"', f'data-title="{t["acc"]}"')
    s = sub1(s, 'aria-label="Katalog materiałów — przesuń, aby wybrać"', f'aria-label="{t["swipe_mat"]}"')
    s = sub1(s, 'aria-label="Katalog akcesoriów — przesuń, aby wybrać"', f'aria-label="{t["swipe_acc"]}"')
    s = sub1(s, 'aria-label="Poprzedni"', f'aria-label="{t["prev"]}"')
    s = sub1(s, 'aria-label="Następny"', f'aria-label="{t["next"]}"')
    s = sub1(s, '<span class="mat-card-go">Otwórz katalog →</span>', f'<span class="mat-card-go">{t["open"]}</span>')
    s = sub1(s, 'href="katalog-materialow.html?', f'href="katalog-materialow-{lang}.html?')
    s = sub1(s, 'href="katalog-akcesoriow.html?', f'href="katalog-akcesoriow-{lang}.html?')

    # kafelki materiałów: nazwa, alt, podpis
    def mat_card(m):
        typ = m.group(1)
        name, hint = t['cards'][typ]
        c = m.group(0)
        c = re.sub(r'alt="[^"]*"', f'alt="{name}"', c, count=1)
        c = re.sub(r'<span class="mat-card-name">[^<]*</span>', f'<span class="mat-card-name">{name}</span>', c)
        c = re.sub(r'<span class="mat-card-hint">[^<]*</span>', f'<span class="mat-card-hint">{hint}</span>', c)
        return c
    s = re.sub(rf'<a class="mat-card" href="katalog-materialow-{lang}\.html\?typ=(\w+)".*?</a>', mat_card, s, flags=re.S)

    # kafelki akcesoriów
    def acc_card(m):
        kat = m.group(1)
        name = tr['kategorie'][kat][0]
        c = m.group(0)
        n = int(re.search(r'<span class="mat-card-hint">(\d+)', c).group(1))
        c = re.sub(r'alt="[^"]*"', f'alt="{name}"', c, count=1)
        c = re.sub(r'<span class="mat-card-name">[^<]*</span>', f'<span class="mat-card-name">{name}</span>', c)
        c = re.sub(r'<span class="mat-card-hint">[^<]*</span>', f'<span class="mat-card-hint">{t["n"](n)}</span>', c)
        return c
    s = re.sub(rf'<a class="mat-card[^"]*" href="katalog-akcesoriow-{lang}\.html\?kat=([\w-]+)".*?</a>', acc_card, s, flags=re.S)

    # opisy pod kafelkami
    def desc(m):
        did = m.group(1)
        if did.startswith('akc-'):
            name, text = tr['kategorie'][did[4:]]
            body = f'<p>{text}</p>'
        else:
            op = opisy[did]
            name = op['title']
            body = re.sub(r'^<div class="material-content">\s*|\s*</div>$', '', op['html'].strip())
        return f'<div class="mat-desc" id="{did}-opis">\n                    <h3>{name}</h3>\n                    {body}\n                </div>'
    s = re.sub(r'<div class="mat-desc" id="([\w-]+)-opis">.*?</div>', desc, s, flags=re.S)

    left = re.findall(r'[ąęłśżźćńĄĘŁŚŻŹĆŃ]', re.sub(r'(src|href)="[^"]*"', '', s))
    if left:
        raise SystemExit(f'{lang}: w sekcji zostały polskie znaki: {"".join(left)[:40]}')
    return s


def main():
    pl = open('index-pl.html', encoding='utf-8').read()
    ps, pe = section(pl)
    pl_sec = pl[ps:pe]
    for lang in ('de', 'en'):
        path = f'index-{lang}.html'
        doc = open(path, encoding='utf-8').read()
        s, e = section(doc)
        doc = doc[:s] + build(lang, pl_sec) + doc[e:]
        doc = re.sub(r'(<a href="#project">)[^<]*(</a>)', rf'\g<1>{UI[lang]["menu"]}\g<2>', doc)
        open(path, 'w', encoding='utf-8', newline='\n').write(doc)
        print(path, 'OK')


if __name__ == '__main__':
    sys.exit(main())
