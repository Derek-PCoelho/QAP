# ROTEIRO 1.1 — bíblia narrativa de "QAP — Emergency Dispatch"

> Frente "Roteiro" da 1.1. **Documento, não código.** As frentes de implementação seguem a **Parte final (Roteiro do dia N)**; as partes de 1 a 11 explicam o porquê e trazem os textos.
> Fonte principal: `docs/PEDIDOS-1.1.md` (o pedido do jogador). Base: `docs/estudo-1.0.4/01–04`, `docs/GDD-original.md` (§7 "A Teia"), `docs/HANDOFF.md`, `docs/FEEDBACK-1.1.md`.

## Arquivos

| Arquivo | O que tem |
|---|---|
| **este** | regras de escrita, espinha dorsal (reviravoltas), elenco, dinheiro, Henrique e o bilhete, aulas de desenho, calendário, correções de continuidade e o **roteiro do dia 1 ao 20** |
| `docs/roteiro-1.1/flags.md` | as ~95 flags gravadas e nunca lidas: usar (onde, como, texto) ou retirar |
| `docs/roteiro-1.1/almoco.md` | almoço das 13h, dia a dia (texto pronto, escolhas) |
| `docs/roteiro-1.1/ida-volta.md` | ida e volta do plantão, dia a dia |
| `docs/roteiro-1.1/casa.md` | casa explorável: cômodos e o que muda em cada um, em cada um dos 20 dias |
| `docs/roteiro-1.1/vaga-zero.md` | o Dr. Saulo do Regional, árvore de argumentos, Peixoto, viatura presa, o "tempo parando" |
| `docs/roteiro-1.1/trotes-folgados.md` | redistribuição dos trotes + 8 ligações de folgados com "piii" |
| `docs/roteiro-1.1/finais.md` | os quatro finais reescritos, epílogos por fio, encenação para a arte |
| `docs/roteiro-1.1/campanhas.md` | sementes das campanhas do Henrique, do Peixoto e do Bené |

---

## Parte 0 — Regras de escrita (valem para todas as frentes)

- **Tom:** interior paulista/mineiro, fala de telefone, frase curta, humor seco, ternura sem melado. **Nada de sermão.** Nada de gore: sangue é "pano encharcado", morte é "a cadeira vazia".
- **Proibido no texto do jogo:** "SAMU", "192". O serviço é **a Regulação**; a sala é **a central**. Bombeiros (193), PM (190) e CVV (188) podem aparecer.
- **Tokens:** protagonista `{nome}` (Camille/Thiago, renomeável), sobrenome `Moura`; gênero `{m:masc|fem}`; cônjuge `{c:Lúcia|Alex}` (1º = Lúcia, esposa do Thiago; 2º = Alex, marido da Camille), `{Oconj}`, `{doconj}`, `{CONJ}`; Liam chama `{pai}`; Zélia chama `{filho}`; `{dr}`/`{Dr}`.
- **Ids internos não mudam:** `who:'DAVI'` = Liam; `who:'LUCIA'` = cônjuge; `who:'ZELIA'`. Neste documento escrevo `LIAM:` e `CÔNJUGE:` para ler melhor.
- **Família (decisão do jogador):** Camille → marido **Alex**, branco, cabelo preto. Thiago → esposa **Lúcia**, asiática de pele clara, bonita. **Liam**, 8 anos (faz 9 no dia 15), branco. **Dona Zélia**, 74, diabética em insulina, mãe do protagonista. **Ozzy**, Lulu da Pomerânia laranja, late para moto e dorme no tapete.
- **Medicina:** conferir com `docs/fontes/`. Novidade médica leva `// [validar]`. Infarto: O2 só com SpO2 < 90% (decisão do jogador).
- **Não pode ficar mais difícil.** Toda escolha nova tem um caminho "honesto e sem saber" que não pune: as consequências são de história, Laços e texto, não de game over.
- **Regra de ouro da 1.1:** *nenhuma escolha sem eco.* Cada flag gravada aparece de novo — de preferência **duas vezes**: uma logo (mesmo dia ou no seguinte) e uma tarde (dias depois, ou no final).
- **Xingamento:** nunca escrito. No áudio, "piii"; na transcrição, símbolos (`#%!#@$`). Palavras engraçadas que não são palavrão podem ficar ("songamonga", "mocorongo", "sacripanta").

---

## Parte 1 — Espinha dorsal: as cinco reviravoltas

O jogador disse: "faltaram plot twists, tramas, tensões, conexões inteligentes". A 1.0.4 já tem fios bons (Bené foi o condutor de 2019; Biel é neto do Jairo; Cida é do grupo da Zélia; o dono da OS é cunhado do vereador), mas eles **correm em paralelo**. A 1.1 amarra os fios em **cinco viradas**, cada uma preparada por pistas que o jogador pode notar antes. Regra: toda pista é uma frase ou um objeto que **faz sentido sozinho** na primeira vez e **muda de sentido** quando a virada chega.

### Visão geral

| # | Virada | Pistas (dia) | Vira (dia) | Fios que amarra |
|---|---|---|---|---|
| R1 | **O homem do envelope é o homem da pizza.** Wagner Tavares, o assessor que traz os R$ 1.000 do vereador na sua porta, é o marido que grita "Com quem você tá falando?!" atrás da Rosângela. | D7 (na porta), D8 (na linha) | **D9** (jornal) → D12 (Rosângela) → D18 (matéria) | vereador, envelope/dinheiro, Rosângela, matéria |
| R2 | **O "sem vaga" do Regional é planilha.** Seis leitos do 4º andar estão "reservados" para o convênio Saúde+ Vida, da mesma OS. O plantonista, Dr. Saulo, sabe e manda dizer "lotado". | D3, D5, D9, D11, D15 | **D16** (Saulo conta) → D18 (Odete ganha leito na hora) → D19 (vaga zero da Cida) | vaga zero, OS, vereador, Peixoto, matéria |
| R3 | **A noite de 2019 tinha três pessoas.** Rafael (antes "Tiago"), irmão da Carla, morreu esperando 40 min porque a única USA estava **com a maca presa no Regional**. Bené dirigia. **Henrique regulava.** **Saulo** era o plantonista recém-formado que disse "sem maca". Cada um carrega de um jeito: Bené chora no meio-fio, Henrique bebe, Saulo não aceita vaga zero. | D1, D2, D3, D4, D8, D12, D14, D16 | **D18** (Bené conta; à tarde, o nome do regulador) | Bené, Henrique, Saulo, Carla, vaga zero |
| R4 | **"Tudo nessa vida tem volta."** O Seu Nogueira, o senhorio que cobra e ameaça, liga para a Regulação preso debaixo do muro de uma das casas que aluga, na enchente. | D2, D11, D17 (manhã) | **D17** (ligação das 15:40) → D18 (casa) | Nogueira, aluguel, enchente |
| R5 | **O ônibus doze.** O pai do protagonista pediu a Zélia em casamento dentro do ônibus da linha 12. Quem parou o ônibus no meio da Av. Brasil foi o motorista, **Seu Nestor — o falecido marido da Dona Cida**. O trocador era um rapaz chamado **Benedito**. A aliança que a Zélia quer vender é a mesma história que a Cida conta. | D4, D8, D10, D13, D14, ida/volta | **D20** (última marmita do Bené) e, se a Cida vive, a carta dela no final | Zélia, Cida, Bené, Seu Aílton, aliança, Liam |

Ordem de impacto: R1 (choque, meio do jogo), R4 (alívio cômico-amargo), R2 (conspiração), R3 (soco), R5 (ternura, fecha o jogo). Elas se alimentam: R1 dá à Carla a prova dos envelopes; R2 explica por que a USA ficou presa em 2019 e por que fica presa hoje; R3 explica por que o Henrique bebe e por que o Saulo empaca; R5 transforma o último dia num reencontro.

### R1 — O homem do envelope é o homem da pizza

**Quem:** Wagner Tavares, 41, assessor do vereador Arlindo Matos ("cargo comissionado"). Casado com a **Rosângela Ferraz**, 38. Sobrado verde da Rua Ipê, 112.

**Pistas (o jogador pode reparar):**
- **D7, 20h, na porta** (cena do envelope): o assessor fala manso e termina frase com tique: *"Pode ficar tranquilo, {dr}. Tá bom? Tá bom."* O narrador repara: *"Aliança apertada no dedo. Um arranhão fresco nas costas da mão, de unha."* Ele recusa café: *"A patroa me espera. Ela não gosta que eu demore."*
- **D8, 08:10, na linha** (ligação da pizza): ao fundo, a voz de homem: *"Com quem você tá falando?! Desliga isso. Tá bom? TÁ BOM?"* (o mesmo tique, gritado). Objeto novo na casa do D8: o envelope (se aceito) está na caixa de costura; se o jogador "repara" nele, lê na cinta do banco: *"Câmara Municipal — Gabinete 7"*.
- **D8, volta do plantão:** um carro preto passa devagar na Rua Ipê com um homem ao celular; o ônibus 12 passa na frente do sobrado verde (sem diálogo; só o narrador: *"Sobrado verde. Luz da cozinha acesa."*).

**Virada — D9, jornal da manhã:**
- Rosângela salva: *"MULHER PEDE SOCORRO COM 'PEDIDO DE PIZZA' E É RESGATADA. O agressor, W.T., 41, assessor de gabinete na Câmara, foi preso em flagrante. Na casa, a polícia encontrou uma gaveta com envelopes de dinheiro com a cinta do gabinete."*
- Rosângela morta: *"MULHER É MORTA EM CASA NA RUA IPÊ. Ligação para a emergência tinha sido encerrada. O marido, W.T., assessor parlamentar, está foragido."*
- Linha nova na passagem do D9 (Simone, se o envelope foi aceito ou recusado): *"Esse W.T. aí... é o de terno que veio aqui na base no domingo, {dr}? O da ordem do Peixoto?"*

**Consequências:**
- **Imediata (D9 casa, antes da asma):** o cônjuge lê o jornal na mesa. Se `envelope_aceito`: *"{nome}. Esse homem esteve na nossa porta. Eu servi café pra ele."* (Laços −1 se o dinheiro já foi gasto; Zélia: *"Dinheiro tem cheiro. Esse cheira a sabonete de motel."*). Se `envelope_recusado`/`vereador_inimigo`: *"Ainda bem que a gente não pegou."* Se `envelope_lucia` (cônjuge escondeu): *"Eu escondi o envelope dele na caixa de costura. Tá lá. Eu não consigo nem olhar."* → nova escolha no D9 (ou no D10, se a noite do D9 já estiver cheia): **devolver na delegacia** (`envelope_entregue_policia`, Integridade +2, o dinheiro sai) / **guardar** / **queimar** (Zélia queima no fogão: `envelope_queimado`, Integridade +1, ninguém ganha nada).
- **Tardia (D12):** a Rosângela, se viva, liga do abrigo (ligação já existe) e acrescenta: *"Ele carregava envelope pro vereador. Tinha um caderninho com nome e valor. Eu tirei foto antes da polícia chegar."* → `rosangela_caderninho`. Se o jogador aceitou o envelope: *"...{Dr}. O seu nome tá no caderninho. Eu não vou mostrar essa página. Você não desligou na minha cara."* (`rosangela_protegeu`) — ela corta a página. É a **única forma de o envelope aceito não aparecer na matéria do D18**.
- **D18:** a matéria da Carla ganha a foto do caderninho como fonte extra (conta como **+1 fonte** se `rosangela_caderninho`), e o nome do protagonista sai ou não conforme `rosangela_protegeu` (ver `nome_na_materia` em `flags.md`).

