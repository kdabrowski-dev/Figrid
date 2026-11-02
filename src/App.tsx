import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ROWS,
  COLS,
  TOTAL_CELLS,
  OMNI_CENTER_INDEX,
  SHIELD_REVEAL_DISTANCE,
  OMNI_BRANCH_COLORS,
  GameMode,
  GeneratedBoard,
  generateFairBoard,
  getShieldProximityAlpha,
  getOmni2DShieldAlpha,
  getAvailableOmniNeighbors,
  getWrapGhostProjectionsForHeads,
  WrapGhostProjection,
  countImmediateFreeNeighbors,
  detectOmniSequenceMatch,
  getSpectrumColor,
  computePointIntensity,
  KeyBindingsMap,
  loadKeyBindings,
  saveKeyBindings,
  loadGameMode,
  saveGameMode,
} from './gameEngine';
import { SpeedChartPanel, SpeedSample } from './SpeedChartPanel';
import { KeyBindingsModal } from './KeyBindingsModal';
import { FuturisticDigit } from './FuturisticDigit';
import {
  LeaderboardEntry,
  LeaderboardView,
  fetchInitialLeaderboard,
  saveLeaderboardToStorage,
} from './LeaderboardView';
import {
  UserProfile,
  apiFetchCurrentUser,
  apiUpdateUserSettings,
  apiSubmitScoreToBackend,
} from './apiClient';
import { AuthModal } from './AuthModal';

const BASE_POINTS = 12;
const MIN_DELTA_MS = 50;
const MAX_BONUS_DELTA_MS = 1000;

interface BannerPopup {
  id: number;
  title: string;
  subtitle: string;
  bonusText: string;
  color: string;
  isPhi?: boolean;
}

interface OmniBranch {
  headIndex: number;
  trail: number[];
  visitedSet: Set<number>;
  shieldCrackedOnHead: boolean;
  color: string;
}

interface QuantumLaserLine {
  id: number;
  pointsAttr: string;
  color: string;
}

/**
 * Converts a sequence of board cell indices into SVG polyline coordinate strings.
 * Each cell in `.board-grid-21x13` is 36x30px with a 2px gap (stride: 38px X, 32px Y).
 */
function buildSvgPolylinesForTrail(trail: number[]): string[] {
  if (trail.length < 2) return [];
  const polylines: string[] = [];
  let currentPoints: string[] = [];

  for (let i = 0; i < trail.length; i++) {
    const idx = trail[i];
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;
    const x = c * 38 + 18;
    const y = r * 32 + 15;

    if (i > 0) {
      const prevIdx = trail[i - 1];
      const prevR = Math.floor(prevIdx / COLS);
      const prevC = idx % COLS;
      const rawDr = Math.abs(r - prevR);
      const rawDc = Math.abs(c - (prevIdx % COLS));
      // If this step wrapped across the outer torus edge, start a new segment so no line cuts across the whole board
      if (rawDr > 4 || rawDc > 4) {
        if (currentPoints.length >= 2) {
          polylines.push(currentPoints.join(' '));
        }
        currentPoints = [`${x},${y}`];
        continue;
      }
      void prevC;
    }
    currentPoints.push(`${x},${y}`);
  }

  if (currentPoints.length >= 2) {
    polylines.push(currentPoints.join(' '));
  }
  return polylines;
}

/**
 * Assigns a unique color from OMNI_BRANCH_COLORS to each active branch,
 * preserving existing branch colors when possible and avoiding duplicates.
 */
function assignDistinctBranchColors(branches: OmniBranch[]): void {
  const usedColors = new Set<string>();
  for (let i = 0; i < branches.length; i++) {
    const br = branches[i];
    if (br.color && !usedColors.has(br.color)) {
      usedColors.add(br.color);
    } else {
      br.color = '';
    }
  }
  for (let i = 0; i < branches.length; i++) {
    const br = branches[i];
    if (!br.color) {
      const available =
        OMNI_BRANCH_COLORS.find((c) => !usedColors.has(c)) ||
        OMNI_BRANCH_COLORS[i % OMNI_BRANCH_COLORS.length];
      br.color = available;
      usedColors.add(available);
    }
  }
}

