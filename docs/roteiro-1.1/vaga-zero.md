# Vaga zero — o Dr. Saulo, a negociação, o Peixoto e o tempo parando

> Pedido do jogador: vaga zero é pilar da regulação; entra cedo (D3–D5); **toda** vaga zero é negociada; o colega do hospital diz que está lotado e argumenta para não receber; o regulador não precisa concordar e tem argumentos inteligentes ("se a tomografia não mostrar nada, tiro o paciente e levo pra UPA"); sem acordo, a viatura fica presa até surgir vaga; colega irredutível que desrespeita a autoridade sanitária → passar ao Peixoto, **1 vez por plantão**; o momento lembra o clímax de *Papers, Please* (o tempo parece parar).
> **Não pode ficar mais difícil:** a negociação tem saída boa sempre alcançável com argumentos certos; a punição de errar é **tempo de viatura presa**, não game over.

---

## 1. O Dr. Saulo Brandão

- **Quem:** 33 anos, clínico, plantonista do pronto-socorro do Hospital Regional de Santa Aurora há seis anos (desde 2019, seis meses de formado). Mora sozinho, tem uma filha de 4 anos (Lívia) que vê a cada quinze dias e para quem grava áudio de boa-noite no estacionamento.
- **Jeito (o que o torna memorável na hora):**
  - Atende sempre igual: *"PS do Regional, Saulo."* Nunca diz "doutor".
  - **Come bolacha água e sal no telefone.** O som da bolacha é a assinatura sonora dele (áudio: crec).
  - **Fala em números:** *"Trinta e oito no corredor, duas macas, um tomógrafo, um eu."*
  - Chama o regulador de **"Regulação"** até respeitar você; depois, pelo nome (`{nome}`) — a troca é o marcador do arco.
  - Ironia seca, nunca grosseria gratuita; quando perde a paciência, fica educado demais ("Pois não, Regulação. Mais alguma coisa, Regulação?").
- **Por que é difícil:**
  1. **A folha das sete** (R2): a diretoria entrega todo dia uma folha com "leitos disponíveis: 0" — seis leitos do 4º andar ficam "reservados" para o convênio Saúde+ Vida (da mesma OS). Ele sabe que é mentira e repete.
  2. **2019** (R3): seis meses de formado, ele leu a folha para um regulador às duas da manhã: "sem maca". O regulador não insistiu. Um rapaz morreu a quatro quadras. Desde então ele tem medo de aceitar (paciente que morre no corredor dele) **e** medo de recusar (paciente que morre na rua). Ele resolve o medo empacando.
  3. **Processo:** em 2022 aceitou uma vaga zero, o paciente morreu no corredor e o processo veio só no nome dele. *"Vaga zero é vocês mandarem e eu responder."*
- **O que o amolece:** argumento técnico certo, compromisso de devolução honesto, empatia sem bajulação, o regulador que **cumpre o que promete** (se você prometeu tirar o paciente com a tomografia normal e a viatura volta para buscar, ele lembra).
- **O que o endurece:** mentira sobre gravidade (ele descobre quando o paciente chega), ameaça de CRM/denúncia, grito, "o Peixoto mandou" falso, "é parente de vereador".

### Variável `saulo_confianca` (0–5, começa em 0)
- +1 por vaga zero resolvida **sem** Peixoto e sem mentira; +1 se cumpriu uma promessa de devolução; +2 se emprestou a USA no D11; +1 se sentou com ele no almoço do D19.
- −1 por mentira de gravidade descoberta, ameaça, grito ou "o Peixoto mandou" falso.
- Efeitos: começa cada negociação com resistência menor (ver §3); a partir de 2 ele abre leitos do 4º andar no D15; a partir de 2 aceita o pedido de leito do almoço do D19; a partir de 3 chama você pelo nome; 5 = epílogo "o Saulo do Regional".

