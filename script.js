/**
 * MetaStudio - JavaScript
 * Obsługa interakcji strony internetowej
 */

// ==========================================
// AUTOMATYCZNE ŁADOWANIE ZDJĘĆ GALERII
// ==========================================

/**
 * Funkcja do automatycznego ładowania pierwszego dostępnego zdjęcia z katalogu galerii
 * Próbuje różne rozszerzenia i nazwy plików w określonej kolejności
 */
function loadFirstImageFromGallery(galleryNumber, imgElement) {
    // Lista możliwych rozszerzeń i nazw plików do sprawdzenia
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const possibleFileNames = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', // numerowane
        'main', 'cover', 'thumbnail', 'index', 'hero', // typowe nazwy głównych
    ];
    
    let imageLoaded = false;
    let attemptIndex = 0;
    
    function tryLoadImage() {
        if (imageLoaded || attemptIndex >= possibleFileNames.length * imageExtensions.length) {
            // Jeśli nie udało się załadować żadnego obrazu, sprawdź czy są pliki z datą
            if (!imageLoaded) {
                tryLoadDateNamedImage();
            }
            return;
        }
        
        const fileNameIndex = Math.floor(attemptIndex / imageExtensions.length);
        const extensionIndex = attemptIndex % imageExtensions.length;
        
        const fileName = possibleFileNames[fileNameIndex];
        const extension = imageExtensions[extensionIndex];
        const imagePath = `galeria/${galleryNumber}/${fileName}.${extension}`;
        
        const testImg = new Image();
        testImg.onload = function() {
            if (!imageLoaded) {
                imgElement.src = imagePath;
                imageLoaded = true;
                console.log(`Loaded image for gallery ${galleryNumber}: ${imagePath}`);
            }
        };
        testImg.onerror = function() {
            attemptIndex++;
            tryLoadImage();
        };
        testImg.src = imagePath;
    }
    
    function tryLoadDateNamedImage() {
        // Mapowanie specyficznych pattern nazw dla różnych katalogów
        const specificPatterns = {
            '12': ['20160804_164435 (1)', '20160804_164444', '20160804_164501 (1)', '20160804_164549']
            // Usunięto mapowania dla 16 i 17 - te katalogi nie istnieją
        };
        
        // Użyj pattern specyficznych dla danego katalogu lub ogólnych
        const patterns = specificPatterns[galleryNumber] || [
            // Ogólne pattern dat i nazw
            '20160804_164435 (1)', '20160804_164444', '20160804_164501 (1)', '20160804_164549',
            '20231209_114031', '20231209_114046', '20231209_114048',
            '20150519_153445 (1)', '20150519_153456 (1)', '20150521_104956 (1)',
            'c1', 'city (1)', 'main', 'cover', 'image', 'photo', 'pic'
        ];
        
        let dateAttemptIndex = 0;
        
        function tryDatePattern() {
            if (imageLoaded || dateAttemptIndex >= patterns.length * imageExtensions.length) {
                return;
            }
            
            const patternIndex = Math.floor(dateAttemptIndex / imageExtensions.length);
            const extensionIndex = dateAttemptIndex % imageExtensions.length;
            
            const pattern = patterns[patternIndex];
            const extension = imageExtensions[extensionIndex];
            const imagePath = `galeria/${galleryNumber}/${pattern}.${extension}`;
            
            const testImg = new Image();
            testImg.onload = function() {
                if (!imageLoaded) {
                    imgElement.src = imagePath;
                    imageLoaded = true;
                    console.log(`Loaded specific pattern image for gallery ${galleryNumber}: ${imagePath}`);
                }
            };
            testImg.onerror = function() {
                dateAttemptIndex++;
                tryDatePattern();
            };
            testImg.src = imagePath;
        }
        
        tryDatePattern();
    }
    
    tryLoadImage();
}

/**
 * Inicjalizuje automatyczne ładowanie zdjęć dla wszystkich elementów galerii
 */
function initializeAutoImageLoading() {
    const galleryItems = document.querySelectorAll('.gallery-item[data-gallery]');
    
    console.log(`Found ${galleryItems.length} gallery items to load images for`);
    
    galleryItems.forEach((item, index) => {
        const galleryNumber = item.getAttribute('data-gallery');
        const imgElement = item.querySelector('img');
        
        if (galleryNumber && imgElement) {
            console.log(`Loading image for gallery ${galleryNumber} (item ${index + 1})`);
            loadFirstImageFromGallery(galleryNumber, imgElement);
        } else {
            console.log(`Skipping item ${index + 1}: galleryNumber=${galleryNumber}, imgElement=${!!imgElement}`);
        }
    });
    
    console.log('Auto image loading initialized for gallery items');
}

