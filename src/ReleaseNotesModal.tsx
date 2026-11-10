import React from 'react';
import { BadgeIcon } from './BadgeIcons';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box release-notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>TRANSMISSION // RELEASE NOTES v0.0.2</h2>
            <span className="release-sub-tag">
              UPGRADE FROM v0.0.1 (COMMIT 73a71f0) TO v0.0.2
            </span>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            X
          </button>
        </div>

        <div className="welcome-guide-scroll">
          {/* 1. VISUAL SHOWCASE: 8-BIT BADGES & ANTI-BOT SENTINEL */}
          <div className="rn-feature-block">
            <div className="rn-feature-text">
              <span className="rn-badge-pill gold">NEW SYSTEM</span>
              <h3 className="rn-title">COLLECTIBLE 8-BIT BADGES &amp; ANTI-CHEAT SENTINEL</h3>
              <p className="rn-desc">
                Pilots can now earn unique 8-bit pixel badges displayed next to their nick on the
                Leaderboard and inside their Pilot Profile. Click any badge in-game to inspect what
                it was awarded for. All runs are now verified by our Server-Side Replay &amp;
                Anti-Bot Sentinel — attempting to use a bot or script awards the infamous{' '}
                <strong>Automaton Robot Head</strong> badge!
              </p>
            </div>
            <div className="rn-visual-showcase badges-showcase-box">
              <div className="rn-badge-sample">
                <BadgeIcon code="TOP1_V0_0_1" size={44} />
                <span>v0.0.1 GOLD</span>
              </div>
              <div className="rn-badge-sample">
                <BadgeIcon code="TOP2_V0_0_1" size={44} />
                <span>v0.0.1 SILVER</span>
              </div>
              <div className="rn-badge-sample">
                <BadgeIcon code="LINEAR_1000" size={44} />
                <span>CYBER CREST</span>
              </div>
              <div className="rn-badge-sample">
                <BadgeIcon code="OMNI_1000" size={44} />
                <span>ASTRAL CORE</span>
              </div>
              <div className="rn-badge-sample bot-sample">
                <BadgeIcon code="BOT_DETECTED" size={44} />
                <span>BOT CAUGHT</span>
              </div>
            </div>
          </div>

          {/* 2. VISUAL DIAGRAM: SCORING OVERHAUL IN LINEAR & OMNI-8 */}
          <div className="rn-feature-block">
            <div className="rn-feature-text">
              <span className="rn-badge-pill cyan">SCORING REWORK</span>
              <h3 className="rn-title">
                LINEAR 2X SHIELD-SEQUENCES &amp; OMNI-8 PENTA/OCTA QUANTUM PATHS
              </h3>
              <p className="rn-desc">
                Both modes received major scoring upgrades to reward high-skill execution:
              </p>
            </div>

            <div className="rn-scoring-diagrams-grid">
              {/* LINEAR GRAPHIC */}
              <div className="rn-diagram-card linear-diag">
                <span className="rn-diag-label">LINEAR MODE // SHIELD IN SEQUENCE = 2X SEQ BONUS</span>
                <div className="rn-mini-tiles-row">
                  <div className="rn-mini-tile seq-lit">1</div>
                  <div className="rn-mini-tile seq-lit shield-lit" title="Shield inside sequence">
                    <span>3</span>
                    <small className="rn-mini-shield-tag">SHIELD</small>
                  </div>
                  <div className="rn-mini-tile seq-lit">3</div>
                  <div className="rn-mini-tile seq-lit">7</div>
                  <span className="rn-diag-arrow">-&gt;</span>
                  <div className="rn-bonus-callout gold">2X SEQUENCE BONUS!</div>
                </div>
                <p className="rn-diag-caption">
                  A shield inside a sequence no longer just doubles a single keystroke — it{' '}
                  <strong>doubles the entire Sequence Bonus</strong>! Completed sequences also pop
                  and stay permanently illuminated on the board.
                </p>
              </div>

              {/* OMNI-8 GRAPHIC */}
              <div className="rn-diagram-card omni-diag">
                <span className="rn-diag-label">
                  OMNI-8 // PATH-LENGTH QUANTUM BONUS + PENTA / HEXA / OCTA TIERS
                </span>
                <div className="rn-quantum-svg-wrap">
                  <svg viewBox="0 0 260 66" className="rn-quantum-diagram-svg">
                    {/* Converging colored quantum branch trails */}
                    <polyline
                      points="14,12 65,12 115,33"
                      fill="none"
                      stroke="#00f0ff"
                      strokeWidth="3"
                    />
                    <polyline
                      points="14,33 65,33 115,33"
                      fill="none"
                      stroke="#ff00e5"
                      strokeWidth="3"
                    />
                    <polyline
                      points="14,54 65,54 115,33"
                      fill="none"
                      stroke="#00ff66"
                      strokeWidth="3"
                    />
                    <circle cx="14" cy="12" r="5" fill="#00f0ff" />
                    <circle cx="65" cy="12" r="5" fill="#00f0ff" />
                    <circle cx="14" cy="33" r="5" fill="#ff00e5" />
                    <circle cx="65" cy="33" r="5" fill="#ff00e5" />
                    <circle cx="14" cy="54" r="5" fill="#00ff66" />
                    <circle cx="65" cy="54" r="5" fill="#00ff66" />
                    {/* Convergence node */}
                    <rect
                      x="105"
                      y="23"
                      width="20"
                      height="20"
                      rx="3"
                      fill="#00ff66"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* Result callout */}
                    <text x="136" y="29" fill="#00ff66" fontSize="9" fontWeight="bold">
                      PENTA / HEXA / OCTA!!
                    </text>
                    <text x="136" y="44" fill="#fde047" fontSize="8">
                      + PATH LENGTH BONUS
                    </text>
                  </svg>
                </div>
                <p className="rn-diag-caption">
                  Secret sequences are removed from OMNI-8. Quantum Merges now award extra points
                  proportional to the <strong>length of the converging paths</strong>, plus new
                  hyper-tiers above Quadruple: <strong>PENTA, HEXA, HEPTA &amp; OCTA</strong>!
                </p>
              </div>
            </div>
          </div>

          {/* 3. VISUAL PREVIEW: ARCHIVE HALL OF FAME 5-PLACE PODIUM */}
          <div className="rn-feature-block">
            <div className="rn-feature-text">
              <span className="rn-badge-pill magenta">HALL OF FAME ARCHIVE</span>
              <h3 className="rn-title">
                v0.0.1 ARCHIVE 5-PLACE PODIUM &amp; PERSONAL VERSION FILTER
              </h3>
              <p className="rn-desc">
                Global leaderboards have been reset for v0.0.2 while the Top 5 pilots from v0.0.1
                are immortalized on the new <strong>5-Place Futuristic Podium</strong> (4 - 2 - 1 -
                3 - 5) inside the Leaderboard Archive! In <strong>MY HALL OF FAME</strong>, you can
                also filter your personal runs by game version (v0.0.2 or v0.0.1).
              </p>
            </div>
            <div className="rn-mini-podium-preview">
              <div className="rn-pedestal p4">
                <span className="rn-ped-nick">ZED</span>
                <div className="rn-ped-bar">#4</div>
              </div>
              <div className="rn-pedestal p2">
                <span className="rn-ped-nick">NEO</span>
                <div className="rn-ped-bar">#2</div>
              </div>
              <div className="rn-pedestal p1">
                <span className="rn-ped-nick">KRD</span>
                <div className="rn-ped-bar">#1</div>
              </div>
              <div className="rn-pedestal p3">
                <span className="rn-ped-nick">VEX</span>
                <div className="rn-ped-bar">#3</div>
              </div>
              <div className="rn-pedestal p5">
                <span className="rn-ped-nick">ARC</span>
                <div className="rn-ped-bar">#5</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-arcade cyan" onClick={onClose}>
            LAUNCH FIGRID v0.0.2
          </button>
        </div>
      </div>
    </div>
  );
};
