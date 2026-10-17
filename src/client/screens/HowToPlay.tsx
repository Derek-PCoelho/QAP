// Menu principal → "Como jogar": passo a passo, abordagens por situação (para estudar antes
// de jogar), detalhes de cada mecânica, siglas e controles.
import { useState } from 'react';
import { store } from '../store';
import { QCODES } from '../../engine/qcodes';
import { isNative } from '../native';

type Tab = 'jogar' | 'abordagens' | 'detalhes' | 'siglas' | 'controles';

/** seção do manual: parágrafos e/ou lista; `aviso` marca conteúdo que revela a história */
interface Sec {
  t: string;
  p?: string[];
  li?: string[];
  aviso?: string;
}

const STEPS: Sec[] = [
  {
    t: 'O plantão',
    p: [
      'Você é o médico (ou a médica) regulador(a) da Central de Regulação de Santa Aurora. Cada dia é um plantão das 7h às 19h.',
      'O relógio anda sozinho: no ritmo normal, 1 segundo real vale 1 minuto de jogo. Em Opções dá para deixar o plantão mais calmo (75% ou 50%). Esc pausa.',
      'As ligações entram na fila, à esquerda. Quem atende primeiro é a TARM (a Simone): o post-it dela resume o caso, e o vermelho quer dizer que ela achou urgente. Clique no cartão para atender.',
      'Fila vazia e nada para fazer? "Adiantar até a próxima ligação" faz o relógio correr 4× até o telefone tocar.',
    ],
  },
  {
    t: 'Ouvir e perguntar',
    p: [
      'A transcrição mostra o que quem liga diz. As primeiras palavras costumam ser as mais verdadeiras.',
      'Nome, idade e endereço já vêm da TARM, na ficha. As perguntas embaixo da transcrição são as do regulador: cada uma custa minutos do relógio, e o paciente piora enquanto isso. Pergunte o que muda a sua decisão.',
      'Desconfie do que não fecha: endereço que não existe no mapa, número que já está no quadro de trotes, história que muda no meio.',
      'Modo Inconsistência (TAB): clique em duas pistas que se contradizem (ou se confirmam). Vale a transcrição, a ficha, o quadro, o manual e o diário. O tempo corre mais devagar; pista errada custa paciência e minutos.',
    ],
  },
  {
    t: 'Decidir: a ficha',
    p: [
      'Cor: vermelho (risco de vida agora), amarelo (urgente, mas não imediato), verde (pode esperar ou ir por meios próprios), azul (só orientação).',
      'Recurso: USA (suporte avançado, com médico), USB (suporte básico) ou Orientação (sem viatura).',
      'A viatura pode ser escolhida no mapa; se não escolher, vai a mais próxima. Apoio: PM para cena violenta, Bombeiros para resgate (preso em ferragens, altura, água, fogo, fio).',
      'A partir do dia 9, escolha o hospital: Regional, UPA Norte ou Maternidade. Na orientação, diga para onde a pessoa vai: UBS, UPA, Hospital Regional, Maternidade ou ficar em casa.',
      'Trote: marque "Trote" e carimbe. Não precisa de cor; o número vai para o quadro.',
      'Carimbe. O resultado aparece quando a viatura chega ou na auditoria do fim do dia.',
    ],
  },
  {
    t: 'Erros e consequências',
    p: [
      'Mandar a mais (excesso) gera nota de auditoria. Mandar a menos ou dispensar uma emergência gera advertência. Duas notas valem uma advertência; três advertências no dia, exoneração (duas no Regulador Real).',
      'Óbito por demora ou por dispensa abre sindicância.',
      'Algumas ligações têm mais de uma resposta defensável (⚖). A melhor paga mais.',
      'Sem nenhuma USA livre, mandar USB num caso vermelho é aceito: continue orientando até ela chegar.',
    ],
  },
  {
    t: 'Orientar por telefone',
    p: [
      'Em parada cardíaca, engasgo, parto, sangramento e outros, você guia quem ligou até a equipe chegar. Leia a fala e as opções com calma: há uma barra de tempo, mas ela é larga.',
      'Na massagem cardíaca, aperte ESPAÇO no ritmo do metrônomo e T para trocar quem faz a massagem quando cansar.',
    ],
  },
  {
    t: 'Videoatendimento (Programa VER)',
    p: [
      'A partir do dia 3, dá para pedir que quem ligou abra a câmera. Custa minutos e só há 3 por plantão.',
      'O vídeo mostra cor da pele, respiração, sangue e o ambiente. Não mostra pressão, glicemia nem o que está fora do quadro.',
      'Bom contra trote e contra quem diz que "não é nada". Nunca use com vítima escondida de um agressor nem em crise suicida.',
    ],
  },
  {
    t: 'Rádio e pedidos',
    p: [
      'As equipes falam em código Q (veja a aba Siglas). Passe o mouse sobre um código para ver o significado.',
      'Quando uma equipe, a PM ou um hospital precisa de resposta, o pedido aparece num cartão sobre o mapa, com o tempo que falta. Ele fica ali até você responder.',
    ],
  },
  {
    t: 'Casa',
    p: [
      'Depois do plantão vêm a família, as contas e a hora de dormir. Sem pagar comida, energia, gás, remédios ou aluguel, as coisas pioram.',
      'Na folga, escolha: descansar (o cansaço cai), ficar com a família (os laços sobem) ou fazer um plantão extra na ambulância (dinheiro, mas o que acontece em casa se resolve sem você).',
      'Antes de dormir, o Ozzy, o lulu da família, traz a bolinha: brincar com ele uma vez por noite alivia o desgaste.',
      'Cansaço alto faz o texto tremer e o telefone tocar sem ninguém na linha. Em 100, colapso.',
    ],
  },
  {
    t: 'Plantão extra na ambulância (Intervenção)',
    p: [
      'Três ocorrências em tempo real, com o Seu Bené no volante. O paciente piora enquanto você decide, e cada ação leva alguns segundos da equipe.',
      'Primeiro a segurança da cena; depois o que mata primeiro. Com o essencial feito, escolha o hospital (na parada cardíaca, só saia com o pulso de volta). Teclas 1 a 9 para as ações.',
      'No dia seguinte você dormiu três horas: quando a tela escurecer, clique ou aperte qualquer tecla para não cochilar. Noites seguidas pioram o sono.',
    ],
  },
  {
    t: 'Modos',
    p: [
      'Campanha: 20 plantões e quatro finais. Plantão Infinito: turnos gerados, com ranking. Depois do primeiro final, a Campanha da Simone: os mesmos dias vistos pela TARM da mesa ao lado.',
    ],
  },
];

