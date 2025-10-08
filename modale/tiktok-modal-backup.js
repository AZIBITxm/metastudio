// TikTok Modal Functionality
class TikTokModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.tiktokVideos = [
            // Przykładowe embed kody TikTok - zastąp własnymi
            {
                id: 'video1',
                embedCode: `class TikTokModal {
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
    }`
            },
            {
                id: 'video2', 
                embedCode: `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@metastudiodesign/video/example2" data-video-id="example2" style="max-width: 605px;min-width: 325px;" > <section> <a target="_blank" title="@metastudiodesign" href="https://www.tiktok.com/@metastudiodesign?refer=embed">@metastudiodesign</a> <p>Nowoczesna kuchnia z nutką elegancji 🍽️ #kitchen #modern #design #metastudio</p> <a target="_blank" title="♬ dźwięk oryginalny - MetaStudio" href="https://www.tiktok.com/music/dźwięk-oryginalny-example2?refer=embed">♬ dźwięk oryginalny - MetaStudio</a> </section> </blockquote>`
            },
            {
                id: 'video3',
                embedCode: `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@metastudiodesign/video/example3" data-video-id="example3" style="max-width: 605px;min-width: 325px;" > <section> <a target="_blank" title="@metastudiodesign" href="https://www.tiktok.com/@metastudiodesign?refer=embed">@metastudiodesign</a> <p>Sypialnia marzeń w stylu loft 😍 #bedroom #loft #luxury #interiordesign</p> <a target="_blank" title="♬ dźwięk oryginalny - MetaStudio" href="https://www.tiktok.com/music/dźwięk-oryginalny-example3?refer=embed">♬ dźwięk oryginalny - MetaStudio</a> </section> </blockquote>`
            }
        ];
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
        this.loadTikTokScript();
    }

    createModal() {
        const modalHTML = `
            <div id="tiktok-modal" class="tiktok-modal">
                <div class="tiktok-modal-content">
                    <div class="tiktok-close"></div>
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
    }

    bindEvents() {
        // Zamknij modal po kliknięciu X lub tła
        const closeBtn = document.querySelector('.tiktok-close');
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
                this.renderVideos();
            };
        } else {
            this.renderVideos();
        }
    }

    renderVideos() {
        const container = document.getElementById('tiktok-videos-container');
        
        // Usuń loading
        container.innerHTML = '';
        
        // Dodaj filmy
        this.tiktokVideos.forEach(video => {
            const videoDiv = document.createElement('div');
            videoDiv.className = 'tiktok-video-container';
            videoDiv.innerHTML = video.embedCode;
            container.appendChild(videoDiv);
        });

        // Przeładuj TikTok embeds
        if (window.tiktokEmbed) {
            window.tiktokEmbed.load();
        }
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
        
        // Przeładuj TikTok embeds po otwarciu
        setTimeout(() => {
            if (window.tiktokEmbed) {
                window.tiktokEmbed.load();
            }
        }, 500);
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.modal.classList.remove('show');
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 500);
    }

    // Metoda do dodawania nowych filmików
    addVideo(embedCode, id = null) {
        const videoId = id || 'video_' + Date.now();
        this.tiktokVideos.push({
            id: videoId,
            embedCode: embedCode
        });
        
        if (this.isOpen) {
            this.renderVideos();
        }
    }

    // Metoda do aktualizacji filmików
    updateVideos(newVideos) {
        this.tiktokVideos = newVideos;
        if (this.isOpen) {
            this.renderVideos();
        }
    }
}

// Globalna instancja
let tiktokModal;

// Inicjalizuj po załadowaniu DOM
document.addEventListener('DOMContentLoaded', function() {
    tiktokModal = new TikTokModal();
    
    // Dodaj przycisk TikTok do menu (opcjonalne)
    addTikTokButtonToMenu();
});

// Funkcja do dodania przycisku TikTok do menu
function addTikTokButtonToMenu() {
    const menuDropdown = document.querySelector('.menu-dropdown');
    if (menuDropdown) {
        const tiktokLink = document.createElement('a');
        tiktokLink.href = '#';
        tiktokLink.textContent = 'TikTok';
        tiktokLink.addEventListener('click', (e) => {
            e.preventDefault();
            openTikTokModal();
        });
        menuDropdown.appendChild(tiktokLink);
    }
}

// Globalna funkcja do otwierania modala
function openTikTokModal() {
    if (tiktokModal) {
        tiktokModal.open();
    }
}

// Globalna funkcja do dodawania filmików
function addTikTokVideo(embedCode, id = null) {
    if (tiktokModal) {
        tiktokModal.addVideo(embedCode, id);
    }
}

// Export dla innych skryptów
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TikTokModal, openTikTokModal, addTikTokVideo };
}