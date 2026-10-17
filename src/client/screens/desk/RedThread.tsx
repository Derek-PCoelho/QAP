import { useEffect, useState } from 'react';

/** O fio vermelho entre duas pistas (sucesso) ou cinza que arrebenta (sem relação). */
export function RedThread({ a, b, ok, container, onDone }: { a: HTMLElement | null; b: HTMLElement | null; ok: boolean; container: HTMLElement | null; onDone: () => void }) {
  const [pts, setPts] = useState<[number, number, number, number] | null>(null);
  useEffect(() => {
    if (!a || !b || !container) {
      onDone();
      return;
    }
    const cr = container.getBoundingClientRect();
    const scale = cr.width / container.offsetWidth || 1;
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    setPts([(ra.left + ra.width / 2 - cr.left) / scale, (ra.top + ra.height / 2 - cr.top) / scale, (rb.left + rb.width / 2 - cr.left) / scale, (rb.top + rb.height / 2 - cr.top) / scale]);
    const t = setTimeout(onDone, ok ? 2600 : 1100);
    return () => clearTimeout(t);
  }, [a, b, container, ok, onDone]);
  if (!pts) return null;
  const [x1, y1, x2, y2] = pts;
  const mx = (x1 + x2) / 2;
  const my = Math.max(y1, y2) + 40;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  return (
    <svg className={'red-thread' + (ok ? ' ok' : ' bad')} width="1280" height="720" viewBox="0 0 1280 720">
      <path d={d} />
      <circle cx={x1} cy={y1} r={5} />
      <circle cx={x2} cy={y2} r={5} />
    </svg>
  );
}
