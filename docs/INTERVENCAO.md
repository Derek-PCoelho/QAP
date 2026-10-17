# Intervenção: o plantão extra na ambulância

Entre dois plantões da Regulação, a folga oferece três caminhos: descansar, ficar com a família ou pegar um **meio plantão noturno na USA 01** (19h à 1h), com o Seu Bené no volante e o Enf. Márcio atrás. É o antigo "bico na UPA", agora jogável: o jogador sai da cadeira de regulador e vai para a rua, onde vê e mede tudo o que a Regulação nunca vê.

A troca é a mesma de sempre no jogo: dinheiro contra tempo com a família e cansaço. Com o salário fixo de R$ 160 por plantão e contas de cerca de R$ 280 por noite, quem regula bem fecha o mês no azul; quem erra muito ou recusa o envelope do vereador precisa escolher entre a ambulância e a família.

| | Descansar | Família | Intervenção |
|---|---|---|---|
| Dinheiro | — | — | R$ 140 fixos + R$ 25 por paciente estável no hospital certo (R$ 10 se chegou vivo mas instável ou no destino errado) |
| Desgaste | −15 | −10 | +15 (+4 por óbito, +6 se a equipe se ferir); com desgaste 80 ou mais, o Bené não deixa você subir |
| Laços | — | +1 (ou o bônus do dia) | o evento do dia acontece sem você (efeito `onBico` do dia) |
| Plantão seguinte | normal | normal | **dormiu três horas**: três cochilos ao longo do dia |

## 1. Como se joga

Três ocorrências por noite (o trote nunca é a primeira). Cada uma passa por:

1. **Rádio.** A Regulação despacha a USA 01 com QRR, QTH e o que quem ligou disse. **A USA sempre sai em QRR 3**; QRR 2 é a USB quando é urgente (a Joana, no rádio). Todo QTH existe no mapa da cidade (tabela de `docs/CONTEUDO.md`; o teste confere). "QSL, a caminho (QTY)" leva à cena.
2. **Cena, em tempo real.** A cena é desenhada pelo mesmo gerador do videoatendimento, sem as limitações da câmera do celular. O **estado do paciente** cai a cada segundo depois de alguns segundos de leitura (6 s no padrão). Cada ação leva de 2 a 10 segundos da equipe e só uma acontece por vez.
   - **Crítica**: o que salva. Cada crítica feita reduz a velocidade da piora; com todas feitas, o paciente está estabilizado.
   - **Achado**: mede ou examina; liga sinais no monitor (PA, FC, FR, SpO₂, glicemia, temperatura, Glasgow, ritmo) e às vezes revela uma ação nova (a descompressão só aparece depois de auscultar).
   - **Ajuda**: melhora, mas não decide.
   - **Neutra**: gasta tempo (antialérgico sozinho na anafilaxia, CA-GA-DA num traçado que não é linha reta).
   - **Dano**: piora (nitrato no infarto inferior, AAS no AVC, colher na boca na convulsão, puxar a cabeça do bebê).
   - Pré-requisitos aparecem no botão ("Antes: Acesso venoso").
   - **"Ver sinais vitais" sempre traz a saturação** junto da PA, FC e FR (o motor acrescenta a SpO₂ a toda ação que mostra PA ou FC).
   - **Oxigênio e via aérea** ficam numa linha à parte, abaixo das ações (teclas Q W E R), e só entram se você indicar. Ver 1.1.
   - **Parada**: o monitor desenha o traçado e não diz o nome do ritmo. Ver 1.2.
3. **Destino.** Regional, UPA Norte, Maternidade ou liberar no local. Levar antes de estabilizar é possível (e às vezes certo: no trauma e no AVC o tratamento definitivo é no hospital; depois do essencial, a piora continua mais lenta e vale chegar rápido). Destino que não resolve rebaixa o desfecho ("vai precisar de transferência"). No transporte não há os segundos de leitura: a piora conta desde o começo.
   - **Parada cardíaca** (`treatOnScene`): o pulso volta na cena, não na ambulância. Sair antes de estabilizar é óbito no caminho.
   - **Liberar no local** só resolve onde o caso aceita. Quem precisava de hospital e não foi estabilizado não resiste em casa; estabilizado, fica "vivo, instável".
