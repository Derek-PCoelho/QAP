// RCP guiada: metrônomo de 100–120/min; ESPAÇO a cada compressão; trocar o socorrista quando cansar.
import { useEffect, useRef, useState } from 'react';
import type { GuideScript } from '../../engine/content-api';
import { audio } from '../audio';
import { store } from '../store';
import type { GuideResult } from './GuideOverlay';

const COUNT = ['um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte', 'vinte e um', 'vinte e dois', 'vinte e três', 'vinte e quatro', 'vinte e cinco', 'vinte e seis', 'vinte e sete', 'vinte e oito', 'vinte e nove', 'trinta'];

export function Rcp({ script, seconds, onFinish, real, narrative }: { script: GuideScript; seconds: number; onFinish: (r: GuideResult) => void; real: boolean; narrative: boolean }) {
  // 100 a 120 por minuto (AHA; protocolo de campo A1): o roteiro pode pedir uma faixa
  const range = script.bpm ?? [100, 120];
  const bpm = Math.max(100, Math.min(120, Math.round((range[0] + (range[1] ?? range[0])) / 2)));
  const dr = store.game?.st.gender === 'F' ? 'doutora' : 'doutor';
  const interval = 60000 / bpm;
  const tol = narrative ? 190 : 130;
  const t0 = useRef(performance.now());
  const hits = useRef(0);
  const bad = useRef(0);
  const beatsHit = useRef(new Set<number>());
  const [now, setNow] = useState(performance.now());
  const [tired, setTired] = useState<number | null>(null);
  const tiredFails = useRef(0);
  const [msg, setMsg] = useState('Mãos entrelaçadas no centro do peito, braços esticados. Afunda e deixa o peito voltar. Força!');
  const [pulse, setPulse] = useState(0);
  const finished = useRef(false);
  const nextTired = useRef((script.tiredEvery ?? 12) * 1000);

  useEffect(() => {
    audio.metronome(bpm, true);
    let raf = 0;
    const f = () => {
      const n = performance.now();
      setNow(n);
      const el = n - t0.current;
      if (!finished.current && el >= nextTired.current && tired === null) {
        setTired(n);
        setMsg(`"Não aguento mais, ${dr}! Meus braços!"`);
        nextTired.current += (script.tiredEvery ?? 12) * 1000;
      }
      if (!finished.current && el >= seconds * 1000) {
        finished.current = true;
        audio.metronome(bpm, false);
        const beats = Math.max(1, Math.floor(el / interval));
        const q = Math.max(0, Math.min(1, hits.current / beats - bad.current * 0.01 - tiredFails.current * 0.12));
        onFinish({ quality: q, success: q >= 0.55 });
        return;
      }
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => {
      cancelAnimationFrame(raf);
      audio.metronome(bpm, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cansaço não atendido em 3 s
  useEffect(() => {
    if (tired === null) return;
    const t = setTimeout(() => {
      tiredFails.current++;
      setTired(null);
      setMsg('A massagem enfraqueceu. Ela parou para respirar.');
    }, 3000);
    return () => clearTimeout(t);
  }, [tired]);

  const press = () => {
    if (finished.current) return;
    const el = performance.now() - t0.current;
    const beat = Math.round(el / interval);
    const off = Math.abs(el - beat * interval);
    setPulse((p) => p + 1);
    if (tired !== null) {
      bad.current++;
      return;
    }
    if (off <= tol && !beatsHit.current.has(beat)) {
      beatsHit.current.add(beat);
      hits.current++;
      const k = hits.current;
      if (k % 30 === 0) setMsg('Isso! Trinta! Não para! Continua!');
      else setMsg(`"${COUNT[(k - 1) % 30]}..."`);
    } else {
      bad.current++;
      if (off > tol) setMsg(el / interval - beat > 0 ? 'Mais rápido! Acompanha o ritmo!' : 'Mais devagar, no ritmo!');
    }
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        press();
      }
      if ((e.key === 't' || e.key === 'T') && tired !== null) swap();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const swap = () => {
    setTired(null);
    setMsg('"Pedro! Vem! Troca comigo!" — outra pessoa assume. Continua contando.');
    audio.sfx('click');
  };

  const el = now - t0.current;
  const phase = (el % interval) / interval;
  const beats = Math.max(1, Math.floor(el / interval));
  const quality = Math.max(0, Math.min(1, hits.current / beats - bad.current * 0.01));
  const left = Math.max(0, Math.ceil(seconds - el / 1000));
  return (
    <div className="rcp">
      <p className="rcp-msg">{msg}</p>
      <div className="rcp-stage">
        {!real && (
          <div className="metro">
            <div className="metro-ring" style={{ transform: `scale(${1 + (1 - phase) * 0.35})`, opacity: 1 - phase * 0.6 }} />
            <div className="metro-dot" />
          </div>
        )}
        <button className={'rcp-press' + (pulse % 2 ? ' a' : ' b')} onPointerDown={press}>
          Comprimir
          <small>ESPAÇO</small>
        </button>
        {tired !== null && (
          <button className="px-btn warm rcp-swap" onClick={swap}>
            "Tem mais alguém aí? Troca!" <span className="kbd">T</span>
          </button>
        )}
      </div>
      <div className="rcp-meters">
        <div className="meter">
          <span>Qualidade da massagem</span>
          <div className="bar">
            <i style={{ width: `${quality * 100}%` }} />
          </div>
        </div>
        <span className="rcp-left">{left}s até a equipe assumir</span>
      </div>
      {real && <p className="rcp-real">Regulador Real: só o som do metrônomo.</p>}
    </div>
  );
}
