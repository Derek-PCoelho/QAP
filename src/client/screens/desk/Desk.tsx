// A mesa da central: fila, transcrição, perguntas, mapa, rádio, ficha e objetos da mesa.
import { useCallback, useEffect, useRef, useState } from 'react';
import { store, useStore } from '../../store';
import { TopBar } from './TopBar';
import { Queue } from './Queue';
import { CallPanel } from './CallPanel';
import { MapPanel } from './MapPanel';
import { VideoPanel } from './VideoPanel';
import { RadioPanel } from './RadioPanel';
import { Ficha } from './Ficha';
import { DeskBar } from './DeskBar';
import { ManualBook } from './ManualBook';
import { CorkBoard } from './CorkBoard';
import { DiaryBook } from './DiaryBook';
import { RequestTray } from './RequestTray';
import { SceneOverlay } from './SceneOverlay';
import { ModalStack } from './ModalStack';
import { InspectDrawer } from './InspectDrawer';
import { RedThread } from './RedThread';
import { Tutorial } from './Tutorial';
import { GuideOverlay } from '../../minigames/GuideOverlay';
import { MciPanel, MciSummary } from '../../minigames/MciPanel';
import { Toasts } from '../../ui/Toasts';
import { audio } from '../../audio';

export type Overlay = null | 'manual' | 'quadro' | 'diario';

export interface InspectSel {
  id: string;
  text: string;
  el: HTMLElement | null;
}

