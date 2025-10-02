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
        
        // CACHE dla sprawdzania istnienia plików - zmniejsza liczbę żądań HTTP
        this.fileExistsCache = new Map();
        
        // CACHE dla opisów galerii
        this.descriptionsCache = new Map();
        
        // Debouncing dla operacji sprawdzania plików
        this.pendingChecks = new Map();
        
        // Drag & drop state
        this.isDragging = false;
        this.startX = 0;
        this.scrollLeft = 0;
        
        // Fullscreen close timeout for smart tap detection
        this.closeTimeout = null;
        
        this.init();
    }
    
    // Zarządzanie cache - czyść gdy stanie się za duży
    manageCacheSize() {
        const MAX_CACHE_SIZE = 1000; // maksymalnie 1000 wpisów w cache
        
        if (this.fileExistsCache.size > MAX_CACHE_SIZE) {
            console.log('🧹 Czyszczenie cache plików - za dużo wpisów');
            this.fileExistsCache.clear();
        }
        
        if (this.descriptionsCache.size > 100) {
            console.log('🧹 Czyszczenie cache opisów - za dużo wpisów');
            this.descriptionsCache.clear();
        }
    }
    
    init() {
        console.log('🚀 Inicjalizacja Gallery Modal...');
        
        // Load projects data from JSON script tag
        const dataScript = document.getElementById('projects-data');
        if (dataScript) {
            try {
                this.projectsData = JSON.parse(dataScript.textContent);
                console.log('✅ Projects data załadowane');
            } catch (e) {
                console.error('❌ Error parsing projects data:', e);
            }
        }
        
        // Get modal and fullscreen elements
        this.modal = document.getElementById('gallery-modal');
        this.fullscreen = document.getElementById('gallery-fullscreen');
        
        if (!this.modal) {
            console.error('❌ Nie znaleziono elementu gallery-modal!');
            return;
        }
        
        if (!this.fullscreen) {
            console.error('❌ Nie znaleziono elementu gallery-fullscreen!');
        }
        
        console.log('✅ Elementy DOM znalezione');
        
        // Bind events
        this.bindEvents();
        
        console.log('✅ Gallery Modal inicjalizacja zakończona');
    }
    
    bindEvents() {
        console.log('🔗 Bindowanie eventów...');
        
        if (!this.modal) {
            console.error('❌ Nie można bindować eventów - brak elementu modal');
            return;
        }
        
        // Close modal events
        const closeBtn = this.modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
            console.log('✅ Close button event dodany');
        } else {
            console.warn('⚠️ Nie znaleziono close button');
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
            
            // Fullscreen navigation buttons
            const fullscreenPrevBtn = this.fullscreen.querySelector('#fullscreen-nav-prev');
            const fullscreenNextBtn = this.fullscreen.querySelector('#fullscreen-nav-next');
            
            if (fullscreenPrevBtn) {
                fullscreenPrevBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    this.prevImage();
                    await this.updateFullscreenImage();
                    console.log('Fullscreen: Previous image');
                });
                console.log('✅ Fullscreen prev button event dodany');
            }
            
            if (fullscreenNextBtn) {
                fullscreenNextBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    this.nextImage();
                    await this.updateFullscreenImage();
                    console.log('Fullscreen: Next image');
                });
                console.log('✅ Fullscreen next button event dodany');
            }
            
            // Keyboard navigation in fullscreen
            document.addEventListener('keydown', async (e) => {
                if (this.fullscreen.classList.contains('show')) {
                    if (e.key === 'Escape') {
                        this.closeFullscreen();
                    } else if (e.key === 'ArrowLeft') {
                        this.prevImage();
                        await this.updateFullscreenImage();
                    } else if (e.key === 'ArrowRight') {
                        this.nextImage();
                        await this.updateFullscreenImage();
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
            
            // Hide loading - modal jest gotowy!
            this.hideLoading();
            
            // Ładuj opis w tle, żeby nie opóźniać otwarcia modala
            setTimeout(() => {
                this.loadAndUpdateDescription();
            }, 100);
            
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
        const startTime = performance.now();
        
        // SPRAWDŹ CACHE
        if (this.galleriesCache.has(galleryId)) {
            console.log(`✅ Galeria ${galleryId} załadowana z cache`);
            this.images = [...this.galleriesCache.get(galleryId)]; // kopia z cache
            const endTime = performance.now();
            console.log(`✅ Cache hit: ${this.images.length} miniaturek w ${(endTime - startTime).toFixed(2)}ms`);
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
        
        const endTime = performance.now();
        console.log(`✅ Przygotowano tablicę miniaturek: ${this.images.length} w ${(endTime - startTime).toFixed(2)}ms`);
        
        if (this.images.length === 0) {
            throw new Error('Nie znaleziono żadnych mediów w galerii');
        }
    }
    
    // PRELOADOWANIE miniaturek w tle dla błyskawicznego wyświetlania
    preloadThumbnailsInBackground(mediaItems) {
        console.log('🚀 Rozpoczynam inteligentny preload miniaturek...');
        
        // Najpierw załaduj pierwsze 5 miniaturek natychmiastowo (najbardziej prawdopodobne do wyświetlenia)
        const priorityCount = Math.min(5, mediaItems.length);
        const priorityItems = mediaItems.slice(0, priorityCount);
        const remainingItems = mediaItems.slice(priorityCount);
        
        // Załaduj priorytetowe miniaturki natychmiastowo
        priorityItems.forEach((item, index) => {
            if (!this.preloadedThumbnails.has(item.thumbnail)) {
                const img = new Image();
                img.onload = () => {
                    this.preloadedThumbnails.add(item.thumbnail);
                    console.log(`✅ Priority preload ${index + 1}/${priorityCount}: ${item.thumbnail}`);
                };
                img.onerror = () => {
                    console.warn(`❌ Failed priority preload: ${item.thumbnail}`);
                };
                img.src = item.thumbnail;
            }
        });
        
        // Pozostałe miniaturki ładuj z opóźnieniem, żeby nie blokować UI
        remainingItems.forEach((item, index) => {
            if (!this.preloadedThumbnails.has(item.thumbnail)) {
                setTimeout(() => {
                    const img = new Image();
                    img.onload = () => {
                        this.preloadedThumbnails.add(item.thumbnail);
                        console.log(`✅ Background preload ${priorityCount + index + 1}/${mediaItems.length}: ${item.thumbnail}`);
                    };
                    img.onerror = () => {
                        console.warn(`❌ Failed background preload: ${item.thumbnail}`);
                    };
                    img.src = item.thumbnail;
                }, (index + 1) * 100); // 100ms między każdą miniaturką
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
        console.log(`🔍 Szukam miniaturek dla galerii ${galleryId}...`);
        const startTime = performance.now();
        
        // Zarządzaj rozmiarem cache
        this.manageCacheSize();
        
        // Szybkie sprawdzenie czy galeria w ogóle istnieje (sprawdź m1.jpg)
        const quickCheck = await this.checkImageExistsFast(`galeria/${galleryId}/m1.jpg`);
        if (!quickCheck) {
            console.log(`⚠️ Galeria ${galleryId} prawdopodobnie nie istnieje (brak m1.jpg)`);
            // Nadal spróbuj, ale z ograniczonym zakresem
        }
        
        const thumbnails = [];
        
        // Funkcja do sprawdzania pojedynczego numeru z wszystkimi rozszerzeniami
        const checkThumbnailNumber = async (number, type) => {
            const prefix = type === 'image' ? 'm' : 'v';
            
            for (const ext of extensions) {
                const thumbPath = `galeria/${galleryId}/${prefix}${number}.${ext}`;
                const exists = await this.checkImageExistsFast(thumbPath);
                
                if (exists) {
                    return {
                        number: number,
                        path: thumbPath,
                        type: type,
                        priority: number
                    };
                }
            }
            return null;
        };
        
        // OPTYMALIZACJA: Sprawdzaj po kolei z ograniczoną równoległością (max 3 jednocześnie)
        const concurrentLimit = 3;
        const results = [];
        
        // Sprawdź miniaturki zdjęć (m1, m2, m3...)
        for (let i = 1; i <= 20; i += concurrentLimit) {
            const batch = [];
            for (let j = i; j < i + concurrentLimit && j <= 20; j++) {
                batch.push(checkThumbnailNumber(j, 'image'));
            }
            
            const batchResults = await Promise.all(batch);
            results.push(...batchResults.filter(result => result !== null));
            
            // Jeśli w tej partii nic nie znaleziono I już mamy jakieś wyniki, prawdopodobnie nie ma więcej plików
            if (batchResults.every(result => result === null)) {
                // Jeśli to była pierwsza partia i nic nie znaleziono, sprawdź jeszcze jedną
                if (i === 1) {
                    console.log(`🔍 Pierwsza partia pusta, sprawdzam jeszcze jedną partię zdjęć...`);
                    continue;
                }
                // Jeśli mamy już jakieś wyniki, przerwij
                if (results.length > 0) {
                    console.log(`🔍 Przerwano szukanie zdjęć na numerze ${i} - brak kolejnych plików`);
                    break;
                }
            }
        }
        
        // Sprawdź miniaturki wideo (v1, v2, v3...)
        for (let i = 1; i <= 20; i += concurrentLimit) {
            const batch = [];
            for (let j = i; j < i + concurrentLimit && j <= 20; j++) {
                batch.push(checkThumbnailNumber(j, 'video'));
            }
            
            const batchResults = await Promise.all(batch);
            const videoResults = batchResults.filter(result => result !== null);
            results.push(...videoResults);
            
            // Jeśli w tej partii nic nie znaleziono, sprawdź czy przerwać
            if (batchResults.every(result => result === null)) {
                // Jeśli to była pierwsza partia i nic nie znaleziono, sprawdź jeszcze jedną
                if (i === 1) {
                    console.log(`🔍 Pierwsza partia wideo pusta, sprawdzam jeszcze jedną partię...`);
                    continue;
                }
                // Jeśli nie ma wcześniejszych wyników wideo, przerwij
                const hasVideoResults = results.some(r => r.type === 'video');
                if (!hasVideoResults) {
                    console.log(`🔍 Przerwano szukanie wideo na numerze ${i} - brak plików wideo`);
                    break;
                }
            }
        }
        
        const endTime = performance.now();
        console.log(`✅ Znaleziono ${results.length} miniaturek dla galerii ${galleryId} w ${(endTime - startTime).toFixed(2)}ms`);
        return results.sort((a, b) => a.priority - b.priority);
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
                console.log(`🔄 Próba preloadowania obrazu: ${imagePath}`);
                // Sprawdź czy obraz się faktycznie ładuje
                const loaded = await this.preloadImage(imagePath);
                if (loaded) {
                    mediaItem.src = imagePath;
                    mediaItem.loaded = true;
                    console.log(`✅ Załadowano obraz: ${imagePath}`);
                } else {
                    console.warn(`❌ Nie udało się preloadować obrazu: ${imagePath}, sprawdzam czy plik fizycznie istnieje`);
                    
                    // Test HTTP dostępności
                    try {
                        const response = await fetch(imagePath, { method: 'HEAD' });
                        if (response.ok) {
                            console.log(`✅ Plik ${imagePath} jest dostępny przez HTTP (${response.status})`);
                            mediaItem.src = imagePath;
                            mediaItem.loaded = true;
                        } else {
                            console.warn(`❌ HTTP ${response.status} dla ${imagePath}, używam thumbnail`);
                            mediaItem.src = mediaItem.thumbnail;
                            mediaItem.loaded = false;
                        }
                    } catch (httpError) {
                        console.error(`❌ Błąd HTTP dla ${imagePath}:`, httpError);
                        mediaItem.src = mediaItem.thumbnail;
                        mediaItem.loaded = false;
                    }
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
        console.log(`🔍 Szukam pełnego obrazu dla galerii ${galleryId}, numer ${imageNumber}`);
        
        // Znajdź pełny obraz (bez 'm' w nazwie)
        const extensions = ['jpg', 'jpeg', 'png', 'webp'];
        
        for (const ext of extensions) {
            const imagePath = `galeria/${galleryId}/${imageNumber}.${ext}`;
            console.log(`🔍 Sprawdzam: ${imagePath}`);
            
            try {
                const exists = await this.checkImageExistsFast(imagePath);
                if (exists) {
                    console.log(`✅ Znaleziono pełny obraz: ${imagePath}`);
                    return imagePath;
                }
            } catch (e) {
                console.warn(`❌ Błąd sprawdzania ${imagePath}:`, e);
            }
        }
        
        console.warn(`❌ Nie znaleziono pełnego obrazu dla ${galleryId}/${imageNumber}`);
        return null;
    }
    
    async preloadImage(imagePath) {
        // Preładuj obraz do pamięci z timeoutem
        return new Promise((resolve) => {
            const img = new Image();
            let resolved = false;
            
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn(`⏰ Timeout preloadowania obrazu: ${imagePath}`);
                    resolve(false);
                }
            }, 10000); // 10 sekund timeout
            
            img.onload = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    console.log(`✅ Preload successful: ${imagePath}`);
                    console.log(`📏 Wymiary załadowanego obrazu: ${img.naturalWidth}x${img.naturalHeight}`);
                    resolve(true);
                }
            };
            
            img.onerror = (e) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    console.warn(`❌ Preload error dla ${imagePath}:`, e);
                    resolve(false);
                }
            };
            
            console.log(`🔄 Rozpoczynam preload: ${imagePath}`);
            console.log(`📊 Pełna URL do preload: ${window.location.origin}/${imagePath}`);
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
        // Sprawdź cache najpierw
        if (this.fileExistsCache.has(src)) {
            return Promise.resolve(this.fileExistsCache.get(src));
        }
        
        // Sprawdź czy już sprawdzamy ten plik (zapobiega duplikatom)
        if (this.pendingChecks.has(src)) {
            return this.pendingChecks.get(src);
        }
        
        // Utwórz promise dla sprawdzenia z timeoutem
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekund timeout
        
        const checkPromise = fetch(src, { 
            method: 'HEAD',
            cache: 'force-cache', // Wykorzystaj cache przeglądarki
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            const exists = response.ok;
            this.fileExistsCache.set(src, exists);
            this.pendingChecks.delete(src); // Usuń z pending
            return exists;
        })
        .catch(error => {
            clearTimeout(timeoutId);
            // Jeśli to timeout lub błąd sieci, uznaj że plik nie istnieje
            this.fileExistsCache.set(src, false);
            this.pendingChecks.delete(src); // Usuń z pending
            if (error.name === 'AbortError') {
                console.warn(`⏰ Timeout checking file: ${src}`);
            }
            return false;
        });
        
        // Zapisz promise w pending
        this.pendingChecks.set(src, checkPromise);
        return checkPromise;
    }
    
    updateModalContent() {
        const project = this.projectsData[this.currentGallery] || {};
        
        // Update title
        const titleEl = this.modal.querySelector('.modal-title');
        const subtitleMobileEl = this.modal.querySelector('.modal-subtitle-mobile');
        
        if (titleEl) {
            // Użyj dynamicznie ładowanego tytułu z galerii
            titleEl.textContent = this.getProjectTitle(this.currentGallery);
        }
        
        if (subtitleMobileEl) {
            subtitleMobileEl.textContent = project.location || '';
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
            fullscreenBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.openFullscreen();
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
        // Sprawdź, czy tytuł jest dostępny w elemencie galerii
        const galleryItem = document.querySelector(`[data-gallery="${galleryId}"] h3`);
        if (galleryItem && galleryItem.textContent !== 'Realizacja') {
            return galleryItem.textContent;
        }
        
        // Fallback do starych danych JSON
        const project = this.projectsData[galleryId];
        return project ? project.title : 'Realizacja';
    }

    // ==========================================
    // ŁADOWANIE OPISÓW Z PLIKÓW TEKSTOWYCH
    // ==========================================

    /**
     * Pobiera język strony z atrybutu lang elementu html
     */
    getCurrentLanguage() {
        return document.documentElement.lang || 'pl';
    }

    /**
     * Parsuje plik opis.txt i wyodrębnia pełny opis dla określonego języka
     */
    parseFullDescriptionFile(content, language) {
        let description = '';
        
        // Spróbuj najpierw format z separatorami ---
        if (content.includes('---')) {
            const sections = content.split(/^---$/m);
            
            for (const section of sections) {
                const trimmedSection = section.trim();
                if (trimmedSection.startsWith(language)) {
                    // Usuń kod języka z początku
                    description = trimmedSection.substring(language.length).trim();
                    break;
                }
            }
        } else {
            // Format bez separatorów (jak w pliku 1) - szukaj kodu języka na początku linii
            const lines = content.split('\n');
            let foundLanguage = false;
            let currentDescription = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Sprawdź, czy jest to linia z kodem języka
                if (line === language) {
                    foundLanguage = true;
                    currentDescription = [];
                    continue;
                }
                
                // Jeśli znaleźliśmy język, zbieraj linie opisu
                if (foundLanguage) {
                    // Sprawdź, czy nie jest to inny język (koniec sekcji)
                    if (line === 'pl' || line === 'en' || line === 'de') {
                        break;
                    }
                    
                    currentDescription.push(lines[i]);
                }
            }
            
            description = currentDescription.join('\n').trim();
        }
        
        // Jeśli nie znaleziono opisu dla danego języka, spróbuj angielski
        if (!description && language !== 'en') {
            return this.parseFullDescriptionFile(content, 'en');
        }
        
        return description || null; // Zwróć null jeśli brak opisu
    }

    /**
     * Ładuje pełny opis projektu z pliku opis.txt dla danego katalogu galerii
     */
    async loadFullGalleryDescription(galleryNumber, language) {
        const cacheKey = `${galleryNumber}-${language}`;
        
        // Sprawdź cache opisów
        if (this.descriptionsCache.has(cacheKey)) {
            return this.descriptionsCache.get(cacheKey);
        }
        
        try {
            const response = await fetch(`galeria/${galleryNumber}/opis.txt`);
            
            if (response.ok) {
                const content = await response.text();
                const description = this.parseFullDescriptionFile(content, language);
                
                // Zapisz w cache
                this.descriptionsCache.set(cacheKey, description);
                return description;
            } else {
                console.log(`No description file found for gallery ${galleryNumber}`);
                // Zapisz w cache, że nie ma opisu
                this.descriptionsCache.set(cacheKey, null);
                return null; // Brak pliku - zwróć null
            }
        } catch (error) {
            console.log(`Error loading description for gallery ${galleryNumber}:`, error);
            // Zapisz w cache, że był błąd
            this.descriptionsCache.set(cacheKey, null);
            return null; // Błąd - zwróć null
        }
    }

    /**
     * Ładuje i aktualizuje opis w modalu
     */
    async loadAndUpdateDescription() {
        const descriptionTextEl = this.modal.querySelector('.description-text');
        const descriptionEl = this.modal.querySelector('.modal-description');
        
        if (!descriptionTextEl || !descriptionEl) return;
        
        // Wyczyść opis na początku
        descriptionTextEl.innerHTML = '';
        descriptionEl.style.display = 'none';
        
        try {
            const currentLanguage = this.getCurrentLanguage();
            const fullDescription = await this.loadFullGalleryDescription(this.currentGallery, currentLanguage);
            
            // Jeśli znaleziono opis, wyświetl go
            if (fullDescription && fullDescription.trim()) {
                descriptionTextEl.innerHTML = this.formatDescription(fullDescription);
                descriptionEl.style.display = 'block';
                descriptionEl.classList.remove('short-text');
            } else {
                // Jeśli nie ma opisu, ukryj całą sekcję
                descriptionEl.style.display = 'none';
            }
            
        } catch (error) {
            console.error(`Error loading description for gallery ${this.currentGallery}:`, error);
            // W przypadku błędu, po prostu ukryj sekcję
            descriptionEl.style.display = 'none';
        }
    }

    /**
     * Formatuje opis do wyświetlenia w HTML (zachowuje strukturę tekstową)
     */
    formatDescription(description) {
        if (!description) return '';
        
        // Zamień nowe linie na <br> i zachowaj strukturę
        return description
            .replace(/\n\n/g, '</p><p>')  // Podwójne nowe linie = nowe paragrafy
            .replace(/\n/g, '<br>')       // Pojedyncze nowe linie = <br>
            .replace(/^/, '<p>')          // Dodaj <p> na początku
            .replace(/$/, '</p>');        // Dodaj </p> na końcu
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
    
    async openFullscreen() {
        console.log('🔥 openFullscreen() called');
        console.log('🔥 this.fullscreen:', this.fullscreen);
        console.log('🔥 this.images.length:', this.images.length);
        console.log('🔥 this.currentImageIndex:', this.currentImageIndex);
        
        if (!this.fullscreen || this.images.length === 0) {
            console.warn('Cannot open fullscreen - missing fullscreen element or no images');
            return;
        }
        
        // NAJPIERW załaduj pełne media
        console.log('🔄 Ładowanie pełnego media przed otwarciem fullscreen...');
        const currentMedia = await this.loadFullMediaOnDemand(this.currentImageIndex);
        
        if (!currentMedia) {
            console.error('❌ Nie udało się załadować media dla fullscreen');
            return;
        }
        
        // Użyj ID selektorów które pasują do głównego index.html
        const fullscreenImage = this.fullscreen.querySelector('#fullscreen-image');
        const fullscreenVideo = this.fullscreen.querySelector('#fullscreen-video');
        
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
        
        // Aktualizuj przyciski nawigacyjne
        this.updateFullscreenNavigation();
        
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
        
        // Smart click handler - delays closing to allow zoom gestures
        if (fullscreenImage) {
            this.fullscreenImageClickHandler = (e) => {
                e.stopPropagation();
                
                // Delay closing to distinguish from zoom gestures
                // Single tap closes, but pinch/double-tap can interrupt
                this.closeTimeout = setTimeout(() => {
                    console.log('🔥 Fullscreen image clicked - closing fullscreen');
                    this.closeFullscreen();
                }, 300); // 300ms delay allows for double-tap zoom
            };
            fullscreenImage.addEventListener('click', this.fullscreenImageClickHandler);
            
            // Add double-tap prevention
            let lastTap = 0;
            fullscreenImage.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                
                // If double-tap detected, cancel the close timeout
                if (tapLength < 500 && tapLength > 0) {
                    if (this.closeTimeout) {
                        clearTimeout(this.closeTimeout);
                        console.log('Double-tap detected - keeping fullscreen open for zoom');
                    }
                }
                lastTap = currentTime;
            });
            
            fullscreenImage.style.cursor = 'default';
            fullscreenImage.title = 'Kliknij aby zamknąć, użyj gestów do powiększania';
        }
        
        if (fullscreenVideo) {
            this.fullscreenVideoClickHandler = (e) => {
                e.stopPropagation();
                
                // Delay closing to allow zoom gestures
                this.closeTimeout = setTimeout(() => {
                    console.log('🔥 Fullscreen video clicked - closing fullscreen');
                    this.closeFullscreen();
                }, 300);
            };
            fullscreenVideo.addEventListener('click', this.fullscreenVideoClickHandler);
            
            // Add double-tap prevention for video too
            let lastTapVideo = 0;
            fullscreenVideo.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapVideo;
                
                if (tapLength < 500 && tapLength > 0) {
                    if (this.closeTimeout) {
                        clearTimeout(this.closeTimeout);
                        console.log('Double-tap on video detected - keeping fullscreen open');
                    }
                }
                lastTapVideo = currentTime;
            });
            
            fullscreenVideo.style.cursor = 'default';
            fullscreenVideo.title = 'Kliknij aby zamknąć, użyj gestów do powiększania';
        }
    }
    
    closeFullscreen() {
        // Clear any pending close timeout
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
        
        if (this.fullscreen) {
            // Zatrzymaj wideo jeśli jest odtwarzane
            const fullscreenVideo = this.fullscreen.querySelector('#fullscreen-video');
            if (fullscreenVideo) {
                fullscreenVideo.pause();
            }
            
            // Ukryj przyciski nawigacyjne
            const prevBtn = this.fullscreen.querySelector('#fullscreen-nav-prev');
            const nextBtn = this.fullscreen.querySelector('#fullscreen-nav-next');
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            
            this.fullscreen.classList.remove('show');
            
            // Only restore overflow if modal is not active
            if (!this.modal || !this.modal.classList.contains('show')) {
                document.body.style.overflow = '';
            }
        }
    }
    

    

    
    async updateFullscreenImage() {
        if (!this.fullscreen || !this.fullscreen.classList.contains('show')) return;
        
        const fullscreenImage = this.fullscreen.querySelector('#fullscreen-image');
        const fullscreenVideo = this.fullscreen.querySelector('#fullscreen-video');
        
        // Pokaż loading spinner podczas ładowania
        const currentThumbnail = this.images[this.currentImageIndex]?.thumbnail;
        console.log(`🔍 updateFullscreenImage START:`);
        console.log(`📊 currentImageIndex: ${this.currentImageIndex}`);
        console.log(`📊 images.length: ${this.images.length}`);
        console.log(`📊 currentThumbnail: ${currentThumbnail}`);
        console.log(`📊 this.images[${this.currentImageIndex}]:`, this.images[this.currentImageIndex]);
        
        if (currentThumbnail && fullscreenImage) {
            fullscreenImage.src = currentThumbnail; // Pokaż miniaturkę jako placeholder
            fullscreenImage.style.opacity = '0.7'; // Przyciemnij żeby pokazać że się ładuje
        }
        
        // NAJPIERW załaduj pełne media przed wyświetleniem
        console.log(`🔄 Ładowanie pełnego media dla fullscreen, indeks: ${this.currentImageIndex}`);
        console.log(`🔄 Aktualne media przed ładowaniem:`, this.images[this.currentImageIndex]);
        
        const currentMedia = await this.loadFullMediaOnDemand(this.currentImageIndex);
        
        console.log(`🔄 Media po załadowaniu:`, currentMedia);
        console.log(`🎯 currentMedia.src: "${currentMedia?.src}"`);
        console.log(`🖼️ currentMedia.thumbnail: "${currentMedia?.thumbnail}"`);
        console.log(`📝 currentMedia.type: "${currentMedia?.type}"`);
        console.log(`✅ currentMedia.loaded: ${currentMedia?.loaded}`);
        
        if (!currentMedia) {
            console.error('❌ Nie udało się załadować media dla fullscreen');
            return;
        }
        
        if (currentMedia.type === 'video' && fullscreenVideo) {
            // Aktualizuj wideo w fullscreen
            fullscreenImage.style.display = 'none';
            fullscreenVideo.style.display = 'block';
            fullscreenVideo.src = currentMedia.src;
            fullscreenVideo.poster = currentMedia.thumbnail;
            console.log(`✅ Fullscreen video updated: ${currentMedia.src}`);
        } else if (fullscreenImage) {
            // Aktualizuj obraz w fullscreen
            fullscreenVideo.style.display = 'none';
            fullscreenImage.style.display = 'block';
            
            console.log(`🔄 Ustawianie src na: ${currentMedia.src}`);
            console.log(`🔄 Czy media załadowane: ${currentMedia.loaded}`);
            console.log(`🔄 Thumbnail: ${currentMedia.thumbnail}`);
            
            // SPRAWDZENIE: Czy src to rzeczywiście pełny obraz czy miniaturka?
            const isFullImage = currentMedia.src && !currentMedia.src.includes('/m') && !currentMedia.src.includes('/v');
            console.log(`🔍 Czy src to pełny obraz (nie miniaturka): ${isFullImage}`);
            if (!isFullImage) {
                console.warn(`⚠️ UWAGA: src wygląda jak miniaturka: ${currentMedia.src}`);
            }
            
            // Dodaj obsługę błędów ładowania obrazu
            fullscreenImage.onerror = () => {
                console.error(`❌ Błąd ładowania fullscreen image: ${currentMedia.src}`);
                console.log(`🔄 Próba fallback na thumbnail: ${currentMedia.thumbnail}`);
                fullscreenImage.src = currentMedia.thumbnail; // Fallback na miniaturkę
            };
            
            fullscreenImage.onload = () => {
                console.log(`✅ Fullscreen image załadowany pomyślnie: ${currentMedia.src}`);
                fullscreenImage.style.opacity = '1'; // Przywróć pełną przezroczystość
            };
            
            // Wymuś przeładowanie dodając timestamp do URL
            const srcWithCache = currentMedia.src + '?t=' + Date.now();
            fullscreenImage.src = srcWithCache;
            fullscreenImage.alt = currentMedia.alt;
            console.log(`🔄 Ustawianie fullscreen image src na: ${currentMedia.src}`);
            console.log(`🔄 Z cache-busting: ${srcWithCache}`);
        }
        
        // Aktualizuj widoczność przycisków nawigacyjnych
        this.updateFullscreenNavigation();
        
        // Preloaduj sąsiednie zdjęcia w tle dla szybszej nawigacji
        this.preloadAdjacentImages();
    }
    
    updateFullscreenNavigation() {
        if (!this.fullscreen) return;
        
        const prevBtn = this.fullscreen.querySelector('#fullscreen-nav-prev');
        const nextBtn = this.fullscreen.querySelector('#fullscreen-nav-next');
        
        // Pokaż przyciski tylko jeśli jest więcej niż jeden obraz
        if (this.images.length > 1) {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';
        } else {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        }
    }
    
    // Preloaduj sąsiednie zdjęcia dla szybszej nawigacji w fullscreen
    preloadAdjacentImages() {
        if (this.images.length <= 1) return;
        
        // Indeksy sąsiednich zdjęć
        const prevIndex = this.currentImageIndex > 0 ? 
            this.currentImageIndex - 1 : 
            this.images.length - 1;
            
        const nextIndex = this.currentImageIndex < this.images.length - 1 ? 
            this.currentImageIndex + 1 : 
            0;
        
        // Preloaduj w tle (nie blokuj UI)
        setTimeout(() => {
            this.loadFullMediaOnDemand(prevIndex).catch(e => 
                console.warn('Preload poprzedniego zdjęcia nieudany:', e));
        }, 100);
        
        setTimeout(() => {
            this.loadFullMediaOnDemand(nextIndex).catch(e => 
                console.warn('Preload następnego zdjęcia nieudany:', e));
        }, 200);
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
            this.mainImageClickHandler = async (e) => {
                console.log('🔥🔥🔥 MAIN IMAGE CLICKED WITH HIGH PRIORITY!');
                
                // Zatrzymaj propagację NATYCHMIAST
                e.stopImmediatePropagation();
                e.preventDefault();
                
                // Wywołaj fullscreen
                await this.openFullscreen();
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
            mainImage.onclick = async (e) => {
                console.log('Main image clicked - opening fullscreen');
                e.stopPropagation();
                e.preventDefault();
                await this.openFullscreen();
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
    try {
        window.galleryModal = new GalleryModal();
        console.log('✅ Gallery Modal inicjalizowany pomyślnie');
    } catch (error) {
        console.error('❌ Błąd inicjalizacji Gallery Modal:', error);
    }
});

// Export for potential external use
window.GalleryModal = GalleryModal;