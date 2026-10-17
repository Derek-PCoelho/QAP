// Intervenção: plantão extra na USA 01. Rádio → cena em tempo real → resultado → fim da noite.
// A tela só desenha e repassa cliques; as regras estão em src/engine/field.ts.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { store, useStore } from '../../store';
import { ArtCanvas } from '../../ui/ArtCanvas';
import { farScene, renderVideoFrame, VIDEO_W, VIDEO_H } from '../../art/video';
import { presentPix } from '../../art/pix';
import { audio } from '../../audio';
import { Portrait } from '../../ui/Portrait';
import { DEST_LABEL, OUTCOME_LABEL, FIELD_BASE, FIELD_WEAR, vitalShown, type FieldSim, type FieldActionView } from '../../../engine/field';
import { drawEcg, type EcgRhythm } from '../../art/fieldMonitor';
import type { AmbientId, FieldDest, FieldGroup, FieldOutcome, FieldVital } from '../../../engine/types';

const GROUP_LABEL: Record<FieldGroup, string> = {
  cena: 'Cena',
  via: 'Via aérea',
  resp: 'Respiração',
  circ: 'Circulação',
  neuro: 'Neuro',
  exp: 'Exposição',
  med: 'Medicação',
};
const VITALS: { k: FieldVital; label: string }[] = [
  { k: 'pa', label: 'PA' },
  { k: 'fc', label: 'FC' },
  { k: 'fr', label: 'FR' },
  { k: 'sat', label: 'SpO₂' },
  { k: 'glic', label: 'Glic' },
  { k: 'temp', label: 'Temp' },
  { k: 'glasgow', label: 'Glasgow' },
];
const QRR_LABEL: Record<1 | 2 | 3, string> = { 1: 'QRR 1 · prioridade baixa', 2: 'QRR 2 · prioridade moderada', 3: 'QRR 3 · prioridade absoluta' };
/** teclas dos dispositivos de oxigênio e via aérea (as ações usam 1 a 9) */
const O2_KEYS = ['q', 'w', 'e', 'r'];
const DESTS: FieldDest[] = ['REG', 'UPA', 'MAT', 'LOCAL'];
const DEST_SHORT: Record<FieldDest, string> = { REG: 'Regional', UPA: 'UPA Norte', MAT: 'Maternidade', LOCAL: 'Liberar no local' };

