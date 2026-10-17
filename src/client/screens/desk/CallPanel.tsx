import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { store, useStore } from '../../store';
import { parseMarkup, resolveTokens } from '../../../engine/text';
import { BOXES, type BoxId, type CallRT, type ShownLine, type VoiceId } from '../../../engine/types';
import type { QuestionView } from '../../../engine/shift';
import { audio } from '../../audio';
import { fmtDur } from '../../../engine/util';

/** progresso de digitação por ligação (fora do React para sobreviver a re-renderizações).
 *  Chave = o objeto da ligação, não o id: ids se repetem ao refazer o dia e no Infinito (inf1_0...),
 *  e o progresso antigo fazia o texto aparecer pronto e sem voz. */
const typed = new WeakMap<CallRT, { done: number; cur?: number; start: number }>();

export function CallPanel() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const call = sh.active();
  return (
    <section className="call-panel">
      <div className="monitor bezel">
        <div className="monitor-screen screen">
          {call ? <CallHeader call={call} /> : <div className="line-free">{sh.sh.closing ? 'Turno encerrado.' : 'Linha livre. Atenda uma ligação da fila.'}</div>}
          {call && <Transcript call={call} />}
        </div>
      </div>
      {call && <Keypad call={call} />}
      {!call && <div className="keypad idle">As perguntas aparecem aqui quando você atende.</div>}
    </section>
  );
}

function CallHeader({ call }: { call: CallRT }) {
  const g = store.game!;
  const sh = g.shift!;
  const def = sh.defOf(call);
  const dur = call.answered !== undefined ? sh.sh.time - call.answered : 0;
  return (
    <>
      <div className="call-head">
        <span className="ch-num">☎ {def.num}</span>
        <span className="ch-who">{resolveTokens(def.callerName ?? def.caller, g.st.gender, g.st)}</span>
        <span className="ch-dur">{fmtDur(dur)}</span>
        {call.patience < 50 && <span className="ch-imp">{call.patience < 25 ? 'perdendo a paciência' : 'impaciente'}</span>}
      </div>
      {/* o post-it da TARM inteiro: no cartão da fila ele só cabe pela metade */}
      {call.noteText && (
        <div className={'ch-tarm' + (call.noteUrgent ? ' red' : '')}>
          <b>TARM</b> {call.noteText}
          {call.noteAddr && <em className="ch-addr"> {call.noteAddr}</em>}
        </div>
      )}
    </>
  );
}

function voiceFor(call: CallRT): VoiceId {
  const g = store.game!;
  const def = g.shift!.defOf(call);
  // a ligação de casa fala com a voz do cônjuge: a Lúcia ou, com a protagonista mulher, o Alex
  if (def.voice === 'lucia' && g.st.gender === 'F') return 'alex';
  return def.voice ?? 'homem';
}

