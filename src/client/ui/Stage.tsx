// Palco fixo 1280×720 escalado para caber na janela.
import { useEffect, useState, type ReactNode } from 'react';

export function Stage({ children, pixel }: { children: ReactNode; pixel?: boolean }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
      setScale(pixel && s >= 1 ? Math.floor(s * 2) / 2 : s);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [pixel]);
  return (
    <div className="stage-wrap">
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
