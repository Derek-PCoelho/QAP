import { useEffect, useState } from 'react';
import { protagonistFirst } from '../../engine/text';
import { store, useStore } from '../store';
import { ArtCanvas } from '../ui/ArtCanvas';
import { drawEnding } from '../art';
import { keysSaved, KEY_PATIENTS } from '../../engine/endings';
import { audio } from '../audio';

/** a Jacquard (gótica) fica ilegível em maiúsculas: título em caixa de frase */
export function readableTitle(s: string): string {
  if (!s || s !== s.toUpperCase()) return s;
  const low = s.toLocaleLowerCase('pt-BR');
  return low.charAt(0).toLocaleUpperCase('pt-BR') + low.slice(1);
}

const ART_SIMONE: Record<string, string[]> = {
  bom: ['mural', 'cracha_prego'],
  normal: ['cracha_prego', 'mural'],
  ruim: ['quarto_alugado', 'telefone_escuro'],
  secreto: ['telefone_escuro', 'mural'],
};

const ART: Record<string, string[]> = {
  bom: ['bolo_porta', 'desenho_davi'],
  normal: ['mural', 'cracha_prego'],
  ruim: ['quarto_alugado', 'telefone_escuro'],
  secreto: ['escritorio_ar', 'desenho_cadeira'],
};

export function Ending() {
  const s = useStore();
  const g = s.game!;
  const st = g.st;
  const [n, setN] = useState(1);
  const [stage, setStage] = useState<'texto' | 'fios' | 'fim'>('texto');

  if (!st.ending && st.flags['cadeira_oferecida']) {
    const lines = g.chairText();
    return (
      <div className="ending chair">
        <ArtCanvas w={320} h={180} scale={4} animate fps={6} draw={(ctx, t) => drawEnding(ctx, 'escritorio_ar', { time: t, gender: st.gender, blend: 1, name: protagonistFirst(st.gender, st) })} className="end-art" />
        <div className="end-text bezel">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
          <div className="end-actions">
            <button className="px-btn danger" onClick={() => g.decideChair('assinar')}>
              Assinar o Plano de Otimização
            </button>
            <button className="px-btn primary" onClick={() => g.decideChair('recusar')}>
              Recusar e voltar para o telefone
            </button>
          </div>
        </div>
      </div>
    );
  }
  const e = st.ending;
  if (!e) return null;
  const simone = st.mode === 'simone';
  const arts = (simone ? ART_SIMONE[e.kind] : ART[e.kind]) ?? ART.normal;
  const title = e.lines[0];
  const body = e.lines.slice(1);
  const artId = stage === 'texto' && n < body.length / 2 ? arts[0] : arts[1];
  return (
    <div className={'ending k-' + e.kind}>
      <ArtCanvas w={320} h={180} scale={4} animate fps={6} draw={(ctx, t) => drawEnding(ctx, artId as never, { time: t, gender: st.gender, blend: e.kind === 'secreto' ? 1 : 0, name: protagonistFirst(st.gender, st) })} className="end-art" />
      {artId === 'desenho_davi' && !simone && <div className="kid-title">{st.gender === 'M' ? 'Meu pai salva as pessoas pelo telefone' : 'Minha mãe salva as pessoas pelo telefone'}</div>}
      {stage === 'texto' && (
        <div className="end-text bezel">
          <h1>{readableTitle(title)}</h1>
          {body.slice(0, n).map((l, i) => (
            <p key={i} className="fade-in">
              {l}
            </p>
          ))}
          <div className="end-actions">
            {n < body.length ? (
              <button className="px-btn small" autoFocus onClick={() => (setN(n + 1), audio.sfx('page'))}>
                Continuar
              </button>
            ) : (
              <button className="px-btn primary small" onClick={() => setStage('fios')}>
                O que aconteceu depois
              </button>
            )}
          </div>
        </div>
      )}
      {stage === 'fios' && (
        <div className="end-threads">
          <h2>{e.kind === 'normal' ? 'Fotos no mural' : 'Depois'}</h2>
          <div className="threads">
            {e.threads.map((t) => (
              <div key={t.id} className={'thread-card' + (t.ok ? ' ok' : ' bad')}>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
          {simone ? (
            <div className="end-stats">
              <span>{st.history.length} turnos</span>
              <span>{st.totals.handled} pré-triagens</span>
              <span>{st.totals.deaths} óbitos nas mesas</span>
              <span>Saldo final R$ {st.money}</span>
            </div>
          ) : (
          <div className="end-stats">
            <span>{st.history.length} {st.history.length === 1 ? 'plantão' : 'plantões'}</span>
            <span>{st.totals.saves} vidas salvas em vermelho</span>
            <span>{st.totals.deaths} óbitos</span>
            <span>
              {keysSaved(st)} de {KEY_PATIENTS.length} pacientes-chave
            </span>
            <span>Saldo final R$ {st.money}</span>
          </div>
          )}
          <div className="end-actions">
            <button className="px-btn ghost" onClick={() => store.setScreen('creditos')}>
              Créditos
            </button>
            <button className="px-btn primary" onClick={() => store.quitToTitle()}>
              Voltar ao título
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