4. **Resultado.** Desfecho, destino, tempo na cena, pagamento, o que era o caso e o que importava, com o protocolo de referência. Destino errado mostra **por quê** (`destNote`).

### 1.1 Oxigênio por dispositivo (cateter, Venturi, reservatório, intubação)

Cada caso diz a saturação em ar ambiente (`oxy`) e o motor gera quatro botões com o efeito certo para aquele paciente (desenho do jogo, coerente com AP15–AP17 e AP7/AP10 · [validar]):

| Dispositivo | Quanto sobe a SpO₂ | Quando é o certo |
|---|---|---|
| Cateter nasal (1–4 L/min) | +4 | hipoxemia leve; DPOC com pouco fluxo |
| Máscara de Venturi (24–50%) | +7 (no DPOC a equipe titula para 88–92%) | hipoxemia moderada; **DPOC** |
| Máscara com reservatório (10–15 L/min) | +12 | hipoxemia grave; **trauma grave com choque** (o protocolo pede alto fluxo) |
| Intubação orotraqueal | via aérea definitiva | **quem não sustenta**: Glasgow ≤ 8, ronco, respiração lenta; ou quando nem o reservatório chega ao alvo |

- Alvo 94% (`need`); **DPOC 88–92%**: acima de 92% o paciente fica sonolento (hipercapnia), é dano, e a oxigenação não conta como resolvida até trocar para Venturi ou cateter.
- **Infarto: oxigênio só com SpO₂ < 90%** (decisão do jogador; a fonte AHA 2015 diz 94%). Dar O₂ com saturação normal no infarto é **erro leve** (−4, conta como conduta que piorou).
- Com saturação normal (fora do infarto), oxigênio é **neutro**: só gasta tempo. Ninguém é obrigado a dar.
- **Intubar quem respira e protege a via aérea é erro** (−12). Intubar quem não sustenta (o motociclista com Glasgow 7) é a conduta que estabiliza.
- Dispositivo fraco demais: a saturação sobe, mas abaixo do alvo; conta meia crítica até trocar. Trocar de dispositivo tira o anterior.
- O bot e o teste "de livro" usam o dispositivo mais simples que resolve (`idealO2`).

### 1.2 Parada: quem lê o ritmo é você

Os casos de parada têm `arrest` (ritmo inicial e mudanças durante a RCP). O monitor desenha (`src/client/art/fieldMonitor.ts`) e só escreve "sem pulso · leia o traçado". A frequência no monitor é a contagem de complexos (TV 180, AESP 44, assistolia 0, FV sem contagem), não pulso.

| Ritmo | Traçado | Conduta |
|---|---|---|
| **FV** | ondas caóticas, sem complexos | chocável: choque, RCP 2 min, adrenalina 1 mg a cada 3–5 min, amiodarona 300 mg |
| **TV sem pulso** | complexos largos, rápidos e regulares | chocável: igual à FV |
| **Assistolia** | linha quase reta | não chocável: **CA-GA-DA** (cabos, ganho, derivação) e adrenalina logo |
| **AESP** | complexos organizados e lentos, sem pulso | não chocável: adrenalina e **5H/5T** (achar e tratar a causa) |

- Choque em ritmo não chocável não conta e piora (−10); amiodarona fora de FV/TV também; CA-GA-DA num traçado que não é linha reta só gasta tempo.
- **O ritmo muda durante a RCP** (`rules`, cada uma acontece uma vez): a assistolia do Seu Nelson vira FV depois de CA-GA-DA + adrenalina; a parada do desfecho vai de FV → AESP (depois do choque) → FV (depois de adrenalina + 5H/5T).
- Casos: `pcr_fv` (FV), `pcr_assistolia` (assistolia → FV), `pcr_aesp` (AESP por engasgo: o 5H/5T acha a hipóxia, pinça de Magill), `noite_caderno` (TV sem pulso), `noite_desfecho` (FV → AESP → FV).

### 1.3 Infarto

AAS 300 mg mastigado **e clopidogrel** na dose da idade (300 mg até 75 anos; 75 mg acima). A dose errada antiagrega (não trava a estabilização: `satisfies`), mas 300 mg acima dos 75 é dano leve e 75 mg aos 61 é pouco. **Nitrato proibido com PAS < 90, FC < 50 ou infarto inferior** (`iam_inferior`); no infarto anterior com pressão boa (capítulo 1) ele ajuda.

