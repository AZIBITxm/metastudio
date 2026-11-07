/**
 * Zanders Atelier - JavaScript
 * Obsługa interakcji strony internetowej
 */

// ==========================================
// REALIZACJE
// ==========================================
// Kafelki realizacji (zdjęcie, tytuł, alt) są w HTML — generuje je narzedzia/przygotuj_media.py
// z folderów galeria/<nr>/ i plików opis.txt. Okno realizacji czyta dane/realizacje.json.

// ==========================================
// GLOBALNE ZMIENNE DLA ANIMACJI CYKLICZNYCH
// ==========================================

let globalCyclicAnimationActive = false; // Flaga dla cyklicznej animacji
let heightAdjustmentPaused = false; // Flaga do pauzowania zmiany wysokości sekcji

/**
 * Czy użytkownik ma coś wybranego w „Kategoriach materiałów”: rozwinięty baner główny
 * albo zaznaczony pod-baner (konkretny materiał). Dopóki tak jest, animacja cykliczna stoi —
 * wcześniej wracała po 8 s / po przewinięciu strony i podmieniała wybrany opis (skakanie strony).
 */
function materialSelectionActive() {
    return !!document.querySelector('#project .material-logo.expanded, #project .sub-banner.active');
}

// Zatrzymanie pokazu kategorii (wołane przy wyborze materiału); logika w initializeMaterialShowcase
function stopCyclicAnimation() {
    if (window.materialShowcase) window.materialShowcase.userAction();
}

// ==========================================
// INICJALIZACJA ANIMACJI TEKSTU W NAGŁÓWKU
// ==========================================

/**
 * Funkcja inicjalizująca animacje tekstu w nagłówku
 * Dzieli każdy wiersz tekstu na pojedyncze litery i nadaje im animacje
 */
function initializeHeaderAnimations() {
    const headerTexts = document.querySelectorAll('.header-title p');
    
    headerTexts.forEach((line) => {
        const content = line.textContent;
        line.textContent = '';
        
        // Tworzenie spanów dla każdej litery
        [...content].forEach((char, charIndex) => {
            const span = document.createElement('span');
            
            // Obsługa spacji
            if (char === ' ') {
                span.innerHTML = '&nbsp;';
                span.style.marginRight = '0.3em';
            } else {
                span.textContent = char;
            }
            
            span.classList.add('letter');
            span.style.setProperty('--char-index', charIndex);
            line.appendChild(span);
        });
    });
}

// ==========================================
// OBSŁUGA MENU NAWIGACYJNEGO
// ==========================================

/**
 * Funkcja inicjalizująca obsługę menu hamburger
 * Obsługuje kliknięcia, zamykanie menu i animacje
 */
function initializeMenuHandlers() {
    const menuIcon = document.querySelector('.menu-icon');
    const menuDropdown = document.querySelector('.menu-dropdown');
    
    if (!menuIcon || !menuDropdown) {
        console.warn('Menu elements not found');
        return;
    }

    // Obsługa kliknięcia w ikonę menu
    menuIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        menuDropdown.classList.toggle('active');
    });

    // Zamykanie menu po kliknięciu w link
    menuDropdown.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuDropdown.classList.remove('active');
            menuIcon.classList.remove('active');
        });
    });

    // Zamykanie menu po kliknięciu poza nim
    document.addEventListener('click', function(e) {
        if (!menuIcon.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('active');
            menuIcon.classList.remove('active');
        }
    });
}

// ==========================================
// OBSŁUGA SCROLLA W SEKCJI "O NAS"
// ==========================================

/**
 * Funkcja obsługująca specjalny scroll w sekcji "O Nas"
 * Umożliwia przewijanie wewnątrz sekcji gdy użytkownik jest w jej obrębie
 */
function initializeAboutSectionScroll() {
    // Na komputerze tekst „O nas” ma własne przewijanie. Gdy sekcja wypełnia ekran, kółko myszy najpierw
    // przewija ten tekst, potem stronę — bez cofania strony przez window.scrollTo (dawne „szarpanie”).
    const aboutSection = document.getElementById('about');
    const aboutContent = aboutSection?.querySelector('.about-content');
    if (!aboutSection || !aboutContent) return;

    window.addEventListener('wheel', function(e) {
        if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
        const rect = aboutSection.getBoundingClientRect();
        if (rect.top > 0 || rect.bottom < window.innerHeight) return;
        const max = aboutContent.scrollHeight - aboutContent.clientHeight;
        if (max <= 0) return;
        const down = e.deltaY > 0;
        if ((down && aboutContent.scrollTop < max - 1) || (!down && aboutContent.scrollTop > 0)) {
            e.preventDefault();
            aboutContent.scrollTop += e.deltaY;
        }
    }, { passive: false });
}

// ==========================================
// OBSŁUGA ANIMACJI POJAWIANIA SIĘ ELEMENTÓW
// ==========================================

/**
 * Funkcja obsługująca animacje pojawiania się ukrytych paragrafów
 * w sekcji "O Nas" podczas przewijania
 */
function initializeContentRevealAnimations() {
    const aboutContent = document.querySelector('.about-content');
    const hiddenParagraphs = document.querySelectorAll('.about-details:not(:first-of-type)');
    
    if (!aboutContent || hiddenParagraphs.length === 0) {
        return;
    }

    aboutContent.addEventListener('scroll', function() {
        const scrollPosition = aboutContent.scrollTop;
        const philosophyElement = document.querySelector('.about-philosophy');
        
        // Logika animacji może być tutaj rozszerzona w przyszłości
        // Na razie pozostawiamy podstawową strukturę
    });
}

// ==========================================
// OBSŁUGA SEKCJI MATERIAŁÓW
// ==========================================

/**
 * Funkcja inicjalizująca obsługę sekcji materiałów
 * Obsługuje najechanie na loga i wyświetlanie odpowiednich informacji
 */
function initializeMaterialsSection() {
    const materialLogos = document.querySelectorAll('.material-logo');
    const materialInfos = document.querySelectorAll('.material-info');
    
    if (materialLogos.length === 0 || materialInfos.length === 0) {
        return;
    }

    // Pokazuj pierwszy materiał domyślnie
    if (materialLogos[0] && materialInfos[0]) {
        materialLogos[0].classList.add('active');
        materialInfos[0].classList.add('active');
    }

    materialLogos.forEach(logo => {
        // Tylko w wersji desktop dodaj obsługę hover (wyłączona dla PC 1025px+)
        if (window.innerWidth > 768 && window.innerWidth < 1025) {
            logo.addEventListener('mouseenter', function() {
                const materialType = this.dataset.material;
                
                // Usuń aktywne klasy
                materialLogos.forEach(l => l.classList.remove('active'));
                materialInfos.forEach(i => i.classList.remove('active'));
                
                // Dodaj aktywne klasy
                this.classList.add('active');
                const targetInfo = document.getElementById(`${materialType}-info`);
                if (targetInfo) {
                    targetInfo.classList.add('active');
                }
            });
        }
    });
}

// ==========================================
// OBSŁUGA ROZSZERZONEJ GALERII
// ==========================================

/**
 * Dopasowanie wielkości tytułów w okienkach realizacji — gdy tytuł nie mieści się
 * między górną kreską a przyciskiem, czcionka jest zmniejszana.
 */
function fitGalleryTitles() {
    document.querySelectorAll('.gallery-item-info h3').forEach(h3 => {
        const info = h3.closest('.gallery-item-info');
        h3.style.fontSize = '';
        if (!h3.offsetParent || h3.clientHeight === 0) return;
        // tytuł + najmniejszy odstęp od kreski i od przycisku musi zmieścić się w polu nad przyciskiem
        const gap = parseFloat(getComputedStyle(info).getPropertyValue('--info-gap')) * parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const room = h3.clientHeight - 2 * gap;
        const range = document.createRange();
        range.selectNodeContents(h3);
        let size = parseFloat(getComputedStyle(h3).fontSize);
        while (range.getBoundingClientRect().height > room && size > 10) {
            size -= 0.5;
            h3.style.fontSize = size + 'px';
        }
    });
}

