// Simulação de balanceamento: joga a campanha inteira com os perfis de bot e
// compara com as metas do documento de design (Revisão 2.2–2.7).
// Uso: npm run simulate -- [seeds=20] [--md arquivo.md]
import { writeFileSync } from 'node:fs';
import { CONTENT } from '../src/content/index';
import { playBot, PROFILES, type BotResult } from '../src/engine/bot';

const args = process.argv.slice(2);
const seeds = Number(args.find((a) => /^\d+$/.test(a)) ?? 20);
const mdIdx = args.indexOf('--md');
const mdFile = mdIdx >= 0 ? args[mdIdx + 1] : undefined;

const TARGET: Record<string, string> = {
  lento: 'termina negativo sem plantões extras (meta: −650 antes deles), 5–6 ligações/dia',
  medio: 'entre R$ 0 e R$ 400 o jogo todo, ~+105 no fim, 7–8 ligações/dia',
  experiente: '~+900 no fim, 9–10 ligações/dia, produtividade quase todo dia',
  oraculo: 'referência (jogo perfeito)',
};

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('pt-BR');

const lines: string[] = [];
const out = (s = '') => {
  lines.push(s);
  console.log(s);
};

out(`# Simulação de balanceamento — ${seeds} campanhas por perfil`);
out('');
out('| Perfil | Fim (bom/normal/ruim/secreto) | Game over | Chegou ao D20 | Dias jogados | Lig./dia | Saldo D5 | D10 | D15 | D19/20 | Noites na ambulância | Advert. | Notas | Óbitos | Chaves salvas | Laços | Integr. | Desgaste |');
out('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
const all: Record<string, BotResult[]> = {};
for (const [key, prof] of Object.entries(PROFILES)) {
  const rs: BotResult[] = [];
  for (let s = 1; s <= seeds; s++) rs.push(playBot(CONTENT, prof, 1000 + s));
  all[key] = rs;
  const ends = { bom: 0, normal: 0, ruim: 0, secreto: 0 } as Record<string, number>;
  const gos: Record<string, number> = {};
  for (const r of rs) {
    if (r.ending) ends[r.ending] = (ends[r.ending] ?? 0) + 1;
    if (r.gameOver) gos[r.gameOver] = (gos[r.gameOver] ?? 0) + 1;
  }
  const at = (d: number) => avg(rs.filter((r) => r.moneyByDay.length >= d).map((r) => r.moneyByDay[d - 1]));
  const last = avg(rs.map((r) => r.moneyByDay[Math.min(r.moneyByDay.length, 19) - 1] ?? r.money));
  out(
    `| ${prof.name} | ${ends.bom}/${ends.normal}/${ends.ruim}/${ends.secreto} | ${Object.entries(gos).map(([k, v]) => `${k}:${v}`).join(' ') || '0'} | ${Math.round((100 * rs.filter((r) => !!r.ending).length) / rs.length)}% | ${fmt(avg(rs.map((r) => r.daysPlayed)))} | ${fmt(avg(rs.map((r) => r.handled / Math.max(1, r.daysPlayed))))} | ${fmt(at(5))} | ${fmt(at(10))} | ${fmt(at(15))} | ${fmt(last)} | ${fmt(avg(rs.map((r) => r.bicos)))} | ${fmt(avg(rs.map((r) => r.warnings)))} | ${fmt(avg(rs.map((r) => r.notes)))} | ${fmt(avg(rs.map((r) => r.deaths)))} | ${fmt(avg(rs.map((r) => r.keys)))} | ${fmt(avg(rs.map((r) => r.vars.lacos ?? 0)))} | ${fmt(avg(rs.map((r) => r.vars.integridade ?? 0)))} | ${fmt(avg(rs.map((r) => r.vars.desgaste ?? 0)))} |`,
  );
}
out('');
out('Metas do documento de design:');
for (const [k, t] of Object.entries(TARGET)) out(`- **${PROFILES[k]?.name ?? k}**: ${t}`);
const errs = Object.values(all).flatMap((rs) => rs.flatMap((r) => r.errors));
out('');
out(errs.length ? `Erros encontrados (${errs.length}):\n\n` + [...new Set(errs)].slice(0, 30).map((e) => '- ' + e).join('\n') : 'Nenhum erro de execução.');
if (mdFile) writeFileSync(mdFile, lines.join('\n') + '\n');
