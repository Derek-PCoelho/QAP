import { useState } from 'react';
import { store, useStore } from '../../store';
import { fmtTime } from '../../../engine/util';
import { SHIFT_START, SHIFT_END } from '../../../engine/shift';
import { audio } from '../../audio';
import { Icon } from '../../ui/Icon';

export function TopBar({ onPhoto }: { onPhoto: () => void }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const S = sh.sh;
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const prog = Math.max(0, Math.min(1, (S.time - SHIFT_START) / (SHIFT_END - SHIFT_START)));
  const day = g.dayDef();
  const limit = sh.warningLimit();
  const eff = sh.effectiveWarnings();
  const goal = day?.goal;
  const showMetrics = g.st.day >= 5 || g.st.mode === 'infinito';
  const idx = sh.efficiency();
  const desg = g.st.vars.desgaste;
  // copo de café: medidor visual de cansaço (quanto mais cansado, mais vazio)
  const cupLevel = Math.max(0, Math.min(1, 1 - desg / 100));
  const inf = g.st.infinite;
  return (
    <header className="topbar">
      <div className="tb-id">
        <span className="tb-samu">
          REGULAÇÃO
          {S.semSono && (
            <span className="tb-sono" title="Você emendou uma noite na ambulância e dormiu três horas. O café segura os cochilos por duas horas.">
              dormiu 3 h
            </span>
          )}
        </span>
        <span className="tb-day">
          {inf ? `Infinito · turno ${inf.shifts}` : `Dia ${g.st.day} · ${day?.title ?? ''}`}
        </span>
      </div>
      <div className="tb-clock">
        <span className={'clock' + (S.closing ? ' late' : '')}>{fmtTime(S.time)}</span>
        <div className="shift-bar" aria-label="Progresso do turno">
          <div style={{ width: `${prog * 100}%` }} />
        </div>
      </div>
      <div className="tb-warn" title="Advertências neste plantão (2 notas de auditoria = 1 advertência)">
        <span className="lbl">Advertências</span>
        <span className="slots">
          {Array.from({ length: limit }).map((_, i) => (
            <i key={i} className={i < eff ? 'on' : ''} />
          ))}
        </span>
        <span className="notes">{S.notes % 2 === 1 ? '+½ nota' : ''}</span>
      </div>
      {inf && (
        <div className="tb-score">
          <b>{inf.score}</b> pts · seq. {inf.streak}
        </div>
      )}
      {showMetrics && (
        <div className="tb-metrics screen" title="Painel de metas da Saúde+ Gestão">
          <div className="m-logo">Saúde+</div>
          <div className="m-row">
            USA hoje{' '}
            <b className={goal && S.usaSent > goal.maxUSA ? 'bad' : 'ok'}>
              {S.usaSent}
              {goal ? `/${goal.maxUSA}` : ''}
            </b>
          </div>
          <div className="m-row">
            Custo <b>R$ {S.costToday.toLocaleString('pt-BR')}</b>
          </div>
          <div className="m-row">
            Índice <b className={idx >= 70 ? 'ok' : idx >= 45 ? 'mid' : 'bad'}>{idx}</b> <span className="face">{idx >= 70 ? ':)' : idx >= 45 ? ':|' : ':('}</span>
          </div>
        </div>
      )}
      <div className="tb-desk">
        <button
          className="desk-obj thermos"
          title={S.coffee >= 2 ? 'Garrafa vazia (máx. 2 copos)' : 'Café: perguntas 30% mais rápidas por 2h. Em casa você chega irritado.'}
          disabled={S.coffee >= 2}
          onClick={() => {
            if (sh.coffee()) audio.sfx('coffee');
            store.notify();
          }}
        >
          <Icon name={S.coffee >= 2 ? 'cafe_vazio' : 'cafe'} scale={2} />
          <span>{2 - S.coffee}</span>
        </button>
        <div className="cup" title="Seu cansaço" aria-label="Cansaço">
          <div className="cup-liquid" style={{ height: `${cupLevel * 100}%` }} />
        </div>
        <button
          className="desk-obj photo"
          title="Foto da família"
          onClick={() => {
            const m = sh.photo();
            setPhotoMsg(m);
            audio.sfx('photo');
            onPhoto();
            setTimeout(() => setPhotoMsg(null), 3200);
            store.notify();
          }}
        >
          <Icon name="foto" scale={2} />
        </button>
      </div>
      {photoMsg && <div className="photo-msg">{photoMsg}</div>}
    </header>
  );
}