### Arco do Saulo
| Dia | Momento | O que muda nele |
|---|---|---|
| D3 | Conceição (1ª vaga zero) | Antagonista. "Vocês adoram mandar e esquecer. Em dezenove eu aprendi." |
| D5 | Gildásio (TRM) | Irredutível; o Peixoto resolve com a frase do quarto andar. Saulo fica sem graça. |
| D8 | Otávio (TCE anticoagulado) | O argumento da tomografia; ele aceita a promessa. Se a tomo vem com sangramento: *"Sua tomografia não veio limpa. Ainda bem que você mandou."* |
| D9 | Everton (TCE grave), 11:00 | Retenção vira negociação: decide se às 14h haverá o rendez-vous. |
| D11 | **Inversão (almoço)** | Ele pede uma USA para transferir. "Agora eu entendi como soa." |
| D15 | MCI | Corredor a 160%. Se confiança ≥ 2, abre 2 leitos do 4º andar "por conta própria". |
| D16 | **Virada R2** (14:40) | Liga sem ser chamado: a folha, os seis leitos, parte de 2019. |
| D18 | Odete / Jonathan | O leito aparece em 4 min para a mãe do vereador; o argumento "se tem pra ela, tem pro Jonathan" passa. |
| D19 | **Clímax: Cida** | Almoço em pessoa. 18:30: recebe "pelo nome dela". |
| D20 | Henrique | "Manda. Eu conheço o Henrique." (ele atendia os telefonemas bêbados do Henrique de madrugada: *"Ele me ligava às três pra perguntar se tinha vaga. Não tinha paciente. Era só pra perguntar."*) |

---

## 2. Quando acontece (ligações com vaga zero)

O motor já tem: retenção no Regional (`ShiftSim.onHospital`, pedido de rádio `kind:'vaga'`), `noVacancy` (D19–D20) e o roteiro `vagazero` (guides.ts, infarto fixo). **1.1:** a negociação vira um **diálogo próprio** (tela de vaga zero) que se abre quando:
- (a) o jogador carimba destino **REG** numa ligação marcada `vagaZero: {...}` (lista abaixo) — o telefone do Regional toca de volta "PS do Regional, Saulo", ou
- (b) uma viatura chega ao Regional e o dia tem lotação (`noVacancy` ou evento de retenção) → o pedido de rádio "Sem maca" ganha a opção **"Ligar pro Regional e negociar"** que abre a mesma tela.

| Dia | Ligação | Caso | Recurso específico que só o Regional tem | Resistência inicial | Peixoto? |
|---|---|---|---|---|---|
| **D3** | d03_conceicao (10:40) | IAM atípico, diabética, supra no eletro da USA | hemodinâmica (cateterismo) | 3 | **não** (tutorial; a Simone sopra dicas) |
| **D5** | d05_pedreiro (12:00) | queda de 6 m, sem sensibilidade nas pernas (TRM) | tomografia, ortopedia/neurocirurgia (sobreaviso), sala vermelha | 5 (irredutível de propósito) | **sim — 1ª vez** |
| D6 | d06_avc (07:40) — opcional | AVC na janela; a esposa quer o São Lucas | tomografia + trombólise + neuro | 3 | sim |
| **D8** | d08_anticoag (09:20) | TCE em anticoagulado, vômitos, sonolento | tomografia (UPA não tem tomógrafo), neurocirurgia | 4 | sim |
| **D9** | d09_moto (retenção 11:00) | TCE grave intubado | neurocirurgia, UTI | 4 | sim |
| D11 | almoço (inversão) | ele pede USA | — | — | — |
| D14 | d14_cefaleia (07:20) — opcional | suspeita de HSA | tomografia (+ punção se TC normal) | 3 | sim |
| **D15** | MCI (17:00–18:45, `regionalLotado`) | múltiplas vítimas | plano de catástrofe, centro cirúrgico | 4 (2 se confiança ≥ 2) | sim |
| **D16** | d16_osvaldo (14:30) | sepse em idoso de 84 | sala vermelha, antibiótico, droga vasoativa, UTI | 3 | sim (é o pai dele: o Peixoto **não pode** negociar o próprio pai — "impedimento"; a escalada vai para a Simone ligar para o diretor clínico: menos efetiva) |
| **D18** | d18_odete (15:30) e d18_moto (17:00) | IAM inferior / fratura exposta de fêmur com choque | hemodinâmica / centro cirúrgico | Odete 0 (leito aparece); Jonathan 4 → 0 com o argumento novo | sim |
| **D19** | d19_infarto (07:10) e **d19_cida (18:30)** | IAM / **AVC na janela** | hemodinâmica / tomografia + trombólise | 4 / Cida: 1 se `saulo_leito_cida`; senão 3 | sim (exceto se `peixoto_endureceu`) |
| **D20** | d20_final (18:58) | PCR revertida (Henrique) ou Seu Dito | UTI | 0 ("Manda.") | — |
| D20 | d20_faca, d20_edema — opcionais | facada com choque / EAP | centro cirúrgico / UTI | 3 | sim |

