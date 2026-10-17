import { useStore } from '../../store';
import { Portrait, speakerId, speakerName } from '../../ui/Portrait';
import { audio } from '../../audio';
import { useEffect, useState } from 'react';

/** Cenas transitórias da central (passagem de turno, fim de turno). */
export function SceneOverlay() {
  const s = useStore();
  const g = s.game!;
  const sc = g.scene!;
  const lines = sc.lines();
  const choices = sc.choices();
  const [n, setN] = useState(1);
  const node = sc.node;
  useEffect(() => setN(1), [node]);
  const shown = lines.slice(0, n);
  const allShown = n >= lines.length;
  const last = shown[shown.length - 1];
  const pid = last ? speakerId(last.who, g.st.gender) : null;
  return (
    <div className="scene-overlay">
      <div className="scene-box bezel">
        <div className="scene-portrait">{pid ? <Portrait id={pid} mood={last?.mood} size={128} /> : <div className="portrait empty" />}</div>
        <div className="scene-lines">
          {shown.map((l, i) => (
            <p key={i} className={l.who === 'NARRADOR' ? 'narr' : ''}>
              {l.who !== 'NARRADOR' && <b>{speakerName(l.who, g.st.gender)}: </b>}
              {l.text}
            </p>
          ))}
          <div className="scene-actions">
            {!allShown && (
              <button className="px-btn small" autoFocus onClick={() => (setN(n + 1), audio.sfx('click'))}>
                Continuar
              </button>
            )}
            {allShown && choices.length > 0 && choices.map((c) => (
              <button key={c.idx} className="px-btn small warm" disabled={c.disabled} onClick={() => (g.sceneChoose(c.idx), audio.sfx('click'))}>
                {c.label}
              </button>
            ))}
            {allShown && choices.length === 0 && (
              <button className="px-btn small primary" autoFocus onClick={() => (g.sceneContinue(), audio.sfx('click'))}>
                Seguir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
