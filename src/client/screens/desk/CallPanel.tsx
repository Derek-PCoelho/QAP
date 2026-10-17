import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { store, useStore } from '../../store';
import { parseMarkup, resolveTokens } from '../../../engine/text';
import type { CallRT, ShownLine, VoiceId } from '../../../engine/types';
import type { QuestionView } from '../../../engine/shift';
import { audio } from '../../audio';
import { fmtDur } from '../../../engine/util';

type PickFn = (id: string, text: string, el: HTMLElement | null) => void;

/** progresso de digitação por ligação (fora do React para sobreviver a re-renderizações).
 *  Chave = o objeto da ligação, não o id: ids se repetem ao refazer o dia e no Infinito (inf1_0...),
 *  e o progresso antigo fazia o texto aparecer pronto e sem voz. */
const typed = new WeakMap<CallRT, { done: number; cur?: number; start: number }>();

export function CallPanel({ onPick, sel }: { onPick: PickFn; sel?: string }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const call = sh.active();
  return (
    <section className="call-panel">
      <div className="monitor bezel">
        <div className="monitor-screen screen">
          {call ? <CallHeader call={call} /> : <div className="line-free">{sh.sh.closing ? 'Turno encerrado.' : 'Linha livre. Atenda uma ligação da fila.'}</div>}
          {call && <Transcript call={call} onPick={onPick} sel={sel} />}
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

function Transcript({ call, onPick, sel }: { call: CallRT; onPick: PickFn; sel?: string }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const inspect = sh.sh.inspect;
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
        return <Line key={l.id} line={l} partial={partial} inspect={inspect} sel={sel} onPick={onPick} />;
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

function Line({ line, partial, inspect, sel, onPick }: { line: ShownLine; partial?: number; inspect: boolean; sel?: string; onPick: PickFn }) {
  const segs = parseMarkup(line.text);
  let left = partial ?? Infinity;
  const body = segs.map((sg, i) => {
    if (left <= 0) return null;
    const txt = sg.text.slice(0, Math.max(0, left));
    left -= sg.text.length;
    if (sg.clue) {
      const on = sel === sg.clue;
      return (
        <span
          key={i}
          className={'clue' + (inspect ? ' live' : '') + (on ? ' sel' : '')}
          data-clue={sg.clue}
          onClick={(e) => {
            if (!inspect) return;
            e.stopPropagation();
            onPick(sg.clue!, sg.text, e.currentTarget);
          }}
        >
          {txt}
        </span>
      );
    }
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

const GROUP_ORDER = ['confronto', 'base', 'protocolo', 'ferramenta', 'acalmar'];

/**
 * Perguntas próprias da ligação ("especifica", "fala") ficam misturadas às perguntas de sempre,
 * na mesma cor: em cor própria e no topo elas entregavam quais perguntas importavam.
 */
function orderQuestions(qs: QuestionView[], callId: string): QuestionView[] {
  const own = (g: string) => g === 'especifica' || g === 'fala';
  const rank = (g: string) => (own(g) ? GROUP_ORDER.indexOf('base') : GROUP_ORDER.indexOf(g));
  const base = qs.filter((q) => !own(q.group)).sort((a, b) => rank(a.group) - rank(b.group));
  const extras = qs.filter((q) => own(q.group));
  // posição estável por ligação, depois das três primeiras perguntas de sempre
  const out = [...base];
  const firstFree = Math.min(3, out.filter((q) => q.group === 'base').length);
  for (const q of extras) {
    let h = 0;
    for (const ch of callId + q.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const lastBase = out.reduce((n, x, i) => (x.group === 'base' || own(x.group) ? i + 1 : n), 0);
    const span = Math.max(1, lastBase - firstFree + 1);
    out.splice(firstFree + (h % span), 0, q);
  }
  return out;
}

function Keypad({ call }: { call: CallRT }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const def = sh.defOf(call);
  const qs = orderQuestions(sh.questions(call), call.id);
  const busy = !!sh.sh.guideCallId || call.status !== 'ativa' || !!call.decision;
  const ask = (id: string) => {
    sh.ask(id);
    audio.sfx('click');
    store.notify();
  };
  return (
    <div className="keypad bezel">
      <div className="kp-grid scroll-y">
        {qs.map((q) => (
          <button
            key={q.id}
            className={`kp-btn g-${q.group === 'especifica' || q.group === 'fala' ? 'base' : q.group}` + (q.asked ? ' asked' : '')}
            disabled={busy || (q.asked && q.group !== 'acalmar')}
            title={q.hint ?? ''}
            onClick={() => ask(q.id)}
          >
            <span className="kp-label">{q.label}</span>
            <span className="kp-cost">{q.asked && q.group !== 'acalmar' ? '✓' : `${q.cost}′`}</span>
          </button>
        ))}
      </div>
      <div className="kp-actions">
        <button className="px-btn small ghost" disabled={busy} onClick={() => (sh.hold(), store.notify())} title="Volta para a fila com tudo que já foi dito">
          Pôr em espera
        </button>
        <VideoButton call={call} busy={busy} />
        {def.impedimento && !sh.sh.tarm && (
          <button
            className="px-btn small warm"
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
      className="px-btn small video"
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