function Transcript({ call }: { call: CallRT }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const ref = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);
  const speed = s.settings.textSpeed;
  const tremble = s.settings.tremble && g.st.vars.desgaste > 60;

  let st = typed.get(call);
  if (!st) {
    st = { done: 0, start: performance.now() };
    typed.set(call, st);
  }
  const lines = call.lines;
  // próxima linha a animar
  const pendingIdx = lines.findIndex((l) => l.id > st!.done);
  const animating = pendingIdx >= 0 ? lines[pendingIdx] : undefined;
  if (animating && st.cur !== animating.id) {
    st.cur = animating.id;
    st.start = performance.now();
    if (animating.kind === 'caller') {
      const plain = parseMarkup(animating.text)
        .map((x) => x.text)
        .join('');
      // a fala termina junto com o texto na tela (velocidade do texto nas Opções)
      audio.voice(plain, voiceFor(call), { style: animating.style, fit: plainLen(animating.text) / Math.max(1, speed) });
    }
  }
  const animLen = animating ? plainLen(animating.text) : 0;
  const elapsed = animating ? ((performance.now() - st.start) / 1000) * speed * (animating.kind === 'caller' ? 1 : 2.5) : 0;
  const revealed = animating ? Math.floor(elapsed) : 0;
  if (animating && revealed >= animLen) {
    st.done = animating.id;
    st.cur = undefined;
  }

  useEffect(() => {
    if (!animating) return;
    let raf = 0;
    const f = () => {
      setTick((x) => x + 1);
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [animating?.id]);

  // Rolagem: a transcrição acompanha a última fala só enquanto o jogador está no fim.
  // Se ele rolar para cima para reler, a tela fica parada e aparece "novas falas ↓".
  const stick = useRef(true);
  const seenCall = useRef(call);
  if (seenCall.current !== call) {
    seenCall.current = call;
    stick.current = true;
  }
  const shown = lines.reduce((n, l) => (l.id <= st!.done || l === animating ? n + 1 : n), 0);
  const lastShown = useRef(shown);
  const [unseen, setUnseen] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  });
  useEffect(() => {
    if (shown > lastShown.current && !stick.current) setUnseen(true);
    lastShown.current = shown;
  }, [shown]);
  useEffect(() => {
    setUnseen(false);
  }, [call]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
    stick.current = atBottom;
    if (atBottom && unseen) setUnseen(false);
  };
  const toBottom = (e: { stopPropagation(): void }) => {
    e.stopPropagation();
    stick.current = true;
    setUnseen(false);
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const skip = () => {
    if (lines.length) {
      st!.done = lines[lines.length - 1].id;
      st!.cur = undefined;
      setTick((x) => x + 1);
    }
  };

  return (
    <div ref={ref} className={'transcript scroll-y' + (tremble ? ' tremble-text' : '')} onClick={skip} onScroll={onScroll}>
      {lines.map((l) => {
        if (l.id > st!.done && l !== animating) return null;
        const partial = l === animating ? Math.min(animLen, revealed) : undefined;
        return <Line key={l.id} line={l} partial={partial} />;
      })}
      {unseen && (
        <button type="button" className="tr-jump" onClick={toBottom}>
          novas falas ↓
        </button>
      )}
    </div>
  );
}

function plainLen(t: string) {
  return parseMarkup(t).reduce((a, x) => a + x.text.length, 0);
}

function Line({ line, partial }: { line: ShownLine; partial?: number }) {
  const segs = parseMarkup(line.text);
  let left = partial ?? Infinity;
  const body = segs.map((sg, i) => {
    if (left <= 0) return null;
    const txt = sg.text.slice(0, Math.max(0, left));
    left -= sg.text.length;
    // {{trecho|pista}} é só texto desde a 1.1 (o Modo Inconsistência saiu)
    return <span key={i}>{txt}</span>;
  });
  const cls = `tl ${line.kind}` + (line.style ? ` st-${line.style}` : '');
  if (line.kind === 'ruido') return <p className={cls}>{body}</p>;
  if (line.kind === 'sistema') return <p className={cls}>{body}</p>;
  if (line.kind === 'insight') return <p className={cls}>⚑ {body}</p>;
  if (line.kind === 'regulador') return <p className={cls}>{body}</p>;
  if (line.kind === 'video') return <p className={cls}>{body}</p>;
  return (
    <p className={cls}>
      <b className="who">{line.who}:</b> {body}
    </p>
  );
}

/** caixas de perguntas (1.1): Clínico azul, GO rosa, Trauma verde, Outros branco */
const BOX_LABEL: Record<BoxId, string> = { clinico: 'Clínico', go: 'GO', trauma: 'Trauma', outros: 'Outros' };

/**
 * Perguntas do regulador (1.1): as cinco fixas no topo; as quatro caixas acrescentam à tela as
 * perguntas daquele tipo de caso (e as perguntas próprias da ligação que forem dele); confrontos
 * liberados ficam à vista; "Falar com o paciente", "Ligar de volta", "Acalmar", vídeo e espera são
 * ferramentas, na linha de baixo.
 */
