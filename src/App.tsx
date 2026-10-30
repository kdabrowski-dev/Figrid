import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TOTAL_CELLS,
  SHIELD_REVEAL_DISTANCE,
  GeneratedBoard,
  generateFairBoard,
  getShieldProximityAlpha,
  getSpectrumColor,
  computePointIntensity,
  KeyBindingsMap,
  loadKeyBindings,
  saveKeyBindings,
} from './gameEngine';
import { SpeedChartPanel, SpeedSample } from './SpeedChartPanel';
import { KeyBindingsModal } from './KeyBindingsModal';

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

export const App: React.FC = () => {
  const [board, setBoard] = useState<GeneratedBoard>(() => generateFairBoard());
  const [bindings, setBindings] = useState<KeyBindingsMap>(() => loadKeyBindings());
  const [isBindingsOpen, setIsBindingsOpen] = useState(false);

  // Telemetry state for right panel and summary
  const [chartTick, setChartTick] = useState(0);
  const [lastSpeedMs, setLastSpeedMs] = useState<number | null>(null);
  const [avgSpeedMs, setAvgSpeedMs] = useState<number | null>(null);
  const [peakKps, setPeakKps] = useState<number>(0);
  const [sequencesHitCount, setSequencesHitCount] = useState<number>(0);
  const [reinforcedHitCount, setReinforcedHitCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [activeBanners, setActiveBanners] = useState<BannerPopup[]>([]);

  // Direct DOM references for O(1) zero-reflow updates across the 273 cells
  const cellNodesRef = useRef<(HTMLDivElement | null)[]>(new Array(TOTAL_CELLS).fill(null));
  const scoreNodeRef = useRef<HTMLSpanElement | null>(null);
  const lastDeltaBadgeRef = useRef<HTMLSpanElement | null>(null);
  const deltaPopupRootRef = useRef<HTMLDivElement | null>(null);
  const progressNodeRef = useRef<HTMLSpanElement | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);

  // Real-time mutable game engine state (0ms input lag)
  const engineRef = useRef({
    currentIndex: 0,
    lastKeystrokeTime: 0,
    score: 0,
    displayedScore: 0,
    shieldIntactOnCurrent: false,
    cellHitTimestamps: new Float64Array(TOTAL_CELLS),
    cellFirstHitTimestamps: new Float64Array(TOTAL_CELLS),
    totalKeystrokes: 0,
    sumDeltaMs: 0,
    peakKps: 0,
    sequencesHit: 0,
    reinforcedHit: 0,
    isFinished: false,
    bannerCounter: 1,
  });

  const samplesRef = useRef<SpeedSample[]>([]);

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
   * Updates the proximity alpha factor for Reinforced cells within the 7-step lookahead window.
   * Cells beyond currentIndex + 7 have --shield-alpha = 0 (completely invisible).
   * As the player gets closer (distance 7 down to 1), --shield-alpha smoothly increases up to 1.
   */
  const updateLookaheadShieldVisibility = useCallback(
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

  // Floating +pts / -pts popup in dynamic spectrum color
  const triggerDeltaPopup = useCallback(
    (deltaPoints: number, spectrumColor: string, extraTag?: string) => {
      const isPositive = deltaPoints >= 0;
      const formatted = isPositive ? `+${deltaPoints}` : `${deltaPoints}`;
      const fullText = extraTag ? `${formatted} ${extraTag}` : formatted;

      const badge = lastDeltaBadgeRef.current;
      if (badge) {
        badge.textContent = fullText;
        badge.style.color = isPositive ? spectrumColor : '#ff2a54';
        badge.style.borderColor = isPositive ? spectrumColor : '#ff2a54';
        badge.style.boxShadow = `0 0 10px ${isPositive ? spectrumColor : 'rgba(255,42,84,0.5)'}`;
        badge.classList.add('visible');
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

  // 8-bit banner popup when a hidden sequence is typed fast enough
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

      setTimeout(() => {
        setActiveBanners((prev) => prev.filter((b) => b.id !== id));
      }, isPhi ? 2600 : 1950);
    },
    []
  );

  // Start / Restart Game
  const startNewGame = useCallback(() => {
    const newBoard = generateFairBoard();
    setBoard(newBoard);

    const eng = engineRef.current;
    eng.currentIndex = 0;
    eng.lastKeystrokeTime = 0;
    eng.score = 0;
    eng.displayedScore = 0;
    eng.shieldIntactOnCurrent = newBoard.cells[0].isReinforced;
    eng.cellHitTimestamps.fill(0);
    eng.cellFirstHitTimestamps.fill(0);
    eng.totalKeystrokes = 0;
    eng.sumDeltaMs = 0;
    eng.peakKps = 0;
    eng.sequencesHit = 0;
    eng.reinforcedHit = 0;
    eng.isFinished = false;

    samplesRef.current = [];
    setLastSpeedMs(null);
    setAvgSpeedMs(null);
    setPeakKps(0);
    setSequencesHitCount(0);
    setReinforcedHitCount(0);
    setIsFinished(false);
    setActiveBanners([]);
    setChartTick((t) => t + 1);

    if (scoreNodeRef.current) {
      scoreNodeRef.current.textContent = '0';
      scoreNodeRef.current.style.color = '#ffea00';
    }
    if (lastDeltaBadgeRef.current) {
      lastDeltaBadgeRef.current.classList.remove('visible');
    }
    if (progressNodeRef.current) {
      progressNodeRef.current.textContent = `0 / ${TOTAL_CELLS}`;
    }
  }, []);

  // Initialize DOM nodes when a new board is created:
  // - NO tile backgrounds on unpressed digits,
  // - NO sequence highlights on the board,
  // - Reinforced shields only visible within the 7-step lookahead window!
  useEffect(() => {
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const node = cellNodesRef.current[i];
      if (!node) continue;
      node.className = i === 0 ? 'cell active' : 'cell';
      node.style.setProperty('--shield-alpha', '0');
    }
    engineRef.current.shieldIntactOnCurrent = board.cells[0].isReinforced;
    updateLookaheadShieldVisibility(0, board);
  }, [board, updateLookaheadShieldVisibility]);

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

  // Zero-Lag Global Keydown Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBindingsOpen) return;

      if (e.repeat) {
        e.preventDefault();
        return;
      }

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
      const idx = eng.currentIndex;
      const currentCell = board.cells[idx];
      const currentNode = cellNodesRef.current[idx];

      // 1. VALID KEYSTROKE
      if (mappedDigit === currentCell.digit) {
        const delta =
          eng.lastKeystrokeTime === 0
            ? 240
            : Math.max(15, now - eng.lastKeystrokeTime);

        const clampedDelta = Math.max(MIN_DELTA_MS, delta);
        const speedBonus =
          delta < MAX_BONUS_DELTA_MS ? Math.round(2800 / clampedDelta) : 0;

        // First hit on a Reinforced cell cracks the shield
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
            currentNode.style.setProperty('--shield-alpha', '0');
            currentNode.classList.add('shield-cracked');
          }

          triggerDeltaPopup(shieldBreakPoints, specColor, '🛡 CRACKED!');
          return;
        }

        // Second hit on a Reinforced cell -> 2X SPEED MULTIPLIER!
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

        // Check if this cell completes a hidden sequence below the speed threshold
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
          tag = `⚡2X + ${completedSequenceName}`;
        } else if (isSecondShieldHit) {
          tag = '⚡SHIELD 2X!';
        } else if (completedSequenceName) {
          tag = `★ ${completedSequenceName}`;
        }

        triggerDeltaPopup(pointsGained, specColor, tag || undefined);

        // O(1) DOM update on completed cell (tile appears ONLY after completion)
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
          // Update 7-step lookahead alpha for upcoming Reinforced shields
          updateLookaheadShieldVisibility(nextIndex, board);
        } else {
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
        // 2. MISTAKE (Speed-scaled penalty)
        const delta =
          eng.lastKeystrokeTime === 0
            ? MAX_BONUS_DELTA_MS
            : Math.max(MIN_DELTA_MS, now - eng.lastKeystrokeTime);

        const speedPenaltyFactor = Math.round(3200 / delta);
        const penalty = Math.round(BASE_POINTS * 2 + speedPenaltyFactor * 2.2);

        eng.score = Math.max(0, eng.score - penalty);
        eng.lastKeystrokeTime = now;

        if (currentNode) {
          currentNode.classList.remove('error');
          void currentNode.offsetWidth;
          currentNode.classList.add('error');
        }

        triggerDeltaPopup(-penalty, '#ff2a54', 'MISS!');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    board,
    isBindingsOpen,
    startNewGame,
    triggerDeltaPopup,
    triggerSequenceBanner,
    updateLookaheadShieldVisibility,
  ]);

  const handleSaveBindings = (newBindings: KeyBindingsMap) => {
    setBindings(newBindings);
    saveKeyBindings(newBindings);
  };

  return (
    <div className="app-shell">
      {/* TOP HUD WITH CENTERED SCORE COUNTER */}
      <header className="top-hud">
        <div className="hud-side hud-left">
          <div className="brand-title">FIGRID // 21×13</div>
          <div className="progress-box">
            <span className="hud-label">PROGRESS</span>
            <span ref={progressNodeRef} className="hud-progress-val">
              0 / {TOTAL_CELLS}
            </span>
          </div>
        </div>

        {/* CENTERED SCORE COUNTER + DYNAMIC SPECTRUM FLOATING DELTAS */}
        <div className="hud-center-score">
          <div className="score-change-row">
            <span className="hud-label">SCORE</span>
            <span ref={lastDeltaBadgeRef} className="last-delta-pill">
              +0
            </span>
          </div>

          <div className="score-main-wrap">
            <span ref={scoreNodeRef} className="score-big-digits">
              0
            </span>
            <div ref={deltaPopupRootRef} className="delta-popup-layer" />
          </div>

          <div className="spectrum-bar-wrap" title="Speed-scaled point color spectrum">
            <span className="spectrum-caption">SLOW</span>
            <div className="spectrum-gradient-bar" />
            <span className="spectrum-caption">HYPER</span>
          </div>
        </div>

        <div className="hud-side hud-right">
          <button
            type="button"
            className="btn-arcade cyan"
            onClick={(e) => {
              e.currentTarget.blur();
              setIsBindingsOpen(true);
            }}
          >
            ⌨ KEYBINDINGS
          </button>
          <button
            type="button"
            className="btn-arcade"
            onClick={(e) => {
              e.currentTarget.blur();
              startNewGame();
            }}
          >
            ↻ RESTART [ESC]
          </button>
        </div>
      </header>

      {/* 8-BIT BANNER OVERLAY WHEN HIDDEN SEQUENCES ARE TRIGGERED */}
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

      {/* MAIN WORKSPACE: 21×13 BOARD ON THE LEFT + LIVE SPEED CHART ON THE RIGHT */}
      <main className="main-workspace">
        <section ref={boardWrapperRef} className="board-section">
          <div className="board-grid-21x13">
            {board.cells.map((cell, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  cellNodesRef.current[idx] = el;
                }}
                className="cell"
              >
                <span className="cell-digit">{cell.digit}</span>
                {cell.isReinforced && <span className="cell-shield-layer" />}
              </div>
            ))}
          </div>

          {isFinished && (
            <div className="victory-overlay">
              <div className="victory-card">
                <h2>BOARD CLEARED!</h2>
                <p className="victory-score">
                  FINAL SCORE: <strong>{engineRef.current.score.toLocaleString('en-US')}</strong>
                </p>
                <p className="victory-stats">
                  Avg Pace: {avgSpeedMs ?? '--'} ms/key • Secret Sequences:{' '}
                  {sequencesHitCount}/{board.sequences.length} • 2x Shields:{' '}
                  {reinforcedHitCount}/{board.totalReinforcedCount}
                </p>
                <button type="button" className="btn-arcade gold" onClick={startNewGame}>
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
          sequencesHitCount={sequencesHitCount}
          totalSequencesCount={board.sequences.length}
          reinforcedHitCount={reinforcedHitCount}
          totalReinforcedCount={board.totalReinforcedCount}
        />
      </main>

      {/* KEYBINDINGS CONFIGURATION MODAL */}
      <KeyBindingsModal
        isOpen={isBindingsOpen}
        bindings={bindings}
        onSave={handleSaveBindings}
        onClose={() => setIsBindingsOpen(false)}
      />
    </div>
  );
};
