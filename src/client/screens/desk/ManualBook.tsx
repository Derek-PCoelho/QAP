import { useState } from 'react';
import { useStore } from '../../store';
import { CONTENT } from '../../../content/index';
import { QCODES } from '../../../engine/qcodes';

const RADIO_TAB = '__q';

export function ManualBook({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const g = s.game!;
  const pages = CONTENT.manual.filter((p) => g.st.manual.includes(p.id));
  const [i, setI] = useState(pages.length - 1);
  const [tab, setTab] = useState<string | null>(null);
  const p = tab === RADIO_TAB ? undefined : pages[Math.max(0, Math.min(pages.length - 1, i))];
  return (
    <div className="overlay-book" onClick={onClose}>
      <div className="manual paper" onClick={(e) => e.stopPropagation()}>
        <div className="man-cover">Manual de Regulação · Santa Aurora</div>
        <nav className="man-tabs">
          {pages.map((pg, k) => (
            <button key={pg.id} className={'man-tab' + (k === i && tab !== RADIO_TAB ? ' on' : '') + (pg.day === g.st.day ? ' new' : '')} onClick={() => (setI(k), setTab(null))}>
              {pg.code}
            </button>
          ))}
          <button className={'man-tab' + (tab === RADIO_TAB ? ' on' : '')} onClick={() => setTab(RADIO_TAB)} title="Código Q do rádio">
            Q
          </button>
        </nav>
        {tab === RADIO_TAB && (
          <article className="man-page">
            <h2>Anexo · Código Q do rádio</h2>
            <p className="man-intro">Como as equipes falam com a central pelo rádio. No rádio, passe o mouse sobre um código para ver o significado.</p>
            <ul className="man-q">
              {Object.entries(QCODES).map(([k, v]) => (
                <li key={k}>
                  <b>{k}</b> — {v}
                </li>
              ))}
            </ul>
            <p className="man-foot">Exemplo: "USB 02 de QAP. QSL, QRR 3: QTY para a Rua Bahia." = a USB 02 está na escuta, entendeu, prioridade absoluta, a caminho.</p>
          </article>
        )}
        {p && (
          <article className="man-page">
            <h2>
              {p.code} · {p.title}
            </h2>
            {p.intro && <p className="man-intro">{p.intro}</p>}
            <ul>
              {p.rules.map((r) => (
                <li key={r.id}>{r.text}</li>
              ))}
            </ul>
            <p className="man-foot">Página incluída no dia {p.day}.</p>
          </article>
        )}
        <button className="px-btn small close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
