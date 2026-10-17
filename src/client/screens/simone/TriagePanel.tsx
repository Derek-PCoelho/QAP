// Pré-triagem da TARM: cor, prioridade e para qual mesa passar.
import { useEffect, useState } from 'react';
import { store, useStore } from '../../store';
import type { BoxId, Color, RegId } from '../../../engine/types';
import { fmtTime } from '../../../engine/util';
import { addrText } from '../../../engine/city/map';
import { REG_LABEL } from '../../../engine/shift';
import { audio } from '../../audio';
import { protagonistName, resolveTokens } from '../../../engine/text';

/** 1.1: a cor do post-it que a Mesa 1 vê (a caixa de perguntas do chamado) */
const BOXES_TARM: { id: BoxId; label: string; hint: string }[] = [
  { id: 'clinico', label: 'Clínico', hint: 'post-it azul' },
  { id: 'go', label: 'GO', hint: 'post-it rosa' },
  { id: 'trauma', label: 'Trauma', hint: 'post-it verde' },
  { id: 'outros', label: 'Não sei', hint: 'post-it branco (não deu pra classificar, ou é folgado)' },
];

const COLORS: { id: Color; label: string; hint: string }[] = [
  { id: 'vermelho', label: 'Vermelho', hint: 'risco de morte agora' },
  { id: 'amarelo', label: 'Amarelo', hint: 'urgente, sem risco imediato' },
  { id: 'verde', label: 'Verde', hint: 'leve' },
  { id: 'azul', label: 'Azul', hint: 'não urgente / suspeita de trote' },
];

export function TriagePanel() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const call = sh.active();
  const T = sh.sh.tarm!;
  const [color, setColor] = useState<Color | null>(null);
  const [box, setBox] = useState<BoxId | null>(null);
  const [prio, setPrio] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<{ key: number; text: string } | null>(null);
  const callId = call?.id;
  useEffect(() => {
    setColor(null);
    setBox(null);
    setPrio(false);
    setErr(null);
  }, [callId]);

  const pass = (to: RegId) => {
    if (!call || !color) return;
    const def = sh.defOf(call);
    const r = sh.tarmPass(color, prio, to, box ?? undefined);
    if (!r.ok) {
      setErr(r.error ?? 'Não deu para passar.');
      audio.sfx('error');
      return;
    }
    audio.sfx('paper');
    setLast({ key: Date.now(), text: `${def.patient.name}: ${color}${prio ? ' · pega essa agora' : ''} → ${to === 'moura' ? 'Mesa 1' : 'Henrique'}` });
    store.notify();
  };

  if (!call) {
    return (
      <section className="triage paper">
        <div className="f-title">Pré-triagem · TARM</div>
        <p className="f-empty">{last ? last.text : 'Aguardando ligação.'}</p>
        {last && (
          <div key={last.key} className="postit-fly">
            passado
          </div>
        )}
      </section>
    );
  }
  const def = sh.defOf(call);
  const active = call.status === 'ativa';
  const handle = Math.max(0, Math.round(sh.sh.time - (call.answered ?? sh.sh.time)));
  const goal = g.dayDef() ? (g.c.simone?.days[g.st.day]?.tmaGoal ?? 45) : 45;
  const regBtn = (id: RegId) => {
    const R = T.regs[id];
    const load = R.queue.length + (R.current ? 1 : 0);
    return (
      <button key={id} className={'px-btn reg-pass ' + (id === 'moura' ? 'primary' : 'warm')} disabled={!color || !active || !!R.away} onClick={() => pass(id)} title={R.away ? 'Fora da mesa hoje' : `${load} na mesa`}>
        <span>Passar para {id === 'moura' ? 'a Mesa 1' : 'o Henrique'}</span>
        <small>{R.away ? 'fora hoje' : load === 0 ? 'livre' : `${load} na frente`}</small>
      </button>
    );
  };
  return (
    <section className="triage paper">
      <div className="f-title">
        Pré-triagem · TARM <span className={'tma' + (handle > goal ? ' bad' : '')}>{handle} min</span>
      </div>
      <div className="f-row">
        <label>Hora</label>
        <span className="hand">{fmtTime(call.arrived)}</span>
        <label>Tel.</label>
        <span className="hand">{def.num}</span>
      </div>
      <div className="f-row">
        <label>Quem liga</label>
        <span className="hand">{resolveTokens(def.callerName ?? def.caller, g.st.gender, g.st)}</span>
      </div>
      <div className="f-row addr">
        <label>Endereço</label>
        <span className="hand">{addrText(def.addr)}</span>
      </div>
      {/* 1.1: conferir o endereço é tarefa da TARM (o regulador vê o que ela anotou) */}
      <div className="f-row addr-check">
        {call.unlocked.includes('end_conferido') ? (
          <span className={'hand' + (call.addrNote === 'nao_confere' ? ' bad' : '')}>{call.noteAddr ?? 'Endereço confere no cadastro.'}</span>
        ) : (
          <button
            className="px-btn tiny ghost"
            disabled={!active}
            onClick={() => {
              sh.tarmCheckAddr();
              audio.sfx('page');
              store.notify();
            }}
            title="Procura o endereço no cadastro da cidade (2 min do TMA)"
          >
            Conferir no cadastro (2′)
          </button>
        )}
      </div>
      <fieldset className="f-group">
        <legend>Cor da pré-triagem</legend>
        <div className="opts colors tri-colors">
          {COLORS.map((c) => (
            <button key={c.id} className={`opt col-${c.id}` + (color === c.id ? ' on' : '')} disabled={!active} onClick={() => (setColor(c.id), audio.sfx('pen'))} title={c.hint}>
              <i />
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="f-group">
        <legend>Cor do post-it (caixa)</legend>
        <div className="opts tri-boxes">
          {BOXES_TARM.map((b) => (
            <button key={b.id} className={`opt kp-box box-${b.id}` + (box === b.id ? ' on' : '')} disabled={!active} onClick={() => (setBox(box === b.id ? null : b.id), audio.sfx('pen'))} title={b.hint}>
              {b.label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className={'prio' + (prio ? ' on' : '')}>
        <input type="checkbox" checked={prio} disabled={!active} onChange={(e) => setPrio(e.target.checked)} />
        <span className="postit red">Pega essa agora.</span>
        <small>fura a fila da mesa</small>
      </label>
      {err && <p className="f-err">{err}</p>}
      <div className="reg-pass-row">
        {regBtn('moura')}
        {regBtn('henrique')}
      </div>
      <p className="tri-foot">{REG_LABEL.moura}: {protagonistName(g.st.gender, g.st)} · {REG_LABEL.henrique}: Dr. Henrique Lacerda</p>
    </section>
  );
}
