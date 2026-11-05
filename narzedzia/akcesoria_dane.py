# Katalog akcesoriów — generator dane/akcesoria.json (2026-11-06)
# Rodzaje = zatwierdzona lista v2 Adama (KATALOG-AKCESORIOW/LISTA-AKCESORIOW.md, 50 pozycji)
# + rozbudowa 2026-11-05 na prośbę Adama (garderoba, wkłady kuchenne, łazienka).
# Filmy: tylko osadzanie odtwarzaczem YouTube (nic nie pobieramy). Przy uruchomieniu każdy film jest
# sprawdzany przez YouTube oEmbed (200 = istnieje i pozwala na osadzanie) — tytuł i kanał bierzemy stamtąd.
# Uruchomienie z katalogu repo:  python narzedzia/akcesoria_dane.py
import json, os, sys, time, urllib.parse, urllib.request

# Filmy pionowe (YouTube Shorts) — odtwarzacz w formacie 9:16
# Kafelek grupy: film z czytelnym kadrem (domyślnie pierwszy poziomy film grupy)
MINI_KAFELKA = {'windy': 'SDuS0btbu5A', 'drzwi': 'oLh6BPfZvQ0'}

PION = {'rHdtrPoksdw', 'tUEjCDEDoak', 'zn5iAEMkVwQ', 'MnEB-27M1jA', '9vaf5JREfAU', '6aaSHaIoeNk', 'mcaJPWGZkeo'}

