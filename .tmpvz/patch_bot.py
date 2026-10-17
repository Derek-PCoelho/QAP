p='src/engine/bot.ts'
s=open(p).read()
def rep(old,new,cnt=1):
    global s
    if s.count(old)!=cnt:
        raise SystemExit(f"count {s.count(old)} != {cnt} for: {old[:80]}")
    s=s.replace(old,new)

rep("""  /** como escolhe nas cenas: 'bom' (protege família e integridade), 'neutro' (sorteia), 'pragmatico' (dinheiro primeiro) */
  ethic: 'bom' | 'neutro' | 'pragmatico';
}""","""  /** como escolhe nas cenas: 'bom' (protege família e integridade), 'neutro' (sorteia), 'pragmatico' (dinheiro primeiro) */
  ethic: 'bom' | 'neutro' | 'pragmatico';
  /** 1.1: horários (minutos do relógio) em que toma cada café */
  coffeeAt?: number[];
  /** 1.1: chance de pedir vídeo quando vale (quem liga não é confiável; caso grave, com franquia sobrando) */
  video?: number;
  /** 1.1: chance de escolher o argumento que responde à objeção na vaga zero */
  vzSkill?: number;
  /** 1.1: chance de passar ao Peixoto quando o botão acende e o Saulo empacou */
  peixoto?: number;
  /** 1.1: chance de escolher uma pergunta que muda a conduta (a caixa certa) em vez de uma ao acaso */
  askSkill?: number;
}""")

rep("""export const PROFILES: Record<string, BotProfile> = {
  lento: { name: 'Lento', accuracy: 0.75, think: [80, 120], questions: 4, coffee: 0, bicoBelow: 60, inspects: false, guideQuality: 0.55, overBias: 0.75, ethic: 'neutro' },
  medio: { name: 'Médio', accuracy: 0.86, think: [40, 60], questions: 3, coffee: 1, bicoBelow: 40, inspects: true, guideQuality: 0.75, overBias: 0.6, ethic: 'neutro' },
  experiente: { name: 'Experiente', accuracy: 0.95, think: [35, 50], questions: 2, coffee: 1, bicoBelow: 0, inspects: true, guideQuality: 0.92, overBias: 0.5, ethic: 'bom' },
  oraculo: { name: 'Oráculo', accuracy: 1, think: [15, 25], questions: 1, coffee: 0, bicoBelow: -999, inspects: true, guideQuality: 1, overBias: 0.5, ethic: 'bom' },
};""","""// 1.1: os perfis usam café, vídeo e vaga zero do jeito de cada um (docs/BALANCEAMENTO.md).
//  · Lento: um café no meio da manhã, vídeo de vez em quando com quem liga e não é confiável,
//    argumenta meio no escuro e quase nunca lembra do Peixoto;
//  · Médio: dois cafés (manhã e tarde), vídeo na maioria dos casos duvidosos, argumenta bem;
//  · Experiente: dois cafés na hora do aperto, vídeo onde rende, argumentos certos, Peixoto quando precisa;
//  · Oráculo: referência (não precisa de café).
export const PROFILES: Record<string, BotProfile> = {
  lento: { name: 'Lento', accuracy: 0.75, think: [80, 120], questions: 4, coffee: 1, coffeeAt: [600], bicoBelow: 60, inspects: false, guideQuality: 0.55, overBias: 0.75, ethic: 'neutro', video: 0.35, vzSkill: 0.55, peixoto: 0.4, askSkill: 0.5 },
  medio: { name: 'Médio', accuracy: 0.86, think: [40, 60], questions: 3, coffee: 2, coffeeAt: [600, 900], bicoBelow: 40, inspects: true, guideQuality: 0.75, overBias: 0.6, ethic: 'neutro', video: 0.7, vzSkill: 0.72, peixoto: 0.8, askSkill: 0.7 },
  experiente: { name: 'Experiente', accuracy: 0.95, think: [35, 50], questions: 2, coffee: 2, coffeeAt: [570, 960], bicoBelow: 0, inspects: true, guideQuality: 0.92, overBias: 0.5, ethic: 'bom', video: 0.9, vzSkill: 0.9, peixoto: 1, askSkill: 0.9 },
  oraculo: { name: 'Oráculo', accuracy: 1, think: [15, 25], questions: 1, coffee: 0, bicoBelow: -999, inspects: true, guideQuality: 1, overBias: 0.5, ethic: 'bom', video: 1, vzSkill: 1, peixoto: 1, askSkill: 1 },
};

/**
 * Perfis de comparação (fora da tabela principal; `npm run simulate -- 150 --extra`):
 * o mesmo Médio, só que sem gerir recursos — não toma café, não pede vídeo, argumenta ao acaso
 * na vaga zero, não lembra do Peixoto e pergunta ao acaso (como os bots da 1.0.4).
 */
export const EXTRA_PROFILES: Record<string, BotProfile> = {
  medio_sem: { ...PROFILES.medio, name: 'Médio sem recursos', coffee: 0, coffeeAt: [], video: 0, vzSkill: 0, peixoto: 0, askSkill: 0 },
};""")

rep("""    const s = sh.sh;
    // modais""","""    const s = sh.sh;
    // 1.1: vaga zero aberta (o relógio está parado)
    if (s.vz) {
      playVagaZero(sh, p, rng);
      continue;
    }
    // modais""")

