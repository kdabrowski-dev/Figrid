# FIGRID // 8-Bit Arcade Speed Typing Engine (React + TypeScript)

Ultra-responsywna gra webowa w szybkie wpisywanie cyfr (Zero Input Lag, O(1) bezpośrednie aktualizacje węzłów DOM bez re-renderowania siatki Reacta przy każdym kliknięciu).

## Główne funkcjonalności

- **Plansza 21 × 13 (273 pola)**: Wyraźne, kontrastowe cyfry oczekujące na wpisanie oraz natychmiastowe podświetlanie aktywnej komórki.
- **Balans Fair-Play (Stały budżet wagowy na każdą grę)**:
  - Każda nowa plansza losuje identyczny zestaw wagowy sekwencji (łącznie **4050 pkt** w puli bonusowej sekwencji) oraz dokładnie **26 uzbrojonych cyfr z tarczą** (8 wewnątrz sekwencji i 18 poza nimi).
- **Uzbrojone cyfry z tarczą (Reinforced Keys 🛡)**:
  - Wymagają podwójnego wciśnięcia klawisza: pierwsze uderzenie rozbija tarczę, a drugie zalicza cyfrę z **mnożnikiem punktów ×2** za prędkość!
  - Jeśli tarcza znajduje się wewnątrz sekwencji, oba bonusy (Tarcza ×2 + Bonus Sekwencji) kumulują się.
- **Rozpoznawanie sekwencji rytmicznych i pamięci mięśniowej**:
  - **Krótkie (3–4 cyfry)**: `1234` (Ślizg →), `9876` (← Ślizg), `1010` (Bębny), `1337` (Leet!), `2580` (Zsyp Numpad), `0000` (Spam).
  - **Średnie (5–7 cyfr)**: `12345` (Lewa Dłoń), `67890` (Prawa Dłoń), `13579` / `24680` (Żabie Skoki), `123321` (Palindrom), `123123` (Pętla), `159753` (Zygzak Numpad).
  - **Złota Liczba Fi (Easter Egg Φ)**: `16153` – specjalna złota iluminacja i wysoki bonus punktowy.
  - **Długie (Jackpoty 10 cyfr)**: `1122334455` (Podwójne Bębny), `1234432100` (Wielka Fala).
- **5-kolorowe dynamiczne spektrum prędkości**:
  - Kolor zdobywanych punktów `+pkt` nad wycentrowanym licznikiem przesuwa się płynnie w gradiencie (`#38b6ff` → `#00ff9d` → `#ffea00` → `#ff5500` → `#ff00e5`) w zależności od prędkości i wysokości zdobytych punktów.
- **Wykres prędkości na żywo (Canvas 2D po prawej stronie)**:
  - Pokazuje tempo ostatnich kliknięć (znaki/sekundę), wyróżnia trafione tarcze 2× oraz ukończone sekwencje.
- **Własne bindowanie klawiszy (Keybindings)**:
  - Możliwość przypisania dowolnych klawiszy (np. liter `QWERTYUIOP`, spacji, Numpada) do poszczególnych cyfr `0-9`.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```
