import { store, useStore } from '../../store';
import { Icon } from '../../ui/Icon';
import type { Overlay } from './Desk';
import { audio } from '../../audio';

export function DeskBar({ overlay, setOverlay, inspect, toggleInspect, manualBlocked }: { overlay: Overlay; setOverlay: (o: Overlay) => void; inspect: boolean; toggleInspect: () => void; manualBlocked: boolean }) {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const open = (o: Overlay) => {
    audio.sfx('page');
    setOverlay(overlay === o ? null : o);
  };
  const S = sh.sh;
  return (
    <footer className="deskbar">
      <button className={'desk-item' + (overlay === 'manual' ? ' on' : '')} disabled={manualBlocked} onClick={() => open('manual')} title={manualBlocked ? 'Regulador Real: o manual só pode ser consultado entre ligações' : 'Manual de Regulação (M)'}>
        <Icon name="manual" scale={2} />
        <span>Manual</span>
        <span className="kbd">M</span>
      </button>
      <button className={'desk-item' + (overlay === 'quadro' ? ' on' : '')} onClick={() => open('quadro')} title="Quadro de cortiça (Q)">
        <Icon name="quadro" scale={2} />
        <span>Quadro</span>
        <span className="kbd">Q</span>
      </button>
      {!S.tarm && (
        <button className={'desk-item' + (overlay === 'diario' ? ' on' : '')} onClick={() => open('diario')} title="Diário do regulador (D)">
          <Icon name="diario" scale={2} />
          <span>Diário</span>
          <span className="kbd">D</span>
        </button>
      )}
      <button className={'desk-item inspect' + (inspect ? ' on' : '')} disabled={!!S.guideCallId} onClick={toggleInspect} title="Modo Inconsistência (TAB)">
        <Icon name="lupa" scale={2} />
        <span>Inconsistência</span>
        <span className="kbd">TAB</span>
      </button>
      <div className="desk-spacer" />
      <div className="desk-summary">
        {S.tarm ? `${S.tarm.passed} pré-triagens` : `${S.handled} reguladas`} · {S.deaths.length > 0 ? `${S.deaths.length} óbito${S.deaths.length > 1 ? 's' : ''}` : 'nenhum óbito'}
      </div>
      <button className="desk-item" onClick={() => store.pause(true)} title="Pausa (Esc)">
        <span>Pausa</span>
        <span className="kbd">Esc</span>
      </button>
    </footer>
  );
}
