import React from 'react';

export interface UserBadge {
  code: string;
  title: string;
  description: string;
  versionTag?: string;
  awardedAt?: string;
}

interface BadgeIconProps {
  code: string;
  size?: number;
  className?: string;
}

/**
 * 8-Bit Vibrant Pixel-Art SVG Badges.
 * Each badge is constrained to an invisible square bounding box (size x size),
 * while its actual silhouette is a custom pixel shape (e.g., free-standing Robot Head,
 * notched version plaque, winged cyber crest, or astral quantum core) — NOT a plain square box!
 */
export const BadgeIcon: React.FC<BadgeIconProps> = ({ code, size = 22, className = '' }) => {
  const normalized = (code || '').toUpperCase();

  // 1. BOT_DETECTED: Vibrant 8-bit Pixel Robot Head (free-standing silhouette, no outer box!)
  if (normalized === 'BOT_DETECTED') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`figrid-badge-svg badge-bot ${className}`}
        shapeRendering="crispEdges"
        aria-label="Suspected Automaton Badge"
      >
        {/* Glowing Red Antenna Tip & Stalk */}
        <rect x="10" y="1" width="4" height="2" fill="#ff2a54" />
        <rect x="11" y="3" width="2" height="3" fill="#94a3b8" />
        {/* Robot Cranium Silhouette (Stepped 8-bit head, no background square) */}
        <rect x="6" y="6" width="12" height="2" fill="#cbd5e1" />
        <rect x="4" y="8" width="16" height="10" fill="#64748b" />
        <rect x="5" y="8" width="14" height="9" fill="#94a3b8" />
        {/* Side Ear Bolts */}
        <rect x="2" y="10" width="2" height="5" fill="#00f0ff" />
        <rect x="20" y="10" width="2" height="5" fill="#00f0ff" />
        {/* Dark Visor Trench */}
        <rect x="6" y="10" width="12" height="4" fill="#090d16" />
        {/* Glowing Cyber Red/Magenta Robot Eyes */}
        <rect x="7" y="11" width="3" height="2" fill="#ff2a54" />
        <rect x="14" y="11" width="3" height="2" fill="#ff2a54" />
        <rect x="8" y="11" width="1" height="1" fill="#ffffff" />
        <rect x="15" y="11" width="1" height="1" fill="#ffffff" />
        {/* Stepped Robot Jaw & Grille Teeth */}
        <rect x="6" y="18" width="12" height="4" fill="#475569" />
        <rect x="7" y="16" width="10" height="2" fill="#0f172a" />
        <rect x="8" y="16" width="2" height="2" fill="#00f0ff" />
        <rect x="11" y="16" width="2" height="2" fill="#ffea00" />
        <rect x="14" y="16" width="2" height="2" fill="#00f0ff" />
      </svg>
    );
  }

  // 2. TOP 1 / 2 / 3 VERSION PLAQUES (Notched hexagonal/shielded metallic plaque with 0.0.1)
  if (normalized.startsWith('TOP1_') || normalized.startsWith('TOP2_') || normalized.startsWith('TOP3_')) {
    const isGold = normalized.startsWith('TOP1_');
    const isSilver = normalized.startsWith('TOP2_');
    const mainFill = isGold ? '#ffd700' : isSilver ? '#e2e8f0' : '#f97316';
    const rimFill = isGold ? '#b45309' : isSilver ? '#475569' : '#7c2d12';
    const shineFill = isGold ? '#fef08a' : isSilver ? '#ffffff' : '#fdba74';
    const gemFill = isGold ? '#00f0ff' : isSilver ? '#38bdf8' : '#fde047';

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`figrid-badge-svg badge-plaque ${className}`}
        shapeRendering="crispEdges"
      >
        {/* Top Pixel Crown / Crest tips */}
        <rect x="6" y="2" width="2" height="2" fill={mainFill} />
        <rect x="11" y="1" width="2" height="3" fill={shineFill} />
        <rect x="16" y="2" width="2" height="2" fill={mainFill} />
        {/* Notched Metallic Plaque Silhouette */}
        <rect x="4" y="4" width="16" height="2" fill={rimFill} />
        <rect x="2" y="6" width="20" height="12" fill={rimFill} />
        <rect x="3" y="6" width="18" height="11" fill={mainFill} />
        <rect x="4" y="7" width="16" height="2" fill={shineFill} />
        {/* Bottom Tapered Pedestal Lip */}
        <rect x="5" y="18" width="14" height="2" fill={mainFill} />
        <rect x="7" y="20" width="10" height="2" fill={rimFill} />
        {/* Inner Dark Plate with "001" Pixel Engraving */}
        <rect x="5" y="10" width="14" height="6" fill="#090d16" />
        {/* Pixel "0" */}
        <rect x="6" y="11" width="3" height="4" fill={shineFill} />
        <rect x="7" y="12" width="1" height="2" fill="#090d16" />
        {/* Pixel "0" */}
        <rect x="10" y="11" width="3" height="4" fill={shineFill} />
        <rect x="11" y="12" width="1" height="2" fill="#090d16" />
        {/* Pixel "1" */}
        <rect x="15" y="11" width="2" height="4" fill={gemFill} />
      </svg>
    );
  }

  // 3. LINEAR 100 / 1000 / 10000: Winged 8-Bit Cyber Lightning Crest
  if (normalized.startsWith('LINEAR_')) {
    const is10k = normalized === 'LINEAR_10000';
    const is1k = normalized === 'LINEAR_1000';
    const wingColor = is10k ? '#ff00e5' : is1k ? '#00f0ff' : '#00e5a3';
    const coreColor = is10k ? '#ffd700' : is1k ? '#ffea00' : '#38bdf8';

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`figrid-badge-svg badge-linear ${className}`}
        shapeRendering="crispEdges"
      >
        {/* Pixel Wings Silhouette */}
        <rect x="1" y="6" width="4" height="2" fill={wingColor} />
        <rect x="2" y="8" width="5" height="2" fill={wingColor} />
        <rect x="4" y="10" width="5" height="3" fill={wingColor} />
        <rect x="19" y="6" width="4" height="2" fill={wingColor} />
        <rect x="17" y="8" width="5" height="2" fill={wingColor} />
        <rect x="15" y="10" width="5" height="3" fill={wingColor} />
        {/* Center Diamond / Lightning Spear */}
        <rect x="11" y="2" width="2" height="3" fill="#ffffff" />
        <rect x="9" y="5" width="6" height="4" fill={coreColor} />
        <rect x="7" y="9" width="10" height="5" fill={coreColor} />
        <rect x="9" y="14" width="6" height="4" fill={coreColor} />
        <rect x="11" y="18" width="2" height="4" fill={wingColor} />
        {/* Bright Core Gem */}
        <rect x="10" y="9" width="4" height="4" fill="#090d16" />
        <rect x="11" y="10" width="2" height="2" fill="#ffffff" />
      </svg>
    );
  }

  // 4. BINARY 100 / 1000 / 10000: 8-Bit Silicon CPU Microchip / Logic Gate Core
  if (normalized.startsWith('BINARY_')) {
    const isBin10k = normalized === 'BINARY_10000';
    const isBin1k = normalized === 'BINARY_1000';
    const pinColor = isBin10k ? '#ffd700' : isBin1k ? '#00ff66' : '#00f0ff';
    const dieColor = isBin10k ? '#ff00e5' : isBin1k ? '#00f0ff' : '#10b981';

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`figrid-badge-svg badge-binary ${className}`}
        shapeRendering="crispEdges"
      >
        {/* Top & Bottom Silicon Pins */}
        <rect x="7" y="1" width="2" height="3" fill={pinColor} />
        <rect x="11" y="1" width="2" height="3" fill={pinColor} />
        <rect x="15" y="1" width="2" height="3" fill={pinColor} />
        <rect x="7" y="20" width="2" height="3" fill={pinColor} />
        <rect x="11" y="20" width="2" height="3" fill={pinColor} />
        <rect x="15" y="20" width="2" height="3" fill={pinColor} />
        {/* Left & Right Silicon Pins */}
        <rect x="1" y="7" width="3" height="2" fill={pinColor} />
        <rect x="1" y="11" width="3" height="2" fill={pinColor} />
        <rect x="1" y="15" width="3" height="2" fill={pinColor} />
        <rect x="20" y="7" width="3" height="2" fill={pinColor} />
        <rect x="20" y="11" width="3" height="2" fill={pinColor} />
        <rect x="20" y="15" width="3" height="2" fill={pinColor} />
        {/* CPU Die Body */}
        <rect x="4" y="4" width="16" height="16" fill={dieColor} />
        <rect x="6" y="6" width="12" height="12" fill="#090d16" />
        {/* Pixel "0" and "1" Logic Core */}
        <rect x="7" y="8" width="4" height="8" fill={pinColor} />
        <rect x="8" y="10" width="2" height="4" fill="#090d16" />
        <rect x="14" y="8" width="2" height="8" fill="#ffffff" />
      </svg>
    );
  }

  // 5. OMNI 100 / 1000 / 10000: 8-Way Quantum Starburst / Singularity Compass
  const isOmni10k = normalized === 'OMNI_10000';
  const isOmni1k = normalized === 'OMNI_1000';
  const starOuter = isOmni10k ? '#ffd700' : isOmni1k ? '#ff00e5' : '#ff9100';
  const starInner = isOmni10k ? '#00f0ff' : isOmni1k ? '#00ff66' : '#ffea00';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`figrid-badge-svg badge-omni ${className}`}
      shapeRendering="crispEdges"
    >
      {/* 8-Directional Pixel Star Spikes */}
      <rect x="11" y="1" width="2" height="4" fill={starOuter} />
      <rect x="11" y="19" width="2" height="4" fill={starOuter} />
      <rect x="1" y="11" width="4" height="2" fill={starOuter} />
      <rect x="19" y="11" width="4" height="2" fill={starOuter} />
      {/* Diagonal Rays */}
      <rect x="4" y="4" width="3" height="3" fill={starInner} />
      <rect x="17" y="4" width="3" height="3" fill={starInner} />
      <rect x="4" y="17" width="3" height="3" fill={starInner} />
      <rect x="17" y="17" width="3" height="3" fill={starInner} />
      {/* Octagonal Core */}
      <rect x="7" y="7" width="10" height="10" fill={starOuter} />
      <rect x="9" y="9" width="6" height="6" fill="#090d16" />
      <rect x="10" y="10" width="4" height="4" fill={starInner} />
      <rect x="11" y="11" width="2" height="2" fill="#ffffff" />
    </svg>
  );
};

