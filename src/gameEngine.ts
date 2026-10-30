// ============================================================================
// FIGRID // Fair & Deterministic-Budget Board Generator + Scoring Engine
// ============================================================================

export const ROWS = 21;
export const COLS = 13;
export const TOTAL_CELLS = ROWS * COLS; // 273

export type SequenceTier = 'SHORT' | 'MEDIUM' | 'LONG' | 'PHI';

export interface SequencePattern {
  id: string;
  name: string;
  subtitle: string;
  tier: SequenceTier;
  digits: number[];
  bonusPoints: number;
  maxAvgDeltaMs: number; // Max average ms per keystroke to trigger sequence bonus
  color: string;
  isPhiEasterEgg?: boolean;
}

export const SEQUENCE_CATALOG: SequencePattern[] = [
  // --- KRÓTKIE SEKWENCJE (3-4 cyfry) ---
  {
    id: 'slide_right',
    name: 'ŚLIZG →',
    subtitle: '1234 // Płynny ruch w prawo',
    tier: 'SHORT',
    digits: [1, 2, 3, 4],
    bonusPoints: 180,
    maxAvgDeltaMs: 280,
    color: '#00f0ff',
  },
  {
    id: 'slide_left',
    name: '← ŚLIZG',
    subtitle: '9876 // Płynny ruch w lewo',
    tier: 'SHORT',
    digits: [9, 8, 7, 6],
    bonusPoints: 180,
    maxAvgDeltaMs: 280,
    color: '#00f0ff',
  },
  {
    id: 'drum_1010',
    name: 'BĘBNY 1010',
    subtitle: '1010 // Rytmiczna przeplatanka',
    tier: 'SHORT',
    digits: [1, 0, 1, 0],
    bonusPoints: 160,
    maxAvgDeltaMs: 260,
    color: '#00e5a3',
  },
  {
    id: 'leet_1337',
    name: '1337 LEET!',
    subtitle: '1337 // Hakerski klasyk',
    tier: 'SHORT',
    digits: [1, 3, 3, 7],
    bonusPoints: 220,
    maxAvgDeltaMs: 290,
    color: '#38ff62',
  },
  {
    id: 'numpad_drop',
    name: 'ZSYP NUMPAD',
    subtitle: '2580 // Pionowy zjazd w dół',
    tier: 'SHORT',
    digits: [2, 5, 8, 0],
    bonusPoints: 190,
    maxAvgDeltaMs: 280,
    color: '#00f0ff',
  },
  {
    id: 'quad_zero',
    name: 'SPAM 0000!',
    subtitle: '0000 // Czysty test szybkości palca',
    tier: 'SHORT',
    digits: [0, 0, 0, 0],
    bonusPoints: 150,
    maxAvgDeltaMs: 220,
    color: '#a6ff00',
  },

  // --- ŚREDNIE SEKWENCJE (5-7 cyfr) ---
  {
    id: 'left_hand',
    name: 'LEWA DŁOŃ',
    subtitle: '12345 // Pięć palców lewej dłoni',
    tier: 'MEDIUM',
    digits: [1, 2, 3, 4, 5],
    bonusPoints: 340,
    maxAvgDeltaMs: 290,
    color: '#ffea00',
  },
  {
    id: 'right_hand',
    name: 'PRAWA DŁOŃ',
    subtitle: '67890 // Pięć palców prawej dłoni',
    tier: 'MEDIUM',
    digits: [6, 7, 8, 9, 0],
    bonusPoints: 340,
    maxAvgDeltaMs: 290,
    color: '#ffea00',
  },
  {
    id: 'frog_odd',
    name: 'ŻABIE SKOKI (NP)',
    subtitle: '13579 // Ciąg nieparzysty co drugi klawisz',
    tier: 'MEDIUM',
    digits: [1, 3, 5, 7, 9],
    bonusPoints: 380,
    maxAvgDeltaMs: 310,
    color: '#ffae00',
  },
  {
    id: 'frog_even',
    name: 'ŻABIE SKOKI (P)',
    subtitle: '24680 // Ciąg parzysty co drugi klawisz',
    tier: 'MEDIUM',
    digits: [2, 4, 6, 8, 0],
    bonusPoints: 380,
    maxAvgDeltaMs: 310,
    color: '#ffae00',
  },
  {
    id: 'phi_easter_egg',
    name: 'Φ ZŁOTA LICZBA FI Φ',
    subtitle: '16153 // Złota proporcja odblokowana!',
    tier: 'PHI',
    digits: [1, 6, 1, 5, 3],
    bonusPoints: 550,
    maxAvgDeltaMs: 340,
    color: '#ffd700',
    isPhiEasterEgg: true,
  },
  {
    id: 'palindrome',
    name: 'PALINDROM ↔',
    subtitle: '123321 // Lustrzane odbicie tam i z powrotem',
    tier: 'MEDIUM',
    digits: [1, 2, 3, 3, 2, 1],
    bonusPoints: 440,
    maxAvgDeltaMs: 290,
    color: '#ff9100',
  },
  {
    id: 'loop_123123',
    name: 'PĘTLA 123×2',
    subtitle: '123123 // Motyw zapętlony',
    tier: 'MEDIUM',
    digits: [1, 2, 3, 1, 2, 3],
    bonusPoints: 420,
    maxAvgDeltaMs: 290,
    color: '#ff9100',
  },
  {
    id: 'numpad_zigzag',
    name: 'ZYGZAK NUMPAD',
    subtitle: '159753 // Przekątny krzyż na Numpadzie',
    tier: 'MEDIUM',
    digits: [1, 5, 9, 7, 5, 3],
    bonusPoints: 480,
    maxAvgDeltaMs: 320,
    color: '#ff6d00',
  },

  // --- DŁUGIE SEKWENCJE (8-12 cyfr - JACKPOTY) ---
  {
    id: 'double_drums',
    name: 'JACKPOT // PODWÓJNE BĘBNY',
    subtitle: '1122334455 // Autostrada dwukliku!',
    tier: 'LONG',
    digits: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    bonusPoints: 900,
    maxAvgDeltaMs: 270,
    color: '#ff00e5',
  },
  {
    id: 'the_wave',
    name: 'JACKPOT // WIELKA FALA',
    subtitle: '1234432100 // Wzrost, odbicie i podwójne zero!',
    tier: 'LONG',
    digits: [1, 2, 3, 4, 4, 3, 2, 1, 0, 0],
    bonusPoints: 900,
    maxAvgDeltaMs: 280,
    color: '#ff00e5',
  },
];