function initializeGalleryTitleFit() {
    fitGalleryTitles();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitGalleryTitles);
    window.addEventListener('load', fitGalleryTitles);
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fitGalleryTitles, 150); });
    const btn = document.getElementById('showAllGalleryBtn');
    if (btn) btn.addEventListener('click', () => {
        const n = document.querySelectorAll('.extended-gallery-item').length;
        setTimeout(fitGalleryTitles, 60);
        setTimeout(fitGalleryTitles, n * 100 + 200);
    });
}

/**
 * Funkcja inicjalizująca obsługę przełączania galerii
 * Obsługuje pokazywanie/ukrywanie dodatkowych elementów galerii
 */
function initializeGalleryToggle() {
    const showAllBtn = document.getElementById('showAllGalleryBtn');
    const gallery = document.querySelector('.gallery');
    const extendedItems = document.querySelectorAll('.extended-gallery-item');
    const btnText = showAllBtn.querySelector('.btn-text');
    const btnArrowLeft = showAllBtn.querySelector('.btn-arrow-left');
    const btnArrowRight = showAllBtn.querySelector('.btn-arrow');
    
    if (!showAllBtn || !gallery || extendedItems.length === 0) {
        return;
    }
    
    
    let isExpanded = false;
    const lang = (document.documentElement.lang || 'pl').slice(0, 2);
    const labelMore = { de: 'MEHR ANZEIGEN', en: 'SHOW MORE' }[lang] || 'POKAŻ WIĘCEJ';
    const labelLess = { de: 'WENIGER ANZEIGEN', en: 'SHOW LESS' }[lang] || 'POKAŻ MNIEJ';
    
    showAllBtn.addEventListener('click', function() {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            // Rozszerzamy galerię
            gallery.classList.add('expanded');
            showAllBtn.classList.add('expanded');
            btnText.textContent = labelLess;
            if (btnArrowLeft) btnArrowLeft.textContent = '↑';
            if (btnArrowRight) btnArrowRight.textContent = '↑';
            
            // Pokazujemy dodatkowe elementy z animacją
            extendedItems.forEach((item, index) => {
                const galleryNum = item.getAttribute('data-gallery');
                setTimeout(() => {
                    item.style.display = 'block';
                    // Małe opóźnienie dla efektu fade-in
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                }, index * 100); // Opóźnienie dla każdego elementu
            });
            
        } else {
            // Zwijamy galerię
            gallery.classList.remove('expanded');
            showAllBtn.classList.remove('expanded');
            btnText.textContent = labelMore;
            if (btnArrowLeft) btnArrowLeft.textContent = '↓';
            if (btnArrowRight) btnArrowRight.textContent = '↓';
            
            // Ukrywamy dodatkowe elementy z animacją
            extendedItems.forEach((item, index) => {
                const galleryNum = item.getAttribute('data-gallery');
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    // Ukrywamy element po animacji
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }, index * 50);
            });
        }
    });
    
    // Inicjalizujemy style dla dodatkowych elementów
    extendedItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
    
}

// ==========================================
// OBSŁUGA SCROLL-REVEAL DLA GALERII W WERSJI MOBILNEJ
// ==========================================

/**
 * Funkcja inicjalizująca scroll-reveal dla elementów galerii we wszystkich wersjach
 * Płynnie kontroluje widoczność opisów na podstawie pozycji elementu względem centrum ekranu
 */
function initializeGalleryScrollReveal() {
    // Funkcja działa dla wszystkich rozmiarów ekranu - mobile, tablet i desktop
    // Efekty CSS są odpowiednio dostosowane w media queries
    
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (galleryItems.length === 0) {
        return;
    }
    
    // Funkcja do obliczania pozycji elementu względem centrum ekranu
    function calculateVisibilityLevel(element) {
        const rect = element.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        
        // Oblicz odległość od centrum
        const distance = Math.abs(elementCenter - viewportCenter);
        
        // Strefa pełnej widoczności - element jest w 100% widoczny w tym zakresie
        const fullVisibilityZone = window.innerHeight * 0.15; // 15% wysokości ekranu w każdą stronę od centrum
        
        // Maksymalna odległość, przy której element jest jeszcze aktywny
        const maxActiveDistance = window.innerHeight * 0.4; // 40% wysokości ekranu
        
        let visibilityLevel;
        
        if (distance <= fullVisibilityZone) {
            // Element jest w strefie pełnej widoczności - 100%
            visibilityLevel = 1.0;
        } else {
            // Element jest poza strefą pełnej widoczności - oblicz stopniową widoczność
            const fadeDistance = distance - fullVisibilityZone;
            const maxFadeDistance = maxActiveDistance - fullVisibilityZone;
            visibilityLevel = 1 - (fadeDistance / maxFadeDistance);
            
            // Ograniczamy do zakresu 0-1
            visibilityLevel = Math.max(0, Math.min(1, visibilityLevel));
            
            // Stosujemy funkcję easing dla płynniejszego przejścia tylko w strefie fade
            visibilityLevel = easeInOutCubic(visibilityLevel);
        }
        
        return visibilityLevel;
    }
    
    // Funkcja easing dla płynniejszych przejść
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Funkcja do aktualizacji elementu na podstawie jego pozycji
    function updateElementVisibility(element) {
        const visibilityLevel = calculateVisibilityLevel(element);
        
        if (visibilityLevel > 0) {
            // Element jest aktywny - dodaj klasę i ustaw poziom widoczności
            element.classList.add('mobile-active');
            element.style.setProperty('--visibility-level', visibilityLevel.toFixed(3));
        } else {
            // Element jest nieaktywny - usuń klasę i zresetuj poziom
            element.classList.remove('mobile-active');
            element.style.removeProperty('--visibility-level');
        }
    }
    
    // Główna funkcja obsługi scroll
    function handleScroll() {
        galleryItems.forEach(updateElementVisibility);
    }
    
    // Debounced scroll handler dla lepszej wydajności
    let scrollRAF = null;
    function smoothScrollHandler() {
        if (scrollRAF) return;
        
        scrollRAF = requestAnimationFrame(() => {
            handleScroll();
            scrollRAF = null;
        });
    }
    
    // Dodanie event listenera
    window.addEventListener('scroll', smoothScrollHandler, { passive: true });
    
    // Inicjalne wywołanie
    handleScroll();
    
    // Obsługa zmiany orientacji/rozmiaru ekranu - działamy na wszystkich rozdzielczościach
    window.addEventListener('resize', () => {
        // Po zmianie rozmiaru okna, ponownie oceń elementy
        handleScroll();
    });
    
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Funkcja sprawdzająca czy element jest widoczny na ekranie
 * @param {Element} element - Element do sprawdzenia
 * @returns {boolean} - Czy element jest widoczny
 */
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Funkcja płynnego przewijania do elementu
 * @param {string} selector - Selektor CSS elementu
 * @param {number} offset - Przesunięcie (opcjonalne)
 */
function scrollToElement(selector, offset = 0) {
    const element = document.querySelector(selector);
    if (element) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
        });
    }
}

// ==========================================
// INICJALIZACJA WSZYSTKICH FUNKCJI
// ==========================================

/**
 * Główna funkcja inicjalizacyjna
 * Uruchamia wszystkie funkcje po załadowaniu DOM
 */
