import React, { useState, useEffect } from 'react';
import {
  KeyBindingsMap,
  DEFAULT_KEY_BINDINGS,
  formatKeyLabel,
  GameMode,
} from './gameEngine';

interface KeyBindingsModalProps {
  isOpen: boolean;
  bindings: KeyBindingsMap;
  gameMode: GameMode;
  onSave: (newBindings: KeyBindingsMap, newMode: GameMode) => void;
  onClose: () => void;
}

export const KeyBindingsModal: React.FC<KeyBindingsModalProps> = ({
  isOpen,
  bindings,
  gameMode,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<KeyBindingsMap>(() => structuredClone(bindings));
  const [draftMode, setDraftMode] = useState<GameMode>(gameMode);
  const [listeningDigit, setListeningDigit] = useState<number | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(structuredClone(bindings));
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
              `Key [${keyLabel}] is already assigned to DIGIT ${d}! Cannot bind duplicate keys.`
            );
          }
          setListeningDigit(null);
          return;
        }
      }

      setConflictError(null);
      setDraft((prev) => {
        const next: KeyBindingsMap = structuredClone(prev);
        const existing = next[listeningDigit] || [];
        next[listeningDigit] = [...existing.slice(-2), rawKey];
        return next;
      });
      setListeningDigit(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [listeningDigit, isOpen, draft]);

  if (!isOpen) return null;

  const handleRemoveSingleKey = (digit: number, keyToRemove: string) => {
    setConflictError(null);
    setDraft((prev) => {
      const currentKeys = prev[digit] || [String(digit)];
      if (currentKeys.length <= 1) {
        setConflictError(`DIGIT ${digit} must have at least 1 bound key!`);
        return prev;
      }
      return {
        ...prev,
        [digit]: currentKeys.filter((k) => k !== keyToRemove),
      };
    });
  };

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
      1: ['1', 'q'],
      2: ['2', 'w'],
      3: ['3', 'e'],
      4: ['4', 'r'],
      5: ['5', 't'],
      6: ['6', 'y'],
      7: ['7', 'u'],
      8: ['8', 'i'],
      9: ['9', 'o'],
      0: ['0', 'p', ' '],
    });
  };

  const handleSave = () => {
    onSave(draft, draftMode);
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
          <div className="settings-section-title">NAVIGATION MODE</div>
          <div className="mode-toggle-grid">
            <button
              type="button"
              className={`mode-card-btn ${draftMode === 'LINEAR' ? 'active' : ''}`}
              onClick={() => setDraftMode('LINEAR')}
            >
              <span className="mode-card-name">LINEAR (LEFT TO RIGHT)</span>
              <span className="mode-card-desc">
                Classic reading order from index 0 to 272 row by row.
              </span>
            </button>
            <button
              type="button"
              className={`mode-card-btn ${draftMode === 'OMNI' ? 'active' : ''}`}
              onClick={() => setDraftMode('OMNI')}
            >
              <span className="mode-card-name">OMNI-8 (FREE DIRECTION + WRAP)</span>
              <span className="mode-card-desc">
                Move in any of the 8 surrounding directions with edge wrap-around, phase-jump over
                cleared tiles, and quantum multi-path tracking!
              </span>
            </button>
          </div>
        </div>

        <div className="settings-section-title">DIGIT KEYBINDINGS</div>
        <p className="modal-desc">
          Click <strong>+ ADD KEY</strong> next to any digit and press a key. Each key can only be
          assigned to <strong>one digit at a time</strong> (duplicate keybindings are blocked).
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
            PRESET: [0-9] + [QWERTYUIOP]
          </button>
        </div>

        <div className="bindings-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => {
            const keys = draft[digit] || [String(digit)];
            const isListening = listeningDigit === digit;
            return (
              <div key={digit} className={`binding-row ${isListening ? 'listening' : ''}`}>
                <div className="binding-digit">DIGIT {digit}</div>
                <div className="binding-keys">
                  {keys.map((k) => (
                    <span
                      key={k}
                      className="key-chip"
                      title={keys.length > 1 ? 'Click to remove this key' : 'Primary key'}
                      onClick={() => {
                        if (keys.length > 1) handleRemoveSingleKey(digit, k);
                      }}
                    >
                      {formatKeyLabel(k)}
                      {keys.length > 1 && <b className="chip-remove">x</b>}
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
                    {isListening ? 'PRESS A KEY...' : '+ ADD KEY'}
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
