import { useEffect, useState } from 'react';
import { store, useStore } from '../store';
import { isNative } from '../native';
import { PROTAGONIST_FIRST } from '../../engine/text';
import { TRASH_DAYS, TRASH_MAX, type SaveSummary } from '../settings';

const PHASE: Record<string, string> = { jornal: 'manhã', casa: 'em casa', relatorio: 'fim do plantão', final: 'final' };
const DIFF: Record<string, string> = { narrativo: 'Narrativo', padrao: 'Padrão', real: 'Regulador Real' };

/** nome de cada espaço de save como o jogador entende */
function slotName(slot: string): string {
  const simone = slot.startsWith('simone_');
  const k = simone ? slot.slice(7) : slot;
  const base = k === 'auto' ? 'Salvamento automático' : k === 'dia' ? 'Início do dia (automático)' : `Espaço ${k}`;
  return simone ? `Simone · ${base}` : base;
}

/** "Dia 6 · em casa · R$ 260 · Amber · Padrão" */
function describe(sv: SaveSummary): string {
  const who = sv.mode === 'simone' ? 'Simone' : PROTAGONIST_FIRST[sv.gender === 'M' ? 'M' : 'F'];
  return `Dia ${sv.day} · ${PHASE[sv.phase] ?? sv.phase} · R$ ${sv.money} · ${who} · ${DIFF[sv.difficulty] ?? sv.difficulty}`;
}

export function LoadGame() {
  const s = useStore();
  const saves = s.saves();
  const trash = s.trash();
  const g = s.game;
  // apagar pede um segundo clique (some sozinho em 4 s)
  const [confirm, setConfirm] = useState<string | null>(null);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), 4000);
    return () => clearTimeout(t);
  }, [confirm]);
  return (
    <div className="menu-screen load">
      <h1>Carregar</h1>
      {saves.length === 0 && <p className="lead">Nenhum plantão salvo {isNative() ? 'neste computador' : 'neste navegador'} ainda.</p>}
      <ul className="save-list">
        {saves.map((sv) => (
          <li key={sv.slot}>
            <div>
              <strong>{slotName(sv.slot)}</strong>
              <span>{describe(sv)}</span>
              <small>{new Date(sv.savedAt).toLocaleString('pt-BR')}</small>
            </div>
            <button className="px-btn primary small" onClick={() => store.continueGame(sv.slot)}>
              Carregar
            </button>
            <button
              className="px-btn danger small"
              onClick={() => {
                if (confirm === sv.slot) {
                  setConfirm(null);
                  store.deleteSave(sv.slot);
                } else setConfirm(sv.slot);
              }}
            >
              {confirm === sv.slot ? 'Apagar mesmo?' : 'Apagar'}
            </button>
          </li>
        ))}
      </ul>
      {trash.length > 0 && (
        <section className="save-trash">
          <h2>Saves guardados</h2>
          <p className="trash-note">
            Cópias de saves apagados ou substituídos. Ficam {TRASH_DAYS} dias (no máximo {TRASH_MAX}); carregar uma delas faz dela o "Continuar".
          </p>
          <ul className="save-list">
            {trash.map((t) => (
              <li key={t.id}>
                <div>
                  <strong>{slotName(t.slot)}</strong>
                  <span>{describe(t.summary)}</span>
                  <small>
                    Guardado em {new Date(t.deletedAt).toLocaleString('pt-BR')}
                    {t.reason ? ` (${t.reason})` : ''}
                  </small>
                </div>
                <button className="px-btn small" onClick={() => store.restoreTrash(t.id)}>
                  Carregar
                </button>
                <button
                  className="px-btn danger small"
                  onClick={() => {
                    if (confirm === t.id) {
                      setConfirm(null);
                      store.purgeTrash(t.id);
                    } else setConfirm(t.id);
                  }}
                >
                  {confirm === t.id ? 'Apagar de vez?' : 'Apagar de vez'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {g && g.st.mode === 'campanha' && (
        <div className="save-to">
          <span>Salvar a campanha atual em:</span>
          {['1', '2', '3'].map((k) => (
            <button key={k} className="px-btn small" onClick={() => (store.saveTo(k), store.toast(`Salvo no espaço ${k}.`, 'bom'))}>
              Espaço {k}
            </button>
          ))}
        </div>
      )}
      <div className="row-end">
        <button className="px-btn ghost" onClick={() => store.setScreen(g ? 'jogo' : 'titulo')}>
          Voltar
        </button>
      </div>
    </div>
  );
}
