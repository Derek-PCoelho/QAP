// =============================================================================
// Banco — FOLGADOS (1.1): quem quer a ambulância de táxi, para furar a fila da UPA
// ou para levar parente a consulta/exame marcado. Bíblia: docs/roteiro-1.1/trotes-folgados.md.
//
// A conduta é ORIENTAÇÃO por meios próprios, com as frases da caixa Outros (branca):
//   gravada        "A ligação está sendo gravada."     — acalma metade; a outra metade xinga mais baixo
//   nao_perfil     "Não é perfil do serviço."           — o folgado discute
//   meios_proprios "Levar por meios próprios."          — aceita ou xinga (e conta como orientação)
//   encerrar       "Por motivo de conflitos, encerro."  — certo depois de conflito; antes é desligar na cara
// Cada modelo tem a mesma abertura e três verdades: quem estoura (xinga: "piii" no áudio,
// símbolos de quadrinho na transcrição — #%!#@$ — nunca palavrão escrito), quem cede, e uma terceira
// (outro jeito de ser folgado ou, em três deles, um caso REAL escondido atrás do pedido de táxi).
//
// A reação muda com a ordem: a 1ª negativa (não é perfil / meios próprios) vira discussão; a 2ª,
// explosão ou aceitação. "Gravada" depois do xingamento e "encerro" sem conflito têm falas próprias.
// Sorteio: etiqueta `folgado` (slot próprio dos dias) e `leve` (raro, peso 0,4); no máximo um por
// plantão (`once`), nunca nos dias pesados (9, 17, 19, 20). Ver docs/CONTEUDO.md.
// =============================================================================
import type { AnswerIn, CallDef, Ctx, EffCtx, LineIn } from '../../engine/types';
import type { TemplateParams } from '../../engine/content-api';
import { hasBleep } from '../../engine/bleep';
import { Rng } from '../../engine/util';
import { tpl, ex } from './kit';

/** dias pesados: nenhum folgado (bíblia: D9, D17, D19, D20) */
export const FOLGADO_NOT_DAYS = [9, 17, 19, 20];
/** etiquetas, peso e regra de sorteio comuns aos folgados */
const base = () => ({ tags: ['folgado', 'leve'], weight: 0.4, notDays: [...FOLGADO_NOT_DAYS], once: 'folgado' });

// -----------------------------------------------------------------------------
// leitura da ligação em curso (as falas de Outros dependem do que já foi dito)
// -----------------------------------------------------------------------------
function active(c: Ctx) {
  const sh = c.s?.shift;
  return sh?.activeId ? sh.calls[sh.activeId] : undefined;
}
/** o regulador já disse esta frase antes da fala atual */
function disse(c: Ctx, id: string): boolean {
  const call = active(c);
  if (!call) return false;
  const i = call.asked.indexOf(id);
  return i >= 0 && i < call.asked.length - 1;
}
/** quantas negativas ("não é perfil", "meios próprios") vieram antes da fala atual */
function negou(c: Ctx): number {
  return (disse(c, 'nao_perfil') ? 1 : 0) + (disse(c, 'meios_proprios') ? 1 : 0);
}
/** quem liga já xingou (o palavrão censurado numa fala) */
function xingou(c: Ctx): boolean {
  return !!active(c)?.lines.some((l) => l.kind === 'caller' && hasBleep(l.text));
}
/** houve conflito (mesma regra do motor: xingamento ou as duas negativas) */
function conflito(c: Ctx): boolean {
  return xingou(c) || negou(c) >= 2;
}

const G = (t: string): LineIn => ({ t, style: 'grito' });

interface Briga {
  /** 1ª negativa, conforme a frase */
  perfil: LineIn[];
  meios: LineIn[];
  /** 2ª negativa: a explosão (com xingamento) ou a aceitação */
  segunda: LineIn[];
  /** "a ligação está sendo gravada" antes e depois do xingamento */
  gravada: LineIn[];
  gravadaDepois?: LineIn[];
  /** "encerro a ligação" depois do conflito; e sem conflito (desligar na cara) */
  fim: LineIn[];
  semBriga?: LineIn[];
}

/** as quatro frases de Outros com a reação que depende da ordem */
function briga(b: Briga): Record<string, AnswerIn> {
  return {
    nao_perfil: (c) => (negou(c) >= 1 ? b.segunda : b.perfil),
    meios_proprios: (c) => (negou(c) >= 1 ? b.segunda : b.meios),
    gravada: (c) => (xingou(c) ? b.gravadaDepois ?? b.gravada : b.gravada),
    encerrar: (c) => (conflito(c) ? b.fim : b.semBriga ?? ['Ué... vai desligar? Eu nem briguei com {m:o senhor|a senhora}...', '[a linha cai]']),
  };
}

/** caso real escondido atrás do pedido de táxi: as frases de Outros soam como abandono */
function aflito(quem: string, fem: boolean): Record<string, AnswerIn> {
  return {
    nao_perfil: [`Não é perfil? Mas ${quem}... ${quem} não tá bem, {dr}!`],
    meios_proprios: [`Meios próprios? Eu não tenho carro, {dr}! E ${quem} tá esquisit${fem ? 'a' : 'o'}...`],
    gravada: ['Pode gravar! Grava que eu tô pedindo ajuda!'],
    encerrar: ['Não, não desliga, {dr}! Não—', '[a linha cai]'],
  };
}

