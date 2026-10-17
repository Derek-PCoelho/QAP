// =============================================================================
// DIA 2 — "O Quadro" (Manual p.2: protocolo de trote, ferramenta "Ligar de volta")
// Fios: 🌱 Biel (número 9-8877, primeiro trote), 🌱 Seu Nogueira (conta de água),
// ↺ Dona Cida (grupo de senhoras da igreja), 🌱 dengue (dedetização da Estadual).
// Padrões quebrados de propósito: a ligação muda que não é trote "de verdade"
// (acidental) e o tornozelo com risadas ao fundo que é caso real.
// =============================================================================
import type { Ctx } from '../../engine/types';
import type { DeskDoc } from '../../engine/content-api';
import { day, call, fx, NUM, ADDR } from '../dsl';

/** saudação conforme a hora em que a ligação é atendida */
const saud = (c: Ctx) => {
  const t = c.s.shift?.time ?? 8 * 60;
  return t < 12 * 60 ? 'Bom dia' : t < 18 * 60 ? 'Boa tarde' : 'Boa noite';
};

/** desfecho de uma ligação de dia anterior registrada no diário */
const diaryKind = (c: Ctx, id: string) => c.s.diary.find((d) => d.id === id)?.kind;

export const DOCS_EXTRA: Record<string, DeskDoc> = {
  jornal_d02: {
    id: 'jornal_d02',
    title: 'Gazeta de Santa Aurora (terça-feira)',
    text: 'Recorte da página 3: "SEM AULA NA ESTADUAL — A Escola Estadual Prof. Aurélio Matos (Rua Ipê, 901, Jardim Norte) não abre nesta terça. O prédio passa por dedetização contra o mosquito da dengue. Os alunos estão dispensados; o mosquito, não."',
    until: 2,
    clues: [{ id: 'doc:escola_fechada', text: 'Jornal: a Escola Estadual (Rua Ipê, 901) está FECHADA hoje para dedetização — sem aula, sem aluno' }],
  },
};

