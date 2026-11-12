import {
  GameMode,
  GeneratedBoard,
  KeyBindingsMap,
  CURRENT_GAME_VERSION,
  PREVIOUS_GAME_VERSION,
} from './gameEngine';
import { LeaderboardEntry } from './LeaderboardView';
import { UserBadge } from './BadgeIcons';

const DEFAULT_BACKEND_URL = 'https://crib-dry-hypnotize.ngrok-free.dev';
const JWT_STORAGE_KEY = 'figrid_jwt_token_v1';

export function getApiBaseUrl(): string {
  const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL;
  return (envUrl || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
}

export interface UserProfile {
  id: number;
  username: string;
  nick: string;
  preferredMode: GameMode;
  keyBindings: KeyBindingsMap;
  badges?: UserBadge[];
  createdAt?: string | null;
}

export interface KeystrokeTelemetryEvent {
  digit: number;
  clientTs: number;
  downUpDurationMs: number;
  isTrusted: boolean;
  physKeyCode?: string;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(JWT_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(JWT_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function buildHeaders(includeAuth = true): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  if (includeAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

function mapRawBadges(rawBadges: unknown): UserBadge[] {
  if (!Array.isArray(rawBadges)) return [];
  return rawBadges.map((b: Record<string, unknown>) => ({
    code: String(b.code ?? ''),
    title: String(b.title ?? b.code ?? ''),
    description: String(b.description ?? ''),
    versionTag: b.versionTag ? String(b.versionTag) : undefined,
    awardedAt: b.awardedAt ? String(b.awardedAt) : undefined,
  }));
}

function mapRawScoreEntry(item: Record<string, unknown>): LeaderboardEntry {
  const rawMode = String(item.mode ?? 'LINEAR').toUpperCase();
  const modeVal: GameMode =
    rawMode === 'OMNI' ? 'OMNI' : rawMode === 'BINARY' ? 'BINARY' : 'LINEAR';
  const rawPref = String(item.preferredMode ?? 'LINEAR').toUpperCase();
  const prefModeVal: GameMode =
    rawPref === 'OMNI' ? 'OMNI' : rawPref === 'BINARY' ? 'BINARY' : 'LINEAR';

  return {
    id: String(item.id ?? `score-${Math.random()}`),
    nick: String(item.nick ?? 'AAA').slice(0, 3).toUpperCase(),
    score: Number(item.score ?? 0),
    mode: modeVal,
    version: item.version ? String(item.version) : CURRENT_GAME_VERSION,
    podiumRank: typeof item.podiumRank === 'number' ? item.podiumRank : undefined,
    totalTimeSec: Number(item.totalTimeSec ?? 0),
    avgSpeedMs: Number(item.avgSpeedMs ?? 0),
    mistakes: Number(item.mistakes ?? 0),
    date: String(item.date ?? new Date().toISOString().slice(0, 10)),
    username: item.username ? String(item.username) : undefined,
    preferredMode: prefModeVal,
    badges: mapRawBadges(item.badges),
  };
}

export async function apiRegister(
  username: string,
  password: string,
  nick: string,
  preferredMode: GameMode,
  keyBindings: KeyBindingsMap
): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: buildHeaders(false),
    body: JSON.stringify({
      username,
      password,
      nick,
      preferredMode,
      keyBindings,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || 'Registration failed');
  }
  return json.data;
}

export async function apiLogin(
  username: string,
  password: string
): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: buildHeaders(false),
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || 'Login failed');
  }
  return json.data;
}

export async function apiFetchCurrentUser(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      method: 'GET',
      headers: buildHeaders(true),
    });
    if (!res.ok) {
      if (res.status === 401) {
        setStoredToken(null);
      }
      return null;
    }
    const json = await res.json();
    return json?.data?.user || null;
  } catch {
    return null;
  }
}

export async function apiUpdateUserSettings(payload: {
  nick?: string;
  preferredMode?: GameMode;
  keyBindings?: KeyBindingsMap;
}): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/user/settings`, {
      method: 'PUT',
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function apiStartGameSession(
  mode: GameMode,
  clientBoard?: GeneratedBoard
): Promise<{
  sessionToken: string;
  board: GeneratedBoard;
} | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/game/start`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({ mode, board: clientBoard }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const sessionToken = json?.data?.sessionToken;
    const rawBoard = json?.data?.board;
    if (!sessionToken || !rawBoard || !Array.isArray(rawBoard.cells)) {
      return null;
    }
    return {
      sessionToken: String(sessionToken),
      board: {
        cells: rawBoard.cells,
        sequences: Array.isArray(rawBoard.sequences) ? rawBoard.sequences : [],
        totalTheoreticalSeqBonus: Number(rawBoard.totalTheoreticalSeqBonus ?? 0),
        totalReinforcedCount: Number(rawBoard.totalReinforcedCount ?? 25),
      },
    };
  } catch {
    return null;
  }
}