function initializeApp() {
    try {
        // Wczesne wywołanie pozycjonowania scroll bannera
        setupDynamicScrollBannerForMobile();
        
        initializeHeaderAnimations();
        // Wymuszanie układu pionowego dla logos-container
        const logos = document.querySelectorAll('.logos-container');
        logos.forEach(el => {
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.gap = '0.5rem';
        });
        initializeMenuHandlers();
        initializeAboutSectionScroll();
        initializeContentRevealAnimations();
        if (!initializeMaterialFlow()) {   // PL: 3 kafelki 3D; DE/EN: dawna sekcja z podkategoriami
            initializeSubBanners();
            initializeMaterialShowcase(); // pokaz kategorii (zastąpił initializeCyclicBannerAnimation)
            initializeProjectHeightObserver(); // Dodanie obserwatora wysokości sekcji project
        }
        initializeGalleryToggle();
        initializeGalleryTitleFit();
        initializeGalleryScrollReveal();
        initializeSectionScrollFx();   // wjazd/wyjazd sekcji przy przewijaniu
        
        initializeMobileAboutAnimation();
        
    } catch (error) {
        console.error('Error initializing Zanders Atelier app:', error);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Uruchomienie aplikacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', initializeApp);

// Obsługa zmiany rozmiaru okna
window.addEventListener('resize', function() {
    // Tutaj można dodać funkcje reagujące na zmianę rozmiaru okna
    
    // Event listenery są już prawidłowo skonfigurowane z warunkami window.innerWidth
    // Nie ma potrzeby ponownej inicjalizacji
});

// Obsługa scroll'a strony (ogólne)
window.addEventListener('scroll', function() {
    // Tutaj można dodać funkcje reagujące na scroll strony
    // Uwaga: funkcja scroll dla sekcji "O Nas" jest osobno w initializeAboutSectionScroll
});

// ==========================================
// OBSŁUGA ANIMACJI SEKCJI "O NAS" - MOBILE
// ==========================================

/**
 * Funkcja inicjalizująca obsługę przycisku ROZWIŃ w sekcji mobile
 * Obsługuje animację rozwijania i zwijania sekcji O NAS
 */
function initializeMobileAboutAnimation() {
    const expandButton = document.querySelector('.mobile-expand');
    const collapseButton = document.querySelector('.banner-collapse-arrow');
    const aboutSection = document.querySelector('#about');
    const mobileLabels = document.querySelector('.mobile-about-labels');
    
    if (!expandButton || !aboutSection || !mobileLabels || !collapseButton) return;
    
    let isExpanded = false;
    // napisy „O Nas → ROZWIŃ” odjeżdżają w lewo / wracają z animacją tylko na czas przełączenia
    // (na co dzień ich położenie steruje animacja przewijania — tam przejście CSS by ją opóźniało)
    function animateLabels() {
        mobileLabels.classList.add('labels-moving');
        clearTimeout(animateLabels.t);
        animateLabels.t = setTimeout(() => mobileLabels.classList.remove('labels-moving'), 750);
    }
    
    // Funkcja do rozwijania sekcji
    function expandSection() {
        aboutSection.classList.add('about-expanded');
        animateLabels();
        mobileLabels.classList.add('labels-hidden');
        
        // Dodanie klasy do pokazania tekstu z opóźnieniem (po zakończeniu animacji prostokąta)
        setTimeout(() => {
            aboutSection.classList.add('content-visible');
        }, 1000); // Opóźnienie 1 sekunda - po zakończeniu animacji prostokąta
        
        isExpanded = true;
    }
    
    // Funkcja do zwijania sekcji
    function collapseSection() {
        aboutSection.classList.remove('about-expanded');
        aboutSection.classList.remove('content-visible');
        animateLabels();
        mobileLabels.classList.remove('labels-hidden');
        isExpanded = false;
    }
    
    // Obsługa kliknięcia w przycisk ROZWIŃ
    expandButton.addEventListener('click', function() {
        if (!isExpanded) {
            expandSection();
        }
    });
    
    // Obsługa kliknięcia w strzałkę zwijania
    collapseButton.addEventListener('click', function() {
        if (isExpanded) {
            collapseSection();
        }
    });
}

// ==========================================
// OBSŁUGA POD-BANERÓW MATERIAŁÓW
// ==========================================

/**
 * Funkcja inicjalizująca obsługę pod-banerów w sekcji materiałów
 * Obsługuje hover na desktop i kliknięcia na mobile z płynnymi animacjami
 */
function initializeSubBanners() {
    const materialLogos = document.querySelectorAll('.material-logo');
    const subBanners = document.querySelectorAll('.sub-banner');
    const materialsInfo = document.querySelectorAll('.material-info');
    
    // Funkcja pokazująca odpowiedni opis materiału
    function showMaterialInfo(materialId) {
        
        // Ukryj wszystkie opisy i usuń klasy active
        materialsInfo.forEach(info => {
            info.style.display = 'none';
            info.classList.remove('active', 'fade-in');
        });
        
        // Pokaż wybrany opis z odpowiednimi klasami
        const targetInfo = document.getElementById(materialId + '-info');
        
        if (targetInfo) {
            targetInfo.style.display = 'block';
            targetInfo.classList.add('active');
        } else {
            console.error('Element not found:', materialId + '-info');
        }
        
        // W wersji mobilnej pokaż sekcję materials-info
        if (window.innerWidth <= 768) {
            const materialsInfoSection = document.querySelector('#project .materials-info');
            if (materialsInfoSection) {
                materialsInfoSection.classList.add('mobile-visible');
                // Dostosuj wysokość sekcji po pokazaniu bannera
                setTimeout(() => {
                    if (window.adjustProjectSectionHeight) {
                        window.adjustProjectSectionHeight();
                    }
                }, 100);
            }
        }
        
        // Zmień tło sekcji w zależności od wybranego materiału
        const projectSection = document.getElementById('project');
        if (projectSection) {
            projectSection.setAttribute('data-active-material', materialId);
        }
    }
    
    // Funkcja płynnego pokazywania pod-banerów - wszystkie jednocześnie
    function showSubBanners(materialLogo) {
        materialLogo.classList.add('expanded');
        const subBannersContainer = materialLogo.querySelector('.sub-banners');
        if (subBannersContainer) {
            const subBanners = subBannersContainer.querySelectorAll('.sub-banner');
            subBanners.forEach((subBanner) => {
                subBanner.classList.add('show');
            });
        }
    }
    
    // Funkcja płynnego ukrywania pod-banerów
    function hideSubBanners(materialLogo) {
        const subBannersContainer = materialLogo.querySelector('.sub-banners');
        if (subBannersContainer) {
            const subBanners = subBannersContainer.querySelectorAll('.sub-banner');
            subBanners.forEach((subBanner) => {
                subBanner.classList.remove('show');
            });
            // Usuń klasę expanded po ukryciu wszystkich pod-banerów
            setTimeout(() => {
                materialLogo.classList.remove('expanded');
                // Dostosuj wysokość sekcji po ukryciu sub-banerów
                if (window.adjustProjectSectionHeight) {
                    window.adjustProjectSectionHeight();
                }
            }, 300); // Czas trwania animacji CSS
        }
    }
    
    // Funkcja ukrywająca wszystkie pod-banery
    function hideAllSubBanners() {
        const allSubBanners = document.querySelectorAll('.sub-banner');
        allSubBanners.forEach(subBanner => {
            subBanner.classList.remove('show');
        });
        
        // Ukryj wszystkie opisy materiałów
        materialsInfo.forEach(info => {
            info.style.display = 'none';
            info.classList.remove('active', 'fade-in');
        });
        
        // W wersji mobilnej ukryj też sekcję materials-info
        if (window.innerWidth <= 768) {
            const materialsInfoSection = document.querySelector('#project .materials-info');
            if (materialsInfoSection) {
                materialsInfoSection.classList.remove('mobile-visible');
                // Dostosuj wysokość sekcji po ukryciu bannera
                setTimeout(() => {
                    if (window.adjustProjectSectionHeight) {
                        window.adjustProjectSectionHeight();
                    }
                }, 100);
            }
        } else {
            // Na desktopie również dostosuj wysokość po ukryciu
            setTimeout(() => {
                if (window.adjustProjectSectionHeight) {
                    window.adjustProjectSectionHeight();
                }
            }, 100);
        }
    }
    
    // Obsługa kliknięć w pod-banery
    subBanners.forEach(subBanner => {
        subBanner.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // ZATRZYMAJ ANIMACJE CYKLICZNE po wyborze sub-bannera
            stopCyclicAnimation();
            
            // Usuń active ze wszystkich pod-banerów
            subBanners.forEach(sb => sb.classList.remove('active'));
            
            // Dodaj active do klikniętego
            this.classList.add('active');
            
            // Zwiń wszystkie główne banery po wyborze podbaneru (na mobile i desktop)
            const materialsLogosContainer = document.querySelector('.materials-logos');
            materialLogos.forEach(logo => {
                logo.classList.remove('expanded');
            });
            if (materialsLogosContainer) {
                materialsLogosContainer.classList.remove('banner-expanded'); // Pokaż wszystkie banery
            }
            
            // Pauzuj zmianę wysokości sekcji podczas animacji
            heightAdjustmentPaused = true;
            
            const materialId = this.getAttribute('data-material');
            showMaterialInfo(materialId);
            
            // Odpauzuj zmianę wysokości po zakończeniu animacji
            setTimeout(() => {
                heightAdjustmentPaused = false;
                
                // Po odpauzowaniu, dostosuj wysokość sekcji
                if (window.adjustProjectSectionHeight) {
                    window.adjustProjectSectionHeight();
                }
            }, 800); // Krótszy timeout dla zmiany opisu
        });
    });
    
    // Obsługa głównych banerów
    materialLogos.forEach(logo => {
        const materialId = logo.getAttribute('data-material');
        const materialsLogosContainer = document.querySelector('.materials-logos');
        
        // Obsługa kliknięć dla wszystkich rozdzielczości (mobile i desktop)
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            
            const subBannersContainer = this.querySelector('.sub-banners');
            const isExpanded = subBannersContainer && subBannersContainer.querySelector('.sub-banner.show');

            // Klik w baner główny = powrót do poziomu kategorii: zwalniamy wybrany materiał.
            // Animacja ruszy znów 8 s po zwinięciu banera (stopCyclicAnimation sprawdza stan).
            subBanners.forEach(sb => sb.classList.remove('active'));

            // Zamknij wszystkie inne banery
            materialLogos.forEach(otherLogo => {
                if (otherLogo !== this) {
                    hideSubBanners(otherLogo);
                    otherLogo.classList.remove('expanded');
                }
            });
            
            // Toggle obecnego banera
            if (!isExpanded) {
                // Pauzuj zmianę wysokości sekcji podczas animacji rozwijania
                heightAdjustmentPaused = true;
                
                this.classList.add('expanded');
                materialsLogosContainer.classList.add('banner-expanded'); // Ukryj pozostałe banery
                showSubBanners(this);
                showMaterialInfo(materialId);
                
                // Odpauzuj zmianę wysokości po zakończeniu animacji
                setTimeout(() => {
                    heightAdjustmentPaused = false;
                    
                    // Po odpauzowaniu, dostosuj wysokość sekcji
                    if (window.adjustProjectSectionHeight) {
                        window.adjustProjectSectionHeight();
                    }
                }, 1800); // 1.5s animacja CSS + 300ms bufora
            } else {
                // Pauzuj zmianę wysokości sekcji podczas animacji zwijania
                heightAdjustmentPaused = true;
                
                this.classList.remove('expanded');
                materialsLogosContainer.classList.remove('banner-expanded'); // Pokaż wszystkie banery
                hideSubBanners(this);
                
                // Odpauzuj zmianę wysokości po zakończeniu animacji zwijania
                setTimeout(() => {
                    heightAdjustmentPaused = false;
                    
                    // Po odpauzowaniu, dostosuj wysokość sekcji
                    if (window.adjustProjectSectionHeight) {
                        window.adjustProjectSectionHeight();
                    }
                }, 1800); // 1.5s animacja CSS + 300ms bufora
            }
        });
    });
    
    // Obsługa kliknięć poza banerami - zamykanie wszystkich rozwinięych banerów (mobile i desktop)
    document.addEventListener('click', function(e) {
        // Reset tylko po kliknięciu w PUSTY obszar samej sekcji materiałów. Wcześniej każdy klik
        // gdziekolwiek na stronie (menu, czat, powiększenie zdjęcia w PhotoSwipe) kasował wybór
        // i przywracał „Płyty meblowe”.
        if (!e.target.closest('#project') || e.target.closest('.pswp')) return;
        if (!materialSelectionActive()) return;
        // Sprawdź czy kliknięty element nie jest częścią material-logo ani materials-info
        const clickedInsideMaterialLogo = e.target.closest('.material-logo');
        const clickedInsideMaterialsInfo = e.target.closest('.materials-info');

        if (!clickedInsideMaterialLogo && !clickedInsideMaterialsInfo) {
            subBanners.forEach(sb => sb.classList.remove('active'));
            stopCyclicAnimation();   // odlicza 8 s i wznawia animację (nic już nie jest wybrane)
            // Pauzuj zmianę wysokości sekcji podczas zamykania banerów
            heightAdjustmentPaused = true;
            
            // Kliknięto poza banerami - zamknij wszystkie
            const materialsLogosContainer = document.querySelector('.materials-logos');
            materialLogos.forEach(logo => {
                if (logo.classList.contains('expanded')) {
                    logo.classList.remove('expanded');
                    hideSubBanners(logo);
                }
            });
            materialsLogosContainer.classList.remove('banner-expanded'); // Pokaż wszystkie banery
            
            // Ukryj wszystkie opisy materiałów i wróć do stanu początkowego
            hideAllSubBanners();
            
            // Pokaż domyślny opis po krótkim czasie
            setTimeout(() => {
                showMaterialInfo('plyty-meblowe');
            }, 200);
            
            // Odpauzuj zmianę wysokości po zakończeniu wszystkich animacji
            setTimeout(() => {
                heightAdjustmentPaused = false;
                
                // Po odpauzowaniu, dostosuj wysokość sekcji
                if (window.adjustProjectSectionHeight) {
                    window.adjustProjectSectionHeight();
                }
            }, 1800); // 1.5s animacja CSS + 300ms bufora
        }
    });
    
    // Pokaż domyślnie pierwszy opis
    showMaterialInfo('plyty-meblowe');
}