### R2 — O "sem vaga" é planilha

**Quem:** **Dr. Saulo Brandão**, 33, clínico plantonista do pronto-socorro do Hospital Regional. Ver `vaga-zero.md` para o personagem inteiro.

**Pistas:**
- **D3** (1ª vaga zero, Conceição): *"Tô com trinta e oito no corredor e duas macas. Vocês adoram mandar e esquecer."* Se o jogador pergunta "E o quarto andar?" (argumento que só aparece se o jogador leu o jornal do D1 — "Regional inaugura ala nova com seis leitos"): *"O quarto andar não é comigo."*
- **D5** (Gildásio): o Peixoto, ao negociar no seu lugar, diz ao Saulo: *"Saulo, eu sei do quarto andar. Você sabe que eu sei."* — e a vaga sai na hora. O jogador não entende ainda.
- **D9** (11:00, a retenção): a equipe da USA no rádio: *"Doutor, tem maca vazia no elevador de serviço subindo pro quarto. Aqui embaixo diz que não tem."*
- **D11** (almoço): o Saulo liga pedindo uma USA emprestada para transferir um paciente para Rio Claro *"porque aqui não tem leito"*. Se o jogador pergunta "E os seis do quarto andar?": silêncio; *"Me empresta a viatura ou não?"*
- **D15** (MCI): no pico, com corredor a 160%, o Saulo abre **dois** leitos do quarto andar *"por conta própria"* para as vítimas vermelhas do show, se o jogador negociou bem antes (`saulo_confianca ≥ 2`).

**Virada — D16, 14:40 (logo depois da ligação do Seu Osvaldo):** o Saulo liga para a central, sem ser chamado, do celular dele:
> SAULO: Regulação? É o Saulo. Não é pedido. ...O seu idoso da sepse, o pai do Peixoto. Eu recebo. E escuta. Tem seis leitos no quarto andar com placa de "reservado". Reservado pra quem paga o Saúde+ Vida. O plano de saúde da mesma OS que regula vocês. Quando eu digo "lotado", eu tô lendo uma folha que a diretoria me entrega às sete. Eu tô cansado de ler essa folha.
> SAULO: Eu tenho a folha de hoje no bolso. Se aquela jornalista quiser, ela que venha buscar no estacionamento. Eu não falo no telefone.

Escolhas: **"Eu aviso a Carla."** (`saulo_fonte`, conta como fonte da matéria no D18) / **"Isso é com a direção, Saulo."** (`saulo_sozinho`; ele desliga; no D19 ele ainda recebe a Cida, mas sem a folha) / **"Por que agora?"** (ele conta de 2019 — pista forte de R3: *"Porque em dezenove eu li a folha. Eu tinha seis meses de formado. Disse 'sem maca' pra um regulador às duas da manhã. O regulador não insistiu. Eu nunca soube o nome dele."*).

**Consequências:** D18, a Dona Odete (mãe do vereador) chega ao Regional e ganha leito **em 4 minutos** (rádio da USA: *"Leito no quarto andar, doutor. Subiu direto."*). O jogador pode usar isso na vaga zero seguinte (Jonathan, 17:00): argumento novo *"Se tem leito pra mãe do vereador, tem pro Jonathan."* — aceito na hora. D19, a vaga zero da Cida é o clímax (ver `vaga-zero.md`). Matéria do D18: manchete muda se `saulo_fonte` ("Hospital esconde leitos vazios para plano da própria OS").

### R3 — A noite de 2019 tinha três pessoas

**O que aconteceu (a verdade, que ninguém conta inteira):** 12 de abril de 2019, 01:50. **Rafael Nunes**, 26, cai de moto na Av. Brasil, a quatro quadras do Regional. A Regulação tinha **uma** USA na rua (a 01, Bené ao volante, Dr. Castro, enfermeiro Márcio) e ela estava **parada no Regional com a maca presa** — o PS dizia "sem maca, sem vaga" (folha da diretoria). O regulador da noite, **Henrique Lacerda**, ligou uma vez, ouviu "sem maca" de um plantonista novo (**Saulo**), não insistiu, não pediu vaga zero, esperou. A TARM da noite era a **Simone** (ela cobria o noturno naquele mês). Quarenta minutos. Bené chegou, viu, sentou no meio-fio e chorou. Henrique, às sete da manhã, foi para casa e bebeu pela primeira vez antes de dormir. Saulo nunca soube o nome do regulador; Henrique nunca soube o nome do plantonista; Bené sabia dos dois e nunca disse.

**Pistas:**
- **D1** (passagem, já existe): Henrique: *"O Peixoto conta as USA. Eu conto as horas."*
- **D1** (almoço): Simone: *"O Henrique não almoça. Ele janta às sete da manhã."* (o jogador ainda não sabe o que ele janta).
- **D2** (almoço): Lia (USB 03): *"A gente já levou quarenta minutos. Uma vez. A Simone não gosta que fale disso."*
- **D3** (vaga zero): Saulo: *"Vocês adoram mandar e esquecer. Em dezenove eu aprendi."*
- **D4** (ida): o ônibus 12 passa pela Av. Brasil, 2400. Num poste, uma cruz de madeira com flor de plástico: **"RAFAEL ✝ 2019"**. Seu Aílton faz o sinal da cruz sem tirar a mão do volante. Se o jogador pergunta: *"Menino de moto. A ambulância demorou. Tá vendo o Regional ali? Quatro quadras."*
- **D4** (almoço): Bené evita: *"Av. Brasil eu faço pela Santos Dumont. É mais longe. Eu gosto de longe."*
- **D8** (passagem): Henrique, atrasado: *"Abril é o pior mês, {nome}. Ainda é março e eu já tô sentindo abril."*
- **D12** (sindicância): Henrique: *"Em dezenove não teve sindicância. Ninguém abriu ficha. Era pior."*
- **D14** (Carla na porta): *"Meu irmão, Rafael, tinha vinte e seis anos... O motorista sentou no meio-fio e chorou."* E se o jogador perguntar "Quem regulou?": *"Isso ninguém me diz. A OS diz que o registro daquela noite 'se perdeu na migração do sistema'."*
- **D14** (almoço): Simone, ao reconhecer a voz da Carla: *"Ela fez a matéria da creche. E... o irmão dela. Eu tava aqui naquela noite, {dr}."* — e para.
- **D16**: Saulo conta a parte dele (acima).

**Virada — D18:**
- **07:05** (já existe): Bené conta que era o condutor.
- **13:00 almoço** (novo): Bené, de marmita fechada: *"Tem mais uma coisa. Quem tava no rádio comigo naquela noite era o Henrique. Ele mandou eu esperar. Depois ele mandou eu ir. Quando eu cheguei, já era só eu e o meio-fio."* Se `saulo_fonte` ou o jogador ouviu o Saulo no D16 → o protagonista junta as três peças (narrador: *"O regulador que não insistiu. O plantonista que leu a folha. O motorista que chegou. Três pessoas que nunca disseram o nome uma pra outra."*).
- Escolhas (almoço do D18): **contar à Carla** (`carla_sabe_regulador`; a matéria do D18 já fechou → sai uma nota no D19: "Regulador daquela noite segue na ativa", e o Henrique lê) / **ligar para o Henrique** (`ligou_henrique_2019`: se denunciado, ele atende na clínica: *"Eu sei o nome dele. Rafael. Eu sei desde aquela noite. Obrigado por me ligar e não por me escrever."*; se não denunciado, ele não atende — e às 18:58 do D20...) / **guardar** (`guardou_2019`).
- O fio fecha no **D20** (a PCR do Henrique no 302 ou a carta dele) e nos epílogos de Bené, Henrique, Saulo e Carla (ver `finais.md`).

**Por que isso não pesa demais:** ninguém é vilão. A folha da diretoria (R2) é a causa; os três são o que sobrou. O jogo dá ao jogador a chance de **ser o regulador que insiste** — que é exatamente a vaga zero negociada (pilar pedido pelo jogador).

### R4 — "Tudo nessa vida tem volta"

**Quem:** Seu Nogueira (Alcides Nogueira, 68), senhorio. Pressão alta, manca da perna esquerda, cobra na pasta de elástico. Tem quatro casas de aluguel, duas na Baixada.

**Pistas:** D2, *"Tudo nessa vida tem volta. Tudo."* (já existe). D11, no portão: *"E o meu é o da pressão... Todo mundo tem um remédio."* + narrador: *"Ele também manca."* D17 manhã, boletim da Defesa Civil: "Baixada: risco de desabamento de muros"; na casa, ao reclamar da goteira por telefone, ele diz: *"Hoje eu não posso. Vou ver as casas da Baixada. Se o muro da 14 cair, eu tô perdido."*

**Virada — D17, 15:40:** a ligação `d17_muro` (hoje "Seu Joel / Seu Josué 61") passa a ser **Seu Joel (vizinho) / Seu Alcides Nogueira, 68**, "o dono das casas", preso debaixo do muro da casa 14 da Baixada, com choque hemorrágico. A verdade clínica não muda (USA + Bombeiros → REG, guia hemorragia). O jogador só reconhece pelo nome ou pela fala: *"Fala pro inquilino da 40 que o telhado eu arrumo... Ai. Tudo tem volta, né, doutor?"*

**Consequências (D17 noite / D18):**
- Salvo + `brigou_nogueira`: na cena da goteira do D17 (ou na pré-casa do D18), um rapaz traz um bilhete: *"Aqui é o filho do Nogueira. Meu pai tá no Regional. Pediu pra dizer que o aluguel desse mês ele perdoa. E que 'tudo tem volta, mas não precisava ser assim'."* → aluguel do mês zerado (`nogueira_perdoou`), `rentDebt` −1 mês.
- Salvo sem briga: o abatimento de R$ 50 da goteira vira automático e o telhado é consertado no D18 (`telhado_consertado`; tira os baldes da casa).
- Morto: o filho cobra o aluguel em dia, educado e frio: *"Meu pai falava bem de você."* (se não brigou) / *"Meu pai dizia que tudo tem volta. Não voltou."* (se brigou). Epílogo próprio.

### R5 — O ônibus doze

**Quem:** **Seu Nestor** (falecido marido da Cida; motorista da linha 12 por 30 anos; desenhava retratos em guardanapo). **Benedito** (Bené) foi trocador e depois motorista da linha 12 por treze anos antes da ambulância — por isso "trinta e um anos de volante" (Simone) e "dezoito de ambulância" (Bené) **deixam de ser contradição**. **Seu Aílton** (motorista atual da linha 12) aprendeu com o Bené.

**A história:** em 1979, um pedreiro magrelo (o pai do protagonista) subiu no 12 com uma aliança no bolso e não tinha coragem. O Nestor parou o ônibus no meio da Av. Brasil e disse: *"Ou pede ou desce."* O trocador, um moleque de dezesseis anos chamado Benedito, puxou palmas. A moça disse sim antes de ele terminar. Era a Zélia.

