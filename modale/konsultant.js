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
            placeholder: 'Napisz wiadomość…', send: 'Wyślij', close: 'Zamknij', contact: 'Poproś o telefon od Adama',
            typing: 'Konsultant pisze…', reset: 'Nowa rozmowa',
            askPhone: 'Chętnie przekażę sprawę Adamowi. Pod jaki numer telefonu może oddzwonić?',
            badPhone: 'Ten numer wygląda na niepełny. Proszę wpisać numer telefonu, np. 605 126 918.',
            askName: 'Dziękuję. Jak mogę się do Pana/Pani zwracać?',
            askEmail: 'Czy chce Pan/Pani podać też adres e-mail? Jeśli nie, wystarczy kliknąć „Pomiń”.',
            badEmail: 'Ten adres e-mail wygląda na niepoprawny. Proszę wpisać go ponownie albo kliknąć „Pomiń”.',
            askConsent: 'Ostatnia rzecz: proszę jeszcze o zgodę na kontakt w sprawie zapytania i przetwarzanie podanych danych.',
            privacy: 'Polityka prywatności', agree: 'Wyrażam zgodę', skip: 'Pomiń', cancel: 'Wróć do rozmowy',
            noConsent: 'Rozumiem. Bez zgody nie mogę przekazać numeru, ale chętnie odpowiem na dalsze pytania.',
            phPhone: 'Numer telefonu…', phName: 'Imię…', phEmail: 'Adres e-mail…',
            sending: 'Przekazuję zgłoszenie…', retry: 'Spróbuj ponownie',
            error: 'Nie udało się połączyć. Proszę zadzwonić: +48 605 126 918.',
        },
        de: {
            title: 'Zanders Atelier Berater', sub: 'Wir antworten sofort',
            hello: 'Guten Tag! Ich bin der Berater von Zanders Atelier. Gerne erzähle ich Ihnen von Möbeln nach Maß, Materialien und unserem kostenlosen Online-Termin mit 3D-Visualisierung. Wie kann ich helfen?',
            placeholder: 'Nachricht schreiben…', send: 'Senden', close: 'Schließen', contact: 'Rückruf von Adam anfordern',
            typing: 'Der Berater schreibt…', reset: 'Neues Gespräch',
            askPhone: 'Gerne gebe ich Ihr Anliegen an Adam weiter. Unter welcher Telefonnummer kann er Sie zurückrufen?',
            badPhone: 'Diese Nummer scheint unvollständig zu sein. Bitte geben Sie Ihre Telefonnummer ein.',
            askName: 'Vielen Dank. Wie darf ich Sie ansprechen?',
            askEmail: 'Möchten Sie auch Ihre E-Mail-Adresse angeben? Wenn nicht, klicken Sie einfach auf „Überspringen“.',
            badEmail: 'Diese E-Mail-Adresse scheint ungültig zu sein. Bitte erneut eingeben oder „Überspringen“ klicken.',
            askConsent: 'Zum Schluss bitte ich noch um Ihre Einwilligung, wegen Ihrer Anfrage kontaktiert zu werden, und in die Verarbeitung Ihrer Angaben.',
            privacy: 'Datenschutzerklärung', agree: 'Ich willige ein', skip: 'Überspringen', cancel: 'Zurück zum Gespräch',
            noConsent: 'Verstanden. Ohne Einwilligung kann ich die Nummer nicht weitergeben, beantworte aber gerne weitere Fragen.',
            phPhone: 'Telefonnummer…', phName: 'Name…', phEmail: 'E-Mail-Adresse…',
            sending: 'Anfrage wird weitergeleitet…', retry: 'Erneut versuchen',
            error: 'Verbindung fehlgeschlagen. Bitte rufen Sie an: +49 15212403091.',
        },
        en: {
            title: 'Zanders Atelier Consultant', sub: 'We reply instantly',
            hello: 'Hello! I am the Zanders Atelier consultant. I am happy to tell you about bespoke furniture, materials and our free online consultation with 3D visualisation. How can I help?',
            placeholder: 'Type a message…', send: 'Send', close: 'Close', contact: 'Ask Adam to call me',
            typing: 'The consultant is typing…', reset: 'New conversation',
            askPhone: 'I will gladly pass this on to Adam. What phone number can he call you back on?',
            badPhone: 'That number looks incomplete. Please enter your phone number.',
            askName: 'Thank you. How may I address you?',
            askEmail: 'Would you also like to leave your email address? If not, just click “Skip”.',
            badEmail: 'That email address does not look right. Please type it again or click “Skip”.',
            askConsent: 'One last thing: please confirm your consent to be contacted about your enquiry and to the processing of the data you provided.',
            privacy: 'Privacy policy', agree: 'I agree', skip: 'Skip', cancel: 'Back to the conversation',
            noConsent: 'Understood. Without your consent I cannot pass on your number, but I am happy to answer further questions.',
            phPhone: 'Phone number…', phName: 'Your name…', phEmail: 'Email address…',
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
    let collect = null; // { step: 'phone'|'name'|'email'|'consent', phone, name, email }
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

    // --- zbieranie kontaktu rozmową ---
    const cancelChip = () => [T.cancel, stopCollect];
    function startCollect() {
        if (collect || sent) return;
        collect = { step: 'phone' };
        bubble('model', T.askPhone);
        chips([cancelChip()]);
        setInput('phone');
    }
    function stopCollect() {
        collect = null;
        chips(null);
        setInput('chat');
    }
    function askEmail() {
        collect.step = 'email';
        bubble('model', T.askEmail);
        chips([[T.skip, () => { bubble('user', T.skip); askConsent(); }], cancelChip()]);
        setInput('email');
    }
    function askConsent() {
        collect.step = 'consent';
        const d = bubble('model', T.askConsent);
        d.insertAdjacentHTML('beforeend', ` <a href="polityka-prywatnosci.html#${LANG}" target="_blank" rel="noopener">${esc(T.privacy)}</a>`);
        chips([
            [T.agree, () => { bubble('user', T.agree); submitLead(); }, true],
            [T.cancel, () => { bubble('model', T.noConsent); stopCollect(); }],
        ]);
        setInput('none');
    }
    function collectAnswer(text) {
        chips(null);
        bubble('user', text);
        if (collect.step === 'phone') {
            if (text.replace(/\D/g, '').length < 7) { bubble('model', T.badPhone); chips([cancelChip()]); return; }
            collect.phone = text;
            collect.step = 'name';
            bubble('model', T.askName);
            chips([cancelChip()]);
            setInput('name');
        } else if (collect.step === 'name') {
            collect.name = text.slice(0, 80);
            askEmail();
        } else if (collect.step === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
                bubble('model', T.badEmail);
                chips([[T.skip, () => { bubble('user', T.skip); askConsent(); }], cancelChip()]);
                return;
            }
            collect.email = text;
            askConsent();
        }
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
                    lang: LANG, name: collect.name, phone: collect.phone, email: collect.email || '',
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
        if (collect) { collectAnswer(text.slice(0, 200)); return; }
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

    function open() {
        root.classList.add('za-open');
        document.documentElement.classList.add('za-chat-on');
        if (!log.children.length) { render(); setInput('chat'); }
        setTimeout(() => ta.focus(), 150);
    }
    function close() {
        root.classList.remove('za-open');
        document.documentElement.classList.remove('za-chat-on');
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
})();
