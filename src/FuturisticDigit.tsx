// ============================================================================
// FIGRID // Custom Futuristic 8-Bit Glyph Set (0-9)
// Original cyber-voxel stencil geometry designed exclusively for Figrid digits.
// ============================================================================

import React from 'react';

/**
 * Each digit 0-9 is constructed on a 7x9 cyber-voxel grid (viewBox="0 0 14 18")
 * featuring 45-degree chamfered corners, stencil laser-cuts, and futuristic
 * 8-bit proportions that do not exist in any standard font.
 */
const GLYPH_PATHS: Record<number, { main: string; accent: string }> = {
  0: {
    // Chamfered cyber-octagon with diagonal energy slash cut
    main: 'M 4 0 H 12 L 14 2 V 14 L 10 18 H 2 L 0 16 V 4 L 4 0 Z M 4 3 L 3 4 V 14 L 4 15 H 10 L 11 14 V 4 L 10 3 H 4 Z',
    accent: 'M 5 11 L 9 7 M 5 12 H 7 V 10 H 5 Z M 7 8 H 9 V 6 H 7 Z',
  },
  1: {
    // Cyber blade pillar with uppervisor hook and split stencil base
    main: 'M 6 0 H 10 V 14 H 6 V 4 H 3 V 2 L 6 0 Z M 2 15 H 12 V 18 H 2 V 15 Z',
    accent: 'M 10 4 H 12 V 8 H 10 Z',
  },
  2: {
    // Futuristic Z-runner with detached top-left emitter and angled chute
    main: 'M 4 0 H 12 L 14 2 V 8 L 11 11 H 4 V 14 H 14 V 18 H 0 V 10 L 3 7 H 10 V 3 H 4 V 0 Z',
    accent: 'M 0 1 H 3 V 4 H 0 Z',
  },
  3: {
    // Twin-turbine right frame with floating center core bar
    main: 'M 0 0 H 12 L 14 2 V 7 L 12 9 L 14 11 V 16 L 12 18 H 0 V 15 H 10 L 11 14 V 11 H 10 V 7 L 11 6 V 4 L 10 3 H 0 V 0 Z',
    accent: 'M 3 7 H 9 V 11 H 3 Z',
  },
  4: {
    // Open-top mecha fork with offset crossbar and heavy right stabilizer
    main: 'M 0 0 H 4 V 8 H 9 V 0 H 13 V 9 H 14 V 12 H 13 V 18 H 9 V 12 H 0 V 0 Z',
    accent: 'M 4 2 H 6 V 6 H 4 Z',
  },
  5: {
    // Inverted cyber-hook with razor bottom-right chamfer
    main: 'M 0 0 H 14 V 3 H 4 V 7 H 12 L 14 9 V 15 L 11 18 H 0 V 15 H 10 L 11 14 V 10 H 0 V 0 Z',
    accent: 'M 11 4 H 14 V 6 H 11 Z',
  },
  6: {
    // Slanted top-scanner with armored lower chamber
    main: 'M 4 0 H 13 V 3 H 5 L 4 4 V 7 H 12 L 14 9 V 16 L 12 18 H 2 L 0 16 V 4 L 4 0 Z M 4 10 V 14 L 5 15 H 10 L 11 14 V 10 H 4 Z',
    accent: 'M 6 11 H 8 V 13 H 6 Z',
  },
  7: {
    // Railgun overhang with diagonal plasma beam and mid-fin stabilizer
    main: 'M 0 0 H 14 V 5 L 7 18 H 3 L 9 6 H 5 V 3 H 0 V 0 Z',
    accent: 'M 2 9 H 5 V 12 H 2 Z M 10 11 H 13 V 14 H 10 Z',
  },
  8: {
    // Asymmetric dual-reactor core with stencil waist separation
    main: 'M 2 0 H 12 L 14 2 V 7 L 12 8 H 2 L 0 7 V 2 L 2 0 Z M 4 3 V 6 H 10 V 3 H 4 Z M 2 10 H 12 L 14 11 V 16 L 12 18 H 2 L 0 16 V 11 L 2 10 Z M 4 12 V 15 H 10 V 12 H 4 Z',
    accent: 'M 6 8 H 8 V 10 H 6 Z',
  },
  9: {
    // Upper reactor visor with sweeping lower tail blade
    main: 'M 2 0 H 12 L 14 2 V 14 L 10 18 H 1 V 15 H 9 L 10 14 V 11 H 2 L 0 9 V 2 L 2 0 Z M 4 3 V 8 H 10 V 3 H 4 Z',
    accent: 'M 6 4 H 8 V 7 H 6 Z',
  },
};

interface FuturisticDigitProps {
  digit: number;
}

export const FuturisticDigit: React.FC<FuturisticDigitProps> = React.memo(({ digit }) => {
  const glyph = GLYPH_PATHS[digit] || GLYPH_PATHS[0];
  return (
    <svg
      className="futuristic-digit-svg"
      viewBox="0 0 14 18"
      aria-label={String(digit)}
    >
      <path className="glyph-main" d={glyph.main} fillRule="evenodd" />
      <path className="glyph-accent" d={glyph.accent} />
    </svg>
  );
});
