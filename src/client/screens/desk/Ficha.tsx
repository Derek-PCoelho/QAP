import { useEffect, useState } from 'react';
import { store, useStore } from '../../store';
import type { Color, Dest, Referral, Resource, Support } from '../../../engine/types';
import { fmtTime } from '../../../engine/util';
import { addrText, resolveAddress } from '../../../engine/city/map';
import { audio } from '../../audio';
import { useDeskSel } from './deskSel';
import { resolveTokens } from '../../../engine/text';

type PickFn = (id: string, text: string, el: HTMLElement | null) => void;

const COLORS: { id: Color; label: string }[] = [
  { id: 'vermelho', label: 'Vermelho' },
  { id: 'amarelo', label: 'Amarelo' },
  { id: 'verde', label: 'Verde' },
  { id: 'azul', label: 'Azul' },
];
const RES: { id: Resource; label: string; sub: string }[] = [
  { id: 'USA', label: 'USA', sub: 'suporte avançado' },
  { id: 'USB', label: 'USB', sub: 'suporte básico' },
  { id: 'ORI', label: 'Orientação', sub: 'sem viatura' },
  { id: 'TROTE', label: 'Trote', sub: 'encerrar' },
];
const DESTS: { id: Dest; label: string }[] = [
  { id: 'REG', label: 'Regional' },
  { id: 'UPA', label: 'UPA Norte' },
  { id: 'MAT', label: 'Maternidade' },
];
const REFS: { id: Referral; label: string }[] = [
  { id: 'UBS', label: 'UBS' },
  { id: 'UPA', label: 'UPA' },
  { id: 'REG', label: 'Hospital Regional' },
  { id: 'MAT', label: 'Maternidade' },
  { id: 'CASA', label: 'Ficar em casa' },
];

