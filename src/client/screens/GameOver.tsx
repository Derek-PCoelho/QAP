import { useEffect, useState } from 'react';
import { protagonistFirst } from '../../engine/text';
import { store, useStore } from '../store';
import { ArtCanvas } from '../ui/ArtCanvas';
import { drawEnding } from '../art';
import { api } from '../api';
import { todaySeed } from '../infinite';
import { readableTitle } from './Ending';

const ART: Record<string, string> = { exonerado: 'gaveta', despejo: 'calcada_moveis', colapso: 'telefone_escuro', sindicancia: 'gaveta' };

export function GameOver() {
  const s = useStore();
  const g = s.game!;
  const go = g.st.gameOver!;
  const inf = g.st.infinite;
  const lines = (go.text || '').split('\n').filter(Boolean);
  const [n, setN] = useState(1);
  const [sent, setSent] = useState(false);
  // a campanha da Simone salva o começo do dia em 'simone_dia' (ver store.saveAuto)
  const daySlot = g.st.mode === 'simone' ? 'simone_dia' : 'dia';
  const hasDay = s.saves().some((x) => x.slot === daySlot);
  useEffect(() => {
    const t = setInterval(() => setN((x) => (x >= lines.length ? x : x + 1)), 1400);
    return () => clearInterval(t);
  }, [lines.length]);
  useEffect(() => {
    if (inf && !sent) {
      setSent(true);
      store.recordInfinite(inf.score);
      api.submitScore({ name: store.settings.playerName || 'Regulador', score: inf.score, calls: inf.calls, correct: inf.correct, seed: inf.seedLabel, mode: 'infinito', version: '1.0.4', profileId: store.settings.profileId });
      api.track('infinite_end', { score: inf.score, calls: inf.calls });
    }
  }, [inf, sent]);
  return (
    <div className="gameover">
      <ArtCanvas w={320} h={180} scale={4} animate fps={6} draw={(ctx, t) => drawEnding(ctx, (ART[go.kind] ?? 'telefone_escuro') as never, { time: t, gender: g.st.gender, blend: 1, name: protagonistFirst(g.st.gender, g.st) })} className="end-art" />
      <div className="go-text">
        {lines.slice(0, n).map((l, i) => (i === 0 ? <h1 key={i}>{readableTitle(l)}</h1> : <p key={i}>{l}</p>))}
        {inf && (
          <p className="inf-score">
            {inf.score} pontos · {inf.calls} ligações · {inf.shifts} turno(s)
          </p>
        )}
        <div className="end-actions">
          {inf ? (
            <>
              <button className="px-btn ghost" onClick={() => store.setScreen('ranking')}>
                Ver ranking
              </button>
              <button className="px-btn primary" onClick={() => store.newInfinite(todaySeed())}>
                Jogar de novo
              </button>
            </>
          ) : (
            hasDay && (
              <button className="px-btn primary" onClick={() => store.continueGame(daySlot)}>
                Tentar o dia {go.day} de novo
              </button>
            )
          )}
          <button className="px-btn ghost" onClick={() => store.quitToTitle()}>
            Título
          </button>
        </div>
      </div>
    </div>
  );
}
