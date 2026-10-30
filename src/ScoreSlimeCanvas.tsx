import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface SlimeSpawnPayload {
  color: string;
  amount: number; // 1 = normal stroke, 2 = fast/shield, 4 = sequence bonus
}

export interface ScoreSlimeCanvasHandle {
  spawnSlime: (payload: SlimeSpawnPayload) => void;
  clearSlime: () => void;
}

interface SlimeDrop {
  x: number; // relative 0..1 across box width
  y: number; // starts near 0 (top/rim of score box) and drips down
  width: number;
  length: number;
  maxLength: number;
  color: string;
  vy: number;
  phase: number;
  createdAt: number;
  isDetached: boolean;
  alpha: number;
}

/**
 * Renders multi-colored viscous slime/ooze dripping down the bottom score box.
 * - Each keystroke spawns new drips of its own fixed spectrum/bonus color (existing drips keep their original color!).
 * - When typing continuously, drips accumulate along the top rim and ooze down the sides/front.
 * - When the player stops typing for ~1.1s, all slime accelerates downward, detaches, and drains away completely!
 */
export const ScoreSlimeCanvas = forwardRef<ScoreSlimeCanvasHandle, unknown>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropsRef = useRef<SlimeDrop[]>([]);
  const lastStrokeTimeRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    spawnSlime: ({ color, amount }) => {
      const now = performance.now();
      lastStrokeTimeRef.current = now;

      const count = Math.min(7, Math.max(1, Math.round(amount * 1.6)));
      for (let i = 0; i < count; i++) {
        const x = 0.04 + Math.random() * 0.92;
        const width = 7 + Math.random() * 11;
        const maxLength = 18 + Math.random() * 38 + amount * 8;
        dropsRef.current.push({
          x,
          y: 0,
          width,
          length: 4 + Math.random() * 6,
          maxLength,
          color,
          vy: 0.35 + Math.random() * 0.55 + amount * 0.12,
          phase: Math.random() * Math.PI * 2,
          createdAt: now,
          isDetached: false,
          alpha: 0.88,
        });
      }

      // Cap total active drops for 144fps performance
      if (dropsRef.current.length > 90) {
        dropsRef.current.splice(0, dropsRef.current.length - 90);
      }
    },
    clearSlime: () => {
      dropsRef.current = [];
    },
  }));

  useEffect(() => {
    let rafId: number;

    const render = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const w = canvas.clientWidth || 420;
          const h = canvas.clientHeight || 110;

          if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
          }

          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, w, h);

          const idleMs = now - lastStrokeTimeRef.current;
          // After 1100ms of no keystrokes, all slime starts draining off the box!
          const isDraining = idleMs > 1100;

          const drops = dropsRef.current;
          for (let i = drops.length - 1; i >= 0; i--) {
            const d = drops[i];

            if (isDraining) {
              d.isDetached = true;
              d.vy += 0.18; // Gravity pulls the slime down off the box
              d.y += d.vy;
              d.length *= 0.985;
              if (d.y > h - 18) {
                d.alpha -= 0.06;
              }
            } else {
              // Ooze growth phase while actively typing
              if (d.length < d.maxLength && !d.isDetached) {
                d.length += d.vy * 0.85;
                // Slow viscous creep downward
                d.y += d.vy * 0.12;
              } else {
                // Once heavy enough, it slowly slides down
                d.isDetached = true;
                d.y += d.vy * 0.65;
                if (d.y + d.length > h) {
                  d.alpha -= 0.035;
                }
              }
            }

            if (d.alpha <= 0.02 || d.y > h + 20) {
              drops.splice(i, 1);
              continue;
            }

            const px = d.x * w;
            const py = d.y;
            const radius = d.width / 2;
            const bottomY = py + d.length;

            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, d.alpha));
            ctx.fillStyle = d.color;
            ctx.shadowColor = d.color;
            ctx.shadowBlur = 6;

            // Draw viscous column with rounded bulbous tip at the bottom
            ctx.beginPath();
            // Top anchor puddle (wider if still attached to top rim)
            const topHalfW = d.isDetached ? radius * 0.72 : radius * 1.35;
            ctx.moveTo(px - topHalfW, py);
            ctx.lineTo(px + topHalfW, py);
            // Slightly tapered waist leading to bulbous droplet tip
            ctx.quadraticCurveTo(px + radius * 0.85, py + d.length * 0.55, px + radius, bottomY);
            ctx.arc(px, bottomY, radius, 0, Math.PI, false);
            ctx.quadraticCurveTo(px - radius * 0.85, py + d.length * 0.55, px - topHalfW, py);
            ctx.closePath();
            ctx.fill();

            // Specular 8-bit highlight inside the droplet tip
            ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
            ctx.shadowBlur = 0;
            ctx.fillRect(
              Math.round(px - radius * 0.45),
              Math.round(bottomY - radius * 0.35),
              Math.max(2, Math.round(radius * 0.4)),
              Math.max(2, Math.round(radius * 0.45))
            );

            ctx.restore();
          }

          ctx.restore();
        }
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} className="score-slime-canvas" />;
});
