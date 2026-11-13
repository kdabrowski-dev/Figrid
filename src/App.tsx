import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ROWS,
  COLS,
  TOTAL_CELLS,
  BINARY_COLS,
  BINARY_TOTAL_CELLS,
  OMNI_CENTER_INDEX,
  SHIELD_REVEAL_DISTANCE,
  BINARY_SHIELD_REVEAL_DISTANCE,
  OMNI_BRANCH_COLORS,
  CURRENT_GAME_VERSION,
  GameMode,
  GeneratedBoard,
  generateFairBoard,
  getShieldProximityAlpha,
  getOmni2DShieldAlpha,
  getAvailableOmniNeighbors,
  getWrapGhostProjectionsForHeads,
  WrapGhostProjection,
  getQuantumMergeTierInfo,
  getSpectrumColor,
  computePointIntensity,
  KeyBindingsMap,
  sanitizeKeyBindings,
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
  appendLocalMyRun,
} from './LeaderboardView';
import {
  UserProfile,
  KeystrokeTelemetryEvent,
  apiFetchCurrentUser,
  apiUpdateUserSettings,
  apiStartGameSession,
  apiFinishGameSession,
} from './apiClient';
import { AuthModal } from './AuthModal';
import { WelcomeGuideModal } from './WelcomeGuideModal';
import { ReleaseNotesModal } from './ReleaseNotesModal';
import { BadgeIcon, UserBadge } from './BadgeIcons';

const BASE_POINTS = 12;
const MIN_DELTA_MS = 50;
const MAX_BONUS_DELTA_MS = 1000;

const WELCOME_SEEN_KEY = 'figrid_welcome_guide_seen_v1';
const RELEASE_NOTES_SEEN_KEY = 'figrid_release_notes_seen_v0_0_2';
const FINISHED_RUN_HISTORY_KEY = 'figrid_finished_run_history_v1';
const FINISHED_RUN_HISTORY_LIMIT = 30;
const FATIGUE_WINDOW_MS = 2 * 60 * 60 * 1000;

interface FinishedRunRecord {
  score: number;
  mode: GameMode;
  isMobile: boolean;
  finishedAt: number;
}