/** Abordagens por situação: o que perguntar, o que decidir, onde está a armadilha. Segue o Manual de Regulação do jogo. */
const ABORDAGENS: Sec[] = [
  {
    t: 'Toda ligação: o método',
    li: [
      'Leia o post-it da TARM e as primeiras falas: costumam dizer o que importa.',
      'Primeiro o que mata: está acordado? Respira normal? O que aconteceu? Desde que horas? Depois, as perguntas do protocolo daquele caso.',
      'Cor pelo risco de vida, não pelo desespero de quem liga. Recurso pela cor: vermelho → USA; amarelo → USB; verde e azul → orientação.',
      'Antes de carimbar: precisa de PM (violência) ou de Bombeiros (preso, altura, água, fogo, fio)? A partir do dia 9, qual hospital?',
      'Cada pergunta custa minutos. Pergunte o que muda a decisão e carimbe. Vermelho evidente não espera vídeo.',
    ],
  },
  {
    t: 'Não responde, não respira: parada',
    li: [
      '"Não responde e não respira", ou respira esquisito (ronco, suspiro): parada até prova em contrário.',
      'Decida já: vermelho, USA, e RCP guiada por telefone. Nada de perguntas a mais nem vídeo.',
      'Armadilha: "tá dormindo pesado", "tá roncando" em quem caiu de repente.',
    ],
  },
  {
    t: 'Dor no peito',
    li: [
      'Pergunte: "Dor irradia? Suor?", desde que horas, doenças e remédios.',
      'Mais de 40 anos, suor frio e dor que vai para o braço, as costas ou o queixo: provável infarto. Vermelho, USA, Regional (cateterismo).',
      'Diabéticos, idosos e mulheres podem infartar sem a dor clássica: cansaço, enjoo, "azia", suor frio.',
      'Dor em pontada que piora ao apertar, depois de esforço, em jovem sem fatores de risco: provavelmente muscular. Orientação.',
    ],
  },
  {
    t: 'AVC: boca torta, braço caído, fala enrolada',
    li: [
      'Teste FAST (a partir do dia 6) e "Desde que horas?". A janela é de 4h30 desde a última vez em que a pessoa foi vista bem; quem acordou assim conta da hora em que dormiu bem.',
      'Na janela, acordado e só com sinais do FAST: USB já atende (USA, se estiver livre) → Regional. Inconsciente, convulsionando ou com a via aérea em risco: USA.',
      'Armadilha: hipoglicemia imita AVC. Diabético que usa insulina, suado e confuso: vermelho, USA. Acordado e engolindo: açúcar.',
    ],
  },
  {
    t: 'Falta de ar',
    li: [
      'Pergunte se fala frases inteiras, se os lábios estão roxos, se está sonolento.',
      'Asma moderada (chia, completa as frases, sem roxo): USB. Grave (palavras soltas, roxo, sonolento, peito afundando): USA.',
      '"Parou de chiar" numa crise grave pode ser tórax silencioso: é piora, não melhora.',
      'Crise de ansiedade: formigamento na boca e nas mãos, frases inteiras, lábios normais. Respiração guiada por telefone.',
      'Anafilaxia (inchaço e falta de ar depois de picada, remédio ou comida): vermelho, USA. Deitado, com as pernas para cima; nada de sentar.',
    ],
  },
  {
    t: 'Engasgo e objetos engolidos',
    li: [
      'Tosse forte: deixe tossir. Não tosse, não fala, ficando roxo: desengasgo guiado. Se desmaiar: massagem no peito e, a cada rodada, olhar a boca e tirar só o que estiver à vista.',
      'Moeda engolida sem dificuldade para respirar ou engolir: orientação, UPA por meios próprios.',
      'Pilha ou bateria de botão: USB, sem esperar sintoma.',
    ],
  },
  {
    t: 'Trauma: queda, moto, carro, atropelamento',
    li: [
      'Pergunte: está acordado? Sangra muito? Bateu a cabeça? Capacete? Idoso: usa remédio que afina o sangue?',
      'Grave (inconsciente, grande hemorragia, falta de ar, fratura exposta da coxa): vermelho, USA, Regional.',
      'Fratura simples, corte que para com pressão, idoso que caiu e não levanta: amarelo, USB (fratura simples vai para a UPA).',
      'Hemorragia: pressão firme no ferimento antes de qualquer coisa; objeto encravado, pressão em volta e nunca puxar. Torniquete com cinto é erro.',
      'Bombeiros junto: preso em ferragens ou máquina, altura, desabamento, água, fogo, fio energizado.',
    ],
  },
  {
    t: 'Violência: tiro, faca, briga, agressor no local',
    li: [
      '"Local seguro?" decide. Arma, agressor presente ou briga em curso: PM junto com a viatura. Equipe em cena insegura sem PM é advertência na hora.',
      'Nunca peça vídeo para quem está escondido de um agressor: a câmera expõe.',
      'Violência doméstica: a vítima pode falar em código. Faça perguntas de sim ou não.',
    ],
  },
  {
    t: 'Gestantes e parto',
    li: [
      'Período expulsivo (vê a cabeça, vontade de fazer força): USB e parto guiado por telefone → Maternidade.',
      'Cordão, pé, mão ou nádegas aparecendo antes da cabeça, hemorragia forte ou convulsão: USA.',
      'Pressão alta com dor de cabeça forte, dor na boca do estômago ou visão "brilhando": USA.',
      'Início do trabalho de parto (contrações espaçadas, bolsa íntegra): orientação, Maternidade por meios próprios.',
      'Sangramento pequeno, sem dor, no começo da gestação: orientação. Com dor, ou depois de 20 semanas: USB. Forte: USA.',
    ],
  },
  {
    t: 'Crianças e bebês',
    li: [
      'Criança ao telefone: peça um adulto. Sem adulto consciente, regule pelo que a criança descreve.',
      'Bebê com menos de 3 meses e febre: sempre urgente, USB.',
      'Febre com manchas roxas que não somem quando se aperta um copo em cima: vermelho, USA.',
      'Intoxicação: não provocar vômito, guardar a embalagem. Produto cáustico ou remédio de adulto: USA → Regional.',
      'Convulsão que já passou: amarelo, USB. Convulsionando sem parar: vermelho.',
    ],
  },
  {
    t: 'Idosos',
    li: [
      'Queda em quem toma remédio que afina o sangue, mesmo "só um galo": não subestime.',
      'Confusão de repente: hipoglicemia, infecção ou AVC. "Bêbado" desacordado merece a pergunta sobre diabetes.',
      'Idoso que caiu e não consegue levantar: amarelo, USB.',
    ],
  },
  {
    t: 'Saúde mental',
    li: [
      'Agitação ou ameaça a terceiros: USB e PM. Com arma ou agressão em curso, a PM entra primeiro; USA de apoio se o risco for alto.',
      'Crise com risco de se machucar: USB e acolhimento por telefone. Com plano, meio à mão ou tentativa em curso: USA.',
      'A ligação não pode cair. Pergunte direto sobre suicídio (perguntar não induz) e se há alguém por perto. Sem vídeo. CVV: 188.',
    ],
  },
  {
    t: 'Dengue (a partir do dia 11)',
    li: [
      'Sem sinais de alarme: hidratação e UBS (orientação).',
      'Sinais de alarme (dor abdominal forte, vômitos, sangramento de mucosa, sonolência, tontura ao levantar): USB → UPA. Idoso ou confuso: Regional.',
      'Choque (pele fria, desmaio, pulso fraco): USA → Regional. Gestante com febre: USB → Maternidade.',
    ],
  },
  {
    t: 'Casos leves',
    li: [
      'Dor de dente, resfriado, curativo, a dor de sempre: verde ou azul, orientação → UBS, UPA ou ficar em casa.',
      'O Hospital Regional é para os graves, que vão de viatura. Mandar caso leve para lá zera o bônus.',
      '"Tô morrendo" de dor de dente não é morrer: o exagero é comum. E quem diz "não é nada" pode estar grave.',
    ],
  },
  {
    t: 'Trote',
    li: [
      'Sinais: risadas ao fundo, história de filme, endereço que não existe, horário que não fecha, número no quadro, hesitação em dado simples.',
      'Ferramentas: "Conferir no mapa" (2 min), "Confirmar o endereço", "Ligar de volta" (30 min; caixa postal ou número inexistente reforçam), vídeo (trotista recusa, enrola ou desliga; trote filmado vale prova) e o Modo Inconsistência, que libera o confronto ("Esse número já passou trote aqui").',
      'Número no quadro não prova trote: gente de verdade também liga de número marcado. Tratar emergência como trote é a falha mais grave da regulação.',
      'Para encerrar: Recurso "Trote" e carimbar.',
    ],
  },
  {
    t: 'Frota e hospital',
    li: [
      'USA é para risco imediato de morte. USA em caso leve é nota de excesso, e a USA falta para quem precisa.',
      'Sem USA livre num vermelho, USB é aceita: continue orientando até ela chegar.',
      'Escolha a viatura no mapa e veja o tempo de chegada. Dois vermelhos e uma USA: maior risco de morte primeiro, depois menor tempo de chegada.',
      'A partir do dia 9: Regional (trauma grave, vermelhos clínicos, pediatria grave), UPA Norte (amarelos, fraturas simples), Maternidade (gestantes com mais de 20 semanas e partos).',
      'Viatura retida no hospital (sem maca): o pedido aparece sobre o mapa; negociar custa minutos, mas devolve a viatura. Regional sem vaga num vermelho: "vaga zero" por telefone.',
      'A meta de USA da Saúde+ não está acima do manual. Cumpri-la mandando menos que o necessário custa Integridade.',
    ],
  },
  {
    t: 'Múltiplas vítimas (dia 15)',
    li: [
      'START: anda sozinho → verde. Respira mais de 30 por minuto, enchimento capilar acima de 2 segundos ou não obedece → vermelho. Não anda, mas respira, perfunde e obedece → amarelo.',
      'Peça reforço regional e preserve uma USA para a cidade.',
    ],
  },
  {
    t: 'Impedimento',
    li: ['O regulador não regula familiar nem pessoa com quem tem vínculo. Nesses casos, declare impedimento e a coordenação assume.'],
  },
];

