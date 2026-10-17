import { useRef, useState } from 'react';
import { store, useStore } from '../../store';
import { ArtCanvas } from '../../ui/ArtCanvas';
import { drawCityMap, tileFromPixel } from '../../art';
import { resolveAddress, bairroAt, STREETS, landmarkPos, LANDMARKS } from '../../../engine/city/map';
import { addressTarget } from '../../../engine/city/path';
import { useDeskSel } from './deskSel';

const STATUS_PT: Record<string, string> = {
  QRV: 'livre na base',
  DESLOC: 'a caminho',
  LOCAL: 'no local',
  TRANSP: 'transportando',
  RETIDO: 'retida no hospital',
  RETORNO: 'voltando (disponível)',
  PANE: 'em pane',
  FORA: 'fora de serviço',
};

export function MapPanel() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const sel = useDeskSel();
  const tile = 8;
  const W = 64 * tile;
  const H = 40 * tile;
  const hoverRef = useRef(hover);
  hoverRef.current = hover;

  const call = sh.active();
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    const S = sh.sh;
    const units = Object.values(S.units).map((u) => {
      const p = sh.unitPos(u);
      return { id: u.id, type: u.type, x: p[0], y: p[1], status: u.status, label: u.label, selected: sel.unit === u.id };
    });
    const routes: { path: [number, number][]; color: string; dashed?: boolean }[] = [];
    for (const u of Object.values(S.units)) {
      if (!u.path.length || !(u.status === 'DESLOC' || u.status === 'TRANSP' || u.status === 'RETORNO')) continue;
      const f = Math.max(0, Math.min(1, (S.time - u.t0) / Math.max(0.01, u.t1 - u.t0)));
      const idx = Math.floor(f * (u.path.length - 1));
      routes.push({ path: u.path.slice(idx), color: u.status === 'DESLOC' ? '#e8a33d' : u.status === 'TRANSP' ? '#5aa7d6' : '#8fa89a', dashed: u.status === 'RETORNO' });
    }
    const markers: { x: number; y: number; kind: 'chamada' | 'invalido' | 'casa' | 'alvo'; label?: string }[] = [];
    const casa = landmarkPos('casa');
    markers.push({ x: casa[0], y: casa[1], kind: 'casa', label: 'SUA CASA' });
    for (const id of S.order) {
      const c = S.calls[id];
      if (!c || !c.units.length || c.status === 'noturno') continue;
      if (c.outcome !== 'pendente' && c.outcome !== 'transportado') continue;
      const d = sh.defOf(c);
      const tp = addressTarget(d.addr);
      markers.push({ x: tp[0], y: tp[1], kind: 'alvo' });
    }
    // a ligação aberta aparece no mapa como a Simone conferiu (1.1: conferir endereço é tarefa da TARM)
    if (call) {
      const d = sh.defOf(call);
      const r = resolveAddress(d.addr);
      const tp = r.pos ?? addressTarget(d.addr);
      markers.push({ x: tp[0], y: tp[1], kind: call.addrNote === 'nao_confere' ? 'invalido' : 'chamada', label: d.addr.rua });
    }
    drawCityMap(ctx, {
      tile,
      t,
      flood: S.flood,
      showLabels: true,
      units,
      routes,
      markers,
      hoverTile: hoverRef.current ? [hoverRef.current.x, hoverRef.current.y] : undefined,
      highlightStreet: call ? sh.defOf(call).addr.rua : undefined,
    });
  };

  let tip: JSX.Element | null = null;
  if (hover) {
    const S = sh.sh;
    const u = Object.values(S.units).find((x) => {
      const p = sh.unitPos(x);
      return Math.abs(p[0] - hover.x) < 1.2 && Math.abs(p[1] - hover.y) < 1.2;
    });
    if (u) {
      const eta = call && (u.status === 'QRV' || u.status === 'RETORNO') ? Math.round(sh.etaFor(u.id, call)) : null;
      tip = (
        <div className="map-tip">
          <b>{u.label}</b> · {STATUS_PT[u.status] ?? u.status}
          <br />
          <small>{u.crew}</small>
          {u.note && (
            <>
              <br />
              <small>{u.note}</small>
            </>
          )}
          {eta !== null && (
            <>
              <br />
              Chega ao chamado em ~{eta} min
            </>
          )}
        </div>
      );
    } else {
      const b = bairroAt(Math.round(hover.x), Math.round(hover.y));
      const st = STREETS.find((x) => (x.axis === 'h' ? Math.round(hover.y) === x.at && hover.x >= x.from - 0.5 && hover.x <= x.to + 0.5 : Math.round(hover.x) === x.at && hover.y >= x.from - 0.5 && hover.y <= x.to + 0.5));
      const lm = LANDMARKS.find((l) => {
        const p = landmarkPos(l.id);
        return Math.abs(p[0] - hover.x) < 1 && Math.abs(p[1] - hover.y) < 1;
      });
      tip = (
        <div className="map-tip">
          {lm ? <b>{lm.name}</b> : st ? <b>{st.name}</b> : null}
          {(lm || st) && <br />}
          {b.name}
        </div>
      );
    }
  }

  return (
    <section className="map-panel bezel">
      <div className="map-head">
        <span>Santa Aurora</span>
        {sh.sh.flood && <span className="tag blue">ruas alagadas</span>}
        {sh.sh.noVacancy && <span className="tag red">Regional sem vaga</span>}
        <span className="legend">
          <i className="lg qrv" /> livre <i className="lg desl" /> a caminho <i className="lg local" /> no local <i className="lg ret" /> retida
        </span>
      </div>
      <div className="map-screen screen">
        <ArtCanvas
          w={W}
          h={H}
          scale={1}
          animate
          fps={12}
          draw={draw}
          onMove={(x, y) => {
            const [tx, ty] = tileFromPixel(x, y, tile);
            setHover({ x: tx, y: ty });
          }}
          onClick={(x, y) => {
            const [tx, ty] = tileFromPixel(x, y, tile);
            const u = Object.values(sh.sh.units).find((v) => {
              const p = sh.unitPos(v);
              return Math.abs(p[0] - tx) < 1.4 && Math.abs(p[1] - ty) < 1.4;
            });
            if (u && (u.status === 'QRV' || u.status === 'RETORNO')) {
              sel.set({ unit: u.id, type: u.type });
              store.notify();
            }
          }}
          className="map-canvas"
        />
        {tip && <div className="map-tip-wrap">{tip}</div>}
      </div>
    </section>
  );
}
