import { store, useStore } from '../../store';
import { FIELD_BASE, FIELD_PAY_OK, FIELD_WEAR, FIELD_CASES, FIELD_SLEEP_DEBT } from '../../../engine/field';
import { audio } from '../../audio';
import { api } from '../../api';

export function TimeOff() {
  const s = useStore();
  const g = s.game!;
  const home = g.home!;
  const fam = g.dayDef()?.interlude?.familyLacos ?? 1;
  const desg = Math.round(g.st.vars.desgaste);
  // noite seguida à de ontem custa mais (dívida de sono)
  const seguidas = Number(g.st.flags['noites_seguidas']) || 0;
  const wear = FIELD_WEAR + FIELD_SLEEP_DEBT * seguidas;
  const pick = (k: 'descanso' | 'familia' | 'bico') => {
    home.chooseTimeOff(k);
    if (k === 'bico') api.track('bico', { day: g.st.day });
    audio.sfx('door');
    store.notify();
  };
  return (
    <div className="timeoff">
      <p className="teaser">{home.teaser()}</p>
      <h2>Como usar a folga de 36 horas?</h2>
      <div className="to-cards">
        <button className="to-card" onClick={() => pick('descanso')}>
          <b>Descansar</b>
          <span>Dormir de verdade. O cansaço cai bastante.</span>
          <small>Desgaste −15</small>
        </button>
        <button className="to-card warm" onClick={() => pick('familia')}>
          <b>Ficar com a família</b>
          <span>Estar presente no que acontecer hoje.</span>
          <small>
            Laços +{fam} · Desgaste −10
          </small>
        </button>
        <button className="to-card cold" disabled={!home.canBico()} onClick={() => pick('bico')}>
          <b>Plantão extra na ambulância</b>
          <span>Meio plantão na USA 01, das 19h à 1h, com o Seu Bené. O que acontecer em casa vai se resolver sem você, e você dorme três horas antes da Regulação.</span>
          <small>
            {home.tooTiredForField()
              ? 'O Bené olha pra você e diz que hoje não: desgaste alto demais.'
              : `+R$ ${FIELD_BASE} a ${FIELD_BASE + FIELD_CASES * FIELD_PAY_OK} · Desgaste +${wear}${seguidas ? ` (${seguidas + 1}ª noite seguida)` : ''} · cochilos amanhã · perde o evento`}
          </small>
          {home.canBico() && desg >= 60 && <small className="to-warn">Desgaste em {desg}: uma noite ruim (óbitos, equipe ferida) pode levar ao colapso.</small>}
        </button>
      </div>
    </div>
  );
}
