import React, { useState, useEffect } from 'react';
import {
  KeyBindingsMap,
  DEFAULT_KEY_BINDINGS,
  formatKeyLabel,
} from './gameEngine';

interface KeyBindingsModalProps {
  isOpen: boolean;
  bindings: KeyBindingsMap;
  onSave: (newBindings: KeyBindingsMap) => void;
  onClose: () => void;
}

export const KeyBindingsModal: React.FC<KeyBindingsModalProps> = ({
  isOpen,
  bindings,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<KeyBindingsMap>(() => structuredClone(bindings));
  const [listeningDigit, setListeningDigit] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(structuredClone(bindings));
      setListeningDigit(null);
    }
  }, [isOpen, bindings]);

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

      setDraft((prev) => {
        const next: KeyBindingsMap = structuredClone(prev);
        const existing = next[listeningDigit] || [];
        if (!existing.includes(rawKey)) {
          next[listeningDigit] = [...existing.slice(-2), rawKey];
        }
        return next;
      });
      setListeningDigit(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [listeningDigit, isOpen]);

  if (!isOpen) return null;

  const handleResetDigit = (digit: number) => {
    setDraft((prev) => ({
      ...prev,
      [digit]: [String(digit)],
    }));
  };

  const handleResetAll = () => {
    setDraft(structuredClone(DEFAULT_KEY_BINDINGS));
    setListeningDigit(null);
  };

  const handleApplyPresetQwerty = () => {
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
    onSave(draft);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>KEYBINDINGS CONFIGURATION</h2>
          <button type="button" className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="modal-desc">
          Click <strong>+ ADD KEY</strong> next to any digit and press any key on your keyboard
          (letters, spacebar, or Numpad). Each digit can have up to 3 active keys bound
          simultaneously!
        </p>

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
                    <span key={k} className="key-chip">
                      {formatKeyLabel(k)}
                    </span>
                  ))}
                </div>
                <div className="binding-actions">
                  <button
                    type="button"
                    className={`btn-bind ${isListening ? 'active' : ''}`}
                    onClick={() => setListeningDigit(isListening ? null : digit)}
                  >
                    {isListening ? 'PRESS A KEY...' : '+ ADD KEY'}
                  </button>
                  <button
                    type="button"
                    className="btn-bind-clear"
                    title="Reset to default digit key"
                    onClick={() => handleResetDigit(digit)}
                  >
                    ↺
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
            SAVE BINDINGS
          </button>
        </div>
      </div>
    </div>
  );
};