/** Cada detalhe do jogo, para quem quer saber o que cada coisa faz. */
const DETALHES: Sec[] = [
  {
    t: 'Café',
    li: [
      'A xícara no alto da tela: até 2 por plantão.',
      'Por 2 horas de jogo, as perguntas custam 30% menos tempo e você não cochila.',
      'Em casa, cada café vira +8 de Desgaste, e você chega irritado(a): as falas mais carinhosas ficam bloqueadas naquela noite.',
      'Depois de noites seguidas na ambulância, o café segura menos (1h30, depois 1h).',
    ],
  },
  {
    t: 'Foto da família',
    li: [
      'O porta-retratos no alto da tela: uma vez por plantão, Desgaste −3 e um segundo em que o relógio para.',
      'Quem passa o plantão sem olhar a foto termina o dia com +1 de Desgaste.',
    ],
  },
  {
    t: 'Painel da Saúde+ (no alto)',
    li: [
      'USA hoje / meta: quantas USA você mandou contra a meta da OS (a partir do dia 5). Estourou a meta, o Dr. Peixoto liga.',
      'Custo do dia e Índice de eficiência: o índice cai com USA acima da meta, demora média acima de 40 minutos por ligação e muitos despachos.',
      'Cumprir a meta paga bônus. Cumpri-la tendo mandado menos que o necessário ("meta suja") custa Integridade −1.',
    ],
  },
  {
    t: 'Dinheiro do plantão',
    li: [
      'Fixo de R$ 160 + bônus por decisão certa: USA 25, USB 15, Orientação 8, Trote 10. Cor errada paga metade; a melhor resposta defensável paga mais que a outra.',
      'Extras: vermelho certo decidido em até 60 segundos reais +10 ("hora de ouro"); RCP guiada que salvou +20; 8 ou mais ligações no dia sem advertência +30.',
      'O bônus tem teto de R$ 160 por dia; o que passa disso é "glosa". Descontos: nota −R$ 10, advertência −R$ 20.',
    ],
  },
  {
    t: 'Desgaste (0 a 100)',
    li: [
      'Sobe: +5 a cada plantão, óbitos, advertências, café, noites na ambulância e reler o diário quando há mais mortos que vivos.',
      'Desce: descansar na folga (−15), ficar com a família (−10), a foto (−3), o Ozzy (−4), reler o diário quando há mais vivos (−10).',
      'Acima de 60: o texto treme, a lâmpada pisca e as perguntas ficam um pouco mais caras. Acima de 80: o telefone toca sem ninguém na linha (atender custa 2 min) e o Bené não deixa você subir na ambulância. Em 100: colapso.',
    ],
  },
  {
    t: 'Laços (0 a 10)',
    li: [
      'A família. Sobem com folga em família, falas carinhosas e quando você percebe o que ninguém diz (Modo Inconsistência em casa).',
      'Caem com ausência, contas que faltam (gás, comida) e escolhas frias.',
      '2 ou menos: o seu cônjuge vai embora. 7 ou mais: uma das condições do final bom.',
    ],
  },
  {
    t: 'Integridade (0 a 10)',
    li: [
      'Propina, meta suja e mentira derrubam.',
      '2 ou menos: o seu nome é exposto e o contrato não é renovado. 6 ou mais: uma das condições do final bom.',
    ],
  },
  {
    t: 'Humanidade (0 a 10)',
    li: [
      'Sobe quando você trata quem liga como gente: escutar, acolher, não apressar quem está sozinho.',
      'Em 6, abre caminhos na história: quem você ajudou volta para ajudar você.',
    ],
  },
  {
    t: 'Simone, Bené, Henrique e Peixoto',
    li: [
      'Lealdade da Simone: alta (7 ou mais), os post-its dela acertam mais; baixa (3 ou menos), erram mais. No Narrativo, ela nunca erra.',
      'Intimidade com o Bené: sobe quando você manda a USA 01 certo, cumpre o que promete e faz noite na ambulância com ele. Ela muda o jeito como ele fala com você no rádio.',
      'O que ficar na fila às 19h vai para o plantão noturno do Dr. Henrique.',
      'Dr. Peixoto, a coordenação: liga pelo interfone quando a meta aperta.',
    ],
  },
  {
    t: 'Ligação: paciência, espera e ferramentas',
    li: [
      'Perguntas demais, pistas erradas e espera derrubam a paciência de quem liga: "impaciente", "perdendo a paciência" e, por fim, a pessoa desliga.',
      'Acalmar: reduz o pânico e melhora as respostas. Pôr em espera: a ligação volta à fila com tudo o que já foi dito.',
      'Falar com o paciente (15 min): testa a história de quem ligou. Ligar de volta (30 min, a partir do dia 2): desmascara número falso.',
      'Casos dispensados que eram graves ligam de novo, piores.',
    ],
  },
  {
    t: 'Casa: contas, loja e diário',
    li: [
      'Aluguel: se não pagar, acumula; três atrasos são despejo. Comida: sem pagar, a família passa fome; duas vezes seguidas, alguém adoece. Energia: na segunda vez, corte (e a insulina estraga). Gás: comida fria e Laços caem. Remédios da Dona Zélia: ela piora; duas vezes seguidas, internação. Transporte: descontado sozinho.',
      'Modo Inconsistência em casa (TAB): repare em objetos e falas para perceber o que a família não conta. Sem nada para achar, custa Laços −1.',
      'Antes de dormir: compras, o diário e o Ozzy.',
      'Diário (D): os nomes de quem você atendeu e o que aconteceu depois. "Reler os nomes" com Desgaste alto: mais vivos que mortos alivia; mais mortos pesa.',
    ],
  },
  {
    t: 'Ozzy',
    li: [
      'O lulu da pomerânia laranja da família. Uma brincadeira por noite, antes de dormir: Desgaste −4.',
      'Nada de ruim acontece com o Ozzy, em nenhum momento do jogo.',
    ],
  },
  {
    t: 'Plantão extra na ambulância',
    li: [
      'Paga R$ 140 e mais até R$ 75 pelas ocorrências bem resolvidas. Custa Desgaste +15 (+5 a cada noite seguida, +4 por óbito, +6 se a equipe se ferir) e o evento da família daquela noite.',
      'Fica bloqueado com Desgaste 80 ou mais. A partir de 60, uma noite ruim pode levar ao colapso.',
      'No dia seguinte: 3 cochilos depois da primeira noite, 5 depois da segunda seguida, 7 a partir da terceira, e cada vez menos tempo para reagir.',
    ],
  },
  {
    t: 'Quadro, manual e jornal',
    li: [
      'Quadro de cortiça (Q): números de trote (com quantas vezes ligaram), documentos da mesa e os seus próprios post-its.',
      'Manual (M): ganha páginas ao longo dos dias; o jornal da manhã avisa quando. No Regulador Real, não abre durante a ligação.',
      'Jornal: as notícias trazem pistas da história e das ligações do dia.',
    ],
  },
  {
    t: 'Saves',
    li: [
      'Salvamento automático a cada mudança de fase e ao fechar o jogo, e um save no início de cada dia.',
      'Pausa (Esc) → Salvar no espaço 1; em Carregar, espaços 1 a 3. Salvar no meio de um plantão ou de uma noite na ambulância guarda o começo dele.',
      'Nenhum save some de vez sem querer: apagar um save, terminar a campanha ou começar outra por cima guarda uma cópia em Carregar → "Saves guardados", por 30 dias. Carregar uma cópia faz dela o "Continuar".',
    ],
  },
  {
    t: 'Finais',
    aviso: 'Revela como a história pode terminar.',
    li: [
      'Ruim: alguém da família morreu, o seu cônjuge foi embora ou a Integridade chegou a 2.',
      'Bom: família toda bem, Laços 7 ou mais, Integridade 6 ou mais, 4 dos 7 pacientes-chave salvos e a matéria da jornalista publicada com duas fontes.',
      'Secreto: no último dia, oferecem uma cadeira a quem ficou no meio do caminho.',
      'Normal: todo o resto.',
    ],
  },
];