export function Desk() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift;
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [sel, setSel] = useState<InspectSel | null>(null);
  const [thread, setThread] = useState<{ a: HTMLElement | null; b: HTMLElement | null; ok: boolean; key: number } | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  /** com vídeo aberto, o jogador pode espiar o mapa (chave = ligação+início do vídeo) */
  const [mapPeek, setMapPeek] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const inspect = !!sh?.sh.inspect;
  const toggleInspect = useCallback(() => {
    if (!sh) return;
    sh.toggleInspect();
    setSel(null);
    audio.sfx(sh.sh.inspect ? 'paper' : 'click');
    store.notify();
  }, [sh]);

  // seleção de pistas para ligar
  const pick = useCallback(
    (id: string, text: string, el: HTMLElement | null) => {
      if (!sh || !sh.sh.inspect) return;
      if (!sel) {
        setSel({ id, text, el });
        audio.sfx('pen');
        return;
      }
      if (sel.id === id) {
        setSel(null);
        return;
      }
      const r = sh.link(sel.id, id);
      setThread({ a: sel.el, b: el, ok: r.ok, key: Date.now() });
      if (r.ok && r.insight && !r.already) setInsight(r.insight);
      if (!r.ok) setInsight(null);
      setSel(null);
      store.notify();
    },
    [sh, sel],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (store.paused || !sh) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!sh.sh.guideCallId && !g.scene) toggleInspect();
      } else if (!sh.sh.guideCallId && !g.scene) {
        if (e.key === 'm' || e.key === 'M') setOverlay((o) => (o === 'manual' ? null : 'manual'));
        if (e.key === 'q' || e.key === 'Q') setOverlay((o) => (o === 'quadro' ? null : 'quadro'));
        if (e.key === 'd' || e.key === 'D') setOverlay((o) => (o === 'diario' ? null : 'diario'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sh, g, toggleInspect]);

  // insight some depois de um tempo
  useEffect(() => {
    if (!insight) return;
    const t = setTimeout(() => setInsight(null), 6500);
    return () => clearTimeout(t);
  }, [insight]);

  if (!sh) return null;
  const desg = g.st.vars.desgaste;
  const blend = Math.max(0, Math.min(1, (desg - 40) / 60));
  const real = g.st.difficulty === 'real';
  const active = sh.active();
  const manualBlocked = real && !!active;

  return (
    <div ref={stageRef} className={'desk' + (inspect ? ' inspecting' : '') + (desg > 80 ? ' exhausted' : '')} style={{ ['--desg' as string]: String(blend) }}>
      <TopBar onPhoto={() => undefined} />
      <div className="desk-main">
        <div className="col-left">
          <Queue />
          <CallPanel onPick={pick} sel={sel?.id} />
        </div>
        <div className="col-center">
          <div className="map-slot">
            {active?.video?.state === 'ativo' && mapPeek !== `${active.id}@${active.video.at}` ? (
              <VideoPanel onShowMap={() => setMapPeek(`${active.id}@${active.video!.at}`)} />
            ) : (
              <MapPanel />
            )}
            {active?.video?.state === 'ativo' && mapPeek === `${active.id}@${active.video.at}` && (
              <button className="px-btn tiny video back-to-video" onClick={() => setMapPeek(null)}>
                📹 Voltar ao vídeo
              </button>
            )}
            {inspect && <InspectDrawer onPick={pick} sel={sel?.id} />}
            <RequestTray />
          </div>
          <RadioPanel />
        </div>
        <div className="col-right">
          <Ficha onPick={pick} sel={sel?.id} />
        </div>
      </div>
      <DeskBar overlay={overlay} setOverlay={setOverlay} inspect={inspect} toggleInspect={toggleInspect} manualBlocked={manualBlocked} />
      {sh.sh.cochilo && <Cochilo since={sh.sh.time - sh.sh.cochilo.at} onWake={() => {
        sh.acordar();
        store.notify();
      }} />}
      {inspect && <div className="inspect-hint">Modo Inconsistência · clique em duas pistas que se contradizem (ou se confirmam). O tempo corre mais devagar. <span className="kbd">TAB</span> sai.</div>}
      {insight && (
        <div className="insight-banner" role="status">
          <b>Inconsistência</b>
          <span>{insight}</span>
        </div>
      )}
      {thread && <RedThread key={thread.key} a={thread.a} b={thread.b} ok={thread.ok} container={stageRef.current} onDone={() => setThread(null)} />}
      {overlay === 'manual' && !manualBlocked && <ManualBook onClose={() => setOverlay(null)} />}
      {overlay === 'quadro' && <CorkBoard onClose={() => setOverlay(null)} />}
      {overlay === 'diario' && <DiaryBook onClose={() => setOverlay(null)} />}
      <ModalStack />
      {sh.sh.guideCallId && <GuideOverlay />}
      {active && sh.defOf(active).special === 'mci' && !active.decision && active.lines.length > 0 && <MciPanel />}
      <MciSummary />
      {g.scene && <SceneOverlay />}
      {g.st.day === 1 && s.settings.tutorial && g.st.mode === 'campanha' && !g.scene && <Tutorial />}
      <Toasts items={sh.sh.toasts.slice(-5)} />
      {desg > 60 && <div className="fluor-flicker" aria-hidden />}
    </div>
  );
}

/** noite em claro: as pálpebras fecham devagar; um clique (ou qualquer tecla) acorda */
function Cochilo({ since, onWake }: { since: number; onWake: () => void }) {
  const k = Math.max(0, Math.min(1, since / 6));
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // pausado, Esc (pausa) e texto sendo digitado seguem o caminho normal
      if (store.paused || e.key === 'Escape') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // a tecla só acorda: não abre manual, quadro etc. ao mesmo tempo
      e.preventDefault();
      e.stopPropagation();
      onWake();
    };
    window.addEventListener('keydown', h, { capture: true });
    return () => window.removeEventListener('keydown', h, { capture: true });
  }, [onWake]);
  return (
    <div
      className="cochilo"
      style={{ ['--a1' as string]: String(0.15 + k * 0.5), ['--a2' as string]: String(0.5 + k * 0.45), ['--lid' as string]: Math.round(k * 46) + '%' }}
      onClick={() => !store.paused && onWake()}
    >
      <span>{k < 0.5 ? 'As pálpebras pesam… (clique ou aperte qualquer tecla)' : 'Acorda! (clique)'}</span>
    </div>
  );
}
