// Interlúdio em casa: cena da família, folga, contas e loja.
import { useEffect, useMemo, useState } from 'react';
import { store, useStore } from '../../store';
import { ArtCanvas } from '../../ui/ArtCanvas';
import { drawScene, familyMarks } from '../../art';
import type { FamilyMember, SceneBg, MemberStatus } from '../../../engine/types';
import { HomeDialogue } from './HomeDialogue';
import { TimeOff } from './TimeOff';
import { Intervencao } from './Intervencao';
import { Bills } from './Bills';
import { Shop } from './Shop';
import { Icon } from '../../ui/Icon';
import { Portrait } from '../../ui/Portrait';
import { audio } from '../../audio';
import { spouseName, SON_NAME } from '../../../engine/text';

const STATUS_PT: Record<MemberStatus, string> = {
  bem: 'Bem',
  fome: 'Com fome',
  frio: 'Com frio',
  doente: 'Doente',
  triste: 'Triste',
  critico: 'Crítico',
  internado: 'Internada',
  ausente: 'Fora de casa',
  morto: 'Falecida',
};

/**
 * O que a narração de algumas cenas põe em cena e a arte precisa mostrar
 * (adereços e poses), para a imagem bater com o texto.
 */
const STAGING: Record<string, { objects?: string[]; pose?: Partial<Record<'LUCIA' | 'DAVI' | 'ZELIA', 'em_pe' | 'sentado' | 'deitado'>> }> = {
  // "Tem bolo de fubá na mesa e uma vela de aniversário reaproveitada, espetada torta."
  d01_bolo: { objects: ['bolo', 'vela'] },
  // "Liam na cama. A bombinha do lado do travesseiro."
  d09_noite: { objects: ['bombinha'], pose: { DAVI: 'deitado' } },
  // "Tem bolo na mesa."
  d15_aniversario: { objects: ['bolo'] },
};

/** estado com a concordância de quem é (o Liam, e o Alex quando a protagonista é mulher, no masculino) */
function statusLabel(s: MemberStatus, male: boolean): string {
  if (male && s === 'internado') return 'Internado';
  if (male && s === 'morto') return 'Falecido';
  return STATUS_PT[s];
}

