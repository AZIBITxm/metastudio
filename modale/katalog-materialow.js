// Katalog odmian materiałów: miniatury pod opisami w „Kategorie materiałów”.
// Klik w miniaturę = pełny ekran PhotoSwipe 5 (ten sam co w galerii realizacji) z podpisem:
// nazwa odmiany + autor zdjęcia i licencja (wymóg licencji CC BY / CC BY-SA).
// Galerie generuje narzedzia/przygotuj_katalog.py z dane/katalog-zrodla.json.
(function () {
    'use strict';

    const lang = (document.documentElement.lang || 'pl').slice(0, 2);
    const t = (pl, de, en) => (lang === 'de' ? de : lang === 'en' ? en : pl);
    let pswpModule = null;

    function loadPhotoSwipe() {
        if (!pswpModule) {
            const url = new URL('vendor/photoswipe-5.4.4/photoswipe.esm.min.js', document.baseURI).href;
            pswpModule = import(url).then(m => m.default);
            if (!document.querySelector('link[href*="photoswipe.css"]')) {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = 'vendor/photoswipe-5.4.4/photoswipe.css';
                document.head.appendChild(css);
            }
        }
        return pswpModule;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    async function open(gallery, index) {
        let PhotoSwipe;
        try {
            PhotoSwipe = await loadPhotoSwipe();
        } catch (err) {
            console.error('PhotoSwipe:', err);
            return;
        }
        const swatches = Array.from(gallery.querySelectorAll('.material-swatch'));
        const dataSource = swatches.map(a => ({
            src: a.getAttribute('href'),
            width: +a.dataset.w,
            height: +a.dataset.h,
            msrc: a.querySelector('img').getAttribute('src'),
            alt: a.dataset.name,
            name: a.dataset.name,
            credit: a.dataset.credit,
            creditUrl: a.dataset.creditUrl,
        }));
        const pswp = new PhotoSwipe({
            dataSource,
            index,
            bgOpacity: 0.95,
            showHideAnimationType: 'fade',
            wheelToZoom: true,
            loop: true,
            initialZoomLevel: 'fit',
            secondaryZoomLevel: 2,
            maxZoomLevel: 4,
            closeTitle: t('Zamknij', 'Schließen', 'Close'),
            zoomTitle: t('Powiększ', 'Zoom', 'Zoom'),
            arrowPrevTitle: t('Poprzednie', 'Zurück', 'Previous'),
            arrowNextTitle: t('Następne', 'Weiter', 'Next'),
            errorMsg: t('Nie udało się wczytać zdjęcia.', 'Das Bild konnte nicht geladen werden.', 'The image could not be loaded.'),
            mainClass: 'pswp--zanders',
        });
        pswp.on('uiRegister', () => {
            pswp.ui.registerElement({
                name: 'material-caption',
                order: 9,
                isButton: false,
                appendTo: 'root',
                onInit: (el) => {
                    el.className = 'pswp__material-caption';
                    pswp.on('change', () => {
                        const d = pswp.currSlide.data;
                        const credit = d.credit
                            ? (d.creditUrl
                                ? `<a href="${escapeHtml(d.creditUrl)}" target="_blank" rel="noopener">${escapeHtml(d.credit)}</a>`
                                : escapeHtml(d.credit))
                            : '';
                        el.innerHTML = `<strong>${escapeHtml(d.name)}</strong>${credit ? `<span>${credit}</span>` : ''}`;
                    });
                },
            });
        });
        pswp.init();
    }

    document.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('.material-swatch');
        if (!a) return;
        e.preventDefault();
        e.stopPropagation();
        const gallery = a.closest('.material-gallery');
        open(gallery, Array.from(gallery.querySelectorAll('.material-swatch')).indexOf(a));
    }, true);
})();