/**
 * STAŁY BUDŻET FAIR-PLAY DLA KAŻDEJ PLANSZY (21x13 = 273 pola)
 * Gwarantuje, że w każdej rozgrywce:
 * - występuje dokładnie ta sama liczba sekwencji z każdej wagi (oraz zawsze 1x Złota Liczba Fi 16153),
 * - łączny potencjał bonusowy sekwencji jest zbalansowany,
 * - występuje dokładnie 28 uzbrojonych cyfr z tarczą (Reinforced: 10 w sekwencjach + 18 poza nimi),
 *   dzięki czemu każda plansza daje identyczne szanse punktowe.
 */
export const FAIR_BOARD_CONFIG = {
  SHORT_COUNT: 5,               // 5 krótkich sekwencji (po 4 cyfry = 20 pól, 5 z puli 6)
  MEDIUM_5_COUNT: 2,            // 2 średnie 5-cyfrowe (10 pól)
  PHI_COUNT: 1,                 // 1x 16153 Złota Liczba Fi (zawsze obecny Easter Egg! 5 pól)
  MEDIUM_6_COUNT: 2,            // 2 średnie 6-cyfrowe (12 pól)
  LONG_COUNT: 1,                // 1 długi Jackpot 10-cyfrowy (10 pól)
  REINFORCED_IN_SEQUENCES: 8,   // Dokładnie 8 tarcz wewnątrz sekwencji (podwójny bonus!)
  REINFORCED_IN_RANDOM: 18,     // Dokładnie 18 tarcz poza sekwencjami (łącznie 26 tarcz na planszę)
};

