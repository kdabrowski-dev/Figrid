# FIGRID — Instrukcja Gracza (User Manual)

## 1. O co chodzi w grze?
**FIGRID** to zręcznościowa gra szybkościowa na planszy o wymiarach **21 wierszy × 13 kolumn** (łącznie **273 pola** z cyframi od `0` do `9`).  
Twoim celem jest **oczyszczenie całej planszy w jak najkrótszym czasie i zdobycie jak największej liczby punktów**, uderzając na klawiaturze cyfry odpowiadające aktualnie podświetlonym polom.

Im szybciej i płynniej wciskasz kolejne klawisze oraz im lepiej wykorzystujesz tarcze, ukryte kombinacje i rozwidlenia ścieżek, tym wyższy będzie Twój wynik końcowy.

---

## 2. Tryby gry

Przed wykonaniem pierwszego ruchu możesz przełączać się między dwoma trybami gry przyciskiem **`MODE`** na górnym pasku (lub w oknie **`SETTINGS`**).  
*Uwaga: po naciśnięciu pierwszej cyfry zmiana trybu zostaje zablokowana do czasu ukończenia lub zresetowania planszy (`ESC`).*

### Tryb 1: LINEAR (Klasyczny — Liniowy)
- Zaczynasz w **lewym górnym rogu** planszy i poruszasz się po kolei **od lewej do prawej, wiersz po wierszu**, aż do prawego dolnego rogu.
- Zawsze podświetlone jest dokładnie jedno aktywne pole (w kolorze jasnego cyjanu), które musisz wcisnąć jako następne.
- To tryb czystego refleksu i czytania z wyprzedzeniem (jak tekst w książce).

### Tryb 2: OMNI-8 (Swobodny — 8 Kierunków i Ścieżki Kwantowe)
- Rozgrywkę zaczynasz od **środkowego pola planszy**. Dopóki nie wciśniesz pierwszej cyfry ze środka, pozostałe pola są zablokowane.
- Po zbiciu środkowego pola możesz poruszać się w **dowolnym z 8 kierunków** (góra, dół, lewo, prawo oraz 4 skosy).
- Pola, na które możesz przejść w kolejnym ruchu, są otoczone **jasną, przerywaną ramką**. Wystarczy wcisnąć cyfrę widoczną na którymkolwiek z dostępnych sąsiednich pól, aby tam przejść.

#### Specjalne mechaniki trybu OMNI-8:
1. **Przechodzenie przez krawędzie planszy (Wrap-Around)**:  
   Plansza jest zawinięta jak kula/torus — jeśli stoisz przy lewej krawędzi, ruch w lewo przeniesie Cię na prawą krawędź (analogicznie góra–dół i narożniki). Poza ramką planszy wyświetlają się półprzezroczyste „duchy" kafelków z przeciwległej krawędzi, dzięki czemu nie musisz odrywać wzroku na drugi koniec ekranu.
2. **Przeskakiwanie zaliczonych pól (Phase Jump)**:  
   Jeśli w danym kierunku sąsiednie pole zostało już wcześniej zaliczone (jest zielone), Twój ruch automatycznie „przelatuje" w linii prostej przez zaliczone kafelki aż do pierwszego wolnego pola w tym kierunku. Dzięki temu nigdy nie zablokujesz się w ślepym zaułku.
3. **Rozwidlenia ścieżek (SPLIT)**:  
   Co jeśli wokół Twojego pola znajdują się np. dwie takie same cyfry `4` i wciśniesz `4`? Gra nie zmusza Cię do wyboru z góry — **ścieżka rozdwaja się!**  
   - Każda możliwa ścieżka oraz jej aktualny przód (head) otrzymują **swój własny, unikalny kolor neonowy**, dzięki czemu od razu widzisz, który wariant dokąd prowadzi.
   - Jeśli dwie możliwe ścieżki przecinają się na tym samym kafelku, jego obramowanie zmienia się na dwukolorowe.
   - Dopiero gdy w kolejnych ruchach wybierzesz cyfrę pasującą tylko do jednej ze ścieżek, gra automatycznie zatwierdzi tę właściwą trasę.
4. **Złączenie ścieżek w Diament (QUANTUM MERGE)**:  
   Jeśli rozwidlone ścieżki po kilku ruchach **spotkają się ponownie na tym samym polu** (tworząc kształt diamentu), dochodzi do **Złączenia Kwantowego (Quantum Merge)**:
   - Przez wszystkie kafelki wchodzące w skład diamentu przebiega błyskawiczna, jasna linia laserowa,
   - **Wszystkie ścieżki tworzące diament zostają zaliczone jednocześnie** (zyskujesz kilka pól naraz!),
   - Otrzymujesz specjalny bonus punktowy wyświetlany w dolnym polu wyniku:
     - **DOUBLE QUANTUM!** (złączenie 2 ścieżek) — bonus **+300 pkt**,
     - **TRIPLE QUANTUM!** (złączenie 3 ścieżek) — bonus **+750 pkt**,
     - **QUADRUPLE QUANTUM!** (złączenie 4 lub więcej ścieżek) — ogromny bonus **+2000 pkt**.

---

## 3. Tarcze (Reinforced Shields) — Podwójne Uderzenie (2X)

Niektóre cyfry na planszy są chronione **Tarczą**. Tarcze nie są widoczne od razu na całej planszy — **wyłaniają się stopniowo**, gdy zbliżasz się do nich na odległość kilku kroków.

- Aby zaliczyć pole z tarczą, musisz **wcisnąć jego cyfrę dwukrotnie**:
  1. **Pierwsze wciśnięcie (`[CRACKED!]`)**: rozbija tarczę (kafelek zmienia kolor na pomarańczowy) i daje standardowe punkty za szybkość.
  2. **Drugie wciśnięcie (`[SHIELD 2X!]`)**: oczyszcza pole i daje **podwójną liczbę punktów (2×)**!
