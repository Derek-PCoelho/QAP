// =============================================================================
// Vaga zero — o "tempo parando" (1.1).
//
// Referência: o clímax de Papers, Please — o mundo congela e o jogador decide a palavra.
// Ao abrir: o telefone do Regional toca (dois toques graves), o relógio da central trava (os
// dígitos ficam vermelhos e o ":" para de piscar), a central dessatura atrás de uma vinheta, o
// som cai para debaixo d'água com um pulso grave. Só a mesa e o telefone ficam em cor.
// Durante: o Saulo fala à esquerda; os argumentos são cartões à direita; a respiração dele no
// fone mostra se está cedendo; cada rodada tem um pavio (a fita do fax saindo).
// Ao fechar: a cor volta de dentro para fora e o relógio cobra os minutos de uma vez.
//
// Ponto de ligação da Arte 2: o retrato do Saulo entra sozinho quando `characterFor('SAULO')`
// existir em src/client/art (7 humores: neutro, feliz, triste, bravo, preocupado, surpreso,
// cansado); até lá, o retrato genérico do plantonista. Um quadro desenhado do "tempo parando"
// pode substituir o fundo em <div className="vz-scene">.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { store, useStore } from '../../store';
import { audio } from '../../audio';
import { portrait, characterFor } from '../../art';
import { fmtTime } from '../../../engine/util';
import type { VzRT } from '../../../engine/types';
import '../../styles/vagazero.css';

type Mood = 'neutro' | 'feliz' | 'triste' | 'bravo' | 'preocupado' | 'surpreso' | 'cansado';

const ENTER_MS = 1200;
const LINE_MS = 900;

/** humor do Saulo pela negociação */
function sauloMood(vz: VzRT): Mood {
  if (vz.state === 'fim') {
    if (vz.result === 'aceito') return vz.especial === 'cida' || vz.especial === 'henrique' ? 'triste' : vz.direto ? 'neutro' : 'cansado';
    if (vz.result === 'peixoto') return 'surpreso';
    if (vz.result === 'desviado') return vz.precisa ? 'preocupado' : 'feliz';
    return 'bravo';
  }
  if (vz.state === 'impasse') return 'bravo';
  if (vz.birra) return 'preocupado';
  if (vz.resistance >= 4) return 'bravo';
  if (vz.resistance >= 2) return 'cansado';
  return 'neutro';
}

function face(who: string, mood: Mood, size = 128): string {
  try {
    const id = who === 'SAULO' ? characterFor('SAULO') ?? 'PLANTONISTA' : characterFor(who);
    return id ? portrait(id, mood as never, { size }) : '';
  } catch {
    return '';
  }
}

const WHO_LABEL: Record<string, string> = {
  SAULO: 'Dr. Saulo · PS do Regional',
  'VOCÊ': 'Você',
  SIMONE: 'Simone',
  PEIXOTO: 'Dr. Peixoto',
  'HELOÍSA': 'Dra. Heloísa',
  'RÁDIO': 'Rádio',
  NARRADOR: '',
};

