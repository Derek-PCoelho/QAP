// =============================================================================
// Videochamada de averiguação (Programa VER).
//
// Não é uma câmera de verdade: é uma cena desenhada pelo jogo a partir da
// verdade clínica da ligação (ou de uma cena escrita à mão no conteúdo).
// Regras (docs/VIDEOCHAMADA.md):
//  · franquia de vídeos por plantão (padrão 3); só gasta franquia se conectar;
//  · pedir o link custa 2 min mesmo quando dá errado (recusa, celular sem
//    câmera, quem liga longe do paciente);
//  · conectar custa de 3 a 8 min conforme o sinal do bairro (chuva piora);
//  · cada "mostre…" custa de 3 a 6 min (mais com sinal ruim);
//  · o vídeo mostra cor, postura, esforço para respirar, sangue, deformidade e
//    o ambiente; não mostra pressão, glicemia, pulso nem temperatura;
//  · trote filmado vale prova (lei do trote): bônus no carimbo.
// =============================================================================
import type { CallRT, CallDef, VideoDef, VideoRT, VideoScene, VideoSpot, AnswerIn, Ctx, TruthDef } from './types';
import type { ShiftSim } from './shift';
import { normLines, txt, resolveTokens } from './text';
import { hashString, Rng } from './util';

export const VIDEO_REQUEST_COST = 2;
export const VIDEO_PROOF_BONUS = 10;

const CONNECT: Record<VideoRT['signal'], number> = { bom: 3, fraco: 5, ruim: 7 };
const LOOK_MULT: Record<VideoRT['signal'], number> = { bom: 1, fraco: 1.3, ruim: 1.6 };

/** sinal de celular por bairro (Santa Aurora) */
const SIGNAL_BY_BAIRRO: Record<string, VideoRT['signal']> = {
  Centro: 'bom',
  'Jardim Norte': 'bom',
  'Bela Vista': 'bom',
  'Santa Luzia': 'bom',
  'Jardim Primavera': 'fraco',
  'Vila Nova': 'fraco',
  'Parque das Exposições': 'fraco',
  'Vila Esperança': 'fraco',
  'Distrito Industrial': 'ruim',
};
const WORSE: Record<VideoRT['signal'], VideoRT['signal']> = { bom: 'fraco', fraco: 'ruim', ruim: 'ruim' };

export type VideoStartResult = 'conectou' | 'recusou' | 'remoto' | 'fez_mal' | 'sem_franquia' | 'indisponivel' | 'ja_ativo';

export interface VideoSpotView {
  id: string;
  label: string;
  cost: number;
  seen: boolean;
}

export interface VideoView {
  /** o piloto existe neste plantão */
  enabled: boolean;
  credits: number;
  used: number;
  /** dá para pedir agora (ligação ativa, sem decisão, com franquia) */
  canStart: boolean;
  reason?: string;
  video?: VideoRT;
  spots: VideoSpotView[];
  tries: number;
}

/** o piloto vale neste plantão? */
export function videoEnabled(sim: ShiftSim): boolean {
  const cv = sim.c.video;
  if (!cv) return false;
  if (sim.st.mode === 'simone') return false;
  if (sim.st.mode === 'infinito') return true;
  return sim.st.day >= cv.fromDay;
}

/** franquia do plantão (cria se faltar — saves antigos) */
export function videoBudget(sim: ShiftSim): NonNullable<ShiftSim['sh']['video']> {
  if (!sim.sh.video) sim.sh.video = { credits: videoEnabled(sim) ? sim.c.video?.credits ?? 0 : 0, used: 0, proofs: 0, minutes: 0 };
  return sim.sh.video;
}

/** definição efetiva: a cena escrita no conteúdo por cima da cena gerada da verdade */
export function videoDefOf(sim: ShiftSim, call: CallRT): VideoDef {
  const def = sim.defOf(call);
  const c = sim.ctx();
  const t = sim.truthOf(call);
  const base = sim.c.video?.build(def, t, c, call.id) ?? {};
  const own = typeof def.video === 'function' ? def.video(c) : def.video;
  if (!own) return base;
  return {
    ...base,
    ...own,
    // cena e pontos: os do conteúdo substituem os gerados quando existem
    scene: own.scene ?? base.scene,
    spots: own.spots ?? base.spots,
    first: own.first ?? (own.scene ? undefined : base.first),
  };
}

function sceneOf(vd: VideoDef, c: Ctx): VideoScene {
  const s = typeof vd.scene === 'function' ? vd.scene(c) : vd.scene;
  return s ?? { place: 'sala', patient: { pose: 'sentado' } };
}