### 1.4 Hipoglicemia sem mochila

"Olhar a mochila" é só achado: quem mede a glicemia e dá a glicose estabiliza e recebe o pagamento cheio. O que o jogador via de "perder ponto" era liberar no local depois de tratar: o paciente usa insulina, não jantou e mora sozinho, e essa informação só estava na mochila. Agora ele mesmo conta ao acordar, e o resultado explica por que o destino era a observação.

**Cena insegura** (Bar do Neno): a equipe só entra depois de esperar a PM a uma quadra. Entrar antes fere a equipe e encerra a ocorrência.

**Trote** (Praça da Matriz): não há vítima. A ocorrência só gasta tempo e uma vaga da noite; avisar a Regulação ("QTH sem vítima, QRU") encerra.

Atalhos: teclas 1 a 9 para as ações; Q W E R para cateter, Venturi, reservatório e intubação; Enter no rádio. Esc pausa.

## 2. A noite seguinte: dormir três horas

Noites seguidas pioram: a segunda noite seguida custa +5 de desgaste a mais (a terceira, +10…), e o plantão do dia seguinte tem 5 cochilos depois da segunda noite seguida e 7 a partir da terceira, com menos tempo para reagir (6, 5 e 4 minutos de jogo) e café mais curto (2 h, 1 h 30, 1 h). Uma noite em casa zera a conta. Cada noite na 01 também soma 1 de Intimidade com o Bené, e quem já fez plantão com ele é recebido de outro jeito na visita do dia 4.

No plantão seguinte da Regulação aparece o selo **DORMIU 3 H** e três cochilos acontecem em horários sorteados (por volta das 9h, 12h30 e 16h). A tela escurece devagar, como pálpebras fechando:

- clicar ou apertar qualquer tecla a tempo custa **1 minuto** (uma piscada longa);
- não reagir em 6 minutos de jogo custa **4 minutos** (cochilou na mesa).

O café segura os cochilos por duas horas, mas continua cobrando em casa (você chega irritado).

## 3. A história das noites: "O Sereno"

Um capítulo por **noite feita** (não por dia: a pessoa escolhe quando vai). O capítulo é a última ocorrência da noite (o trote não divide a noite com a história); falas de rádio e viatura abrem a noite e antecedem o capítulo; o card "fim do plantão extra" mostra o fim da noite. Quem começa tarde ganha dois capítulos por noite, para o desfecho caber até o dia 19 (`pickChapters`). Depois do desfecho, cada noite traz uma fala solta da cidade (`afterwards`).

**Trama.** Um senhor de capa cinza chega antes da ambulância em noites diferentes. A USB chama ele de "Sereno". Ele ouve a frequência da Regulação num radioamador velho, anota num caderno a hora de cada chamado e de cada chegada, e liga para a central para corrigir os endereços errados do noturno. Reviravolta: é o **Seu Anselmo Nunes**, vigia de usina aposentado, pai do Rafael (morto em 2019 na Av. Brasil, 2400, depois de quarenta minutos de espera) e da jornalista Carla. "Eu não chego pra salvar. Eu chego pra ninguém ficar sozinho." E a cidade dorme sem saber de outra coisa: **da meia-noite às seis, a Saúde+ Gestão deixa só a USA 01 na rua** ("Plano Noturno de Otimização").

