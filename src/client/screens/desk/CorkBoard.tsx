import { useRef, useState, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from 'react';
import { store, useStore } from '../../store';
import { txt, resolveTokens } from '../../../engine/text';
import { makeCtx } from '../../../engine/state';
import { autoSlot, corkAddPostit, corkAddSticker, corkMove, corkOf, corkRemove, corkTilt, CORK_COLORS, CORK_TEXT_MAX } from '../../../engine/cork';
import type { CorkColor } from '../../../engine/types';
import { ozzySticker, OZZY_STICKERS, OZZY_STICKER_LABELS, type OzzyStickerKind } from '../../art';
import { audio } from '../../audio';

const COLOR_LABEL: Record<CorkColor, string> = { amarelo: 'Amarelo', azul: 'Azul (Clínico)', rosa: 'Rosa (GO)', verde: 'Verde (Trauma)', branco: 'Branco' };

/** um papel no quadro, do jeito que a tela desenha */
interface Card {
  /** chave de posição: `b:ID` ficha da central, `d:ID` documento, ou o id do papel/adesivo do jogador */
  key: string;
  x: number;
  y: number;
  kind: 'ficha' | 'doc' | 'postit' | 'adesivo';
  mine: boolean;
}

interface Drag {
  key: string;
  dx: number;
  dy: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  moved: boolean;
  w: number;
  h: number;
}

/**
 * Quadro de cortiça (1.1): números de trote, frequentadores, documentos e os papéis do jogador.
 * Tudo pode ser arrastado; os post-its e adesivos do jogador podem sair (× ou arrastar até a
 * lixeira); a cor do post-it novo é escolhida antes de colar; os adesivos do Ozzy saem da cartela
 * (clique num adesivo e depois no lugar do quadro). O estado vai no save (engine/cork.ts).
 */
export function CorkBoard({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const g = s.game!;
  const st = g.st;
  const cork = corkOf(st);
  const [text, setText] = useState('');
  const [color, setColor] = useState<CorkColor>('amarelo');
  const [armed, setArmed] = useState<OzzyStickerKind | null>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [overTrash, setOverTrash] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const trash = useRef<HTMLDivElement>(null);

  // documentos que chegaram à mesa (antes só apareciam na gaveta do Modo Inconsistência)
  const docs = st.docs.map((id) => g.c.docs[id]).filter((d) => d && (!d.until || st.day <= d.until));
  const openDoc = (id: string) => {
    setDoc(doc === id ? null : id);
    audio.sfx('paper');
    if (g.shift?.readDoc(id)) store.notify();
  };
  const docText = (id: string) => {
    const d = g.c.docs[id];
    return d ? resolveTokens(txt(d.text, makeCtx(st)), st.gender, st) : '';
  };

  // posições: fichas e documentos em grade (ou onde o jogador pôs); papéis do jogador onde estão
  const cards: Card[] = [];
  let k = 0;
  for (const b of st.board) {
    const key = 'b:' + b.id;
    const [x, y] = cork.pos[key] ?? autoSlot(k);
    cards.push({ key, x, y, kind: 'ficha', mine: false });
    k++;
  }
  for (const d of docs) {
    const key = 'd:' + d!.id;
    const [x, y] = cork.pos[key] ?? autoSlot(k);
    cards.push({ key, x, y, kind: 'doc', mine: false });
    k++;
  }
  for (const it of cork.items) cards.push({ key: it.id, x: it.x, y: it.y, kind: it.kind, mine: true });
  const empty = cards.length === 0;

  const frac = (cx: number, cy: number): [number, number] => {
    const r = area.current!.getBoundingClientRect();
    return [(cx - r.left) / r.width, (cy - r.top) / r.height];
  };

  const addNote = () => {
    const t = text.trim();
    if (!t) return;
    if (corkAddPostit(st, t, color)) {
      setText('');
      audio.sfx('paper');
      g.bump();
    } else store.toast('O quadro está cheio de post-its. Tire alguns antes.');
  };

  const remove = (id: string) => {
    if (corkRemove(st, id)) {
      audio.sfx('paper');
      g.bump();
    }
  };

  // ---- arrastar
  const onDown = (e: RPointerEvent<HTMLElement>, c: Card) => {
    if (e.button !== 0 || !area.current) return;
    if ((e.target as HTMLElement).closest('.cork-x')) return;
    const el = e.currentTarget;
    const [fx, fy] = frac(e.clientX, e.clientY);
    const W = area.current.offsetWidth || 1;
    const H = area.current.offsetHeight || 1;
    el.setPointerCapture?.(e.pointerId);
    setArmed(null);
    setDrag({ key: c.key, dx: fx - c.x, dy: fy - c.y, x: c.x, y: c.y, sx: e.clientX, sy: e.clientY, moved: false, w: el.offsetWidth / W, h: el.offsetHeight / H });
  };
  const onMove = (e: RPointerEvent<HTMLElement>) => {
    if (!drag) return;
    const [fx, fy] = frac(e.clientX, e.clientY);
    const moved = drag.moved || Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 5;
    const x = Math.min(Math.max(0, fx - drag.dx), Math.max(0, 1 - drag.w));
    const y = Math.min(Math.max(0, fy - drag.dy), Math.max(0, 1 - drag.h));
    setDrag({ ...drag, x, y, moved });
    const tr = trash.current?.getBoundingClientRect();
    const mine = cards.find((c) => c.key === drag.key)?.mine;
    setOverTrash(!!mine && !!tr && e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top && e.clientY <= tr.bottom);
  };
  const onUp = (e: RPointerEvent<HTMLElement>, c: Card) => {
    if (!drag || drag.key !== c.key) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const d = drag;
    setDrag(null);
    setOverTrash(false);
    if (!d.moved) {
      // clique sem arrastar: documento abre para ler
      if (c.kind === 'doc') openDoc(c.key.slice(2));
      return;
    }
    if (overTrash && c.mine) {
      remove(c.key);
      return;
    }
    if (corkMove(st, c.key, d.x, d.y)) {
      audio.sfx('click');
      g.bump();
    }
  };

  // ---- adesivos: escolhe na cartela, cola com um clique no quadro
  const onAreaClick = (e: RMouseEvent<HTMLDivElement>) => {
    if (!armed || e.target !== area.current) return;
    const [fx, fy] = frac(e.clientX, e.clientY);
    const W = area.current.offsetWidth || 1;
    const H = area.current.offsetHeight || 1;
    // o clique vira o centro do adesivo (60×56 px)
    const it = corkAddSticker(st, armed, [Math.min(Math.max(0, fx - 30 / W), 1 - 62 / W), Math.min(Math.max(0, fy - 28 / H), 1 - 58 / H)]);
    if (it) {
      audio.sfx('stamp');
      g.bump();
    } else store.toast('Chega de adesivo: o quadro já tem trinta Ozzys.');
    setArmed(null);
  };

  const pos = (c: Card) => {
    const live = drag?.key === c.key;
    return { left: `${(live ? drag!.x : c.x) * 100}%`, top: `${(live ? drag!.y : c.y) * 100}%`, zIndex: live ? 30 : undefined };
  };
  const handlers = (c: Card) => ({
    onPointerDown: (e: RPointerEvent<HTMLElement>) => onDown(e, c),
    onPointerMove: onMove,
    onPointerUp: (e: RPointerEvent<HTMLElement>) => onUp(e, c),
    onPointerCancel: () => (setDrag(null), setOverTrash(false)),
  });
  const dragging = (c: Card) => (drag?.key === c.key && drag.moved ? ' dragging' : '');
  const removeBtn = (id: string) => (
    <button type="button" className="cork-x" title="Tirar do quadro" aria-label="Tirar do quadro" onClick={() => remove(id)}>
      ×
    </button>
  );

  const openD = doc ? g.c.docs[doc] : undefined;

  return (
    <div className="overlay-book" onClick={onClose}>
      <div className="cork" onClick={(e) => e.stopPropagation()}>
        <div className="cork-top">
          <h2>Quadro de cortiça</h2>
          <span className="cork-hint">{armed ? `Clique no quadro para colar: ${OZZY_STICKER_LABELS[armed]}.` : 'Arraste para mudar de lugar. Os seus papéis saem no × ou na lixeira.'}</span>
        </div>
        <div ref={area} className={'cork-area' + (armed ? ' arming' : '') + (drag?.moved ? ' busy' : '')} onClick={onAreaClick}>
          {empty && <p className="cork-empty">Nada preso no quadro ainda.</p>}
          {cards.map((c) => {
            if (c.kind === 'ficha') {
              const b = st.board.find((x) => 'b:' + x.id === c.key)!;
              return (
                <div key={c.key} className={`pin-card k-${b.kind}` + dragging(c)} style={{ ...pos(c), transform: `rotate(${corkTilt(c.key, 'postit')}deg)` }} title="Ficha da central: a Simone prendeu, só ela tira." {...handlers(c)}>
                  <i className="pin" />
                  <b>{b.title}</b>
                  <span>{b.text}</span>
                  {b.count > 1 && <small>{b.count}×</small>}
                </div>
              );
            }
            if (c.kind === 'doc') {
              const id = c.key.slice(2);
              const d = g.c.docs[id]!;
              return (
                <div
                  key={c.key}
                  role="button"
                  tabIndex={0}
                  className={'pin-card k-doc desk-doc' + (doc === id ? ' open' : '') + (st.flags['doc_lido_' + id] ? ' read' : '') + dragging(c)}
                  style={{ ...pos(c), transform: `rotate(${corkTilt(c.key, 'postit')}deg)` }}
                  title="Clique para ler · arraste para mudar de lugar"
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openDoc(id)}
                  {...handlers(c)}
                >
                  <i className="pin" />
                  <b>{d.title}</b>
                  <span>Clique para ler.</span>
                </div>
              );
            }
            const it = cork.items.find((x) => x.id === c.key)!;
            if (it.kind === 'adesivo') {
              const kind = it.sticker as OzzyStickerKind;
              return (
                <div key={c.key} className={'cork-sticker' + dragging(c)} style={{ ...pos(c), transform: `rotate(${corkTilt(it.id, 'adesivo')}deg)` }} title={OZZY_STICKER_LABELS[kind] ?? 'Ozzy'} {...handlers(c)}>
                  <img src={ozzySticker(kind, 2)} alt={OZZY_STICKER_LABELS[kind] ?? 'Ozzy'} draggable={false} />
                  {removeBtn(it.id)}
                </div>
              );
            }
            return (
              <div key={c.key} className={`pin-card k-postit mine pc-${it.color ?? 'amarelo'}` + dragging(c)} style={{ ...pos(c), transform: `rotate(${corkTilt(it.id, 'postit')}deg)` }} {...handlers(c)}>
                <i className="pin" />
                <span>{it.text}</span>
                {removeBtn(it.id)}
              </div>
            );
          })}
          {drag?.moved && cards.find((c) => c.key === drag.key)?.mine && (
            <div ref={trash} className={'cork-trash' + (overTrash ? ' over' : '')} aria-hidden>
              🗑 solte aqui para tirar
            </div>
          )}
          {openD && (
            <div className="cork-read paper" onPointerDown={(e) => e.stopPropagation()}>
              <b>{openD.title}</b>
              <p>{docText(openD.id)}</p>
              <button type="button" className="px-btn small ghost" onClick={() => setDoc(null)}>
                Devolver ao quadro
              </button>
            </div>
          )}
        </div>
        <div className="cork-tray" aria-label="Adesivos do Ozzy">
          <span className="cork-tray-label">Adesivos do Ozzy</span>
          {OZZY_STICKERS.map((kind) => (
            <button key={kind} type="button" className={'cork-tray-item' + (armed === kind ? ' on' : '')} title={OZZY_STICKER_LABELS[kind]} aria-pressed={armed === kind} onClick={() => (setArmed(armed === kind ? null : kind), audio.sfx('click'))}>
              <img src={ozzySticker(kind, 1)} alt={OZZY_STICKER_LABELS[kind]} draggable={false} />
            </button>
          ))}
        </div>
        <div className="cork-write">
          <div className="cork-colors" role="radiogroup" aria-label="Cor do post-it">
            {CORK_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={color === c} className={`cork-swatch pc-${c}` + (color === c ? ' on' : '')} title={COLOR_LABEL[c]} onClick={() => setColor(c)} />
            ))}
          </div>
          <input className={`pc-${color}`} value={text} maxLength={CORK_TEXT_MAX} placeholder="Escreva um post-it…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
          <button className="px-btn small" onClick={addNote}>
            Colar
          </button>
          <button className="px-btn small ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