**Pistas:**
- **D4** (almoço): Bené: *"Treze anos de ônibus doze antes da ambulância. Quem me ensinou foi o Seu Nestor. Parava o ônibus por qualquer coisa. Uma vez parou pra um pedido de casamento."* (e muda de assunto).
- **D8** (ligação `d08_onibus`, Seu Aílton): *"Esse ônibus já viu de tudo, {dr}. Já viu até casamento."*
- **Ida/volta**, vários dias: Seu Aílton fala do "finado Nestor" e do "Bené, que me ensinou a curva da Brasil".
- **D10** (Zélia, aliança): *"Ele me deu isso dentro de um ônibus. Ficou vermelho, o bobo."* (já existe). Nova linha: *"O motorista parou no meio da avenida. Hoje prendiam."*
- **D10** (Cida): *"Vendi a minha aliança pra pagar o enterro do Nestor."*
- **D13** (Zélia e a Cida do grupo): *"A Cida diz que o marido dela era motorista de ônibus. Eu não perguntei de qual. Velha não pergunta, velha sabe."*
- **D14** (Cida): *"Meu falecido desenhava retrato num guardanapo."* + presente de aniversário do D15 (ver Liam).

**Virada — D20, 13:00 (última marmita do Bené, já existe; texto novo):**
> BENÉ: Sabe o que eu vou sentir falta? Nada. Mentira. Do rádio. ...E do ônibus doze, ainda, depois de dezoito anos. O Seu Nestor parava o ônibus pra tudo. Teve um pedreiro magrelo, uma vez, que subiu com uma aliança e travou. O Nestor parou no meio da Brasil e falou: "ou pede ou desce". Eu puxei as palmas. A moça disse sim antes dele acabar.
> BENÉ: Zélia. O nome dela era Zélia. Eu lembro porque ele gritou tão alto que o ônibus inteiro ficou sabendo.

Se o jogador ouviu a história da aliança no D10 (`zelia_contou_alianca`), escolha: **"Bené... era a minha mãe."** (intimBene +2; Bené para de mastigar: *"...A Zélia da Vila Esperança. O magrelo era o seu pai. Trinta e um anos de volante e a primeira e a última corrida foram com a sua família."*) / **guardar para si** (o narrador: *"Você não diz nada. Leva a história pra casa como quem leva pão quente."*).

**Consequências:**
- **Aliança vendida (`alianca_vendida`, D10):** a partir do D11, a loja da casa ganha o item **"Comprar a aliança de volta (Seu Jacó)" — R$ 260** (ele revende mais caro: *"Ouro a gente compra por duzentos e vende por duzentos e sessenta. É a vida."*). Se o jogador compra com dinheiro do envelope, a Zélia recusa (ver Dinheiro). Se compra no D19 ou D20 (ou já tem), o final mostra a aliança no dedo da Zélia; se não, a caixinha vazia.
- **Cida viva (D19):** a carta do final conta a história pelo lado do Nestor (ver `finais.md`) e devolve a ponta: *"O Nestor guardava o guardanapo daquele dia. O pedreiro desenhado de joelho no corredor do ônibus. Vai junto com a carta. É do seu pai. Sempre foi."*
- **Liam:** o guardanapo do Nestor (ou o caderno de guardanapos, presente de aniversário da Cida no D15) vira modelo para as aulas de desenho.

### Conexões novas (a "Teia" da 1.1)

| Ponto A | Ponto B | Como se toca | Onde |
|---|---|---|---|
| Edson (parada do D1, porteiro) | Henrique (Ed. Aurora) | Edson é porteiro do **Ed. Aurora**, Rua XV, 1950 — o prédio do Henrique e da Dona Iolanda. Se sobreviveu no D1, no D20 é ele quem arromba o 302 e começa as compressões (janela da PCR maior). | D1, D4 (diário), D13, D20 |
| Dona Iolanda (professora de desenho) | Henrique (vizinho do 301) | As aulas de desenho do Liam são no 301. O Liam desenha "o moço da escada que cheira bala". | D10+, D13, D20 |
| Ana Clara (D6, 7 anos, salvou a mãe) | Liam (mesma escola) | Estuda na Monteiro Lobato, 2º ano. No D19 a asma grave é **dela** (Ana Clara, 7). | D6, D19 |
| Zé Carlos (USA 03, D5) | Casa (Vila Esperança) | Mora a três ruas. Deixa o telefone no D5; no D10 pode vir a pé ajudar a Zélia. | D5, D10, D19 |
| Wellington (vendedor, D1) | Seu Dito (D20) | Já existe: faz curso dos Bombeiros e massageia no mesmo semáforo. | D1, D20 |
| Taís (D5, estudante de enfermagem) | MCI do show (D15) | Voluntária no Parque; no rádio do Sgt. Rocha: *"Tem uma moça de enfermagem aqui que diz que já fez massagem num dono de academia."* (libera 1 vítima amarela mais cedo). | D5, D15 |
| Diego e Tainara (casa 88) | Ida/volta | O bebê do D9 (se regulado) aparece no carrinho na calçada: chama-se **Benício**. | D9+, ida/volta |
| Seu Toninho | Padaria **e** pizzaria | De dia padaria, de noite pizzaria (o ímã da geladeira é dele). Fiado do bolo do D15. | D1+, D8, D15 |
| Rosângela | Ateliê do cônjuge | Já existe (D17); ganha o caderninho (R1). | D8, D12, D17, D18 |
| Peixoto | Saulo | Peixoto sabe do quarto andar (R2) e usa isso **uma vez por plantão**. | D5+, D16, D19 |

---

## Parte 2 — Elenco memorável

Princípio: **poucos rostos, muitas voltas.** Cada recorrente tem (a) um gesto ou objeto que o identifica na hora, (b) uma frase-assinatura, (c) um arco com começo, virada e fim. Figurante descartável vira **recorrente** quando pode.

### Núcleo da central

| Personagem | Marca | Frase-assinatura | Arco 1.1 (começo → virada → fim) |
|---|---|---|---|
| **Simone** Aparecida Batista, 51, TARM | post-its de cor (azul/rosa/verde/branco), caneta presa no coque | "Na dúvida, liga de volta. Custa meia hora." | tutora → Wesley (D7) → demissão anunciada (D12) → crise (D17) → sabe de 2019 (D14/D18) → post-it final (D20) |
| **Henrique** Lacerda, 43, regulador noturno | bala de menta, mãos no crachá | "Noite tranquila." / "Eu conto as horas." | colega cansado → endereço errado da sua casa (D10) → sindicância (D12) → **regulador de 2019** (D18) → PCR ou carta (D20) |
| **Dr. Peixoto** (Carlos, "Carlinhos"), coordenador | interfone, planilha impressa, rostinho do painel | "É incentivo, não é ordem." | homem das metas → negocia a vaga zero "pelo painel" (D5) → pai (D16) → fonte ou endurece (D18) → senta na cadeira do noturno (D20) |
| **Seu Bené** (Benedito), condutor USA 01 | voz do rádio, bigode grisalho, bate duas vezes na porta | "Bené na escuta." / "Eu entro pra voltar." | rádio → promessa da PM (D4) → ônibus 12 (D4, D20) → 2019 (D18) → QRT (D20) |
| **Dr. Saulo Brandão**, 33, plantonista do Regional (**novo**) | bolacha água e sal no telefone, fala em números | "Tô com trinta e oito no corredor." / no fim: "Manda. Eu recebo." | antagonista da vaga zero (D3) → pede ajuda (D11) → folha do quarto andar (D16) → 2019 (D16/D18) → recebe a Cida pelo nome (D19) |
| **Rose**, RH | prancheta, perfume de talco, "o ponto" | "Eu só carimbo, meu bem." | ponto do Henrique (D8) → cobre a TARM (D17) → a lista do corte (D18) |
| **Dr. Castro**, médico da USA 01 | pastel que deve à Simone desde 2019 | "Me deve um pastel não, eu devo." | almoço D3 (fala do Saulo) → 2019 (estava na USA) → D20 (no Regional com o Henrique, não na central) |
| **Joana**, técnica da USB 01 | prendedor de cabelo de borboleta | "Chegamos, doutor. Tá todo mundo vivo, por enquanto." | Ana Clara (D6) → endereço errado (D10) → viu a Zélia no portão (D13) |
| **Lia**, USB 03 | pão de queijo frio | "Quarenta minutos a gente já levou. Uma vez." | almoço D2 (pista 2019) → passagem D6 |
| **Tico**, USA 02 | rádio chiando, "pane" | "A 02 é guerreira, doutor, só é velha." | pane (D9) → rodovia (D16) |
| **Zé Carlos**, USA 03 | entrega a chave no D5 | "Cuidem da Vila Esperança." | corte (D5) → vizinho (D10) → volta se `reforco_frota` (D19) |
| **Dra. Paula**, substituta do noturno | chega correndo, cabelo molhado | "Chama pelo nome. Funciona." | só se o Henrique for denunciado (D13–D20) |
| **Dra. Heloísa Rangel** (**novo**), coordenadora interina | agenda de couro, voz de quem não dormiu | "Anote tudo. Eu vou ler." | só se `peixoto_caiu` (D19–D20) |

### Cidade (recorrentes fora da central)

| Personagem | Marca | Onde aparece |
|---|---|---|
| **Dona Cida** (Aparecida, 79), gato Bolinha, novela "Amor de Cristal" | liga todo dia; "Desculpa incomodar" | D1–D19 (ligações), D13 (máquina), D19 (AVC), final (carta) |
| **Seu Aílton**, motorista da linha 12 (**promovido**) | boné do Corinthians desbotado, "Bom dia, doutor do telefone" | D8 (ligação) + **quase toda ida/volta** |
| **Seu Toninho**, padaria e pizzaria | lápis atrás da orelha, caderno do fiado | ida (pão), D8 (pizza/ímã), D15 (bolo fiado) |
| **Dona Dirce**, vizinha da frente | vassoura, rádio AM, sabe de tudo | ida/volta, D7 (envelope na calçada), D16 |
| **Diego e Tainara** (casa 88) | o bebê Benício (se o parto do D9 foi regulado) | D9, ida/volta D10+ |
| **Seu Nogueira** (Alcides), senhorio | pasta de elástico, manca | D2, D11, D17 (R4), D18 |
| **Seu Jairo** e **Biel** (Gabriel, 15) | boné e óculos; Biel com fone no ponto de ônibus | D2–D3 (trotes), D6 (geladeira), D10, D16 + ida (Biel no ponto) |
| **Dona Iolanda** Quintana, 70 (**promovida**) | professora de desenho aposentada, Ed. Aurora 301, xale roxo | aulas do Liam (D10+), D13, D20 (ligação das 18:58) |
| **Edson**, porteiro do Ed. Aurora (**promovido**; parada do D1) | cicatriz do choque no peito, "Bom dia, doutor da calçada" | D4 diário, D13 (volta das aulas), D20 |
| **Seu Jacó**, joalheiro da XV | lupa no olho | D10, loja (aliança de volta) |
| **Carla Nunes**, Gazeta | caderninho de capa dura | D14–D20 |
| **Rosângela Ferraz** | voz baixa, "calabresa" | D8, D12, D17, D18, final |
| **Wagner Tavares**, assessor (**promovido**) | "Tá bom? Tá bom." | D7 (envelope), D8 (voz), D9 (jornal) |
| **Vereador Arlindo Matos** e **Dona Odete** | "Você sabe com quem tá falando?" / "Deixa o moço trabalhar" | D7, D18 |
| **Mauro Teixeira**, dono da Saúde+ Gestão | só aparece em papel e no rádio AM | D18, final secreto |
| **Seu Antônio, Dona Rosa, Juliana** | bolo de fubá que queima no fundo | D3, D11, D15, D20, final |
| **Tia Márcia** (Márcia Albuquerque Reis) e Pedro (3º B) | caneta de adrenalina | D8, D9, D15–D16 |
| **Ana Clara Santos**, 7 (**promovida**) | atende o telefone "com a chave numa mão" | D6, D19 |
| **Seu Osvaldo Peixoto**, 84 | goiabada escondida | D5 (citado), D16, D18 |

