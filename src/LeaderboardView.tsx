import React from 'react';
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
  // Also persist directly to public/leaderboard.json on disk when running Vite dev server locally
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
  isBackendOnline: boolean;
  onRefresh: () => void;
  onBackToGame: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  isBackendOnline,
  onRefresh,
  onBackToGame,
}) => {
  return (
    <section className="leaderboard-view">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <div>
            <h2 className="leaderboard-title">HALL OF FAME // LEADERBOARD</h2>
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

        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>NICK</th>
                <th>SCORE</th>
                <th>TOTAL TIME</th>
                <th>MODE</th>
                <th>AVG PACE</th>
                <th>MISTAKES</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-row">
                    NO SCORES RECORDED YET
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
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
                    <td className="col-mode">
                      <span className={`mode-pill ${entry.mode.toLowerCase()}`}>
                        {entry.mode === 'OMNI' ? 'OMNI-8' : 'LINEAR'}
                      </span>
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
