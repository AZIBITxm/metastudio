# TikTok Modal - Instrukcja Obsługi (Nowa Wersja)

## 📱 Opis
Nowy TikTok modal w stylu galerii obrazków - z miniaturkami i głównym obszarem odtwarzania. Automatycznie pobiera filmy i opisy z pliku `modale/tiktok.txt`.

## 🎬 Jak wygląda modal:
- **Nagłówek**: Tylko logo i napis "INSPIRACJE"
- **Desktop**: Film po lewej, miniaturki po prawej
- **Mobile**: Film na górze, miniaturki na dole
- **Miniaturki**: Z opisami i ikoną play

## 📝 Format pliku tiktok.txt

### Struktura:
```
URL_DO_FILMU_TIKTOK
Opis filmu pod miniaturką

NASTĘPNY_URL_FILMU
Następny opis filmu

# Komentarz (linie z # są ignorowane)
```

### Przykład poprawnego pliku:
```
# MetaStudio TikTok Videos

https://vm.tiktok.com/ZNdtHbTTg/
Luksusowe wnętrza MetaStudio - nowoczesny design i elegancja 🏠✨

https://vm.tiktok.com/ZNdtHckPn/
Kuchnia marzeń - funkcjonalność spotyka się z pięknem 🍽️

https://www.tiktok.com/@metastudio/video/123456789
Sypialnia w stylu loft - industrialny charakter z nutą luksusu 😍

# https://vm.tiktok.com/disabled/
# Ten film jest tymczasowo wyłączony
```

## 🔗 Obsługiwane formaty URL TikTok:

✅ **Działają dobrze:**
- `https://www.tiktok.com/@username/video/1234567890123456789`
- `https://vm.tiktok.com/ZMxxxxxxxx/`
- `https://vt.tiktok.com/ZSxxxxxxxx/`

❌ **Mogą nie działać:**
- Linki z parametrami dodatkowymi
- Linki wygasłe lub usunięte
- Prywatne filmy

## 🎯 Jak uzyskać prawidłowy link:

### Z aplikacji TikTok:
1. Otwórz swój film w aplikacji
2. Kliknij **"Share"** (Udostępnij)
3. Wybierz **"Copy Link"** (Kopiuj link)
4. Wklej do pliku `tiktok.txt`

### Z przeglądarki:
1. Otwórz film na tiktok.com
2. Skopiuj URL z paska adresu
3. Wklej do pliku `tiktok.txt`

## ⚙️ Funkcjonalności:

### Automatyczne ładowanie
- Filmy ładują się z pliku przy każdym otwarciu
- Nie trzeba odświeżać strony po dodaniu filmów
- System rozpoznaje różne formaty URL

### Miniaturki
- Automatycznie generowane z gradientem TikTok
- Pokazują opisy przy hover (desktop)
- Ikona play wskazuje możliwość odtworzenia

### Responsive design
- **Desktop**: Film 70% szerokości, miniaturki 30%
- **Mobile**: Film na górze, miniaturki na dole
- Automatyczne dostosowanie do ekranu

## 🚀 Szybki start:

1. **Skopiuj link** z TikTok (np. `https://vm.tiktok.com/ZNdtHbTTg/`)
2. **Otwórz** `modale/tiktok.txt`
3. **Dodaj link** w nowej linii
4. **W następnej linii** dodaj opis
5. **Zapisz plik**
6. **Gotowe!** Film pojawi się w modalu

## 🔧 Rozwiązywanie problemów:

### Problem: Filmy nie ładują się
- Sprawdź format URL (musi zawierać `tiktok.com`)
- Upewnij się że film jest publiczny
- Sprawdź konsolę błędów (F12)

### Problem: Brak opisów pod miniaturkami
- Sprawdź czy opis jest w linii bezpośrednio pod URL
- Upewnij się że linia z opisem nie zaczyna się od `#`

### Problem: Modal nie otwiera się
- Sprawdź czy przycisk ma prawidłowy `href="#tiktok"`
- Sprawdź konsolę JavaScript (F12)

## 📂 Struktura plików:
```
modale/
├── tiktok.txt              ← Tutaj dodajesz filmy i opisy
├── tiktok-modal.js         ← Logika modalu (styl galerii)
└── tiktok-modal.css        ← Stylowanie (wygląd galerii)
```

## 💡 Porady:

1. **Opisy**: Krótkie i chwytliwe (max 2 linie)
2. **Emotikony**: Używaj emoji dla lepszego wyglądu ✨
3. **Kolejność**: Pierwszy film w pliku = pierwszy w galerii
4. **Komentarze**: Używaj `#` do tymczasowego wyłączania filmów

---
*Modal TikTok w stylu galerii - Październik 2024*