// ==========================================
// ŁADOWANIE OPISÓW GALERII
// ==========================================

/**
 * Pobiera język strony z atrybutu lang elementu html
 */
function getCurrentLanguage() {
    return document.documentElement.lang || 'pl';
}

/**
 * Parsuje plik opis.txt i wyodrębnia opis dla określonego języka
 */
function parseDescriptionFile(content, language) {
    // Spróbuj najpierw format z separatorami ---
    if (content.includes('---')) {
        const sections = content.split(/^---$/m);
        
        for (const section of sections) {
            const trimmedSection = section.trim();
            if (trimmedSection.startsWith(language)) {
                // Usuń kod języka z początku
                const description = trimmedSection.substring(language.length).trim();
                const lines = description.split('\n');
                
                // Znajdź pierwszy niepusty nagłówek (pierwszy wiersz po kodzie języka)
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine && 
                        !trimmedLine.startsWith('MATERIAŁY:') && 
                        !trimmedLine.startsWith('MATERIALS:') &&
                        !trimmedLine.startsWith('MATERIALIEN:') &&
                        !trimmedLine.startsWith('SYSTEMY:') && 
                        !trimmedLine.startsWith('SYSTEMS:') &&
                        !trimmedLine.startsWith('CHARAKTERYSTYCZNE ELEMENTY:') &&
                        !trimmedLine.startsWith('DISTINCTIVE FEATURES:') &&
                        !trimmedLine.startsWith('CHARAKTERISTISCHE ELEMENTE:') &&
                        !trimmedLine.includes(':')) {
                        return trimmedLine;
                    }
                }
            }
        }
    } else {
        // Format bez separatorów (jak w pliku 1) - szukaj kodu języka na początku linii
        const lines = content.split('\n');
        let foundLanguage = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Sprawdź, czy jest to linia z kodem języka
            if (line === language) {
                foundLanguage = true;
                continue;
            }
            
            // Jeśli znaleźliśmy język, szukaj pierwszego niepustego nagłówka
            if (foundLanguage && line) {
                // Sprawdź, czy nie jest to inny język
                if (line === 'pl' || line === 'en' || line === 'de') {
                    break; // Koniec sekcji dla tego języka
                }
                
                // Sprawdź, czy nie jest to sekcja materiałów/systemów
                if (!line.startsWith('MATERIAŁY:') && 
                    !line.startsWith('MATERIALS:') &&
                    !line.startsWith('MATERIALIEN:') &&
                    !line.startsWith('SYSTEMY:') && 
                    !line.startsWith('SYSTEMS:') &&
                    !line.startsWith('CHARAKTERYSTYCZNE ELEMENTY:') &&
                    !line.startsWith('DISTINCTIVE FEATURES:') &&
                    !line.startsWith('CHARAKTERISTISCHE ELEMENTE:') &&
                    !line.includes(':')) {
                    return line;
                }
            }
        }
    }
    
    return 'Realizacja'; // Domyślny tytuł jeśli nie znaleziono
}

/**
 * Ładuje opis projektu z pliku opis.txt dla danego katalogu galerii
 */
async function loadGalleryDescription(galleryNumber, language) {
    try {
        const url = `galeria/${galleryNumber}/opis.txt`;
        console.log(`Fetching description from: ${url}`);
        const response = await fetch(url);
        
        console.log(`Response status for gallery ${galleryNumber}:`, response.status, response.statusText);
        
        if (response.ok) {
            const content = await response.text();
            console.log(`Content length for gallery ${galleryNumber}:`, content.length);
            const parsed = parseDescriptionFile(content, language);
            console.log(`Parsed title for gallery ${galleryNumber}:`, parsed);
            return parsed;
        } else {
            console.log(`No description file found for gallery ${galleryNumber} (${response.status})`);
            return 'Realizacja';
        }
    } catch (error) {
        console.log(`Error loading description for gallery ${galleryNumber}:`, error);
        return 'Realizacja';
    }
}

