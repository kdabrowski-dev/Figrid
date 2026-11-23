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
            <h2>TRANSMISSION // RELEASE NOTES v0.0.3</h2>
            <span className="release-sub-tag">
              SEASON v0.0.3 — ENDLESS CHASER, CHRONO-DIAL CLOCKS &amp; CATEGORY RANKINGS
            </span>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            X
          </button>
        </div>

        <div className="welcome-guide-scroll">
          {/* 1. ENDLESS CHASER SUBMODES + VISUAL 5-ROW DIAGRAM WITH SMOOTH RED LINE */}
          <div className="rn-feature-block">
            <div className="rn-feature-text">
              <span className="rn-badge-pill gold">NEW SUBMODE</span>
              <h3 className="rn-title">ENDLESS CHASER (LINEAR &amp; BINARY)</h3>
              <p className="rn-desc">
                Toggle <strong>ENDLESS</strong> next to LINEAR or BINARY to enter an infinite
                5-row sliding viewport centered on the active focus frame. A bright-red{' '}
                <strong>Chaser Line</strong> smoothly elongates along the bottom of each row — as it
                sweeps past tiles, they turn red. Each row follows a hardcoded, color-coded pace wave
                while newly generated rows spawn random Shields, Chrono Clocks, Secret Sequences, and
                XOR-7 pairs. The run ends if the Chaser Line catches you!
              </p>
            </div>

            <div className="rn-visual-showcase rn-endless-showcase">
              <div className="rn-endless-rows-demo">
                <div className="rn-demo-row cryo">
                  <span className="rn-demo-row-tag">ROW 4 // CRYO SLOW (0.45x)</span>
                  <div className="rn-demo-cells">
                    <span className="rn-demo-cell chaser-trail">3</span>
                    <span className="rn-demo-cell chaser-trail">1</span>
                    <span className="rn-demo-cell chaser-head" title="Chaser Line Edge">
                      4
                    </span>
                    <span className="rn-demo-cell done">1</span>
                    <span className="rn-demo-cell done">5</span>
                  </div>
                  <div className="endless-chaser-line-track">
                    <div className="endless-chaser-line-fill" style={{ width: '58%' }} />
                  </div>
                </div>
                <div className="rn-demo-row warmup">
                  <span className="rn-demo-row-tag">ROW 5 // STEADY (0.85x)</span>
                  <div className="rn-demo-cells">
                    <span className="rn-demo-cell done">9</span>
                    <span className="rn-demo-cell done">2</span>
                    <span className="rn-demo-cell done">6</span>
                    <span className="rn-demo-cell done">5</span>
                    <span className="rn-demo-cell done">3</span>
                  </div>
                </div>
                <div className="rn-demo-row surge focus">
                  <span className="rn-demo-row-tag">ROW 6 [FOCUS] // SURGE (1.08x)</span>
                  <div className="rn-demo-cells">
                    <span className="rn-demo-cell done">5</span>
                    <span className="rn-demo-cell done">8</span>
                    <span className="rn-demo-cell target" title="Player Target">
                      9
                    </span>
                    <span className="rn-demo-cell">7</span>
                    <span className="rn-demo-cell">9</span>
                  </div>
                </div>
                <div className="rn-demo-row hyper">
                  <span className="rn-demo-row-tag">ROW 7 // HYPER (1.24x)</span>
                  <div className="rn-demo-cells">
                    <span className="rn-demo-cell">3</span>
                    <span className="rn-demo-cell">2</span>
                    <span className="rn-demo-cell">3</span>
                    <span className="rn-demo-cell">8</span>
                    <span className="rn-demo-cell">4</span>
                  </div>
                </div>
                <div className="rn-demo-row overdrive">
                  <span className="rn-demo-row-tag">ROW 8 // OVERDRIVE (1.45x)</span>
                  <div className="rn-demo-cells">
                    <span className="rn-demo-cell">6</span>
                    <span className="rn-demo-cell">2</span>
                    <span className="rn-demo-cell">6</span>
                    <span className="rn-demo-cell">4</span>
                    <span className="rn-demo-cell">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CHRONO-DIAL CLOCK FIELD + FLAWLESS 4-TILE SYNC REWARD */}
          <div className="rn-feature-block">
            <div className="rn-feature-text">
              <span className="rn-badge-pill cyan">NEW TILE MECHANIC</span>
              <h3 className="rn-title">
                CHRONO-DIAL CLOCKS &amp; FLAWLESS 4-TILE SYNC BURST
              </h3>
              <p className="rn-desc">
                Pressing a <strong>Clock Field</strong> opens a vector outline{' '}
                <strong>3x3 Chrono-Dial</strong> with 4 digits at 12, 3, 6, and 9 o&apos;clock. Enter
                all 4 clockwise from the top to spiral-close the dial into green and earn a
                time-scaled <strong>Chrono Bonus</strong>. Complete a Clock{' '}
                <strong>flawlessly (0 mistakes) in Endless mode</strong> and after the next 2 tiles,
                the following <strong>4 tiles morph into identical digits</strong> for an instant
                speed burst!
              </p>
            </div>

            <div className="rn-visual-showcase rn-clock-showcase">
              {/* Step 1: Tile with enlarged Clock Ring */}
              <div className="rn-clock-stage-item">
                <span className="rn-diag-label">1. CLOCK TILE</span>
                <div className="cell rn-sample-clock-cell">
                  <svg
                    className="cell-clock-svg rn-visible-clock-svg"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                  >
                    <circle className="clock-outline-ring" cx="16" cy="16" r="13.8" />
                    <line className="clock-tick" x1="16" y1="1.2" x2="16" y2="3.8" />
                    <line className="clock-tick" x1="30.8" y1="16" x2="28.2" y2="16" />
                    <line className="clock-tick" x1="16" y1="30.8" x2="16" y2="28.2" />
                    <line className="clock-tick" x1="1.2" y1="16" x2="3.8" y2="16" />
                  </svg>
                  <span className="cell-digit">7</span>
                </div>
              </div>

              <span className="rn-diag-arrow">-&gt;</span>

              {/* Step 2: 3x3 Outline Clockwise Dial Overlay */}
              <div className="rn-clock-stage-item">
                <span className="rn-diag-label">2. OUTLINE CHRONO-DIAL</span>
                <div className="rn-sample-dial-wrap">
                  <div className="chrono-dial-overlay rn-static-dial">
                    <svg className="chrono-dial-bg-svg" viewBox="0 0 120 120" aria-hidden="true">
                      <circle className="dial-svg-outer-rim" cx="60" cy="60" r="54" />
                      <circle className="dial-svg-tick-ring" cx="60" cy="60" r="46" />
                      <circle className="dial-svg-inner-ring" cx="60" cy="60" r="22" />
                      <line className="dial-svg-crosshair" x1="60" y1="25" x2="60" y2="38" />
                      <line className="dial-svg-crosshair" x1="82" y1="60" x2="95" y2="60" />
                      <line className="dial-svg-crosshair" x1="60" y1="82" x2="60" y2="95" />
                      <line className="dial-svg-crosshair" x1="25" y1="60" x2="38" y2="60" />
                      <line className="dial-svg-hour-tick" x1="83" y1="20.2" x2="79.5" y2="26.2" />
                      <line className="dial-svg-hour-tick" x1="99.8" y1="37" x2="93.8" y2="40.5" />
                      <line className="dial-svg-hour-tick" x1="99.8" y1="83" x2="93.8" y2="79.5" />
                      <line className="dial-svg-hour-tick" x1="83" y1="99.8" x2="79.5" y2="93.8" />
                      <line className="dial-svg-hour-tick" x1="37" y1="99.8" x2="40.5" y2="93.8" />
                      <line className="dial-svg-hour-tick" x1="20.2" y1="83" x2="26.2" y2="79.5" />
                      <line className="dial-svg-hour-tick" x1="20.2" y1="37" x2="26.2" y2="40.5" />
                      <line className="dial-svg-hour-tick" x1="37" y1="20.2" x2="40.5" y2="26.2" />
                    </svg>
                    <div className="chrono-dial-node pos-0 done">4</div>
                    <div className="chrono-dial-node pos-1 active">9</div>
                    <div className="chrono-dial-node pos-2">2</div>
                    <div className="chrono-dial-node pos-3">6</div>
                  </div>
                </div>
              </div>

              <span className="rn-diag-arrow">-&gt;</span>

              {/* Step 3: Flawless 2 unchanged + 4 morphed identical tiles */}
              <div className="rn-clock-stage-item">
                <span className="rn-diag-label">3. FLAWLESS: +2 NORMAL, +4 SAME DIGITS!</span>
                <div className="rn-clock-done-col">
                  <div className="rn-demo-cells">
                    <span className="rn-demo-cell done" title="Completed Clock">
                      7
                    </span>
                    <span className="rn-demo-cell target" title="+1 unchanged">
                      3
                    </span>
                    <span className="rn-demo-cell" title="+2 unchanged">
                      8
                    </span>
                    <span className="rn-demo-cell morph-cell">5</span>
                    <span className="rn-demo-cell morph-cell">5</span>
                    <span className="rn-demo-cell morph-cell">5</span>
                    <span className="rn-demo-cell morph-cell">5</span>
                  </div>
                  <div className="rn-bonus-callout gold">4X SYNC MORPH + CHRONO BONUS!</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NEW v0.0.3 BADGES, LEADERBOARD CATEGORIES & OVERHEATED CYBER-BRAIN */}
          <div className="rn-feature-block">
            <div className="rn-feature-text">
              <span className="rn-badge-pill magenta">LEADERBOARD CATEGORIES &amp; BADGES</span>
              <h3 className="rn-title">
                RANKING CATEGORIES, NEW BADGES, v0.0.2 ARCHIVE &amp; CYBER-BRAIN
              </h3>
              <p className="rn-desc">
                Leaderboards now feature 3 ranking categories per mode:{' '}
                <strong>TOP SCORE</strong>, <strong>FASTEST TIME</strong> (or{' '}
                <strong>LONGEST SURVIVAL</strong> in Endless), and{' '}
                <strong>HIGHEST PACE (KPS)</strong>. Active rankings are flushed for{' '}
                <strong>v0.0.3</strong> with Top-5 <strong>v0.0.2</strong> champions archived alongside
                new 8-bit badges and the outline <strong>Overheated Cyber-Brain</strong> sentinel!
              </p>
            </div>

            <div className="rn-visual-showcase badges-showcase-box">
              <div className="rn-badge-sample">
                <BadgeIcon code="CHASER_OUTRUNNER" size={44} />
                <span>OUTRUNNER</span>
              </div>
              <div className="rn-badge-sample">
                <BadgeIcon code="ENDLESS_100" size={44} />
                <span>ENDLESS 100</span>
              </div>
              <div className="rn-badge-sample">
                <BadgeIcon code="CHRONO_MASTER" size={44} />
                <span>CHRONO MASTER</span>
              </div>
              <div className="rn-badge-sample">
                <BadgeIcon code="CHRONO_OVERCLOCKER" size={44} />
                <span>OVERCLOCKER</span>
              </div>
              <div className="rn-badge-sample">
                <BadgeIcon code="TOP1_V0_0_2" size={44} />
                <span>v0.0.2 GOLD</span>
              </div>
              <div className="rn-badge-sample">
                <svg
                  className="overheated-synapse-svg rn-brain-sample-svg"
                  viewBox="0 0 120 68"
                  aria-hidden="true"
                >
                  <path
                    className="brain-outline"
                    d="M36 48 C22 48 16 38 20 28 C18 18 28 10 38 13 C44 6 58 6 64 13 C74 10 84 18 82 28 C86 38 80 48 66 48 Z"
                  />
                  <path className="brain-fold" d="M32 24 C38 20 46 22 50 28" />
                  <path className="brain-fold" d="M70 24 C64 20 56 22 52 28" />
                  <path className="brain-fold" d="M28 36 C36 33 44 35 49 41" />
                  <path className="brain-fold" d="M74 36 C66 33 58 35 53 41" />
                  <circle className="neuron-core" cx="51" cy="31" r="4.5" />
                  <path className="synapse-heat h1" d="M35 8 Q39 2 35 -3" />
                  <path className="synapse-heat h2" d="M51 6 Q55 0 51 -5" />
                  <path className="synapse-heat h3" d="M67 8 Q71 2 67 -3" />
                </svg>
                <span>HOT BRAIN</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer welcome-footer">
          <span className="welcome-footer-hint">
            GOOD LUCK PILOT — OUTRUN THE CHASER &amp; MASTER THE CHRONO-DIAL!
          </span>
          <button type="button" className="btn-arcade gold" onClick={onClose}>
            LAUNCH FIGRID v0.0.3 [ENTER / ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