export function Home() {
  const s = useStore();
  const g = s.game!;
  const home = g.home!;
  const st = g.st;
  const h = st.home!;
  const sc = home.scene();
  const [inspect, setInspect] = useState(false);
  const blend = Math.max(0, Math.min(1, (st.vars.desgaste - 35) / 65));

  useEffect(() => {
    audio.updateHomeMusic(st.vars.lacos / 10, st.vars.desgaste);
  }, [st.vars.lacos, st.vars.desgaste]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      // pausado, o TAB navega o menu de pausa: não liga o Modo Inconsistência (que custa Laços à toa)
      if (store.paused) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        if (h.step === 'cena' || h.step === 'pre') toggleInspect();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const toggleInspect = () => {
    const on = !inspect;
    setInspect(on);
    if (on) {
      const msg = home.markInspect();
      if (msg) store.toast(msg, 'ruim');
      audio.sfx('paper');
    }
    store.notify();
  };

  const bg: SceneBg = (h.step === 'cena' || h.step === 'pre') && sc?.bg ? sc.bg : 'cozinha';
  const objects = useMemo(() => {
    const o = new Set<string>(['cracha']);
    if (st.flags['desenho_geladeira'] || st.day >= 2) o.add('desenhos');
    if (st.flags['maquina']) o.add('maquina');
    if (st.flags['geladeira_quebrada'] && !st.flags['geladeira_ok']) o.add('geladeira_quebrada');
    else o.add('geladeira_ok');
    if (h.bought.includes('isopor')) o.add('isopor');
    if (st.flags['bombinha']) o.add('bombinha');
    if (st.bills.foodMissed > 0) o.add('mesa_vazia');
    if ((h.step === 'cena' || h.step === 'pre') && sc?.inspect) for (const ob of sc.inspect.objects) o.add(ob.id);
    if ((h.step === 'cena' || h.step === 'pre') && sc) for (const id of STAGING[sc.id]?.objects ?? []) o.add(id);
    return [...o];
  }, [st.flags, h.bought, h.step, sc, st.day, st.bills.foodMissed]);

  const castIds = (sc?.cast ?? ['LUCIA', 'DAVI', 'ZELIA']).filter((c) => ['LUCIA', 'DAVI', 'ZELIA'].includes(c)) as ('LUCIA' | 'DAVI' | 'ZELIA')[];
  const memberOf: Record<string, FamilyMember> = { LUCIA: 'lucia', DAVI: 'davi', ZELIA: 'zelia' };
  // o cônjuge é o id LUCIA no conteúdo; na arte, com a protagonista mulher, é o Alex
  const artId = (c: 'LUCIA' | 'DAVI' | 'ZELIA') => (c === 'LUCIA' && st.gender === 'F' ? ('ALEX' as const) : c);
  const present = castIds.filter((c) => {
    const m = st.family[memberOf[c]];
    return m.status !== 'ausente' && m.status !== 'morto' && !m.away;
  });
  // cada um no seu lugar do cômodo (marcação de palco), longe da caixa de diálogo
  const marks = familyMarks(bg, present.map(artId));
  const staged = (h.step === 'cena' || h.step === 'pre') && sc ? STAGING[sc.id]?.pose : undefined;
  const cast = present.map((c, i) => ({ id: artId(c), pose: staged?.[c] ?? (c === 'ZELIA' ? ('sentado' as const) : ('em_pe' as const)), x: marks[i], status: st.family[memberOf[c]].status }));

  return (
    <div className={'home' + (inspect ? ' inspecting' : '') + (h.step === 'pre' || h.step === 'cena' || h.step === 'escolha' ? ' dlg-open' : '')}>
      <ArtCanvas w={320} h={180} scale={4} animate fps={8} draw={(ctx, t) => drawScene(ctx, { bg, blend, objects, cast: bg === 'preto' ? [] : cast, ozzy: h.ozzy ? 'dormindo' : 'sentado', time: t })} className="home-art" />
      <header className="home-top">
        <div className="fam">
          {(['lucia', 'davi', 'zelia'] as FamilyMember[]).map((m) => {
            const f = st.family[m];
            const id = m === 'lucia' ? (st.gender === 'F' ? 'ALEX' : 'LUCIA') : m === 'davi' ? 'DAVI' : 'ZELIA';
            const male = m === 'davi' || (m === 'lucia' && st.gender === 'F');
            return (
              <div key={m} className={'fam-m s-' + f.status} title={statusLabel(f.status, male)}>
                <Portrait id={id as never} size={64} mood={f.status === 'bem' ? 'neutro' : f.status === 'triste' ? 'triste' : 'preocupado'} blend={blend} />
                <div>
                  <b>{m === 'lucia' ? spouseName(st.gender) : m === 'davi' ? SON_NAME : 'Dona Zélia'}</b>
                  <span>
                    {f.status !== 'bem' && <Icon name={f.status} scale={1} />} {statusLabel(f.status, male)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="home-money">
          <span>Saldo</span>
          <b className={st.money < 0 ? 'neg' : ''}>R$ {st.money}</b>
          {st.bills.rentOverdue > 0 && <small>{st.bills.rentOverdue} aluguel(is) atrasado(s)</small>}
        </div>
        <div className="home-day">
          Noite do dia {st.day}
          {st.irritado > 0 && <small>Você chegou {st.gender === 'M' ? 'irritado' : 'irritada'} (café).</small>}
        </div>
      </header>

      {(h.step === 'pre' || h.step === 'cena') && <HomeDialogue inspect={inspect} toggleInspect={toggleInspect} />}
      {h.step === 'escolha' && <TimeOff />}
      {h.step === 'intervencao' && <Intervencao />}
      {h.step === 'contas' && <Bills />}
      {h.step === 'loja' && <Shop />}
      <div className="home-toasts">
        {home.toasts.slice(-4).map((t, i) => (
          <div key={home.toasts.length - 4 + i} className={'toast ' + t.kind}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
