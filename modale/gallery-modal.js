// Gallery Modal JavaScript
class GalleryModal {
    constructor() {
        this.modal = null;
        this.fullscreen = null;
        this.currentGallery = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.projectsData = {};
        
        // Drag & drop state
        this.isDragging = false;
        this.startX = 0;
        this.scrollLeft = 0;
        
        // Touch/swipe state for fullscreen
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        
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
            // Close fullscreen
            const fullscreenClose = this.fullscreen.querySelector('.fullscreen-close');
            if (fullscreenClose) {
                fullscreenClose.addEventListener('click', () => this.closeFullscreen());
            }
            
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
            
            // Touch events for fullscreen swipe navigation
            this.fullscreen.addEventListener('touchstart', (e) => {
                if (this.fullscreen.classList.contains('show')) {
                    this.handleTouchStart(e);
                }
            }, { passive: true });
            
            this.fullscreen.addEventListener('touchend', (e) => {
                if (this.fullscreen.classList.contains('show')) {
                    this.handleTouchEnd(e);
                }
            }, { passive: true });
        }
    }
    
    async openModal(galleryId) {
        console.log('Opening modal for gallery:', galleryId); // Debug
        
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
            // Load ONLY thumbnails initially
            await this.loadThumbnailsOnly(galleryId);
            console.log('Loaded thumbnails:', this.images.length); // Debug
            
            // Update modal content (thumbnails)
            this.updateModalContent();
            
            // Load and show ONLY first image
            await this.loadAndShowFirstImage();
            
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
            modalVideo.remove();
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
    
    async loadThumbnailsOnly(galleryId) {
        console.log('Loading ONLY thumbnails for gallery:', galleryId);
        const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        const images = [];
        
        // Znajdź wszystkie dostępne miniaturki (m1, m2, m3...)
        const thumbnails = await this.findAvailableThumbnails(galleryId, imageExtensions);
        console.log(`Found ${thumbnails.length} thumbnails for gallery ${galleryId}`);
        
        if (thumbnails.length === 0) {
            // Fallback - spróbuj załadować bez miniaturek (stary sposób)
            console.log('No thumbnails found, falling back to original images');
            return await this.loadImagesWithoutThumbnails(galleryId, imageExtensions);
        }
        
        // Dla każdej miniaturki, stwórz obiekt BEZ ładowania pełnych obrazów
        for (const thumb of thumbnails) {
            const itemNumber = thumb.number;
            let fullPath;
            let mediaType = 'image';
            
            if (thumb.type === 'video') {
                // Przygotuj ścieżkę do wideo ale NIE ładuj
                fullPath = await this.prepareVideoPath(galleryId, itemNumber);
                mediaType = 'video';
            } else {
                // Przygotuj ścieżkę do pełnego obrazu ale NIE ładuj
                fullPath = await this.prepareImagePath(galleryId, itemNumber, imageExtensions);
                console.log(`Prepared image path for ${galleryId}/${itemNumber}: ${fullPath}`);
                mediaType = 'image';
            }
            
            images.push({
                number: itemNumber,
                thumbnail: thumb.path,
                src: fullPath || `galeria/${galleryId}/${itemNumber}.jpg`, // fallback do standardowej ścieżki
                alt: `${this.getProjectTitle(galleryId)} - ${mediaType === 'video' ? 'Film' : 'Zdjęcie'} ${itemNumber}`,
                loaded: false, // ŻADEN pełny obraz nie jest załadowany na początku
                type: mediaType
            });
        }
        
        // Sortuj według numeru
        images.sort((a, b) => a.number - b.number);
        
        this.images = images;
        console.log('Prepared thumbnails array:', this.images);
        
        if (this.images.length === 0) {
            throw new Error('No images found for this gallery');
        }
    }

    async loadAndShowFirstImage() {
        if (this.images.length === 0) return;
        
        console.log('Loading and showing first image');
        
        // Załaduj pierwszy pełny obraz
        await this.loadFullImageOnDemand(0);
        
        // Pokaż pierwszy obraz
        this.showImage(0);
    }

    async loadGalleryImages(galleryId) {
        console.log('Loading gallery images for:', galleryId);
        const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        const images = [];
        
        // Najpierw znajdź wszystkie dostępne miniaturki (m1, m2, m3...)
        const thumbnails = await this.findAvailableThumbnails(galleryId, imageExtensions);
        console.log(`Found ${thumbnails.length} thumbnails for gallery ${galleryId}`);
        
        if (thumbnails.length === 0) {
            // Fallback - spróbuj załadować bez miniaturek (stary sposób)
            console.log('No thumbnails found, falling back to original images');
            return await this.loadImagesWithoutThumbnails(galleryId, imageExtensions);
        }
        
        // Dla każdej miniaturki, stwórz obiekt z thumb i pełnym obrazem/filmem
        for (const thumb of thumbnails) {
            const itemNumber = thumb.number;
            let fullPath;
            let mediaType = 'image';
            
            if (thumb.type === 'video') {
                // Szukaj pliku wideo
                fullPath = await this.findVideoFile(galleryId, itemNumber);
                mediaType = 'video';
            } else {
                // Szukaj pełnego obrazu
                fullPath = await this.findFullImage(galleryId, itemNumber, imageExtensions);
                mediaType = 'image';
            }
            
            images.push({
                number: itemNumber,
                thumbnail: thumb.path,
                src: fullPath || thumb.path, // fallback do miniaturki jeśli nie ma pełnego
                alt: `${this.getProjectTitle(galleryId)} - ${mediaType === 'video' ? 'Film' : 'Zdjęcie'} ${itemNumber}`,
                loaded: false, // czy pełny obraz został już załadowany
                type: mediaType // 'image' lub 'video'
            });
        }
        
        // Sortuj według numeru aby zachować właściwą kolejność
        images.sort((a, b) => a.number - b.number);
        
        this.images = images;
        console.log('Prepared images array:', this.images);
        
        if (this.images.length === 0) {
            throw new Error('No images found for this gallery');
        }
        
        // Załaduj pierwszy pełny obraz od razu
        if (this.images.length > 0) {
            await this.preloadFullImage(0);
        }
    }
    
    async findAvailableThumbnails(galleryId, extensions) {
        const thumbnails = [];
        
        // Sprawdź miniaturki od m1 do m20 (zdjęcia)
        for (let i = 1; i <= 20; i++) {
            for (const ext of extensions) {
                const thumbPath = `galeria/${galleryId}/m${i}.${ext}`;
                
                try {
                    const exists = await this.checkImageExists(thumbPath);
                    if (exists) {
                        thumbnails.push({
                            number: i,
                            path: thumbPath,
                            type: 'image'
                        });
                        break; // Found thumbnail, try next number
                    }
                } catch (e) {
                    // Continue to next extension
                }
            }
        }
        
        // Sprawdź miniaturki wideo od v1 do v20 (filmy)
        for (let i = 1; i <= 20; i++) {
            for (const ext of extensions) {
                const thumbPath = `galeria/${galleryId}/v${i}.${ext}`;
                
                try {
                    const exists = await this.checkImageExists(thumbPath);
                    if (exists) {
                        thumbnails.push({
                            number: i,
                            path: thumbPath,
                            type: 'video'
                        });
                        break; // Found thumbnail, try next number
                    }
                } catch (e) {
                    // Continue to next extension
                }
            }
        }
        
        return thumbnails;
    }
    
    async prepareImagePath(galleryId, imageNumber, extensions) {
        // Znajdź rzeczywistą ścieżkę do pełnego obrazu
        console.log(`Looking for full image: gallery=${galleryId}, number=${imageNumber}, extensions=${extensions.join(',')}`);
        
        for (const ext of extensions) {
            const imagePath = `galeria/${galleryId}/${imageNumber}.${ext}`;
            console.log(`Trying path: ${imagePath}`);
            
            // Sprawdź czy plik istnieje
            try {
                const response = await fetch(imagePath, { method: 'HEAD' });
                console.log(`Response for ${imagePath}: status=${response.status}, ok=${response.ok}`);
                if (response.ok) {
                    console.log(`Found full image: ${imagePath}`);
                    return imagePath;
                }
            } catch (e) {
                console.log(`Error checking ${imagePath}:`, e.message);
                // Kontynuuj z następnym rozszerzeniem
            }
        }
        console.warn(`No full image found for ${galleryId}/${imageNumber}`);
        return null;
    }

    async prepareVideoPath(galleryId, videoNumber) {
        // Przygotuj ścieżkę do wideo BEZ sprawdzania czy istnieje
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
        for (const ext of videoExtensions) {
            const videoPath = `galeria/${galleryId}/${videoNumber}.${ext}`;
            // Zwróć pierwszą możliwą ścieżkę - sprawdzimy istnienie później
            return videoPath;
        }
        return null;
    }

    async loadFullImageOnDemand(imageIndex) {
        // Ładuj pełny obraz/wideo dopiero gdy jest potrzebny
        if (!this.images[imageIndex] || this.images[imageIndex].loaded) {
            return Promise.resolve(this.images[imageIndex]);
        }
        
        const mediaObj = this.images[imageIndex];
        console.log(`Loading full media on demand for index ${imageIndex}: ${mediaObj.src}`);
        
        if (mediaObj.type === 'video') {
            // Dla wideo tylko sprawdź czy istnieje, ale nie ładuj do pamięci
            const exists = await this.checkVideoExists(mediaObj.src);
            if (exists) {
                mediaObj.loaded = true;
                console.log(`Video ${imageIndex} confirmed to exist`);
            } else {
                console.warn(`Video ${imageIndex} does not exist: ${mediaObj.src}`);
                // NIE zmieniaj src na miniaturkę - zostaw oryginalną ścieżkę
                mediaObj.loaded = false; // Oznacz jako nie załadowany
            }
            return Promise.resolve(mediaObj);
        }
        
        // Dla obrazów - sprawdź i załaduj do pamięci
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                mediaObj.loaded = true;
                console.log(`Successfully loaded full image ${imageIndex}`);
                resolve(mediaObj);
            };
            img.onerror = () => {
                console.warn(`Failed to load full image ${imageIndex}: ${mediaObj.src}, keeping original path`);
                // NIE zmieniaj src na miniaturkę - zostaw oryginalną ścieżkę
                mediaObj.loaded = false; // Oznacz jako nie załadowany
                resolve(mediaObj);
            };
            img.src = mediaObj.src;
        });
    }

    async findFullImage(galleryId, imageNumber, extensions) {
        // Znajdź pełny obraz dla danego numeru (bez 'm')
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
        
        return null; // Nie znaleziono pełnego obrazu
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
    
    async loadImagesWithoutThumbnails(galleryId, extensions) {
        // Fallback - stary sposób ładowania (bez miniaturek)
        const images = [];
        
        for (let i = 1; i <= 20; i++) {
            for (const ext of extensions) {
                const imagePath = `galeria/${galleryId}/${i}.${ext}`;
                
                try {
                    const exists = await this.checkImageExists(imagePath);
                    if (exists) {
                        images.push({
                            number: i,
                            thumbnail: imagePath, // używaj pełnego obrazu jako miniaturka
                            src: imagePath,
                            alt: `${this.getProjectTitle(galleryId)} - Zdjęcie ${i}`,
                            loaded: true
                        });
                        break;
                    }
                } catch (e) {
                    // Continue to next extension
                }
            }
        }
        
        this.images = images;
        return images;
    }
    
    async preloadFullImage(imageIndex) {
        // Załaduj pełny obraz dla danego indeksu
        if (!this.images[imageIndex] || this.images[imageIndex].loaded) {
            return; // Już załadowany lub nie istnieje
        }
        
        const mediaObj = this.images[imageIndex];
        
        // Nie preloaduj wideo - są za duże
        if (mediaObj.type === 'video') {
            mediaObj.loaded = true; // Oznacz jako "załadowane" żeby nie próbować ponownie
            return Promise.resolve(mediaObj);
        }
        
        console.log(`Preloading full image ${imageIndex + 1}: ${mediaObj.src}`);
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                mediaObj.loaded = true;
                console.log(`Successfully preloaded image ${imageIndex + 1}`);
                resolve(mediaObj);
            };
            img.onerror = () => {
                console.warn(`Failed to preload image ${imageIndex + 1}: ${mediaObj.src}`);
                resolve(mediaObj); // Resolve anyway, będziemy używać miniaturki
            };
            img.src = mediaObj.src;
        });
    }
    
    async preloadAdjacentImagesLazy(currentIndex) {
        // Załaduj obrazy przed i po aktualnym TYLKO na żądanie
        const promises = [];
        
        // Poprzedni obraz
        if (currentIndex > 0 && !this.images[currentIndex - 1].loaded) {
            promises.push(this.loadFullImageOnDemand(currentIndex - 1));
        }
        
        // Następny obraz
        if (currentIndex < this.images.length - 1 && !this.images[currentIndex + 1].loaded) {
            promises.push(this.loadFullImageOnDemand(currentIndex + 1));
        }
        
        if (promises.length > 0) {
            console.log(`Lazy preloading ${promises.length} adjacent images...`);
            // Uruchom w tle, nie czekaj na zakończenie
            Promise.all(promises).catch(e => console.warn('Error in lazy preloading:', e));
        }
    }

    async preloadAdjacentImages(currentIndex) {
        // Stara metoda - zachowana dla kompatybilności
        const promises = [];
        
        // Poprzedni obraz
        if (currentIndex > 0 && !this.images[currentIndex - 1].loaded) {
            promises.push(this.preloadFullImage(currentIndex - 1));
        }
        
        // Następny obraz
        if (currentIndex < this.images.length - 1 && !this.images[currentIndex + 1].loaded) {
            promises.push(this.preloadFullImage(currentIndex + 1));
        }
        
        if (promises.length > 0) {
            console.log(`Preloading ${promises.length} adjacent images...`);
            await Promise.all(promises);
        }
    }
    
    checkImageExists(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
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
        
        // Update counter
        this.updateCounter();
    }
    
    generateThumbnails() {
        const thumbnailsContainer = this.modal.querySelector('.gallery-thumbnails');
        if (!thumbnailsContainer) return;
        
        thumbnailsContainer.innerHTML = '';
        
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
                    console.log(`Thumbnail ${index} clicked`); // Debug log
                    this.showImage(index);
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
            thumbnailsContainer.appendChild(thumbnailWrapper);
        });
        
        // Add drag & drop functionality
        this.setupThumbnailsDrag(thumbnailsContainer);
    }
    
    async showImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.currentImageIndex = index;
        
        // Hide overlay when changing image
        this.hideOverlay();
        
        // Zatrzymaj poprzednie wideo jeśli było odtwarzane
        const currentVideo = this.modal.querySelector('.gallery-main-video');
        if (currentVideo) {
            currentVideo.pause();
        }
        
        // ŁADUJ PEŁNY OBRAZ DOPIERO TERAZ
        console.log(`Loading image on demand for index ${index}`);
        await this.loadFullImageOnDemand(index);
        
        const mediaObj = this.images[index];
        console.log(`Media object for index ${index}:`, {
            thumbnail: mediaObj.thumbnail,
            src: mediaObj.src,
            loaded: mediaObj.loaded,
            type: mediaObj.type
        });
        
        // Get gallery container
        const galleryContainer = this.modal.querySelector('.gallery-container');
        if (!galleryContainer) return;
        
        if (mediaObj.type === 'video') {
            // Obsługa wideo
            this.showVideo(mediaObj, galleryContainer);
        } else {
            // Obsługa obrazu (istniejący kod)
            this.showImageContent(mediaObj, galleryContainer);
        }
        
        // Preload sąsiednie obrazy w tle (tylko gdy jest potrzeba)
        this.preloadAdjacentImagesLazy(index);
        
        // Update thumbnail states and counter
        this.updateActiveThumbnail(index);
    }

    showVideo(mediaObj, container) {
        // Usuń istniejący obraz i zastąp wideo
        let mainVideo = container.querySelector('.gallery-main-video');
        
        if (!mainVideo) {
            // Ukryj obraz i stwórz element wideo
            const mainImage = container.querySelector('.gallery-main-image');
            if (mainImage) {
                mainImage.style.display = 'none';
            }
            
            mainVideo = document.createElement('video');
            mainVideo.className = 'gallery-main-video';
            mainVideo.controls = true;
            mainVideo.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                position: absolute;
                top: 0;
                left: 0;
                cursor: pointer;
            `;
            container.appendChild(mainVideo);
        } else {
            mainVideo.style.display = 'block';
            // Ukryj obraz
            const mainImage = container.querySelector('.gallery-main-image');
            if (mainImage) {
                mainImage.style.display = 'none';
            }
        }
        
        // Załaduj wideo
        mainVideo.src = mediaObj.src;
        mainVideo.poster = mediaObj.thumbnail; // Użyj miniaturki jako plakat
        
        // Dodaj obsługę kliknięcia dla fullscreen
        mainVideo.onclick = () => this.openFullscreen();
    }

    showImageContent(mediaObj, container) {
        // Pokaż obraz i ukryj wideo (jeśli istnieje)
        const mainVideo = container.querySelector('.gallery-main-video');
        if (mainVideo) {
            mainVideo.style.display = 'none';
        }
        
        const mainImage = container.querySelector('.gallery-main-image');
        if (mainImage) {
            mainImage.style.display = 'block';
            mainImage.style.opacity = '0.5';
            
            // ZAWSZE używaj pełnego obrazu na głównym bannerze (nie miniaturki)
            let imageToShow = mediaObj.src;
            console.log(`ShowImageContent - showing image: ${imageToShow}, thumbnail: ${mediaObj.thumbnail}`);
            
            // Create new image to preload
            const newImg = new Image();
            newImg.onload = () => {
                mainImage.src = newImg.src;
                mainImage.alt = mediaObj.alt;
                mainImage.style.opacity = '1';
                
                // Dodaj event listener do głównego obrazu po załadowaniu
                this.addMainImageClickListener();
            };
            newImg.onerror = () => {
                console.error('Error loading image:', imageToShow);
                mainImage.style.opacity = '1';
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
        this.showImage(newIndex);
    }
    
    nextImage() {
        const newIndex = this.currentImageIndex < this.images.length - 1 ? 
            this.currentImageIndex + 1 : 
            0;
        this.showImage(newIndex);
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
        } else if (fullscreenImage) {
            // Pokaż obraz w fullscreen
            fullscreenVideo.style.display = 'none';
            fullscreenImage.style.display = 'block';
            fullscreenImage.src = currentMedia.src;
            fullscreenImage.alt = currentMedia.alt;
        }
        
        console.log('Adding "show" class to fullscreen element');
        this.fullscreen.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        console.log('Fullscreen should now be visible. Classes:', this.fullscreen.classList.toString());
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
        
        // Touch events for mobile
        let isTouchDown = false;
        let touchStartX = 0;
        let touchScrollLeft = 0;
        
        container.addEventListener('touchstart', (e) => {
            isTouchDown = true;
            touchStartX = e.touches[0].pageX - container.offsetLeft;
            touchScrollLeft = container.scrollLeft;
        });
        
        container.addEventListener('touchend', () => {
            isTouchDown = false;
            isDragging = false;
            this.isDragging = false;
            container.classList.remove('dragging');
        });
        
        container.addEventListener('touchmove', (e) => {
            if (!isTouchDown) return;
            
            const x = e.touches[0].pageX - container.offsetLeft;
            const distance = Math.abs(x - touchStartX);
            
            // Start dragging only if moved beyond threshold
            if (distance > dragThreshold && !isDragging) {
                isDragging = true;
                this.isDragging = true;
                container.classList.add('dragging');
                e.preventDefault();
            }
            
            if (isDragging) {
                e.preventDefault();
                const walk = (x - touchStartX) * 2;
                container.scrollLeft = touchScrollLeft - walk;
            }
        });
    }
    
    // Touch event handlers for fullscreen swipe navigation
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }
    
    handleTouchEnd(e) {
        const touch = e.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
        
        this.handleSwipe();
    }
    
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        
        // Sprawdź czy to poziomy swipe (nie pionowy)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Sprawdź czy przesunięcie jest wystarczająco duże
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe w prawo - poprzedni obraz
                    console.log('Swipe right - previous image');
                    this.prevImage();
                    this.updateFullscreenImage();
                } else {
                    // Swipe w lewo - następny obraz
                    console.log('Swipe left - next image');
                    this.nextImage();
                    this.updateFullscreenImage();
                }
            }
        }
    }
    
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
            
            // Style dla lepszej widoczności
            mainImage.style.cursor = 'pointer';
            mainImage.style.zIndex = '1000';
            mainImage.title = 'Kliknij aby powiększyć';
            
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