> As "opcionais" só abrem se o jogador carimbar REG; se carimbar UPA quando o caso precisa do Regional, o rádio do destino errado já existe (`radio.dest`).

---

## 3. A mecânica da negociação

**Tela:** o telefone do Regional ocupa a mesa; a central escurece (ver §6). Do lado esquerdo, o Saulo fala; do lado direito, 3–4 **cartões de argumento** do regulador (sorteados de um conjunto por caso, sempre com pelo menos **um bom** e **um ruim**). Um medidor discreto **"Resistência"** (0–5) aparece como a respiração dele no fone (rápida = resistente; lenta = cedendo) — não como barra numérica (mantém o clima).

**Rodadas:** no máximo **4**. Cada rodada: o Saulo diz uma objeção → o jogador escolhe um cartão.
- Argumento **bom** para a objeção: Resistência −2.
- Argumento **meio-bom** (certo, mas não responde à objeção): −1.
- Argumento **ruim**: +1 e, se for mentira/ameaça, `saulo_confianca` −1.
- Resistência ≤ 0 → **aceita** ("Manda."). A viatura entrega e libera a maca (sem retenção).
- Fim das 4 rodadas com Resistência > 0 → **sem acordo** (§4) — **ou** o botão **"Passar ao Dr. Peixoto"** (§5), se disponível.
- Resistência inicial: tabela da §2 menos `saulo_confianca` (mínimo 1, exceto quando a tabela diz 0).
- **Facilidade (não pode ficar difícil):** no modo "Plantão leve"/dificuldade baixa, cada cartão bom vale −3; e o cartão bom aparece sempre marcado com o post-it azul da Simone no D3.

**Tempo:** o relógio do plantão **para** durante a tela (tempo parando). Cada rodada tem um "pavio" visual de ~12 s reais (o fone chiando); se acabar, o Saulo diz *"Regulação? Caiu? ...Tô com gente morrendo aqui."* e conta como argumento ruim (+1). Opção de acessibilidade: sem pavio.

### 3.1 As objeções do Saulo (com o que responde bem)

