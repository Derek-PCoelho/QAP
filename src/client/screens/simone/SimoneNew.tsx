// Início da campanha 2: "Simone".
import { useEffect, useState } from 'react';
import { store } from '../../store';
import { Portrait } from '../../ui/Portrait';
import type { Difficulty, Gender } from '../../../engine/types';
import { protagonistName } from '../../../engine/text';

const DIFFS: { id: Difficulty; name: string; desc: string }[] = [
  { id: 'narrativo', name: 'Narrativo', desc: 'O relógio anda mais devagar. Para viver a história dela.' },
  { id: 'padrao', name: 'Padrão', desc: 'Três advertências da OS e você está na lista do corte.' },
  { id: 'real', name: 'TARM Real', desc: 'Duas advertências demitem.' },
];

export function SimoneNew() {
  const [diff, setDiff] = useState<Difficulty>('padrao');
  const [gender, setGender] = useState<Gender>(store.meta.lastGender ?? 'M');
  // já há uma campanha da Simone em andamento: avisa e pede um segundo clique (a atual fica guardada)
  const current = store.saves().find((x) => x.slot === 'simone_auto');
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const t = setTimeout(() => setSure(false), 6000);
    return () => clearTimeout(t);
  }, [sure]);
  return (
    <div className="menu-screen newgame simone-new">
      <h1>Do outro lado da linha</h1>
      <p className="lead">
        Simone Aparecida, 51 anos, vinte e dois de central. TARM: é ela quem atende primeiro, entende o que é, escreve o post-it e decide para qual mesa passar. Os mesmos vinte dias, vistos da cadeira ao lado.
      </p>
      <section className="pick-row">
        <div className="pick-card on static">
          <Portrait id={'SIMONE' as never} size={128} />
          <strong>Simone</strong>
          <span>Técnica Auxiliar de Regulação Médica</span>
        </div>
        <div className="pick-col">
          <p className="note">Na Mesa 1, a regulação é de:</p>
          {(['M', 'F'] as Gender[]).map((gd) => (
            <button key={gd} className={'px-btn ghost' + (gender === gd ? ' on' : '')} onClick={() => setGender(gd)}>
              {protagonistName(gd)}
            </button>
          ))}
          <p className="note">Na Mesa 2, o Dr. Henrique Lacerda cobre o dia neste mês: a OS cortou o noturno.</p>
        </div>
      </section>
      <section className="diff-row">
        {DIFFS.map((d) => (
          <button key={d.id} className={'diff-card' + (diff === d.id ? ' on' : '')} onClick={() => setDiff(d.id)}>
            <strong>{d.name}</strong>
            <span>{d.desc}</span>
          </button>
        ))}
      </section>
      {current && (
        <p className="newgame-warn">
          Você tem uma campanha da Simone em andamento (dia {current.day}). Começar outra não apaga essa: ela sai do "Continuar: Simone" e fica em
          Carregar → "Saves guardados" por 30 dias.
        </p>
      )}
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
            store.newSimone({ gender, difficulty: diff });
          }}
        >
          {current && sure ? 'Começar mesmo assim' : 'Começar o turno'}
        </button>
      </div>
    </div>
  );
}
