// =============================================================================
// GET /admin — painel de calibragem autocontido (CSS/JS inline, sem dependências).
// Busca /api/metrics e /api/ranking. Visual "central de regulação": verde escuro,
// monoespaçado, cantos retos. Todo texto vindo da API entra via textContent.
// =============================================================================
import { escapeHtml } from './http';

const CSS = `
:root {
  color-scheme: dark;
  --plane: #07100b;
  --surface: #0f1d16;
  --surface-2: #142a1d;
  --line: #1f3a2b;
  --line-2: #2c5440;
  --ink: #d2f5dc;
  --ink-2: #9cc8a8;
  --muted: #6f9a80;
  --accent: #46f08c;
  --good: #0ca30c;
  --bad: #d03b3b;
  --warn: #fab219;
  --track: #18301f;
  --band: #2e6343;
  --s1: #3987e5;
  --s2: #d95926;
  --s3: #199e70;
  --s4: #c98500;
  --shadow: #020604;
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", monospace;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--plane); color: var(--ink); font: 14px/1.5 var(--mono); }
body::before {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 40;
  background: repeating-linear-gradient(to bottom, transparent 0 3px, rgba(0, 0, 0, .14) 3px 4px);
}
.wrap { max-width: 1180px; margin: 0 auto; padding: 20px 16px 56px; }
header.top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px;
  border-bottom: 2px solid var(--line-2); padding-bottom: 14px; }
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.cross { width: 28px; height: 28px; position: relative; flex: none; }
.cross::before, .cross::after { content: ""; position: absolute; background: #e8473b; }
.cross::before { left: 10px; top: 2px; width: 8px; height: 24px; }
.cross::after { left: 2px; top: 10px; width: 24px; height: 8px; }
h1 { margin: 0; font-size: 18px; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
.cursor { display: inline-block; width: .6em; height: 1em; background: var(--accent); vertical-align: -.12em; margin-left: .3em;
  animation: blink 1.1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .cursor { animation: none; } main { transition: none; } }
.sub { margin: 2px 0 0; color: var(--ink-2); font-size: 12px; }
.status { color: var(--muted); font-size: 12px; text-align: right; }
.filters { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; padding: 12px 0; margin-bottom: 18px;
  border-bottom: 1px solid var(--line); font-size: 13px; color: var(--ink-2); }
.filters label { display: inline-flex; align-items: center; gap: 8px; }
select, input, button { font: inherit; color: var(--ink); background: var(--surface); border: 2px solid var(--line-2);
  border-radius: 0; padding: 4px 8px; }
input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent); padding: 0; }
button { cursor: pointer; text-transform: uppercase; letter-spacing: .08em; background: var(--surface-2); }
button:hover { border-color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
main { transition: opacity .15s; }
main.stale { opacity: .55; }
h2 { font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-2); margin: 0 0 12px; font-weight: normal; }
h2::before { content: "\\258C"; color: var(--accent); margin-right: 6px; }
section { margin-bottom: 22px; }
.panel { background: var(--surface); border: 2px solid var(--line); box-shadow: 4px 4px 0 var(--shadow); padding: 16px; }
.error { border: 2px solid var(--bad); background: #2a0f0f; color: #ffe1e1; padding: 10px 12px; margin-bottom: 16px; }
.empty { color: var(--muted); font-size: 13px; margin: 0; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }
.kpi { background: var(--surface); border: 2px solid var(--line); padding: 10px 12px; min-width: 0; }
.kpi .k { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; }
.kpi .v { font-size: 22px; color: var(--ink); overflow-wrap: anywhere; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 14px; }
.metric { background: var(--surface); border: 2px solid var(--line); box-shadow: 4px 4px 0 var(--shadow); padding: 14px;
  display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.metric.ok { border-color: #22603a; }
.metric.bad { border-color: #64302c; }
.m-head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.m-label { font-size: 13px; color: var(--ink-2); }
.badge { flex: none; font-size: 11px; letter-spacing: .08em; padding: 2px 6px; text-transform: uppercase; white-space: nowrap; }
.badge.ok { background: var(--good); color: #021307; }
.badge.bad { background: var(--bad); color: #fff; }
.badge.nodata { border: 1px dashed var(--muted); color: var(--muted); }
.m-value { font-size: 30px; line-height: 1.15; color: var(--ink); }
.m-value small { font-size: 13px; color: var(--muted); margin-left: 8px; }
.meter { position: relative; height: 10px; background: var(--track); margin-top: 8px; }
.meter .band { position: absolute; top: 0; bottom: 0; background: var(--band); }
.meter .mark { position: absolute; top: -5px; width: 4px; height: 20px; margin-left: -2px; background: var(--ink);
  box-shadow: 0 0 0 2px var(--surface); }
.m-scale { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); margin-top: 6px; }
.m-line { font-size: 12px; color: var(--ink-2); }
.m-notes { margin: 0; padding: 0; list-style: none; font-size: 12px; color: var(--ink); }
.m-notes li::before { content: "\\26A0"; color: var(--warn); margin-right: 6px; }
.m-def { font-size: 11px; color: var(--muted); margin-top: auto; }
.stack-row { display: grid; grid-template-columns: 52px 1fr; gap: 10px; align-items: center; margin-bottom: 10px; }
.stack-row .rl { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
.stack { display: flex; gap: 2px; height: 24px; background: var(--surface); min-width: 0; }
.stack.blank { background: var(--track); }
.seg { position: relative; min-width: 0; display: flex; align-items: center; justify-content: center; white-space: nowrap;
  font-size: 11px; color: #03110a; cursor: default; }
.sw { display: inline-block; width: 10px; height: 10px; margin-right: 8px; vertical-align: -1px; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { padding: 6px 10px; text-align: right; border-bottom: 1px solid var(--line); white-space: nowrap; }
th { color: var(--muted); font-weight: normal; text-transform: uppercase; font-size: 11px; letter-spacing: .08em; }
th:first-child, td:first-child, td.txt, th.txt { text-align: left; }
td { font-variant-numeric: tabular-nums; }
tbody tr:hover { background: var(--surface-2); }
.st-ok { color: var(--good); }
.st-bad { color: #ff8a80; }
.st-nodata { color: var(--muted); }
.two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 20px; margin-bottom: 22px; }
.two section { margin-bottom: 0; }
.mini { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
.mini .kpi { border-color: var(--line); background: var(--plane); }
.panel-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 16px; align-items: center; margin-bottom: 12px; }
.panel-head h2 { margin: 0; }
.caption { font-size: 12px; color: var(--ink-2); margin: 0 0 12px; }
.table-wrap + .caption { margin: 12px 0 0; }
.tip { position: fixed; z-index: 60; pointer-events: none; background: var(--shadow); border: 2px solid var(--line-2); color: var(--ink);
  padding: 6px 8px; font-size: 12px; max-width: 280px; }
footer { color: var(--muted); font-size: 11px; margin-top: 28px; }
footer a, .caption code { color: inherit; }
`;

