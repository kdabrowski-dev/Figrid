import React, { useState, useEffect, useMemo } from 'react';
import { GameMode } from './gameEngine';
import { apiFetchSharedLeaderboard, apiFetchMyRuns, UserProfile } from './apiClient';

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
const MY_RUNS_STORAGE_KEY = 'figrid_my_runs_history_v1';

export function loadLocalMyRuns(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(MY_RUNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendLocalMyRun(entry: LeaderboardEntry): void {
  try {
    const current = loadLocalMyRuns();
    const byId = new Map<string, LeaderboardEntry>();
    for (const e of [...current, entry]) {
      if (e && e.id) byId.set(e.id, e);
    }
    localStorage.setItem(MY_RUNS_STORAGE_KEY, JSON.stringify(Array.from(byId.values())));
  } catch {
    // ignore storage errors
  }
}

/**
 * Deduplicates entries for a given mode so ONLY each player's single Personal Best
 * (highest score, tie-broken by fastest totalTimeSec) appears on the Global Leaderboard!
 */
export function getPersonalBestEntriesForMode(
  entries: LeaderboardEntry[],
  mode: GameMode
): LeaderboardEntry[] {
  const modeRuns = entries
    .filter((e) => e.mode === mode)
    .sort((a, b) => b.score - a.score || a.totalTimeSec - b.totalTimeSec);

  const seenPlayers = new Set<string>();
  const personalBests: LeaderboardEntry[] = [];

  for (const entry of modeRuns) {
    const playerKey = entry.username
      ? `user:${entry.username.trim().toLowerCase()}`
      : `nick:${entry.nick.trim().toUpperCase()}`;

    if (!seenPlayers.has(playerKey)) {
      seenPlayers.add(playerKey);
      personalBests.push(entry);
    }
  }

  return personalBests;
}

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
  currentUser: UserProfile | null;
  isBackendOnline: boolean;
  onRefresh: () => void;
  onOpenAuth: () => void;
  onBackToGame: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  defaultMode,
  currentUser,
  isBackendOnline,
  onRefresh,
  onOpenAuth,
  onBackToGame,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(defaultMode);
  const [boardScope, setBoardScope] = useState<'GLOBAL_PB' | 'MY_HALL_OF_FAME'>('GLOBAL_PB');
  const [serverMyRuns, setServerMyRuns] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (currentUser) {
      apiFetchMyRuns().then((runs) => {
        if (runs.length > 0) {
          setServerMyRuns(runs);
        }
      });
    } else {
      setServerMyRuns([]);
    }
  }, [currentUser, entries]);

  // 1. GLOBAL PERSONAL BESTS PER MODE (1 entry per player per mode)
  const globalLinearPBs = useMemo(
    () => getPersonalBestEntriesForMode(entries, 'LINEAR'),
    [entries]
  );
  const globalOmniPBs = useMemo(
    () => getPersonalBestEntriesForMode(entries, 'OMNI'),
    [entries]
  );
  const activeGlobalPBs = selectedMode === 'OMNI' ? globalOmniPBs : globalLinearPBs;

  // 2. MY HALL OF FAME (Complete run history for the logged-in user)
  const allMyRuns = useMemo(() => {
    if (!currentUser) return [];
    const targetUsername = currentUser.username.trim().toLowerCase();
    const localRuns = loadLocalMyRuns();

    const mergedById = new Map<string, LeaderboardEntry>();
    for (const r of [...entries, ...localRuns, ...serverMyRuns]) {
      if (!r || !r.id) continue;
      const matchesUsername =
        r.username && r.username.trim().toLowerCase() === targetUsername;
      if (matchesUsername) {
        mergedById.set(String(r.id), r);
      }
    }
    return Array.from(mergedById.values());
  }, [currentUser, entries, serverMyRuns]);

  const myLinearRuns = useMemo(
    () =>
      allMyRuns
        .filter((e) => e.mode === 'LINEAR')
        .sort((a, b) => b.score - a.score || a.totalTimeSec - b.totalTimeSec),
    [allMyRuns]
  );

  const myOmniRuns = useMemo(
    () =>
      allMyRuns
        .filter((e) => e.mode === 'OMNI')
        .sort((a, b) => b.score - a.score || a.totalTimeSec - b.totalTimeSec),
    [allMyRuns]
  );

  const activeMyRuns = selectedMode === 'OMNI' ? myOmniRuns : myLinearRuns;

  const displayedEntries =
    boardScope === 'GLOBAL_PB' ? activeGlobalPBs : activeMyRuns;

  // Personal KPI summary for My Hall of Fame
  const myPersonalBestScore = activeMyRuns.length > 0 ? activeMyRuns[0].score : 0;
  const myBestTimeSec =
    activeMyRuns.length > 0
      ? Math.min(...activeMyRuns.map((r) => r.totalTimeSec))
      : null;
  const myBestAvgPace =
    activeMyRuns.length > 0
      ? Math.min(...activeMyRuns.map((r) => r.avgSpeedMs))
      : null;

  return (
    <section className="leaderboard-view">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <div>
            <h2 className="leaderboard-title">
              {boardScope === 'MY_HALL_OF_FAME'
                ? `MY HALL OF FAME // ${selectedMode === 'OMNI' ? 'OMNI-8 MODE' : 'LINEAR MODE'}`
                : `HALL OF FAME (PERSONAL BESTS) // ${
                    selectedMode === 'OMNI' ? 'OMNI-8 MODE' : 'LINEAR MODE'
                  }`}
            </h2>
            <p className="leaderboard-sub">
              {boardScope === 'MY_HALL_OF_FAME'
                ? currentUser
                  ? `Personal Run History for Pilot [${currentUser.username}]`
                  : 'Log in to access your personal run history'
                : isBackendOnline
                ? 'One Personal Best per player per mode // Shared PostgreSQL Server'
                : 'Offline Mode // One Personal Best per player per mode'}
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

        {/* TOP SCOPE SWITCHER: GLOBAL PERSONAL BESTS vs MY HALL OF FAME (RUN HISTORY) */}
        <div className="leaderboard-scope-tabs">
          <button
            type="button"
            className={`leaderboard-scope-btn ${
              boardScope === 'GLOBAL_PB' ? 'active' : ''
            }`}
            onClick={() => setBoardScope('GLOBAL_PB')}
          >
            GLOBAL LEADERBOARD (PERSONAL BESTS)
          </button>
          <button
            type="button"
            className={`leaderboard-scope-btn personal ${
              boardScope === 'MY_HALL_OF_FAME' ? 'active' : ''
            }`}
            onClick={() => setBoardScope('MY_HALL_OF_FAME')}
          >
            MY HALL OF FAME {currentUser ? `[${currentUser.username}]` : '(LOGIN)'}
          </button>
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
            <span className="lb-tab-title">
              {boardScope === 'MY_HALL_OF_FAME' ? 'MY LINEAR RUNS' : 'LINEAR RANKING'}
            </span>
            <span className="lb-tab-count">
              {boardScope === 'MY_HALL_OF_FAME'
                ? `${myLinearRuns.length} RUNS`
                : `${globalLinearPBs.length} PILOTS`}
            </span>
          </button>
          <button
            type="button"
            className={`leaderboard-mode-tab omni ${
              selectedMode === 'OMNI' ? 'active' : ''
            }`}
            onClick={() => setSelectedMode('OMNI')}
          >
            <span className="lb-tab-title">
              {boardScope === 'MY_HALL_OF_FAME' ? 'MY OMNI-8 RUNS' : 'OMNI-8 RANKING'}
            </span>
            <span className="lb-tab-count">
              {boardScope === 'MY_HALL_OF_FAME'
                ? `${myOmniRuns.length} RUNS`
                : `${globalOmniPBs.length} PILOTS`}
            </span>
          </button>
        </div>

        {/* IF IN MY HALL OF FAME & NOT LOGGED IN -> PROMPT TO LOGIN */}
        {boardScope === 'MY_HALL_OF_FAME' && !currentUser ? (
          <div className="personal-login-prompt">
            <p className="personal-login-text">
              Log in to view your complete personal run history in MY HALL OF FAME.
            </p>
            <button type="button" className="btn-arcade gold" onClick={onOpenAuth}>
              LOGIN / REGISTER PILOT ACCOUNT
            </button>
          </div>
        ) : (
          <>
            {/* PERSONAL STATS SUMMARY BANNER IN MY HALL OF FAME */}
            {boardScope === 'MY_HALL_OF_FAME' && currentUser && (
              <div className="personal-summary-strip">
                <div className="personal-summary-item">
                  <span className="telemetry-label">PERSONAL BEST ({selectedMode})</span>
                  <span className="telemetry-val highlight-gold">
                    {myPersonalBestScore.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="personal-summary-item">
                  <span className="telemetry-label">COMPLETED RUNS</span>
                  <span className="telemetry-val highlight-cyan">{activeMyRuns.length}</span>
                </div>
                <div className="personal-summary-item">
                  <span className="telemetry-label">FASTEST CLEAR TIME</span>
                  <span className="telemetry-val">
                    {myBestTimeSec !== null ? `${myBestTimeSec.toFixed(2)}s` : '--'}
                  </span>
                </div>
                <div className="personal-summary-item">
                  <span className="telemetry-label">BEST AVG PACE</span>
                  <span className="telemetry-val highlight-magenta">
                    {myBestAvgPace !== null ? `${myBestAvgPace} ms` : '--'}
                  </span>
                </div>
              </div>
            )}

            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>{boardScope === 'MY_HALL_OF_FAME' ? 'RUN #' : 'RANK'}</th>
                    <th>NICK</th>
                    <th>SCORE</th>
                    <th>TOTAL TIME</th>
                    <th>AVG PACE</th>
                    <th>MISTAKES</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-row">
                        {boardScope === 'MY_HALL_OF_FAME'
                          ? `NO PERSONAL RUNS RECORDED IN ${
                              selectedMode === 'OMNI' ? 'OMNI-8' : 'LINEAR'
                            } MODE YET`
                          : `NO SCORES RECORDED IN ${
                              selectedMode === 'OMNI' ? 'OMNI-8' : 'LINEAR'
                            } MODE YET`}
                      </td>
                    </tr>
                  ) : (
                    displayedEntries.map((entry, idx) => {
                      const isCurrentUsersRow =
                        currentUser &&
                        entry.username &&
                        entry.username.trim().toLowerCase() ===
                          currentUser.username.trim().toLowerCase();
                      return (
                        <tr
                          key={entry.id}
                          className={`${idx < 3 ? `top-rank rank-${idx + 1}` : ''} ${
                            isCurrentUsersRow && boardScope === 'GLOBAL_PB'
                              ? 'current-pilot-row'
                              : ''
                          }`}
                        >
                          <td className="col-rank">
                            #{idx + 1}
                            {boardScope === 'MY_HALL_OF_FAME' && idx === 0 && (
                              <span className="pb-badge">PB</span>
                            )}
                          </td>
                          <td className="col-nick">
                            {entry.nick}
                            {entry.username && (
                              <span
                                className="col-pilot-sub"
                                title={`Account: ${entry.username}`}
                              >
                                {' '}
                                [{entry.username}]
                              </span>
                            )}
                          </td>
                          <td className="col-score">
                            {entry.score.toLocaleString('en-US')}
                          </td>
                          <td className="col-time">
                            {typeof entry.totalTimeSec === 'number'
                              ? `${entry.totalTimeSec.toFixed(2)}s`
                              : '--'}
                          </td>
                          <td className="col-pace">{entry.avgSpeedMs} ms</td>
                          <td className="col-mistakes">{entry.mistakes}</td>
                          <td className="col-date">{entry.date}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