### Figurantes que viram recorrentes (resumo)

- **Edson** (D1) → porteiro do Ed. Aurora, salva o Henrique no D20.
- **Ana Clara** (D6) → paciente do D19 (a asma grave do D19 passa a ser ela, 7 anos; a avó **Dona Rita** liga se a mãe morreu no D6; a mãe **Jaqueline** liga se viveu: *"Da outra vez foi ela que ligou pra mim. Hoje sou eu."*).
- **Seu Aílton** (D8) → motorista de toda ida/volta.
- **Taís** (D5) → voluntária no MCI do D15.
- **Zé Carlos** (D5) → vizinho que ajuda no D10.
- **Reginaldo** do dente (D1) → já volta no D19; passa a voltar também numa ida (D12: no ponto, com a bochecha inchada, "Ainda não fui no dentista").
- **Dona Iolanda** (D20) → professora de desenho do Liam desde o D10.
- **Wagner** (D7) → R1.
- **Seu Nogueira** → R4.

### Colisões de nomes (encontradas nas notas) e o que fazer

Nome que fica **de quem** (o recorrente) e para onde vão os outros. Todos os nomes novos foram conferidos com busca em `src/` e nas notas (0 ocorrências antes desta bíblia).

| Nome | Fica com | Os outros viram |
|---|---|---|
| **Thiago** (paciente "Thiago Moreira, 28", D11 `d11_barriga`) | o protagonista | **Murilo Moreira**, 28 |
| **Tiago** Nunes (irmão da Carla: D14, D18, campanha da Simone) | — | **Rafael Nunes** (morto em 12/04/2019) |
| **Toninho** (farmácia D1; pizzaria D8; padaria D15; caller D19) | **Seu Toninho, padaria e pizzaria** (uma pessoa só) | farmácia do D1 → **Drogaria do Gervásio**; caller `d19_escada` → **Seu Odair** |
| **Nestor** (marido da Cida D10; "Seu Nestor Gonçalves" D18) | marido da Cida | D18 desabafo → **Seu Augusto Gonçalves** |
| **Wagner** (assessor D7; ciclista D14) | o assessor, **Wagner Tavares** | ciclista → **Celso Dias** |
| **Dirce** (vizinha do protagonista D7/D16; "Dirce da frente" da Cida D5/D8) | vizinha do protagonista | vizinha da Cida → **Dona Noêmia** |
| **Neusa** (vizinha da Conceição D3; avó D5; vizinha da Cida D11) | vizinha da Cida (D11) | D3 → **Dona Leonor**; D5 → **Dona Glória** |
| **Rosa** (esposa do Antônio D3; ficha D12; esposa do Joaquim D13) | esposa do Antônio | ficha D12 → **Dona Otília Barreto**, 68; D13 → **Dona Zenaide** |
| **Ana Clara** (D6, 7 anos; D13, 3 anos; D19, 6 anos) | D6 e **D19 passam a ser a mesma menina** (7 anos) | D13 → **Sofia Ribeiro**; a "Sofia de cinco" do D17 (telhado) → **Lorena** |
| **Jaqueline** (D6 mãe; D14 pré-eclâmpsia; D19 parto) | mãe da Ana Clara (D6/D19) | D14 → **Mirela Valença**, 24; D19 parto → **Leandra**, 31 (marido **Cristiano** liga) |
| **Cleide** (quitanda D3; mãe D11; TARM do noturno D12; filha D14; vidro D17) | TARM do noturno | D3 → **Dona Quitéria** (a quitanda vira "da Quitéria"); D11 → **Dona Zuleica**; D14 → **Fátima**; D17 → **Nádia** |
| **Lurdinha** (esposa morta do Osmar D3; irmã da Benedita D5; pastelaria D14) | **Pastelaria da Lurdinha** (o pastel que o Castro deve à Simone) | D3 → **Dita**; D5 → **Jandira** |
| **Enzo** (D3, 9 anos; D5, 4 anos; D11, 6 anos) | D3 (bicicleta) | D5 → **Tobias**, 4; D11 → **Isadora**, 6 (vira menina) |
| **Patrícia** (D3; D5 asma; D11; D15 MCI; D17) | D5 (asma, ensina a p.5-B) | D3 → **Pâmela**; D11 → **Germana Rocha**; D15 → **Abigail**; D17 → **Lázara** |
| **Kelly** (D2 gestante; D5 recepcionista; D8 neta; D19 caller) | D2 (gestante) | D5 → **Yumi**; D8 → **Rayssa**; D19 → o caller vira **Cristiano** (ver Jaqueline) |
| **Geraldo** (D4 joelho; D7 engasgo; D19 infarto) | D7 (vira manchete do D8) | D4 → **Seu Onofre**; D19 → **Seu Vilmar**, 74 |
| **Sebastião** (D2 HDA; D6 AVC; D11 idoso; D17 telhado) | D2 | D6 → **Seu Lázaro**; D11 → **Seu Germano** (ele continua chamando o neto de "Carlinhos"); D17 → **Seu Severino** |
| **Lucas** (D8 ônibus; D12 cartelas; D14 trote; D15 filho da Vera; D19 marimbondo) | D8 (Lucas Teles, passageiro do Aílton) | D12 → **Ícaro**; D14 trotista diz **"Bruno"**; D15 → **Teodoro**; D19 → **Humberto**, 17 |
| **Valdemar / Valter** (inquilino D2; lombalgia D6; Valter Nogueira D19) | inquilino Valdemar (D2) | D6 → **Seu Dorival**; D19 o paciente (motorista) → **Edgar**, 54 (some o "Nogueira") |
| **Escola "Prof. Aurélio Matos"** | — | **Escola Estadual Prof. Aurélio Valença**, **Rua Ipê, 901** em todo lugar (`ADDR.escola` 905 → 901) |
| **Wesley Batista** (D7) × **Wesley Campos** (Simone) | uma pessoa | **Wesley Campos Batista** |
| **Marcelo** (plantonista citado pela Paula no D19) | — | o plantonista é o **Dr. Saulo Brandão** (trocar a fala da Paula: "chama pelo nome, Saulo") |
| Sobrenomes repetidos (Batista, Teixeira, Cardoso, Freitas, Lopes) | **Teixeira** = dono da OS; **Batista** = Simone/Wesley | renomear quando o texto for tocado (cosmético) |
| Lista sorteada `NAMES` (`base.ts`) | — | **tirar** Wesley, Benedito, Rosângela, Aparecida, Juliana, Márcia, Odete, Marcelo, Edson, Wellington (para o banco não gerar homônimos dos recorrentes) |

**Nomes novos desta bíblia:** Saulo Brandão, Lívia (filha dele), Heloísa Rangel, Wagner Tavares, Iolanda Quintana, Rafael Nunes, Bia e Theo (filhos do Henrique), Murilo, Gervásio, Odair, Augusto, Celso, Noêmia, Glória, Leonor, Otília Barreto, Zenaide, Sofia, Lorena, Mirela Valença, Leandra, Cristiano, Quitéria, Zuleica, Fátima, Nádia, Dita, Jandira, Tobias, Isadora, Pâmela, Germana, Abigail, Lázara, Yumi, Rayssa, Onofre, Vilmar, Lázaro, Germano, Severino, Ícaro, Teodoro, Humberto, Dorival, Edgar, Benício (bebê da casa 88), e os folgados (Clodoaldo, Jurema, Abelardo, Lindalva, Rodinei, Neuzely, Filomena, Ednilson, Rosenilda, Wanderlei, Iracilda).

---

## Parte 3 — Consequências

A tabela completa das flags esquecidas está em **`docs/roteiro-1.1/flags.md`**. Aqui ficam as três regras grandes que o jogador citou por nome.

### 3.1 Regra do dinheiro: a família fala do dinheiro que existe

**O problema:** com R$ 1.000 do vereador no saldo, a família continua falando de aperto. **A regra:** nenhuma fala de aperto aparece se o saldo não está apertado; e quando há dinheiro, a fala muda conforme **de onde ele veio**.

**Faixas de saldo** (lidas na hora da cena, depois do salário do dia e antes das contas):

| Faixa | Saldo | Tom |
|---|---|---|
| **Aperto** | < R$ 150 (ou negativo) | contas, escolhas, vergonha pequena |
| **Justo** | R$ 150 – 599 | dá, mas conta; ninguém reclama em voz alta |
| **Folga** | R$ 600 – 1.199 | alívio; planos pequenos |
| **Sobra** | ≥ R$ 1.200 | conforto que precisa de explicação |

**Origem dominante** (para o motor: gravar ao receber dinheiro; proposta de função `origemDinheiro(c)`):
1. `vereador` — se `envelope_aceito` (ou `envelope_usado` no D18) e o envelope não foi devolvido/entregue.
2. `bico` — se fez Intervenção em 2 ou mais noites nos últimos 4 dias (contador `bicos_recentes`).
3. `atelie` — se `maquina` e o ateliê rendeu nos últimos 3 dias (`atelie_renda` > 0) ou `juliana_cliente`.
4. `alianca` — no dia em que a aliança foi vendida e no seguinte.
5. `salario` — o resto.

> Pedido à Fundação: `fx.money(d, motivo)` já recebe motivo; gravar `renda_<origem>` acumulada e `bicos_recentes`. É só leitura para o conteúdo.

**Onde a regra entra (falas por faixa × origem).** Cada linha marcada *(atual)* é a que existe hoje e passa a valer só na faixa indicada.

**a) Jantar genérico (`genericScene`, home-base.ts)** — primeira linha do narrador:
| | salário | bico | ateliê | vereador |
|---|---|---|---|---|
| Aperto | "Arroz, um ovo dividido em {quantos}. Ninguém reclama em voz alta." *(atual; corrigir "quatro" para o número de presentes)* | "Arroz e ovo. O seu prato tá coberto com outro prato: você chegou tarde de novo." | "Arroz, ovo e a máquina parada no canto. Hoje não teve encomenda." | (não ocorre: com o envelope não há aperto) |
| Justo | "Arroz, feijão, a novela baixinha na sala." *(atual)* | "Feijão com linguiça. ZÉLIA: Essa linguiça é da sua noite na ambulância. Come devagar que custou caro." | "Feijão, arroz e bife. CÔNJUGE: O bife é da barra da Juliana. Pode elogiar." | "Bife. Ninguém comenta o bife." |
| Folga | "Bife e salada. ZÉLIA: Olha, tem tomate. Quem morreu?" | "Frango assado do Toninho. LIAM: {Pai}, quando você trabalha de noite tem frango." (silêncio) | "Lasanha. CÔNJUGE: Essa conta de luz fui eu que paguei. Quero ouvir obrigado." | "Lasanha de padaria. CÔNJUGE: Eu comprei. Não perguntei de onde. Não quero saber hoje." |
| Sobra | "Pizza no meio da semana. ZÉLIA: Vão acostumar o menino mal." | "Pizza. Você dorme na segunda fatia." | "Pizza e uma cadeira nova na cozinha. CÔNJUGE: Primeira coisa que eu compro pra mim em dois anos." | "Pizza grande. A Zélia come arroz requentado. ZÉLIA: Eu tô sem fome. De pizza." |

