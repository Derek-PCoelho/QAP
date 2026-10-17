import { store, useStore } from '../store';
import { newsPhoto, NEWS_W, NEWS_H, NEWS_CROP_W, NEWS_CROP_H } from '../art';
import { CONTENT } from '../../content/index';

/** a foto sai sempre ×2 (pixels inteiros); na página apertada, o recorte do editor */
const PHOTO_SCALE = 2;
/** resolução embutida no dataURL (×4): nítida em qualquer escala do palco */
const PHOTO_DPI = 4;

export function Newspaper() {
  const s = useStore();
  const g = s.game!;
  const n = g.newspaper();
  const inf = g.st.infinite;
  const newPages = CONTENT.manual.filter((p) => p.day === g.st.day);
  if (inf) {
    return (
      <div className="news-screen">
        <div className="news-card bezel">
          <h1>Plantão Infinito</h1>
          <h2>{n.headline}</h2>
          <p>{n.sub}</p>
          <p className="score-line">
            Pontos: <b>{inf.score}</b> · Ligações: {inf.calls} · Sequência: {inf.streak}
          </p>
          <button className="px-btn primary" onClick={() => g.beginShift()}>
            Começar o turno
          </button>
        </div>
      </div>
    );
  }
  const y = n.yesterday;
  const density = n.stories.reduce((a, st) => a + st.title.length + st.text.length + 40, 0);
  const dense = density > 780;
  let photo = '';
  try {
    photo = newsPhoto(n.photo ?? 'generico', { crop: dense, scale: PHOTO_DPI });
  } catch {
    photo = '';
  }
  return (
    <div className="news-screen">
      <article className="newspaper paper">
        <header className="mast">
          <div className="mast-title">Gazeta de Santa Aurora</div>
          <div className="mast-meta">
            <span>Ano XLII · Nº {1180 + g.st.day}</span>
            <span>{n.date}</span>
            <span>R$ 3,00</span>
            {n.weather && <span>{n.weather}</span>}
          </div>
        </header>
        <h1 className="headline">{n.headline}</h1>
        {n.sub && <p className="subhead">{n.sub}</p>}
        <div className={'news-body' + (density > 1500 ? ' dense xdense' : density > 780 ? ' dense' : '')}>
          {photo && (
            <figure className="news-photo">
              <img
                src={photo}
                width={(dense ? NEWS_CROP_W : NEWS_W) * PHOTO_SCALE}
                height={(dense ? NEWS_CROP_H : NEWS_H) * PHOTO_SCALE}
                alt=""
              />
              <figcaption>Foto: Arquivo Gazeta</figcaption>
            </figure>
          )}
          <div className="news-cols">
            {n.stories.map((st, i) => (
              <section key={i} className="story">
                <h3>{st.title}</h3>
                <p>{st.text}</p>
              </section>
            ))}
          </div>
        </div>
        <footer className="news-foot">
          {(y.deaths.length > 0 || y.saves.length > 0 || y.night.length > 0) && (
            <section className="box obits">
              <h4>Ocorrências de ontem</h4>
              {y.saves.length > 0 && <p>Sobreviveram graças à Regulação: {y.saves.join('; ')}.</p>}
              {y.deaths.length > 0 && <p>Faleceram: {y.deaths.join('; ')}.</p>}
              {y.night.length > 0 && <p>De madrugada, no plantão noturno: {y.night.join('; ')}.</p>}
            </section>
          )}
          {(n.notice || newPages.length > 0) && (
            <section className="box notice">
              <h4>Central de Regulação</h4>
              {n.notice && <p>{n.notice}</p>}
              {newPages.length > 0 && (
                <p>
                  {newPages.length > 1 ? 'Novas páginas' : 'Nova página'} no Manual: {newPages.map((p) => `${p.code} ${p.title}`).join(' · ')}.
                </p>
              )}
            </section>
          )}
          {n.ad && <section className="box ad">{n.ad}</section>}
        </footer>
        <div className="coffee-ring" aria-hidden />
      </article>
      <aside className="news-side">
        <div className="day-tag">
          Dia {g.st.day} de 20
          <small>{g.dayDef()?.title}</small>
        </div>
        <button className="px-btn primary" onClick={() => g.beginShift()}>
          Ir para o plantão
        </button>
        {g.st.day > 1 && (
          <button className="px-btn ghost small" onClick={() => store.setScreen('carregar')}>
            Salvar / carregar
          </button>
        )}
      </aside>
    </div>
  );
}
