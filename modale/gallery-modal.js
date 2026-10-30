// Okno realizacji (galeria) — Zanders Atelier
// Dane: dane/realizacje.json (generuje narzedzia/przygotuj_media.py). Koniec zgadywania nazw plików.
// Pełny ekran: PhotoSwipe 5 (vendor/photoswipe-5.4.4) — powiększanie, przesuwanie palcem, przybliżanie.
class GalleryModal {
    constructor() {
        this.modal = document.getElementById('gallery-modal');
        this.currentGallery = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.data = null;
        this.dataPromise = null;
        this.lang = (document.documentElement.lang || 'pl').slice(0, 2);
        this.isDragging = false;
        this.pswpModulePromise = null;
        this.showToken = 0;
        if (!this.modal) return;
        this.bindEvents();
    }

    // ---------------------------------------------------------------- dane

    loadData() {
        if (!this.dataPromise) {
            this.dataPromise = fetch('dane/realizacje.json')
                .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
                .then(json => {
                    this.data = {};
                    (json.realizacje || []).forEach(r => { this.data[r.id] = r; });
                    return this.data;
                })
                .catch(err => {
                    this.dataPromise = null; // pozwól spróbować ponownie przy kolejnym kliknięciu
                    throw err;
                });
        }
        return this.dataPromise;
    }

    texts(id) {
        const opis = (this.data && this.data[id] && this.data[id].opis) || {};
        return opis[this.lang] || opis.en || opis.pl || null;
    }

    getProjectTitle(id) {
        const t = this.texts(id);
        if (t && t.title) return t.title;
        const h3 = document.querySelector(`[data-gallery="${id}"] h3`);
        return h3 ? h3.textContent : 'Realizacja';
    }

    // ---------------------------------------------------------------- zdarzenia

    bindEvents() {
        const closeBtn = this.modal.querySelector('.close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('show') || this.pswp) return;
            if (e.key === 'Escape') this.closeModal();
            else if (e.key === 'ArrowLeft') this.prevImage();
            else if (e.key === 'ArrowRight') this.nextImage();
        });

        const container = this.modal.querySelector('.gallery-container');
        container.querySelector('.gallery-nav.prev').addEventListener('click', (e) => { e.stopPropagation(); this.prevImage(); });
        container.querySelector('.gallery-nav.next').addEventListener('click', (e) => { e.stopPropagation(); this.nextImage(); });

