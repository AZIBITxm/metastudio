// Katalog materiałów: wyszukiwarka dekorów producentów (dane/dekory/<producent>.json).
// Układ (Adam 2026-11-04, wersja 2):
//   1) rodzaj materiału (kafelki): Płyty laminowane / Blaty robocze / Fronty meblowe / Laminaty HPL
//   2) przy blatach i frontach — pole „Rodzaj blatu” / „Rodzaj frontu”; producent pojawia się DOPIERO po jego wyborze
//      (przy płytach i HPL producent od razu)
//   3) producent, 4) wzór (drewno / kamień / kolory) — wszystko jako pola rozwijane.
// Fronty akrylowe: tylko Niemann, REHAU, Aquafront (z nich korzystamy — Adam).
// Nowy producent = nowy plik JSON (narzędzie w narzedzia/) + wpis w PRODUCERS.
// Pole products = w czym dekor jest dostępny: plyty, blaty, laminaty (HPL), front-akryl, front-lakier, front-pet,
// front-hpl, front-dekor (oraz informacyjnie obrzeza, kompakt…). Starsze klucze perfectsense (EGGER) i lakierowane
// (Pfleiderer) = front lakierowany.
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
    // rodzaje w obrębie typu; only = dozwoleni producenci
    const kindTest = (k) => (d) => has(d, k.id) && (!k.only || k.only.includes(d._p));
    const TYPES = [
        { id: 'plyty', name: 'Płyty laminowane', hint: 'korpusy, fronty, zabudowy', kinds: null, test: (d) => has(d, 'plyty') },
        {
            id: 'blaty', name: 'Blaty robocze', hint: 'kuchnie, biurka, łazienki', kindLabel: 'Rodzaj blatu',
            kinds: [   // rodzaje jak w „Kategoriach materiałów” na stronie głównej
                { id: 'blaty', name: 'Blaty laminowane' },
                { id: 'blat-spiek', name: 'Spieki kwarcowe' },
                { id: 'blat-zywica', name: 'Żywica epoksydowa' },
                { id: 'blat-drewno', name: 'Blaty drewniane' },
                { id: 'blat-kamien', name: 'Blaty kamienne' },
                { id: 'blat-solid', name: 'Solid Surface' },
            ],
        },
        {
            id: 'fronty', name: 'Fronty meblowe', hint: 'akrylowe, lakierowane, PET, HPL', kindLabel: 'Rodzaj frontu',
            kinds: [
                { id: 'front-akryl', name: 'Fronty akrylowe', only: ['niemann', 'rehau', 'aquafront'] },
                { id: 'front-lakier', name: 'Fronty lakierowane' },
                { id: 'front-pet', name: 'Folia PET (mat / połysk)' },
                { id: 'front-hpl', name: 'Fronty HPL' },
                { id: 'front-dekor', name: 'Dekoracyjne (lustro, ryfla, struktura)' },
            ],
        },
        {
            id: 'hpl', name: 'Laminaty HPL', hint: 'okleiny wysokociśnieniowe', kinds: null,
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
    const state = { type: params.get('typ') || '', kind: params.get('rodzaj') || '', producer: params.get('producent') || '', group: '', q: params.get('q') || '' };
    let decors = [];

    // Wypełnia pole rozwijane; opcje z count 0 są wyłączone („wkrótce”)
    function fillSelect(sel, options, value) {
        sel.innerHTML = '';
        options.forEach((o) => {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = o.count == null ? o.name : o.count ? `${o.name} (${o.count})` : `${o.name} — wkrótce`;
            opt.disabled = o.count === 0;
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
            b.disabled = list.length === 0;
            const pic = list.find((d) => d.group === 'drewno') || list[0];
            b.innerHTML = `<span class="km-type-img"${pic ? ` style="background-image:url('${encodeURI(pic.image)}')"` : ''}></span>` +
                `<span class="km-type-name"></span><span class="km-type-hint"></span>`;
            b.querySelector('.km-type-name').textContent = t.name;
            b.querySelector('.km-type-hint').textContent = `${t.hint} · ${list.length}`;
            b.addEventListener('click', () => {
                if (state.type === t.id) return;
                Object.assign(state, { type: t.id, kind: '', producer: '' });
                render();
            });
            box.appendChild(b);
        });
    }

    function syncUrl() {
        const p = new URLSearchParams();
        p.set('typ', state.type);
        if (state.kind) p.set('rodzaj', state.kind);
        if (state.producer) p.set('producent', state.producer);
        if (state.q) p.set('q', state.q);
        history.replaceState(null, '', `${location.pathname}?${p}`);
    }

    function render() {
        const type = TYPES.find((t) => t.id === state.type) || TYPES[0];
        state.type = type.id;
        let list = decors.filter(type.test);

        // 2) rodzaj blatu / frontu
        const kindField = $('km-kind-field');
        let kind = null;
        if (type.kinds) {
            kindField.hidden = false;
            $('km-kind-label').textContent = type.kindLabel;
            const opts = [{ id: '', name: `Wszystkie (${list.length})` }]
                .concat(type.kinds.map((k) => ({ id: k.id, name: k.name, count: list.filter(k.test).length })));
            kind = type.kinds.find((k) => k.id === state.kind && list.some(k.test)) || null;
            state.kind = kind ? kind.id : '';
            fillSelect($('km-kind'), opts, state.kind);
            if (kind) list = list.filter(kind.test);
        } else {
            kindField.hidden = true;
            state.kind = '';
        }

        // 3) producent — przy blatach/frontach dopiero po wyborze rodzaju
        const prodField = $('km-producer-field');
        const showProducers = !type.kinds || !!kind;
        prodField.hidden = !showProducers;
        if (showProducers) {
            const prods = PRODUCERS.map((p) => ({ id: p.id, name: p.name, count: list.filter((d) => d._p === p.id).length }))
                .filter((p) => p.count > 0);
            if (!prods.some((p) => p.id === state.producer)) state.producer = '';
            fillSelect($('km-producer'), [{ id: '', name: 'Wszyscy producenci' }].concat(prods), state.producer);
            if (state.producer) list = list.filter((d) => d._p === state.producer);
        } else {
            state.producer = '';
        }

        // 4) wzór + wyszukiwarka
        fillSelect($('km-group'), GROUPS, state.group);
        const words = norm(state.q).split(/\s+/).filter(Boolean);
        list = list.filter((d) => (!state.group || d.group === state.group) && words.every((w) => d._s.includes(w)));

        renderTypes();
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
        const where = kind ? kind.name : type.name;
        $('km-count').textContent = `${where}: ${list.length}`;
        $('km-empty').hidden = list.length > 0;
        $('km-empty').textContent = type.kinds && kind && !decors.some(kind.test)
            ? 'Ten rodzaj dodamy wkrótce — zapytaj nas o dostępne wzory.' : 'Brak dekorów dla tych kryteriów.';
        syncUrl();
    }

    function openModal(d) {
        $('km-modal-img').src = encodeURI(d.image);
        $('km-modal-img').alt = `${d.producer} ${d.code} ${d.name}`;
        $('km-modal-producer').textContent = d.producer;
        $('km-modal-name').textContent = d.name;
        $('km-modal-code').textContent = `Kod: ${d.code} ${d.structure || ''}`;
        const forms = [...new Set((d.products || []).map((f) => FORM_LABEL[f]).filter(Boolean))];
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
    $('km-kind').addEventListener('change', (e) => { state.kind = e.target.value; state.producer = ''; render(); });
    $('km-producer').addEventListener('change', (e) => { state.producer = e.target.value; render(); });
    $('km-group').addEventListener('change', (e) => { state.group = e.target.value; render(); });

    // brak/uszkodzony plik jednego producenta nie blokuje pozostałych
    Promise.all(PRODUCERS.map((p) => fetch(p.file).then((r) => (r.ok ? r.json() : [])).catch(() => []).then((list) =>
        list.map((d) => {
            const products = (d.products || []).slice();
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
