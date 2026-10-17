// Gera docs/VALIDAR_MEDICO.md: tudo o que a equipe médica precisa revisar.
// Uso: npx vite-node scripts/medical-review.ts
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { CONTENT } from '../src/content/index';
import { newGameState, makeCtx } from '../src/engine/state';
import { hm, fmtTime } from '../src/engine/util';
import type { CallDef, TruthDef, Ctx } from '../src/engine/types';
import { resolveTokens } from '../src/engine/text';

const ROOT = process.cwd();
const out: string[] = [];
const w = (s = '') => out.push(s);
const RES: Record<string, string> = { USA: 'USA', USB: 'USB', ORI: 'Orientação', TROTE: 'Trote' };
const SUP: Record<string, string> = { PM: 'PM', BOMB: 'Bombeiros' };
const SEV: Record<string, string> = { vermelho: '🟥 vermelho', amarelo: '🟨 amarelo', verde: '🟩 verde', azul: '🟦 azul', trote: '— trote' };

function ctxFor(day: number, flags: Record<string, boolean | string | number> = {}): Ctx {
  const st = newGameState({ gender: 'M', difficulty: 'padrao', seed: 1 });
  st.day = day;
  Object.assign(st.flags, flags);
  return makeCtx(st);
}

function truthsOf(def: CallDef, day: number): { label: string; t: TruthDef }[] {
  if (typeof def.truth !== 'function') return [{ label: '', t: def.truth }];
  // verdades que dependem do estado: tenta algumas combinações comuns
  const seen = new Map<string, { label: string; t: TruthDef }>();
  const tries: [string, Record<string, boolean>][] = [
    ['padrão', {}],
    ['com bombinha', { bombinha: true }],
    ['se a família estiver fora', { lucia_fora: true }],
  ];
  for (const [label, flags] of tries) {
    try {
      const t = def.truth(ctxFor(day, flags));
      const key = JSON.stringify(t);
      if (!seen.has(key)) seen.set(key, { label, t });
    } catch {
      /* depende de algo que não simulamos */
    }
  }
  return [...seen.values()];
}

function stripMarkup(s: string): string {
  return resolveTokens(s, 'M').replace(/\{\{([^|}]*)\|[^}]*\}\}/g, '$1');
}

w('# Revisão médica: o que validar');
w();
w('Gerado automaticamente a partir do conteúdo do jogo (`npx vite-node scripts/medical-review.ts`). Para cada ligação: o diagnóstico que o jogo considera verdadeiro, a gravidade, a decisão aceita como correta, o apoio, o destino, as perguntas obrigatórias e a janela de risco (em minutos desde a chegada da ligação: até `bom` o paciente sobrevive; depois de `ruim` não sobrevive; entre os dois, a chance cai em linha reta). Corrija direto no arquivo indicado e rode `npm test`.');
w();
w('Legenda: ⚖ = mais de uma decisão é aceita (a primeira é a preferida). Texto entre colchetes é marcação de cena. As falas foram encurtadas.');
w();

// ---------------------------------------------------------------- comentários [validar]
const marks: string[] = [];
function walk(dir: string) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f)) {
      const lines = readFileSync(p, 'utf8').split('\n');
      lines.forEach((l, i) => {
        if (/\[validar\]/i.test(l)) marks.push(`- \`${relative(ROOT, p)}:${i + 1}\` — ${l.trim().replace(/^\/\/\s*/, '').slice(0, 220)}`);
      });
    }
  }
}
walk(join(ROOT, 'src/content'));

// ---------------------------------------------------------------- ligações
for (let d = 1; d <= 20; d++) {
  const day = CONTENT.days[d];
  if (!day) continue;
  w(`## Dia ${d}: ${day.title}`);
  w();
  w('| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |');
  w('|---|---|---|---|---|---|---|---|---|---|');
  for (const def of day.calls) {
    const file = `src/content/days/d${String(d).padStart(2, '0')}.ts`;
    for (const { label, t } of truthsOf(def, d)) {
      const ok = t.ok.map((r) => RES[r] ?? r).join(' ou ');
      const multi = t.ok.filter((r) => r !== 'TROTE').length > 1 ? '⚖ ' : '';
      const guide = def.guide ? (typeof def.guide.id === 'function' ? 'varia' : def.guide.id) : '';
      const risk = t.risk ? `${t.risk.good}/${t.risk.bad}${t.risk.needs ? ' (' + t.risk.needs + ')' : ''}${t.risk.guideBonus ? ' +' + t.risk.guideBonus + ' c/ orientação' : ''}` : '';
      w(
        `| ${def.at} | \`${def.id}\`${def.anchor ? ' ★' : ''}${label ? ` *(${label})*` : ''}<br>${def.patient.name}${def.patient.age ? ', ' + def.patient.age : ''} | ${t.dx}${t.inevitable ? ' *(inevitável)*' : ''} | ${SEV[t.sev] ?? t.sev} | ${multi}${ok}${t.ref?.length ? ' → ' + t.ref.join('/') : ''} | ${(t.sup ?? []).map((s) => SUP[s]).join(', ')} | ${(t.dest ?? []).join('/')} | ${(t.must ?? []).join(', ')} | ${risk} | ${guide} |`,
      );
    }
    void file;
  }
  w();
  // aberturas (para checar se o relato bate com a verdade)
  w('<details><summary>Aberturas das ligações</summary>');
  w();
  for (const def of day.calls) {
    let open: string[] = [];
    try {
      const raw = typeof def.open === 'function' ? def.open(ctxFor(d)) : def.open;
      open = raw.map((l) => (typeof l === 'string' ? l : typeof l.t === 'function' ? l.t(ctxFor(d)) : l.t)).map(stripMarkup);
    } catch {
      open = ['(depende do estado)'];
    }
    w(`- **${def.id}** (${def.at}): ${open.join(' / ').slice(0, 400)}`);
  }
  w();
  w('</details>');
  w();
}