| Objeção (fala) | É verdade? | Resposta **boa** | Meio-boa | **Ruim** |
|---|---|---|---|---|
| **O1 "Tô com trinta e oito no corredor e duas macas."** | Sim. | "Vaga zero não é leito, Saulo. É porta. Eu preciso que você receba na sala vermelha e solte a minha maca. Se a minha USA ficar presa, a próxima parada da cidade fica sem viatura." | "Eu sei que tá lotado. Eu também tô com uma cidade." (empatia) | "Lotado todo mundo tá." |
| **O2 "Não tenho leito de UTI."** | Sim. | "Não tô pedindo UTI. Tô pedindo avaliação e estabilização no PS. A central de leitos procura a UTI depois, com ele vivo." | "A regulação procura a UTI pra você." | "Arruma um leito." |
| **O3 "Leva pra UPA Norte."** | Depende. | (por caso) "A UPA não tem **hemodinâmica** / **tomógrafo** / **cirurgião**. Ele precisa de X em Y minutos." (ver §3.2) | "A UPA tá com quatro horas de espera." | "A UPA é pior que vocês." |
| **O4 "Manda pro São Lucas."** | Não (particular, sem convênio, sem neuro no fim de semana). | "O São Lucas é particular e não tem neurologista/hemodinâmica de plantão hoje. A referência pactuada pra esse caso é você." | "Ela não tem convênio." | "O São Lucas é de rico." |
| **O5 "Não tenho neurocirurgião, é sobreaviso."** | Sim. | "Sobreaviso é pra isso: quem chama é o PS, quando o paciente chega e a tomografia mostra. Ele vem em meia hora. A rua não chama sobreaviso." | "Liga pra ele." | "Problema seu." |
| **O6 "Se morrer no meu corredor, o processo é meu."** | Sim (foi). | "Eu registro agora: vaga zero às {hora}, regulador {nome} Moura, plantonista Saulo. A responsabilidade é compartilhada e tá escrita. Você não vai responder sozinho." | "Eu assumo." (sem registro) | "Se morrer na rua, o processo é seu também." (ameaça) |
| **O7 "Já recebi três vagas zero hoje."** | Às vezes. | "Então você já sabe fazer. E sabe que as três tão vivas." (só se as três anteriores foram para lá e vivas; senão:) "E eu vou te mandar a quarta porque ela precisa. Amanhã você me cobra." | "Hoje tá difícil pra todo mundo." | "Problema da OS." |
| **O8 "Isso é caso de UPA, Regulação."** | Às vezes **é** (armadilha: casos leves). | Se o caso precisa do Regional: "Ele tem X (sinal de gravidade). UPA não resolve." Se **não** precisa: aceitar e desviar — **é a resposta certa** (há cartões "Você tem razão, desvio pra UPA"). | — | insistir num caso que não precisa (Resistência +2, `saulo_confianca` −1) |
| **O9 "Você não é médico daqui pra me dizer o que fazer."** | — | "Não sou. Sou a regulação. Vaga zero é prerrogativa do regulador, e a regulação responde junto. Eu não tô te mandando, tô te avisando que ele vai chegar." (autoridade sanitária, sem grito) | "Sou médico também." | "Eu vou te denunciar no CRM." (ameaça; endurece) |
| **O10 "A tomografia tá em manutenção até as dez."** (D6) | Sim. | "Então chama o neuro e recebe: se a tomo não voltar até nove e meia, eu transfiro pra Rio Claro com a mesma USA, sem perder a janela." | "Até as dez dá tempo." (não dá: janela) | "Tomografia quebrada é desculpa." |

### 3.2 O argumento da tomografia (o do jogador) e outros compromissos de devolução

O jogador pediu explicitamente: *"se a Tomografia não evidenciar nada, tiro o paciente daí e levo pra UPA"*. É o **compromisso de devolução**: o regulador se compromete a tirar o paciente do Regional se o exame que só o Regional tem vier normal. É honesto e diminui o peso do pedido. Cartões de compromisso (contam como **bons** quando se aplicam ao caso):

| Compromisso | Quando é medicamente correto | Quando **não** é |
|---|---|---|
| **"Se a tomografia vier sem sangramento e ele estiver acordado e bem, eu tiro e levo pra UPA Norte observar. A viatura volta pra buscar."** | TCE leve/moderado (Glasgow 13–15) em anticoagulado, idoso com queda e cabeça batida (D8 Otávio, D20 Arnaldo, banco `queda_idoso.tce_anticoagulado`). | TCE grave (Glasgow ≤ 8, intubado: D9 Everton) — o paciente precisa ficar de qualquer jeito; AVC na janela (tomografia normal **não** libera: é quando se trombolisa); cefaleia súbita com suspeita de HSA (tomografia normal exige punção lombar no hospital). |
| **"Se o eletro do PS não tiver supra e a troponina vier negativa, eu devolvo pra UPA."** | Dor torácica indefinida, sem supra no eletro da USA. | Infarto **com supra** confirmado (D3 Conceição, D19 Vilmar, D18 Odete): precisa de cateterismo — não se devolve. |
| **"Se a radiografia não mostrar fratura, eu tiro."** | Trauma de extremidade sem instabilidade (casos USB). | Fratura exposta com choque (D18 Jonathan). |
| **"Fica só até a neuro ver. Se não for cirúrgico, eu acho outro lugar."** | TRM (D5 Gildásio), TCE grave. | — |

**Cumprir a promessa:** quando o compromisso é usado e o exame vem normal, o motor abre um **pedido de rádio** horas depois: *"Regional: a tomografia do Seu Fulano veio limpa. Vocês vêm buscar?"* → "Mandar a USB buscar (20 min)" (cumpre: `saulo_confianca` +1) / "Agora não dá" (descumpre: −1; o Saulo lembra na próxima: *"Da outra vez você prometeu buscar."*). Se o exame vem alterado: *"Sua tomografia não veio limpa, {nome}. Ainda bem que você mandou."* (`saulo_confianca` +1 de graça).