export const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>(() => loadGameMode());
  const [board, setBoard] = useState<GeneratedBoard>(() => generateFairBoard(loadGameMode()));
  const [bindings, setBindings] = useState<KeyBindingsMap>(() => loadKeyBindings());
  const [activeTab, setActiveTab] = useState<'GAME' | 'LEADERBOARD'>('GAME');
  const [isBindingsOpen, setIsBindingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  // Leaderboard state + 3-letter nick entry after completing the board
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nickLetters, setNickLetters] = useState<string[]>(['A', 'A', 'A']);
  const [nickCursor, setNickCursor] = useState<number>(0);
  const [hasSubmittedScore, setHasSubmittedScore] = useState<boolean>(false);

  // Telemetry state for right panel and summary
  const [chartTick, setChartTick] = useState(0);
  const [lastSpeedMs, setLastSpeedMs] = useState<number | null>(null);
  const [avgSpeedMs, setAvgSpeedMs] = useState<number | null>(null);
  const [peakKps, setPeakKps] = useState<number>(0);
  const [sequencesHitCount, setSequencesHitCount] = useState<number>(0);
  const [reinforcedHitCount, setReinforcedHitCount] = useState<number>(0);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [activeBanners, setActiveBanners] = useState<BannerPopup[]>([]);
  const [wrapGhosts, setWrapGhosts] = useState<WrapGhostProjection[]>([]);
  const [quantumLasers, setQuantumLasers] = useState<QuantumLaserLine[]>([]);

  // Direct DOM references for O(1) zero-reflow updates across the 273 cells
  const cellNodesRef = useRef<(HTMLDivElement | null)[]>(new Array(TOTAL_CELLS).fill(null));
  const scoreNodeRef = useRef<HTMLSpanElement | null>(null);
  const lastDeltaBadgeRef = useRef<HTMLSpanElement | null>(null);
  const deltaPopupRootRef = useRef<HTMLDivElement | null>(null);
  const progressNodeRef = useRef<HTMLSpanElement | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);
  const badgeFadeTimeoutRef = useRef<number | null>(null);

  // Set of currently held physical key codes
  const pressedPhysicalKeysRef = useRef<Set<string>>(new Set());

  // Real-time mutable game engine state (0ms input lag)
  const engineRef = useRef({
    // LINEAR mode state
    currentIndex: 0,
    shieldIntactOnCurrent: false,
    cellHitTimestamps: new Float64Array(TOTAL_CELLS),
    cellFirstHitTimestamps: new Float64Array(TOTAL_CELLS),

    // OMNI-8 mode state
    doneMask: new Uint8Array(TOTAL_CELLS),
    clearedCount: 0,
    omniBranches: [] as OmniBranch[],
    omniVisualCells: new Set<number>(),
    omniRecentDigits: [] as number[],
    omniRecentTimestamps: [] as number[],
    omniTriggeredSeqKeys: new Set<string>(),

    // Shared scoring & telemetry state
    runStartTime: 0,
    runEndTime: 0,
    lastKeystrokeTime: 0,
    score: 0,
    displayedScore: 0,
    totalKeystrokes: 0,
    sumDeltaMs: 0,
    peakKps: 0,
    sequencesHit: 0,
    reinforcedHit: 0,
    mistakes: 0,
    isFinished: false,
    bannerCounter: 1,
    laserCounter: 1,
  });

  const samplesRef = useRef<SpeedSample[]>([]);

  const applyUserProfileSettings = useCallback(
    (user: UserProfile) => {
      setCurrentUser(user);
      if (user.nick && user.nick.length === 3) {
        setNickLetters(user.nick.toUpperCase().split(''));
      }
      if (user.keyBindings && Object.keys(user.keyBindings).length > 0) {
        setBindings(user.keyBindings);
        saveKeyBindings(user.keyBindings);
      }
      if (!hasStarted && (user.preferredMode === 'OMNI' || user.preferredMode === 'LINEAR')) {
        setGameMode(user.preferredMode);
        saveGameMode(user.preferredMode);
      }
    },
    [hasStarted]
  );

  const refreshLeaderboard = useCallback(() => {
    fetchInitialLeaderboard().then(({ entries, isBackendOnline: online }) => {
      setLeaderboard(entries);
      setIsBackendOnline(online);
    });
  }, []);

  // Load initial leaderboard + restore JWT user session if logged in
  useEffect(() => {
    refreshLeaderboard();
    apiFetchCurrentUser().then((user) => {
      if (user) {
        applyUserProfileSettings(user);
      }
    });
  }, [refreshLeaderboard, applyUserProfileSettings]);

  // Reverse key -> digit lookup map for O(1) keydown checks
  const keyToDigitMapRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const map = new Map<string, number>();
    for (let digit = 0; digit <= 9; digit++) {
      const keys = bindings[digit] || [String(digit)];
      for (const k of keys) {
        map.set(k.toLowerCase(), digit);
      }
    }
    keyToDigitMapRef.current = map;
  }, [bindings]);

  const triggerBoardErrorFlash = useCallback(() => {
    const wrapper = boardWrapperRef.current;
    if (!wrapper) return;
    wrapper.classList.remove('board-error-flash');
    void wrapper.offsetWidth;
    wrapper.classList.add('board-error-flash');
  }, []);

  /**
   * Triggers the bright thin laser line sweep animation across all cells of a Quantum Diamond merge!
   */
  const triggerQuantumLaserSweep = useCallback((trails: number[][], color: string) => {
    const newLines: QuantumLaserLine[] = [];
    const diamondCells = new Set<number>();

    for (const trail of trails) {
      for (const idx of trail) {
        diamondCells.add(idx);
      }
      const segments = buildSvgPolylinesForTrail(trail);
      for (const pointsAttr of segments) {
        newLines.push({
          id: engineRef.current.laserCounter++,
          pointsAttr,
          color,
        });
      }
    }

    for (const cellIdx of diamondCells) {
      const node = cellNodesRef.current[cellIdx];
      if (node) {
        node.classList.remove('quantum-diamond-pulse');
        void node.offsetWidth;
        node.classList.add('quantum-diamond-pulse');
      }
    }

    if (newLines.length > 0) {
      setQuantumLasers((prev) => [...prev, ...newLines]);
      const lineIds = new Set(newLines.map((l) => l.id));
      window.setTimeout(() => {
        setQuantumLasers((prev) => prev.filter((l) => !lineIds.has(l.id)));
      }, 780);
    }
  }, []);

  /**
   * LINEAR MODE: Updates proximity alpha for Reinforced cells within the 7-step linear window.
   */
  const updateLinearShieldVisibility = useCallback(
    (newCurrentIndex: number, currentBoard: GeneratedBoard) => {
      const maxIdx = Math.min(TOTAL_CELLS - 1, newCurrentIndex + SHIELD_REVEAL_DISTANCE);
      for (let i = newCurrentIndex; i <= maxIdx; i++) {
        const cell = currentBoard.cells[i];
        if (!cell.isReinforced) continue;
        const node = cellNodesRef.current[i];
        if (!node) continue;
        const alpha = getShieldProximityAlpha(i, newCurrentIndex);
        node.style.setProperty('--shield-alpha', String(alpha));
        if (i === newCurrentIndex) {
          // Strip shield-approaching on the active cell so active high-contrast dark text is never overridden!
          node.classList.remove('shield-approaching');
        } else {
          node.classList.add('shield-approaching');
        }
      }
    },
    []
  );

  /**
   * OMNI-8 MODE: Updates DOM classes & per-branch CSS variables for:
   * - Single confirmed head (`.active`) OR multiple candidate heads (`.omni-blurry-head`),
   *   each colored with its branch's unique `--branch-color`!
   * - Uncommitted branch trails (`.omni-branch-trail`), colored with `--branch-color`!
   * - Overlapping trails (`.omni-trail-overlap`), changing border when >= 2 branches share a tile!
   * - Available 8-directional & wrap-around / phase-jump target cells (`.omni-available`).
   */
  const syncOmniVisualState = useCallback((currentBoard: GeneratedBoard) => {
    const eng = engineRef.current;

    for (const idx of eng.omniVisualCells) {
      const node = cellNodesRef.current[idx];
      if (!node) continue;
      node.classList.remove(
        'active',
        'omni-blurry-head',
        'omni-head-also-clickable',
        'omni-branch-trail',
        'omni-trail-overlap',
        'omni-available',
        'shield-cracked',
        'error'
      );
      node.style.removeProperty('--branch-color');
      node.style.removeProperty('--overlap-color-1');
      node.style.removeProperty('--overlap-color-2');
      if (eng.doneMask[idx] === 1) {
        node.classList.add('done');
      }
    }
    eng.omniVisualCells.clear();

    const branches = eng.omniBranches;
    assignDistinctBranchColors(branches);

    const isAmbiguous = branches.length > 1;
    const headIndices: number[] = [];
    const headSet = new Set<number>(branches.map((b) => b.headIndex));
    const visitedByHead = new Map<number, ReadonlySet<number>>();
    const isInitialCellPending = eng.clearedCount === 0;

    // Track which branches touch each cell in their trail so we can highlight overlapping paths
    const cellBranchColors = new Map<number, string[]>();
    for (let b = 0; b < branches.length; b++) {
      const br = branches[b];
      for (let t = 0; t < br.trail.length; t++) {
        const cIdx = br.trail[t];
        const list = cellBranchColors.get(cIdx) || [];
        if (!list.includes(br.color)) {
          list.push(br.color);
        }
        cellBranchColors.set(cIdx, list);
      }
    }

    for (let b = 0; b < branches.length; b++) {
      const br = branches[b];
      headIndices.push(br.headIndex);
      visitedByHead.set(br.headIndex, br.visitedSet);

      for (let t = 0; t < br.trail.length - 1; t++) {
        const trailIdx = br.trail[t];
        const tNode = cellNodesRef.current[trailIdx];
        if (tNode) {
          tNode.style.setProperty('--branch-color', br.color);
          tNode.classList.add('omni-branch-trail');
          const colorsHere = cellBranchColors.get(trailIdx);
          if (colorsHere && colorsHere.length >= 2) {
            tNode.classList.add('omni-trail-overlap');
            tNode.style.setProperty('--overlap-color-1', colorsHere[0]);
            tNode.style.setProperty('--overlap-color-2', colorsHere[1]);
          }
          eng.omniVisualCells.add(trailIdx);
        }
      }

      const headNode = cellNodesRef.current[br.headIndex];
      if (headNode) {
        headNode.style.setProperty('--branch-color', br.color);
        headNode.classList.remove('shield-approaching');
        headNode.classList.add(isAmbiguous ? 'omni-blurry-head' : 'active');
        const colorsAtHead = cellBranchColors.get(br.headIndex);
        if (colorsAtHead && colorsAtHead.length >= 2) {
          headNode.classList.add('omni-trail-overlap');
          headNode.style.setProperty('--overlap-color-1', colorsAtHead[0]);
          headNode.style.setProperty('--overlap-color-2', colorsAtHead[1]);
        }
        if (
          br.shieldCrackedOnHead &&
          currentBoard.cells[br.headIndex].isReinforced &&
          eng.doneMask[br.headIndex] === 0
        ) {
          headNode.classList.add('shield-cracked');
        }
        eng.omniVisualCells.add(br.headIndex);
      }

      const headCell = currentBoard.cells[br.headIndex];
      const needsSecondHitOnHead = headCell.isReinforced && !br.shieldCrackedOnHead;
      if (!isInitialCellPending && !needsSecondHitOnHead) {
        const neighbors = getAvailableOmniNeighbors(br.headIndex, eng.doneMask, br.visitedSet);
        for (let n = 0; n < neighbors.length; n++) {
          const nIdx = neighbors[n];
          const nNode = cellNodesRef.current[nIdx];
          if (nNode) {
            nNode.classList.add('omni-available');
            if (headSet.has(nIdx)) {
              nNode.classList.add('omni-head-also-clickable');
            }
            eng.omniVisualCells.add(nIdx);
          }
        }
      } else if (!isInitialCellPending && needsSecondHitOnHead) {
        if (headNode) {
          headNode.classList.add('omni-head-also-clickable');
        }
      }
    }

    if (isInitialCellPending) {
      setWrapGhosts([]);
    } else {
      const readyHeads = branches
        .filter((br) => !(currentBoard.cells[br.headIndex].isReinforced && !br.shieldCrackedOnHead))
        .map((br) => br.headIndex);
      setWrapGhosts(
        getWrapGhostProjectionsForHeads(readyHeads, currentBoard, eng.doneMask, visitedByHead)
      );
    }

    // Update 2D Planar Reinforced Shield proximity alpha (radius 3)
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const cell = currentBoard.cells[i];
      if (!cell.isReinforced) continue;
      const node = cellNodesRef.current[i];
      if (!node) continue;

      if (eng.doneMask[i] === 1) {
        node.style.setProperty('--shield-alpha', '0');
        node.classList.remove('shield-approaching');
        continue;
      }

      const alpha2D = getOmni2DShieldAlpha(i, headIndices);
      node.style.setProperty('--shield-alpha', String(alpha2D));
      // Do not add shield-approaching on active/head cells so their digit contrast stays dark!
      if (alpha2D > 0 && !headSet.has(i)) {
        node.classList.add('shield-approaching');
      } else {
        node.classList.remove('shield-approaching');
      }
    }
  }, []);

  // Floating +pts / -pts popup in dynamic spectrum color + smooth fade-out at the end
  const triggerDeltaPopup = useCallback(
    (deltaPoints: number, spectrumColor: string, extraTag?: string) => {
      const isPositive = deltaPoints >= 0;
      const formatted = isPositive ? `+${deltaPoints}` : `${deltaPoints}`;
      const fullText = extraTag ? `${formatted} ${extraTag}` : formatted;

      const scoreEl = scoreNodeRef.current;
      if (scoreEl) {
        scoreEl.classList.remove('score-impact-pop');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('score-impact-pop');
      }

      const badge = lastDeltaBadgeRef.current;
      if (badge) {
        badge.textContent = fullText;
        badge.style.color = isPositive ? spectrumColor : '#ff2a54';
        badge.style.borderColor = isPositive ? spectrumColor : '#ff2a54';
        badge.style.boxShadow = `0 0 10px ${isPositive ? spectrumColor : 'rgba(255,42,84,0.5)'}`;
        badge.classList.remove('fading-out', 'pill-impact-pop');
        void badge.offsetWidth;
        badge.classList.add('visible', 'pill-impact-pop');

        if (badgeFadeTimeoutRef.current !== null) {
          window.clearTimeout(badgeFadeTimeoutRef.current);
        }
        badgeFadeTimeoutRef.current = window.setTimeout(() => {
          badge.classList.add('fading-out');
        }, 1250);
      }

      const root = deltaPopupRootRef.current;
      if (root) {
        const popup = document.createElement('span');
        popup.className = `score-delta-popup ${isPositive ? 'pos' : 'neg'}`;
        popup.textContent = fullText;
        popup.style.color = isPositive ? spectrumColor : '#ff2a54';
        popup.style.textShadow = `0 0 10px ${isPositive ? spectrumColor : '#ff2a54'}`;
        const jitterX = Math.round((Math.random() - 0.5) * 34);
        popup.style.setProperty('--jitter-x', `${jitterX}px`);

        root.appendChild(popup);
        popup.addEventListener(
          'animationend',
          () => {
            popup.remove();
          },
          { once: true }
        );
      }
    },
    []
  );

  // 8-bit banner popup when a hidden sequence or Quantum Merge is triggered
  const triggerSequenceBanner = useCallback(
    (title: string, subtitle: string, bonusPoints: number, color: string, isPhi?: boolean) => {
      const id = engineRef.current.bannerCounter++;
      setActiveBanners((prev) => [
        ...prev.slice(-2),
        {
          id,
          title,
          subtitle,
          bonusText: `+${bonusPoints} PTS BONUS!`,
          color,
          isPhi,
        },
      ]);

      if (isPhi && boardWrapperRef.current) {
        boardWrapperRef.current.classList.remove('phi-golden-flash');
        void boardWrapperRef.current.offsetWidth;
        boardWrapperRef.current.classList.add('phi-golden-flash');
      }

      const durationMs = isPhi ? 2600 : 1950;
      setTimeout(() => {
        setActiveBanners((prev) => prev.filter((b) => b.id !== id));
      }, durationMs);
    },
    []
  );

  // Start / Restart Game
  const startNewGame = useCallback(
    (overrideMode?: GameMode) => {
      const targetMode = overrideMode ?? gameMode;
      const newBoard = generateFairBoard(targetMode);
      setBoard(newBoard);
      pressedPhysicalKeysRef.current.clear();

      const eng = engineRef.current;
      eng.currentIndex = 0;
      eng.runStartTime = 0;
      eng.runEndTime = 0;
      eng.lastKeystrokeTime = 0;
      eng.score = 0;
      eng.displayedScore = 0;
      eng.shieldIntactOnCurrent = newBoard.cells[0].isReinforced;
      eng.cellHitTimestamps.fill(0);
      eng.cellFirstHitTimestamps.fill(0);

      // Reset OMNI state
      eng.doneMask.fill(0);
      eng.clearedCount = 0;
      eng.omniBranches = [];
      eng.omniVisualCells.clear();
      eng.omniRecentDigits = [];
      eng.omniRecentTimestamps = [];
      eng.omniTriggeredSeqKeys.clear();

      eng.totalKeystrokes = 0;
      eng.sumDeltaMs = 0;
      eng.peakKps = 0;
      eng.sequencesHit = 0;
      eng.reinforcedHit = 0;
      eng.mistakes = 0;
      eng.isFinished = false;

      samplesRef.current = [];
      setLastSpeedMs(null);
      setAvgSpeedMs(null);
      setPeakKps(0);
      setSequencesHitCount(0);
      setReinforcedHitCount(0);
      setMistakesCount(0);
      setIsFinished(false);
      setHasStarted(false);
      setHasSubmittedScore(false);
      setNickCursor(0);
      setActiveBanners([]);
      setQuantumLasers([]);
      setChartTick((t) => t + 1);

      if (scoreNodeRef.current) {
        scoreNodeRef.current.textContent = '0';
        scoreNodeRef.current.style.color = '#ffea00';
      }
      if (lastDeltaBadgeRef.current) {
        lastDeltaBadgeRef.current.classList.remove('visible', 'fading-out');
      }
      if (progressNodeRef.current) {
        progressNodeRef.current.textContent = `0 / ${TOTAL_CELLS}`;
      }
    },
    [gameMode]
  );

  // Initialize DOM nodes when a new board or gameMode is set
  useEffect(() => {
    if (activeTab !== 'GAME') return;
    const eng = engineRef.current;
    eng.doneMask.fill(0);
    eng.omniVisualCells.clear();

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const node = cellNodesRef.current[i];
      if (!node) continue;
      node.className = 'cell';
      node.style.setProperty('--shield-alpha', '0');
      node.style.removeProperty('--branch-color');
      node.style.removeProperty('--overlap-color-1');
      node.style.removeProperty('--overlap-color-2');
    }

    if (gameMode === 'LINEAR') {
      eng.currentIndex = 0;
      eng.shieldIntactOnCurrent = board.cells[0].isReinforced;
      const firstNode = cellNodesRef.current[0];
      if (firstNode) firstNode.classList.add('active');
      setWrapGhosts([]);
      updateLinearShieldVisibility(0, board);
    } else {
      const startIdx = OMNI_CENTER_INDEX;
      eng.doneMask.fill(0);
      eng.clearedCount = 0;

      eng.omniBranches = [
        {
          headIndex: startIdx,
          trail: [startIdx],
          visitedSet: new Set([startIdx]),
          shieldCrackedOnHead: !board.cells[startIdx].isReinforced,
          color: OMNI_BRANCH_COLORS[0],
        },
      ];
      if (progressNodeRef.current) {
        progressNodeRef.current.textContent = `0 / ${TOTAL_CELLS}`;
      }
      syncOmniVisualState(board);
    }
  }, [board, gameMode, activeTab, updateLinearShieldVisibility, syncOmniVisualState]);

  // Submit 3-letter arcade nick to Shared Backend + localStorage fallback
  const handleSaveScoreToLeaderboard = useCallback(async () => {
    if (hasSubmittedScore) return;
    const eng = engineRef.current;
    const nick = nickLetters.join('').toUpperCase();
    const totalDurationMs =
      eng.runStartTime > 0 && eng.runEndTime >= eng.runStartTime
        ? eng.runEndTime - eng.runStartTime
        : eng.sumDeltaMs;
    const totalTimeSec = Number((Math.max(0, totalDurationMs) / 1000).toFixed(2));

    setHasSubmittedScore(true);

    // Sync user's preferred 3-letter nick if logged in
    if (currentUser && nick !== currentUser.nick) {
      apiUpdateUserSettings({ nick }).then((updatedUser) => {
        if (updatedUser) setCurrentUser(updatedUser);
      });
    }

    // 1. Try submitting to shared PostgreSQL backend
    const backendSaved = await apiSubmitScoreToBackend({
      nick,
      score: eng.score,
      mode: gameMode,
      totalTimeSec,
      avgSpeedMs: avgSpeedMs ?? 0,
      mistakes: mistakesCount,
    });

    const newEntry: LeaderboardEntry = backendSaved ?? {
      id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nick,
      score: eng.score,
      mode: gameMode,
      totalTimeSec,
      avgSpeedMs: avgSpeedMs ?? 0,
      mistakes: mistakesCount,
      date: new Date().toISOString().slice(0, 10),
      username: currentUser?.username,
    };

    if (backendSaved) {
      setIsBackendOnline(true);
    }

    setLeaderboard((prev) => {
      const updated = [...prev, newEntry].sort((a, b) => b.score - a.score);
      saveLeaderboardToStorage(updated);
      return updated;
    });
    setActiveTab('LEADERBOARD');
  }, [hasSubmittedScore, nickLetters, gameMode, avgSpeedMs, mistakesCount, currentUser]);

  // Smooth arcade score counter interpolation loop
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      const eng = engineRef.current;
      if (eng.displayedScore !== eng.score) {
        const diff = eng.score - eng.displayedScore;
        const step = Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * 0.22));
        eng.displayedScore += step;
        if (scoreNodeRef.current) {
          scoreNodeRef.current.textContent = eng.displayedScore.toLocaleString('en-US');
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Zero-Lag Global Keydown + Keyup Engine
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      const physCode = e.code || e.key.toLowerCase();
      pressedPhysicalKeysRef.current.delete(physCode);
    };

    const handleWindowBlur = () => {
      pressedPhysicalKeysRef.current.clear();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBindingsOpen || isAuthOpen || activeTab !== 'GAME') return;

      // If board is finished, handle 3-letter Arcade Nick input directly from keyboard!
      if (engineRef.current.isFinished && !hasSubmittedScore) {
        if (e.key === 'Escape') {
          e.preventDefault();
          startNewGame();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          void handleSaveScoreToLeaderboard();
          return;
        }
        if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setNickCursor((c) => Math.max(0, c - 1));
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setNickCursor((c) => Math.min(2, c + 1));
          return;
        }
        if (/^[a-zA-Z0-9]$/.test(e.key)) {
          e.preventDefault();
          const char = e.key.toUpperCase();
          setNickLetters((prev) => {
            const copy = [...prev];
            copy[nickCursor] = char;
            return copy;
          });
          setNickCursor((c) => Math.min(2, c + 1));
          return;
        }
        return;
      }

      const physCode = e.code || e.key.toLowerCase();

      if (e.repeat || pressedPhysicalKeysRef.current.has(physCode)) {
        e.preventDefault();
        return;
      }

      pressedPhysicalKeysRef.current.add(physCode);

      if (e.key === 'Escape') {
        e.preventDefault();
        startNewGame();
        return;
      }

      const keyLower = e.key.toLowerCase();
      const mappedDigit = keyToDigitMapRef.current.get(keyLower);

      if (
        mappedDigit !== undefined ||
        e.key === ' ' ||
        e.key === 'Tab' ||
        e.key === '/' ||
        e.key.startsWith('Arrow')
      ) {
        e.preventDefault();
      }

      if (mappedDigit === undefined) return;

      const eng = engineRef.current;
      if (eng.isFinished) return;

      const now = performance.now();

      // ======================================================================
      // MODE A: OMNI-8 (Starts at Center Cell 136 -> Then 8-Way Free Movement)
      // ======================================================================
      if (gameMode === 'OMNI') {
        const delta =
          eng.lastKeystrokeTime === 0
            ? 240
            : Math.max(15, now - eng.lastKeystrokeTime);
        const clampedDelta = Math.max(MIN_DELTA_MS, delta);
        const speedBonus =
          delta < MAX_BONUS_DELTA_MS ? Math.round(2800 / clampedDelta) : 0;

        // SPECIAL CASE 0: First cell on the board (center index 136) has NOT been cleared yet!
        if (eng.clearedCount === 0) {
          const startBranch = eng.omniBranches[0];
          const centerIdx = startBranch.headIndex;
          const centerCell = board.cells[centerIdx];

          if (mappedDigit === centerCell.digit) {
            if (eng.runStartTime === 0) eng.runStartTime = now;
            setHasStarted(true);

            if (centerCell.isReinforced && !startBranch.shieldCrackedOnHead) {
              startBranch.shieldCrackedOnHead = true;
              const shieldBreakPoints = BASE_POINTS + speedBonus;
              eng.score += shieldBreakPoints;
              eng.lastKeystrokeTime = now;
              eng.omniRecentDigits.push(mappedDigit);
              eng.omniRecentTimestamps.push(now);

              const intensity = computePointIntensity(shieldBreakPoints, clampedDelta);
              const specColor = getSpectrumColor(intensity);
              triggerDeltaPopup(shieldBreakPoints, specColor, '[CRACKED!]');
              syncOmniVisualState(board);
              return;
            }

            const isSecondShieldHit = centerCell.isReinforced;
            const multiplier = isSecondShieldHit ? 2 : 1;
            const pointsGained = (BASE_POINTS + speedBonus) * multiplier;

            if (isSecondShieldHit) {
              eng.reinforcedHit += 1;
              setReinforcedHitCount(eng.reinforcedHit);
            }

            eng.doneMask[centerIdx] = 1;
            eng.clearedCount = 1;
            eng.score += pointsGained;
            eng.lastKeystrokeTime = now;
            eng.totalKeystrokes += 1;
            eng.sumDeltaMs += delta;

            eng.omniRecentDigits.push(mappedDigit);
            eng.omniRecentTimestamps.push(now);

            const currentKps = 1000 / Math.max(40, delta);
            if (currentKps > eng.peakKps) {
              eng.peakKps = currentKps;
              setPeakKps(currentKps);
            }

            const intensity = computePointIntensity(pointsGained, clampedDelta);
            const specColor = getSpectrumColor(intensity);
            if (scoreNodeRef.current) {
              scoreNodeRef.current.style.color = specColor;
            }

            triggerDeltaPopup(
              pointsGained,
              specColor,
              isSecondShieldHit ? '[SHIELD 2X!]' : undefined
            );

            if (progressNodeRef.current) {
              progressNodeRef.current.textContent = `1 / ${TOTAL_CELLS}`;
            }

            syncOmniVisualState(board);

            const roundedDelta = Math.round(delta);
            samplesRef.current.push({
              step: 1,
              deltaMs: roundedDelta,
              kps: Number(currentKps.toFixed(2)),
              points: pointsGained,
              isReinforced2x: isSecondShieldHit,
            });
            setLastSpeedMs(roundedDelta);
            setAvgSpeedMs(Math.round(eng.sumDeltaMs / eng.totalKeystrokes));
            setChartTick((t) => t + 1);
            return;
          } else {
            const errDelta =
              eng.lastKeystrokeTime === 0
                ? MAX_BONUS_DELTA_MS
                : Math.max(MIN_DELTA_MS, now - eng.lastKeystrokeTime);
            const speedPenaltyFactor = Math.round(3200 / errDelta);
            const penalty = Math.round(BASE_POINTS * 2 + speedPenaltyFactor * 2.2);

            eng.score = Math.max(0, eng.score - penalty);
            eng.lastKeystrokeTime = now;
            eng.mistakes += 1;
            setMistakesCount(eng.mistakes);

            triggerBoardErrorFlash();
            const hNode = cellNodesRef.current[centerIdx];
            if (hNode) {
              hNode.classList.remove('error');
              void hNode.offsetWidth;
              hNode.classList.add('error');
              hNode.addEventListener(
                'animationend',
                () => {
                  hNode.classList.remove('error');
                },
                { once: true }
              );
            }

            triggerDeltaPopup(-penalty, '#ff2a54', 'MISS!');
            return;
          }
        }

        // 1. SHIELD PRIORITY ON DOUBLE-TAP:
        // If ANY active branch head has an uncracked shield matching `mappedDigit`,
        // ALWAYS prioritize cracking/completing that shield before moving to other neighbors!
        const shieldHeadsMatching = eng.omniBranches.filter((br) => {
          const hCell = board.cells[br.headIndex];
          return (
            hCell.isReinforced &&
            !br.shieldCrackedOnHead &&
            hCell.digit === mappedDigit
          );
        });

        if (shieldHeadsMatching.length > 0) {
          setHasStarted(true);
          for (const br of shieldHeadsMatching) {
            br.shieldCrackedOnHead = true;
          }
          eng.omniBranches = shieldHeadsMatching;

          if (eng.omniBranches.length === 1) {
            const winner = eng.omniBranches[0];
            for (const cellIdx of winner.trail) {
              if (eng.doneMask[cellIdx] === 0) {
                eng.doneMask[cellIdx] = 1;
                eng.clearedCount += 1;
                const cNode = cellNodesRef.current[cellIdx];
                if (cNode) {
                  cNode.className = 'cell done';
                  cNode.style.setProperty('--shield-alpha', '0');
                }
              }
            }
            winner.trail = [winner.headIndex];
            winner.visitedSet = new Set([winner.headIndex]);
          }

          eng.omniRecentDigits.push(mappedDigit);
          eng.omniRecentTimestamps.push(now);
          if (eng.omniRecentDigits.length > 16) {
            eng.omniRecentDigits.shift();
            eng.omniRecentTimestamps.shift();
          }

          const pointsGained = (BASE_POINTS + speedBonus) * 2;
          eng.score += pointsGained;
          eng.lastKeystrokeTime = now;
          eng.totalKeystrokes += 1;
          eng.sumDeltaMs += delta;
          eng.reinforcedHit += 1;
          setReinforcedHitCount(eng.reinforcedHit);

          const currentKps = 1000 / Math.max(40, delta);
          if (currentKps > eng.peakKps) {
            eng.peakKps = currentKps;
            setPeakKps(currentKps);
          }

          const intensity = computePointIntensity(pointsGained, clampedDelta);
          const specColor = getSpectrumColor(intensity);
          if (scoreNodeRef.current) {
            scoreNodeRef.current.style.color = specColor;
          }

          triggerDeltaPopup(pointsGained, specColor, '[SHIELD 2X!]');

          if (progressNodeRef.current) {
            progressNodeRef.current.textContent = `${eng.clearedCount} / ${TOTAL_CELLS}`;
          }

          if (eng.clearedCount >= TOTAL_CELLS) {
            eng.runEndTime = now;
            eng.isFinished = true;
            setIsFinished(true);
          } else {
            syncOmniVisualState(board);
          }

          const roundedDelta = Math.round(delta);
          samplesRef.current.push({
            step: eng.clearedCount,
            deltaMs: roundedDelta,
            kps: Number(currentKps.toFixed(2)),
            points: pointsGained,
            isReinforced2x: true,
          });
          setLastSpeedMs(roundedDelta);
          setAvgSpeedMs(Math.round(eng.sumDeltaMs / eng.totalKeystrokes));
          setChartTick((t) => t + 1);
          return;
        }

        // 2. Expand all branches whose head is ready to move to neighbors matching `mappedDigit`
        let nextBranches: OmniBranch[] = [];
        const lastTypedDigit =
          eng.omniRecentDigits.length > 0
            ? eng.omniRecentDigits[eng.omniRecentDigits.length - 1]
            : null;
        const isDoubleTapSameDigit = lastTypedDigit === mappedDigit;

        for (let b = 0; b < eng.omniBranches.length; b++) {
          const br = eng.omniBranches[b];
          const headCell = board.cells[br.headIndex];
          if (headCell.isReinforced && !br.shieldCrackedOnHead) {
            continue;
          }

          const neighbors = getAvailableOmniNeighbors(
            br.headIndex,
            eng.doneMask,
            br.visitedSet
          );

          const matchingNeighbors = neighbors.filter(
            (nIdx) => board.cells[nIdx].digit === mappedDigit
          );

          for (let n = 0; n < matchingNeighbors.length; n++) {
            const nIdx = matchingNeighbors[n];
            const nextVisited = new Set(br.visitedSet);
            nextVisited.add(nIdx);
            nextBranches.push({
              headIndex: nIdx,
              trail: [...br.trail, nIdx],
              visitedSet: nextVisited,
              shieldCrackedOnHead: !board.cells[nIdx].isReinforced,
              color: matchingNeighbors.length === 1 ? br.color : '',
            });
          }
        }

        // If double-tapping the same digit and among the candidate next targets at least one has a shield,
        // prioritize the shielded target(s)!
        if (isDoubleTapSameDigit && nextBranches.length > 1) {
          const shieldedTargets = nextBranches.filter(
            (cand) => board.cells[cand.headIndex].isReinforced
          );
          if (shieldedTargets.length > 0) {
            nextBranches = shieldedTargets;
          }
        }

        // If NO branch has a valid neighbor with `mappedDigit` -> MISTAKE!
        if (nextBranches.length === 0) {
          const errDelta =
            eng.lastKeystrokeTime === 0
              ? MAX_BONUS_DELTA_MS
              : Math.max(MIN_DELTA_MS, now - eng.lastKeystrokeTime);
          const speedPenaltyFactor = Math.round(3200 / errDelta);
          const penalty = Math.round(BASE_POINTS * 2 + speedPenaltyFactor * 2.2);

          eng.score = Math.max(0, eng.score - penalty);
          eng.lastKeystrokeTime = now;
          eng.mistakes += 1;
          setMistakesCount(eng.mistakes);

          triggerBoardErrorFlash();
          for (const br of eng.omniBranches) {
            const hNode = cellNodesRef.current[br.headIndex];
            if (hNode) {
              hNode.classList.remove('error');
              void hNode.offsetWidth;
              hNode.classList.add('error');
              hNode.addEventListener(
                'animationend',
                () => {
                  hNode.classList.remove('error');
                },
                { once: true }
              );
            }
          }

          triggerDeltaPopup(-penalty, '#ff2a54', 'MISS!');
          return;
        }

        // ====================================================================
        // 3. IDEA 1: QUANTUM MERGE (DIAMOND CONVERGENCE) + LASER SWEEP
        // ====================================================================
        // Group candidate branches by their new `headIndex`.
        // Whenever M >= 2 branches converge onto the EXACT SAME `headIndex`:
        // - ALL M branches in the diamond are merged & committed to `doneMask`!
        // - A bright thin laser line sweeps through all cells of the M paths!
        // - A tiered Quantum bonus (DOUBLE / TRIPLE / QUADRUPLE QUANTUM) is awarded!
        const groupsByHead = new Map<number, OmniBranch[]>();
        for (const cand of nextBranches) {
          const list = groupsByHead.get(cand.headIndex) || [];
          list.push(cand);
          groupsByHead.set(cand.headIndex, list);
        }

        let deduplicated: OmniBranch[] = [];
        let maxQuantumMergeCount = 0;
        const quantumLaserTrails: number[][] = [];

        for (const [headIdx, group] of groupsByHead.entries()) {
          if (group.length === 1) {
            deduplicated.push(group[0]);
          } else {
            // QUANTUM CONVERGENCE! Merge all `group.length` branches!
            const mCount = group.length;
            if (mCount > maxQuantumMergeCount) {
              maxQuantumMergeCount = mCount;
            }

            const mergedVisited = new Set<number>();
            const mergedTrailSet = new Set<number>();
            const headNeedsSecondHit =
              board.cells[headIdx].isReinforced &&
              group.some((g) => !g.shieldCrackedOnHead);

            for (const g of group) {
              quantumLaserTrails.push([...g.trail]);
              for (const v of g.visitedSet) {
                mergedVisited.add(v);
              }
              for (const tIdx of g.trail) {
                mergedTrailSet.add(tIdx);
                // Immediately commit all diamond trail cells to `doneMask`
                // (except `headIdx` if it still needs its 2nd shield hit)
                if (tIdx === headIdx && headNeedsSecondHit) continue;
                if (eng.doneMask[tIdx] === 0) {
                  eng.doneMask[tIdx] = 1;
                  eng.clearedCount += 1;
                  const cNode = cellNodesRef.current[tIdx];
                  if (cNode) {
                    cNode.className = 'cell done';
                    cNode.style.setProperty('--shield-alpha', '0');
                  }
                }
              }
            }

            deduplicated.push({
              headIndex: headIdx,
              trail: [headIdx],
              visitedSet: mergedVisited,
              shieldCrackedOnHead: !headNeedsSecondHit,
              color: group[0].color || OMNI_BRANCH_COLORS[0],
            });
            void mergedTrailSet;
          }
        }

        if (deduplicated.length > 1) {
          const openBranches = deduplicated.filter(
            (br) =>
              countImmediateFreeNeighbors(br.headIndex, eng.doneMask, br.visitedSet) > 0
          );
          if (openBranches.length > 0) {
            deduplicated = openBranches;
          }
          if (deduplicated.length > 6) {
            deduplicated = deduplicated.slice(0, 6);
          }
        }

        // 4. Commit resolved cells to `doneMask` when down to 1 active branch (or common prefix)
        if (deduplicated.length === 1) {
          const winner = deduplicated[0];
          const headNeedsSecondHit =
            board.cells[winner.headIndex].isReinforced && !winner.shieldCrackedOnHead;
          const commitLimit = headNeedsSecondHit
            ? winner.trail.length - 1
            : winner.trail.length;

          for (let i = 0; i < commitLimit; i++) {
            const cellIdx = winner.trail[i];
            if (eng.doneMask[cellIdx] === 0) {
              eng.doneMask[cellIdx] = 1;
              eng.clearedCount += 1;
              const cNode = cellNodesRef.current[cellIdx];
              if (cNode) {
                cNode.className = 'cell done';
                cNode.style.setProperty('--shield-alpha', '0');
              }
            }
          }
          winner.trail = [winner.headIndex];
          winner.visitedSet = new Set([winner.headIndex]);
        } else {
          const minTrailLen = Math.min(...deduplicated.map((b) => b.trail.length));
          let commonPrefixCount = 0;
          for (let i = 0; i < minTrailLen - 1; i++) {
            const idxAtI = deduplicated[0].trail[i];
            if (deduplicated.every((b) => b.trail[i] === idxAtI)) {
              commonPrefixCount = i + 1;
              if (eng.doneMask[idxAtI] === 0) {
                eng.doneMask[idxAtI] = 1;
                eng.clearedCount += 1;
                const cNode = cellNodesRef.current[idxAtI];
                if (cNode) {
                  cNode.className = 'cell done';
                  cNode.style.setProperty('--shield-alpha', '0');
                }
              }
            } else {
              break;
            }
          }
          if (commonPrefixCount > 0) {
            for (const br of deduplicated) {
              br.trail = br.trail.slice(commonPrefixCount);
            }
          }
        }

        assignDistinctBranchColors(deduplicated);
        eng.omniBranches = deduplicated;
        setHasStarted(true);

        eng.omniRecentDigits.push(mappedDigit);
        eng.omniRecentTimestamps.push(now);
        if (eng.omniRecentDigits.length > 16) {
          eng.omniRecentDigits.shift();
          eng.omniRecentTimestamps.shift();
        }

        let pointsGained = BASE_POINTS + speedBonus;
        let completedSequenceName: string | undefined;
        let quantumTitle: string | undefined;

        // Award Quantum Merge Bonus & trigger thin bright laser line across the diamond!
        if (maxQuantumMergeCount >= 2) {
          let quantumBonus = 300;
          let qColor = '#00f0ff';
          let qSub = '2 parallel paths collapsed into a single diamond!';

          if (maxQuantumMergeCount === 2) {
            quantumTitle = 'DOUBLE QUANTUM!';
            quantumBonus = 300;
            qColor = '#00f0ff';
          } else if (maxQuantumMergeCount === 3) {
            quantumTitle = 'TRIPLE QUANTUM!';
            quantumBonus = 750;
            qColor = '#ff00e5';
            qSub = '3 parallel paths converged simultaneously!';
          } else {
            quantumTitle = 'QUADRUPLE QUANTUM!';
            quantumBonus = 2000;
            qColor = '#ffd700';
            qSub = `${maxQuantumMergeCount}-way Impossible Singularity Convergence!`;
          }

          pointsGained += quantumBonus;
          triggerQuantumLaserSweep(quantumLaserTrails, qColor);
          triggerSequenceBanner(
            quantumTitle,
            qSub,
            quantumBonus,
            qColor,
            maxQuantumMergeCount >= 4
          );
        }

        const matchedSeq = detectOmniSequenceMatch(
          eng.omniRecentDigits,
          eng.omniRecentTimestamps,
          eng.omniTriggeredSeqKeys
        );

        if (matchedSeq) {
          pointsGained += matchedSeq.bonusPoints;
          completedSequenceName = matchedSeq.name;
          eng.sequencesHit += 1;
          setSequencesHitCount(eng.sequencesHit);

          triggerSequenceBanner(
            matchedSeq.name,
            matchedSeq.subtitle,
            matchedSeq.bonusPoints,
            matchedSeq.color,
            matchedSeq.isPhiEasterEgg
          );
        }

        eng.score += pointsGained;
        eng.lastKeystrokeTime = now;
        eng.totalKeystrokes += 1;
        eng.sumDeltaMs += delta;

        const currentKps = 1000 / Math.max(40, delta);
        if (currentKps > eng.peakKps) {
          eng.peakKps = currentKps;
          setPeakKps(currentKps);
        }

        const intensity = computePointIntensity(pointsGained, clampedDelta);
        const specColor = getSpectrumColor(intensity);
        if (scoreNodeRef.current) {
          scoreNodeRef.current.style.color = specColor;
        }

        const anyUncrackedShieldNow = deduplicated.some(
          (br) => board.cells[br.headIndex].isReinforced && !br.shieldCrackedOnHead
        );

        let tag = '';
        if (quantumTitle) {
          tag = `[${quantumTitle}]`;
        } else if (anyUncrackedShieldNow) {
          tag = '[CRACKED!]';
        } else if (completedSequenceName) {
          tag = `[${completedSequenceName}]`;
        } else if (deduplicated.length > 1) {
          tag = `[SPLIT x${deduplicated.length}]`;
        }

        triggerDeltaPopup(pointsGained, specColor, tag || undefined);

        if (progressNodeRef.current) {
          progressNodeRef.current.textContent = `${eng.clearedCount} / ${TOTAL_CELLS}`;
        }

        if (eng.clearedCount >= TOTAL_CELLS && !anyUncrackedShieldNow) {
          eng.runEndTime = now;
          eng.isFinished = true;
          setIsFinished(true);
        } else {
          syncOmniVisualState(board);
        }

        const roundedDelta = Math.round(delta);
        samplesRef.current.push({
          step: eng.clearedCount,
          deltaMs: roundedDelta,
          kps: Number(currentKps.toFixed(2)),
          points: pointsGained,
          isReinforced2x: false,
          sequenceName: quantumTitle || completedSequenceName,
        });

        setLastSpeedMs(roundedDelta);
        setAvgSpeedMs(Math.round(eng.sumDeltaMs / eng.totalKeystrokes));
        setChartTick((t) => t + 1);
        return;
      }

      // ======================================================================
      // MODE B: LINEAR (Classic Left-to-Right Row-by-Row)
      // ======================================================================
      const idx = eng.currentIndex;
      const currentCell = board.cells[idx];
      const currentNode = cellNodesRef.current[idx];

      if (mappedDigit === currentCell.digit) {
        if (eng.runStartTime === 0) eng.runStartTime = now;
        setHasStarted(true);
        const delta =
          eng.lastKeystrokeTime === 0
            ? 240
            : Math.max(15, now - eng.lastKeystrokeTime);

        const clampedDelta = Math.max(MIN_DELTA_MS, delta);
        const speedBonus =
          delta < MAX_BONUS_DELTA_MS ? Math.round(2800 / clampedDelta) : 0;

        if (currentCell.isReinforced && eng.shieldIntactOnCurrent) {
          eng.shieldIntactOnCurrent = false;
          eng.cellFirstHitTimestamps[idx] = now;
          eng.lastKeystrokeTime = now;

          const shieldBreakPoints = BASE_POINTS + speedBonus;
          eng.score += shieldBreakPoints;

          const intensity = computePointIntensity(shieldBreakPoints, clampedDelta);
          const specColor = getSpectrumColor(intensity);

          if (currentNode) {
            currentNode.classList.remove('shield-approaching', 'error');
            currentNode.style.setProperty('--shield-alpha', '1');
            currentNode.classList.add('shield-cracked');
          }

          triggerDeltaPopup(shieldBreakPoints, specColor, '[CRACKED!]');
          return;
        }

        const isSecondShieldHit = currentCell.isReinforced && !eng.shieldIntactOnCurrent;
        const multiplier = isSecondShieldHit ? 2 : 1;
        let pointsGained = (BASE_POINTS + speedBonus) * multiplier;

        if (isSecondShieldHit) {
          eng.reinforcedHit += 1;
          setReinforcedHitCount(eng.reinforcedHit);
        }

        eng.cellHitTimestamps[idx] = now;
        if (!currentCell.isReinforced) {
          eng.cellFirstHitTimestamps[idx] = now;
        }

        let completedSequenceName: string | undefined;
        if (currentCell.isSequenceEnd && currentCell.sequenceInstanceId !== null) {
          const seqInst = board.sequences.find(
            (s) => s.instanceId === currentCell.sequenceInstanceId
          );
          if (seqInst) {
            const firstIdx = seqInst.startIndex;
            const startTime = eng.cellFirstHitTimestamps[firstIdx];
            const totalDurationMs = Math.max(1, now - startTime);
            const stepsCount = Math.max(1, seqInst.pattern.digits.length - 1);
            const avgSeqDelta = totalDurationMs / stepsCount;

            if (avgSeqDelta <= seqInst.pattern.maxAvgDeltaMs) {
              const seqBonus = seqInst.pattern.bonusPoints;
              pointsGained += seqBonus;
              completedSequenceName = seqInst.pattern.name;
              eng.sequencesHit += 1;
              setSequencesHitCount(eng.sequencesHit);

              triggerSequenceBanner(
                seqInst.pattern.name,
                `${seqInst.pattern.subtitle} (${Math.round(avgSeqDelta)} ms/key)`,
                seqBonus,
                seqInst.pattern.color,
                seqInst.pattern.isPhiEasterEgg
              );

              for (const sIdx of seqInst.cellIndices) {
                const sNode = cellNodesRef.current[sIdx];
                if (sNode) {
                  sNode.classList.add(
                    seqInst.pattern.isPhiEasterEgg ? 'seq-completed-phi' : 'seq-completed-pulse'
                  );
                }
              }
            }
          }
        }

        eng.score += pointsGained;
        eng.lastKeystrokeTime = now;
        eng.totalKeystrokes += 1;
        eng.sumDeltaMs += delta;

        const currentKps = 1000 / Math.max(40, delta);
        if (currentKps > eng.peakKps) {
          eng.peakKps = currentKps;
          setPeakKps(currentKps);
        }

        const intensity = computePointIntensity(pointsGained, clampedDelta);
        const specColor = getSpectrumColor(intensity);

        if (scoreNodeRef.current) {
          scoreNodeRef.current.style.color = specColor;
        }

        let tag = '';
        if (isSecondShieldHit && completedSequenceName) {
          tag = `[2X + ${completedSequenceName}]`;
        } else if (isSecondShieldHit) {
          tag = '[SHIELD 2X!]';
        } else if (completedSequenceName) {
          tag = `[${completedSequenceName}]`;
        }

        triggerDeltaPopup(pointsGained, specColor, tag || undefined);

        if (currentNode) {
          currentNode.classList.remove('active', 'error', 'shield-cracked', 'shield-approaching');
          currentNode.style.setProperty('--shield-alpha', '0');
          currentNode.classList.add('done');
        }

        const nextIndex = idx + 1;
        eng.currentIndex = nextIndex;

        if (progressNodeRef.current) {
          progressNodeRef.current.textContent = `${nextIndex} / ${TOTAL_CELLS}`;
        }

        if (nextIndex < TOTAL_CELLS) {
          const nextCell = board.cells[nextIndex];
          eng.shieldIntactOnCurrent = nextCell.isReinforced;
          const nextNode = cellNodesRef.current[nextIndex];
          if (nextNode) {
            nextNode.classList.remove('shield-approaching');
            nextNode.classList.add('active');
          }
          updateLinearShieldVisibility(nextIndex, board);
        } else {
          eng.runEndTime = now;
          eng.isFinished = true;
          setIsFinished(true);
        }

        const roundedDelta = Math.round(delta);
        samplesRef.current.push({
          step: nextIndex,
          deltaMs: roundedDelta,
          kps: Number(currentKps.toFixed(2)),
          points: pointsGained,
          isReinforced2x: isSecondShieldHit,
          sequenceName: completedSequenceName,
        });

        setLastSpeedMs(roundedDelta);
        setAvgSpeedMs(Math.round(eng.sumDeltaMs / eng.totalKeystrokes));
        setChartTick((t) => t + 1);
      } else {
        const delta =
          eng.lastKeystrokeTime === 0
            ? MAX_BONUS_DELTA_MS
            : Math.max(MIN_DELTA_MS, now - eng.lastKeystrokeTime);

        const speedPenaltyFactor = Math.round(3200 / delta);
        const penalty = Math.round(BASE_POINTS * 2 + speedPenaltyFactor * 2.2);

        eng.score = Math.max(0, eng.score - penalty);
        eng.lastKeystrokeTime = now;
        eng.mistakes += 1;
        setMistakesCount(eng.mistakes);

        triggerBoardErrorFlash();
        if (currentNode) {
          currentNode.classList.remove('error');
          void currentNode.offsetWidth;
          currentNode.classList.add('error');
          currentNode.addEventListener(
            'animationend',
            () => {
              currentNode.classList.remove('error');
            },
            { once: true }
          );
        }

        triggerDeltaPopup(-penalty, '#ff2a54', 'MISS!');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [
    board,
    gameMode,
    activeTab,
    isBindingsOpen,
    isAuthOpen,
    hasSubmittedScore,
    nickCursor,
    startNewGame,
    handleSaveScoreToLeaderboard,
    triggerBoardErrorFlash,
    triggerQuantumLaserSweep,
    triggerDeltaPopup,
    triggerSequenceBanner,
    updateLinearShieldVisibility,
    syncOmniVisualState,
  ]);

  const handleSaveSettings = (newBindings: KeyBindingsMap, newMode: GameMode) => {
    setBindings(newBindings);
    saveKeyBindings(newBindings);
    let modeToSave = gameMode;
    if (!hasStarted && newMode !== gameMode) {
      setGameMode(newMode);
      saveGameMode(newMode);
      modeToSave = newMode;
      startNewGame(newMode);
    }
    if (currentUser) {
      apiUpdateUserSettings({
        keyBindings: newBindings,
        preferredMode: modeToSave,
      }).then((updatedUser) => {
        if (updatedUser) setCurrentUser(updatedUser);
      });
    }
  };

  const handleQuickToggleMode = () => {
    if (hasStarted) return;
    const nextMode: GameMode = gameMode === 'LINEAR' ? 'OMNI' : 'LINEAR';
    setGameMode(nextMode);
    saveGameMode(nextMode);
    startNewGame(nextMode);
    if (currentUser) {
      apiUpdateUserSettings({ preferredMode: nextMode }).then((updatedUser) => {
        if (updatedUser) setCurrentUser(updatedUser);
      });
    }
  };

  return (
    <div className="app-shell">
      {/* TOP HUD: PROGRESS & MODE ON LEFT, BIG GAME TITLE IN CENTER, TABS & ACTIONS ON RIGHT */}
      <header className="top-hud">
        <div className="hud-side hud-left">
          <div className="progress-box">
            <span className="hud-label">PROGRESS</span>
            <span ref={progressNodeRef} className="hud-progress-val">
              0 / {TOTAL_CELLS}
            </span>
          </div>
          <button
            type="button"
            disabled={hasStarted}
            className={`btn-arcade small ${gameMode === 'OMNI' ? 'gold' : 'cyan'} ${
              hasStarted ? 'disabled-locked' : ''
            }`}
            title={
              hasStarted
                ? 'Mode is locked while a run is in progress. Press RESTART [ESC] to switch mode.'
                : 'Switch between Linear and Omni-8 Free Direction mode'
            }
            onClick={(e) => {
              e.currentTarget.blur();
              handleQuickToggleMode();
            }}
          >
            MODE: {gameMode === 'OMNI' ? 'OMNI-8' : 'LINEAR'}
          </button>
        </div>

        <div className="hud-center-brand">
          <h1 className="brand-title-big">FIGRID</h1>
          <span className="brand-subtitle">
            {gameMode === 'OMNI'
              ? '21x13 OMNI-DIRECTIONAL QUANTUM MATRIX'
              : '21x13 SPEED MATRIX'}
          </span>
        </div>

        <div className="hud-side hud-right">
          <button
            type="button"
            className={`btn-arcade small ${currentUser ? 'gold' : 'cyan'}`}
            onClick={(e) => {
              e.currentTarget.blur();
              setIsAuthOpen(true);
            }}
          >
            {currentUser ? `PILOT: ${currentUser.username}` : 'LOGIN / REGISTER'}
          </button>
          <button
            type="button"
            className={`btn-arcade ${activeTab === 'LEADERBOARD' ? 'gold' : ''}`}
            onClick={(e) => {
              e.currentTarget.blur();
              setActiveTab((t) => {
                const next = t === 'LEADERBOARD' ? 'GAME' : 'LEADERBOARD';
                if (next === 'LEADERBOARD') refreshLeaderboard();
                return next;
              });
            }}
          >
            {activeTab === 'LEADERBOARD' ? 'PLAY GAME' : 'LEADERBOARD'}
          </button>
          <button
            type="button"
            className="btn-arcade cyan"
            onClick={(e) => {
              e.currentTarget.blur();
              setIsBindingsOpen(true);
            }}
          >
            SETTINGS
          </button>
          <button
            type="button"
            className="btn-arcade"
            onClick={(e) => {
              e.currentTarget.blur();
              setActiveTab('GAME');
              startNewGame();
            }}
          >
            RESTART [ESC]
          </button>
        </div>
      </header>

      {/* 8-BIT BANNER OVERLAY WHEN HIDDEN SEQUENCES OR QUANTUM MERGES ARE TRIGGERED */}
      <div className="sequence-banners-overlay">
        {activeBanners.map((b) => (
          <div
            key={b.id}
            className={`seq-banner ${b.isPhi ? 'phi-special-banner' : ''}`}
            style={{ borderColor: b.color, boxShadow: `0 0 18px ${b.color}55` }}
          >
            <div className="seq-banner-title" style={{ color: b.color }}>
              {b.title}
            </div>
            <div className="seq-banner-sub">{b.subtitle}</div>
            <div className="seq-banner-bonus" style={{ color: b.color }}>
              {b.bonusText}
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'LEADERBOARD' ? (
        <LeaderboardView
          entries={leaderboard}
          isBackendOnline={isBackendOnline}
          onRefresh={refreshLeaderboard}
          onBackToGame={() => setActiveTab('GAME')}
        />
      ) : (
        <>
          {/* MAIN WORKSPACE: 21x13 BOARD ON THE LEFT + LIVE SPEED CHART ON THE RIGHT */}
          <main className="main-workspace">
            <section ref={boardWrapperRef} className="board-section">
              <div className="board-grid-stage">
                {/* QUANTUM MERGE LASER LINE OVERLAY (SWEEPS FROM START TO END OF DIAMOND PATHS) */}
                {quantumLasers.length > 0 && (
                  <svg
                    className="quantum-laser-svg"
                    viewBox={`0 0 ${COLS * 38 - 2} ${ROWS * 32 - 2}`}
                    aria-hidden="true"
                  >
                    {quantumLasers.map((line) => (
                      <g key={line.id}>
                        <polyline
                          className="quantum-laser-glow"
                          points={line.pointsAttr}
                          pathLength={100}
                          style={{ stroke: line.color }}
                        />
                        <polyline
                          className="quantum-laser-core"
                          points={line.pointsAttr}
                          pathLength={100}
                        />
                      </g>
                    ))}
                  </svg>
                )}

                {/* BLURRY WRAP-AROUND GHOST TILES IN THE OUTER PADDING RING (OMNI-8 MODE) */}
                {gameMode === 'OMNI' &&
                  wrapGhosts.map((g) => (
                    <div
                      key={g.key}
                      className="cell omni-wrap-ghost"
                      style={{
                        left: `${g.ghostCol * 38}px`,
                        top: `${g.ghostRow * 32}px`,
                      }}
                    >
                      {g.isReinforced && (
                        <svg
                          className="cell-shield-svg ghost-shield"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            className="shield-outline-path"
                            d="M12 2L4 5.4V11.2C4 16.5 7.4 21.3 12 22.8C16.6 21.3 20 16.5 20 11.2V5.4L12 2Z"
                          />
                        </svg>
                      )}
                      <span className="cell-digit">
                        <FuturisticDigit digit={g.digit} />
                      </span>
                    </div>
                  ))}

                <div className="board-grid-21x13">
                  {board.cells.map((cell, idx) => (
                    <div
                      key={idx}
                      ref={(el) => {
                        cellNodesRef.current[idx] = el;
                      }}
                      className="cell"
                    >
                      {cell.isReinforced && (
                        <svg
                          className="cell-shield-svg"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            className="shield-outline-path"
                            d="M12 2L4 5.4V11.2C4 16.5 7.4 21.3 12 22.8C16.6 21.3 20 16.5 20 11.2V5.4L12 2Z"
                          />
                        </svg>
                      )}
                      <span className="cell-digit">
                        <FuturisticDigit digit={cell.digit} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {isFinished && (
                <div className="victory-overlay">
                  <div className="victory-card">
                    <h2>BOARD CLEARED!</h2>
                    <p className="victory-score">
                      FINAL SCORE:{' '}
                      <strong>{engineRef.current.score.toLocaleString('en-US')}</strong>
                    </p>
                    <p className="victory-stats">
                      Total Time:{' '}
                      {engineRef.current.runEndTime >= engineRef.current.runStartTime &&
                      engineRef.current.runStartTime > 0
                        ? `${((engineRef.current.runEndTime - engineRef.current.runStartTime) / 1000).toFixed(2)}s`
                        : '--'}{' '}
                      | Avg Pace: {avgSpeedMs ?? '--'} ms/key | Mistakes: {mistakesCount} | Secret
                      Sequences: {sequencesHitCount}/{board.sequences.length}
                    </p>

                    {!hasSubmittedScore ? (
                      <div className="nick-entry-box">
                        <span className="nick-prompt">ENTER YOUR 3-LETTER INITIALS:</span>
                        <div className="nick-slots">
                          {nickLetters.map((char, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`nick-slot ${nickCursor === idx ? 'active' : ''}`}
                              onClick={() => setNickCursor(idx)}
                            >
                              {char}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="btn-arcade gold"
                          onClick={() => void handleSaveScoreToLeaderboard()}
                        >
                          SAVE TO LEADERBOARD [ENTER]
                        </button>
                      </div>
                    ) : (
                      <p className="nick-saved-msg">SCORE SAVED TO LEADERBOARD!</p>
                    )}

                    <button
                      type="button"
                      className="btn-arcade cyan"
                      onClick={() => startNewGame()}
                    >
                      PLAY AGAIN [ESC]
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* RIGHT PANEL: LIVE SPEED CHART */}
            <SpeedChartPanel
              samplesRef={samplesRef}
              renderTick={chartTick}
              lastSpeedMs={lastSpeedMs}
              avgSpeedMs={avgSpeedMs}
              peakKps={peakKps}
              mistakesCount={mistakesCount}
              sequencesHitCount={sequencesHitCount}
              totalSequencesCount={board.sequences.length}
              reinforcedHitCount={reinforcedHitCount}
              totalReinforcedCount={board.totalReinforcedCount}
            />
          </main>

          {/* BOTTOM HORIZONTAL SCORE PANEL (CENTERED BOX, NOT FULL WIDTH) */}
          <footer className="bottom-score-bar">
            <div className="bottom-score-box">
              <div ref={deltaPopupRootRef} className="delta-popup-layer" />
              <div className="bottom-score-top-row">
                <span className="hud-label">TOTAL SCORE</span>
                <span ref={lastDeltaBadgeRef} className="last-delta-pill">
                  +0
                </span>
              </div>
              <div className="bottom-score-digits-row">
                <span ref={scoreNodeRef} className="score-big-digits">
                  0
                </span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* SETTINGS & KEYBINDINGS MODAL */}
      <KeyBindingsModal
        isOpen={isBindingsOpen}
        bindings={bindings}
        gameMode={gameMode}
        isModeLocked={hasStarted}
        onSave={handleSaveSettings}
        onClose={() => setIsBindingsOpen(false)}
      />

      {/* PILOT LOGIN / REGISTER / CLOUD SYNC MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        currentUser={currentUser}
        currentBindings={bindings}
        currentMode={gameMode}
        currentNick={nickLetters.join('')}
        onAuthSuccess={(user) => {
          applyUserProfileSettings(user);
          refreshLeaderboard();
        }}
        onLogout={() => {
          setCurrentUser(null);
        }}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};