// -----------------------------------------------------------------------------
// FG1 — "O Uber tá caro" (Seu Clodoaldo, dedinho do pé)
// -----------------------------------------------------------------------------
const UBER = tpl({
  id: 'folgado_uber',
  ...base(),
  minDay: 3,
  age: [52, 52],
  sex: 'M',
  rel: ['proprio'],
  open: () => ['Boa tarde, é da ambulância? Então, eu machuquei o dedo do pé e preciso ir na UPA. O Uber tá trinta e oito reais, é um assalto. Vocês tão passando aqui perto, né? É rapidinho.'],
  cena: { place: 'sala', pose: 'sentado' },
  truths: [
    {
      id: 'xinga',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Contusão do quinto dedo do pé (pedido de ambulância como táxi)', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
        cat: 'outros',
        note: 'Quer carona pra UPA. Bateu o dedinho do pé. O Uber tá caro, diz ele.',
        noteWrong: 'Machucou o pé, tá com muita dor. Não consegue andar.',
        caller: 'Seu Clodoaldo',
        callerName: 'Seu Clodoaldo',
        type: 'exagerador',
        voice: 'homem',
        amb: ['tv'],
        patient: { name: 'Clodoaldo Pereira', age: 52, sex: 'M' },
        q: {
          oque: 'Bati o dedinho na quina da cama. Anteontem. Ficou roxinho. Dói pra andar, mas eu ando.',
          pulso: 'No dedo? Sei lá, {dr}. Tem dedo.',
          respira: 'Respiro, ué. Bufando, mas respiro.',
          pele: 'Branco. O dedo é que tá roxinho. Roxo-berinjela.',
          consciencia: 'Acordado e indignado, {dr}.',
          historico: 'Nada. Saúde de ferro. Só o dedo.',
          inicio: 'Anteontem à noite. Fui no escuro buscar água.',
          paciente: 'Sou eu mesmo, {dr}. O dono do dedo.',
          ...briga({
            perfil: ['Perfil? Que perfil? Eu tenho perfil no Facebook, quer ver?'],
            meios: ['Meios próprios? Meu meio próprio é vocês, ué. Eu pago imposto!'],
            segunda: [G('Seu... seu jumento de jaleco! Vai #%!#@$ com essa sua sirene!'), 'Trinta e oito reais! Trinta e oito!'],
            gravada: ['Gravada? Ótimo. Grava aí que eu pago imposto. Muito imposto.'],
            gravadaDepois: ['[mais baixo] ...seu jumento de jaleco gravado, então.'],
            fim: ['Desliga mesmo! Vou de bicicleta! Com o dedo roxo! Vou postar no grupo do bairro, seu &%$#!', '[desliga]'],
          }),
        },
        extra: [ex('anda', 'Consegue pisar?', 'Consegue pisar no chão? Andar?', 'Consigo. Mancando, mas consigo. Fui até a padaria hoje cedo.', { cat: 'trauma' })],
        radio: { excess: 'Central, {unit}. O senhor do dedinho tava esperando no portão, de chinelo, com a carteira na mão. Perguntou se dava pra passar no mercado na volta.' },
        diary: { ori: 'O dedinho do pé roxo. Queria a ambulância porque o Uber estava caro. Foi xingando, de bicicleta.' },
      }),
    },
    {
      id: 'esposa',
      weight: 2,
      build: (p) => ({
        truth: { dx: 'Contusão do quinto dedo do pé (a esposa levou)', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
        cat: 'outros',
        note: 'Quer carona pra UPA por causa do dedinho do pé. Tem uma mulher brava do lado.',
        noteWrong: 'Machucou o pé, tá com muita dor. Não consegue andar.',
        caller: 'Seu Clodoaldo',
        callerName: 'Seu Clodoaldo',
        type: 'exagerador',
        voice: 'homem',
        amb: ['tv', 'cozinha'],
        noise: ['[uma mulher ao fundo: "Clodoaldo, você ligou pra ambulância?!"]'],
        patient: { name: 'Clodoaldo Pereira', age: 52, sex: 'M' },
        q: {
          oque: 'Bati o dedinho na quina da cama. Anteontem. Ficou roxinho.',
          pulso: 'No dedo? Tem, tem. Tá latejando, inclusive.',
          respira: 'Respiro. A minha mulher é que tá bufando aqui.',
          pele: 'Normal. O dedo é que tá roxinho.',
          consciencia: 'Acordado, {dr}. Infelizmente, diz a minha mulher.',
          historico: 'Pressão, às vezes. Mas é o dedo.',
          paciente: 'Sou eu mesmo. [ao fundo: "Larga esse telefone!"]',
          ...briga({
            perfil: ['Não é perfil? Mas eu tô com dor...', 'ESPOSA: Me dá esse telefone! {Dr}, desculpa. Ele é assim.'],
            meios: ['Meios próprios? ...Tá vendo, Neide? Eu falei que eles iam falar isso.'],
            segunda: ['ESPOSA: Eu levo ele, {dr}. De carro. E na volta a gente conversa, Clodoaldo.', 'Tá bom, tá bom...'],
            gravada: ['Gravada?! Neide, tá gravando! [cochicho: "eu te falei"]'],
            fim: ['ESPOSA: Pode desligar, {dr}. Obrigada, viu? Desculpa o incômodo.', '[desliga]'],
            semBriga: ['Ué? Desligou? [ao fundo: "Bem feito!"]', '[a linha cai]'],
          }),
        },
        radio: { excess: 'Central, {unit}. A esposa recebeu a gente na porta pedindo desculpa. Ele já tava no carro.' },
        diary: { ori: 'O dedinho do pé roxo. A esposa pegou o telefone e levou ele de carro.' },
      }),
    },
    {
      id: 'bota',
      weight: 1.2,
      build: (p) => ({
        truth: { dx: 'Dor no pé por calo (quer atestado para o serviço)', sev: 'azul', ok: ['ORI'], ref: ['UBS', 'CASA'] },
        cat: 'outros',
        note: 'Diz que machucou o pé. Quer ambulância pra UPA. E atestado, parece.',
        noteWrong: 'Machucou o pé, tá com muita dor. Não consegue andar.',
        caller: 'Seu Clodoaldo',
        callerName: 'Seu Clodoaldo',
        type: 'exagerador',
        voice: 'homem',
        amb: ['tv'],
        patient: { name: 'Clodoaldo Pereira', age: 52, sex: 'M' },
        q: {
          oque: 'É o dedo do pé. Dói quando eu ponho a bota do serviço. Aí precisava de um atestado, sabe? Se for de ambulância, o atestado sai mais fácil.',
          pulso: 'Tem. Tudo funcionando. Menos o dedo.',
          respira: 'Normal.',
          pele: 'Normal. O dedo tá meio vermelhinho, do calo.',
          consciencia: 'Acordadíssimo.',
          historico: 'Nada. Só a bota que aperta.',
          paciente: 'Eu mesmo.',
          ...briga({
            perfil: ['Não é perfil? E atestado, vocês dão?'],
            meios: ['Meios próprios... e o atestado? Vai sair o mesmo atestado?'],
            segunda: ['Tá bom. Vou na UBS amanhã cedo. Pelo menos lá o médico assina.'],
            gravada: ['Gravada? Opa. Então não falei nada de atestado, tá?'],
            fim: ['Tá, tá. Desculpa. [desliga]'],
          }),
        },
        radio: { excess: 'Central, {unit}. Calo no dedinho, {dr}. Pediu atestado pra equipe.' },
        diary: { ori: 'Um calo e um pedido de atestado. Foi à UBS no dia seguinte.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// FG2 — "Fura a fila pra mim" (Dona Jurema, ligando de dentro da UPA) — a partir do dia 11
// -----------------------------------------------------------------------------
const UPA_ADDR = { rua: 'Av. Norte', n: 801, bairro: 'Jardim Norte', ref: 'Na porta da UPA, do lado da máquina de café.' };
const FILA_UPA = tpl({
  id: 'folgado_fila_upa',
  ...base(),
  minDay: 11,
  age: [45, 45],
  sex: 'F',
  rel: ['proprio'],
  open: () => ['{m:Moço|Moça}, eu tô na UPA Norte faz três horas com dor de garganta. Três horas! Manda uma ambulância me buscar aqui na porta e me entrar pela porta da emergência. Eu vi que quem chega de ambulância passa na frente.'],
  cena: { place: 'hospital', pose: 'sentado' },
  truths: [
    {
      id: 'grava',
      weight: 3,
      build: () => ({
        truth: { dx: 'Dor de garganta (quer furar a fila da UPA de ambulância)', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
        cat: 'outros',
        addr: UPA_ADDR,
        note: 'Liga de DENTRO da UPA. Quer ambulância pra furar a fila. Garganta.',
        noteWrong: 'Mulher passando mal na porta da UPA. Disse que tá esperando faz horas.',
        caller: 'Dona Jurema',
        callerName: 'Dona Jurema',
        type: 'exagerador',
        voice: 'mulher',
        amb: ['multidao', 'tv'],
        noise: ['[um chamado no alto-falante: "Senha cento e doze, consultório três"]'],
        patient: { name: 'Jurema Alves', age: 45, sex: 'F' },
        q: {
          oque: 'Dor de garganta. Desde ontem. E três horas de cadeira de plástico.',
          pulso: 'Tem. Acelerado de raiva.',
          respira: 'Respiro, ué. Tô aqui reclamando, não tô?',
          pele: 'Normal. Vermelha de nervoso.',
          consciencia: 'Acordadíssima. Faz três horas.',
          historico: 'Nada. Rinite.',
          paciente: 'Eu mesma. A garganta é minha.',
          ...briga({
            perfil: ['Não é perfil? E quem é perfil? Aquele homem que chegou de maca pra sentar no corredor?'],
            meios: ['Meios próprios? Eu já tô aqui! Eu vim de meio próprio! Três horas!'],
            segunda: ['Tá bom, tá bom. Vou ficar aqui. Mas se eu morrer de garganta, a culpa é sua.'],
            gravada: ['Grava! Grava que eu quero que o prefeito ouça! [pausa] ...Ouviu, prefeito?'],
            fim: ['Tá. Senha cento e trinta e um. Eu espero. [desliga]'],
          }),
        },
        extra: [ex('febre', 'Febre? Falta de ar? Engole?', 'Tem febre? Falta de ar? Consegue engolir?', 'Febre não. Falta de ar não. Engulo, mas reclamando.', { cat: 'clinico' })],
        radio: { excess: 'Central, {unit}. A senhora tava na porta da UPA, {dr}. Na UPA. Pediu pra gente entrar com ela pela emergência.' },
        diary: { ori: 'Ligou de dentro da UPA para ser buscada de ambulância. Esperou a senha dela.' },
      }),
    },
    {
      id: 'xinga',
      weight: 2,
      build: () => ({
        truth: { dx: 'Dor de garganta (quer furar a fila da UPA de ambulância)', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
        cat: 'outros',
        addr: UPA_ADDR,
        note: 'Liga de dentro da UPA. Quer furar a fila de ambulância. Brava.',
        noteWrong: 'Mulher passando mal na porta da UPA. Disse que tá esperando faz horas.',
        caller: 'Dona Jurema',
        callerName: 'Dona Jurema',
        type: 'exagerador',
        voice: 'mulher',
        amb: ['multidao', 'tv'],
        noise: ['[o alto-falante: "Senha cento e doze"]', '[Dona Jurema, para alguém do lado: "Cento e doze! E eu sou a cento e trinta e um!"]'],
        patient: { name: 'Jurema Alves', age: 45, sex: 'F' },
        q: {
          oque: 'Dor de garganta. E desaforo. Três horas de desaforo.',
          pulso: 'Tem. Disparado. De ódio.',
          respira: 'Respiro! Ainda!',
          pele: 'Vermelha. De raiva.',
          consciencia: 'Acordada! Faz três horas que eu tô acordada nessa cadeira!',
          historico: 'Rinite. E paciência curta.',
          paciente: 'Sou eu mesma.',
          ...briga({
            perfil: ['Não é perfil? Eu sou contribuinte! Contribuinte é perfil!'],
            meios: ['Meios próprios? Eu tô DENTRO da UPA, criatura!'],
            segunda: [G('Sua... sua songamonga de jaleco! Filha de uma #%!#@$! Três horas!'), '[o alto-falante: "Senha cento e treze"]'],
            gravada: ['Grava! Grava que eu quero que o prefeito ouça!'],
            gravadaDepois: ['[mais baixo] ...pode gravar a songamonga também.'],
            fim: ['Encerra! Encerra que eu vou na ouvidoria! Sua @#$%&*! [desliga]'],
          }),
        },
        radio: { excess: 'Central, {unit}. Ela tava sentada na recepção da UPA, {dr}. Na recepção.' },
        diary: { ori: 'Ligou de dentro da UPA para furar a fila. Xingou e esperou a senha.' },
      }),
    },
    {
      id: 'neto',
      weight: 1.2,
      build: () => ({
        truth: { dx: 'Dor de garganta (quer furar a fila da UPA; o neto pegou o telefone)', sev: 'verde', ok: ['ORI'], ref: ['UPA'] },
        cat: 'outros',
        addr: UPA_ADDR,
        note: 'Liga de dentro da UPA. Quer furar a fila. Tem um menino envergonhado do lado.',
        noteWrong: 'Mulher passando mal na porta da UPA. Disse que tá esperando faz horas.',
        caller: 'Dona Jurema',
        callerName: 'Dona Jurema',
        type: 'exagerador',
        voice: 'mulher',
        amb: ['multidao'],
        patient: { name: 'Jurema Alves', age: 45, sex: 'F' },
        q: {
          oque: 'Garganta! Três horas!',
          pulso: 'Tem, tem. [um menino: "Vó, para..."]',
          respira: 'Respiro.',
          pele: 'Normal.',
          consciencia: 'Acordada.',
          historico: 'Nada.',
          paciente: 'NETO: Oi, {dr}. Desculpa. Ela tá bem. Ela só não gosta de esperar.',
          ...briga({
            perfil: ['Não é perfil?! Ah, mas...', 'NETO: Vó! Me dá isso. Desculpa, {dr}.'],
            meios: ['Meios próprios? Eu já tô aqui...', '[o neto, baixinho: "Viu, vó?"]'],
            segunda: ['NETO: A gente espera, {dr}. Pode deixar. Ela vai ficar quietinha. Né, vó? [silêncio] Né, vó?'],
            gravada: ['Gravada?! [o neto: "Vó, eles gravam tudo, eu te falei!"]'],
            fim: ['NETO: Tchau, {dr}. Desculpa mesmo. [desliga]'],
          }),
        },
        radio: { excess: 'Central, {unit}. A senhora tava na recepção da UPA com o neto. O menino pediu desculpa pra equipe inteira.' },
        diary: { ori: 'Ligou de dentro da UPA para furar a fila. O neto pediu desculpas e eles esperaram.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// FG3 — "Ultrassom marcado às duas" (Seu Abelardo pela esposa) — com variante real (abdome agudo)
// -----------------------------------------------------------------------------
const transporte = (real = false) =>
  // [validar] o nome local do transporte sanitário eletivo (TFD / transporte da Secretaria de Saúde)
  ex(
    'transporte',
    '"Quer o telefone do transporte da Secretaria?"',
    'Para exame marcado, existe o transporte da Secretaria de Saúde, agendado. Quer o telefone?',
    real ? ['Transporte? Mas ela... tá bom, anoto. Mas ela tá com a barriga dura, {dr}.'] : ['Tem isso?! Anota aí, Lindalva! [papel] Pode falar, {dr}.', 'Deus lhe pague. Deus lhe pague mesmo.'],
    { kind: 'fala', cat: 'outros', cost: 3, onAsk: real ? undefined : (e) => e.add('humanidade', 1, 'passou o telefone do transporte da Secretaria') },
  );
const EXAME = tpl({
  id: 'folgado_exame_marcado',
  ...base(),
  minDay: 3,
  age: [68, 68],
  sex: 'F',
  rel: ['marido'],
  open: () => ['É da ambulância? Minha esposa tem ultrassom marcado às duas da tarde no Regional, faz quatro meses que a gente espera, e o ônibus da Vila não passa hoje porque tá tendo obra. Vocês levam ela? Ela anda, mas devagarinho.'],
  cena: { place: 'sala', pose: 'sentado' },
  truths: [
    {
      id: 'entende',
      weight: 3,
      build: () => ({
        truth: { dx: 'Sem urgência: transporte para exame eletivo', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        cat: 'outros',
        note: 'Senhor quer levar a esposa pro ultrassom marcado. Ônibus não passa. Educado.',
        noteWrong: 'Senhora idosa passando mal, o marido quer levar pro hospital.',
        caller: 'Seu Abelardo (marido)',
        callerName: 'Seu Abelardo',
        type: 'comum',
        voice: 'idoso',
        amb: ['radio_am'],
        patient: { name: 'Lindalva Siqueira', age: 68, sex: 'F' },
        q: {
          oque: 'Nada, {dr}. Graças a Deus nada. Só o exame.',
          pulso: 'Tem. Ela tá ótima. [ao fundo: "Tô ótima, Abelardo!"]',
          respira: 'Respira, tá aqui do meu lado fazendo crochê.',
          pele: 'Corada. Passou até um batonzinho pro exame.',
          consciencia: 'Acordada, de bolsa no colo, pronta desde as dez.',
          historico: 'Pressão. Toma o remédio direitinho. O exame é de rotina, da vesícula.',
          inicio: 'O exame? Faz quatro meses que marcou.',
          paciente: 'LINDALVA: Oi, {dr}. Eu tô bem, viu? É ele que se preocupa.',
          ...briga({
            perfil: ['Eu entendo, eu entendo. Não é culpa {m:do senhor|da senhora}.'],
            meios: ['Mas é no hospital, ué. Vocês vão pro hospital mesmo... [pausa] Não, eu entendo.'],
            segunda: ['Tá certo, {dr}. Eu chamo o filho do vizinho, ele tem carro. Desculpa o incômodo.'],
            gravada: ['Gravada? Pode gravar, {dr}. Bom dia pra quem ouvir.'],
            fim: ['Obrigado assim mesmo, {dr}. Fica com Deus.', '[desliga]'],
            semBriga: ['Alô? ...Caiu. [ao fundo: "Desligaram, Abelardo?"]', '[a linha cai]'],
          }),
        },
        extra: [transporte()],
        radio: { excess: 'Central, {unit}. A senhora tava na porta, de bolsa e batom, esperando a "condução pro ultrassom", {dr}.' },
        diary: { ori: 'Seu Abelardo queria levar a esposa ao ultrassom. O ônibus da Vila não passava por causa da obra.' },
      }),
    },
    {
      id: 'teimoso',
      weight: 1.5,
      build: () => ({
        truth: { dx: 'Sem urgência: transporte para exame eletivo', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        cat: 'outros',
        note: 'Senhor quer levar a esposa pro ultrassom marcado. Insiste.',
        noteWrong: 'Senhora idosa passando mal, o marido quer levar pro hospital.',
        caller: 'Seu Abelardo (marido)',
        callerName: 'Seu Abelardo',
        type: 'comum',
        voice: 'idoso',
        amb: ['radio_am', 'passaros'],
        patient: { name: 'Lindalva Siqueira', age: 68, sex: 'F' },
        q: {
          oque: 'Nada, nada. Só o exame. Quatro meses, {dr}!',
          pulso: 'Tem. Ela tá ótima.',
          respira: 'Respira.',
          pele: 'Normal.',
          consciencia: 'Acordada.',
          historico: 'Pressão. O exame é de rotina.',
          paciente: 'LINDALVA: Abelardo, deixa a moça trabalhar! [pausa] Ele é teimoso, {dr}.',
          ...briga({
            perfil: ['Perfil... no meu tempo ambulância levava todo mundo.'],
            meios: ['Meios próprios! Eu vou é ligar pro jornal. Pra Gazeta. Eles vão gostar dessa.'],
            segunda: ['Vou ligar pra Gazeta, ouviu? [ao fundo: "Liga nada, Abelardo, vem tomar café"] ...Vou ligar amanhã.'],
            gravada: ['Gravada? Então grava que eu sou eleitor. Há cinquenta anos.'],
            fim: ['Passar bem! [desliga]'],
          }),
        },
        extra: [transporte()],
        radio: { excess: 'Central, {unit}. Transporte pra ultrassom eletivo, {dr}. O senhor quis saber quanto a gente ganha.' },
        diary: { ori: 'Seu Abelardo ameaçou ligar para a Gazeta porque a ambulância não leva para exame. Não ligou.' },
      }),
    },
    {
      id: 'real',
      weight: 0.6,
      build: () => ({
        // ⚠ falso folgado: o exame é de rotina, mas a barriga dura e o jejum forçado não são.
        // [validar] dor abdominal com barriga dura em idosa: suspeita de abdome agudo = USB (amarelo), Regional.
        truth: { dx: 'Suspeita de abdome agudo em idosa (pediu transporte para o exame)', sev: 'amarelo', ok: ['USB'], dest: ['REG'], risk: { good: 110, bad: 300, needs: 'USB' } },
        cat: 'clinico',
        note: 'Senhor quer levar a esposa pro ultrassom. Falou de barriga dura, {dr}.',
        noteWrong: 'Quer táxi pro exame. Folgado.',
        caller: 'Seu Abelardo (marido)',
        callerName: 'Seu Abelardo',
        type: 'minimizador',
        voice: 'idoso',
        amb: ['radio_am'],
        noise: ['[um gemido de mulher, perto]'],
        patient: { name: 'Lindalva Siqueira', age: 68, sex: 'F' },
        q: {
          oque: ['Nada, {dr}, é só o exame... É que ela tá com a barriga dura e não come desde ontem. Mas o exame é de rotina.'],
          pulso: 'Tem. Rápido, acho. Ela tá suando um pouco.',
          respira: 'Respira curtinho, que dói a barriga.',
          pele: 'Tá meio pálida. E suando, com esse frio.',
          consciencia: 'Acordada. Quietinha, ela que é falante.',
          historico: 'Pressão. E pedra na vesícula, por isso o ultrassom.',
          inicio: 'A dor? Desde ontem de tarde. Piorou de noite. Vomitou duas vezes.',
          paciente: ['LINDALVA: Ai... não é nada, {dr}... é a vesícula... [respira fundo] ...dói pra deitar.'],
          ...aflito('ela', true),
        },
        extra: [transporte(true), ex('barriga', 'A barriga está dura? Febre?', 'A barriga está dura? Ela tem febre?', 'Dura igual tábua, {dr}. Febre... tá quentinha, sim.', { cat: 'clinico' })],
        radio: { ok: '{central}, {unit}. Abdome agudo, {dr}. Vesícula, provável. A senhora tava de bolsa pronta "pro exame". Seguimos pro Regional.' },
        diary: { alive: 'Pediram transporte para um ultrassom de rotina. Era a vesícula inflamada.', dead: 'Pediram transporte para um ultrassom. Era abdome agudo.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// FG4 — "O cachorro" (Rodinei, o cachorro engoliu uma meia)
// -----------------------------------------------------------------------------
const VET = tpl({
  id: 'folgado_veterinario',
  ...base(),
  minDay: 3,
  age: [30, 30],
  sex: 'M',
  rel: ['proprio'],
  open: () => ['Ô, chefia. O meu cachorro comeu um pé de meia inteiro e tá tossindo. O veterinário é no Centro e o meu carro tá sem bateria. A ambulância é pra quem tá passando mal, né? Ele tá passando mal.'],
  cena: { place: 'quintal', props: ['cachorro'] },
  truths: [
    {
      id: 'xinga',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Cachorro engoliu uma meia (pediu ambulância para ir ao veterinário)', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        cat: 'outros',
        note: 'O cachorro dele engoliu uma meia. Quer ambulância pro veterinário. É sério isso, {dr}.',
        noteWrong: 'Homem engasgado, tossindo muito!',
        caller: 'Rodinei',
        callerName: 'Rodinei',
        type: 'exagerador',
        voice: 'jovem_h',
        amb: ['cachorro', 'rua'],
        patient: { name: '"Thor", o cachorro', age: 4, sex: 'M' },
        q: {
          oque: 'Comeu a meia, chefia. Do pé esquerdo. Agora tá tossindo e olhando pra mim com culpa.',
          pulso: 'Ô, chefia, e eu lá sei achar pulso de cachorro? [pausa] ...Achei. Tá rápido. Ele tá feliz.',
          respira: 'Respira, tá ofegando de língua de fora. Mas ele faz isso sempre.',
          pele: 'Caramelo, chefia. Ele é caramelo.',
          consciencia: 'Acordado e latindo. Ó. (AU! AU!)',
          historico: 'Já comeu um controle remoto em 2022. Saiu inteiro.',
          paciente: '(AU!) ...Ele mandou um oi.',
          ...briga({
            perfil: ['Não é perfil? Ele é da família! Ele tem até perfil no Instagram! Dois mil seguidores!'],
            meios: ['Meios próprios? O meu meio próprio tá sem bateria, chefia!'],
            segunda: [G('Seu... seu mocorongo! Pois quando você tiver um cachorro engasgado, que um #%!#@$ te atenda assim!'), '(AU! AU!)'],
            gravada: ['Gravada? Pode gravar. O Thor vai mandar um recado. (AU!)'],
            gravadaDepois: ['[mais baixo] ...mocorongo gravado. (au.)'],
            fim: ['Vou de carrinho de mão, então! Chefia de &%$#! [desliga]'],
          }),
        },
        extra: [ex('vet', 'Orientar: veterinário e não forçar vômito', 'Orientar: veterinário, sem forçar vômito', ['Veterinário... tá. Não forçar. Tá. Vou empurrar o carro com o vizinho.', '(AU!)'], { kind: 'fala', cat: 'outros', cost: 3, say: 'Aqui é a regulação de urgência para pessoas. Leve o cachorro ao veterinário; não force o vômito nem puxe a meia.' })],
        radio: { excess: 'Central, {unit}. O paciente é um cachorro, {dr}. Caramelo. Comeu uma meia. Ele lambeu o Márcio.' },
        diary: { ori: 'O Thor, um caramelo, comeu uma meia. O dono queria a ambulância para ir ao veterinário.' },
      }),
    },
    {
      id: 'cede',
      weight: 2,
      build: () => ({
        truth: { dx: 'Cachorro engoliu uma meia (pediu ambulância para ir ao veterinário)', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        cat: 'outros',
        note: 'O cachorro engoliu uma meia. Quer ambulância pro veterinário.',
        noteWrong: 'Homem engasgado, tossindo muito!',
        caller: 'Rodinei',
        callerName: 'Rodinei',
        type: 'exagerador',
        voice: 'jovem_h',
        amb: ['cachorro'],
        patient: { name: '"Thor", o cachorro', age: 4, sex: 'M' },
        q: {
          oque: 'A meia, chefia. Inteira. Ele é rápido.',
          pulso: 'Tem, tem. Rápido. Ele tá sempre rápido.',
          respira: 'Respira. Tossiu agora e... ó... [um som molhado] ...ele devolveu a meia, chefia!',
          pele: 'Caramelo.',
          consciencia: 'Acordado. Abanando o rabo.',
          historico: 'Nada. Só fome de meia.',
          paciente: '(AU!)',
          ...briga({
            perfil: ['É, eu sei que é pra gente, chefia. Mas ele é gente, praticamente.'],
            meios: ['Meios próprios... tá. O vizinho tem uma moto. O Thor vai na mochila.'],
            segunda: ['Tá certo, chefia. Desculpa. Ó, ele devolveu a meia, inclusive. Tudo resolvido. (AU!)'],
            gravada: ['Gravada?! Tá, desculpa. Não liga pra cá mais, prometo. Ele também promete. (au.)'],
            fim: ['Valeu, chefia. [desliga]'],
          }),
        },
        radio: { excess: 'Central, {unit}. Era um cachorro. Já tinha vomitado a meia quando a gente chegou.' },
        diary: { ori: 'O Thor engoliu uma meia e devolveu no meio da ligação.' },
      }),
    },
    {
      id: 'chora',
      weight: 1,
      build: () => ({
        truth: { dx: 'Cachorro idoso tossindo (o dono sozinho, assustado)', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        cat: 'outros',
        note: 'Quer ambulância pro cachorro. Tá com a voz embargada, {dr}.',
        noteWrong: 'Homem engasgado, tossindo muito!',
        caller: 'Rodinei',
        callerName: 'Rodinei',
        type: 'comum',
        voice: 'jovem_h',
        amb: ['silencio'],
        noise: ['[uma tosse rouca de cachorro velho]'],
        patient: { name: '"Thor", o cachorro', age: 14, sex: 'M' },
        q: {
          oque: 'Ele tem catorze anos, chefia. Era da minha mãe. Comeu a meia dela, que eu guardo. E agora tosse.',
          pulso: 'Tem. Devagarinho.',
          respira: 'Respira, mas tossindo. Ele tá velhinho.',
          pele: 'O focinho tá branco. Sempre foi caramelo.',
          consciencia: 'Acordado. Deitado no meu pé.',
          historico: 'Coração, o veterinário disse. Toma remédio.',
          paciente: '[o cachorro suspira]',
          ...briga({
            perfil: ['Eu sei. Eu sei que não é. [pausa] Desculpa, chefia. Eu não sabia pra quem ligar.'],
            meios: ['Meios próprios. Tá. O vizinho tem carro. Eu peço.'],
            segunda: ['Obrigado, chefia. Por não rir de mim.'],
            gravada: ['Pode gravar. Eu só tô com medo.'],
            fim: ['Tá. [a linha cai]'],
            semBriga: ['Tá... tá bom. [a linha cai]'],
          }),
        },
        extra: [ex('vet', 'Orientar: veterinário de plantão', 'Orientar: veterinário de plantão', ['Tem veterinário de plantão no Centro? ...Vou ligar. Obrigado, chefia. De verdade.'], { kind: 'fala', cat: 'outros', cost: 3, say: 'Aqui é para gente, mas tem clínica veterinária de plantão no Centro. Peça o carro do vizinho e leve ele lá.', onAsk: (e) => e.add('humanidade', 1, 'tratou com carinho o dono do cachorro velho') })],
        radio: { excess: 'Central, {unit}. Um cachorro velhinho, {dr}. O rapaz chorou quando a gente explicou. A gente deu carona até o veterinário. Não conta pro Peixoto.' },
        diary: { ori: 'O Thor tinha catorze anos e era da mãe dele. Foi ao veterinário no carro do vizinho.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// FG5 — "Mostrar os exames pro cardiologista" (Dona Neuzely pela mãe) — a partir do dia 8 — com variante real
// -----------------------------------------------------------------------------
/** no dia 7 a USA foi para o vereador (a Gazeta deu): a filha joga isso na cara */
const vereadorFala = (c: Ctx) => c.flag('d7_vereador_usa') || c.flag('d7_usa_vip');
const CONSULTA = tpl({
  id: 'folgado_consulta',
  ...base(),
  minDay: 8,
  age: [84, 84],
  sex: 'F',
  rel: ['filho'],
  open: () => ['Boa tarde. A minha mãe tem consulta com o cardiologista amanhã cedo, no particular, pra mostrar os exames. Só que eu trabalho e não consigo levar. Vocês não fazem esse serviço de levar idoso? Pago a gasolina.'],
  cena: { place: 'sala', pose: 'sentado' },
  truths: [
    {
      id: 'cunhada',
      weight: 3,
      build: () => ({
        truth: { dx: 'Sem urgência: transporte para consulta eletiva', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        cat: 'outros',
        note: 'Filha quer ambulância pra levar a mãe no cardiologista amanhã. Paga a gasolina, diz.',
        noteWrong: 'Idosa cardíaca, a filha tá preocupada. Parece grave.',
        caller: 'Neuzely (filha)',
        callerName: 'Neuzely',
        type: 'comum',
        voice: 'mulher',
        amb: ['rua', 'buzinas'],
        patient: { name: 'Filomena Duarte', age: 84, sex: 'F' },
        q: {
          oque: 'Nada, ela tá ótima. É só pra mostrar o eletro.',
          pulso: 'Tem. Ela mede todo dia no aparelhinho. Setenta e pouco.',
          respira: 'Normal. Ela tá em casa vendo novela.',
          pele: 'Normal. Bem corada, ela.',
          consciencia: 'Acordada e mandona.',
          historico: 'Coração. Marcapasso não, mas toma uns quatro remédios. Tudo certinho.',
          inicio: 'A consulta é amanhã, às oito.',
          paciente: 'Ela tá em casa. Eu tô no serviço, liguei daqui.',
          ...briga({
            perfil: [{ t: (c: Ctx) => (vereadorFala(c) ? 'Ah, mas pra levar o vereador vocês mandaram até a USA, né? Eu vi na Gazeta! [silêncio] ...Pois é.' : 'Ah, mas pra levar vereador vocês têm ambulância, né? Eu vi no jornal!') }],
            meios: ['Meios próprios... eu não tenho meio nenhum, {dr}. Eu tenho é patrão.'],
            segunda: ['Tá, entendi. Vou chamar a minha cunhada. Ela dirige mal, mas dirige.'],
            gravada: ['Gravada? Tudo bem. Não falei nada de mais.'],
            fim: ['Tá bom. Obrigada. [desliga]'],
          }),
        },
        radio: { excess: 'Central, {unit}. A senhora tava vendo novela, {dr}. Perguntou se a consulta tinha sido antecipada.' },
        diary: { ori: 'A filha queria a ambulância para levar a mãe ao cardiologista. A cunhada levou. Dirigindo mal.' },
      }),
    },
    {
      id: 'xinga',
      weight: 1.5,
      build: () => ({
        truth: { dx: 'Sem urgência: transporte para consulta eletiva', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        cat: 'outros',
        note: 'Filha quer ambulância pra levar a mãe no cardiologista. Já chegou brava.',
        noteWrong: 'Idosa cardíaca, a filha tá preocupada. Parece grave.',
        caller: 'Neuzely (filha)',
        callerName: 'Neuzely',
        type: 'exagerador',
        voice: 'mulher',
        amb: ['rua', 'buzinas'],
        patient: { name: 'Filomena Duarte', age: 84, sex: 'F' },
        q: {
          oque: 'Nada! Consulta! Eu já falei!',
          pulso: 'Tem. Ela tá ótima, é pra mostrar o exame!',
          respira: 'Respira! Tá em casa!',
          pele: 'Normal!',
          consciencia: 'Acordada!',
          historico: 'Coração. Por isso o cardiologista. Lógico.',
          paciente: 'Ela tá em casa, {dr}. Eu tô no serviço.',
          ...briga({
            perfil: [{ t: (c: Ctx) => (vereadorFala(c) ? 'Ah, mas pro vereador vocês mandaram a USA, né? Saiu foto e tudo na Gazeta!' : 'Não é perfil? Ela tem oitenta e quatro anos!') }],
            meios: ['Meios próprios! Eu pago imposto, {dr}! Imposto!'],
            segunda: [G('Sua... sua lambisgoia de repartição! Mequetrefe! #@$%!'), '[uma buzina na rua]'],
            gravada: ['Grava! Grava que eu sou filha de idosa!'],
            gravadaDepois: ['[mais baixo] ...e lambisgoia, pode gravar também.'],
            fim: ['Vou ligar pro vereador, então! Ele leva! [desliga]'],
          }),
        },
        radio: { excess: 'Central, {unit}. A idosa tava ótima, {dr}. Ofereceu café. A filha nem tava em casa.' },
        diary: { ori: 'A filha queria a ambulância para a consulta da mãe. Xingou e disse que ia ligar para o vereador.' },
      }),
    },
    {
      id: 'real',
      weight: 0.5,
      build: () => ({
        // ⚠ falso folgado: desmaio hoje cedo em idosa cardiopata, pulso lento.
        // [validar] síncope em idosa cardiopata com FC ~40: USB, USA defensável (bradiarritmia).
        truth: { dx: 'Síncope em idosa cardiopata, pulso lento (pediu transporte para a consulta)', sev: 'amarelo', ok: ['USB', 'USA'], best: 'USB', dest: ['REG'], risk: { good: 100, bad: 260, needs: 'USB' } },
        cat: 'clinico',
        note: 'Filha quer levar a mãe no cardiologista. Disse que ela apagou hoje cedo, {dr}.',
        noteWrong: 'Quer ambulância de táxi pra consulta. Tranquilo.',
        caller: 'Neuzely (filha)',
        callerName: 'Neuzely',
        type: 'minimizador',
        voice: 'mulher',
        amb: ['rua'],
        patient: { name: 'Filomena Duarte', age: 84, sex: 'F' },
        q: {
          oque: 'Nada, ela tá ótima... quer dizer, hoje de manhã ela apagou no banheiro. Mas já tá bem, por isso que eu quero mostrar o exame.',
          pulso: 'A vizinha contou pra mim... tá devagarinho, {dr}. Uns quarenta.',
          respira: 'Respira. Cansadinha, a vizinha falou.',
          pele: 'Branquinha. A vizinha disse que ela tá meio branca.',
          consciencia: 'Acordada. Meio lerda, mas acordada.',
          historico: 'Coração. Toma remédio pra arritmia e pra pressão.',
          inicio: 'O desmaio foi umas sete da manhã. Agora são... nossa, já passou da hora do almoço.',
          paciente: 'Ela tá em casa com a vizinha. Eu tô no serviço. Liguei daqui.',
          ...aflito('a minha mãe', true),
        },
        extra: [ex('desmaio', 'Desmaiou? Quanto tempo?', 'Ela desmaiou? Por quanto tempo? Bateu a cabeça?', 'Uns dois minutos, a vizinha achou. Não bateu a cabeça. Mas apagou, {dr}. Apagou mesmo.', { cat: 'clinico' })],
        radio: { ok: '{central}, {unit}. Bradicardia, frequência trinta e oito. A senhora tava sentada esperando a "consulta de amanhã". Seguimos pro Regional.' },
        diary: { alive: 'A filha queria transporte para a consulta. A mãe tinha desmaiado de manhã, com o coração a quarenta por minuto.', dead: 'A filha queria transporte para a consulta. A mãe tinha desmaiado de manhã.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// FG6 — "Saudade" (Seu Ednilson, embriagado num bar) — com variante real escondida (TCE)
// -----------------------------------------------------------------------------
const orientarTaxi = ex('taxi', 'Orientar: táxi e água', 'Orientar: dono do bar chama um táxi; água e cama', ['Táxi... água... cama. [soluço] Tá. Tonhão! Chama um táxi pra mim! [ao fundo: "Já tava chamando, Ednilson!"]', 'Obrigado, {dr}. {Dr} é gente boa.'], {
  kind: 'fala',
  cat: 'outros',
  cost: 3,
  say: 'Pede para o dono do bar chamar um táxi. Bebe água e vai dormir. E amanhã você liga pra ela, sóbrio.',
  onAsk: (e) => e.add('humanidade', 1, 'orientou o bêbado com paciência'),
});
const BEBADO = tpl({
  id: 'folgado_bebado_carona',
  ...base(),
  minDay: 3,
  age: [39, 39],
  sex: 'M',
  rel: ['proprio'],
  open: () => ['Alô, ambulância? [soluço] Eu tô passando mal. De saudade. Da minha ex. Me leva pra casa, que o motoqueiro não quer me levar porque eu vomitei no capacete dele.'],
  cena: { place: 'bar' },
  truths: [
    {
      id: 'xinga',
      weight: 3,
      build: (p) => ({
        truth: { dx: 'Embriaguez leve com saudade (quer carona de ambulância)', sev: 'verde', ok: ['ORI'], ref: ['CASA'] },
        cat: 'outros',
        addr: { ...p.addrOk, ref: 'Bar do Tonhão, na mesa da sinuca.' },
        note: 'Bêbado no bar. Quer carona pra casa. Diz que é saudade da ex.',
        noteWrong: 'Homem passando mal no bar, vomitou. Pode ser grave.',
        caller: 'Seu Ednilson',
        callerName: 'Seu Ednilson',
        type: 'embriagado',
        voice: 'bebado',
        amb: ['bar', 'musica'],
        patient: { name: 'Ednilson Rocha', age: 39, sex: 'M' },
        q: {
          oque: 'Bebi umas. Umas oito. Por causa da Rosenilda. Ela foi embora com o professor de zumba.',
          pulso: 'Tem. Bate por ela. [soluço]',
          respira: 'Respiro, ué. Suspiro, mais que respiro.',
          pele: 'Verde. De saudade. [ao fundo: "Tá vermelho, Ednilson!"]',
          consciencia: 'Mais acordado do que eu queria, {dr}.',
          historico: 'Nada. Coração partido. Isso conta?',
          ingestao: 'Cerveja. Umas oito. E uma pinga pra fechar. Duas.',
          paciente: 'Sou eu. O sofredor.',
          ...briga({
            perfil: ['Não sou perfil? Ela também disse isso. Que eu não era o perfil dela. [soluço]'],
            meios: ['Meio próprio eu não tenho, {dr}. O meu meio próprio me largou!'],
            segunda: [G('Sua... sua lambisgoia de jaleco! Songamonga! #%!#@$!'), '[soluço] ...Desculpa. Desculpa, {dr}. Eu tô triste.'],
            gravada: ['Tá gravando? Então grava aí: Rosenilda, volta pra mim! [soluço]'],
            gravadaDepois: ['Tá gravando? ...Apaga a parte da lambisgoia. Deixa só a da Rosenilda.'],
            fim: ['Tá certo... encerra... encerra tudo... igual ela... [soluço]', '[desliga]'],
          }),
        },
        extra: [orientarTaxi, ex('cabeca', 'Bateu a cabeça? Vomitou?', 'Você bateu a cabeça? Vomitou hoje?', 'Bati, mas foi ontem, na porta do guarda-roupa. Vomitar, só no capacete do moço. Uma vez.', { cat: 'trauma' })],
        radio: { excess: 'Central, {unit}. Bêbado de saudade, {dr}. Chorou no ombro do Márcio e pediu pra gente ligar pra Rosenilda.' },
        diary: { ori: 'Seu Ednilson bebeu de saudade da ex e pediu carona de ambulância. Foi de táxi.' },
      }),
    },
    {
      id: 'canta',
      weight: 1.8,
      build: (p) => ({
        truth: { dx: 'Embriaguez leve (quer carona de ambulância)', sev: 'verde', ok: ['ORI'], ref: ['CASA'] },
        cat: 'outros',
        addr: { ...p.addrOk, ref: 'Bar do Tonhão, na mesa da sinuca.' },
        note: 'Bêbado no bar, cantando. Quer carona.',
        noteWrong: 'Homem passando mal no bar, vomitou. Pode ser grave.',
        caller: 'Seu Ednilson',
        callerName: 'Seu Ednilson',
        type: 'embriagado',
        voice: 'bebado',
        amb: ['bar', 'musica'],
        noise: ['[alguém no bar canta junto, desafinado]'],
        patient: { name: 'Ednilson Rocha', age: 39, sex: 'M' },
        q: {
          oque: 'Saudade, {dr}. Saudade e cerveja. Uma alimenta a outra.',
          pulso: 'Tem. No ritmo do sertanejo.',
          respira: 'Respiro... [canta] "...e eu que te dei meu coração..."',
          pele: 'Corado. De cerveja.',
          consciencia: 'Acordado. E cantando.',
          historico: 'Nada.',
          ingestao: 'Cerveja. Umas seis. E saudade, muita.',
          paciente: 'Sou eu mesmo. O cantor.',
          ...briga({
            perfil: ['Não é perfil... ninguém nunca acha que eu sou perfil. [canta mais baixo]'],
            meios: ['Meios próprios... meu pé próprio, então. São dois quarteirões.'],
            segunda: ['Tá bom, {dr}. Eu vou a pé. Devagarinho. Cantando. Boa noite. Quer dizer, boa tarde.'],
            gravada: ['Gravada?! Então grava essa: [canta] "...volta pra mim, Rosenilda..."'],
            fim: ['Tchau, {dr}. Você é que nem ela. Mas mais educad{m:o|a}. [desliga]'],
          }),
        },
        extra: [orientarTaxi, ex('cabeca', 'Bateu a cabeça? Vomitou?', 'Você bateu a cabeça? Vomitou hoje?', 'Não, não. A cabeça tá inteira. O coração é que não.', { cat: 'trauma' })],
        radio: { excess: 'Central, {unit}. Embriaguez leve, {dr}. Cantou pra equipe. O Bené gostou.' },
        diary: { ori: 'Seu Ednilson cantou para a regulação e foi a pé para casa.' },
      }),
    },
    {
      id: 'real',
      weight: 0.4,
      build: (p) => ({
        // ⚠ bêbado também tem TCE: bateu a cabeça HOJE e vomitou duas vezes. [validar] TCE com vômitos repetidos = USB, Regional (tomografia).
        truth: { dx: 'TCE com vômitos em embriagado (bateu a cabeça no bar)', sev: 'amarelo', ok: ['USB'], dest: ['REG'], risk: { good: 100, bad: 260, needs: 'USB' } },
        cat: 'trauma',
        addr: { ...p.addrOk, ref: 'Bar do Tonhão, na mesa da sinuca.' },
        note: 'Bêbado no bar, quer carona. Disse que bateu a cabeça, {dr}.',
        noteWrong: 'Bêbado querendo táxi. Folgado.',
        caller: 'Seu Ednilson',
        callerName: 'Seu Ednilson',
        type: 'embriagado',
        voice: 'bebado',
        amb: ['bar'],
        patient: { name: 'Ednilson Rocha', age: 39, sex: 'M' },
        q: {
          oque: 'Saudade. E eu caí. Escorreguei na porta do banheiro do bar. Mas tô bem.',
          pulso: 'Tem. [soluço]',
          respira: 'Respiro.',
          pele: 'Branco. Branco que nem azulejo. O Tonhão que falou.',
          consciencia: 'Acordado... meio zonzo. Mas é a cerveja. Acho.',
          historico: 'Nada.',
          ingestao: 'Três cervejas. Só três, hoje.',
          paciente: 'Sou eu.',
          nao_perfil: ['Não é perfil... é, eu sei. Bêbado não é perfil. [soluço] Mas a cabeça tá doendo, {dr}.'],
          meios_proprios: ['Meios próprios... eu tô meio zonzo pra andar, {dr}. [ao fundo: "Ele vomitou de novo!"]'],
          gravada: ['Pode gravar. Eu só tô zonzo.'],
          encerrar: ['Tá... [a linha cai]'],
        },
        extra: [
          orientarTaxi,
          ex('cabeca', 'Bateu a cabeça? Vomitou?', 'Você bateu a cabeça? Vomitou hoje?', ['Bati... foi ontem. Não, peraí. Foi hoje. Na quina da porta. Agora há pouco.', 'E vomitei duas vezes. Mas é a cerveja, né? [ao fundo, o Tonhão: "Ele só tomou três, doutor!"]'], { cat: 'trauma' }),
        ],
        radio: { ok: '{central}, {unit}. TCE, galo na nuca, vomitando. Bêbado também cai, {dr}. Seguimos pro Regional pra tomografia.' },
        diary: { alive: 'Pediu carona de bêbado. Tinha batido a cabeça no bar e vomitado duas vezes. Fez tomografia.', dead: 'Pediu carona de bêbado. Tinha batido a cabeça.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// FG7 — "A carteirada" (Dr. Wanderlei, advogado, a sogra para a casa de repouso)
// -----------------------------------------------------------------------------
const peixotoSacripanta = (e: EffCtx) =>
  e.toast('Interfone, mais tarde. PEIXOTO: "Um tal de Wanderlei ligou aqui gritando. Disse que você é sacripanta. Mandou viatura? Não? Então é sacripanta com razão."');
const VIP = tpl({
  id: 'folgado_vip',
  ...base(),
  minDay: 3,
  age: [81, 81],
  sex: 'F',
  rel: ['filho'],
  open: () => ['Aqui é o doutor Wanderlei, advogado. Minha sogra precisa ir pra casa de repouso hoje, a vaga abriu. A ambulância de transporte particular cobra quatrocentos reais. Vocês são pagos com o meu imposto. Mandem uma, por favor, e me passem o nome de quem está atendendo.'],
  cena: { place: 'sala', pose: 'cama' },
  truths: [
    {
      id: 'xinga',
      weight: 3,
      build: () => ({
        truth: { dx: 'Sem urgência: transporte de idosa acamada estável para casa de repouso', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        cat: 'outros',
        note: 'Advogado. Quer ambulância pra levar a sogra pra casa de repouso. Pediu o seu nome, {dr}.',
        noteWrong: 'Idosa acamada, o genro diz que precisa de ambulância urgente.',
        caller: 'Dr. Wanderlei (genro)',
        callerName: 'Dr. Wanderlei',
        type: 'vip',
        voice: 'profissional',
        amb: ['silencio'],
        patient: { name: 'Hermínia Valadares', age: 81, sex: 'F' },
        q: {
          oque: 'Mudança de endereço. Ela é acamada, mas estável. Muito estável. Mais estável que eu.',
          pulso: 'Tem. O cuidador mede de manhã. Normal.',
          respira: 'Respira bem. Melhor do que eu, com essa conversa.',
          pele: 'Normal. Está maquiada para a mudança, inclusive.',
          consciencia: 'Acordada. Reclamando da casa de repouso.',
          historico: 'AVC há três anos. Acamada desde então. Estável.',
          paciente: 'Ela está assistindo televisão. Não vou incomodá-la.',
          ...briga({
            perfil: ['Eu vou te processar. Qual é o seu nome completo? Com sobrenome.'],
            meios: ['Meios próprios? Quatrocentos reais, {dr}. Quatrocentos. Isso é extorsão privada.'],
            segunda: [G('Seu... seu sacripanta de uma figa! Seu &%$#! Vou ligar pro Peixoto!'), 'Eu conheço o Peixoto! Jogamos tênis!'],
            gravada: ['Ótimo. Que fique gravado que fui mal atendido.'],
            gravadaDepois: ['[mais baixo] ...e que fique gravado o "sacripanta", que é termo técnico.'],
            fim: ['Isso não vai ficar assim! Meu escritório vai notificar! [desliga]'],
          }),
        },
        onResolve: (e, r) => {
          if (r.decision?.resource === 'ORI') peixotoSacripanta(e);
        },
        radio: { excess: 'Central, {unit}. Mudança pra casa de repouso, {dr}. A senhora tava pronta, de mala. O genro pediu nota fiscal.' },
        diary: { ori: 'O Dr. Wanderlei queria ambulância para mudar a sogra para a casa de repouso. Chamou {m:o regulador|a reguladora} de sacripanta.' },
      }),
    },
    {
      id: 'cede',
      weight: 1.8,
      build: () => ({
        truth: { dx: 'Sem urgência: transporte de idosa acamada estável para casa de repouso', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        cat: 'outros',
        note: 'Advogado. Quer ambulância pra mudar a sogra pra casa de repouso.',
        noteWrong: 'Idosa acamada, o genro diz que precisa de ambulância urgente.',
        caller: 'Dr. Wanderlei (genro)',
        callerName: 'Dr. Wanderlei',
        type: 'vip',
        voice: 'profissional',
        amb: ['silencio'],
        patient: { name: 'Hermínia Valadares', age: 81, sex: 'F' },
        q: {
          oque: 'Mudança. Ela é acamada e estável.',
          pulso: 'Normal.',
          respira: 'Bem.',
          pele: 'Normal.',
          consciencia: 'Acordada.',
          historico: 'AVC antigo. Estável.',
          paciente: 'HERMÍNIA: Wanderlei, larga desse telefone e paga a ambulância, sovina!',
          ...briga({
            perfil: ['Não é perfil... [ao fundo: "Paga, Wanderlei!"] ...Entendo.'],
            meios: ['Meios próprios. Certo. [pausa] Quatrocentos reais. [suspiro] Certo.'],
            segunda: ['Está bem, {dr}. Vou contratar o transporte. Minha sogra agradece. Eu, nem tanto.'],
            gravada: ['Gravada. Perfeito. [pigarro] Serei breve.'],
            fim: ['Passar bem. [desliga]'],
          }),
        },
        radio: { excess: 'Central, {unit}. Transporte eletivo, {dr}. A sogra mandou a gente cobrar dele.' },
        diary: { ori: 'O Dr. Wanderlei queria ambulância para a mudança da sogra. A sogra mandou ele pagar.' },
      }),
    },
    {
      id: 'carteirada',
      weight: 1.2,
      build: () => ({
        truth: { dx: 'Sem urgência: transporte de idosa acamada estável para casa de repouso', sev: 'azul', ok: ['ORI'], ref: ['CASA'] },
        cat: 'outros',
        note: 'Advogado dando carteirada. Quer ambulância pra mudança da sogra.',
        noteWrong: 'Idosa acamada, o genro diz que precisa de ambulância urgente.',
        caller: 'Dr. Wanderlei (genro)',
        callerName: 'Dr. Wanderlei',
        type: 'vip',
        voice: 'profissional',
        amb: ['ventilador'],
        patient: { name: 'Hermínia Valadares', age: 81, sex: 'F' },
        q: {
          oque: 'Ela está estável. Mas eu sou advogado da Câmara, {dr}. Isso costuma resolver.',
          pulso: 'Normal, segundo o cuidador.',
          respira: 'Bem.',
          pele: 'Normal.',
          consciencia: 'Acordada.',
          historico: 'AVC antigo. Estável.',
          paciente: 'Ela está descansando.',
          ...briga({
            perfil: ['Perfil. Interessante. E o perfil do vereador, qual era? Eu li a Gazeta.'],
            meios: ['Meios próprios. Anotado. Com data e hora. E o seu nome, por favor.'],
            segunda: ['Muito bem. Vai constar na minha representação. [teclado] Constou.'],
            gravada: ['Excelente. Eu também estou gravando. Ficamos quites.'],
            fim: ['Até a próxima, {dr}. Haverá próxima. [desliga]'],
          }),
        },
        onResolve: (e, r) => {
          if (r.decision?.resource === 'ORI') peixotoSacripanta(e);
        },
        radio: { excess: 'Central, {unit}. Mudança de casa de repouso, {dr}. O advogado filmou a gente com o celular.' },
        diary: { ori: 'O Dr. Wanderlei deu carteirada para conseguir ambulância para a mudança da sogra. Não conseguiu.' },
      }),
    },
  ],
});

// -----------------------------------------------------------------------------
// FG8 — "Tô na rodoviária" (Dona Iracilda e a pressão 14 por 9 do marido)
// -----------------------------------------------------------------------------
const RODO_ADDR = { rua: 'Av. Brasil', n: 1501, bairro: 'Distrito Industrial', ref: 'Na plataforma seis, do lado do guichê de Rio Claro.' };
const sintomas = (real = false) =>
  ex('sintomas', 'Dor no peito? Falta de ar? Fala enrolada?', 'Ele tem dor no peito, falta de ar, fala enrolada, fraqueza de um lado?', real ? 'Fala... não. Falta de ar, não. Mas ele falou que tá com dor de cabeça forte e a vista meio embaçada, {dr}.' : 'Não, não, nada. Só reclama das malas.', { cat: 'clinico' });
const RODOVIARIA = tpl({
  id: 'folgado_rodoviaria',
  ...base(),
  minDay: 3,
  age: [70, 70],
  sex: 'M',
  rel: ['esposa'],
  open: () => ['Alô? Eu cheguei agora de Rio Claro na rodoviária e meu marido tá com a pressão meio assim. Ele mediu na farmácia, deu catorze por nove. Vocês buscam a gente? A gente mora longe e tá com três malas.'],
  cena: { place: 'ponto_onibus', pose: 'sentado', props: ['sacola'] },
  truths: [
    {
      id: 'mala',
      weight: 3,
      build: () => ({
        truth: { dx: 'Pressão 14 por 9 sem sintomas (quer transporte da rodoviária)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        cat: 'outros',
        addr: RODO_ADDR,
        note: 'Casal na rodoviária, três malas. Pressão 14 por 9 sem nada. Quer carona.',
        noteWrong: 'Idoso com pressão alta na rodoviária. A esposa tá nervosa.',
        caller: 'Dona Iracilda (esposa)',
        callerName: 'Dona Iracilda',
        type: 'exagerador',
        voice: 'idosa',
        amb: ['onibus', 'multidao'],
        noise: ['[alto-falante: "Embarque para Ribeirão, plataforma quatro"]'],
        patient: { name: 'Valdomiro Assis', age: 70, sex: 'M' },
        q: {
          oque: 'Nada, só a pressão catorze. Ele toma o remédio, tomou hoje.',
          pulso: 'Tem, ele contou, deu oitenta e pouco.',
          respira: 'Respira e reclama das malas.',
          pele: 'Normal. Moreninho, de sol.',
          consciencia: 'Acordado. Contando as malas.',
          historico: 'Pressão. Toma losartana. Tomou hoje cedo, antes do ônibus.',
          inicio: 'Mediu agora, na farmácia da rodoviária.',
          paciente: 'VALDOMIRO: Eu tô bem, {dr}. Ela é que quer carona.',
          ...briga({
            perfil: ['Não é perfil? Mas é pressão, {dr}! Pressão mata!'],
            meios: ['Meios próprios... com três malas?'],
            segunda: ['Tá bom. A gente pega o táxi. Mas {m:o senhor|a senhora} carrega uma mala na consciência.'],
            gravada: ['Gravada? Então grava que eu vim de Rio Claro com três malas e ninguém me ajudou.'],
            fim: ['Tá bom, tá bom. [desliga]'],
          }),
        },
        extra: [sintomas()],
        radio: { excess: 'Central, {unit}. Pressão catorze por nove, {dr}. Três malas. A gente levou as malas até o táxi, pelo menos.' },
        diary: { ori: 'Dona Iracilda queria carona da rodoviária por causa de uma pressão catorze por nove. Foram de táxi, com três malas.' },
      }),
    },
    {
      id: 'xinga',
      weight: 1.5,
      build: () => ({
        truth: { dx: 'Pressão 14 por 9 sem sintomas (quer transporte da rodoviária)', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
        cat: 'outros',
        addr: RODO_ADDR,
        note: 'Casal na rodoviária. Pressão 14 por 9. O marido tá bravo com as malas.',
        noteWrong: 'Idoso com pressão alta na rodoviária. A esposa tá nervosa.',
        caller: 'Dona Iracilda (esposa)',
        callerName: 'Dona Iracilda',
        type: 'exagerador',
        voice: 'idosa',
        amb: ['onibus', 'multidao'],
        patient: { name: 'Valdomiro Assis', age: 70, sex: 'M' },
        q: {
          oque: 'A pressão. Catorze por nove. E as malas.',
          pulso: 'Tem. Oitenta e pouco.',
          respira: 'Respira. Bufando, mas respira.',
          pele: 'Normal.',
          consciencia: 'Acordado. Bravo.',
          historico: 'Pressão. Toma o remédio.',
          paciente: 'VALDOMIRO: Me dá isso, Iracilda. [pigarro] Alô, {dr}.',
          ...briga({
            perfil: ['VALDOMIRO: Não é perfil? Eu tenho setenta anos, {dr}! Eu sou o perfil!'],
            meios: ['VALDOMIRO: Meios próprios? Com três malas e uma Iracilda?'],
            segunda: [G('VALDOMIRO: Seu... seu estrupício! Seu pamonha de plantão! #%!#@$!'), 'Valdomiro! A pressão! [pausa] ...Agora deve tá quinze.'],
            gravada: ['Gravada?! Valdomiro, olha a boca, tá gravando!'],
            gravadaDepois: ['VALDOMIRO: [mais baixo] ...estrupício gravado.'],
            fim: ['Vamos de táxi, Valdomiro. [desliga]'],
          }),
        },
        extra: [sintomas()],
        radio: { excess: 'Central, {unit}. Pressão catorze por nove. O senhor chamou o Ramon de estrupício.' },
        diary: { ori: 'Seu Valdomiro, com a pressão catorze por nove e três malas, xingou a regulação. Foram de táxi.' },
      }),
    },
    {
      id: 'cefaleia',
      weight: 0.5,
      build: () => ({
        // ⚠ a mesma pressão "só catorze", mas com dor de cabeça forte e vista embaçada: precisa de avaliação.
        // [validar] PA moderadamente elevada com cefaleia e alteração visual sem déficit = UPA por meios próprios ou USB; aqui: USB defensável, UPA.
        truth: { dx: 'Pressão alta com dor de cabeça e vista embaçada (quer transporte)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['UPA'], dest: ['UPA'] },
        cat: 'clinico',
        addr: RODO_ADDR,
        note: 'Casal na rodoviária. Pressão 14 por 9. Ele reclama de dor de cabeça, {dr}.',
        noteWrong: 'Casal querendo carona da rodoviária. Folgados.',
        caller: 'Dona Iracilda (esposa)',
        callerName: 'Dona Iracilda',
        type: 'comum',
        voice: 'idosa',
        amb: ['onibus', 'multidao'],
        patient: { name: 'Valdomiro Assis', age: 70, sex: 'M' },
        q: {
          oque: 'A pressão, catorze por nove. E ele tá com uma dor de cabeça que não passa desde o ônibus.',
          pulso: 'Tem. Oitenta e pouco.',
          respira: 'Respira normal.',
          pele: 'Normal. Meio suado, do calor do ônibus.',
          consciencia: 'Acordado. Quieto, de olho fechado por causa da claridade.',
          historico: 'Pressão. Esqueceu o remédio em Rio Claro. Na casa da filha.',
          inicio: 'A dor? Começou no ônibus, faz umas duas horas.',
          paciente: 'VALDOMIRO: A cabeça tá pesada, {dr}. E a vista meio embaçada.',
          nao_perfil: ['Mas ele tá com dor de cabeça, {dr}...'],
          meios_proprios: ['Meios próprios... pra onde? Pra UPA? Tá. A gente vai de táxi pra UPA, então.'],
          gravada: ['Gravada? Tá. Eu só quero saber pra onde levar ele.'],
          encerrar: ['Ué? [a linha cai]'],
        },
        extra: [sintomas(true)],
        radio: { ok: '{central}, {unit}. Pressão dezessete por dez, cefaleia, sem déficit. Esqueceu o remédio em Rio Claro. Seguimos pra UPA.' },
        diary: { ori: 'Seu Valdomiro esqueceu o remédio da pressão em Rio Claro. Foi para a UPA com a dor de cabeça.', alive: 'Seu Valdomiro esqueceu o remédio da pressão em Rio Claro. Foi atendido na UPA.' },
      }),
    },
  ],
});

/** as oito ligações dos folgados (docs/roteiro-1.1/trotes-folgados.md, parte B) */
export const FOLGADOS = [UBER, FILA_UPA, EXAME, VET, CONSULTA, BEBADO, VIP, RODOVIARIA];
/** ids dos modelos (para testes e para os dias que quiserem um folgado fixo) */
export const FOLGADO_IDS = FOLGADOS.map((t) => t.id);

/**
 * Vaga de folgado num dia (para os arquivos de dia): uma ligação que é SEMPRE sorteada entre os
 * folgados liberados no dia (`pool: 'folgado'`, `genOnly`), mesmo sem "ligações variáveis".
 * Uso: `DAY.calls.push(folgadoSlot('d12_folgado', '10:40'))`. Some sozinha nos dias pesados (9, 17,
 * 19, 20) e quando o dia já sorteou um folgado (no máximo um por plantão). A reserva escrita (o Seu
 * Clodoaldo do dedinho) só serve de molde: a ligação de verdade sempre vem do banco.
 */
export function folgadoSlot(id: string, at: string): CallDef {
  const rng = new Rng(7331);
  const tp: TemplateParams = {
    name: 'Clodoaldo Pereira',
    first: 'Clodoaldo',
    age: 52,
    sex: 'M',
    addr: { rua: 'Rua Tiradentes', n: 1180, bairro: 'Vila Nova' },
    num: '(17) 99731-5520',
    rel: 'proprio',
    relName: 'Clodoaldo (o próprio paciente)',
    day: 3,
    rand: () => rng.next(),
    pick: <T,>(a: readonly T[]) => rng.pick(a),
  };
  const built = UBER.truths[0].build(tp);
  return {
    num: tp.num,
    caller: 'Seu Clodoaldo',
    type: 'exagerador',
    note: 'Quer carona pra UPA.',
    addr: tp.addr,
    patient: { name: tp.name, age: tp.age, sex: tp.sex },
    ...built,
    id,
    at,
    pool: 'folgado',
    genOnly: true,
    dropIfNoVariant: true,
    when: (c) => !FOLGADO_NOT_DAYS.includes(c.day),
  } as CallDef;
}
