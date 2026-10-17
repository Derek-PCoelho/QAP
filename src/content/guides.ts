// Roteiros de orientação ativa por telefone (minijogos).
// [validar] Todas as instruções clínicas abaixo são simplificações de jogo e devem ser revisadas pela equipe médica.
// Revisão de conteúdo (docs/fontes/REVISAO_MEDICA_banco-guias.md): RCP 100–120/min, 5–6 cm, retorno completo, troca a cada 2 min (BC5/AC5);
// desengasgo: manobra abdominal em adulto/criança, golpes nas costas só em bebê, sem varredura digital às cegas (BC3/BPed3/BPed4);
// parto: não tracionar, secar e cobrir inclusive a cabeça, pele a pele, não cortar o cordão (BGO4/BGO5/BPed9);
// hemorragia: compressão direta, nunca retirar o pano encharcado, torniquete só em membro e com faixa larga (BP8/BP9);
// anafilaxia: afastar a causa, deitar com as pernas elevadas, sem levantar de repente (BC23/AC33/BPed18).
import type { GuideScript } from '../engine/content-api';

export const GUIDES: Record<string, GuideScript> = {
  rcp: {
    id: 'rcp',
    title: 'RCP guiada por telefone',
    kind: 'rcp',
    // [validar] Roteiro leigo "só compressões" é prática padrão (AHA) para orientação por telefone; os protocolos de campo (BC5) descrevem a RCP da equipe (30:2).
    // Criança e bebê (BPed6/APed6): também começa pelas compressões, 100–120/min, pausas <10 s; criança ~5 cm com 1 ou 2 mãos, bebê (<1 ano) 2 dedos ~4 cm.
    // No afogamento de criança o campo (A9) manda priorizar via aérea e ventilação, que é da equipe: as páginas não trazem "boca a boca" para leigo.
    intro: 'Mãos entrelaçadas no centro do peito, braços esticados. Afunde 5 a 6 cm (criança: cerca de 5 cm, com uma ou duas mãos; bebê com menos de 1 ano: dois dedos, cerca de 4 cm) e deixe o peito voltar todo. Aperte ESPAÇO (ou clique) a cada batida: 100 a 120 por minuto, sem pausas longas (menos de 10 segundos). Quando quem liga cansar (a cada 2 minutos, mais ou menos), mande trocar. Não pare até a equipe assumir.',
    bpm: [100, 120],
    tiredEvery: 12,
    success: 'Você manteve o ritmo até a equipe assumir.',
    fail: 'O ritmo se perdeu. A massagem foi fraca.',
  },
  respiracao: {
    id: 'respiracao',
    title: 'Respiração guiada',
    kind: 'respiracao',
    intro: 'Segure ESPAÇO (ou o botão) enquanto ela puxa o ar em 4 tempos; solte para soltar o ar em 4 tempos. Acompanhe o círculo.',
    success: 'A respiração dela desacelerou. O formigamento passou.',
    fail: 'Ela continua ofegante, mas está um pouco melhor.',
  },
  multiplas: {
    id: 'multiplas',
    title: 'Múltiplas vítimas',
    kind: 'multiplas',
    intro: 'Arraste cada vítima para a cor certa (START) e aloque as viaturas.',
    success: 'Triagem concluída.',
    fail: 'A triagem falhou.',
  },
  desengasgo: {
    id: 'desengasgo',
    title: 'Desengasgo guiado',
    kind: 'dialogo',
    // [validar] Adulto consciente: manobra abdominal (BC3). O protocolo do serviço não cita golpes nas costas em adulto/criança (só em bebê, BPed4); outras diretrizes (ex.: europeias) incluem 5 golpes nas costas antes das compressões abdominais — decisão: seguir o protocolo do serviço (confirmar com a equipe).
    intro: 'Guie a manobra passo a passo. Instruções erradas aumentam o pânico de quem liga.',
    panic: 55,
    steps: [
      {
        say: 'Ele tá com a mão no pescoço, não sai som nenhum, tá vermelho!',
        options: [
          { label: 'Pergunte: "você está engasgado?". Se não consegue tossir nem falar, vamos agir.', kind: 'certo' },
          { label: 'Dá um copo d’água pra ele.', kind: 'errado', reply: 'Ele não consegue engolir nada!' },
          { label: 'Calma. Faz exatamente o que eu disser.', kind: 'calma' },
        ],
      },
      {
        say: 'Ele balança a cabeça, não tosse!',
        options: [
          { label: 'Fique atrás dele e abrace pela cintura.', kind: 'certo' },
          { label: 'Enfia o dedo na garganta pra puxar.', kind: 'errado', reply: 'Empurrou mais pra dentro, {dr}!' },
          { label: 'Deita ele no chão e espera a ambulância.', kind: 'errado' },
        ],
      },
      {
        say: 'Tô atrás dele, abraçado!',
        options: [
          { label: 'Mão fechada acima do umbigo, a outra por cima. Puxe para dentro e para cima, com força.', kind: 'certo' },
          { label: 'Aperte o peito dele com as duas mãos.', kind: 'errado' },
          // não tosse nem fala = obstrução total: esperar não é neutro (BC3). Compressão no peito é só para gestante/obeso (fora deste roteiro).
          { label: 'Espera um pouco pra ver se passa sozinho.', kind: 'errado', reply: 'Ele tá ficando roxo, {dr}! Não dá pra esperar!' },
        ],
      },
      {
        say: 'Fiz! Fiz de novo! ...SAIU! Saiu um pedaço de carne! Ele tá tossindo!',
        options: [
          { label: 'Ótimo. Deixe ele sentado, respirando. A equipe vai examinar.', kind: 'certo' },
          { label: 'Dá água agora pra descer o resto.', kind: 'errado' },
        ],
      },
    ],
    success: 'A via aérea foi desobstruída por telefone.',
    fail: 'A manobra não saiu como devia.',
  },
  desengasgo_rcp: {
    id: 'desengasgo_rcp',
    title: 'Desengasgo guiado',
    kind: 'dialogo',
    intro: 'Guie a manobra. Fique atento: se a vítima perder a consciência, a conduta muda na hora.',
    panic: 60,
    steps: [
      {
        say: 'Meu pai tá engasgado com carne! Ele não fala, tá roxo!',
        options: [
          { label: 'Se ele não consegue tossir nem falar: fique atrás dele e abrace pela cintura.', kind: 'certo' },
          { label: 'Bate nas costas dele com ele deitado.', kind: 'errado' },
          { label: 'Calma. Eu vou te guiar.', kind: 'calma' },
        ],
      },
      {
        say: 'Tô atrás dele!',
        options: [
          { label: 'Mão fechada acima do umbigo, a outra por cima. Para dentro e para cima, com força.', kind: 'certo' },
          { label: 'Tenta puxar com o dedo.', kind: 'errado', reply: 'Não alcança, e parece que empurrei mais pra dentro!' },
          { label: 'Aperta o peito.', kind: 'errado' },
        ],
      },
      {
        say: 'Não sai! Já fiz três vezes!',
        options: [
          { label: 'Continue, com força, até sair ou até ele desmaiar.', kind: 'certo' },
          { label: 'Para, você vai machucar ele.', kind: 'errado' },
          { label: 'Respira. Você está fazendo certo.', kind: 'calma' },
        ],
      },
      {
        say: '{DR}! ELE AMOLECEU! CAIU! NÃO TÁ RESPIRANDO!',
        time: 11,
        options: [
          // [validar] Inconsciente: compressões já (BC3/BC5); olhar a boca e tirar só o que estiver visível, nunca varredura às cegas (BPed3).
          { label: 'Deite ele no chão de barriga pra cima. Massagem no peito AGORA. A cada rodada, olhe a boca: tire só o que estiver à vista, nunca às cegas.', kind: 'certo', switchTo: 'rcp' },
          { label: 'Levanta ele e continua apertando a barriga!', kind: 'errado', reply: 'Ele não fica em pé!' },
          { label: 'Joga água no rosto dele.', kind: 'errado' },
        ],
      },
    ],
    success: 'Você trocou a conduta a tempo.',
    fail: 'Insistir na manobra com a vítima desacordada custou minutos preciosos.',
  },
  parto: {
    id: 'parto',
    title: 'Parto guiado por telefone',
    kind: 'dialogo',
    intro: 'Alterne instruções técnicas e falas de calma. Se o pânico estourar, ele larga o telefone.',
    panic: 70,
    steps: [
      {
        say: 'Ela tá gritando que vai nascer! O que eu faço?!',
        options: [
          { label: 'Deite ela de costas, joelhos dobrados e afastados, num lugar limpo. Separe toalhas e um cobertor limpos para o bebê.', kind: 'certo' },
          { label: 'Põe ela no carro e corre pra maternidade!', kind: 'errado', reply: 'Ela não consegue nem levantar!' },
          { label: 'Respira comigo. Você vai conseguir, eu fico na linha até a equipe chegar.', kind: 'calma' },
        ],
      },
      {
        say: 'Tô vendo a cabeça! Tá saindo!',
        options: [
          { label: 'Não puxe. Deixe nascer devagar e só apoie a cabecinha com a mão, sem forçar.', kind: 'certo' },
          { label: 'Puxa a cabeça pra ajudar.', kind: 'errado' },
          { label: 'Você está indo muito bem. Mãos lavadas, calma.', kind: 'calma' },
        ],
      },
      {
        say: 'Saiu! Saiu inteiro! Tá molhadinho, meio roxinho!',
        options: [
          { label: 'Seque o corpo e a cabecinha com uma toalha limpa e tire a toalha molhada de perto dele.', kind: 'certo' },
          { label: 'Vira ele de cabeça pra baixo e bate no bumbum.', kind: 'errado' },
          { label: 'Corta o cordão agora com a tesoura.', kind: 'errado' },
        ],
      },
      {
        say: '...CHOROU! Ele chorou forte!',
        options: [
          { label: 'Coloque o bebê de lado na barriga da mãe, pele com pele, e cubra os dois com um pano seco, inclusive a cabecinha (menos o rosto). Janelas fechadas, sem ventilador.', kind: 'certo' },
          { label: 'Dá um banho nele agora.', kind: 'errado' },
          { label: 'Parabéns. Respira. Ainda falta pouco.', kind: 'calma' },
        ],
      },
      {
        say: 'E esse cordão, {dr}? Puxo?',
        options: [
          { label: 'Não puxe o cordão e não corte: a equipe cuida disso. Se a placenta sair, guarde num saco plástico para levar.', kind: 'certo' },
          { label: 'Puxa devagar pra placenta sair.', kind: 'errado' },
          { label: 'Amarra com linha e corta.', kind: 'errado' },
        ],
      },
    ],
    success: 'Mãe e bebê bem até a chegada da equipe.',
    fail: 'O pânico tomou conta, mas o bebê nasceu.',
  },
  hemorragia: {
    id: 'hemorragia',
    title: 'Compressão guiada',
    kind: 'dialogo',
    // Roteiro compartilhado: serve também para sangramento fora de membro (tronco, abdome, pelve). Por isso não há passo "certo" de torniquete.
    // Torniquete (BP9): só em braço ou perna, depois que a compressão falha, faixa larga (≥10 cm), acima da ferida, anotando a hora; cinto fino ou fio folga e piora o sangramento.
    intro: 'Oriente compressão direta. Nunca mande retirar o pano encharcado. Torniquete só em braço ou perna, quando a compressão não segurar, e nunca com cinto fino ou fio.',
    panic: 60,
    steps: [
      {
        say: 'É sangue pra todo lado!',
        options: [
          { label: 'Pegue um pano limpo e aperte forte em cima do corte.', kind: 'certo' },
          { label: 'Lava com água corrente pra ver o tamanho.', kind: 'errado' },
          { label: 'Calma. Eu vou te dizer exatamente o que fazer.', kind: 'calma' },
        ],
      },
      {
        say: 'O pano encharcou!',
        options: [
          { label: 'Não tire o pano. Coloque outro por cima e continue apertando.', kind: 'certo' },
          { label: 'Tira esse e põe um seco.', kind: 'errado', reply: 'Voltou a jorrar!' },
          { label: 'Passa pó de café pra estancar.', kind: 'errado' },
        ],
      },
      {
        say: 'Diminuiu... ele tá branco, tonto.',
        options: [
          // [validar] Elevar as pernas em hemorragia: prática de primeiros socorros, sem texto no protocolo de campo (BC11/BT4 só falam em controlar o sangramento e aquecer).
          { label: 'Deite ele e mantenha a pressão. Cubra com um cobertor. Se não houver fratura, levante as pernas.', kind: 'certo' },
          { label: 'Dá um copo de água com açúcar.', kind: 'errado' },
          { label: 'Faz um torniquete bem apertado com o cinto.', kind: 'errado', reply: 'Apertei o cinto, mas ficou frouxo e voltou a sangrar mais, {dr}!' },
        ],
      },
      {
        say: 'Ele tá falando comigo ainda.',
        options: [
          { label: 'Ótimo. Continue apertando e conversando com ele até a equipe chegar.', kind: 'certo' },
          { label: 'Deixa ele dormir um pouco.', kind: 'errado' },
          { label: 'Você está salvando ele.', kind: 'calma' },
        ],
      },
    ],
    success: 'O sangramento ficou controlado.',
    fail: 'A compressão foi interrompida. Perdeu-se sangue.',
  },
  acolhimento: {
    id: 'acolhimento',
    title: 'Acolhimento',
    kind: 'dialogo',
    intro: 'Escute. Não apresse, não julgue, não minimize. O relógio anda mais devagar e esta ligação não vai cair.',
    panic: 80,
    slow: 0.12,
    noTimeout: true,
    card: 'CVV — Centro de Valorização da Vida · ligue 188 (24h, gratuito) · cvv.org.br. Em emergência médica, ligue para o serviço de emergência da sua cidade.',
    steps: [
      {
        say: 'Eu nem sei por que eu liguei. Eu não aguento mais.',
        options: [
          { label: 'Que bom que você ligou. Eu estou aqui e vou ficar na linha com você.', kind: 'certo' },
          { label: 'Tenho outras ligações. Pode ser rápido?', kind: 'errado', reply: '...Desculpa. Desculpa incomodar.' },
          { label: 'Não fala assim, você é jovem, tem a vida inteira.', kind: 'errado', reply: 'Todo mundo fala isso.' },
        ],
      },
      {
        say: 'Ninguém ia nem perceber se eu sumisse.',
        options: [
          { label: 'Eu estou percebendo. Me conta o que está acontecendo.', kind: 'certo' },
          { label: 'Para de drama, vai.', kind: 'errado', reply: '[silêncio longo]' },
          { label: 'Pensa na sua família.', kind: 'errado', reply: 'Eles nem sabem.' },
        ],
      },
      {
        say: 'Tá tudo pesado demais. Faz dias que eu não durmo.',
        options: [
          // perguntar direto sobre suicídio não induz o ato (BC30/AC40); nunca deixar a pessoa sozinha; arma: pedir que largue no chão e se afaste, nunca desarmar.
          { label: 'Parece que você está carregando muita coisa sem apoio. Faz sentido estar no limite. Posso perguntar: você tem pensado em se machucar ou em se matar?', kind: 'certo' },
          { label: 'Toma um chá e tenta dormir, que passa.', kind: 'errado' },
          { label: 'Respira comigo um pouco. Sem pressa.', kind: 'calma' },
        ],
      },
      {
        say: 'Eu tô sem ninguém aqui em casa.',
        options: [
          { label: 'Tem alguém de confiança que pode vir ficar com você? Uma equipe também está indo até aí.', kind: 'certo' },
          { label: 'Então eu desligo e a ambulância resolve.', kind: 'errado', reply: 'Não desliga... por favor.' },
          { label: 'Eu continuo aqui. Não vou a lugar nenhum.', kind: 'calma' },
        ],
      },
      {
        say: '...Minha irmã. Ela mora aqui perto.',
        options: [
          { label: 'Vamos chamar ela juntos? E eu fico com você até a equipe chegar.', kind: 'certo' },
          { label: 'Por que não ligou pra ela em vez da emergência?', kind: 'errado' },
          { label: 'Tá bom.', kind: 'neutro' },
        ],
      },
      {
        say: 'Tá. Eu fico na linha.',
        options: [
          { label: '{m:Obrigado|Obrigada} por confiar em mim. Você não precisa passar por isso sem ninguém.', kind: 'certo' },
          { label: 'Ok. Aguarde.', kind: 'neutro' },
        ],
      },
    ],
    success: 'A equipe chegou e a irmã também. Você ficou na linha o tempo todo.',
    fail: 'A equipe chegou. A ligação foi dura, mas não caiu.',
  },
  intoxicacao: {
    id: 'intoxicacao',
    title: 'Orientação: intoxicação',
    kind: 'dialogo',
    intro: 'Orientação imediata enquanto a viatura se desloca.',
    panic: 75,
    steps: [
      {
        say: 'Ele engoliu! Tá chorando, babando muito!',
        options: [
          { label: 'Não provoque vômito. Não dê nada para ele beber agora.', kind: 'certo' },
          { label: 'Enfia o dedo na garganta pra ele vomitar!', kind: 'errado', reply: 'Ele vomitou e gritou de dor!' },
          { label: 'Calma. Eu vou te ajudar até a ambulância chegar.', kind: 'calma' },
        ],
      },
      {
        say: 'A boquinha tá vermelha, ele não para de babar.',
        options: [
          { label: 'Mantenha ele sentado. Se vomitar sozinho, vire de lado.', kind: 'certo' },
          { label: 'Lava a boca e faz ele engolir bastante água.', kind: 'errado' },
          // babando e podendo vomitar: deitado de barriga pra cima aumenta o risco de aspirar (BTox1)
          { label: 'Deita ele de barriga pra cima.', kind: 'errado', reply: 'Ele engasgou com a baba, {dr}!' },
        ],
      },
      {
        say: 'Tô com a embalagem aqui na mão.',
        options: [
          { label: 'Guarde e entregue para a equipe. Me diga se a respiração mudar.', kind: 'certo' },
          { label: 'Joga fora, não precisa.', kind: 'errado' },
          { label: 'Você está indo bem.', kind: 'calma' },
        ],
      },
      {
        say: 'Ele tá respirando, tá chorando.',
        options: [
          { label: 'Chorar é bom sinal: está respirando. A equipe está chegando.', kind: 'certo' },
          { label: 'Dá um calmante pra ele dormir.', kind: 'errado' },
        ],
      },
    ],
    success: 'Nada de vômito provocado, embalagem guardada, equipe recebida.',
    fail: 'Houve erro na orientação. A lesão pode ter piorado.',
  },
  anafilaxia: {
    id: 'anafilaxia',
    title: 'Orientação: reação alérgica grave',
    kind: 'dialogo',
    // [validar] Protocolo de campo (BC23/AC33/BPed18): afastar a causa, deitar de costas com as pernas elevadas, NÃO deixar sentar nem levantar de repente;
    // a epinefrina IM é feita pela equipe e a caneta autoinjetável não consta nas páginas. A orientação da caneta (do próprio paciente) é prática de primeiros socorros
    // e vale com ou sem caneta na cena. "Vencida há pouco é melhor do que nenhuma" fica só nas ligações em que a caneta existe (confirmar com a equipe médica).
    intro: 'Cada minuto conta. Afaste a causa, deite com as pernas para cima e, se ela tiver a caneta de adrenalina, use logo.',
    panic: 80,
    steps: [
      {
        say: 'A boca dela tá inchando, a garganta fechando!',
        options: [
          { label: 'Afaste o que causou a reação. Se ela tiver caneta de adrenalina receitada, aplique agora, na coxa, por cima da roupa se precisar.', kind: 'certo' },
          { label: 'Senta ela e manda respirar fundo.', kind: 'errado', reply: 'Ela quase desmaiou sentada!' },
          { label: 'Dá um antialérgico de comprimido e espera.', kind: 'errado', reply: 'Ela não consegue engolir!' },
        ],
      },
      {
        say: 'Fiz o que você mandou! E agora?',
        options: [
          { label: 'Se usou a caneta, segure o tempo que ela manda (3 a 10 segundos) e anote a hora. Deite ela de costas.', kind: 'certo' },
          { label: 'Agora é esperar.', kind: 'neutro' },
          { label: 'Você foi rápido. Muito bem.', kind: 'calma' },
        ],
      },
      {
        say: 'Ela tá ficando mole, quer sentar...',
        options: [
          { label: 'Deixe deitada, com as pernas para cima. Não deixe sentar nem levantar de repente. Se faltar ar, levante só um pouco o tronco.', kind: 'certo' },
          { label: 'Faz ela andar pra não apagar.', kind: 'errado' },
          { label: 'Dá água pra ela.', kind: 'errado' },
        ],
      },
      {
        say: 'Ela tá respirando... um pouco melhor.',
        options: [
          { label: 'Não dê nada pela boca. Fique do lado dela, a equipe está chegando.', kind: 'certo' },
          { label: 'Ótimo, então cancela a ambulância.', kind: 'errado' },
        ],
      },
    ],
    success: 'O quadro foi mantido sob controle até a equipe chegar.',
    fail: 'A demora em agir piorou o quadro.',
  },
  asma: {
    id: 'asma',
    title: 'Orientação: crise de asma',
    kind: 'dialogo',
    intro: 'Quem está do outro lado é a sua família. A sua voz influencia o pânico dela.',
    panic: 65,
    steps: [
      {
        who: '{CONJ}',
        say: 'Ele tá puxando o ar com força, {nome}!',
        options: [
          { label: 'Deixe ele sentado, inclinado pra frente. Não deite ele.', kind: 'certo' },
          { label: 'Deita ele na cama pra descansar.', kind: 'errado' },
          { label: '{c:Lú|Alex}, eu tô aqui. Fala comigo devagar.', kind: 'calma' },
        ],
      },
      {
        who: '{CONJ}',
        say: 'Afrouxei a camiseta. E a bombinha?',
        options: [
          { label: 'Repita a bombinha com o espaçador, como o médico ensinou.', kind: 'certo' },
          { label: 'Dá um xarope de tosse.', kind: 'errado' },
          { label: 'Espera passar.', kind: 'errado' },
        ],
      },
      {
        who: '{CONJ}',
        say: 'Ele tá chorando, com medo...',
        options: [
          { label: 'Fala pra ele: "o ar entra pelo nariz, sai devagar pela boca". Fica perto dele.', kind: 'certo' },
          { label: 'Fala pra ele parar de chorar.', kind: 'errado' },
          { label: 'Ele vai ficar bem. A ambulância tá indo.', kind: 'calma' },
        ],
      },
      {
        who: '{CONJ}',
        say: 'Tô ouvindo a sirene!',
        options: [
          { label: 'Pegue a bombinha, o espaçador e a receita pra equipe.', kind: 'certo' },
          { label: 'Sai correndo com ele pra rua.', kind: 'errado' },
        ],
      },
    ],
    success: 'Ele chegou à equipe sentado, respirando com a bombinha.',
    fail: 'O pânico atrapalhou, mas a equipe chegou.',
  },
  asma_grave: {
    id: 'asma_grave',
    title: 'Orientação: crise grave',
    kind: 'dialogo',
    intro: 'Sem bombinha. Ganhe tempo até a equipe chegar.',
    panic: 85,
    steps: [
      {
        who: '{CONJ}',
        say: 'Ele tá com o olho pesado, {nome}! A boquinha roxa!',
        options: [
          { label: 'Sente ele, inclinado pra frente, roupa frouxa. Não deite.', kind: 'certo' },
          { label: 'Deixa ele dormir, ele tá cansado.', kind: 'errado', reply: 'Mas ele tá apagando!' },
          { label: '{c:Lú|Alex}. Olha pra mim. Eu tô aqui.', kind: 'calma' },
        ],
      },
      {
        who: 'ZÉLIA',
        say: '{Filho}, abri a janela. O que mais?',
        options: [
          { label: 'Mãe, fala com ele, mantém ele acordado. Conta as respirações.', kind: 'certo' },
          { label: 'Faz um chá de alho.', kind: 'errado' },
          { label: 'Leva ele pro chuveiro quente.', kind: 'errado' },
        ],
      },
      {
        who: '{CONJ}',
        say: 'Ele parou de chiar... isso é bom, né?',
        options: [
          { label: 'Não, {c:Lú|Alex}. Isso é grave. Não deixa ele dormir, a equipe tá chegando.', kind: 'certo' },
          { label: 'É, deve estar melhorando.', kind: 'errado', reply: 'Então... eu espero?' },
          { label: 'Respira. Faz o que eu falar.', kind: 'calma' },
        ],
      },
      {
        who: '{CONJ}',
        say: 'Chegaram! Chegaram!',
        options: [{ label: 'Abre a porta e entrega ele pra eles.', kind: 'certo' }],
      },
    ],
    success: 'A equipe recebeu o Liam acordado.',
    fail: 'Foi por pouco.',
  },
  convulsao: {
    id: 'convulsao',
    title: 'Orientação: convulsão',
    kind: 'dialogo',
    // [validar] BC16/AC26: proteger a cabeça, anotar duração, não conter. "Nada na boca" e "virar de lado" são primeiros socorros padrão, não estão escritos literalmente nas páginas.
    intro: 'Proteja a vítima e marque o tempo.',
    panic: 70,
    steps: [
      {
        say: 'Ela tá se debatendo toda no chão!',
        options: [
          { label: 'Afaste tudo em volta e proteja a cabeça dela com algo macio.', kind: 'certo' },
          { label: 'Segura a língua dela pra não enrolar!', kind: 'errado', reply: 'Ela mordeu meu dedo!' },
          { label: 'Segura os braços com força.', kind: 'errado' },
        ],
      },
      {
        say: 'Não para! Já faz um tempão!',
        options: [
          { label: 'Não coloque nada na boca. Olhe o relógio: quanto tempo?', kind: 'certo' },
          { label: 'Joga água fria nela.', kind: 'errado' },
          { label: 'Eu tô com você. Fica do lado dela.', kind: 'calma' },
        ],
      },
      {
        say: 'Parou... ela tá roncando, mole.',
        options: [
          { label: 'Vire ela de lado e deixe a boca para baixo.', kind: 'certo' },
          { label: 'Dá água com açúcar.', kind: 'errado' },
          { label: 'Sacode ela pra acordar.', kind: 'errado' },
        ],
      },
    ],
    success: 'A vítima foi protegida até a equipe chegar.',
    fail: 'A orientação teve falhas.',
  },
  trauma: {
    id: 'trauma',
    title: 'Orientação: trauma na via',
    kind: 'dialogo',
    // [validar] Capacete: a equipe decide retirar (BP21); não há orientação escrita para leigo. "Não tirar" e "virar em bloco só se vomitar" seguem primeiros socorros padrão.
    intro: 'Não mexer na vítima. Sinalizar. Proteger a via aérea se vomitar.',
    panic: 65,
    steps: [
      {
        say: 'Ele tá no chão, de capacete, sangue no ouvido!',
        options: [
          { label: 'Não tire o capacete e não mexa nele. Peça para sinalizarem a pista.', kind: 'certo' },
          { label: 'Tira o capacete pra ele respirar.', kind: 'errado' },
          { label: 'Leva ele pra calçada.', kind: 'errado' },
        ],
      },
      {
        say: 'Ele vomitou! Tá engasgando!',
        options: [
          { label: 'Virem ele de lado todos juntos, em bloco: cabeça, ombro e quadril de uma vez.', kind: 'certo' },
          { label: 'Sacode ele pra acordar.', kind: 'errado' },
          { label: 'Deixa como está.', kind: 'errado', reply: 'Ele tá afogando no vômito!' },
        ],
      },
      {
        say: 'Viramos. Tá respirando, fazendo barulho.',
        options: [
          { label: 'Mantenha assim e não deixe ninguém mexer. A USA está chegando.', kind: 'certo' },
          { label: 'Dá água pra ele.', kind: 'errado' },
        ],
      },
    ],
    success: 'A vítima foi mantida imóvel e respirando.',
    fail: 'Mexeram na vítima mais do que deviam.',
  },
  hipoglicemia: {
    id: 'hipoglicemia',
    title: 'Orientação: hipoglicemia',
    kind: 'dialogo',
    // [validar] Inconsciente: nada pela boca, de lado (BC19/AC29: o tratamento é glicose na veia, pela equipe). Açúcar só se acordado e engolindo é primeiros socorros padrão (única menção oral: APed24).
    intro: 'Quem está do outro lado é uma criança. Fale simples.',
    panic: 70,
    steps: [
      {
        who: 'CRIANÇA',
        say: '{m:Moço|Moça}... ela não acorda...',
        options: [
          { label: 'Você está sendo muito valente. Não dá nada pra ela comer ou beber, tá?', kind: 'certo' },
          { label: 'Coloca açúcar na boca dela.', kind: 'errado', reply: 'Ela não engole, {m:moço|moça}...' },
          { label: 'Eu tô aqui com você. Qual é o seu nome?', kind: 'calma' },
        ],
      },
      {
        who: 'CRIANÇA',
        say: 'Ela tá deitada de costas...',
        options: [
          { label: 'Empurra ela devagarinho pra ficar de lado, com o rosto virado.', kind: 'certo' },
          { label: 'Sacode ela bem forte.', kind: 'errado' },
          { label: 'Fica pertinho dela.', kind: 'calma' },
        ],
      },
      {
        who: 'CRIANÇA',
        say: 'A porta tá trancada...',
        options: [
          { label: 'Você alcança a chave? Destranca a porta pro pessoal da ambulância entrar.', kind: 'certo' },
          { label: 'Sai na rua e espera a ambulância lá fora.', kind: 'errado' },
        ],
      },
    ],
    success: 'A criança destrancou a porta e ficou na linha até a equipe entrar.',
    fail: 'A equipe teve dificuldade para entrar.',
  },
  avc: {
    id: 'avc',
    title: 'Orientação: suspeita de AVC',
    kind: 'dialogo',
    // BC14/AC21: hora de início = último momento visto bem; consciente com a cabeceira elevada, inconsciente de lado; não baixar a pressão por conta própria.
    intro: 'Tempo é cérebro. Proteja a via aérea e anote a hora.',
    panic: 55,
    steps: [
      {
        say: 'Ele tá com a boca torta, o braço caído...',
        options: [
          { label: 'Anote a hora em que ele foi visto bem pela última vez.', kind: 'certo' },
          { label: 'Dá um remédio de pressão pra ele.', kind: 'errado' },
          { label: 'A ambulância já está a caminho.', kind: 'calma' },
        ],
      },
      {
        say: 'Ele quer água...',
        options: [
          { label: 'Não dê nada pela boca: ele pode engasgar.', kind: 'certo' },
          { label: 'Dá um pouquinho só.', kind: 'errado' },
        ],
      },
      {
        say: 'Ele vomitou!',
        options: [
          { label: 'Vire de lado e separe os remédios que ele toma para a equipe.', kind: 'certo' },
          { label: 'Senta ele na cadeira.', kind: 'errado' },
        ],
      },
    ],
    success: 'Hora anotada e via aérea protegida.',
    fail: 'Houve erro na orientação.',
  },
  agua: {
    id: 'agua',
    title: 'Orientação: área alagada',
    kind: 'dialogo',
    // [validar] Choque elétrico não tem página de campo: "desligar a fonte antes de tocar" é segurança de cena (PE1/BP16), não texto de protocolo.
    intro: 'Segurança de quem ajuda primeiro. Os Bombeiros estão a caminho.',
    panic: 75,
    steps: [
      {
        say: 'Ele levou choque, tá caído na água!',
        options: [
          { label: 'Não toque nele nem na água. Desligue a chave geral, se puder fazer isso sem entrar na água.', kind: 'certo' },
          { label: 'Puxa ele pelo braço rápido!', kind: 'errado', reply: 'Meu irmão levou choque também!' },
          { label: 'Calma. Primeiro a sua segurança.', kind: 'calma' },
        ],
      },
      {
        say: 'Desliguei! Tirei ele! Não respira!',
        options: [
          { label: 'Deite ele de barriga pra cima em lugar seco. Vamos começar a massagem.', kind: 'certo', switchTo: 'rcp' },
          { label: 'Espera os bombeiros.', kind: 'errado' },
        ],
      },
    ],
    success: 'Ninguém mais se feriu e a RCP começou cedo.',
    fail: 'O resgate improvisado complicou tudo.',
  },
  vagazero: {
    id: 'vagazero',
    title: 'Negociação: vaga zero',
    kind: 'dialogo',
    intro: 'O plantonista do Regional está sem leito. Argumente com fatos clínicos.',
    panic: 60,
    steps: [
      {
        who: 'PLANTONISTA',
        say: '{Dr}, não tem vaga. Tem paciente no corredor. Manda pra UPA.',
        options: [
          { label: 'É infarto com supra, janela de reperfusão. A UPA não tem hemodinâmica.', kind: 'certo' },
          { label: 'Você sabe com quem está falando?', kind: 'errado', reply: 'Sei. Com alguém que não tem leito pra me dar.' },
          { label: 'Eu sei que está pesado aí. Me escuta trinta segundos.', kind: 'calma' },
        ],
      },
      {
        who: 'PLANTONISTA',
        say: 'Não tenho nem maca.',
        options: [
          { label: 'Vaga zero: recebe na sala vermelha e a regulação responde pela decisão.', kind: 'certo' },
          { label: 'Então eu deixo o paciente na porta e vou embora.', kind: 'errado' },
          { label: 'Entendo. A equipe espera junto.', kind: 'neutro' },
        ],
      },
      {
        who: 'PLANTONISTA',
        say: '...Tá. Manda. Mas registra que fui eu que aceitei no grito.',
        options: [{ label: 'Registrado. {m:Obrigado|Obrigada}.', kind: 'certo' }],
      },
    ],
    success: 'Vaga zero autorizada.',
    fail: 'A negociação travou.',
  },
};
