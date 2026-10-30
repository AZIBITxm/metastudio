# System Ładowania Opisów Galerii MetaStudio

## Opis funkcjonalności

System automatycznie ładuje opisy projektów z plików `opis.txt` znajdujących się w katalogach galerii. Opisy są ładowane w zależności od aktualnego języka strony (`pl`, `en`, `de`).

## Struktura pliku opis.txt

### Format 1: Z separatorami (nowy, zalecany)
```
pl
TYTUŁ PROJEKTU PL

Opis projektu w języku polskim...

---
en
PROJECT TITLE EN

Project description in English...

---
de
PROJEKTTITEL DE

Projektbeschreibung auf Deutsch...
```

### Format 2: Bez separatorów (kompatybilny ze starym formatem)
```
pl
TYTUŁ PROJEKTU PL

Opis projektu w języku polskim...

en
PROJECT TITLE EN

Project description in English...

de
PROJEKTTITEL DE

Projektbeschreibung auf Deutsch...
```

## Jak działa

1. **Automatyczne ładowanie**: Przy ładowaniu strony system automatycznie sprawdza każdy katalog galerii w poszukiwaniu pliku `opis.txt`

2. **Wykrywanie języka**: System pobiera język z atrybutu `lang` elementu `<html>` (domyślnie: `pl`)

3. **Parsowanie pliku**: System wyodrębnia tytuł projektu dla odpowiedniego języka (pierwszy niepusty wiersz po kodzie języka, który nie jest sekcją materiałów/systemów)

4. **Aktualizacja DOM**: Tytuł jest automatycznie wstawiany do elementu `<h3>` w odpowiednim elemencie galerii

5. **Fallback**: Jeśli plik nie istnieje lub nie ma opisu dla danego języka, wyświetlany jest domyślny tekst "Realizacja"

## Implementacja

### Główne funkcje (script.js):
- `getCurrentLanguage()` - pobiera aktualny język strony
- `parseDescriptionFile(content, language)` - parsuje plik opis.txt (tytuł)
- `loadGalleryDescription(galleryNumber, language)` - ładuje tytuł dla konkretnej galerii
- `initializeGalleryDescriptions()` - inicjalizuje ładowanie wszystkich tytułów
- `changeLanguage(newLanguage)` - zmienia język i przeładowuje opisy

### Integracja z modal (gallery-modal.js):
- `getProjectTitle(galleryId)` - pobiera tytuł z aktualnie załadowanego opisu w galerii
- `getCurrentLanguage()` - pobiera aktualny język strony (duplikacja dla modala)
- `parseFullDescriptionFile(content, language)` - parsuje plik opis.txt (pełny opis)
- `loadFullGalleryDescription(galleryNumber, language)` - ładuje pełny opis dla modala
- `loadAndUpdateDescription()` - ładuje i wyświetla opis w modalu (lub ukrywa sekcję)
- `formatDescription(description)` - formatuje opis do HTML

## Zmiana języka

```javascript
// Zmiana języka programowo
changeLanguage('en'); // 'pl', 'en', 'de'

// Ponowne ładowanie opisów
initializeGalleryDescriptions();
```

## Testowanie

Użyj pliku `test-opisy.html` do testowania funkcjonalności:
1. Otwórz plik w przeglądarce
2. Sprawdź czy opisy ładują się poprawnie
3. Przetestuj zmianę języków przyciskami
4. Sprawdź konsolę przeglądarki pod kątem błędów

## Struktura katalogów

```
galeria/
├── 1/
│   ├── opis.txt        <- Plik z opisami w różnych językach
│   ├── 1.jpg
│   ├── 2.jpg
│   └── ...
├── 2/
│   ├── opis.txt        <- Opcjonalny plik z opisami
│   ├── 1.png
│   └── ...
└── ...
```

## Modale

### Jak działa modal:
1. **Otwieranie modala**: Przy otwieraniu modala system automatycznie ładuje pełny opis z `opis.txt`
2. **Wykrywanie języka**: Modal używa tego samego języka co strona główna
3. **Fallback językowy**: Jeśli nie ma opisu w aktualnym języku, próbuje załadować angielski
4. **Brak pliku**: Jeśli nie ma pliku `opis.txt`, sekcja opisu jest całkowicie ukryta
5. **Przewijanie**: Długie opisy mają pasek przewijania dostosowany do rozmiaru ekranu

### CSS dla modalela:
- Sekcja `.modal-description` ma `max-height` i `overflow-y: auto`
- Stylowany pasek przewijania w kolorach motywu strony
- Responsywne wysokości dla różnych rozmiarów ekranów:
  - Desktop: 300px
  - Mobile (768px): 200px  
  - Small mobile (480px): 150px
  - Extra small (320px): 120px

## Uwagi

- Pliki `opis.txt` muszą być zakodowane w UTF-8
- Kody języków muszą być dokładnie: `pl`, `en`, `de`
- Tytuł projektu nie może zawierać dwukropka `:` (jest używany do rozpoznawania sekcji materiałów)
- System jest odporny na brak plików:
  - **Galeria główna**: wyświetli "Realizacja" jako domyślny tytuł
  - **Modal**: ukryje całą sekcję opisu jeśli brak pliku