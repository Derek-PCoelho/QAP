// Orientação por escolhas: instruções técnicas, falas de calma e um medidor de pânico.
import { useEffect, useMemo, useState } from 'react';
import type { GuideScript, GuideOption } from '../../engine/content-api';
import { useStore } from '../store';
import { resolveTokens } from '../../engine/text';
import { audio } from '../audio';
import type { GuideResult } from './GuideOverlay';

function shuffle<T>(a: T[], seed: number): T[] {
  const r = [...a];
  let s = seed;
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function DialogGuide({ script, onFinish, narrative }: { script: GuideScript; seconds: number; onFinish: (r: GuideResult) => void; real: boolean; narrative: boolean }) {
  const s = useStore();
  const g = s.game!;
  const steps = script.steps ?? [];
  const [i, setI] = useState(0);
  const [panic, setPanic] = useState(script.panic ?? 60);
  const [right, setRight] = useState(0);
  const [errors, setErrors] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [timeouts, setTimeouts] = useState(0);
  const step = steps[i];
  // tempo para ler a fala e as opções antes de quem liga se desesperar (era 10 s: mal dava para ler)
  const limit = (step?.time ?? 18) * (narrative ? 1.6 : 1);
  const [left, setLeft] = useState(limit);
  const R = (t: string) => resolveTokens(t, g.st.gender, g.st);
  const opts = useMemo(() => (step ? shuffle(step.options, i * 31 + steps.length) : []), [i, step, steps.length]);

  useEffect(() => setLeft(limit), [i, limit]);
  useEffect(() => {
    if (script.noTimeout || !step) return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 0.1) {
          setPanic((p) => p + 15);
          setTimeouts((x) => x + 1);
          setReply('"{dr}?! Tá aí? Fala comigo!"'.replace('{dr}', g.st.gender === 'M' ? 'Doutor' : 'Doutora'));
          return limit;
        }
        return l - 0.1;
      });
    }, 100);
    return () => clearInterval(t);
  }, [i, step, limit, script.noTimeout, g.st.gender]);

  useEffect(() => {
    if (panic >= 100) {
      audio.sfx('hangup');
      onFinish({ quality: 0.25, success: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panic >= 100]);

  useEffect(() => {
    if (timeouts >= 3 && step) {
      setTimeouts(0);
      setErrors((e) => e + 1);
      advance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeouts]);

  const advance = () => {
    if (i + 1 >= steps.length) {
      const q = Math.max(0, Math.min(1, (right + 1) / steps.length - errors * 0.12));
      onFinish({ quality: q, success: q >= 0.6 && panic < 100 });
    } else setI(i + 1);
  };

  const choose = (o: GuideOption) => {
    audio.sfx('click');
    if (o.switchTo) {
      const q = Math.max(0, Math.min(1, (right + 1) / Math.max(1, i + 1) - errors * 0.12));
      onFinish({ quality: q, success: true, switchTo: o.switchTo });
      return;
    }
    if (o.kind === 'certo') {
      setPanic((p) => Math.max(0, p - 8));
      setRight((r) => r + 1);
      setReply(o.reply ? R(o.reply) : null);
      advance();
    } else if (o.kind === 'calma') {
      setPanic((p) => Math.max(0, p - 22));
      setReply(o.reply ? R(o.reply) : '"...tá. Tá bom. Tô respirando."');
    } else if (o.kind === 'neutro') {
      setPanic((p) => Math.min(100, p + 5));
      setReply(o.reply ? R(o.reply) : null);
      advance();
    } else {
      setPanic((p) => Math.min(100, p + 25));
      setErrors((e) => e + 1);
      setReply(o.reply ? R(o.reply) : '"Isso não tá funcionando!"');
      audio.sfx('wrong');
    }
  };

  if (!step) return null;
  return (
    <div className="dialog-guide">
      {i === 0 && <p className="dg-intro">{R(script.intro)}</p>}
      <div className="dg-say">
        <b>{step.who ?? 'QUEM LIGA'}:</b> {R(step.say)}
      </div>
      {reply && <div className="dg-reply">{reply}</div>}
      <div className="dg-opts">
        {opts.map((o, k) => (
          <button key={k} className="px-btn dg-opt" onClick={() => choose(o)}>
            {R(o.label)}
          </button>
        ))}
      </div>
      <div className="dg-meters">
        <div className="meter">
          <span>{script.id === 'acolhimento' ? 'Angústia de quem liga' : 'Pânico de quem liga'}</span>
          <div className="bar panic">
            <i style={{ width: `${Math.min(100, panic)}%` }} />
          </div>
        </div>
        {!script.noTimeout && (
          <div className="meter small">
            <span>Tempo para responder</span>
            <div className="bar time">
              <i style={{ width: `${(left / limit) * 100}%` }} />
            </div>
          </div>
        )}
        <span className="dg-step">
          passo {i + 1} de {steps.length}
        </span>
      </div>
    </div>
  );
}