function signalFor(sim: ShiftSim, def: CallDef, vd: VideoDef): VideoRT['signal'] {
  let s: VideoRT['signal'] = vd.signal ?? SIGNAL_BY_BAIRRO[def.addr.bairro] ?? 'fraco';
  if (sim.sh.flood && !vd.signal) s = WORSE[s];
  return s;
}

function spotCost(base: number | undefined, signal: VideoRT['signal']): number {
  return Math.max(2, Math.round((base ?? 4) * LOOK_MULT[signal]));
}

function visibleSpots(sim: ShiftSim, vd: VideoDef): VideoSpot[] {
  const c = sim.ctx();
  return (vd.spots ?? []).filter((s) => !s.when || s.when(c));
}

export function videoView(sim: ShiftSim, call?: CallRT): VideoView {
  const enabled = videoEnabled(sim);
  const b = videoBudget(sim);
  const view: VideoView = { enabled, credits: b.credits, used: b.used, canStart: false, spots: [], tries: call?.videoTries ?? 0 };
  if (!enabled) return { ...view, reason: 'O piloto de videochamada ainda não começou.' };
  if (!call) return { ...view, reason: 'Nenhuma ligação ativa.' };
  view.video = call.video;
  if (call.video?.state === 'ativo') {
    const vd = videoDefOf(sim, call);
    view.spots = visibleSpots(sim, vd).map((s) => ({ id: s.id, label: resolveTokens(txt(s.label, sim.ctx()), sim.st.gender, sim.st), cost: spotCost(s.cost, call.video!.signal), seen: call.video!.seen.includes(s.id) }));
    return view;
  }
  if (call.status !== 'ativa') return { ...view, reason: 'A ligação não está ativa.' };
  if (call.decision) return { ...view, reason: 'Ligação já regulada.' };
  if (sim.sh.guideCallId) return { ...view, reason: 'Termine a orientação primeiro.' };
  if (sim.defOf(call).special === 'mci') return { ...view, reason: 'Múltiplas vítimas: o vídeo não dá conta da cena.' };
  if (b.credits <= 0) return { ...view, reason: 'A franquia de vídeo do plantão acabou.' };
  if ((call.videoTries ?? 0) >= 2) return { ...view, reason: 'Quem liga já recusou duas vezes.' };
  view.canStart = true;
  return view;
}

/** empurra linhas de vídeo: "[...]" vira descrição da câmera; o resto é fala de quem liga */
export function pushVideoLines(sim: ShiftSim, call: CallRT, ans: AnswerIn | undefined) {
  if (ans === undefined) return;
  const def = sim.defOf(call);
  const c = sim.ctx();
  const raw = typeof ans === 'function' ? ans(c) : ans;
  for (const l of normLines(raw, c)) {
    if (l.noise || l.who === 'VÍDEO') {
      const text = l.text.replace(/^\[\s*/, '').replace(/\s*\]$/, '');
      sim.pushRawLine(call, 'VÍDEO', text, 'video');
    } else sim.pushRawLine(call, l.who ?? sim.callerLabel(def), l.text, 'caller', l.style);
  }
}