const SCRIPT = `
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  var nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  var clock = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var stamp = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  var ENDING_COLOR = { ruim: 'var(--s1)', normal: 'var(--s2)', bom: 'var(--s3)', secreto: 'var(--s4)' };
  var BADGE = { ok: '\\u2713 na meta', bad: '\\u2717 fora da meta', nodata: '\\u2014 sem dados' };
  var ICON = { ok: '\\u2713', bad: '\\u2717', nodata: '\\u2014' };
  var DAY_COLS = [
    ['n', 'Campanhas'], ['warnings', 'Advert.'], ['notes', 'Notas'], ['deaths', '\\u00d3bitos'], ['saves', 'Salvos'],
    ['handled', 'Atendidas'], ['pay', 'Pagamento'], ['desgaste', 'Desgaste'], ['money', 'Dinheiro']
  ];

  var params = new URLSearchParams(location.search);
  var state = {
    difficulty: params.get('difficulty') || '',
    since: params.get('since') || '',
    seed: params.get('seed') || '',
    auto: params.get('auto') !== '0'
  };
  var timer = null;
  var loading = false;

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null) continue;
        if (k === 'class') e.className = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else e.setAttribute(k, attrs[k]);
      }
    }
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function fmt(v, unit) {
    if (v === null || v === undefined) return '\\u2014';
    return nf1.format(v) + (unit === '%' ? '%' : unit === 's' ? ' s' : '');
  }
  function badge(status) { return el('span', { class: 'badge ' + status, text: BADGE[status] || status }); }
  function stIcon(status) { return el('span', { class: 'st-' + status, text: ICON[status] + ' ' + (status === 'ok' ? 'ok' : status === 'bad' ? 'fora' : 'sem dados') }); }

  // ---- tooltip ------------------------------------------------------------
  var tip = $('tip');
  function showTip(text, x, y) {
    tip.textContent = text;
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(window.innerWidth - w - 8, x + 12);
    var top = y - h - 12 < 8 ? y + 16 : y - h - 12;
    tip.style.left = Math.max(8, left) + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() { tip.hidden = true; }
  function withTip(node, text) {
    node.addEventListener('mousemove', function (ev) { showTip(text, ev.clientX, ev.clientY); });
    node.addEventListener('mouseleave', hideTip);
    node.addEventListener('focus', function () {
      var r = node.getBoundingClientRect();
      showTip(text, r.left + r.width / 2, r.top);
    });
    node.addEventListener('blur', hideTip);
  }

  // ---- dados ------------------------------------------------------------------
  function getJson(url) {
    return fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (body) {
        if (!res.ok) throw new Error((body && body.error) || ('HTTP ' + res.status));
        return body;
      });
    });
  }
  function metricsUrl() {
    var q = new URLSearchParams();
    if (state.difficulty) q.set('difficulty', state.difficulty);
    if (state.since) q.set('since', state.since);
    return '/api/metrics' + (q.toString() ? '?' + q.toString() : '');
  }
  function rankingUrl() {
    var q = new URLSearchParams({ mode: 'infinito', limit: '20' });
    if (state.seed) q.set('seed', state.seed);
    return '/api/ranking?' + q.toString();
  }
  function syncUrl() {
    var q = new URLSearchParams();
    if (state.difficulty) q.set('difficulty', state.difficulty);
    if (state.since) q.set('since', state.since);
    if (state.seed) q.set('seed', state.seed);
    if (!state.auto) q.set('auto', '0');
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  function load() {
    if (loading) return;
    loading = true;
    $('main').classList.add('stale');
    Promise.all([getJson(metricsUrl()), getJson(rankingUrl())])
      .then(function (r) {
        $('error').hidden = true;
        render(r[0], r[1]);
      })
      .catch(function (err) {
        var box = $('error');
        box.textContent = 'Falha ao carregar os dados: ' + (err && err.message ? err.message : err);
        box.hidden = false;
      })
      .then(function () {
        loading = false;
        $('main').classList.remove('stale');
      });
  }

  // ---- render -------------------------------------------------------------------
  function render(m, ranking) {
    $('status').textContent =
      (m.storage === 'sqlite' ? 'SQLite' : 'JSON') + ' \\u00b7 v' + m.version +
      ' \\u00b7 ' + nf0.format(m.totals.stored) + ' eventos guardados \\u00b7 atualizado \\u00e0s ' + clock.format(new Date(m.generatedAt));
    renderKpis(m);
    renderMetrics(m.metrics);
    renderEndings(m.endings, m.firstCampaignOutcomes);
    renderGameovers(m.gameovers);
    renderInfinite(m.infinite);
    renderPerDay(m.perDay);
    renderRanking(ranking);
  }

  function kpi(label, value) {
    return el('div', { class: 'kpi' }, [el('div', { class: 'k', text: label }), el('div', { class: 'v', text: value })]);
  }

  function renderKpis(m) {
    var t = m.totals;
    clear($('kpis')).append(
      kpi('Sess\\u00f5es', nf0.format(t.sessions)),
      kpi('Jogadores', nf0.format(t.players)),
      kpi('Campanhas', nf0.format(t.campaigns)),
      kpi('1\\u00aas campanhas', nf0.format(t.firstCampaigns)),
      kpi('Eventos usados', nf0.format(t.events))
    );
  }

  function meter(m) {
    var lo = m.scale.min, hi = m.scale.max, span = (hi - lo) || 1;
    var pos = function (x) { return Math.max(0, Math.min(100, ((x - lo) / span) * 100)); };
    var bar = el('div', { class: 'meter', role: 'img',
      'aria-label': 'Valor ' + fmt(m.value, m.unit) + '; faixa da meta ' + fmt(m.target.min, m.unit) + ' a ' + fmt(m.target.max, m.unit) });
    var band = el('div', { class: 'band' });
    band.style.left = pos(m.target.min) + '%';
    band.style.width = Math.max(1, pos(m.target.max) - pos(m.target.min)) + '%';
    bar.appendChild(band);
    if (m.value !== null) {
      var mark = el('div', { class: 'mark' });
      mark.style.left = pos(m.value) + '%';
      bar.appendChild(mark);
    }
    var scale = el('div', { class: 'm-scale', 'aria-hidden': 'true' }, [
      el('span', { text: fmt(lo, m.unit) }),
      el('span', { text: fmt(hi, m.unit) })
    ]);
    return el('div', null, [bar, scale]);
  }

  var DETAIL_LABEL = { chegaram: 'chegaram', gameOver: 'game over', emAndamento: 'em andamento', mediana: 'mediana', p90: 'p90' };

  function metricCard(m) {
    var id = 'm-' + m.id;
    var kids = [
      el('div', { class: 'm-head' }, [el('div', { class: 'm-label', id: id, text: m.label }), badge(m.status)]),
      el('div', { class: 'm-value' }, [fmt(m.value, m.unit), el('small', { text: 'n = ' + nf0.format(m.n) })]),
      meter(m),
      el('div', { class: 'm-line', text: 'Meta: ' + m.target.text })
    ];
    if (m.firstCampaign) {
      kids.push(el('div', { class: 'm-line', text: 'S\\u00f3 1\\u00aas campanhas: ' + fmt(m.firstCampaign.value, m.unit) + ' (n = ' + nf0.format(m.firstCampaign.n) + ')' }));
    }
    if (m.detail) {
      var parts = [];
      for (var k in m.detail) {
        if (!Object.prototype.hasOwnProperty.call(m.detail, k)) continue;
        var v = m.detail[k];
        parts.push((DETAIL_LABEL[k] || k) + ' ' + (v === null ? '\\u2014' : nf1.format(v) + (m.unit === 's' ? ' s' : '')));
      }
      if (parts.length) kids.push(el('div', { class: 'm-line', text: parts.join(' \\u00b7 ') }));
    }
    if (m.notes && m.notes.length) {
      kids.push(el('ul', { class: 'm-notes' }, m.notes.map(function (n) { return el('li', { text: n }); })));
    }
    kids.push(el('div', { class: 'm-def', text: m.definition }));
    return el('article', { class: 'metric ' + m.status, 'aria-labelledby': id }, kids);
  }

  function renderMetrics(list) {
    var box = clear($('metrics'));
    list.forEach(function (m) { box.appendChild(metricCard(m)); });
  }

  function stack(label, parts, total) {
    var bar = el('div', { class: 'stack' + (total ? '' : ' blank'), role: 'img', 'aria-label': label + ': ' +
      parts.map(function (p) { return p.label + ' ' + fmt(p.pct, '%'); }).join(', ') });
    var segs = [];
    parts.forEach(function (p) {
      if (!p.pct) return;
      var text = p.label + ': ' + fmt(p.pct, '%') + (p.count != null ? ' (' + p.count + ' de ' + total + ')' : '') +
        (p.note ? ' \\u2014 ' + p.note : '');
      var seg = el('div', { class: 'seg', tabindex: '0', 'aria-label': text });
      seg.style.flex = p.pct + ' 1 0';
      seg.style.background = ENDING_COLOR[p.kind];
      var long = p.label + ' ' + nf0.format(p.pct) + '%';
      var lbl = el('span', { text: long });
      lbl.setAttribute('data-short', nf0.format(p.pct) + '%');
      seg.appendChild(lbl);
      withTip(seg, text);
      bar.appendChild(seg);
      segs.push(seg);
    });
    return { row: el('div', { class: 'stack-row' }, [el('div', { class: 'rl', text: label }), bar]), segs: segs };
  }

  function fitLabels(segs) {
    segs.forEach(function (seg) {
      var lbl = seg.firstChild;
      if (!lbl) return;
      if (lbl.offsetWidth <= seg.clientWidth - 8) return;
      lbl.textContent = lbl.getAttribute('data-short');
      if (lbl.offsetWidth > seg.clientWidth - 8) lbl.hidden = true;
    });
  }

  function renderEndings(e, outcomes) {
    var box = clear($('endings'));
    var head = el('div', { class: 'panel-head' }, [
      el('h2', { id: 'h-finais', text: 'Finais na 1\\u00aa campanha' }),
      badge(e.status)
    ]);
    box.appendChild(head);
    box.appendChild(el('p', { class: 'caption', text: 'Distribui\\u00e7\\u00e3o dos finais nas primeiras campanhas que chegaram a um final (n = ' +
      nf0.format(e.n) + '); toler\\u00e2ncia de \\u00b1' + e.tolerance + ' pontos por final.' }));
    var real = stack('Real', e.kinds.map(function (k) {
      return { kind: k.kind, label: k.label, pct: k.pct, count: k.count, note: 'meta ' + k.target + '%' };
    }), e.n);
    var meta = stack('Meta', e.kinds.map(function (k) {
      return { kind: k.kind, label: k.label, pct: k.target };
    }), 100);
    box.appendChild(real.row);
    box.appendChild(meta.row);
    var rows = e.kinds.map(function (k) {
      var diff = k.pct === null ? null : k.pct - k.target;
      return el('tr', null, [
        el('td', { class: 'txt' }, [el('span', { class: 'sw', 'aria-hidden': 'true' }), k.label]),
        el('td', { text: nf0.format(k.count) }),
        el('td', { text: fmt(k.pct, '%') }),
        el('td', { text: k.target + '%' }),
        el('td', { text: diff === null ? '\\u2014' : (diff > 0 ? '+' : '') + nf1.format(diff) + ' pts' }),
        el('td', null, [stIcon(k.status)])
      ]);
    });
    rows.forEach(function (tr, i) { tr.firstChild.firstChild.style.background = ENDING_COLOR[e.kinds[i].kind]; });
    box.appendChild(el('div', { class: 'table-wrap' }, [el('table', null, [
      el('thead', null, [el('tr', null, ['Final', 'Qtde', 'Real', 'Meta', 'Diferen\\u00e7a', 'Status'].map(function (h, i) {
        return el('th', { class: i === 0 ? 'txt' : null, scope: 'col', text: h });
      }))]),
      el('tbody', null, rows)
    ])]));
    var o = outcomes;
    box.appendChild(el('p', { class: 'caption', text: '1\\u00aas campanhas: ' + nf0.format(o.total) + ' no total \\u00b7 ' +
      nf0.format(o.reached20) + ' chegaram ao dia 20 \\u00b7 ' + nf0.format(o.gameover) + ' terminaram em game over \\u00b7 ' +
      nf0.format(o.inProgress) + ' em andamento/abandonadas.' }));
    requestAnimationFrame(function () { fitLabels(real.segs.concat(meta.segs)); });
  }

  function table(headers, rows, textCols) {
    var tc = textCols || [0];
    return el('div', { class: 'table-wrap' }, [el('table', null, [
      el('thead', null, [el('tr', null, headers.map(function (h, i) {
        return el('th', { class: tc.indexOf(i) >= 0 ? 'txt' : null, scope: 'col', text: h });
      }))]),
      el('tbody', null, rows)
    ])]);
  }

  function renderGameovers(g) {
    var box = clear($('gameovers'));
    box.appendChild(el('h2', { text: 'Game overs' }));
    if (!g.total) { box.appendChild(el('p', { class: 'empty', text: 'Nenhum game over registrado.' })); return; }
    box.appendChild(table(['Tipo', 'Qtde', '%', 'Dia m\\u00e9dio'], g.byKind.map(function (k) {
      return el('tr', null, [
        el('td', { class: 'txt', text: k.label }),
        el('td', { text: nf0.format(k.count) }),
        el('td', { text: fmt(g.total ? (k.count / g.total) * 100 : null, '%') }),
        el('td', { text: fmt(k.avgDay, '') })
      ]);
    })));
    box.appendChild(el('p', { class: 'caption', text: 'Total: ' + nf0.format(g.total) + ' (inclui game overs depois de recarregar um save).' }));
  }

  function renderInfinite(inf) {
    var box = clear($('infinite'));
    box.appendChild(el('h2', { text: 'Modo infinito' }));
    box.appendChild(el('div', { class: 'mini' }, [
      kpi('Partidas', nf0.format(inf.runs)),
      kpi('Pontos (m\\u00e9dia)', fmt(inf.avgScore, '')),
      kpi('Liga\\u00e7\\u00f5es (m\\u00e9dia)', fmt(inf.avgCalls, '')),
      kpi('Recorde', fmt(inf.bestScore, ''))
    ]));
    if (state.difficulty) box.appendChild(el('p', { class: 'caption', text: 'O modo infinito n\\u00e3o tem dificuldade: limpe o filtro para ver as partidas.' }));
  }

  function renderPerDay(rows) {
    var box = clear($('perday'));
    if (!rows.length) { box.appendChild(el('p', { class: 'empty', text: 'Nenhum fim de dia (day_end) registrado ainda.' })); return; }
    box.appendChild(table(['Dia'].concat(DAY_COLS.map(function (c) { return c[1]; })), rows.map(function (r) {
      return el('tr', null, [el('td', { class: 'txt', text: String(r.day) })].concat(DAY_COLS.map(function (c) {
        return el('td', { text: c[0] === 'n' ? nf0.format(r.n) : fmt(r[c[0]], '') });
      })));
    })));
  }

  function renderRanking(list) {
    var box = clear($('ranking'));
    if (!list || !list.length) {
      box.appendChild(el('p', { class: 'empty', text: state.seed ? 'Ningu\\u00e9m pontuou nessa semente ainda.' : 'Ranking vazio.' }));
      return;
    }
    box.appendChild(table(['#', 'Nome', 'Pontos', 'Liga\\u00e7\\u00f5es', 'Acertos', 'Semente', 'Quando'], list.map(function (r, i) {
      return el('tr', null, [
        el('td', { class: 'txt', text: String(i + 1) }),
        el('td', { class: 'txt', text: r.name }),
        el('td', { text: nf0.format(r.score) }),
        el('td', { text: nf0.format(r.calls) }),
        el('td', { text: nf0.format(r.correct) + (r.calls ? ' (' + nf0.format((r.correct / r.calls) * 100) + '%)' : '') }),
        el('td', { class: 'txt', text: r.seed }),
        el('td', { text: stamp.format(new Date(r.createdAt)) })
      ]);
    }), [0, 1, 5]));
  }

  // ---- controles ----------------------------------------------------------------
  function schedule() {
    if (timer) { clearInterval(timer); timer = null; }
    if (state.auto) timer = setInterval(function () { if (!document.hidden) load(); }, 30000);
  }
  $('f-diff').value = state.difficulty;
  $('f-since').value = state.since;
  $('f-seed').value = state.seed;
  $('f-auto').checked = state.auto;
  $('f-diff').addEventListener('change', function () { state.difficulty = this.value; syncUrl(); load(); });
  $('f-since').addEventListener('change', function () { state.since = this.value; syncUrl(); load(); });
  $('f-auto').addEventListener('change', function () { state.auto = this.checked; syncUrl(); schedule(); });
  $('f-refresh').addEventListener('click', load);
  $('rank-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    state.seed = $('f-seed').value.trim();
    syncUrl();
    load();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && state.auto) load(); });
  schedule();
  load();
})();
`;