**b) Cônjuge e as contas (antes da tela de contas, uma fala por dia)**
- Aperto: *"Marca o aluguel e a luz. O resto a gente vê."* / *"Se faltar, a gente corta o gás. De novo."*
- Justo: *"Dá pra pagar tudo. Não dá pra pagar tudo e comer bem. Escolhe."*
- Folga (salário): *"Primeiro mês que sobra. Não gasta tudo de uma vez, que eu te conheço."*
- Folga/Sobra (bico): *"Sobrou. Sobrou porque você não dormiu. Eu queria que sobrasse com você em casa."*
- Folga/Sobra (ateliê): *"Hoje eu pago a luz. Deixa eu pagar. Faz bem pra mim."* (a conta de luz já vem marcada como paga pelo ateliê, se `maquina`).
- Folga/Sobra (vereador): *"O dinheiro tá aí. Paga as contas com ele se quiser. Eu não vou tocar."* (D8–D18). Depois de R1 (D9+): *"Paga. Mas paga sabendo de quem era."*

**c) Dona Zélia e o remédio (conta "Remédios da Dona Zélia")**
- Aperto: *"Pula o meu esse mês. Eu tenho umas amostras."* (mentira; se pular, risco +1 como hoje).
- Justo: *"Paga o meu. Eu fico de olho no açúcar."*
- Folga: *"Já que sobrou, compra a fita do aparelho também. Faz três meses que eu meço no olho."* → item novo na loja (fita de glicemia, R$ 25, reduz risco da Zélia em 1 — usa o dinheiro de forma visível).
- Sobra (vereador): *"Remédio comprado com aquilo eu tomo. Porque eu não sou burra. Mas eu tomo com raiva."*

**d) Liam pede coisas (uma fala no quarto, D8+)**
- Aperto: *"Não precisa de tênis novo. O furo é do lado, ninguém vê."*
- Justo: *"Dá pra comprar giz de cera? Só o de doze. O de vinte e quatro é muito."*
- Folga: *"Posso fazer a aula de desenho? A da Dona Iolanda? O Pedro faz."* (libera a loja do D10 com fala)
- Sobra (vereador): *"Na escola falaram que vocês ficaram ricos. É verdade?"* (D10+) → escolha: "A gente ganhou um presente." / "É dinheiro que não é nosso." (Liam: *"Então devolve, ué."*)

**e) Momentos fixos que mudam (texto pronto em `flags.md` e no roteiro do dia):**
- **D9 (noite, asma):** a fala da Zélia *"Nem que eu venda alguma coisa"* só em Aperto/Justo. Em Folga/Sobra: *"Dinheiro tinha. O que faltou foi alguém em casa pra ver o menino puxando ar."* (se não comprou a bombinha no D3 — a crise grave acontece mesmo assim, porque o D3 decide).
- **D10 (aliança):** em Aperto/Justo a cena é a atual (vender). Em Folga/Sobra **sem** vereador: Zélia não oferece a aliança — *"Eu ia te oferecer a aliança do seu pai. Mas vocês tão respirando um pouco agora. Eu guardo mais um mês."* (e conta a história do ônibus — `zelia_contou_alianca`). Em Folga/Sobra **com** vereador: Zélia põe na mesa a aliança **e a cinta de papel do banco** que achou no lixo: *"Teu pai devolvia troco errado de padaria. Isso aqui é o quê, {filho}?"* Escolhas: **contar** ("Foi um agradecimento do vereador.") → ZÉLIA: *"Agradecimento de quê? Você mandou a ambulância pra mãe dele?"* (se `d7_vereador_usa`: *"Mandou. Eu sabia."* Integridade −1) / **"É nosso agora, mãe."** (Laços −1; ela guarda a aliança no sutiã: *"Então essa aqui é minha."*) / **"Vou devolver."** (`prometeu_devolver`; se o jogador não devolve até o D12, a Zélia cobra no D13: *"Devolveu?"*).
- **D11 (aluguel):** o Nogueira cobra R$ 130/140; em Folga/Sobra com vereador, Nogueira: *"Tá bonito o portão. Pintou? Então aluguel sobe no mês que vem."* (só fala; mostra que dinheiro também é visível de fora).
- **D13 (pé da Zélia):** *"O dinheiro tá curto, a bombinha, a luz"* só em Aperto/Justo. Folga (salário/ateliê): *"Eu não queria incomodar. Vocês tão respirando um pouco agora."* Folga/Sobra (bico): *"Você já trabalha de noite por causa da gente. Eu não ia pedir curativo de noventa."* Sobra (vereador): *"Eu não queria gastar o dinheiro daquele homem no meu pé."*
- **D15 (aniversário):** Aperto → bolo fiado do Toninho (atual). Justo → bolo pago do Toninho (*"Pago à vista. O Toninho até estranhou."*). Folga → bolo encomendado com a ambulância de plástico **e** a sirene que acende. Sobra (vereador) → bolo de dois andares de confeitaria do Centro; LIAM: *"É o maior da escola!"*; CÔNJUGE baixinho: *"É o maior da escola."* (sem sorriso). Sobra (bico): você dorme na cadeira antes dos parabéns (Laços +0, não −1).
- **D18 (Gazeta):** ver `flags.md` (`envelope_devolvido`/`envelope_usado`/`nome_na_materia`).
- **Finais:** o final normal só diz "as contas continuam apertadas" se a faixa no D20 for Aperto/Justo (ver `finais.md`).

### 3.2 Henrique erra o endereço: consequência imediata e o bilhete usado

**Hoje:** no D10 à noite, se o jogador não percebe a hipoglicemia da Zélia, ela cai às 22h, você liga, o Henrique atende com voz arrastada, passa "Rua das Palmeiras" em vez de "Acácias", a USB demora 40 min. O jogador pode anotar (`anotou_henrique_d10`) e o bilhete **nunca é usado**.

**1.1 — consequência imediata (D10, dentro da cena `QUEDA`):** a ligação vira interativa (relógio parado, três falas):
> HENRIQUE: R-Regulação... Dr. Henrique. O que aconteceu?
> (você explica) HENRIQUE: Tá. ...Repete o número? ...Quarenta. Palmeiras, quarenta. Tá indo.

Escolhas:
1. **"Acácias, Henrique. A-cá-cias. Repete pra mim."** → ele repete certo, mas o narrador: *"Você ouve ele digitar devagar demais."* Espera: 25 min (`zelia_espera = 25`).
2. **"Me passa a TARM."** → a Cleide (TARM do noturno) pega: *"Acácias, quarenta, casa azul. Anotado, doutor. Desculpa."* Espera: 20 min.
3. **Ligar para o Bené** (só se `promessa_bene` ou `intimBene ≥ 4`: ele te deu o número no D4) → Bené, de casa, liga no rádio da USB 01 pela frequência velha: *"Joana, é o Bené. Acácias. A casa azul do doutor. Corre."* Espera: 15 min (`zelia_bene_corrigiu`, intimBene +1).
4. **Ligar para o Zé Carlos** (só se pegou o telefone dele no almoço do D5) → ele vem a pé, de chinelo, com o glicosímetro da mulher: *"Moro a três ruas. Ela engole? Então açúcar na bochecha, devagar."* Espera da USB igual à 1, mas a Zélia é atendida em 6 min por mãos de socorrista (`zelia_ze_carlos`).
5. **Não insistir** → 40 min (atual).

**Efeito da espera:** ≥ 40 min → Zélia passa a noite em observação na UPA, risco +3 (atual), conta de R$ 30; 20–25 min → risco +2, mesma conta; ≤ 15 min ou Zé Carlos → risco +1, sem observação (conta R$ 10, só o curativo). **Correção médica:** em qualquer caso, açúcar **na mucosa da bochecha, em pequenas porções, só se ela engolir** — nunca suco "goela abaixo" com consciência alterada (corrige o problema apontado no estudo).

**Na mesma noite (sempre):** Liam, acordado, viu tudo. Ele desenha "a ambulância perdida" (uma USB rodando numa rua cheia de árvores com placas "PALMEIRAS"). No D11 o desenho está na geladeira (casa: cozinha). Se o jogador ainda não anotou, **"reparar" no desenho** grava o bilhete por outro caminho: *"22:07. Henrique. Voz arrastada. Pediu o número duas vezes. Passou Palmeiras em vez de Acácias."* (`anotou_henrique_d10`, origem `desenho`).

**D11 (dia seguinte):**
- Passagem (já existe a opção de confrontar). Nova escolha, só com o bilhete: **"Mostrar o bilhete."** → HENRIQUE (lê, devolve): *"Essa letra é sua. ...Guarda isso, {nome}. Não pra mim. Pra você."* (`mostrou_bilhete_henrique`, lealHenrique −1, mas no D12 ele não tenta te convencer: ver abaixo).
- Almoço do D11: Simone vê o bilhete no bolso do jaleco: *"É a letra que eu tô pensando? Não me fala. Se me falar eu tenho que fazer alguma coisa."* (lealSimone +1 se você fala; se fala, `simone_sabe_zelia`).

**D12 — o bilhete vira prova na sindicância:**
- Doc novo na mesa no D12: **`bilhete_henrique`** ("Papel de pão dobrado em quatro. A sua letra, tremida: '22:07. Henrique...'"). O doc existe só com `anotou_henrique_d10`.
- Na cena `d12_sindicancia`, opção nova **"Anexar o bilhete das 22:07 ao parecer."** (denúncia com prova): Integridade +3 (em vez de +2), `denunciou_henrique` + `denuncia_com_prova`. PEIXOTO: *"Com hora e endereço. Isso aqui não dá pra arquivar, {dr}. Nem se eu quisesse."* HENRIQUE (lê o papel, reconhece a rua): *"Palmeiras. ...Eu passei Palmeiras pra sua mãe."* Pausa longa. *"Anexa. Eu assino embaixo."* (ele aceita; a carta do epílogo muda: ver `finais.md`).
- Se o jogador **encobre** tendo o bilhete: o bilhete continua no bolso. HENRIQUE: *"E esse papel aí no seu bolso? Você vai jogar fora, né?"* Escolhas: rasgar na frente dele (`rasgou_bilhete`, lealHenrique +2, Integridade −1 extra) / guardar (`guardou_bilhete`).
- Se **omite** tendo o bilhete: Simone, na saída: *"Você tinha um papel. Eu vi. Quem cala consente, e quem guarda papel consente com recibo."*
- Sem bilhete: opção **"Contar da noite da minha mãe."** → PEIXOTO: *"Sem registro, {dr}, é a sua palavra contra a dele. E a dele tem onze anos de casa."* (a denúncia continua possível, efeito normal).

**Depois:**
- D13 (casa, `guardou_bilhete` ou bilhete sem uso): o cônjuge acha o papel lavando o jaleco: *"Esse papel quase foi pro tanque. Quem é Henrique?"* → conversa (Laços +1 se conta).
- D18 (sindicância por fraude): se `encobriu_henrique && guardou_bilhete && mentiu_9B`, o game over "sindicância por fraude de ficha" muda. Decisão: o bilhete guardado **protege** (usá-lo contra o jogador puniria demais e poria a família contra ele): se `guardou_bilhete`, o game over do D18 vira **advertência** (você mostra que registrou o erro dele na hora). Isso suaviza o jogo, coerente com "não pode ficar mais difícil".
- D19 (passagem, se Henrique não denunciado e `guardou_bilhete`): o papel cai do seu jaleco; Henrique pega: *"Você guardou. ...Por que você guardou, {nome}?"* Escolha "Pra quando você quisesse ler." → ele guarda no bolso dele. **No D20**, no 302, a equipe acha o bilhete no bolso da camisa do Henrique (rádio do Bené: *"Tinha um papel no bolso dele. Com a sua letra."*).

### 3.3 Aulas de desenho do Liam: peso narrativo

