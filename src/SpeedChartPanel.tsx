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
  renderTick: number;
  lastSpeedMs: number | null;
  avgSpeedMs: number | null;
  peakKps: number;
  mistakesCount: number;
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
  mistakesCount,
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

    // Chart background
    ctx.fillStyle = '#0b0d14';
    ctx.fillRect(0, 0, width, height);

    // 8-bit helper grid
    const padLeft = 36;
    const padRight = 12;
    const padTop = 16;
    const padBottom = 24;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxKps = 16; // 16 keys/sec (~62ms) ceiling
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

    // Bottom axis
    ctx.strokeStyle = '#2b334d';
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + plotH);
    ctx.lineTo(width - padRight, padTop + plotH);
    ctx.stroke();

    const allSamples = samplesRef.current;
    const visibleCount = 45;
    const samples = allSamples.slice(-visibleCount);

    if (samples.length === 0) {
      ctx.fillStyle = '#4a5568';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WAITING FOR INPUT...', padLeft + plotW / 2, padTop + plotH / 2);
      ctx.restore();
      return;
    }

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

    // Line segments colored by speed spectrum
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

    // Data points (highlighting 2x Shields and discovered Sequences)
    samples.forEach((s, i) => {
      const x = padLeft + i * stepX;
      const y = padTop + plotH - (Math.min(maxKps, s.kps) / maxKps) * plotH;
      const intensity = Math.max(0, Math.min(1, (s.kps - 2) / 12));

      if (s.sequenceName) {
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 4, y - 4, 8, 8);
      } else if (s.isReinforced2x) {
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(x - 3, y - 3, 6, 6);
      } else {
        ctx.fillStyle = getSpectrumColor(intensity);
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    });

    // X-axis step labels
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
          <span className="panel-title">LIVE SPEED TELEMETRY</span>
          <span className="panel-badge">{currentKps} KEYS/S</span>
        </div>

        <div className="chart-wrapper">
          <canvas ref={canvasRef} className="speed-canvas" />
        </div>

        <div className="chart-legend">
          <span className="legend-item">
            <i className="dot dot-seq" /> Hidden Sequence Bonus
          </span>
          <span className="legend-item">
            <i className="dot dot-shield" /> Reinforced 2x Hit
          </span>
        </div>

        <div className="telemetry-grid">
          <div className="telemetry-item">
            <span className="telemetry-label">LAST DELTA</span>
            <span className="telemetry-val">
              {lastSpeedMs !== null ? `${lastSpeedMs} ms` : '-- ms'}
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">AVERAGE PACE</span>
            <span className="telemetry-val">
              {avgSpeedMs !== null ? `${avgSpeedMs} ms (${avgKps}/s)` : '-- ms'}
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">PEAK SPEED</span>
            <span className="telemetry-val highlight-magenta">{peakKps.toFixed(1)} keys/s</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">SHIELDS (2X BONUS)</span>
            <span className="telemetry-val highlight-cyan">
              {reinforcedHitCount} / {totalReinforcedCount}
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">MISTAKES</span>
            <span className="telemetry-val highlight-red">{mistakesCount}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">SECRET SEQUENCES</span>
            <span className="telemetry-val highlight-gold">
              {sequencesHitCount} / {totalSequencesCount}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
