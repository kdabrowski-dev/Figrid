import React from 'react';
import { GameMode, TOTAL_CELLS } from './gameEngine';
import { UserProfile } from './apiClient';

export interface SpeedSample {
  step: number;
  deltaMs: number;
  kps: number;
  points: number;
  isReinforced2x: boolean;
  sequenceName?: string;
}

interface SpeedChartPanelProps {
  // Header box props
  gameMode: GameMode;
  hasStarted: boolean;
  currentUser: UserProfile | null;
  progressNodeRef: React.RefObject<HTMLSpanElement>;
  onQuickToggleMode: () => void;
  onOpenAuth: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onRestart: () => void;

  // Score box refs (replacing the removed chart)
  scoreNodeRef: React.RefObject<HTMLSpanElement>;
  lastDeltaBadgeRef: React.RefObject<HTMLSpanElement>;
  deltaPopupRootRef: React.RefObject<HTMLDivElement>;

  // KPI Telemetry props
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
  gameMode,
  hasStarted,
  currentUser,
  progressNodeRef,
  onQuickToggleMode,
  onOpenAuth,
  onOpenLeaderboard,
  onOpenSettings,
  onRestart,
  scoreNodeRef,
  lastDeltaBadgeRef,
  deltaPopupRootRef,
  lastSpeedMs,
  avgSpeedMs,
  peakKps,
  mistakesCount,
  sequencesHitCount,
  totalSequencesCount,
  reinforcedHitCount,
  totalReinforcedCount,
}) => {
  const currentKps = lastSpeedMs && lastSpeedMs > 0 ? (1000 / lastSpeedMs).toFixed(1) : '0.0';
  const avgKps = avgSpeedMs && avgSpeedMs > 0 ? (1000 / avgSpeedMs).toFixed(1) : '0.0';

  return (
    <aside className="side-panel">
      {/* TOP BOX: HEADER & CONTROLS (ALIGNED WITH TOP EDGE OF MATRIX BOX) */}
      <div className="panel-card right-header-card">
        <div className="hud-center-brand">
          <h1 className="brand-title-big">FIGRID</h1>
          <span className="brand-subtitle">
            {gameMode === 'OMNI'
              ? '21x13 OMNI-DIRECTIONAL QUANTUM MATRIX'
              : '21x13 SPEED MATRIX'}
          </span>
        </div>

        <div className="right-header-status-row">
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
              onQuickToggleMode();
            }}
          >
            MODE: {gameMode === 'OMNI' ? 'OMNI-8' : 'LINEAR'}
          </button>
        </div>

        <div className="right-header-actions-grid">
          <button
            type="button"
            className={`btn-arcade small ${currentUser ? 'gold' : 'cyan'}`}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenAuth();
            }}
          >
            {currentUser ? `PILOT: ${currentUser.username}` : 'LOGIN / REGISTER'}
          </button>
          <button
            type="button"
            className="btn-arcade small"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenLeaderboard();
            }}
          >
            LEADERBOARD
          </button>
          <button
            type="button"
            className="btn-arcade small cyan"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenSettings();
            }}
          >
            SETTINGS
          </button>
          <button
            type="button"
            className="btn-arcade small"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
          >
            RESTART [ESC]
          </button>
        </div>
      </div>

      {/* BOTTOM BOX: SCORE BOX + KPI TELEMETRY (ALIGNED WITH BOTTOM EDGE OF MATRIX BOX) */}
      <div className="panel-card right-kpi-score-card">
        <div className="panel-header">
          <span className="panel-title">SCORE &amp; TELEMETRY</span>
          <span className="panel-badge">{currentKps} KEYS/S</span>
        </div>

        {/* SCORE BOX (IN PLACE OF THE REMOVED CHART) */}
        <div className="embedded-score-box">
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

        {/* KPI TELEMETRY GRID */}
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