// ==========================================
// OBSŁUGA ROZWIJANIA SZCZEGÓŁÓW PRODUCENTÓW
// ==========================================

/**
 * Funkcja do rozwijania/zwijania szczegółów producentów
 * @param {string} producerId - ID producenta
 */
function toggleProducerDetails(producerId) {
    const detailsElement = document.getElementById(producerId + '-details');
    const headerElement = document.querySelector(`[onclick="toggleProducerDetails('${producerId}')"]`);
    const toggleIcon = headerElement.querySelector('.toggle-icon');
    
    if (!detailsElement) return;
    
    // Sprawdź czy szczegóły są obecnie widoczne
    const isVisible = detailsElement.style.display !== 'none';
    
    if (isVisible) {
        // Ukryj szczegóły
        detailsElement.style.display = 'none';
        toggleIcon.textContent = '▼';
        headerElement.classList.remove('active');
    } else {
        // Pokaż szczegóły
        detailsElement.style.display = 'block';
        toggleIcon.textContent = '▲';
        headerElement.classList.add('active');
    }
}

// ==========================================
// POKAZ KATEGORII MATERIAŁÓW (napisany od nowa 2026-11-04)
// ==========================================

/**
 * Automatyczny pokaz trzech kategorii (Płyty meblowe → Fronty meblowe → Blaty) co 5 s,
 * z płynnym przejściem zdjęcia i paskiem postępu pod bieżącym banerem.
 *
 * Jedna zasada: KAŻDE dotknięcie/kliknięcie w sekcji materiałów zatrzymuje pokaz od razu
 * i na stałe. Pokaz wraca dopiero, gdy użytkownik sam wróci do widoku trzech banerów
 * (nic rozwiniętego ani wybranego) i przez 6 s niczego w sekcji nie dotknie.
 * Pokaz nie reaguje na najechanie myszą i nic nie przełącza, gdy sekcji nie widać.
 */