export function VagaZero() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const scr = sh.vzScreen();
  const vz = scr?.vz;
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState<null | { from: number; to: number }>(null);
  const [shown, setShown] = useState(0);
  const [fuseLeft, setFuseLeft] = useState(1);
  const lastVoiced = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const vzId = vz?.id;

  // entrada: o telefone toca, a vinheta fecha, o som afunda
  useEffect(() => {
    if (!vzId) return;
    setEntered(false);
    setShown(0);
    setExiting(null);
    lastVoiced.current = 0;
    audio.vagaZero(true, scr?.bpm ?? 60);
    const t = setTimeout(() => setEntered(true), ENTER_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vzId]);

  // o mundo volta quando a tela some (inclusive se o plantão acabar com ela aberta)
  useEffect(() => () => audio.vagaZero(false), []);

  // o pulso acompanha a resistência
  useEffect(() => {
    if (vz && !exiting) audio.vagaZero(true, scr!.bpm);
  }, [scr?.bpm, exiting, vz]);

  // as falas aparecem uma a uma (a voz do Saulo pelo fone)
  const total = vz?.log.length ?? 0;
  useEffect(() => {
    if (!vz || !entered || shown >= total || store.paused) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 200 : LINE_MS);
    return () => clearTimeout(t);
  }, [entered, shown, total, vz, s.paused]);
  useEffect(() => {
    if (!vz) return;
    for (let i = lastVoiced.current; i < Math.min(shown, vz.log.length); i++) {
      const l = vz.log[i];
      if (l.who === 'SAULO') {
        if (/\(crec\)/.test(l.text)) audio.vagaZeroSfx('crec');
        audio.voice(l.text.replace(/\([^)]*\)/g, ' '), 'homem', { channel: 'phone' });
      } else if (l.who === 'PEIXOTO') audio.voice(l.text.replace(/\([^)]*\)/g, ' '), 'peixoto');
      else if (l.who === 'SIMONE') audio.voice(l.text.replace(/\([^)]*\)/g, ' '), 'simone');
    }
    lastVoiced.current = Math.max(lastVoiced.current, shown);
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, vz]);

  const allShown = !!vz && shown >= total;
  const talking = vz?.state === 'negociando' && allShown && entered && !exiting;
  const ritmo = s.settings.ritmo || 1;
  const fuseSec = vz && vz.fuse > 0 && ritmo >= 1 ? vz.fuse : 0;
  const roundKey = vz ? `${vz.id}:${vz.round}:${vz.objection ?? ''}` : '';

  // o pavio: a fita do fax saindo devagar; acabou, o Saulo acha que caiu
  useEffect(() => {
    setFuseLeft(1);
    if (!talking || !fuseSec) return;
    const t0 = performance.now();
    let paused = 0;
    let pausedAt = 0;
    const iv = setInterval(() => {
      if (store.paused) {
        if (!pausedAt) pausedAt = performance.now();
        return;
      }
      if (pausedAt) {
        paused += performance.now() - pausedAt;
        pausedAt = 0;
      }
      const left = 1 - (performance.now() - t0 - paused) / (fuseSec * 1000);
      setFuseLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(iv);
        sh.vzTimeout();
        store.notify();
      }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, talking, fuseSec]);

  // resultado: som e, no direto (Odete, Henrique), fecha sozinho depois de alguns segundos
  const result = vz?.state === 'fim' ? vz.result : undefined;
  useEffect(() => {
    if (!result || !allShown) return;
    if (result === 'aceito' || result === 'peixoto') audio.vagaZeroSfx('resolve');
    else if (result === 'recusado') audio.vagaZeroSfx('busy');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, allShown]);
  useEffect(() => {
    if (!vz?.direto || !allShown || vz.state !== 'fim') return;
    const t = setTimeout(() => close(), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vz?.direto, allShown, vz?.state]);

  const mood = useMemo(() => (vz ? sauloMood(vz) : 'neutro'), [vz?.state, vz?.resistance, vz?.birra, vz?.result]);

  if (!vz || !scr) return null;

  const act = (f: () => boolean, stamp = true) => {
    if (!talking && vz.state === 'negociando') return;
    if (f()) {
      if (stamp) audio.vagaZeroSfx('stamp');
      store.notify();
    }
  };

  function close() {
    if (exiting || !vz || vz.state !== 'fim') return;
    const from = sh.sh.time;
    setExiting({ from, to: from + vz.minutes });
    audio.vagaZero(false);
    setTimeout(() => {
      sh.vzClose();
      store.notify();
    }, 900);
  }

  const lines = vz.log.slice(0, shown);
  const sauloSpeaking = lines.length > 0 && lines[lines.length - 1].who === 'SAULO' && !allShown;
  const especial = vz.especial === 'cida';
  const peixotoFace = vz.log.some((l, i) => i < shown && (l.who === 'PEIXOTO' || l.who === 'HELOÍSA'));
  const clock = exiting ? fmtTime(exiting.to) : scr.frozenAt;
  const won = result === 'aceito' || result === 'peixoto';

  return (
    <div className={'vz-veil' + (entered ? ' in' : '') + (exiting ? ' out' : '') + (especial ? ' cida' : '') + (result ? ' r-' + result : '')} role="dialog" aria-modal aria-label="Vaga zero: negociação com o Regional">
      <div className="vz-vignette" aria-hidden />
      <div className="vz-scene" aria-hidden />
      {especial && (
        <div className="vz-simone" aria-hidden>
          <img src={face('SIMONE', 'preocupado', 128)} alt="" width={128} height={128} />
        </div>
      )}
      <div className={'vz-clock' + (exiting ? ' jump' : '')} aria-label={`Relógio parado em ${clock}`}>
        {clock.split(':')[0]}
        <span className="vz-colon">:</span>
        {clock.split(':')[1]}
        {exiting && vz.minutes > 0 && <small>+{vz.minutes} min</small>}
      </div>

      <div className="vz-desk bezel">
        <header className="vz-head">
          <span className="vz-tag">VAGA ZERO</span>
          <span className="vz-pat">
            {vz.patient} · precisa de <b>{vz.recurso}</b>
          </span>
          <span className="vz-phone">☎ PS do Regional</span>
        </header>

        <div className="vz-body">
          <div className="vz-left">
            <div className={'vz-saulo' + (sauloSpeaking ? ' talking' : '') + (peixotoFace ? ' dim' : '')}>
              <img src={face('SAULO', mood, 128)} alt="" width={128} height={128} />
              <div className={'vz-breath b-' + scr.breath} title="A respiração dele no fone: rápida quando ele empaca, lenta quando cede">
                <i />
                <i />
                <i />
                <i />
                <i />
                <span>{scr.breath === 'rapida' ? 'respira rápido, empacado' : scr.breath === 'media' ? 'respira fundo' : 'respira devagar'}</span>
              </div>
            </div>
            {peixotoFace && (
              <div className="vz-peixoto">
                <img src={face(vz.log.some((l) => l.who === 'HELOÍSA') ? 'PLANTONISTA' : 'PEIXOTO', 'neutro', 128)} alt="" width={128} height={128} />
              </div>
            )}
          </div>

          <div className="vz-right">
            <div className="vz-log scroll-y" ref={logRef} aria-live="polite">
              {lines.map((l, i) => (
                <p key={i} className={'vz-line w-' + l.who.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}>
                  {WHO_LABEL[l.who] !== '' && <b>{WHO_LABEL[l.who] ?? l.who}</b>}
                  <span>{l.text}</span>
                </p>
              ))}
            </div>

            {vz.state === 'negociando' && (
              <>
                {fuseSec > 0 && (
                  <div className={'vz-fuse' + (talking ? '' : ' idle')} aria-hidden>
                    <div style={{ width: `${fuseLeft * 100}%` }} />
                  </div>
                )}
                <div className={'vz-cards' + (talking ? ' ready' : '')}>
                  {vz.cards.map((c, i) => (
                    <button key={c.id} className={'vz-card' + (c.hint ? ' hint' : '')} disabled={!talking} onClick={() => act(() => sh.vzChoose(c.id))} style={{ ['--i' as string]: String(i) }}>
                      {c.hint && <em className="vz-postit">Simone: esse.</em>}
                      <span>“{c.text}”</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {vz.state === 'impasse' && allShown && (
              <div className="vz-impasse">
                <p>Sem acordo. A viatura vai ficar com a maca presa no Regional até sair vaga.</p>
              </div>
            )}

            {vz.state === 'fim' && allShown && (
              <div className={'vz-result' + (won ? ' ok' : ' bad')}>
                <b>
                  {result === 'aceito'
                    ? vz.direto
                      ? 'Recebido.'
                      : '“Manda.”'
                    : result === 'peixoto'
                      ? 'Recebido pela coordenação.'
                      : result === 'desviado'
                        ? 'Desviado para a UPA Norte.'
                        : 'Sem vaga zero.'}
                </b>
                <span>
                  {won
                    ? 'A maca da viatura sai logo depois da entrega.'
                    : result === 'desviado'
                      ? vz.precisa
                        ? `A UPA não tem ${vz.recurso}. Vai custar uma transferência.`
                        : 'A UPA dá conta. O Saulo agradece.'
                      : 'A viatura fica presa no Regional (40 a 60 min). O rádio avisa a cada 20 min, se der para tentar de novo.'}
                </span>
                <button className="px-btn primary" autoFocus onClick={close} disabled={!!exiting}>
                  Voltar à central{vz.minutes > 0 ? ` (o relógio anda ${vz.minutes} min)` : ''}
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="vz-foot">
          {vz.peixoto !== 'indisponivel' && vz.state !== 'fim' && (
            <button
              className={'px-btn vz-escala' + (vz.peixoto === 'aceso' ? ' lit' : '')}
              disabled={vz.peixoto !== 'aceso' || !allShown || !!exiting}
              title={
                vz.peixoto === 'usado'
                  ? 'A coordenação já negociou uma vaga zero hoje (uma por plantão).'
                  : vz.peixoto === 'apagado'
                    ? 'Só quando o colega empacar ou desrespeitar a regulação. Uma vez por plantão.'
                    : 'Passa o caso para a coordenação. Uma vez por plantão.'
              }
              onClick={() => act(() => sh.vzPeixoto(), false)}
            >
              ☎ {vz.peixotoLabel}
              <small>{vz.peixoto === 'usado' ? 'já usado hoje' : '1× por plantão'}</small>
            </button>
          )}
          {vz.state === 'impasse' && allShown && (
            <button className="px-btn warm" disabled={!!exiting} onClick={() => act(() => sh.vzDesistir(), false)}>
              Desligar: a viatura espera a maca
            </button>
          )}
          {vz.state !== 'fim' && (
            <button className="px-btn ghost small vz-upa" disabled={!allShown || !!exiting} onClick={() => act(() => sh.vzDesviar(), false)} title="Certo só quando o caso não precisa do que só o Regional tem">
              Desviar pra UPA Norte
            </button>
          )}
          <span className="vz-hint">O relógio da central está parado.</span>
        </footer>
      </div>
    </div>
  );
}
