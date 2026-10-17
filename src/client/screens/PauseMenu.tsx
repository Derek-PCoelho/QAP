import { store } from '../store';

export function PauseMenu() {
  const g = store.game;
  return (
    <div className="pause-overlay" role="dialog" aria-label="Pausa">
      <div className="pause-box bezel">
        <h2>Pausa</h2>
        <p>O relógio da central está parado.</p>
        <button className="px-btn primary" onClick={() => store.pause(false)}>
          Voltar ao jogo
        </button>
        {g?.st.mode === 'campanha' && g.st.phase !== 'plantao' && (
          <button className="px-btn" onClick={() => (store.saveTo('1'), store.toast('Salvo no espaço 1.', 'bom'))}>
            Salvar no espaço 1
          </button>
        )}
        <button className="px-btn ghost" onClick={() => (store.pause(false), store.setScreen('opcoes'))}>
          Opções
        </button>
        <button className="px-btn danger" onClick={() => store.quitToTitle()}>
          Sair para o título
        </button>
        {g?.st.phase === 'plantao' && <small>Sair durante o plantão faz você recomeçar este dia pela manhã.</small>}
      </div>
    </div>
  );
}