function Keypad({ call }: { call: CallRT }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const def = sh.defOf(call);
  const all = sh.questions(call);
  const open = call.boxes ?? [];
  const busy = !!sh.sh.guideCallId || call.status !== 'ativa' || !!call.decision;
  const ask = (id: string) => {
    sh.ask(id);
    audio.sfx('click');
    store.notify();
  };
  const toggle = (b: BoxId) => {
    sh.toggleBox(b);
    audio.sfx('page');
    store.notify();
  };
  const tarm = !!sh.sh.tarm;
  const tools = all.filter((q) => !q.fixed && !q.box && (q.group === 'ferramenta' || q.group === 'acalmar'));
  const fixed = all.filter((q) => q.fixed);
  // confrontos liberados e perguntas sem caixa (TARM: todas as dela)
  const loose = all.filter((q) => !q.fixed && !q.box && q.group !== 'ferramenta' && q.group !== 'acalmar');
  const inBox = (b: BoxId) => all.filter((q) => q.box?.includes(b));
  const shownBoxQ: (QuestionView & { b: BoxId })[] = [];
  const seen = new Set<string>();
  for (const b of BOXES) {
    if (!open.includes(b)) continue;
    for (const q of inBox(b)) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      shownBoxQ.push({ ...q, b });
    }
  }
  const btn = (q: QuestionView, extra = '') => (
    <button
      key={q.id}
      className={`kp-btn g-${q.group === 'especifica' || q.group === 'fala' ? 'base' : q.group}${extra}` + (q.asked ? ' asked' : '')}
      disabled={busy || (q.asked && q.group !== 'acalmar')}
      title={q.hint ?? ''}
      onClick={() => ask(q.id)}
    >
      <span className="kp-label">{q.label}</span>
      <span className="kp-cost">{q.asked && q.group !== 'acalmar' ? '✓' : `${q.cost}′`}</span>
    </button>
  );
  return (
    <div className="keypad bezel">
      {!tarm && (
        <div className="kp-boxes" role="group" aria-label="Caixas de perguntas">
          {BOXES.map((b) => {
            const n = inBox(b).filter((q) => !q.asked).length;
            return (
              <button key={b} className={`kp-box box-${b}` + (open.includes(b) ? ' on' : '')} disabled={busy} aria-pressed={open.includes(b)} onClick={() => toggle(b)} title={open.includes(b) ? 'Fechar a caixa' : 'Abrir: acrescenta as perguntas desta caixa'}>
                {BOX_LABEL[b]}
                {n > 0 && <small>{n}</small>}
              </button>
            );
          })}
        </div>
      )}
      <div className="kp-grid scroll-y">
        {fixed.map((q) => btn(q, ' fixed'))}
        {loose.map((q) => btn(q))}
        {shownBoxQ.map((q) => btn(q, ` inbox box-${q.b}`))}
        {!tarm && open.length === 0 && <p className="kp-tip">Abra uma caixa para mais perguntas.</p>}
      </div>
      {fixed.length + loose.length + shownBoxQ.length > 10 && <span className="kp-more">▼ role: mais perguntas</span>}
      <div className="kp-actions">
        {tools.map((q) => (
          <button key={q.id} className={'px-btn tiny ghost tool' + (q.asked && q.group !== 'acalmar' ? ' asked' : '')} disabled={busy || (q.asked && q.group !== 'acalmar')} title={(q.hint ?? '') + ` (${q.cost} min)`} onClick={() => ask(q.id)}>
            {q.label} <span className="kp-cost">{q.asked && q.group !== 'acalmar' ? '✓' : `${q.cost}′`}</span>
          </button>
        ))}
        <VideoButton call={call} busy={busy} />
        <button className="px-btn tiny ghost" disabled={busy} onClick={() => (sh.hold(), store.notify())} title="Volta para a fila com tudo que já foi dito">
          Pôr em espera
        </button>
        {def.impedimento && !tarm && (
          <button
            className="px-btn tiny warm"
            disabled={busy}
            onClick={() => {
              sh.declareImpediment();
              audio.sfx('interfone');
              store.notify();
            }}
            title="Anexo 9-C: o regulador não regula familiar"
          >
            Declarar impedimento
          </button>
        )}
      </div>
    </div>
  );
}

/** videochamada de averiguação (Programa VER) */
function VideoButton({ call, busy }: { call: CallRT; busy: boolean }) {
  const sh = store.game!.shift!;
  const view = sh.videoView(call);
  if (!view.enabled) return null;
  const active = call.video?.state === 'ativo';
  if (active) return <span className="kp-video-on">📹 vídeo aberto</span>;
  const title = view.canStart
    ? `Pede para quem ligou abrir a câmera do celular. Custa 2 min para pedir; conectar leva de 3 a 8 min. Franquia: ${view.credits} de ${view.credits + view.used}.`
    : view.reason ?? '';
  return (
    <button
      className="px-btn tiny video"
      disabled={busy || !view.canStart}
      title={title}
      onClick={() => {
        const r = sh.startVideo();
        audio.sfx(r === 'conectou' ? 'pickup' : r === 'recusou' || r === 'fez_mal' ? 'busy' : 'click');
        store.notify();
      }}
    >
      📹 Vídeo <span className="kp-cost">{view.credits}</span>
    </button>
  );
}