        const mainImage = container.querySelector('.gallery-main-image');
        mainImage.title = this.lang === 'de' ? 'Zum Vergrößern klicken' : 'Kliknij, aby powiększyć';
        mainImage.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.swiped) return;
            this.openFullscreen();
        });
        this.setupSwipe(container);

        // Kliknięcie kafelka realizacji
        document.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item[data-gallery]');
            if (item) {
                e.preventDefault();
                this.openModal(item.dataset.gallery);
            }
        });

        // Dane i biblioteka podglądu doczytywane w tle, gdy użytkownik dojdzie do realizacji
        const section = document.getElementById('realizations');
        if (section && 'IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                if (entries.some(en => en.isIntersecting)) {
                    io.disconnect();
                    this.loadData().catch(() => {});
                }
            }, { rootMargin: '600px 0px' });
            io.observe(section);
        }
    }

    // Przesunięcie palcem po dużym zdjęciu w oknie = poprzednie / następne
    setupSwipe(container) {
        let x0 = 0, y0 = 0, active = false;
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) { active = false; return; }
            active = true;
            this.swiped = false;
            x0 = e.touches[0].clientX;
            y0 = e.touches[0].clientY;
        }, { passive: true });
        container.addEventListener('touchend', (e) => {
            if (!active) return;
            active = false;
            const t = e.changedTouches[0];
            const dx = t.clientX - x0, dy = t.clientY - y0;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                this.swiped = true;
                setTimeout(() => { this.swiped = false; }, 350);
                if (dx > 0) this.prevImage(); else this.nextImage();
            }
        }, { passive: true });
    }

    // ---------------------------------------------------------------- okno

    async openModal(galleryId) {
        this.resetModal();
        this.currentGallery = galleryId;
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.showMediaLoader();
        try {
            await this.loadData();
            const r = this.data[galleryId];
            if (!r || !r.media.length) throw new Error('Brak mediów dla realizacji ' + galleryId);
            this.images = r.media.map((m) => ({ ...m, alt: '' }));
            const title = this.getProjectTitle(galleryId);
            this.images.forEach((m, i) => {
                m.alt = `${title} — ${m.type === 'video' ? (this.lang === 'de' ? 'Video' : 'Film') : (this.lang === 'de' ? 'Foto' : 'Zdjęcie')} ${i + 1}`;
            });
            this.modal.querySelector('.modal-title').textContent = title;
            const sub = this.modal.querySelector('.modal-subtitle-mobile');
            if (sub) sub.textContent = '';
            this.generateThumbnails();
            this.updateDescription();
            this.showMediaItem(0);
        } catch (err) {
            console.error('Galeria:', err);
            this.hideMediaLoader();
            this.closeModal();
        }
    }

    resetModal() {
        this.stopVideo();
        const wrapper = this.modal.querySelector('.video-wrapper');
        if (wrapper) wrapper.remove();
        const mainImage = this.modal.querySelector('.gallery-main-image');
        mainImage.removeAttribute('src');
        mainImage.style.display = 'none';
        this.modal.querySelector('.gallery-thumbnails').innerHTML = '';
        this.images = [];
        this.currentImageIndex = 0;
        this.currentGallery = null;
    }

    closeModal() {
        this.stopVideo();
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!this.modal.classList.contains('show')) this.resetModal();
        }, 300);
    }

    stopVideo() {
        const v = this.modal.querySelector('.gallery-main-video');
        if (v) { v.pause(); }
    }

    generateThumbnails() {
        const box = this.modal.querySelector('.gallery-thumbnails');
        box.innerHTML = '';
        const frag = document.createDocumentFragment();
        this.images.forEach((m, index) => {
            const wrap = document.createElement('div');
            wrap.className = 'thumbnail-wrapper';
            wrap.style.position = 'relative';
            wrap.style.display = 'inline-block';
            const img = document.createElement('img');
            img.src = m.thumb;
            img.alt = m.alt;
            img.className = 'thumbnail';
            img.width = 160;
            img.height = 120;
            img.decoding = 'async';
            img.style.cursor = 'pointer';
            img.style.backgroundColor = '#f0f0f0';
            if (m.type === 'video') {
                const play = document.createElement('div');
                play.className = 'video-play-icon';
                play.textContent = '▶';
                wrap.appendChild(play);
            }
            img.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.isDragging) this.showMediaItem(index);
            });
            img.addEventListener('mouseenter', () => { if (!this.isDragging) img.style.transform = 'scale(1.05)'; });
            img.addEventListener('mouseleave', () => {
                if (!img.classList.contains('active') && !this.isDragging) img.style.transform = 'scale(1)';
            });
            wrap.appendChild(img);
            frag.appendChild(wrap);
        });
        box.appendChild(frag);
        if (!box.dataset.dragReady) {
            this.setupThumbnailsDrag(box);
            box.dataset.dragReady = '1';
        }
    }

    // Najmniejsza wersja zdjęcia nie mniejsza niż potrzebna szerokość w pikselach ekranu
    pickSize(sizes, cssWidth) {
        const need = cssWidth * Math.min(window.devicePixelRatio || 1, 2);
        return sizes.find(s => s.w >= need) || sizes[sizes.length - 1];
    }

    showMediaItem(index) {
        if (index < 0 || index >= this.images.length) return;
        this.currentImageIndex = index;
        const token = ++this.showToken;
        const m = this.images[index];
        const container = this.modal.querySelector('.gallery-container');
        const mainImage = container.querySelector('.gallery-main-image');
        this.stopVideo();

        if (m.type === 'video') {
            mainImage.style.display = 'none';
            this.hideMediaLoader();
            this.showVideo(m, container);
        } else {
            const wrapper = container.querySelector('.video-wrapper');
            if (wrapper) wrapper.style.display = 'none';
            // Szybko: najpierw mała wersja (już mogła się wczytać), potem ostra w tle
            const small = m.sizes[0];
            const target = this.pickSize(m.sizes, container.clientWidth || window.innerWidth);
            mainImage.alt = m.alt;
            mainImage.style.display = 'block';
            const loaderTimer = setTimeout(() => this.showMediaLoader(), 400);
            const showFinal = () => {
                if (token !== this.showToken) return;
                clearTimeout(loaderTimer);
                this.hideMediaLoader();
                mainImage.src = target.src;
                mainImage.style.opacity = '1';
            };
            mainImage.style.opacity = '0';
            const pre = new Image();
            pre.onload = () => {
                if (token !== this.showToken) return;
                if (target !== small && !this.isCached(target.src)) {
                    clearTimeout(loaderTimer);
                    this.hideMediaLoader();
                    mainImage.src = small.src;
                    mainImage.style.opacity = '1';
                    const full = new Image();
                    full.onload = showFinal;
                    full.onerror = () => {};
                    full.src = target.src;
                } else {
                    showFinal();
                }
            };
            pre.onerror = showFinal;
            pre.src = small.src;
        }
        this.updateActiveThumbnail(index);
        this.preloadAdjacent();
    }

    isCached(src) {
        const img = new Image();
        img.src = src;
        return img.complete && img.naturalWidth > 0;
    }

    preloadAdjacent() {
        if (this.images.length < 2) return;
        const w = this.modal.querySelector('.gallery-container').clientWidth || window.innerWidth;
        [1, -1].forEach(step => {
            const m = this.images[(this.currentImageIndex + step + this.images.length) % this.images.length];
            if (m.type === 'image') {
                const img = new Image();
                img.decoding = 'async';
                img.src = this.pickSize(m.sizes, w).src;
            }
        });
    }

    showVideo(m, container) {
        let wrapper = container.querySelector('.video-wrapper');
        let video, btn;
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            wrapper.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;display:block;';
            video = document.createElement('video');
            video.className = 'gallery-main-video';
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'none';
            video.controls = false;
            video.style.cssText = 'width:100%;height:100%;object-fit:contain;cursor:zoom-in;';
            video.addEventListener('click', (e) => {
                e.stopPropagation();
                if (video.paused) video.play().catch(() => {}); else video.pause();
            });
            video.addEventListener('contextmenu', (e) => e.preventDefault());
            video.addEventListener('volumechange', () => { if (!video.muted) video.muted = true; });
            btn = document.createElement('button');
            btn.className = 'video-fullscreen-btn';
            btn.textContent = '⛶';
            btn.title = this.lang === 'de' ? 'Vollbild' : 'Pełny ekran';
            btn.addEventListener('click', (e) => { e.stopPropagation(); this.openFullscreen(); });
            wrapper.appendChild(video);
            wrapper.appendChild(btn);
            container.appendChild(wrapper);
        } else {
            video = wrapper.querySelector('video');
            wrapper.style.display = 'block';
        }
        video.poster = m.poster;
        video.src = m.src;
        video.play().catch(() => {});
    }

    updateActiveThumbnail(index) {
        const thumbs = this.modal.querySelectorAll('.thumbnail');
        thumbs.forEach((t, i) => {
            const on = i === index;
            t.classList.toggle('active', on);
            t.style.transform = on ? 'scale(1.05)' : 'scale(1)';
        });
        const active = thumbs[index];
        const box = this.modal.querySelector('.gallery-thumbnails');
        if (active && box) {
            const wrap = active.parentElement;
            const left = wrap.offsetLeft - (box.clientWidth - wrap.clientWidth) / 2;
            box.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
        }
        const counter = this.modal.querySelector('.gallery-counter');
        if (counter) counter.textContent = `${index + 1} / ${this.images.length}`;
    }

    prevImage() {
        if (!this.images.length) return;
        this.showMediaItem((this.currentImageIndex - 1 + this.images.length) % this.images.length);
    }

    nextImage() {
        if (!this.images.length) return;
        this.showMediaItem((this.currentImageIndex + 1) % this.images.length);
    }

    // ---------------------------------------------------------------- opis

    updateDescription() {
        const box = this.modal.querySelector('.modal-description');
        const text = this.modal.querySelector('.description-text');
        const t = this.texts(this.currentGallery);
        if (t && t.text && t.text.trim()) {
            text.innerHTML = this.formatDescription(t.text);
            box.style.display = 'block';
            box.classList.remove('short-text');
        } else {
            text.innerHTML = '';
            box.style.display = 'none';
        }
    }

    escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    formatDescription(description) {
        return '<p>' + this.escapeHtml(description)
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>') + '</p>';
    }

    // ---------------------------------------------------------------- wskaźnik ładowania

    showMediaLoader() {
        const container = this.modal.querySelector('.gallery-container');
        let loader = container.querySelector('.media-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'media-loader';
            loader.innerHTML = '<div class="spinner-dots"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div>';
            container.appendChild(loader);
        }
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }

    hideMediaLoader() {
        const loader = this.modal.querySelector('.gallery-container .media-loader');
        if (loader) loader.style.display = 'none';
    }

    // ---------------------------------------------------------------- przewijanie miniatur myszą

    setupThumbnailsDrag(container) {
        let down = false, dragging = false, startX = 0, scrollLeft = 0;
        container.addEventListener('mouseenter', () => { if (!dragging) container.style.cursor = 'grab'; });
        container.addEventListener('mousedown', (e) => {
            down = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });
        const stop = () => {
            down = false;
            dragging = false;
            container.classList.remove('dragging');
            container.style.cursor = 'grab';
            setTimeout(() => { this.isDragging = false; }, 10);
        };
        container.addEventListener('mouseleave', () => { stop(); container.style.cursor = 'default'; });
        container.addEventListener('mouseup', stop);
        container.addEventListener('mousemove', (e) => {
            if (!down) return;
            const x = e.pageX - container.offsetLeft;
            if (Math.abs(x - startX) > 5 && !dragging) {
                dragging = true;
                this.isDragging = true;
                container.classList.add('dragging');
                container.style.cursor = 'grabbing';
            }
            if (dragging) {
                e.preventDefault();
                container.scrollLeft = scrollLeft - (x - startX) * 2;
            }
        });
    }

    // ---------------------------------------------------------------- pełny ekran (PhotoSwipe)

    loadPhotoSwipe() {
        if (!this.pswpModulePromise) {
            const url = new URL('vendor/photoswipe-5.4.4/photoswipe.esm.min.js', document.baseURI).href;
            this.pswpModulePromise = import(url).then(m => m.default);
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'vendor/photoswipe-5.4.4/photoswipe.css';
            document.head.appendChild(css);
        }
        return this.pswpModulePromise;
    }

    async openFullscreen() {
        if (!this.images.length || this.pswp) return;
        this.stopVideo();
        let PhotoSwipe;
        try {
            PhotoSwipe = await this.loadPhotoSwipe();
        } catch (err) {
            console.error('PhotoSwipe:', err);
            return;
        }
        const dataSource = this.images.map((m) => {
            if (m.type === 'video') {
                return {
                    html: `<div class="pswp-video"><video src="${m.src}" poster="${m.poster}" controls playsinline loop muted preload="none"></video></div>`,
                    alt: m.alt,
                    msrc: m.poster,
                };
            }
            const big = m.sizes[m.sizes.length - 1];
            return {
                src: big.src,
                srcset: m.sizes.map(s => `${s.src} ${s.w}w`).join(', '),
                width: big.w,
                height: big.h,
                msrc: m.sizes[0].src,
                alt: m.alt,
            };
        });
        const mainImage = this.modal.querySelector('.gallery-main-image');
        const pswp = new PhotoSwipe({
            dataSource,
            index: this.currentImageIndex,
            bgOpacity: 1,
            showHideAnimationType: 'fade',
            wheelToZoom: true,
            loop: true,
            preload: [1, 2],
            initialZoomLevel: 'fit',
            secondaryZoomLevel: 2,
            maxZoomLevel: 4,
            closeTitle: this.lang === 'de' ? 'Schließen' : 'Zamknij',
            zoomTitle: this.lang === 'de' ? 'Zoom' : 'Powiększ',
            arrowPrevTitle: this.lang === 'de' ? 'Zurück' : 'Poprzednie',
            arrowNextTitle: this.lang === 'de' ? 'Weiter' : 'Następne',
            errorMsg: this.lang === 'de' ? 'Das Bild konnte nicht geladen werden.' : 'Nie udało się wczytać zdjęcia.',
            mainClass: 'pswp--zanders',
        });
        // Filmy: odtwarzaj aktywny slajd, zatrzymuj pozostałe
        pswp.on('contentActivate', ({ content }) => {
            const v = content.element && content.element.querySelector && content.element.querySelector('video');
            if (v) v.play().catch(() => {});
        });
        pswp.on('contentDeactivate', ({ content }) => {
            const v = content.element && content.element.querySelector && content.element.querySelector('video');
            if (v) v.pause();
        });
        pswp.on('close', () => {
            const idx = pswp.currIndex;
            if (idx !== this.currentImageIndex) this.showMediaItem(idx);
            else if (this.images[idx] && this.images[idx].type === 'video') {
                const v = this.modal.querySelector('.gallery-main-video');
                if (v) v.play().catch(() => {});
            }
        });
        pswp.on('destroy', () => { this.pswp = null; });
        this.pswp = pswp;
        pswp.init();
        if (mainImage) mainImage.blur();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.galleryModal = new GalleryModal();
    } catch (error) {
        console.error('Galeria — błąd inicjalizacji:', error);
    }
});
