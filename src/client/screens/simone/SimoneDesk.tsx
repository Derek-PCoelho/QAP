// Campanha da Simone: a mesa da TARM. Fila e ligação à esquerda, mapa e rádio
// no centro, pré-triagem e mesas de regulação à direita.
import { useEffect, useRef, useState } from 'react';
import { store, useStore } from '../../store';
import { Queue } from '../desk/Queue';
import { CallPanel } from '../desk/CallPanel';
import { MapPanel } from '../desk/MapPanel';
import { RadioPanel } from '../desk/RadioPanel';
import { DeskBar } from '../desk/DeskBar';
import { ManualBook } from '../desk/ManualBook';
import { CorkBoard } from '../desk/CorkBoard';
import { SceneOverlay } from '../desk/SceneOverlay';
import { ModalStack } from '../desk/ModalStack';
import { Toasts } from '../../ui/Toasts';
import { audio } from '../../audio';
import type { Overlay } from '../desk/Desk';
import { SimoneTopBar } from './SimoneTopBar';
import { TriagePanel } from './TriagePanel';
import { RegDesks } from './RegDesks';

export function SimoneDesk() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift;
  const [overlay, setOverlay] = useState<Overlay>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (store.paused || !sh) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!g.scene) {
        if (e.key === 'm' || e.key === 'M') setOverlay((o) => (o === 'manual' ? null : 'manual'));
        if (e.key === 'q' || e.key === 'Q') setOverlay((o) => (o === 'quadro' ? null : 'quadro'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sh, g]);

  if (!sh) return null;
  const stress = g.st.vars.desgaste;
  const blend = Math.max(0, Math.min(1, (stress - 40) / 60));
  return (
    <div ref={stageRef} className={'desk tarm-desk' + (stress > 80 ? ' exhausted' : '')} style={{ ['--desg' as string]: String(blend) }}>
      <SimoneTopBar />
      <div className="desk-main">
        <div className="col-left">
          <Queue />
          <CallPanel />
        </div>
        <div className="col-center">
          <div className="map-slot">
            <MapPanel />
          </div>
          <RadioPanel />
        </div>
        <div className="col-right tarm-right">
          <TriagePanel />
          <RegDesks />
        </div>
      </div>
      <DeskBar overlay={overlay} setOverlay={setOverlay} manualBlocked={false} />
      {overlay === 'manual' && <ManualBook onClose={() => setOverlay(null)} />}
      {overlay === 'quadro' && <CorkBoard onClose={() => setOverlay(null)} />}
      <ModalStack />
      {g.scene && <SceneOverlay />}
      {g.st.day === 1 && s.settings.tutorial && !g.scene && <SimoneTutorial />}
      <Toasts items={sh.sh.toasts.slice(-5)} />
      {stress > 70 && <div className="fluor-flicker" aria-hidden />}
    </div>
  );
}

/** dicas do primeiro turno da campanha da Simone */
function SimoneTutorial() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const call = sh.active();
  let tip: string | null = null;
  let pos: 'left' | 'right' = 'left';
  if (!call) {
    if (sh.queue().length) tip = 'Tocou. Quem atende primeiro é você. Clique no cartão da fila.';
    else if ((sh.sh.tarm?.passed ?? 0) === 0) tip = 'Vinte e dois anos de central. Você atende, entende o que é, dá a cor e passa para uma mesa. Quem regula é o médico.';
  } else if (call.asked.length === 0) tip = 'Duas ou três perguntas bastam: o que aconteceu, se acorda, se respira. A OS mede o seu tempo (TMA).';
  else {
    pos = 'right';
    tip = 'Escolha a cor. Vermelho com "Pega essa agora" fura a fila da mesa. Depois, para quem passar: a Mesa 1 é cuidadosa e lenta; o Henrique é rápido... de manhã.';
  }
  if (!tip) return null;
  return (
    <div className={'tutorial-postit ' + pos}>
      <b>{pos === 'left' ? '◄ Você' : 'Você ►'}</b>
      <span>{tip}</span>
    </div>
  );
}