interface BadgeListProps {
  badges?: UserBadge[];
  size?: number;
  onInspectBadge?: (badge: UserBadge) => void;
}

export const BadgeList: React.FC<BadgeListProps> = ({
  badges,
  size = 20,
  onInspectBadge,
}) => {
  if (!badges || badges.length === 0) return null;

  return (
    <span className="pilot-badge-strip">
      {badges.map((b) => (
        <button
          key={b.code}
          type="button"
          className="pilot-badge-btn"
          title={`${b.title} - Click to inspect`}
          onClick={(e) => {
            e.stopPropagation();
            if (onInspectBadge) onInspectBadge(b);
          }}
        >
          <BadgeIcon code={b.code} size={size} />
        </button>
      ))}
    </span>
  );
};

interface BadgeInspectModalProps {
  badge: UserBadge | null;
  onClose: () => void;
}

export const BadgeInspectModal: React.FC<BadgeInspectModalProps> = ({ badge, onClose }) => {
  if (!badge) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box badge-inspect-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>PILOT BADGE INSPECTION</h2>
          <button type="button" className="btn-close" onClick={onClose}>
            X
          </button>
        </div>

        <div className="badge-inspect-body">
          <div className="badge-inspect-icon-showcase">
            <BadgeIcon code={badge.code} size={72} />
          </div>
          <h3 className="badge-inspect-title">{badge.title}</h3>
          <p className="badge-inspect-desc">{badge.description}</p>
          {badge.awardedAt && (
            <span className="badge-inspect-meta">
              RECORDED: {badge.awardedAt} {badge.versionTag ? `// v${badge.versionTag}` : ''}
            </span>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-arcade cyan" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export interface InspectedPilotInfo {
  username?: string;
  nick: string;
  favoriteMode?: string;
  badges?: UserBadge[];
}

interface PilotProfileModalProps {
  pilot: InspectedPilotInfo | null;
  onClose: () => void;
  onInspectBadge: (badge: UserBadge) => void;
}

export const PilotProfileModal: React.FC<PilotProfileModalProps> = ({
  pilot,
  onClose,
  onInspectBadge,
}) => {
  if (!pilot) return null;

  const favModeLabel =
    pilot.favoriteMode === 'OMNI'
      ? 'OMNI-8'
      : pilot.favoriteMode === 'BINARY'
      ? 'BINARY (7x4)'
      : 'LINEAR';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box auth-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>PILOT DOSSIER // PROFILE</h2>
          <button type="button" className="btn-close" onClick={onClose}>
            X
          </button>
        </div>

        <div className="auth-profile-view">
          {pilot.username && (
            <div className="auth-profile-row">
              <span className="hud-label">PILOT CALLSIGN</span>
              <strong className="auth-username">{pilot.username}</strong>
            </div>
          )}
          <div className="auth-profile-row">
            <span className="hud-label">3-LETTER TAG</span>
            <strong className="auth-nick-badge">{pilot.nick}</strong>
          </div>
          <div className="auth-profile-row">
            <span className="hud-label">FAVORITE MODE</span>
            <strong className="highlight-cyan">{favModeLabel}</strong>
          </div>

          <div className="profile-badges-section">
            <span className="hud-label">EARNED PILOT BADGES (CLICK TO INSPECT)</span>
            {pilot.badges && pilot.badges.length > 0 ? (
              <div className="profile-badges-inline-strip">
                <BadgeList
                  badges={pilot.badges}
                  size={28}
                  onInspectBadge={(b) => onInspectBadge(b)}
                />
              </div>
            ) : (
              <div className="profile-no-badges">No badges earned yet.</div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-arcade cyan" onClick={onClose}>
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
