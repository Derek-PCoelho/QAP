// Respiração guiada (crise de ansiedade): segure para inspirar 4 tempos, solte para expirar 4 tempos.
import { useEffect, useRef, useState } from 'react';
import type { GuideScript } from '../../engine/content-api';
import type { GuideResult } from './GuideOverlay';

const LINES = ['"Não consigo... não entra ar..."', '"Tô... tentando..."', '"O formigamento... tá passando um pouco..."', '"Tá... tá mais devagar agora."', '"Obrigada. Desculpa. Tá passando."'];

export function Breathing({ seconds, onFinish }: { script: GuideScript; seconds: number; onFinish: (r: GuideResult) => void; real: boolean; narrative: boolean }) {
  const t0 = useRef(performance.now());
  const [now, setNow] = useState(performance.now());
  const [held, setHeld] = useState(false);
  const good = useRef(0);
  const total = useRef(0);
  const last = useRef(performance.now());
  const done = useRef(false);
  const heldRef = useRef(false);
  heldRef.current = held;
  const dur = Math.max(24, seconds);

  useEffect(() => {
    let raf = 0;
    const f = () => {
      const n = performance.now();
      const dt = n - last.current;
      last.current = n;
      const el = (n - t0.current) / 1000;
      const inhale = el % 8 < 4;
      total.current += dt;
      if (heldRef.current === inhale) good.current += dt;
      setNow(n);
      if (!done.current && el >= dur) {
        done.current = true;
        const q = good.current / Math.max(1, total.current);
        onFinish({ quality: q, success: q >= 0.6 });
        return;
      }
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    const down = (e: KeyboardEvent) => e.code === 'Space' && (e.preventDefault(), setHeld(true));
    const up = (e: KeyboardEvent) => e.code === 'Space' && setHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const el = (now - t0.current) / 1000;
  const inhale = el % 8 < 4;
  const ph = (el % 4) / 4;
  const size = inhale ? 0.45 + ph * 0.55 : 1 - ph * 0.55;
  const calm = good.current / Math.max(1, total.current);
  const line = LINES[Math.min(LINES.length - 1, Math.floor((el / dur) * LINES.length * Math.max(0.4, calm)))];
  return (
    <div className="breathing">
      <p className="br-line">{line}</p>
      <div className="br-stage">
        <div className={'br-circle' + (inhale ? ' in' : ' out')} style={{ transform: `scale(${size})` }}>
          <span>{inhale ? 'puxa o ar' : 'solta devagar'}</span>
          <b>{4 - Math.floor(el % 4)}</b>
        </div>
      </div>
      <button className={'px-btn br-hold' + (held ? ' on' : '')} onPointerDown={() => setHeld(true)} onPointerUp={() => setHeld(false)} onPointerLeave={() => setHeld(false)}>
        Segure para inspirar <span className="kbd">ESPAÇO</span>
      </button>
      <div className="meter">
        <span>Respiração no ritmo</span>
        <div className="bar">
          <i style={{ width: `${calm * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
