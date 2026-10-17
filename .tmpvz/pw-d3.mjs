// Joga a vaga zero do dia 3 no navegador (Chromium do /opt/pw-browsers) e tira capturas.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? '/tmp/claude-0/-home-user/6e7d3fa3-585b-5285-8990-503647078a43/scratchpad/vagazero';
const DAY = Number(process.argv[3] ?? 3);
const CALL = process.argv[4] ?? 'd03_conceicao';
const PREFIX = process.argv[5] ?? 'd3';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text());
});
await page.goto(`http://localhost:5397/?dia=${DAY}`);
await page.waitForFunction(() => !!window.__store);
await page.mouse.click(10, 10);
await page.evaluate(({ DAY }) => {
  const s = window.__store;
  s.updateSettings({ tutorial: false });
  s.newGame({ gender: 'F', difficulty: 'padrao', variable: false, startDay: DAY, seed: 7 });
}, { DAY });
await page.waitForTimeout(500);
// jornal → plantão; pula cenas (ida, passagem)
const prep = await page.evaluate(({ CALL }) => {
  const s = window.__store;
  const g = s.game;
  g.newspaper();
  g.beginShift();
  const skip = () => {
    let n = 0;
    while (g.scene && n++ < 200) {
      const ch = g.scene.choices().filter((x) => !x.disabled);
      if (ch.length) g.sceneChoose(ch[0].idx);
      else g.sceneContinue();
    }
  };
  skip();
  const sh = g.shift;
  const call = Object.values(sh.sh.calls).find((c) => c.def === CALL);
  // corre o relógio até a ligação chegar (respondendo o que aparecer)
  let guard = 0;
  while (call.pendingArrival && guard++ < 3000) {
    for (const m of [...sh.sh.modals]) sh.ackModal(m.id, m.options?.[0]?.id);
    for (const r of [...sh.sh.requests]) sh.answerRequest(r.id, r.options[r.options.length - 1].id);
    skip();
    if (sh.sh.activeId) sh.hold();
    if (sh.sh.vz) {
      while (sh.sh.vz && sh.sh.vz.state !== 'fim') sh.sh.vz.state === 'impasse' ? sh.vzDesistir() : sh.vzChoose(sh.sh.vz.cards[0].id);
      sh.vzClose();
    }
    sh.processUntil(sh.sh.time + 1);
  }
  delete sh.sh.flags['almocoPendente'];
  sh.answer(call.id);
  for (const q of ['oque', 'consciencia', 'respira', 'pele']) sh.ask(q);
  s.notify();
  return { time: sh.sh.time, id: call.id };
}, { CALL });
console.log('call answered', prep);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/${PREFIX}-0-ligacao.png` });
// carimba pela ficha (vermelho, USA, Regional se pedir)
await page.click('.opts.colors button.col-vermelho');
await page.click('.opts.res button:has-text("USA")');
const dest = await page.$('.opts.dest button:has-text("Regional")');
if (dest) await dest.click();
await page.waitForTimeout(150);
await page.click('.stamp-btn.ready');
await page.waitForTimeout(350);
await page.screenshot({ path: `${OUT}/${PREFIX}-1-entrada.png` });
// orientação por telefone (D5: coluna) antes da negociação
const guide = await page.evaluate(() => !!window.__store.game.shift.sh.guideCallId);
if (guide) {
  await page.evaluate(() => {
    const sh = window.__store.game.shift;
    sh.finishGuide(0.9, true);
    window.__store.notify();
  });
  await page.waitForTimeout(350);
}
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/${PREFIX}-2-congelado.png` });
// espera as falas e os cartões
await page.waitForSelector('.vz-cards.ready', { timeout: 20000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/${PREFIX}-3-cartoes.png` });
const info = await page.evaluate(() => {
  const sh = window.__store.game.shift;
  const vz = sh.sh.vz;
  return { clock: sh.sh.time, round: vz.round, res: vz.resistance, peixoto: vz.peixoto, cards: vz.cards.map((c) => [c.id, sh.vzCardInfo(c.id)?.kind, c.hint ? 'dica' : '']) };
});
console.log('vz', JSON.stringify(info));
const STRAT = process.argv[6] ?? 'bom';
// joga: escolhe o melhor cartão (ou, no D5, empurra até o botão do Peixoto acender e passa)
for (let r = 0; r < 6; r++) {
  const st = await page.evaluate(() => {
    const sh = window.__store.game.shift;
    const vz = sh.sh.vz;
    if (!vz) return null;
    return { state: vz.state, peixoto: vz.peixoto, res: vz.resistance, cards: vz.cards.map((c) => ({ id: c.id, k: sh.vzCardInfo(c.id) })) };
  });
  if (!st || st.state === 'fim') break;
  if (STRAT === 'peixoto' && st.peixoto === 'aceso') {
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${PREFIX}-4-peixoto-aceso.png` });
    await page.click('.vz-escala.lit');
    await page.waitForTimeout(300);
    break;
  }
  if (st.state === 'impasse') {
    await page.screenshot({ path: `${OUT}/${PREFIX}-4-impasse.png` });
    break;
  }
  const good = st.cards.find((c) => c.k?.kind === 'bom' && c.k?.tag !== 'mentira') ?? st.cards[0];
  await page.click(`.vz-card:nth-child(${st.cards.findIndex((c) => c.id === good.id) + 1})`);
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const vz = window.__store.game.shift.sh.vz;
    return !vz || vz.state !== 'negociando' || !!document.querySelector('.vz-cards.ready');
  }, { timeout: 20000 });
  await page.waitForTimeout(400);
  if (r === 0) await page.screenshot({ path: `${OUT}/${PREFIX}-4-rodada2.png` });
}
// resultado
await page.waitForSelector('.vz-result', { timeout: 20000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/${PREFIX}-5-resultado.png` });
const fim = await page.evaluate(() => {
  const sh = window.__store.game.shift;
  const vz = sh.sh.vz;
  return { result: vz.result, minutes: vz.minutes, time: sh.sh.time, saulo: window.__store.game.st.flags['saulo_confianca'], log: vz.log.map((l) => `${l.who}: ${l.text}`) };
});
console.log('fim', JSON.stringify(fim, null, 1));
await page.click('.vz-result .px-btn');
await page.waitForTimeout(450);
await page.screenshot({ path: `${OUT}/${PREFIX}-6-saida.png` });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/${PREFIX}-7-mundo-volta.png` });
const after = await page.evaluate(() => {
  const sh = window.__store.game.shift;
  return { vz: !!sh.sh.vz, time: sh.sh.time, units: Object.values(sh.sh.units).map((u) => `${u.label}:${u.status}`).join(' ') };
});
console.log('after', JSON.stringify(after));
await browser.close();