rep("""    if (coffeeTaken < p.coffee && s.time > 600) {
      sh.coffee();
      coffeeTaken++;
    }""","""    // café na hora do perfil (com noite em claro, o primeiro vai logo cedo)
    const at = p.coffeeAt?.[coffeeTaken] ?? 600;
    if (coffeeTaken < p.coffee && (s.time >= at || (s.semSono && coffeeTaken === 0 && s.time > 450))) {
      sh.coffee();
      coffeeTaken++;
    }""")

rep("""  // videochamada: quem desconfia usa em trote, minimizador e exagerado (até acabar a franquia)
  if (p.inspects && sh.videoView(call).canStart && (def.type === 'trotista' || def.type === 'minimizador' || def.type === 'exagerador') && rng.chance(0.6)) {
    const r = sh.startVideo();
    if (r === 'conectou') {
      for (const spot of sh.videoView(call).spots.slice(0, 2)) sh.videoLook(spot.id);
      sh.endVideo();
    }
    if (!sh.active() || sh.active()!.id !== call.id) return; // desligou
  }
  // perguntas obrigatórias + algumas extras
  for (const q of t.must ?? []) sh.ask(q);
  const qs = sh.questions(call).filter((q) => !q.asked && q.group !== 'acalmar' && q.id !== 'callback' && !q.box?.includes('outros'));
  for (let i = 0; i < p.questions && qs.length; i++) {
    const q = qs.splice(rng.int(0, qs.length - 1), 1)[0];
    sh.ask(q.id);
  }""","""  // 1.1: videochamada onde ela resolve — quem liga não é confiável (a conversa engana) ou o post-it
  // diz que é grave (o vídeo responde respira/pele/acordado de uma vez). A última fica guardada para o duvidoso.
  const unreliable = VIDEO_UNRELIABLE.has(def.type);
  let viu = false;
  const vv = sh.videoView(call);
  const wantVideo = (p.video ?? 0) > 0 && vv.canStart && (unreliable ? rng.chance(p.video ?? 0) : !!call.noteUrgent && vv.credits >= 2 && rng.chance((p.video ?? 0) * 0.6));
  if (wantVideo) {
    const r = sh.startVideo();
    if (r === 'conectou') {
      viu = true;
      for (const spot of sh.videoView(call).spots.slice(0, unreliable ? 1 : 0)) sh.videoLook(spot.id);
      sh.endVideo();
    }
    if (!sh.active() || sh.active()!.id !== call.id) return; // desligou
  }
  // perguntas obrigatórias + algumas extras (quem pergunta bem escolhe a caixa certa)
  for (const q of t.must ?? []) sh.ask(q);
  const qs = sh.questions(call).filter((q) => !q.asked && q.group !== 'acalmar' && q.id !== 'callback' && !q.box?.includes('outros'));
  for (let i = 0; i < p.questions && qs.length; i++) {
    const rel = qs.filter((q) => sh.relevantQuestion(call, q.id));
    const pool = rel.length && rng.chance(p.askSkill ?? 0) ? rel : qs;
    const q = pool[rng.int(0, pool.length - 1)];
    qs.splice(qs.indexOf(q), 1);
    sh.ask(q.id);
  }""")

rep("""  // casos vermelhos costumam ser óbvios: o erro se concentra na fronteira amarelo/verde
  const errP = (1 - p.accuracy) * (t.sev === 'vermelho' ? 0.4 : 1.15);""","""  // casos vermelhos costumam ser óbvios: o erro se concentra na fronteira amarelo/verde
  // 1.1: o vídeo tira a dúvida — com quem engana, quase toda; com os outros, um pouco
  const errP = (1 - p.accuracy) * (t.sev === 'vermelho' ? 0.4 : 1.15) * (viu ? (unreliable ? 0.2 : 0.8) : 1);""")

rep("""/** escolhe uma opção de cena simulando o efeito num clone do estado */""","""/** 1.1: a negociação da vaga zero, do jeito do perfil */
function playVagaZero(sh: Game['shift'] & {}, p: BotProfile, rng: Rng) {
  const vz = sh.sh.vz!;
  if (vz.state === 'fim') {
    sh.vzClose();
    return;
  }
  const stuck = vz.state === 'impasse' || !!vz.birra || (vz.floor > 0 && vz.resistance <= vz.floor) || vz.resistance >= 3;
  if (vz.peixoto === 'aceso' && stuck && rng.chance(p.peixoto ?? 0)) {
    sh.vzPeixoto();
    return;
  }
  if (vz.state === 'impasse') {
    if (!vz.precisa && rng.chance(p.vzSkill ?? 0)) sh.vzDesviar();
    else sh.vzDesistir();
    return;
  }
  const info = vz.cards.map((c) => ({ id: c.id, ...(sh.vzCardInfo(c.id) ?? { kind: 'meio' as const, tag: undefined }) }));
  const good = info.filter((c) => (vz.precisa ? c.kind === 'bom' && c.tag !== 'desvio' && c.tag !== 'mentira' : c.tag === 'desvio' || (c.kind === 'bom' && c.tag !== 'mentira')));
  const pick = good.length && rng.chance(p.vzSkill ?? 0) ? rng.pick(good) : info.length ? rng.pick(info) : undefined;
  if (!pick || !sh.vzChoose(pick.id)) sh.vzTimeout();
}

/** escolhe uma opção de cena simulando o efeito num clone do estado */""")

rep("""import { autoPlayField } from './field';""","""import { autoPlayField } from './field';
import { VIDEO_UNRELIABLE } from './video';""")
open(p,'w').write(s)
print('ok')
