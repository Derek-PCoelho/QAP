import { useLayoutEffect, useRef } from 'react';
import { store, useStore } from '../../store';
import { fmtTime } from '../../../engine/util';
import { audio } from '../../audio';
import { useDeskSel } from './deskSel';
import { splitQ } from '../../../engine/qcodes';

const STATUS_SHORT: Record<string, string> = {
  QRV: 'QRV · livre',
  DESLOC: 'deslocamento',
  LOCAL: 'no local',
  TRANSP: 'transporte',
  RETIDO: 'retida',
  RETORNO: 'retorno',
  PANE: 'pane',
  FORA: 'fora',
};

export function RadioPanel() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const S = sh.sh;
  const sel = useDeskSel();
  const logRef = useRef<HTMLDivElement>(null);
  // só acompanha a última mensagem se o jogador não estiver relendo o histórico
  const stick = useRef(true);
  useLayoutEffect(() => {
    const el = logRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [S.radio.length]);
  const onLogScroll = () => {
    const el = logRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
  };
  return (
    <section className="radio bezel" aria-label="Rádio">
      <div className="units">
        {Object.values(S.units).map((u) => {
          const free = u.status === 'QRV' || u.status === 'RETORNO';
          return (
            <button
              key={u.id}
              className={`unit-chip st-${u.status}` + (u.type === 'USA' ? ' usa' : ' usb') + (sel.unit === u.id ? ' sel' : '')}
              disabled={!free}
              title={`${u.crew}${u.note ? ' · ' + u.note : ''}`}
              onClick={() => {
                sel.set({ unit: u.id, type: u.type });
                audio.sfx('click');
                store.notify();
              }}
            >
              <b>{u.label}</b>
              <span>{STATUS_SHORT[u.status]}</span>
            </button>
          );
        })}
      </div>
      {/* pedidos que esperam resposta ficam no cartão fixo sobre o mapa (RequestTray) */}
      <div ref={logRef} onScroll={onLogScroll} className="radio-log screen scroll-y">
        {S.radio.slice(-40).map((m) => (
          <p key={m.id} className={`rl k-${m.kind}`}>
            <span className="t">{fmtTime(m.t)}</span> <b>{m.from}</b>{' '}
            {splitQ(m.text).map((x, i) =>
              x.q ? (
                <abbr key={i} className="qcode" title={x.q}>
                  {x.t}
                </abbr>
              ) : (
                <span key={i}>{x.t}</span>
              ),
            )}
          </p>
        ))}
      </div>
    </section>
  );
}