/**
 * Aktualizuje tytuły wszystkich projektów galerii na podstawie plików opis.txt
 */
async function initializeGalleryDescriptions() {
    const currentLanguage = getCurrentLanguage();
    const galleryItems = document.querySelectorAll('.gallery-item[data-gallery]');
    
    console.log(`Loading gallery descriptions for language: ${currentLanguage}`);
    console.log(`Found ${galleryItems.length} gallery items with data-gallery attributes`);
    
    for (const item of galleryItems) {
        const galleryNumber = item.getAttribute('data-gallery');
        const titleElement = item.querySelector('h3');
        
        console.log(`Processing gallery ${galleryNumber}, title element found:`, !!titleElement);
        
        if (galleryNumber && titleElement) {
            try {
                const title = await loadGalleryDescription(galleryNumber, currentLanguage);
                const oldTitle = titleElement.textContent;
                titleElement.textContent = title;
                console.log(`Updated gallery ${galleryNumber} title from "${oldTitle}" to: "${title}"`);
            } catch (error) {
                console.error(`Error updating title for gallery ${galleryNumber}:`, error);
            }
        }
    }
    
    console.log('Gallery descriptions loading completed');
}

/**
 * Zmienia język strony i aktualizuje opisy galerii
 */
function changeLanguage(newLanguage) {
    // Zmień atrybut lang w HTML
    document.documentElement.lang = newLanguage;
    
    // Przeładuj opisy galerii dla nowego języka
    initializeGalleryDescriptions();
    
    console.log(`Language changed to: ${newLanguage}`);
}

// ==========================================
// GLOBALNE ZMIENNE DLA ANIMACJI CYKLICZNYCH
// ==========================================

let globalAnimationInterval = null;
let globalUserInteracting = false;
let globalUserInteractionTimeout = null;

