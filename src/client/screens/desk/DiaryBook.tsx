import { useState } from 'react';
import { store, useStore } from '../../store';
import { stripMarkup } from '../../../engine/text';
import { audio } from '../../audio';

/** Diário do Regulador: vivos e mortos, e o que aconteceu depois. */
export function DiaryBook({ onClose, readOnly }: { onClose: () => void; readOnly?: boolean }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift;
  const [msg, setMsg] = useState<string | null>(null);
  const entries = [...g.st.diary].reverse();
  const vivos = g.st.diary.filter((d) => d.kind === 'vivo').length;
  const mortos = g.st.diary.filter((d) => d.kind === 'morto').length;
  return (
    <div className="overlay-book" onClick={onClose}>
      <div className="diary paper" onClick={(e) => e.stopPropagation()}>
        <h2>Diário do regulador</h2>
        <p className="diary-count">
          {vivos} vivos · {mortos} mortos · {g.st.diary.length} nomes
        </p>
        <div className="diary-entries scroll-y">
          {entries.length === 0 && <p className="diary-empty">As páginas ainda estão em branco.</p>}
          {entries.map((e) => (
            <div key={e.id} className={`d-entry k-${e.kind}`}>
              <span className="d-day">D{e.day}</span>
              <div>
                {e.name && <b>{e.name}. </b>}
                {stripMarkup(e.text)}
                {e.kind === 'morto' && <span className="cross"> †</span>}
                {e.updates.map((u, k) => (
                  <p key={k} className="d-upd">
                    → (D{u.day}) {u.text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        {msg && <p className="diary-msg">{msg}</p>}
        <div className="diary-actions">
          {!readOnly && sh && (
            <button
              className="px-btn small"
              onClick={() => {
                const r = sh.readDiary();
                setMsg(r.text);
                if (r.ok) audio.sfx('page');
                store.notify();
              }}
            >
              Reler os nomes (com Desgaste alto)
            </button>
          )}
          <button className="px-btn small ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
