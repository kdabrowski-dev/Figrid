import React, { useState, useEffect, useMemo } from 'react';
import {
  GameMode,
  CURRENT_GAME_VERSION,
  PREVIOUS_GAME_VERSION,
  V001_COMMIT_HASH,
} from './gameEngine';
import {
  apiFetchSharedLeaderboard,
  apiFetchMyRuns,
  apiFetchArchivePodium,
  UserProfile,
} from './apiClient';
import {
  UserBadge,
  BadgeList,
  BadgeInspectModal,
  PilotProfileModal,
  PilotProfileSummary,
} from './BadgeIcons';

export interface LeaderboardEntry {
  id: string;
  nick: string; // 3 uppercase letters
  score: number;
  mode: GameMode;
  version?: string;
  podiumRank?: number;
  totalTimeSec: number; // Total run time in seconds (e.g. 42.38)
  avgSpeedMs: number;
  mistakes: number;
  isMobile?: boolean;
  date: string;
  username?: string;
  preferredMode?: GameMode;
  badges?: UserBadge[];
}

const LEADERBOARD_STORAGE_KEY = 'figrid_leaderboard_entries_v0_0_2';
const LEGACY_V001_STORAGE_KEY = 'figrid_leaderboard_entries_v2';
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
  mode: GameMode,
  isMobilePlatform = false
): LeaderboardEntry[] {
  const modeRuns = entries
    .filter(
      (e) =>
        e.mode === mode &&
        Boolean(e.isMobile) === isMobilePlatform &&
        (e.version || CURRENT_GAME_VERSION) === CURRENT_GAME_VERSION
    )
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

  return {
    entries: localEntries.sort((a, b) => b.score - a.score),
    isBackendOnline: false,
  };
}

