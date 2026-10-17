import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { store, useStore } from './store';
import { audio } from './audio';
import { Stage } from './ui/Stage';
import { Toasts } from './ui/Toasts';
import { Title } from './screens/Title';
import { NewGame } from './screens/NewGame';
import { LoadGame } from './screens/LoadGame';
import { Options } from './screens/Options';
import { Achievements } from './screens/Achievements';
import { Credits } from './screens/Credits';
import { HowToPlay } from './screens/HowToPlay';
import { Ranking } from './screens/Ranking';
import { Newspaper } from './screens/Newspaper';
import { Desk } from './screens/desk/Desk';
import { Report } from './screens/Report';
import { Home } from './screens/home/Home';
import { Ending } from './screens/Ending';
import { GameOver } from './screens/GameOver';
import { PauseMenu } from './screens/PauseMenu';
import { SimoneNew } from './screens/simone/SimoneNew';
import { SimoneDesk } from './screens/simone/SimoneDesk';
import { SimoneNight } from './screens/simone/SimoneNight';
import { isNative } from './native';

export function App() {
  const s = useStore();
  useEffect(() => {
    store.init();
    const unlock = () => {
      audio.unlock();
      if (store.screen === 'titulo') audio.playTheme('titulo');
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    // programa de desktop: sem a trava de autoplay do navegador, a música do título já começa
    if (isNative()) unlock();
    const onKey = (e: KeyboardEvent) => {
      // Esc digitando (post-it, nome): só sai do campo, não pausa
      const el = e.target as HTMLElement | null;
      if (e.key === 'Escape' && el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        el.blur();
        return;
      }
      if (e.key === 'Escape' && store.screen === 'jogo' && store.game) {
        const ph = store.game.st.phase;
        if (ph === 'plantao' || ph === 'casa' || ph === 'jornal' || ph === 'relatorio') store.pause(!store.paused);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  let body: JSX.Element;
  switch (s.screen) {
    case 'titulo':
      body = <Title />;
      break;
    case 'novo':
      body = <NewGame />;
      break;
    case 'carregar':
      body = <LoadGame />;
      break;
    case 'opcoes':
      body = <Options />;
      break;
    case 'conquistas':
      body = <Achievements />;
      break;
    case 'creditos':
      body = <Credits />;
      break;
    case 'ranking':
      body = <Ranking />;
      break;
    case 'simone_novo':
      body = <SimoneNew />;
      break;
    case 'como_jogar':
      body = <HowToPlay />;
      break;
    default:
      body = <GameScreen />;
  }
  return (
    <Stage pixel={s.settings.scale === 'pixel'}>
      <ScreenGuard key={s.screen + ':' + (s.game?.st.phase ?? '')}>{body}</ScreenGuard>
      {s.paused && s.screen === 'jogo' && <PauseMenu />}
      <Toasts items={s.toasts} />
    </Stage>
  );
}

/**
 * Se uma tela quebrar (ex.: um save corrompido que passou pela conferência), mostra um aviso com
 * saída para o título em vez de deixar a janela em branco. O erro vai para o console (no programa
 * de desktop, para o erros.log). Voltar ao título não grava: o último save bom continua valendo.
 */
class ScreenGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[tela] erro:', error.stack || error.message, info.componentStack?.split('\n').slice(0, 6).join(' | ') ?? '');
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="screen-error" role="alert">
        <h2>Algo deu errado nesta tela.</h2>
        <p>O erro foi registrado. O último save continua guardado.</p>
        <button className="px-btn primary" onClick={() => store.recoverToTitle()}>
          Voltar ao título
        </button>
      </div>
    );
  }
}

function GameScreen() {
  const s = useStore();
  const g = s.game;
  if (!g) return <Title />;
  switch (g.st.phase) {
    case 'jornal':
      return <Newspaper key={'j' + g.st.day + (g.st.infinite?.shifts ?? 0)} />;
    case 'plantao':
      return g.st.mode === 'simone' ? <SimoneDesk key={'s' + g.st.day} /> : <Desk key={'p' + g.st.day + (g.st.infinite?.shifts ?? 0)} />;
    case 'relatorio':
      return <Report />;
    case 'casa':
      return g.st.mode === 'simone' ? <SimoneNight key={'n' + g.st.day} /> : <Home key={'c' + g.st.day} />;
    case 'final':
      return <Ending />;
    case 'gameover':
      return <GameOver />;
  }
}
