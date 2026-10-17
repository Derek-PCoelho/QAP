// Orientação ativa por telefone: escolhe o minijogo pelo roteiro e devolve a qualidade ao motor.
import { useEffect, useMemo, useRef, useState } from 'react';
import { store, useStore } from '../store';
import { CONTENT } from '../../content/index';
import { Rcp } from './Rcp';
import { DialogGuide } from './DialogGuide';
import { Breathing } from './Breathing';
import { resolveTokens } from '../../engine/text';
import type { GuideScript } from '../../engine/content-api';
import type { GameState } from '../../engine/types';

/** roteiros podem ter {dr}, {m:o|a} etc. */
function resolveScript(s: GuideScript, st: GameState): GuideScript {
  const R = (x: string) => resolveTokens(x, st.gender, st);
  return {
    ...s,
    intro: R(s.intro),
    card: s.card ? R(s.card) : s.card,
    success: R(s.success),
    fail: R(s.fail),
    steps: s.steps?.map((stp) => ({ ...stp, say: R(stp.say), who: stp.who ? R(stp.who) : stp.who, options: stp.options.map((o) => ({ ...o, label: R(o.label), reply: o.reply ? R(o.reply) : o.reply })) })),
  };
}

export interface GuideResult {
  quality: number;
  success: boolean;
  switchTo?: string;
}

export function GuideOverlay() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const callId = sh.sh.guideCallId!;
  const call = sh.sh.calls[callId];
  const baseId = call?.guide?.id ?? 'rcp';
  const [scriptId, setScriptId] = useState(baseId);
  const [done, setDone] = useState<{ text: string; ok: boolean } | null>(null);
  const partial = useRef<number[]>([]);
  const rawScript = CONTENT.guides[scriptId] ?? CONTENT.guides['rcp'];
  const script = useMemo(() => resolveScript(rawScript, g.st), [rawScript, g.st]);
  const realSec = (sh.sh.flags['guideReal'] as number) || 30;
  const def = call ? sh.defOf(call) : undefined;
  const unit = call?.units.length ? sh.sh.units[call.units[0]] : undefined;
  const eta = unit && unit.status === 'DESLOC' ? Math.max(0, Math.ceil(unit.t1 - sh.sh.time)) : null;

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      store.notify();
    }, 50);
    return () => clearTimeout(t);
  }, [done]);

  const finish = (r: GuideResult) => {
    if (r.switchTo && CONTENT.guides[r.switchTo]) {
      partial.current.push(r.quality);
      setScriptId(r.switchTo);
      return;
    }
    const all = [...partial.current, r.quality];
    const q = all.reduce((a, b) => a + b, 0) / all.length;
    const ok = r.success && q >= 0.5;
    setDone({ text: ok ? script.success : script.fail, ok });
    setTimeout(() => {
      sh.finishGuide(q, ok);
      if (scriptId === 'parto' && ok) g.eff().achievement('maos_firmes');
      store.notify();
    }, 1800);
  };

  if (!call) return null;
  const Comp = script.kind === 'rcp' ? Rcp : script.kind === 'respiracao' ? Breathing : DialogGuide;
  return (
    <div className="guide-veil">
      <div className={'guide-box bezel k-' + script.kind}>
        <header className="guide-head">
          <div>
            <h2>{script.title}</h2>
            <span className="guide-who">{def ? resolveTokens(def.callerName ?? def.caller, g.st.gender, g.st) : ''}</span>
          </div>
          <div className="guide-eta">{eta !== null ? `${unit!.label} chega em ~${eta} min` : unit ? `${unit.label} no local` : 'sem viatura: só a sua voz'}</div>
        </header>
        {script.card && <div className="guide-card">{script.card}</div>}
        {done ? (
          <div className={'guide-done ' + (done.ok ? 'ok' : 'bad')}>{resolveTokens(done.text, g.st.gender, g.st)}</div>
        ) : (
          <Comp key={scriptId} script={script} seconds={scriptId === baseId ? realSec : Math.max(18, realSec * 0.6)} onFinish={finish} real={g.st.difficulty === 'real'} narrative={g.st.difficulty === 'narrativo'} />
        )}
      </div>
    </div>
  );
}
