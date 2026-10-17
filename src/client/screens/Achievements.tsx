import { store, useStore } from '../store';
import { CONTENT } from '../../content/index';

export function Achievements() {
  const s = useStore();
  const got = new Set(s.achievements);
  return (
    <div className="menu-screen achievements">
      <h1>Conquistas</h1>
      <p className="lead">
        {got.size} de {CONTENT.achievements.length}
      </p>
      <ul className="ach-list scroll-y">
        {CONTENT.achievements.map((a) => {
          const on = got.has(a.id);
          const hidden = a.secret && !on;
          return (
            <li key={a.id} className={on ? 'on' : ''}>
              <strong>{hidden ? '???' : a.name}</strong>
              <span>{hidden ? 'Conquista secreta.' : a.desc}</span>
            </li>
          );
        })}
      </ul>
      <div className="row-end">
        <button className="px-btn ghost" onClick={() => store.setScreen('titulo')}>
          Voltar
        </button>
      </div>
    </div>
  );
}