- **Priorytet tarczy w trybie OMNI-8**: Jeśli wykonasz szybki dwuklik tej samej cyfry w sytuacji, gdy dostępna jest tarcza, gra zawsze priorytetyzuje rozbicie/zaliczenie tarczy, abyś nie stracił bonusu `2X`.

---

## 4. Ukryte Sekwencje (Secret Sequences)

Na każdej wygenerowanej planszy ukryty jest zestaw specjalnych, rytmicznych układów cyfr (w trybie **LINEAR** ułożonych poziomo, a w trybie **OMNI-8** ułożonych zarówno **poziomo, jak i pionowo**, a także wykrywanych dynamicznie z rytmu wystukiwanych przez Ciebie cyfr).

- Jeśli wystukasz wszystkie cyfry wchodzące w skład ukrytej sekwencji wystarczająco szybko i płynnie, otrzymasz **dodatkowy bonus punktowy** (od **+200 pkt** za krótkie układy aż do **+900 pkt** za długie serie typu Jackpot).
- Na planszy ukryty jest również specjalny złoty układ (**Golden Ratio / Phi**), którego szybkie wbicie rozświetla całą ramkę planszy na złoto.

---

## 5. Punktacja, Kolory Prędkości i Błędy

### Jak naliczane są punkty?
Na dole ekranu znajduje się główny licznik **TOTAL SCORE**. Za każdy poprawnie wciśnięty klawisz otrzymujesz:
- **Punkty bazowe** + **Premię za szybkość** (im krótszy odstęp czasu w milisekundach od poprzedniego klawisza, tym więcej punktów).
- Kolor wyskakujących punktów oraz głównego licznika zmienia się dynamicznie wraz z Twoim tempem — od spokojnego błękitu, przez zieleń i żółć, aż po ognistą czerwień i neonową magentę przy rekordowych prędkościach.

### Co się dzieje przy pomyłce (MISS)?
- Jeśli wciśniesz cyfrę, która nie pasuje do aktywnego pola (lub żadnego z dostępnych sąsiadów w trybie OMNI-8):
  - Plansza oraz aktywny kafelek migną krótko na czerwono,
  - Od Twojego wyniku zostanie odjęta kara punktowa (`MISS!`), zależna od tempa, w jakim popełniono błąd,
  - Błąd zostanie odnotowany w statystyce **MISTAKES** w prawym panelu.

---

## 6. Panel Statystyk i Wykres Prędkości (Prawa Strona)

Po prawej stronie planszy znajduje się panel telemetrii na żywo:
- **Wykres prędkości**: pokazuje czas reakcji (w `ms`) oraz tempo uderzeń dla każdego kolejnego kroku. Żółte i błękitne punkty na wykresie oznaczają miejsca, w których zdobyłeś bonusy za sekwencje lub tarcze `2X`.
- **LAST SPEED**: czas ostatniego ruchu w milisekundach.
- **AVG PACE**: średni czas między klawiszami z całej dotychczasowej gry (im mniej `ms`, tym lepiej).
- **PEAK KPS**: Twoja najwyższa chwilowa prędkość mierzona w klawiszach na sekundę (Keys Per Second).
- **MISTAKES**: łączna liczba pomyłek w bieżącej grze.
- **SECRET SEQUENCES**: liczba odkrytych i zaliczonych na czas ukrytych sekwencji.
- **SHIELDS (2X)**: liczba rozbitych tarcz.

---

## 7. Konta Graczy, Ustawienia Klawiszy i Tabela Wyników (Leaderboard)

### Ustawienia i własne klawisze (`SETTINGS`)
- Klikając **`SETTINGS`**, możesz przypisać do każdej cyfry (`0–9`) **dowolne klawisze na klawiaturze** (np. rząd klawiszy pod lewą i prawą dłoń, klawiaturę numeryczną lub własny układ).
- Do jednej cyfry możesz przypisać więcej niż jeden klawisz (świetne do szybkiego naprzemiennego uderzania dwoma palcami przy tarczach `2X`).

### Logowanie i synchronizacja w chmurze (`LOGIN / REGISTER`)
- Klikając **`LOGIN / REGISTER`** w prawym górnym rogu, możesz założyć konto pilota lub zalogować się.
- Po zalogowaniu Twoje **przypisania klawiszy**, **preferowany tryb gry** oraz **domyślny 3-literowy podpis (nick)** są automatycznie zapisywane na serwerze — po zalogowaniu na innym komputerze od razu grasz na swoich ustawieniach.

### Zapis wyniku i Tabela Wyników (`LEADERBOARD`)
- Po oczyszczeniu wszystkich 273 pól wyświetla się podsumowanie gry (wynik końcowy, całkowity czas przejścia, średnie tempo, błędy i sekwencje).
- Wpisz swój **3-literowy nick** z klawiatury i naciśnij **`ENTER`** (lub kliknij **`SAVE TO LEADERBOARD`**), aby wysłać wynik do wspólnej tabeli wyników.
- W zakładce **`LEADERBOARD`** ranking jest podzielony na dwie niezależne kategorie:
  - **`LINEAR RANKING`** — najlepsze wyniki w trybie liniowym,
  - **`OMNI-8 RANKING`** — najlepsze wyniki w trybie 8-kierunkowym.

---

## 8. Skróty klawiszowe w trakcie gry
- **`0–9`** (lub zbindowane przez Ciebie klawisze) — zbijanie kolejnych pól na planszy.
- **`ESC`** — natychmiastowy restart i wygenerowanie nowej planszy.
- **`ENTER`** *(na ekranie końcowym)* — szybki zapis wyniku z 3-literowym nickiem do tabeli wyników.