const SIGLAS: { g: string; items: [string, string][] }[] = [
  {
    g: 'Recursos e serviços',
    items: [
      ['USA', 'Unidade de Suporte Avançado: ambulância com médico, enfermeiro e condutor.'],
      ['USB', 'Unidade de Suporte Básico: técnico de enfermagem e condutor.'],
      ['TARM', 'Técnico(a) Auxiliar de Regulação Médica: atende primeiro e faz a pré-triagem.'],
      ['MR', 'Médico(a) regulador(a): quem decide (você).'],
      ['Regional', 'Hospital Regional (REG): emergência geral, trauma, cateterismo e AVC.'],
      ['UPA', 'Unidade de Pronto Atendimento.'],
      ['UBS', 'Unidade Básica de Saúde (posto de saúde).'],
      ['MAT', 'Maternidade.'],
      ['PM', 'Polícia Militar (190). COPOM: central de operações da PM.'],
      ['Bombeiros', 'Resgate, salvamento e incêndio (193).'],
      ['IML', 'Instituto Médico Legal: morte violenta ou suspeita.'],
      ['SVO', 'Serviço de Verificação de Óbito: morte natural.'],
      ['OS', 'Organização Social: a Saúde+ Gestão, que administra a central.'],
      ['VER', 'Programa de videoatendimento da Regulação.'],
      ['CVV', 'Centro de Valorização da Vida: apoio emocional, 188, 24 horas.'],
      ['Vaga zero', 'O hospital recebe o paciente grave mesmo sem leito livre.'],
    ],
  },
  {
    g: 'Decisão e avaliação',
    items: [
      ['Vermelho', 'Risco de vida agora. USA (na falta, USB).'],
      ['Amarelo', 'Urgente, mas não imediato. Em geral, USB.'],
      ['Verde', 'Pode esperar ou ir por meios próprios.'],
      ['Azul', 'Só orientação.'],
      ['ORI', 'Orientação: carimbo sem viatura, com encaminhamento.'],
      ['⚖', 'Decisão defensável: há mais de uma resposta aceita.'],
      ['Nota', 'Nota de auditoria: mandou recurso a mais. Duas notas = uma advertência.'],
      ['Advertência', 'Mandou a menos ou dispensou emergência. Três no dia = exoneração.'],
      ['Sindicância', 'Investigação aberta quando alguém morre por demora ou dispensa.'],
      ['Glosa', 'Parte do bônus que passou do teto do dia e não foi paga.'],
    ],
  },
  {
    g: 'Clínica',
    items: [
      ['AVC', 'Acidente vascular cerebral (derrame).'],
      ['FAST / Cincinnati', 'Teste do AVC: sorrir, levantar os braços, repetir uma frase.'],
      ['IAM / SCA', 'Infarto agudo do miocárdio / síndrome coronariana aguda.'],
      ['ECG', 'Eletrocardiograma.'],
      ['RCP', 'Reanimação cardiopulmonar (massagem cardíaca).'],
      ['DEA', 'Desfibrilador externo automático.'],
      ['FV', 'Fibrilação ventricular: ritmo de parada que pede choque.'],
      ['OVACE', 'Obstrução das vias aéreas por corpo estranho (engasgo).'],
      ['TCE', 'Traumatismo cranioencefálico (pancada na cabeça).'],
      ['START', 'Triagem de múltiplas vítimas: anda, respira, perfunde, obedece.'],
      ['PA', 'Pressão arterial.'],
      ['FC / FR', 'Frequência cardíaca / frequência respiratória.'],
      ['SpO₂', 'Saturação de oxigênio no sangue (oxímetro).'],
      ['Glic', 'Glicemia capilar (açúcar no sangue, picada no dedo).'],
      ['Glasgow', 'Escala de consciência, de 3 (coma) a 15 (normal).'],
      ['EPI', 'Equipamento de proteção individual.'],
    ],
  },
  {
    g: 'Rádio (código Q)',
    items: Object.entries(QCODES).map(([k, v]) => [k, v] as [string, string]),
  },
];