KATEGORIE = [
    ('zawiasy', 'Zawiasy',
     'Zawiasy decydują o tym, jak otwierają się drzwi szafek: z cichym domykiem, szeroko w narożniku, bez blokowania szuflad wewnętrznych, całkiem niewidocznie albo z frontem chowanym w bok korpusu.', [
        ('standardowy', 'Zawias standardowy z cichym domykiem',
         'Zwykły zawias puszkowy do drzwi szafek z wbudowanym tłumikiem — drzwi domykają się same, cicho i miękko, niezależnie od siły pchnięcia. Występuje w wersjach nakładanej, bliźniaczej i wpuszczanej.',
         'Blum (CLIP top BLUMOTION), Hettich (Sensys), GTV', ['L7vcbtAq1u0']),
        ('170', 'Zawias 170°/175° do szafek narożnych + zawias uzupełniający',
         'Zawias szerokokątny (ok. 170°) pozwala otworzyć drzwi szafki narożnej na pełną szerokość, dzięki czemu wnętrze jest dostępne bez przeszkód. W narożniku łamanym lub przy drzwiach składanych stosuje się dodatkowo zawias uzupełniający łączący dwa skrzydła.',
         'Blum (CLIP top 170° + zawias do drzwi łamanych), Hettich, GTV', ['4PeVw6nVYWc']),
        ('uskok', 'Zawias z uskokiem („zero protrusion”, ok. 155°) do szafek z szufladami wewnętrznymi',
         'Po otwarciu front i zawias nie wchodzą w światło szafki, więc szuflady wewnętrzne za drzwiami wysuwają się bez blokowania. Kąt otwarcia ok. 155°; dla grubych frontów wersja 125°.',
         'Blum (CLIP top BLUMOTION 155° / 125° zero protrusion), Hettich, GRASS', ['-J3A1Oi1DuQ', 'rHdtrPoksdw']),
        ('ukryty', 'Zawias ukryty — wpuszczony w grubość frontu',
         'Zawias schowany w grubości frontu i boku szafki: ani przy zamkniętych, ani przy otwartych drzwiach nie widać puszki ani ramienia. Salice Conecta jest całkowicie ukryty i ma cichy domyk (do drzwi drewnianych); Salice Air ma ok. 10 mm i współpracuje z frontami w profilach aluminiowych Salice.',
         'Salice (Conecta, Air)', ['UBL2u1LQxRU', 'FC6X8C7YMHk']),
        ('kieszeniowy', 'Zawias z frontem chowanym w bok szafki (system kieszeniowy)',
         'Drzwi po otwarciu wsuwają się na prowadnicach w boczną kieszeń szafki i nie zajmują miejsca przed zabudową. Sprawdza się przy ukrytej kuchni, barku, „garażu” na AGD czy telewizorze w zabudowie.',
         'Blum (REVEGO), Häfele / HAWA (Concepta, Folding Concepta), Hettich', ['wOHlkacrruU', 'Av0KrriELuY']),
    ]),
    ('bez-uchwytow', 'Otwieranie bez uchwytów',
     'Fronty bez uchwytów otwiera się naciśnięciem, dotykiem z pomocą silniczka albo przez wnękę na palce w profilu aluminiowym. Meble wyglądają spokojniej i są łatwiejsze w utrzymaniu czystości.', [
        ('nacisniecie', 'Otwieranie przez naciśnięcie (mechaniczne)',
         'Lekkie naciśnięcie frontu uwalnia mechanizm, który wypycha drzwi lub szufladę — bez prądu i bez uchwytu.',
         'Blum (TIP-ON), Hettich (Push to open), GRASS', ['IrFWf_INUuI']),
        ('elektryczne', 'Otwieranie elektryczne (dotyk)',
         'Silniczek otwiera szufladę lub podnośnik po lekkim dotknięciu frontu, a zamykanie odbywa się z cichym domykiem. Stosowane także przy zabudowanej lodówce i zmywarce.',
         'Blum (SERVO-DRIVE), Hettich (Easys), Häfele (Sensomatic)', ['pbvUl125PAk', 'fox_FreEuhM']),
        ('gola', 'Profil uchwytowy (Gola)',
         'Aluminiowa wnęka na palce biegnąca wzdłuż frontów zastępuje uchwyty — w układzie poziomym lub pionowym. Front chwyta się od góry lub z boku, a zabudowa pozostaje gładka.',
         'Emuca (Gola-e), Häfele i inni', ['bYHk928qVW4', '-1w82mAMeZg']),
    ]),
    ('szuflady', 'Szuflady',
     'Systemy szuflad różnią się grubością i kształtem boków, wysokością oraz wykończeniem. Każdy z nich może mieć cichy domyk albo otwieranie przez naciśnięcie (zob. „Szuflady — opcje”).', [
        ('cienkoscienne', 'Szuflady cienkościenne',
         'Nowoczesne szuflady z bardzo cienkimi, prostymi bokami metalowymi. Lekki wygląd, pełny wysuw i cichy domyk.',
         'Blum (LEGRABOX), GTV (Axis Pro), Hettich (AvanTech YOU), GRASS (Vionaro)', ['UtfRqerLw48', 'lln1L2JEeh4']),
        ('standardowe', 'Szuflady standardowe (szersza ścianka)',
         'Klasyczne szuflady metalowe z grubszym, podwójnym bokiem — sprawdzone rozwiązanie w korzystniejszej cenie, w kilku wysokościach i kolorach.',
         'Blum (TANDEMBOX), GTV (Modern Box), Hettich (InnoTech), GRASS (Nova Pro Scala)', ['dV7lyvgZqq4']),
        ('wysokie', 'Szuflady cienkościenne wysokie',
         'Wysokie szuflady na garnki, butelki i zapasy: cienki bok podniesiony relingiem albo ścianką szklaną lub metalową, która zatrzymuje zawartość.',
         'Blum (LEGRABOX — wysokie boki, relingi), GTV (Axis Pro Glass), Hettich', ['P-mTgIZvyTo', 'dpLNuF2GjYA']),
    ]),
    ('szuflady-opcje', 'Szuflady — opcje',
     'Dodatki, które można dobrać do każdego rodzaju szuflad: sposób otwierania, cichy domyk, wysokości i wyposażenie wnętrza.', [
        ('tip-on', 'TIP-ON — otwieranie przez naciśnięcie',
         'Szuflada bez uchwytu otwiera się po naciśnięciu frontu. TIP-ON BLUMOTION łączy otwieranie naciśnięciem z cichym domykiem; wersja elektryczna to SERVO-DRIVE.',
         'Blum (TIP-ON, TIP-ON BLUMOTION), Hettich (Push to open Silent), GRASS', ['bGRkZT22qpA', '_gv-unRqoKg']),
        ('cichy-domyk', 'Cichy domyk (BLUMOTION)',
         'Tłumik w prowadnicy wyhamowuje szufladę na końcu drogi i dociąga ją do zamknięcia — bezgłośnie, także przy mocnym pchnięciu i ciężkiej zawartości.',
         'Blum (BLUMOTION), Hettich (Silent System), GTV', ['lRQQYQ13FoI']),
        ('wyposazenie', 'Różne wysokości + wyposażenie wnętrza',
         'Szuflady niskie, średnie i wysokie oraz szuflady wewnętrzne ukryte za drzwiami. Wnętrze porządkują wkłady na sztućce, noże, przyprawy i talerze oraz przegrody na garnki i pokrywki.',
         'Blum (AMBIA-LINE, ORGA-LINE), Hettich, Kesseböhmer', ['71FSx8ofgdU', 'CdbQIPZBVKs']),
        ('sztucce', 'Wkład na sztućce',
         'Wkład z przegródkami dopasowany do szerokości szuflady — sztućce i drobne przybory mają stałe miejsca; są wersje do szuflad płytkich i szerokich.',
         'Blum (ORGA-LINE), Hettich, GTV, Peka', ['yryQ98AePwA', 'cP7OUcHZA3s']),
        ('noze', 'Uchwyt na noże w szufladzie',
         'Wkład z gniazdami na noże montowany w szufladzie — ostrza są bezpieczne i nie zajmują blatu.',
         'Blum (ORGA-LINE), Hettich i inni', ['FtnEC3z0VrE', '2Vr2DfEV8Ls']),
        ('przyprawy-talerze', 'Wkłady na talerze, przyprawy i folie',
         'Uchwyt na talerze z przestawianymi kołkami (talerze w szufladzie zamiast w szafce górnej), wkład na przyprawy oraz podajnik folii i papieru do pieczenia.',
         'Blum (ORGA-LINE), Häfele', ['A7eXCrsZwMY', 'vqldhFGoybM']),
        ('syfon', 'Szuflada wokół syfonu (kuchnia, łazienka)',
         'Szuflada w kształcie litery U omija syfon i rury pod zlewem lub umywalką, więc cała szafka zlewowa jest użyteczna i otwiera się jak zwykła szuflada.',
         'Blum, Hettich, Rev-A-Shelf (organizery w kształcie U)', ['KLAiLkPWhzM', 'cjX2XrqLU94']),
    ]),
    ('podnosniki', 'Podnośniki szafek górnych',
     'Podnośniki unoszą fronty szafek górnych do góry zamiast otwierać je na bok. Rodzaj ruchu dobiera się do wielkości frontu i wysokości szafki.', [
        ('mala-klapa', 'Mała klapa uchylna (np. nad lodówką)',
         'Niewielki front unosi się do góry na mechanizmie zamocowanym u góry szafki. Kompaktowe okucie mieści się nawet w płytkich szafkach, np. nad okapem.',
         'Blum (AVENTOS HK-XS, HK-S), Kesseböhmer', ['xP-ijqHWGb0', 'A_o4qONf5dA']),
        ('klapa', 'Klapa uchylna',
         'Front unosi się do góry i zatrzymuje w dowolnym położeniu; potrzebuje mało miejsca nad szafką.',
         'Blum (AVENTOS HK top), Hettich (Lift Advanced HK), GRASS (Kinvaro T-Slim)', ['nJUFR_2j3R0']),
        ('nad-szafke', 'Front „do góry i nad szafkę”',
         'Duży, jednoczęściowy front unosi się łukiem ponad korpus i nie zasłania wnętrza.',
         'Blum (AVENTOS HS), Hettich (Lift Advanced HS)', ['YttO51ryjdk']),
        ('pionowy', 'Front podnoszony pionowo',
         'Front jedzie równolegle do góry. Dobre rozwiązanie przy niskim suficie albo nad blatem z urządzeniami.',
         'Blum (AVENTOS HL), Hettich (Lift Advanced HL), GRASS (Kinvaro L-80)', ['L5IYwpcycdw']),
        ('skladany', 'Front składany (harmonijka)',
         'Dwuczęściowy front składa się na pół i unosi do góry — do wysokich szafek górnych.',
         'Blum (AVENTOS HF), Hettich (Lift Advanced HF), GRASS (Kinvaro F-20)', ['f60tZNHT-ME']),
    ]),
    ('cargo', 'Cargo, spiżarnie i kosze',
     'Wysuwane kosze i półki wykorzystują każdy centymetr szafki — od wąskich wysuwów na przyprawy po wysokie spiżarnie i segregację odpadów pod zlewem.', [
        ('cargo-waskie', 'Cargo dolne wąskie (15–30 cm)',
         'Wąski wysuw z koszami na butelki, przyprawy i oleje — wykorzystuje resztki miejsca w zabudowie.',
         'Kesseböhmer, Peka (Snello), Rejs, GTV', ['378uWkKT6dQ', 'O047YvXbpcc']),
        ('cargo-wysokie', 'Cargo wysokie (spiżarnia wysuwana)',
         'Cała zawartość wysokiej szafki wyjeżdża na zewnątrz razem z frontem; półki z relingami widać z obu stron.',
         'Kesseböhmer (DISPENSA), Peka (Pleno)', ['pFw9DeGM5ZE', 'qS9bMbO-vFo']),
        ('tandem', 'Spiżarnia z koszami wyjeżdżającymi z drzwiami',
         'Po otwarciu drzwi kosze zamocowane na drzwiach i kosze z wnętrza wysuwają się razem do przodu.',
         'Kesseböhmer (TANDEM)', ['lqbtJpS7pGE', 'z-sRTrd-E_g']),
        ('space-tower', 'Spiżarnia z szufladami wewnętrznymi',
         'Wysoka szafka z drzwiami, za którymi są szuflady na pełnym wysuwie — każdą otwiera się osobno, z dostępem do zawartości z góry i z boków.',
         'Blum (SPACE TOWER), Hettich', ['XAh2U4QS7n8', 'oA8xpdN_ay4']),
        ('odpady', 'Pod zlew: segregacja odpadów',
         'Wysuwane kosze do segregacji w szafce zlewowej, z cichym domykiem; opcjonalnie otwierane kolanem lub dotykiem.',
         'Hailo (Cargo Synchro), Peka (Oeko), Blanco (Select), GTV', ['Fq6sKJ2IZYQ']),
        ('reczniki', 'Wysuwany uchwyt na ręczniki',
         'Wąski wysuw z prętami na ściereczki i ręczniki kuchenne, montowany w szafce dolnej albo w szczelinie ok. 15 cm — ręczniki schną poza zasięgiem wzroku.',
         'Kesseböhmer, Peka, Häfele i inni', ['BGYRHB14rzw', 'qLmQUdxktKM']),
    ]),
    ('narozniki', 'Rozwiązania narożne',
     'Narożnik to najtrudniejsze miejsce w kuchni. Okucia wyciągają zawartość z głębi szafki do użytkownika.', [
        ('lemans', 'Narożnik z wyjeżdżającymi półkami (LeMans)',
         'Półki o zaokrąglonym kształcie wyjeżdżają z narożnika jedna po drugiej, dając dostęp do całej zawartości.',
         'Kesseböhmer (LeMans)', ['9ftkquZnu8k', '7gZayE8XasU']),
        ('magic-corner', 'Magic Corner',
         'Po otwarciu drzwi przednie kosze wyjeżdżają z szafki, a tylne przesuwają się z głębi narożnika do przodu.',
         'Kesseböhmer, Peka, Vauth-Sagel (VS COR), Rejs', ['EQHGQj5dbY8', 'DZHVduf5uEg']),
        ('karuzela', 'Karuzela narożna',
         'Obrotowe półki w narożniku w kształcie litery L — zawartość podjeżdża do drzwi po obróceniu półki.',
         'Kesseböhmer (REVO) i inni', ['Hw8OfLLeG1k']),
    ]),
    ('cokoly', 'Cokoły',
     'Przestrzeń za cokołem pod szafkami dolnymi zwykle się marnuje — można w niej zmieścić płaską szufladę albo wysuwany stopień.', [
        ('szuflada-cokol', 'Szuflada w cokole',
         'Płaska szuflada w miejscu cokołu na blachy, ręczniki czy karmę; zwykle bez uchwytu, z otwieraniem przez naciśnięcie.',
         'Blum, Hettich, GTV; gotowe szuflady cokołowe różnych firm', ['3rwrRM8VG_4']),
        ('stopien', 'Wysuwany stopień w cokole',
         'Stopień wysuwa się z cokołu po lekkim dotknięciu (nośność do 150 kg) i ułatwia sięgnięcie do górnych szafek; pod nim jest miejsce do przechowywania.',
         'Blum (SPACE STEP)', ['8AwBk2nXeB0', 'T8DLi5ouRgs']),
    ]),
    ('windy', 'Opuszczane półki, windy i stoły',
     'Mechanizmy, które przenoszą zawartość mebla na wygodną wysokość albo wyciągają z niego dodatkowy blat.', [
        ('kosz-opuszczany', 'Opuszczany kosz w szafce górnej (ręczny lub elektryczny)',
         'Kosz z półkami wychodzi z szafki górnej i zjeżdża na wysokość rąk — mechanicznie na sprężynie albo silnikiem.',
         'Kesseböhmer (iMove), Richelieu (Verti, elektryczny), Evolift (elektryczny)', ['X10JNzf5AGU', 'SDuS0btbu5A']),
        ('winda-agd', 'Winda na robot kuchenny (AGD)',
         'Półka z ciężkim urządzeniem, np. mikserem planetarnym, wyjeżdża z szafki dolnej i unosi się na wysokość blatu.',
         'Rev-A-Shelf, Kesseböhmer (ChefsTable)', ['To7JPhuVGFo']),
        ('tv', 'Podnośnik telewizora w meblu',
         'Telewizor chowa się w komodzie lub ławie (np. w nogach łóżka) i wyjeżdża elektrycznie na pilota.',
         'Firgelli, Häfele, Cabinet Tronix', ['xs5hr5oT1LU', '4TDq98qK35U']),
        ('stol', 'Stół / blat wysuwany z szafki',
         'Blat stołu wysuwa się z miejsca szuflady lub szafki — dodatkowe miejsce do jedzenia i pracy, które po użyciu znika.',
         'Häfele (Top Flex, Rapid)', ['LuzQeOVh-F0']),
    ]),
    ('gniazdka', 'Gniazdka i ładowanie',
     'Prąd tam, gdzie jest potrzebny, bez gniazd na widoku i kabli na blacie.', [
        ('gniazdo-blat', 'Gniazdo wysuwane z blatu',
         'Kolumna z gniazdami i USB chowa się w blacie i wysuwa ręcznie albo silnikiem; po schowaniu widać tylko pokrywkę.',
         'Evoline (Port), Bachmann (Twist 2)', ['EIEm7-5supk', '6k6OJ4Vddm0']),
        ('gniazdo-szuflada', 'Gniazdo w szufladzie / pod szafką górną',
         'Ładowanie telefonów i drobnego AGD w szufladzie albo z listwy pod szafką górną — bez kabli na blacie.',
         'Docking Drawer; listwy podszafkowe różnych firm', ['Zfq16PELsWk', 'cCr3Kfa3hLU']),
        ('qi', 'Ładowarka bezprzewodowa w blacie / pod blatem',
         'Telefon ładuje się po położeniu na blacie: ładowarka montowana pod spodem działa przez kamień lub spiek do ok. 25 mm; są też wersje na pokrywce gniazda.',
         'Kew Labs, FreePower, Evoline (Square80 Qi)', ['IrDnKjFuYfI']),
        ('lazienka-gniazdo', 'Wysuwany organizer łazienkowy z gniazdem',
         'Wąski wysuw w szafce łazienkowej z gniazdem elektrycznym i uchwytami na suszarkę, prostownicę czy golarkę — urządzenia zostają podłączone, a kable schowane.',
         'Rev-A-Shelf, Docking Drawer', ['Bkjq6i7Ma_o']),
    ]),
    ('led', 'Oświetlenie LED',
     'Światło w meblach: nad blatem, na półkach, w witrynach oraz we wnętrzu szuflad i szaf.', [
        ('profile-led', 'Profile LED pod szafkami i w meblach',
         'Taśmy LED w profilach aluminiowych, nawierzchniowych i wpuszczanych, oświetlają blat, półki i witryny.',
         'Häfele (Loox5) i inni', ['fR_ByhTslXo', 'pHhVqwqg9NI']),
        ('led-czujnik', 'Oświetlenie z czujnikiem (szuflady, szafy)',
         'Światło zapala się samo po otwarciu szuflady lub drzwi i gaśnie po zamknięciu.',
         'Häfele (Loox5), Hettich (AvanTech YOU Illumination)', ['nSdvsK9-qzU']),
    ]),
    ('garderoba', 'Garderoba',
     'Okucia i wyposażenie, które porządkują szafę i garderobę: drążki, wysuwane wieszaki, wkłady do szuflad, buciarki, kosze na pranie, lustra, witryny i oświetlenie.', [
        ('pantograf', 'Drążek opuszczany (pantograf) — ręczny lub elektryczny',
         'Drążek w wysokiej szafie zjeżdża do wysokości rąk; dostępne wersje ręczne, elektryczne i z oświetleniem LED.',
         'Häfele, Servetto, Dacter (PL, elektryczny)', ['YWeHIskd3PI', '5DKEhJ0TRJc']),
        ('drazek-wysuwany', 'Drążek wysuwany do przodu',
         'Krótki drążek na prowadnicy montowany w szafie prostopadle do frontu; wysuwa się do przodu, by przygotować ubrania na następny dzień albo odwiesić rzeczy na chwilę.',
         'Häfele, Rev-A-Shelf, systemy szaf różnych firm', ['19pzW6Une_8']),
        ('spodniarka', 'Spodniarka wysuwana',
         'Rama z rzędem prętów na prowadnicach z pełnym wysuwem — spodnie wiszą płasko, nie gniotą się i każdą parę widać po wysunięciu.',
         'Häfele (TAG Synergy), Peka, Kesseböhmer', ['Wn_YcA6iLss', 'sOBcobglTcQ']),
        ('krawaty-paski', 'Wieszak wysuwany na krawaty i paski',
         'Wąski wysuw z hakami lub przegródkami na krawaty, paski i apaszki, montowany z boku szafy lub pod półką.',
         'Häfele (TAG Synergy), Peka', ['_MpbjLy-brU']),
        ('wklady-garderoba', 'Wkłady do szuflad: biżuteria, okulary, zegarki, skarpety',
         'Wkłady z przegródkami (często wyłożone welurem) dzielą szufladę na pola na biżuterię, okulary, spinki, zegarki, skarpety czy bieliznę; bywają dwupoziomowe, z przesuwną tacą.',
         'Häfele, Peka, Closet Factory i producenci systemów garderób', ['JzsHf6qDBwo', 'kTf4_IcI6Tc']),
        ('buty-wysuwane', 'Buciarka wysuwana',
         'Półki lub ramy na buty na prowadnicach z pełnym wysuwem — wszystkie pary widać od razu, nawet w głębokiej szafie.',
         'Häfele, Peka (Extendo), Kesseböhmer', ['G-WXPpwZcVU', 'djSluRKo9EE']),
        ('buty-obrotowe', 'Buciarka obrotowa',
         'Obrotowa kolumna z półkami na buty montowana w szafie: po obróceniu każda para podjeżdża do drzwi, a w wąskiej szafie mieści się dużo obuwia.',
         'Häfele i inni', ['6aaSHaIoeNk', 'mcaJPWGZkeo']),
        ('kosz-pranie', 'Wysuwany kosz na pranie',
         'Kosz lub worek na brudne ubrania na prowadnicach — wysuwany albo odchylany — schowany w szafie, garderobie lub szafce łazienkowej.',
         'Rev-A-Shelf, Häfele, Peka', ['HlX7-khT3tA']),
        ('deska', 'Deska do prasowania chowana w szufladzie',
         'Pełnowymiarowa deska do prasowania rozkładana z szuflady lub zza frontu; po użyciu składa się i znika w meblu.',
         'Häfele (Ironfix), Rev-A-Shelf', ['Hif_0IGo2xk', 'oFNEzptXOXs']),
        ('lustro', 'Wysuwane, obrotowe lustro',
         'Lustro schowane w szafie wysuwa się i obraca, a po użyciu znika we wnętrzu.',
         'Häfele i inni', ['mCmB2bw6028', 'OYbDR-Wmcks']),
        ('witryna', 'Szafa z frontami szklanymi (witryna w garderobie)',
         'Drzwi szklane w ramach aluminiowych z oświetleniem wnętrza — ubrania, torebki czy buty są widoczne jak w butiku, a jednocześnie chronione przed kurzem.',
         'Ramy aluminiowe do frontów szklanych różnych producentów + oświetlenie LED', ['9vaf5JREfAU', 'OzuAESFf6Mc']),
        ('led-garderoba', 'Oświetlenie garderoby (drążki i profile z LED)',
         'Drążek z wbudowaną taśmą LED albo profile świetlne przy bokach szafy, włączane czujnikiem ruchu lub otwarcia drzwi — ubrania dobrze widać w każdym zakątku.',
         'Hettich (Wardrobe Tube), Häfele (Loox5)', ['9zyqv71u_44', 'ILvshdjfxLc']),
    ]),
    ('drzwi', 'Drzwi przesuwne, składane i chowane',
     'Systemy drzwi do szaf i zabudów wnękowych, które nie potrzebują miejsca na otwarcie skrzydła.', [
        ('przesuwne', 'Drzwi przesuwne (szafy)',
         'Drzwi jadą po prowadnicy górnej lub dolnej i nie potrzebują miejsca przed szafą.',
         'Hettich (TopLine, SlideLine), Häfele (Slido)', ['N4z09G9pD1E']),
        ('harmonijka', 'Drzwi składane (harmonijka)',
         'Skrzydła składają się przy otwieraniu i odsłaniają prawie całą szerokość szafy.',
         'Hettich (WingLine), Häfele', ['fj9RMAr-ibE']),
        ('kieszen', 'Duże drzwi chowane w kieszeń (wnęki, ukryte kuchnie)',
         'Wysokie skrzydła otwierają się i wsuwają w boczne kieszenie zabudowy — rozwinięcie systemu kieszeniowego z działu „Zawiasy”.',
         'Häfele / HAWA (Concepta, Folding Concepta), Blum (REVEGO)', ['oLh6BPfZvQ0', '8Np4f9DQ_g0']),
    ]),
    ('sprytne', 'Sprytne rozwiązania',
     'Wybór ciekawych i nowych rozwiązań — także produkty z Chin bez znanej marki. Pokazujemy je jako inspirację; przed montażem sprawdzamy dostępność i zgodność z normami (CE).', [
        ('kosz-elektryczny', 'Elektryczny kosz opuszczany do szafki górnej',
         'Kosz zjeżdża z szafki górnej silnikiem po dotknięciu przycisku. Rozwiązanie popularne w Chinach; według jednej z ofert przy braku prądu nie da się go opuścić ręcznie.',
         'Oferty bez marki (Chiny), np. NUOMI — do sprawdzenia CE', ['tUEjCDEDoak']),
        ('gniazdo-qi', 'Gniazdo w blacie wysuwane silnikiem + ładowarka Qi',
         'Kolumna z gniazdami wysuwa się sama po dotknięciu, a na pokrywce można bezprzewodowo ładować telefon.',
         'Produkty bez marki i dystrybutorzy (np. Simple Lighting, BOX15) — do sprawdzenia zgodności z normą PL', ['iVHr31iweFY', 'YOIbQcxxFjA']),
        ('gniazda-szynowe', 'Gniazda szynowe',
         'Szyna montowana na ścianie, do której w dowolnym miejscu wpina się i przesuwa gniazda. W kuchni tylko wersje odporne na tłuszcz i wodę.',
         'Produkty bez marki (Chiny)', ['uonFU5CVZ7s']),
        ('garaz-agd', 'Garaż na AGD',
         'Wnęka na blacie zamykana roletą, klapą albo frontem chowanym w bok — czajnik, ekspres i toster znikają z widoku.',
         'Rozwiązanie stolarskie + okucia (np. AVENTOS HL, REVEGO)', ['vlZ75XCWpoM', 'YjKmEvX3nP0']),
        ('sejf', 'Ukryta szuflada-sejf na odcisk palca',
         'Szuflada otwiera się dopiero po przyłożeniu palca do czytnika; z zewnątrz widać tylko czytnik.',
         'Diamond Cabinets (USA), Barska, Mycube', ['-V-lPp3-4lg']),
        ('roomspin', 'Meble obrotowe Hettich RoomSpin',
         'Okucie obrotowo-wychylne, dzięki któremu element mebla zmienia funkcję, np. biurko obraca się w regał — do małych mieszkań i wnętrz wielofunkcyjnych.',
         'Hettich (RoomSpin, seria SpinLine)', ['zn5iAEMkVwQ', '-Evz7_BC7KM']),
    ]),
]


