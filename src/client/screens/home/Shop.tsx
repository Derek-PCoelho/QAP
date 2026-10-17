import { useState } from 'react';
import { store, useStore } from '../../store';
import { audio } from '../../audio';
import { DiaryBook } from '../desk/DiaryBook';
import { resolveTokens } from '../../../engine/text';
import { OZZY_RELIEF } from '../../../engine/home';

export function Shop() {
  const s = useStore();
  const g = s.game!;
  const home = g.home!;
  const items = home.shop().filter((i) => !i.owned);
  const h = g.st.home!;
  const [diary, setDiary] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ozzy, setOzzy] = useState<string | null>(null);
  // o diário abre por cima da tela inteira: dentro do papel da loja (que é pequeno e girado)
  // ele ficava cortado pela borda da tela e sem o botão Fechar
  return (
    <>
    <div className="shop paper">
      <h2>Antes de dormir</h2>
      {items.length === 0 && <p className="led-sub">Nada mais para resolver hoje.</p>}
      <ul className="shop-list">
        {items.map((it) => {
          const bought = h.bought.includes(it.id);
          return (
            <li key={it.id}>
              <div>
                <b>{it.label}</b>
                <small>{it.descT}</small>
              </div>
              <button
                className="px-btn small warm"
                disabled={bought || g.st.money < it.priceN}
                onClick={() => {
                  const r = home.buy(it.id);
                  if (!r.ok) setErr(r.error ?? '');
                  else audio.sfx('money');
                  store.notify();
                }}
              >
                {bought ? 'Feito' : it.priceN === 0 ? 'Pegar (grátis)' : `R$ ${it.priceN}`}
              </button>
            </li>
          );
        })}
      </ul>
      {/* o Ozzy: uma brincadeira por noite, desgaste um pouco menor. Nada de ruim acontece com ele. */}
      <div className="ozzy-row">
        <div>
          <b>Brincar com o Ozzy</b>
          <small>{h.ozzy ? 'Ele já dormiu, enrolado no tapete.' : `O lulu laranja traz a bolinha. Desgaste −${OZZY_RELIEF}`}</small>
        </div>
        <button
          className="px-btn small warm"
          disabled={!!h.ozzy}
          onClick={() => {
            const r = home.playOzzy();
            if (r.ok) {
              setOzzy(resolveTokens(r.text, g.st.gender, g.st));
              audio.sfx('insight');
            }
            store.notify();
          }}
        >
          {h.ozzy ? 'Feito' : 'Brincar'}
        </button>
      </div>
      {ozzy && <p className="ozzy-msg">{ozzy}</p>}
      {err && <p className="led-err">{err}</p>}
      <div className="led-actions">
        <button className="px-btn small ghost" onClick={() => setDiary(true)}>
          Ler o diário
        </button>
        <button
          className="px-btn primary"
          onClick={() => {
            g.finishHome();
            audio.sfx('door');
            store.notify();
          }}
        >
          Dormir
        </button>
      </div>
    </div>
    {diary && <DiaryBook readOnly onClose={() => setDiary(false)} />}
    </>
  );
}
