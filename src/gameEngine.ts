// ============================================================================
// FIGRID // Fair & Deterministic-Budget Board Generator + Omni-8 Engine
// ============================================================================

export const ROWS = 21;
export const COLS = 13;
export const TOTAL_CELLS = ROWS * COLS; // 273
export const OMNI_CENTER_INDEX = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2); // Row 10, Col 6 = 136
export const SHIELD_REVEAL_DISTANCE = 7; // Linear mode: shield starts fading in 7 steps ahead
export const OMNI_SHIELD_REVEAL_DISTANCE = 3; // Omni-8 mode: 2D plane radius halved (3 cells around head)

export const BINARY_ROWS = 8;
export const BINARY_COLS = 8;
export const BINARY_TOTAL_CELLS = BINARY_ROWS * BINARY_COLS; // 64
export const BINARY_SHIELD_COUNT = 10;
export const BINARY_SHIELD_REVEAL_DISTANCE = 5;
export const BINARY_TARGET_XOR7_PAIRS = 8;

export const CURRENT_GAME_VERSION = '0.0.2';
export const PREVIOUS_GAME_VERSION = '0.0.1';
export const V001_COMMIT_HASH = '73a71f0';

export type GameMode = 'LINEAR' | 'OMNI' | 'BINARY';
export type SequenceTier = 'SHORT' | 'MEDIUM' | 'LONG' | 'PHI';

export interface QuantumMergeTierInfo {
  title: string;
  baseBonus: number;
  pathBonus: number;
  totalBonus: number;
  color: string;
  isSuper: boolean;
}

export function getQuantumMergeTierInfo(
  mergeCount: number,
  totalMergedPathSteps: number
): QuantumMergeTierInfo {
  const pathBonus = Math.round(totalMergedPathSteps * 35 * Math.max(1, mergeCount - 1));
  if (mergeCount === 2) {
    return {
      title: 'DOUBLE QUANTUM!',
      baseBonus: 250,
      pathBonus,
      totalBonus: 250 + pathBonus,
      color: '#00f0ff',
      isSuper: false,
    };
  }
  if (mergeCount === 3) {
    return {
      title: 'TRIPLE QUANTUM!',
      baseBonus: 600,
      pathBonus,
      totalBonus: 600 + pathBonus,
      color: '#ff00e5',
      isSuper: false,
    };
  }
  if (mergeCount === 4) {
    return {
      title: 'QUADRUPLE QUANTUM!',
      baseBonus: 1400,
      pathBonus,
      totalBonus: 1400 + pathBonus,
      color: '#ffd700',
      isSuper: false,
    };
  }
  if (mergeCount === 5) {
    return {
      title: 'PENTA QUANTUM!!',
      baseBonus: 2600,
      pathBonus,
      totalBonus: 2600 + pathBonus,
      color: '#00ff66',
      isSuper: true,
    };
  }
  if (mergeCount === 6) {
    return {
      title: 'HEXA QUANTUM!!',
      baseBonus: 4200,
      pathBonus,
      totalBonus: 4200 + pathBonus,
      color: '#ff3300',
      isSuper: true,
    };
  }
  if (mergeCount === 7) {
    return {
      title: 'HEPTA QUANTUM!!!',
      baseBonus: 6500,
      pathBonus,
      totalBonus: 6500 + pathBonus,
      color: '#b829ff',
      isSuper: true,
    };
  }
  return {
    title: 'OCTA OVERDRIVE QUANTUM!!!',
    baseBonus: 9500,
    pathBonus,
    totalBonus: 9500 + pathBonus,
    color: '#ffffff',
    isSuper: true,
  };
}

/**
 * Distinct Neon Palette for OMNI-8 Quantum Candidate Branches.
 * Every active path gets its own unique color (both head and trail) so paths
 * are always visually distinguishable even when multiple paths exist simultaneously.
 */
export const OMNI_BRANCH_COLORS: string[] = [
  '#00f0ff', // 0: Electric Cyan
  '#ff00e5', // 1: Neon Magenta
  '#38ff62', // 2: Cyber Lime
  '#ff9100', // 3: Solar Orange
  '#a855f7', // 4: Plasma Violet
  '#ff2a85', // 5: Hyper Rose
  '#3b82f6', // 6: Cobalt Laser
  '#eab308', // 7: Gold Pulse
];