export interface AdminPageOptions {
  nonce: string;
  version: string;
}

export function renderAdminPage(o: AdminPageOptions): string {
  const nonce = escapeHtml(o.nonce);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Central de Calibragem</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <div class="brand">
      <span class="cross" aria-hidden="true"></span>
      <div>
        <h1>QAP &middot; Central de regula&ccedil;&atilde;o<span class="cursor" aria-hidden="true"></span></h1>
        <p class="sub">Painel de calibragem do playtest &mdash; metas da se&ccedil;&atilde;o 2.8 do design</p>
      </div>
    </div>
    <div class="status" id="status" aria-live="polite">carregando&hellip;</div>
  </header>
  <nav class="filters" aria-label="Filtros">
    <label>Dificuldade
      <select id="f-diff">
        <option value="">todas</option>
        <option value="narrativo">narrativo</option>
        <option value="padrao">padr&atilde;o</option>
        <option value="real">real</option>
      </select>
    </label>
    <label>Desde <input type="date" id="f-since"></label>
    <label><input type="checkbox" id="f-auto"> atualizar a cada 30 s</label>
    <button type="button" id="f-refresh">Atualizar</button>
  </nav>
  <noscript><p class="error">O painel precisa de JavaScript. Os dados crus est&atilde;o em <a href="/api/metrics">/api/metrics</a>.</p></noscript>
  <main id="main">
    <div id="error" class="error" role="alert" hidden></div>
    <section aria-label="Totais"><div class="kpis" id="kpis"></div></section>
    <section aria-labelledby="h-metas">
      <h2 id="h-metas">Metas de calibragem</h2>
      <div class="grid" id="metrics"></div>
    </section>
    <section class="panel" id="endings" aria-labelledby="h-finais"></section>
    <div class="two">
      <section class="panel" id="gameovers"></section>
      <section class="panel" id="infinite"></section>
    </div>
    <section class="panel" aria-labelledby="h-dias">
      <h2 id="h-dias">M&eacute;dias por dia (fim do dia)</h2>
      <p class="caption">M&eacute;dia dos valores enviados em <code>day_end</code>; quando um dia &eacute; rejogado, vale o &uacute;ltimo registro.</p>
      <div id="perday"></div>
    </section>
    <section class="panel" aria-labelledby="h-rank">
      <div class="panel-head">
        <h2 id="h-rank">Ranking &mdash; modo infinito</h2>
        <form id="rank-form" role="search"><label>Semente <input id="f-seed" placeholder="todas" maxlength="64" size="16"></label> <button type="submit">Filtrar</button></form>
      </div>
      <div id="ranking"></div>
    </section>
  </main>
  <footer>QAP &mdash; Emergency Dispatch &middot; servidor v${escapeHtml(o.version)} &middot; dados crus em <a href="/api/metrics">/api/metrics</a></footer>
</div>
<div id="tip" class="tip" role="tooltip" hidden></div>
<script nonce="${nonce}">${SCRIPT}</script>
</body>
</html>
`;
}
