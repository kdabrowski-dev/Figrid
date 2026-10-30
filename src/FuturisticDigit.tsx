// ============================================================================
// FIGRID // Custom Slim Futuristic 8-Bit Glyph Set (0-9)
// Slender 1.6-unit stroke cyber-geometric glyphs on a 12x16 coordinate grid.
// Pure single-color (`currentColor`), crisp 45-degree chamfers, lightweight feel.
// ============================================================================

import React from 'react';

const GLYPH_PATHS: Record<number, string> = {
  // 0: Slim chamfered octagon
  0: 'M 3 0 H 9 L 12 3 V 13 L 9 16 H 3 L 0 13 V 3 L 3 0 Z M 3.8 1.8 L 1.8 3.8 V 12.2 L 3.8 14.2 H 8.2 L 10.2 12.2 V 3.8 L 8.2 1.8 H 3.8 Z',

  // 1: Slender cyber-needle with angled visor and thin base
  1: 'M 5.2 0 H 7.2 V 14.2 H 10.5 V 16 H 1.5 V 14.2 H 5.2 V 2.8 L 2.5 4.2 V 2.2 L 5.2 0 Z',

  // 2: Slim beveled top arch and razor 45-degree runner
  2: 'M 2.5 0 H 9 L 12 3 V 6.5 L 2.6 14.2 H 12 V 16 H 0 V 13.8 L 10.1 5.6 V 3.4 L 8.3 1.8 H 3.3 L 1.8 3.3 V 4.8 H 0 V 2.5 L 2.5 0 Z',

  // 3: Slim twin-chambered sci-fi numeral
  3: 'M 1.5 0 H 9 L 12 3 V 6.2 L 9.8 8 L 12 9.8 V 13 L 9 16 H 1.5 L 0 14.5 V 12.5 H 1.8 V 13.6 L 2.4 14.2 H 8.3 L 10.2 12.3 V 10.4 L 8.4 8.9 H 3.5 V 7.1 H 8.4 L 10.2 5.6 V 3.7 L 8.3 1.8 H 1.5 V 0 Z',

  // 4: Thin angled mecha-diagonal with slender horizontal bar
  4: 'M 7.2 0 H 9.2 V 9.6 H 12 V 11.4 H 9.2 V 16 H 7.3 V 11.4 H 0 V 9.6 L 7.2 0 Z M 2.2 9.6 H 7.3 V 2.7 L 2.2 9.6 Z',

  // 5: Crisp thin top bar and chamfered lower loop
  5: 'M 0.5 0 H 11.2 V 1.8 H 2.3 V 6.4 H 9 L 12 9.4 V 13 L 9 16 H 1.5 L 0 14.5 V 12.5 H 1.8 V 13.6 L 2.4 14.2 H 8.3 L 10.2 12.3 V 10.1 L 8.3 8.2 H 0.5 V 0 Z',

  // 6: Slender upper sweep into a chamfered lower chamber
  6: 'M 3.5 0 H 10.2 V 1.8 H 4.2 L 1.8 4.2 V 7.2 H 9 L 12 10.2 V 13 L 9 16 H 3 L 0 13 V 3.5 L 3.5 0 Z M 1.8 9 V 12.2 L 3.8 14.2 H 8.2 L 10.2 12.2 V 10.8 L 8.4 9 H 1.8 Z',

  // 7: Slim top rail and fine diagonal laser blade
  7: 'M 0 0 H 12 V 2.6 L 5.4 16 H 3.3 L 9.8 2.6 V 1.8 H 1.8 V 4.2 H 0 V 0 Z',

  // 8: Slender dual hexagonal rings
  8: 'M 3 0 H 9 L 12 3 V 6.2 L 10 8 L 12 9.8 V 13 L 9 16 H 3 L 0 13 V 9.8 L 2 8 L 0 6.2 V 3 L 3 0 Z M 3.8 1.8 L 1.8 3.8 V 5.6 L 3.5 7.1 H 8.5 L 10.2 5.6 V 3.8 L 8.2 1.8 H 3.8 Z M 3.5 8.9 L 1.8 10.4 V 12.2 L 3.8 14.2 H 8.2 L 10.2 12.2 V 10.4 L 8.5 8.9 H 3.5 Z',

  // 9: Slim beveled upper loop with sleek lower tail
  9: 'M 3 0 H 9 L 12 3 V 12.5 L 8.5 16 H 1.8 V 14.2 H 7.8 L 10.2 11.8 V 8.8 H 3 L 0 5.8 V 3 L 3 0 Z M 3.8 1.8 L 1.8 3.8 V 5.2 L 3.6 7 H 10.2 V 3.8 L 8.2 1.8 H 3.8 Z',
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
