import { GameMode, KeyBindingsMap } from './gameEngine';
import { LeaderboardEntry } from './LeaderboardView';

const DEFAULT_BACKEND_URL = 'http://localhost:5000';
export const API_BASE_URL: string =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
    DEFAULT_BACKEND_URL).replace(/\/+$/, '');

const JWT_STORAGE_KEY = 'figrid_jwt_token_v1';

export interface UserProfile {
  id: number;
  username: string;
  nick: string;
  preferredMode: GameMode;
  keyBindings: KeyBindingsMap;
  createdAt?: string | null;
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
  };
  if (includeAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function apiRegister(
  username: string,
  password: string,
  nick: string,
  preferredMode: GameMode,
  keyBindings: KeyBindingsMap
): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
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
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
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
    const res = await fetch(`${API_BASE_URL}/api/user/settings`, {
      method: 'PUT',
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.user || null;
  } catch {
    return null;
  }
}

export async function apiFetchSharedLeaderboard(): Promise<{
  entries: LeaderboardEntry[];
  online: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leaderboard?limit=100`, {
      method: 'GET',
      headers: buildHeaders(false),
    });
    if (res.ok) {
      const json = await res.json();
      const rawList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      const entries: LeaderboardEntry[] = rawList.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? `score-${Math.random()}`),
        nick: String(item.nick ?? 'AAA').slice(0, 3).toUpperCase(),
        score: Number(item.score ?? 0),
        mode: item.mode === 'OMNI' ? 'OMNI' : 'LINEAR',
        totalTimeSec: Number(item.totalTimeSec ?? 0),
        avgSpeedMs: Number(item.avgSpeedMs ?? 0),
        mistakes: Number(item.mistakes ?? 0),
        date: String(item.date ?? new Date().toISOString().slice(0, 10)),
        username: item.username ? String(item.username) : undefined,
      }));
      return { entries, online: true };
    }
  } catch {
    // Backend server offline -> fallback handled by caller
  }
  return { entries: [], online: false };
}

export async function apiSubmitScoreToBackend(entry: {
  nick: string;
  score: number;
  mode: GameMode;
  totalTimeSec: number;
  avgSpeedMs: number;
  mistakes: number;
}): Promise<LeaderboardEntry | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leaderboard`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(entry),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const item = json?.data;
    if (!item) return null;
    return {
      id: String(item.id),
      nick: String(item.nick),
      score: Number(item.score),
      mode: item.mode === 'OMNI' ? 'OMNI' : 'LINEAR',
      totalTimeSec: Number(item.totalTimeSec),
      avgSpeedMs: Number(item.avgSpeedMs),
      mistakes: Number(item.mistakes),
      date: String(item.date),
      username: item.username ? String(item.username) : undefined,
    };
  } catch {
    return null;
  }
}