**Nuance médica (para a frente médica conferir, `// [validar]`):**
- D8 Otávio está **sonolento e vomitou duas vezes** → o compromisso é **meio-bom** aqui: o Saulo rebate *"Sonolento e vomitando não é tomo e tchau, Regulação."* → o melhor cartão é o técnico ("anticoagulado com rebaixamento, precisa de tomografia agora; a UPA não tem tomógrafo") e o compromisso vem como segundo argumento. Isso **ensina** quando o argumento serve.
- Vaga zero = o hospital de referência não pode recusar o paciente grave encaminhado pela regulação quando não há leito; o paciente é recebido na sala de emergência e a regulação segue procurando leito definitivo; responsabilidade compartilhada e registrada. (Fundamento: normas do CFM sobre regulação médica de urgências e a Política Nacional de Atenção às Urgências — conferir artigo exato em `docs/fontes/` `// [validar]`.)

### 3.3 Argumentos ruins (sempre presentes para tentar)
- **Mentir a gravidade** ("Ele tá parando!" quando não está) → funciona na hora (−2), mas quando a viatura chega o Saulo liga: *"Parando? Ele tá comendo bolacha comigo."* → `saulo_confianca` −2 e na próxima a Resistência começa +2.
- **Ameaçar** ("CRM", "Ministério Público", "vou gravar") → +1, `saulo_confianca` −1. *"Grava. Grava também os trinta e oito do corredor."*
- **Carteirada falsa** ("O Peixoto mandou") → +2 se o Peixoto ainda não negociou hoje; o Saulo liga para o Peixoto: *"Peixoto, você mandou?"* — e o uso do Peixoto do dia é gasto (§5).
- **"É parente de vereador"** → no D18 com a Odete, **funciona** (Resistência 0 na hora: é a prova do R2); em qualquer outro dia, +2: *"Aqui parente de vereador vai pro quarto andar, Regulação. Você sabe disso?"* — e é assim que, no D18, quem jogou "errado" antes entende a virada.
- **Gritar** → +1. Áudio: o Saulo afasta o fone; ouve-se o corredor.

---

## 4. Sem acordo: a viatura presa

- A viatura chega ao Regional e **fica retida** ("RETIDA — maca presa no Regional") por **40 min** (D3–D9) ou **60 min** (D15–D20, lotação), com contagem visível no painel da frota.
- O paciente é recebido no corredor (ninguém morre por falta de acordo em si: o PS recebe; o custo é a **viatura**). Isso é fiel ao que o jogador descreveu: *"minha ambulância fica presa até que surja vaga"*.
- **Consequência em cadeia:** a próxima ligação vermelha que precisar de USA pode ficar sem USA livre → rendez-vous, USB, ou espera (o sistema atual decide o desfecho).
- **Opção "Desviar para a UPA Norte":** continua existindo; correta só quando o caso não precisa do Regional (O8). Para infarto com supra, AVC na janela, TRM, TCE grave e choque hemorrágico, desviar é **destino errado** (rádio `dest`, desfecho pior), como hoje.
- **Liberação antecipada:** a cada 20 min de retenção, o pedido de rádio volta com "Tentar de novo" (nova negociação com Resistência −1).

## 5. O Dr. Peixoto como recurso (1 vez por plantão)

- **Disponível a partir do D5** (no D3 e D4 a Simone diz: *"Se ele empacar, tem o Peixoto. Mas o Peixoto só pega uma por dia. E cobra."*). Botão no telefone do Regional: **"Passar ao Dr. Peixoto"**, aceso quando: (a) a Resistência não baixou de 3 depois de 2 rodadas, ou (b) o Saulo disse uma objeção de desrespeito (O9) ou recusou "por birra" (três objeções repetidas).
- **O que acontece:** a tela muda para o interfone; o Peixoto ouve 2 frases e liga ele mesmo. Resultado quase sempre **aceito** (95%) — porque ele **sabe do quarto andar** (R2): *"Saulo, eu sei do quarto andar. Você sabe que eu sei. Recebe."*
- **O custo:**
  - Gasta o uso do dia (não volta).
  - **Painel:** o Peixoto negocia "pelo painel" — viatura presa estoura a meta dele. *"Eu não faço isso por você. Faço pelo rostinho. Mas faço."* Se no mesmo dia o jogador já estourou a meta de USA, ele cobra: desgaste +2.
  - `saulo_confianca` não sobe naquela negociação (*"Precisou do chefe, Regulação?"*).