const KEYS: [string, string][] = [
  ['Clique no cartão da fila', 'Atender a ligação'],
  ['Botões de pergunta', 'Perguntar (cada pergunta custa minutos)'],
  ['TAB', 'Modo Inconsistência (ligar duas pistas)'],
  ['M', 'Manual de Regulação'],
  ['Q', 'Quadro de cortiça (trotes, documentos, post-its)'],
  ['D', 'Diário (quem você atendeu e o que aconteceu depois)'],
  ['ESPAÇO', 'Compressão na massagem cardíaca guiada'],
  ['T', 'Trocar quem faz a massagem quando cansar'],
  ['1 a 9', 'Ações no plantão da ambulância'],
  ['Enter', 'Sair com a ambulância depois do chamado no rádio'],
  ['Qualquer tecla', 'Acordar quando as pálpebras pesarem'],
  ['Esc', 'Pausa: salvar, opções, sair (digitando: só sai do campo)'],
];

function Sections({ list }: { list: Sec[] }) {
  return (
    <div className="hw-cols">
      {list.map((s, n) => (
        <section key={s.t} className={'hw-sec' + (s.aviso ? ' spoiler' : '')}>
          <h3>{list === STEPS ? `${n + 1}. ${s.t}` : s.t}</h3>
          {s.aviso && <p className="hw-aviso">{s.aviso}</p>}
          {s.p?.map((x, i) => (
            <p key={i}>{x}</p>
          ))}
          {s.li && (
            <ul>
              {s.li.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

const TABS: [Tab, string][] = [
  ['jogar', 'Passo a passo'],
  ['abordagens', 'Abordagens'],
  ['detalhes', 'Detalhes'],
  ['siglas', 'Siglas e rádio'],
  ['controles', 'Controles'],
];

export function HowToPlay() {
  const [tab, setTab] = useState<Tab>('jogar');
  const keys: [string, string][] = isNative() ? [...KEYS, ['F11 ou Alt+Enter', 'Tela cheia / janela']] : KEYS;
  return (
    <div className="menu-screen howto">
      <h1>Como jogar</h1>
      <div className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={'px-btn small' + (tab === id ? ' primary' : '')} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="hw-body scroll-y" key={tab}>
        {tab === 'jogar' && <Sections list={STEPS} />}
        {tab === 'abordagens' && (
          <>
            <p className="hw-lead">Para estudar antes de jogar: o que perguntar e o que decidir em cada tipo de ligação. Segue o Manual de Regulação do jogo, que ganha páginas ao longo dos dias.</p>
            <Sections list={ABORDAGENS} />
          </>
        )}
        {tab === 'detalhes' && <Sections list={DETALHES} />}
        {tab === 'siglas' && (
          <div className="hw-cols">
            {SIGLAS.map((g) => (
              <section key={g.g} className="hw-sec">
                <h3>{g.g}</h3>
                <dl className="hw-dl">
                  {g.items.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
        {tab === 'controles' && (
          <table className="hw-keys">
            <tbody>
              {keys.map(([k, v]) => (
                <tr key={k}>
                  <td>
                    <span className="kbd">{k}</span>
                  </td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="row-end">
        <button className="px-btn ghost" onClick={() => store.setScreen('titulo')}>
          Voltar
        </button>
      </div>
    </div>
  );
}
