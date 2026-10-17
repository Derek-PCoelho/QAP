// A mesa da central: fila, transcrição, perguntas, mapa, rádio, ficha e objetos da mesa.
import { useEffect, useRef, useState } from 'react';
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
import { Tutorial } from './Tutorial';
import { GuideOverlay } from '../../minigames/GuideOverlay';
import { MciPanel, MciSummary } from '../../minigames/MciPanel';
import { Toasts } from '../../ui/Toasts';
import { VagaZero } from './VagaZero';

export type Overlay = null | 'manual' | 'quadro' | 'diario';

export function Desk() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift;
  const [overlay, setOverlay] = useState<Overlay>(null);
  /** com vídeo aberto, o jogador pode espiar o mapa (chave = ligação+início do vídeo) */
  const [mapPeek, setMapPeek] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (store.paused || !sh) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!sh.sh.guideCallId && !g.scene && !sh.sh.vz) {
        if (e.key === 'm' || e.key === 'M') setOverlay((o) => (o === 'manual' ? null : 'manual'));
        if (e.key === 'q' || e.key === 'Q') setOverlay((o) => (o === 'quadro' ? null : 'quadro'));
        if (e.key === 'd' || e.key === 'D') setOverlay((o) => (o === 'diario' ? null : 'diario'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sh, g]);

  if (!sh) return null;
  const desg = g.st.vars.desgaste;
  const blend = Math.max(0, Math.min(1, (desg - 40) / 60));
  const real = g.st.difficulty === 'real';
  const active = sh.active();
  const manualBlocked = real && !!active;

  return (
    <div ref={stageRef} className={'desk' + (desg > 80 ? ' exhausted' : '')} style={{ ['--desg' as string]: String(blend) }}>
      <TopBar onPhoto={() => undefined} />
      <div className="desk-main">
        <div className="col-left">
          <Queue />
          <CallPanel />
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
            <RequestTray />
          </div>
          <RadioPanel />
        </div>
        <div className="col-right">
          <Ficha />
        </div>
      </div>
      <DeskBar overlay={overlay} setOverlay={setOverlay} manualBlocked={manualBlocked} />
      {sh.sh.cochilo && <Cochilo since={sh.sh.time - sh.sh.cochilo.at} onWake={() => {
        sh.acordar();
        store.notify();
      }} />}
      {overlay === 'manual' && !manualBlocked && <ManualBook onClose={() => setOverlay(null)} />}
      {overlay === 'quadro' && <CorkBoard onClose={() => setOverlay(null)} />}
      {overlay === 'diario' && <DiaryBook onClose={() => setOverlay(null)} />}
      <ModalStack />
      {sh.sh.guideCallId && <GuideOverlay />}
      {active && sh.defOf(active).special === 'mci' && !active.decision && active.lines.length > 0 && <MciPanel />}
      <MciSummary />
      {g.scene && <SceneOverlay />}
      {sh.sh.vz && !g.scene && <VagaZero />}
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
