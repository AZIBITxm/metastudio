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
        
        // Main image click for fullscreen
        const mainImage = this.modal.querySelector('.gallery-main-image');
        if (mainImage) {
            mainImage.addEventListener('click', () => {
                this.openFullscreen();
            });
        }
        
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
        }
    }
    
    async openModal(galleryId) {
        console.log('Opening modal for gallery:', galleryId); // Debug
        this.currentGallery = galleryId;
        this.currentImageIndex = 0;
        
        // Show modal with loading
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Show loading
        this.showLoading();
        
        try {
            // Load images for this gallery
            await this.loadGalleryImages(galleryId);
            console.log('Loaded images:', this.images.length); // Debug
            
            // Update modal content
            this.updateModalContent();
            
            // Hide loading
            this.hideLoading();
            
            // Show first image
            this.showImage(0);
            
        } catch (error) {
            console.error('Error loading gallery:', error);
            this.hideLoading();
            this.closeModal();
        }
    }
    
    closeModal() {
        this.modal.classList.remove('show');
        
        // Only restore overflow if fullscreen is not active
        if (!this.fullscreen || !this.fullscreen.classList.contains('show')) {
            document.body.style.overflow = '';
        }
        
        // Reset after animation
        setTimeout(() => {
            this.currentGallery = null;
            this.images = [];
            this.currentImageIndex = 0;
        }, 300);
    }
    
    async loadGalleryImages(galleryId) {
        // Common image extensions
        const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        const images = [];
        
        // Try to load images from 1 to 20 (reasonable limit)
        for (let i = 1; i <= 20; i++) {
            for (const ext of imageExtensions) {
                const imagePath = `galeria/${galleryId}/${i}.${ext}`;
                
                try {
                    const exists = await this.checkImageExists(imagePath);
                    if (exists) {
                        images.push({
                            src: imagePath,
                            alt: `${this.getProjectTitle(galleryId)} - Zdjęcie ${i}`
                        });
                        break; // Found image with this number, try next number
                    }
                } catch (e) {
                    // Continue to next extension
                }
            }
        }
        
        this.images = images;
        
        if (this.images.length === 0) {
            throw new Error('No images found for this gallery');
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
            const thumbnail = document.createElement('img');
            thumbnail.src = image.src;
            thumbnail.alt = image.alt;
            thumbnail.className = 'thumbnail';
            thumbnail.style.cursor = 'pointer';
            
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
            
            thumbnailsContainer.appendChild(thumbnail);
        });
        
        // Add drag & drop functionality
        this.setupThumbnailsDrag(thumbnailsContainer);
    }
    
    showImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.currentImageIndex = index;
        
        // Hide overlay when changing image
        this.hideOverlay();
        
        // Update main image
        const mainImage = this.modal.querySelector('.gallery-main-image');
        if (mainImage) {
            // Add loading effect
            mainImage.style.opacity = '0.5';
            
            // Create new image to preload
            const newImg = new Image();
            newImg.onload = () => {
                mainImage.src = newImg.src;
                mainImage.alt = this.images[index].alt;
                mainImage.style.opacity = '1';
            };
            newImg.onerror = () => {
                console.error('Error loading image:', this.images[index].src);
                mainImage.style.opacity = '1';
            };
            newImg.src = this.images[index].src;
        }
        
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
            
            // Main image click for fullscreen
            const mainImage = container.querySelector('.gallery-main-image');
            if (mainImage) {
                mainImage.addEventListener('click', () => {
                    this.openFullscreen();
                });
            }
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
        if (!this.fullscreen || this.images.length === 0) return;
        
        const fullscreenImage = this.fullscreen.querySelector('#fullscreen-image');
        const currentImage = this.images[this.currentImageIndex];
        
        if (fullscreenImage && currentImage) {
            fullscreenImage.src = currentImage.src;
            fullscreenImage.alt = currentImage.alt;
            
            this.fullscreen.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeFullscreen() {
        if (this.fullscreen) {
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
        const currentImage = this.images[this.currentImageIndex];
        
        if (fullscreenImage && currentImage) {
            fullscreenImage.src = currentImage.src;
            fullscreenImage.alt = currentImage.alt;
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
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GalleryModal();
});

// Export for potential external use
window.GalleryModal = GalleryModal;