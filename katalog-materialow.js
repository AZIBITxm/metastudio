// Katalog materiałów (Adam 2026-11-04, wersja 3):
//   1) kafelki rodzaju (zdjęcia z pokazu na stronie głównej): Płyty laminowane / Blaty robocze / Fronty meblowe / Laminaty HPL
//   2) przy blatach i frontach pole „Rodzaj blatu” / „Rodzaj frontu” — wszystkie rodzaje ze strony głównej
//   3) OPIS wybranego materiału (tekst ze strony głównej — dane/opisy-materialow.json, narzędzie narzedzia/opisy_katalogu.py)
//      + galeria odmian (dane/katalog-zrodla.json) + przycisk „Przeglądaj dekory”
//   4) dopiero po przycisku: producent → wzór → wyszukiwarka → próbki (pola rozwijane).
// Fronty akrylowe: tylko Niemann, REHAU, Aquafront (Adam). Dekory: dane/dekory/<producent>.json, pole products:
// plyty, blaty, laminaty (HPL), front-akryl, front-lakier, front-pet, front-hpl, front-dekor
// (perfectsense / lakierowane = front lakierowany).
(function () {
    'use strict';

    const PRODUCERS = [
        { id: 'egger', name: 'EGGER', file: 'dane/dekory/egger.json' },
        { id: 'kronospan', name: 'Kronospan', file: 'dane/dekory/kronospan.json' },
        { id: 'pfleiderer', name: 'Pfleiderer', file: 'dane/dekory/pfleiderer.json' },
        { id: 'swisskrono', name: 'SWISS KRONO', file: 'dane/dekory/swisskrono.json' },
        { id: 'aquafront', name: 'Aquafront', file: 'dane/dekory/aquafront.json' },
        { id: 'niemann', name: 'Niemann (Acrylux)', file: 'dane/dekory/niemann.json' },
        { id: 'rehau', name: 'REHAU (RAUVISIO)', file: 'dane/dekory/rehau.json' },
    ];
    const has = (d, k) => Array.isArray(d.products) && d.products.includes(k);
    const kindTest = (k) => (d) => has(d, k.id) && (!k.only || k.only.includes(d._p));
    // mat = id opisu na stronie głównej (…-info); pic = opis, z którego bierzemy zdjęcie kafelka
    const TYPES = [
        { id: 'plyty', name: 'Płyty laminowane', hint: 'korpusy, fronty, zabudowy', mat: 'plyty-laminowane', pic: 'plyty-meblowe', test: (d) => has(d, 'plyty') },
        {
            id: 'blaty', name: 'Blaty robocze', hint: 'kuchnie, biurka, łazienki', mat: 'blaty', pic: 'blaty', kindLabel: 'Rodzaj blatu',
            kinds: [
                { id: 'blaty', name: 'Blaty laminowane', mat: 'blaty-laminowane' },
                { id: 'blat-spiek', name: 'Spieki kwarcowe', mat: 'blaty-spieki-kwarcowe' },
                { id: 'blat-zywica', name: 'Żywica epoksydowa', mat: 'blaty-zywica-epoksydowa' },
                { id: 'blat-drewno', name: 'Blaty drewniane', mat: 'blaty-drewniane' },
                { id: 'blat-kamien', name: 'Blaty kamienne', mat: 'blaty-kamienne' },
                { id: 'blat-solid', name: 'Solid Surface', mat: 'blaty-solid-surface' },
            ],
        },
        {
            id: 'fronty', name: 'Fronty meblowe', hint: 'akrylowe, lakierowane, fornirowane i inne', mat: 'fronty-meblowe', pic: 'fronty-meblowe', kindLabel: 'Rodzaj frontu',
            kinds: [
                { id: 'front-akryl', name: 'Fronty akrylowe', mat: 'fronty-akrylowe', only: ['niemann', 'rehau', 'aquafront'] },
                { id: 'front-lakier', name: 'Fronty lakierowane', mat: 'fronty-lakierowane' },
                { id: 'front-pet', name: 'Fronty z folią PET (mat / połysk)' },
                { id: 'front-hpl', name: 'Fronty HPL' },
                { id: 'front-dekor', name: 'Fronty dekoracyjne (lustro, ryfla, struktura)' },
                { id: 'front-fornir', name: 'Fronty fornirowane', mat: 'fronty-fornirowane' },
                { id: 'front-drewno', name: 'Fronty drewniane', mat: 'fronty-drewniane' },
                { id: 'front-szklo', name: 'Fronty szklane', mat: 'fronty-szklane' },
                { id: 'front-giete', name: 'Fronty gięte', mat: 'fronty-giete' },
                { id: 'front-frez', name: 'Fronty frezowane', mat: 'fronty-frezowane' },
                { id: 'front-frez-lam', name: 'Fronty frezowane laminowane', mat: 'fronty-frezowane-laminowane' },
                { id: 'front-frez-lak', name: 'Fronty frezowane lakierowane', mat: 'fronty-frezowane-lakierowane' },
                { id: 'front-art', name: 'Wykończenia artystyczne', mat: 'wykonczenia-artystyczne' },
                { id: 'front-sztuk', name: 'Sztukateria', mat: 'sztukateria' },
            ],
        },
        {
            id: 'hpl', name: 'Laminaty HPL', hint: 'okleiny wysokociśnieniowe', mat: null, pic: null,
            test: (d) => has(d, 'laminaty') && ['egger', 'kronospan', 'pfleiderer', 'swisskrono'].includes(d._p),
        },
    ];
    TYPES.forEach((t) => {
        if (t.kinds) {
            t.kinds.forEach((k) => { k.test = kindTest(k); });
            t.test = (d) => t.kinds.some((k) => k.test(d));
        }
    });
    const GROUPS = [
        { id: '', name: 'Wszystkie wzory' },
        { id: 'drewno', name: 'Drewno' },
        { id: 'kamien-materialy', name: 'Kamień i materiały' },
        { id: 'kolory', name: 'Kolory jednolite' },
    ];
    const FORM_LABEL = {
        plyty: 'płyta laminowana', blaty: 'blat laminowany', laminaty: 'laminat HPL', 'front-akryl': 'front akrylowy',
        'front-lakier': 'front lakierowany', 'front-pet': 'front MDF z folią PET', 'front-hpl': 'front HPL',
        'front-dekor': 'front dekoracyjny', kompakt: 'laminat kompaktowy', 'panele-wnekowe': 'panel wnękowy',
    };

    const $ = (id) => document.getElementById(id);
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
    const params = new URLSearchParams(location.search);
    const state = {
        type: params.get('typ') || '', kind: params.get('rodzaj') || '', producer: params.get('producent') || '',
        group: '', q: params.get('q') || '', browse: params.get('dekory') === '1' || !!params.get('q') || !!params.get('producent'),
    };
    let decors = [];
    let opisy = {};
    let photos = [];   // galerie odmian (katalog-zrodla.json)

    function fillSelect(sel, options, value) {
        sel.innerHTML = '';
        options.forEach((o) => {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = o.count ? `${o.name} (${o.count})` : o.name;
            opt.disabled = !!o.disabled;
            sel.appendChild(opt);
        });
        sel.value = value;
    }

    function renderTypes() {
        const box = $('km-types');
        box.innerHTML = '';
        TYPES.forEach((t) => {
            const list = decors.filter(t.test);
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'km-type';
            b.setAttribute('aria-pressed', String(state.type === t.id));
            let img = t.pic && opisy[t.pic] && opisy[t.pic].image;
            if (!img) {
                const d = list.find((x) => x.group === 'drewno') || list[0];
                img = d ? d.image : '';
            }
            b.innerHTML = `<span class="km-type-img"><img src="${encodeURI(img)}" alt="" loading="lazy" decoding="async"></span>` +
                `<span class="km-type-text"><span class="km-type-name"></span><span class="km-type-hint"></span></span>`;
            b.querySelector('.km-type-name').textContent = t.name;
            b.querySelector('.km-type-hint').textContent = list.length ? `${t.hint} · ${list.length} dekorów` : t.hint;
            b.addEventListener('click', () => {
                if (state.type === t.id) return;
                Object.assign(state, { type: t.id, kind: '', producer: '', browse: !t.mat && !t.kinds });
                render();
                $('km-step2').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            box.appendChild(b);
        });
    }

    // Opis materiału ze strony głównej + galeria odmian + przycisk „Przeglądaj dekory”
    function renderDesc(type, kind, count) {
        const box = $('km-desc');
        const matId = kind ? kind.mat : type.mat;
        const op = matId && opisy[matId];
        if (!op && !(kind && count)) { box.hidden = true; box.innerHTML = ''; return; }
        box.hidden = false;
        const gal = matId ? photos.filter((p) => p.material === matId) : [];
        // zdjęcie przy opisie = pierwsza odmiana danego materiału (różne dla każdego rodzaju), inaczej zdjęcie kafelka
        const pic = gal.length ? `materiały/katalog/${gal[0].slug}-480.webp`
            : (type.pic && opisy[type.pic] && opisy[type.pic].image);
        box.innerHTML = '';
        const head = document.createElement('div');
        head.className = 'km-desc-head';
        if (pic) head.innerHTML = `<img class="km-desc-img" src="${encodeURI(pic)}" alt="" loading="lazy">`;
        const body = document.createElement('div');
        body.className = 'km-desc-body';
        const titleRow = document.createElement('div');
        titleRow.className = 'km-desc-title';
        const h = document.createElement('h2');
        h.textContent = op ? op.title : kind.name;
        titleRow.appendChild(h);
        if (count && (!type.kinds || kind)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'km-browse-btn';
            btn.textContent = `Sprawdź dekory (${count}) ↓`;
            btn.addEventListener('click', () => {
                state.browse = true;
                render();
                $('km-browse').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            titleRow.appendChild(btn);
        }
        body.appendChild(titleRow);
        if (op) {
            const txt = document.createElement('div');
            txt.className = 'km-desc-text';
            txt.innerHTML = op.html;           // treść z naszej strony głównej
            body.appendChild(txt);
        }
        head.appendChild(body);
        box.appendChild(head);

        if (gal.length) {
            const g = document.createElement('div');
            g.className = 'km-desc-gallery';
            g.innerHTML = '<h3>Odmiany — zdjęcia</h3>';
            const track = document.createElement('div');
            track.className = 'km-desc-track';
            gal.forEach((p) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.innerHTML = `<img src="${encodeURI(`materiały/katalog/${p.slug}-480.webp`)}" alt="" loading="lazy"><span></span>`;
                b.querySelector('img').alt = p.pl;
                b.querySelector('span').textContent = p.pl;
                b.addEventListener('click', () => openModal({
                    image: `materiały/katalog/${p.slug}-1600.webp`, producer: 'Zdjęcie poglądowe', name: p.pl,
                    code: [p.author, p.license].filter(Boolean).join(' · '), url: p.page, _photo: true,
                }));
                track.appendChild(b);
            });
            g.appendChild(track);
            box.appendChild(g);
        }

        const act = document.createElement('div');
        act.className = 'km-desc-actions';
        if (type.kinds && !kind) {
            act.innerHTML = `<p class="km-desc-hint">Wybierz ${type.kindLabel.toLowerCase()} powyżej, aby zobaczyć jego opis i dostępne dekory.</p>`;
        } else if (!count) {
            act.innerHTML = '<p class="km-desc-hint">Dekorów tego materiału nie ma jeszcze w katalogu — zapytaj nas o dostępne wzory i próbki.</p>';
        }
        if (act.innerHTML) box.appendChild(act);
    }

    function syncUrl() {
        const p = new URLSearchParams();
        p.set('typ', state.type);
        if (state.kind) p.set('rodzaj', state.kind);
        if (state.browse) p.set('dekory', '1');
        if (state.producer) p.set('producent', state.producer);
        if (state.q) p.set('q', state.q);
        history.replaceState(null, '', `${location.pathname}?${p}`);
    }

    function render() {
        const type = TYPES.find((t) => t.id === state.type) || TYPES[0];
        state.type = type.id;
        if (!type.mat && !type.kinds) state.browse = true;   // HPL: bez opisu — od razu dekory
        let list = decors.filter(type.test);

        // rodzaj blatu / frontu
        let kind = null;
        $('km-kind-field').hidden = !type.kinds;
        if (type.kinds) {
            $('km-kind-label').textContent = type.kindLabel;
            kind = type.kinds.find((k) => k.id === state.kind) || null;
            state.kind = kind ? kind.id : '';
            const opts = [{ id: '', name: `— wybierz ${type.kindLabel.toLowerCase()} —` }].concat(type.kinds.map((k) => {
                const c = list.filter(k.test).length;
                return { id: k.id, name: k.name, count: c, disabled: !c && !(k.mat && opisy[k.mat]) };
            }));
            fillSelect($('km-kind'), opts, state.kind);
            list = kind ? list.filter(kind.test) : [];
        } else {
            state.kind = '';
        }

        renderTypes();
        renderDesc(type, kind, list.length);

        // przeglądanie dekorów — dopiero po „Przeglądaj dekory” (HPL bez opisu: od razu)
        const browse = state.browse && list.length > 0;
        $('km-browse').hidden = !browse;
        if (browse) {
            const prods = PRODUCERS.map((p) => ({ id: p.id, name: p.name, count: list.filter((d) => d._p === p.id).length }))
                .filter((p) => p.count > 0);
            if (!prods.some((p) => p.id === state.producer)) state.producer = '';
            fillSelect($('km-producer'), [{ id: '', name: 'Wszyscy producenci' }].concat(prods), state.producer);
            if (state.producer) list = list.filter((d) => d._p === state.producer);
            fillSelect($('km-group'), GROUPS, state.group);
            const words = norm(state.q).split(/\s+/).filter(Boolean);
            list = list.filter((d) => (!state.group || d.group === state.group) && words.every((w) => d._s.includes(w)));
            renderGrid(type, list);
            $('km-count').textContent = `${kind ? kind.name : type.name}: ${list.length}`;
            $('km-empty').hidden = list.length > 0;
        }
        syncUrl();
    }

    function renderGrid(type, list) {
        const grid = $('km-grid');
        grid.innerHTML = '';
        const frag = document.createDocumentFragment();
        list.forEach((d) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'km-card';
            const badge = type.id === 'plyty' && has(d, 'blaty') ? 'też blat'
                : type.id === 'blaty' && has(d, 'plyty') ? 'też płyta' : '';
            b.innerHTML = `<img src="${encodeURI(d.image)}" width="600" height="600" loading="lazy" decoding="async" alt="">` +
                (badge ? `<span class="km-card-badge">${badge}</span>` : '') +
                `<span class="km-card-name"></span><span class="km-card-code"></span>`;
            b.querySelector('img').alt = `${d.producer} ${d.code} ${d.name}`;
            b.querySelector('.km-card-name').textContent = d.name;
            b.querySelector('.km-card-code').textContent = `${d.producer} · ${d.code} ${d.structure || ''}`;
            b.addEventListener('click', () => openModal(d));
            frag.appendChild(b);
        });
        grid.appendChild(frag);
    }

    function openModal(d) {
        $('km-modal-img').src = encodeURI(d.image);
        $('km-modal-img').alt = `${d.name}`;
        $('km-modal-producer').textContent = d.producer;
        $('km-modal-name').textContent = d.name;
        $('km-modal-code').textContent = d._photo ? d.code : `Kod: ${d.code} ${d.structure || ''}`;
        const forms = [...new Set((d.products || []).map((f) => FORM_LABEL[f]).filter(Boolean))];
        $('km-modal-forms').textContent = forms.length ? `Dostępny jako: ${forms.join(', ')}` : '';
        $('km-modal-link').href = d.url;
        $('km-modal-link').textContent = d._photo ? 'Źródło zdjęcia ↗' : 'Zobacz dekor u producenta ↗';
        $('km-modal').hidden = false;
        $('km-modal-close').focus();
    }
    function closeModal() { $('km-modal').hidden = true; }

    $('km-modal-close').addEventListener('click', closeModal);
    $('km-modal').addEventListener('click', (e) => { if (e.target === $('km-modal')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    $('km-search').addEventListener('input', (e) => { state.q = e.target.value; render(); });
    $('km-kind').addEventListener('change', (e) => { state.kind = e.target.value; state.producer = ''; state.browse = false; render(); });
    $('km-producer').addEventListener('change', (e) => { state.producer = e.target.value; render(); });
    $('km-group').addEventListener('change', (e) => { state.group = e.target.value; render(); });

    const getJson = (f) => fetch(f).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    Promise.all([
        getJson('dane/opisy-materialow.json'),
        getJson('dane/katalog-zrodla.json'),
        Promise.all(PRODUCERS.map((p) => getJson(p.file).then((list) => (list || []).map((d) => {
            const products = (d.products || []).slice();
            if ((products.includes('perfectsense') || products.includes('lakierowane')) && !products.includes('front-lakier')) {
                products.push('front-lakier');
            }
            return Object.assign(d, {
                products, _p: p.id,
                _s: norm(`${d.name} ${d.code} ${d.structure} ${d.producer} ${(d.tags || []).join(' ')}`),
            });
        })))),
    ]).then(([op, ph, lists]) => {
        opisy = op || {};
        photos = ph || [];
        decors = lists.flat().filter((d) => TYPES.some((t) => t.test(d)));
        if (state.q) $('km-search').value = state.q;
        if (!TYPES.some((t) => t.id === state.type)) {
            // link z kodem (np. od konsultanta) bez rodzaju → rodzaj, w którym ten dekor jest
            const words = norm(state.q).split(/\s+/).filter(Boolean);
            const hit = words.length && decors.find((d) => words.every((w) => d._s.includes(w)));
            const t = hit ? (TYPES.find((x) => x.test(hit)) || TYPES[0]) : TYPES[0];
            state.type = t.id;
            if (hit && t.kinds) state.kind = (t.kinds.find((k) => k.test(hit)) || {}).id || '';
        }
        render();
    }).catch((err) => { $('km-desc').hidden = false; $('km-desc').textContent = 'Nie udało się wczytać katalogu.'; console.error(err); });
})();