| Nº | Capítulo | Ocorrência (o que treina) | O que acontece |
|---|---|---|---|
| 1 | Capa cinza | infarto anterior na rodoviária (clopidogrel 75 mg aos 78; nitrato pode; O₂ não) | o Dr. Castro vai junto "só olhando"; um senhor de capa marca o tempo da dor num papel ("32 min") e some |
| 2 | Rua errada | edema agudo de pulmão (reservatório, nitrato, furosemida) | o rádio passa 1210 em vez de 210; o Sereno acena da esquina com uma lanterna; a Joana conta o apelido |
| 3 | O caderno | parada em TV sem pulso na praça do dominó | o Sereno massageava certo; deixa cair o caderno ("Noturno passou rua errada. Liguei e corrigi. 3ª vez") |
| 4 | Meia-noite | corte na coxa na usina, 26 min de estrada (torniquete, reservatório) | o noturno lê o Plano Noturno; o Saulo diz "sem maca" e recebe; o Bené escreve na mão "0h–6h: só a 01" |
| 5 | Nunes | hipoglicemia do próprio Sereno, em casa | rádios, mapa com alfinetes de tempo de chegada, a foto do rapaz de capacete azul, a conta de luz "Anselmo Nunes"; o Bené e o Márcio sentam no meio-fio |
| 6 | Quarenta minutos | motociclista com trauma de crânio na cruz do poste (intubação indicada, Glasgow 7) | o noturno trava quatro minutos no 2400; uma voz desconhecida invade a frequência; o Seu Anselmo conta a noite de 2019 |
| 7 | Quatro minutos (desfecho) | parada do Seu Anselmo na cruz: FV → AESP → FV | a USA chega em quatro minutos; vivo: UTI e "01 · 4 min" no caderno; morto: o Bené amarra a flor no poste. O Castro paga o pastel da Lurdinha ("2019 tá pago") |

**Coerência com a bíblia da 1.1** (`docs/ROTEIRO-1.1.md`, R3): naquela noite a 01 era Bené, Dr. Castro e Márcio, com a maca presa no Regional; o regulador era o Henrique; o plantonista que disse "sem maca" era o Saulo; a TARM era a Simone. **Nada disso é dito antes do dia 18**: as noites só plantam (o Bené evita a Av. Brasil pela Santos Dumont e senta no meio-fio, "a gente carrega umas noites"; o Henrique trava no endereço da cruz e diz "desta vez vai rápido"; o Saulo diz "sem maca" e recebe; o Márcio olha o poste; o Castro e a aposta do pastel de 2019). Do dia 18 em diante o Bené confessa ao Seu Anselmo ("Fui eu"); e, se o almoço do dia 18 contou quem regulava (`carla_sabe_regulador`, `ligou_henrique_2019` ou `guardou_2019`), o narrador junta: o Seu Anselmo corrige toda madrugada a voz do regulador daquela noite, sem saber. O nome do Rafael não aparece nas noites (só a cruz). A voz do noturno no rádio é a do **Henrique**, piorando noite a noite; se ele foi denunciado e afastado, é a **Dra. Paula**.

**Marcas que a noite grava** (para a campanha usar; `FieldSim.storyFlags()` no fim da noite, gravadas por `HomeSim.finishField`):

| Marca | Quando | Sugestão de uso na campanha |
|---|---|---|
| `noites_intervencao` (número) | toda noite | quantas noites na 01 (casa, Bené, finais) |
| `noite_cap1` … `noite_cap7` e `field_noite_*` | capítulo jogado | |
| `noite_capa_perguntou` | perguntou quem era o senhor de capa | |
| `noite_sereno_nome` | ouviu o apelido "Sereno" | Joana no almoço |
| `noite_leu_caderno` | leu o caderno (o noturno errando endereço) | D11/D12: prova além do bilhete do dia 10 (`anotou_henrique_d10`); argumento na sindicância |
| `noite_plano_noturno` | ouviu o Plano Noturno (só a 01 da 0h às 6h) | D14/D18: algo a contar para a Carla (parágrafo ou fonte extra da matéria) |
| `noite_sereno_radio` | soube do radioamador | |
| `noite_nome_anselmo` | conheceu o Seu Anselmo Nunes | D14: quando a Carla diz "Nunes" na porta, escolha "Eu conheço o seu pai" |
| `noite_viu_mapa`, `noite_viu_retrato` | viu o mapa dos alfinetes / a foto do capacete azul | D14/D18 |
| `noite_anselmo_historia` | ouviu do pai a noite de 2019 | D14 (a Carla não precisa explicar) e D18 (o Bené) |
| `noite_voz_no_radio`, `noite_motoboy_vivo` | capítulo 6 | |
| `noite_desfecho` + `noite_anselmo_vivo` **ou** `noite_anselmo_morreu` | desfecho | D20/finais: a "flor nova. De verdade." na cruz pode ser do Seu Anselmo (vivo) ou a que o Bené amarrou (morto); mural; epílogo da Carla e do Bené |

