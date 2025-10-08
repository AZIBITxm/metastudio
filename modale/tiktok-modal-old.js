class TikTokModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.tiktokUrls = [];
        this.loadTikTokUrls();
    }

    async loadTikTokUrls() {
        try {
            const response = await fetch('./modale/tiktok.txt');
            const text = await response.text();
            
            // Filtruj linie - usuń komentarze i puste linie
            this.tiktokUrls = text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#') && line.includes('tiktok.com'));
                
            console.log('Załadowano TikTok URLs:', this.tiktokUrls);
            this.init();
        } catch (error) {
            console.error('Błąd ładowania TikTok URLs:', error);
            // Fallback - używaj przykładowych URL-i
            this.tiktokUrls = [
                'https://vm.tiktok.com/ZNdtHbTTg/',
                'https://vm.tiktok.com/ZNdtHckPn/'
            ];
            this.init();
        }
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        const modalHTML = `
            <div id="tiktok-modal" class="tiktok-modal">
                <div class="tiktok-modal-content">
                    <div class="tiktok-close">×</div>
                    <div class="tiktok-modal-header">
                        <h2 class="tiktok-modal-title">MetaStudio na TikTok</h2>
                        <p class="tiktok-modal-description">
                            Odkryj nasze najnowsze realizacje i inspiracje designerskie
                        </p>
                    </div>
                    <div class="tiktok-modal-body" id="tiktok-videos-container">
                        <div class="tiktok-loading">Ładowanie filmików...</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('tiktok-modal');
        this.loadTikTokScript();
    }

    bindEvents() {
        // Zamknij modal po kliknięciu X lub tła
        const closeBtn = this.modal.querySelector('.tiktok-close');
        closeBtn.addEventListener('click', () => this.close());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Zamknij na ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    loadTikTokScript() {
        // Załaduj skrypt TikTok embed
        if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.tiktok.com/embed.js';
            document.head.appendChild(script);
            
            script.onload = () => {
                setTimeout(() => this.renderVideos(), 500);
            };
        } else {
            this.renderVideos();
        }
    }

    async renderVideos() {
        const container = this.modal.querySelector('#tiktok-videos-container');
        
        if (this.tiktokUrls.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">Brak filmów do wyświetlenia</p>';
            return;
        }
        
        // Usuń loading
        container.innerHTML = '';
        
        // Renderuj każdy TikTok URL
        for (let i = 0; i < this.tiktokUrls.length; i++) {
            const url = this.tiktokUrls[i];
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'tiktok-video-container';
            
            try {
                // Pobierz pełny URL jeśli to skrócony link
                const fullUrl = await this.resolveShortUrl(url);
                const videoId = this.extractVideoIdFromFullUrl(fullUrl);
                
                if (videoId) {
                    // Utwórz prawdziwy TikTok embed
                    videoWrapper.innerHTML = this.createTikTokEmbed(fullUrl, videoId);
                } else {
                    // Fallback iframe
                    videoWrapper.innerHTML = `
                        <div class="tiktok-iframe-wrapper">
                            <iframe 
                                src="https://www.tiktok.com/embed/v2/${this.extractVideoId(url)}"
                                width="325" 
                                height="578" 
                                frameborder="0" 
                                scrolling="no" 
                                allow="encrypted-media" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Błąd ładowania filmu:', error);
                // Fallback - zwykły link
                videoWrapper.innerHTML = `
                    <div class="tiktok-fallback">
                        <a href="${url}" target="_blank" rel="noopener" class="tiktok-fallback-link">
                            📱 Obejrzyj na TikTok
                            <small>Film ${i + 1}</small>
                        </a>
                    </div>
                `;
            }
            
            container.appendChild(videoWrapper);
        }

        // Załaduj oficjalny TikTok embed script
        this.loadTikTokEmbedScript();
    }

    async resolveShortUrl(url) {
        if (url.includes('vm.tiktok.com')) {
            try {
                // Próbuj rozwiązać skrócony URL
                const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {
                    method: 'HEAD',
                    mode: 'cors'
                });
                return response.url || url;
            } catch (error) {
                console.log('Nie można rozwiązać skróconego URL:', error);
                return url;
            }
        }
        return url;
    }

    extractVideoIdFromFullUrl(url) {
        // Wyciągnij ID z pełnego URL TikTok
        const patterns = [
            /\/video\/(\d+)/,           // /video/123456789
            /\/v\/(\d+)/,               // /v/123456789  
            /video_id=(\d+)/,           // ?video_id=123456789
            /\/(\d{19})/                // 19-cyfrowe ID
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        
        return null;
    }

    loadTikTokEmbedScript() {
        // Załaduj oficjalny skrypt TikTok
        if (!window.tiktokEmbed) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.tiktok.com/embed.js';
            script.onload = () => {
                console.log('TikTok embed script załadowany');
                // Przeładuj embedy po załadowaniu skryptu
                if (window.tiktokEmbed && window.tiktokEmbed.load) {
                    setTimeout(() => {
                        try {
                            window.tiktokEmbed.load();
                            console.log('TikTok embedy przeładowane');
                        } catch (error) {
                            console.error('Błąd przeładowania embedów:', error);
                        }
                    }, 1000);
                }
            };
            script.onerror = () => {
                console.error('Błąd ładowania TikTok embed script');
            };
            document.head.appendChild(script);
        } else if (window.tiktokEmbed && window.tiktokEmbed.load) {
            // Skrypt już załadowany, przeładuj embedy
            setTimeout(() => {
                try {
                    window.tiktokEmbed.load();
                    console.log('TikTok embedy przeładowane (cached)');
                } catch (error) {
                    console.error('Błąd przeładowania embedów (cached):', error);
                }
            }, 500);
        }
    }

    // Funkcja pomocnicza do tworzenia embed kodu
    createTikTokEmbed(url, videoId) {
        const username = 'metastudio'; // Twoja nazwa użytkownika
        
        return `
            <blockquote 
                class="tiktok-embed" 
                cite="${url}" 
                data-video-id="${videoId}" 
                style="max-width: 605px; min-width: 325px;">
                <section>
                    <a target="_blank" title="@${username}" href="${url}">
                        @${username}
                    </a>
                    <p>MetaStudio Design - Luksusowe wnętrza i nowoczesne rozwiązania 🏠✨ #design #luxury #interiordesign #metastudio</p>
                    <a target="_blank" title="♬ Muzyka oryginalna - MetaStudio" href="${url}">
                        ♬ Muzyka oryginalna - MetaStudio
                    </a>
                </section>
            </blockquote>
        `;
    }

    extractVideoId(url) {
        // Próbuj wyciągnąć ID z różnych formatów TikTok URL
        if (url.includes('vm.tiktok.com')) {
            const match = url.match(/vm\.tiktok\.com\/([^\/\?\s]+)/);
            return match ? match[1] : null;
        }
        
        if (url.includes('/video/')) {
            const match = url.match(/\/video\/(\d+)/);
            return match ? match[1] : null;
        }
        
        return null;
    }

    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.modal.style.display = 'flex';
        
        // Animacja otwarcia
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
        
        // Zablokuj scroll tła
        document.body.style.overflow = 'hidden';
        
        // Odświeź filmy po otwarciu
        setTimeout(() => this.renderVideos(), 300);
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.modal.classList.remove('show');
        
        // Czekaj na animację zamknięcia
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
        
        // Przywróć scroll
        document.body.style.overflow = '';
    }
}

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    // Stwórz instancję modalu
    const tiktokModal = new TikTokModal();
    
    // Obsługa przycisku TikTok w menu
    const tiktokBtn = document.querySelector('a[href="#tiktok"]');
    if (tiktokBtn) {
        tiktokBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tiktokModal.open();
        });
    }
    
    // Obsługa przycisku "Dowiedz się więcej" z baneru
    const bannerBtn = document.getElementById('tiktok-banner-btn');
    if (bannerBtn) {
        bannerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tiktokModal.open();
        });
    }
});