/** pede a videochamada na ligação ativa */
export function startVideo(sim: ShiftSim): VideoStartResult {
  const call = sim.active();
  if (!call) return 'indisponivel';
  if (call.video?.state === 'ativo') return 'ja_ativo';
  const view = videoView(sim, call);
  if (!view.canStart) return view.credits <= 0 && view.enabled ? 'sem_franquia' : 'indisponivel';
  const def = sim.defOf(call);
  const c = sim.ctx();
  const vd = videoDefOf(sim, call);
  const b = videoBudget(sim);
  call.videoTries = (call.videoTries ?? 0) + 1;
  sim.regLine(call, 'Vou te mandar um link por mensagem. Abre que eu quero ver aí, por vídeo. Pode ser?');
  sim.advance(VIDEO_REQUEST_COST);
  b.minutes += VIDEO_REQUEST_COST;
  // pedir vídeo aqui faz mal (vítima escondida, crise suicida)
  if (vd.harmful) {
    pushVideoLines(sim, call, vd.harmful.lines);
    call.patience = Math.max(0, call.patience - (vd.harmful.patience ?? 25));
    if (vd.harmful.effect) vd.harmful.effect(sim.eff());
    if (vd.harmful.hangup) sim.callerHangsUp(call);
    sim.emit({ type: 'lines', callId: call.id });
    return 'fez_mal';
  }
  // quem liga não está com o paciente
  const remote = typeof vd.remote === 'function' ? vd.remote(c) : !!vd.remote;
  if (remote) {
    pushVideoLines(sim, call, sim.c.video?.remoteLines(def, c) ?? ['Mas eu não tô aí, {dr}.']);
    return 'remoto';
  }
  // recusa (celular sem câmera, desconfiança, trote)
  if (vd.refuse && (!vd.refuse.when || vd.refuse.when(c))) {
    pushVideoLines(sim, call, vd.refuse.lines);
    if (vd.refuse.hangup) {
      const t = sim.truthOf(call);
      if (t.sev === 'trote') {
        call.resultText = 'Desligou quando você pediu o vídeo.';
        sim.sysLine(call, '📹 Quem liga desligou quando você pediu o vídeo.');
      }
      sim.callerHangsUp(call);
      // a ligação sai da tela no mesmo instante (a transcrição some com ela): sem o aviso,
      // parece que a chamada sumiu sozinha
      sim.toast('📹 Quem ligou desligou quando você pediu o vídeo.', 'info');
    }
    return 'recusou';
  }
  // conecta
  const signal = signalFor(sim, def, vd);
  const conn = CONNECT[signal] + (new Rng(hashString(`${sim.st.seed}:${call.id}:video`)).chance(0.5) ? 1 : 0);
  sim.advance(conn);
  b.credits = Math.max(0, b.credits - 1);
  b.used++;
  b.minutes += conn;
  const t = sim.truthOf(call);
  call.video = {
    state: 'ativo',
    at: sim.sh.time,
    signal,
    scene: sceneOf(vd, c),
    focus: 'geral',
    seen: [],
    proof: vd.proof ?? t.sev === 'trote',
    minutes: VIDEO_REQUEST_COST + conn,
  };
  sim.sysLine(call, `📹 Videochamada conectada · sinal ${signal}${signal !== 'bom' ? ' (a imagem trava)' : ''}.`);
  pushVideoLines(sim, call, vd.first);
  videoNotes(sim, call);
  sim.emit({ type: 'lines', callId: call.id });
  return 'conectou';
}

/** pede para mostrar algo */
export function videoLook(sim: ShiftSim, spotId: string): boolean {
  const call = sim.active();
  if (!call || call.video?.state !== 'ativo') return false;
  const vd = videoDefOf(sim, call);
  const spot = visibleSpots(sim, vd).find((s) => s.id === spotId);
  if (!spot) return false;
  const c = sim.ctx();
  const label = resolveTokens(txt(spot.label, c), sim.st.gender, sim.st);
  sim.regLine(call, label.replace(/^Mostrar/, 'Me mostra').replace(/\.?$/, ', por favor.'));
  pushVideoLines(sim, call, spot.see);
  const v = call.video;
  if (!v.seen.includes(spot.id)) v.seen.push(spot.id);
  v.focus = spot.focus ?? 'geral';
  if (spot.scene) v.scene = { ...v.scene, ...spot.scene };
  for (const u of spot.unlocks ?? []) if (!call.unlocked.includes(u)) call.unlocked.push(u);
  if (spot.onSee) spot.onSee(sim.eff());
  videoNotes(sim, call);
  const cost = spotCost(spot.cost, v.signal);
  sim.advance(cost);
  v.minutes += cost;
  videoBudget(sim).minutes += cost;
  sim.emit({ type: 'lines', callId: call.id });
  return true;
}

/** volta para o plano geral (sem custo) */
export function videoWide(sim: ShiftSim) {
  const call = sim.active();
  if (call?.video?.state === 'ativo') call.video.focus = 'geral';
}

/** encerra o vídeo (botão, carimbo, espera, queda) */
export function endVideo(sim: ShiftSim, call: CallRT | undefined, why?: string) {
  if (!call?.video || call.video.state !== 'ativo') return;
  call.video.state = 'encerrado';
  if (why) sim.sysLine(call, `📹 Vídeo encerrado${why ? ' (' + why + ')' : ''}.`);
}

/** bônus por trote comprovado em vídeo (chamado no carimbo TROTE) */
export function videoProofOnStamp(sim: ShiftSim, call: CallRT, truth: TruthDef): boolean {
  if (!call.video?.proof || truth.sev !== 'trote') return false;
  if (truth.prankKind === 'acidental' || truth.prankKind === 'teste' || truth.prankKind === 'desabafo') return false;
  videoBudget(sim).proofs++;
  sim.addBonus(VIDEO_PROOF_BONUS, 'Trote comprovado em vídeo (lei do trote)');
  sim.sysLine(call, '📹 Gravação anexada ao registro do trote e enviada à PM (lei municipal do trote).');
  return true;
}

