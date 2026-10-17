import { useState } from 'react';
import { store, useStore } from '../../store';
import { audio } from '../../audio';

/**
 * Contas da folga. A conta ao lado funciona como calculadora: marcar ou desmarcar qualquer conta
 * muda na hora o "fica". Marcar mais do que o saldo cobre é permitido (para fazer a conta); só o
 * pagamento é que pede para desmarcar até caber.
 */
export function Bills() {
  const s = useStore();
  const g = s.game!;
  const home = g.home!;
  const bills = home.bills();
  const autos = bills.filter((b) => b.auto);
  const autoTotal = autos.reduce((a, b) => a + b.amount, 0);
  // já vem marcado o que cabe no saldo, na ordem da lista; desmarcar é uma decisão consciente
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
  const [err, setErr] = useState<string | null>(null);
  const picked = bills.filter((b) => !b.auto && chosen.includes(b.id));
  const total = autoTotal + picked.reduce((a, b) => a + b.amount, 0);
  const after = g.st.money - total;
  // as automáticas (transporte) saem de qualquer jeito, mesmo deixando o saldo negativo (o motor
  // aceita): "faltar" só conta para o que o jogador marcou. Antes, com o saldo abaixo das
  // automáticas, o botão ficava desabilitado para sempre e a noite travava nas contas.
  const pickedTotal = total - autoTotal;
  const short = Math.max(0, pickedTotal - Math.max(0, g.st.money - autoTotal));
  const unpaid = bills.filter((b) => !b.auto && !chosen.includes(b.id));

  const toggle = (id: string) => {
    setErr(null);
    setChosen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    audio.sfx('pen');
  };
  const pay = () => {
    if (short > 0) {
      setErr(`Faltam R$ ${short}. Desmarque alguma conta para caber no saldo.`);
      audio.sfx('error');
      return;
    }
    const r = home.payBills(chosen);
    if (!r.ok) setErr(r.error ?? 'Erro');
    else audio.sfx('money');
    store.notify();
  };

  return (
    <div className="ledger paper">
      <h2>Contas desta folga</h2>
      <div className="led-calc" aria-live="polite">
        <div>
          <span>Saldo agora</span>
          <b>R$ {g.st.money}</b>
        </div>
        <div className="minus">
          <span>Contas marcadas</span>
          <b>− R$ {total}</b>
        </div>
        <div className={'res' + (after < 0 ? ' neg' : '')}>
          <span>Fica</span>
          <b key={after} className="pop">
            R$ {after}
          </b>
        </div>
      </div>
      {short > 0 && <p className="led-err">Faltam R$ {short} para pagar tudo o que está marcado.</p>}
      {short === 0 && after < 0 && <p className="led-err">O saldo não cobre nem as contas automáticas: elas saem mesmo assim e o saldo fica negativo.</p>}
      <ul className="led-list">
        {bills.map((b) => {
          const on = b.auto || chosen.includes(b.id);
          return (
            <li key={b.id} className={'k-' + b.kind + (b.auto ? ' auto' : '') + (on ? ' on' : ' off')}>
              <label>
                <input type="checkbox" disabled={b.auto} checked={on} onChange={() => toggle(b.id)} />
                <span className="lbl">
                  {b.label}
                  {b.auto && <em> (automática)</em>}
                </span>
                <span className="amt">R$ {b.amount}</span>
              </label>
              {b.desc && <small>{b.desc}</small>}
            </li>
          );
        })}
      </ul>
      {unpaid.length > 0 && short === 0 && <p className="led-note">Fica sem pagar: {unpaid.map((b) => b.label).join(', ')}.</p>}
      {err && <p className="led-err">{err}</p>}
      <div className="led-actions">
        <button className="px-btn warm" disabled={short > 0} onClick={pay}>
          Pagar o que está marcado (R$ {total})
        </button>
      </div>
    </div>
  );
}
