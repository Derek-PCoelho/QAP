// Barra superior da campanha da Simone: relógio, TMA, pressão e advertências.
import { useStore } from '../../store';
import { fmtTime } from '../../../engine/util';
import { SHIFT_START, SHIFT_END } from '../../../engine/shift';
import { SIMONE_TMA_GOAL } from '../../../engine/simone';

export function SimoneTopBar() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const S = sh.sh;
  const T = S.tarm!;
  const prog = Math.max(0, Math.min(1, (S.time - SHIFT_START) / (SHIFT_END - SHIFT_START)));
  const day = g.dayDef();
  const goal = g.c.simone?.days[g.st.day]?.tmaGoal ?? SIMONE_TMA_GOAL;
  const tma = T.passed ? T.handleSum / T.passed : 0;
  const limit = g.st.difficulty === 'real' ? 2 : 3;
  const p = g.st.vars.pressao;
  return (
    <header className="topbar tarm-top">
      <div className="tb-id">
        <span className="tb-samu">REGULAÇÃO · TARM</span>
        <span className="tb-day">
          Dia {g.st.day} · {day?.title ?? ''} · Simone
        </span>
      </div>
      <div className="tb-clock">
        <span className={'clock' + (S.closing ? ' late' : '')}>{fmtTime(S.time)}</span>
        <div className="shift-bar" aria-label="Progresso do turno">
          <div style={{ width: `${prog * 100}%` }} />
        </div>
      </div>
      <div className="tb-warn" title="Advertências da OS acumuladas na campanha">
        <span className="lbl">Advertências</span>
        <span className="slots">
          {Array.from({ length: limit }).map((_, i) => (
            <i key={i} className={i < g.st.totals.warnings ? 'on' : ''} />
          ))}
        </span>
      </div>
      <div className="tb-metrics screen" title="Painel da Saúde+ Gestão: tempo médio de atendimento da TARM">
        <div className="m-logo">Saúde+</div>
        <div className="m-row">
          TMA <b className={!T.passed ? 'ok' : tma <= goal ? 'ok' : tma <= goal * 1.5 ? 'mid' : 'bad'}>{T.passed ? Math.round(tma) : '—'}</b> / meta {goal} min
        </div>
        <div className="m-row">
          Passadas <b>{T.passed}</b>
        </div>
      </div>
      <div className="tb-pressure" title="Pressão arterial (a Simone não trata direito)">
        <span className="lbl">Pressão</span>
        <span className="pbar">
          {Array.from({ length: 10 }).map((_, i) => (
            <i key={i} className={i < p ? (p >= 8 ? 'on hi' : p >= 6 ? 'on mid' : 'on') : ''} />
          ))}
        </span>
        <span className="money">R$ {g.st.money}</span>
      </div>
    </header>
  );
}
