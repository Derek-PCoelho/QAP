import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { store, useStore } from '../store';
import { verdictLabel } from '../../engine/grading';
import { FIXED_PAY, PRODUCTIVITY_BONUS } from '../../engine/shift';
import { fmtTime } from '../../engine/util';
import { protagonistName } from '../../engine/text';
import { audio } from '../audio';
import { api } from '../api';

const SIMONE_V: Record<string, string> = {
  correto: 'cor certa',
  trote_ok: 'trote: azul',
  falta: 'subestimou',
  excesso: 'superestimou',
  pendente: 'cobertura',
  noturno: 'noturno',
  desligou: 'desistiu',
};

const OUT: Record<string, string> = {
  salvo: 'vivo',
  obito: 'óbito',
  orientado: 'orientado',
  trote: 'trote',
  liberado: 'liberado no local',
  sequela: 'sequela',
  piorou: 'piorou',
  transportado: 'transportado',
  pendente: '—',
};

export function Report() {
  const s = useStore();
  const g = s.game!;
  const rec = g.st.history[g.st.history.length - 1];
  const simone = g.st.mode === 'simone';
  const field = simone ? undefined : g.reportField();
  const chosen = field ? (g.st.flags['report_' + field.id] as string | undefined) : undefined;
  const [mourned, setMourned] = useState(false);
  const [printed, setPrinted] = useState(0);
  const paperRef = useRef<HTMLDivElement>(null);
  // o papel sai da impressora: acompanha a última linha
  useLayoutEffect(() => {
    const el = paperRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [printed]);
  const sh = g.shift;
  // recarregado de save no relatório não há ShiftSim, mas o estado do turno está no save
  const S = sh?.sh ?? g.st.shift;
  const lines = rec?.report ?? [];
  useEffect(() => {
    audio.sfx('type');
    const t = setInterval(() => setPrinted((p) => (p > lines.length + 4 ? p : p + 1)), 140);
    return () => clearInterval(t);
  }, [lines.length]);
  if (!rec) return null;
  // rec.bonus já vem com a glosa descontada (teto do bônus): a linha do bônus mostra o valor bruto
  // para a conta fechar (fixo + bônus − glosa − descontos = líquido)
  const glosa = (S?.flags['glosa'] as number) || 0;
  const inf = g.st.infinite;
  const go = !!g.st.gameOver;
  const needField = !!field && !chosen;
  const deaths = lines.filter((l) => l.outcome === 'obito');

  const submitInfinite = () => {
    if (!inf) return;
    store.recordInfinite(inf.score);
    api.submitScore({ name: store.settings.playerName || 'Regulador', score: inf.score, calls: inf.calls, correct: inf.correct, seed: inf.seedLabel, mode: 'infinito', version: '1.0.4', profileId: store.settings.profileId });
    api.track('infinite_end', { score: inf.score, calls: inf.calls });
  };

  return (
    <div className="report-screen">
      <div className="printer">
        <div ref={paperRef} className="printout paper">
          <div className="holes left" />
          <div className="holes right" />
          <pre className="pr-head">
            {simone
              ? `SAÚDE+ GESTÃO · REGULAÇÃO SANTA AURORA
RELATÓRIO DE TURNO DA TARM — DIA ${rec.day}
SIMONE APARECIDA CAMPOS · 07:00–19:00`
              : `SAÚDE+ GESTÃO · REGULAÇÃO SANTA AURORA
RELATÓRIO DE PLANTÃO — ${inf ? `INFINITO · TURNO ${inf.shifts}` : `DIA ${rec.day}`}
${protagonistName(g.st.gender).toUpperCase()} · 07:00–19:00`}
            {`
--------------------------------------------------------------`}
          </pre>
          <table className="pr-table">
            <tbody>
              {lines.slice(0, printed).map((l) => (
                <tr key={l.callId} className={'v-' + l.verdict + ' o-' + l.outcome}>
                  <td className="t">{fmtTime(l.t)}</td>
                  <td className="n">
                    {l.name}
                    <small>{l.dx}</small>
                  </td>
                  <td className="d">{l.decision}</td>
                  <td className="v">{simone ? (SIMONE_V[l.verdict] ?? l.verdict) : l.verdict === 'noturno' ? 'noturno' : l.verdict === 'desligou' ? 'desistiu' : l.verdict === 'pendente' ? '—' : verdictLabel(l.verdict)}</td>
                  <td className="o">{OUT[l.outcome] ?? l.outcome}</td>
                  <td className={'m' + (l.money < 0 ? ' neg' : '')}>{l.money ? (l.money > 0 ? '+' : '') + l.money : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {printed > lines.length && (
            <div className="pr-sum">
              {simone ? (
                <>
                  <pre>{`--------------------------------------------------------------
Salário do turno (TARM) .............................. R$ ${rec.pay - rec.bonus + rec.deductions}
Meta de tempo médio (TMA) ............................ R$ ${rec.bonus}
Descontos (advertências da OS) ....................... −R$ ${rec.deductions}
--------------------------------------------------------------
LÍQUIDO DO TURNO ..................................... R$ ${rec.pay}
Saldo em conta ....................................... R$ ${g.st.money}
Pré-triagens: ${rec.handled}${g.simoneResult ? ` · na cor certa: ${g.simoneResult.right} · abaixo da gravidade: ${g.simoneResult.under} · acima: ${g.simoneResult.over}` : ''} · Óbitos no turno: ${rec.deaths}`}</pre>
                  {(g.simoneResult?.notes ?? []).map((n, i) => (
                    <p key={i} className="pr-note">
                      {n}
                    </p>
                  ))}
                </>
              ) : (
              <pre>{`--------------------------------------------------------------
Plantão fixo ......................................... R$ ${FIXED_PAY}
Bônus (regulações, hora de ouro, metas) .............. R$ ${rec.bonus + glosa}${S?.flags['produtividade'] ? `\n  (inclui produtividade +R$ ${PRODUCTIVITY_BONUS})` : ''}${S?.goalMet && (g.dayDef()?.goal?.bonus ?? 0) > 0 ? '\n  (inclui meta de economia do painel)' : ''}${glosa ? `\nGlosa da OS ("ajuste de produtividade") ............ −R$ ${glosa}` : ''}
Descontos (notas e advertências) ..................... −R$ ${rec.deductions}
--------------------------------------------------------------
LÍQUIDO DO PLANTÃO ................................... R$ ${rec.pay}
Saldo em conta ....................................... R$ ${g.st.money}
Advertências: ${rec.warnings} · Notas de auditoria: ${rec.notes} · Óbitos: ${rec.deaths}${S?.video && S.video.used ? `\nVideoatendimentos (Programa VER): ${S.video.used} · trotes comprovados: ${S.video.proofs} · ${Math.round(S.video.minutes)} min de vídeo` : ''}${S?.semSono ? `\nDormiu 3 h (noite na ambulância) · cochilos na mesa: ${S.cochilos ?? 0}` : ''}`}</pre>
              )}
              {S?.flags['metaSuja'] && <p className="pr-note">Meta de economia batida às custas de um paciente. Isso não sai no painel.</p>}
            </div>
          )}
        </div>
      </div>
      <aside className="report-side">
        <h2>{inf ? `Turno ${inf.shifts}` : `Fim do dia ${rec.day}`}</h2>
        {inf && (
          <p className="inf-score">
            {inf.score} pontos
            <small>
              {inf.correct}/{inf.calls} acertos · melhor sequência {inf.bestStreak}
            </small>
          </p>
        )}
        {field && (
          <fieldset className="report-field">
            <legend>{field.label}</legend>
            {field.options
              .filter((o) => !o.when || o.when(g.ctx()))
              .map((o) => (
                <button key={o.id} className={'px-btn small' + (chosen === o.id ? ' primary' : '')} disabled={!!chosen} onClick={() => g.chooseReportField(o.id)}>
                  {o.label}
                </button>
              ))}
          </fieldset>
        )}
        {deaths.length > 0 && !inf && (
          <div className="mourn">
            <p>
              {deaths.length === 1 ? 'Um nome' : `${deaths.length} nomes`} com uma cruz no diário hoje.
            </p>
            <button
              className="px-btn small ghost"
              disabled={mourned || !!g.st.flags['luto_d' + g.st.day]}
              onClick={() => {
                if (g.mourn()) setMourned(true);
              }}
            >
              {mourned || g.st.flags['luto_d' + g.st.day] ? 'Você ficou um minuto em silêncio.' : 'Ficar um minuto em silêncio'}
            </button>
          </div>
        )}
        {go ? (
          <button className="px-btn danger" onClick={() => (inf && submitInfinite(), g.setPhase('gameover'))}>
            Continuar
          </button>
        ) : (
          <button className="px-btn primary" disabled={needField} onClick={() => (inf && submitInfinite(), g.toHome())}>
            {inf ? 'Próximo turno' : g.st.day >= 20 ? 'Sair da central' : 'Ir para casa'}
          </button>
        )}
        {needField && <small>Preencha a justificativa antes de sair.</small>}
      </aside>
    </div>
  );
}
