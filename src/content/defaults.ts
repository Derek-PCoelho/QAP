// Respostas padrão para perguntas que a ligação não respondeu explicitamente.
// Regra de ouro: o padrão nunca contradiz a verdade da ligação, nem o que ela mesma já disse.
import type { CallDef, Ctx, TruthDef } from '../engine/types';
import { normLines, stripMarkup } from '../engine/text';

function truthOf(def: CallDef, c: Ctx): TruthDef {
  return typeof def.truth === 'function' ? def.truth(c) : def.truth;
}

/** Texto corrido da resposta que a própria ligação escreveu para uma pergunta ('' se não escreveu). */
function ownText(def: CallDef, q: string, c: Ctx): string {
  const a = def.q?.[q];
  if (a === undefined) return '';
  try {
    return normLines(typeof a === 'function' ? a(c) : a, c)
      .map((l) => stripMarkup(l.text))
      .join(' ');
  } catch {
    return '';
  }
}

/** Texto corrido da abertura da ligação ('' se falhar). */
function openText(def: CallDef, c: Ctx): string {
  try {
    const o = typeof def.open === 'function' ? def.open(c) : def.open;
    return normLines(o, c)
      .map((l) => stripMarkup(l.text))
      .join(' ');
  } catch {
    return '';
  }
}

// Quem não responde (parada, coma, pós-crise) não obedece a comando; quem está desorientado obedece mal.
const SEM_RESPOSTA = /n[ãa]o (acorda|responde|reage|mexe)|(t[áa]|est[áa]|continua|segue) desacordad|inconsciente|\bcoma\b|dormindo pesado|de olho fechado/i;
const SEM_RESPOSTA_DX = /parada|\bcoma\b|[óo]bito/i;
const DESORIENTADO = /resmung|coisa com coisa|n[ãa]o fala direito|n[ãa]o entende|abr(e|indo) o olho|meio bobo|perguntou onde|apagando/i;
// Quem está agressivo ou não deixa ninguém chegar perto não faz teste nenhum.
const NAO_COOPERA = /xingando|querendo brigar|ningu[ée]m encosta|n[ãa]o deixa ningu[ée]m/i;
// Obstrução total da via aérea: não fala, não sorri, não repete frase.
const OBSTRUCAO_TOTAL = /obstru[çc][ãa]o (total|de via a[ée]rea)/i;
// A abertura (ou o relato) já disse o que foi ingerido: o padrão não pode negar.
const JA_CONTOU_INGESTAO = /engoli|bebeu|comeu|ingeri|golinho|golão|maionese/i;

