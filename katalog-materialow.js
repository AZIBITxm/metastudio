// Katalog materiałów: wyszukiwarka dekorów producentów (dane/dekory/<producent>.json).
// Układ (Adam 2026-11-04): 1) rodzaj materiału — Płyty laminowane / Blaty robocze / Fronty meblowe,
// 2) producent (tylko ci, którzy mają ten rodzaj), 3) przy frontach rodzaj frontu, 4) drewno/kamień/kolory.
// Nowy producent = nowy plik JSON (narzędzie w narzedzia/) + wpis w PRODUCERS.
// Pole products = w czym dekor jest dostępny: plyty, blaty, front-akryl, front-lakier, front-pet
// (oraz informacyjnie: obrzeza, laminaty, kompakt, panele-wnekowe…). Dekor bez żadnego z trzech rodzajów
// nie jest pokazywany. Starsze klucze perfectsense (EGGER) i lakierowane (Pfleiderer) = front lakierowany.
(function () {
    'use strict';

    const PRODUCERS = [
        { id: 'egger', name: 'EGGER', file: 'dane/dekory/egger.json' },
        { id: 'kronospan', name: 'Kronospan', file: 'dane/dekory/kronospan.json' },
        { id: 'pfleiderer', name: 'Pfleiderer', file: 'dane/dekory/pfleiderer.json' },
        { id: 'swisskrono', name: 'SWISS KRONO', file: 'dane/dekory/swisskrono.json' },
        { id: 'aquafront', name: 'Aquafront', file: 'dane/dekory/aquafront.json' },
        { id: 'niemann', name: 'Niemann (Acrylux)', file: 'dane/dekory/niemann.json' },
        { id: 'rehau', name: 'REHAU', file: 'dane/dekory/rehau.json' },
    ];
    const FRONT_KINDS = [
        { id: 'front-akryl', name: 'Akrylowe' },
        { id: 'front-lakier', name: 'Lakierowane' },
        { id: 'front-pet', name: 'Folia PET (mat / połysk)' },
    ];
    const has = (d, k) => Array.isArray(d.products) && d.products.includes(k);
    const TYPES = [
        { id: 'plyty', name: 'Płyty laminowane', hint: 'korpusy, fronty, zabudowy', test: (d) => has(d, 'plyty') },
        { id: 'blaty', name: 'Blaty robocze', hint: 'kuchnie, biurka, łazienki', test: (d) => has(d, 'blaty') },
        { id: 'fronty', name: 'Fronty meblowe', hint: 'akrylowe, lakierowane, PET', test: (d) => FRONT_KINDS.some((k) => has(d, k.id)) },
    ];
    const GROUPS = [
        { id: '', name: 'Wszystkie' },
        { id: 'drewno', name: 'Drewno' },
        { id: 'kamien-materialy', name: 'Kamień i materiały' },
        { id: 'kolory', name: 'Kolory jednolite' },
    ];
    const FORM_LABEL = {
        plyty: 'płyta laminowana', blaty: 'blat roboczy', 'front-akryl': 'front akrylowy',
        'front-lakier': 'front lakierowany', 'front-pet': 'front MDF z folią PET', kompakt: 'laminat kompaktowy',
        'panele-wnekowe': 'panel wnękowy',
    };

    const $ = (id) => document.getElementById(id);
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
    const params = new URLSearchParams(location.search);
    const state = { type: params.get('typ') || '', producer: '', kind: params.get('rodzaj') || '', group: '', q: params.get('q') || '' };
    let decors = [];

    function chips(container, items, key) {
        container.innerHTML = '';
        container.hidden = items.length <= 1;
        items.forEach((it) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'km-chip';
            b.textContent = it.count != null ? `${it.name} (${it.count})` : it.name;
            b.setAttribute('aria-pressed', String(state[key] === it.id));
            b.addEventListener('click', () => {
                state[key] = it.id;
                render();
            });
            container.appendChild(b);
        });
    }

    // Kafelki rodzaju materiału — zdjęcie z pierwszego dekoru danego rodzaju
    function renderTypes() {
        const box = $('km-types');
        box.innerHTML = '';
        TYPES.forEach((t) => {
            const list = decors.filter(t.test);
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'km-type';
            b.setAttribute('aria-pressed', String(state.type === t.id));
            b.disabled = list.length === 0;
            const pic = list.find((d) => d.group === 'drewno') || list[0];
            b.innerHTML = `<span class="km-type-img"${pic ? ` style="background-image:url('${encodeURI(pic.image)}')"` : ''}></span>` +
                `<span class="km-type-name"></span><span class="km-type-hint"></span>`;
            b.querySelector('.km-type-name').textContent = t.name;
            b.querySelector('.km-type-hint').textContent = `${t.hint} · ${list.length}`;
            b.addEventListener('click', () => {
                if (state.type === t.id) return;
                state.type = t.id;
                state.producer = '';
                state.kind = '';
                render();
            });
            box.appendChild(b);
        });
    }

    function syncUrl() {
        const p = new URLSearchParams();
        p.set('typ', state.type);
        if (state.kind) p.set('rodzaj', state.kind);
        if (state.q) p.set('q', state.q);
        history.replaceState(null, '', `${location.pathname}?${p}`);
    }

    function render() {
        const type = TYPES.find((t) => t.id === state.type) || TYPES[0];
        state.type = type.id;
        const ofType = decors.filter(type.test);

        // producenci tylko z tym rodzajem materiału
        const prods = PRODUCERS.map((p) => ({ id: p.id, name: p.name, count: ofType.filter((d) => d._p === p.id).length }))
            .filter((p) => p.count > 0);
        if (state.producer && !prods.some((p) => p.id === state.producer)) state.producer = '';
        const byProducer = ofType.filter((d) => !state.producer || d._p === state.producer);

        // rodzaj frontu (tylko przy frontach)
        let kinds = [];
        if (type.id === 'fronty') {
            kinds = FRONT_KINDS.map((k) => ({ id: k.id, name: k.name, count: byProducer.filter((d) => has(d, k.id)).length }))
                .filter((k) => k.count > 0);
            if (state.kind && !kinds.some((k) => k.id === state.kind)) state.kind = '';
            kinds = [{ id: '', name: 'Wszystkie fronty' }].concat(kinds);
        } else {
            state.kind = '';
        }
        const byKind = byProducer.filter((d) => !state.kind || has(d, state.kind));

        const q = norm(state.q).trim();
        const words = q.split(/\s+/).filter(Boolean);
        const list = byKind.filter((d) => (!state.group || d.group === state.group) && words.every((w) => d._s.includes(w)));

        renderTypes();
        chips($('km-producers'), [{ id: '', name: 'Wszyscy producenci' }].concat(prods), 'producer');
        $('km-producers').hidden = false;
        chips($('km-kinds'), kinds, 'kind');
        chips($('km-groups'), GROUPS, 'group');
        $('km-groups').hidden = false;

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
        $('km-count').textContent = `${type.name}: ${list.length}`;
        $('km-empty').hidden = list.length > 0;
        syncUrl();
    }

    function openModal(d) {
        $('km-modal-img').src = encodeURI(d.image);
        $('km-modal-img').alt = `${d.producer} ${d.code} ${d.name}`;
        $('km-modal-producer').textContent = d.producer;
        $('km-modal-name').textContent = d.name;
        $('km-modal-code').textContent = `Kod: ${d.code} ${d.structure || ''}`;
        const forms = (d.products || []).map((f) => FORM_LABEL[f]).filter(Boolean);
        $('km-modal-forms').textContent = forms.length ? `Dostępny jako: ${forms.join(', ')}` : '';
        $('km-modal-link').href = d.url;
        $('km-modal').hidden = false;
        $('km-modal-close').focus();
    }
    function closeModal() { $('km-modal').hidden = true; }

    $('km-modal-close').addEventListener('click', closeModal);
    $('km-modal').addEventListener('click', (e) => { if (e.target === $('km-modal')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    $('km-search').addEventListener('input', (e) => { state.q = e.target.value; render(); });

    // brak/uszkodzony plik jednego producenta nie blokuje pozostałych
    Promise.all(PRODUCERS.map((p) => fetch(p.file).then((r) => (r.ok ? r.json() : [])).catch(() => []).then((list) =>
        list.map((d) => {
            const products = (d.products || []).slice();
            // starsze klucze płyt lakierowanych → front lakierowany
            if ((products.includes('perfectsense') || products.includes('lakierowane')) && !products.includes('front-lakier')) {
                products.push('front-lakier');
            }
            return Object.assign(d, {
                products, _p: p.id,
                _s: norm(`${d.name} ${d.code} ${d.structure} ${d.producer} ${(d.tags || []).join(' ')}`),
            });
        }))))
        .then((lists) => {
            decors = lists.flat().filter((d) => TYPES.some((t) => t.test(d)));
            if (state.q) $('km-search').value = state.q;
            // link z kodem (np. od konsultanta) bez rodzaju → pierwszy rodzaj, w którym ten dekor jest
            if (!TYPES.some((t) => t.id === state.type)) {
                const words = norm(state.q).split(/\s+/).filter(Boolean);
                const hit = words.length && decors.find((d) => words.every((w) => d._s.includes(w)));
                state.type = hit ? (TYPES.find((t) => t.test(hit)) || TYPES[0]).id : TYPES[0].id;
            }
            render();
        })
        .catch((err) => { $('km-count').textContent = 'Nie udało się wczytać katalogu.'; console.error(err); });
})();
