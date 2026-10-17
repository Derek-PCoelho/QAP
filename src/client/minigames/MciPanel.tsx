// Dia 15: múltiplas vítimas — triagem START em cartões e alocação de viaturas.
import { useState } from 'react';
import { store, useStore } from '../store';
import type { Color } from '../../engine/types';
import { audio } from '../audio';

type Tri = Color | 'preto';

/** resumo do evento (sobrevive ao fechamento da ligação) */
export const mciState: { summary: string[] | null } = { summary: null };

export function MciSummary() {
  useStore();
  const summary = mciState.summary;
  if (!summary) return null;
  return (
    <div className="mci-veil">
      <div className="mci-box bezel small">
        <h2>Relatório do evento</h2>
        <ul className="mci-sum">
          {summary.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <button
          className="px-btn primary"
          onClick={() => {
            mciState.summary = null;
            store.notify();
          }}
        >
          Voltar à fila
        </button>
      </div>
    </div>
  );
}
const TRI: { id: Tri; label: string }[] = [
  { id: 'vermelho', label: 'Vermelho' },
  { id: 'amarelo', label: 'Amarelo' },
  { id: 'verde', label: 'Verde' },
];

export function MciPanel() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const call = sh.active()!;
  const def = sh.defOf(call);
  const mci = def.mci!;
  const [triage, setTriage] = useState<Record<string, Tri>>({});
  const [alloc, setAlloc] = useState<Record<string, string>>({});
  const [reinf, setReinf] = useState(false);
  const usa = sh.availableUnits('USA');
  const usb = sh.availableUnits('USB');
  const used = new Set(Object.values(alloc));
  const allTriaged = mci.victims.every((v) => triage[v.id]);

  const submit = () => {
    // só valem as viaturas das vítimas que continuam vermelhas/amarelas (trocar a cor não deixa despacho escondido)
    const live = Object.fromEntries(Object.entries(alloc).filter(([id]) => triage[id] === 'vermelho' || triage[id] === 'amarelo'));
    const r = sh.mciSubmit(triage, live, reinf);
    audio.sfx('stamp');
    mciState.summary = r.summary;
    store.notify();
  };

  return (
    <div className="mci-veil">
      <div className="mci-box bezel">
        <header className="mci-head">
          <h2>Múltiplas vítimas · Parque de Exposições</h2>
          <span>Classifique cada vítima pelo START e aloque as viaturas. O relógio não para.</span>
        </header>
        <div className="mci-cards scroll-y">
          {mci.victims.map((v) => {
            const t = triage[v.id];
            return (
              <div key={v.id} className={'mci-card' + (t ? ` t-${t}` : '')}>
                <b>
                  {v.name}, {v.age}
                </b>
                <p>{v.desc}</p>
                <ul className="start">
                  <li>{v.anda ? 'Anda' : 'Não anda'}</li>
                  <li>{v.respira ? `Respira${v.fr ? ` (${v.fr}/min)` : ''}` : 'Não respira'}</li>
                  {v.enchimento !== undefined && <li>Enchimento {v.enchimento}s</li>}
                  {v.obedece !== undefined && <li>{v.obedece ? 'Obedece comandos' : 'Não obedece'}</li>}
                </ul>
                <div className="tri-btns">
                  {TRI.map((x) => (
                    <button
                      key={x.id}
                      className={`tri col-${x.id}` + (t === x.id ? ' on' : '')}
                      onClick={() => {
                        setTriage((m) => ({ ...m, [v.id]: x.id }));
                        // a viatura escolhida para a cor anterior volta a ficar livre na lista
                        if (t !== x.id)
                          setAlloc((m) => {
                            const n = { ...m };
                            delete n[v.id];
                            return n;
                          });
                      }}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
                {t === 'vermelho' && (
                  <select value={alloc[v.id] ?? ''} onChange={(e) => setAlloc((m) => ({ ...m, [v.id]: e.target.value }))}>
                    <option value="">— viatura —</option>
                    {usa.map((u) => (
                      <option key={u.id} value={u.id} disabled={used.has(u.id) && alloc[v.id] !== u.id}>
                        {u.label}
                      </option>
                    ))}
                    {usb.map((u) => (
                      <option key={u.id} value={u.id} disabled={used.has(u.id) && alloc[v.id] !== u.id}>
                        {u.label} (básica)
                      </option>
                    ))}
                    <option value="reforco">Reforço regional</option>
                  </select>
                )}
                {t === 'amarelo' && (
                  <select value={alloc[v.id] ?? ''} onChange={(e) => setAlloc((m) => ({ ...m, [v.id]: e.target.value }))}>
                    <option value="">— viatura —</option>
                    {usb.map((u) => (
                      <option key={u.id} value={u.id} disabled={used.has(u.id) && alloc[v.id] !== u.id}>
                        {u.label}
                      </option>
                    ))}
                    {usa.map((u) => (
                      <option key={u.id} value={u.id} disabled={used.has(u.id) && alloc[v.id] !== u.id}>
                        {u.label} (avançada)
                      </option>
                    ))}
                    <option value="reforco">Reforço regional</option>
                    <option value="upa">UPA por meios próprios</option>
                  </select>
                )}
                {t === 'verde' && <span className="mci-own">UPA por meios próprios</span>}
              </div>
            );
          })}
        </div>
        <footer className="mci-foot">
          <label className="check">
            <input type="checkbox" checked={reinf} onChange={(e) => setReinf(e.target.checked)} />
            Pedir reforço regional ({mci.reinforcementUnits} viaturas, ~{mci.reinforcementMin} min)
          </label>
          <span className="mci-free">
            Livres agora: {usa.length} USA · {usb.length} USB
          </span>
          <button className="px-btn primary" disabled={!allTriaged} onClick={submit}>
            Confirmar triagem e despachar
          </button>
        </footer>
      </div>
    </div>
  );
}