function initializeMaterialShowcase() {
    const section = document.getElementById('project');
    const logos = Array.from(document.querySelectorAll('#project .material-logo'));
    if (!section || logos.length === 0) return;

    const STEP_MS = 5000;     // co ile zmienia się kategoria
    const RESUME_MS = 6000;   // po ilu ms spokoju (i bez wyboru) pokaz wraca
    let index = 0;
    let timer = null;
    let resumeTimer = null;
    let visible = false;
    let userMode = false;     // true = użytkownik przejął sterowanie

    const canRun = () => !userMode && visible && !materialSelectionActive();

    // Pasek postępu jako osobny element (tło banera rysuje ::before, które zasłoniłoby tło-pasek)
    logos.forEach(l => {
        if (!l.querySelector('.showcase-bar')) {
            const bar = document.createElement('span');
            bar.className = 'showcase-bar';
            bar.setAttribute('aria-hidden', 'true');
            l.appendChild(bar);
        }
    });

    function markCurrent(i) {
        logos.forEach(l => l.classList.remove('showcase-current'));
        if (i === null) return;
        void logos[i].offsetWidth;            // restart paska postępu
        logos[i].classList.add('showcase-current');
    }

    function show(i) {
        const logo = logos[i];
        const info = document.getElementById(logo.dataset.material + '-info');
        if (!info) return;
        globalCyclicAnimationActive = true;   // obserwatory wysokości nie ruszają sekcji (bez skakania strony)
        document.querySelectorAll('#project .material-info').forEach(el => {
            if (el !== info) {
                el.classList.remove('active', 'fade-in', 'showcase-enter');
                el.style.display = 'none';
            }
        });
        info.style.display = 'block';
        info.classList.add('active');
        info.classList.remove('showcase-enter');
        void info.offsetWidth;
        info.classList.add('showcase-enter');
        section.setAttribute('data-active-material', logo.dataset.material);
        index = i;
        markCurrent(i);
        setTimeout(() => { globalCyclicAnimationActive = false; }, 400);
    }

    function stop() {
        clearInterval(timer);
        timer = null;
        markCurrent(null);
    }

    function start() {
        if (timer || !canRun()) return;
        // kontynuuj od kategorii, która jest teraz na ekranie (np. ostatnio kliknięte „Blaty”)
        const shown = logos.findIndex(l => l.dataset.material === section.getAttribute('data-active-material'));
        if (shown >= 0) index = shown;
        markCurrent(index);
        timer = setInterval(() => {
            if (!canRun()) { stop(); return; }
            show((index + 1) % logos.length);
        }, STEP_MS);
    }

    // Użytkownik dotknął sekcji: stop od razu; za RESUME_MS sprawdź, czy wrócił do widoku banerów.
    function userAction() {
        userMode = true;
        stop();
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
            if (materialSelectionActive()) return;    // coś wybrane — czekamy na kolejną akcję
            userMode = false;
            start();
        }, RESUME_MS);
    }

    // „capture”, żeby zadziałało przed innymi obsługami (np. stopPropagation w pod-banerach)
    section.addEventListener('pointerdown', userAction, true);
    section.addEventListener('keydown', userAction, true);

    new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            visible = entry.isIntersecting;
            if (visible) start(); else stop();
        });
    }, { threshold: 0.15 }).observe(section);

    window.materialShowcase = { userAction, stop };
}

// ==========================================
// DYNAMICZNE USTAWIANIE WYSOKOŚCI SEKCJI PROJECT
// ==========================================

/**
 * Funkcja dynamicznie ustawiająca wysokość sekcji project
 * tak aby kończyła się zaraz pod aktualnie widocznym banerem
 */
function adjustProjectSectionHeight() {
    // Jeśli zmiana wysokości jest spauzowana, nie wykonuj funkcji
    if (heightAdjustmentPaused) {
        return;
    }
    
    const projectSection = document.getElementById('project');
    const materialsInfoSection = document.querySelector('#project .materials-info');
    
    if (!projectSection) return;
    
    // Sprawdź czy to mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Na mobile sprawdź czy materials-info jest widoczne
        const isInfoVisible = materialsInfoSection && materialsInfoSection.classList.contains('mobile-visible');
        
        if (isInfoVisible) {
            // Znajdź aktywny baner
            const activeMaterialInfo = document.querySelector('.material-info.active');
            
            if (activeMaterialInfo) {
                // NIE resetuj wysokości - oblicz od razu finalną wartość
                setTimeout(() => {
                    // Oblicz pozycję końca aktywnego banera względem sekcji project
                    const projectRect = projectSection.getBoundingClientRect();
                    const bannerRect = activeMaterialInfo.getBoundingClientRect();
                    
                    // Oblicz gdzie powinien kończyć się project (zaraz pod banerem)
                    const bannerBottom = bannerRect.bottom;
                    const projectTop = projectRect.top;
                    const bannerEndRelativeToProject = bannerBottom - projectTop;
                    
                    // Oblicz minimalną wysokość bazową (bez aktywnego bannera)
                    const materialsLogos = document.querySelector('.materials-logos');
                    const baseHeight = materialsLogos ? materialsLogos.offsetHeight + 100 : 400;
                    
                    // Ustaw wysokość jako większą z: wysokość bazowa lub wysokość potrzebna na baner
                    const neededHeight = Math.max(bannerEndRelativeToProject + 20, baseHeight);
                    
                    projectSection.style.minHeight = neededHeight + 'px';
                    
                }, 10);
            }
        } else {
            // Jeśli baner nie jest widoczny, usuń minimalną wysokość
            projectSection.style.minHeight = '';
        }
    } else {
        // Na desktop wywołaj specjalną funkcję dla PC
        const isPC = window.innerWidth >= 1025;
        if (isPC) {
            adjustProjectSectionHeightForPC();
        } else {
            // Na tablet usuń minimalną wysokość
            projectSection.style.minHeight = '';
        }
    }
}

/**
 * Funkcja specjalnie dla PC - dostosowuje wysokość sekcji project
 * Najpierw minimalizuje przerwę między banerami a kontenerem ze zdjęciem,
 * potem ustawia koniec sekcji zaraz pod kontenerem
 */
function adjustProjectSectionHeightForPC() {
    // Jeśli zmiana wysokości jest spauzowana, nie wykonuj funkcji
    if (heightAdjustmentPaused) {
        return;
    }
    
    const projectSection = document.getElementById('project');
    const materialsInfoSection = document.querySelector('#project .materials-info');
    const materialsLogos = document.querySelector('#project .materials-logos');
    
    if (!projectSection || !materialsInfoSection) return;
    
    // NIE resetuj wysokości - oblicz od razu finalną wartość
    setTimeout(() => {
        // 1. Oblicz rzeczywistą wysokość całego kontenera z banerami (włącznie z rozwiniętymi sub-banerami)
        const materialsLogosRect = materialsLogos.getBoundingClientRect();
        const materialsLogosHeight = materialsLogosRect.height;
        
        // 2. Znajdź aktywny material-info aby określić jego wysokość
        const activeMaterialInfo = document.querySelector('.material-info.active');
        let materialsInfoHeight = 0;
        
        if (activeMaterialInfo) {
            // Oblicz rzeczywistą wysokość aktywnego kontenera ze zdjęciem i opisami
            materialsInfoHeight = activeMaterialInfo.getBoundingClientRect().height;
        } else {
            // Jeśli nie ma aktywnego, oszacuj bazową wysokość
            materialsInfoHeight = 300;
        }
        
        // 3. Oblicz minimalną przerwę między banerami a kontenerem (zmniejszoną)
        const minGapBetweenBannersAndInfo = 20; // Minimalna przerwa 20px
        
        // 4. Oblicz całkowitą potrzebną wysokość sekcji:
        // - Nagłówek h2 (~70px z marginesami)
        // - Banery główne + rozwiniete sub-banery (materialsLogosHeight)
        // - Minimalna przerwa (20px)
        // - Kontener ze zdjęciem i opisami (materialsInfoHeight)
        // - Margines dolny (50px - zwiększony dla pełnej widoczności)
        
        const headerHeight = 70; // Nagłówek + marginesy
        const bottomMargin = 50; // Zwiększony dolny margines
        
        const totalNeededHeight = headerHeight + 
                                materialsLogosHeight + 
                                minGapBetweenBannersAndInfo + 
                                materialsInfoHeight + 
                                bottomMargin;
        
        // 5. Ustaw wysokość sekcji - dodaj dodatkowy bufor dla bezpieczeństwa
        const finalHeight = Math.max(totalNeededHeight, 800); // Minimum 800px
        projectSection.style.minHeight = finalHeight + 'px';
        
        // 6. Dostosuj pozycję materials-info aby była tuż pod banerami
        const newTopPosition = headerHeight + materialsLogosHeight + minGapBetweenBannersAndInfo;
        materialsInfoSection.style.top = newTopPosition + 'px';
        
            
    }, 50); // Zwiększone opóźnienie na pełne renderowanie
}

/**
 * Inicjalizacja obserwatora zmian dla automatycznego dopasowywania wysokości
 */