## 4. Conexões com a história

- **Dia 10.** Se o cônjuge (a Lúcia ou o Alex) estiver em casa, o rádio despacha a USB 03 para a **Rua das Acácias, 40**: a sua casa. Quem regula é o Dr. Henrique, com a voz arrastada. O Bené pergunta se não é o seu endereço; a USA 01 não pode largar o paciente que está atendendo. No fim da noite você encontra a Dona Zélia na observação do Regional.
- As cenas de "bico" de cada dia continuam valendo: o que acontece em casa enquanto você está na ambulância (o bolo com a vela torta, a redação do Liam, o envelope do vereador).
- O Bené é o mesmo condutor que fala com você no rádio da Regulação (treze anos de ônibus doze e dezoito de ambulância: "trinta e um anos de volante"). Ele dobra à noite até a aposentadoria do dia 20.
- Conquistas: **Dobra** (fazer uma noite), **Noite Limpa** (todos estáveis e no hospital certo), **Equipe Inteira** (esperar a PM no Bar do Neno).

## 5. Para quem escreve casos

Os casos ficam em `src/content/field.ts`; o motor em `src/engine/field.ts`; a tela em `src/client/screens/home/Intervencao.tsx`.

```ts
{
  id: 'avc',
  title: 'AVC dentro da janela',
  qrr: 3,
  radio: '{unit}, QRR 3. QTH Rua dos Ipês, 410, Jardim Norte. Mulher, 67, ...',
  addr: { rua: 'Rua dos Ipês', n: 410, bairro: 'Jardim Norte' },
  scene: { place: 'sala', light: 'noite', patient: { pose: 'sentado', age: 'idoso', sex: 'F', signs: ['face_torta', 'braco_caido'] } },
  see: ['Primeira impressão, linha por linha.'],
  vitals: { pa: '178x96', fc: '88', glic: '104' },      // o que o monitor mostra quando medido
  vitalsAfter: { },                                     // opcional: depois de estabilizado
  start: 80, decay: 0.6,                                // estabilidade inicial e piora por segundo
  scoop: true,                                          // tratamento definitivo é no hospital
  // treatOnScene: true,                                // parada: sair sem estabilizar é óbito no caminho
  oxy: { sat: 96 },                                     // SpO2 em ar ambiente: o motor gera cateter/Venturi/reservatório/intubação
  // oxy: { sat: 84, copd: true } · { sat: 95, need: 90, iam: true } · { sat: 92, min: 'reservatorio' } · { sat: 85, iot: true }
  // arrest: { start: 'ASSISTOLIA', rules: [{ from: 'ASSISTOLIA', to: 'FV', after: ['cagada', 'adrenalina'] }] },
  // destNote: { LOCAL: 'por que liberar não era certo' },
  actions: [
    { id: 'glicemia', label: 'Glicemia capilar', group: 'neuro', cost: 3, kind: 'critico', shows: ['glic'], say: 'Glicemia 104.' },
    { id: 'aas', label: 'AAS 300 mg', group: 'med', cost: 3, kind: 'dano', delta: -18, say: 'Por que piora.' },
    // needs: ['acesso'] = pré-requisito · after: ['auscultar'] = só aparece depois · until: ['x'] = some depois
    // when: ['FV', 'TV'] = só é certa nesses ritmos (wrongSay/wrongDelta fora deles) · satisfies: 'x' = também conta como x
    // sets: { minha_marca: true } = marca para a campanha (história das noites)
  ],
  dest: ['REG'],
  debrief: 'O que era e o que importava.',
  source: 'SAV AC21 · AP29',
  crew: ['BENÉ: fala que aparece durante a cena.'],
}
```

Regras de escrita: nada de "SAMU" nem "192"; USA em QRR 3; QTH da tabela de endereços; doses só onde a fonte é padronizada; cada dano explica por que piora; toda ação que mostra PA/FC já traz a SpO₂; nenhum horário fixo nas falas (use `{hora}`); o caso precisa fechar jogando "de livro" (`tests/field.test.ts` joga todos assim e exige paciente estável no destino ideal; `tests/field-1-1.test.ts` confere QRR, endereços, saturação, O₂, ritmos, clopidogrel e a história).

