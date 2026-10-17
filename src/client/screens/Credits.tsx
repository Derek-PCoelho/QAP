import { store } from '../store';
import { CONTENT } from '../../content/index';

export function Credits() {
  return (
    <div className="menu-screen credits">
      <div className="credits-roll scroll-y">
        {CONTENT.endings.credits.map((l, i) => (l ? <p key={i}>{l}</p> : <br key={i} />))}
        <p className="small">Design: documento original do jogo · Arte em pixel, áudio sintetizado e código gerados para este projeto.</p>
      </div>
      <div className="row-end">
        {/* vindo do final, a partida terminada ainda está anexada: solta antes de voltar ao título,
            senão o "Voltar" de Opções/Carregar no título cai de novo na tela do final */}
        <button className="px-btn ghost" onClick={() => (store.game ? store.quitToTitle() : store.setScreen('titulo'))}>
          Voltar
        </button>
      </div>
    </div>
  );
}