function initializeProjectHeightObserver() {
    const materialsInfoSection = document.querySelector('#project .materials-info');
    const materialInfos = document.querySelectorAll('.material-info');
    
    if (!materialsInfoSection) return;
    
    // Observer do obserwowania zmian klas w materials-info
    const classObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // NIE dostosowuj wysokości podczas cyklicznej animacji na desktop
                // Ale na mobile (<=768px) i tak dopasowujemy, żeby UI było responsywne
                if (!globalCyclicAnimationActive || window.innerWidth <= 768) {
                    setTimeout(adjustProjectSectionHeight, 100); // Małe opóźnienie na renderowanie
                }
            }
        });
    });
    
    classObserver.observe(materialsInfoSection, {
        attributes: true,
        attributeFilter: ['class']
    });
    
    // Observer do obserwowania zmian w material-info elementach
    materialInfos.forEach((info) => {
        const infoObserver = new MutationObserver(() => {
            // NIE dostosowuj wysokości podczas cyklicznej animacji na desktop
            // Ale na mobile (<=768px) i tak dopasowujemy
            if (!globalCyclicAnimationActive || window.innerWidth <= 768) {
                setTimeout(adjustProjectSectionHeight, 100);
            }
        });
        
        infoObserver.observe(info, {
            attributes: true,
            attributeFilter: ['class'],
            childList: true,
            subtree: true
        });
    });
    
    // Observer do obserwowania zmian klas w material-logo (dla expanded)
    const materialLogos = document.querySelectorAll('#project .material-logo');
    materialLogos.forEach((logo) => {
        const logoObserver = new MutationObserver(() => {
            // NIE dostosowuj wysokości podczas cyklicznej animacji na desktop
            // Ale na mobile (<=768px) i tak dopasowujemy
            if (!globalCyclicAnimationActive || window.innerWidth <= 768) {
                setTimeout(adjustProjectSectionHeight, 100);
            }
        });
        
        logoObserver.observe(logo, {
            attributes: true,
            attributeFilter: ['class']
        });
    });
    
    // Observer do obserwowania zmian rozmiaru okna
    window.addEventListener('resize', () => {
        setTimeout(adjustProjectSectionHeight, 100);
    });
    
    // Inicjalne ustawienie
    setTimeout(adjustProjectSectionHeight, 200);
    
}

// ==========================================
// DYNAMICZNE POZYCJONOWANIE SCROLL BANNERA DLA BANERM.PNG
// ==========================================

/**
 * Funkcja do dynamicznego pozycjonowania scroll bannera na 34% wysokości banerm.png
 */
function setupDynamicScrollBannerForMobile() {
    const scrollBanner = document.querySelector('.scroll-banner');
    const header = document.querySelector('header');
    
    if (!scrollBanner || !header) {
        console.warn('Scroll banner or header not found');
        return;
    }
    

    function updateScrollBannerPosition() {
        // Sprawdź czy to urządzenie mobilne z banerm.png (≤480px)
        if (window.innerWidth <= 480) {
            const bannerImage = header.querySelector('img[src*="baner"]');
            if (bannerImage) {
                // Sprawdź czy obraz się załadował
                if (bannerImage.complete && bannerImage.naturalHeight !== 0) {
                    // Pobierz pozycję obrazka w dokumencie
                    const imageRect = bannerImage.getBoundingClientRect();
                    const imageHeight = imageRect.height;
                    const imageTopInDocument = imageRect.top + window.pageYOffset;
                    
                    // 32.5% wysokości obrazka od góry MINUS połowa wysokości bannera (15px)
                    // żeby banner był wyśrodkowany na pozycji 32.5%
                    const targetPosition = imageTopInDocument + (imageHeight * 0.325) - 30;
                    
                    // Ustaw pozycjonowanie absolutne
                    scrollBanner.style.position = 'absolute';
                    scrollBanner.style.top = `${targetPosition}px`;
                    scrollBanner.style.left = '0';
                    scrollBanner.style.width = '100%';
                    scrollBanner.style.zIndex = '10';
                    scrollBanner.style.margin = '0';
                    
                } else {
                    // Jeśli obraz się jeszcze nie załadował, spróbuj ponownie po krótkim opóźnieniu
                    setTimeout(updateScrollBannerPosition, 100);
                }
            }
        } else {
            // Na większych ekranach przywróć domyślne pozycjonowanie CSS
            scrollBanner.style.position = '';
            scrollBanner.style.top = '';
            scrollBanner.style.left = '';
            scrollBanner.style.width = '';
            scrollBanner.style.zIndex = '';
            scrollBanner.style.margin = '';
        }
    }

    // Ustaw początkową pozycję od razu
    updateScrollBannerPosition();
    
    // Dodatkowe wywołania z opóźnieniem dla pewności
    setTimeout(updateScrollBannerPosition, 100);  // Po 100ms
    setTimeout(updateScrollBannerPosition, 300);  // Po 300ms
    setTimeout(updateScrollBannerPosition, 500);  // Po 500ms
    setTimeout(updateScrollBannerPosition, 1000); // Po 1s
    
    // Nasłuchuj zmian rozmiaru okna
    window.addEventListener('resize', updateScrollBannerPosition);
    
    // Nasłuchuj załadowania obrazu
    const bannerImage = header.querySelector('img[src*="baner"]');
    if (bannerImage) {
        bannerImage.addEventListener('load', updateScrollBannerPosition);
        // Jeśli obraz jest już załadowany, wywołaj od razu
        if (bannerImage.complete) {
            setTimeout(updateScrollBannerPosition, 50);
        }
    }
    
    // Nasłuchuj orientacji urządzenia
    window.addEventListener('orientationchange', function() {
        setTimeout(updateScrollBannerPosition, 100);
    });
    
    // Dodatkowe sprawdzenie po załadowaniu strony
    window.addEventListener('load', function() {
        setTimeout(updateScrollBannerPosition, 100);
    });
    
    // Sprawdzenie po pełnym załadowaniu DOM i obrazów
    if (document.readyState === 'complete') {
        setTimeout(updateScrollBannerPosition, 50);
    } else {
        document.addEventListener('readystatechange', function() {
            if (document.readyState === 'complete') {
                setTimeout(updateScrollBannerPosition, 100);
            }
        });
    }
    
}

// Udostępnij funkcje globalnie
window.toggleProducerDetails = toggleProducerDetails;
window.adjustProjectSectionHeight = adjustProjectSectionHeight;
window.adjustProjectSectionHeightForPC = adjustProjectSectionHeightForPC;
window.setupDynamicScrollBannerForMobile = setupDynamicScrollBannerForMobile;

// ==========================================
// EKSPORT FUNKCJI (dla ewentualnego użycia w innych plikach)
// ==========================================

// Jeśli używasz modułów ES6, możesz eksportować funkcje:
// export { initializeApp, scrollToElement, isElementVisible, toggleProducerDetails };
// Przesuwane napisy (.mq): stała prędkość w px/s jak dawny <marquee scrollamount>
function initializeMarquees() {
    document.querySelectorAll('.mq').forEach(mq => {
        const track = mq.querySelector('.mq-track');
        const speed = parseFloat(mq.dataset.speed) || 80;
        const set = () => { track.style.animationDuration = (track.scrollWidth / speed) + 's'; };
        set();
        window.addEventListener('resize', set);
    });
}
document.addEventListener('DOMContentLoaded', initializeMarquees);

// ==========================================
// KATEGORIE MATERIAŁÓW — 3 kafelki 3D (wjazd z lewej; 1. klik w boczny / przesunięcie palcem = na środek,
// klik w środkowy = Katalog materiałów; pod spodem opis środkowego). Zwraca false, gdy sekcji nie ma (DE/EN).
// ==========================================
function initializeMaterialFlow() {
    // KATALOG MATERIAŁÓW / AKCESORIÓW na stronie głównej (2026-11-05): dwa pokazy kafelków 3D w sekcji #project,
    // przełącznik w nagłówku (materiały odjeżdżają w lewo, akcesoria wjeżdżają z prawej i odwrotnie).
    // Każdy pokaz: 1. klik w boczny / przesunięcie palcem / strzałka = na środek, klik w środkowy = katalog;
    // pod spodem opis środkowego kafelka. Akcesoria (14 grup) ułożone ciasno: boczne pod większym kątem, wszystkie widoczne.
    const panes = Array.from(document.querySelectorAll('#project .cat-pane'));
    if (!panes.length) return false;
    panes.forEach(initFlowPane);
    initCatalogSwitch(panes);
    return true;
}

