import { store, useStore } from '../store';
import { ArtCanvas } from '../ui/ArtCanvas';
import { drawEnding } from '../art';
import { todaySeed } from '../infinite';
import { native } from '../native';

export function Title() {
  const s = useStore();
  const hasAuto = s.saves().some((x) => x.slot === 'auto');
  const hasSimone = s.saves().some((x) => x.slot === 'simone_auto');
  return (
    <div className="title-screen">
      <ArtCanvas w={320} h={180} scale={4} animate fps={8} draw={(ctx, t) => drawEnding(ctx, 'titulo', { time: t, gender: 'M', blend: 0 })} className="title-art" />
      <div className="title-shade" />
      <div className="title-logo">
        <div className="logo-main">QAP</div>
        <div className="logo-sub">emergency dispatch</div>
        <div className="logo-tag">Cada segundo é uma escolha. Cada escolha tem um nome.</div>
      </div>
      <nav className="title-menu">
        {hasAuto && (
          <button className="px-btn primary" onClick={() => store.continueGame('auto')}>
            Continuar campanha
          </button>
        )}
        <button className="px-btn" onClick={() => store.setScreen('novo')}>
          Nova campanha
        </button>
        <button className="px-btn" onClick={() => store.newInfinite(todaySeed())}>
          Plantão Infinito
        </button>
        {s.simoneUnlocked() ? (
          hasSimone ? (
            <>
              <button className="px-btn warm" onClick={() => store.continueGame('simone_auto')}>
                Continuar: Simone
              </button>
              <button className="px-btn ghost" onClick={() => store.setScreen('simone_novo')}>
                Nova campanha da Simone
              </button>
            </>
          ) : (
            <button className="px-btn warm" onClick={() => store.setScreen('simone_novo')}>
              Campanha da Simone
            </button>
          )
        ) : (
          <button
            className="px-btn ghost locked"
            aria-disabled="true"
            onClick={() => store.toast('A Campanha da Simone abre quando você termina a primeira campanha.', 'info')}
          >
            Campanha da Simone 🔒
          </button>
        )}
        <button className="px-btn ghost" onClick={() => store.setScreen('como_jogar')}>
          Como jogar
        </button>
        <button className="px-btn ghost" onClick={() => store.setScreen('carregar')}>
          Carregar
        </button>
        <button className="px-btn ghost" onClick={() => store.setScreen('ranking')}>
          Ranking
        </button>
        <button className="px-btn ghost" onClick={() => store.setScreen('conquistas')}>
          Conquistas
        </button>
        <button className="px-btn ghost" onClick={() => store.setScreen('opcoes')}>
          Opções
        </button>
        <button className="px-btn ghost" onClick={() => store.setScreen('creditos')}>
          Créditos
        </button>
        {native() && (
          <button className="px-btn ghost" onClick={() => native()?.quit()}>
            Sair
          </button>
        )}
        {!s.simoneUnlocked() && <p className="title-hint">🔒 A Campanha da Simone (os mesmos 20 dias, do lado da TARM) abre quando você termina a primeira campanha.</p>}
      </nav>
      <div className="title-foot">
        <span>Central de Regulação · Santa Aurora</span>
        <span className={s.serverOk ? 'srv ok' : 'srv'}>
          {native() ? `v${native()!.version}${native()!.testBuild ? ' · versão de teste' : ''} · saves neste computador` : s.serverOk ? 'servidor local conectado: saves e ranking online' : 'modo offline: saves neste navegador'}
        </span>
      </div>
    </div>
  );
}
