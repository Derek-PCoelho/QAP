import { store, useStore } from '../../store';
import { fmtTime } from '../../../engine/util';
import { audio } from '../../audio';
import { POSTIT_LABEL, postitClass } from './CallPanel';

export function Queue() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const S = sh.sh;
  const q = sh.queue();
  const blocked = !!S.guideCallId || !!g.scene;
  return (
    <section className="queue bezel" aria-label="Fila de ligações">
      <div className="q-head">
        <span>Fila</span>
        <span className="q-count">{q.length ? `${q.length} aguardando` : 'vazia'}</span>
      </div>
      <div className="q-slips">
        {q.length === 0 && S.phantoms.length === 0 && (
          <div className="q-empty">
            {S.closing ? 'Troca de turno. A fila passa para o noturno.' : 'Nenhuma ligação na fila.'}
            {/* sem nada para fazer: o relógio pode correr 4× até a próxima ligação */}
            {!S.closing && !S.tarm && sh.idle() && (
              <button
                className={'px-btn tiny q-fast' + (S.fast ? ' on' : '')}
                onClick={() => {
                  sh.setFast(!S.fast);
                  audio.sfx('click');
                  store.notify();
                }}
                title="O relógio corre 4× mais rápido até chegar a próxima ligação"
              >
                {S.fast ? '⏸ Voltar ao normal' : '⏩ Adiantar até a próxima ligação'}
              </button>
            )}
          </div>
        )}
        {q.map((c) => {
          const def = sh.defOf(c);
          const wait = Math.max(0, Math.round(S.time - c.arrived));
          const late = wait > 60;
          const isActive = S.activeId === c.id;
          return (
            <button
              key={c.id}
              className={'slip' + (def.anchor ? ' anchor' : '') + (late ? ' late' : '') + (c.status === 'espera' ? ' hold' : '') + (c.followOf ? ' retorno' : '') + (isActive ? ' active' : '')}
              disabled={blocked}
              onClick={() => {
                sh.answer(c.id);
                store.notify();
              }}
              title={c.noteText ? `Atender · TARM${c.noteBox ? ` (post-it ${POSTIT_LABEL[c.noteBox]})` : ''}: ${c.noteText}` : 'Atender'}
            >
              <span className="slip-num">{def.num}</span>
              <span className="slip-wait">
                {c.status === 'espera' ? 'em espera' : c.followOf ? 'retorno' : `${fmtTime(c.arrived)} · ${wait} min`}
              </span>
              {c.noteText ? (
                <span className={'postit' + postitClass(c) + (c.noteUrgent ? ' red' : '')}>
                  {c.noteUrgent && !c.followOf && <b>Pega essa agora. </b>}
                  {c.noteText}
                </span>
              ) : (
                <span className="postit raw">{S.tarm ? (c.followOf ? 'ligou de novo' : 'nova ligação') : 'sem anotação'}</span>
              )}
            </button>
          );
        })}
        {S.phantoms.map((p) => (
          <button
            key={p.id}
            className="slip phantom"
            onClick={() => {
              sh.clickPhantom(p.id);
              audio.sfx('busy');
              store.notify();
            }}
          >
            <span className="slip-num">(17) 9····-····</span>
            <span className="slip-wait">agora</span>
            <span className="postit">...</span>
          </button>
        ))}
      </div>
    </section>
  );
}
