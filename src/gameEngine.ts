// ============================================================================
// FIGRID // Fair & Deterministic-Budget Board Generator + Scoring Engine
// ============================================================================

export const ROWS = 21;
export const COLS = 13;
export const TOTAL_CELLS = ROWS * COLS; // 273
export const SHIELD_REVEAL_DISTANCE = 7; // Shield starts fading in 7 steps ahead

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
  // --- SHORT SEQUENCES (3-4 digits) ---
  {
    id: 'slide_right',
    name: 'SLIDE RIGHT →',
    subtitle: 'Smooth flow achieved!',
    tier: 'SHORT',
    digits: [1, 2, 3, 4],
    bonusPoints: 200,
    maxAvgDeltaMs: 280,
    color: '#00f0ff',
  },
  {
    id: 'slide_left',
    name: '← SLIDE LEFT',
    subtitle: 'Reverse flow achieved!',
    tier: 'SHORT',
    digits: [9, 8, 7, 6],
    bonusPoints: 200,
    maxAvgDeltaMs: 280,
    color: '#00f0ff',
  },
  {
    id: 'drum_1010',
    name: 'BINARY DRUMS',
    subtitle: 'Rhythmic two-finger beat!',
    tier: 'SHORT',
    digits: [1, 0, 1, 0],
    bonusPoints: 200,
    maxAvgDeltaMs: 260,
    color: '#00e5a3',
  },
  {
    id: 'leet_1337',
    name: 'ELITE // 1337!',
    subtitle: 'Classic hacker cadence!',
    tier: 'SHORT',
    digits: [1, 3, 3, 7],
    bonusPoints: 200,
    maxAvgDeltaMs: 290,
    color: '#38ff62',
  },
  {
    id: 'numpad_drop',
    name: 'VERTICAL DROP',
    subtitle: 'Straight line descent!',
    tier: 'SHORT',
    digits: [2, 5, 8, 0],
    bonusPoints: 200,
    maxAvgDeltaMs: 280,
    color: '#00f0ff',
  },
  {
    id: 'quad_zero',
    name: 'OVERDRIVE SPAM!',
    subtitle: 'Pure single-finger speed!',
    tier: 'SHORT',
    digits: [0, 0, 0, 0],
    bonusPoints: 200,
    maxAvgDeltaMs: 220,
    color: '#a6ff00',
  },

  // --- MEDIUM SEQUENCES (5-7 digits) ---
  {
    id: 'left_hand',
    name: 'LEFT HAND FLOW',
    subtitle: 'Five-finger sweep!',
    tier: 'MEDIUM',
    digits: [1, 2, 3, 4, 5],
    bonusPoints: 350,
    maxAvgDeltaMs: 290,
    color: '#ffea00',
  },
  {
    id: 'right_hand',
    name: 'RIGHT HAND FLOW',
    subtitle: 'Five-finger sweep!',
    tier: 'MEDIUM',
    digits: [6, 7, 8, 9, 0],
    bonusPoints: 350,
    maxAvgDeltaMs: 290,
    color: '#ffea00',
  },
  {
    id: 'frog_odd',
    name: 'ODD LEAPFROG',
    subtitle: 'Alternating odd cadence!',
    tier: 'MEDIUM',
    digits: [1, 3, 5, 7, 9],
    bonusPoints: 350,
    maxAvgDeltaMs: 310,
    color: '#ffae00',
  },
  {
    id: 'frog_even',
    name: 'EVEN LEAPFROG',
    subtitle: 'Alternating even cadence!',
    tier: 'MEDIUM',
    digits: [2, 4, 6, 8, 0],
    bonusPoints: 350,
    maxAvgDeltaMs: 310,
    color: '#ffae00',
  },
  {
    id: 'phi_easter_egg',
    name: 'Φ GOLDEN RATIO PHI Φ',
    subtitle: 'Secret Golden Proportion unlocked!',
    tier: 'PHI',
    digits: [1, 6, 1, 5, 3],
    bonusPoints: 550,
    maxAvgDeltaMs: 340,
    color: '#ffd700',
    isPhiEasterEgg: true,
  },
  {
    id: 'palindrome',
    name: 'MIRROR PALINDROME ↔',
    subtitle: 'There and back again!',
    tier: 'MEDIUM',
    digits: [1, 2, 3, 3, 2, 1],
    bonusPoints: 450,
    maxAvgDeltaMs: 290,
    color: '#ff9100',
  },
  {
    id: 'loop_123123',
    name: 'DOUBLE TRIPLET LOOP',
    subtitle: 'Repeating muscle memory!',
    tier: 'MEDIUM',
    digits: [1, 2, 3, 1, 2, 3],
    bonusPoints: 450,
    maxAvgDeltaMs: 290,
    color: '#ff9100',
  },
  {
    id: 'numpad_zigzag',
    name: 'CROSS ZIGZAG',
    subtitle: 'Diagonal matrix weave!',
    tier: 'MEDIUM',
    digits: [1, 5, 9, 7, 5, 3],
    bonusPoints: 450,
    maxAvgDeltaMs: 320,
    color: '#ff6d00',
  },

  // --- LONG SEQUENCES (8-12 digits - JACKPOTS) ---
  {
    id: 'double_drums',
    name: 'JACKPOT // DOUBLE DRUMROLL',
    subtitle: 'High-speed double-tap highway!',
    tier: 'LONG',
    digits: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    bonusPoints: 900,
    maxAvgDeltaMs: 270,
    color: '#ff00e5',
  },
  {
    id: 'the_wave',
    name: 'JACKPOT // THE GREAT WAVE',
    subtitle: 'Crest, reflection, and hard landing!',
    tier: 'LONG',
    digits: [1, 2, 3, 4, 4, 3, 2, 1, 0, 0],
    bonusPoints: 900,
    maxAvgDeltaMs: 280,
    color: '#ff00e5',
  },
];

