import { useState } from 'react';
import { useStore } from '../../store';

/** Quadro de cortiça: números de trote, frequentadores, documentos e post-its do jogador. */
export function CorkBoard({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const g = s.game!;
  const [text, setText] = useState('');
  const notes = ((g.st.flags['postits'] as string) || '').split('\u0001').filter(Boolean);
  const addNote = () => {
    const t = text.trim().slice(0, 80);
    if (!t) return;
    g.st.flags['postits'] = [...notes, t].join('\u0001');
    setText('');
    g.bump();
  };
  return (
    <div className="overlay-book" onClick={onClose}>
      <div className="cork" onClick={(e) => e.stopPropagation()}>
        <h2>Quadro de cortiça</h2>
        <div className="cork-items">
          {g.st.board.length === 0 && notes.length === 0 && <p className="cork-empty">Nada preso no quadro ainda.</p>}
          {g.st.board.map((b, k) => (
            <div key={b.id} className={`pin-card k-${b.kind}`} style={{ transform: `rotate(${((k * 37) % 7) - 3}deg)` }}>
              <i className="pin" />
              <b>{b.title}</b>
              <span>{b.text}</span>
              {b.count > 1 && <small>{b.count}×</small>}
            </div>
          ))}
          {notes.map((n, k) => (
            <div key={'n' + k} className="pin-card k-postit mine" style={{ transform: `rotate(${((k * 53) % 7) - 3}deg)` }}>
              <i className="pin" />
              <span>{n}</span>
            </div>
          ))}
        </div>
        <div className="cork-write">
          <input value={text} maxLength={80} placeholder="Escreva um post-it…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
          <button className="px-btn small" onClick={addNote}>
            Prender
          </button>
          <button className="px-btn small ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
