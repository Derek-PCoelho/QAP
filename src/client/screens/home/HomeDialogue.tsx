import { useEffect, useState } from 'react';
import { store, useStore } from '../../store';
import { Portrait, speakerId, speakerName } from '../../ui/Portrait';
import { parseMarkup } from '../../../engine/text';
import { audio } from '../../audio';
import { objectRect, objectsFor } from '../../art';

/** a cena sobe 132 px enquanto o diálogo está aberto (ver .home.dlg-open em home.css) */
const SCENE_SHIFT = 132;

/** Diálogo da cena + Modo Inconsistência doméstico. */
export function HomeDialogue({ inspect, toggleInspect }: { inspect: boolean; toggleInspect: () => void }) {
  const s = useStore();
  const g = s.game!;
  const home = g.home!;
  const h = g.st.home!;
  const sc = home.scene();
  const lines = home.visibleLines();
  const choices = home.choices();
  const [n, setN] = useState(1);
  const [sel, setSel] = useState<{ id: string; text: string } | null>(null);
  const [insight, setInsight] = useState<{ text: string; ok: boolean } | null>(null);
  const node = h.node;
  useEffect(() => setN(1), [node, h.sceneId]);
  const shown = lines.slice(0, n);
  const all = n >= lines.length;
  const last = shown[shown.length - 1];
  const pid = last ? speakerId(last.who, g.st.gender) : null;
  const blend = Math.max(0, Math.min(1, (g.st.vars.desgaste - 35) / 65));

  useEffect(() => {
    if (last && last.who !== 'NARRADOR') {
      const plain = parseMarkup(last.text).map((x) => x.text).join('');
      const v = last.who === 'LUCIA' ? (g.st.gender === 'F' ? 'alex' : 'lucia') : last.who === 'DAVI' ? 'davi' : last.who === 'ZELIA' ? 'zelia' : last.who === 'EU' ? (g.st.gender === 'M' ? 'jovem_h' : 'jovem_m') : 'homem';
      audio.voice(plain, v as never);
    }
  }, [n, node]);

  const pick = (id: string, text: string) => {
    if (!inspect) return;
    if (!sel) {
      setSel({ id, text });
      audio.sfx('pen');
      return;
    }
    if (sel.id === id) return setSel(null);
    const r = home.link(sel.id, id);
    setSel(null);
    setInsight(r.ok ? { text: r.insight ?? '', ok: true } : { text: 'Sem relação entre essas duas coisas.', ok: false });
    audio.sfx(r.ok ? 'insight' : 'wrong');
    store.notify();
    setTimeout(() => setInsight(null), 5000);
  };

  const clues = inspect ? home.homeClues().filter((c) => c.source === 'objeto') : [];

  return (
    <>
      {inspect &&
        clues.map((c) => {
          // se o cenário desenha o objeto, a área clicável é onde ele está desenhado
          const bgNow = sc?.bg ?? 'cozinha';
          const r = !objectsFor(bgNow).includes(c.id) && c.w ? { x: c.x!, y: c.y!, w: c.w!, h: c.h! } : objectRect(bgNow, c.id);
          if (!r) return null;
          return (
            <button key={c.id} className={'hotspot' + (sel?.id === c.id ? ' sel' : '')} style={{ left: r.x * 4, top: r.y * 4 - SCENE_SHIFT, width: r.w * 4, height: r.h * 4 }} title={c.desc} onClick={() => pick(c.id, c.text)}>
              <span>{c.text}</span>
            </button>
          );
        })}
      <div className="dialogue">
        <div className="dlg-portrait">{pid ? <Portrait id={pid} mood={last?.mood} size={128} blend={blend} /> : <div className="portrait empty" />}</div>
        <div className="dlg-body">
          <div className="dlg-lines scroll-y">
            {shown.map((l, i) => (
              <p key={i} className={l.who === 'NARRADOR' ? 'narr' : 'say'}>
                {l.who !== 'NARRADOR' && <b>{speakerName(l.who, g.st.gender)}: </b>}
                {parseMarkup(l.text).map((sg, k) =>
                  sg.clue ? (
                    <span key={k} className={'clue' + (inspect ? ' live' : '') + (sel?.id === sg.clue ? ' sel' : '')} onClick={() => pick(sg.clue!, sg.text)}>
                      {sg.text}
                    </span>
                  ) : (
                    <span key={k}>{sg.text}</span>
                  ),
                )}
              </p>
            ))}
          </div>
          {insight && <div className={'dlg-insight ' + (insight.ok ? 'ok' : 'bad')}>{insight.text}</div>}
          <div className="dlg-actions">
            {!all && (
              <button className="px-btn small warm" autoFocus onClick={() => (setN(n + 1), audio.sfx('click'))}>
                Continuar
              </button>
            )}
            {all &&
              choices.map((c) => (
                <button key={c.idx} className={'px-btn small warm' + (c.affectionate ? ' aff' : '')} disabled={c.disabled} title={c.reason ?? c.hint ?? ''} onClick={() => (home.choose(c.idx), audio.sfx('click'), store.notify())}>
                  {c.label}
                  {c.disabled && c.reason && <small> ({c.reason})</small>}
                </button>
              ))}
            {all && choices.length === 0 && (
              <button className="px-btn small primary" autoFocus onClick={() => (home.continueScene(), audio.sfx('click'), store.notify())}>
                Seguir
              </button>
            )}
            <button className={'px-btn small ghost insp' + (inspect ? ' on' : '')} onClick={toggleInspect} title="Modo Inconsistência em casa (TAB). Usar à toa custa Laços.">
              {inspect ? 'Parar de examinar' : 'Examinar'} <span className="kbd">TAB</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
