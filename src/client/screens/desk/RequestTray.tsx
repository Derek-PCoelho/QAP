// Pedidos pelo rádio que esperam resposta (viatura retida, PM, UPA, hospital...).
// Ficam num cartão fixo sobre o mapa até serem respondidos, e não no meio da conversa do
// rádio, que rola e some com eles.
import { store, useStore } from '../../store';
import { audio } from '../../audio';

export function RequestTray() {
  const s = useStore();
  const sh = s.game?.shift;
  if (!sh) return null;
  const S = sh.sh;
  if (S.tarm || S.requests.length === 0) return null;
  return (
    <div className="req-tray" role="region" aria-label="Pedidos aguardando resposta">
      {S.requests.map((r) => {
        const left = Math.max(0, Math.ceil(r.expires - S.time));
        return (
          <div key={r.id} className={'req' + (left <= 3 ? ' urgent' : '')}>
            <div className="req-head">
              <span>Pedido aguardando resposta</span>
              <span className="req-timer">{left} min</span>
            </div>
            <div className="req-text">
              <b>{r.from}</b> {r.text}
            </div>
            <div className="req-opts">
              {r.options.map((o) => (
                <button
                  key={o.id}
                  className="px-btn small"
                  onClick={() => {
                    sh.answerRequest(r.id, o.id);
                    audio.sfx('radio_off');
                    store.notify();
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
