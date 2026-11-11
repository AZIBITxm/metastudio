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

    // ===== odtwarzanie przez NASZĄ nakładkę (2026-11-11, wymóg Adama) =====
    // Na ekranie najpierw nasza okładka (pierwszy kadr z aplikacji Inspiracje) z dużym ▶. Po ▶ wstawiamy odtwarzacz
    // platformy, a nad nim leży nasza warstwa: w odtwarzacz nie da się kliknąć (logo, profil, linki), działają tylko
    // nasze przyciski i przesunięcie w bok. TikTok i YouTube: pauza + dźwięk przez polecenia do odtwarzacza;
    // Facebook: tylko stop. Instagram / Pinterest nie przyjmują poleceń — ich ▶ klika się w ich odtwarzaczu
    // (górny i dolny pasek z linkami zakryty), a po kliknięciu kładziemy warstwę z samym ■.
    // ■ = usunięcie odtwarzacza i powrót do okładki.
    const MASK = { instagram: { top: 64, bottom: 150 }, pinterest: { top: 0, bottom: 0 } };   // do strojenia po próbie Adama

    function igKod(url) {
        const m = String(url).match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/);
        return m ? { rodzaj: m[1] === 'reels' ? 'reel' : m[1], kod: m[2] } : null;
    }

    function playerHtml(f) {
        const id = esc(f.id);
        const allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share';
        if (f.platforma === 'tiktok' && f.id) {
            const q = 'autoplay=1&muted=1&loop=1&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0'
                + '&timestamp=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=0';
            return `<iframe src="https://www.tiktok.com/player/v1/${id}?${q}" title="${esc(f.autor)} · TikTok" allow="${allow}" allowfullscreen></iframe>`;
        }
        if (f.platforma === 'youtube' && f.id) {
            const q = `autoplay=1&mute=1&playsinline=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&loop=1&playlist=${id}&enablejsapi=1`;
            return `<iframe src="https://www.youtube-nocookie.com/embed/${id}?${q}" title="${esc(f.autor)} · YouTube" allow="${allow}"></iframe>`;
        }
        if (f.platforma === 'facebook') {
            // oficjalny odtwarzacz Facebooka przez jego skrypt (FB SDK) — daje polecenia play/pause/mute;
            // zwykła ramka video.php sama nie startuje i czekała na kliknięcie, które nasza warstwa blokuje
            const w = Math.round(screen.clientWidth || 340);
            return `<div class="fb-video" data-href="${esc(f.url)}" data-width="${w}" data-show-text="false" data-autoplay="true" data-allowfullscreen="false" data-lazy="false"></div>`;
        }
        if (f.platforma === 'pinterest' && f.id) {
            return `<iframe src="https://assets.pinterest.com/ext/embed.html?id=${id}" scrolling="no" allow="${allow}"></iframe>`;
        }
        if (f.platforma === 'instagram') {
            const ig = igKod(f.url);
            if (ig) return `<iframe src="https://www.instagram.com/${ig.rodzaj}/${esc(ig.kod)}/embed/" scrolling="no" allow="${allow}" allowfullscreen></iframe>`;
        }
        return '';
    }

    function coverHtml(f) {
        const img = f.miniatura ? `<img class="insp-cover-img" src="${esc(f.miniatura)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
        return `<div class="insp-cover">${img}<span class="insp-cover-name">${esc(f.autor || f.nazwa)}</span></div>`;
    }

    // warstwa nad ekranem: okładka (▶) / odtwarzanie (przyciski) / czekanie na kliknięcie w odtwarzacz IG-Pinterest (paski)
    const wrapEl = root.querySelector('.insp-screen-wrap');
    const ctrl = document.createElement('div');
    ctrl.className = 'insp-ctrl';
    ctrl.dataset.state = 'cover';
    ctrl.innerHTML =
        `<button type="button" class="insp-big-play" aria-label="${TXT.play}"></button>` +
        `<span class="insp-touch-icon" aria-hidden="true"></span>` +
        `<div class="insp-bar">` +
        `<button type="button" class="insp-btn insp-pause" aria-label="Pauza"></button>` +
        `<button type="button" class="insp-btn insp-stop" aria-label="Stop"></button>` +
        `<button type="button" class="insp-btn insp-sound" aria-label="Dźwięk"></button>` +
        `</div>` +
        `<div class="insp-mask insp-mask-top"></div><div class="insp-mask insp-mask-bottom"></div>`;
    wrapEl.appendChild(ctrl);
    const touchIcon = ctrl.querySelector('.insp-touch-icon');
    const pauseBtn = ctrl.querySelector('.insp-pause');
    const soundBtn = ctrl.querySelector('.insp-sound');

    let state = 'cover';            // cover | play | wait
    let muted = true, paused = false, started = false, startTimer = null;

    function setState(st) {
        state = st;
        ctrl.dataset.state = st;
        const f = films[current] || {};
        ctrl.dataset.platform = f.platforma || '';
        pauseBtn.classList.toggle('is-paused', paused);
        soundBtn.classList.toggle('is-muted', muted);
    }
    function flash(symbol) {
        touchIcon.textContent = symbol;
        touchIcon.classList.remove('is-on');
        void touchIcon.offsetWidth;
        touchIcon.classList.add('is-on');
    }
    function frame() { return screen.querySelector('iframe'); }

    // ===== Facebook: skrypt SDK ładowany raz, przy pierwszym ▶ rolki z Facebooka =====
    let fbPlayer = null, fbToken = 0, fbSdk = null;
    function loadFbSdk() {
        if (fbSdk) return fbSdk;
        fbSdk = new Promise((resolve, reject) => {
            if (window.FB && window.FB.XFBML) { resolve(window.FB); return; }
            window.fbAsyncInit = () => {
                window.FB.init({ xfbml: false, version: 'v21.0' });
                resolve(window.FB);
            };
            const sc = document.createElement('script');
            sc.async = true;
            sc.crossOrigin = 'anonymous';
            sc.src = `https://connect.facebook.net/${LANG === 'de' ? 'de_DE' : LANG === 'en' ? 'en_GB' : 'pl_PL'}/sdk.js`;
            sc.onerror = () => { fbSdk = null; reject(new Error('sdk')); };
            document.head.appendChild(sc);
        });
        return fbSdk;
    }
    function playFacebook(f) {
        const token = ++fbToken;
        fbPlayer = null;
        // zapas, gdyby skrypt Facebooka się nie wczytał albo odtwarzacz nie zgłosił gotowości:
        // zwykła ramka, ▶ Facebooka odsłonięty, po kliknięciu w nią nasza warstwa z samym ■
        const fallback = () => {
            if (token !== fbToken || state !== 'play' || fbPlayer) return;
            screen.innerHTML = `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(f.url)}&show_text=false" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
            ctrl.style.setProperty('--mask-top', '0px');
            ctrl.style.setProperty('--mask-bottom', '0px');
            setState('wait');
            window.focus();
        };
        const timer = setTimeout(fallback, 7000);
        loadFbSdk().then((FB) => {
            if (token !== fbToken) return;
            const onReady = (msg) => {
                if (msg.type !== 'video' || token !== fbToken || !screen.contains(document.getElementById(msg.id))) return;
                FB.Event.unsubscribe('xfbml.ready', onReady);
                clearTimeout(timer);
                fbPlayer = msg.instance;
                fbPlayer.subscribe('startedPlaying', () => { started = true; });
                fbPlayer.subscribe('finishedPlaying', () => { if (token === fbToken && fbPlayer) fbPlayer.play(); });   // w pętli jak TikTok
                fbPlayer.mute();
                fbPlayer.play();
                setTimeout(() => { if (token === fbToken && fbPlayer && state === 'play') { fbPlayer.unmute(); muted = false; setState('play'); } }, 700);
                setState('play');
            };
            FB.Event.subscribe('xfbml.ready', onReady);
            const el = screen.querySelector('.fb-video');
            if (el) { el.id = 'insp-fb-' + token; FB.XFBML.parse(screen); }
        }).catch(fallback);
    }

    function send(cmd) {
        const f = films[current];
        if (f && f.platforma === 'facebook') {
            if (!fbPlayer) return;
            if (cmd === 'play') fbPlayer.play();
            else if (cmd === 'pause') fbPlayer.pause();
            else if (cmd === 'mute') fbPlayer.mute();
            else if (cmd === 'unMute') fbPlayer.unmute();
            return;
        }
        const fr = frame();
        if (!fr || !fr.contentWindow || !f) return;
        if (f.platforma === 'tiktok') {
            fr.contentWindow.postMessage({ type: cmd, value: null, 'x-tiktok-player': true }, '*');
        } else if (f.platforma === 'youtube') {
            const func = { play: 'playVideo', pause: 'pauseVideo', mute: 'mute', unMute: 'unMute' }[cmd];
            fr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
        }
    }
    const steerable = (f) => !!f && (f.platforma === 'tiktok' || f.platforma === 'youtube' || (f.platforma === 'facebook' && !!fbPlayer));

    function cover() {
        clearTimeout(startTimer);
        fbToken++; fbPlayer = null;
        ctrl.classList.remove('is-open-bottom');
        const f = films[current];
        if (!f) return;
        screen.innerHTML = coverHtml(f);
        muted = true; paused = false;
        setState('cover');
    }

    function play() {
        const f = films[current];
        if (!f) return;
        const html = playerHtml(f);
        if (!html) { cover(); return; }
        screen.innerHTML = html;
        muted = true; paused = false; started = false;
        clearTimeout(startTimer);
        ctrl.classList.remove('is-open-bottom');
        if (f.platforma === 'instagram' || f.platforma === 'pinterest') {
            const m = MASK[f.platforma];
            ctrl.style.setProperty('--mask-top', m.top + 'px');
            ctrl.style.setProperty('--mask-bottom', m.bottom + 'px');
            setState('wait');
            window.focus();
            return;
        }
        setState('play');
        if (f.platforma === 'facebook') { playFacebook(f); return; }
        if (steerable(f)) {
            // start bez dźwięku jest zawsze dozwolony; zaraz po starcie włączamy dźwięk (kliknięcie ▶ na to pozwala)
            frame().addEventListener('load', () => {
                setTimeout(() => { if (state !== 'play') return; send('play'); send('unMute'); muted = false; setState('play'); }, 700);
            }, { once: true });
        }
        if (f.platforma === 'tiktok') {
            // TikTok w części krajów pokazuje w odtwarzaczu okno zgody na pliki cookie — gdy film nie ruszy,
            // odsłaniamy dół ekranu, żeby dało się je kliknąć (po kliknięciu warstwa wraca w całości)
            startTimer = setTimeout(() => {
                if (state === 'play' && !started) { ctrl.classList.add('is-open-bottom'); window.focus(); }
            }, 4500);
        }
    }

    // sygnały z odtwarzaczy: stan odtwarzania (1 = gra)
    window.addEventListener('message', (e) => {
        const fr = frame();
        if (!fr || e.source !== fr.contentWindow) return;
        let d = e.data;
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch (x) { return; } }
        if (!d) return;
        if ((d['x-tiktok-player'] && d.type === 'onStateChange' && d.value === 1) || (d.event === 'onStateChange' && d.info === 1)) {
            started = true;
            clearTimeout(startTimer);
            ctrl.classList.remove('is-open-bottom');
        }
    });

    // kliknięcie w ramkę odtwarzacza zabiera fokus naszej stronie — jedyny sygnał, że ktoś kliknął ▶ Instagrama
    // (albo okno zgody TikToka); wtedy kładziemy warstwę z powrotem
    window.addEventListener('blur', () => {
        setTimeout(() => {
            const fr = frame();
            if (!fr || document.activeElement !== fr) return;
            if (state === 'wait') setState('play');
            else if (ctrl.classList.contains('is-open-bottom')) { started = true; ctrl.classList.remove('is-open-bottom'); }
            window.focus();
        }, 0);
    });

    function togglePause() {
        if (!steerable(films[current])) return;
        if (paused) { send('play'); paused = false; flash('▶'); }
        else { send('pause'); paused = true; flash('❚❚'); }
        setState('play');
    }
    function toggleSound() {
        if (!steerable(films[current])) return;
        if (muted) { send('unMute'); send('play'); muted = false; paused = false; flash('🔊'); }
        else { send('mute'); muted = true; flash('🔇'); }
        setState('play');
    }

    ctrl.querySelector('.insp-big-play').addEventListener('click', (e) => { e.stopPropagation(); play(); });
    pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });
    soundBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSound(); });
    ctrl.querySelector('.insp-stop').addEventListener('click', (e) => { e.stopPropagation(); cover(); });

    function show(i, focusRail, dir) {
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
        // bez opisu filmu (decyzja Adama) — tylko twórca jako zwykły napis, bez odnośnika
        authorEl.textContent = f.autor ? `${f.autor} · ${f.nazwa}` : f.nazwa;
        countEl.textContent = `${String(i + 1).padStart(2, '0')} ${TXT.of} ${String(films.length).padStart(2, '0')}`;
        root.querySelector('.insp-info').classList.remove('insp-swap');
        void root.offsetWidth;
        root.querySelector('.insp-info').classList.add('insp-swap');
        clearTimeout(startTimer);
        screen.classList.add('is-changing');
        if (dir) screen.classList.add('go-' + dir);
        setTimeout(() => {
            cover();
            // nowy film wjeżdża z przeciwnej strony niż odjechał stary
            screen.style.transition = 'none';
            screen.classList.remove('go-left', 'go-right');
            if (dir) screen.classList.add('come-' + dir);
            void screen.offsetWidth;
            screen.style.transition = '';
            screen.classList.remove('is-changing', 'come-left', 'come-right');
        }, 260);
    }

    // przesunięcie palcem po ekranie = następny / poprzedni film; stuknięcie: okładka → odtwórz, film → pauza
    let sx = 0, sy = 0;
    ctrl.addEventListener('touchstart', (e) => {
        const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
    }, { passive: true });
    ctrl.addEventListener('touchend', (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - sx, dy = t.clientY - sy;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2 && films.length > 1) {
            e.preventDefault();   // bez „kliknięcia” po przesunięciu
            stopDrift();
            show(current + (dx < 0 ? 1 : -1), true, dx < 0 ? 'left' : 'right');
        }
    });
    ctrl.addEventListener('click', (e) => {
        if (e.target !== ctrl) return;
        if (state === 'cover') play();
        else if (state === 'play') togglePause();
    });

    // film nie gra dalej, gdy sekcja zniknie z ekranu
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => {
            if (en.every((x) => !x.isIntersecting) && state !== 'cover') cover();
        }, { threshold: 0 }).observe(wrapEl);
    }

    function thumb(f, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'insp-thumb';
        b.style.setProperty('--i', i);
        b.setAttribute('aria-label', `${TXT.play}: ${f.autor || f.nazwa}`);
        b.innerHTML =
            `<span class="insp-thumb-card"><span class="insp-thumb-platform">${esc(f.nazwa)}</span>` +
            `<span class="insp-thumb-text">${esc(f.autor)}</span></span>` +
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
        const vertical = window.matchMedia('(min-width: 700px)').matches;
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

    // ruch razem z przewijaniem: przy zjeżdżaniu do sekcji elementy wjeżdżają (tytuł i opis z lewej, ekran
    // od dołu z obrotem, miniatury z prawej / z dołu po kolei), a przy przewijaniu dalej — rozjeżdżają się i znikają
    function scrollFx() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const head = root.querySelector('.insp-head');
        const info = root.querySelector('.insp-info');
        const wrap = root.querySelector('.insp-screen-wrap');
        const clamp = (t) => Math.max(0, Math.min(1, t));
        const ease = (t) => t * t * (3 - 2 * t);
        const part = (t, from) => ease(clamp((t - from) / (1 - from)));
        let running = false;
        let ce = null, cx = null;   // wygładzone wartości: płynnie „doganiają” przewijanie zamiast skakać za kółkiem myszy
        // Tablet / rozłożony Fold: baner kończy się wyżej niż na ¾ ekranu, więc sekcja jest widoczna od razu po wczytaniu.
        // Wtedy nagłówek stoi od razu, a reszta wjeżdża sama (czasowo, po starcie strony), nie czeka na przewinięcie.
        const ABOVE_FOLD = 0.75, INTRO_MS = 1300;
        let t0 = null;

        function frame() {
            const r = root.getBoundingClientRect();
            const vh = window.innerHeight || 800;
            const above = r.top + window.scrollY < vh * ABOVE_FOLD;      // sekcja widoczna bez przewijania
            if (above && t0 === null) t0 = performance.now();
            const intro = above ? ease(clamp((performance.now() - t0) / INTRO_MS)) : 0;
            const te = Math.max(clamp((vh - r.top) / (vh * 0.8)), intro);  // wejście: 0 → 1
            const tx = clamp((vh * 0.45 - r.bottom) / (vh * 0.4));        // wyjście: 0 → 1
            const far = r.bottom < -100 || r.top > vh + 100;
            if (ce === null || far) { ce = te; cx = tx; }
            else { ce += (te - ce) * 0.16; cx += (tx - cx) * 0.16; if (Math.abs(te - ce) < 0.002) ce = te; if (Math.abs(tx - cx) < 0.002) cx = tx; }
            running = ce !== te || cx !== tx || (above && intro < 1);
            if (running) requestAnimationFrame(frame);
            if (far) return;
            const mobile = !window.matchMedia('(min-width: 700px)').matches;
            const e = ce;
            const x = ease(cx);
            const set = (el, tf, v) => { el.style.transform = tf; el.style.opacity = v.toFixed(3); };

            const eh = above ? 1 : part(e, 0);   // nagłówek sekcji widocznej od razu — bez wjazdu
            set(head, `translate3d(${-90 * (1 - eh)}px, ${-40 * x}px, 0)`, eh * (1 - x));
            const ei = part(e, 0.15);
            set(info, mobile ? `translate3d(0, ${50 * (1 - ei) - 40 * x}px, 0)` : `translate3d(${-160 * (1 - ei) - 80 * x}px, 0, 0)`, ei * (1 - x));
            const es = part(e, 0.2);
            const sv = es * (1 - x);
            set(wrap, `perspective(1000px) translate3d(0, ${140 * (1 - es) - 90 * x}px, 0) rotateX(${20 * (1 - es)}deg) rotateY(${-10 * x}deg) scale(${0.8 + 0.2 * sv})`, sv);
            rail.querySelectorAll('.insp-thumb').forEach((t, i) => {
                const et = part(e, Math.min(0.3 + i * 0.08, 0.7));
                set(t, mobile ? `translate3d(${120 * (1 - et)}px, ${-30 * x}px, 0)` : `translate3d(${180 * (1 - et) + 100 * x}px, 0, 0) rotate(${4 * (1 - et)}deg)`, et * (1 - x));
            });
        }
        const req = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
        window.addEventListener('scroll', req, { passive: true });
        window.addEventListener('resize', req);
        rail.addEventListener('inspiracje:render', req);
        frame();
    }

    load().then(() => rail.dispatchEvent(new Event('inspiracje:render')));
    start();
    scrollFx();
})();