- **Variações pelo arco:**
  - **D16 (pai do Peixoto):** o Peixoto **não** pode negociar o próprio pai (impedimento, como o 9-C do protagonista no D9). O botão vira **"Pedir à Simone que ligue pro diretor clínico"** (60% de sucesso).
  - **D18+ se `peixoto_caiu`:** quem atende é a **Dra. Heloísa Rangel** (interina): sucesso 80%; ela não sabe do quarto andar, usa o regimento: *"Doutor Saulo, eu estou gravando a ligação e anotando o horário. Receba."* Se `saulo_fonte`, ela sabe (o jogador contou): 100%.
  - **D19 se `peixoto_endureceu`** (pai morreu): ele recusa uma vez: *"Negocia ou desvia, {dr}. Hoje eu não ligo pra ninguém."* (o uso **não** é gasto; mas não ajuda naquela).
  - **Peixoto fonte da matéria (D19–D20):** *"Manda as que precisar. E me passa todas. Hoje eu ligo pra quantas forem."* — no D19, o Peixoto-fonte negocia **2 vezes**.

## 6. O tempo parando (encenação para Arte e Áudio)

Referência: o clímax de *Papers, Please* (o homem que corre para a fronteira; o mundo congela e o jogador decide o tiro). Aqui: **o mundo congela e o jogador decide a palavra.**

