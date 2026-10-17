import { useEffect, useState } from 'react';
import { store, useStore } from '../store';
import { api } from '../api';
import { todaySeed } from '../infinite';
import { isNative } from '../native';

interface Row {
  name: string;
  score: number;
  calls: number;
  correct: number;
  seed: string;
}

export function Ranking() {
  const s = useStore();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [seed, setSeed] = useState<string | undefined>(todaySeed());
  useEffect(() => {
    let alive = true;
    api.ranking('infinito', seed, 20).then((r) => alive && setRows((r ?? []) as Row[]));
    return () => {
      alive = false;
    };
  }, [seed]);
  return (
    <div className="menu-screen ranking">
      <h1>Ranking do Plantão Infinito</h1>
      <div className="tabs">
        <button className={'px-btn small' + (seed ? ' primary' : '')} onClick={() => setSeed(todaySeed())}>
          Plantão do dia ({todaySeed()})
        </button>
        <button className={'px-btn small' + (!seed ? ' primary' : '')} onClick={() => setSeed(undefined)}>
          Todos os tempos
        </button>
      </div>
      {!s.serverOk && (
        <p className="lead">
          {isNative()
            ? `Por enquanto o ranking do programa é só deste computador. Seu recorde: ${s.meta.infiniteBest} pontos.`
            : `O ranking compartilhado precisa do servidor local (start.command). Seu recorde neste navegador: ${s.meta.infiniteBest} pontos.`}
        </p>
      )}
      {s.serverOk && rows && rows.length === 0 && <p className="lead">Ninguém pontuou ainda. Seja o primeiro.</p>}
      {rows && rows.length > 0 && (
        <table className="rank-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Regulador</th>
              <th>Pontos</th>
              <th>Ligações</th>
              <th>Acertos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.score}</td>
                <td>{r.calls}</td>
                <td>{r.correct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="row-end">
        <button className="px-btn ghost" onClick={() => store.setScreen('titulo')}>
          Voltar
        </button>
        <button className="px-btn primary" onClick={() => store.newInfinite(seed ?? todaySeed())}>
          Jogar o plantão do dia
        </button>
      </div>
    </div>
  );
}