**Hoje:** item da loja (R$ 50, D10+, Laços +1, contador `aula_desenho`), nunca lido.

**1.1:** as aulas são com **Dona Iolanda Quintana**, 70, professora de artes aposentada, no **Ed. Aurora, ap. 301** (Rua XV de Novembro, 1950) — **o prédio do Henrique** (302) e do porteiro **Edson** (parada do D1). Sábado de manhã; Liam vai de ônibus 12 com a Zélia (ou com o cônjuge). Na loja, o item passa a se chamar **"Aula de desenho com a Dona Iolanda"** e vem com uma fala do Liam conforme o saldo (ver 3.1-d).

**O que cada aula muda** (`aula_desenho` = número de aulas compradas):

| Aulas | Efeito imediato (casa) | Efeito na história |
|---|---|---|
| **1** | Quarto: o primeiro desenho "de verdade" na parede — o Ozzy de frente, com sombra. LIAM: *"A Dona Iolanda disse que sombra é o lugar onde a luz desistiu."* Liam para de desenhar só ambulância. | Liam conhece o Edson na portaria (*"O porteiro tem uma cicatriz de raio no peito. Disse que um doutor do telefone salvou ele."* — se `d01_parada` vivo). |
| **2** | Sala: retrato da Zélia dormindo na poltrona (ela finge que odeia e guarda). | **O moço da escada:** Liam desenha um homem sentado na escada do 3º andar às dez da manhã, "cheirando a bala". *"Ele perguntou se eu queria ser médico. Eu disse que queria dirigir a ambulância grande. Ele riu e chorou junto."* (doc da casa `desenho_escada`; pista do Henrique para quem não o denunciou). |
| **3** | Cozinha: o desenho da central (a mesa, o telefone, a Simone com post-its coloridos, "o moço do rádio de bigode"). | **A mostra:** a Dona Iolanda inscreve o desenho na **Mostra dos Alunos na Biblioteca Municipal** (noite do D18 ou do D19, se o jogador vai à casa: cena curta). A Carla fotografa (se `depoimento` aceito): a foto sai no D19 com a legenda *"'Meu pai/minha mãe nunca vê' — desenho de um aluno de 8 anos sobre a central de regulação"*. |
| **≥ 4** | O traço vira lápis grafite e aquarela. Liam assina "LIAM, 9 ANOS". | O desenho final do jogo (ver `finais.md`) é feito "de verdade". |

**Ganchos que as aulas resolvem:**
- **Desenho escondido do aniversário (`davi_desenho_escondido`, D15):** se Liam tem aula, ele não joga fora: deixa com a Dona Iolanda. No D19, a professora devolve: *"Ele deixou aqui. Disse que era pra quando {o} {pai} tivesse tempo."* — cena na sala do D19: o desenho "UM DIA INTEIRO" (você e ele no açude do Seu Antônio). Sem aula: o desenho aparece no final normal/bom, no meio dos papéis da gaveta.
- **Liam apanhando (D16):** se tem aula, a Dona Iolanda percebe o roxo no braço no sábado e liga para casa (pré-casa do D16): *"{Dr}? Iolanda, a professora de desenho. O Liam desenhou três meninos grandes e um pequeno no chão. Eu dei aula quarenta anos. Isso não é imaginação."* → abre a conversa com o Liam **sem precisar do "reparar"** (`iolanda_avisou`).
- **Aposentadoria do Bené (D20):** na véspera (D19, quarto), Liam entrega **o desenho da USA 01 com o motorista de bigode** (se `aula_desenho ≥ 1`): *"Leva pro moço do rádio. Fala que é de um fã."* → escolha no almoço do D20 de entregar (intimBene +1; BENÉ: *"Vou pendurar no lugar do retrovisor. Pra ver pra trás eu já tenho memória."*).
- **D20, 18:58 (Henrique não denunciado):** quem liga é a Dona Iolanda (já existe). Se o Liam tem aula, ela te reconhece pela voz e pelo sobrenome: *"É {o} {dr} Moura? Do Liam? O moço do 302, o da escada..."* — e já está com a chave reserva do 302 (o Henrique deixava com ela). A janela da RCP ganha +5 min (o Edson arromba antes, se vivo; ver D20).
- **Finais:** o desenho do fim muda de qualidade e de tema (ver `finais.md`): 0 aulas = giz de cera infantil (arte atual); 1–2 = traço mais firme; 3+ = "desenho de verdade" com sombra.

**Pagar a aula com o dinheiro do vereador:** ZÉLIA (uma vez): *"Lápis comprado com aquilo desenha torto."* — o desenho daquela semana sai **sem rosto** no protagonista (detalhe de arte; LIAM: *"Não consegui fazer você. Você tava mexendo."*).

---

## Parte 4 — Almoço às 13h

Texto completo em **`docs/roteiro-1.1/almoco.md`**. Regras:
- Às 13:00 o relógio para; a cena acontece na **copa da central** (cenário novo `copa`: mesa de fórmica, micro-ondas "novo da OS", filtro de barro, janela para o estacionamento das viaturas). Duração para o jogador: 1–2 minutos. Ligações que chegariam entre 13:00 e 13:15 ficam na fila **sem piorar** (a pausa é real).
- **Exceções dramáticas:** no **D7** (Wesley), no **D9** (véspera das 14:00) e no **D17** (crise da Simone) o almoço é **interrompido** — essas são as cenas mais fortes justamente porque o jogador aprendeu que almoço é pausa.
- Cada almoço tem 1–2 escolhas que pesam (lealdade, pista, gancho). Quem está lá muda: Simone quase sempre; Bené de passagem (base da USA 01 é ao lado); Peixoto às vezes; Lia, Joana, Tico, Castro, Rose; o Saulo por telefone (D11) e em pessoa (D19).
- As falas de "almoço" que já existem nas timelines (D1 12:20, D2 12:40, D3 12:30, D5 12:30, D12 12:20, D13 12:20, D14 12:10, D20 13:00) migram para dentro da cena.

## Parte 5 — Ida e volta

Texto completo em **`docs/roteiro-1.1/ida-volta.md`**. Regras:
- **Ida** (06:20–06:55): portão → rua → ponto → ônibus 12 (Seu Aílton) → descida na XV. 3–6 linhas, às vezes uma escolha. Abre antes da passagem de plantão.
- **Volta** (19:05–19:40): central → ponto → ônibus → rua → portão. Fecha antes da casa (ou antes da Intervenção, se for bico: aí a volta é "você não volta; liga pra casa do orelhão da base").
- Escolhas pequenas com efeito real: comprar pão/sonho no Toninho (−R$ 4, Laços +1 no jantar), dar o lugar no ônibus, falar com o Biel no ponto, aceitar carona, pagar o fiado.
- Dias de folga entre plantões (ver calendário) são citados na ida: *"Dois dias de folga e você ainda ouve o telefone tocando no chuveiro."*

## Parte 6 — Casa explorável

Texto completo em **`docs/roteiro-1.1/casa.md`**. Cômodos: **Cozinha, Sala (com o sofá-cama da Zélia), Quarto do Liam, Quarto do casal (novo), Quintal (novo: varal, tanque, casinha do Ozzy, pé de limão), Portão/calçada**. Em cada um dos 20 dias, cada cômodo tem uma coisa diferente (objeto clicável, cena curta, Ozzy). Ficar com a família = poder andar pelos cômodos; descansar = só a cozinha e o quarto do casal; bico = a casa vazia de madrugada (um objeto por cômodo, bilhetes).

## Parte 7 — Vaga zero

Texto completo em **`docs/roteiro-1.1/vaga-zero.md`**. Resumo: o **Dr. Saulo Brandão** (plantonista do Regional) é o antagonista-que-vira-aliado. Vaga zero **negociada** a partir do **D3** (Conceição), depois D5, D8, D9, D11 (inversão), D15, D16, D18, D19 (clímax, Cida) e D20. Árvore de argumentos com base médica correta; sem acordo → viatura presa; Peixoto 1×/plantão a partir do D5; encenação "tempo parando".

## Parte 8 — Trotes e folgados

Texto completo em **`docs/roteiro-1.1/trotes-folgados.md`**. Resumo: 5 trotes óbvios e engraçados com risada (D1 ET, D2 lambari, D6 avó ao contrário, D12 capivara, D20 gato-morcego); os outros **sem risada**, com pistas para o médico que não são o endereço (incoerência clínica, ambiente, comportamento, retorno, vídeo, as perguntas fixas). 8 ligações de folgados para o banco, com "piii".

## Parte 9 — Finais

Texto completo em **`docs/roteiro-1.1/finais.md`**: quatro finais reescritos, condições ajustadas, epílogos de 18 fios com variações (Henrique corrigido: **não denunciado + sobreviveu = internado e tratamento**), encenação gráfica (cenas, quadros, música).

---

## Parte 10 — Calendário

**Decisão:** manter os dias da semana dos arquivos (plantão de 12 horas não é todo dia; folga entre plantões é realista) e **corrigir os textos** que tratam plantões separados por folga como "ontem/amanhã". As folgas viram linha de ida ("Dois dias de folga...").

Datas (a campanha da Simone já fixa D1 = segunda, 3 de março):

| Dia | Data | Semana | Folga antes? |
|---|---|---|---|
| 1 | 3/3 | segunda | — |
| 2 | 4/3 | terça | — |
| 3 | 5/3 | quarta | — |
| 4 | 6/3 | quinta | — |
| 5 | 7/3 | sexta | — |
| 6 | 8/3 | sábado | — |
| 7 | 9/3 | domingo | — |
| 8 | 10/3 | segunda | — |
| 9 | 13/3 | **quinta** | **ter 11 e qua 12** |
| 10 | 14/3 | sexta | — |
| 11 | 15/3 | sábado | — |
| 12 | 16/3 | domingo | — |
| 13 | 18/3 | **terça** | **seg 17** |
| 14 | 19/3 | quarta | — |
| 15 | 21/3 | **sexta** | **qui 20** |
| 16 | 22/3 | sábado | — |
| 17 | 24/3 | **segunda** | **dom 23** |
| 18 | 25/3 | terça | — |
| 19 | 27/3 | **quinta** | **qua 26** |
| 20 | 28/3 | sexta | — |
| ("dia 31") | 31/3 | segunda | corte da TARM |

**Correções de texto:**

