# TikTok Modal - Instrukcja użytkowania

## 📱 Jak dodać prawdziwe filmy TikTok

### 1. Uzyskanie embed kodu z TikTok

1. **Idź na TikTok.com** i znajdź film, który chcesz dodać
2. **Kliknij "Share" (Udostępnij)** pod filmem
3. **Wybierz "Embed"**
4. **Skopiuj wygenerowany kod HTML**

### 2. Dodanie filmu do strony

Otwórz plik `modale/tiktok-modal.js` i znajdź sekcję `tiktokVideos`:

```javascript
this.tiktokVideos = [
    {
        id: 'video1',
        embedCode: `TUTAJ_WKLEJ_EMBED_CODE_Z_TIKTOK`
    },
    // Dodaj więcej filmów...
];
```

### 3. Przykład prawdziwego embed kodu

```javascript
{
    id: 'metastudio_video_1',
    embedCode: `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@metastudiodesign/video/7123456789" data-video-id="7123456789" style="max-width: 605px;min-width: 325px;" > <section> <a target="_blank" title="@metastudiodesign" href="https://www.tiktok.com/@metastudiodesign?refer=embed">@metastudiodesign</a> <p>Luksusowe wnętrza MetaStudio 🏠✨ #design #luxury #interiordesign</p> <a target="_blank" title="♬ Original Sound" href="https://www.tiktok.com/music/Original-Sound-7123456789?refer=embed">♬ Original Sound</a> </section> </blockquote>`
}
```

## 🎨 Funkcjonalności

### Dostępne funkcje:
- **Responsive design** - dopasowuje się do wszystkich urządzeń
- **Elegancki modal** - w stylu strony MetaStudio
- **Automatyczne ładowanie** - TikTok embeds ładują się automatycznie
- **Smooth animations** - płynne animacje otwierania/zamykania
- **Keyboard support** - zamykanie na ESC
- **Multiple videos** - można dodać wiele filmów

### Jak otwierać modal:

1. **Z menu** - kliknij "📱 TikTok" w menu nawigacyjnym
2. **Z JavaScript** - wywołaj `openTikTokModal()`
3. **Z HTML** - dodaj `onclick="openTikTokModal()"`

## 🔧 Dostosowania

### Zmiana stylów
Edytuj plik `modale/tiktok-modal.css` aby dostosować:
- Kolory i gradienty
- Rozmiary modala
- Animacje
- Responsywność

### Dodawanie filmów dynamicznie
```javascript
// Dodaj nowy film przez JavaScript
addTikTokVideo('EMBED_CODE_TUTAJ', 'unique_id');
```

## 🚀 Wskazówki

1. **Testuj na różnych urządzeniach** - TikTok embeds mogą się różnie zachowywać
2. **Aktualizuj regularnie** - dodawaj nowe filmy z realizacji MetaStudio
3. **Sprawdź prawa autorskie** - upewnij się, że masz prawo do osadzania filmów
4. **Optymalizuj loading** - nie dodawaj zbyt wielu filmów naraz

## 🎯 Rekomendacje treści

Idealnie byłoby dodawać filmy pokazujące:
- **Before/After** transformacji wnętrz
- **Timelapse** remontów i projektów
- **Prezentację materiałów** i tekstur
- **Inspiracje designerskie**
- **Proces projektowania**

---

Utworzone przez GitHub Copilot dla MetaStudio ✨