// A noite na casa da Simone: cena curta e as contas.
import { useEffect, useMemo, useState } from 'react';
import { store, useStore } from '../../store';
import { ArtCanvas } from '../../ui/ArtCanvas';
import { drawScene } from '../../art';
import { Portrait, speakerId } from '../../ui/Portrait';
import { parseMarkup } from '../../../engine/text';
import type { SceneBg } from '../../../engine/types';
import { audio } from '../../audio';

const NAME: Record<string, string> = { SIMONE: 'Simone', WESLEY: 'Wesley', NARRADOR: '' };

export function SimoneNight() {
  const s = useStore();
  const g = s.game!;
  const st = g.st;
  const step = st.flags['noite_passo'];
  const sc = g.sceneKind === 'night' ? g.scene : undefined;
  const bg: SceneBg = (sc?.sc.bg as SceneBg | undefined) ?? 'sala';
  const blend = Math.max(0, Math.min(1, (st.vars.desgaste - 35) / 65));
  return (
    <div className="home simone-night">
      <ArtCanvas w={320} h={180} scale={4} animate fps={8} draw={(ctx, t) => drawScene(ctx, { bg, blend, objects: [], cast: [], time: t })} className="home-art" />
      <header className="home-top">
        <div className="fam">
          <div className="fam-m">
            <Portrait id={'SIMONE' as never} size={64} mood={st.vars.pressao >= 8 ? 'cansado' : 'neutro'} />
            <div>
              <b>Simone</b>
              <span>Pressão {st.vars.pressao}/10</span>
            </div>
          </div>
          <div className="fam-m">
            <Portrait id={'WESLEY' as never} size={64} />
            <div>
              <b>Wesley</b>
              <span>{st.vars.wesley >= 7 ? 'Perto' : st.vars.wesley >= 4 ? 'Na dele' : 'Longe'}</span>
            </div>
          </div>
        </div>
        <div className="home-money">
          <span>Saldo</span>
          <b className={st.money < 0 ? 'neg' : ''}>R$ {st.money}</b>
        </div>
        <div className="home-day">
          Noite do dia {st.day}
          <small>Emprego {st.vars.emprego}/10</small>
        </div>
      </header>
      {sc && step !== 'contas' && <NightDialogue />}
      {step === 'contas' && <NightBills />}
    </div>
  );
}

function NightDialogue() {
  const s = useStore();
  const g = s.game!;
  const sc = g.scene!;
  const lines = sc.lines();
  const choices = sc.choices();
  const [n, setN] = useState(1);
  const node = sc.node;
  useEffect(() => setN(1), [node]);
  const shown = lines.slice(0, n);
  const all = n >= lines.length;
  const last = shown[shown.length - 1];
  const pid = last ? speakerId(last.who, g.st.gender) : null;
  useEffect(() => {
    if (last && last.who !== 'NARRADOR') {
      const plain = parseMarkup(last.text).map((x) => x.text).join('');
      audio.voice(plain, (last.who === 'SIMONE' ? 'simone' : last.who === 'WESLEY' ? 'jovem_h' : 'homem') as never);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, node]);
  return (
    <div className="dialogue">
      <div className="dlg-portrait">{pid ? <Portrait id={pid} mood={last?.mood} size={128} /> : <div className="portrait empty" />}</div>
      <div className="dlg-body">
        <div className="dlg-lines scroll-y">
          {shown.map((l, i) => (
            <p key={i} className={l.who === 'NARRADOR' ? 'narr' : 'say'}>
              {l.who !== 'NARRADOR' && <b>{NAME[l.who] ?? l.who}: </b>}
              {parseMarkup(l.text).map((sg, k) => (
                <span key={k}>{sg.text}</span>
              ))}
            </p>
          ))}
        </div>
        <div className="dlg-actions">
          {!all && (
            <button className="px-btn small warm" autoFocus onClick={() => (setN(n + 1), audio.sfx('click'))}>
              Continuar
            </button>
          )}
          {all &&
            choices.map((c) => (
              <button key={c.idx} className="px-btn small warm" disabled={c.disabled} onClick={() => (g.sceneChoose(c.idx), audio.sfx('click'), store.notify())}>
                {c.label}
              </button>
            ))}
          {all && choices.length === 0 && (
            <button className="px-btn small primary" autoFocus onClick={() => (g.sceneContinue(), audio.sfx('click'), store.notify())}>
              Seguir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NightBills() {
  const s = useStore();
  const g = s.game!;
  const bills = useMemo(() => g.nightBills(), [g, g.st.day]);
  const autoTotal = bills.filter((b) => b.auto).reduce((a, b) => a + b.amount, 0);
  const [chosen, setChosen] = useState<string[]>(() => {
    let left = g.st.money - autoTotal;
    const out: string[] = [];
    for (const b of bills) {
      if (b.auto) continue;
      if (b.amount <= left) {
        out.push(b.id);
        left -= b.amount;
      }
    }
    return out;
  });
  const total = bills.filter((b) => chosen.includes(b.id) && !b.auto).reduce((a, b) => a + b.amount, 0);
  const after = g.st.money - autoTotal - total;
  return (
    <div className="ledger paper">
      <h2>Contas da noite</h2>
      <div className="led-calc" aria-live="polite">
        <div>
          <span>Saldo agora</span>
          <b>R$ {g.st.money}</b>
        </div>
        <div className="minus">
          <span>Contas marcadas</span>
          <b>− R$ {autoTotal + total}</b>
        </div>
        <div className={'res' + (after < 0 ? ' neg' : '')}>
          <span>Fica</span>
          <b key={after} className="pop">
            R$ {after}
          </b>
        </div>
      </div>
      <ul className="led-list">
        {bills.length === 0 && <li>Nada para pagar hoje.</li>}
        {bills.map((b) => (
          <li key={b.id} className={b.auto ? 'auto' : ''}>
            <label>
              <input
                type="checkbox"
                disabled={b.auto}
                checked={b.auto || chosen.includes(b.id)}
                onChange={() => {
                  setChosen((c) => (c.includes(b.id) ? c.filter((x) => x !== b.id) : [...c, b.id]));
                  audio.sfx('pen');
                }}
              />
              <span className="lbl">{b.label}</span>
              <span className="amt">R$ {b.amount}</span>
            </label>
            {b.desc && <small>{b.desc}</small>}
          </li>
        ))}
      </ul>
      <div className="led-actions">
        <button
          className="px-btn primary"
          onClick={() => {
            g.finishNight(chosen);
            audio.sfx('door');
            store.notify();
          }}
        >
          Pagar e dormir
        </button>
      </div>
    </div>
  );
}