// ---------------------------------------------------------------- roteiros de orientação
w('## Roteiros de orientação por telefone');
w();
w('Cada passo mostra a fala de quem liga e as opções do jogador. ✅ = conduta que o jogo considera certa; ❌ = errada (aumenta o pânico ou piora a qualidade); 🤝 = acalma.');
w();
for (const g of Object.values(CONTENT.guides)) {
  w(`### ${g.title} (\`${g.id}\`, ${g.kind})`);
  w();
  w(`*${g.intro}*`);
  if (g.card) w(`> Cartão exibido: ${g.card}`);
  if (g.kind === 'rcp') w(`- Metrônomo: ${g.bpm ? g.bpm.join('–') : '110'} compressões por minuto; troca de quem comprime a cada ${g.tiredEvery ?? 12} s de jogo.`);
  for (const [i, st] of (g.steps ?? []).entries()) {
    w(`${i + 1}. **${st.who ?? 'Quem liga'}:** ${st.say}`);
    for (const o of st.options) w(`   - ${o.kind === 'certo' ? '✅' : o.kind === 'errado' ? '❌' : o.kind === 'calma' ? '🤝' : '·'} ${o.label}${o.reply ? ` → *${o.reply}*` : ''}`);
  }
  w(`- Sucesso: ${g.success}`);
  w(`- Falha: ${g.fail}`);
  w();
}

// ---------------------------------------------------------------- Intervenção
w('## Intervenção: ocorrências do plantão extra na ambulância (USA 01)');
w();
w('Em tempo real: o estado do paciente cai a cada segundo até as condutas críticas serem feitas. ✅ crítica (o que salva) · 🔎 achado · ➕ ajuda · · neutra (só gasta tempo) · ❌ dano (piora). Ver docs/INTERVENCAO.md.');
w();
const KIND_ICON: Record<string, string> = { critico: '✅', info: '🔎', ajuda: '➕', neutro: '·', dano: '❌' };
/** marcadores do texto da Intervenção como o jogo resolve (viatura, hora da ocorrência, doutor/doutora) */
const fieldText = (t: string) => t.split('{unit}').join('USA 01').split('{hora}').join('[hora]').split('{dr}').join('doutor(a)').split('{Dr}').join('Doutor(a)');
for (const fc of CONTENT.field?.cases ?? []) {
  w(`### ${fc.title} (\`${fc.id}\`)`);
  w(`- Rádio: ${fieldText(fc.radio)}`);
  w(`- Na cena: ${fieldText(fc.see.join(' '))}`);
  const vit = Object.entries(fc.vitals).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(', ');
  if (vit) w(`- Sinais: ${vit}${fc.vitalsAfter ? ` → depois de estabilizado: ${Object.entries(fc.vitalsAfter).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(', ')}` : ''}`);
  w(`- Destino aceito: ${fc.dest.join(' ou ') || '(sem transporte)'}${fc.scoop ? ' · tratamento definitivo no hospital: chegar rápido' : ''}${fc.unsafe ? ' · cena insegura: esperar a PM' : ''}`);
  for (const a of fc.actions) w(`  - ${KIND_ICON[a.kind] ?? '·'} **${a.label}** (${a.cost} s${a.needs ? `; antes: ${a.needs.join(', ')}` : ''}): ${fieldText(a.say)}`);
  w(`- Fechamento: ${fieldText(fc.debrief)}`);
  w(`- Referência: ${fc.source}`);
  w();
}

// ---------------------------------------------------------------- manual
w('## Manual de Regulação (como aparece no jogo)');
w();
for (const p of CONTENT.manual) {
  w(`### ${p.code} ${p.title} (dia ${p.day})`);
  if (p.intro) w(p.intro);
  for (const r of p.rules) w(`- ${r.text}`);
  w();
}

// ---------------------------------------------------------------- marcações
w('## Trechos marcados com [validar] no código');
w();
w(marks.length ? marks.join('\n') : '(nenhum)');
w();
w(`---\nGerado em ${new Date().toISOString().slice(0, 10)}. Horários em formato de jogo; ${fmtTime(hm('07:00'))} é o início do plantão.`);

writeFileSync(join(ROOT, 'docs/VALIDAR_MEDICO.md'), out.join('\n') + '\n');
console.log(`docs/VALIDAR_MEDICO.md: ${out.length} linhas, ${marks.length} marcações [validar].`);
