import { store, useStore } from '../store';
import type { Settings } from '../settings';
import { native } from '../native';

function Slider({ k, label }: { k: keyof Settings; label: string }) {
  const s = useStore();
  const v = s.settings[k] as number;
  return (
    <label className="slider">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={v} onChange={(e) => store.updateSettings({ [k]: Number(e.target.value) } as Partial<Settings>)} />
      <b>{Math.round(v * 100)}</b>
    </label>
  );
}

export function Options() {
  const s = useStore();
  const st = s.settings;
  return (
    <div className="menu-screen options">
      <h1>Opções</h1>
      <section className="opt-grid">
        <Slider k="master" label="Volume geral" />
        <Slider k="music" label="Música" />
        <Slider k="sfx" label="Efeitos" />
        <Slider k="ambient" label="Ambiente das ligações" />
        <Slider k="voice" label="Vozes" />
        <label className="slider">
          <span>Ritmo do plantão</span>
          <select value={String(st.ritmo || 1)} onChange={(e) => store.updateSettings({ ritmo: Number(e.target.value) })}>
            <option value="1">Normal (1 s = 1 min)</option>
            <option value="0.75">Calmo (75%)</option>
            <option value="0.5">Bem calmo (50%)</option>
          </select>
          <b>{Math.round((st.ritmo || 1) * 100)}%</b>
        </label>
        <label className="slider">
          <span>Velocidade do texto</span>
          <input type="range" min={20} max={140} step={5} value={st.textSpeed} onChange={(e) => store.updateSettings({ textSpeed: Number(e.target.value) })} />
          <b>{st.textSpeed}</b>
        </label>
      </section>
      <section className="opt-checks">
        <label className="check">
          <input type="checkbox" checked={st.tremble} onChange={(e) => store.updateSettings({ tremble: e.target.checked })} />
          Texto tremendo quando o cansaço está alto
        </label>
        <label className="check">
          <input type="checkbox" checked={st.tutorial} onChange={(e) => store.updateSettings({ tutorial: e.target.checked })} />
          Dicas da Simone no primeiro plantão
        </label>
        <label className="check">
          <input type="checkbox" checked={st.scale === 'pixel'} onChange={(e) => store.updateSettings({ scale: e.target.checked ? 'pixel' : 'fit' })} />
          Escala de pixels inteira (mais nítido, pode sobrar borda)
        </label>
        {native() && (
          <label className="check">
            <input
              type="checkbox"
              checked={st.fullscreen}
              onChange={(e) => {
                store.updateSettings({ fullscreen: e.target.checked });
                native()?.setFullscreen(e.target.checked);
              }}
            />
            Tela cheia (F11 alterna)
          </label>
        )}
        <label className="text">
          <span>Seu nome no ranking</span>
          <input maxLength={24} value={st.playerName} placeholder="Regulador" onChange={(e) => store.updateSettings({ playerName: e.target.value })} />
        </label>
      </section>
      {native() && (
        <p className="note">
          Saves e opções ficam em: {native()!.savesDir()}{' '}
          <button className="px-btn small ghost" onClick={() => native()?.openSavesDir()}>
            Abrir pasta
          </button>
        </p>
      )}
      <div className="row-end">
        <button className="px-btn ghost" onClick={() => store.setScreen(s.game ? 'jogo' : 'titulo')}>
          Voltar
        </button>
      </div>
    </div>
  );
}