Capítulos da história: um caso com `special: true` e `story: { chapter, title, minDay, at?, crew?, open, before, epilogue, flags, afterwards? }`. Falas com `when: (s) => ...` (s.day, s.night, s.flag(k)) são escolhidas no começo da noite (rádio) ou no fim dela (epílogo, que já vê as marcas da própria noite).

## 6. Os casos

| Caso | O que salva | Armadilha | Fonte |
|---|---|---|---|
| Infarto inferior com pressão baixa | ECG, AAS + clopidogrel 300, acesso, Regional | nitrato; O₂ com 95% (erro leve) | SAV AC17 |
| Parada em FV | compressões, monitor, choque, adrenalina, amiodarona | intubar antes, pausar para o pulso | SAV AC5–AC8 |
| Parada em assistolia (vira FV) | compressões, monitor, CA-GA-DA, adrenalina; depois choque | choque na linha reta, parar cedo | SAV AC5–AC9 |
| Parada em AESP por engasgo | compressões, monitor, adrenalina, 5H/5T, pinça de Magill | choque | SAV AC5–AC8, AC3 |
| Hipoglicemia ("bêbado") | glicemia, acesso, glicose 50% | deixar com a PM; liberar em casa | SAV AC29 |
| AVC dentro da janela | glicemia, hora do início, Cincinnati, Regional | AAS, baixar a PA, UPA | SAV AC21 |
| Asma grave em criança | oxímetro, O₂ (Venturi ou reservatório), broncodilatador | água destilada, deitar | SAV AC22, APed19 |
| DPOC exacerbado | broncodilatador + ipratrópio, O₂ no alvo 88–92% (Venturi/cateter) | reservatório (hipercapnia), deitar | SAV AC23, BC10 |
| Anafilaxia com choque | adrenalina IM, deitar com pernas elevadas, O₂ | sentar, adrenalina IV em bolus, intubar sem estridor | SAV AC33 |
| Hemorragia na coxa (moto) | torniquete, cervical, O₂ com reservatório | soro aberto, recolocar o osso | SAV AT21, AP19 |
| Pneumotórax hipertensivo | retirada, descompressão, O₂ com reservatório | intubar antes de descomprimir | SAV AT12 |
| Parto iminente | avaliar, kit, amparar, aquecer, clampear | puxar a cabeça, segurar o parto | SAV AGO2, AGO4 |
| Crise que não para | proteger, O₂, glicemia, diazepam | colher na boca, segurar | SAV AC26 |
| Facada, cena insegura | esperar a PM, compressão, O₂ com reservatório, acesso | entrar antes | PE1, SAV AT1 |
| Trote na praça | avisar QTH sem vítima | procurar à toa | RM1 |
| Afogamento em criança | lateral, O₂, aquecer, hospital | apertar a barriga, liberar | SBV BPed26 |
| Inseticida agrícola | EPI, descontaminar, aspirar, O₂ com reservatório, atropina | provocar vômito | SAV ATox8 |
| *Cap. 1* Infarto na rodoviária | ECG, AAS + clopidogrel 75 (78 anos), acesso | clopidogrel 300; O₂ | SAV AC17 |
| *Cap. 2* Edema agudo de pulmão | pernas pendentes, O₂ com reservatório, dinitrato, furosemida | soro, deitar | SAV AC24 |
| *Cap. 3* Parada em TV sem pulso | compressões, monitor, choque, adrenalina, amiodarona | CA-GA-DA à toa | SAV AC5–AC8 |
| *Cap. 4* Corte na coxa (usina) | torniquete, O₂ com reservatório, acesso moderado | soro aberto | SAV AT1, AT21 |
| *Cap. 5* Hipoglicemia em casa | glicemia, acesso, glicose 50% | liberar em casa | SAV AC29 |
| *Cap. 6* Trauma de crânio (Glasgow 7) | cervical, intubação | máscara achando que resolve, hiperventilar | SAV AT5, AP7/AP10 |
| *Cap. 7* Parada FV → AESP → FV | choque, 5H/5T, adrenalina, choque de novo, amiodarona | choque na AESP | SAV AC5–AC8 |

Todos precisam da validação da equipe médica (ver `docs/VALIDAR_MEDICO.md`).
