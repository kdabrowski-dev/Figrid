import React from 'react';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box welcome-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>WELCOME TO FIGRID // PILOT MANUAL</h2>
          <button type="button" className="btn-close" onClick={onClose}>
            X
          </button>
        </div>

        <div className="welcome-guide-scroll">
          {/* 1. OVERVIEW */}
          <div className="guide-section">
            <h3 className="guide-heading cyan">WHAT IS FIGRID?</h3>
            <p className="guide-text">
              FIGRID is a high-speed keyboard reflex and pathfinding arcade game on a{' '}
              <strong>21x13 digit matrix (273 tiles)</strong>. Your objective is to clear every
              single digit on the board as fast and accurately as possible by pressing the matching
              number keys on your keyboard.
            </p>
          </div>

          {/* 2. SHARED MECHANICS */}
          <div className="guide-section">
            <h3 className="guide-heading gold">SHARED CORE MECHANICS (BOTH MODES)</h3>
            <div className="guide-grid-2col">
              <div className="guide-card">
                <span className="guide-card-title">SPEED DELTA SCORING</span>
                <p className="guide-card-desc">
                  Every cleared digit grants base points plus a <strong>Speed Bonus</strong>{' '}
                  inversely proportional to the time (in ms) since your previous keystroke. Faster
                  rhythm yields higher points and shifts the score color toward neon magenta.
                </p>
              </div>
              <div className="guide-card">
                <span className="guide-card-title">REINFORCED SHIELDS (2 HITS)</span>
                <p className="guide-card-desc">
                  25 tiles on every board are protected by a cyan <strong>Shield</strong> that
                  fades into view as you approach. Press the digit <strong>once</strong> to crack
                  the shield (turns orange), and press it a <strong>second time</strong> to break
                  through.
                </p>
              </div>
              <div className="guide-card">
                <span className="guide-card-title">MISTAKE PENALTY</span>
                <p className="guide-card-desc">
                  Pressing a digit that does not match any valid target tile flashes the board red,
                  increments your Mistakes counter, and deducts points.
                </p>
              </div>
              <div className="guide-card">
                <span className="guide-card-title">CUSTOM KEYBINDINGS &amp; ACCOUNTS</span>
                <p className="guide-card-desc">
                  In <strong>SETTINGS</strong>, you can bind up to 3 physical keys per digit (e.g.,
                  top row + numpad + letters). Log in to save your Personal Best to the Global
                  Leaderboard and track all runs in <strong>MY HALL OF FAME</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* 3. MODE-SPECIFIC MECHANICS */}
          <div className="guide-section">
            <h3 className="guide-heading magenta">MODE-SPECIFIC RULES &amp; SCORING</h3>
            <div className="guide-grid-2col">
              {/* LINEAR MODE */}
              <div className="guide-card mode-box-linear">
                <div className="guide-mode-header">
                  <span className="mode-pill linear">LINEAR MODE</span>
                  <span className="guide-mode-tag">ROW-BY-ROW SPRINT</span>
                </div>
                <ul className="guide-list">
                  <li>
                    <strong>Fixed Path:</strong> Clear tiles strictly left-to-right, top-to-bottom
                    from tile #1 to #273.
                  </li>
                  <li>
                    <strong>Secret Speed Sequences:</strong> Hidden mathematical and cyber sequences
                    are embedded in the rows. Typing an entire sequence fast enough awards a massive
                    Sequence Bonus and permanently highlights the completed sequence tiles on the
                    board.
                  </li>
                  <li>
                    <strong>Shields in Linear:</strong> A standalone shield awards{' '}
                    <strong>2X step points</strong> on the 2nd hit. If a shield is inside a{' '}
                    <strong>Secret Sequence</strong>, it does not double the single tile step —
                    instead, completing that sequence awards a{' '}
                    <strong>2X MULTIPLIED SEQUENCE BONUS</strong>!
                  </li>
                </ul>
              </div>

              {/* OMNI-8 MODE */}
              <div className="guide-card mode-box-omni">
                <div className="guide-mode-header">
                  <span className="mode-pill omni">OMNI-8 MODE</span>
                  <span className="guide-mode-tag">8-WAY QUANTUM TORUS</span>
                </div>
                <ul className="guide-list">
                  <li>
                    <strong>Free 8-Way Routing:</strong> Start at the center tile and move to any
                    adjacent or diagonal neighbor (dashed yellow frame).
                  </li>
                  <li>
                    <strong>Torus Wrap &amp; Phase-Jump:</strong> Cross any board edge to wrap to
                    the opposite side, and automatically jump across already-cleared green tiles in
                    any direction.
                  </li>
                  <li>
                    <strong>No Sequences // Quantum Merges Instead:</strong> There are no secret
                    sequences in OMNI-8. Instead, when 2 or more available neighbors share the
                    digit you press, your path splits into parallel colored{' '}
                    <strong>Quantum Branches</strong>.
                  </li>
                  <li>
                    <strong>Path-Length Quantum Bonus:</strong> Converging split branches onto a
                    common digit triggers a <strong>Quantum Merge</strong> (from{' '}
                    <em>DOUBLE</em>, <em>TRIPLE</em>, <em>QUADRUPLE</em> up to{' '}
                    <em>PENTA</em>, <em>HEXA</em>, <em>HEPTA</em>, and{' '}
                    <em>OCTA OVERDRIVE</em>!) with bonus points scaling with both branch count and
                    the <strong>length of the merged paths</strong>!
                  </li>
                </ul>
              </div>
            </div>

            {/* BINARY 3-BIT DECODER MODE */}
            <div className="guide-card mode-box-binary" style={{ marginTop: '12px' }}>
              <div className="guide-mode-header">
                <span className="mode-pill binary">BINARY MODE (7x4 MATRIX)</span>
                <span className="guide-mode-tag">3-BIT OCTAL DECODER</span>
              </div>
              <ul className="guide-list">
                <li>
                  <strong>Decimal Sight, Binary Input:</strong> A compact{' '}
                  <strong>7x4 matrix (28 tiles)</strong> displays digits <strong>0 through 7</strong>
                  , with a live 0–7 binary reference table on the left and a{' '}
                  <strong>3-Bit Input Register ([4] [2] [1])</strong> above the board. Decode each
                  tile left-to-right by typing its 3 binary bits using keys <strong>[0]</strong> and{' '}
                  <strong>[1]</strong>.
                </li>
                <li>
                  <strong>Non-Resetting Bit Errors:</strong> If you press the wrong bit, your
                  already-entered bits in the 3-bit register are <strong>never cleared</strong> —
                  only the missed bit slot refuses to fill and deducts a mistake penalty.
                </li>
                <li>
                  <strong>Unique Binary Overclock Bonuses:</strong>
                  <br />• <strong>PURE SIGNAL BURST (+220 PTS):</strong> Decode uniform-bit tiles{' '}
                  <code>0 (000)</code> or <code>7 (111)</code> at high speed (avg bit delta &le;
                  160ms).
                  <br />• <strong>XOR-7 COMPLEMENT OVERCLOCK (+450 PTS):</strong> Decode two
                  consecutive tiles whose bits are exact bitwise inversions (
                  <code>prev ^ curr == 7</code>, e.g. <code>2 [010] &rarr; 5 [101]</code> or{' '}
                  <code>1 [001] &rarr; 6 [110]</code>) within avg bit delta &le; 260ms.
                  <br />• <strong>ROW REGISTER FLUSH (+650 PTS):</strong> Clear an entire 7-tile row
                  register at high speed (avg bit delta &le; 230ms).
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-arcade gold" onClick={onClose}>
            GOT IT // ENTER THE MATRIX
          </button>
        </div>
      </div>
    </div>
  );
};
