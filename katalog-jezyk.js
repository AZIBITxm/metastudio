// Wybór języka w nagłówku katalogów (2026-11-07) — jak na stronie głównej: jedna flaga, po kliknięciu lista PL / DE / EN.
// Przy przejściu do innego języka zachowuje wybór w katalogu (parametry adresu: typ, rodzaj, kat, q…).
(function () {
    const box = document.querySelector('.cat-lang');
    if (!box) return;
    const btn = box.querySelector('.lang-current');
    const menu = box.querySelector('.lang-menu');
    const set = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    menu.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => { a.href = a.getAttribute('href').split('?')[0] + location.search; });
    });
})();