/** o que se repara no vídeo, quando a regra do manual já foi recebida (antes: pares do Modo Inconsistência) */
const VIDEO_LINKS: { clue: string; rule: string; insight: string }[] = [
  { clue: 'video_trote', rule: 'trote_sinais', insight: 'Ninguém ferido e gente rindo atrás da câmera: trote. A gravação vale prova (p.3-V).' },
  { clue: 'video_trote', rule: 'video_trote', insight: 'Trote filmado: carimbe TROTE e a gravação segue para a PM.' },
  { clue: 'video_purpura', rule: 'video_copo', insight: 'Manchas que não somem no teste do copo: púrpura. Vermelho — USA.' },
  { clue: 'video_cianose', rule: 'asma_grave', insight: 'Lábios roxos: falta oxigênio. É crise grave.' },
  { clue: 'video_cianose', rule: 'parada', insight: 'Lábios roxos e sem resposta: trate como parada até prova em contrário.' },
  { clue: 'video_nao_respira', rule: 'parada', insight: 'O peito não se mexe, só suspiros: isso é parada. USA e RCP guiada agora.' },
  { clue: 'video_face_torta', rule: 'fast', insight: 'Boca torta ao sorrir: FAST positivo. Suspeita de AVC — pergunte a hora do início.' },
  { clue: 'video_braco_caido', rule: 'fast', insight: 'Um braço cai: FAST positivo.' },
  { clue: 'video_bell', rule: 'fast', insight: 'A testa também paralisou desse lado: padrão de paralisia facial periférica (Bell), não de AVC. Confira braço e fala antes de decidir.' },
  { clue: 'video_palido_suor', rule: 'peito', insight: 'Pálido e suando frio: sinal de gravidade (p.3). Não é "só uma dorzinha".' },
  { clue: 'video_rigidez', rule: 'video_morte', insight: 'Rigidez: sinal de morte evidente. Dá para constatar por telemedicina (RM7).' },
  { clue: 'video_livores', rule: 'video_morte', insight: 'Manchas roxas nas partes de baixo do corpo (livores): sinal de morte evidente.' },
  { clue: 'video_silencioso', rule: 'torax_silencioso', insight: 'Parou de chiar e o peito quase não mexe: tórax silencioso. Gravíssimo.' },
  { clue: 'video_esforco', rule: 'asma_grave', insight: 'Costelas afundando e frases cortadas: esforço respiratório grave.' },
  { clue: 'video_insulina', rule: 'hipoglicemia', insight: 'Caneta de insulina na mesa: pense em hipoglicemia antes de pensar em bebida.' },
  { clue: 'video_caustico', rule: 'intox_grave', insight: 'Boca vermelha e baba sem parar: cáustico. Vermelho.' },
  { clue: 'video_cartela', rule: 'intox_grave', insight: 'A cartela confirma remédio de adulto ao alcance da criança.' },
  { clue: 'video_faca', rule: 'surto', insight: 'Faca ao alcance numa agitação: risco para terceiros. PM junto com a viatura.' },
  { clue: 'video_fio', rule: 'bombeiros', insight: 'Fio caído na água: Bombeiros, e ninguém toca na vítima antes de desligar a energia.' },
  { clue: 'video_choque', rule: 'dengue_grave', insight: 'Pele acinzentada e suada: sinais de choque.' },
];

/** depois de cada imagem nova: mostra uma vez o que se repara (pista do vídeo × regra do manual já recebida) */
export function videoNotes(sim: ShiftSim, call: CallRT) {
  if (!call.video) return;
  const present = new Set<string>();
  for (const l of call.lines) {
    if (l.kind !== 'video') continue;
    for (const m of l.text.matchAll(/\{\{[^|}]*\|([^}]+)\}\}/g)) present.add(m[1]);
  }
  const rules = new Set<string>();
  for (const pid of sim.st.manual) for (const r of sim.c.manual.find((p) => p.id === pid)?.rules ?? []) rules.add(r.id);
  for (const x of VIDEO_LINKS) {
    if (!present.has(x.clue) || !rules.has(x.rule)) continue;
    const key = 'vnota:' + x.clue;
    if (call.unlocked.includes(key)) continue;
    call.unlocked.push(key);
    sim.sysLine(call, x.insight, 'insight');
  }
}
