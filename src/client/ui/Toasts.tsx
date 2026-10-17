import type { Toast } from '../../engine/types';

export function Toasts({ items }: { items: { id: number; text: string; kind: Toast['kind'] }[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.slice(-6).map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