// Funkcja do zatrzymywania animacji cyklicznych (dostępna globalnie)
function stopCyclicAnimation() {
    console.log('Stopping cyclic animation globally');
    globalUserInteracting = true;
    clearTimeout(globalUserInteractionTimeout);
    
    // Zatrzymaj interval jeśli istnieje
    if (globalAnimationInterval) {
        console.log('Clearing global animation interval');
        clearInterval(globalAnimationInterval);
        globalAnimationInterval = null;
    }
    
    // Wznów automatyczną animację po 8 sekundach od ostatniej interakcji
    globalUserInteractionTimeout = setTimeout(() => {
        console.log('Resuming cyclic animation after timeout');
        globalUserInteracting = false;
        // Nie uruchamiamy ponownie interwału automatycznie - to będzie obsłużone przez IntersectionObserver
    }, 8000);
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
    const aboutSection = document.getElementById('about');
    const aboutContent = aboutSection?.querySelector('.about-content');
    
    if (!aboutSection || !aboutContent) {
        console.warn('About section elements not found');
        return;
    }

    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const aboutRect = aboutSection.getBoundingClientRect();
        const currentScrollTop = window.pageYOffset;

        // Sprawdzanie czy użytkownik jest w obrębie sekcji "O Nas"
        if (aboutRect.top <= 0 && aboutRect.bottom >= window.innerHeight) {
            const contentScrollTop = aboutContent.scrollTop;
            const contentScrollHeight = aboutContent.scrollHeight;
            const contentHeight = aboutContent.clientHeight;

            // Scroll w dół
            if (currentScrollTop > lastScrollTop) {
                if (contentScrollTop < contentScrollHeight - contentHeight) {
                    window.scrollTo(0, lastScrollTop);
                    aboutContent.scrollTop += 10;
                }
            } 
            // Scroll w górę
            else if (currentScrollTop < lastScrollTop) {
                if (contentScrollTop > 0) {
                    window.scrollTo(0, lastScrollTop);
                    aboutContent.scrollTop -= 10;
                }
            }
        }

        lastScrollTop = currentScrollTop;
    });
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
        // Tylko w wersji desktop dodaj obsługę hover
        if (window.innerWidth > 768) {
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
        console.log('Gallery toggle elements not found:', {
            showAllBtn: !!showAllBtn,
            gallery: !!gallery,
            extendedItemsCount: extendedItems.length
        });
        return;
    }
    
    console.log(`Gallery toggle found ${extendedItems.length} extended items`);
    
    let isExpanded = false;
    
    showAllBtn.addEventListener('click', function() {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            // Rozszerzamy galerię
            gallery.classList.add('expanded');
            showAllBtn.classList.add('expanded');
            btnText.textContent = 'POKAŻ MNIEJ';
            if (btnArrowLeft) btnArrowLeft.textContent = '↑';
            if (btnArrowRight) btnArrowRight.textContent = '↑';
            
            // Pokazujemy dodatkowe elementy z animacją
            console.log(`Showing ${extendedItems.length} extended items`);
            extendedItems.forEach((item, index) => {
                const galleryNum = item.getAttribute('data-gallery');
                console.log(`Showing extended item ${index + 1}: gallery-${galleryNum}`);
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
            btnText.textContent = 'POKAŻ WSZYSTKIE';
            if (btnArrowLeft) btnArrowLeft.textContent = '↓';
            if (btnArrowRight) btnArrowRight.textContent = '↓';
            
            // Ukrywamy dodatkowe elementy z animacją
            console.log(`Hiding ${extendedItems.length} extended items`);
            extendedItems.forEach((item, index) => {
                const galleryNum = item.getAttribute('data-gallery');
                console.log(`Hiding extended item ${index + 1}: gallery-${galleryNum}`);
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
    
    console.log('Gallery toggle initialized');
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
        console.log('Gallery items not found');
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
    
    console.log('Gallery scroll reveal initialized with smooth interpolation for all devices');
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
        initializeCyclicBannerAnimation(); // Zastąpienie initializeMaterialsSection()
        initializeSubBanners();
        initializeProjectHeightObserver(); // Dodanie obserwatora wysokości sekcji project
        initializeGalleryToggle();
        initializeAutoImageLoading(); // Automatyczne ładowanie pierwszych zdjęć z katalogów - po toggle
        initializeGalleryDescriptions(); // Ładowanie opisów z plików opis.txt
        initializeGalleryScrollReveal();
        
        // Udostępnij funkcje globalnie dla celów testowych
        window.changeLanguage = changeLanguage;
        window.initializeGalleryDescriptions = initializeGalleryDescriptions;
        initializeMobileAboutAnimation();
        
        console.log('MetaStudio JavaScript initialized successfully');
    } catch (error) {
        console.error('Error initializing MetaStudio app:', error);
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
    console.log('Window resized');
    
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
    
    // Funkcja do rozwijania sekcji
    function expandSection() {
        aboutSection.classList.add('about-expanded');
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
        console.log('showMaterialInfo called with:', materialId);
        
        // Ukryj wszystkie opisy i usuń klasy active
        materialsInfo.forEach(info => {
            info.style.display = 'none';
            info.classList.remove('active', 'fade-in');
        });
        
        // Pokaż wybrany opis z odpowiednimi klasami
        const targetInfo = document.getElementById(materialId + '-info');
        console.log('Target element found:', targetInfo);
        
        if (targetInfo) {
            targetInfo.style.display = 'block';
            targetInfo.classList.add('active');
            console.log('Element shown and active class added:', materialId + '-info');
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
            console.log('Sub-banner clicked, stopping cyclic animation');
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
            
            // Pokaż odpowiedni opis
            const materialId = this.getAttribute('data-material');
            showMaterialInfo(materialId);
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
            
            // Zamknij wszystkie inne banery
            materialLogos.forEach(otherLogo => {
                if (otherLogo !== this) {
                    hideSubBanners(otherLogo);
                    otherLogo.classList.remove('expanded');
                }
            });
            
            // Toggle obecnego banera
            if (!isExpanded) {
                this.classList.add('expanded');
                materialsLogosContainer.classList.add('banner-expanded'); // Ukryj pozostałe banery
                showSubBanners(this);
                showMaterialInfo(materialId);
            } else {
                this.classList.remove('expanded');
                materialsLogosContainer.classList.remove('banner-expanded'); // Pokaż wszystkie banery
                hideSubBanners(this);
            }
        });
    });
    
    // Obsługa kliknięć poza banerami - zamykanie wszystkich rozwinięych banerów (mobile i desktop)
    document.addEventListener('click', function(e) {
        // Sprawdź czy kliknięty element nie jest częścią material-logo ani materials-info
        const clickedInsideMaterialLogo = e.target.closest('.material-logo');
        const clickedInsideMaterialsInfo = e.target.closest('.materials-info');
        
        if (!clickedInsideMaterialLogo && !clickedInsideMaterialsInfo) {
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
// CYKLICZNA ANIMACJA BANERÓW MATERIAŁÓW
// ==========================================

/**
 * Funkcja inicjalizująca cykliczną animację banerów materiałów
 * Co 4 sekundy zmienia aktywny baner z ładnymi animacjami
 */
function initializeCyclicBannerAnimation() {
    const materialLogos = document.querySelectorAll('.material-logo');
    const materialInfos = document.querySelectorAll('.material-info');
    
    if (materialLogos.length === 0 || materialInfos.length === 0) {
        console.warn('Material banners not found for cyclic animation');
        return;
    }

    let currentIndex = 0;
    let animationInterval;
    let isUserInteracting = false;
    let userInteractionTimeout;

    // Funkcja do zmiany aktywnego bannera
    function switchToMaterial(index) {
        // Usuń wszystkie aktywne klasy i animacje
        materialLogos.forEach((logo, i) => {
            logo.classList.remove('active', 'pulse');
            if (i !== index) {
                logo.style.transform = '';
                logo.style.boxShadow = '';
                logo.style.background = '';
                logo.style.borderColor = '';
            }
        });
        
        materialInfos.forEach(info => {
            info.classList.remove('active', 'fade-in');
            info.style.display = 'none';
        });

        // Aktywuj nowy baner z animacją
        const activeLogo = materialLogos[index];
        const activeInfo = document.getElementById(`${activeLogo.dataset.material}-info`);
        
        if (activeLogo && activeInfo) {
            // Dodaj animację pulsowania do bannera
            activeLogo.classList.add('pulse', 'active');
            
            // Pokaż odpowiedni opis z animacją
            setTimeout(() => {
                activeInfo.style.display = 'block';
                setTimeout(() => {
                    activeInfo.classList.add('active', 'fade-in');
                    // Dostosuj wysokość sekcji po zmianie bannera
                    if (window.adjustProjectSectionHeight) {
                        setTimeout(() => window.adjustProjectSectionHeight(), 100);
                    }
                }, 50);
            }, 200);
        }

        currentIndex = index;
    }

    // Funkcja do automatycznego przełączania
    function autoSwitchMaterial() {
        if (!globalUserInteracting && !isUserInteracting) {
            const nextIndex = (currentIndex + 1) % materialLogos.length;
            switchToMaterial(nextIndex);
        }
    }

    // Funkcja do zatrzymywania animacji podczas interakcji użytkownika
    function handleUserInteraction() {
        // Wywołaj globalną funkcję
        stopCyclicAnimation();
        
        // Lokalne zatrzymanie
        isUserInteracting = true;
        clearTimeout(userInteractionTimeout);
        
        // Wznów automatyczną animację po 8 sekundach od ostatniej interakcji
        userInteractionTimeout = setTimeout(() => {
            isUserInteracting = false;
        }, 8000);
    }

    // Dodaj obsługę zdarzeń dla każdego bannera
    materialLogos.forEach((logo, index) => {
        // Tylko w wersji desktop dodaj obsługę hover
        if (window.innerWidth > 768) {
            logo.addEventListener('mouseenter', function() {
                handleUserInteraction();
                
                // Usuń animacje cykliczne
                materialLogos.forEach(l => l.classList.remove('pulse'));
                
                // Aktywuj baner najechany
                switchToMaterial(index);
            });
        }

        logo.addEventListener('click', function() {
            handleUserInteraction();
            switchToMaterial(index);
        });
    });

    // Dodaj obsługę hover również dla banerów material-info (tylko desktop)
    if (window.innerWidth > 768) {
        materialInfos.forEach((info, index) => {
            info.addEventListener('mouseenter', function() {
                handleUserInteraction();
                
                // Usuń animacje cykliczne
                materialLogos.forEach(l => l.classList.remove('pulse'));
            });

            info.addEventListener('mouseleave', function() {
                // Gdy mysz opuści baner, wznów animacje po krótkim czasie
                setTimeout(() => {
                    if (!isUserInteracting) {
                        // Dodaj animację pulsowania do aktywnego logo
                        const activeLogo = materialLogos[currentIndex];
                        if (activeLogo) {
                            activeLogo.classList.add('pulse');
                        }
                    }
                }, 500);
            });
        });
    }

    // Uruchom pierwszy baner
    switchToMaterial(0);

    // Uruchom cykliczną animację co 4 sekundy
    animationInterval = setInterval(autoSwitchMaterial, 4000);
    globalAnimationInterval = animationInterval; // Zapisz globalnie

    // Zatrzymaj animację gdy użytkownik opuści sekcję
    const projectSection = document.getElementById('project');
    if (projectSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Sekcja jest widoczna - uruchom animację tylko jeśli user nie interaguje
                    if (!animationInterval && !globalUserInteracting) {
                        animationInterval = setInterval(autoSwitchMaterial, 4000);
                        globalAnimationInterval = animationInterval; // Zapisz globalnie
                    }
                } else {
                    // Sekcja nie jest widoczna - zatrzymaj animację
                    if (animationInterval) {
                        clearInterval(animationInterval);
                        animationInterval = null;
                    }
                    if (globalAnimationInterval) {
                        clearInterval(globalAnimationInterval);
                        globalAnimationInterval = null;
                    }
                }
            });
        }, { threshold: 0.3 });

        observer.observe(projectSection);
    }

    // Czyść interwał przy odświeżeniu strony
    window.addEventListener('beforeunload', () => {
        if (globalAnimationInterval) {
            clearInterval(globalAnimationInterval);
        }
        if (animationInterval) {
            clearInterval(animationInterval);
        }
        if (userInteractionTimeout) {
            clearTimeout(userInteractionTimeout);
        }
    });
}

// ==========================================
// DYNAMICZNE USTAWIANIE WYSOKOŚCI SEKCJI PROJECT
// ==========================================

/**
 * Funkcja dynamicznie ustawiająca wysokość sekcji project
 * tak aby kończyła się zaraz pod aktualnie widocznym banerem
 */
function adjustProjectSectionHeight() {
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
                // Resetuj wysokość do automatycznej przed obliczeniami
                projectSection.style.minHeight = '';
                
                // Daj chwilę na przekalkulowanie layoutu
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
                    
                    console.log(`Adjusted project section height to ${neededHeight}px (base: ${baseHeight}px, banner needs: ${bannerEndRelativeToProject + 20}px)`);
                }, 10);
            }
        } else {
            // Jeśli baner nie jest widoczny, usuń minimalną wysokość
            projectSection.style.minHeight = '';
        }
    } else {
        // Na desktop usuń minimalną wysokość
        projectSection.style.minHeight = '';
    }
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
                setTimeout(adjustProjectSectionHeight, 100); // Małe opóźnienie na renderowanie
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
            setTimeout(adjustProjectSectionHeight, 100);
        });
        
        infoObserver.observe(info, {
            attributes: true,
            attributeFilter: ['class'],
            childList: true,
            subtree: true
        });
    });
    
    // Observer do obserwowania zmian rozmiaru okna
    window.addEventListener('resize', () => {
        setTimeout(adjustProjectSectionHeight, 100);
    });
    
    // Inicjalne ustawienie
    setTimeout(adjustProjectSectionHeight, 200);
    
    console.log('Project height observer initialized');
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
    
    console.log('Setting up dynamic scroll banner positioning...');

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
                    
                    console.log(`Mobile banner positioned at: ${targetPosition.toFixed(1)}px`);
                    console.log(`Image starts at: ${imageTopInDocument.toFixed(1)}px, height: ${imageHeight.toFixed(1)}px`);
                    console.log(`33% of image height = ${(imageHeight * 0.33).toFixed(1)}px, minus 15px banner offset`);
                } else {
                    // Jeśli obraz się jeszcze nie załadował, spróbuj ponownie po krótkim opóźnieniu
                    console.log('Banner image not loaded yet, retrying in 100ms...');
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
            console.log('Desktop mode - scroll banner reset to CSS positioning');
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
    
    console.log('Dynamic scroll banner positioning for banerm.png initialized (33% minus banner height)');
}

// Udostępnij funkcje globalnie
window.toggleProducerDetails = toggleProducerDetails;
window.adjustProjectSectionHeight = adjustProjectSectionHeight;
window.setupDynamicScrollBannerForMobile = setupDynamicScrollBannerForMobile;

// ==========================================
// EKSPORT FUNKCJI (dla ewentualnego użycia w innych plikach)
// ==========================================

// Jeśli używasz modułów ES6, możesz eksportować funkcje:
// export { initializeApp, scrollToElement, isElementVisible, toggleProducerDetails };