**Entrada (≈1,2 s):**
1. O telefone do Regional toca com um timbre diferente de todos os outros (mais grave, dois toques curtos).
2. O **relógio digital da central** trava no minuto; os dígitos ficam vermelhos e param de piscar o ":" (o detalhe que o jogador percebe: o ":" parou).
3. **Vinheta** escura fecha a tela em 20%; a central (Simone, monitores, quadro de cortiça) **dessatura** para tons de cinza azulado; só a mesa do jogador e o telefone ficam em cor.
4. **Som:** todo o ambiente da central passa por um filtro passa-baixa (como ouvir debaixo d'água); entra um **pulso grave** (≈ 60 bpm, coração) e uma nota sustentada de sintetizador; o chiado do fone fica em primeiro plano. A bolacha do Saulo: crec.
5. A Simone, em cinza, fica congelada no meio do gesto (caneta no ar). Se é o D19, ela está **olhando para você** (o único rosto virado para a câmera).

**Durante:**
- O pulso grave **acelera** quando a Resistência sobe e **desacelera** quando cai.
- Cada cartão escolhido "carimba" com um som seco de papel (o mesmo do carimbo de recurso).
- O pavio de cada rodada é a **fita de papel do fax** saindo devagar da impressora ao lado (objeto já de cena).

**Saída:**
- **Acordo:** o Saulo diz "Manda." — silêncio de 0,5 s; o ":" do relógio volta a piscar; a cor volta de dentro para fora (da sua mesa para as bordas); o ambiente volta de uma vez (telefones, ventilador). A Simone completa o gesto (cola um post-it **azul** no seu monitor: "VAGA ZERO ✓").
- **Sem acordo:** o fone dá o sinal de ocupado; o relógio salta os minutos perdidos de uma vez (o jogador vê o tempo "cobrar"); a cor volta lentamente; o painel mostra "RETIDA".
- **Peixoto:** a tela corta para o interfone; a cor volta só no rosto do Peixoto no retrato; ele diz a frase; volta.
- **D19 (Cida) — versão especial:** ver §7.

---

## 7. Cenas prontas

### D3 — Conceição (1ª vaga zero, tutorial)
*Carimbo REG. A Simone puxa a cadeira para perto.* SIMONE (baixo): *"Agora ele vai dizer que tá lotado. Não discute o lotado. Fala do que só ele tem."*
SAULO: PS do Regional, Saulo. *(crec)* Infarto? Regulação, tô com trinta e oito no corredor e duas macas. Leva pra UPA.
→ cartões: **"A UPA não faz cateterismo. Ela tem supra no eletro da USA, sessenta e sete anos, diabética. Precisa de hemodinâmica."** (bom) / "A UPA tá com quatro horas de espera." (meio) / "Lotado todo mundo tá." (ruim)
SAULO: A hemodinâmica tá com um. Ela vai esperar no corredor.
→ **"Vaga zero não é leito. Recebe na sala vermelha e solta a minha maca. A hemodinâmica chama quando liberar."** (bom) / "Arruma um jeito." (ruim) / "Eu registro com o seu nome e o meu." (meio aqui)
SAULO: *(pausa)* Vocês adoram mandar e esquecer. Em dezenove eu aprendi. *(crec)* ...Manda. E não esquece.
*(Nota: o almoço do D3 vem depois desta ligação; a partir do D5, se `castro_saulo`, aparece o cartão de empatia "Eu sei que já mandaram e esqueceram de você" — conta como bom contra O6 e O9.)*

### D5 — Gildásio (TRM) — o Saulo irredutível e o primeiro Peixoto
SAULO: Queda de andaime? Não tenho ortopedia, não tenho neuro, não tenho maca. Manda pra Rio Claro.
→ "Rio Claro é uma hora de estrada com coluna instável." (bom) …
SAULO: Neuro é sobreaviso. Não vou chamar sobreaviso pra paciente que nem chegou.
→ **"Sobreaviso é pra isso. Quem chama é o PS quando a tomo mostra. A rua não chama sobreaviso."** (bom)
SAULO: Não é birra, Regulação. É folha. Tá escrito aqui: zero. *(ele lê)* "Leitos disponíveis: zero." Você quer que eu minta pra folha?
*(Resistência não cai abaixo de 2 de propósito — tutorial do Peixoto.)* → botão **Passar ao Dr. Peixoto** pisca.
PEIXOTO (interfone): Me dá ele. *(liga)* Saulo? Peixoto. ...Eu sei, eu sei, a folha. Saulo, eu sei do quarto andar. Você sabe que eu sei. Recebe o pedreiro. *(desliga)* Recebeu. Agora me devolve a USA pro painel, {dr}. Eu não faço isso por você. Faço pelo rostinho. Mas faço.
*O jogador não sabe o que é "o quarto andar". (pista R2)*

### D8 — Otávio (TCE em anticoagulado): o argumento da tomografia
SAULO: Idoso caiu e bateu a cabeça. Leva pra UPA observar.
→ **"Anticoagulado, vomitou duas vezes, sonolento. Precisa de tomografia agora. A UPA não tem tomógrafo."** (bom) / **"Se a tomografia vier limpa e ele acordar bem, eu tiro e levo pra UPA. A viatura volta pra buscar."** (meio-bom aqui) / "Ele tá parando!" (mentira)
SAULO (se o compromisso veio antes do técnico): Sonolento e vomitando não é tomo e tchau, Regulação.
SAULO (se o técnico veio antes): ...E se a tomo vier limpa?
→ **compromisso** (agora é bom).
SAULO: Fechado. Se vier limpa, você busca. Se não vier, ele é meu. *(crec)* Manda.
*(À tarde, pedido de rádio: "Regional: a tomografia do Seu Otávio mostrou sangramento. Neuro já levou pro centro." → SAULO: "Sua tomografia não veio limpa, {nome}... Regulação. Ainda bem que você mandou." `saulo_confianca` +1.)*

### D9 — Everton (retenção das 11:00)
*Rádio da USA 02 (ou 01): "Doutor, tão segurando a nossa maca. Paciente intubado, TCE. Dizem que não tem leito."*
→ "Ligar pro Regional e negociar" (abre a tela) / "Aguardar" (retida até 15:30) / "Desviar" (errado).
SAULO: Intubado na minha maca não fica. Não tenho UTI.
→ **"Ele não precisa ficar na sua maca. Precisa da sala vermelha e da neuro. Solta a maca da minha USA, que eu tenho uma cidade e uma viatura só depois do almoço."** (bom) …
*(Pista R2 no rádio da equipe ao fim, independente do acordo: "Doutor, tem maca vazia no elevador de serviço subindo pro quarto. Aqui embaixo diz que não tem.")*
Acordo → USA liberada às 11:25 → às 14:00 o jogo garante uma USA livre e o rendez-vous das 14:20 continua possível (`d9_negociou`). Sem acordo → retida até 15:30 (atual).

### D16 — Osvaldo + a virada R2 (14:30 / 14:40)
SAULO (14:30, normal): Sepse em idoso de oitenta e quatro? UPA dá antibiótico. Manda pra UPA.
→ **"Ele tá confuso, com pressão baixa e respirando rápido. É choque séptico: precisa de sala vermelha, droga vasoativa e UTI. A UPA Norte tá com quatro horas de dengue."** (bom)
*(o Peixoto não pode negociar o pai: botão vira "Pedir à Simone que ligue pro diretor clínico")*
**14:40 — o telefone toca sozinho.** Texto da virada no ROTEIRO (Parte 1, R2).

### D18 — Odete e Jonathan
*Odete, 15:30:* SAULO: Dona Odete Matos? *(silêncio; papel)* ...Leito no quarto andar. Sobe direto. *(Resistência 0. O jogador não precisou de nada.)*
RÁDIO (15:50): "Doutor, a mãe do vereador ganhou leito em quatro minutos. A gente nunca viu isso."
*Jonathan, 17:00:* SAULO: Fratura exposta de fêmur? Tô sem centro cirúrgico livre e sem leito.
→ cartão novo: **"Se tem leito pra mãe do vereador, tem pro Jonathan."** (Resistência −5).
SAULO: *(longa pausa)* ...Eu mereci essa. Manda.

### D19 — **Clímax: Dona Cida, 18:30**
*A ligação da Cida (AVC na janela, fala arrastada) é decidida; carimbo REG. O telefone do Regional toca antes de você pegar.*
**Encenação especial:** o tempo para como sempre, mas desta vez **a Simone não fica cinza**: ela se levanta e fica de pé atrás da sua cadeira (único personagem em cor além de você). O pulso grave começa no ritmo da respiração da Cida que ainda está na outra linha (em espera). No quadro de cortiça, o post-it da Cida ("Liga quase todo dia... Mora sozinha", do D1) fica em cor.

**Com `saulo_leito_cida`:**
SAULO: {nome}? É ela? A senhora que não tinha ligado?
→ **"É ela. Dona Aparecida. Setenta e nove. Falou comigo todo dia por vinte dias."**
SAULO: Então manda. Eu recebo. Pelo nome dela. *(crec)* O leito tá aqui desde o almoço, com uma bolacha em cima pra ninguém pegar.
*(sem rodadas; a cor volta devagar enquanto a Simone, atrás de você, solta o ar.)*

**Sem o leito, `saulo_confianca` ≥ 2:**
SAULO: AVC? Tomo tá com fila de três.
→ **"Ela tá dentro da janela, Saulo. Começou às dezoito e quinze. Tomografia e trombólise. Não dá pra fila."** (bom)
SAULO: ...Quem é ela?
→ **"Uma senhora que ligava todo dia pra Regulação só pra ouvir uma voz."** (bom — o único argumento "não técnico" que conta como bom no jogo inteiro, e só aqui)
SAULO: *(pausa)* Manda. Põe o nome dela na ficha inteiro. Eu quero ler.

**Sem o leito, confiança < 2:** árvore normal (Resistência 3); Peixoto disponível (exceto `peixoto_endureceu`). Mesmo sem acordo, a USA fica retida mas **a Cida é recebida no corredor e a tomografia é feita** (a retenção pesa na frota, não na Cida — o desfecho dela depende do tempo de chegada e da decisão da ligação, como hoje).

**Saída especial (acordo):** o relógio volta a andar; a Simone cola um post-it **azul** escrito à mão: "CIDA — VAGA ZERO — 18:36" e, embaixo, menor: "Ela ia gostar de saber que foi você."

### D20 — Henrique (não denunciado)
SAULO: É o Henrique, né? Do noturno? *(sem crec)* Manda. Eu conheço o Henrique. Ele me ligava às três da manhã pra perguntar se tinha vaga. Não tinha paciente. Era só pra perguntar. Eu achava que vocês sabiam.
*(Resistência 0. Tela de vaga zero dura 5 segundos: só a fala. O tempo para e volta.)*
