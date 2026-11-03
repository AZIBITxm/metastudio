// Konsultant AI Zanders Atelier — okno czatu (zastępuje Biel).
// Rozmowa → aplikacja Zanders (meble-crm, Vercel): /api/public/consultant (Gemini),
// zgłoszenie → /api/public/lead (zadanie w Agendzie + push na telefon Adama).
// Język wg <html lang> (pl / de / en). Przycisk wywołujący: #custom-ai-button (ikona konsultanta).
(function () {
    const API = 'https://meble-crm.vercel.app/api/public';
    const LANG = ({ de: 'de', en: 'en' })[(document.documentElement.lang || 'pl').slice(0, 2)] || 'pl';
    const STORE = 'za-konsultant-v1-' + LANG; // osobna rozmowa dla każdej wersji językowej

    const T = {
        pl: {
            title: 'Konsultant Zanders Atelier', sub: 'Odpowiadamy od razu',
            hello: 'Dzień dobry! Jestem konsultantem Zanders Atelier. Chętnie opowiem o meblach na wymiar, materiałach i bezpłatnym spotkaniu online z wizualizacją 3D. W czym mogę pomóc?',
            placeholder: 'Napisz wiadomość…', send: 'Wyślij', close: 'Zamknij', contact: 'Zostaw kontakt',
            typing: 'Konsultant pisze…', formTitle: 'Adam oddzwoni do Pana/Pani',
            name: 'Imię', phone: 'Telefon', email: 'E-mail (opcjonalnie)', need: 'Czego Pan/Pani szuka? (opcjonalnie)',
            consent: 'Wyrażam zgodę na kontakt w sprawie mojego zapytania i przetwarzanie podanych danych.',
            privacy: 'Polityka prywatności', submit: 'Wyślij zgłoszenie', cancel: 'Wróć do rozmowy',
            sending: 'Wysyłanie…', missing: 'Proszę podać imię, numer telefonu i zaznaczyć zgodę.',
            error: 'Nie udało się połączyć. Proszę zadzwonić: +48 605 126 918.', reset: 'Nowa rozmowa',
        },
        de: {
            title: 'Zanders Atelier Berater', sub: 'Wir antworten sofort',
            hello: 'Guten Tag! Ich bin der Berater von Zanders Atelier. Gerne erzähle ich Ihnen von Möbeln nach Maß, Materialien und unserem kostenlosen Online-Termin mit 3D-Visualisierung. Wie kann ich helfen?',
            placeholder: 'Nachricht schreiben…', send: 'Senden', close: 'Schließen', contact: 'Kontakt hinterlassen',
            typing: 'Der Berater schreibt…', formTitle: 'Adam ruft Sie zurück',
            name: 'Name', phone: 'Telefon', email: 'E-Mail (optional)', need: 'Wonach suchen Sie? (optional)',
            consent: 'Ich willige ein, wegen meiner Anfrage kontaktiert zu werden, und in die Verarbeitung meiner Angaben.',
            privacy: 'Datenschutzerklärung', submit: 'Anfrage senden', cancel: 'Zurück zum Chat',
            sending: 'Wird gesendet…', missing: 'Bitte Name und Telefonnummer angeben und die Einwilligung bestätigen.',
            error: 'Verbindung fehlgeschlagen. Bitte rufen Sie an: +49 15212403091.', reset: 'Neues Gespräch',
        },
        en: {
            title: 'Zanders Atelier Consultant', sub: 'We reply instantly',
            hello: 'Hello! I am the Zanders Atelier consultant. I am happy to tell you about bespoke furniture, materials and our free online consultation with 3D visualisation. How can I help?',
            placeholder: 'Type a message…', send: 'Send', close: 'Close', contact: 'Leave your contact',
            typing: 'The consultant is typing…', formTitle: 'Adam will call you back',
            name: 'Name', phone: 'Phone', email: 'Email (optional)', need: 'What are you looking for? (optional)',
            consent: 'I agree to be contacted about my enquiry and to the processing of the data I provide.',
            privacy: 'Privacy policy', submit: 'Send enquiry', cancel: 'Back to chat',
            sending: 'Sending…', missing: 'Please enter your name and phone number and tick the consent box.',
            error: 'Connection failed. Please call +48 605 126 918.', reset: 'New conversation',
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
        <form class="za-form" hidden novalidate>
            <div class="za-form-t">${esc(T.formTitle)}</div>
            <input name="name" autocomplete="name" maxlength="80" placeholder="${esc(T.name)} *" required>
            <input name="phone" type="tel" autocomplete="tel" maxlength="25" placeholder="${esc(T.phone)} *" required>
            <input name="email" type="email" autocomplete="email" maxlength="120" placeholder="${esc(T.email)}">
            <textarea name="need" rows="2" maxlength="1500" placeholder="${esc(T.need)}"></textarea>
            <input name="website" class="za-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <label class="za-consent"><input type="checkbox" name="consent"> <span>${esc(T.consent)} <a href="polityka-prywatnosci.html#${LANG}" target="_blank" rel="noopener">${esc(T.privacy)}</a></span></label>
            <div class="za-form-msg" role="alert"></div>
            <div class="za-form-btns">
                <button type="button" class="za-btn-ghost za-cancel">${esc(T.cancel)}</button>
                <button type="submit" class="za-btn">${esc(T.submit)}</button>
            </div>
        </form>
        <div class="za-bottom">
            <button type="button" class="za-contact">📞 ${esc(T.contact)}</button>
            <div class="za-input">
                <textarea rows="1" maxlength="1000" placeholder="${esc(T.placeholder)}" aria-label="${esc(T.placeholder)}"></textarea>
                <button type="button" class="za-send" aria-label="${esc(T.send)}">➤</button>
            </div>
        </div>`;
    document.body.appendChild(root);

    const log = root.querySelector('.za-log');
    const form = root.querySelector('.za-form');
    const bottom = root.querySelector('.za-bottom');
    const ta = root.querySelector('.za-input textarea');
    const sendBtn = root.querySelector('.za-send');
    const formMsg = root.querySelector('.za-form-msg');
    let busy = false;
    let autoShown = false; // formularz sam wyskakuje najwyżej raz na rozmowę
    const F = (n) => form.elements.namedItem(n);

    function bubble(role, text, extraClass) {
        const d = document.createElement('div');
        d.className = `za-msg za-${role}${extraClass ? ' ' + extraClass : ''}`;
        d.innerHTML = esc(text).replace(/\n/g, '<br>');
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
        return d;
    }
    function render() {
        root.appendChild(form); // formularz chwilowo poza rozmową — innerHTML go nie skasuje
        log.innerHTML = '';
        bubble('model', T.hello);
        msgs.forEach((m) => bubble(m.role, m.text));
    }
    function autoGrow() {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }

    function showForm(on) {
        form.hidden = !on;
        bottom.hidden = on;
        formMsg.textContent = '';
        if (on) {
            // formularz jako ostatni element rozmowy: odpowiedź konsultanta zostaje widoczna nad nim
            log.appendChild(form);
            log.scrollTop = Math.max(0, form.offsetTop - log.offsetTop - 140);
            const need = msgs.filter((m) => m.role === 'user').map((m) => m.text).join('\n').slice(0, 1500);
            if (!F('need').value) F('need').value = need;
            setTimeout(() => F('name').focus(), 50);
        } else setTimeout(() => ta.focus(), 50);
    }

    async function send() {
        const text = ta.value.trim();
        if (!text || busy) return;
        busy = true;
        sendBtn.disabled = true;
        ta.value = '';
        autoGrow();
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
            if (j && j.show_form && !sent && !autoShown) { autoShown = true; showForm(true); }
        } catch (e) {
            typing.remove();
            bubble('model', T.error);
        } finally {
            busy = false;
            sendBtn.disabled = false;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = F('name').value.trim();
        const phone = F('phone').value.trim();
        if (!name || phone.replace(/\D/g, '').length < 7 || !F('consent').checked) {
            formMsg.textContent = T.missing;
            return;
        }
        const btn = form.querySelector('button[type=submit]');
        btn.disabled = true;
        btn.textContent = T.sending;
        try {
            const r = await fetch(`${API}/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: LANG, name, phone,
                    email: F('email').value.trim(), need: F('need').value.trim(),
                    consent: true, website: F('website').value, messages: msgs,
                }),
            });
            const j = await r.json().catch(() => ({}));
            if (r.ok && j.ok) {
                sent = true;
                msgs.push({ role: 'model', text: j.message });
                save();
                showForm(false);
                bubble('model', j.message, 'za-ok');
                form.reset();
            } else formMsg.textContent = (j && j.message) || T.error;
        } catch (err) {
            formMsg.textContent = T.error;
        } finally {
            btn.disabled = false;
            btn.textContent = T.submit;
        }
    });

    function open() {
        root.classList.add('za-open');
        document.documentElement.classList.add('za-chat-on');
        if (!log.children.length) render();
        setTimeout(() => ta.focus(), 150);
    }
    function close() {
        root.classList.remove('za-open');
        document.documentElement.classList.remove('za-chat-on');
    }

    root.querySelector('.za-close').addEventListener('click', close);
    root.querySelector('.za-reset').addEventListener('click', () => {
        msgs = []; sent = false; autoShown = false; save(); showForm(false); render();
    });
    root.querySelector('.za-contact').addEventListener('click', () => showForm(true));
    root.querySelector('.za-cancel').addEventListener('click', () => showForm(false));
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
