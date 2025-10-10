class TikTokModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.videos = [];
        this.currentVideoIndex = 0;
        this.loadTikTokData();
    }

    async loadTikTokData() {
        try {
            const response = await fetch('./modale/tiktok.txt');
            const text = await response.text();
            
            this.parseVideosFromText(text);
            this.init();
        } catch (error) {
            console.error('Błąd ładowania danych TikTok:', error);
            // Fallback data
            this.videos = [
                {
                    embedCode: null,
                    url: 'https://vm.tiktok.com/ZNdtHbTTg/',
                    description: 'Luksusowe wnętrza MetaStudio - nowoczesny design 🏠✨',
                    thumbnail: null
                },
                {
                    embedCode: null,
                    url: 'https://vm.tiktok.com/ZNdtHckPn/',
                    description: 'Kuchnia marzeń - funkcjonalność i piękno 🍽️',
                    thumbnail: null
                }
            ];
            this.init();
        }
    }

    parseVideosFromText(text) {
        const lines = text.split('\n');
        this.videos = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Pomiń komentarze i puste linie
            if (!line || line.startsWith('#')) continue;

            // Jeśli linia zawiera kod embed TikTok
            if (line.includes('<blockquote') && line.includes('tiktok-embed')) {
                const video = {
                    embedCode: line, // Zapisz cały kod embed
                    url: this.extractUrlFromEmbed(line),
                    description: '',
                    thumbnail: null
                };

                // Sprawdź czy następna linia to opis
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !nextLine.startsWith('#') && !nextLine.includes('<blockquote')) {
                        video.description = nextLine;
                    }
                }

                this.videos.push(video);
            }
        }

        console.log('Załadowano filmów TikTok:', this.videos.length);
        console.log('Dane filmów:', this.videos);
    }

    extractUrlFromEmbed(embedCode) {
        // Wyciągnij URL z atrybutu cite
        const citeMatch = embedCode.match(/cite="([^"]+)"/);
        if (citeMatch) {
            return citeMatch[1];
        }
        // Fallback - szukaj w href
        const hrefMatch = embedCode.match(/href="(https:\/\/www\.tiktok\.com\/[^"]+)"/);
        if (hrefMatch) {
            return hrefMatch[1];
        }
        return '';
    }

    init() {
        this.createModal();
        this.bindEvents();
        this.generateThumbnails();
        this.generateDescriptions();
    }

    createModal() {
        // Usuń stary modal jeśli istnieje
        const oldModal = document.getElementById('tiktok-modal');
        if (oldModal) {
            console.log('Usuwanie starego modalu...');
            oldModal.remove();
        }

        const modalHTML = `
            <div id="tiktok-modal" class="tiktok-modal">
                <div class="tiktok-modal-content">
                    <div class="tiktok-close">×</div>
                    <div class="tiktok-modal-header">
                        <div class="tiktok-modal-brand">
                            <img src="logo/logo2.png" alt="MetaStudio Logo" class="tiktok-modal-logo">
                            <h2 class="tiktok-modal-title">INSPIRACJE</h2>
                        </div>
                    </div>
                    <div class="tiktok-modal-body">
                        <div class="tiktok-descriptions-sidebar">
                            <div class="tiktok-descriptions" id="tiktok-descriptions">
                                <!-- Descriptions will be generated here -->
                            </div>
                        </div>
                        <div class="tiktok-video-container">
                            <div class="tiktok-video-display" id="tiktok-video-display">
                                <div class="tiktok-loading">Ładowanie filmu...</div>
                            </div>
                        </div>
                        <div class="tiktok-thumbnails-sidebar">
                            <div class="tiktok-thumbnails" id="tiktok-thumbnails">
                                <!-- Thumbnails will be generated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        console.log('Tworzenie nowego modalu z 3 kolumnami...');
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('tiktok-modal');
        console.log('Modal utworzony:', this.modal);
    }

    bindEvents() {
        // Close button
        const closeBtn = this.modal.querySelector('.tiktok-close');
        closeBtn.addEventListener('click', () => this.close());
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    generateThumbnails() {
        const container = document.getElementById('tiktok-thumbnails');
        if (!container) return;

        container.innerHTML = '';

        this.videos.forEach((video, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `tiktok-thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.dataset.index = index;

            // Użyj atrakcyjnego gradientu z opisem jako miniaturka
            const gradients = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)'
            ];

            const gradient = gradients[index % gradients.length];

            thumbnail.innerHTML = `
                <div class="tiktok-thumbnail-image" style="background: ${gradient}; position: relative;">
                </div>
                <div class="tiktok-play-icon">▶</div>
            `;

            thumbnail.addEventListener('click', () => this.showVideo(index));
            container.appendChild(thumbnail);

            // Spróbuj załadować prawdziwą miniaturkę w tle
            this.loadThumbnailAsync(video, thumbnail, index);
        });
    }

    generateDescriptions() {
        const container = document.getElementById('tiktok-descriptions');
        console.log('generateDescriptions - container:', container);
        if (!container) {
            console.log('BRAK KONTENERA OPISÓW!');
            return;
        }

        container.innerHTML = '';
        console.log('Generowanie', this.videos.length, 'opisów...');

        // Jasne kolory dla opisów (bardzo jasne odcienie)
        const lightGradients = [
            'linear-gradient(135deg, #e0e7ff 0%, #f0e7ff 100%)',
            'linear-gradient(135deg, #fde1f0 0%, #ffe4e6 100%)',
            'linear-gradient(135deg, #ddf4ff 0%, #e0f2fe 100%)',
            'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
            'linear-gradient(135deg, #fef3c7 0%, #fef9d3 100%)',
            'linear-gradient(135deg, #e0f2fe 0%, #e9d5ff 100%)',
            'linear-gradient(135deg, #f5f5f5 0%, #fce7f3 100%)',
            'linear-gradient(135deg, #fed7aa 0%, #fecaca 100%)'
        ];

        this.videos.forEach((video, index) => {
            const description = document.createElement('div');
            description.className = `tiktok-description ${index === 0 ? 'active' : ''}`;
            description.dataset.index = index;

            const lightGradient = lightGradients[index % lightGradients.length];

            description.innerHTML = `
                <div class="tiktok-description-content" style="
                    background: ${lightGradient};
                    padding: 15px;
                    border: 2px solid rgba(237, 210, 173, 0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                ">
                    <p style="
                        margin: 0;
                        color: #1a1a1a;
                        font-size: 13px;
                        line-height: 1.5;
                        font-weight: 500;
                    ">
                        ${video.description || `Film ${index + 1}`}
                    </p>
                </div>
            `;

            description.addEventListener('click', () => this.showVideo(index));
            container.appendChild(description);
        });
    }

    async loadThumbnailAsync(video, thumbnailElement, index) {
        try {
            if (!video.url) return;

            const oembed = await this.getTikTokOEmbed(video.url);
            if (oembed && oembed.thumbnail_url) {
                console.log('Miniaturka z oEmbed załadowana dla filmu', index);
                const imgDiv = thumbnailElement.querySelector('.tiktok-thumbnail-image');

                if (imgDiv) {
                    const img = document.createElement('img');
                    img.src = oembed.thumbnail_url;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

                    img.onload = () => {
                        imgDiv.style.background = 'none';
                        imgDiv.innerHTML = '';
                        imgDiv.appendChild(img);
                    };

                    img.onerror = () => {
                        console.log('Nie udało się załadować obrazka dla filmu', index);
                    };
                }
            }
        } catch (error) {
            console.log('Błąd ładowania miniaturki dla filmu', index);
        }
    }

    async getTikTokOEmbed(url) {
        try {
            const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
            const response = await fetch(oembedUrl);
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            // Silent fail - użyj gradientu jako fallback
        }
        return null;
    }

    showVideo(index) {
        console.log('showVideo wywołane dla index:', index);
        console.log('Dostępne filmy:', this.videos.length);
        
        if (index < 0 || index >= this.videos.length) {
            console.log('Nieprawidłowy index filmu');
            return;
        }
        
        if (!this.modal) {
            console.log('Modal nie istnieje');
            return;
        }
        
        this.currentVideoIndex = index;

        // Update active thumbnail
        const thumbnails = this.modal.querySelectorAll('.tiktok-thumbnail');
        console.log('Znalezionych miniaturek:', thumbnails.length);

        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        // Update active description
        const descriptions = this.modal.querySelectorAll('.tiktok-description');
        descriptions.forEach((desc, i) => {
            desc.classList.toggle('active', i === index);
        });

        // Load video
        console.log('Ładowanie filmu:', this.videos[index]);
        this.loadVideo(this.videos[index]);
    }

    async loadVideo(video) {
        console.log('loadVideo wywołane dla:', video);

        const display = document.getElementById('tiktok-video-display');
        if (!display) {
            console.log('Brak elementu tiktok-video-display');
            return;
        }

        console.log('Element display znaleziony, ładowanie...');
        display.innerHTML = '<div class="tiktok-loading">Ładowanie filmu...</div>';

        try {
            // Jeśli mamy kod embed, użyj go bezpośrednio
            if (video.embedCode) {
                console.log('Używam kodu embed z pliku');

                display.innerHTML = `
                    <div class="tiktok-embed-container" style="
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                        padding: 20px;
                    ">
                        ${video.embedCode}
                    </div>
                `;

                // Załaduj skrypt TikTok embed
                this.loadTikTokScript();
            } else {
                // Fallback - stary sposób dla linków bez embed kodu
                const videoId = this.extractVideoId(video.url);
                console.log('Brak embed kodu, używam fallback dla video ID:', videoId);

                display.innerHTML = `
                    <div class="tiktok-placeholder" style="
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                        padding: 40px;
                        text-align: center;
                    ">
                        <div style="
                            background: linear-gradient(135deg, #ff0050, #00f2ea);
                            width: 280px;
                            height: 498px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                            border: 2px solid var(--color-primary);
                            margin-bottom: 20px;
                            cursor: pointer;
                        " onclick="window.open('${video.url}', '_blank')">
                            <div style="
                                color: white;
                                font-size: 48px;
                                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                            ">▶</div>
                            <div style="
                                position: absolute;
                                bottom: 0;
                                left: 0;
                                right: 0;
                                background: rgba(0,0,0,0.8);
                                color: white;
                                padding: 15px;
                                font-size: 14px;
                                line-height: 1.4;
                            ">
                                ${video.description || 'MetaStudio Design'}
                                <br><small style="opacity: 0.8;">Kliknij aby otworzyć</small>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Dodaj przycisk pod miniaturkami
            this.updateWatchButton(video.url);

        } catch (error) {
            console.error('Błąd ładowania filmu:', error);
            display.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                    Błąd ładowania filmu
                </div>
            `;
        }
    }

    updateWatchButton(videoUrl) {
        const sidebar = document.querySelector('.tiktok-thumbnails-sidebar');
        if (!sidebar) return;
        
        // Usuń istniejący przycisk jeśli istnieje
        const existingButton = sidebar.querySelector('.tiktok-watch-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Dodaj nowy przycisk na końcu sidebar
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'tiktok-watch-button';
        buttonContainer.style.cssText = `
            padding: 20px;
            text-align: center;
            border-top: 1px solid rgba(237, 210, 173, 0.2);
        `;
        
        buttonContainer.innerHTML = `
            <a href="${videoUrl}" target="_blank" rel="noopener" style="
                display: inline-block;
                padding: 12px 25px;
                background: linear-gradient(135deg, var(--color-primary), #c4941f);
                color: white;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
                font-size: 14px;
                width: 100%;
                box-sizing: border-box;
            ">
                🎬 Obejrzyj na TikTok
            </a>
        `;
        
        sidebar.appendChild(buttonContainer);
    }

    extractVideoId(url) {
        console.log('Extracting ID from URL:', url);
        
        // Extract video ID from various TikTok URL formats
        const patterns = [
            /\/video\/(\d+)/,                    // /video/123456789
            /\/v\/(\d+)/,                        // /v/123456789  
            /video_id=(\d+)/,                    // ?video_id=123456789
            /vm\.tiktok\.com\/([^\/\?\s]+)/,     // vm.tiktok.com/shortcode
            /vt\.tiktok\.com\/([^\/\?\s]+)/,     // vt.tiktok.com/shortcode
            /\/(\d{19})/                         // 19-digit ID
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                console.log('Found match:', match[1]);
                return match[1];
            }
        }
        
        console.log('No ID found for URL:', url);
        return null;
    }

    // Funkcja do konwersji krótkiego linku na embed URL
    getEmbedUrl(url, videoId) {
        if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
            // Dla krótkich linków używaj bezpośrednio URL
            return url;
        } else if (videoId) {
            // Dla pełnych URL używaj iframe embed
            return `https://www.tiktok.com/embed/v2/${videoId}`;
        }
        return url;
    }

    loadTikTokScript() {
        // Usuń stary skrypt jeśli istnieje
        const oldScript = document.querySelector('script[src*="tiktok.com/embed"]');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Dodaj nowy skrypt
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.tiktok.com/embed.js';
        script.onload = () => {
            console.log('TikTok embed script załadowany');
            // Poczekaj trochę i odśwież embedy
            setTimeout(() => {
                if (window.tiktokEmbed) {
                    try {
                        console.log('Odświeżanie TikTok embedów...');
                        window.tiktokEmbed.load();
                    } catch (error) {
                        console.error('Błąd odświeżania embedów:', error);
                    }
                }
            }, 1000);
        };
        script.onerror = () => {
            console.error('Nie udało się załadować TikTok embed script');
        };
        document.head.appendChild(script);
    }

    open() {
        if (this.isOpen) return;
        
        // Sprawdź czy modal został już utworzony
        if (!this.modal) {
            console.log('Modal nie został jeszcze utworzony, czekam...');
            setTimeout(() => this.open(), 100);
            return;
        }
        
        console.log('Otwieranie modalu z', this.videos.length, 'filmami');
        
        this.isOpen = true;
        this.modal.style.display = 'flex';
        
        // Show animation
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
        
        // Block body scroll
        document.body.style.overflow = 'hidden';
        
        // Load first video
        if (this.videos.length > 0) {
            console.log('Ładowanie pierwszego filmu...');
            setTimeout(() => this.showVideo(0), 500);
        } else {
            console.log('Brak filmów do załadowania');
        }
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.modal.classList.remove('show');
        
        // Wait for animation
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== TikTok Modal v3.0 - Three Column Layout ===');
    const tiktokModal = new TikTokModal();
    
    // Menu button handler
    const tiktokBtn = document.querySelector('a[href="#tiktok"]');
    if (tiktokBtn) {
        tiktokBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tiktokModal.open();
        });
    }
    
    // Banner button handler
    const bannerBtn = document.getElementById('tiktok-banner-btn');
    if (bannerBtn) {
        bannerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tiktokModal.open();
        });
    }
});