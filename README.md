# FIGRID // 8-Bit Arcade Speed Typing Engine

Ultra-responsive web speed-typing game built with React + TypeScript (Zero Input Lag, `O(1)` direct DOM updates without re-rendering the 21×13 grid on keystrokes).

## Features

- **21 × 13 Grid (273 Digits)**: Clean, high-contrast unpressed digits on a plain background; tiles materialize as digits are cleared.
- **Proximity Reinforced Shields (🛡)**: Shielded digits require a double-tap (the second hit awards a **2× speed point multiplier**) and only begin fading into view **7 steps ahead**, growing brighter with each step closer.
- **Hidden Muscle-Memory Sequences**: Secret digit patterns are embedded into every board with a strictly fair point budget—discover them by typing fast!
- **5-Stop Dynamic Speed Spectrum**: Floating point deltas (`+pts`) and the centered score counter shift dynamically across a 5-color arcade gradient based on typing speed.
- **Live Speed Telemetry Chart**: Real-time HTML5 Canvas graph tracking keys/sec, reaction deltas, 2× shield hits, and discovered sequences.
- **Custom Keybindings**: Bind any keyboard keys to digits `0–9`.

## Development

```bash
npm install
npm run dev
```
