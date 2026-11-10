import React, { useState } from 'react';
import { GameMode, KeyBindingsMap } from './gameEngine';
import {
  apiLogin,
  apiRegister,
  setStoredToken,
  UserProfile,
} from './apiClient';
import { UserBadge, BadgeIcon, BadgeInspectModal } from './BadgeIcons';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  currentBindings: KeyBindingsMap;
  currentMode: GameMode;
  currentNick: string;
  onAuthSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  currentBindings,
  currentMode,
  currentNick,
  onAuthSuccess,
  onLogout,
  onClose,
}) => {
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nick, setNick] = useState(currentNick || 'AAA');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectedBadge, setInspectedBadge] = useState<UserBadge | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      if (authTab === 'LOGIN') {
        const res = await apiLogin(username.trim(), password);
        setStoredToken(res.token);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const cleanNick = nick
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 3)
          .padEnd(3, 'A');
        const res = await apiRegister(
          username.trim(),
          password,
          cleanNick,
          currentMode,
          currentBindings
        );
        setStoredToken(res.token);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box auth-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>PILOT ACCOUNT // CLOUD SYNC</h2>
          <button type="button" className="btn-close" onClick={onClose}>
            X
          </button>
        </div>

        {currentUser ? (
          <div className="auth-profile-view">
            <div className="auth-profile-row">
              <span className="hud-label">LOGGED IN AS</span>
              <strong className="auth-username">{currentUser.username}</strong>
            </div>
            <div className="auth-profile-row">
              <span className="hud-label">DEFAULT 3-LETTER TAG</span>
              <strong className="auth-nick-badge">{currentUser.nick}</strong>
            </div>
            <div className="auth-profile-row">
              <span className="hud-label">PREFERRED MODE</span>
              <strong>{currentUser.preferredMode === 'OMNI' ? 'OMNI-8' : 'LINEAR'}</strong>
            </div>

            {/* PILOT COLLECTED BADGES SHOWCASE (CLICK ANY BADGE TO INSPECT) */}
            <div className="profile-badges-section">
              <span className="hud-label">EARNED PILOT BADGES (CLICK TO INSPECT)</span>
              {currentUser.badges && currentUser.badges.length > 0 ? (
                <div className="profile-badges-grid">
                  {currentUser.badges.map((b) => (
                    <button
                      key={b.code}
                      type="button"
                      className="profile-badge-tile"
                      onClick={() => setInspectedBadge(b)}
                      title={`${b.title} - Click for details`}
                    >
                      <BadgeIcon code={b.code} size={38} />
                      <span className="profile-badge-name">{b.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="profile-no-badges">
                  No badges earned yet. Compete on the matrix to unlock honors.
                </div>
              )}
            </div>

            <p className="modal-desc">
              Your keybindings, preferred mode, earned badges, and 3-letter tag are synced with the
              PostgreSQL backend.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-arcade"
                onClick={() => {
                  setStoredToken(null);
                  onLogout();
                  onClose();
                }}
              >
                LOG OUT
              </button>
              <button type="button" className="btn-arcade cyan" onClick={onClose}>
                CLOSE
              </button>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="mode-toggle-grid">
              <button
                type="button"
                className={`mode-card-btn ${authTab === 'LOGIN' ? 'active' : ''}`}
                onClick={() => {
                  setAuthTab('LOGIN');
                  setErrorMsg(null);
                }}
              >
                <div className="mode-card-name">LOGIN</div>
                <div className="mode-card-desc">Sign in to load your saved bindings & settings</div>
              </button>
              <button
                type="button"
                className={`mode-card-btn ${authTab === 'REGISTER' ? 'active' : ''}`}
                onClick={() => {
                  setAuthTab('REGISTER');
                  setErrorMsg(null);
                }}
              >
                <div className="mode-card-name">REGISTER</div>
                <div className="mode-card-desc">Create a new account on the shared leaderboard</div>
              </button>
            </div>

            {errorMsg && <div className="binding-error-alert">{errorMsg}</div>}

            <div className="auth-field">
              <label className="hud-label">USERNAME (3-32 CHARS)</label>
              <input
                type="text"
                className="auth-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cyber_pilot"
                required
                minLength={3}
                maxLength={32}
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label className="hud-label">PASSWORD (MIN 4 CHARS)</label>
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={4}
              />
            </div>

            {authTab === 'REGISTER' && (
              <div className="auth-field">
                <label className="hud-label">DEFAULT 3-LETTER LEADERBOARD TAG</label>
                <input
                  type="text"
                  className="auth-input auth-nick-input"
                  value={nick}
                  onChange={(e) =>
                    setNick(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3))
                  }
                  maxLength={3}
                  required
                />
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-arcade" onClick={onClose}>
                CANCEL
              </button>
              <button type="submit" className="btn-arcade gold" disabled={isLoading}>
                {isLoading
                  ? 'CONNECTING...'
                  : authTab === 'LOGIN'
                  ? 'LOGIN [JWT]'
                  : 'CREATE ACCOUNT'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CLICK-TO-INSPECT BADGE MODAL */}
      <BadgeInspectModal badge={inspectedBadge} onClose={() => setInspectedBadge(null)} />
    </div>
  );
};
