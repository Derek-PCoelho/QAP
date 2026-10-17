// Videochamada de averiguação (Programa VER): ocupa o lugar do mapa enquanto
// estiver aberta. A imagem é desenhada pelo jogo (não usa câmera de verdade).
import { useEffect, useRef, useState } from 'react';
import { store, useStore } from '../../store';
import { ArtCanvas } from '../../ui/ArtCanvas';
import { drawVideoFeed, VIDEO_W, VIDEO_H } from '../../art/video';
import { parseMarkup } from '../../../engine/text';
import { audio } from '../../audio';

const SIGNAL_BARS: Record<string, number> = { bom: 3, fraco: 2, ruim: 1 };
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export function VideoPanel({ onShowMap }: { onShowMap: () => void }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const call = sh.active();
  const view = sh.videoView(call);
  const v = view.video;
  const t0 = useRef(performance.now());
  const [connecting, setConnecting] = useState<number | undefined>(undefined);

  // animação curta de conexão (só visual; o tempo de jogo já foi cobrado)
  useEffect(() => {
    if (!v || v.state !== 'ativo') return;
    t0.current = performance.now();
    setConnecting(0);
    let raf = 0;
    const f = () => {
      const k = (performance.now() - t0.current) / 1100;
      if (k >= 1) {
        setConnecting(undefined);
        audio.sfx('radio_on');
        return;
      }
      setConnecting(k);
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v?.at, call?.id]);

  if (!call || !v) return null;
  const busy = !!sh.sh.guideCallId || call.status !== 'ativa' || !!call.decision || v.state !== 'ativo';
  const last = [...call.lines].reverse().find((l) => l.kind === 'video');
  const caption = last ? parseMarkup(last.text).map((x) => x.text).join('') : '';
  const elapsed = Math.max(0, Math.round(sh.sh.time - v.at));
  const look = (id: string) => {
    sh.videoLook(id);
    audio.sfx('click');
    store.notify();
  };
  return (
    <section className="map-panel video-panel bezel">
      <div className="map-head">
        <span className="vp-title">📹 VER · videoatendimento</span>
        <span className={'vp-rec' + (v.state === 'ativo' ? ' on' : '')}>● REC</span>
        <span className="vp-signal" title={`Sinal ${v.signal}`}>
          {[1, 2, 3].map((i) => (
            <i key={i} className={i <= SIGNAL_BARS[v.signal] ? 'on' : ''} style={{ height: 3 + i * 3 }} />
          ))}
        </span>
        <span className="vp-time">{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</span>
        <button className="px-btn tiny ghost" onClick={onShowMap} title="Ver o mapa sem encerrar o vídeo">
          Mapa
        </button>
      </div>
      <div className="vp-body">
        <div className="vp-screen screen">
          <ArtCanvas
            w={VIDEO_W}
            h={VIDEO_H}
            scale={2}
            animate
            fps={10}
            className="vp-canvas"
            draw={(ctx, t) =>
              drawVideoFeed(ctx, { scene: v.scene, focus: v.focus, signal: v.signal, t, seed: call.id, connecting: connecting })
            }
          />
          {connecting !== undefined && <div className="vp-connecting">Conectando… aguardando a câmera de quem ligou</div>}
          {connecting === undefined && caption && <div className="vp-caption">{caption}</div>}
          {v.signal !== 'bom' && connecting === undefined && <div className="vp-weak">sinal {v.signal}</div>}
        </div>
        <div className="vp-side">
          <div className="vp-label">Peça para mostrar</div>
          {view.spots.map((sp) => (
            <button key={sp.id} className={'vp-spot' + (sp.seen ? ' seen' : '')} disabled={busy || connecting !== undefined} onClick={() => look(sp.id)}>
              <span>{cap(sp.label.replace(/^Mostrar /, ''))}</span>
              <span className="kp-cost">{sp.seen ? '✓' : `${sp.cost}′`}</span>
            </button>
          ))}
          <button
            className="vp-spot wide"
            disabled={busy || v.focus === 'geral'}
            onClick={() => {
              sh.videoWide();
              store.notify();
            }}
          >
            <span>Plano geral</span>
            <span className="kp-cost">0′</span>
          </button>
          <div className="vp-foot">
            <span>
              Franquia: {view.credits}/{view.credits + view.used}
            </span>
            <button
              className="px-btn small warm"
              disabled={busy}
              onClick={() => {
                sh.endVideo();
                audio.sfx('radio_off');
                store.notify();
              }}
            >
              Encerrar vídeo
            </button>
          </div>
          <div className="vp-note">O vídeo não mede pressão, glicemia, pulso nem temperatura.</div>
        </div>
      </div>
    </section>
  );
}
