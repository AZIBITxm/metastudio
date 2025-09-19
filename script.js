/**
 * MetaStudio - JavaScript
 * Obsługa interakcji strony internetowej
 */

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
    const btnIcon = showAllBtn.querySelector('.btn-icon');
    
    if (!showAllBtn || !gallery || extendedItems.length === 0) {
        console.log('Gallery toggle elements not found');
        return;
    }
    
    let isExpanded = false;
    
    showAllBtn.addEventListener('click', function() {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            // Rozszerzamy galerię
            gallery.classList.add('expanded');
            showAllBtn.classList.add('expanded');
            btnText.textContent = 'Pokaż mniej';
            btnIcon.textContent = '−';
            
            // Pokazujemy dodatkowe elementy z animacją
            extendedItems.forEach((item, index) => {
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
            btnText.textContent = 'Pokaż wszystkie';
            btnIcon.textContent = '+';
            
            // Ukrywamy dodatkowe elementy z animacją
            extendedItems.forEach((item, index) => {
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
        initializeMaterialsSection();
        initializeGalleryToggle();
        
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
});

// Obsługa scroll'a strony (ogólne)
window.addEventListener('scroll', function() {
    // Tutaj można dodać funkcje reagujące na scroll strony
    // Uwaga: funkcja scroll dla sekcji "O Nas" jest osobno w initializeAboutSectionScroll
});

// ==========================================
// EKSPORT FUNKCJI (dla ewentualnego użycia w innych plikach)
// ==========================================

// Jeśli używasz modułów ES6, możesz eksportować funkcje:
// export { initializeApp, scrollToElement, isElementVisible };