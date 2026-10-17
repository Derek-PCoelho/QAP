import { useEffect, useState } from 'react';
import { store, useStore } from '../../store';
import { Portrait, speakerId, speakerName } from '../../ui/Portrait';
import { parseMarkup } from '../../../engine/text';
import { audio } from '../../audio';
import { objectRect, objectsFor } from '../../art';

/** a cena sobe 132 px enquanto o diálogo está aberto (ver .home.dlg-open em home.css) */
const SCENE_SHIFT = 132;

/** Diálogo da cena + "reparar": objetos marcados na cena; um clique mostra o que se notou. */
export function HomeDialogue() {
  const s = useStore();
  const g = s.game!;
  const home = g.home!;
  const h = g.st.home!;
  const sc = home.scene();
  const lines = home.visibleLines();
  const choices = home.choices();
  const [n, setN] = useState(1);
  const [noticed, setNoticed] = useState<{ label: string; desc: string; insight?: string } | null>(null);
  const node = h.node;
  useEffect(() => setN(1), [node, h.sceneId]);
  useEffect(() => setNoticed(null), [h.sceneId]);
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

  const marks = home.noticeables();
  const notice = (id: string, label: string) => {
    const r = home.notice(id);
    if (!r) return;
    setNoticed({ label, desc: r.desc, insight: r.insight });
    audio.sfx(r.unlocked.length ? 'insight' : 'paper');
    store.notify();
  };

  return (
    <>
      {marks.map((c) => {
        // se o cenário desenha o objeto, a área clicável é onde ele está desenhado
        const bgNow = sc?.bg ?? 'cozinha';
        const r = !objectsFor(bgNow).includes(c.id) && c.w ? { x: c.x, y: c.y, w: c.w, h: c.h } : objectRect(bgNow, c.id);
        if (!r) return null;
        return (
          <button
            key={c.id}
            className={'hotspot notice' + (c.noticed ? ' seen' : '')}
            style={{ left: r.x * 4, top: r.y * 4 - SCENE_SHIFT, width: r.w * 4, height: r.h * 4 }}
            title={c.noticed ? c.label : 'Reparar'}
            aria-label={'Reparar: ' + c.label}
            onClick={() => notice(c.id, c.label)}
          >
            <span>{c.label}</span>
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
                {parseMarkup(l.text).map((sg, k) => (
                  <span key={k}>{sg.text}</span>
                ))}
              </p>
            ))}
          </div>
          {noticed && (
            <div className={'dlg-insight ' + (noticed.insight ? 'ok' : 'note')} role="status">
              {noticed.desc}
              {noticed.insight && <em> {noticed.insight}</em>}
            </div>
          )}
          {marks.length > 0 && !noticed && marks.some((m) => !m.noticed) && <div className="dlg-hint">Tem coisas na cena que dá para reparar: clique nelas.</div>}
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
          </div>
        </div>
      </div>
    </>
  );
}
