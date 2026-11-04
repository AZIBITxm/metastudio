// Katalog materiałów: wyszukiwarka dekorów producentów (dane/dekory/<producent>.json).
// Nowy producent = nowy plik JSON (generuje narzędzie w narzedzia/) + wpis w PRODUCERS.
(function () {
    'use strict';

    const PRODUCERS = [
        { id: 'egger', name: 'EGGER', file: 'dane/dekory/egger.json' },
    ];
    const GROUPS = [
        { id: '', name: 'Wszystkie' },
        { id: 'drewno', name: 'Drewno' },
        { id: 'kamien-materialy', name: 'Kamień i materiały' },
        { id: 'kolory', name: 'Kolory jednolite' },
    ];

    const $ = (id) => document.getElementById(id);
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
    const state = { q: '', producer: '', group: '' };
    let decors = [];

    function chips(container, items, key) {
        container.innerHTML = '';
        items.forEach((it) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'km-chip';
            b.textContent = it.name;
            b.setAttribute('aria-pressed', String(state[key] === it.id));
            b.addEventListener('click', () => {
                state[key] = it.id;
                container.querySelectorAll('.km-chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
                b.setAttribute('aria-pressed', 'true');
                render();
            });
            container.appendChild(b);
        });
    }

    function render() {
        const q = norm(state.q).trim();
        const words = q.split(/\s+/).filter(Boolean);
        const list = decors.filter((d) =>
            (!state.producer || d._p === state.producer) &&
            (!state.group || d.group === state.group) &&
            words.every((w) => d._s.includes(w)));
        const grid = $('km-grid');
        grid.innerHTML = '';
        const frag = document.createDocumentFragment();
        list.forEach((d) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'km-card';
            b.innerHTML = `<img src="${d.image}" width="600" height="600" loading="lazy" decoding="async" alt="">` +
                `<span class="km-card-name"></span><span class="km-card-code"></span>`;
            b.querySelector('img').alt = `${d.producer} ${d.code} ${d.name}`;
            b.querySelector('.km-card-name').textContent = d.name;
            b.querySelector('.km-card-code').textContent = `${d.producer} · ${d.code} ${d.structure || ''}`;
            b.addEventListener('click', () => openModal(d));
            frag.appendChild(b);
        });
        grid.appendChild(frag);
        $('km-count').textContent = `Dekorów: ${list.length}`;
        $('km-empty').hidden = list.length > 0;
    }

    function openModal(d) {
        $('km-modal-img').src = d.image;
        $('km-modal-img').alt = `${d.producer} ${d.code} ${d.name}`;
        $('km-modal-producer').textContent = d.producer;
        $('km-modal-name').textContent = d.name;
        $('km-modal-code').textContent = `Kod: ${d.code} ${d.structure || ''}`;
        $('km-modal-link').href = d.url;
        $('km-modal').hidden = false;
        $('km-modal-close').focus();
    }
    function closeModal() { $('km-modal').hidden = true; }

    $('km-modal-close').addEventListener('click', closeModal);
    $('km-modal').addEventListener('click', (e) => { if (e.target === $('km-modal')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    $('km-search').addEventListener('input', (e) => { state.q = e.target.value; render(); });

    Promise.all(PRODUCERS.map((p) => fetch(p.file).then((r) => r.json()).then((list) =>
        list.map((d) => Object.assign(d, { _p: p.id, _s: norm(`${d.name} ${d.code} ${d.structure} ${d.producer}`) })))))
        .then((lists) => {
            decors = lists.flat();
            chips($('km-producers'), [{ id: '', name: 'Wszyscy producenci' }].concat(PRODUCERS), 'producer');
            chips($('km-groups'), GROUPS, 'group');
            const q = new URLSearchParams(location.search).get('q');
            if (q) { state.q = q; $('km-search').value = q; }
            render();
        })
        .catch((err) => { $('km-count').textContent = 'Nie udało się wczytać katalogu.'; console.error(err); });
})();
