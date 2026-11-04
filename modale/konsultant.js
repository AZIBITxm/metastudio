// Konsultant AI Zanders Atelier — okno czatu (zastępuje Biel).
// Rozmowa → aplikacja Zanders (meble-crm, Vercel): /api/public/consultant (Gemini),
// zgłoszenie → /api/public/lead (zadanie w Agendzie + push na telefon Adama).
// Kontakt zbierany ROZMOWĄ (bez formularza): telefon → imię → e-mail (można pominąć) → zgoda.
// Język wg <html lang> (pl / de / en). Przycisk wywołujący: #custom-ai-button (ikona konsultanta).
(function () {
    const API = 'https://meble-crm.vercel.app/api/public';
    const LANG = ({ de: 'de', en: 'en' })[(document.documentElement.lang || 'pl').slice(0, 2)] || 'pl';
    const STORE = 'za-konsultant-v1-' + LANG; // osobna rozmowa dla każdej wersji językowej

    const T = {
        pl: {
            title: 'Konsultant Zanders Atelier', sub: 'Odpowiadamy od razu',
            hello: 'Dzień dobry! Jestem konsultantem Zanders Atelier. Chętnie opowiem o meblach na wymiar, materiałach i bezpłatnym spotkaniu online z wizualizacją 3D. W czym mogę pomóc?',
            placeholder: 'Napisz wiadomość…', send: 'Wyślij', close: 'Zamknij', contact: 'Poproś o kontakt telefoniczny',
            typing: 'Konsultant pisze…', reset: 'Nowa rozmowa',
            askConsent: 'Chętnie przekażę sprawę dalej. Czy wyraża Pan/Pani zgodę na kontakt w sprawie zapytania?',
            privacy: 'Polityka prywatności', agree: 'Tak, wyrażam zgodę', decline: 'Nie, dziękuję',
            noConsent: 'Rozumiem. Chętnie odpowiem na dalsze pytania.',
            askPhone: 'Dziękuję. Proszę podać numer telefonu.', fPhone: 'Numer telefonu',
            badPhone: 'Proszę wpisać pełny numer telefonu.',
            askName: 'Proszę podać imię.', fName: 'Imię', badName: 'Proszę wpisać imię.',
            askEmail: 'Można też podać adres e-mail — nie jest to obowiązkowe.', fEmail: 'E-mail',
            badEmail: 'Ten adres e-mail wygląda na niepoprawny.',
            askWhen: 'Kiedy najlepiej do Pana/Pani zadzwonić lub umówić spotkanie? Proszę wybrać albo wpisać dogodny termin.',
            fWhen: 'Dogodny termin (np. czwartek po 17)',
            whenQuick: ['Dziś', 'Jutro', 'W tym tygodniu', 'Rano', 'Po południu', 'Wieczorem (po 17)'],
            teaser: 'Umów się z nami na spotkanie w dogodnym terminie — porozmawiaj z naszym konsultantem.',
            teaserClose: 'Zamknij podpowiedź',
            ok: 'Dalej', skip: 'Pomiń', cancel: 'Wróć do rozmowy',
            sending: 'Przekazuję zgłoszenie…', retry: 'Spróbuj ponownie',
            error: 'Nie udało się połączyć. Proszę zadzwonić: +48 605 126 918.',
        },
        de: {
            title: 'Zanders Atelier Berater', sub: 'Wir antworten sofort',
            hello: 'Guten Tag! Ich bin der Berater von Zanders Atelier. Gerne erzähle ich Ihnen von Möbeln nach Maß, Materialien und unserem kostenlosen Online-Termin mit 3D-Visualisierung. Wie kann ich helfen?',
            placeholder: 'Nachricht schreiben…', send: 'Senden', close: 'Schließen', contact: 'Telefonischen Rückruf anfordern',
            typing: 'Der Berater schreibt…', reset: 'Neues Gespräch',
            askConsent: 'Gerne leite ich Ihr Anliegen weiter. Sind Sie mit einer Kontaktaufnahme wegen Ihrer Anfrage einverstanden?',
            privacy: 'Datenschutzerklärung', agree: 'Ja, ich bin einverstanden', decline: 'Nein, danke',
            noConsent: 'Verstanden. Ich beantworte gerne weitere Fragen.',
            askPhone: 'Vielen Dank. Bitte geben Sie Ihre Telefonnummer an.', fPhone: 'Telefonnummer',
            badPhone: 'Bitte geben Sie die vollständige Telefonnummer ein.',
            askName: 'Bitte geben Sie Ihren Vornamen an.', fName: 'Vorname', badName: 'Bitte geben Sie Ihren Vornamen ein.',
            askEmail: 'Sie können auch Ihre E-Mail-Adresse angeben — das ist freiwillig.', fEmail: 'E-Mail',
            badEmail: 'Diese E-Mail-Adresse scheint ungültig zu sein.',
            askWhen: 'Wann passt Ihnen ein Anruf oder Termin am besten? Bitte wählen oder geben Sie Ihren Wunschtermin ein.',
            fWhen: 'Wunschtermin (z. B. Donnerstag ab 17 Uhr)',
            whenQuick: ['Heute', 'Morgen', 'Diese Woche', 'Vormittags', 'Nachmittags', 'Abends (ab 17 Uhr)'],
            teaser: 'Vereinbaren Sie einen Termin, wann es Ihnen passt — sprechen Sie mit unserem Berater.',
            teaserClose: 'Hinweis schließen',
            ok: 'Weiter', skip: 'Überspringen', cancel: 'Zurück zum Gespräch',
            sending: 'Anfrage wird weitergeleitet…', retry: 'Erneut versuchen',
            error: 'Verbindung fehlgeschlagen. Bitte rufen Sie an: +49 15212403091.',
        },
        en: {
            title: 'Zanders Atelier Consultant', sub: 'We reply instantly',
            hello: 'Hello! I am the Zanders Atelier consultant. I am happy to tell you about bespoke furniture, materials and our free online consultation with 3D visualisation. How can I help?',
            placeholder: 'Type a message…', send: 'Send', close: 'Close', contact: 'Request a phone call',
            typing: 'The consultant is typing…', reset: 'New conversation',
            askConsent: 'I will gladly pass your enquiry on. Do you agree to be contacted about it?',
            privacy: 'Privacy policy', agree: 'Yes, I agree', decline: 'No, thank you',
            noConsent: 'Understood. I am happy to answer any further questions.',
            askPhone: 'Thank you. Please enter your phone number.', fPhone: 'Phone number',
            badPhone: 'Please enter your full phone number.',
            askName: 'Please enter your first name.', fName: 'First name', badName: 'Please enter your first name.',
            askEmail: 'You may also leave your email address — this is optional.', fEmail: 'Email',
            badEmail: 'That email address does not look right.',
            askWhen: 'When is the best time to call you or arrange a meeting? Please choose or type a time that suits you.',
            fWhen: 'Preferred time (e.g. Thursday after 5 pm)',
            whenQuick: ['Today', 'Tomorrow', 'This week', 'Morning', 'Afternoon', 'Evening (after 5 pm)'],
            teaser: 'Book a meeting at a time that suits you — talk to our consultant.',
            teaserClose: 'Close tip',
            ok: 'Next', skip: 'Skip', cancel: 'Back to the conversation',
            sending: 'Passing on your enquiry…', retry: 'Try again',
            error: 'Connection failed. Please call +48 605 126 918.',
        },
    }[LANG];

    // --- stan rozmowy (sessionStorage; bez niego okno działa normalnie) ---
    let msgs = [];
    let sent = false;
    try {
        const s = JSON.parse(sessionStorage.getItem(STORE) || 'null');
        if (s && Array.isArray(s.msgs)) { msgs = s.msgs; sent = !!s.sent; }
    } catch (e) { /* brak dostępu do pamięci — trudno */ }
    function save() {
        try { sessionStorage.setItem(STORE, JSON.stringify({ msgs: msgs.slice(-30), sent })); } catch (e) { /* jw. */ }
    }

    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

    // --- budowa okna ---
    const root = document.createElement('div');
    root.id = 'za-chat';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', T.title);
    root.innerHTML = `
        <div class="za-head">
            <img src="multimedia/web/konsultant-240.webp" alt="" width="40" height="40">
            <div class="za-head-t"><strong>${esc(T.title)}</strong><span>${esc(T.sub)}</span></div>
            <button type="button" class="za-icon za-reset" title="${esc(T.reset)}" aria-label="${esc(T.reset)}">↺</button>
            <button type="button" class="za-icon za-close" title="${esc(T.close)}" aria-label="${esc(T.close)}">✕</button>
        </div>
        <div class="za-log" aria-live="polite"></div>
        <div class="za-bottom">
            <button type="button" class="za-contact">📞 ${esc(T.contact)}</button>
            <div class="za-input">
                <textarea rows="1" maxlength="1000" placeholder="${esc(T.placeholder)}" aria-label="${esc(T.placeholder)}"></textarea>
                <button type="button" class="za-send" aria-label="${esc(T.send)}">➤</button>
            </div>
            <input class="za-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        </div>`;
    document.body.appendChild(root);

    const log = root.querySelector('.za-log');
    const inputRow = root.querySelector('.za-input');
    const contactBtn = root.querySelector('.za-contact');
    const ta = root.querySelector('.za-input textarea');
    const sendBtn = root.querySelector('.za-send');
    const hp = root.querySelector('.za-hp'); // pułapka na boty — człowiek jej nie widzi
    let busy = false;
    let autoShown = false; // zbieranie kontaktu startuje samo najwyżej raz na rozmowę

    // Zbieranie kontaktu: null = zwykła rozmowa z konsultantem.
    let collect = null; // { phone, name, email }
    let chipsEl = null;

    function bubble(role, text, extraClass) {
        const d = document.createElement('div');
        d.className = `za-msg za-${role}${extraClass ? ' ' + extraClass : ''}`;
        d.innerHTML = esc(text).replace(/\n/g, '<br>');
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
        return d;
    }
    // Przyciski-odpowiedzi pod ostatnią wiadomością konsultanta.
    function chips(list) {
        if (chipsEl) chipsEl.remove();
        chipsEl = null;
        if (!list || !list.length) return;
        chipsEl = document.createElement('div');
        chipsEl.className = 'za-chips';
        list.forEach(([label, fn, primary]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = primary ? 'za-chip za-chip-main' : 'za-chip';
            b.textContent = label;
            b.addEventListener('click', fn);
            chipsEl.appendChild(b);
        });
        log.appendChild(chipsEl);
        log.scrollTop = log.scrollHeight;
    }
    function render() {
        chips(null);
        log.innerHTML = '';
        bubble('model', T.hello);
        msgs.forEach((m) => bubble(m.role, m.text));
    }
    function autoGrow() {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
    // Pole wpisywania dopasowane do kroku (telefon → klawiatura numeryczna itd.).
    function setInput(kind) {
        inputRow.hidden = kind === 'none';
        contactBtn.hidden = kind !== 'chat' || sent;
        if (kind === 'none') return; // krok zgody: tylko przyciski
        const cfg = {
            chat: [T.placeholder, 'text', 'off'],
            phone: [T.phPhone, 'tel', 'tel'],
            name: [T.phName, 'text', 'given-name'],
            email: [T.phEmail, 'email', 'email'],
        }[kind];
        ta.placeholder = cfg[0];
        ta.setAttribute('aria-label', cfg[0]);
        ta.setAttribute('inputmode', cfg[1]);
        ta.setAttribute('autocomplete', cfg[2]);
        setTimeout(() => ta.focus(), 50);
    }

    // --- zbieranie kontaktu rozmową: zgoda → telefon → imię → e-mail (pola tekstowe w rozmowie) ---
    function startCollect() {
        if (collect || sent) return;
        collect = {};
        setInput('none');
        const d = bubble('model', T.askConsent);
        d.insertAdjacentHTML('beforeend', ` <a href="polityka-prywatnosci.html#${LANG}" target="_blank" rel="noopener">${esc(T.privacy)}</a>`);
        chips([
            [T.agree, () => { chips(null); bubble('user', T.agree); askPhone(); }, true],
            [T.decline, () => { chips(null); bubble('user', T.decline); bubble('model', T.noConsent); stopCollect(); }],
        ]);
    }
    function stopCollect() {
        collect = null;
        chips(null);
        root.querySelectorAll('.za-field').forEach((f) => f.remove());
        setInput('chat');
    }
    // Pytanie konsultanta + pole tekstowe pod nim (dolny pasek jest wtedy schowany).
    function askField(question, label, type, check, onDone, canSkip, quick) {
        bubble('model', question);
        const f = document.createElement('form');
        f.className = 'za-field';
        f.noValidate = true;
        const ac = quick ? 'off' : { tel: 'tel', text: 'given-name', email: 'email' }[type];
        f.innerHTML = `${quick ? `<div class="za-quick">${quick.map((q) => `<button type="button" class="za-chip">${esc(q)}</button>`).join('')}</div>` : ''}<label><span>${esc(label)}</span><input type="${type}" autocomplete="${ac}" maxlength="${type === 'email' ? 120 : 80}"></label>
            <div class="za-field-err" role="alert"></div>
            <div class="za-field-btns">
                <button type="submit" class="za-chip za-chip-main">${esc(T.ok)}</button>
                ${canSkip ? `<button type="button" class="za-chip za-skip">${esc(T.skip)}</button>` : ''}
                <button type="button" class="za-chip za-back">${esc(T.cancel)}</button>
            </div>`;
        const inp = f.querySelector('input');
        const err = f.querySelector('.za-field-err');
        const finish = (val, shown) => { f.remove(); bubble('user', shown); onDone(val); };
        f.addEventListener('submit', (e) => {
            e.preventDefault();
            const v = inp.value.trim();
            if (!v && canSkip) return finish('', T.skip);
            const msg = check(v);
            if (msg) { err.textContent = msg; inp.focus(); return; }
            finish(v, v);
        });
        if (canSkip) f.querySelector('.za-skip').addEventListener('click', () => finish('', T.skip));
        f.querySelectorAll('.za-quick .za-chip').forEach((b) => b.addEventListener('click', () => finish(b.textContent, b.textContent)));
        f.querySelector('.za-back').addEventListener('click', stopCollect);
        log.appendChild(f);
        log.scrollTop = log.scrollHeight;
        setTimeout(() => inp.focus(), 50);
    }
    function askPhone() {
        askField(T.askPhone, T.fPhone, 'tel', (v) => (v.replace(/\D/g, '').length < 7 ? T.badPhone : ''), (v) => {
            collect.phone = v;
            askField(T.askName, T.fName, 'text', (n) => (n ? '' : T.badName), (n) => {
                collect.name = n.slice(0, 80);
                askField(T.askEmail, T.fEmail, 'email', (m) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m) ? '' : T.badEmail), (m) => {
                    collect.email = m;
                    askField(T.askWhen, T.fWhen, 'text', () => '', (w) => {
                        collect.when = w.slice(0, 120);
                        submitLead();
                    }, true, T.whenQuick);
                }, true);
            });
        });
    }
    async function submitLead() {
        chips(null);
        const wait = bubble('model', T.sending, 'za-typing');
        const need = msgs.filter((m) => m.role === 'user').map((m) => m.text).join('\n').slice(0, 1500);
        try {
            const r = await fetch(`${API}/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: LANG, name: collect.name, phone: collect.phone, email: collect.email || '', termin: collect.when || '',
                    need, consent: true, website: hp.value, messages: msgs,
                }),
            });
            const j = await r.json().catch(() => ({}));
            wait.remove();
            if (r.ok && j.ok) {
                sent = true;
                msgs.push({ role: 'model', text: j.message });
                save();
                bubble('model', j.message, 'za-ok');
                collect = null;
                setInput('chat');
            } else {
                bubble('model', (j && j.message) || T.error);
                chips([[T.retry, submitLead, true], [T.cancel, stopCollect]]);
            }
        } catch (err) {
            wait.remove();
            bubble('model', T.error);
            chips([[T.retry, submitLead, true], [T.cancel, stopCollect]]);
        }
    }

    // --- zwykła rozmowa ---
    async function send() {
        const text = ta.value.trim();
        if (!text || busy) return;
        ta.value = '';
        autoGrow();
        if (collect) return;
        busy = true;
        sendBtn.disabled = true;
        chips(null);
        msgs.push({ role: 'user', text: text.slice(0, 1000) });
        bubble('user', text);
        save();
        const typing = bubble('model', T.typing, 'za-typing');
        try {
            const r = await fetch(`${API}/consultant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lang: LANG, messages: msgs }),
            });
            const j = await r.json();
            typing.remove();
            const reply = (j && j.reply) || T.error;
            msgs.push({ role: 'model', text: reply });
            bubble('model', reply);
            save();
            if (j && j.show_form && !sent && !autoShown) { autoShown = true; startCollect(); }
        } catch (e) {
            typing.remove();
            bubble('model', T.error);
        } finally {
            busy = false;
            sendBtn.disabled = false;
        }
    }

    // Telefon: okno = widoczna część ekranu (visualViewport). Bez tego klawiatura przesuwa stronę
    // i nagłówek z początkiem rozmowy uciekają w górę, poza zasięg przewijania.
    const vv = window.visualViewport;
    const mobile = window.matchMedia('(max-width: 768px)');
    function fitViewport() {
        if (!vv || !mobile.matches || !root.classList.contains('za-open')) {
            root.style.top = root.style.height = root.style.bottom = '';
            return;
        }
        root.style.top = vv.offsetTop + 'px';
        root.style.height = vv.height + 'px';
        root.style.bottom = 'auto';
        log.scrollTop = log.scrollHeight;
    }
    if (vv) {
        vv.addEventListener('resize', fitViewport);
        vv.addEventListener('scroll', fitViewport);
    }
    // Przy fokusie pola telefon potrafi „przewinąć” samo okno (mimo overflow:hidden) — wtedy nagłówek
    // ucieka w górę i palcem nie da się go wrócić. Okno nigdy nie jest przewijane, przewija się tylko rozmowa.
    root.addEventListener('scroll', () => { if (root.scrollTop) root.scrollTop = 0; });
    root.addEventListener('focusin', () => { setTimeout(fitViewport, 50); setTimeout(fitViewport, 350); });

    function open() {
        root.classList.add('za-open');
        document.documentElement.classList.add('za-chat-on');
        if (!log.children.length) { render(); setInput('chat'); }
        fitViewport();
        setTimeout(() => ta.focus(), 150);
    }
    function close() {
        root.classList.remove('za-open');
        document.documentElement.classList.remove('za-chat-on');
        fitViewport();
    }

    root.querySelector('.za-close').addEventListener('click', close);
    root.querySelector('.za-reset').addEventListener('click', () => {
        msgs = []; sent = false; autoShown = false; collect = null; save(); render(); setInput('chat');
    });
    contactBtn.addEventListener('click', startCollect);
    sendBtn.addEventListener('click', send);
    ta.addEventListener('input', autoGrow);
    ta.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && root.classList.contains('za-open')) close();
    });

    const btn = document.getElementById('custom-ai-button');
    if (btn) {
        btn.addEventListener('click', (e) => { e.preventDefault(); root.classList.contains('za-open') ? close() : open(); });
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
    }
    window.openConsultant = open;

    // Chmurka przy ikonie: po kilku sekundach zachęca do umówienia spotkania; krzyżyk ją zamyka
    // (do końca wizyty — sessionStorage), kliknięcie otwiera rozmowę. Nie pokazuje się, gdy okno jest otwarte.
    const TEASE = 'za-teaser-zamknieta';
    let teaseOff = false;
    try { teaseOff = sessionStorage.getItem(TEASE) === '1'; } catch (e) { /* bez pamięci — pokażemy */ }
    if (btn && !teaseOff) {
        const tip = document.createElement('div');
        tip.className = 'za-teaser';
        tip.setAttribute('role', 'status');
        tip.innerHTML = `<button type="button" class="za-teaser-text">${esc(T.teaser)}</button>` +
            `<button type="button" class="za-teaser-x" aria-label="${esc(T.teaserClose)}" title="${esc(T.teaserClose)}">✕</button>`;
        const hideTip = (forever) => {
            tip.classList.remove('za-teaser-on');
            setTimeout(() => tip.remove(), 400);
            if (forever) { try { sessionStorage.setItem(TEASE, '1'); } catch (e) { /* jw. */ } }
        };
        tip.querySelector('.za-teaser-x').addEventListener('click', (e) => { e.stopPropagation(); hideTip(true); });
        tip.querySelector('.za-teaser-text').addEventListener('click', () => { hideTip(true); open(); });
        btn.addEventListener('click', () => hideTip(true));
        setTimeout(() => {
            if (root.classList.contains('za-open') || !document.body.contains(btn)) return;
            document.body.appendChild(tip);
            requestAnimationFrame(() => requestAnimationFrame(() => tip.classList.add('za-teaser-on')));
        }, 6000);
    }
})();
