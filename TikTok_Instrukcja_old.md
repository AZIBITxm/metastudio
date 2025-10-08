# TikTok Modal - Instrukcja Obsługi

## 📱 Opis
Modal TikTok na stronie MetaStudio automatycznie pobiera linki do filmów z pliku tekstowego `modale/tiktok.txt` i wyświetla je w eleganckim oknie modalnym.

## 🔧 Jak dodać nowe filmy TikTok

### Główny sposób: Przez plik tekstowy (ZALECANE ✅)

1. **Otwórz plik** `modale/tiktok.txt`
2. **Dodaj nowe linki TikTok**, każdy w nowej linii
3. **Obsługiwane formaty URL:**
   - Krótkie linki: `https://vm.tiktok.com/ZNdtHbTTg/`
   - Pełne linki: `https://www.tiktok.com/@username/video/123456789`
4. **Zapisz plik** - zmiany będą widoczne natychmiast na stronie!

### 📝 Przykład pliku tiktok.txt:
```
# MetaStudio TikTok Videos
# Format: jeden link na linię
# Linie zaczynające się od # są ignorowane

https://vm.tiktok.com/ZNdtHbTTg/
https://vm.tiktok.com/ZNdtHckPn/

# Można dodawać komentarze:
# https://vm.tiktok.com/kolejny-link/ (wyłączony)
```

## 🎯 Jak uzyskać link do filmu TikTok

### Metoda 1: Z aplikacji mobilnej
1. Otwórz film w aplikacji TikTok
2. Kliknij **"Share"** (ikona strzałki)
3. Wybierz **"Copy Link"**
4. Wklej link do pliku `tiktok.txt`

### Metoda 2: Z przeglądarki
1. Otwórz TikTok.com w przeglądarce
2. Znajdź swój film
3. Skopiuj URL z paska adresu
4. Wklej link do pliku `tiktok.txt`

## ⚙️ Funkcjonalności systemu

### Automatyczne ładowanie
- System automatycznie pobiera listę filmów przy każdym otwarciu modalu
- Nie trzeba odświeżać strony po dodaniu nowych linków

### Obsługa komentarzy
- Linie zaczynające się od `#` są ignorowane
- Możesz tymczasowo wyłączyć filmy dodając `#` na początku linii

### Fallback
- Jeśli plik `tiktok.txt` nie zostanie znaleziony, system użyje przykładowych linków
- Błędy ładowania są logowane w konsoli przeglądarki (F12)

## 🔍 Rozwiązywanie problemów

### Problem: Filmy nie ładują się
1. Sprawdź czy plik `modale/tiktok.txt` istnieje
2. Sprawdź czy linki są w prawidłowym formacie
3. Otwórz konsolę (F12) i sprawdź błędy

### Problem: Modal nie otwiera się
1. Sprawdź czy przycisk "📱 TikTok" jest w menu
2. Sprawdź konsolę JavaScript (F12)
3. Upewnij się że plik `tiktok-modal.js` jest załadowany

### Problem: Embed nie wyświetla filmu
- TikTok może blokować niektóre embedy
- Upewnij się że film jest publiczny
- Spróbuj różnych formatów URL

## 📁 Struktura plików
```
modale/
├── tiktok.txt          ← TUTAJ dodajesz linki
├── tiktok-modal.js     ← Logika modalu
└── tiktok-modal.css    ← Stylowanie
```

## 🚀 Szybki start

1. **Skopiuj link z TikTok** (np. `https://vm.tiktok.com/ZNdtHbTTg/`)
2. **Otwórz** `modale/tiktok.txt` 
3. **Dodaj link** w nowej linii
4. **Zapisz plik**
5. **Gotowe!** Film będzie dostępny w modalu na stronie

---
*Ostatnia aktualizacja: Październik 2024*