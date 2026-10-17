// Canvas de pixel art com resolução lógica e escala inteira; animação opcional.
import { useEffect, useRef } from 'react';

export function ArtCanvas({
  w,
  h,
  scale = 4,
  draw,
  animate = false,
  fps = 12,
  className,
  style,
  onClick,
  onMove,
}: {
  w: number;
  h: number;
  scale?: number;
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
  animate?: boolean;
  fps?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (x: number, y: number) => void;
  onMove?: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    let last = 0;
    const frame = (t: number) => {
      if (!animate || t - last >= 1000 / fps) {
        last = t;
        try {
          drawRef.current(ctx, t);
        } catch (e) {
          // arte não deve derrubar o jogo
          console.error(e);
        }
      }
      if (animate) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, fps, w, h]);
  // redesenha em toda renderização quando não anima
  useEffect(() => {
    if (animate) return;
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      try {
        draw(ctx, performance.now());
      } catch (e) {
        console.error(e);
      }
    }
  });
  const toLocal = (e: React.MouseEvent) => {
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * w, ((e.clientY - r.top) / r.height) * h] as const;
  };
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className={className}
      style={{ width: w * scale, height: h * scale, ...style }}
      onClick={onClick ? (e) => onClick(...toLocal(e)) : undefined}
      onMouseMove={onMove ? (e) => onMove(...toLocal(e)) : undefined}
    />
  );
}