export interface FinishSessionResult {
  ok: boolean;
  entry?: LeaderboardEntry;
  newBadges?: UserBadge[];
  user?: UserProfile;
  botDetected?: boolean;
  badgeAwarded?: UserBadge | null;
  error?: string;
}

export async function apiFinishGameSession(payload: {
  sessionToken: string | null;
  nick: string;
  events: KeystrokeTelemetryEvent[];
}): Promise<FinishSessionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/game/finish`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        botDetected: Boolean(json?.botDetected),
        badgeAwarded: json?.badgeAwarded ? mapRawBadges([json.badgeAwarded])[0] : null,
        user: json?.user || undefined,
        error: json?.error || 'Score verification failed.',
      };
    }
    return {
      ok: true,
      entry: json?.data ? mapRawScoreEntry(json.data) : undefined,
      newBadges: mapRawBadges(json?.newBadges),
      user: json?.user || undefined,
    };
  } catch {
    return {
      ok: false,
      error: 'Unable to reach verification server.',
    };
  }
}

export async function apiFetchSharedLeaderboard(): Promise<{
  entries: LeaderboardEntry[];
  online: boolean;
}> {
  try {
    const [linearRes, omniRes, binaryRes] = await Promise.all([
      fetch(`${getApiBaseUrl()}/api/leaderboard?mode=LINEAR&limit=200`, {
        method: 'GET',
        headers: buildHeaders(false),
      }),
      fetch(`${getApiBaseUrl()}/api/leaderboard?mode=OMNI&limit=200`, {
        method: 'GET',
        headers: buildHeaders(false),
      }),
      fetch(`${getApiBaseUrl()}/api/leaderboard?mode=BINARY&limit=200`, {
        method: 'GET',
        headers: buildHeaders(false),
      }),
    ]);

    if (linearRes.ok && omniRes.ok) {
      const linearJson = await linearRes.json();
      const omniJson = await omniRes.json();
      const binaryJson = binaryRes.ok ? await binaryRes.json() : { data: [] };
      const rawLinear = Array.isArray(linearJson?.data) ? linearJson.data : [];
      const rawOmni = Array.isArray(omniJson?.data) ? omniJson.data : [];
      const rawBinary = Array.isArray(binaryJson?.data) ? binaryJson.data : [];
      const combined = [...rawLinear, ...rawOmni, ...rawBinary];

      const entries: LeaderboardEntry[] = combined.map((item: Record<string, unknown>) =>
        mapRawScoreEntry(item)
      );
      return { entries, online: true };
    }
  } catch {
    // Backend server offline -> fallback handled by caller
  }
  return { entries: [], online: false };
}

export async function apiFetchMyRuns(version: string = CURRENT_GAME_VERSION): Promise<LeaderboardEntry[]> {
  const token = getStoredToken();
  if (!token) return [];
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/leaderboard/me?version=${encodeURIComponent(version)}`,
      {
        method: 'GET',
        headers: buildHeaders(true),
      }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const raw = Array.isArray(json?.data) ? json.data : [];
    return raw.map((item: Record<string, unknown>) => mapRawScoreEntry(item));
  } catch {
    return [];
  }
}

