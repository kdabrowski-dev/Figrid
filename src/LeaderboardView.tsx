import React, { useState, useEffect } from 'react';
import { GameMode } from './gameEngine';
import { apiFetchSharedLeaderboard } from './apiClient';

export interface LeaderboardEntry {
  id: string;
  nick: string; // 3 uppercase letters
  score: number;
  mode: GameMode;
  totalTimeSec: number; // Total run time in seconds (e.g. 42.38)
  avgSpeedMs: number;
  mistakes: number;
  date: string;
  username?: string;
}

const LEADERBOARD_STORAGE_KEY = 'figrid_leaderboard_entries_v2';

export async function fetchInitialLeaderboard(): Promise<{
  entries: LeaderboardEntry[];
  isBackendOnline: boolean;
}> {
  // 1. Try shared PostgreSQL backend first
  const backendRes = await apiFetchSharedLeaderboard();
  if (backendRes.online) {
    try {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(backendRes.entries));
    } catch {
      // ignore
    }
    return {
      entries: backendRes.entries.sort((a, b) => b.score - a.score),
      isBackendOnline: true,
    };
  }

  // 2. Fallback to static ./leaderboard.json + browser localStorage when backend is offline
  let diskEntries: LeaderboardEntry[] = [];
  try {
    const res = await fetch('./leaderboard.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        diskEntries = data;
      }
    }
  } catch {
    // fallback if offline
  }

  let localEntries: LeaderboardEntry[] = [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localEntries = parsed;
      }
    }
  } catch {
    // ignore
  }

  const byId = new Map<string, LeaderboardEntry>();
  for (const e of [...diskEntries, ...localEntries]) {
    if (e && e.id) {
      byId.set(e.id, e);
    }
  }

  return {
    entries: Array.from(byId.values()).sort((a, b) => b.score - a.score),
    isBackendOnline: false,
  };
}

export function saveLeaderboardToStorage(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
  fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entries),
  }).catch(() => {
    // Static GitHub Pages fallback
  });
}

export function exportLeaderboardJsonFile(entries: LeaderboardEntry[]): void {
  const blob = new Blob([JSON.stringify(entries, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leaderboard.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  defaultMode: GameMode;
  isBackendOnline: boolean;
  onRefresh: () => void;
  onBackToGame: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  defaultMode,
  isBackendOnline,
  onRefresh,
  onBackToGame,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(defaultMode);

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  const linearCount = entries.filter((e) => e.mode === 'LINEAR').length;
  const omniCount = entries.filter((e) => e.mode === 'OMNI').length;

  const filteredEntries = entries
    .filter((e) => e.mode === selectedMode)
    .sort((a, b) => b.score - a.score || a.totalTimeSec - b.totalTimeSec);

  return (
    <section className="leaderboard-view">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <div>
            <h2 className="leaderboard-title">
              HALL OF FAME // {selectedMode === 'OMNI' ? 'OMNI-8 MODE' : 'LINEAR MODE'}
            </h2>
            <p className="leaderboard-sub">
              {isBackendOnline
                ? 'Connected to shared PostgreSQL Leaderboard Server'
                : 'Offline Mode // Synced with local storage & leaderboard.json'}
            </p>
          </div>
          <div className="leaderboard-actions">
            <button
              type="button"
              className="btn-arcade small cyan"
              onClick={onRefresh}
              title="Refresh scores from server"
            >
              REFRESH
            </button>
            <button
              type="button"
              className="btn-arcade small gold"
              onClick={() => exportLeaderboardJsonFile(entries)}
              title="Download leaderboard.json backup"
            >
              SAVE leaderboard.json
            </button>
            <button type="button" className="btn-arcade small" onClick={onBackToGame}>
              BACK TO GAME
            </button>
          </div>
        </div>

        {/* SEPARATE MODE RANKING TABS (LINEAR vs OMNI-8) */}
        <div className="leaderboard-mode-tabs">
          <button
            type="button"
            className={`leaderboard-mode-tab linear ${
              selectedMode === 'LINEAR' ? 'active' : ''
            }`}
            onClick={() => setSelectedMode('LINEAR')}
          >
            <span className="lb-tab-title">LINEAR RANKING</span>
            <span className="lb-tab-count">{linearCount} RUNS</span>
          </button>
          <button
            type="button"
            className={`leaderboard-mode-tab omni ${
              selectedMode === 'OMNI' ? 'active' : ''
            }`}
            onClick={() => setSelectedMode('OMNI')}
          >
            <span className="lb-tab-title">OMNI-8 RANKING</span>
            <span className="lb-tab-count">{omniCount} RUNS</span>
          </button>
        </div>

        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>NICK</th>
                <th>SCORE</th>
                <th>TOTAL TIME</th>
                <th>AVG PACE</th>
                <th>MISTAKES</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-row">
                    NO SCORES RECORDED IN {selectedMode === 'OMNI' ? 'OMNI-8' : 'LINEAR'} MODE YET
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr key={entry.id} className={idx < 3 ? `top-rank rank-${idx + 1}` : ''}>
                    <td className="col-rank">#{idx + 1}</td>
                    <td className="col-nick">
                      {entry.nick}
                      {entry.username && (
                        <span className="col-pilot-sub" title={`Account: ${entry.username}`}>
                          {' '}
                          [{entry.username}]
                        </span>
                      )}
                    </td>
                    <td className="col-score">{entry.score.toLocaleString('en-US')}</td>
                    <td className="col-time">
                      {typeof entry.totalTimeSec === 'number'
                        ? `${entry.totalTimeSec.toFixed(2)}s`
                        : '--'}
                    </td>
                    <td className="col-pace">{entry.avgSpeedMs} ms</td>
                    <td className="col-mistakes">{entry.mistakes}</td>
                    <td className="col-date">{entry.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