function initFlowPane(pane) {
    const flow = pane.querySelector('.mat-flow');
    if (!flow) return;
    const cards = Array.from(flow.querySelectorAll('.mat-card'));
    const descs = Array.from(pane.querySelectorAll('.mat-desc'));
    const dots = Array.from(pane.querySelectorAll('.mat-dot'));
    const packed = flow.dataset.flow === 'packed';
    let active = Math.floor(cards.length / 2);   // start od środka — wachlarz widoczny z obu stron
    let swiped = false;

    // pos = położenie (może być ułamkowe w trakcie przeciągania palcem)
    function layout(animateDesc, pos = active) {
        const mobile = window.matchMedia('(max-width: 768px)').matches;
        const near = Math.round(pos);
        cards.forEach((c, i) => {
            const d = i - pos;
            const ad = Math.abs(d);
            const s = Math.sign(d);
            let tx, tz, rot;
            if (packed) {
                // ciasno: pierwszy boczny wyraźnie odsunięty, kolejne co kawałek, wszystkie pod tym samym, większym kątem
                const base = mobile ? 58 : 62, step = mobile ? 16 : 21, ang = mobile ? 60 : 58;
                if (ad < 1) { tx = d * base; tz = -200 * ad; rot = -d * ang; }
                else { tx = s * (base + (ad - 1) * step); tz = -(200 + (ad - 1) * 45); rot = -s * ang; }
            } else {
                const shift = mobile ? 58 : 72, tilt = mobile ? 45 : 40;
                tx = d * shift;
                tz = -ad * 170;
                rot = -d * tilt;
            }
            c.style.setProperty('--tx', tx + '%');
            c.style.setProperty('--tz', tz + 'px');
            c.style.setProperty('--rot', rot + 'deg');
            c.style.setProperty('--ad', Math.round(ad * 100) / 100);
            c.classList.toggle('is-active', i === near);
            c.setAttribute('aria-current', i === near ? 'true' : 'false');
        });
        dots.forEach((el, i) => el.classList.toggle('is-active', i === active));
        // przy zmianie kafelka wysokość opisu (i sekcji pod nim) zmienia się płynnie, nie skokiem
        const descBox = descs.length ? descs[0].parentElement : null;
        const oldH = animateDesc && descBox ? descBox.offsetHeight : 0;
        descs.forEach((el, i) => {
            el.hidden = i !== active;
            if (i === active && animateDesc) {
                el.classList.remove('mat-desc-in');
                void el.offsetWidth;
                el.classList.add('mat-desc-in');
            }
        });
        if (animateDesc && descBox && oldH) {
            descBox.style.height = '';
            const newH = descBox.offsetHeight;
            if (Math.abs(newH - oldH) > 2) {
                descBox.style.height = oldH + 'px';
                void descBox.offsetHeight;
                descBox.classList.add('desc-resizing');
                descBox.style.height = newH + 'px';
                clearTimeout(descBox._t);
                const done = () => { clearTimeout(descBox._t); descBox.removeEventListener('transitionend', onEnd); descBox.style.height = ''; descBox.classList.remove('desc-resizing'); };
                const onEnd = (e) => { if (e.target === descBox && e.propertyName === 'height') done(); };
                descBox.addEventListener('transitionend', onEnd);
                descBox._t = setTimeout(done, 1200);   // zapas, gdyby zdarzenie końca nie przyszło
            }
        }
    }
    function go(i) {
        i = Math.max(0, Math.min(cards.length - 1, i));
        if (i === active) return;
        active = i;
        layout(true);
    }
    pane.goBy = (n) => go(active + n);

    cards.forEach((c, i) => {
        c.addEventListener('click', (e) => {
            if (swiped || i !== active) { e.preventDefault(); if (!swiped) go(i); }
        });
    });
    flow.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { go(active - 1); e.preventDefault(); }
        if (e.key === 'ArrowRight') { go(active + 1); e.preventDefault(); }
    });
    pane.querySelectorAll('.cat-arrow').forEach((b) => {
        b.addEventListener('click', () => go(active + (b.classList.contains('cat-arrow-next') ? 1 : -1)));
    });

    // telefon: kafelki jadą za palcem (można przeciągnąć o kilka naraz), po puszczeniu lecą jeszcze rozpędem i zatrzymują się na najbliższym
    let sx = 0, sy = 0, startPos = 0, pos = 0, lastX = 0, lastT = 0, vel = 0, decided = false, horiz = false, perTile = 1;
    const clampPos = (v) => Math.max(-0.35, Math.min(cards.length - 1 + 0.35, v));
    flow.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        sx = lastX = t.clientX; sy = t.clientY; lastT = performance.now();
        startPos = pos = active; vel = 0; decided = false; horiz = false; swiped = false;
        perTile = Math.max(40, (cards[0] ? cards[0].offsetWidth : 240) * (packed ? 0.36 : 0.55));
    }, { passive: true });
    flow.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        const dx = t.clientX - sx, dy = t.clientY - sy;
        if (!decided && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
            decided = true;
            horiz = Math.abs(dx) > Math.abs(dy) * 1.1;
            if (horiz) flow.classList.add('is-dragging');
        }
        if (!horiz) return;
        const now = performance.now();
        const v = (t.clientX - lastX) / Math.max(1, now - lastT);      // px/ms
        vel = vel * 0.6 + v * 0.4;
        lastX = t.clientX; lastT = now;
        pos = clampPos(startPos - dx / perTile);
        layout(false, pos);
    }, { passive: true });
    flow.addEventListener('touchend', () => {
        if (!horiz) return;
        horiz = false;
        flow.classList.remove('is-dragging');
        swiped = true;
        const fling = performance.now() - lastT < 120 ? -vel * 190 / perTile : 0;   // szybkie machnięcie = dalej
        const target = Math.max(0, Math.min(cards.length - 1, Math.round(pos + fling)));
        const changed = target !== active;
        active = target;
        layout(changed);
        setTimeout(() => { swiped = false; }, 350);
    }, { passive: true });

    layout(false);
    window.addEventListener('resize', () => layout(false));
}

