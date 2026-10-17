import { useEffect, useState } from 'react';
import { store } from '../store';
import { Portrait } from '../ui/Portrait';
import type { Difficulty, Gender } from '../../engine/types';
import { protagonistName, PROTAGONIST_FIRST } from '../../engine/text';

const DIFFS: { id: Difficulty; name: string; desc: string }[] = [
  { id: 'narrativo', name: 'Narrativo', desc: 'O relógio anda 40% mais devagar e as anotações da Simone estão sempre certas. Para viver a história.' },
  { id: 'padrao', name: 'Padrão', desc: 'O jogo como foi pensado: três advertências no mesmo plantão e você está fora.' },
  { id: 'real', name: 'Regulador Real', desc: 'Sem manual durante a ligação, a Simone erra mais, a RCP não tem metrônomo visual e duas advertências demitem.' },
];

export function NewGame() {
  const [gender, setGender] = useState<Gender>('M');
  const [diff, setDiff] = useState<Difficulty>('padrao');
  const [variable, setVariable] = useState(store.meta.campaignsFinished > 0);
  // já há uma campanha em andamento: avisa e pede um segundo clique (a atual fica guardada)
  const current = store.saves().find((x) => x.slot === 'auto');
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const t = setTimeout(() => setSure(false), 6000);
    return () => clearTimeout(t);
  }, [sure]);
  return (
    <div className="menu-screen newgame">
      <h1>Nova campanha</h1>
      <p className="lead">Santa Aurora, 300 mil habitantes. Um contrato precário de {gender === 'M' ? 'médico regulador' : 'médica reguladora'}, a dívida do FIES e uma família esperando em casa. Vinte plantões.</p>
      <section className="pick-row">
        {(['M', 'F'] as Gender[]).map((gd) => (
          <button key={gd} className={'pick-card' + (gender === gd ? ' on' : '')} onClick={() => setGender(gd)}>
            <Portrait id={gd === 'M' ? 'EU_M' : 'EU_F'} size={128} />
            <strong>{protagonistName(gd)}</strong>
            <span>29 anos, recém-formad{gd === 'M' ? 'o' : 'a'}</span>
          </button>
        ))}
      </section>
      <section className="diff-row">
        {DIFFS.map((d) => (
          <button key={d.id} className={'diff-card' + (diff === d.id ? ' on' : '')} onClick={() => setDiff(d.id)}>
            <strong>{d.name}</strong>
            <span>{d.desc}</span>
          </button>
        ))}
      </section>
      <label className="check">
        <input type="checkbox" checked={variable} onChange={(e) => setVariable(e.target.checked)} />
        Ligações variáveis: as ligações comuns mudam a cada partida (mesma abertura, verdades diferentes). Recomendado a partir da segunda campanha.
      </label>
      {current && (
        <p className="newgame-warn">
          Você tem uma campanha em andamento ({PROTAGONIST_FIRST[current.gender === 'F' ? 'F' : 'M']}, dia {current.day}). Começar outra não apaga essa: ela sai do "Continuar
          campanha" e fica em Carregar → "Saves guardados" por 30 dias.
        </p>
      )}
      <p className="note">O jogo trata de emergências médicas, morte, violência doméstica e crise emocional, com cuidado e sem detalhar métodos.</p>
      <div className="row-end">
        <button className="px-btn ghost" onClick={() => store.setScreen('titulo')}>
          Voltar
        </button>
        <button
          className="px-btn primary"
          onClick={() => {
            if (current && !sure) {
              setSure(true);
              return;
            }
            store.newGame({ gender, difficulty: diff, variable });
          }}
        >
          {current && sure ? 'Começar mesmo assim' : 'Começar o primeiro plantão'}
        </button>
      </div>
    </div>
  );
}