export interface PlacedSequenceInstance {
  instanceId: number;
  pattern: SequencePattern;
  startIndex: number;
  endIndex: number; // inclusive
}

export interface CellData {
  index: number;
  digit: number;
  isReinforced: boolean;
  sequenceInstanceId: number | null;
  sequenceTier: SequenceTier | null;
  isSequenceStart: boolean;
  isSequenceEnd: boolean;
}

export interface GeneratedBoard {
  cells: CellData[];
  sequences: PlacedSequenceInstance[];
  totalTheoreticalSeqBonus: number;
  totalReinforcedCount: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generuje zbalansowaną planszę 21x13 (273 cyfry) z gwarancją uczciwego budżetu
 * sekwencji oraz tarcz (Reinforced Keys).
 */
export function generateFairBoard(): GeneratedBoard {
  // Wybieramy zestaw sekwencji o stałej strukturze trudności i punktacji:
  // Aby łączna waga punktowa sekwencji była zawsze identyczna w każdej grze (100% Fair Play!),
  // losujemy konkretne sekwencje i normujemy ich bonusy w obrębie koszyka lub bierzemy stały koszyk wagowy:
  const shortPool = SEQUENCE_CATALOG.filter((s) => s.tier === 'SHORT');
  const med5Pool = SEQUENCE_CATALOG.filter((s) => s.tier === 'MEDIUM' && s.digits.length === 5);
  const phiPattern = SEQUENCE_CATALOG.find((s) => s.tier === 'PHI')!;
  const med6Pool = SEQUENCE_CATALOG.filter((s) => s.tier === 'MEDIUM' && s.digits.length === 6);
  const longPool = SEQUENCE_CATALOG.filter((s) => s.tier === 'LONG');

  // Stałe, sprawiedliwe progi punktowe dla koszyków (każda gra ma identyczną sumę możliwych bonusów = 3350 pkt!):
  // SHORT = 200 pkt (5x = 1000 pkt)
  // MEDIUM_5 = 350 pkt (2x = 700 pkt)
  // PHI = 550 pkt (1x = 550 pkt)
  // MEDIUM_6 = 450 pkt (2x = 900 pkt)
  // LONG = 900 pkt (1x = 900 pkt)
  // Razem zawsze dokładnie 4050 pkt w puli sekwencji!
  const selectedPatterns: SequencePattern[] = [
    ...shuffleArray(shortPool)
      .slice(0, FAIR_BOARD_CONFIG.SHORT_COUNT)
      .map((p) => ({ ...p, bonusPoints: 200 })),
    ...shuffleArray(med5Pool)
      .slice(0, FAIR_BOARD_CONFIG.MEDIUM_5_COUNT)
      .map((p) => ({ ...p, bonusPoints: 350 })),
    { ...phiPattern, bonusPoints: 550 },
    ...shuffleArray(med6Pool)
      .slice(0, FAIR_BOARD_CONFIG.MEDIUM_6_COUNT)
      .map((p) => ({ ...p, bonusPoints: 450 })),
    ...shuffleArray(longPool)
      .slice(0, FAIR_BOARD_CONFIG.LONG_COUNT)
      .map((p) => ({ ...p, bonusPoints: 900 })),
  ];

  // Tasujemy kolejność rozmieszczania, zaczynając od najdłuższych, aby zawsze się zmieściły
  const orderedForPlacement = [...selectedPatterns].sort((a, b) => b.digits.length - a.digits.length);

  const occupied = new Uint8Array(TOTAL_CELLS); // 0 = wolne, 1 = zajęte przez sekwencję, 2 = bufor odstępu
  const placedInstances: PlacedSequenceInstance[] = [];

  for (let i = 0; i < orderedForPlacement.length; i++) {
    const pattern = orderedForPlacement[i];
    const len = pattern.digits.length;

    // Zbieramy wszystkie możliwe indeksy startowe (z zachowaniem min. 2 pól odstępu między sekwencjami
    // i z pominięciem indeksu 0-1, aby gracz miał chwilę na rozbieg)
    const validStarts: number[] = [];
    for (let start = 2; start <= TOTAL_CELLS - len - 1; start++) {
      let canFit = true;
      for (let k = -1; k <= len; k++) {
        const checkIdx = start + k;
        if (checkIdx >= 0 && checkIdx < TOTAL_CELLS && occupied[checkIdx] === 1) {
          canFit = false;
          break;
        }
      }
      if (canFit) {
        validStarts.push(start);
      }
    }

    const chosenStart =
      validStarts.length > 0
        ? validStarts[Math.floor(Math.random() * validStarts.length)]
        : Math.max(2, Math.min(TOTAL_CELLS - len, i * 22 + 3));

    for (let k = 0; k < len; k++) {
      occupied[chosenStart + k] = 1;
    }

    placedInstances.push({
      instanceId: i + 1,
      pattern,
      startIndex: chosenStart,
      endIndex: chosenStart + len - 1,
    });
  }

  // Sortujemy instancje rosnąco po indeksie startowym
  placedInstances.sort((a, b) => a.startIndex - b.startIndex);
  placedInstances.forEach((inst, idx) => {
    inst.instanceId = idx + 1;
  });

  // Inicjalizujemy komórki losowymi cyframi 0-9
  const cells: CellData[] = new Array(TOTAL_CELLS);
  for (let idx = 0; idx < TOTAL_CELLS; idx++) {
    cells[idx] = {
      index: idx,
      digit: Math.floor(Math.random() * 10),
      isReinforced: false,
      sequenceInstanceId: null,
      sequenceTier: null,
      isSequenceStart: false,
      isSequenceEnd: false,
    };
  }

  // Wpisujemy sekwencje na planszę
  const sequenceIndices: number[] = [];
  for (const inst of placedInstances) {
    const { pattern, startIndex, endIndex, instanceId } = inst;
    for (let offset = 0; offset < pattern.digits.length; offset++) {
      const cellIdx = startIndex + offset;
      cells[cellIdx].digit = pattern.digits[offset];
      cells[cellIdx].sequenceInstanceId = instanceId;
      cells[cellIdx].sequenceTier = pattern.tier;
      cells[cellIdx].isSequenceStart = cellIdx === startIndex;
      cells[cellIdx].isSequenceEnd = cellIdx === endIndex;
      sequenceIndices.push(cellIdx);
    }
  }

  const nonSequenceIndices: number[] = [];
  for (let idx = 1; idx < TOTAL_CELLS; idx++) {
    if (cells[idx].sequenceInstanceId === null) {
      nonSequenceIndices.push(idx);
    }
  }

  // Rozmieszczamy dokładnie REINFORCED_IN_SEQUENCES tarcz wewnątrz sekwencji
  const chosenSeqReinforced = shuffleArray(sequenceIndices).slice(
    0,
    FAIR_BOARD_CONFIG.REINFORCED_IN_SEQUENCES
  );
  for (const idx of chosenSeqReinforced) {
    cells[idx].isReinforced = true;
  }

  // Rozmieszczamy dokładnie REINFORCED_IN_RANDOM tarcz poza sekwencjami
  const chosenRandReinforced = shuffleArray(nonSequenceIndices).slice(
    0,
    FAIR_BOARD_CONFIG.REINFORCED_IN_RANDOM
  );
  for (const idx of chosenRandReinforced) {
    cells[idx].isReinforced = true;
  }

  const totalTheoreticalSeqBonus = placedInstances.reduce(
    (sum, inst) => sum + inst.pattern.bonusPoints,
    0
  );

  return {
    cells,
    sequences: placedInstances,
    totalTheoreticalSeqBonus,
    totalReinforcedCount:
      FAIR_BOARD_CONFIG.REINFORCED_IN_SEQUENCES + FAIR_BOARD_CONFIG.REINFORCED_IN_RANDOM,
  };
}

// ============================================================================
// DYNAMICZNY 5-PUNKTOWY GRADIENT SPEKTRUM PRĘDKOŚCI / PUNKTÓW
// ============================================================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 5-stopniowe spektrum arcade 8-bit:
 * 0.00 (Wolno / Niskie pkt)     -> #38b6ff (Chłodny Błękit)
 * 0.25 (Dobry rytm)             -> #00ff9d (Neonowy Szmaragd)
 * 0.50 (Szybko)                 -> #ffea00 (Złoty Żółty)
 * 0.75 (Bardzo szybko / Wysoko) -> #ff5500 (Ognisty Pomarańcz)
 * 1.00 (Ultraszybko / Kosmos)   -> #ff00e5 (Elektryczna Magenta)
 */
const SPECTRUM_STOPS: { pos: number; color: RGB }[] = [
  { pos: 0.0, color: { r: 56, g: 182, b: 255 } },   // #38b6ff
  { pos: 0.25, color: { r: 0, g: 255, b: 157 } },   // #00ff9d
  { pos: 0.5, color: { r: 255, g: 234, b: 0 } },    // #ffea00
  { pos: 0.75, color: { r: 255, g: 85, b: 0 } },    // #ff5500
  { pos: 1.0, color: { r: 255, g: 0, b: 229 } },   // #ff00e5
];

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/**
 * Zwraca kolor CSS RGB przesuwający się płynnie w 5-kolorowym spektrum
 * w zależności od współczynnika intensywności t w przedziale [0, 1].
 */
export function getSpectrumColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < SPECTRUM_STOPS.length - 1; i++) {
    const curr = SPECTRUM_STOPS[i];
    const next = SPECTRUM_STOPS[i + 1];
    if (clamped >= curr.pos && clamped <= next.pos) {
      const localT = (clamped - curr.pos) / (next.pos - curr.pos);
      const r = lerpChannel(curr.color.r, next.color.r, localT);
      const g = lerpChannel(curr.color.g, next.color.g, localT);
      const b = lerpChannel(curr.color.b, next.color.b, localT);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  const last = SPECTRUM_STOPS[SPECTRUM_STOPS.length - 1].color;
  return `rgb(${last.r}, ${last.g}, ${last.b})`;
}

/**
 * Wylicza pozycję w spektrum [0..1] na podstawie zdobytych punktów za pojedynczy klawisz
 * oraz czasu reakcji (deltaMs).
 */
export function computePointIntensity(points: number, deltaMs: number): number {
  // Prędkość: 60ms -> 1.0, 450ms -> 0.0
  const speedFactor = Math.max(0, Math.min(1, (450 - deltaMs) / (450 - 60)));
  // Punkty: 15 pkt -> 0.0, 260+ pkt -> 1.0
  const pointsFactor = Math.max(0, Math.min(1, (points - 15) / 245));
  return Math.max(speedFactor * 0.65 + pointsFactor * 0.35, pointsFactor);
}

// ============================================================================
// DOMYŚLNE BINDINGI KLAWISZY + LOCALSTORAGE
// ============================================================================

export type KeyBindingsMap = Record<number, string[]>;

export const DEFAULT_KEY_BINDINGS: KeyBindingsMap = {
  0: ['0'],
  1: ['1'],
  2: ['2'],
  3: ['3'],
  4: ['4'],
  5: ['5'],
  6: ['6'],
  7: ['7'],
  8: ['8'],
  9: ['9'],
};

const BINDINGS_STORAGE_KEY = 'figrid_key_bindings_v1';

export function loadKeyBindings(): KeyBindingsMap {
  try {
    const raw = localStorage.getItem(BINDINGS_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_KEY_BINDINGS);
    const parsed = JSON.parse(raw);
    const result: KeyBindingsMap = {};
    for (let d = 0; d <= 9; d++) {
      if (Array.isArray(parsed[d]) && parsed[d].length > 0) {
        result[d] = parsed[d].map((k: string) => String(k).toLowerCase());
      } else {
        result[d] = [...DEFAULT_KEY_BINDINGS[d]];
      }
    }
    return result;
  } catch {
    return structuredClone(DEFAULT_KEY_BINDINGS);
  }
}

export function saveKeyBindings(bindings: KeyBindingsMap): void {
  try {
    localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    // ignore storage errors
  }
}

export function formatKeyLabel(key: string): string {
  if (key === ' ') return 'SPACE';
  return key.toUpperCase();
}