export const DAY = day({
  day: 2,
  title: 'O Quadro',
  weekday: 'Terça-feira',
  weather: 'Sol forte, 34 °C. Nenhuma nuvem.',
  onStart: fx.doc('jornal_d02'),
  newspaper: (c) => {
    const parada = diaryKind(c, 'd01_parada');
    const head =
      parada === 'vivo'
        ? { headline: 'Homem tem parada cardíaca na Av. Brasil e volta à vida na calçada', sub: 'Testemunha fez massagem orientada pelo telefone da Regulação até a chegada da UTI móvel. Vítima segue sem identificação no Regional.', photo: 'rua' }
        : parada === 'morto'
          ? { headline: 'Homem morre na calçada da Av. Brasil; ninguém sabe o nome dele', sub: 'Vítima de parada cardíaca não levava documentos. O Regional pede que familiares procurem a portaria.', photo: 'rua' }
          : { headline: 'Calor de 34 °C bate recorde de consumo de água em Santa Aurora', sub: 'DAE pede economia e anuncia "força-tarefa" para cobrar contas atrasadas.', photo: 'calor' };
    return {
      ...head,
      stories: [
        { title: 'Sem aula na Estadual', text: 'A Escola Estadual Prof. Aurélio Matos, no Jardim Norte, fica fechada nesta terça para dedetização contra o mosquito da dengue. A diretoria pede que os pais "mantenham os alunos ocupados". Os pais pedem o mesmo à diretoria.' },
        { title: 'DAE aperta a cobrança: "o débito é do imóvel"', text: 'O Departamento de Água e Esgoto promete cortar o fornecimento de imóveis com contas atrasadas, "mesmo que o devedor já tenha se mudado". Inquilinos reclamam; o diretor diz que "a água não tem CPF".' },
        { title: 'Saúde+ Gestão divulga números do primeiro dia', text: 'Segundo a OS, o tempo médio de regulação da Central caiu 11% desde a nova gestão. A nota não informa quantas ligações ficaram para o plantão noturno.' },
        { title: 'Amor de Cristal', text: 'Depois de descobrir o segredo, Marta foge da fazenda na garupa de um peão. Telespectadoras da Bela Vista garantem que "ela volta".' },
      ],
      notice: 'Nova página no Manual: p.2 — Protocolo de trote. Ferramenta "Ligar de volta" liberada. O quadro de cortiça agora é seu.',
      ad: 'CONSIGNADO PARA APOSENTADOS — dinheiro na hora, sem consulta, sem burocracia. Parcelas que cabem no seu benefício (e no dos seus netos).',
      weather: 'Sol forte · 34 °C',
    };
  },
  handover: () => ({
    id: 'd02_passagem',
    bg: 'central',
    nodes: {
      start: {
        lines: [
          { who: 'NARRADOR', t: '07:00. A cadeira do noturno ainda está morna. No teclado, um papel de bala de menta dobrado em quatro.' },
          { who: 'SIMONE', t: 'O Henrique já foi, {dr}. Saiu seis e meia. Mandou dizer que a noite foi "tranquila". Ele sempre manda dizer isso.' },
          { who: 'NARRADOR', t: 'Atrás da sua mesa, um quadro de cortiça com tachinhas coloridas. Quase vazio. Um post-it amarelo da Dona Cida, preso torto.' },
          { who: 'SIMONE', t: 'E esse aqui é o quadro. O manual novo chegou: página 2, trote. Número que passa trote vem pra cá.' },
        ],
        choices: [
          { label: '"Como a gente sabe que é trote?"', next: 'sinais' },
          { label: '"E se uma pessoa de verdade ligar de um número do quadro?"', next: 'cuidado', effect: fx.add('lealSimone', 1, 'perguntou o que importa') },
          { label: '"Entendido. Vamos trabalhar."', next: 'fim' },
        ],
      },
      sinais: {
        lines: [
          { who: 'SIMONE', t: 'Risadinha no fundo. História de filme. Rua que não existe. E época: feriado, final de campeonato, dia sem aula.' },
          { who: 'SIMONE', t: 'Hoje a Estadual tá fechada, saiu no jornal. Deixei o recorte na sua mesa. Prepara o ouvido.' },
        ],
        next: 'fim',
      },
      cuidado: {
        lines: [
          { who: 'SIMONE', t: '(ela para de mexer no café) ...Essa é a pergunta certa, {dr}. O quadro diz quem já mentiu. Não diz quem tá mentindo agora.' },
          { who: 'SIMONE', t: 'Em 2019 uma senhora ligou três vezes do número do neto que vivia passando trote. Na terceira, era verdade. Eu tava aqui.' },
        ],
        next: 'fim',
      },
      fim: { lines: [{ who: 'SIMONE', t: 'Na dúvida, liga de volta. Custa meia hora. Mandar ambulância pra nada custa mais. E deixar de mandar custa muito mais.' }] },
    },
  }),
  timeline: [
    { at: '07:01', kind: 'radio', who: 'USA 01 · BENÉ', text: 'Central, USA 01 em QRV na base Centro. Segundo plantão, {dr}? O primeiro a gente nunca esquece. O segundo é que ensina.' },
    { at: '09:10', kind: 'interfone', who: 'DR. PEIXOTO', text: '{Dr}, Peixoto. Só pra constar: cada básica que sai custa setecentos e vinte reais pra OS. A avançada, mil oitocentos e cinquenta. Trote é dinheiro jogado no asfalto, viu? Página 2. Bom dia.' },
    { at: '12:16', kind: 'simone', who: 'SIMONE', text: 'Ligação muda nem sempre é engano, {dr}. Às vezes é alguém que não consegue falar. Antes de carimbar, liga de volta.' },
    { at: '12:40', kind: 'simone', who: 'SIMONE', text: 'Almoço é pão com mortadela na mesa. Se {m:o senhor|a senhora} quiser, tem metade aqui.' },
    { at: '15:05', kind: 'radio', who: 'USB 03 · LIA', text: 'Central, USB 03 em QRV na base Norte. E alguém avisa a padaria da Av. Norte que pão de queijo frio é crime.' },
    { at: '17:40', kind: 'simone', who: 'SIMONE', text: 'Amanhã os moleques voltam pra escola e o telefone respira um pouco. Até o meio-dia, pelo menos.' },
  ],
  calls: [
    // ------------------------------------------------------------------ 1 ★ BIEL
    call({
      id: 'd02_biel',
      ref: 'D2 #1 ★',
      at: '07:06',
      anchor: true,
      num: NUM.biel,
      caller: 'Voz de moleque',
      callerName: 'Voz de moleque',
      type: 'trotista',
      voice: 'adolescente',
      note: 'Voz de moleque. Diz que tem um esfaqueado na frente da escola.',
      noteFixed: true,
      addr: { rua: 'Rua Ipê', n: 905, bairro: 'Jardim Norte', ref: 'Na frente da Escola Estadual, perto do portão.' },
      amb: ['risadas', 'videogame'],
      open: [
        'Alô, emergência? Corre, corre! Tem um cara {{esfaqueado|esfaqueado}} aqui na frente da {{Escola Estadual|escola}}! Tá {{jorrando sangue|jorrando}}, manda rápido!',
        '[{{risadas abafadas, alguém cobrindo o fone|risadas}}]',
      ],
      q: {
        oque: ['Dois cara brigaram, aí um puxou a faca e... pá! Na barriga!', 'Tá cheio de {{aluno em volta gritando|alunos}}, mano!'],
        consciencia: '{{Tá...|cons_sim}} {{não, tá morto, tá morto!|cons_morto}}',
        respira: ['Tá respirando... fazendo um barulho...', '[voz ao fundo, segurando o riso: {{"fala que o sangue tá jorrando!"|cochicho}}]'],
        idade: 'Sei lá, uns... vinte? Trinta? É um tiozão.',
        inicio: 'Agora! Agorinha! Corre!',
        sangramento: 'Muito! Tá fazendo uma poça, {{tipo filme|filme}}!',
        historico: 'Eu sei lá, mano, nem conheço o cara.',
        paciente: ['Ele não pode falar, ele tá... desmaiado. Morto. Desmaiado-morto.', '[risadas]'],
        referencia: 'Na frente da escola, ué! Do lado do muro pichado.',
        seguranca: 'Seguro, seguro. O cara da faca já vazou. Correu pra... pra lá.',
        confronto_quadro: ['[risadas]', '[desliga]'],
      },
      extra: [
        {
          id: 'fechada',
          kind: 'confronto',
          label: '"A escola está fechada hoje."',
          locked: true,
          say: 'A Escola Estadual está fechada hoje, para dedetização. Que alunos são esses na porta?',
          a: ['Ah... é que... são os aluno da... da outra escola!', '[gargalhada de três vozes]', '[desliga]'],
        },
      ],
      callback: ['[chama... chama...]', '[{{caixa postal, voz de adolescente: "Fala aí, é o Biel. Não posso atender, tô ocupado salvando vidas. Deixa recado!" (risada)|retorno_caixa}}]'],
      links: [
        { a: 'alunos', b: 'doc:escola_fechada', insight: 'Cheio de aluno na porta de uma escola que está fechada hoje para dedetização (jornal): horário incompatível. Sinal de trote (Manual p.2).', unlock: 'fechada' },
        { a: 'mapa', b: 'doc:escola_fechada', insight: 'O mapa confirma: o endereço é a Escola Estadual — que está fechada hoje. Ninguém "na saída" de uma escola sem aula.', unlock: 'fechada' },
        { a: 'cons_sim', b: 'cons_morto', insight: '"Tá acordado" e "tá morto" na mesma frase. Quem está vendo a cena não erra isso.' },
        { a: 'cochicho', b: 'jorrando', insight: 'Alguém ao fundo dita o que ele deve dizer. A história está sendo montada na hora.' },
        { a: 'risadas', b: 'manual:trote_sinais', insight: 'Risadas abafadas e relato de filme: sinais clássicos de trote (Manual p.2).' },
        { a: 'retorno_caixa', b: 'manual:ligar_volta', insight: 'Ligar de volta: caixa postal com voz de adolescente rindo ("Biel"). Reforça a suspeita (Manual p.2).' },
      ],
      patient: { name: '"Homem esfaqueado"' },
      truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} na Escola Estadual. Portão trancado, cheiro de veneno de dedetização e nenhum esfaqueado. Só um gato. Era trote. Retornando.' },
      diary: { ori: 'Trote: "esfaqueado na frente da Estadual", com a escola fechada. Número final 8877. Na caixa postal: "é o Biel".' },
    }),
    // ------------------------------------------------------------------ 2
    // Conferido (RC7): epiléptico com crise única de 2 min já cessada seria orientação, mas "história de trauma
    // craniano" (cortou a testa na queda) é discriminador de USI/USB → USB. Ronco regular + resmunga = pós-ictal (RM2).
    call({
      id: 'd02_convulsao',
      ref: 'D2 #2',
      at: '07:55',
      pool: 'moderado',
      num: '(17) 3329-2815',
      caller: 'Marlene (mãe)',
      callerName: 'Marlene',
      type: 'comum',
      voice: 'mulher',
      note: 'Mãe. Filho epiléptico teve crise, já parou.',
      noteWrong: 'Mãe diz que o filho não acorda e tá roncando. Pode ser parada!',
      addr: { rua: 'Rua Tiradentes', n: 1740, bairro: 'Vila Nova', ref: 'Casa amarela em frente ao salão de beleza.' },
      amb: ['respiracao', 'tv'],
      open: [
        '{m:Moço|Moça}, o meu filho teve crise. Ele tem epilepsia. Já parou, mas ele {{caiu e cortou a testa|testa}} e agora tá ali no chão {{dormindo, roncando|ronco}}. Eu não consigo levantar ele sozinha!',
        '[um ronco alto e regular, perto do fone]',
      ],
      q: {
        oque: 'Ele tava tomando café, deu aquele grito e caiu duro, tremendo todo. Mordeu a língua. Fez xixi na roupa. Durou {{uns dois minutos|dois_min}}, eu contei no relógio.',
        consciencia: 'Ele {{resmunga quando eu chamo|resmunga}}, abre o olho e fecha de novo. Depois da crise ele sempre fica assim, uma meia hora, bobo de sono.',
        respira: 'Tá respirando fundo, {{o peito sobe e desce direitinho|resp_regular}}. Ronca igual ronca de noite.',
        idade: 'Dezessete. Mas é grandão, noventa quilos, eu não aguento ele.',
        inicio: 'A crise foi faz uns quinze minutos.',
        sangramento: 'Um cortinho em cima da sobrancelha. Sangrou, mas já pus um pano e parou.',
        historico: ['Epilepsia desde pequeno. Toma remédio de manhã e de noite.', '...Quer dizer, {{tava sem fazia três dias|sem_remedio}}. Acabou e o posto não tinha. Disseram que chega semana que vem.'],
        paciente: ['MARLENE: Gustavo! Gustavo, fala com {m:o moço|a moça}!', 'GUSTAVO: Hmmm... me deixa... dormir...'],
        referencia: 'Casa amarela em frente ao salão de beleza da Neide.',
        seguranca: 'Tranquilo. Só eu e ele. Afastei a mesa.',
      },
      extra: [
        { id: 'crises', label: 'Teve mais de uma crise?', say: 'Foi uma crise só? Ele acordou entre uma e outra?', a: 'Uma só, graças a Deus. Faz quase um ano que ele não tinha.' },
      ],
      links: [
        { a: 'ronco', b: 'resmunga', insight: 'Ronco com respiração regular e resposta ao chamado, logo depois de uma convulsão: é o sono pós-crise, não parada.' },
        { a: 'ronco', b: 'manual:parada', kind: 'confirma', insight: 'A regra de parada vale para quem NÃO responde. Ele resmunga e respira fundo e regular. Não é parada — mas fique de olho.' },
        { a: 'dois_min', b: 'manual:amarelo', insight: 'Convulsão que já passou, com trauma na cabeça e sem remédio há três dias: amarelo → USB (Manual p.1).' },
        { a: 'sem_remedio', b: 'testa', insight: 'Sem o remédio há três dias e bateu a cabeça na queda: precisa ser avaliado. Ninguém aqui consegue levá-lo.' },
      ],
      patient: { name: 'Gustavo Teixeira', age: 17, sex: 'M' },
      truth: { dx: 'Pós-crise convulsiva em epiléptico (sem remédio, corte na testa)', sev: 'amarelo', ok: ['USB'], risk: { good: 100, bad: 280, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} no local. Rapaz de 17, pós-ictal, acordando. Corte pequeno no supercílio. Sem anticonvulsivante há três dias, "acabou no posto". Removendo pra UPA.',
        excess: '{central}, {unit}. Pós-crise, já acordando, sinais estáveis. Dava USB, {dr}.',
      },
      diary: { alive: 'Convulsão em casa. Sem o remédio há três dias: "acabou no posto". Removido acordando.' },
    }),
    // ------------------------------------------------------------------ 3 ★ CIDA
    call({
      id: 'd02_cida',
      ref: 'D2 #3',
      at: '08:45',
      anchor: true,
      num: NUM.cida,
      caller: 'Dona Cida',
      callerName: 'Dona Cida',
      type: 'frequentador',
      voice: 'cida',
      note: 'Dona Cida de novo. Voz animada.',
      noteFixed: true,
      addr: ADDR.cida,
      amb: ['tv', 'passaros'],
      open: (c) => [
        `${saud(c)}, {meu} {filho}! É a Cida! É você, {o} {dr} de ontem? Reconheci pela voz!`,
        'Ó, eu liguei pra dar notícia boa, pra variar: medi a pressão na farmácia do Seu Toninho e deu {{treze por oito|pressao_boa}}! Treze por oito! Nem acreditei.',
      ],
      q: {
        oque: 'Nada, {meu} {filho}! É notícia boa. A gente só liga pra notícia ruim, né? Hoje não.',
        idade: 'Setenta e nove. Oitenta em agosto, se Deus quiser.',
        consciencia: 'Acordadíssima. Já varri a casa, já dei comida pro gato.',
        respira: 'Respirando, graças a Deus. Até subi a escadinha da igreja ontem sem parar.',
        inicio: 'Medi agorinha, na volta da padaria.',
        historico: 'Pressão. Tomo o comprimido todo dia de manhã, {{hoje já tomei|tomou}}. A moça da farmácia falou: "tá vendo, Dona Cida? Remédio certinho dá nisso".',
        paciente: 'Sou eu mesma, {meu} {filho}!',
        sangramento: 'Credo, não.',
        seguranca: 'Seguro. Eu e o Bolinha. O gato.',
      },
      extra: [
        {
          id: 'sintomas',
          label: 'Tontura, dor de cabeça, falta de ar?',
          say: 'A senhora está sentindo alguma coisa? Tontura, dor de cabeça, falta de ar, dor no peito?',
          a: ['Nadinha. Tô ótima.', '{{É que hoje tem o grupo de senhoras da igreja, à tarde.|grupo}} Eu queria ir bonita e de pressão boa, né?'],
        },
        {
          id: 'conversar',
          kind: 'fala',
          label: 'Conversar um pouco com ela',
          say: 'Que bom, Dona Cida. E esse grupo da igreja, como é?',
          cost: 15,
          a: [
            'Ah, {meu} {filho}, é a melhor coisa da semana! A gente faz crochê, reza um terço, fala mal da novela...',
            'Tem uma senhora nova lá, braba que só ela, mas boa. {{Disse que {m:o filho é médico|a filha é médica}.|filho_medico}} Toda orgulhosa, a danada.',
            '[risada]',
            'Bom, deixa eu desligar que você tem gente pra salvar. Obrigada por me ouvir, viu? Em casa só o gato me ouve, e ele não liga pra novela.',
          ],
          onAsk: fx.all(fx.add('humanidade', 1, 'conversou com a Dona Cida'), fx.set('cida_conversou_d2')),
        },
      ],
      links: [
        { a: 'pressao_boa', b: 'manual:azul', insight: 'Pressão 13 por 8, remédio tomado, sem sintomas: não urgente. Ela ligou para dar uma notícia boa (Manual p.1).' },
      ],
      onAnswer: fx.set('cida_ligou_d2'),
      patient: { name: 'Aparecida (Dona Cida)', age: 79, sex: 'F' },
      truth: { dx: 'Pressão controlada e vontade de conversar', sev: 'azul', ok: ['ORI'], ref: ['CASA', 'UBS'] },
      diary: { ori: 'Ligou para contar que a pressão deu 13 por 8. À tarde tinha o grupo de senhoras da igreja.' },
    }),
    // ------------------------------------------------------------------ 4 (trote)
    call({
      id: 'd02_peixe',
      ref: 'D2 #4',
      at: '09:35',
      pool: 'trote',
      num: '(17) 99415-6023',
      caller: 'Rapaz',
      callerName: 'Rapaz',
      type: 'trotista',
      voice: 'jovem_h',
      note: 'Rapaz. Diz que o amigo engoliu um peixe.',
      noteWrong: 'Engasgo! Amigo engoliu alguma coisa e não respira!',
      addr: { rua: 'Av. Beira-Rio', n: 4520, bairro: 'Parque das Exposições', ref: 'No pesqueiro, do lado da ponte.' },
      amb: ['risadas', 'agua', 'musica'],
      open: [
        '{m:Moço|Moça} da ambulância! {{Meu amigo engoliu um peixe vivo!|peixe}} Um lambari inteiro, ele apostou que conseguia e engoliu!',
        '[{{gargalhadas, alguém batendo palma|risadas}}]',
        'Ele tá dizendo que {{o peixe tá nadando dentro da barriga|nadando}}!',
      ],
      q: {
        oque: ['Foi aposta, {m:moço|moça}! Valendo uma cerveja!', '[risadas]'],
        consciencia: '{{Tá acordado, tá rindo|rindo}}... digo, tá passando muito mal! Muito!',
        respira: 'Respira pela... pela guelra! [risadas] Não, sério, respira, respira.',
        idade: 'Vinte e dois. Mas a cabeça é de doze.',
        inicio: 'Agora, faz uns dois minutos.',
        sangramento: 'Não, sangue não. Só escama.',
        historico: 'Doença? Só a burrice, {m:moço|moça}.',
        paciente: ['RAPAZ 2: Tô bem, tô bem... ai, ele tá mexendo! Tá mexendo!', '[gargalhada geral]'],
        referencia: 'No pesqueiro da Beira-Rio, do lado da ponte.',
        seguranca: 'Seguro. Só tem a gente e um isopor de cerveja.',
      },
      extra: [
        { id: 'tosse', label: 'Ele tosse? Fala?', say: 'Ele consegue falar e tossir? Está com a mão no pescoço?', a: 'Falar? Ele não para de falar! [risadas] Tá cantando agora.' },
      ],
      callback: ['[chama... alguém atende rindo e desliga na hora]', '[{{chama de novo: caixa postal|retorno_caixa}}]'],
      links: [
        { a: 'rindo', b: 'nadando', insight: 'O "engasgado" fala, ri e canta. Quem engasga de verdade não consegue falar nem tossir.' },
        { a: 'peixe', b: 'risadas', insight: 'Relato absurdo e gargalhadas em volta: sinais de trote (Manual p.2).' },
        { a: 'risadas', b: 'manual:trote_sinais', insight: 'Risadas ao fundo e história de aposta: trote, ou no máximo bobagem de bar.' },
      ],
      patient: { name: '"Amigo que engoliu um peixe"' },
      truth: { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' },
      radio: { prank: 'Central, {unit} no pesqueiro. Uns cinco marmanjos, um isopor e ninguém engasgado. O tal do peixe "tá ótimo", disseram. Trote. Retornando.' },
      diary: { ori: 'Trote: "amigo engoliu um peixe vivo", num pesqueiro da Beira-Rio.' },
    }),
    // ------------------------------------------------------------------ 5
    // Conferido (RT4 / RC24): "hemorragia maior incontrolável" (volta a jorrar ao soltar, três panos) com palidez,
    // suor frio e tontura → USA. Compressão direta contínua, sem retirar o pano (campo A5: AP19/BP8).
    call({
      id: 'd02_faca',
      ref: 'D2 #5',
      at: '10:25',
      pool: 'grave',
      num: '(17) 99267-1140',
      caller: 'Cláudia (esposa)',
      callerName: 'Cláudia',
      type: 'comum',
      voice: 'mulher',
      note: 'Mulher gritando. Marido cortou o braço com faca.',
      noteWrong: 'Corte no braço. Parece pouca coisa, a mulher que tá nervosa.',
      addr: { rua: 'Rua das Mangueiras', n: 820, bairro: 'Jardim Primavera', ref: 'Casa de muro verde, tem uma mangueira na calçada.' },
      amb: ['cozinha', 'gritos'],
      open: [
        'Socorro! Meu marido cortou o braço com a faca de cozinha, {{o sangue não para|nao_para}}! Ele tá {{branco e tonto|branco}}!',
        'HOMEM: Para, Cláudia... {{não precisa de ambulância, é um cortinho|cortinho}}...',
      ],
      q: {
        oque: 'Ele tava abrindo uma abóbora com a faca grande, a faca escorregou e entrou no braço, aqui por dentro, perto do pulso.',
        consciencia: 'Tá acordado, mas {{sentou no chão e disse que tá tudo rodando|tonto}}. Tá falando devagar.',
        respira: 'Respirando rápido, rápido. Tá suando frio, {dr}, com esse calor.',
        idade: 'Quarenta e seis.',
        inicio: 'Agora, faz uns cinco minutos!',
        sangramento: 'Muito! {{O sangue sai pulando, tipo esguicho|esguicho}}! Já {{encharquei três panos de prato|tres_panos}}!',
        historico: 'Nada, ele é forte que nem um touro. Pressão boa.',
        paciente: ['CLÁUDIA: Fala com {m:o moço|a moça}, Juarez!', 'JUAREZ: Tô... tô bem... só tô vendo tudo meio... escuro...'],
        referencia: 'Casa de muro verde, tem uma mangueira na calçada, cheia de abelha.',
        seguranca: 'Seguro, foi acidente! Só tem eu e ele e o sangue no chão todo!',
      },
      extra: [
        { id: 'apertar', label: 'Está apertando o corte?', say: 'Você está apertando o corte com alguma coisa?', a: 'Tô apertando com o pano, mas {{quando eu solto pra olhar volta a jorrar|volta}}!' },
      ],
      links: [
        { a: 'cortinho', b: 'tres_panos', insight: '"É um cortinho" contra três panos encharcados: quem minimiza é o paciente. O sangue diz outra coisa.' },
        { a: 'esguicho', b: 'branco', insight: 'Sangue em jato e palidez com tontura: hemorragia arterial com sinais de choque. Vermelho → USA + compressão guiada.' },
        { a: 'tonto', b: 'manual:vermelho', insight: 'Tonto, suando frio e vendo "tudo escuro" depois de sangrar muito: risco imediato de morte (Manual p.1).' },
      ],
      guide: { id: 'hemorragia' },
      patient: { name: 'Juarez Almeida', age: 46, sex: 'M' },
      truth: { dx: 'Hemorragia arterial no antebraço com sinais de choque', sev: 'vermelho', ok: ['USA'], risk: { good: 45, bad: 110, guideBonus: 15 } },
      radio: {
        ok: '{central}, {unit} no local. Lesão arterial no antebraço, sangramento contido na compressão, paciente hipotenso mas consciente. Seguimos pro Regional.',
        saved: '{central}, {unit}. Chegamos com a esposa apertando o pano direitinho. Perdeu muito sangue, mas tá falando. Quem orientou a compressão? Bem feito.',
        under: 'Central, {unit}! Sangramento arterial, paciente chocado, pálido, pressão caindo! Precisamos de avançado, urgente!',
        dead: 'Central... {unit}. Perdeu sangue demais antes da gente chegar. Óbito constatado às {hora}.',
      },
      diary: { alive: 'Cortou a artéria do braço abrindo uma abóbora. A esposa segurou a compressão até a equipe chegar.', dead: 'Cortou o braço abrindo uma abóbora. "É um cortinho", ele disse.' },
    }),
    // ------------------------------------------------------------------ 6
    // Conferido (RC19): consciente (não é "inconsciente em via pública", que seria USA/USI), mas "história de trauma
    // craniano" e vômito → USI/USB.
    call({
      id: 'd02_praca',
      ref: 'D2 #6',
      at: '11:20',
      pool: 'moderado,intox',
      num: '(17) 99583-2207',
      caller: 'Seu Dito (pipoqueiro)',
      callerName: 'Seu Dito',
      type: 'testemunha',
      voice: 'idoso',
      note: 'Pipoqueiro da praça. Bêbado caído.',
      noteWrong: 'Bêbado xingando na praça. Coisa da PM, não nossa.',
      addr: { rua: 'Rua XV de Novembro', n: 1250, bairro: 'Centro', ref: 'Na praça da Matriz, do lado do coreto.' },
      amb: ['rua', 'igreja'],
      open: [
        'Bom dia, {m:moço|moça}. Aqui é o Dito, da pipoca da praça da Matriz. Tem um rapaz caído do lado do coreto, {{bêbado de cair|bebado}}. Caiu de cara no chão.',
        '[ao fundo, uma voz enrolada xingando]',
      ],
      q: {
        oque: 'Tá aqui desde cedo bebendo pinga com os outros. Levantou pra ir embora, deu dois passos e caiu de cara no meio-fio. {{Bateu a testa|bateu}}.',
        consciencia: '{{Tá acordado, xinga todo mundo|xinga}}. Sabe o nome, mas não para em pé, cai de novo.',
        respira: 'Respira, respira. Bafo de pinga daqui.',
        idade: 'Uns trinta e poucos. Novo pra estar assim.',
        inicio: 'A queda foi agora, faz uns dez minutos.',
        sangramento: 'Abriu {{um corte na sobrancelha|corte}}, sangrou bastante mas já tá parando. Tem um galo crescendo.',
        historico: 'Diz que não toma remédio nenhum. Bebe todo dia, isso eu sei.',
        paciente: ['RAPAZ: Me larga, sô! Cê não é minha mãe!', '[palavrão abafado]', 'RAPAZ: Deixa que eu levanto sozinho... [barulho de queda] ...ai.'],
        referencia: 'Do lado do coreto, na sombra do ipê. Minha carrocinha de pipoca tá do lado.',
        seguranca: 'Ele é bravo de boca, mas não faz mal a ninguém. Tá desarmado, tá até sem chinelo.',
      },
      extra: [
        { id: 'vomito', label: 'Vomitou? Está no sol?', say: 'Ele vomitou? Está deitado no sol?', a: '{{Vomitou uma vez|vomitou}}, de lado, graças a Deus. Tá no sol quente, {m:moço|moça}, trinta e quatro graus.' },
        { id: 'mexe', label: 'Mexe braços e pernas?', say: 'Ele mexe os braços e as pernas normalmente?', a: 'Mexe tudo. Deu até um tapa no ar quando eu cheguei perto.' },
      ],
      links: [
        { a: 'xinga', b: 'manual:amarelo', insight: 'Acorda e xinga: não é inconsciência. Mas bateu a cabeça, vomitou e não para em pé no sol: precisa ser removido. Amarelo → USB (Manual p.1).' },
        { a: 'bateu', b: 'vomitou', insight: 'Bateu a cabeça e vomitou: no bêbado é difícil separar o que é pinga e o que é pancada. Não dá para deixar na praça.' },
      ],
      patient: { name: 'Cleiton Souza', age: 33, sex: 'M' },
      truth: { dx: 'Intoxicação alcoólica com queda (corte no supercílio)', sev: 'amarelo', ok: ['USB'], risk: { good: 110, bad: 300, needs: 'USB' } },
      radio: {
        ok: 'Central, {unit} na praça da Matriz. Etilizado, Glasgow 14, corte no supercílio. Xingou a equipe toda, mas deixou a gente fazer o curativo. Removendo pra UPA.',
        excess: '{central}, {unit}. Bêbado, acordado e bravo, com um corte na sobrancelha. Isso era básica, {dr}.',
      },
      diary: { alive: 'Bêbado caído na praça da Matriz, corte na sobrancelha. O pipoqueiro ficou de guarda até a equipe chegar.' },
    }),
    // ------------------------------------------------------------------ 7 ★ LINHA MUDA (acidental)
    call({
      id: 'd02_muda',
      ref: 'D2 #7 ★',
      at: '12:15',
      anchor: true,
      num: '(17) 3327-5530',
      caller: 'Linha muda',
      callerName: 'Linha muda',
      type: 'crianca',
      voice: 'crianca',
      note: 'Linha muda. Só um barulhinho. Telefone fixo, endereço do cadastro.',
      noteFixed: true,
      addr: { rua: 'Rua Pitangueira', n: 1880, bairro: 'Jardim Primavera', ref: 'Endereço cadastrado da linha.' },
      amb: ['silencio', 'desenho'],
      open: [
        '[silêncio]',
        '[{{um barulhinho de plástico, bem perto do fone|plastico}}]',
        '[ao longe, a {{musiquinha de um desenho animado|desenho}}]',
      ],
      q: {
        oque: ['[silêncio]', '[{{bip... bip-bip-bip... alguém aperta as teclas do telefone|teclas}}]'],
        consciencia: '[uma {{risadinha de criança, bem pertinho|risadinha}}]',
        respira: '[uma respiração curtinha, tranquila, encostada no fone]',
        idade: '[silêncio]',
        inicio: '[bip]',
        sangramento: '[silêncio. A musiquinha do desenho continua.]',
        historico: '[alguém sopra no fone: fffff. Outra risadinha.]',
        paciente: '[{{voz de criança pequena, toda contente: "Alô! É o pato!"|pato}}]',
        referencia: '[silêncio]',
        seguranca: '[ao fundo, uma voz de mulher, longe: {{"Isabela? Cadê o telefone, menina?"|mae_longe}}]',
        confronto_endereco: '[bip-bip]',
      },
      callback: [
        '[toca três vezes]',
        'MÃE: {{Alô? ...Regulação? Ai, meu Deus do céu. Desculpa, {m:moço|moça}! Foi a minha filha, ela pegou o telefone sem fio e saiu apertando tudo!|retorno_ok}}',
        'MÃE: Isabela, eu já falei que não é brinquedo! ...Tá todo mundo bem aqui, graças a Deus. Que vergonha, nossa senhora.',
      ],
      links: [
        { a: 'teclas', b: 'risadinha', insight: 'Teclas apertadas a esmo e risadinha de criança: provável ligação acidental. Confirme ligando de volta (Manual p.2).' },
        { a: 'mae_longe', b: 'teclas', insight: 'A mãe procura o telefone lá longe: a criança está brincando com ele.' },
        { a: 'retorno_ok', b: 'risadinha', insight: 'A mãe confirmou: a filha de três anos brincou com o telefone. Ligação acidental — encerre como trote, sem anotar o número no quadro.' },
        { a: 'retorno_ok', b: 'manual:ligar_volta', insight: 'Ligar de volta resolveu: atendeu a mãe, todos bem. Era acidente, não trote.' },
      ],
      patient: { name: '"Linha muda"' },
      truth: { dx: 'Ligação acidental (criança brincando com o telefone)', sev: 'trote', ok: ['TROTE'], prankKind: 'acidental' },
      radio: { prank: 'Central, {unit} no endereço. Uma menina de três anos com o telefone na mão e uma mãe morrendo de vergonha. Ninguém doente. Retornando.' },
      diary: { ori: 'Linha muda. Era a Isabela, três anos, brincando com o telefone sem fio. A mãe pediu desculpas umas dez vezes.' },
    }),
    // ------------------------------------------------------------------ 8 ⚖
    // Conferido (RO2): escore de Malinas = 1 (primípara 0; 3 h de trabalho de parto 1; contração de 40 s 0; intervalo
    // de 10 min 0; sem perda de líquido 0) → Malinas < 5 = orientação (preferida). USB fica defensável (⚖): sozinha,
    // primeiro filho, e a p.1 do Manual do jogo põe "trabalho de parto" no amarelo.
    call({
      id: 'd02_gestante',
      ref: 'D2 #8 ⚖',
      at: '13:20',
      pool: 'obstetricia',
      num: '(17) 99146-3318',
      caller: 'Kelly (gestante)',
      callerName: 'Kelly',
      type: 'comum',
      voice: 'jovem_m',
      note: 'Grávida de 39 semanas, com contração. Assustada.',
      noteWrong: 'Grávida em trabalho de parto! Diz que vai nascer!',
      addr: { rua: 'Rua São João', n: 640, bairro: 'Vila Nova', ref: 'Prédio baixo de tijolinho, apartamento 3, em cima da farmácia.' },
      amb: ['ventilador', 'tv'],
      open: [
        'Oi... eu tô grávida de trinta e nove semanas e {{começou a dor|dor}}. {{Tô sentindo que vai nascer agora|vai_nascer}}, {m:moço|moça}, é o meu primeiro, eu tô sozinha!',
        '[respiração funda e lenta, que vai passando]',
      ],
      q: {
        oque: 'Começou umas dez da manhã, uma cólica que vem e vai. Agora ficou mais forte.',
        consciencia: 'Tô acordada, tô aqui, só tô com medo.',
        respira: 'Respirando. Quando vem a dor eu respiro que nem a moça do curso ensinou.',
        idade: 'Vinte e quatro.',
        inicio: 'Desde as dez, mais ou menos. Faz umas três horas.',
        sangramento: '{{Não, sangue não. Saiu um catarrinho rosado de manhã, só.|sem_sangue}}',
        historico: 'Nada. Fiz o pré-natal todo no postinho, tudo normal, pressão boa.',
        paciente: 'Sou eu mesma, {m:moço|moça}. Ai... espera... [respira fundo] ...pronto, passou.',
        referencia: 'Em cima da farmácia, prédio de tijolinho. Apartamento 3.',
        seguranca: 'Tranquilo, só eu e o gato da vizinha que entra aqui.',
      },
      extra: [
        { id: 'contracoes', label: 'De quanto em quanto tempo vem a dor?', say: 'De quanto em quanto tempo vem a contração? Quanto tempo ela dura?', a: 'Eu tô marcando no celular... {{de dez em dez minutos|dez_min}}, mais ou menos. Dura uns quarenta segundos.' },
        { id: 'bolsa', label: 'A bolsa estourou?', say: 'A bolsa estourou? Saiu algum líquido, como água escorrendo?', a: '{{Não, não estourou. Tá tudo seco.|bolsa_integra}}' },
        { id: 'mexe', label: 'O bebê está mexendo?', say: 'O bebê está mexendo normalmente?', a: 'Tá! Mexeu agorinha, chutou minha costela.' },
        { id: 'forca', label: 'Vontade de fazer força?', say: 'Está com vontade de fazer força, como se fosse evacuar?', a: 'Não... é só a cólica forte que vem e vai.' },
        { id: 'transporte', label: 'Tem como ir à maternidade?', say: 'Você tem como ir até a maternidade? Alguém pode te levar?', a: 'Meu marido tá na obra, mas {{ele já tá vindo de moto|marido}}. O cunhado dele empresta o carro. Uns vinte minutos.' },
        { id: 'primeiro', label: 'É o primeiro filho?', say: 'É o seu primeiro filho?', a: 'É o primeiro. E eu tô morrendo de medo de não dar tempo.' },
      ],
      links: [
        { a: 'dez_min', b: 'bolsa_integra', kind: 'confirma', insight: 'Contrações de 10 em 10 minutos, bolsa íntegra, sem sangramento, bebê mexendo: começo de trabalho de parto. Dá para ir à maternidade por meios próprios.' },
        { a: 'vai_nascer', b: 'dez_min', insight: 'Medo de que "vai nascer agora", mas contrações a cada 10 minutos e primeiro filho: o corpo ainda está no começo do trabalho de parto.' },
        { a: 'dez_min', b: 'manual:amarelo', insight: 'O Manual p.1 põe "trabalho de parto" no amarelo (USB). Mas contrações espaçadas e bolsa íntegra permitem orientar: as duas decisões se defendem se as perguntas forem feitas.' },
      ],
      patient: { name: 'Kelly Cristina Rocha', age: 24, sex: 'F' },
      truth: { dx: 'Início de trabalho de parto (39 semanas, bolsa íntegra)', sev: 'verde', ok: ['ORI', 'USB'], best: 'ORI', ref: ['MAT'], must: ['contracoes', 'bolsa', 'sangramento', 'mexe'] },
      radio: {
        ok: 'Central, {unit}. Gestante de 39 semanas, contrações espaçadas, bolsa íntegra. Tranquila agora. Levamos pra Maternidade.',
        excess: 'Central, {unit}. Começo de trabalho de parto, bolsa íntegra. O marido chegou de moto junto com a gente. Dava pra ir de carro, {dr}.',
      },
      diary: { ori: 'Primeiro filho, 39 semanas, contrações de 10 em 10 minutos. Foi para a Maternidade com o marido.', alive: 'Primeiro filho, 39 semanas. Levada à Maternidade em início de trabalho de parto.' },
    }),
    // ------------------------------------------------------------------ 9
    // Conferido (RC18): "palidez e sudorese intensa" e "alteração súbita da consciência" (mole, desmaio) → USA.
    call({
      id: 'd02_hda',
      ref: 'D2 #9',
      at: '14:35',
      pool: 'grave',
      num: '(17) 3324-6619',
      caller: 'Rosilene (filha)',
      callerName: 'Rosilene',
      type: 'comum',
      voice: 'mulher',
      note: 'Filha. Pai de 70 anos com dor de barriga e vômito com sangue.',
      noteWrong: 'Senhor com dor de barriga. Acho que comeu coisa estragada.',
      addr: { rua: 'Rua Goiás', n: 2850, bairro: 'Vila Esperança', ref: 'Casa com portão de ferro azul, do lado do bar do Tonico.' },
      amb: ['radio_am', 'gemidos'],
      open: [
        '{m:Moço|Moça}, meu pai tá com uma dor forte na barriga e {{vomitou sangue|vomitou_sangue}}! Primeiro era escuro, agora {{veio vermelho vivo|vermelho_vivo}}!',
        'PAI: Para com isso, Rosilene... {{é a úlcera, já tive, passa|ulcera}}...',
      ],
      q: {
        oque: 'Ele tava reclamando da barriga desde ontem. Hoje vomitou uma coisa escura, {{tipo borra de café|borra}}. Agora foi sangue mesmo, uma bacia.',
        consciencia: 'Tá acordado, mas {{tá estranho, mole, meio sonolento|mole}}.',
        respira: 'Respira rápido. Tá todo suado e frio.',
        idade: 'Setenta.',
        inicio: 'O vômito de sangue foi agora, faz uns quinze minutos. A dor é desde ontem.',
        sangramento: ['Vomitou sangue duas vezes.', 'E o cocô tá {{preto feito piche desde ontem|fezes_pretas}}, ele me contou agora, envergonhado.'],
        historico: 'Pressão. E {{toma remédio pra dor nas costas todo dia, um anti-inflamatório, há meses|antiinflamatorio}}, sem receita. A dor nas costas não passa.',
        paciente: ['PAI: Não precisa de ambulância, menina... é só ficar quietinho...', '[um barulho de ânsia]', 'ROSILENE: Pai! Pai!'],
        referencia: 'Portão de ferro azul, do lado do bar do Tonico. Todo mundo conhece.',
        seguranca: 'Seguro. Só eu, ele e minha mãe.',
      },
      extra: [
        { id: 'levantar', label: 'Ficou tonto ao levantar?', say: 'Quando ele tenta levantar, fica tonto? Desmaiou?', a: '{{Desmaiou no banheiro agora há pouco|desmaio}}! Eu achei ele sentado no chão, branco que nem papel.' },
      ],
      links: [
        { a: 'ulcera', b: 'vermelho_vivo', insight: '"É a úlcera, passa" — mas o vômito agora é de sangue vivo: hemorragia digestiva ativa. Quem minimiza é o paciente.' },
        { a: 'desmaio', b: 'vomitou_sangue', insight: 'Vômito com sangue e desmaio ao levantar: perdeu muito sangue, sinal de choque. Vermelho → USA.' },
        { a: 'antiinflamatorio', b: 'borra', insight: 'Anti-inflamatório todo dia, sem receita, e vômito em borra de café: sangramento do estômago.' },
        { a: 'mole', b: 'manual:vermelho', insight: 'Idoso sonolento, suado e frio depois de sangrar: risco imediato de morte (Manual p.1).' },
      ],
      worsen: [{ after: 100, lines: ['ROSILENE: {m:Moço|Moça}! {{Ele apagou de novo, tá gelado!|apagou}} Vomitou mais sangue!', '[um baque, alguém chorando]'] }],
      patient: { name: 'Sebastião Moreira', age: 70, sex: 'M' },
      truth: { dx: 'Hemorragia digestiva alta com sinais de choque', sev: 'vermelho', ok: ['USA'], risk: { good: 45, bad: 110 } },
      radio: {
        ok: '{central}, {unit} no local. Hemorragia digestiva alta, hipotenso, puncionamos dois acessos. Seguimos pro Regional, endoscopia avisada.',
        under: 'Central, {unit}! Hemorragia digestiva, paciente chocado, pressão oito por cinco! Precisamos de avançado!',
        dead: 'Central... {unit}. Sangrou demais. Óbito constatado às {hora}. A filha tá aqui, segurando a bacia.',
      },
      diary: { alive: 'Vômito com sangue. Anti-inflamatório "pra coluna", todo dia, sem receita. Chegou chocado, mas chegou.', dead: 'Vômito com sangue. Dizia que era "só a úlcera".' },
    }),
    // ------------------------------------------------------------------ 10 (risadas, mas real)
    // Conferido (RC24): edema, deformidade não grosseira e dor moderada (apoia e anda com ajuda) → orientação;
    // raio-X na UPA por meios próprios.
    call({
      id: 'd02_tornozelo',
      ref: 'D2 #10',
      at: '16:10',
      pool: 'leve',
      num: '(17) 99820-1240',
      caller: 'Maicon',
      callerName: 'Maicon',
      type: 'exagerador',
      voice: 'jovem_h',
      note: 'Rapaz do futebol. Tem gente rindo atrás.',
      noteWrong: 'Risada no fundo. Acho que é trote.',
      addr: { rua: 'Rua São João', n: 1260, bairro: 'Vila Nova', ref: 'No campinho de várzea.' },
      amb: ['risadas', 'rua'],
      open: [
        'Alô, emergência? Ai, ai, ai... {{quebrei o pé|quebrei}}, {m:moço|moça}! Tá torto! Pisei na bola e virou tudo!',
        '[{{risadas e assobios: "foi frango, Maicon!"|risadas}}]',
        'Para de rir, desgraça! {{Tá doendo de verdade!|doendo}}',
      ],
      q: {
        oque: 'Fui dar um drible, pisei em cima da bola e o pé virou pra dentro. Caí sentado na frente de todo mundo.',
        consciencia: 'Acordado, humilhado, mas acordado.',
        respira: 'Respiro, {m:moço|moça}. O problema é o pé.',
        idade: 'Dezenove.',
        inicio: 'Agora, faz uns dez minutos.',
        sangramento: 'Não, só ralou o joelho.',
        historico: 'Nada. Atleta. Quer dizer, mais ou menos.',
        paciente: 'Sou eu mesmo, o acidentado!',
        referencia: 'No campinho de várzea da São João, do lado da casa do Seu Antônio pedreiro.',
        seguranca: 'Seguro. Só os palhaços dos meus amigos.',
      },
      extra: [
        { id: 'torto', label: 'O pé está torto ou inchado?', say: 'O pé está torto, virado para um lado esquisito? Ou só inchado?', a: '{{Torto não... tá inchado igual um pão|inchado}}, do lado de fora do tornozelo. Roxinho.' },
        { id: 'pisar', label: 'Consegue apoiar o pé?', say: 'Consegue apoiar o pé no chão, nem que seja um pouco?', a: '{{Apoio, mas dói pra caramba|apoia}}. Vim mancando até o banco com o ombro do Jefinho.' },
        { id: 'carro', label: 'Alguém pode levar você?', say: 'Alguém pode te levar até a UPA?', a: 'O Jefinho tem moto. Mas ambulância é mais estiloso, né, {m:moço|moça}?' },
      ],
      links: [
        { a: 'risadas', b: 'doendo', insight: 'As risadas são dos amigos rindo DELE, não de você. A dor é real. Risada no fundo não prova trote (Manual p.2).' },
        { a: 'risadas', b: 'manual:trote_sinais', insight: 'Risada ao fundo é sinal, não prova. Aqui os amigos riem do tombo; o tornozelo torcido é de verdade.' },
        { a: 'quebrei', b: 'inchado', insight: '"Quebrei, tá torto" — mas não está torto, está inchado, e ele apoia o pé. Entorse: caso verde, UPA por meios próprios.' },
        { a: 'apoia', b: 'manual:verde', insight: 'Apoia o pé, sem deformidade, consciente: verde. Gelo, perna para cima e UPA para o raio-X (Manual p.1).' },
      ],
      patient: { name: 'Maicon Rodrigues', age: 19, sex: 'M' },
      truth: { dx: 'Entorse de tornozelo', sev: 'verde', ok: ['ORI'], ref: ['UPA', 'UBS'] },
      radio: { excess: 'Central, {unit} no campinho. Entorse de tornozelo, deambulando com ajuda. A torcida aplaudiu a ambulância. Liberamos no local, {dr}.' },
      diary: { ori: 'Entorse no futebol de várzea. Os amigos riram; o tornozelo não.' },
    }),
  ],
  interlude: {
    teaser: 'Tem um envelope do DAE enfiado na porta. Não está no seu nome.',
    familyLacos: 1,
    bills: [
      {
        id: 'agua_inquilino',
        label: 'Conta de água do antigo inquilino',
        amount: 70,
        when: (c) => !c.flag('pagou_agua') && !c.flag('brigou_nogueira'),
        desc: 'Dezembro e janeiro, no nome de Valdemar Pires. "O débito é do imóvel." Sem pagar, o DAE corta a água amanhã.',
        onPay: fx.set('pagou_agua'),
        onSkip: fx.all(fx.set('agua_cortada'), fx.add('lacos', -1, 'cortaram a água de casa')),
      },
    ],
    scene: {
      id: 'd02_agua',
      bg: 'cozinha',
      cast: ['LUCIA', 'ZELIA', 'DAVI', 'NOGUEIRA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'Na mesa da cozinha, embaixo do açucareiro, um envelope do DAE. Carimbo vermelho: AVISO DE CORTE.' },
            { who: 'LUCIA', t: 'Setenta reais, {nome}. Dezembro e janeiro. No nome de um tal de Valdemar Pires.' },
            { who: 'ZELIA', t: 'O inquilino de antes. O que foi embora de madrugada, a vizinha contou. Levou até as lâmpadas.' },
            { who: 'LUCIA', t: 'Liguei no DAE. A moça disse que a dívida é "do imóvel". Se não pagar, amanhã cortam a água. A nossa.' },
            { who: 'DAVI', t: '{Pai}, se cortar a água eu não preciso tomar banho?' },
          ],
          choices: [
            { label: 'Ligar para o Seu Nogueira: "a dívida não é nossa".', next: 'nogueira' },
            { label: '"A gente paga. Não vale a briga."', next: 'pagar' },
          ],
        },
        nogueira: {
          lines: [
            { who: 'NARRADOR', t: 'O Seu Nogueira atende no quarto toque. Tem um jogo de futebol alto na televisão dele.' },
            { who: 'NOGUEIRA', t: '{Dr}! Tudo em ordem? O aluguel tá em dia, hein, não tô cobrando nada não.' },
            { who: 'EU', t: 'Seu Nogueira, chegou uma conta de água do inquilino antigo. Setenta reais, com aviso de corte. Isso é com o senhor.' },
            { who: 'NOGUEIRA', t: 'Ah, o Valdemar... {Dr}, isso aí é entre o DAE e ele. Eu não tenho nada com isso. Quem mora aí agora é {m:o senhor|a senhora}.' },
            { who: 'LUCIA', t: '(baixinho, do seu lado) Ele sabia. Ele sabia quando alugou pra gente.' },
          ],
          choices: [
            { label: '"O senhor alugou a casa com dívida e não avisou. Ou resolve, ou eu vou no Procon."', next: 'briga', effect: fx.all(fx.set('brigou_nogueira'), fx.add('desgaste', 3, 'briga com o proprietário')) },
            { label: '"Tá bom, Seu Nogueira. Deixa que eu vejo."', next: 'recua' },
          ],
        },
        briga: {
          lines: [
            { who: 'NOGUEIRA', t: '(o jogo continua alto do lado dele; ele demora pra responder) ...Procon. Tá bom, {dr}. Eu ligo no DAE e resolvo.' },
            { who: 'NOGUEIRA', t: 'Mas {m:o senhor|a senhora} lembra que eu resolvi, viu? Tudo nessa vida tem volta. Tudo.' },
            { who: 'NARRADOR', t: 'Ele desliga sem tchau.' },
            { who: 'ZELIA', t: 'Bem feito. Homem que aluga casa com dívida dentro.' },
            { who: 'LUCIA', t: 'Ganhamos setenta reais e um inimigo, {nome}. Não sei se foi bom negócio.' },
          ],
          next: 'fim',
        },
        recua: {
          lines: [
            { who: 'NOGUEIRA', t: 'Isso, isso. Gente boa é outra coisa. Um abraço pra família!' },
            { who: 'LUCIA', t: '({c:ela|ele} olha pro telefone desligado) "Gente boa". Então a gente paga até amanhã cedo.' },
          ],
          next: 'fim',
        },
        pagar: {
          lines: [
            { who: 'LUCIA', t: 'Eu também acho. Aquele homem é capaz de inventar um aumento no aluguel só de birra.' },
            { who: 'ZELIA', t: 'Setenta reais pra pagar o banho de um caloteiro que levou as lâmpadas...' },
            { who: 'LUCIA', t: 'Pelo menos o nosso banho continua.' },
          ],
          next: 'fim',
        },
        fim: {
          lines: [
            { who: 'NARRADOR', t: 'Por via das dúvidas, o Liam enche três garrafas pet de água "de reserva" e enfileira na pia, por ordem de tamanho.' },
            { who: 'DAVI', t: 'Se cortar, essa grande é do banho da vó. A pequena é minha.' },
            { who: 'ZELIA', t: 'Hoje no grupo da igreja tinha uma senhora que liga pra vocês todo dia. Falou que {o} {medico} nov{m:o|a} "tem voz de gente boa".' },
            { who: 'ZELIA', t: 'Eu não falei nada. Fiquei só olhando.' },
          ],
        },
      },
    },
    bico: (c) => ({
      id: 'd02_bico',
      bg: 'cozinha',
      cast: ['LUCIA', 'ZELIA'],
      nodes: {
        start: {
          lines: [
            { who: 'NARRADOR', t: 'A noite na USA 01 acaba à uma da manhã. A sirene ainda zune no seu ouvido quando a porta de casa range.' },
            { who: 'NARRADOR', t: 'Quando chega, de madrugada, tem um bilhete na geladeira, preso com o ímã de pizzaria por cima do desenho da ambulância.' },
            { who: 'LUCIA', t: '(bilhete) "Chegou conta de água do inquilino antigo, aviso de corte. Paguei. Usei o dinheiro do pote. Depois a gente vê. Bj."', when: (cc) => cc.flag('lucia_pagou_agua') },
            { who: 'NARRADOR', t: 'O pote de margarina em cima da geladeira está vazio. {c:Ela|Ele} vinha juntando ali desde que a confecção fechou.', when: (cc) => cc.flag('lucia_pagou_agua') },
            { who: 'NARRADOR', t: 'A Dona Zélia ainda está acordada, de camisola, sentada no escuro.', when: (cc) => cc.flag('brigou_nogueira') },
            { who: 'ZELIA', t: 'O Nogueira veio aqui cobrar uma conta de água que nem é nossa. {Oconj} botou ele pra correr. Na frente da rua inteira.', when: (cc) => cc.flag('brigou_nogueira') },
            { who: 'ZELIA', t: 'Ele saiu dizendo que "tudo tem volta". {Oconj} chorou depois, no banheiro, com o chuveiro ligado pra eu não ouvir.', when: (cc) => cc.flag('brigou_nogueira') },
          ],
        },
      },
    }),
    // a Lúcia decide sozinha (antes da cena do bico): com Laços ≥ 5 paga com as economias
    // do pote da máquina de costura; abaixo disso, briga com o proprietário na porta.
    onBico: (e) => {
      if (e.flag('pagou_agua') || e.flag('brigou_nogueira')) return;
      if (e.v('lacos') >= 5) {
        e.set('pagou_agua');
        e.set('lucia_pagou_agua');
      } else {
        e.set('brigou_nogueira');
      }
    },
  },
});
