// Campanha da Simone: a mesa da TARM. Fila e ligação à esquerda, mapa e rádio
// no centro, pré-triagem e mesas de regulação à direita.
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { InspectDrawer } from '../desk/InspectDrawer';
import { RedThread } from '../desk/RedThread';
import { Toasts } from '../../ui/Toasts';
import { audio } from '../../audio';
import type { Overlay, InspectSel } from '../desk/Desk';
import { SimoneTopBar } from './SimoneTopBar';
import { TriagePanel } from './TriagePanel';
import { RegDesks } from './RegDesks';

export function SimoneDesk() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift;
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [sel, setSel] = useState<InspectSel | null>(null);
  const [thread, setThread] = useState<{ a: HTMLElement | null; b: HTMLElement | null; ok: boolean; key: number } | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inspect = !!sh?.sh.inspect;

  const toggleInspect = useCallback(() => {
    if (!sh) return;
    sh.toggleInspect();
    setSel(null);
    audio.sfx(sh.sh.inspect ? 'paper' : 'click');
    store.notify();
  }, [sh]);

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
        if (!g.scene) toggleInspect();
      } else if (!g.scene) {
        if (e.key === 'm' || e.key === 'M') setOverlay((o) => (o === 'manual' ? null : 'manual'));
        if (e.key === 'q' || e.key === 'Q') setOverlay((o) => (o === 'quadro' ? null : 'quadro'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sh, g, toggleInspect]);

  useEffect(() => {
    if (!insight) return;
    const t = setTimeout(() => setInsight(null), 6500);
    return () => clearTimeout(t);
  }, [insight]);

  if (!sh) return null;
  const stress = g.st.vars.desgaste;
  const blend = Math.max(0, Math.min(1, (stress - 40) / 60));
  return (
    <div ref={stageRef} className={'desk tarm-desk' + (inspect ? ' inspecting' : '') + (stress > 80 ? ' exhausted' : '')} style={{ ['--desg' as string]: String(blend) }}>
      <SimoneTopBar />
      <div className="desk-main">
        <div className="col-left">
          <Queue />
          <CallPanel onPick={pick} sel={sel?.id} />
        </div>
        <div className="col-center">
          <div className="map-slot">
            <MapPanel />
            {inspect && <InspectDrawer onPick={pick} sel={sel?.id} />}
          </div>
          <RadioPanel />
        </div>
        <div className="col-right tarm-right">
          <TriagePanel />
          <RegDesks />
        </div>
      </div>
      <DeskBar overlay={overlay} setOverlay={setOverlay} inspect={inspect} toggleInspect={toggleInspect} manualBlocked={false} />
      {inspect && <div className="inspect-hint">Modo Inconsistência · clique em duas pistas que se contradizem (ou se confirmam). <span className="kbd">TAB</span> sai.</div>}
      {insight && (
        <div className="insight-banner" role="status">
          <b>Inconsistência</b>
          <span>{insight}</span>
        </div>
      )}
      {thread && <RedThread key={thread.key} a={thread.a} b={thread.b} ok={thread.ok} container={stageRef.current} onDone={() => setThread(null)} />}
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