export function Ficha({ onPick, sel }: { onPick: PickFn; sel?: string }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const call = sh.active();
  const unitSel = useDeskSel();
  const [color, setColor] = useState<Color | null>(null);
  const [res, setRes] = useState<Resource | null>(null);
  const [sup, setSup] = useState<Support[]>([]);
  const [dest, setDest] = useState<Dest | null>(null);
  const [ref, setRef] = useState<Referral | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [stamped, setStamped] = useState<{ word: string; key: number; summary?: string } | null>(null);
  const callId = call?.id;

  useEffect(() => {
    setColor(null);
    setRes(null);
    setSup([]);
    setDest(null);
    setRef(null);
    setErr(null);
    if (callId) setStamped(null);
    unitSel.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  if (!call) {
    return (
      <section className="ficha-wrap">
        <div className="clipboard">
          <div className="ficha paper empty">
            <div className="f-title">Ficha de Regulação Médica</div>
            <p className="f-empty">{stamped?.summary ?? 'Aguardando ligação.'}</p>
            {stamped && <div key={stamped.key} className={'stamp-mark' + (stamped.word === 'TROTE' ? ' trote' : '')}>{stamped.word}</div>}
          </div>
        </div>
      </section>
    );
  }

  const def = sh.defOf(call);
  const decided = !!call.decision;
  const inspect = sh.sh.inspect;
  const day = g.st.day;
  const needDest = day >= 9 && (res === 'USA' || res === 'USB');
  const free = res === 'USA' || res === 'USB' ? sh.availableUnits(res).map((u) => ({ u, eta: sh.etaFor(u.id, call) })).sort((a, b) => a.eta - b.eta) : [];
  const unit = unitSel.unit && free.some((f) => f.u.id === unitSel.unit) ? unitSel.unit : free[0]?.u.id;
  // trote: basta marcar Trote e carimbar (sem cor, viatura ou destino); o número vai para o quadro
  const isTrote = res === 'TROTE';
  const ready = isTrote
    ? !decided && call.status === 'ativa'
    : !!color && !!res && (!needDest || !!dest) && (res !== 'USA' && res !== 'USB' ? true : !!unit) && (res !== 'ORI' || !!ref) && !decided && call.status === 'ativa';
  const lookup = call.mapLookup ? resolveAddress(def.addr) : null;
  // a idade é dado da TARM: aparece desde o começo
  const age = sh.tarmAge(call);

  const clue = (id: string, text: string) => (
    <span
      className={'clue' + (inspect ? ' live' : '') + (sel === id ? ' sel' : '')}
      onClick={(e) => {
        if (!inspect) return;
        onPick(id, text, e.currentTarget);
      }}
    >
      {text}
    </span>
  );

  const doStamp = () => {
    if (!ready || !res) return;
    const cor: Color | null = isTrote ? color ?? 'azul' : color;
    if (!cor) return;
    const r = sh.stamp({ color: cor, resource: res, unit: res === 'USA' || res === 'USB' ? unit : undefined, support: sup, dest: needDest ? dest ?? undefined : undefined, referral: res === 'ORI' ? ref ?? undefined : undefined });
    if (!r.ok) {
      setErr(r.error ?? 'Não foi possível carimbar.');
      audio.sfx('error');
      return;
    }
    setStamped({ word: res === 'TROTE' ? 'TROTE' : 'REGULADO', key: Date.now(), summary: `${def.patient.name} — ${res === 'ORI' ? 'orientação' : res === 'TROTE' ? 'trote' : res}. Ficha arquivada.` });
    unitSel.clear();
    store.notify();
  };

  // mesma viatura do tipo errado selecionada no mapa: troca o recurso
  if (unitSel.type && (res === 'USA' || res === 'USB') && unitSel.type !== res && !decided) {
    setTimeout(() => setRes(unitSel.type!), 0);
  }

  return (
    <section className="ficha-wrap">
      <div className="clipboard">
        <div className={'ficha paper' + (decided ? ' done' : '')}>
          <div className="f-title">
            Ficha de Regulação Médica <span className="f-no">Nº {String(day).padStart(2, '0')}{String(sh.sh.order.indexOf(call.id) + 1).padStart(3, '0')}</span>
          </div>
          <div className="f-row">
            <label>Hora</label>
            <span className="hand">{fmtTime(call.arrived)}</span>
            <label>Tel.</label>
            <span className="hand">{clue('num', def.num)}</span>
          </div>
          <div className="f-row">
            <label>Solicitante</label>
            <span className="hand">{resolveTokens(def.callerName ?? def.caller, g.st.gender, g.st)}</span>
          </div>
          <div className="f-row">
            <label>Paciente</label>
            <span className="hand">
              {def.patient.name}
              {', '}
              {age.clue ? clue(age.clue, age.quoted ? `“${age.text}”` : age.text) : age.quoted ? `“${age.text}”` : age.text}
            </span>
          </div>
          <div className="f-row addr">
            <label>Endereço</label>
            <span className="hand">{clue('end', addrText(def.addr))}</span>
          </div>
          <div className="f-row look">
            <button
              className="px-btn small ghost ink"
              disabled={!!call.mapLookup || decided}
              onClick={() => {
                sh.lookup();
                audio.sfx('page');
                store.notify();
              }}
            >
              {call.mapLookup ? 'Endereço conferido' : 'Conferir no mapa (2′)'}
            </button>
            {lookup && <span className={'look-res ' + (lookup.kind === 'ok' || lookup.kind === 'marco' ? 'ok' : 'bad')}>{lookup.message}</span>}
          </div>

          {!isTrote && (
          <fieldset className="f-group">
            <legend>Classificação</legend>
            <div className="opts colors">
              {COLORS.map((c) => (
                <button key={c.id} className={`opt col-${c.id}` + (color === c.id ? ' on' : '')} disabled={decided} onClick={() => setColor(c.id)}>
                  <i />
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>
          )}

          <fieldset className="f-group">
            <legend>Recurso</legend>
            <div className="opts res">
              {RES.map((r) => (
                <button
                  key={r.id}
                  className={'opt' + (res === r.id ? ' on' : '')}
                  disabled={decided}
                  onClick={() => {
                    setRes(r.id);
                    if (r.id === 'USA' || r.id === 'USB') unitSel.set({ unit: undefined, type: r.id });
                  }}
                >
                  <b>{r.label}</b>
                  <small>{r.sub}</small>
                </button>
              ))}
            </div>
          </fieldset>

          {(res === 'USA' || res === 'USB') && (
            <fieldset className="f-group">
              <legend>Viatura</legend>
              {free.length === 0 ? (
                <p className="f-warn">Nenhuma {res} disponível agora.</p>
              ) : (
                <div className="opts units">
                  {free.slice(0, 4).map(({ u, eta }) => (
                    <button key={u.id} className={'opt' + (unit === u.id ? ' on' : '')} disabled={decided} onClick={() => unitSel.set({ unit: u.id, type: u.type })}>
                      <b>{u.label}</b>
                      <small>~{Math.round(eta)} min</small>
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {res !== 'TROTE' && res !== null && (
            <fieldset className="f-group">
              <legend>Apoio</legend>
              <div className="opts sup">
                {(['PM', 'BOMB'] as Support[]).map((x) => (
                  <button key={x} className={'opt' + (sup.includes(x) ? ' on' : '')} disabled={decided} onClick={() => setSup((v) => (v.includes(x) ? v.filter((y) => y !== x) : [...v, x]))}>
                    {x === 'PM' ? 'Polícia (190)' : 'Bombeiros (193)'}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {needDest && (
            <fieldset className="f-group">
              <legend>Destino</legend>
              <div className="opts dest">
                {DESTS.map((d) => (
                  <button key={d.id} className={'opt' + (dest === d.id ? ' on' : '')} disabled={decided} onClick={() => setDest(d.id)}>
                    {d.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {res === 'ORI' && (
            <fieldset className="f-group">
              <legend>Encaminhar para{!ref && <em className="f-need"> · escolha um</em>}</legend>
              <div className="opts refs">
                {REFS.map((r) => (
                  <button key={r.id} className={'opt' + (ref === r.id ? ' on' : '')} disabled={decided} onClick={() => setRef(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {err && <p className="f-err">{err}</p>}
          <div className="stamp-area">
            <button className={'stamp-btn' + (ready ? ' ready' : '')} disabled={!ready} onClick={doStamp} title={ready ? 'Carimbar a ficha' : res === 'ORI' && !ref ? 'Escolha para onde encaminhar' : 'Preencha cor, recurso, viatura e destino'}>
              <span>{res === 'TROTE' ? 'Carimbar TROTE · número ao quadro' : 'Carimbar REGULADO'}</span>
            </button>
          </div>
          {stamped && (
            <div key={stamped.key} className={'stamp-mark' + (stamped.word === 'TROTE' ? ' trote' : '')}>
              {stamped.word}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