export interface SequencePattern {
  id: string;
  name: string;
  subtitle: string;
  tier: SequenceTier;
  digits: number[];
  bonusPoints: number;
  maxAvgDeltaMs: number;
  color: string;
  isPhiEasterEgg?: boolean;
}

export const SEQUENCE_CATALOG: SequencePattern[] = [
  // --- SHORT SEQUENCES (3-4 digits) ---
  {
    id: 'slide_right',
    name: 'SLIDE RIGHT >>',
    subtitle: 'Smooth flow achieved!',
    tier: 'SHORT',
    digits: [1, 2, 3, 4],
    bonusPoints: 200,
    maxAvgDeltaMs: 280,
    color: '#00f0ff',
  },
  {
    id: 'slide_left',
    name: '<< SLIDE LEFT',
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
    name: 'PHI // GOLDEN RATIO',
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
    name: 'MIRROR PALINDROME <>',
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

export const FAIR_BOARD_CONFIG = {
  SHORT_COUNT: 5,
  MEDIUM_5_COUNT: 2,
  PHI_COUNT: 1,
  MEDIUM_6_COUNT: 2,
  LONG_COUNT: 1,
  REINFORCED_IN_SEQUENCES: 8,
  REINFORCED_IN_RANDOM: 18,
};

export interface PlacedSequenceInstance {
  instanceId: number;
  pattern: SequencePattern;
  startIndex: number;
  endIndex: number;
  cellIndices: number[];
  orientation: 'HORIZONTAL' | 'VERTICAL';
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

function countXor7Pairs(digits: number[]): number {
  let count = 0;
  for (let i = 1; i < digits.length; i++) {
    if ((digits[i - 1] ^ digits[i]) === 7) {
      count += 1;
    }
  }
  return count;
}

function generateFairBinaryDigits(): number[] {
  const basePool: number[] = [];
  for (let d = 0; d < 8; d++) {
    for (let k = 0; k < 8; k++) {
      basePool.push(d);
    }
  }

  for (let attempt = 0; attempt < 250; attempt++) {
    const candidate = shuffleArray(basePool);
    if (countXor7Pairs(candidate) === BINARY_TARGET_XOR7_PAIRS) {
      return candidate;
    }
  }

  const arr = shuffleArray(basePool);
  for (let step = 0; step < 500; step++) {
    const current = countXor7Pairs(arr);
    if (current === BINARY_TARGET_XOR7_PAIRS) break;
    const i = Math.floor(Math.random() * arr.length);
    const j = Math.floor(Math.random() * arr.length);
    if (i === j || arr[i] === arr[j]) continue;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    const next = countXor7Pairs(arr);
    if (
      Math.abs(next - BINARY_TARGET_XOR7_PAIRS) >
      Math.abs(current - BINARY_TARGET_XOR7_PAIRS)
    ) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr;
}

/**
 * Generates a fair 21x13 board (or 8x8 in BINARY mode with balanced digits and exact 8 XOR-7 pairs).
 * - In LINEAR mode, sequences are placed horizontally along the linear reading path.
 * - In OMNI mode, sequences are placed BOTH horizontally AND vertically across the 21x13 grid!
 */
export function generateFairBoard(mode: GameMode = 'LINEAR'): GeneratedBoard {
  const totalShields =
    FAIR_BOARD_CONFIG.REINFORCED_IN_SEQUENCES + FAIR_BOARD_CONFIG.REINFORCED_IN_RANDOM;

  if (mode === 'BINARY') {
    const fairDigits = generateFairBinaryDigits();
    const cells: CellData[] = new Array(BINARY_TOTAL_CELLS);
    for (let idx = 0; idx < BINARY_TOTAL_CELLS; idx++) {
      cells[idx] = {
        index: idx,
        digit: fairDigits[idx],
        isReinforced: false,
        sequenceInstanceId: null,
        sequenceTier: null,
        isSequenceStart: false,
        isSequenceEnd: false,
      };
    }

    const candidateIndices: number[] = [];
    for (let idx = 1; idx < BINARY_TOTAL_CELLS; idx++) {
      candidateIndices.push(idx);
    }

    const chosenReinforced = shuffleArray(candidateIndices).slice(0, BINARY_SHIELD_COUNT);
    for (const idx of chosenReinforced) {
      cells[idx].isReinforced = true;
    }

    return {
      cells,
      sequences: [],
      totalTheoreticalSeqBonus: 0,
      totalReinforcedCount: BINARY_SHIELD_COUNT,
    };
  }

  // In v0.0.2, OMNI-8 mode has NO secret sequences at all!
  if (mode === 'OMNI') {
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

    const candidateIndices: number[] = [];
    for (let idx = 0; idx < TOTAL_CELLS; idx++) {
      if (idx !== OMNI_CENTER_INDEX) {
        candidateIndices.push(idx);
      }
    }

    const chosenReinforced = shuffleArray(candidateIndices).slice(0, totalShields);
    for (const idx of chosenReinforced) {
      cells[idx].isReinforced = true;
    }

    return {
      cells,
      sequences: [],
      totalTheoreticalSeqBonus: 0,
      totalReinforcedCount: totalShields,
    };
  }

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

  const orderedForPlacement = [...selectedPatterns].sort((a, b) => b.digits.length - a.digits.length);

  const occupied = new Uint8Array(TOTAL_CELLS);
  if (mode === 'OMNI') {
    // Reserve the center starting cell in OMNI mode so sequences don't get split by the spawn point
    occupied[OMNI_CENTER_INDEX] = 1;
  }

  const placedInstances: PlacedSequenceInstance[] = [];

  for (let i = 0; i < orderedForPlacement.length; i++) {
    const pattern = orderedForPlacement[i];
    const len = pattern.digits.length;

    // In OMNI mode, alternate / randomize between VERTICAL and HORIZONTAL sequence placement!
    const tryVerticalFirst = mode === 'OMNI' && (i % 2 === 0 || Math.random() < 0.55);

    const candidatePlacements: { indices: number[]; orientation: 'HORIZONTAL' | 'VERTICAL' }[] = [];

    const collectVerticalCandidates = () => {
      if (len > ROWS) return;
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r <= ROWS - len; r++) {
          let canFit = true;
          const indices: number[] = [];
          for (let k = -1; k <= len; k++) {
            const checkR = r + k;
            if (checkR >= 0 && checkR < ROWS) {
              const checkIdx = checkR * COLS + c;
              if (occupied[checkIdx] === 1) {
                canFit = false;
                break;
              }
              if (k >= 0 && k < len) {
                indices.push(checkIdx);
              }
            }
          }
          if (canFit && indices.length === len) {
            candidatePlacements.push({ indices, orientation: 'VERTICAL' });
            // In OMNI mode, also allow bottom-to-top vertical orientation
            if (mode === 'OMNI') {
              candidatePlacements.push({
                indices: [...indices].reverse(),
                orientation: 'VERTICAL',
              });
            }
          }
        }
      }
    };

    const collectHorizontalCandidates = () => {
      if (mode === 'OMNI') {
        // Strictly within a row or wrapping cleanly horizontally in OMNI mode
        if (len <= COLS) {
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c <= COLS - len; c++) {
              let canFit = true;
              const indices: number[] = [];
              for (let k = -1; k <= len; k++) {
                const checkC = c + k;
                if (checkC >= 0 && checkC < COLS) {
                  const checkIdx = r * COLS + checkC;
                  if (occupied[checkIdx] === 1) {
                    canFit = false;
                    break;
                  }
                  if (k >= 0 && k < len) {
                    indices.push(checkIdx);
                  }
                }
              }
              if (canFit && indices.length === len) {
                candidatePlacements.push({ indices, orientation: 'HORIZONTAL' });
                candidatePlacements.push({
                  indices: [...indices].reverse(),
                  orientation: 'HORIZONTAL',
                });
              }
            }
          }
        }
      } else {
        // LINEAR mode: 1D contiguous placement
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
            const indices: number[] = [];
            for (let k = 0; k < len; k++) indices.push(start + k);
            candidatePlacements.push({ indices, orientation: 'HORIZONTAL' });
          }
        }
      }
    };

    if (mode === 'OMNI') {
      if (tryVerticalFirst) {
        collectVerticalCandidates();
        if (candidatePlacements.length === 0) collectHorizontalCandidates();
      } else {
        collectHorizontalCandidates();
        if (candidatePlacements.length === 0) collectVerticalCandidates();
      }
    } else {
      collectHorizontalCandidates();
    }

    let chosenIndices: number[];
    let chosenOrientation: 'HORIZONTAL' | 'VERTICAL' = 'HORIZONTAL';

    if (candidatePlacements.length > 0) {
      const picked =
        candidatePlacements[Math.floor(Math.random() * candidatePlacements.length)];
      chosenIndices = picked.indices;
      chosenOrientation = picked.orientation;
    } else {
      const fallbackStart = Math.max(2, Math.min(TOTAL_CELLS - len, i * 22 + 3));
      chosenIndices = [];
      for (let k = 0; k < len; k++) {
        chosenIndices.push(fallbackStart + k);
      }
    }

    for (const cIdx of chosenIndices) {
      occupied[cIdx] = 1;
    }

    placedInstances.push({
      instanceId: i + 1,
      pattern,
      startIndex: chosenIndices[0],
      endIndex: chosenIndices[chosenIndices.length - 1],
      cellIndices: chosenIndices,
      orientation: chosenOrientation,
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
    const { pattern, cellIndices, startIndex, endIndex, instanceId } = inst;
    for (let offset = 0; offset < cellIndices.length; offset++) {
      const cellIdx = cellIndices[offset];
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

// ============================================================================
// LINEAR & 2D TORUS PROXIMITY ALPHA FOR REINFORCED SHIELDS
// ============================================================================

export function getShieldProximityAlpha(
  cellIndex: number,
  currentIndex: number,
  revealDist: number = SHIELD_REVEAL_DISTANCE
): number {
  const distance = cellIndex - currentIndex;
  if (distance < 0 || distance > revealDist) {
    return 0;
  }
  if (distance === 0) {
    return 1;
  }
  const factor = (revealDist - distance + 1) / revealDist;
  return Number(factor.toFixed(3));
}

/**
 * Computes 2D Chebyshev (8-way king move) distance on a 21x13 torus (with edge wrap-around)
 * from any active head (and any phase-jumped / wrapped clickable neighbor) to `cellIndex`,
 * returning the highest proximity alpha in [0..1].
 * Any directly clickable neighbor (`availableIndices`) is treated as distance 1 (alpha = 1)
 * even if reached across cleared tiles or board edges!
 */
export function getOmni2DShieldAlpha(
  cellIndex: number,
  headIndices: number[],
  availableIndices?: ReadonlySet<number>
): number {
  if (availableIndices && availableIndices.has(cellIndex)) {
    return 1;
  }

  const targetR = Math.floor(cellIndex / COLS);
  const targetC = cellIndex % COLS;

  let minDist = Infinity;
  for (let i = 0; i < headIndices.length; i++) {
    const hIdx = headIndices[i];
    if (hIdx === cellIndex) return 1;
    const hR = Math.floor(hIdx / COLS);
    const hC = hIdx % COLS;

    const rawDr = Math.abs(targetR - hR);
    const rawDc = Math.abs(targetC - hC);
    const dr = Math.min(rawDr, ROWS - rawDr);
    const dc = Math.min(rawDc, COLS - rawDc);
    const dist = Math.max(dr, dc);
    if (dist < minDist) {
      minDist = dist;
    }
  }

  if (availableIndices) {
    for (const aIdx of availableIndices) {
      const aR = Math.floor(aIdx / COLS);
      const aC = aIdx % COLS;
      const rawDr = Math.abs(targetR - aR);
      const rawDc = Math.abs(targetC - aC);
      const dr = Math.min(rawDr, ROWS - rawDr);
      const dc = Math.min(rawDc, COLS - rawDc);
      // An available tile is 1 step from the head, so tiles around it are (1 + dist) steps away
      const effectiveDist = 1 + Math.max(dr, dc);
      if (effectiveDist < minDist) {
        minDist = effectiveDist;
      }
    }
  }

  if (minDist > OMNI_SHIELD_REVEAL_DISTANCE) {
    return 0;
  }
  if (minDist <= 1) {
    return 1;
  }
  const factor =
    (OMNI_SHIELD_REVEAL_DISTANCE - minDist + 1) / OMNI_SHIELD_REVEAL_DISTANCE;
  return Number(factor.toFixed(3));
}

// ============================================================================
// OMNI-8 TORUS NAVIGATION, PHASE JUMP RAYCAST, & QUANTUM PATH TRACKING
// ============================================================================

const OMNI_DIRECTIONS: [number, number][] = [
  [-1, 0],  // N  (Up)
  [-1, 1],  // NE (Up-Right)
  [0, 1],   // E  (Right)
  [1, 1],   // SE (Down-Right)
  [1, 0],   // S  (Down)
  [1, -1],  // SW (Down-Left)
  [0, -1],  // W  (Left)
  [-1, -1], // NW (Up-Left)
];

export interface WrapGhostProjection {
  key: string;
  ghostRow: number;
  ghostCol: number;
  targetIndex: number;
  digit: number;
  isReinforced: boolean;
}

export function getWrapGhostProjectionsForHeads(
  headIndices: number[],
  board: GeneratedBoard,
  doneMask: Uint8Array,
  branchVisitedByHead: Map<number, ReadonlySet<number>>
): WrapGhostProjection[] {
  const ghostsByKey = new Map<string, WrapGhostProjection>();
  const maxRaySteps = Math.max(ROWS, COLS);

  for (const fromIndex of headIndices) {
    const startR = Math.floor(fromIndex / COLS);
    const startC = fromIndex % COLS;
    const branchVisited = branchVisitedByHead.get(fromIndex);

    const isOccupied = (idx: number) =>
      doneMask[idx] === 1 || (branchVisited !== undefined && branchVisited.has(idx));

    for (let d = 0; d < OMNI_DIRECTIONS.length; d++) {
      const [dr, dc] = OMNI_DIRECTIONS[d];
      const adjR = startR + dr;
      const adjC = startC + dc;

      const crossesBoundary = adjR < 0 || adjR >= ROWS || adjC < 0 || adjC >= COLS;
      if (!crossesBoundary) continue;

      for (let step = 1; step <= maxRaySteps; step++) {
        const nr = (((startR + dr * step) % ROWS) + ROWS) % ROWS;
        const nc = (((startC + dc * step) % COLS) + COLS) % COLS;
        const candidateIdx = nr * COLS + nc;
        if (candidateIdx === fromIndex) break;

        if (!isOccupied(candidateIdx)) {
          const key = `${adjR}_${adjC}`;
          if (!ghostsByKey.has(key)) {
            const targetCell = board.cells[candidateIdx];
            ghostsByKey.set(key, {
              key,
              ghostRow: adjR,
              ghostCol: adjC,
              targetIndex: candidateIdx,
              digit: targetCell.digit,
              isReinforced: targetCell.isReinforced,
            });
          }
          break;
        }
      }
    }
  }

  return Array.from(ghostsByKey.values());
}

/**
 * Returns the available next cell indices around `fromIndex` in 8 directions
 * with full Torus Edge Wrap-Around AND Phase-Jump raycasting through
 * already visited/done cells so the player can NEVER get trapped in a dead end!
 */
export function getAvailableOmniNeighbors(
  fromIndex: number,
  doneMask: Uint8Array,
  branchVisited?: ReadonlySet<number>
): number[] {
  const isOccupied = (idx: number) =>
    doneMask[idx] === 1 || (branchVisited !== undefined && branchVisited.has(idx));

  const startR = Math.floor(fromIndex / COLS);
  const startC = fromIndex % COLS;
  const result = new Set<number>();

  const maxRaySteps = Math.max(ROWS, COLS);

  for (let d = 0; d < OMNI_DIRECTIONS.length; d++) {
    const [dr, dc] = OMNI_DIRECTIONS[d];
    for (let step = 1; step <= maxRaySteps; step++) {
      const nr = (((startR + dr * step) % ROWS) + ROWS) % ROWS;
      const nc = (((startC + dc * step) % COLS) + COLS) % COLS;
      const candidateIdx = nr * COLS + nc;
      if (candidateIdx === fromIndex) break;

      if (!isOccupied(candidateIdx)) {
        result.add(candidateIdx);
        break;
      }
    }
  }

  if (result.size === 0) {
    let bestDist = Infinity;
    for (let idx = 0; idx < TOTAL_CELLS; idx++) {
      if (idx !== fromIndex && !isOccupied(idx)) {
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        const dr = Math.min(Math.abs(r - startR), ROWS - Math.abs(r - startR));
        const dc = Math.min(Math.abs(c - startC), COLS - Math.abs(c - startC));
        const dist = Math.max(dr, dc);
        if (dist < bestDist) {
          bestDist = dist;
          result.clear();
          result.add(idx);
        } else if (dist === bestDist && result.size < 8) {
          result.add(idx);
        }
      }
    }
  }

  return Array.from(result);
}

export function countImmediateFreeNeighbors(
  cellIndex: number,
  doneMask: Uint8Array,
  branchVisited?: ReadonlySet<number>
): number {
  const r = Math.floor(cellIndex / COLS);
  const c = cellIndex % COLS;
  let count = 0;
  for (let d = 0; d < OMNI_DIRECTIONS.length; d++) {
    const [dr, dc] = OMNI_DIRECTIONS[d];
    const nr = (r + dr + ROWS) % ROWS;
    const nc = (c + dc + COLS) % COLS;
    const nIdx = nr * COLS + nc;
    if (doneMask[nIdx] === 0 && (!branchVisited || !branchVisited.has(nIdx))) {
      count++;
    }
  }
  return count;
}

export function detectOmniSequenceMatch(
  recentDigits: number[],
  recentTimestamps: number[],
  alreadyTriggeredSeqIds: Set<string>
): SequencePattern | null {
  const len = recentDigits.length;
  if (len < 4) return null;

  for (const pattern of SEQUENCE_CATALOG) {
    const pLen = pattern.digits.length;
    if (len < pLen) continue;

    let matches = true;
    for (let i = 0; i < pLen; i++) {
      if (recentDigits[len - pLen + i] !== pattern.digits[i]) {
        matches = false;
        break;
      }
    }
    if (!matches) continue;

    const startTime = recentTimestamps[len - pLen];
    const endTime = recentTimestamps[len - 1];
    const avgDelta = Math.max(1, endTime - startTime) / Math.max(1, pLen - 1);

    if (avgDelta <= pattern.maxAvgDeltaMs) {
      const triggerKey = `${pattern.id}_${len}`;
      if (!alreadyTriggeredSeqIds.has(triggerKey)) {
        alreadyTriggeredSeqIds.add(triggerKey);
        return pattern;
      }
    }
  }
  return null;
}

// ============================================================================
// DYNAMIC 5-STOP SPEED / POINTS SPECTRUM GRADIENT
// ============================================================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

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
// KEYBINDINGS + SETTINGS LOCALSTORAGE
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
const MODE_STORAGE_KEY = 'figrid_game_mode_v1';

/**
 * Enforces strict 1-to-1 keybinding bijection:
 * - Each digit (0..9) has strictly 1 bound key.
 * - No two digits can ever share the same key.
 */
export function sanitizeKeyBindings(raw: unknown): KeyBindingsMap {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(DEFAULT_KEY_BINDINGS);
  }
  const parsed = raw as Record<string | number, unknown>;
  const result: KeyBindingsMap = {};
  const usedKeys = new Set<string>();

  for (let d = 0; d <= 9; d++) {
    const candidateArr = parsed[d] ?? parsed[String(d)];
    let chosenKey: string | null = null;
    if (Array.isArray(candidateArr)) {
      for (const item of candidateArr) {
        const k = String(item || '').toLowerCase();
        if (k && !usedKeys.has(k)) {
          chosenKey = k;
          break;
        }
      }
    }
    if (chosenKey) {
      usedKeys.add(chosenKey);
      result[d] = [chosenKey];
    }
  }

  const fallbackPool = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  for (let d = 0; d <= 9; d++) {
    if (!result[d] || result[d].length === 0) {
      const defKey = String(d);
      if (!usedKeys.has(defKey)) {
        usedKeys.add(defKey);
        result[d] = [defKey];
      } else {
        const replacement = fallbackPool.find((k) => !usedKeys.has(k)) || defKey;
        usedKeys.add(replacement);
        result[d] = [replacement];
      }
    }
  }

  return result;
}

export function loadKeyBindings(): KeyBindingsMap {
  try {
    const raw = localStorage.getItem(BINDINGS_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_KEY_BINDINGS);
    return sanitizeKeyBindings(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_KEY_BINDINGS);
  }
}

export function saveKeyBindings(bindings: KeyBindingsMap): void {
  try {
    const clean = sanitizeKeyBindings(bindings);
    localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // ignore storage errors
  }
}

export function loadGameMode(): GameMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY);
    if (raw === 'OMNI' || raw === 'BINARY') return raw;
    return 'LINEAR';
  } catch {
    return 'LINEAR';
  }
}

export function saveGameMode(mode: GameMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function formatKeyLabel(key: string): string {
  if (key === ' ') return 'SPACE';
  return key.toUpperCase();
}
