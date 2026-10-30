import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TOTAL_CELLS,
  OMNI_CENTER_INDEX,
  SHIELD_REVEAL_DISTANCE,
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
}

export const App: React.FC = () => {
  const [board, setBoard] = useState<GeneratedBoard>(() => generateFairBoard());
  const [bindings, setBindings] = useState<KeyBindingsMap>(() => loadKeyBindings());
  const [gameMode, setGameMode] = useState<GameMode>(() => loadGameMode());
  const [activeTab, setActiveTab] = useState<'GAME' | 'LEADERBOARD'>('GAME');
  const [isBindingsOpen, setIsBindingsOpen] = useState(false);

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
  });

  const samplesRef = useRef<SpeedSample[]>([]);

  // Load initial leaderboard from public/leaderboard.json + localStorage
  useEffect(() => {
    fetchInitialLeaderboard().then((entries) => {
      setLeaderboard(entries);
    });
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

  /**
   * Triggers a temporary red flash across the entire board frame (`boardWrapperRef`)
   * as well as on the active cell(s) when a mistake occurs, then automatically removes it.
   */
  const triggerBoardErrorFlash = useCallback(() => {
    const wrapper = boardWrapperRef.current;
    if (!wrapper) return;
    wrapper.classList.remove('board-error-flash');
    void wrapper.offsetWidth;
    wrapper.classList.add('board-error-flash');
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
        node.classList.add('shield-approaching');
      }
    },
    []
  );

  /**
   * OMNI-8 MODE: Updates DOM classes for:
   * - Single certain head (`.active`) OR multiple ambiguous quantum heads (`.omni-blurry-head`),
   * - Uncommitted quantum branch trails (`.omni-branch-trail`),
   * - Available 8-directional & wrap-around / phase-jump target cells (`.omni-available`),
   *   NOTE: Before the initial center cell (index 136) is cleared (`clearedCount === 0`),
   *   surrounding cells are NOT yet available — the player MUST clear the starting center cell first!
   * - 2D Planar Reinforced Shield fade-in within radius 3 of active heads.
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
        'omni-available',
        'shield-cracked',
        'error'
      );
      if (eng.doneMask[idx] === 1) {
        node.classList.add('done');
      }
    }
    eng.omniVisualCells.clear();

    const branches = eng.omniBranches;
    const isAmbiguous = branches.length > 1;
    const headIndices: number[] = [];
    const headSet = new Set<number>(branches.map((b) => b.headIndex));
    const visitedByHead = new Map<number, ReadonlySet<number>>();
    const isInitialCellPending = eng.clearedCount === 0;

    for (let b = 0; b < branches.length; b++) {
      const br = branches[b];
      headIndices.push(br.headIndex);
      visitedByHead.set(br.headIndex, br.visitedSet);

      for (let t = 0; t < br.trail.length - 1; t++) {
        const trailIdx = br.trail[t];
        const tNode = cellNodesRef.current[trailIdx];
        if (tNode) {
          tNode.classList.add('omni-branch-trail');
          eng.omniVisualCells.add(trailIdx);
        }
      }

      const headNode = cellNodesRef.current[br.headIndex];
      if (headNode) {
        headNode.classList.add(isAmbiguous ? 'omni-blurry-head' : 'active');
        if (
          br.shieldCrackedOnHead &&
          currentBoard.cells[br.headIndex].isReinforced &&
          eng.doneMask[br.headIndex] === 0
        ) {
          headNode.classList.add('shield-cracked');
        }
        eng.omniVisualCells.add(br.headIndex);
      }

      // Only show available surrounding neighbors AFTER the first (center) cell has been cleared
      // and when the head does not have an uncracked shield!
      const headCell = currentBoard.cells[br.headIndex];
      const needsSecondHitOnHead = headCell.isReinforced && !br.shieldCrackedOnHead;
      if (!isInitialCellPending && !needsSecondHitOnHead) {
        const neighbors = getAvailableOmniNeighbors(br.headIndex, eng.doneMask, br.visitedSet);
        for (let n = 0; n < neighbors.length; n++) {
          const nIdx = neighbors[n];
          const nNode = cellNodesRef.current[nIdx];
          if (nNode) {
            nNode.classList.add('omni-available');
            // Special case: if `nIdx` is ALREADY a candidate head of ANOTHER branch (e.g. two identical
            // numbers `1` are adjacent to each other, so clicking `1` made both candidate heads AND
            // each `1` is still clickable as the next step from the other `1`), mark it with
            // `.omni-head-also-clickable` so it shows BOTH candidate head AND clickable target rings!
            if (headSet.has(nIdx)) {
              nNode.classList.add('omni-head-also-clickable');
            }
            eng.omniVisualCells.add(nIdx);
          }
        }
      } else if (!isInitialCellPending && needsSecondHitOnHead) {
        // If a candidate head still has an intact shield, it is itself clickable right now!
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
      if (alpha2D > 0) {
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

      // 1. Punchy scale-impact on the main score digits + last-delta pill
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

  // 8-bit banner popup when a hidden sequence or shield combo is triggered
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
  const startNewGame = useCallback(() => {
    const newBoard = generateFairBoard();
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
  }, []);

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
    }

    if (gameMode === 'LINEAR') {
      eng.currentIndex = 0;
      eng.shieldIntactOnCurrent = board.cells[0].isReinforced;
      const firstNode = cellNodesRef.current[0];
      if (firstNode) firstNode.classList.add('active');
      setWrapGhosts([]);
      updateLinearShieldVisibility(0, board);
    } else {
      // OMNI-8 starts on the exact center cell of the 21x13 board (Row 10, Col 6 -> index 136).
      // Progress starts at 0 / 273, and the player MUST clear this center cell first before
      // surrounding neighbors become available!
      const startIdx = OMNI_CENTER_INDEX;
      eng.doneMask.fill(0);
      eng.clearedCount = 0;

      eng.omniBranches = [
        {
          headIndex: startIdx,
          trail: [startIdx],
          visitedSet: new Set([startIdx]),
          shieldCrackedOnHead: !board.cells[startIdx].isReinforced,
        },
      ];
      if (progressNodeRef.current) {
        progressNodeRef.current.textContent = `0 / ${TOTAL_CELLS}`;
      }
      syncOmniVisualState(board);
    }
  }, [board, gameMode, activeTab, updateLinearShieldVisibility, syncOmniVisualState]);

  // Submit 3-letter arcade nick to Leaderboard
  const handleSaveScoreToLeaderboard = useCallback(() => {
    if (hasSubmittedScore) return;
    const eng = engineRef.current;
    const nick = nickLetters.join('').toUpperCase();
    const totalDurationMs =
      eng.runStartTime > 0 && eng.runEndTime >= eng.runStartTime
        ? eng.runEndTime - eng.runStartTime
        : eng.sumDeltaMs;
    const totalTimeSec = Number((Math.max(0, totalDurationMs) / 1000).toFixed(2));

    const newEntry: LeaderboardEntry = {
      id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nick,
      score: eng.score,
      mode: gameMode,
      totalTimeSec,
      avgSpeedMs: avgSpeedMs ?? 0,
      mistakes: mistakesCount,
      date: new Date().toISOString().slice(0, 10),
    };

    setLeaderboard((prev) => {
      const updated = [...prev, newEntry].sort((a, b) => b.score - a.score);
      saveLeaderboardToStorage(updated);
      return updated;
    });
    setHasSubmittedScore(true);
    setActiveTab('LEADERBOARD');
  }, [hasSubmittedScore, nickLetters, gameMode, avgSpeedMs, mistakesCount]);

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
      if (isBindingsOpen || activeTab !== 'GAME') return;

      // If board is finished, handle 3-letter Arcade Nick input directly from keyboard!
      if (engineRef.current.isFinished && !hasSubmittedScore) {
        if (e.key === 'Escape') {
          e.preventDefault();
          startNewGame();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSaveScoreToLeaderboard();
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
        // The player MUST press the center cell's digit first (no other cells can be clicked yet).
        if (eng.clearedCount === 0) {
          const startBranch = eng.omniBranches[0];
          const centerIdx = startBranch.headIndex;
          const centerCell = board.cells[centerIdx];

          if (mappedDigit === centerCell.digit) {
            if (eng.runStartTime === 0) eng.runStartTime = now;
            setHasStarted(true);

            // If center cell is reinforced and its shield isn't cracked yet -> crack shield first!
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

            // Otherwise, clear the starting center cell! Now all 8 neighbors unlock!
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
            // Wrong key on the starting center cell -> Mistake + Full-board red flash!
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

        // 1. Check if any active branch head is currently waiting for its 2nd Reinforced Shield hit!
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

          // If only 1 branch remains after second shield hit, commit its trail to doneMask!
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
        const nextBranches: OmniBranch[] = [];

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

          for (let n = 0; n < neighbors.length; n++) {
            const nIdx = neighbors[n];
            if (board.cells[nIdx].digit === mappedDigit) {
              const nextVisited = new Set(br.visitedSet);
              nextVisited.add(nIdx);
              nextBranches.push({
                headIndex: nIdx,
                trail: [...br.trail, nIdx],
                visitedSet: nextVisited,
                shieldCrackedOnHead: !board.cells[nIdx].isReinforced,
              });
            }
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

        // 3. LOOP & CONVERGENCE PROTECTION (Same-Head Deduplication)
        const byHead = new Map<number, OmniBranch>();
        for (const cand of nextBranches) {
          const existing = byHead.get(cand.headIndex);
          if (!existing) {
            byHead.set(cand.headIndex, cand);
          } else {
            const freeCand = countImmediateFreeNeighbors(
              cand.headIndex,
              eng.doneMask,
              cand.visitedSet
            );
            const freeExist = countImmediateFreeNeighbors(
              existing.headIndex,
              eng.doneMask,
              existing.visitedSet
            );
            if (freeCand > freeExist) {
              byHead.set(cand.headIndex, cand);
            }
          }
        }

        let deduplicated = Array.from(byHead.values());

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

        // 4. Commit resolved cells to `doneMask` (Wait to mark reinforced head until 2nd hit!)
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
        if (anyUncrackedShieldNow) {
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
          sequenceName: completedSequenceName,
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

              for (let sIdx = seqInst.startIndex; sIdx <= seqInst.endIndex; sIdx++) {
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
    hasSubmittedScore,
    nickCursor,
    startNewGame,
    handleSaveScoreToLeaderboard,
    triggerBoardErrorFlash,
    triggerDeltaPopup,
    triggerSequenceBanner,
    updateLinearShieldVisibility,
    syncOmniVisualState,
  ]);

  const handleSaveSettings = (newBindings: KeyBindingsMap, newMode: GameMode) => {
    setBindings(newBindings);
    saveKeyBindings(newBindings);
    if (!hasStarted && newMode !== gameMode) {
      setGameMode(newMode);
      saveGameMode(newMode);
      startNewGame();
    }
  };

  const handleQuickToggleMode = () => {
    if (hasStarted) return;
    const nextMode: GameMode = gameMode === 'LINEAR' ? 'OMNI' : 'LINEAR';
    setGameMode(nextMode);
    saveGameMode(nextMode);
    startNewGame();
  };

  const handleImportLeaderboard = (imported: LeaderboardEntry[]) => {
    setLeaderboard((prev) => {
      const byId = new Map<string, LeaderboardEntry>();
      for (const e of [...prev, ...imported]) {
        if (e && e.id) byId.set(e.id, e);
      }
      const merged = Array.from(byId.values()).sort((a, b) => b.score - a.score);
      saveLeaderboardToStorage(merged);
      return merged;
    });
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
            className={`btn-arcade ${activeTab === 'LEADERBOARD' ? 'gold' : ''}`}
            onClick={(e) => {
              e.currentTarget.blur();
              setActiveTab((t) => (t === 'LEADERBOARD' ? 'GAME' : 'LEADERBOARD'));
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

      {/* 8-BIT BANNER OVERLAY WHEN HIDDEN SEQUENCES ARE TRIGGERED (WITH SMOOTH FADE-OUT) */}
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
          onBackToGame={() => setActiveTab('GAME')}
        />
      ) : (
        <>
          {/* MAIN WORKSPACE: 21x13 BOARD ON THE LEFT + LIVE SPEED CHART ON THE RIGHT */}
          <main className="main-workspace">
            <section ref={boardWrapperRef} className="board-section">
              <div className="board-grid-stage">
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
                          onClick={handleSaveScoreToLeaderboard}
                        >
                          SAVE TO LEADERBOARD [ENTER]
                        </button>
                      </div>
                    ) : (
                      <p className="nick-saved-msg">SCORE SAVED TO LEADERBOARD!</p>
                    )}

                    <button type="button" className="btn-arcade cyan" onClick={startNewGame}>
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
    </div>
  );
};