| Onde | Hoje | Passa a ser |
|---|---|---|
| D9 Cida B (`d09_cida_b`) | "inchado desde ontem", "desde a queda de ontem", diário "A queda de ontem" | "desde segunda", "desde a queda de segunda", "A queda de segunda tinha sido dispensada. Três dias." (o tempo maior **aumenta** o peso da dispensa) |
| D9 Cida A | já de gesso | "Tirei o gesso provisório ontem e botaram o de verdade" (ok em 3 dias) |
| D9 jornal (Rosângela) | notícia do dia | **Gazeta de quinta, matéria de fundo:** "TRÊS DIAS DEPOIS: a mulher que pediu pizza" (salva) / "Rua Ipê: polícia ainda procura o marido" (morta, com R1) |
| D9 bilhete da Márcia | "na mesa no D9" | "O bilhete do sarau de segunda está na mesa. Você trouxe e esqueceu." |
| D9 Henrique "te devo uma" | manhã seguinte | "Segunda você assinou dezenove horas pra mim. Te devo uma." |
| D9 rádio do parto (Tainara) | — | ok |
| D10 Zélia | "Cozinha. Fim de tarde... Chegou cedo hoje" | "Cozinha. Começo da noite. — Chegou, {filho}? Hoje até que não demorou." |
| D10 Zélia | "Ontem foi o susto do menino" | ok (D9 quinta → D10 sexta) |
| D12 anúncio Têxtil | "Entrevistas no Hotel Central, segunda e terça" | "Entrevistas no Hotel Central, **neste domingo e na segunda**" |
| D12 nó `dormir` | "Amanhã você trabalha." | "Terça você trabalha. Amanhã você dorme. Pelo menos isso." |
| D12 nó `cracha` | "desde as sete da manhã de ontem" | "desde as sete da manhã" |
| D12 Rosângela | "semana passada" | "na segunda" |
| D12 ficha da sindicância (Yuri) | USB 04:05, óbito 04:10 "a caminho" | USB enviada 03:58, óbito 04:24 a caminho do Regional |
| D14 fim / bico | "Amanhã ele vai estar na sua mesa", "Amanhã a gente conversa" | "Sexta ele vai estar na sua mesa", "Amanhã a gente conversa" (fica: é casa, não plantão) |
| D17 jornal / D18 Peixoto / D18 rádio do teste (Osvaldo) | "segue internado" × "em casa comendo goiabada" × "o 41 tá vazio desde a semana passada" | D17: "segue internado"; D18 Peixoto: "Meu pai saiu da UTI ontem. Pediu goiabada. A enfermeira escondeu."; rádio do teste: "o 41 tá vazio desde sábado, o dono tá no Regional" |
| D18 Simone (campanha) | "Dia 31. Faltam doze dias" | "Dia 31. Faltam seis dias." |
| D19 Simone (campanha) | "Faltam onze dias pro dia 31" | "Faltam quatro dias pro dia 31." |
| D20 Henrique "hoje é o dia doze" | — | ok (denúncia dom 16 → sex 28 = 12 dias) |
| D3 receita "vence em janeiro", UBS "28 de março" | — | ok com o calendário (D3 = 5/3) |
| D5 jornal "matrícula grátis em março" | — | ok |

## Correções de continuidade (história)

- **Escola:** Escola Estadual Prof. **Aurélio Valença**, **Rua Ipê, 901** em todo lugar (D2, D5, D10, D14; `ADDR.escola`).
- **D2 água:** a escolha "A gente paga" **marca a conta** automaticamente (fala e conta coerentes); se o saldo não der, o cônjuge diz *"Hoje não dá. Amanhã."* e a conta fica desmarcada com aviso.
- **D4 pote de margarina:** "tinha cento e vinte, setenta foram na água, cinquenta foram no gás". 
- **D5 Benedita:** idosa confusa **não assina termo de recusa**. O padrão do rádio passa a ser **"Convencer e levar" (conversa de 10 min pelo rádio)**; "termo de recusa" continua opção, mas o rádio da equipe responde: *"Doutor, ela chamou a vizinha de Lurdinha... Jandira, quer dizer. Ela não tem condição de assinar nada."* — e a opção vira "levar mesmo assim". Fala da Sônia: *"Ela nunca confunde nada, {dr}. Faz palavra cruzada todo dia. Hoje confundiu."*
- **D9 Marcos:** "Moça! {Dr}!" → "{m:Moço|Moça}! {Dr}!".
- **D9 rádio da Márcia:** "...Achei." → *"A caneta vencida segurou ela. Quem mandou aplicar foi a voz do telefone, o marido disse."*
- **D11 Juliana:** "vocês dois" → "{m:vocês dois|vocês duas}".
- **D11 crachá da professora** (Liam fiscal da dengue): se `marcia_morreu` → *"A professora nova deu crachá. A Tia Márcia ia dar."*
- **D14 Cida:** linhas sobre a Zélia com `when` Zélia viva; senão *"A sua mãe falava dele toda terça. Que ele desenha ambulância."*
- **D20 Dr. Castro:** sai da cadeira do noturno (ele está com o Henrique/Seu Dito no Regional). Quem senta às 19:25 é **o Peixoto** (se não caiu: *"Fazia quatro anos que eu não regulava, {dr}. Vai pra casa."*) ou a **Dra. Heloísa** (se caiu). Com Paula: Paula chega correndo (atual).
- **Final normal "mesmo Peixoto"** e **final ruim "nome na matéria"**, **fio da Simone** (`materia_publicada` → `materia_forte`): ver `finais.md`.
- **Ids com "samu"** (`samu` em d06, `mae_samu` em d07): renomear para `regulacao` / `mae_regulacao` (interno).
- **Bené "dezoito anos" × "trinta e um de volante":** resolvido por R5 (13 de ônibus + 18 de ambulância).
- **Bico do D8:** se o jogador assina 19:32 "porque o filho tá esperando" e depois escolhe bico, a Simone diz *"Corre. ...Pra ambulância, né? Ah, {nome}."* (em vez de "Boa apresentação").

---

## Parte 11 — Campanhas novas (Onda 3)

Sementes em **`docs/roteiro-1.1/campanhas.md`**: Henrique (as noites dele, de 2019 ao D20), Peixoto (coordenador: metas, OS, vereador, pai, a folha do quarto andar), Bené (dirigindo: mapa, transferências, maca presa, a última corrida).

---

# PARTE FINAL — Roteiro do dia N

Para cada dia: **o que muda** (lista para implementar), com referência ao arquivo de texto. Siglas: **[A]** almoço (`almoco.md`), **[IV]** ida/volta (`ida-volta.md`), **[C]** casa (`casa.md`), **[VZ]** vaga zero (`vaga-zero.md`), **[T]** trotes/folgados (`trotes-folgados.md`), **[F]** flags (`flags.md`). Flags novas em `código`.

### Dia 1 — "Primeiro Plantão" (seg 3/3)
- [IV] Ida: o primeiro ônibus 12; Seu Aílton: *"Primeiro dia? Na central? Ih. Senta na frente."* Volta: o semáforo da Av. Brasil 2650 (onde caiu o homem da parada).
- Passagem: manter "Reparar nas mãos dele" (`henrique_maos_d1`) — agora lida no D12 e no D20 [F].
- Jornal: nota nova "Regional inaugura ala com seis leitos no 4º andar" (pista R2).
- Ligações: d01_cida (farmácia do **Seu Gervásio**); d01_parada: o homem é **Edson Ribeiro, 56, porteiro do Ed. Aurora** (diário D4); d01_et fica óbvio e engraçado (tutorial reescrito sem TAB: ensina a desconfiar pela incoerência e pelo "Ligar de volta"; o endereço quem confere é a Simone).
- [A] Almoço 1: dividir a marmita com a Simone; "o Henrique janta às sete da manhã".
- [C] Casa 1: bolo de fubá; Ozzy rouba a vela; primeiro desenho na geladeira.
- Ozzy: corre pela sala latindo e cai no tapete (item 54) ao "brincar com o Ozzy" — vale para todos os dias.

### Dia 2 — "O Quadro" (ter 4/3)
- [IV] Ida: Biel no ponto (fone, mochila da Estadual fechada) — o jogador não sabe quem é. Volta: Dona Dirce comenta a conta d'água.
- Trotes: d02_biel sem risada (cochicho "fala que o sangue tá jorrando"); d02_peixe óbvio e engraçado [T]. `fechada` (escola fechada) liberada pela pergunta "O que aconteceu?" (não mais pelo modo).
- [A] Almoço 2: Lia e o "quarenta minutos" (pista R3), `lia_2019`.
- [C] Casa 2: água cortada/paga; garrafas pet do Liam no quintal; escolha da fala marca a conta.
- Continuidade: escola Aurélio Valença, Rua Ipê 901.

### Dia 3 — "O Peito" (qua 5/3)
- **1ª vaga zero** [VZ]: Conceição (10:40) → Regional "lotado"; Saulo apresentado; guiada pela Simone (sem Peixoto ainda). `saulo_confianca` começa.
- d03_bicicleta: quitanda da **Dona Quitéria**. d03_conceicao: vizinha **Dona Leonor**. d03_acamado: esposa morta **Dita**. d03_muscular: **Pâmela**.
- [A] Almoço 3: feijoada, Dr. Castro: "o Saulo é bom médico. Só tem medo." (`castro_saulo`).
- [C] Casa 3: bombinha (falas por faixa só a partir do D7; aqui o aperto é real). Usar `zelia_ofereceu_remedio` e `d3_segurou_bombinha` [F].
- [IV] Volta: farmácia do Gervásio fechada ("abre às oito"); se prometeu a bombinha, o narrador lembra.

### Dia 4 — "Cena Quente" (qui 6/3)
- [IV] Ida: **a cruz "RAFAEL ✝ 2019" no poste da Av. Brasil** (pista R3); Aílton faz o sinal da cruz.
- Passagem do Bené: `promessa_bene` agora dá o **telefone do Bené** (usado no D10) [F].
- [A] Almoço 4: Bené e o ônibus 12 (pista R5); "Me ensina as ruas" → mapa no guardanapo (`bene_mapa_guardanapo`).
- d04_tiro: `d4_pm_tardia` lida no D5 (Bené) [F]. d04_joelho: **Seu Onofre**.
- Diário (atrasado do D1): "Edson Ribeiro, 56, porteiro do Ed. Aurora. Teve alta da UTI."
- [C] Casa 4: máquina de costura; `maquina_prometida` lida no D11 e no final [F].

### Dia 5 — "Corte" (sex 7/3)
- [VZ] Vaga zero 2: Gildásio (12:00, TRM). Saulo irredutível → **Peixoto liberado pela primeira vez** (1×/plantão), que diz a frase do quarto andar (pista R2). `peixoto_negociou_d5`.
- 07:02 Zé Carlos entrega a USA 03. [A] Almoço 5: sentar com o Peixoto ("Seu pai mora sozinho?" → `peixoto_pai`) **ou** com Zé Carlos (pega o telefone dele: `tel_ze_carlos`).
- d05_benedita: padrão do rádio = convencer e levar (correção ética). d05_piscina: avó **Dona Glória**, criança **Tobias**. Irmã da Benedita: **Jandira**. Recepcionista da academia: **Yumi**.
- [C] Casa 5: "cara de quem chorou"; o extrato dos R$ 30.

### Dia 6 — "O Lado do Rosto" (sáb 8/3)
- d06_hipo_mae: Ana Clara, 7, **2º ano da Monteiro Lobato** (a escola do Liam). [A] Almoço 6: Joana conta da menina (`ana_clara_escola`).
- d06_avc: `d6_avc_regional` lida no D8 (Ademir no jornal + na ida, de bengala) [F]. d06_cida: `d6_cida_fast` lida no D19 [F]. d06_avc2: **Seu Lázaro**. d06_lombar: **Seu Dorival**.
- [C] Casa 6: geladeira e Seu Jairo; recibo "neto Gabriel — 9-8877".
- [IV] Volta: Biel no ponto de novo — agora com o boné do avô ("JAIRO REFRIGERAÇÃO").

### Dia 7 — "O Vereador" (dom 9/3)
- **R1, pista 1:** o assessor **Wagner Tavares** na porta: "Tá bom? Tá bom.", aliança apertada, arranhão nas costas da mão, "A patroa me espera".
- 10:15 assessor na base: `d7_assessor_negado` lido no D8 (Peixoto) e no D9 (Simone reconhece o W.T.) [F].
- d07_wesley passa para **13:05**: [A] Almoço 7 **interrompido** — a Simone abre a marmita que o Wesley fez; o telefone toca. `d7_simone_ouviu` lido no D17 [F].
- d07_vereador: `d7_vereador_usb`/`_ori` lidos no D18 (Odete) [F].
- [C] Casa 7: envelope (falas de dinheiro passam a valer a partir daqui) [3.1].
- Wesley: sobrenome **Campos Batista**.