export function defaultAnswer(q: string, def: CallDef, c: Ctx): string | string[] {
  const t = truthOf(def, c);
  const p = def.patient;
  const prank = t.sev === 'trote';
  const grave = t.sev === 'vermelho';
  const self = def.type === 'minimizador' || def.caller.toLowerCase().includes('própri');
  const kid = def.type === 'crianca';
  const ele = p.sex === 'F' ? 'ela' : 'ele';
  const Ele = p.sex === 'F' ? 'Ela' : 'Ele';
  const o = p.sex === 'F' ? 'a' : 'o';
  const dr = kid ? '{m:moço|moça}' : '{dr}';
  const pick = <T,>(arr: T[]) => arr[Math.floor(c.rand() * arr.length)];
  // linha aberta: ninguém fala; o padrão é só ruído, nunca uma frase falada
  if (def.caller === 'Linha aberta') return pick(['[silêncio]', '[só a respiração, ninguém responde]']);
  // paciente que não responde (parada, coma, pós-crise): não há como perguntar nem pedir nada a ele
  const semResposta = () => SEM_RESPOSTA.test(ownText(def, 'consciencia', c)) || SEM_RESPOSTA_DX.test(t.dx);
  switch (q) {
    case 'oque':
      if (prank) return pick(['Já falei! Manda logo a ambulância!', 'Acidente, {m:moço|moça}, acidente feio! [risadinha]']);
      return pick(['É isso que eu tô falando, {dr}...', 'Já expliquei, {dr}, é isso aí que eu falei.']);
    case 'idade':
      if (prank) return pick(['Ah... uns... trinta? Quarenta?', 'Sei lá, velho.']);
      if (!p.age) return 'Não sei dizer, {dr}.';
      if (def.type === 'testemunha') return `Uns ${Math.round(p.age / 5) * 5} anos, por aí.`;
      return `${p.age} anos.`;
    case 'consciencia':
      if (prank) return pick(['Tá... não! Não tá! Tá desmaiado!', 'Tá acordado. Não, peraí. Desmaiou.']);
      // vermelho: não afirma que responde (pode ser parada ou coma); quem escreveu a ligação detalha
      if (grave) return pick([`${Ele}... não tá normal, {dr}. Não sei se tá me ouvindo direito.`, 'Mais ou menos, {dr}. Tá estranh' + o + '.']);
      if (p.age != null && p.age < 3) return `Tá acordad${o}, sim, olhando em volta.`;
      return pick([`Tá acordad${o}, sim, conversando.`, `Tá, tá acordad${o}.`]);
    case 'respira':
      if (prank) return pick(['Respira... não respira. Respira!', 'Tá respirando pela boca, tipo cachorro.']);
      if (grave) return 'Tá respirando... meio diferente.';
      return 'Tá respirando normal, sim.';
    case 'inicio':
      if (prank) return 'Agora! Agorinha! Corre!';
      // quadro que já vem de antes (queda de ontem, fratura não tratada): o padrão não pode dizer que começou agora
      if (/ontem|n[ãa]o tratad|cr[ôo]nic|h[áa] dias/i.test(t.dx)) return `Já faz mais de um dia, ${dr}.`;
      return pick(['Faz pouco tempo.', 'Começou agora há pouco.', 'Uns vinte minutos, meia hora.']);
    case 'sangramento':
      if (prank) return 'Muito! Muito sangue, tá jorrando!';
      return 'Sangue não, {dr}. Não vi sangue.';
    case 'historico':
      if (prank) return 'Doença? Sei lá. Manda logo.';
      if (p.age && p.age > 60) return 'Pressão alta, eu acho. Toma remédio, mas não sei o nome.';
      return 'Que eu saiba, nada grave, {dr}. Mas não sei de tudo.';
    case 'paciente':
      if (prank) return ['[sussurros e risadas]', 'Ele não pode falar, tá... morto! Quer dizer, desmaiado!'];
      if (self) return 'Sou eu mesmo, {dr}. Pode falar comigo.';
      if (grave) return `Não dá, {dr}, ${ele} não consegue falar agora.`;
      return `${Ele} tá aqui do lado, mas tá muito nervos${o} pra falar.`;
    case 'referencia':
      if (prank) return 'Ali perto do... do mercado. O grande.';
      return def.addr.ref ?? 'Perto da padaria da esquina, {dr}.';
    case 'seguranca':
      if (prank) return 'Seguro, seguro. Pode vir.';
      // cena com apoio obrigatório (PM, Bombeiros): o padrão não pode dizer que está tudo seguro
      if (t.sup?.length) return 'Não tá tranquilo, não, {dr}. Tem perigo aqui, sim.';
      return 'Tá tranquilo aqui, ninguém armado.';
    case 'dorpeito':
      if (semResposta()) return `Não sei, ${dr}. ${Ele} não responde, não dá pra perguntar.`;
      return grave ? `${Ele} não sabe explicar direito, ${dr}.` : 'Não, dor no peito não.';
    case 'fast':
      if (prank) return `${Ele} sorriu! Quer dizer... [risadas]`;
      // o padrão não pode mandar quem não responde (ou não respira) sorrir e levantar os braços
      if (OBSTRUCAO_TOTAL.test(t.dx)) return `Não dá, ${dr}! ${Ele} não consegue nem respirar, quanto mais falar!`;
      if (semResposta()) return `Não dá, ${dr}. ${Ele} não responde, não tem como pedir isso.`;
      if (DESORIENTADO.test(ownText(def, 'consciencia', c))) return `Pedi, ${dr}, mas ${ele} não entende direito o que eu falo e não faz o que eu mando.`;
      if (NAO_COOPERA.test(['consciencia', 'seguranca', 'paciente'].map((k) => ownText(def, k, c)).join(' '))) return `Tentei, ${dr}, mas ${ele} não deixa ninguém chegar perto e não faz o que a gente pede.`;
      // se a verdade for AVC e a ligação não escreveu o teste, o padrão não pode dizer "tudo normal"
      if (/avc|derrame/i.test(t.dx)) return 'A boca entortou quando sorriu, um braço cai e a fala saiu enrolada.';
      return 'Sorriu normal, levantou os dois braços e repetiu direitinho.';
    case 'gestacao':
      if (p.sex === 'F' && p.age && p.age >= 14 && p.age <= 45) return 'Grávida? Não, que eu saiba não.';
      return 'Não, não tem nada disso aqui.';
    case 'dengue':
      return 'Não, nada disso. Só o que eu falei.';
    case 'risco':
      // cena com PM/Bombeiros: o perigo continua; o padrão não pode dizer que ninguém corre risco
      if (t.sup?.includes('PM')) return `Tem, sim, ${dr}. Tem gente agressiva aqui ainda, e eu tô com medo.`;
      if (t.sup?.length) return `Tem, sim, ${dr}. O perigo ainda não passou aqui.`;
      return 'Não, ninguém tá correndo perigo assim, não.';
    case 'ingestao':
      // embriaguez / coma alcoólico: o padrão não pode dizer que não bebeu (hipoglicemia confundida e abstinência ficam de fora)
      if (/embriag|alco[oó]lic/i.test(t.dx) && !/hipoglic|abstin/i.test(t.dx)) {
        return def.type === 'testemunha' ? `Bebida, ${dr}. Pelo cheiro, bebeu bastante. Quanto, eu não sei.` : `Bebida, ${dr}. Bebeu bastante, mas não sei dizer quanto.`;
      }
      // o relato já falou do que foi engolido (água da enchente, maionese estragada): o padrão não pode negar
      if (JA_CONTOU_INGESTAO.test(openText(def, c) + ' ' + ownText(def, 'oque', c)) || /ingest|aliment|engoli/i.test(t.dx)) return `Foi o que eu contei, ${dr}. Mais nada que eu saiba.`;
      if (def.type === 'testemunha') return `Não vi ${ele} engolir nada, ${dr}.`;
      return 'Engolir? Não, não engoliu nada.';
    case 'confronto_quadro':
      if (prank) return ['[risadas]', '[desliga]'];
      return kid ? 'Não é trote! Juro, {m:moço|moça}!' : 'Que trote, {dr}?! É sério! Pelo amor de Deus!';
    case 'confronto_endereco':
      if (prank) return ['É... é que... [risadas abafadas]', '[desliga]'];
      return `Desculpa, desculpa, é o nervoso! É ${def.addr.rua}, ${def.addr.n}, ${def.addr.bairro}!`;
    default:
      return kid ? 'Não sei, {m:moço|moça}...' : 'Não sei dizer, {dr}.';
  }
}