function mmss(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function Intervencao() {
  const s = useStore();
  const g = s.game!;
  const home = g.home!;
  const sim = home.fieldSim();
  const [, force] = useState(0);

  // relógio em tempo real (para durante a pausa)
  useEffect(() => {
    if (!sim) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.25, (t - last) / 1000);
      last = t;
      if (!store.paused && sim.f.phase === 'cena') {
        // ritmo das Opções (calmo = o paciente piora mais devagar em tempo real)
        sim.tick(dt * (store.settings.ritmo || 1));
        acc += dt;
        if (acc >= 0.07 || sim.f.phase !== 'cena') {
          acc = 0;
          force((x) => x + 1);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sim]);

  useEffect(() => {
    audio.stopHomeMusic();
    return () => {
      audio.heartbeat(false);
      audio.setAmbient([]);
    };
  }, []);

  // som de fundo da cena (rua, bar, festa, água...)
  const phase = sim?.f.phase;
  const idx = sim?.f.idx;
  useEffect(() => {
    const d = sim?.def;
    if (!d || phase === 'fim') return audio.setAmbient([]);
    if (phase === 'radio') return audio.setAmbient(['rua'], 0.25);
    const pl = d.scene.place;
    const layers: AmbientId[] = d.scene.laughing
      ? ['risadas', 'rua']
      : pl === 'bar'
        ? ['bar', 'gritos']
        : pl === 'rio' || pl === 'praia'
          ? ['agua', 'vento']
          : pl === 'campo'
            ? ['vento']
            : pl === 'rua' || pl === 'calcada' || pl === 'carro'
              ? ['rua']
              : (d.scene.people ?? 0) >= 4
                ? ['festa']
                : ['silencio'];
    audio.setAmbient(layers, 0.45);
  }, [phase, idx]);

  if (!sim) return null;
  const f = sim.f;
  const rerender = () => force((x) => x + 1);

  return (
    <div className="field">
      <FieldTop sim={sim} money={g.st.money} />
      {f.phase === 'radio' && <FieldRadio sim={sim} first={!g.st.flags['fez_intervencao']} onGo={rerender} />}
      {(f.phase === 'cena' || f.phase === 'resultado') && <FieldScene sim={sim} onChange={rerender} />}
      {f.phase === 'resultado' && <FieldResult sim={sim} onNext={rerender} />}
      {f.phase === 'fim' && (
        <FieldEnd
          sim={sim}
          onHome={() => {
            home.finishField();
            audio.sfx('door');
            audio.startHomeMusic(g.st.vars.lacos / 10, g.st.vars.desgaste);
            store.notify();
          }}
        />
      )}
    </div>
  );
}

function FieldTop({ sim, money }: { sim: FieldSim; money: number }) {
  const f = sim.f;
  const extra = f.results.reduce((a, r) => a + r.pay, 0);
  return (
    <header className="fd-top">
      <span className="fd-unit">INTERVENÇÃO · USA 01</span>
      <span className="fd-crew">{f.story?.crew ?? 'Seu Bené (condutor) · Enf. Márcio · você'}</span>
      <span className="fd-count">
        Ocorrência {Math.min(f.idx + 1, f.cases.length)}/{f.cases.length}
      </span>
      <span className="fd-clock">{f.phase === 'fim' ? sim.endClock() : sim.clock()}</span>
      <span className="fd-pay" title="Plantão fixo + extras por paciente entregue vivo">
        Noite: R$ {FIELD_BASE} + {extra}
        <small>Saldo R$ {money}</small>
      </span>
    </header>
  );
}

// -----------------------------------------------------------------------------
// rádio: o chamado
// -----------------------------------------------------------------------------
function FieldRadio({ sim, first, onGo }: { sim: FieldSim; first: boolean; onGo: () => void }) {
  const d = sim.def!;
  const f = sim.f;
  const extra = f.extra[f.idx] ?? [];
  const text = sim.radioText();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    audio.sfx('radio_on');
    const h = audio.radio(text);
    const iv = setInterval(() => setShown((n) => (n >= text.length ? n : n + 3)), 28);
    return () => {
      clearInterval(iv);
      h?.stop?.();
    };
  }, [f.idx]);
  const go = () => {
    sim.begin();
    audio.sfx('siren');
    onGo();
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !store.paused) {
        e.preventDefault();
        go();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  return (
    <div className="fd-radio">
      <div className="fd-radio-box bezel">
        <div className="fd-radio-crew">
          <Portrait id={'BENE' as never} size={128} />
          <span>
            <b>Seu Bené</b>
            condutor da USA 01
          </span>
        </div>
        <div className="fd-radio-head">
          <span className="fd-led" /> RÁDIO · REGULAÇÃO → USA 01
          <span className={'fd-qrr q' + d.qrr}>{QRR_LABEL[d.qrr]}</span>
        </div>
        {f.idx === 0 && f.story && f.story.chapters.length > 0 && (
          <div className="fd-chapter">
            NOITE {f.story.night} NA 01 · {f.story.chapters.map((c) => `Capítulo ${c.chapter}: ${c.title}`).join(' · ')}
          </div>
        )}
        {extra.map((x, i) => (
          <p key={i} className={'fd-radio-extra' + (x.who === 'NARRADOR' ? ' narr' : '')}>
            {x.who !== 'NARRADOR' && <b>{sim.fill(x.who)}: </b>}
            {sim.fill(x.text)}
          </p>
        ))}
        <p className="fd-radio-text screen">
          {text.slice(0, shown)}
          {shown < text.length && <span className="cursor">▌</span>}
        </p>
        <div className="fd-radio-addr">
          QTH: {d.addr.rua}
          {d.addr.n ? `, ${d.addr.n}` : ''} · {d.addr.bairro}
        </div>
        {first && (
          <div className="fd-howto">
            <b>Como funciona a Intervenção.</b> Aqui você está na rua, na USA 01. O paciente piora em tempo real enquanto você decide. Cada ação leva alguns
            segundos da equipe. Primeiro a segurança da cena; depois o que mata primeiro: sangramento, via aérea, respiração, circulação. Medir (monitor,
            glicemia) mostra o que a câmera da Regulação nunca mostra. Oxigênio e intubação ficam numa linha à parte: só use se indicar (cada máscara sobe
            a saturação de um jeito). Na parada, o monitor mostra o traçado e quem lê o ritmo é você. Quando o essencial estiver feito, escolha para onde
            levar. Atalhos: 1 a 9 para as ações, Q W E R para o oxigênio.
          </div>
        )}
        <button className="px-btn primary fd-go" onClick={go}>
          QSL, a caminho (QTY) ▸
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// cena
// -----------------------------------------------------------------------------
function FieldScene({ sim, onChange }: { sim: FieldSim; onChange: () => void }) {
  const d = sim.def!;
  const rt = sim.rt!;
  const views = sim.visibleActions();
  const ended = !!rt.outcome;
  const rate = sim.rate();
  const lastLog = useRef(rt.log.length);
  const lastOutcome = useRef<FieldOutcome | undefined>(rt.outcome);

  // sons: achados, danos e desfecho
  useEffect(() => {
    if (rt.log.length > lastLog.current) {
      const fresh = rt.log.slice(lastLog.current);
      lastLog.current = rt.log.length;
      if (fresh.some((l) => l.kind === 'alerta')) audio.sfx('warning');
      else if (fresh.some((l) => l.kind === 'fim' && !rt.outcome)) audio.sfx('insight');
      else if (fresh.some((l) => l.kind === 'achado' || l.kind === 'acao')) audio.sfx('click');
    }
    if (rt.outcome !== lastOutcome.current) {
      lastOutcome.current = rt.outcome;
      if (rt.outcome === 'estavel') audio.sfx('saved');
      else if (rt.outcome === 'obito') audio.sfx('death');
      else if (rt.outcome === 'equipe_ferida') audio.sfx('error');
      else if (rt.outcome === 'trote') audio.sfx('wrong');
    }
  });

  // bip do monitor
  const fc = Number(vitalShown(d, rt, 'fc'));
  const beeping = !ended && rt.shown.includes('fc') && fc > 0;
  useEffect(() => {
    audio.heartbeat(beeping, beeping ? Math.max(30, Math.min(180, fc)) : 72);
  }, [beeping, fc]);
  useEffect(() => () => audio.heartbeat(false), []);

  const act = (a: FieldActionView) => {
    if (a.state !== 'ok') {
      if (a.reason) store.toast(a.reason, 'ruim');
      audio.sfx('error');
      return;
    }
    const r = sim.act(a.id);
    if (!r.ok && r.reason) store.toast(r.reason, 'ruim');
    onChange();
  };
  const go = (dest: FieldDest) => {
    sim.transport(dest);
    audio.sfx('siren');
    onChange();
  };

  // atalhos 1–9
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (store.paused || sim.rt?.outcome) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 9) {
        // o número é o que está na tela (views desta renderização), mas o estado vem do motor agora:
        // a tela só redesenha a cada ~70 ms e a ação anterior pode ter acabado nesse meio-tempo
        const a = views.filter((v) => v.state !== 'feito' && !v.o2)[n - 1];
        const live = a && sim.visibleActions().find((v) => v.id === a.id);
        if (live) act(live);
      }
      const k = O2_KEYS.indexOf(e.key.toLowerCase());
      if (k >= 0) {
        const a = views.filter((v) => v.o2)[k];
        const live = a && sim.visibleActions().find((v) => v.id === a.id);
        if (live) act(live);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const stab = Math.round(rt.stab);
  const stabCls = stab > 60 ? 'ok' : stab > 30 ? 'mid' : 'bad';
  const canMove = !ended && rt.secured && !rt.busy && !d.prank;
  const pending = views.filter((v) => v.state !== 'feito' && !v.o2);
  const done = views.filter((v) => v.state === 'feito' && !v.o2);
  const o2 = views.filter((v) => v.o2);

  return (
    <div className="fd-scene">
      <div className="fd-left">
        <div className={'fd-view screen' + (!rt.secured ? ' far' : '')}>
          <ArtCanvas
            w={VIDEO_W}
            h={VIDEO_H}
            scale={3}
            animate
            fps={10}
            draw={(ctx, t) => {
              // cena insegura: de longe, da esquina, sem ver o paciente direito
              const far = !rt.secured && !rt.outcome;
              const scene = far ? (d.far ?? farScene(rt.scene)) : rt.scene;
              const pix = renderVideoFrame({ scene, focus: far ? 'geral' : rt.focus, signal: 'bom', t, seed: 'fd:' + d.id + (far ? ':longe' : ''), view: 'campo' });
              presentPix(ctx, pix, 0, 0, 1, 'field');
              if (far) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(0, 0, VIDEO_W, VIDEO_H);
              }
            }}
          />
          {!rt.secured && !ended && <div className="fd-far">vista da esquina · a equipe ainda não entrou</div>}
          {rt.busy && <div className="fd-busy">{d.actions.find((a) => a.id === rt.busy!.id)?.label}…</div>}
        </div>
      </div>

      <div className="fd-right">
        <div className="fd-state">
          <div className="fd-state-row">
            <span>Estado do paciente</span>
            <b className={'fd-trend ' + (rate > 0 ? 'down' : 'flat')}>{d.prank ? 'sem vítima' : rt.stable ? (d.scoop ? 'essencial feito · leve rápido' : 'estabilizado') : rate > 0 ? 'piorando' : 'avaliando'}</b>
            <span className="fd-time">na cena {mmss(rt.t)}</span>
          </div>
          <div className={'fd-bar ' + stabCls}>
            <i style={{ width: stab + '%' }} />
          </div>
        </div>
        <Monitor sim={sim} />
        <FieldLog sim={sim} />
      </div>

      <div className="fd-actions">
        <div className="fd-grid">
          {pending.map((a, i) => (
            <button
              key={a.id}
              className={'fd-act g-' + a.group + ' st-' + a.state}
              disabled={ended || a.state === 'bloqueado' || a.state === 'ocupado'}
              onClick={() => act(a)}
              title={a.reason ?? GROUP_LABEL[a.group]}
            >
              <span className="fd-key">{i + 1}</span>
              <span className="fd-lbl">{a.label}</span>
              <span className="fd-cost">{a.state === 'falta' ? a.reason : `${a.cost}s · ${GROUP_LABEL[a.group]}`}</span>
              {a.state === 'ocupado' && <i className="fd-prog" style={{ width: Math.round((a.progress ?? 0) * 100) + '%' }} />}
            </button>
          ))}
          {o2.length > 0 && (
            <div className="fd-o2">
              <span className="fd-o2-head">
                O₂ e via aérea <small>só se você indicar</small>
              </span>
              {o2.map((a, i) => (
                <button
                  key={a.id}
                  className={'fd-act g-' + a.group + ' st-' + a.state + (a.state === 'feito' ? ' on' : '')}
                  disabled={ended || a.state === 'bloqueado' || a.state === 'ocupado' || a.state === 'feito'}
                  onClick={() => act(a)}
                  title={a.reason ?? (a.state === 'feito' ? 'Em uso' : a.label)}
                >
                  <span className="fd-key">{O2_KEYS[i].toUpperCase()}</span>
                  <span className="fd-lbl">{a.label}</span>
                  <span className="fd-cost">{a.state === 'feito' ? 'em uso' : a.state === 'falta' ? a.reason : `${a.cost}s`}</span>
                  {a.state === 'ocupado' && <i className="fd-prog" style={{ width: Math.round((a.progress ?? 0) * 100) + '%' }} />}
                </button>
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div className="fd-done" title={done.map((x) => x.label).join(' · ')}>
              Feito: {done.map((x) => x.label).join(' · ')}
            </div>
          )}
        </div>
        {!d.prank && (
          <div className="fd-dest">
            <span>Levar para</span>
            {DESTS.map((k) => (
              <button key={k} className={'px-btn small' + (k === 'LOCAL' ? ' ghost' : ' primary')} disabled={!canMove} onClick={() => go(k)} title={DEST_LABEL[k]}>
                {DEST_SHORT[k]}
              </button>
            ))}
            {!rt.stable && !ended && rt.secured && <small>Ainda instável: levar agora é correr risco.</small>}
          </div>
        )}
      </div>
    </div>
  );
}

function Monitor({ sim }: { sim: FieldSim }) {
  const d = sim.def!;
  const rt = sim.rt!;
  const ritmo = vitalShown(d, rt, 'ritmo');
  const fc = Number(vitalShown(d, rt, 'fc'));
  const on = rt.shown.includes('fc') || rt.shown.includes('ritmo');
  // na parada, quem lê o traçado é o jogador: o monitor não escreve o ritmo
  const arrest = !!d.arrest;
  const rhythm: EcgRhythm = !on ? 'off' : arrest ? (rt.rhythm ?? 'SINUSAL') : fc > 0 ? 'SINUSAL' : 'ASSISTOLIA';
  const semPulso = arrest && on && rt.rhythm !== 'SINUSAL' && !rt.outcome;
  // largura do traçado (×2 na tela): cabe na coluna ao lado da cena de vídeo em ×3
  const EW = 300;
  // a saturação sempre tem lugar no monitor, junto com o resto
  const keys = VITALS.filter((v) => v.k === 'sat' || d.vitals[v.k] !== undefined);
  return (
    <div className="fd-mon screen">
      <div className="fd-mon-head">
        MONITOR {ritmo && ritmo !== '--' && <span className="fd-ritmo">{ritmo}</span>}
        {semPulso && <span className="fd-ritmo fd-ler">sem pulso · leia o traçado</span>}
        {!on && <span className="fd-off">sem cabos</span>}
      </div>
      <ArtCanvas w={EW} h={30} scale={2} animate fps={24} className="fd-ecg" draw={(ctx, t) => drawEcg(ctx, EW, 30, t, rhythm, fc)} />
      <div className="fd-vitals">
        {keys.map((v) => (
          <span key={v.k} className={rt.shown.includes(v.k) ? 'on' : ''}>
            <small>{v.label}</small>
            <b>{vitalShown(d, rt, v.k)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function FieldLog({ sim }: { sim: FieldSim }) {
  const rt = sim.rt!;
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  });
  return (
    <div
      className="fd-log screen scroll-y"
      ref={ref}
      onScroll={() => {
        const el = ref.current;
        if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
      }}
    >
      {rt.log.map((l, i) => (
        <p key={i} className={'fl ' + l.kind}>
          <span className="fl-t">{mmss(l.t)}</span>
          {l.who && <b>{l.who}: </b>}
          {l.text}
        </p>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// resultado e fim
// -----------------------------------------------------------------------------
const OUTCOME_CLS: Record<FieldOutcome, string> = { estavel: 'ok', instavel: 'mid', obito: 'bad', equipe_ferida: 'bad', trote: 'mid' };

function FieldResult({ sim, onNext }: { sim: FieldSim; onNext: () => void }) {
  const d = sim.def!;
  const rt = sim.rt!;
  const last = sim.f.idx + 1 >= sim.f.cases.length;
  const next = () => {
    sim.next();
    onNext();
  };
  return (
    <div className="fd-modal">
      <div className="fd-card bezel">
        <div className={'fd-out ' + OUTCOME_CLS[rt.outcome!]}>{OUTCOME_LABEL[rt.outcome!]}</div>
        <h3>{d.title}</h3>
        <p className="fd-line">
          {rt.dest ? (
            <>
              {DEST_LABEL[rt.dest]} {rt.destOk ? '✓' : '· não era o destino certo'}
              {' · '}
            </>
          ) : null}
          {mmss(rt.t)} na cena · {rt.harm ? `${rt.harm} conduta(s) que pioraram · ` : ''}
          <b>+R$ {rt.pay ?? 0}</b>
        </p>
        {rt.dest && !rt.destOk && d.destNote?.[rt.dest] && <p className="fd-debrief fd-destnote">{d.destNote[rt.dest]}</p>}
        <p className="fd-debrief">{d.debrief}</p>
        <p className="fd-source">Referência: {d.source}</p>
        {d.story && <p className="fd-chapter">Capítulo {d.story.chapter} da história das noites: {d.story.title}</p>}
        <button className="px-btn primary" onClick={next} autoFocus>
          {last ? 'Fim da noite ▸' : 'QRV: próxima ocorrência ▸'}
        </button>
      </div>
    </div>
  );
}

function FieldEnd({ sim, onHome }: { sim: FieldSim; onHome: () => void }) {
  const sum = sim.summary();
  const epi = sim.epilogue();
  return (
    <div className="fd-modal">
      <div className="fd-card bezel">
        <h3>{sim.endClock()} · fim do plantão extra</h3>
        <ul className="fd-sum">
          {sum.results.map((r) => (
            <li key={r.id}>
              <span className={'fd-dot ' + OUTCOME_CLS[r.outcome]} />
              {r.title}: <b>{OUTCOME_LABEL[r.outcome]}</b> <span className="fd-sum-pay">+R$ {r.pay}</span>
            </li>
          ))}
        </ul>
        <p className="fd-line">
          Plantão R$ {sum.base} + extras R$ {sum.extra} = <b>R$ {sum.pay}</b>
        </p>
        {epi.length > 0 && (
          <div className="fd-epilogo">
            {epi.map((l, i) => (
              <p key={i}>
                {l.who !== 'NARRADOR' && <b>{sim.fill(l.who)}: </b>}
                {sim.fill(l.text)}
              </p>
            ))}
          </div>
        )}
        <p className="fd-debrief">
          O Bené deixa você na base. Você chega em casa de madrugada e dorme três horas. Às 7h a Regulação começa: hoje as pálpebras vão pesar (desgaste +
          {FIELD_WEAR}
          {sum.deaths ? ' e mais pelo óbito' : ''}).
        </p>
        <button className="px-btn warm" onClick={onHome} autoFocus>
          Passar em casa ▸
        </button>
      </div>
    </div>
  );
}
