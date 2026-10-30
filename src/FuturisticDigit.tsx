// ============================================================================
// FIGRID // Custom Futuristic 8-Bit Glyph Set (0-9)
// Pure single-color geometric cyber-pixel grid with 45-degree chamfered edges
// and precision micro-stencil gaps — zero multi-color artifacts, 100% readable.
// ============================================================================

import React from 'react';

/**
 * Each digit 0-9 is sculpted on a clean 12x16 geometric grid (viewBox="0 0 12 16")
 * using a single unified monochrome path (`currentColor`).
 * Style: Futuristic 8-bit arcade meets sleek sci-fi HUD — beveled 45-degree
 * outer corners, crisp vertical/horizontal bars, and subtle stencil splits.
 */
const GLYPH_PATHS: Record<number, string> = {
  // 0: Chamfered sci-fi octagon with clean rectangular core cutout
  0: 'M 3 0 H 9 L 12 3 V 13 L 9 16 H 3 L 0 13 V 3 L 3 0 Z M 4 3 L 3 4 V 12 L 4 13 H 8 L 9 12 V 4 L 8 3 H 4 Z',

  // 1: Sleek cyber-monolith with angled top nose and solid balanced base
  1: 'M 5 0 H 8 V 13 H 11 V 16 H 1 V 13 H 5 V 4 H 2 V 2 L 5 0 Z',

  // 2: Beveled top arch, 45-degree diagonal runner, and crisp flat base
  2: 'M 2 0 H 9 L 12 3 V 7 L 4 13 H 12 V 16 H 0 V 12 L 9 5 V 3 H 3 V 5 H 0 V 2 L 2 0 Z',

  // 3: Sharp top visor, indented cyber-waist, and chamfered bottom chamber
  3: 'M 1 0 H 9 L 12 3 V 6 L 9 8 L 12 10 V 13 L 9 16 H 1 L 0 15 V 12 H 3 V 13 H 8 L 9 12 V 9 H 4 V 7 H 8 L 9 5 V 3 H 1 V 0 Z',

  // 4: Angled mecha-diagonal upper arm with crisp horizontal laser bar and pillar
  4: 'M 6 0 H 10 V 9 H 12 V 12 H 10 V 16 H 7 V 12 H 0 V 9 L 6 0 Z M 3 9 H 7 V 3.5 L 3 9 Z',

  // 5: Precision flat top bar, vertical drop, and chamfered lower loop
  5: 'M 0 0 H 11 V 3 H 3 V 6 H 9 L 12 9 V 13 L 9 16 H 1 L 0 15 V 12 H 3 V 13 H 8 L 9 12 V 9 L 8 8 H 0 V 0 Z',

  // 6: Angled upper sweep descending into a beveled lower core
  6: 'M 4 0 H 10 V 3 H 5 L 3 5 V 7 H 9 L 12 10 V 13 L 9 16 H 3 L 0 13 V 4 L 4 0 Z M 3 10 V 12 L 4 13 H 8 L 9 12 V 10 H 3 Z',

  // 7: Heavy top rail with stepped inner corner and razor diagonal blade
  7: 'M 0 0 H 12 V 4 L 6 16 H 2 L 8 4 V 3 H 3 V 5 H 0 V 0 Z',

  // 8: Twin chamfered hexagonal rings with clean upper and lower windows
  8: 'M 3 0 H 9 L 12 3 V 6 L 10 8 L 12 10 V 13 L 9 16 H 3 L 0 13 V 10 L 2 8 L 0 6 V 3 L 3 0 Z M 4 3 L 3 4 V 6 L 4 7 H 8 L 9 6 V 4 L 8 3 H 4 Z M 4 9 L 3 10 V 12 L 4 13 H 8 L 9 12 V 10 L 8 9 H 4 Z',

  // 9: Beveled upper chamber with sleek angled lower sweep
  9: 'M 3 0 H 9 L 12 3 V 12 L 8 16 H 2 V 13 H 7 L 9 11 V 9 H 3 L 0 6 V 3 L 3 0 Z M 4 3 L 3 4 V 6 H 9 V 4 L 8 3 H 4 Z',
};

interface FuturisticDigitProps {
  digit: number;
}

export const FuturisticDigit: React.FC<FuturisticDigitProps> = React.memo(({ digit }) => {
  const pathData = GLYPH_PATHS[digit] ?? GLYPH_PATHS[0];
  return (
    <svg
      className="futuristic-digit-svg"
      viewBox="0 0 12 16"
      aria-label={String(digit)}
    >
      <path className="glyph-main" d={pathData} fillRule="evenodd" />
    </svg>
  );
});
