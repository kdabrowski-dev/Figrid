import React, { useEffect, useRef } from 'react';
import { getSpectrumColor } from './gameEngine';

export interface SpeedSample {
  step: number;
  deltaMs: number;
  kps: number; // Keys Per Second (1000 / deltaMs)
  points: number;
  isReinforced2x: boolean;
  sequenceName?: string;
}

interface SpeedChartPanelProps {
  samplesRef: React.MutableRefObject<SpeedSample[]>;
  renderTick: number; // Używane lub odświeżane zewnętrznie / przez imperatywny uchwyt
  lastSpeedMs: number | null;
  avgSpeedMs: number | null;
  peakKps: number;
  sequencesHitCount: number;
  totalSequencesCount: number;
  reinforcedHitCount: number;
  totalReinforcedCount: number;
}

export const SpeedChartPanel: React.FC<SpeedChartPanelProps> = ({
  samplesRef,
  renderTick,
  lastSpeedMs,
  avgSpeedMs,
  peakKps,
  sequencesHitCount,
  totalSequencesCount,
  reinforcedHitCount,
  totalReinforcedCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 300;
    const height = canvas.clientHeight || 220;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Tło wykresu
    ctx.fillStyle = '#0b0d14';
    ctx.fillRect(0, 0, width, height);

    // Siatka pomocnicza 8-bit
    const padLeft = 36;
    const padRight = 12;
    const padTop = 16;
    const padBottom = 24;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxKps = 16; // 16 klawiszy/sek (~62ms) jako sufit wykresu
    const gridLevels = [4, 8, 12, 16];

    ctx.strokeStyle = '#1b2030';
    ctx.lineWidth = 1;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#56617a';

    for (const lvl of gridLevels) {
      const y = padTop + plotH - (lvl / maxKps) * plotH;
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(`${lvl}/s`, 4, y + 3);
    }

    // Oś dolna
    ctx.strokeStyle = '#2b334d';
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + plotH);
    ctx.lineTo(width - padRight, padTop + plotH);
    ctx.stroke();

    const allSamples = samplesRef.current;
    const visibleCount = 45; // Ostatnie 45 wciśnięć dla czytelności w czasie rzeczywistym
    const samples = allSamples.slice(-visibleCount);

    if (samples.length === 0) {
      ctx.fillStyle = '#4a5568';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OCZEKIWANIE NA RUCH...', padLeft + plotW / 2, padTop + plotH / 2);
      ctx.restore();
      return;
    }

    // Rysowanie wypełnienia pod wykresem
    const stepX = plotW / Math.max(1, visibleCount - 1);

    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = padLeft + i * stepX;
      const clampedKps = Math.min(maxKps, s.kps);
      const y = padTop + plotH - (clampedKps / maxKps) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastX = padLeft + (samples.length - 1) * stepX;
    ctx.lineTo(lastX, padTop + plotH);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    areaGrad.addColorStop(0, 'rgba(255, 0, 229, 0.32)');
    areaGrad.addColorStop(0.5, 'rgba(255, 234, 0, 0.18)');
    areaGrad.addColorStop(1, 'rgba(56, 182, 255, 0.03)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Rysowanie segmentów linii w kolorach spektrum prędkości
    ctx.lineWidth = 2.5;
    for (let i = 0; i < samples.length - 1; i++) {
      const s1 = samples[i];
      const s2 = samples[i + 1];
      const x1 = padLeft + i * stepX;
      const y1 = padTop + plotH - (Math.min(maxKps, s1.kps) / maxKps) * plotH;
      const x2 = padLeft + (i + 1) * stepX;
      const y2 = padTop + plotH - (Math.min(maxKps, s2.kps) / maxKps) * plotH;

      const intensity = Math.max(0, Math.min(1, (s2.kps - 2) / 12));
      ctx.strokeStyle = getSpectrumColor(intensity);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Punkty na wykresie (wyróżnienie tarcz x2 oraz ukończonych sekwencji)
    samples.forEach((s, i) => {
      const x = padLeft + i * stepX;
      const y = padTop + plotH - (Math.min(maxKps, s.kps) / maxKps) * plotH;
      const intensity = Math.max(0, Math.min(1, (s.kps - 2) / 12));

      if (s.sequenceName) {
        // Gwiazdka / diament dla sekwencji
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 4, y - 4, 8, 8);
      } else if (s.isReinforced2x) {
        // Punkt tarczy x2
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(x - 3, y - 3, 6, 6);
      } else {
        ctx.fillStyle = getSpectrumColor(intensity);
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    });

    // Podpis osi X (numery kroków)
    ctx.fillStyle = '#6c7693';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    const lastStep = samples[samples.length - 1].step;
    ctx.fillText(`#${lastStep}`, width - padRight, height - 6);
    ctx.textAlign = 'left';
    ctx.fillText(`#${samples[0].step}`, padLeft, height - 6);

    ctx.restore();
  }, [renderTick, samplesRef]);

  const currentKps = lastSpeedMs && lastSpeedMs > 0 ? (1000 / lastSpeedMs).toFixed(1) : '0.0';
  const avgKps = avgSpeedMs && avgSpeedMs > 0 ? (1000 / avgSpeedMs).toFixed(1) : '0.0';

  return (
    <aside className="side-panel">
      <div className="panel-card">
        <div className="panel-header">
          <span className="panel-title">WYKRES PRĘDKOŚCI (NA ŻYWO)</span>
          <span className="panel-badge">{currentKps} ZN/S</span>
        </div>

        <div className="chart-wrapper">
          <canvas ref={canvasRef} className="speed-canvas" />
        </div>

        <div className="chart-legend">
          <span className="legend-item">
            <i className="dot dot-seq" /> Bonus Sekwencji
          </span>
          <span className="legend-item">
            <i className="dot dot-shield" /> Tarcza 2x
          </span>
        </div>

        <div className="telemetry-grid">
          <div className="telemetry-item">
            <span className="telemetry-label">OSTATNI CZAS</span>
            <span className="telemetry-val">
              {lastSpeedMs !== null ? `${lastSpeedMs} ms` : '-- ms'}
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">ŚREDNIE TEMPO</span>
            <span className="telemetry-val">
              {avgSpeedMs !== null ? `${avgSpeedMs} ms (${avgKps}/s)` : '-- ms'}
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">SZCZYTOWE TEMPO</span>
            <span className="telemetry-val highlight-magenta">{peakKps.toFixed(1)} zn/s</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">TARCZE (BONUS X2)</span>
            <span className="telemetry-val highlight-cyan">
              {reinforcedHitCount} / {totalReinforcedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Karta informacyjna o uczciwym budżecie planszy i sekwencjach */}
      <div className="panel-card sequences-card">
        <div className="panel-header">
          <span className="panel-title">SEKWENCJE NA PLANSZY</span>
          <span className="panel-badge gold">
            {sequencesHitCount}/{totalSequencesCount} ZALICZONYCH
          </span>
        </div>
        <p className="fair-play-note">
          ⚖️ <strong>BALANS FAIR-PLAY:</strong> Każda plansza 21×13 losuje dokładnie ten sam budżet
          wagowy ({totalSequencesCount} sekwencji = 4050 pkt w puli + {totalReinforcedCount} tarcz{' '}
          <span className="shield-inline">🛡</span> z mnożnikiem <strong>x2</strong> za szybki
          dwuklik).
        </p>
        <div className="seq-tiers-mini">
          <div className="seq-tier-row">
            <span className="tier-tag short">KRÓTKIE ×5</span>
            <span className="tier-codes">1234, 9876, 1010, 1337, 2580, 0000</span>
          </div>
          <div className="seq-tier-row">
            <span className="tier-tag medium">ŚREDNIE ×4</span>
            <span className="tier-codes">12345, 67890, 13579, 24680, 123321, 123123, 159753</span>
          </div>
          <div className="seq-tier-row">
            <span className="tier-tag phi">LICZBA FI ×1</span>
            <span className="tier-codes">16153 (Złoty Easter Egg Φ +550 pkt)</span>
          </div>
          <div className="seq-tier-row">
            <span className="tier-tag long">JACKPOT ×1</span>
            <span className="tier-codes">1122334455, 1234432100 (+900 pkt)</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
