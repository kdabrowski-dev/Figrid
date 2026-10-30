// ============================================================================
// FIGRID // Fair & Deterministic-Budget Board Generator + Omni-8 Engine
// ============================================================================

export const ROWS = 21;
export const COLS = 13;
export const TOTAL_CELLS = ROWS * COLS; // 273
export const SHIELD_REVEAL_DISTANCE = 7; // Shield starts fading in 7 steps/cells ahead

export type GameMode = 'LINEAR' | 'OMNI';
export type SequenceTier = 'SHORT' | 'MEDIUM' | 'LONG' | 'PHI';

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

// ============================================================================
// LINEAR & 2D TORUS PROXIMITY ALPHA FOR REINFORCED SHIELDS
// ============================================================================

export function getShieldProximityAlpha(cellIndex: number, currentIndex: number): number {
  const distance = cellIndex - currentIndex;
  if (distance < 0 || distance > SHIELD_REVEAL_DISTANCE) {
    return 0;
  }
  if (distance === 0) {
    return 1;
  }
  const factor = (SHIELD_REVEAL_DISTANCE - distance + 1) / SHIELD_REVEAL_DISTANCE;
  return Number(factor.toFixed(3));
}

/**
 * Computes 2D Chebyshev (8-way king move) distance on a 21x13 torus (with edge wrap-around)
 * from any active head to `cellIndex`, returning the highest proximity alpha in [0..1].
 * Only visible when 0 <= distance <= 7!
 */
export function getOmni2DShieldAlpha(cellIndex: number, headIndices: number[]): number {
  const targetR = Math.floor(cellIndex / COLS);
  const targetC = cellIndex % COLS;

  let minDist = Infinity;
  for (let i = 0; i < headIndices.length; i++) {
    const hIdx = headIndices[i];
    const hR = Math.floor(hIdx / COLS);
    const hC = hIdx % COLS;

    const rawDr = Math.abs(targetR - hR);
    const rawDc = Math.abs(targetC - hC);
    // Torus wrap-around distance on both axes
    const dr = Math.min(rawDr, ROWS - rawDr);
    const dc = Math.min(rawDc, COLS - rawDc);
    // 8-directional plane distance (Chebyshev metric)
    const dist = Math.max(dr, dc);
    if (dist < minDist) {
      minDist = dist;
    }
  }

  if (minDist > SHIELD_REVEAL_DISTANCE) {
    return 0;
  }
  if (minDist === 0) {
    return 1;
  }
  const factor = (SHIELD_REVEAL_DISTANCE - minDist + 1) / SHIELD_REVEAL_DISTANCE;
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
  ghostRow: number; // e.g. -1 or 21 when wrapping vertically, or 0..20
  ghostCol: number; // e.g. -1 or 13 when wrapping horizontally, or 0..12
  targetIndex: number; // Real cell index on the 21x13 board
  digit: number;
  isReinforced: boolean;
}

/**
 * Computes which directional moves from `fromIndex` cross the outer border of the 21x13 board
 * and returns their Ghost/Blurry projections positioned in the 1-cell border padding around the grid!
 * For example, at top-left (row 0, col 0):
 * - Left (0, -1)       -> ghost at (row 0, col -1) showing real cell (0, 12)
 * - Up-Left (-1, -1)   -> ghost at (row -1, col -1) showing real cell (20, 12)
 * - Up (-1, 0)         -> ghost at (row -1, col 0) showing real cell (20, 0)
 * - Up-Right (-1, +1)  -> ghost at (row -1, col 1) showing real cell (20, 1)
 * - Down-Left (+1, -1) -> ghost at (row 1, col -1) showing real cell (1, 12)
 */
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

      // Does stepping in direction (dr, dc) from this head cross outside the 21x13 board boundary?
      const crossesBoundary = adjR < 0 || adjR >= ROWS || adjC < 0 || adjC >= COLS;
      if (!crossesBoundary) continue;

      // Find the first unvisited target cell along this ray (wrapping around the torus)
      for (let step = 1; step <= maxRaySteps; step++) {
        const nr = (((startR + dr * step) % ROWS) + ROWS) % ROWS;
        const nc = (((startC + dc * step) % COLS) + COLS) % COLS;
        const candidateIdx = nr * COLS + nc;
        if (candidateIdx === fromIndex) break;

        if (!isOccupied(candidateIdx)) {
          // Place the blurry ghost tile right outside the edge next to the head: (adjR, adjC)
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
 * with full Torus Edge Wrap-Around AND Idea A Phase-Jump raycasting through
 * already visited/done cells so the player can NEVER get trapped in a dead end!
 *
 * Specifically:
 * - In each of the 8 directions, we step `(r + dr + 21) % 21` and `(c + dc + 13) % 13`.
 * - If the immediate neighbor (step 1) is unvisited, it is directly added.
 * - If the immediate neighbor is already visited (`done` or in `branchVisited`),
 *   we slide (Phase-Jump raycast) along that same direction vector through visited
 *   tiles until we hit the first unvisited tile!
 * - Fallback: If all 8 rays only loop through visited cells (extremely rare near end of board),
 *   we return the nearest unvisited cells on the torus plane.
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
        break; // Found the first free cell along this ray (direct neighbor or Phase Jump!)
      }
    }
  }

  // Fallback if all 8 directional rays wrapped around without hitting a free cell
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

/**
 * Counts how many immediate (step-1) unvisited neighbors a cell has on the torus.
 * Used as an Anti-Dead-End tie-breaker when collapsing converging quantum branches.
 */
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

/**
 * Checks if the tail of the player's recently typed digits matches ANY sequence in SEQUENCE_CATALOG!
 * In OMNI mode, because the player can move in 8 directions and weave their own path,
 * we check the actual stream of typed digits & timestamps so sequences work seamlessly in both modes!
 */
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

    // Check if the last pLen digits match pattern.digits
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
      // Create a unique cooldown key so the exact same sequence at the same step isn't double-counted
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

export function loadGameMode(): GameMode {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY);
    return raw === 'OMNI' ? 'OMNI' : 'LINEAR';
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
