// Gallery Modal JavaScript
class GalleryModal {
    constructor() {
        this.modal = null;
        this.fullscreen = null;
        this.currentGallery = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.projectsData = {};
        
        // CACHE dla miniaturek galerii
        this.galleriesCache = new Map();
        this.preloadedThumbnails = new Set();
        
        // Drag & drop state
        this.isDragging = false;
        this.startX = 0;
        this.scrollLeft = 0;
        
        // Touch/swipe state for fullscreen
        // Touch variables removed
        // Touch functionality removed
        
        this.init();
    }
    
    init() {
        // Load projects data from JSON script tag
        const dataScript = document.getElementById('projects-data');
        if (dataScript) {
            try {
                this.projectsData = JSON.parse(dataScript.textContent);
            } catch (e) {
                console.error('Error parsing projects data:', e);
            }
        }
        
        // Get modal and fullscreen elements
        this.modal = document.getElementById('gallery-modal');
        this.fullscreen = document.getElementById('gallery-fullscreen');
        
        // Bind events
        this.bindEvents();
    }
    
    bindEvents() {
        // Close modal events
        const closeBtn = this.modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
        
        // Navigation buttons
        const prevBtn = this.modal.querySelector('.gallery-nav.prev');
        const nextBtn = this.modal.querySelector('.gallery-nav.next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevImage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextImage());
        }
        
        // Info button
        const infoBtn = this.modal.querySelector('.gallery-info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleOverlay();
            });
        }
        
        // Main image click for fullscreen - simple approach
        this.addMainImageClickListener();
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('show')) {
                if (e.key === 'ArrowLeft') {
                    this.prevImage();
                } else if (e.key === 'ArrowRight') {
                    this.nextImage();
                }
            }
        });
        
        // Gallery item clicks
        document.addEventListener('click', (e) => {
            const galleryItem = e.target.closest('[data-gallery]');
            if (galleryItem) {
                e.preventDefault();
                const galleryId = galleryItem.dataset.gallery;
                this.openModal(galleryId);
            }
        });
        
        // Fullscreen events
        if (this.fullscreen) {
            // Close on background click
            this.fullscreen.addEventListener('click', (e) => {
                if (e.target === this.fullscreen) {
                    this.closeFullscreen();
                }
            });
            
            // Keyboard navigation in fullscreen
            document.addEventListener('keydown', (e) => {
                if (this.fullscreen.classList.contains('show')) {
                    if (e.key === 'Escape') {
                        this.closeFullscreen();
                    } else if (e.key === 'ArrowLeft') {
                        this.prevImage();
                        this.updateFullscreenImage();
                    } else if (e.key === 'ArrowRight') {
                        this.nextImage();
                        this.updateFullscreenImage();
                    }
                }
            });
            

        }
    }
    
    async openModal(galleryId) {
        console.log('Opening modal for gallery:', galleryId);
        
        // ZEROWANIE MODALA Z POPRZEDNICH USTAWIEŃ
        this.resetModal();
        
        this.currentGallery = galleryId;
        this.currentImageIndex = 0;
        
        // Show modal with loading
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Show loading
        this.showLoading();
        
        try {
            // Załaduj TYLKO miniaturki (nic więcej!)
            await this.loadOnlyThumbnails(galleryId);
            console.log('Loaded thumbnails count:', this.images.length);
            
            // Wygeneruj interfejs z miniaturkami (automatycznie wybierze pierwszą)
            this.updateModalContent();
            
            // Hide loading
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading gallery:', error);
            this.hideLoading();
            this.closeModal();
        }
    }
    
    resetModal() {
        // KOMPLETNE ZEROWANIE MODALA
        console.log('Resetting modal to clean state');
        
        // Zatrzymaj wszystkie wideo w modal
        const modalVideo = this.modal.querySelector('.gallery-main-video');
        if (modalVideo) {
            modalVideo.pause();
        }
        
        // Usuń cały wrapper wideo jeśli istnieje
        const videoWrapper = this.modal.querySelector('.video-wrapper');
        if (videoWrapper) {
            videoWrapper.remove();
        }
        
        // Wyczyść główny kontener obrazu
        const galleryContainer = this.modal.querySelector('.gallery-container');
        if (galleryContainer) {
            const mainImage = galleryContainer.querySelector('.gallery-main-image');
            if (mainImage) {
                mainImage.src = '';
                mainImage.style.display = 'none';
            }
        }
        
        // Wyczyść miniaturki
        const thumbnailsContainer = this.modal.querySelector('.gallery-thumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = '';
        }
        
        // Wyczyść dane
        this.images = [];
        this.currentImageIndex = 0;
        this.currentGallery = null;
        
        console.log('Modal reset complete');
    }

    closeModal() {
        // Zatrzymaj wszystkie wideo w modal
        const modalVideo = this.modal.querySelector('.gallery-main-video');
        if (modalVideo) {
            modalVideo.pause();
            modalVideo.currentTime = 0; // Zresetuj do początku
        }
        
        this.modal.classList.remove('show');
        
        // Only restore overflow if fullscreen is not active
        if (!this.fullscreen || !this.fullscreen.classList.contains('show')) {
            document.body.style.overflow = '';
        }
        
        // Reset after animation
        setTimeout(() => {
            this.resetModal();
        }, 300);
    }
    
    async loadOnlyThumbnails(galleryId) {
        console.log('=== NOWY SYSTEM: Ładowanie TYLKO miniaturek ===');
        
        // SPRAWDŹ CACHE
        if (this.galleriesCache.has(galleryId)) {
            console.log(`✅ Galeria ${galleryId} załadowana z cache`);
            this.images = [...this.galleriesCache.get(galleryId)]; // kopia z cache
            return;
        }
        
        const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        const mediaItems = [];
        
        // Znajdź wszystkie dostępne miniaturki (m1, m2, m3...)
        const thumbnails = await this.findAvailableThumbnails(galleryId, imageExtensions);
        console.log(`Znaleziono ${thumbnails.length} miniaturek dla galerii ${galleryId}`);
        
        if (thumbnails.length === 0) {
            console.log('Brak miniaturek, próba fallback...');
            return await this.loadFallbackThumbnails(galleryId, imageExtensions);
        }
        
        // Dla każdej miniaturki utwórz obiekt BEZ ładowania pełnych mediów
        for (const thumb of thumbnails) {
            mediaItems.push({
                number: thumb.number,
                thumbnail: thumb.path, // TYLKO miniaturka jest załadowana
                src: null, // Pełny plik NIE JEST załadowany
                alt: `${this.getProjectTitle(galleryId)} - ${thumb.type === 'video' ? 'Film' : 'Zdjęcie'} ${thumb.number}`,
                loaded: false, // Oznacz jako niezaładowany
                type: thumb.type, // 'image' lub 'video'
                galleryId: galleryId // Do późniejszego ładowania
            });
        }
        
        // Sortuj według numeru
        mediaItems.sort((a, b) => a.number - b.number);
        
        this.images = mediaItems;
        
        // ZAPISZ DO CACHE
        this.galleriesCache.set(galleryId, [...mediaItems]);
        
        // PRELOAD miniaturek w tle (nie blokuj interfejsu)
        this.preloadThumbnailsInBackground(mediaItems);
        
        console.log('Przygotowano tablicę miniaturek:', this.images.length);
        
        if (this.images.length === 0) {
            throw new Error('Nie znaleziono żadnych mediów w galerii');
        }
    }
    
    // PRELOADOWANIE miniaturek w tle dla błyskawicznego wyświetlania
    preloadThumbnailsInBackground(mediaItems) {
        console.log('🚀 Rozpoczynam preload miniaturek...');
        
        mediaItems.forEach((item, index) => {
            if (!this.preloadedThumbnails.has(item.thumbnail)) {
                // Opóźnij każdą miniaturkę o 50ms żeby nie zablokować UI
                setTimeout(() => {
                    const img = new Image();
                    img.onload = () => {
                        this.preloadedThumbnails.add(item.thumbnail);
                        console.log(`✅ Preloaded thumbnail ${index + 1}/${mediaItems.length}`);
                    };
                    img.onerror = () => {
                        console.warn(`❌ Failed to preload thumbnail: ${item.thumbnail}`);
                    };
                    img.src = item.thumbnail;
                }, index * 50); // Rozłóż w czasie
            }
        });
    }

    async loadFallbackThumbnails(galleryId, extensions) {
        // Fallback dla starych galerii bez miniaturek
        console.log('Fallback: ładowanie pierwszych 20 plików jako miniaturek');
        const mediaItems = [];
        
        for (let i = 1; i <= 20; i++) {
            for (const ext of extensions) {
                const imagePath = `galeria/${galleryId}/${i}.${ext}`;
                
                try {
                    const exists = await this.checkImageExists(imagePath);
                    if (exists) {
                        mediaItems.push({
                            number: i,
                            thumbnail: imagePath, // używaj pełnego obrazu jako miniaturka
                            src: null, // Pełny plik NIE JEST załadowany (będzie taki sam)
                            alt: `${this.getProjectTitle(galleryId)} - Zdjęcie ${i}`,
                            loaded: false,
                            type: 'image',
                            galleryId: galleryId
                        });
                        break;
                    }
                } catch (e) {
                    // Continue to next extension
                }
            }
        }
        
        this.images = mediaItems;
        return mediaItems;
    }

    
    async findAvailableThumbnails(galleryId, extensions) {
        const thumbnails = [];
        
        // OPTYMALIZACJA: Równoległe sprawdzanie wszystkich miniaturek
        const checkPromises = [];
        
        // Sprawdź miniaturki od m1 do m20 (zdjęcia) - równolegle
        for (let i = 1; i <= 20; i++) {
            for (const ext of extensions) {
                const thumbPath = `galeria/${galleryId}/m${i}.${ext}`;
                checkPromises.push(
                    this.checkImageExistsFast(thumbPath).then(exists => {
                        if (exists) {
                            return {
                                number: i,
                                path: thumbPath,
                                type: 'image',
                                priority: i // dla sortowania
                            };
                        }
                        return null;
                    })
                );
            }
        }
        
        // Sprawdź miniaturki wideo od v1 do v20 (filmy) - równolegle
        for (let i = 1; i <= 20; i++) {
            for (const ext of extensions) {
                const thumbPath = `galeria/${galleryId}/v${i}.${ext}`;
                checkPromises.push(
                    this.checkImageExistsFast(thumbPath).then(exists => {
                        if (exists) {
                            return {
                                number: i,
                                path: thumbPath,
                                type: 'video',
                                priority: i // dla sortowania
                            };
                        }
                        return null;
                    })
                );
            }
        }
        
        // Czekaj na wszystkie sprawdzenia równocześnie
        const results = await Promise.all(checkPromises);
        
        // Filtruj wyniki i usuń duplikaty (ten sam numer może mieć kilka rozszerzeń)
        const foundThumbnails = new Map();
        results.forEach(result => {
            if (result) {
                const key = `${result.type}-${result.number}`;
                if (!foundThumbnails.has(key)) {
                    foundThumbnails.set(key, result);
                }
            }
        });
        
        return Array.from(foundThumbnails.values()).sort((a, b) => a.priority - b.priority);
    }
    


    async loadFullMediaOnDemand(mediaIndex) {
        console.log(`=== ŁADOWANIE PEŁNEGO MEDIA DLA INDEKSU ${mediaIndex} ===`);
        
        if (!this.images[mediaIndex]) {
            console.warn(`Brak elementu o indeksie ${mediaIndex}`);
            return null;
        }
        
        const mediaItem = this.images[mediaIndex];
        
        if (mediaItem.loaded && mediaItem.src) {
            console.log(`Element ${mediaIndex} już załadowany: ${mediaItem.src}`);
            return mediaItem;
        }
        
        // DOPIERO TERAZ znajdź i załaduj pełny plik
        console.log(`Szukam pełnego pliku dla elementu ${mediaIndex} (${mediaItem.type})`);
        
        if (mediaItem.type === 'video') {
            // Znajdź plik wideo
            const videoPath = await this.findVideoFile(mediaItem.galleryId, mediaItem.number);
            if (videoPath) {
                mediaItem.src = videoPath;
                mediaItem.loaded = true;
                console.log(`✅ Znaleziono wideo: ${videoPath}`);
            } else {
                console.warn(`❌ Nie znaleziono pliku wideo dla ${mediaItem.number}`);
                mediaItem.src = mediaItem.thumbnail; // fallback
                mediaItem.loaded = false;
            }
        } else {
            // Znajdź pełny obraz
            const imagePath = await this.findFullImageFile(mediaItem.galleryId, mediaItem.number);
            if (imagePath) {
                // Sprawdź czy obraz się faktycznie ładuje
                const loaded = await this.preloadImage(imagePath);
                if (loaded) {
                    mediaItem.src = imagePath;
                    mediaItem.loaded = true;
                    console.log(`✅ Załadowano obraz: ${imagePath}`);
                } else {
                    console.warn(`❌ Nie udało się załadować obrazu: ${imagePath}`);
                    mediaItem.src = mediaItem.thumbnail; // fallback
                    mediaItem.loaded = false;
                }
            } else {
                console.warn(`❌ Nie znaleziono pełnego obrazu dla ${mediaItem.number}`);
                mediaItem.src = mediaItem.thumbnail; // fallback
                mediaItem.loaded = false;
            }
        }
        
        return mediaItem;
    }
    
    async findFullImageFile(galleryId, imageNumber) {
        // Znajdź pełny obraz (bez 'm' w nazwie)
        const extensions = ['jpg', 'jpeg', 'png', 'webp'];
        
        for (const ext of extensions) {
            const imagePath = `galeria/${galleryId}/${imageNumber}.${ext}`;
            
            try {
                const exists = await this.checkImageExists(imagePath);
                if (exists) {
                    return imagePath;
                }
            } catch (e) {
                // Continue to next extension
            }
        }
        
        return null;
    }
    
    async preloadImage(imagePath) {
        // Preładuj obraz do pamięci
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
        });
    }



    async findVideoFile(galleryId, videoNumber) {
        // Znajdź plik wideo dla danego numeru
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
        
        for (const ext of videoExtensions) {
            const videoPath = `galeria/${galleryId}/${videoNumber}.${ext}`;
            
            try {
                // Sprawdzamy czy plik wideo istnieje podobnie jak obrazy
                const exists = await this.checkVideoExists(videoPath);
                if (exists) {
                    return videoPath;
                }
            } catch (e) {
                // Continue to next extension
            }
        }
        
        return null; // Nie znaleziono pliku wideo
    }

    async checkVideoExists(src) {
        return new Promise((resolve) => {
            // Dla wideo używamy fetch HEAD request
            fetch(src, { method: 'HEAD' })
                .then(response => {
                    resolve(response.ok);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    }
    

    

    
    checkImageExists(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }
    
    // OPTYMALIZOWANA wersja sprawdzania istnienia plików
    checkImageExistsFast(src) {
        // Używaj fetch HEAD request dla szybszego sprawdzania
        return fetch(src, { 
            method: 'HEAD',
            cache: 'force-cache' // Wykorzystaj cache przeglądarki
        })
        .then(response => response.ok)
        .catch(() => false);
    }
    
    updateModalContent() {
        const project = this.projectsData[this.currentGallery] || {};
        
        // Update title
        const titleEl = this.modal.querySelector('.modal-title');
        const subtitleMobileEl = this.modal.querySelector('.modal-subtitle-mobile');
        
        if (titleEl) {
            titleEl.textContent = project.title || 'Realizacja';
        }
        
        if (subtitleMobileEl) {
            subtitleMobileEl.textContent = project.location || '';
        }
        
        // Update description section
        const descriptionTextEl = this.modal.querySelector('.description-text');
        const descriptionEl = this.modal.querySelector('.modal-description');
        
        if (descriptionTextEl && project.description) {
            descriptionTextEl.textContent = project.description;
            
            // Dynamically adjust padding based on description length
            if (descriptionEl) {
                if (project.description.length < 50) {
                    descriptionEl.classList.add('short-text');
                } else {
                    descriptionEl.classList.remove('short-text');
                }
            }
        }
        
        // Generate thumbnails
        this.generateThumbnails();
        
        // AUTOMATYCZNIE WYBIERZ PIERWSZĄ MINIATURKĘ
        if (this.images.length > 0) {
            console.log('=== AUTOMATYCZNE KLIKNIĘCIE PIERWSZEJ MINIATURKI ===');
            setTimeout(() => {
                this.showMediaItem(0);
            }, 50); // Krótkie opóźnienie żeby DOM się zaktualizował
        }
        
        // Update counter
        this.updateCounter();
    }
    
    generateThumbnails() {
        const thumbnailsContainer = this.modal.querySelector('.gallery-thumbnails');
        if (!thumbnailsContainer) return;
        
        thumbnailsContainer.innerHTML = '';
        
        // OPTYMALIZACJA: Użyj DocumentFragment dla lepszej wydajności
        const fragment = document.createDocumentFragment();
        
        this.images.forEach((image, index) => {
            const thumbnailWrapper = document.createElement('div');
            thumbnailWrapper.className = 'thumbnail-wrapper';
            thumbnailWrapper.style.position = 'relative';
            thumbnailWrapper.style.display = 'inline-block';
            
            const thumbnail = document.createElement('img');
            thumbnail.src = image.thumbnail; // Użyj miniaturki zamiast pełnego obrazu
            thumbnail.alt = image.alt;
            thumbnail.className = 'thumbnail';
            thumbnail.style.cursor = 'pointer';
            
            // OPTYMALIZACJA: Lazy loading dla miniaturek (nawet jeśli są małe)
            thumbnail.loading = 'lazy';
            thumbnail.decoding = 'async';
            
            // OPTYMALIZACJA: Dodaj placeholder podczas ładowania
            thumbnail.style.backgroundColor = '#f0f0f0';
            
            // Dodaj ikonę play dla wideo
            if (image.type === 'video') {
                const playIcon = document.createElement('div');
                playIcon.className = 'video-play-icon';
                playIcon.innerHTML = '▶';
                playIcon.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    pointer-events: none;
                `;
                thumbnailWrapper.appendChild(playIcon);
            }
            
            // Add click handler with proper binding
            thumbnail.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.isDragging) {
                    console.log(`=== KLIKNIĘTO MINIATURKĘ ${index} ===`);
                    this.showMediaItem(index);
                }
            });
            
            // Add hover effect
            thumbnail.addEventListener('mouseenter', () => {
                if (!this.isDragging) {
                    thumbnail.style.transform = 'scale(1.05)';
                }
            });
            
            thumbnail.addEventListener('mouseleave', () => {
                if (!thumbnail.classList.contains('active') && !this.isDragging) {
                    thumbnail.style.transform = 'scale(1)';
                }
            });
            
            thumbnailWrapper.appendChild(thumbnail);
            fragment.appendChild(thumbnailWrapper); // Dodaj do fragmentu
        });
        
        // OPTYMALIZACJA: Dodaj wszystkie miniaturki jednocześnie
        thumbnailsContainer.appendChild(fragment);
        
        // Add drag & drop functionality
        this.setupThumbnailsDrag(thumbnailsContainer);
    }
    
    async showMediaItem(index) {
        if (index < 0 || index >= this.images.length) return;
        
        console.log(`=== POKAZYWANIE ELEMENTU ${index} ===`);
        
        this.currentImageIndex = index;
        
        // Hide overlay when changing image
        this.hideOverlay();
        
        // NATYCHMIAST ukryj aktualny obraz/wideo
        this.hideCurrentMedia();
        
        // Zatrzymaj poprzednie wideo jeśli było odtwarzane
        const currentVideo = this.modal.querySelector('.gallery-main-video');
        if (currentVideo) {
            currentVideo.pause();
        }
        
        // OPÓŹNIONY LOADER - pokaż dopiero po 400ms jeśli się nie załadowało
        const loaderTimeout = setTimeout(() => {
            this.showMediaLoader();
        }, 400);
        
        try {
            // ZAŁADUJ PEŁNE MEDIA DOPIERO TERAZ (na żądanie)
            await this.loadFullMediaOnDemand(index);
            
            const mediaItem = this.images[index];
            console.log(`Pokazuję element ${index}:`, {
                thumbnail: mediaItem.thumbnail,
                src: mediaItem.src,
                loaded: mediaItem.loaded,
                type: mediaItem.type
            });
            
            // Get gallery container
            const galleryContainer = this.modal.querySelector('.gallery-container');
            if (!galleryContainer) return;
            
            if (mediaItem.type === 'video') {
                // Obsługa wideo
                this.showVideo(mediaItem, galleryContainer);
            } else {
                // Obsługa obrazu
                this.showImageContent(mediaItem, galleryContainer);
            }
            
            // Update thumbnail states and counter
            this.updateActiveThumbnail(index);
            
        } finally {
            // ANULUJ timeout i ukryj loader
            clearTimeout(loaderTimeout);
            this.hideMediaLoader();
        }
    }

    showVideo(mediaObj, container) {
        // Ukryj główny obraz
        const mainImage = container.querySelector('.gallery-main-image');
        if (mainImage) {
            mainImage.style.display = 'none';
        }
        
        let mainVideo = container.querySelector('.gallery-main-video');
        let videoWrapper = container.querySelector('.video-wrapper');
        let fullscreenBtn = container.querySelector('.video-fullscreen-btn');
        
        if (!mainVideo || !videoWrapper) {
            // Stwórz nowe elementy wideo
            
            // Stwórz wrapper dla wideo z przyciskiem fullscreen
            videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-wrapper';
            videoWrapper.style.cssText = `
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                display: block;
            `;
            
            mainVideo = document.createElement('video');
            mainVideo.className = 'gallery-main-video';
            mainVideo.muted = true; // Wycisz wideo
            mainVideo.loop = true; // Zapętl wideo
            mainVideo.playsInline = true; // Dla mobile
            mainVideo.preload = 'metadata';
            
            // Usuń domyślne kontrolki - będziemy mieć własne
            mainVideo.controls = false;
            
            mainVideo.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                cursor: zoom-in;
                transition: transform 0.2s ease, filter 0.2s ease;
            `;
            
            // Dodaj hover effects dla wideo
            mainVideo.addEventListener('mouseenter', () => {
                mainVideo.style.transform = 'scale(1.02)';
                mainVideo.style.filter = 'brightness(1.05)';
            });
            
            mainVideo.addEventListener('mouseleave', () => {
                mainVideo.style.transform = 'scale(1)';
                mainVideo.style.filter = 'brightness(1)';
            });
            
            // Przycisk fullscreen
            fullscreenBtn = document.createElement('button');
            fullscreenBtn.className = 'video-fullscreen-btn';
            fullscreenBtn.innerHTML = '⛶';
            fullscreenBtn.title = 'Pełny ekran';
            fullscreenBtn.style.cssText = `
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-size: 16px;
                cursor: pointer;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s;
            `;
            
            // Hover effect dla przycisku
            fullscreenBtn.addEventListener('mouseenter', () => {
                fullscreenBtn.style.background = 'rgba(0, 0, 0, 0.9)';
            });
            fullscreenBtn.addEventListener('mouseleave', () => {
                fullscreenBtn.style.background = 'rgba(0, 0, 0, 0.7)';
            });
            
            videoWrapper.appendChild(mainVideo);
            videoWrapper.appendChild(fullscreenBtn);
            container.appendChild(videoWrapper);
        } else {
            // Pokaż istniejące elementy wideo
            mainVideo.style.display = 'block';
            videoWrapper.style.display = 'block';
        }
        
        // Załaduj wideo
        mainVideo.src = mediaObj.src;
        mainVideo.poster = mediaObj.thumbnail; // Użyj miniaturki jako plakat
        
        // ODTWÓRZ WIDEO OD RAZU po załadowaniu metadanych
        mainVideo.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded, starting autoplay');
            mainVideo.play().catch(e => {
                console.log('Autoplay prevented by browser:', e);
            });
        });
        
        // Kliknięcie w wideo = play/pause
        mainVideo.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mainVideo.paused) {
                mainVideo.play();
                console.log('Video played');
            } else {
                mainVideo.pause();
                console.log('Video paused');
            }
        });
        
        // Przycisk fullscreen
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openFullscreen();
            });
        }
        
        // Zapobiegnij pokazaniu kontrolek przez przeglądarkę
        mainVideo.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Dodatkowe zabezpieczenie - usuń możliwość włączenia dźwięku
        mainVideo.addEventListener('volumechange', () => {
            if (!mainVideo.muted) {
                mainVideo.muted = true;
            }
        });
    }

    showImageContent(mediaObj, container) {
        // Upewnij się, że wideo jest ukryte
        const mainVideo = container.querySelector('.gallery-main-video');
        const videoWrapper = container.querySelector('.video-wrapper');
        if (mainVideo) {
            mainVideo.style.display = 'none';
        }
        if (videoWrapper) {
            videoWrapper.style.display = 'none';
        }
        
        const mainImage = container.querySelector('.gallery-main-image');
        if (mainImage) {
            mainImage.style.display = 'block';
            
            // ZAWSZE używaj pełnego obrazu na głównym bannerze (nie miniaturki)
            let imageToShow = mediaObj.src;
            console.log(`ShowImageContent - showing image: ${imageToShow}, thumbnail: ${mediaObj.thumbnail}`);
            
            // Jeśli obraz już jest załadowany, pokaż go od razu
            if (mediaObj.loaded && mediaObj.src) {
                mainImage.src = imageToShow;
                mainImage.alt = mediaObj.alt;
                mainImage.style.opacity = '1';
                this.addMainImageClickListener();
                return;
            }
            
            // Pokaż miniaturkę jako placeholder podczas ładowania pełnego obrazu
            mainImage.src = mediaObj.thumbnail;
            mainImage.style.opacity = '0.6';
            mainImage.style.filter = 'blur(2px)';
            
            // Create new image to preload pełny obraz
            const newImg = new Image();
            newImg.onload = () => {
                // Płynne przejście do pełnego obrazu
                mainImage.style.transition = 'all 0.3s ease';
                mainImage.src = newImg.src;
                mainImage.alt = mediaObj.alt;
                mainImage.style.opacity = '1';
                mainImage.style.filter = 'none';
                
                // Dodaj event listener do głównego obrazu po załadowaniu
                this.addMainImageClickListener();
                
                console.log('✅ Obraz pełny załadowany:', imageToShow);
            };
            newImg.onerror = () => {
                console.error('❌ Błąd ładowania obrazu:', imageToShow);
                // Zostaw miniaturkę jako fallback
                mainImage.style.opacity = '1';
                mainImage.style.filter = 'none';
            };
            newImg.src = imageToShow;
        }
    }
    
    updateActiveThumbnail(index) {
        // Update active thumbnail
        const thumbnails = this.modal.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, i) => {
            const isActive = i === index;
            thumb.classList.toggle('active', isActive);
            
            // Update transform for active state
            if (isActive) {
                thumb.style.transform = 'scale(1.05)';
            } else {
                thumb.style.transform = 'scale(1)';
            }
        });
        
        // Update counter
        this.updateCounter();
    }
    
    prevImage() {
        const newIndex = this.currentImageIndex > 0 ? 
            this.currentImageIndex - 1 : 
            this.images.length - 1;
        this.showMediaItem(newIndex);
    }
    
    nextImage() {
        const newIndex = this.currentImageIndex < this.images.length - 1 ? 
            this.currentImageIndex + 1 : 
            0;
        this.showMediaItem(newIndex);
    }
    
    updateCounter() {
        const counterEl = this.modal.querySelector('.gallery-counter');
        if (counterEl) {
            counterEl.textContent = `${this.currentImageIndex + 1} / ${this.images.length}`;
        }
    }
    
    showLoading() {
        const container = this.modal.querySelector('.gallery-container');
        if (container) {
            container.innerHTML = '<div class="gallery-loading"></div>';
        }
    }
    
    hideLoading() {
        const loading = this.modal.querySelector('.gallery-loading');
        if (loading) {
            loading.remove();
        }
        
        // Restore gallery container structure
        const container = this.modal.querySelector('.gallery-container');
        if (container && !container.querySelector('.gallery-main-image')) {
            container.innerHTML = `
                <img class="gallery-main-image" src="" alt="">
                <button class="gallery-nav prev">‹</button>
                <button class="gallery-nav next">›</button>
                <div class="gallery-counter">1 / 5</div>
                <button class="gallery-info-btn">Pokaż opis</button>
                <div class="gallery-image-overlay">
                    <div class="gallery-image-info">
                        <h3 class="image-title">Nazwa projektu</h3>
                        <p class="image-description">Opis projektu</p>
                    </div>
                </div>
            `;
            
            // Re-bind navigation events
            const prevBtn = container.querySelector('.gallery-nav.prev');
            const nextBtn = container.querySelector('.gallery-nav.next');
            const infoBtn = container.querySelector('.gallery-info-btn');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.prevImage());
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.nextImage());
            }
            
            if (infoBtn) {
                infoBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleOverlay();
                });
            }
            
            // Dodaj event listener do głównego obrazu
            this.addMainImageClickListener();
        }
    }
    
    // NOWY LOADER dla pojedynczych mediów
    showMediaLoader() {
        // Znajdź lub stwórz minimalistyczny loader
        const galleryContainer = this.modal.querySelector('.gallery-container');
        if (!galleryContainer) return;
        
        let mediaLoader = galleryContainer.querySelector('.media-loader');
        
        if (!mediaLoader) {
            mediaLoader = document.createElement('div');
            mediaLoader.className = 'media-loader';
            mediaLoader.innerHTML = `
                <div class="spinner-dots">
                    <div class="dot1"></div>
                    <div class="dot2"></div>
                    <div class="dot3"></div>
                </div>
            `;
            
            // MINIMALISTYCZNY LOADER - tylko kropki, bez tła
            mediaLoader.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1500;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            `;
            
            galleryContainer.appendChild(mediaLoader);
            
            // Dodaj style dla animacji kropek i cursora
            this.addSpinnerStyles();
        }
        
        // Pokaż loader z małą animacją wejścia
        mediaLoader.style.display = 'flex';
        mediaLoader.style.opacity = '1';
        
        console.log('🔄 Pokazuję minimalistyczny loader (tylko kropki)');
    }
    
    hideMediaLoader() {
        const galleryContainer = this.modal.querySelector('.gallery-container');
        if (!galleryContainer) return;
        
        const mediaLoader = galleryContainer.querySelector('.media-loader');
        if (mediaLoader) {
            // Płynne ukrycie loadera
            mediaLoader.style.transition = 'opacity 0.2s ease';
            mediaLoader.style.opacity = '0';
            
            // Ukryj kompletnie po animacji
            setTimeout(() => {
                if (mediaLoader) {
                    mediaLoader.style.display = 'none';
                }
            }, 200);
        }
    }
    
    // NATYCHMIAST ukryj aktualny obraz/wideo
    hideCurrentMedia() {
        const galleryContainer = this.modal.querySelector('.gallery-container');
        if (!galleryContainer) return;
        
        // Ukryj główny obraz
        const mainImage = galleryContainer.querySelector('.gallery-main-image');
        if (mainImage) {
            mainImage.style.display = 'none';
            console.log('🚫 Ukryto główny obraz');
        }
        
        // Ukryj wideo
        const mainVideo = galleryContainer.querySelector('.gallery-main-video');
        if (mainVideo) {
            mainVideo.style.display = 'none';
            console.log('🚫 Ukryto wideo');
        }
        
        // Ukryj cały wrapper wideo jeśli istnieje
        const videoWrapper = galleryContainer.querySelector('.video-wrapper');
        if (videoWrapper) {
            videoWrapper.style.display = 'none';
            console.log('🚫 Ukryto wrapper wideo');
        }
    }
    
    // Dodaj style dla animacji spinner
    addSpinnerStyles() {
        // Sprawdź czy style już istnieją
        if (document.getElementById('media-loader-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'media-loader-styles';
        style.textContent = `
            .spinner-dots {
                display: flex;
                gap: 10px;
                align-items: center;
                justify-content: center;
            }
            
            .spinner-dots div {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.9);
                animation: spinner-pulse 1.0s ease-in-out infinite both;
            }
            
            .spinner-dots .dot1 {
                animation-delay: -0.2s;
            }
            
            .spinner-dots .dot2 {
                animation-delay: -0.1s;
            }
            
            .spinner-dots .dot3 {
                animation-delay: 0s;
            }
            
            @keyframes spinner-pulse {
                0%, 80%, 100% {
                    transform: scale(0.5);
                    opacity: 0.3;
                }
                40% {
                    transform: scale(1.2);
                    opacity: 1;
                }
            }
            
            .media-loader {
                animation: fadeInDots 0.3s ease-out;
            }
            
            @keyframes fadeInDots {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            /* Style dla głównego obrazu i wideo galerii */
            .gallery-main-image, .gallery-main-video {
                cursor: zoom-in !important;
                transition: transform 0.2s ease, filter 0.2s ease !important;
            }
            
            .gallery-main-image:hover, .gallery-main-video:hover {
                transform: scale(1.02) !important;
                filter: brightness(1.05) !important;
            }
            
            /* Fallback dla przeglądarek które nie wspierają zoom-in */
            .gallery-main-image:not([style*="zoom-in"]), 
            .gallery-main-video:not([style*="zoom-in"]) {
                cursor: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="21 21l-4.35-4.35"/><text x="11" y="15" text-anchor="middle" fill="white" font-size="8">+</text></svg>') 12 12, pointer !important;
            }
            
            /* Style dla fullscreen media */
            #fullscreen-image, #fullscreen-video {
                cursor: zoom-out !important;
                transition: filter 0.2s ease !important;
            }
            
            #fullscreen-image:hover, #fullscreen-video:hover {
                filter: brightness(1.1) !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    getProjectTitle(galleryId) {
        const project = this.projectsData[galleryId];
        return project ? project.title : 'Realizacja';
    }
    
    // Usunięte metody overlay - nie używane już
    toggleOverlay() {
        // Pusta funkcja - overlay został usunięty
    }
    
    showOverlay() {
        // Pusta funkcja - overlay został usunięty
    }
    
    hideOverlay() {
        // Pusta funkcja - overlay został usunięty
    }
    
    openFullscreen() {
        console.log('🔥 openFullscreen() called');
        console.log('🔥 this.fullscreen:', this.fullscreen);
        console.log('🔥 this.images.length:', this.images.length);
        console.log('🔥 this.currentImageIndex:', this.currentImageIndex);
        // alert('openFullscreen() wywołane!'); // Usunięty alert - może blokować
        
        if (!this.fullscreen || this.images.length === 0) {
            console.warn('Cannot open fullscreen - missing fullscreen element or no images');
            return;
        }
        
        // Użyj ID selektorów które pasują do głównego index.html
        const fullscreenImage = this.fullscreen.querySelector('#fullscreen-image');
        const fullscreenVideo = this.fullscreen.querySelector('#fullscreen-video');
        const currentMedia = this.images[this.currentImageIndex];
        
        console.log('🔥 fullscreenImage:', fullscreenImage);
        console.log('🔥 fullscreenVideo:', fullscreenVideo);
        console.log('🔥 currentMedia:', currentMedia);
        
        if (currentMedia.type === 'video' && fullscreenVideo) {
            // Pokaż wideo w fullscreen
            fullscreenImage.style.display = 'none';
            fullscreenVideo.style.display = 'block';
            fullscreenVideo.src = currentMedia.src;
            fullscreenVideo.poster = currentMedia.thumbnail;
            
            // Skonfiguruj wideo dla fullscreen
            fullscreenVideo.muted = true;
            fullscreenVideo.loop = true;
            fullscreenVideo.playsInline = true;
            
            // Odtwórz automatycznie w fullscreen
            fullscreenVideo.addEventListener('loadedmetadata', () => {
                fullscreenVideo.play().catch(e => {
                    console.log('Fullscreen video autoplay prevented:', e);
                });
            });
            
        } else if (fullscreenImage) {
            // Pokaż obraz w fullscreen
            fullscreenVideo.style.display = 'none';
            fullscreenImage.style.display = 'block';
            fullscreenImage.src = currentMedia.src;
            fullscreenImage.alt = currentMedia.alt;
        }
        
        // Dodaj event listenery do kliknięcia w media (obraz/wideo) żeby zamknąć fullscreen
        this.addFullscreenMediaClickListeners();
        
        console.log('Adding "show" class to fullscreen element');
        this.fullscreen.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        console.log('Fullscreen should now be visible. Classes:', this.fullscreen.classList.toString());
    }
    
    addFullscreenMediaClickListeners() {
        if (!this.fullscreen) return;
        
        const fullscreenImage = this.fullscreen.querySelector('#fullscreen-image');
        const fullscreenVideo = this.fullscreen.querySelector('#fullscreen-video');
        
        // Usuń poprzednie listenery jeśli istnieją
        if (this.fullscreenImageClickHandler) {
            fullscreenImage.removeEventListener('click', this.fullscreenImageClickHandler);
        }
        if (this.fullscreenVideoClickHandler) {
            fullscreenVideo.removeEventListener('click', this.fullscreenVideoClickHandler);
        }
        
        // Allow natural zoom behavior - no click handler on image
        if (fullscreenImage) {
            // Remove any existing click handlers to allow natural zoom
            this.fullscreenImageClickHandler = null;
            
            // Natural cursor to indicate zoom capability
            fullscreenImage.style.cursor = 'default';
            fullscreenImage.title = 'Użyj gestów do powiększania lub kliknij tło aby zamknąć';
        }
        
        if (fullscreenVideo) {
            // Allow natural zoom behavior - no click handler on video
            this.fullscreenVideoClickHandler = null;
            
            // Natural cursor
            fullscreenVideo.style.cursor = 'default';
            fullscreenVideo.title = 'Użyj gestów lub kliknij tło aby zamknąć';
        }
    }
    
    closeFullscreen() {
        if (this.fullscreen) {
            // Zatrzymaj wideo jeśli jest odtwarzane
            const fullscreenVideo = this.fullscreen.querySelector('#fullscreen-video');
            if (fullscreenVideo) {
                fullscreenVideo.pause();
            }
            
            this.fullscreen.classList.remove('show');
            
            // Only restore overflow if modal is not active
            if (!this.modal || !this.modal.classList.contains('show')) {
                document.body.style.overflow = '';
            }
        }
    }
    

    

    
    updateFullscreenImage() {
        if (!this.fullscreen || !this.fullscreen.classList.contains('show')) return;
        
        const fullscreenImage = this.fullscreen.querySelector('#fullscreen-image');
        const fullscreenVideo = this.fullscreen.querySelector('#fullscreen-video');
        const currentMedia = this.images[this.currentImageIndex];
        
        if (currentMedia.type === 'video' && fullscreenVideo) {
            // Aktualizuj wideo w fullscreen
            fullscreenImage.style.display = 'none';
            fullscreenVideo.style.display = 'block';
            fullscreenVideo.src = currentMedia.src;
            fullscreenVideo.poster = currentMedia.thumbnail;
        } else if (fullscreenImage) {
            // Aktualizuj obraz w fullscreen
            fullscreenVideo.style.display = 'none';
            fullscreenImage.style.display = 'block';
            fullscreenImage.src = currentMedia.src;
            fullscreenImage.alt = currentMedia.alt;
        }
    }
    
    setupThumbnailsDrag(container) {
        let isMouseDown = false;
        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;
        const dragThreshold = 5; // pixels
        
        // Cursor changes
        container.addEventListener('mouseenter', () => {
            if (!isDragging) {
                container.style.cursor = 'grab';
            }
        });
        
        container.addEventListener('mouseleave', () => {
            container.style.cursor = 'default';
        });

        // Mouse events
        container.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            // Don't prevent default here - let clicks work normally
        });
        
        container.addEventListener('mouseleave', () => {
            isMouseDown = false;
            isDragging = false;
            this.isDragging = false;
            container.classList.remove('dragging');
            container.style.cursor = 'default';
        });
        
        container.addEventListener('mouseup', () => {
            isMouseDown = false;
            isDragging = false;
            container.classList.remove('dragging');
            container.style.cursor = 'grab';
            // Clear dragging state after a short delay
            setTimeout(() => {
                this.isDragging = false;
            }, 10);
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            
            const x = e.pageX - container.offsetLeft;
            const distance = Math.abs(x - startX);
            
            // Start dragging only if moved beyond threshold
            if (distance > dragThreshold && !isDragging) {
                isDragging = true;
                this.isDragging = true;
                container.classList.add('dragging');
                container.style.cursor = 'grabbing';
                e.preventDefault();
            }
            
            if (isDragging) {
                e.preventDefault();
                const walk = (x - startX) * 2; // Multiply for faster scroll
                container.scrollLeft = scrollLeft - walk;
            }
        });
        
        // Touch scrolling for mobile uses natural browser behavior
    }
    
    // Touch navigation removed - using natural browser behavior
    
    updateFullscreenImage() {
        // Aktualizuj zawartość fullscreen po zmianie obrazu
        if (!this.fullscreen || !this.fullscreen.classList.contains('show')) return;
        
        const fullscreenImage = this.fullscreen.querySelector('#fullscreen-image');
        const fullscreenVideo = this.fullscreen.querySelector('#fullscreen-video');
        const currentMedia = this.images[this.currentImageIndex];
        
        if (!currentMedia) return;
        
        console.log(`Updating fullscreen to show: ${currentMedia.src} (type: ${currentMedia.type})`);
        
        if (currentMedia.type === 'video' && fullscreenVideo) {
            // Pokaż wideo w fullscreen
            if (fullscreenImage) fullscreenImage.style.display = 'none';
            fullscreenVideo.style.display = 'block';
            fullscreenVideo.src = currentMedia.src;
            fullscreenVideo.poster = currentMedia.thumbnail;
        } else if (fullscreenImage) {
            // Pokaż obraz w fullscreen
            if (fullscreenVideo) fullscreenVideo.style.display = 'none';
            fullscreenImage.style.display = 'block';
            fullscreenImage.src = currentMedia.src;
            fullscreenImage.alt = currentMedia.alt;
        }
    }
    
    addMainImageClickListener() {
        // Dodaj event listener do głównego obrazu gdy istnieje
        const mainImage = this.modal.querySelector('.gallery-main-image');
        console.log('🔥 Looking for main image:', mainImage);
        console.log('🔥 Main image src:', mainImage ? mainImage.src : 'NO IMAGE');
        console.log('🔥 Main image style.display:', mainImage ? mainImage.style.display : 'NO IMAGE');
        
        if (mainImage) {
            console.log('🔥 Adding HIGH PRIORITY click listener to main image');
            
            // Usuń poprzednie listenery
            if (this.mainImageClickHandler) {
                mainImage.removeEventListener('click', this.mainImageClickHandler, true);
                mainImage.removeEventListener('click', this.mainImageClickHandler, false);
            }
            
            // Stwórz bound handler z wysokim priorytetem
            this.mainImageClickHandler = (e) => {
                console.log('🔥🔥🔥 MAIN IMAGE CLICKED WITH HIGH PRIORITY!');
                
                // Zatrzymaj propagację NATYCHMIAST
                e.stopImmediatePropagation();
                e.preventDefault();
                
                // Wywołaj fullscreen
                this.openFullscreen();
            };
            
            // Dodaj listener w capture phase (wyższy priorytet niż bubble phase)
            mainImage.addEventListener('click', this.mainImageClickHandler, true);
            
            // Dodaj też fallback w bubble phase
            mainImage.addEventListener('click', this.mainImageClickHandler, false);
            
            // Dodaj też mousedown event jako backup
            mainImage.addEventListener('mousedown', (e) => {
                console.log('🔥 Mouse down on main image');
                e.stopPropagation();
            }, true);
            
            // Style dla lupki powiększającej
            mainImage.style.cursor = 'zoom-in';
            mainImage.style.zIndex = '1000';
            mainImage.title = 'Kliknij aby powiększyć';
            mainImage.style.transition = 'transform 0.2s ease, filter 0.2s ease';
            
            // Dodaj hover effects
            mainImage.addEventListener('mouseenter', () => {
                mainImage.style.transform = 'scale(1.02)';
                mainImage.style.filter = 'brightness(1.05)';
            });
            
            mainImage.addEventListener('mouseleave', () => {
                mainImage.style.transform = 'scale(1)';
                mainImage.style.filter = 'brightness(1)';
            });
            
            // BACKUP - dodaj onclick bezpośrednio do HTML (omija wszystkie inne event listenery)
            mainImage.onclick = (e) => {
                console.log('Main image clicked - opening fullscreen');
                e.stopPropagation();
                e.preventDefault();
                this.openFullscreen();
                return false;
            };
            
            console.log('🔥 HIGH PRIORITY listeners and onclick added');
        } else {
            console.warn('🔥 Main image not found for direct listener');
            // Spróbuj ponownie za chwilę
            setTimeout(() => this.addMainImageClickListener(), 200);
        }
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GalleryModal();
});

// Export for potential external use
window.GalleryModal = GalleryModal;