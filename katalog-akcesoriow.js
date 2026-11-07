// Katalog akcesoriów (2026-11-06) — na wzór katalogu materiałów, oparty na FILMACH.
//   1) kafelki grup (miniatura filmu u góry, podpis pod spodem; „Sprytne rozwiązania” wyróżnione)
//   2) pole rozwijane „Rodzaj” — domyślnie „Wszystkie” (wszystkie rodzaje grupy po kolei), albo jeden rodzaj:
//      opis + przykładowi producenci + film(y)
// Dane: dane/akcesoria.json (generator narzedzia/akcesoria_dane.py — sprawdza każdy film przez YouTube oEmbed).
// Filmy ładowane leniwie: najpierw miniatura z przyciskiem, iframe dopiero po kliknięciu (szybkość strony).
// Osadzamy oficjalnym odtwarzaczem platformy — nic nie pobieramy ani nie wgrywamy u siebie. Cen nie pokazujemy.
// Parametry adresu: ?kat=<id grupy>&rodzaj=<id rodzaju> (bez „rodzaj” = Wszystkie)
// Języki (2026-11-07): katalog-akcesoriow.html (PL), -de.html, -en.html — ten sam skrypt, język z <html lang>.
// Teksty DE/EN: dane/akcesoria-de.json / -en.json (nakładka na akcesoria.json po tych samych id — generator jej nie nadpisuje).
(function () {
    'use strict';

    const LANG = ['de', 'en'].includes(document.documentElement.lang) ? document.documentElement.lang : 'pl';
    const plural = (n) => `${n} ${n === 1 ? 'rodzaj' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'rodzaje' : 'rodzajów'}`;
    const I18N = {
        pl: {
            badge: 'Nowości', kinds: plural, play: (t) => `Odtwórz film: ${t}`, playLab: (p) => `Odtwórz · ${p}`, author: 'Autor',
            seeOn: (p) => `Zobacz na ${p} ↗`, producers: 'Przykładowi producenci:', noFilm: 'Film z tym rozwiązaniem pokażemy podczas spotkania.',
            onlyThis: 'Pokaż tylko ten rodzaj →', askOne: 'Chcą Państwo takie rozwiązanie', askAll: 'Chcą Państwo któreś z tych rozwiązań',
            askTail: 'w swoich meblach? Dobierzemy system do projektu.', askBtn: 'Zapytaj o to rozwiązanie', all: (n) => `Wszystkie (${n})`,
            loadError: 'Nie udało się wczytać katalogu akcesoriów.', home: 'index-pl.html',
        },
        de: {
            badge: 'Neuheiten', kinds: (n) => `${n} ${n === 1 ? 'Art' : 'Arten'}`, play: (t) => `Video abspielen: ${t}`, playLab: (p) => `Abspielen · ${p}`,
            author: 'Autor', seeOn: (p) => `Auf ${p} ansehen ↗`, producers: 'Beispielhafte Hersteller:',
            noFilm: 'Ein Video zu dieser Lösung zeigen wir Ihnen beim Termin.', onlyThis: 'Nur diese Art anzeigen →',
            askOne: 'Möchten Sie diese Lösung', askAll: 'Möchten Sie eine dieser Lösungen', askTail: 'in Ihren Möbeln? Wir wählen das passende System für Ihr Projekt.',
            askBtn: 'Nach dieser Lösung fragen', all: (n) => `Alle (${n})`, loadError: 'Der Zubehörkatalog konnte nicht geladen werden.', home: 'index-de.html',
        },
        en: {
            badge: 'New', kinds: (n) => `${n} ${n === 1 ? 'type' : 'types'}`, play: (t) => `Play video: ${t}`, playLab: (p) => `Play · ${p}`,
            author: 'Author', seeOn: (p) => `Watch on ${p} ↗`, producers: 'Example manufacturers:',
            noFilm: 'We will show you a video of this solution at our meeting.', onlyThis: 'Show only this type →',
            askOne: 'Would you like this solution', askAll: 'Would you like one of these solutions', askTail: 'in your furniture? We will choose the right system for your project.',
            askBtn: 'Ask about this solution', all: (n) => `All (${n})`, loadError: 'The accessories catalogue could not be loaded.', home: 'index-en.html',
        },
    };
    const T = I18N[LANG];

    // Nakładka językowa: nazwy/opisy grup i rodzajów (filmy, id i miniatury bez zmian)
    function applyLang(kat, tr) {
        if (!tr) return kat;
        kat.forEach((k) => {
            const c = tr.kategorie && tr.kategorie[k.id];
            if (c) { k.nazwa = c[0]; k.opis = c[1]; }
            k.rodzaje.forEach((r) => {
                const x = tr.rodzaje && tr.rodzaje[`${k.id}/${r.id}`];
                if (x) { r.nazwa = x[0]; r.opis = x[1]; if (x[2]) r.producenci = x[2]; }
            });
        });
        return kat;
    }

    const $ = (id) => document.getElementById(id);
    const params = new URLSearchParams(location.search);
    const state = { kat: params.get('kat') || '', rodzaj: params.get('rodzaj') || '' };
    let kategorie = [];

    const ytThumb = (id, q) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${q}.jpg`;
    const PLATFORMA = { youtube: 'YouTube', tiktok: 'TikTok', vimeo: 'Vimeo', facebook: 'Facebook', instagram: 'Instagram' };

    // Miniatura YouTube: jakość zapisana w danych (mini: hq720 / mqdefault / hqdefault — generator sprawdza, która istnieje)
    function thumbImg(f) {
        const img = document.createElement('img');
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = ytThumb(f.id, f.mini || (f.pion ? 'hqdefault' : 'mqdefault'));
        img.addEventListener('error', () => { if (!img.dataset.fb) { img.dataset.fb = '1'; img.src = ytThumb(f.id, 'hqdefault'); } });
        return img;
    }

    function embedUrl(f) {
        if (f.platforma === 'tiktok') return `https://www.tiktok.com/player/v1/${encodeURIComponent(f.id)}?music_info=1&description=1&rel=0&autoplay=1`;
        if (f.platforma === 'vimeo') return `https://player.vimeo.com/video/${encodeURIComponent(f.id)}?autoplay=1`;
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(f.id)}?rel=0&autoplay=1&playsinline=1`;
    }

    function renderCats() {
        const box = $('ka-cats');
        box.innerHTML = '';
        kategorie.forEach((k) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'ka-cat' + (k.id === 'sprytne' ? ' ka-cat-special' : '');
            b.setAttribute('aria-pressed', String(state.kat === k.id));
            if (k.id === 'sprytne') b.insertAdjacentHTML('beforeend', `<span class="ka-cat-badge">${T.badge}</span>`);
            const pic = document.createElement('span');
            pic.className = 'ka-cat-img';
            const mf = k.rodzaje.flatMap((r) => r.filmy || []).find((f) => f.id === k.miniatura);
            if (mf) pic.appendChild(thumbImg(mf));
            b.appendChild(pic);
            b.insertAdjacentHTML('beforeend', '<span class="ka-cat-text"><span class="ka-cat-name"></span><span class="ka-cat-hint"></span></span>');
            b.querySelector('.ka-cat-name').textContent = k.nazwa;
            const n = k.rodzaje.length;
            b.querySelector('.ka-cat-hint').textContent = T.kinds(n);
            b.addEventListener('click', () => {
                if (state.kat === k.id) { $('ka-step2').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
                state.kat = k.id;
                state.rodzaj = '';   // domyślnie „Wszystkie”
                render();
                $('ka-step2').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            box.appendChild(b);
        });
    }

    function filmEl(f) {
        const fig = document.createElement('figure');
        fig.className = 'ka-film' + (f.pion ? ' ka-film-pion' : '');
        const player = document.createElement('div');
        player.className = 'ka-player';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ka-play';
        btn.setAttribute('aria-label', T.play(f.tytul));
        btn.appendChild(thumbImg(f));
        btn.insertAdjacentHTML('beforeend', '<span class="ka-play-icon" aria-hidden="true"></span>');
        const lab = document.createElement('span');
        lab.className = 'ka-play-label';
        lab.textContent = T.playLab(PLATFORMA[f.platforma] || f.platforma);
        btn.appendChild(lab);
        btn.addEventListener('click', () => {
            const ifr = document.createElement('iframe');
            ifr.src = embedUrl(f);
            ifr.title = f.tytul;
            ifr.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
            ifr.allowFullscreen = true;
            ifr.referrerPolicy = 'strict-origin-when-cross-origin';
            player.innerHTML = '';
            player.appendChild(ifr);
        });
        player.appendChild(btn);
        fig.appendChild(player);

        const cap = document.createElement('figcaption');
        cap.innerHTML = '<span class="ka-film-title"></span><span class="ka-film-meta">${T.author}: <a class="ka-film-author" target="_blank" rel="noopener"></a> · <a class="ka-film-src" target="_blank" rel="noopener"></a></span>';
        cap.querySelector('.ka-film-title').textContent = f.tytul;
        const a = cap.querySelector('.ka-film-author');
        a.textContent = f.autor;
        a.href = f.autorUrl || f.url;
        const s = cap.querySelector('.ka-film-src');
        s.textContent = T.seeOn(PLATFORMA[f.platforma] || f.platforma);
        s.href = f.url;
        fig.appendChild(cap);
        return fig;
    }

    // Jeden rodzaj: nagłówek, opis, producenci, filmy (miniatury → odtwarzacz po kliknięciu)
    function rodzajEl(r, tag, onlyLink) {
        const art = document.createElement('article');
        art.className = 'ka-item';
        art.id = `rodzaj-${r.id}`;
        const h = document.createElement(tag);
        h.className = 'ka-item-title';
        h.textContent = r.nazwa;
        art.appendChild(h);
        const p = document.createElement('p');
        p.className = 'ka-desc-text';
        p.textContent = r.opis;
        art.appendChild(p);
        if (r.producenci) {
            const pr = document.createElement('p');
            pr.className = 'ka-prod';
            pr.innerHTML = `<b>${T.producers}</b> <span></span>`;
            pr.querySelector('span').textContent = r.producenci;
            art.appendChild(pr);
        }
        if (r.filmy && r.filmy.length) {
            const films = document.createElement('div');
            films.className = 'ka-films' + (r.filmy.length === 1 ? ' ka-one' : '');
            r.filmy.forEach((f) => films.appendChild(filmEl(f)));
            art.appendChild(films);
        } else {
            art.insertAdjacentHTML('beforeend', `<p class="ka-prod">${T.noFilm}</p>`);
        }
        if (onlyLink) {
            const a = document.createElement('button');
            a.type = 'button';
            a.className = 'ka-only';
            a.textContent = T.onlyThis;
            a.addEventListener('click', () => {
                state.rodzaj = r.id;
                render();
                $('ka-step2').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            art.appendChild(a);
        }
        return art;
    }

    // r = null → „Wszystkie”: wszystkie rodzaje grupy po kolei (komputer: siatka 2 kolumny, telefon: 1)
    function renderDesc(kat, r) {
        const box = $('ka-desc');
        box.innerHTML = '';
        box.hidden = false;
        box.classList.toggle('ka-desc-all', !r);
        if (r) {
            box.appendChild(rodzajEl(r, 'h3', false));
        } else {
            const grid = document.createElement('div');
            grid.className = 'ka-all';
            kat.rodzaje.forEach((x) => grid.appendChild(rodzajEl(x, 'h3', true)));
            box.appendChild(grid);
        }
        const ask = document.createElement('div');
        ask.className = 'ka-ask';
        ask.innerHTML = `<p>${r ? T.askOne : T.askAll} ${T.askTail}</p>` +
            `<a class="ka-btn" href="${T.home}#contact">${T.askBtn} <span aria-hidden="true">→</span></a>`;
        box.appendChild(ask);
    }

    function syncUrl() {
        const p = new URLSearchParams();
        if (state.kat) p.set('kat', state.kat);
        if (state.rodzaj) p.set('rodzaj', state.rodzaj);
        const q = p.toString();
        history.replaceState(null, '', location.pathname + (q ? `?${q}` : ''));
    }

    function render() {
        const kat = kategorie.find((k) => k.id === state.kat) || null;
        if (!kat) state.kat = '';
        renderCats();
        $('ka-step2').hidden = !kat;
        if (kat) {
            $('ka-cat-name').textContent = kat.nazwa;
            $('ka-cat-desc').textContent = kat.opis;
            // brak „rodzaj” w adresie albo nieznany rodzaj = „Wszystkie”
            const r = kat.rodzaje.find((x) => x.id === state.rodzaj) || null;
            state.rodzaj = r ? r.id : '';
            const sel = $('ka-kind');
            sel.innerHTML = '';
            const all = document.createElement('option');
            all.value = '';
            all.textContent = T.all(kat.rodzaje.length);
            sel.appendChild(all);
            kat.rodzaje.forEach((x) => {
                const o = document.createElement('option');
                o.value = x.id;
                o.textContent = x.nazwa;
                sel.appendChild(o);
            });
            sel.value = state.rodzaj;
            renderDesc(kat, r);
        } else {
            state.rodzaj = '';
        }
        syncUrl();
    }

    $('ka-kind').addEventListener('change', (e) => { state.rodzaj = e.target.value; render(); });

    const getJson = (f) => fetch(f).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));
    Promise.all([
        getJson('dane/akcesoria.json?v=3'),
        LANG === 'pl' ? null : getJson(`dane/akcesoria-${LANG}.json?v=1`).catch(() => null),
    ])
        .then(([d, tr]) => {
            kategorie = applyLang(d.kategorie || [], tr);
            // link bezpośrednio do rodzaju bez grupy (?rodzaj=…) → znajdź grupę
            if (!state.kat && state.rodzaj) {
                const k = kategorie.find((x) => x.rodzaje.some((r) => r.id === state.rodzaj));
                if (k) state.kat = k.id;
            }
            render();
            if (state.kat) requestAnimationFrame(() => $('ka-step2').scrollIntoView({ block: 'start' }));
        })
        .catch((err) => {
            $('ka-cats').textContent = T.loadError;
            console.error(err);
        });
})();
