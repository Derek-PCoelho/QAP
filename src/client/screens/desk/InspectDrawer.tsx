import { useState } from 'react';
import { useStore } from '../../store';
import type { ClueRef } from '../../../engine/shift';

type PickFn = (id: string, text: string, el: HTMLElement | null) => void;

const TABS: { id: ClueRef['source'] | 'ficha'; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'quadro', label: 'Quadro' },
  { id: 'documento', label: 'Mesa' },
  { id: 'diario', label: 'Diário' },
];

/** Referências do Modo Inconsistência: manual, quadro, documentos da mesa, diário. */
export function InspectDrawer({ onPick, sel }: { onPick: PickFn; sel?: string }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const call = sh.active();
  const refs = sh.clueCatalog(call).filter((r) => r.source !== 'transcricao' && r.source !== 'ficha' && r.source !== 'mapa');
  const [tab, setTab] = useState<string>('manual');
  const list = refs.filter((r) => r.source === tab);
  const groups = new Map<string, ClueRef[]>();
  for (const r of list) {
    const k = r.group ?? '';
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return (
    <div className="inspect-drawer">
      <nav className="id-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={'id-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
            {t.label}
            <small>{refs.filter((r) => r.source === t.id).length}</small>
          </button>
        ))}
      </nav>
      <div className="id-list scroll-y">
        {list.length === 0 && <p className="id-empty">Nada aqui ainda.</p>}
        {[...groups.entries()].map(([k, rs]) => (
          <div key={k} className="id-group">
            {k && <h4>{k}</h4>}
            {rs.map((r) => (
              <button key={r.id} className={'clue-chip' + (sel === r.id ? ' sel' : '')} onClick={(e) => onPick(r.id, r.text, e.currentTarget)}>
                {r.text}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