// Przełącznik „Katalog Materiałów ⇄ Katalog Akcesoriów” (2026-11-05, wg Adama): duży czarny nagłówek + obok (telefon: pod nim)
// szary napis ze strzałkami. Kliknięcie: 1) duży napis zjeżdża w lewo (złota kreska pod nim ZOSTAJE), 2) szary ze strzałkami w lewo,
// 3) z prawej wjeżdża nowy duży napis, 4) na koniec z prawej szary ze strzałkami.
// Kafelki: stare odjeżdżają pojedynczo, jeden za drugim; nowe wjeżdżają pojedynczo z drugiej strony.
function initCatalogSwitch(panes) {
    const btn = document.querySelector('#project .cat-switch');
    const title = document.querySelector('#project > h2');
    if (!btn || !title || panes.length < 2) return;
    const titleTxt = title.querySelector('.cat-title-txt') || title;
    const label = btn.querySelector('.cat-switch-label');
    let cur = 0;
    let busy = false;
    const move = (el, x, animate) => {
        if (!animate) el.classList.add('cat-no-anim');
        el.style.setProperty('--catx', x);
        if (!animate) { void el.offsetWidth; el.classList.remove('cat-no-anim'); }
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // kafelki: wyjazd pojedynczo (dir = 'left' | 'right'), potem wjazd pojedynczo z przeciwnej strony
    function swapPanes(from, to) {
        const toAcc = to === 1;
        const out = panes[from], inn = panes[to];
        const outFlow = out.querySelector('.mat-flow'), inFlow = inn.querySelector('.mat-flow');
        const outCards = Array.from(outFlow.querySelectorAll('.mat-card'));
        const inCards = Array.from(inFlow.querySelectorAll('.mat-card'));
        if (reduce) {
            out.classList.remove('is-current');
            inn.classList.add('is-current');
            return;
        }
        // wysokość sekcji zmienia się płynnie (bez skoku sekcji poniżej): blokada obecnej wysokości, potem przejście do nowej
        const box = out.parentElement;
        box.style.height = box.offsetHeight + 'px';
        const stepOut = Math.min(90, 520 / Math.max(1, outCards.length));
        const stepIn = Math.min(90, 520 / Math.max(1, inCards.length));
        // kolejność: przy wyjeździe w lewo pierwszy rusza skrajny lewy; przy wyjeździe w prawo — skrajny prawy
        outCards.forEach((c, i) => c.style.setProperty('--o', toAcc ? i : outCards.length - 1 - i));
        inCards.forEach((c, i) => c.style.setProperty('--o', toAcc ? i : inCards.length - 1 - i));
        outFlow.style.setProperty('--ostep', stepOut + 'ms');
        inFlow.style.setProperty('--ostep', stepIn + 'ms');
        out.classList.add('pane-leaving');
        outFlow.classList.add(toAcc ? 'cards-out-left' : 'cards-out-right');
        const outTime = (outCards.length - 1) * stepOut + 420;
        setTimeout(() => {
            // nowe kafelki ustawione poza ekranem po drugiej stronie, bez animacji
            inFlow.classList.add('cat-no-anim-cards', toAcc ? 'cards-out-right' : 'cards-out-left');
            inn.classList.add('is-current', 'pane-entering');
            void inFlow.offsetWidth;
            inFlow.classList.remove('cat-no-anim-cards', 'cards-out-left', 'cards-out-right');
            requestAnimationFrame(() => inn.classList.remove('pane-entering'));
            setTimeout(() => inFlow.style.removeProperty('--ostep'), (inCards.length - 1) * stepIn + 800);   // potem bez opóźnień (najechanie itp.)
        }, Math.max(0, outTime - 180));
        setTimeout(() => {
            out.classList.remove('is-current', 'pane-leaving');
            outFlow.classList.add('cat-no-anim-cards');
            outFlow.classList.remove('cards-out-left', 'cards-out-right');
            void outFlow.offsetWidth;
            outFlow.classList.remove('cat-no-anim-cards');
            const target = inn.offsetHeight;
            box.style.height = target + 'px';
            clearTimeout(box._hT);
            box._hT = setTimeout(() => { box.style.height = ''; }, 750);
        }, outTime + 60);
    }

    btn.addEventListener('click', () => {
        if (busy) return;
        busy = true;
        const from = cur, to = 1 - cur;
        cur = to;
        swapPanes(from, to);
        btn.setAttribute('aria-label', ({ de: 'Wechseln zu: ', en: 'Switch to: ' }[document.documentElement.lang] || 'Przełącz na: ') + panes[from].dataset.title);
        // do akcesoriów: napisy zjeżdżają w lewo i wjeżdżają z prawej; z powrotem do materiałów — odwrotnie (jak kafelki)
        const OUT = to === 1 ? '-110vw' : '110vw', IN = to === 1 ? '110vw' : '-110vw';
        if (reduce) {
            titleTxt.textContent = panes[to].dataset.title;
            label.textContent = panes[from].dataset.title;
            busy = false;
            return;
        }
        move(titleTxt, OUT, true);                                           // 1. duży napis w lewo (kreska zostaje)
        setTimeout(() => move(btn, OUT, true), 180);                         // 2. szary ze strzałkami w lewo
        setTimeout(() => {                                                   // 3. nowy duży napis z prawej
            titleTxt.textContent = panes[to].dataset.title;
            move(titleTxt, IN, false);
            move(titleTxt, '0px', true);
        }, 520);
        setTimeout(() => {                                                   // 4. na koniec szary napis ze strzałkami z prawej
            label.textContent = panes[from].dataset.title;
            move(btn, IN, false);
            move(btn, '0px', true);
        }, 800);
        setTimeout(() => { busy = false; }, 1500);
    });
}

// ==========================================
// SEKCJE — wjazd i wyjazd razem z przewijaniem (2026-11-05, jak sekcja „Inspiracje”).
// Dla każdej sekcji liczy postęp wejścia (od chwili, gdy góra sekcji pojawia się u dołu ekranu) i wyjścia
// (gdy dół sekcji mija środek ekranu) i wpisuje go do zmiennych CSS; ruch i przezroczystość definiuje styles.css.
// Realizacje: liczone od nagłówka (kafelki galerii zostają na miejscu).
// ==========================================
function initializeSectionScrollFx() {
    // Wjazd/wyjazd sekcji razem z przewijaniem. Wartości nie skaczą za kółkiem myszy — płynnie „doganiają” przewijanie
    // (wygładzanie w każdej klatce). Zmienne wpisujemy na element-kotwicę: Realizacje = nagłówek (galeria stoi),
    // O nas / Kategorie = sekcja. Fundacja i Kontakt nie jeżdżą (Kontakt: kafelki pojawiają się raz, initializeContactTiles).
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initializeContactTiles(reduce);
    if (reduce) return;
    const list = [['realizations', '.realizations-header'], ['about', null], ['project', null]]
        .map(([id, sel]) => {
            const s = document.getElementById(id);
            if (!s) return null;
            const el = (sel && s.querySelector(sel)) || s;
            return { el, about: id === 'about', p: null, x: null };
        })
        .filter(Boolean);
    if (!list.length) return;
    const clamp = (t) => Math.max(0, Math.min(1, t));
    const ease = (t) => t * t * (3 - 2 * t);
    const SMOOTH = 0.16;   // ile drogi do celu pokonujemy w jednej klatce
    let running = false;
    const phone = window.matchMedia('(max-width: 768px)');   // ustawienie „O nas” tylko na telefonie

    function targets(it) {
        const vh = window.innerHeight || 800;
        const r = it.el.getBoundingClientRect();
        const far = r.bottom < -vh || r.top > vh * 2;
        if (it.about && phone.matches) {
            // „O nas” na TELEFONIE (wymóg Adama): pełna forma, gdy widać połowę sekcji; rozjazd dopiero, gdy prawie znika u góry
            // (na komputerze „O nas” działa jak pozostałe sekcje — ta wersja Adamowi pasowała)
            const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, vh));
            const p = r.top < 0 ? 1 : clamp(visible / 0.5);
            const x = clamp((vh * 0.22 - r.bottom) / (vh * 0.22));
            return { p, x, far };
        }
        // sekcja przy końcu strony może nie dojechać wysoko — wtedy wejście kończy się na samym dole strony
        const topAtEnd = r.top - (document.documentElement.scrollHeight - vh - window.scrollY);
        const p = clamp((vh - r.top) / Math.max(80, Math.min(vh * 0.8, vh - topAtEnd)));
        const x = clamp((vh * 0.45 - r.bottom) / (vh * 0.4));
        return { p, x, far };
    }
    function apply(it) {
        const part = (d) => ease(clamp((it.p - d) / (1 - d))).toFixed(4);
        const st = it.el.style;
        st.setProperty('--sfx-a', part(0));
        st.setProperty('--sfx-b', part(it.about && phone.matches ? 0.1 : 0.15));
        st.setProperty('--sfx-x', ease(it.x).toFixed(4));
        st.setProperty('--sfx-p', it.p.toFixed(4));   // liniowe wejście — kafelki katalogów wjeżdżają po kolei
        st.setProperty('--sfx-xl', it.x.toFixed(4));  // liniowe wyjście — kafelki wyjeżdżają po kolei
    }
    function frame() {
        let moving = false;
        list.forEach((it) => {
            const t = targets(it);
            if (it.p === null || t.far) { it.p = t.p; it.x = t.x; apply(it); return; }
            const dp = t.p - it.p, dx = t.x - it.x;
            if (Math.abs(dp) < 0.0005 && Math.abs(dx) < 0.0005) return;
            it.p += dp * SMOOTH;
            it.x += dx * SMOOTH;
            if (Math.abs(dp) < 0.002) it.p = t.p;
            if (Math.abs(dx) < 0.002) it.x = t.x;
            apply(it);
            moving = true;
        });
        running = moving;
        if (moving) requestAnimationFrame(frame);
    }
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    frame();
}

// Kontakt: kafelki pojawiają się po kolei, raz, gdy sekcja wejdzie na ekran (bez znikania)
function initializeContactTiles(reduce) {
    const box = document.querySelector('#contact .contact-info');
    if (!box) return;
    if (reduce || !('IntersectionObserver' in window)) { box.classList.add('tiles-in'); return; }
    box.classList.add('tiles-wait');
    const io = new IntersectionObserver((en) => {
        if (en.some((e) => e.isIntersecting)) { io.disconnect(); box.classList.add('tiles-in'); }
    }, { threshold: 0.35 });
    io.observe(box);
}

// Wybór języka w nagłówku: jedna flaga, po kliknięciu lista języków; zamyka kliknięcie poza listą i Esc
(function () {
    const box = document.querySelector('.lang-switch');
    if (!box) return;
    const btn = box.querySelector('.lang-current');
    const menu = box.querySelector('.lang-menu');
    const set = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
})();
