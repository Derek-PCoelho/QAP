import { store, useStore } from '../../store';
import { Portrait, speakerId } from '../../ui/Portrait';
import { useEffect } from 'react';

/** Interfone do Peixoto, recados da Simone e avisos. */
export function ModalStack() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const ms = sh.sh.modals;
  const blocking = ms.find((m) => m.blocking);
  const notes = ms.filter((m) => !m.blocking);
  // recados não bloqueantes somem sozinhos
  useEffect(() => {
    if (!notes.length) return;
    const t = setTimeout(() => {
      const first = notes[0];
      if (first && !first.options?.length) {
        sh.ackModal(first.id);
        store.notify();
      }
    }, 25000);
    return () => clearTimeout(t);
  }, [notes.map((n) => n.id).join(',')]);
  return (
    <>
      {notes.length > 0 && (
        <div className="simone-notes">
          {notes.map((m) => (
            <div key={m.id} className={'simone-note' + (m.kind === 'simone' ? '' : ' other')}>
              <b>{m.who}</b>
              <span>{m.text}</span>
              <div className="sn-actions">
                {m.options?.length ? (
                  m.options.map((o) => (
                    <button key={o.id} className="px-btn small warm" onClick={() => (sh.ackModal(m.id, o.id), store.notify())}>
                      {o.label}
                    </button>
                  ))
                ) : (
                  <button className="px-btn small ghost" onClick={() => (sh.ackModal(m.id), store.notify())}>
                    Ok
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {blocking && (
        <div className="modal-veil">
          <div className={'modal-card bezel k-' + blocking.kind}>
            <div className="mc-head">
              {(() => {
                const id = speakerId(blocking.who.replace('DR. ', ''), g.st.gender);
                return id ? <Portrait id={id} size={128} /> : null;
              })()}
              <div>
                <span className="mc-kind">{blocking.kind === 'interfone' ? 'Interfone' : blocking.kind === 'aviso' ? 'Aviso' : 'Recado'}</span>
                <b>{blocking.who}</b>
              </div>
            </div>
            <p>{blocking.text}</p>
            <div className="mc-actions">
              {blocking.options?.length ? (
                blocking.options.map((o) => (
                  <button key={o.id} className="px-btn warm" onClick={() => (sh.ackModal(blocking.id, o.id), store.notify())}>
                    {o.label}
                  </button>
                ))
              ) : (
                <button className="px-btn primary" autoFocus onClick={() => (sh.ackModal(blocking.id), store.notify())}>
                  {blocking.kind === 'interfone' ? 'Entendido, doutor' : 'Ok'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
