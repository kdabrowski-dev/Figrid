import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TOTAL_CELLS,
  GeneratedBoard,
  generateFairBoard,
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
  // Stan planszy (generowany tylko przy starcie lub resecie gry)
  const [board, setBoard] = useState<GeneratedBoard>(() => generateFairBoard());
  const [bindings, setBindings] = useState<KeyBindingsMap>(() => loadKeyBindings());
  const [isBindingsOpen, setIsBindingsOpen] = useState(false);

  // Stan telemetrii dla prawego panelu i podsumowania
  const [chartTick, setChartTick] = useState(0);
  const [lastSpeedMs, setLastSpeedMs] = useState<number | null>(null);
  const [avgSpeedMs, setAvgSpeedMs] = useState<number | null>(null);
  const [peakKps, setPeakKps] = useState<number>(0);
  const [sequencesHitCount, setSequencesHitCount] = useState<number>(0);
  const [reinforcedHitCount, setReinforcedHitCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [activeBanners, setActiveBanners] = useState<BannerPopup[]>([]);

  // Referencje DOM dla O(1) aktualizacji bez re-renderowania siatki 273 komórek
  const cellNodesRef = useRef<(HTMLDivElement | null)[]>(new Array(TOTAL_CELLS).fill(null));
  const scoreNodeRef = useRef<HTMLSpanElement | null>(null);
  const lastDeltaBadgeRef = useRef<HTMLSpanElement | null>(null);
  const deltaPopupRootRef = useRef<HTMLDivElement | null>(null);
  const progressNodeRef = useRef<HTMLSpanElement | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);

  // Silnik stanu czasu rzeczywistego (mutowalny ref dla 0ms input lagu)
  const engineRef = useRef({
    currentIndex: 0,
    lastKeystrokeTime: 0,
    score: 0,
    displayedScore: 0,
    // Czy aktualna komórka z tarczą ma jeszcze aktywną tarczę (wymaga 1. uderzenia, by ją rozbić)
    shieldIntactOnCurrent: false,
    // Czasy wciśnięć każdego indeksu (do weryfikacji średniej prędkości sekwencji)
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

  // Odwrotna mapa klawisz -> cyfra dla błyskawicznego O(1) sprawdzania w keydown
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

  // Funkcja wyzwalająca pływający wskaźnik punktów (+... / -...) w kolorze spektrum
  const triggerDeltaPopup = useCallback(
    (deltaPoints: number, spectrumColor: string, extraTag?: string) => {
      const isPositive = deltaPoints >= 0;
      const formatted = isPositive ? `+${deltaPoints}` : `${deltaPoints}`;
      const fullText = extraTag ? `${formatted} ${extraTag}` : formatted;

      // 1. Stały badge nad/obok wyniku
      const badge = lastDeltaBadgeRef.current;
      if (badge) {
        badge.textContent = fullText;
        badge.style.color = isPositive ? spectrumColor : '#ff2a54';
        badge.style.borderColor = isPositive ? spectrumColor : '#ff2a54';
        badge.style.boxShadow = `0 0 10px ${isPositive ? spectrumColor : 'rgba(255,42,84,0.5)'}`;
        badge.classList.add('visible');
      }

      // 2. Pływająca cyfra nad głównym licznikiem
      const root = deltaPopupRootRef.current;
      if (root) {
        const popup = document.createElement('span');
        popup.className = `score-delta-popup ${isPositive ? 'pos' : 'neg'}`;
        popup.textContent = fullText;
        popup.style.color = isPositive ? spectrumColor : '#ff2a54';
        popup.style.textShadow = `0 0 10px ${isPositive ? spectrumColor : '#ff2a54'}`;
        // Lekki losowy rozrzut poziomy dla czytelności przy ultraszybkim pisaniu
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

  // Wyzwolenie kolorowego baneru 8-bit po zaliczeniu sekwencji poniżej progu czasu
  const triggerSequenceBanner = useCallback(
    (title: string, subtitle: string, bonusPoints: number, color: string, isPhi?: boolean) => {
      const id = engineRef.current.bannerCounter++;
      setActiveBanners((prev) => [
        ...prev.slice(-2),
        {
          id,
          title,
          subtitle,
          bonusText: `+${bonusPoints} PKT BONUS!`,
          color,
          isPhi,
        },
      ]);

      // Jeśli to Złota Liczba Fi (16153) - subtelny złoty rozbłysk ramki planszy
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

  // Reset / Nowa Gra (nowy losowy rozkład z tym samym uczciwym budżetem wagowym)
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

  // Po wyrenderowaniu nowej planszy ustawiamy klasy początkowe na węzłach DOM
  useEffect(() => {
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const node = cellNodesRef.current[i];
      if (!node) continue;
      const cell = board.cells[i];
      node.className = [
        'cell',
        cell.sequenceTier ? `seq-${cell.sequenceTier.toLowerCase()}` : '',
        cell.isSequenceStart ? 'seq-start' : '',
        cell.isSequenceEnd ? 'seq-end' : '',
        cell.isReinforced ? 'has-shield' : '',
        i === 0 ? 'active' : '',
      ]
        .filter(Boolean)
        .join(' ');
    }
    engineRef.current.shieldIntactOnCurrent = board.cells[0].isReinforced;
  }, [board]);

  // Pętla requestAnimationFrame do płynnego nabijania głównego licznika punktów
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      const eng = engineRef.current;
      if (eng.displayedScore !== eng.score) {
        const diff = eng.score - eng.displayedScore;
        const step = Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * 0.22));
        eng.displayedScore += step;
        if (scoreNodeRef.current) {
          scoreNodeRef.current.textContent = eng.displayedScore.toLocaleString('pl-PL');
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Główny listener klawiatury (Zero Input Lag)
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

      // Blokujemy domyślne zachowania dla spacji, strzałek, slashy lub zbindowanych klawiszy
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

      // 1. WALIDACJA KLAWISZA
      if (mappedDigit === currentCell.digit) {
        const delta =
          eng.lastKeystrokeTime === 0
            ? 240 // Pierwsze kliknięcie na planszy ma neutralną deltę bazową
            : Math.max(15, now - eng.lastKeystrokeTime);

        const clampedDelta = Math.max(MIN_DELTA_MS, delta);
        const speedBonus =
          delta < MAX_BONUS_DELTA_MS ? Math.round(2800 / clampedDelta) : 0;

        // Czy to PIERWSZE uderzenie w tarczę (Reinforced Key)?
        if (currentCell.isReinforced && eng.shieldIntactOnCurrent) {
          eng.shieldIntactOnCurrent = false;
          eng.cellFirstHitTimestamps[idx] = now;
          eng.lastKeystrokeTime = now;

          const shieldBreakPoints = BASE_POINTS + speedBonus;
          eng.score += shieldBreakPoints;

          const intensity = computePointIntensity(shieldBreakPoints, clampedDelta);
          const specColor = getSpectrumColor(intensity);

          if (currentNode) {
            currentNode.classList.remove('has-shield', 'error');
            currentNode.classList.add('shield-cracked');
          }

          triggerDeltaPopup(shieldBreakPoints, specColor, '🛡 PĘKŁA!');
          return;
        }

        // Czy to DRUGIE uderzenie w tarczę (Reinforced Key)? -> MNOŻNIK x2!
        const isSecondShieldHit = currentCell.isReinforced && !eng.shieldIntactOnCurrent;
        const multiplier = isSecondShieldHit ? 2 : 1;
        let pointsGained = (BASE_POINTS + speedBonus) * multiplier;

        if (isSecondShieldHit) {
          eng.reinforcedHit += 1;
          setReinforcedHitCount(eng.reinforcedHit);
        }

        // Zapisujemy czas zaliczenia komórki
        eng.cellHitTimestamps[idx] = now;
        if (!currentCell.isReinforced) {
          eng.cellFirstHitTimestamps[idx] = now;
        }

        // Sprawdzamy, czy ta komórka kończy jedną z sekwencji na planszy!
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

            // Jeżeli gracz wpisał sekwencję poniżej progu szybkości -> przyznajemy bonus sekwencji!
            if (avgSeqDelta <= seqInst.pattern.maxAvgDeltaMs) {
              const seqBonus = seqInst.pattern.bonusPoints;
              pointsGained += seqBonus;
              completedSequenceName = seqInst.pattern.name;
              eng.sequencesHit += 1;
              setSequencesHitCount(eng.sequencesHit);

              triggerSequenceBanner(
                seqInst.pattern.name,
                `${seqInst.pattern.subtitle} (${Math.round(avgSeqDelta)} ms/zn)`,
                seqBonus,
                seqInst.pattern.color,
                seqInst.pattern.isPhiEasterEgg
              );

              // Podświetlamy wszystkie komórki zaliczonej sekwencji złotym/neonowym pulsem
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

        // Kolorujemy również główny licznik punktów delikatnie w stronę aktualnego spektrum
        if (scoreNodeRef.current) {
          scoreNodeRef.current.style.color = specColor;
        }

        let tag = '';
        if (isSecondShieldHit && completedSequenceName) {
          tag = `⚡2x + ${completedSequenceName}`;
        } else if (isSecondShieldHit) {
          tag = '⚡TARCZA 2x!';
        } else if (completedSequenceName) {
          tag = `★ ${completedSequenceName}`;
        }

        triggerDeltaPopup(pointsGained, specColor, tag || undefined);

        // Aktualizacja DOM: wyłącznie poprzedni i aktualny element (O(1), zero reflow całej siatki!)
        if (currentNode) {
          currentNode.classList.remove('active', 'error', 'shield-cracked');
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
        } else {
          eng.isFinished = true;
          setIsFinished(true);
        }

        // Dodajemy próbkę do wykresu prędkości po prawej stronie
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
        // 2. BŁĄD (Kara zależna od chwilowej prędkości uderzenia)
        const delta =
          eng.lastKeystrokeTime === 0
            ? MAX_BONUS_DELTA_MS
            : Math.max(MIN_DELTA_MS, now - eng.lastKeystrokeTime);

        const speedPenaltyFactor = Math.round(3200 / delta);
        const penalty = Math.round(BASE_POINTS * 2 + speedPenaltyFactor * 2.2);

        eng.score = Math.max(0, eng.score - penalty);
        eng.lastKeystrokeTime = now; // Reset czasu, by zablokować bonus prędkości po błędzie

        if (currentNode) {
          currentNode.classList.remove('error');
          void currentNode.offsetWidth;
          currentNode.classList.add('error');
        }

        triggerDeltaPopup(-penalty, '#ff2a54', 'BŁĄD!');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, isBindingsOpen, startNewGame, triggerDeltaPopup, triggerSequenceBanner]);

  const handleSaveBindings = (newBindings: KeyBindingsMap) => {
    setBindings(newBindings);
    saveKeyBindings(newBindings);
  };

  return (
    <div className="app-shell">
      {/* GÓRNY PASEK HUD Z WYCENTROWANYM LICZNIKIEM PUNKTÓW */}
      <header className="top-hud">
        <div className="hud-side hud-left">
          <div className="brand-title">FIGRID // 21×13</div>
          <div className="progress-box">
            <span className="hud-label">POSTĘP PLANSZY</span>
            <span ref={progressNodeRef} className="hud-progress-val">
              0 / {TOTAL_CELLS}
            </span>
          </div>
        </div>

        {/* CENTRALNY LICZNIK PUNKTÓW + OSTATNIA ZMIANA NAD NIM */}
        <div className="hud-center-score">
          <div className="score-change-row">
            <span className="hud-label">WYNIK PUNKTOWY</span>
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

          {/* Wizualny pasek 5-kolorowego spektrum prędkości */}
          <div className="spectrum-bar-wrap" title="Spektrum punktacji zależne od prędkości">
            <span className="spectrum-caption">WOLNO</span>
            <div className="spectrum-gradient-bar" />
            <span className="spectrum-caption">HIPER-TEMPO</span>
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
            ⌨ KLAWISZE
          </button>
          <button
            type="button"
            className="btn-arcade"
            onClick={(e) => {
              e.currentTarget.blur();
              startNewGame();
            }}
          >
            ↻ NOWA GRA [ESC]
          </button>
        </div>
      </header>

      {/* WARSTWA BANERÓW 8-BIT DLA ZALICZONYCH SEKWENCJI ORAZ LICZBY FI (16153) */}
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

      {/* GŁÓWNY UKŁAD: PLANSZA 21×13 PO LEWEJ + WYKRES PRĘDKOŚCI PO PRAWEJ */}
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
                {cell.isReinforced && <span className="cell-shield-icon" title="Tarcza (2x klik = 2x punkty)" />}
              </div>
            ))}
          </div>

          {isFinished && (
            <div className="victory-overlay">
              <div className="victory-card">
                <h2>PLANSZA UKOŃCZONA!</h2>
                <p className="victory-score">
                  WYNIK KOŃCOWY: <strong>{engineRef.current.score.toLocaleString('pl-PL')}</strong>
                </p>
                <p className="victory-stats">
                  Średnie tempo: {avgSpeedMs ?? '--'} ms/znak • Sekwencje:{' '}
                  {sequencesHitCount}/{board.sequences.length} • Tarcze 2x:{' '}
                  {reinforcedHitCount}/{board.totalReinforcedCount}
                </p>
                <button type="button" className="btn-arcade gold" onClick={startNewGame}>
                  ZAGRAJ PONOWNIE [ESC]
                </button>
              </div>
            </div>
          )}
        </section>

        {/* PRAWY PANEL Z WYKRESEM PRĘDKOŚCI NA ŻYWO */}
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

      {/* MODAL KONFIGURACJI BINDINGÓW KLAWISZY */}
      <KeyBindingsModal
        isOpen={isBindingsOpen}
        bindings={bindings}
        onSave={handleSaveBindings}
        onClose={() => setIsBindingsOpen(false)}
      />
    </div>
  );
};