def oembed(vid):
    u = 'https://www.youtube.com/oembed?format=json&url=' + urllib.parse.quote('https://www.youtube.com/watch?v=' + vid)
    return json.load(urllib.request.urlopen(u, timeout=20))


def jakosc_miniatury(vid, pion):
    # najlepsza istniejąca miniatura (YouTube nie ma hq720 dla każdego filmu) — strona nie prosi o brakujące pliki
    for q in (['hqdefault'] if pion else ['hq720', 'mqdefault']):
        try:
            r = urllib.request.urlopen(urllib.request.Request(f'https://i.ytimg.com/vi/{vid}/{q}.jpg', method='HEAD'), timeout=20)
            if r.status == 200:
                return q
        except Exception:
            pass
    return 'hqdefault'


def main():
    out = {'zaktualizowano': time.strftime('%Y-%m-%d'), 'kategorie': []}
    bledy = []
    for kid, knazwa, kopis, rodzaje in KATEGORIE:
        kat = {'id': kid, 'nazwa': knazwa, 'opis': kopis, 'rodzaje': []}
        for rid, rnazwa, ropis, prod, filmy in rodzaje:
            fl = []
            for vid in filmy:
                try:
                    o = oembed(vid)
                except Exception as e:  # film usunięty albo bez zgody na osadzanie — pomijamy
                    bledy.append(f'{rid} {vid}: {e}')
                    continue
                f = {'platforma': 'youtube', 'id': vid, 'url': f'https://www.youtube.com/watch?v={vid}',
                     'tytul': o['title'], 'autor': o['author_name'], 'autorUrl': o['author_url']}
                if vid in PION:
                    f['pion'] = True
                f['mini'] = jakosc_miniatury(vid, vid in PION)
                fl.append(f)
                time.sleep(0.2)
            kat['rodzaje'].append({'id': rid, 'nazwa': rnazwa, 'opis': ropis, 'producenci': prod, 'filmy': fl})
        # kafelek kategorii = miniatura pierwszego poziomego filmu pierwszego rodzaju
        if kid in MINI_KAFELKA:
            kat['miniatura'] = MINI_KAFELKA[kid]
        else:
            for r in kat['rodzaje']:
                f = next((x for x in r['filmy'] if not x.get('pion')), None)
                if f:
                    kat['miniatura'] = f['id']
                    break
        out['kategorie'].append(kat)
    sciezka = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dane', 'akcesoria.json')
    with open(sciezka, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    n = sum(len(k['rodzaje']) for k in out['kategorie'])
    zf = sum(1 for k in out['kategorie'] for r in k['rodzaje'] if r['filmy'])
    print(f'kategorie: {len(out["kategorie"])}, rodzaje: {n}, z filmem: {zf}')
    for b in bledy:
        print('BŁĄD', b)


if __name__ == '__main__':
    sys.exit(main())
