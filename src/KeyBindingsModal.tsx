import React, { useState, useEffect } from 'react';
import {
  KeyBindingsMap,
  DEFAULT_KEY_BINDINGS,
  sanitizeKeyBindings,
  formatKeyLabel,
  GameMode,
} from './gameEngine';

interface KeyBindingsModalProps {
  isOpen: boolean;
  bindings: KeyBindingsMap;
  gameMode: GameMode;
  isModeLocked: boolean;
  onSave: (newBindings: KeyBindingsMap, newMode: GameMode) => void;
  onClose: () => void;
}

export const KeyBindingsModal: React.FC<KeyBindingsModalProps> = ({
  isOpen,
  bindings,
  gameMode,
  isModeLocked,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<KeyBindingsMap>(() => sanitizeKeyBindings(bindings));
  const [draftMode, setDraftMode] = useState<GameMode>(gameMode);
  const [listeningDigit, setListeningDigit] = useState<number | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(sanitizeKeyBindings(bindings));
      setDraftMode(gameMode);
      setListeningDigit(null);
      setConflictError(null);
    }
  }, [isOpen, bindings, gameMode]);

  useEffect(() => {
    if (listeningDigit === null || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setListeningDigit(null);
        return;
      }

      const rawKey = e.key.toLowerCase();
      if (['shift', 'control', 'alt', 'meta', 'capslock', 'tab'].includes(rawKey)) {
        return;
      }

      for (let d = 0; d <= 9; d++) {
        const assignedKeys = draft[d] || [];
        if (assignedKeys.includes(rawKey)) {
          const keyLabel = formatKeyLabel(rawKey);
          if (d === listeningDigit) {
            setConflictError(`Key [${keyLabel}] is already bound to DIGIT ${d}!`);
          } else {
            setConflictError(
              `Key [${keyLabel}] is already assigned to DIGIT ${d}! Each digit must have a unique key (1 key = 1 digit).`
            );
          }
          setListeningDigit(null);
          return;
        }
      }

      setConflictError(null);
      setDraft((prev) => {
        const next: KeyBindingsMap = structuredClone(prev);
        // Strict 1-to-1 binding: each digit maps to a single unique key
        next[listeningDigit] = [rawKey];
        return next;
      });
      setListeningDigit(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [listeningDigit, isOpen, draft]);

  if (!isOpen) return null;

  const handleResetDigit = (digit: number) => {
    setConflictError(null);
    const defaultKey = String(digit);
    for (let d = 0; d <= 9; d++) {
      if (d !== digit && (draft[d] || []).includes(defaultKey)) {
        setConflictError(
          `Cannot reset DIGIT ${digit} to [${defaultKey}] because DIGIT ${d} is currently using it!`
        );
        return;
      }
    }
    setDraft((prev) => ({
      ...prev,
      [digit]: [defaultKey],
    }));
  };

  const handleResetAll = () => {
    setConflictError(null);
    setDraft(structuredClone(DEFAULT_KEY_BINDINGS));
    setListeningDigit(null);
  };

  const handleApplyPresetQwerty = () => {
    setConflictError(null);
    setDraft({
      1: ['q'],
      2: ['w'],
      3: ['e'],
      4: ['r'],
      5: ['t'],
      6: ['y'],
      7: ['u'],
      8: ['i'],
      9: ['o'],
      0: ['p'],
    });
  };

  const handleSave = () => {
    onSave(sanitizeKeyBindings(draft), draftMode);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>SETTINGS & KEYBINDINGS</h2>
          <button type="button" className="btn-close" onClick={onClose}>
            X
          </button>
        </div>

        {/* NAVIGATION MODE SELECTOR */}
        <div className="settings-mode-section">
          <div className="settings-section-title">
            NAVIGATION MODE{' '}
            {isModeLocked && (
              <span className="mode-locked-note">(LOCKED DURING ACTIVE RUN - RESTART TO CHANGE)</span>
            )}
          </div>
          <div className="mode-toggle-grid">
            <button
              type="button"
              disabled={isModeLocked}
              className={`mode-card-btn ${draftMode === 'LINEAR' ? 'active' : ''} ${
                isModeLocked ? 'disabled-locked' : ''
              }`}
              onClick={() => {
                if (!isModeLocked) setDraftMode('LINEAR');
              }}
            >
              <span className="mode-card-name">LINEAR (LEFT TO RIGHT)</span>
              <span className="mode-card-desc">
                Classic reading order from index 0 to 272 row by row.
              </span>
            </button>
            <button
              type="button"
              disabled={isModeLocked}
              className={`mode-card-btn ${draftMode === 'OMNI' ? 'active' : ''} ${
                isModeLocked ? 'disabled-locked' : ''
              }`}
              onClick={() => {
                if (!isModeLocked) setDraftMode('OMNI');
              }}
            >
              <span className="mode-card-name">OMNI-8 (FREE DIRECTION + WRAP)</span>
              <span className="mode-card-desc">
                Move in any of the 8 surrounding directions with edge wrap-around, phase-jump over
                cleared tiles, and quantum multi-path tracking!
              </span>
            </button>
          </div>
        </div>

        <div className="settings-section-title">DIGIT KEYBINDINGS (STRICT 1-TO-1)</div>
        <p className="modal-desc">
          Click <strong>REBIND KEY</strong> next to any digit and press a key. Strictly{' '}
          <strong>one unique key per digit</strong> is allowed (binding multiple digits to one key or
          multiple keys to one digit is blocked).
        </p>

        {conflictError && (
          <div className="binding-error-alert" role="alert">
            [!] {conflictError}
          </div>
        )}

        <div className="preset-bar">
          <button type="button" className="btn-arcade small" onClick={handleResetAll}>
            DEFAULT [0-9]
          </button>
          <button type="button" className="btn-arcade small cyan" onClick={handleApplyPresetQwerty}>
            PRESET: [QWERTYUIOP]
          </button>
        </div>

        <div className="bindings-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => {
            const keys = (draft[digit] || [String(digit)]).slice(0, 1);
            const isListening = listeningDigit === digit;
            return (
              <div key={digit} className={`binding-row ${isListening ? 'listening' : ''}`}>
                <div className="binding-digit">DIGIT {digit}</div>
                <div className="binding-keys">
                  {keys.map((k) => (
                    <span
                      key={k}
                      className="key-chip"
                      title="Assigned key (1-to-1)"
                    >
                      {formatKeyLabel(k)}
                    </span>
                  ))}
                </div>
                <div className="binding-actions">
                  <button
                    type="button"
                    className={`btn-bind ${isListening ? 'active' : ''}`}
                    onClick={() => {
                      setConflictError(null);
                      setListeningDigit(isListening ? null : digit);
                    }}
                  >
                    {isListening ? 'PRESS A KEY...' : 'REBIND KEY'}
                  </button>
                  <button
                    type="button"
                    className="btn-bind-clear"
                    title="Reset to default digit key"
                    onClick={() => handleResetDigit(digit)}
                  >
                    RESET
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-arcade" onClick={onClose}>
            CANCEL
          </button>
          <button type="button" className="btn-arcade gold" onClick={handleSave}>
            SAVE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};