function loadFinishedRunHistory(): FinishedRunRecord[] {
  try {
    const raw = localStorage.getItem(FINISHED_RUN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFinishedRunHistory(history: FinishedRunRecord[]): void {
  try {
    localStorage.setItem(FINISHED_RUN_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
}

const OverheatedSynapseIcon: React.FC = () => (
  <svg className="overheated-synapse-svg" viewBox="0 0 120 64" aria-hidden="true">
    {/* Presynaptic axon terminal */}
    <path
      className="synapse-terminal pre"
      d="M4 20 C20 18 30 14 40 20 C48 25 48 39 40 44 C30 50 20 46 4 44 Z"
    />
    {/* Postsynaptic dendrite */}
    <path
      className="synapse-terminal post"
      d="M116 20 C100 18 90 14 80 20 C72 25 72 39 80 44 C90 50 100 46 116 44 Z"
    />
    {/* Vesicles */}
    <circle className="synapse-vesicle" cx="30" cy="26" r="3" />
    <circle className="synapse-vesicle" cx="34" cy="37" r="2.5" />
    <circle className="synapse-vesicle" cx="24" cy="33" r="2" />
    {/* Dropped neurotransmitter packets in the synaptic cleft */}
    <rect className="synapse-packet p1" x="51" y="24" width="4" height="4" />
    <rect className="synapse-packet p2" x="58" y="33" width="4" height="4" />
    <rect className="synapse-packet p3" x="65" y="27" width="4" height="4" />
    {/* Overload spark */}
    <path className="synapse-spark" d="M60 4 L54 18 L61 18 L56 30 L68 13 L61 13 L66 4 Z" />
    {/* Heat waves */}
    <path className="synapse-heat h1" d="M48 58 q4 -5 0 -10 q-4 -5 0 -10" />
    <path className="synapse-heat h2" d="M60 60 q4 -5 0 -10 q-4 -5 0 -10" />
    <path className="synapse-heat h3" d="M72 58 q4 -5 0 -10 q-4 -5 0 -10" />
  </svg>
);

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
  isSuper?: boolean;
}

function detectMobilePhone(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isTouchPhone =
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (window.innerWidth <= 760 && navigator.maxTouchPoints > 1);
  return isTouchPhone;
}

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
      const prevC = prevIdx % COLS;
      if (Math.abs(r - prevR) > 3 || Math.abs(c - prevC) > 3) {
        if (currentPoints.length >= 2) {
          polylines.push(currentPoints.join(' '));
        }
        currentPoints = [`${x},${y}`];
        continue;
      }
    }
    currentPoints.push(`${x},${y}`);
  }

  if (currentPoints.length >= 2) {
    polylines.push(currentPoints.join(' '));
  }
  return polylines;
}

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
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(WELCOME_SEEN_KEY);
    } catch {
      return false;
    }
  });
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(WELCOME_SEEN_KEY)) && !localStorage.getItem(RELEASE_NOTES_SEEN_KEY);
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => detectMobilePhone());
  const [mobileNumpadLayout, setMobileNumpadLayout] = useState<'2x5' | '3x4'>('3x4');

  // Leaderboard state + 3-letter nick entry after completing the board
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nickLetters, setNickLetters] = useState<string[]>(['A', 'A', 'A']);
  const [nickCursor, setNickCursor] = useState<number>(0);
  const [hasSubmittedScore, setHasSubmittedScore] = useState<boolean>(false);
  const [botAlertInfo, setBotAlertInfo] = useState<{
    reason: string;
    badge?: UserBadge | null;
  } | null>(null);
  const [unlockedBadgesOnRun, setUnlockedBadgesOnRun] = useState<UserBadge[]>([]);
  const [fatigueAlert, setFatigueAlert] = useState<{
    suggestedMode: GameMode;
    scores: number[];
  } | null>(null);
  const lastRecordedRunStartRef = useRef<number>(0);

  // Telemetry state for right panel and summary
  const [, setChartTick] = useState(0);
  const [lastSpeedMs, setLastSpeedMs] = useState<number | null>(null);
  const [avgSpeedMs, setAvgSpeedMs] = useState<number | null>(null);
  const [peakKps, setPeakKps] = useState<number>(0);
  const [sequencesHitCount, setSequencesHitCount] = useState<number>(0);
  const [quantumMergesCount, setQuantumMergesCount] = useState<number>(0);
  const [reinforcedHitCount, setReinforcedHitCount] = useState<number>(0);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [wrapGhosts, setWrapGhosts] = useState<WrapGhostProjection[]>([]);
  const [quantumLasers, setQuantumLasers] = useState<QuantumLaserLine[]>([]);
  const [binaryBitCursor, setBinaryBitCursor] = useState<number>(0);
  const [binaryBitErrorSlot, setBinaryBitErrorSlot] = useState<number | null>(null);
  const [binaryActiveTargetIdx, setBinaryActiveTargetIdx] = useState<number>(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Direct DOM references for O(1) zero-reflow updates across the 273 cells
  const cellNodesRef = useRef<(HTMLDivElement | null)[]>(new Array(TOTAL_CELLS).fill(null));
  const scoreNodeRef = useRef<HTMLSpanElement | null>(null);
  const lastDeltaBadgeRef = useRef<HTMLSpanElement | null>(null);
  const deltaPopupRootRef = useRef<HTMLDivElement | null>(null);
  const progressNodeRef = useRef<HTMLSpanElement | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);
  const badgeFadeTimeoutRef = useRef<number | null>(null);
  const bonusPillLockUntilRef = useRef<number>(0);

  // Set of currently held physical key codes + keydown timestamp map for dwell time verification
  const pressedPhysicalKeysRef = useRef<Set<string>>(new Set());
  const activeKeyDownEventMapRef = useRef<
    Map<string, { eventRef: KeystrokeTelemetryEvent; downTime: number }>
  >(new Map());
  const telemetryEventsRef = useRef<KeystrokeTelemetryEvent[]>([]);
  const serverSessionTokenRef = useRef<string | null>(null);
  const sessionPromiseRef = useRef<Promise<{
    sessionToken: string;
    mode: GameMode;
    version: string;
    board: GeneratedBoard;
  } | null> | null>(null);

  // Real-time mutable game engine state (0ms input lag)
  const engineRef = useRef({
    // LINEAR & BINARY mode state
    currentIndex: 0,
    shieldIntactOnCurrent: false,
    cellHitTimestamps: new Float64Array(TOTAL_CELLS),
    cellFirstHitTimestamps: new Float64Array(TOTAL_CELLS),

    // BINARY 3-bit mode state
    binaryBitCursor: 0,
    binaryTileFirstBitTs: 0,
    binaryRowFirstBitTs: 0,
    binaryOverclocks: 0,

    // OMNI-8 mode state
    doneMask: new Uint8Array(TOTAL_CELLS),
    clearedCount: 0,
    omniBranches: [] as OmniBranch[],
    omniVisualCells: new Set<number>(),
    quantumMerges: 0,

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
    laserCounter: 1,
  });

  const samplesRef = useRef<SpeedSample[]>([]);

  const handleCloseWelcome = () => {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, '1');
      if (!localStorage.getItem(RELEASE_NOTES_SEEN_KEY)) {
        setIsReleaseNotesOpen(true);
      }
    } catch {
      // ignore
    }
    setIsWelcomeOpen(false);
  };

  const handleCloseReleaseNotes = () => {
    try {
      localStorage.setItem(RELEASE_NOTES_SEEN_KEY, '1');
    } catch {
      // ignore
    }
    setIsReleaseNotesOpen(false);
  };

  useEffect(() => {
    const onResize = () => {
      setIsMobileDevice(detectMobilePhone());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const applyUserProfileSettings = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    if (user.nick && user.nick.length === 3) {
      setNickLetters(user.nick.toUpperCase().split(''));
    }
    if (user.keyBindings && Object.keys(user.keyBindings).length > 0) {
      const cleanBindings = sanitizeKeyBindings(user.keyBindings);
      setBindings(cleanBindings);
      saveKeyBindings(cleanBindings);
    }
  }, []);

  const refreshLeaderboard = useCallback(() => {
    fetchInitialLeaderboard().then(({ entries, isBackendOnline: online }) => {
      setLeaderboard(entries);
      setIsBackendOnline(online);
    });
  }, []);

  // Load initial leaderboard + restore JWT user session + register initial board session with server
  useEffect(() => {
    refreshLeaderboard();
    apiFetchCurrentUser().then((user) => {
      if (user) {
        applyUserProfileSettings(user);
      }
    });
    const initPromise = apiStartGameSession(gameMode, board).then((session) => {
      if (session && engineRef.current.totalKeystrokes === 0 && !engineRef.current.isFinished) {
        serverSessionTokenRef.current = session.sessionToken;
        const serverCells = session.board?.cells;
        if (
          Array.isArray(serverCells) &&
          (serverCells.length !== board.cells.length ||
            serverCells.some(
              (c, i) =>
                c.digit !== board.cells[i]?.digit ||
                Boolean(c.isReinforced) !== Boolean(board.cells[i]?.isReinforced)
            ))
        ) {
          setBoard(session.board);
          engineRef.current.shieldIntactOnCurrent = Boolean(serverCells[0]?.isReinforced);
        }
      }
      return session;
    });
    sessionPromiseRef.current = initPromise;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
   * Triggers the bright laser line sweep animation across all cells of a Quantum Merge!
   * For Super-Quantum tiers (> 4: PENTA, HEXA, HEPTA, OCTA), triggers a stronger pulse & board shockwave!
   */
  const triggerQuantumLaserSweep = useCallback(
    (trails: number[][], color: string, isSuper = false) => {
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
            isSuper,
          });
        }
      }

      if (isSuper && boardWrapperRef.current) {
        boardWrapperRef.current.classList.remove('board-super-quantum-flash');
        void boardWrapperRef.current.offsetWidth;
        boardWrapperRef.current.classList.add('board-super-quantum-flash');
      }

      for (const cellIdx of diamondCells) {
        const node = cellNodesRef.current[cellIdx];
        if (node) {
          node.classList.remove('quantum-diamond-pulse', 'super-quantum-cell-pulse');
          void node.offsetWidth;
          node.classList.add(isSuper ? 'super-quantum-cell-pulse' : 'quantum-diamond-pulse');
        }
      }

      if (newLines.length > 0) {
        setQuantumLasers((prev) => [...prev, ...newLines]);
        const lineIds = new Set(newLines.map((l) => l.id));
        window.setTimeout(() => {
          setQuantumLasers((prev) => prev.filter((l) => !lineIds.has(l.id)));
        }, isSuper ? 1050 : 780);
      }
    },
    []
  );

  const updateLinearShieldVisibility = useCallback(
    (newCurrentIndex: number, currentBoard: GeneratedBoard, mode: GameMode = 'LINEAR') => {
      const totalCells = mode === 'BINARY' ? BINARY_TOTAL_CELLS : TOTAL_CELLS;
      const revealDist =
        mode === 'BINARY' ? BINARY_SHIELD_REVEAL_DISTANCE : SHIELD_REVEAL_DISTANCE;
      const maxIdx = Math.min(totalCells - 1, newCurrentIndex + revealDist);
      for (let i = newCurrentIndex; i <= maxIdx; i++) {
        const cell = currentBoard.cells[i];
        if (!cell || !cell.isReinforced) continue;
        const node = cellNodesRef.current[i];
        if (!node) continue;
        const alpha = getShieldProximityAlpha(i, newCurrentIndex, revealDist);
        node.style.setProperty('--shield-alpha', String(alpha));
        if (i === newCurrentIndex) {
          node.classList.remove('shield-approaching');
        } else {
          node.classList.add('shield-approaching');
        }
      }
    },
    []
  );

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
    const availableNeighborSet = new Set<number>();
    const visitedByHead = new Map<number, ReadonlySet<number>>();
    const isInitialCellPending = eng.clearedCount === 0;

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
          availableNeighborSet.add(nIdx);
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

      const alpha2D = getOmni2DShieldAlpha(i, headIndices, availableNeighborSet);
      node.style.setProperty('--shield-alpha', String(alpha2D));
      if (alpha2D > 0 && !headSet.has(i)) {
        node.classList.add('shield-approaching');
      } else {
        node.classList.remove('shield-approaching');
      }
    }
  }, []);

  // Floating +pts / -pts popup in dynamic spectrum color inside the Score Box
  // Supports `isSuperQuantum` (> Quadruple: PENTA, HEXA, HEPTA, OCTA) for larger font & vivid neon pulse!
  const triggerDeltaPopup = useCallback(
    (deltaPoints: number, spectrumColor: string, extraTag?: string, isSuperQuantum = false) => {
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
      const nowPerf = performance.now();
      const isMajorBonus =
        isSuperQuantum ||
        Boolean(
          extraTag &&
            !extraTag.startsWith('[BIT ') &&
            !extraTag.startsWith('[SPLIT') &&
            extraTag !== 'MISS!' &&
            extraTag !== 'BIT MISS!'
        );
      if (isMajorBonus) {
        bonusPillLockUntilRef.current = nowPerf + (isSuperQuantum ? 1650 : 1200);
      }
      const shouldUpdateBadge = isMajorBonus || nowPerf >= bonusPillLockUntilRef.current;

      if (badge && shouldUpdateBadge) {
        badge.textContent = fullText;
        badge.style.color = isPositive ? spectrumColor : '#ff2a54';
        badge.style.borderColor = isPositive ? spectrumColor : '#ff2a54';
        badge.style.boxShadow = isSuperQuantum
          ? `0 0 18px ${spectrumColor}, 0 0 28px ${spectrumColor}`
          : `0 0 10px ${isPositive ? spectrumColor : 'rgba(255,42,84,0.5)'}`;
        badge.classList.remove('fading-out', 'pill-impact-pop', 'super-quantum-pill');
        void badge.offsetWidth;
        badge.classList.add('visible', 'pill-impact-pop');
        if (isSuperQuantum) {
          badge.classList.add('super-quantum-pill');
        }

        if (badgeFadeTimeoutRef.current !== null) {
          window.clearTimeout(badgeFadeTimeoutRef.current);
        }
        badgeFadeTimeoutRef.current = window.setTimeout(
          () => {
            badge.classList.add('fading-out');
          },
          isSuperQuantum ? 1750 : 1250
        );
      }

      const root = deltaPopupRootRef.current;
      if (root) {
        const popup = document.createElement('span');
        popup.className = `score-delta-popup ${isPositive ? 'pos' : 'neg'} ${
          isSuperQuantum ? 'super-quantum-popup' : ''
        }`;
        popup.textContent = fullText;
        popup.style.color = isPositive ? spectrumColor : '#ff2a54';
        popup.style.textShadow = isSuperQuantum
          ? `0 0 14px ${spectrumColor}, 0 0 24px #ffffff`
          : `0 0 10px ${isPositive ? spectrumColor : '#ff2a54'}`;
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

  // Start / Restart Game (Registers the newly generated board with the server in parallel)
  const startNewGame = useCallback(
    (overrideMode?: GameMode) => {
      const targetMode = overrideMode ?? gameMode;
      const newBoard = generateFairBoard(targetMode);
      setBoard(newBoard);
      pressedPhysicalKeysRef.current.clear();
      activeKeyDownEventMapRef.current.clear();
      telemetryEventsRef.current = [];
      serverSessionTokenRef.current = null;

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

      eng.binaryBitCursor = 0;
      eng.binaryTileFirstBitTs = 0;
      eng.binaryRowFirstBitTs = 0;
      eng.binaryOverclocks = 0;
      bonusPillLockUntilRef.current = 0;

      eng.doneMask.fill(0);
      eng.clearedCount = 0;
      eng.omniBranches = [];
      eng.omniVisualCells.clear();
      eng.quantumMerges = 0;

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
      setQuantumMergesCount(0);
      setReinforcedHitCount(0);
      setMistakesCount(0);
      setIsFinished(false);
      setHasStarted(false);
      setHasSubmittedScore(false);
      setBotAlertInfo(null);
      setUnlockedBadgesOnRun([]);
      setFatigueAlert(null);
      setNickCursor(0);
      setQuantumLasers([]);
      setBinaryBitCursor(0);
      setBinaryBitErrorSlot(null);
      setBinaryActiveTargetIdx(0);
      setConfirmDialog(null);
      setChartTick((t) => t + 1);

      if (scoreNodeRef.current) {
        scoreNodeRef.current.textContent = '0';
        scoreNodeRef.current.style.color = '#ffea00';
      }
      if (lastDeltaBadgeRef.current) {
        lastDeltaBadgeRef.current.classList.remove(
          'visible',
          'fading-out',
          'super-quantum-pill'
        );
      }
      const modeTotalCells = targetMode === 'BINARY' ? BINARY_TOTAL_CELLS : TOTAL_CELLS;
      if (progressNodeRef.current) {
        progressNodeRef.current.textContent = `0 / ${modeTotalCells}`;
      }

      // Register client board with server-authoritative session (zero board swap / flicker!)
      const startPromise = apiStartGameSession(targetMode, newBoard).then((session) => {
        if (session && !engineRef.current.isFinished) {
          serverSessionTokenRef.current = session.sessionToken;
          const serverCells = session.board?.cells;
          if (
            engineRef.current.totalKeystrokes === 0 &&
            Array.isArray(serverCells) &&
            (serverCells.length !== newBoard.cells.length ||
              serverCells.some(
                (c, i) =>
                  c.digit !== newBoard.cells[i]?.digit ||
                  Boolean(c.isReinforced) !== Boolean(newBoard.cells[i]?.isReinforced)
              ))
          ) {
            setBoard(session.board);
            engineRef.current.shieldIntactOnCurrent = Boolean(serverCells[0]?.isReinforced);
          }
        }
        return session;
      });
      sessionPromiseRef.current = startPromise;
    },
    [gameMode]
  );

  const requestRestartGame = useCallback(() => {
    if (hasStarted && !engineRef.current.isFinished) {
      setConfirmDialog({
        title: 'ABORT ACTIVE RUN?',
        message:
          'Your current run is in progress. Are you sure you want to abort and restart the board?',
        confirmLabel: 'YES, RESTART [ENTER]',
        onConfirm: () => {
          setConfirmDialog(null);
          startNewGame();
        },
      });
    } else {
      startNewGame();
    }
  }, [hasStarted, startNewGame]);
  useEffect(() => {
    if (activeTab !== 'GAME') return;
    const eng = engineRef.current;
    eng.doneMask.fill(0);
    eng.omniVisualCells.clear();

    const modeTotalCells = gameMode === 'BINARY' ? BINARY_TOTAL_CELLS : TOTAL_CELLS;
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const node = cellNodesRef.current[i];
      if (!node) continue;
      node.className = 'cell';
      node.style.setProperty('--shield-alpha', '0');
      node.style.removeProperty('--branch-color');
      node.style.removeProperty('--overlap-color-1');
      node.style.removeProperty('--overlap-color-2');
    }

    if (scoreNodeRef.current) {
      scoreNodeRef.current.textContent = eng.displayedScore.toLocaleString('en-US');
    }

    if (gameMode === 'LINEAR' || gameMode === 'BINARY') {
      eng.currentIndex = 0;
      eng.shieldIntactOnCurrent = Boolean(board.cells[0]?.isReinforced);
      eng.binaryBitCursor = 0;
      setBinaryBitCursor(0);
      setBinaryBitErrorSlot(null);
      setBinaryActiveTargetIdx(0);
      const firstNode = cellNodesRef.current[0];
      if (firstNode) firstNode.classList.add('linear-target');
      setWrapGhosts([]);
      if (progressNodeRef.current) {
        progressNodeRef.current.textContent = `0 / ${modeTotalCells}`;
      }
      updateLinearShieldVisibility(0, board, gameMode);
    } else {
      const startIdx = OMNI_CENTER_INDEX;
      eng.doneMask.fill(0);
      eng.clearedCount = 0;

      eng.omniBranches = [
        {
          headIndex: startIdx,
          trail: [startIdx],
          visitedSet: new Set([startIdx]),
          shieldCrackedOnHead: !board.cells[startIdx]?.isReinforced,
          color: OMNI_BRANCH_COLORS[0],
        },
      ];
      if (progressNodeRef.current) {
        progressNodeRef.current.textContent = `0 / ${TOTAL_CELLS}`;
      }
      syncOmniVisualState(board);
    }
  }, [board, gameMode, activeTab, updateLinearShieldVisibility, syncOmniVisualState]);

  // Submit verified keystroke trace & 3-letter nick to Server Anti-Cheat Endpoint
  const handleSaveScoreToLeaderboard = useCallback(async () => {
    if (hasSubmittedScore) return;
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const eng = engineRef.current;
    const nick = nickLetters.join('').toUpperCase();
    const totalDurationMs =
      eng.runStartTime > 0 && eng.runEndTime >= eng.runStartTime
        ? eng.runEndTime - eng.runStartTime
        : eng.sumDeltaMs;
    const totalTimeSec = Number((Math.max(0, totalDurationMs) / 1000).toFixed(2));

    setHasSubmittedScore(true);

    if (nick !== currentUser.nick) {
      apiUpdateUserSettings({ nick }).then((updatedUser) => {
        if (updatedUser) setCurrentUser(updatedUser);
      });
    }

    if (!serverSessionTokenRef.current && sessionPromiseRef.current) {
      try {
        const pendingSession = await sessionPromiseRef.current;
        if (pendingSession) {
          serverSessionTokenRef.current = pendingSession.sessionToken;
        }
      } catch {
        // ignore
      }
    }

    const usedTouchPad = telemetryEventsRef.current.some((ev) =>
      String(ev.physKeyCode || '').toLowerCase().startsWith('touchdigit')
    );
    const isMobileRun = isMobileDevice || usedTouchPad;

    // Detect browser automation / CDP / headless flags
    const isAutomatedBrowser = Boolean(
      (navigator as any).webdriver ||
      (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array ||
      (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise ||
      (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol ||
      (window as any).__puppeteer_evaluation_script__ ||
      (window as any).__playwright ||
      (window as any).__nightmare
    );

    const verifyRes = await apiFinishGameSession({
      sessionToken: serverSessionTokenRef.current,
      nick,
      events: telemetryEventsRef.current,
      isMobile: isMobileRun,
      isAutomated: isAutomatedBrowser,
    } as any);

    if (verifyRes.user) {
      setCurrentUser(verifyRes.user);
    }

    if (!verifyRes.ok && verifyRes.botDetected) {
      setBotAlertInfo({
        reason: verifyRes.error || 'Automated or synthetic input pattern detected.',
        badge: verifyRes.badgeAwarded,
      });
      return;
    }

    if (verifyRes.newBadges && verifyRes.newBadges.length > 0) {
      setUnlockedBadgesOnRun(verifyRes.newBadges);
    }

    const newEntry: LeaderboardEntry = verifyRes.entry ?? {
      id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nick,
      score: eng.score,
      mode: gameMode,
      version: CURRENT_GAME_VERSION,
      totalTimeSec,
      avgSpeedMs: avgSpeedMs ?? 0,
      mistakes: mistakesCount,
      isMobile: isMobileRun,
      date: new Date().toISOString().slice(0, 10),
      createdAtIso: new Date().toISOString(),
      username: currentUser.username,
      badges: verifyRes.user?.badges ?? currentUser.badges,
    };

    if (verifyRes.ok) {
      setIsBackendOnline(true);
    }

    appendLocalMyRun(newEntry);

    setLeaderboard((prev) => {
      const updated = [...prev, newEntry].sort((a, b) => b.score - a.score);
      saveLeaderboardToStorage(updated);
      return updated;
    });
    setActiveTab('LEADERBOARD');
  }, [hasSubmittedScore, nickLetters, gameMode, avgSpeedMs, mistakesCount, currentUser, isMobileDevice]);

  // Record every finished run locally (saved or not) and detect a 3-run downward trend within 2 hours
  useEffect(() => {
    if (!isFinished) return;
    const eng = engineRef.current;
    if (!eng.runStartTime || lastRecordedRunStartRef.current === eng.runStartTime) return;
    lastRecordedRunStartRef.current = eng.runStartTime;

    const isMobileRun =
      isMobileDevice ||
      telemetryEventsRef.current.some((ev) =>
        String(ev.physKeyCode || '').toLowerCase().startsWith('touchdigit')
      );
    const nowMs = Date.now();
    const newRecord: FinishedRunRecord = {
      score: eng.score,
      mode: gameMode,
      isMobile: isMobileRun,
      finishedAt: nowMs,
    };

    const history = [...loadFinishedRunHistory(), newRecord].slice(-FINISHED_RUN_HISTORY_LIMIT);
    saveFinishedRunHistory(history);

    const recentSameContext = history.filter(
      (r) =>
        r.mode === gameMode &&
        r.isMobile === isMobileRun &&
        nowMs - r.finishedAt <= FATIGUE_WINDOW_MS
    );
    const lastThree = recentSameContext.slice(-3);
    if (
      lastThree.length === 3 &&
      lastThree[0].score > lastThree[1].score &&
      lastThree[1].score > lastThree[2].score
    ) {
      const suggestedMode: GameMode = gameMode === 'LINEAR' ? 'OMNI' : 'LINEAR';
      setFatigueAlert({ suggestedMode, scores: lastThree.map((r) => r.score) });
    }
  }, [isFinished, gameMode, isMobileDevice]);

  const handleFatigueCooldownSwitch = (targetMode: GameMode) => {
    setFatigueAlert(null);
    setGameMode(targetMode);
    saveGameMode(targetMode);
    startNewGame(targetMode);
  };

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

  const releasePhysicalKey = useCallback((physCode: string) => {
    pressedPhysicalKeysRef.current.delete(physCode);
    const tracked = activeKeyDownEventMapRef.current.get(physCode);
    if (tracked) {
      tracked.eventRef.downUpDurationMs = Math.max(
        0,
        Math.round((performance.now() - tracked.downTime) * 100) / 100
      );
      activeKeyDownEventMapRef.current.delete(physCode);
    }
  }, []);

  const triggerDigitInput = useCallback(
    (mappedDigit: number, physCode: string, isTrusted: boolean) => {
      if (
        confirmDialog ||
        isBindingsOpen ||
        isAuthOpen ||
        isWelcomeOpen ||
        isReleaseNotesOpen ||
        activeTab !== 'GAME'
      ) {
        return;
      }

      if (gameMode === 'BINARY' && mappedDigit !== 0 && mappedDigit !== 1) return;

      const eng = engineRef.current;
      if (eng.isFinished) return;

      const now = Math.round(performance.now() * 100) / 100;

      // Record keystroke telemetry event for server-side replay & anti-bot sentinel
      // Initialize downUpDurationMs to -1 until keyup/pointerup fires so un-released keys never fake constant dwell time
      const telemetryEv: KeystrokeTelemetryEvent = {
        digit: mappedDigit,
        clientTs: now,
        downUpDurationMs: -1,
        isTrusted: Boolean(isTrusted),
        physKeyCode: physCode,
      };
      telemetryEventsRef.current.push(telemetryEv);
      activeKeyDownEventMapRef.current.set(physCode, {
        eventRef: telemetryEv,
        downTime: now,
      });

      // ======================================================================
      // MODE C: BINARY (8x8 Matrix, Digits 0-7, 3-Bit Binary Input [4][2][1])
      // ======================================================================
      if (gameMode === 'BINARY') {
        const idx = eng.currentIndex;
        const currentCell = board.cells[idx];
        const currentNode = cellNodesRef.current[idx];
        if (!currentCell) return;

        const targetDigit = currentCell.digit;
        const bitCursor = eng.binaryBitCursor;
        const expectedBit = (targetDigit >> (2 - bitCursor)) & 1;

        if (mappedDigit === expectedBit) {
          if (eng.runStartTime === 0) eng.runStartTime = now;
          setHasStarted(true);
          setBinaryBitErrorSlot(null);

          const delta =
            eng.lastKeystrokeTime === 0
              ? 240
              : Math.max(15, now - eng.lastKeystrokeTime);
          const clampedDelta = Math.max(MIN_DELTA_MS, delta);
          const speedBonus =
            delta < MAX_BONUS_DELTA_MS ? Math.round(2800 / clampedDelta) : 0;

          if (bitCursor === 0) {
            eng.binaryTileFirstBitTs = now;
            if (
              idx % BINARY_COLS === 0 &&
              (!currentCell.isReinforced || eng.shieldIntactOnCurrent)
            ) {
              eng.binaryRowFirstBitTs = now;
            }
          }

          eng.lastKeystrokeTime = now;
          eng.totalKeystrokes += 1;
          eng.sumDeltaMs += delta;

          const currentKps = 1000 / Math.max(40, delta);
          if (currentKps > eng.peakKps) {
            eng.peakKps = currentKps;
            setPeakKps(currentKps);
          }

          if (bitCursor < 2) {
            const nextBitCursor = bitCursor + 1;
            eng.binaryBitCursor = nextBitCursor;
            setBinaryBitCursor(nextBitCursor);

            const stepPoints = BASE_POINTS + speedBonus;
            eng.score += stepPoints;

            const intensity = computePointIntensity(stepPoints, clampedDelta);
            const specColor = getSpectrumColor(intensity);
            if (scoreNodeRef.current) {
              scoreNodeRef.current.style.color = specColor;
            }
            triggerDeltaPopup(stepPoints, specColor, `[BIT ${nextBitCursor}/3]`);

            const roundedDelta = Math.round(delta);
            setLastSpeedMs(roundedDelta);
            setAvgSpeedMs(Math.round(eng.sumDeltaMs / eng.totalKeystrokes));
            return;
          }

          // All 3 bits (MSB -> LSB) of the current tile have been decoded!
          eng.binaryBitCursor = 0;
          setBinaryBitCursor(0);

          if (currentCell.isReinforced && eng.shieldIntactOnCurrent) {
            eng.shieldIntactOnCurrent = false;
            const shieldBreakPoints = BASE_POINTS + speedBonus;
            eng.score += shieldBreakPoints;

            const intensity = computePointIntensity(shieldBreakPoints, clampedDelta);
            const specColor = getSpectrumColor(intensity);
            if (currentNode) {
              currentNode.classList.remove('shield-approaching', 'error');
              currentNode.style.setProperty('--shield-alpha', '1');
              currentNode.classList.add('shield-cracked');
            }
            triggerDeltaPopup(shieldBreakPoints, specColor, '[3-BIT SHIELD CRACKED!]');
            const roundedDelta = Math.round(delta);
            setLastSpeedMs(roundedDelta);
            setAvgSpeedMs(Math.round(eng.sumDeltaMs / eng.totalKeystrokes));
            return;
          }

          const isSecondShieldHit = currentCell.isReinforced && !eng.shieldIntactOnCurrent;
          const multiplier = isSecondShieldHit ? 2 : 1;
          let pointsGained = (BASE_POINTS + speedBonus) * multiplier;

          if (isSecondShieldHit) {
            eng.reinforcedHit += 1;
            setReinforcedHitCount(eng.reinforcedHit);
          }

          const tileDurationMs = Math.max(1, now - eng.binaryTileFirstBitTs);
          const avgTileBitDelta = tileDurationMs / 2.0;

          const overclockTags: string[] = [];
          let isSuperOverclock = false;

          // 1. PURE SIGNAL BURST (+220 pts): uniform 000 (0) or 111 (7) decoded at high speed
          if ((targetDigit === 0 || targetDigit === 7) && avgTileBitDelta <= 320) {
            pointsGained += 220;
            eng.binaryOverclocks += 1;
            overclockTags.push('PURE SIGNAL');
            isSuperOverclock = true;
          }

          // 2. XOR-7 COMPLEMENT OVERCLOCK (+450 pts): consecutive tiles are bitwise NOT complements (prev ^ curr == 7)
          if (
            idx > 0 &&
            (board.cells[idx - 1].digit ^ targetDigit) === 7 &&
            avgTileBitDelta <= 420
          ) {
            pointsGained += 450;
            eng.binaryOverclocks += 1;
            overclockTags.push('XOR-7 FLIP');
            isSuperOverclock = true;
          }

          // 3. ROW REGISTER FLUSH (+650 pts): completing an 8-tile row register at high speed
          if (idx % BINARY_COLS === BINARY_COLS - 1) {
            const rowAvgBitDelta =
              Math.max(1, now - eng.binaryRowFirstBitTs) / (BINARY_COLS * 3 - 1);
            if (rowAvgBitDelta <= 380) {
              pointsGained += 650;
              eng.binaryOverclocks += 1;
              overclockTags.push('ROW FLUSH');
              isSuperOverclock = true;
            }
          }

          setSequencesHitCount(eng.binaryOverclocks);
          eng.score += pointsGained;

          const intensity = computePointIntensity(pointsGained, clampedDelta);
          const specColor = isSuperOverclock ? '#00ff9d' : getSpectrumColor(intensity);
          if (scoreNodeRef.current) {
            scoreNodeRef.current.style.color = specColor;
          }

          let tag = '';
          if (overclockTags.length > 0) {
            tag = `[${overclockTags.join(' + ')}]`;
          } else if (isSecondShieldHit) {
            tag = '[SHIELD 2X!]';
          }

          triggerDeltaPopup(pointsGained, specColor, tag || undefined, isSuperOverclock);

          if (currentNode) {
            currentNode.classList.remove(
              'active',
              'linear-target',
              'error',
              'shield-cracked',
              'shield-approaching'
            );
            currentNode.style.setProperty('--shield-alpha', '0');
            currentNode.classList.add('done');
          }

          const nextIndex = idx + 1;
          eng.currentIndex = nextIndex;
          setBinaryActiveTargetIdx(nextIndex);

          if (progressNodeRef.current) {
            progressNodeRef.current.textContent = `${nextIndex} / ${BINARY_TOTAL_CELLS}`;
          }

          if (nextIndex < BINARY_TOTAL_CELLS) {
            const nextCell = board.cells[nextIndex];
            eng.shieldIntactOnCurrent = nextCell.isReinforced;
            const nextNode = cellNodesRef.current[nextIndex];
            if (nextNode) {
              nextNode.classList.remove('shield-approaching');
              nextNode.classList.add('linear-target');
            }
            updateLinearShieldVisibility(nextIndex, board, 'BINARY');
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
            sequenceName: overclockTags.length > 0 ? overclockTags[0] : undefined,
          });

          setLastSpeedMs(roundedDelta);
          setAvgSpeedMs(Math.round(eng.sumDeltaMs / eng.totalKeystrokes));
          setChartTick((t) => t + 1);
          return;
        } else {
          // Bit mistake in BINARY mode: do NOT clear already-entered bits in the 3-bit register!
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
          setBinaryBitErrorSlot(bitCursor);

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

          triggerDeltaPopup(-penalty, '#ff2a54', 'BIT MISS!');
          return;
        }
      }

      // ======================================================================
      // MODE A: OMNI-8 (v0.0.2: No Sequences, Path-Length Quantum Bonus + Penta/Hexa/Hepta/Octa)
      // ======================================================================
      if (gameMode === 'OMNI') {
        const delta =
          eng.lastKeystrokeTime === 0
            ? 240
            : Math.max(15, now - eng.lastKeystrokeTime);
        const clampedDelta = Math.max(MIN_DELTA_MS, delta);
        const speedBonus =
          delta < MAX_BONUS_DELTA_MS ? Math.round(2800 / clampedDelta) : 0;

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

        const nextBranches: OmniBranch[] = [];
        let completedShield2xOnStep = false;

        for (let b = 0; b < eng.omniBranches.length; b++) {
          const br = eng.omniBranches[b];
          const headCell = board.cells[br.headIndex];

          if (headCell.isReinforced && !br.shieldCrackedOnHead) {
            if (headCell.digit === mappedDigit) {
              completedShield2xOnStep = true;
              nextBranches.push({
                ...br,
                shieldCrackedOnHead: true,
              });
            }
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
        // QUANTUM MERGE + PATH-LENGTH PROPORTIONAL BONUS + PENTA/HEXA/HEPTA/OCTA
        // ====================================================================
        const groupsByHead = new Map<number, OmniBranch[]>();
        for (const cand of nextBranches) {
          const list = groupsByHead.get(cand.headIndex) || [];
          list.push(cand);
          groupsByHead.set(cand.headIndex, list);
        }

        let deduplicated: OmniBranch[] = [];
        let maxQuantumMergeCount = 0;
        let maxQuantumMergedPathSteps = 0;
        const quantumLaserTrails: number[][] = [];

        for (const [headIdx, group] of groupsByHead.entries()) {
          if (group.length === 1) {
            deduplicated.push(group[0]);
          } else {
            const mCount = group.length;
            const mergedPathSteps = group.reduce(
              (acc, g) => acc + Math.max(1, g.trail.length - 1),
              0
            );
            if (
              mCount > maxQuantumMergeCount ||
              (mCount === maxQuantumMergeCount && mergedPathSteps > maxQuantumMergedPathSteps)
            ) {
              maxQuantumMergeCount = mCount;
              maxQuantumMergedPathSteps = mergedPathSteps;
            }

            const mergedVisited = new Set<number>();
            const headNeedsSecondHit =
              board.cells[headIdx].isReinforced &&
              group.some((g) => !g.shieldCrackedOnHead);

            for (const g of group) {
              quantumLaserTrails.push([...g.trail]);
              for (const v of g.visitedSet) {
                mergedVisited.add(v);
              }
              for (const tIdx of g.trail) {
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
          }
        }

        for (const br of deduplicated) {
          const headNeedsSecondHit =
            board.cells[br.headIndex].isReinforced && !br.shieldCrackedOnHead;
          let uncommittedCleared = 0;
          for (const tIdx of br.trail) {
            if (tIdx === br.headIndex && headNeedsSecondHit) continue;
            if (eng.doneMask[tIdx] === 0) {
              uncommittedCleared += 1;
            }
          }
          if (eng.clearedCount + uncommittedCleared >= TOTAL_CELLS && !headNeedsSecondHit) {
            deduplicated = [br];
            break;
          }
        }

        if (deduplicated.length > 12) {
          deduplicated = deduplicated.slice(0, 12);
        }

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
          const resolvedSets = deduplicated.map((br) => {
            const headNeedsSecondHit =
              board.cells[br.headIndex].isReinforced && !br.shieldCrackedOnHead;
            const resolved = new Set<number>();
            const limit = headNeedsSecondHit ? br.trail.length - 1 : br.trail.length;
            for (let i = 0; i < limit; i++) {
              resolved.add(br.trail[i]);
            }
            return resolved;
          });

          const firstResolved = resolvedSets[0];
          const universallyResolved = new Set<number>();
          for (const candidateCell of firstResolved) {
            if (resolvedSets.every((s) => s.has(candidateCell))) {
              universallyResolved.add(candidateCell);
              if (eng.doneMask[candidateCell] === 0) {
                eng.doneMask[candidateCell] = 1;
                eng.clearedCount += 1;
                const cNode = cellNodesRef.current[candidateCell];
                if (cNode) {
                  cNode.className = 'cell done';
                  cNode.style.setProperty('--shield-alpha', '0');
                }
              }
            }
          }

          if (universallyResolved.size > 0) {
            for (const br of deduplicated) {
              const remainingTrail = br.trail.filter(
                (cIdx) => !universallyResolved.has(cIdx) || cIdx === br.headIndex
              );
              br.trail = remainingTrail.length > 0 ? remainingTrail : [br.headIndex];
              br.visitedSet = new Set(br.trail);
            }
          }
        }

        assignDistinctBranchColors(deduplicated);
        eng.omniBranches = deduplicated;
        setHasStarted(true);

        const multiplier = completedShield2xOnStep ? 2 : 1;
        let pointsGained = (BASE_POINTS + speedBonus) * multiplier;
        if (completedShield2xOnStep) {
          eng.reinforcedHit += 1;
          setReinforcedHitCount(eng.reinforcedHit);
        }

        let quantumTitle: string | undefined;
        let isSuperQuantum = false;
        let quantumColorOverride: string | undefined;

        if (maxQuantumMergeCount >= 2) {
          const qInfo = getQuantumMergeTierInfo(
            maxQuantumMergeCount,
            maxQuantumMergedPathSteps
          );
          quantumTitle = `${qInfo.title} +${qInfo.pathBonus} PATH`;
          isSuperQuantum = qInfo.isSuper;
          quantumColorOverride = qInfo.color;
          pointsGained += qInfo.totalBonus;
          eng.quantumMerges += 1;
          setQuantumMergesCount(eng.quantumMerges);
          triggerQuantumLaserSweep(quantumLaserTrails, qInfo.color, qInfo.isSuper);
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
        const specColor = quantumColorOverride || getSpectrumColor(intensity);
        if (scoreNodeRef.current) {
          scoreNodeRef.current.style.color = specColor;
        }

        const anyUncrackedShieldNow = deduplicated.some(
          (br) => board.cells[br.headIndex].isReinforced && !br.shieldCrackedOnHead
        );

        let tag = '';
        if (quantumTitle) {
          tag = `[${quantumTitle}]`;
        } else if (completedShield2xOnStep) {
          tag = '[SHIELD 2X!]';
        } else if (anyUncrackedShieldNow) {
          tag = '[CRACKED!]';
        } else if (deduplicated.length > 1) {
          tag = `[SPLIT x${deduplicated.length}]`;
        }

        triggerDeltaPopup(pointsGained, specColor, tag || undefined, isSuperQuantum);

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
          isReinforced2x: completedShield2xOnStep,
          sequenceName: quantumTitle,
        });

        setLastSpeedMs(roundedDelta);
        setAvgSpeedMs(Math.round(eng.sumDeltaMs / eng.totalKeystrokes));
        setChartTick((t) => t + 1);
        return;
      }

      // ======================================================================
      // MODE B: LINEAR (v0.0.2: Shield-in-Sequence 2X Sequence Bonus + Persistent Sequence Highlight)
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
        const isCellInsideSequence = currentCell.sequenceInstanceId !== null;

        // v0.0.2 Rule: In LINEAR mode, if a shield is inside a secret sequence,
        // it does NOT multiply the single tile's time-delta points by 2X;
        // instead, completing that sequence multiplies the ENTIRE SEQUENCE BONUS by 2X!
        const multiplier = isSecondShieldHit && !isCellInsideSequence ? 2 : 1;
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
        let completedSequenceWasDoubled = false;

        if (currentCell.isSequenceEnd && currentCell.sequenceInstanceId !== null) {
          const seqInst = board.sequences.find(
            (s) => s.instanceId === currentCell.sequenceInstanceId
          );
          if (seqInst) {
            const firstIdx = seqInst.startIndex;
            const startTime = eng.cellFirstHitTimestamps[firstIdx];
            const totalDurationMs = Math.max(1, now - startTime);
            const shieldCellsInSeq = seqInst.cellIndices.filter(
              (cIdx) => board.cells[cIdx].isReinforced
            ).length;

            // Count all keystroke transitions inside the sequence (including shield double-taps)
            // plus a +35ms grace buffer per shield so a shield inside a sequence never breaks completion!
            const stepsCount = Math.max(
              1,
              seqInst.pattern.digits.length - 1 + shieldCellsInSeq
            );
            const avgSeqDelta = totalDurationMs / stepsCount;
            const allowedMaxDelta = seqInst.pattern.maxAvgDeltaMs + shieldCellsInSeq * 35;

            if (avgSeqDelta <= allowedMaxDelta) {
              const seqMultiplier = shieldCellsInSeq > 0 ? 2 : 1;
              const seqBonus = seqInst.pattern.bonusPoints * seqMultiplier;
              pointsGained += seqBonus;
              completedSequenceName = seqInst.pattern.name;
              completedSequenceWasDoubled = seqMultiplier === 2;
              eng.sequencesHit += 1;
              setSequencesHitCount(eng.sequencesHit);

              if (seqInst.pattern.isPhiEasterEgg && boardWrapperRef.current) {
                boardWrapperRef.current.classList.remove('phi-golden-flash');
                void boardWrapperRef.current.offsetWidth;
                boardWrapperRef.current.classList.add('phi-golden-flash');
              }

              // Jump animation + persistent highlight on all cells of the completed sequence!
              for (const sIdx of seqInst.cellIndices) {
                const sNode = cellNodesRef.current[sIdx];
                if (sNode) {
                  sNode.classList.add(
                    seqInst.pattern.isPhiEasterEgg
                      ? 'seq-completed-phi'
                      : 'seq-completed-pulse',
                    seqInst.pattern.isPhiEasterEgg
                      ? 'seq-completed-phi-cell'
                      : 'seq-completed-cell'
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
        if (completedSequenceName && completedSequenceWasDoubled) {
          tag = `[2X SEQ: ${completedSequenceName}!]`;
        } else if (completedSequenceName) {
          tag = `[${completedSequenceName}]`;
        } else if (isSecondShieldHit && !isCellInsideSequence) {
          tag = '[SHIELD 2X!]';
        } else if (isSecondShieldHit && isCellInsideSequence) {
          tag = '[SEQ SHIELD ARMED 2X!]';
        }

        triggerDeltaPopup(
          pointsGained,
          specColor,
          tag || undefined,
          completedSequenceWasDoubled
        );

        if (currentNode) {
          currentNode.classList.remove(
            'active',
            'linear-target',
            'error',
            'shield-cracked',
            'shield-approaching'
          );
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
            nextNode.classList.add('linear-target');
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
          isReinforced2x: isSecondShieldHit || completedSequenceWasDoubled,
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
    },
    [
      board,
      gameMode,
      activeTab,
      confirmDialog,
      isBindingsOpen,
      isAuthOpen,
      isWelcomeOpen,
      isReleaseNotesOpen,
      triggerBoardErrorFlash,
      triggerQuantumLaserSweep,
      triggerDeltaPopup,
      updateLinearShieldVisibility,
      syncOmniVisualState,
    ]
  );

  // Zero-Lag Global Keydown + Keyup Engine with Anti-Bot Dwell Telemetry
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      const physCode = e.code || e.key.toLowerCase();
      releasePhysicalKey(physCode);
    };

    const handleWindowBlur = () => {
      pressedPhysicalKeysRef.current.clear();
      activeKeyDownEventMapRef.current.clear();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (confirmDialog) {
        if (e.key === 'Enter' || e.key.toLowerCase() === 'y') {
          e.preventDefault();
          confirmDialog.onConfirm();
        } else if (e.key === 'Escape' || e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setConfirmDialog(null);
        }
        return;
      }

      if (
        isBindingsOpen ||
        isAuthOpen ||
        isWelcomeOpen ||
        isReleaseNotesOpen ||
        activeTab !== 'GAME'
      ) {
        return;
      }

      if (engineRef.current.isFinished && !hasSubmittedScore) {
        if (e.key === 'Escape') {
          e.preventDefault();
          startNewGame();
          return;
        }
        if (!currentUser) {
          if (e.key === 'Enter') {
            e.preventDefault();
            setIsAuthOpen(true);
          }
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
        requestRestartGame();
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
      triggerDigitInput(mappedDigit, physCode, Boolean(e.isTrusted));
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
    confirmDialog,
    isBindingsOpen,
    isAuthOpen,
    isWelcomeOpen,
    isReleaseNotesOpen,
    activeTab,
    currentUser,
    hasSubmittedScore,
    nickCursor,
    startNewGame,
    requestRestartGame,
    handleSaveScoreToLeaderboard,
    triggerDigitInput,
    releasePhysicalKey,
  ]);

  const handleSaveSettings = (newBindings: KeyBindingsMap, newMode: GameMode) => {
    const cleanBindings = sanitizeKeyBindings(newBindings);
    setBindings(cleanBindings);
    saveKeyBindings(cleanBindings);
    if (currentUser) {
      apiUpdateUserSettings({
        keyBindings: cleanBindings,
      }).then((updatedUser) => {
        if (updatedUser) setCurrentUser(updatedUser);
      });
    }
    if (newMode !== gameMode) {
      const modeLabel =
        newMode === 'OMNI' ? 'OMNI-8' : newMode === 'BINARY' ? 'BINARY (8x8)' : 'LINEAR';
      if (hasStarted && !engineRef.current.isFinished) {
        setConfirmDialog({
          title: 'SWITCH GAME MODE?',
          message: `Your current run is in progress. Switch mode to ${modeLabel} and abort your active run?`,
          confirmLabel: `SWITCH TO ${modeLabel} [ENTER]`,
          onConfirm: () => {
            setConfirmDialog(null);
            setGameMode(newMode);
            saveGameMode(newMode);
            startNewGame(newMode);
          },
        });
      } else {
        setGameMode(newMode);
        saveGameMode(newMode);
        startNewGame(newMode);
      }
    }
  };

  const handleQuickToggleMode = () => {
    const nextMode: GameMode =
      gameMode === 'LINEAR' ? 'OMNI' : gameMode === 'OMNI' ? 'BINARY' : 'LINEAR';
    const modeLabel =
      nextMode === 'OMNI' ? 'OMNI-8' : nextMode === 'BINARY' ? 'BINARY (8x8)' : 'LINEAR';
    if (hasStarted && !engineRef.current.isFinished) {
      setConfirmDialog({
        title: 'SWITCH GAME MODE?',
        message: `Your current run is in progress. Switch mode to ${modeLabel} and abort your active run?`,
        confirmLabel: `SWITCH TO ${modeLabel} [ENTER]`,
        onConfirm: () => {
          setConfirmDialog(null);
          setGameMode(nextMode);
          saveGameMode(nextMode);
          startNewGame(nextMode);
        },
      });
      return;
    }
    setGameMode(nextMode);
    saveGameMode(nextMode);
    startNewGame(nextMode);
  };

  const handleRequestOpenLeaderboard = () => {
    if (hasStarted && !engineRef.current.isFinished) {
      setConfirmDialog({
        title: 'LEAVE ACTIVE RUN?',
        message:
          'Your current run is in progress. Opening the Leaderboard will abort this run. Continue?',
        confirmLabel: 'OPEN LEADERBOARD [ENTER]',
        onConfirm: () => {
          setConfirmDialog(null);
          startNewGame();
          refreshLeaderboard();
          setActiveTab('LEADERBOARD');
        },
      });
      return;
    }
    refreshLeaderboard();
    setActiveTab('LEADERBOARD');
  };

  const handleMobilePadDown = (digit: number, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const physCode = `TouchDigit${digit}`;
    if (pressedPhysicalKeysRef.current.has(physCode)) return;
    pressedPhysicalKeysRef.current.add(physCode);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {
        // ignore
      }
    }
    triggerDigitInput(digit, physCode, Boolean(e.isTrusted));
  };

  const handleMobilePadUp = (digit: number) => {
    const physCode = `TouchDigit${digit}`;
    releasePhysicalKey(physCode);
  };

  return (
    <div className={`app-shell ${isMobileDevice ? 'is-mobile-shell' : ''}`}>
      {activeTab === 'LEADERBOARD' ? (
        <LeaderboardView
          entries={leaderboard}
          defaultMode={gameMode}
          defaultIsMobile={isMobileDevice}
          currentUser={currentUser}
          isBackendOnline={isBackendOnline}
          onRefresh={refreshLeaderboard}
          onOpenAuth={() => setIsAuthOpen(true)}
          onBackToGame={() => setActiveTab('GAME')}
        />
      ) : (
        <main className="main-workspace">
          <section ref={boardWrapperRef} className="board-section">
            <div className="board-grid-stage">
              {/* QUANTUM MERGE LASER LINE OVERLAY */}
              {quantumLasers.length > 0 && (
                <svg
                  className="quantum-laser-svg"
                  viewBox={`0 0 ${COLS * 38 - 2} ${ROWS * 32 - 2}`}
                  aria-hidden="true"
                >
                  {quantumLasers.map((line) => (
                    <g key={line.id}>
                      <polyline
                        className={`quantum-laser-glow ${line.isSuper ? 'super-laser-glow' : ''}`}
                        points={line.pointsAttr}
                        pathLength={100}
                        style={{ stroke: line.color }}
                      />
                      <polyline
                        className={`quantum-laser-core ${line.isSuper ? 'super-laser-core' : ''}`}
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

              {gameMode === 'BINARY' ? (
                <div className="binary-stage-layout">
                  {/* ROW 1, COL 1: SPACER ABOVE DECODER TABLE */}
                  <div className="binary-grid-spacer" />

                  {/* ROW 1, COL 2: COMPACT 3-BIT INPUT SLOTS ABOVE THE 7x7 MATRIX */}
                  <div className="binary-bit-slots">
                    {[0, 1, 2].map((slotIdx) => {
                      const targetCell = board.cells[binaryActiveTargetIdx];
                      const targetDigit = targetCell ? targetCell.digit : 0;
                      const isFilled = slotIdx < binaryBitCursor;
                      const isCurrentSlot = slotIdx === binaryBitCursor && !isFinished;
                      const isErrorSlot = binaryBitErrorSlot === slotIdx;
                      const filledBitVal = (targetDigit >> (2 - slotIdx)) & 1;

                      return (
                        <div
                          key={slotIdx}
                          className={`binary-bit-box ${isFilled ? 'filled' : ''} ${
                            isCurrentSlot ? 'active-slot' : ''
                          } ${isErrorSlot ? 'bit-error' : ''}`}
                        >
                          <span className="bit-slot-value">
                            {isFilled ? filledBitVal : '_'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ROW 2, COL 1: 0-7 BINARY REFERENCE TABLE (FLUSH TOP & BOTTOM WITH 7x7 MATRIX, NO ACTIVE HIGHLIGHT) */}
                  <aside className="binary-reference-panel">
                    <table className="binary-decoder-table">
                      <thead>
                        <tr>
                          <th>DEC</th>
                          <th>BIN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => {
                          const bStr = d.toString(2).padStart(3, '0');
                          return (
                            <tr key={d}>
                              <td className="ref-dec-col">{d}</td>
                              <td className="ref-bin-col">{bStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </aside>

                  {/* ROW 2, COL 2: TIGHT 8x8 MATRIX */}
                  <div className="board-grid-8x8">
                    {board.cells.map((cell, idx) => (
                      <div
                        key={idx}
                        ref={(el) => {
                          cellNodesRef.current[idx] = el;
                        }}
                        className="cell binary-cell"
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
              ) : (
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
              )}
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
                    | Avg Pace: {avgSpeedMs ?? '--'} ms/key | Mistakes: {mistakesCount} |{' '}
                    {gameMode === 'OMNI'
                      ? `Quantum Merges: ${quantumMergesCount}`
                      : gameMode === 'BINARY'
                      ? `Overclock Bonuses: ${sequencesHitCount}`
                      : `Secret Sequences: ${sequencesHitCount}/${board.sequences.length}`}
                  </p>

                  {fatigueAlert && (
                    <div className="fatigue-alert-card">
                      <OverheatedSynapseIcon />
                      <div className="fatigue-alert-body">
                        <h3 className="fatigue-alert-title">
                          BIOMETRIC SENTINEL // AXONAL PACKET DESYNC
                        </h3>
                        <p className="fatigue-alert-desc">
                          Downward performance gradient across your last 3 runs (&lt;120 min).
                          Repetitive dopamine-loop saturation has triggered prefrontal thermal
                          throttling and elevated neuromuscular jitter. Switch protocol to{' '}
                          {fatigueAlert.suggestedMode === 'OMNI' ? 'OMNI-8' : 'LINEAR'} to reset
                          synaptic impedance.
                        </p>
                        <span className="fatigue-alert-trace">
                          TRACE: {fatigueAlert.scores.map((s) => s.toLocaleString('en-US')).join(' > ')}
                        </span>
                        <button
                          type="button"
                          className="btn-arcade small fatigue-cooldown-btn"
                          onClick={() => handleFatigueCooldownSwitch(fatigueAlert.suggestedMode)}
                        >
                          COOLDOWN IN{' '}
                          {fatigueAlert.suggestedMode === 'OMNI' ? 'OMNI-8' : 'LINEAR'}
                        </button>
                      </div>
                    </div>
                  )}

                  {botAlertInfo ? (
                    <div className="bot-alert-card">
                      <BadgeIcon code="BOT_DETECTED" size={56} />
                      <h3 className="bot-alert-title">ANTI-CHEAT SENTINEL // AUTOMATON FLAGGED</h3>
                      <p className="bot-alert-desc">{botAlertInfo.reason}</p>
                      <span className="bot-alert-badge-note">
                        BADGE ASSIGNED TO PROFILE: SUSPECTED AUTOMATON
                      </span>
                    </div>
                  ) : !hasSubmittedScore ? (
                    currentUser ? (
                      <div className="nick-entry-box">
                        <span className="nick-prompt">
                          PILOT [{currentUser.username}] // 3-LETTER INITIALS:
                        </span>
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
                          VERIFY &amp; SAVE TO LEADERBOARD [ENTER]
                        </button>
                      </div>
                    ) : (
                      <div className="nick-entry-box">
                        <span className="nick-prompt">
                          ACCOUNT REQUIRED TO SAVE SCORE TO LEADERBOARD
                        </span>
                        <p className="victory-stats">
                          Create an account or log in now to record this run in the global ranking
                          and your personal Hall of Fame. Without logging in, this score will not be
                          saved.
                        </p>
                        <button
                          type="button"
                          className="btn-arcade gold"
                          onClick={() => setIsAuthOpen(true)}
                        >
                          LOGIN / REGISTER TO SAVE SCORE [ENTER]
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="saved-score-box">
                      <p className="nick-saved-msg">SCORE VERIFIED &amp; SAVED TO LEADERBOARD!</p>
                      {unlockedBadgesOnRun.length > 0 && (
                        <div className="unlocked-badges-toast">
                          <span>NEW BADGE UNLOCKED:</span>
                          {unlockedBadgesOnRun.map((b) => (
                            <div key={b.code} className="unlocked-badge-item">
                              <BadgeIcon code={b.code} size={32} />
                              <strong>{b.title}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

          {/* RIGHT COLUMN (DESKTOP) / TOP HUD (MOBILE): HEADER BOX + SCORE & KPI BOX */}
          <SpeedChartPanel
            gameMode={gameMode}
            hasStarted={hasStarted}
            currentUser={currentUser}
            progressNodeRef={progressNodeRef}
            onQuickToggleMode={handleQuickToggleMode}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenLeaderboard={handleRequestOpenLeaderboard}
            onOpenSettings={() => setIsBindingsOpen(true)}
            onOpenHelp={() => setIsWelcomeOpen(true)}
            onOpenReleaseNotes={() => setIsReleaseNotesOpen(true)}
            onRestart={requestRestartGame}
            scoreNodeRef={scoreNodeRef}
            lastDeltaBadgeRef={lastDeltaBadgeRef}
            deltaPopupRootRef={deltaPopupRootRef}
            lastSpeedMs={lastSpeedMs}
            avgSpeedMs={avgSpeedMs}
            peakKps={peakKps}
            mistakesCount={mistakesCount}
            sequencesHitCount={sequencesHitCount}
            totalSequencesCount={board.sequences.length}
            quantumMergesCount={quantumMergesCount}
            reinforcedHitCount={reinforcedHitCount}
            totalReinforcedCount={board.totalReinforcedCount}
          />

          {/* VERTICAL MOBILE TOUCH CONTROLLER (CYBER-NUMPAD AT BOTTOM OF PORTRAIT SCREEN) */}
          <section className="mobile-cyber-numpad" aria-label="Touch Digit Controller">
            {gameMode === 'BINARY' ? (
              <div className="mobile-binary-dual-pad">
                {[0, 1].map((bitVal) => (
                  <button
                    key={bitVal}
                    type="button"
                    className={`mobile-pad-btn binary-pad-btn bit-${bitVal}`}
                    onPointerDown={(e) => handleMobilePadDown(bitVal, e)}
                    onPointerUp={() => handleMobilePadUp(bitVal)}
                    onPointerCancel={() => handleMobilePadUp(bitVal)}
                    onPointerLeave={() => handleMobilePadUp(bitVal)}
                  >
                    <span className="mobile-pad-digit">{bitVal}</span>
                    <span className="mobile-pad-sub">BIT {bitVal}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="mobile-numpad-bar">
                  <span className="mobile-numpad-title">CYBER-NUMPAD // 0MS TOUCH</span>
                  <button
                    type="button"
                    className="mobile-layout-toggle-btn"
                    onClick={() =>
                      setMobileNumpadLayout((prev) => (prev === '2x5' ? '3x4' : '2x5'))
                    }
                  >
                    GRID: {mobileNumpadLayout === '2x5' ? '2x5 SPLIT' : '3x4 NUMPAD'}
                  </button>
                </div>
                {mobileNumpadLayout === '2x5' ? (
                  <div className="mobile-numpad-grid layout-2x5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="mobile-pad-btn"
                        onPointerDown={(e) => handleMobilePadDown(d, e)}
                        onPointerUp={() => handleMobilePadUp(d)}
                        onPointerCancel={() => handleMobilePadUp(d)}
                        onPointerLeave={() => handleMobilePadUp(d)}
                      >
                        <span className="mobile-pad-digit">{d}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mobile-numpad-grid layout-3x4">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`mobile-pad-btn ${d === 0 ? 'zero-wide-btn' : ''}`}
                        onPointerDown={(e) => handleMobilePadDown(d, e)}
                        onPointerUp={() => handleMobilePadUp(d)}
                        onPointerCancel={() => handleMobilePadUp(d)}
                        onPointerLeave={() => handleMobilePadUp(d)}
                      >
                        <span className="mobile-pad-digit">{d}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      )}

      {/* BARELY VISIBLE COPYRIGHT FOOTER AT THE VERY BOTTOM */}
      <footer className="subtle-copyright-footer">
        &copy; {new Date().getFullYear()} FIGRID v{CURRENT_GAME_VERSION}
      </footer>

      {/* WELCOME / HOW-TO-PLAY GUIDE MODAL (OPENS ONCE FOR NEW USERS OR VIA '?' BUTTON) */}
      <WelcomeGuideModal isOpen={isWelcomeOpen} onClose={handleCloseWelcome} />

      {/* RELEASE NOTES v0.0.2 MODAL (WITH GRAPHICAL BADGE & SCORING PREVIEWS) */}
      <ReleaseNotesModal isOpen={isReleaseNotesOpen} onClose={handleCloseReleaseNotes} />

      {/* SETTINGS & KEYBINDINGS MODAL */}
      <KeyBindingsModal
        isOpen={isBindingsOpen}
        bindings={bindings}
        gameMode={gameMode}
        isModeLocked={hasStarted}
        onSave={handleSaveSettings}
        onClose={() => setIsBindingsOpen(false)}
      />

      {/* CONFIRMATION DIALOG FOR RESTART / MODE SWITCH / LEAVE DURING ACTIVE RUN */}
      {confirmDialog && (
        <div className="modal-backdrop" onClick={() => setConfirmDialog(null)}>
          <div
            className="modal-box badge-inspect-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{confirmDialog.title}</h2>
              <button
                type="button"
                className="btn-close"
                onClick={() => setConfirmDialog(null)}
              >
                X
              </button>
            </div>
            <div className="badge-inspect-body">
              <p className="badge-inspect-desc">{confirmDialog.message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-arcade"
                onClick={() => setConfirmDialog(null)}
              >
                CANCEL [ESC]
              </button>
              <button
                type="button"
                className="btn-arcade gold"
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PILOT LOGIN / REGISTER / CLOUD SYNC & BADGES MODAL */}
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
