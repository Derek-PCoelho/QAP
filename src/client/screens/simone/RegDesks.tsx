// As duas mesas de regulação vistas da cadeira da TARM.
import { useStore } from '../../store';
import { fmtTime, hm } from '../../../engine/util';
import type { RegId } from '../../../engine/types';
import { Portrait } from '../../ui/Portrait';

function henriqueMood(day: number, time: number): string {
  if (day >= 12 && day <= 13) return 'de cabeça baixa, olhando a ficha da sindicância';
  if (time >= hm('17:30')) return 'a fala arrastando no telefone';
  if (time >= hm('15:00')) return 'cheiro de bala de menta e de outra coisa';
  if (time >= hm('12:00')) return 'voltou do almoço mais calado';
  return 'rápido, seco, sem tirar os olhos da tela';
}

export function RegDesks() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const T = sh.sh.tarm!;
  const now = sh.sh.time;
  const row = (id: RegId) => {
    const R = T.regs[id];
    const cur = R.current ? sh.sh.calls[R.current] : undefined;
    const curName = cur ? sh.defOf(cur).patient.name : undefined;
    const pid = id === 'moura' ? (g.st.gender === 'M' ? 'EU_M' : 'EU_F') : 'HENRIQUE';
    return (
      <div key={id} className={'reg-row' + (R.away ? ' away' : '') + (cur ? ' busy' : '')}>
        <Portrait id={pid as never} size={64} mood={id === 'henrique' && now >= hm('15:00') ? 'cansado' : 'neutro'} />
        <div className="reg-info">
          <b>{id === 'moura' ? `Mesa 1 · ${g.st.gender === 'M' ? 'Dr. Moura' : 'Dra. Moura'}` : 'Mesa 2 · Dr. Henrique'}</b>
          {R.away ? (
            <span>fora da mesa hoje</span>
          ) : cur ? (
            <span>
              regulando {curName} · ~{Math.max(0, Math.ceil(R.busyUntil - now))} min
            </span>
          ) : (
            <span>livre</span>
          )}
          <small>
            {R.queue.length ? `${R.queue.length} esperando` : 'ninguém esperando'}
            {id === 'henrique' && !R.away ? ` · ${henriqueMood(g.st.day, now)}` : ''}
          </small>
        </div>
      </div>
    );
  };
  return (
    <section className="reg-desks bezel" aria-label="Mesas de regulação">
      {row('moura')}
      {row('henrique')}
      <div className="reg-log screen scroll-y">
        {T.log.slice(-6).map((l, i) => (
          <p key={i}>
            <span className="t">{fmtTime(l.t)}</span> {l.text}
          </p>
        ))}
        {T.out && <p className="out">Você está fora da mesa.</p>}
      </div>
    </section>
  );
}