/**
 * FIXED FAIR-PLAY BUDGET FOR EVERY 21x13 BOARD (273 cells)
 * Guarantees that every single match has the exact same number of sequences
 * per difficulty tier, the exact same bonus pool (4050 pts), and the exact
 * same number of Reinforced Shields (26 total: 8 inside sequences + 18 outside).
 */
export const FAIR_BOARD_CONFIG = {
  SHORT_COUNT: 5,               // 5 short sequences (200 pts each = 1000 pts)
  MEDIUM_5_COUNT: 2,            // 2 medium 5-digit sequences (350 pts each = 700 pts)
  PHI_COUNT: 1,                 // 1x Golden Ratio Phi Easter Egg (550 pts)
  MEDIUM_6_COUNT: 2,            // 2 medium 6-digit sequences (450 pts each = 900 pts)
  LONG_COUNT: 1,                // 1 long 10-digit Jackpot sequence (900 pts)
  REINFORCED_IN_SEQUENCES: 8,   // 8 shields inside sequences (stackable 2x + sequence bonus)
  REINFORCED_IN_RANDOM: 18,     // 18 shields outside sequences (26 shields total)
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
 * Generates a balanced 21x13 board (273 digits) with a strictly fair sequence
 * and reinforced shield budget. Sequences are completely disguised in the grid
 * so players must discover them on their own.
 */
export function generateFairBoard(): GeneratedBoard {
  const shortPool = SEQUENCE_CATALOG.filter((s) => s.tier === 'SHORT');
  const med5Pool = SEQUENCE_CATALOG.filter((s) => s.tier === 'MEDIUM' && s.digits.length === 5);
  const phiPattern = SEQUENCE_CATALOG.find((s) => s.tier === 'PHI')!;
  const med6Pool = SEQUENCE_CATALOG.filter((s) => s.tier === 'MEDIUM' && s.digits.length === 6);
  const longPool = SEQUENCE_CATALOG.filter((s) => s.tier === 'LONG');

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

  // Place longest sequences first so they always fit cleanly
  const orderedForPlacement = [...selectedPatterns].sort((a, b) => b.digits.length - a.digits.length);

  const occupied = new Uint8Array(TOTAL_CELLS);
  const placedInstances: PlacedSequenceInstance[] = [];

  for (let i = 0; i < orderedForPlacement.length; i++) {
    const pattern = orderedForPlacement[i];
    const len = pattern.digits.length;

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

  placedInstances.sort((a, b) => a.startIndex - b.startIndex);
  placedInstances.forEach((inst, idx) => {
    inst.instanceId = idx + 1;
  });

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

  const chosenSeqReinforced = shuffleArray(sequenceIndices).slice(
    0,
    FAIR_BOARD_CONFIG.REINFORCED_IN_SEQUENCES
  );
  for (const idx of chosenSeqReinforced) {
    cells[idx].isReinforced = true;
  }

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

/**
 * Calculates the proximity alpha factor (0..1) for a Reinforced cell ahead of currentIndex.
 * Only visible when 1 <= (cellIndex - currentIndex) <= 7.
 * Distance 7 -> alpha 0.14
 * Distance 6 -> alpha 0.28
 * Distance 5 -> alpha 0.42
 * Distance 4 -> alpha 0.57
 * Distance 3 -> alpha 0.71
 * Distance 2 -> alpha 0.85
 * Distance 1 -> alpha 1.00
 * Distance 0 (active cell) -> alpha 1.00
 */
export function getShieldProximityAlpha(cellIndex: number, currentIndex: number): number {
  const distance = cellIndex - currentIndex;
  if (distance < 0 || distance > SHIELD_REVEAL_DISTANCE) {
    return 0;
  }
  if (distance === 0) {
    return 1;
  }
  // Smooth step from 1/7 up to 7/7 as player gets closer
  const factor = (SHIELD_REVEAL_DISTANCE - distance + 1) / SHIELD_REVEAL_DISTANCE;
  return Number(factor.toFixed(3));
}

// ============================================================================
// DYNAMIC 5-STOP SPEED / POINTS SPECTRUM GRADIENT
// ============================================================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 5-stop 8-bit arcade spectrum:
 * 0.00 (Slow / Low pts)      -> #38b6ff (Cool Cyan-Blue)
 * 0.25 (Steady rhythm)       -> #00ff9d (Neon Emerald)
 * 0.50 (Fast)                -> #ffea00 (Arcade Gold)
 * 0.75 (Very Fast / High)    -> #ff5500 (Blazing Orange)
 * 1.00 (Hyper Speed / Max)   -> #ff00e5 (Electric Magenta)
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

export function computePointIntensity(points: number, deltaMs: number): number {
  const speedFactor = Math.max(0, Math.min(1, (450 - deltaMs) / (450 - 60)));
  const pointsFactor = Math.max(0, Math.min(1, (points - 15) / 245));
  return Math.max(speedFactor * 0.65 + pointsFactor * 0.35, pointsFactor);
}

// ============================================================================
// KEYBINDINGS + LOCALSTORAGE
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