export async function apiFetchArchivePodium(
  version: string = PREVIOUS_GAME_VERSION
): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/leaderboard/archive?version=${encodeURIComponent(version)}`,
      {
        method: 'GET',
        headers: buildHeaders(false),
      }
    );
    if (res.ok) {
      const json = await res.json();
      const raw = Array.isArray(json?.data) ? json.data : [];
      if (raw.length > 0) {
        return raw.map((item: Record<string, unknown>) => mapRawScoreEntry(item));
      }
    }
  } catch {
    // Fallback below if offline
  }

  // Fallback Top 5 v0.0.1 Archive Podium
  return [
    {
      id: 'arch-lin-1',
      nick: 'KRD',
      username: 'kdabrowski',
      score: 14820,
      mode: 'LINEAR',
      version: '0.0.1',
      podiumRank: 1,
      totalTimeSec: 31.42,
      avgSpeedMs: 114,
      mistakes: 0,
      date: '2026-11-03',
      badges: [
        {
          code: 'TOP1_V0_0_1',
          title: '1ST PLACE IN v0.0.1',
          description: 'Awarded for achieving #1 Personal Best on the Global Leaderboard in version 0.0.1.',
          versionTag: '0.0.1',
        },
      ],
    },
    {
      id: 'arch-lin-2',
      nick: 'NEO',
      username: 'neo_matrix',
      score: 13640,
      mode: 'LINEAR',
      version: '0.0.1',
      podiumRank: 2,
      totalTimeSec: 34.18,
      avgSpeedMs: 125,
      mistakes: 1,
      date: '2026-11-03',
      badges: [
        {
          code: 'TOP2_V0_0_1',
          title: '2ND PLACE IN v0.0.1',
          description: 'Awarded for achieving #2 Personal Best on the Global Leaderboard in version 0.0.1.',
          versionTag: '0.0.1',
        },
      ],
    },
    {
      id: 'arch-lin-3',
      nick: 'VEX',
      username: 'vex_runner',
      score: 12910,
      mode: 'LINEAR',
      version: '0.0.1',
      podiumRank: 3,
      totalTimeSec: 36.85,
      avgSpeedMs: 134,
      mistakes: 1,
      date: '2026-11-02',
      badges: [
        {
          code: 'TOP3_V0_0_1',
          title: '3RD PLACE IN v0.0.1',
          description: 'Awarded for achieving #3 Personal Best on the Global Leaderboard in version 0.0.1.',
          versionTag: '0.0.1',
        },
      ],
    },
    {
      id: 'arch-lin-4',
      nick: 'ZED',
      username: 'zed_pulse',
      score: 11850,
      mode: 'LINEAR',
      version: '0.0.1',
      podiumRank: 4,
      totalTimeSec: 39.6,
      avgSpeedMs: 145,
      mistakes: 2,
      date: '2026-11-02',
      badges: [],
    },
    {
      id: 'arch-lin-5',
      nick: 'ARC',
      username: 'arc_pilot',
      score: 11120,
      mode: 'LINEAR',
      version: '0.0.1',
      podiumRank: 5,
      totalTimeSec: 42.15,
      avgSpeedMs: 154,
      mistakes: 2,
      date: '2026-11-01',
      badges: [],
    },
    {
      id: 'arch-omni-1',
      nick: 'KRD',
      username: 'kdabrowski',
      score: 22450,
      mode: 'OMNI',
      version: '0.0.1',
      podiumRank: 1,
      totalTimeSec: 29.84,
      avgSpeedMs: 109,
      mistakes: 0,
      date: '2026-11-03',
      badges: [
        {
          code: 'TOP1_V0_0_1',
          title: '1ST PLACE IN v0.0.1',
          description: 'Awarded for achieving #1 Personal Best on the Global Leaderboard in version 0.0.1.',
          versionTag: '0.0.1',
        },
      ],
    },
    {
      id: 'arch-omni-2',
      nick: 'QNT',
      username: 'quantum_x',
      score: 19880,
      mode: 'OMNI',
      version: '0.0.1',
      podiumRank: 2,
      totalTimeSec: 33.1,
      avgSpeedMs: 121,
      mistakes: 1,
      date: '2026-11-03',
      badges: [
        {
          code: 'TOP2_V0_0_1',
          title: '2ND PLACE IN v0.0.1',
          description: 'Awarded for achieving #2 Personal Best on the Global Leaderboard in version 0.0.1.',
          versionTag: '0.0.1',
        },
      ],
    },
    {
      id: 'arch-omni-3',
      nick: 'SYN',
      username: 'synapse',
      score: 18340,
      mode: 'OMNI',
      version: '0.0.1',
      podiumRank: 3,
      totalTimeSec: 35.72,
      avgSpeedMs: 130,
      mistakes: 1,
      date: '2026-11-02',
      badges: [
        {
          code: 'TOP3_V0_0_1',
          title: '3RD PLACE IN v0.0.1',
          description: 'Awarded for achieving #3 Personal Best on the Global Leaderboard in version 0.0.1.',
          versionTag: '0.0.1',
        },
      ],
    },
    {
      id: 'arch-omni-4',
      nick: 'LUX',
      username: 'lux_vector',
      score: 16790,
      mode: 'OMNI',
      version: '0.0.1',
      podiumRank: 4,
      totalTimeSec: 38.4,
      avgSpeedMs: 140,
      mistakes: 2,
      date: '2026-11-02',
      badges: [],
    },
    {
      id: 'arch-omni-5',
      nick: 'ORB',
      username: 'torus_orb',
      score: 15420,
      mode: 'OMNI',
      version: '0.0.1',
      podiumRank: 5,
      totalTimeSec: 41.05,
      avgSpeedMs: 150,
      mistakes: 3,
      date: '2026-11-01',
      badges: [],
    },
  ];
}