export function saveLeaderboardToStorage(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function exportLeaderboardJsonFile(entries: LeaderboardEntry[]): void {
  const blob = new Blob([JSON.stringify(entries, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leaderboard_v${CURRENT_GAME_VERSION}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  defaultMode: GameMode;
  defaultIsMobile?: boolean;
  currentUser: UserProfile | null;
  isBackendOnline: boolean;
  onRefresh: () => void;
  onOpenAuth: () => void;
  onBackToGame: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  defaultMode,
  defaultIsMobile = false,
  currentUser,
  isBackendOnline,
  onRefresh,
  onOpenAuth,
  onBackToGame,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(defaultMode);
  const [platformFilter, setPlatformFilter] = useState<'PC' | 'MOBILE'>(
    defaultIsMobile ? 'MOBILE' : 'PC'
  );
  const [boardScope, setBoardScope] = useState<'GLOBAL_PB' | 'MY_HALL_OF_FAME' | 'ARCHIVE_PODIUM'>(
    'GLOBAL_PB'
  );
  // Single version filter in MY HALL OF FAME (only one selected at a time!)
  const [personalVersionFilter, setPersonalVersionFilter] = useState<string>(CURRENT_GAME_VERSION);
  const [archiveVersionFilter, setArchiveVersionFilter] = useState<string>(PREVIOUS_GAME_VERSION);

  const [serverMyRuns, setServerMyRuns] = useState<LeaderboardEntry[]>([]);
  const [archivePodiumEntries, setArchivePodiumEntries] = useState<LeaderboardEntry[]>([]);
  const [inspectedBadge, setInspectedBadge] = useState<UserBadge | null>(null);
  const [inspectedPilot, setInspectedPilot] = useState<PilotProfileSummary | null>(null);

  const handleOpenPilotProfile = (entry: LeaderboardEntry) => {
    const isSelf =
      currentUser &&
      entry.username &&
      entry.username.trim().toLowerCase() === currentUser.username.trim().toLowerCase();
    setInspectedPilot({
      nick: isSelf ? currentUser.nick : entry.nick,
      username: entry.username,
      preferredMode: isSelf
        ? currentUser.preferredMode
        : entry.preferredMode || entry.mode,
      badges: isSelf ? currentUser.badges : entry.badges || [],
    });
  };

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (currentUser) {
      apiFetchMyRuns(personalVersionFilter).then((runs) => {
        setServerMyRuns(runs);
      });
    } else {
      setServerMyRuns([]);
    }
  }, [currentUser, personalVersionFilter, entries]);

  useEffect(() => {
    apiFetchArchivePodium(archiveVersionFilter).then((podium) => {
      setArchivePodiumEntries(podium);
    });
  }, [archiveVersionFilter]);

  const isMobileSelected = platformFilter === 'MOBILE';

  // 1. GLOBAL v0.0.2 PERSONAL BESTS PER MODE (SEPARATED BY PC vs MOBILE)
  const globalLinearPBs = useMemo(
    () => getPersonalBestEntriesForMode(entries, 'LINEAR', isMobileSelected),
    [entries, isMobileSelected]
  );
  const globalOmniPBs = useMemo(
    () => getPersonalBestEntriesForMode(entries, 'OMNI', isMobileSelected),
    [entries, isMobileSelected]
  );
  const globalBinaryPBs = useMemo(
    () => getPersonalBestEntriesForMode(entries, 'BINARY', isMobileSelected),
    [entries, isMobileSelected]
  );
  const activeGlobalPBs =
    selectedMode === 'OMNI'
      ? globalOmniPBs
      : selectedMode === 'BINARY'
      ? globalBinaryPBs
      : globalLinearPBs;

  // 2. MY HALL OF FAME (Filtered by strictly ONE selected version: 0.0.2 or 0.0.1)
  const allMyRunsForVersion = useMemo(() => {
    if (!currentUser) return [];
    const targetUsername = currentUser.username.trim().toLowerCase();
    const localRuns = loadLocalMyRuns();

    let legacyV001Runs: LeaderboardEntry[] = [];
    if (personalVersionFilter === PREVIOUS_GAME_VERSION) {
      try {
        const rawLegacy = localStorage.getItem(LEGACY_V001_STORAGE_KEY);
        if (rawLegacy) {
          const parsed = JSON.parse(rawLegacy);
          if (Array.isArray(parsed)) {
            legacyV001Runs = parsed.map((r: LeaderboardEntry) => ({
              ...r,
              version: PREVIOUS_GAME_VERSION,
            }));
          }
        }
      } catch {
        // ignore
      }
    }

    const mergedById = new Map<string, LeaderboardEntry>();
    for (const r of [...entries, ...localRuns, ...legacyV001Runs, ...serverMyRuns]) {
      if (!r || !r.id) continue;
      const entryVer = r.version || CURRENT_GAME_VERSION;
      if (entryVer !== personalVersionFilter) continue;
      const matchesUsername =
        r.username && r.username.trim().toLowerCase() === targetUsername;
      if (matchesUsername) {
        mergedById.set(String(r.id), {
          ...r,
          badges: r.badges && r.badges.length > 0 ? r.badges : currentUser.badges,
        });
      }
    }
    return Array.from(mergedById.values());
  }, [currentUser, entries, serverMyRuns, personalVersionFilter]);

  const myLinearRuns = useMemo(
    () =>
      allMyRunsForVersion
        .filter((e) => e.mode === 'LINEAR' && Boolean(e.isMobile) === isMobileSelected)
        .sort((a, b) => b.score - a.score || a.totalTimeSec - b.totalTimeSec),
    [allMyRunsForVersion, isMobileSelected]
  );

  const myOmniRuns = useMemo(
    () =>
      allMyRunsForVersion
        .filter((e) => e.mode === 'OMNI' && Boolean(e.isMobile) === isMobileSelected)
        .sort((a, b) => b.score - a.score || a.totalTimeSec - b.totalTimeSec),
    [allMyRunsForVersion, isMobileSelected]
  );

  const myBinaryRuns = useMemo(
    () =>
      allMyRunsForVersion
        .filter((e) => e.mode === 'BINARY' && Boolean(e.isMobile) === isMobileSelected)
        .sort((a, b) => b.score - a.score || a.totalTimeSec - b.totalTimeSec),
    [allMyRunsForVersion, isMobileSelected]
  );

  const activeMyRuns =
    selectedMode === 'OMNI'
      ? myOmniRuns
      : selectedMode === 'BINARY'
      ? myBinaryRuns
      : myLinearRuns;
  const displayedEntries =
    boardScope === 'GLOBAL_PB' ? activeGlobalPBs : activeMyRuns;

  // 3. ARCHIVE HALL OF FAME 5-PLACE PODIUM (Ordered 4 - 2 - 1 - 3 - 5)
  const activeArchiveTop5 = useMemo(() => {
    const modePodium = archivePodiumEntries
      .filter((e) => e.mode === selectedMode)
      .sort((a, b) => (a.podiumRank ?? 99) - (b.podiumRank ?? 99))
      .slice(0, 5);

    const byRank = new Map<number, LeaderboardEntry>();
    modePodium.forEach((entry, idx) => {
      const r = entry.podiumRank ?? idx + 1;
      byRank.set(r, entry);
    });

    // Visual order requested: [4, 2, 1, 3, 5] (Center is #1 tallest, flanked by #2 & #3, then #4 & #5)
    const visualOrder = [4, 2, 1, 3, 5];
    return visualOrder.map((rank) => ({
      rank,
      entry: byRank.get(rank) || null,
    }));
  }, [archivePodiumEntries, selectedMode]);

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

  const modeDisplayName =
    selectedMode === 'OMNI' ? 'OMNI-8' : selectedMode === 'BINARY' ? 'BINARY' : 'LINEAR';

  return (
    <section className="leaderboard-view">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <div>
            <h2 className="leaderboard-title">
              {boardScope === 'ARCHIVE_PODIUM'
                ? `ARCHIVE HALL OF FAME (v${archiveVersionFilter}) // ${modeDisplayName} PODIUM`
                : boardScope === 'MY_HALL_OF_FAME'
                ? `MY HALL OF FAME (v${personalVersionFilter}) // ${modeDisplayName} MODE`
                : `HALL OF FAME v${CURRENT_GAME_VERSION} (PERSONAL BESTS) // ${modeDisplayName} MODE`}
            </h2>
            <p className="leaderboard-sub">
              {boardScope === 'ARCHIVE_PODIUM'
                ? `Immortalized Top 5 Pilots from Version ${archiveVersionFilter} (Commit ${V001_COMMIT_HASH})`
                : boardScope === 'MY_HALL_OF_FAME'
                ? currentUser
                  ? `Personal Run History for Pilot [${currentUser.username}] // Filtered by v${personalVersionFilter}`
                  : 'Log in to access your personal run history'
                : isBackendOnline
                ? `Active Season v${CURRENT_GAME_VERSION} // Server-Verified Personal Bests`
                : `Active Season v${CURRENT_GAME_VERSION} // One Personal Best per player per mode`}
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
              SAVE JSON
            </button>
            <button type="button" className="btn-arcade small" onClick={onBackToGame}>
              BACK TO GAME
            </button>
          </div>
        </div>

        {/* TOP SCOPE SWITCHER: GLOBAL v0.0.2 vs MY HALL OF FAME vs ARCHIVE PODIUM */}
        <div className="leaderboard-scope-tabs three-cols">
          <button
            type="button"
            className={`leaderboard-scope-btn ${
              boardScope === 'GLOBAL_PB' ? 'active' : ''
            }`}
            onClick={() => setBoardScope('GLOBAL_PB')}
          >
            GLOBAL LEADERBOARD (v{CURRENT_GAME_VERSION})
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
          <button
            type="button"
            className={`leaderboard-scope-btn archive ${
              boardScope === 'ARCHIVE_PODIUM' ? 'active' : ''
            }`}
            onClick={() => setBoardScope('ARCHIVE_PODIUM')}
          >
            ARCHIVE HALL OF FAME (PODIUM)
          </button>
        </div>

        {/* SEPARATE PLATFORM SET SWITCHER: PC / KEYBOARD vs MOBILE / TOUCH */}
        {boardScope !== 'ARCHIVE_PODIUM' && (
          <div className="leaderboard-platform-tabs">
            <button
              type="button"
              className={`leaderboard-platform-btn ${platformFilter === 'PC' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('PC')}
            >
              PC / KEYBOARD LEADERBOARD
            </button>
            <button
              type="button"
              className={`leaderboard-platform-btn mobile-plat ${
                platformFilter === 'MOBILE' ? 'active' : ''
              }`}
              onClick={() => setPlatformFilter('MOBILE')}
            >
              MOBILE / TOUCH LEADERBOARD [MOB]
            </button>
          </div>
        )}

        {/* SEPARATE MODE RANKING TABS (LINEAR vs OMNI-8 vs BINARY) */}
        <div className="leaderboard-mode-tabs three-cols">
          <button
            type="button"
            className={`leaderboard-mode-tab linear ${
              selectedMode === 'LINEAR' ? 'active' : ''
            }`}
            onClick={() => setSelectedMode('LINEAR')}
          >
            <span className="lb-tab-title">
              {boardScope === 'ARCHIVE_PODIUM'
                ? `v${archiveVersionFilter} LINEAR TOP 5 PODIUM`
                : boardScope === 'MY_HALL_OF_FAME'
                ? `MY LINEAR RUNS (v${personalVersionFilter})`
                : 'LINEAR RANKING'}
            </span>
            <span className="lb-tab-count">
              {boardScope === 'ARCHIVE_PODIUM'
                ? 'TOP 5'
                : boardScope === 'MY_HALL_OF_FAME'
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
              {boardScope === 'ARCHIVE_PODIUM'
                ? `v${archiveVersionFilter} OMNI-8 TOP 5 PODIUM`
                : boardScope === 'MY_HALL_OF_FAME'
                ? `MY OMNI-8 RUNS (v${personalVersionFilter})`
                : 'OMNI-8 RANKING'}
            </span>
            <span className="lb-tab-count">
              {boardScope === 'ARCHIVE_PODIUM'
                ? 'TOP 5'
                : boardScope === 'MY_HALL_OF_FAME'
                ? `${myOmniRuns.length} RUNS`
                : `${globalOmniPBs.length} PILOTS`}
            </span>
          </button>
          <button
            type="button"
            className={`leaderboard-mode-tab binary ${
              selectedMode === 'BINARY' ? 'active' : ''
            }`}
            onClick={() => setSelectedMode('BINARY')}
          >
            <span className="lb-tab-title">
              {boardScope === 'ARCHIVE_PODIUM'
                ? `v${archiveVersionFilter} BINARY TOP 5 PODIUM`
                : boardScope === 'MY_HALL_OF_FAME'
                ? `MY BINARY RUNS (v${personalVersionFilter})`
                : 'BINARY RANKING'}
            </span>
            <span className="lb-tab-count">
              {boardScope === 'ARCHIVE_PODIUM'
                ? 'TOP 5'
                : boardScope === 'MY_HALL_OF_FAME'
                ? `${myBinaryRuns.length} RUNS`
                : `${globalBinaryPBs.length} PILOTS`}
            </span>
          </button>
        </div>

        {/* ===================================================================
            VIEW A: ARCHIVE HALL OF FAME (5-PLACE GRAPHICAL FUTURISTIC PODIUM)
            =================================================================== */}
        {boardScope === 'ARCHIVE_PODIUM' ? (
          <div className="archive-podium-section">
            <div className="version-filter-bar">
              <span className="version-filter-label">ARCHIVED SEASON VERSION:</span>
              <button
                type="button"
                className={`version-pill-btn ${
                  archiveVersionFilter === PREVIOUS_GAME_VERSION ? 'active' : ''
                }`}
                onClick={() => setArchiveVersionFilter(PREVIOUS_GAME_VERSION)}
              >
                v{PREVIOUS_GAME_VERSION} (COMMIT {V001_COMMIT_HASH})
              </button>
            </div>

            {/* 5-PLACE FUTURISTIC GRAPHICAL PODIUM: [ #4 ] [ #2 ] [ #1 ] [ #3 ] [ #5 ] */}
            <div className="futuristic-podium-stage">
              {activeArchiveTop5.map(({ rank, entry }) => (
                <div
                  key={rank}
                  className={`podium-column rank-col-${rank} ${
                    entry ? 'occupied' : 'empty-slot'
                  }`}
                >
                  {/* Pilot Hologram Card floating above the pedestal */}
                  <div className="podium-pilot-card">
                    <div className="podium-rank-crest">
                      {rank === 1
                        ? '1ST // CHAMPION'
                        : rank === 2
                        ? '2ND // SILVER'
                        : rank === 3
                        ? '3RD // BRONZE'
                        : `${rank}TH PLACE`}
                    </div>

                    {entry ? (
                      <>
                        <div className="podium-nick-row">
                          <button
                            type="button"
                            className="pilot-inspect-trigger podium-nick"
                            title="Click to inspect Pilot Profile"
                            onClick={() => handleOpenPilotProfile(entry)}
                          >
                            {entry.nick}
                          </button>
                          <BadgeList
                            badges={entry.badges}
                            size={rank === 1 ? 24 : 20}
                            onInspectBadge={(b) => setInspectedBadge(b)}
                          />
                        </div>
                        {entry.username && (
                          <button
                            type="button"
                            className="pilot-inspect-trigger podium-username"
                            title="Click to inspect Pilot Profile"
                            onClick={() => handleOpenPilotProfile(entry)}
                          >
                            [{entry.username}]
                          </button>
                        )}
                        <div className="podium-score-val">
                          {entry.score.toLocaleString('en-US')} <small>PTS</small>
                        </div>
                        <div className="podium-telemetry-mini">
                          <span>TIME: {entry.totalTimeSec.toFixed(2)}s</span>
                          <span>PACE: {entry.avgSpeedMs}ms</span>
                          <span>ERR: {entry.mistakes}</span>
                        </div>
                      </>
                    ) : (
                      <div className="podium-unclaimed">UNCLAIMED</div>
                    )}
                  </div>

                  {/* Futuristic Glowing Pedestal Pillar */}
                  <div className="podium-pillar">
                    <div className="podium-pillar-top-lip" />
                    <span className="podium-pillar-big-num">#{rank}</span>
                    <div className="podium-pillar-grid-lines" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : boardScope === 'MY_HALL_OF_FAME' && !currentUser ? (
          /* ===================================================================
             VIEW B (LOGGED OUT): PROMPT TO LOGIN FOR MY HALL OF FAME
             =================================================================== */
          <div className="personal-login-prompt">
            <p className="personal-login-text">
              Log in to view your complete personal run history and version filter in MY HALL OF
              FAME.
            </p>
            <button type="button" className="btn-arcade gold" onClick={onOpenAuth}>
              LOGIN / REGISTER PILOT ACCOUNT
            </button>
          </div>
        ) : (
          /* ===================================================================
             VIEW B (LOGGED IN) & VIEW C (GLOBAL v0.0.2 LEADERBOARD TABLE)
             =================================================================== */
          <>
            {boardScope === 'MY_HALL_OF_FAME' && currentUser && (
              <>
                {/* SINGLE VERSION SELECTOR (STRICTLY ONE VERSION SELECTED AT A TIME) */}
                <div className="version-filter-bar">
                  <span className="version-filter-label">FILTER BY GAME VERSION:</span>
                  <div className="version-filter-buttons">
                    <button
                      type="button"
                      className={`version-pill-btn ${
                        personalVersionFilter === CURRENT_GAME_VERSION ? 'active' : ''
                      }`}
                      onClick={() => setPersonalVersionFilter(CURRENT_GAME_VERSION)}
                    >
                      v{CURRENT_GAME_VERSION} (CURRENT)
                    </button>
                    <button
                      type="button"
                      className={`version-pill-btn ${
                        personalVersionFilter === PREVIOUS_GAME_VERSION ? 'active' : ''
                      }`}
                      onClick={() => setPersonalVersionFilter(PREVIOUS_GAME_VERSION)}
                    >
                      v{PREVIOUS_GAME_VERSION} (ARCHIVE)
                    </button>
                  </div>
                </div>

                {/* PERSONAL STATS SUMMARY BANNER */}
                <div className="personal-summary-strip">
                  <div className="personal-summary-item">
                    <span className="telemetry-label">
                      PERSONAL BEST ({selectedMode} v{personalVersionFilter})
                    </span>
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
              </>
            )}

            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>{boardScope === 'MY_HALL_OF_FAME' ? 'RUN #' : 'RANK'}</th>
                    <th>PILOT &amp; BADGES</th>
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
                          ? `NO PERSONAL RUNS RECORDED IN ${modeDisplayName} MODE FOR v${personalVersionFilter}`
                          : `NO SCORES RECORDED IN ${modeDisplayName} MODE FOR v${CURRENT_GAME_VERSION} YET`}
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
                            <div className="col-nick-flex">
                              <button
                                type="button"
                                className="pilot-inspect-trigger"
                                title="Click to inspect Pilot Profile & Badges"
                                onClick={() => handleOpenPilotProfile(entry)}
                              >
                                <span>{entry.nick}</span>
                                {entry.username && (
                                  <span className="col-pilot-sub">
                                    [{entry.username}]
                                  </span>
                                )}
                                {entry.isMobile && (
                                  <span className="mob-run-pill" title="Mobile Touch Run">
                                    MOB
                                  </span>
                                )}
                              </button>
                              <BadgeList
                                badges={entry.badges}
                                size={20}
                                onInspectBadge={(b) => setInspectedBadge(b)}
                              />
                            </div>
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

      {/* CLICK-TO-INSPECT PILOT PROFILE MODAL */}
      <PilotProfileModal
        pilot={inspectedPilot}
        onClose={() => setInspectedPilot(null)}
        onInspectBadge={(b) => setInspectedBadge(b)}
      />

      {/* CLICK-TO-INSPECT BADGE MODAL */}
      <BadgeInspectModal badge={inspectedBadge} onClose={() => setInspectedBadge(null)} />
    </section>
  );
};
