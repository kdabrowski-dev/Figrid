import React, { useState } from 'react';
import { GameMode, TOTAL_CELLS, BINARY_TOTAL_CELLS, CURRENT_GAME_VERSION } from './gameEngine';
import { UserProfile } from './apiClient';
import { UserBadge, BadgeList, BadgeInspectModal } from './BadgeIcons';

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
  onOpenHelp: () => void;
  onOpenReleaseNotes: () => void;
  onRestart: () => void;

  // Score box refs
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
  quantumMergesCount: number;
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
  onOpenHelp,
  onOpenReleaseNotes,
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
  quantumMergesCount,
  reinforcedHitCount,
  totalReinforcedCount,
}) => {
  const [inspectedBadge, setInspectedBadge] = useState<UserBadge | null>(null);
  const currentKps = lastSpeedMs && lastSpeedMs > 0 ? (1000 / lastSpeedMs).toFixed(1) : '0.0';
  const avgKps = avgSpeedMs && avgSpeedMs > 0 ? (1000 / avgSpeedMs).toFixed(1) : '0.0';
  const totalBoardCells = gameMode === 'BINARY' ? BINARY_TOTAL_CELLS : TOTAL_CELLS;

  return (
    <aside className="side-panel">
      {/* TOP BOX: HEADER & CONTROLS (ALIGNED WITH TOP EDGE OF MATRIX BOX) */}
      <div className="panel-card right-header-card">
        <div className="hud-brand-top-row">
          <button
            type="button"
            className="btn-version-tag"
            title="View v0.0.2 Release Notes"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenReleaseNotes();
            }}
          >
            v{CURRENT_GAME_VERSION}
          </button>

          <div className="hud-center-brand">
            <h1 className="brand-title-big">FIGRID</h1>
            <span className="brand-subtitle">
              {gameMode === 'OMNI'
                ? '21x13 OMNI-DIRECTIONAL QUANTUM MATRIX'
                : gameMode === 'BINARY'
                ? '8x8 BINARY 3-BIT DECODER MATRIX'
                : '21x13 SPEED MATRIX'}
            </span>
          </div>

          <button
            type="button"
            className="btn-help-question"
            title="How to Play & Scoring Rules (?)"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenHelp();
            }}
          >
            ?
          </button>
        </div>

        <div className="right-header-status-row">
          <div className="progress-box">
            <span className="hud-label">PROGRESS</span>
            <span ref={progressNodeRef} className="hud-progress-val">
              0 / {totalBoardCells}
            </span>
          </div>
          <button
            type="button"
            className={`btn-arcade small ${
              gameMode === 'OMNI' ? 'gold' : gameMode === 'BINARY' ? 'magenta' : 'cyan'
            }`}
            title="Switch between Linear, Omni-8, and Binary 8x8 mode"
            onClick={(e) => {
              e.currentTarget.blur();
              onQuickToggleMode();
            }}
          >
            MODE: {gameMode === 'OMNI' ? 'OMNI-8' : gameMode === 'BINARY' ? 'BINARY' : 'LINEAR'}
          </button>
        </div>

        <div className="right-header-actions-grid">
          <button
            type="button"
            className={`btn-arcade small ${currentUser ? 'gold' : 'cyan'} pilot-btn-with-badges`}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenAuth();
            }}
          >
            <span>{currentUser ? currentUser.username : 'LOGIN'}</span>
            {currentUser && currentUser.badges && currentUser.badges.length > 0 && (
              <BadgeList
                badges={currentUser.badges.slice(0, 3)}
                size={16}
                onInspectBadge={(b) => setInspectedBadge(b)}
              />
            )}
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
            KEYS
          </button>
          <button
            type="button"
            className="btn-arcade small"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
          >
            RESET
          </button>
        </div>
      </div>

      {/* BOTTOM BOX: SCORE BOX + KPI TELEMETRY (ALIGNED WITH BOTTOM EDGE OF MATRIX BOX) */}
      <div className="panel-card right-kpi-score-card">
        <div className="panel-header">
          <span className="panel-title">SCORE &amp; TELEMETRY</span>
          <span className="panel-badge">{currentKps} KEYS/S</span>
        </div>

        {/* SCORE BOX (CENTERED SCORE WITHOUT "TOTAL SCORE" LABEL) */}
        <div className="embedded-score-box centered-score-box">
          <div ref={deltaPopupRootRef} className="delta-popup-layer" />
          <span ref={lastDeltaBadgeRef} className="last-delta-pill floating-delta-pill">
            +0
          </span>
          <div className="bottom-score-digits-row centered-digits-row">
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
            <span className="telemetry-label">SHIELDS CLEARED</span>
            <span className="telemetry-val highlight-cyan">
              {reinforcedHitCount} / {totalReinforcedCount}
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">MISTAKES</span>
            <span className="telemetry-val highlight-red">{mistakesCount}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">
              {gameMode === 'OMNI'
                ? 'QUANTUM MERGES'
                : gameMode === 'BINARY'
                ? 'BINARY OVERCLOCKS'
                : 'SECRET SEQUENCES'}
            </span>
            <span className="telemetry-val highlight-gold">
              {gameMode === 'OMNI'
                ? `${quantumMergesCount}`
                : gameMode === 'BINARY'
                ? `${sequencesHitCount}`
                : `${sequencesHitCount} / ${totalSequencesCount}`}
            </span>
          </div>
        </div>
      </div>

      {/* CLICK-TO-INSPECT BADGE MODAL FROM PILOT HEADER BUTTON */}
      <BadgeInspectModal badge={inspectedBadge} onClose={() => setInspectedBadge(null)} />
    </aside>
  );
};