### Dia 8 — "A Apresentação" (seg 10/3)
- **R1, pista 2:** na pizza, a voz ao fundo: "Desliga isso. Tá bom? TÁ BOM?". Pergunta "Você está em perigo?" liberada ao perguntar "Aqui é a Regulação" ou "Está segura?" (não mais pelo modo).
- [VZ] Vaga zero 3: Otávio (09:20, TCE anticoagulado) — **o argumento da tomografia** ("se a tomo vier limpa, eu tiro e levo pra UPA") — ver nuance médica.
- Passagem: a escolha "aviso/ok" grava `avisou_sarau` (lida no D9) [F].
- [A] Almoço 8: Rose do RH e o ponto do Henrique (`rose_ponto_henrique`).
- Ligação d08_onibus: Seu Aílton ("esse ônibus já viu até casamento" — pista R5). d08_diarreia: neta **Rayssa**.
- [C] Casa 8: sarau; Márcia; escolha "caneta de adrenalina" grava `marcia_caneta_alerta` (lida no D9) [F].
- [IV] Volta: carro preto devagar na Rua Ipê; sobrado verde com a luz acesa.

### Dia 9 — "Linha Direta" (qui 13/3)
- **R1 vira:** jornal com W.T. (preso ou foragido). Passagem: Simone reconhece o "de terno".
- Calendário: "desde segunda" (Cida B), Henrique "segunda você assinou". 
- [VZ] 11:00: a retenção vira vaga zero do Everton (TCE grave); com acordo → rendez-vous 14:20; sem acordo → USA presa (é por isso que às 14h só há uma). Pista R2 (maca subindo pro 4º andar).
- Ordem do Peixoto (13:45): escolha **"Anotar a ordem num post-it"** → `ordem_peixoto_registrada` (substitui o link) [F].
- [A] Almoço 9: Simone lê o bilhete "Tia Márcia, 3º B" no quadro; você conta quem é → `falou_marcia_almoco` → às 14:00 o nome "Márcia" liberta "Eu sabia quem era" (`sabia_que_era_marcia`).
- `d9_favorecimento`, `d9_impedimento`, `admitiu_vinculo`, `mentiu_9B`, `d9_lucia_religou`, `d9_parto_regulado`, `d9_negociou` → usos no D10–D20 [F]. Bebê da casa 88 = **Benício** (se parto regulado).
- [C] Casa 9: noite da asma; falas de dinheiro por faixa; R1 na mesa (o jornal).

### Dia 10 — "Ninguém é Bobo" (sex 14/3)
- [A] Almoço 10: a Zélia liga "Almoçou? Eu já almocei. Arroz com ovo." (pista; `zelia_ligou_almoco`).
- d10_biel: "Gabriel, o seu avô sabe?" liberada ao "Ligar de volta" (a caixa postal diz "é o Biel, neto do Jairo da refrigeração") → `d10_biel_nome` (lido no D16) [F]. d10_igreja: confronto liberado pela pergunta "Posso ouvir o seu pai?".
- [C] Casa 10: hipoglicemia da Zélia com "reparar"; aliança por faixa × origem (3.1); **queda interativa** (3.2): Henrique, Palmeiras/Acácias, Bené/Zé Carlos/TARM; Liam desenha "a ambulância perdida". `zelia_contou_alianca` (R5).
- Loja a partir de hoje: **Aula de desenho com a Dona Iolanda** [3.3]; fisio; pizza.
- [IV] Ida: Benício no carrinho (se nasceu). Volta: Seu Jacó fechando a joalheria.

### Dia 11 — "Febre" (sáb 15/3)
- Passagem: "Mostrar o bilhete" (3.2). `confrontou_henrique_d11` lido no D12 [F].
- [A] Almoço 11: **o Saulo liga pedindo uma USA** para transferir um paciente (inversão) → `saulo_devendo` / `saulo_negado` [VZ].
- d11_barriga: paciente **Murilo Moreira**, 28. d11_febre: **Isadora**, 6, mãe **Dona Zuleica**. d11_idoso: **Seu Germano**. d11_olhos: **Germana Rocha**.
- [C] Casa 11: Nogueira (R4 pista); Juliana ou dengue; desenho da ambulância perdida na geladeira.
- Loja: "Comprar a aliança de volta" (se vendida) [R5].

### Dia 12 — "Do Outro Lado da Linha" (dom 16/3)
- Doc `bilhete_henrique` (se anotou). Sindicância com "Anexar o bilhete" (3.2). Henrique: "Em dezenove não teve sindicância" (pista R3). `henrique_maos_d1` lido aqui ("as mesmas mãos do primeiro dia").
- Ficha: **Dona Otília Barreto**, 68 (no lugar de Rosa Teixeira); horários do Yuri corrigidos.
- [A] Almoço 12: Simone e a demissão (movida das 12:20); o Bené senta junto.
- d12_rosangela: o caderninho (R1) → `rosangela_caderninho`, `rosangela_protegeu`. d12_cartelas: **Ícaro**.
- [C] Casa 12: proposta da Têxtil (anúncio "domingo e segunda"); "reparar" na bolsa/varal/crachá.
- [IV] Ida: Reginaldo no ponto, bochecha inchada.

### Dia 13 — "Produto de Limpeza" (ter 18/3)
- [A] Almoço 13: Joana viu a Zélia de sapato fechado (`joana_viu_zelia`); curativos da Simone.
- d13_soda: **Sofia Ribeiro**, 3. d13_infarto: esposa **Dona Zenaide**. Trote d13 sem risada [T].
- [C] Casa 13: pé da Zélia ("reparar"); a Zélia sobre a Cida e o ônibus (pista R5); máquina da Cida; desenho "o moço da escada" (se 2 aulas).
- [IV] Volta (se aula ≥ 1): o Edson na portaria do Ed. Aurora acena para o Liam (cena curta se a família foi buscar).

### Dia 14 — "Carla" (qua 19/3)
- Carla na porta: irmão **Rafael**, 12/04/2019; "o registro se perdeu na migração do sistema" (pista R3). Confronto da jornalista liberado ao perguntar "Por que a senhora quer saber o tempo?".
- [A] Almoço 14: Simone reconhece a voz e quase conta 2019 (`simone_2019_meio`).
- d14_preeclampsia: **Mirela Valença**. d14_ciclista: **Celso Dias**. d14_idosa: filha **Fátima**. d14_trote: "Benedito Silva / neto Bruno".
- [C] Casa 14: cartão da Carla na máquina ("reparar"); `depoimento_ordem`/`depoimento_ponte` usados no D18 [F].

### Dia 15 — "O Show" (sex 21/3)
- [A] Almoço 15: pedir ao Peixoto pré-autorização do reforço de Rio Claro (`reforco_preautorizado` → reforço em 18 min em vez de 28).
- MCI: Taís voluntária (se academia salva no D5); [VZ] negociações com o Regional (Saulo abre 2 leitos do 4º andar se `saulo_confianca ≥ 2`).
- d15_fila: **Abigail**. d15_mae: filho **Teodoro**.
- [C] Casa 15: aniversário por faixa × origem; presente da Cida = **caderno de guardanapos do Nestor** (R5); desenho escondido → com a Iolanda (3.3). `aniversario_pago`/`_fiado` lidos no D16 e no final [F].
- `juliana_pai_avisado` lido no D20 (Antônio) [F].

### Dia 16 — "O Menino que Gritava Lobo" (sáb 22/3)
- [A] Almoço 16: Peixoto liga do carro ("meu pai não atende") → `peixoto_avisado_d16` natural (substitui o link).
- d16_osvaldo 14:30 → **R2 vira (14:40): o Saulo liga** (folha do quarto andar; 2019 em parte). `saulo_fonte` / `saulo_sozinho`.
- d16_biel: o recibo e `d10_biel_nome` ("Você é o Gabriel. O neto do Seu Jairo." → ele para de chorar e obedece o guia) [F].
- d16_cida: "A senhora está bem mesmo?" liberada ao perguntar da novela → `cida_sinal1`.
- [C] Casa 16: Liam apanhando — descoberto por "reparar", pela Iolanda (aula) ou pelo cônjuge; promessa do domingo.

### Dia 17 — "Água" (seg 24/3)
- Manhã: Nogueira ao telefone ("vou ver as casas da Baixada") — pista R4.
- **13:00 almoço = crise da Simone** (interrompido).
- **15:40 R4 vira:** `d17_muro` = Seu Alcides Nogueira preso no muro da casa 14. `d17_nogueira_salvo` / `_morto`.
- d17_cida: "repetiu" liberada ao perguntar "A senhora já me disse isso?" → `cida_sinal2`. d17_vidro: **Nádia**. d17_telhado: **Seu Severino**; filha **Lorena** (no lugar da Sofia).
- [C] Casa 17: goteiras; bilhete do filho do Nogueira (aluguel perdoado/abatido).

### Dia 18 — "Escândalo" (ter 25/3)
- Matéria: fontes = você, cônjuge, Bené, Peixoto **+ Saulo + caderninho da Rosângela** (cada um +1); `nome_na_materia` depende de envelope e `rosangela_protegeu`.
- 07:05 Bené (já existe). **13:00 almoço: Bené diz que o regulador de 2019 era o Henrique (R3 vira).**
- d18_odete: leito do 4º andar em 4 minutos (R2) → argumento novo para o Jonathan (17:00) [VZ].
- d18_desabafo: pai = **Seu Augusto Gonçalves**. Ligação-teste do Peixoto: "desmascarar" liberado pelo "Ligar de volta" (cai no ramal da coordenação).
- [C] Casa 18: Gazeta; envelope por origem; telhado consertado (R4); mostra de desenho (se 3 aulas).

### Dia 19 — "Dona Cida" (qui 27/3)
- [A] Almoço 19: **o Saulo vem em pessoa** trazer a folha (se `saulo_fonte`) ou ligar; pedir que segure um leito "pra uma senhora que ainda não ligou" (`saulo_leito_cida`).
- d19_asma = **Ana Clara Santos, 7** (mãe Jaqueline ou avó Rita). d19_escada: **Seu Odair**. d19_parto: **Leandra**, marido **Cristiano**. d19_infarto: **Seu Vilmar**. d19_marimbondo: **Humberto**. d19_onibus: paciente **Edgar**.
- 18:30 Cida — **clímax da vaga zero** [VZ]; "reconhecer" liberado ao perguntar da novela ou pelo FAST; `d6_cida_fast` ("Você vai saber que sou eu") pesa aqui.
- [C] Casa 19: véspera; desenho escondido devolvido pela Iolanda; desenho para o Bené; comprar a aliança de volta (último dia de loja).

### Dia 20 — "Último Plantão" (sex 28/3)
- [IV] Ida: o último ônibus de ida; Seu Aílton sabe que é o último dia do Bené.
- [A] 13:00 última marmita do Bené: **R5 vira** (o ônibus 12, a Zélia). Entregar o desenho do Liam.
- 18:58: Henrique no 302 (não denunciado) com Dona Iolanda + Edson (se vivo) — janela maior; ou Seu Dito com Wellington. Vaga zero do Henrique: Saulo "Manda. Eu conheço o Henrique." [VZ].
- 19:25: quem senta no noturno = Peixoto / Heloísa / Paula (corrige Dr. Castro).
- [IV] **Volta = abertura do final:** o último ônibus 12 de volta (ver `finais.md`).
