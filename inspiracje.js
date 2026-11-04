// ==========================================
// INSPIRACJE — sekcja filmów na stronie głównej (zastąpiła okno TikToka i „Aktualne promocje”, 2026-11-04)
// Lista filmów: aplikacja „Zanders Inspiracje” (dodawanie z telefonu przez Udostępnij);
// gdy aplikacja nie odpowie — zapasowa lista z modale/tiktok.txt (kody TikToka).
// Układ: ekran z filmem (scena) + opis + pas miniatur (komputer: pionowy z prawej, telefon: poziomy pod ekranem).
// ==========================================
(function () {
    const API = 'https://zanders-inspiracje.vercel.app/api/inspiracje';
    const LANG = (document.documentElement.lang || 'pl').slice(0, 2);
    const TXT = ({
        pl: { loading: 'Ładowanie inspiracji…', empty: 'Inspiracje pojawią się tu wkrótce.', watch: 'Obejrzyj na', of: 'z', play: 'Odtwórz' },
        de: { loading: 'Inspirationen werden geladen…', empty: 'Inspirationen erscheinen hier bald.', watch: 'Ansehen auf', of: 'von', play: 'Abspielen' },
        en: { loading: 'Loading inspirations…', empty: 'Inspirations will appear here soon.', watch: 'Watch on', of: 'of', play: 'Play' },
    })[LANG] || {};

    const root = document.getElementById('inspiracje');
    if (!root) return;
    const screen = root.querySelector('.insp-screen');
    const rail = root.querySelector('.insp-rail');
    const titleEl = root.querySelector('.insp-title');
    const authorEl = root.querySelector('.insp-author');
    const countEl = root.querySelector('.insp-count');
    const prevBtn = root.querySelector('.insp-prev');
    const nextBtn = root.querySelector('.insp-next');

    let films = [];
    let current = -1;
    let visible = false;     // sekcja była już na ekranie (odtwarzacz ładujemy dopiero wtedy)

    const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PLATFORM = { tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', pinterest: 'Pinterest' };

    function fromApi(w) {
        const tytul = w.tytul || '';
        return {
            platforma: w.platforma,
            nazwa: w.platformaNazwa || PLATFORM[w.platforma] || w.platforma || '',
            id: w.idFilmu || '',
            url: w.url || '',
            autor: w.autor || '',
            autorUrl: w.autorUrl || w.url || '',
            opis: w.opis || (tytul.length > 70 ? tytul.slice(0, 70) + '…' : tytul),
            miniatura: w.miniatura || '',
        };
    }

    function fromTxt(text) {
        const out = [];
        const re = /cite="([^"]+)"[^>]*data-video-id="(\d+)"/g;
        let m;
        while ((m = re.exec(text))) {
            const autor = (m[1].match(/@[^/]+/) || [''])[0];
            out.push({ platforma: 'tiktok', nazwa: 'TikTok', id: m[2], url: m[1], autor, autorUrl: m[1], opis: '', miniatura: '' });
        }
        return out;
    }

    function playerHtml(f) {
        const id = esc(f.id);
        if (f.platforma === 'tiktok' && f.id) {
            return `<iframe src="https://www.tiktok.com/player/v1/${id}?music_info=1&description=1&rel=0&autoplay=1&muted=1" title="${esc(f.autor)} · TikTok" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share" allowfullscreen></iframe>`;
        }
        if (f.platforma === 'youtube' && f.id) {
            return `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1&mute=1&playsinline=1" title="${esc(f.opis)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
        }
        if (f.platforma === 'facebook') {
            return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(f.url)}&show_text=false" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
        }
        if (f.platforma === 'pinterest' && f.id) {
            return `<iframe src="https://assets.pinterest.com/ext/embed.html?id=${id}" scrolling="no"></iframe>`;
        }
        if (f.platforma === 'instagram') {
            return `<div class="insp-scroll"><blockquote class="instagram-media" data-instgrm-permalink="${esc(f.url)}" data-instgrm-version="14" style="margin:0 auto;max-width:100%;min-width:0"><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.autor || 'Instagram')}</a></blockquote></div>`;
        }
        return `<a class="insp-screen-msg" href="${esc(f.url)}" target="_blank" rel="noopener">${TXT.watch} ${esc(f.nazwa)} ↗</a>`;
    }

    function loadInstagram() {
        if (window.instgrm) { window.instgrm.Embeds.process(); return; }
        if (document.querySelector('script[src*="instagram.com/embed.js"]')) return;
        const sc = document.createElement('script');
        sc.async = true;
        sc.src = 'https://www.instagram.com/embed.js';
        document.head.appendChild(sc);
    }

    function show(i, focusRail) {
        if (!films.length) return;
        i = (i + films.length) % films.length;
        const f = films[i];
        current = i;
        rail.querySelectorAll('.insp-thumb').forEach((b, k) => {
            b.classList.toggle('is-active', k === i);
            b.setAttribute('aria-pressed', String(k === i));
        });
        if (focusRail) {
            const b = rail.children[i];
            if (b) rail.scrollTo({
                left: b.offsetLeft - (rail.clientWidth - b.offsetWidth) / 2,
                top: b.offsetTop - (rail.clientHeight - b.offsetHeight) / 2,
                behavior: 'smooth',
            });
        }
        titleEl.textContent = f.opis || f.nazwa;
        authorEl.textContent = `${f.autor ? f.autor + ' · ' : ''}${TXT.watch} ${f.nazwa} ↗`;
        authorEl.href = f.url;
        countEl.textContent = `${String(i + 1).padStart(2, '0')} ${TXT.of} ${String(films.length).padStart(2, '0')}`;
        root.querySelector('.insp-info').classList.remove('insp-swap');
        void root.offsetWidth;
        root.querySelector('.insp-info').classList.add('insp-swap');
        if (!visible) return;   // odtwarzacz dopiero, gdy sekcja jest na ekranie
        screen.classList.add('is-changing');
        setTimeout(() => {
            screen.innerHTML = playerHtml(f);
            if (f.platforma === 'instagram') loadInstagram();
            screen.classList.remove('is-changing');
        }, 260);
    }

    function thumb(f, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'insp-thumb';
        b.style.setProperty('--i', i);
        b.setAttribute('aria-label', `${TXT.play}: ${f.opis || f.nazwa}`);
        b.innerHTML =
            `<span class="insp-thumb-card"><span class="insp-thumb-platform">${esc(f.nazwa)}</span>` +
            `<span class="insp-thumb-text">${esc(f.opis || f.autor)}</span></span>` +
            `<span class="insp-thumb-play" aria-hidden="true"></span>`;
        if (f.miniatura) {
            const img = new Image();
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.referrerPolicy = 'no-referrer';
            img.onload = () => b.classList.add('has-img');
            img.onerror = () => img.remove();   // wygasła miniatura → zostaje karta z opisem
            img.src = f.miniatura;
            b.insertBefore(img, b.firstChild);
        }
        b.addEventListener('click', () => { stopDrift(); show(i, false); });
        return b;
    }

    // pas miniatur na komputerze powoli „jedzie” sam, gdy jest dłuższy niż ekran; stop po dotknięciu / najechaniu
    let driftOn = false, driftPaused = false, driftStopped = false, driftDir = 1, driftPos = 0;
    function stopDrift() { driftStopped = true; }
    function drift() {
        if (!driftOn) return;
        const vertical = window.matchMedia('(min-width: 900px)').matches;
        const max = vertical ? rail.scrollHeight - rail.clientHeight : rail.scrollWidth - rail.clientWidth;
        if (!driftPaused && !driftStopped && max > 4) {
            const cur = vertical ? rail.scrollTop : rail.scrollLeft;
            if (Math.abs(cur - driftPos) > 2) driftPos = cur;   // ktoś przewinął ręcznie — jedziemy od tego miejsca
            driftPos += 0.35 * driftDir;
            if (driftPos >= max) { driftPos = max; driftDir = -1; }
            if (driftPos <= 0) { driftPos = 0; driftDir = 1; }
            if (vertical) rail.scrollTop = driftPos; else rail.scrollLeft = driftPos;
        }
        requestAnimationFrame(drift);
    }
    rail.addEventListener('mouseenter', () => { driftPaused = true; });
    rail.addEventListener('mouseleave', () => { driftPaused = false; });
    rail.addEventListener('touchstart', stopDrift, { passive: true });
    rail.addEventListener('wheel', stopDrift, { passive: true });

    prevBtn.addEventListener('click', () => { stopDrift(); show(current - 1, true); });
    nextBtn.addEventListener('click', () => { stopDrift(); show(current + 1, true); });

    function render() {
        rail.innerHTML = '';
        if (!films.length) {
            screen.innerHTML = `<span class="insp-screen-msg">${TXT.empty}</span>`;
            root.classList.add('is-empty');
            return;
        }
        films.forEach((f, i) => rail.appendChild(thumb(f, i)));
        root.classList.toggle('is-single', films.length < 2);
        show(0, false);
    }

    function start() {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const enter = () => {
            root.classList.add('is-in');
            visible = true;
            if (films.length) show(current < 0 ? 0 : current, false);
            if (!reduce) { driftOn = true; setTimeout(() => requestAnimationFrame(drift), 2500); }
        };
        if (!('IntersectionObserver' in window)) { enter(); return; }
        const io = new IntersectionObserver((en) => {
            if (en.some((e) => e.isIntersecting)) { io.disconnect(); enter(); }
        }, { threshold: 0.25 });
        io.observe(root);
    }

    async function load() {
        screen.innerHTML = `<span class="insp-screen-msg">${TXT.loading}</span>`;
        try {
            const ac = new AbortController();
            const t = setTimeout(() => ac.abort(), 7000);
            const r = await fetch(API, { signal: ac.signal });
            clearTimeout(t);
            const { wpisy } = await r.json();
            if (Array.isArray(wpisy) && wpisy.length) films = wpisy.map(fromApi);
        } catch (e) { /* aplikacja niedostępna — lista zapasowa */ }
        if (!films.length) {
            try { films = fromTxt(await (await fetch('modale/tiktok.txt')).text()); } catch (e) { films = []; }
        }
        render();
    }

    load();
    start();
})();
