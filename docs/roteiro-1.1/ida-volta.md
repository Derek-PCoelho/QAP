# Ida e volta do plantão — dia a dia

**Mecânica (pedido à Fundação):** duas cenas curtas por dia, com cenário de rua.
- **Ida** (06:20–06:55): abre antes do jornal/passagem. Cenários: `porta` (portão da casa azul, nº 40), `calcada`, `ponto_onibus` ("LINHA 12", já existe no stage), `onibus` (já existe), descida na XV.
- **Volta** (19:05–19:40): fecha antes da casa. Se o jogador escolhe **bico**, a volta é trocada por "Orelhão da base" (uma linha: *"Você liga pra casa do orelhão do pátio. Toca, toca. {Oconj} atende: 'Vai, vai. A gente guarda o prato.'"*).
- 3–6 linhas, no máximo uma escolha. Escolhas custam pouco (R$ 4, um minuto de cena) e mexem em Laços, flags ou falas futuras.
- **Personagens fixos:** Seu Aílton (motorista do 12, boné do Corinthians desbotado, rádio AM baixinho), Seu Toninho (padaria; pizzaria à noite), Dona Dirce (vizinha da frente, vassoura, rádio AM), Diego e Tainara (casa 88), Biel (ponto da XV, fone), o Ozzy no portão (late para a moto do entregador às 06:30 todo dia).
- Dias com folga antes (D9, D13, D15, D17, D19): a ida cita a folga.

---

### D1 (seg) — Primeiro dia
**Ida.** *06:20. O Ozzy late para a moto do entregador como se fosse a primeira vez. É a primeira vez de você também.*
DONA DIRCE (varrendo a calçada às seis da manhã): Primeiro dia, {dr}? Vai com Deus e volta com o mesmo nome.
*No ônibus 12, o motorista olha o crachá novo pendurado no pescoço.*
SEU AÍLTON: Central da Regulação? Ih. Senta aqui na frente. Quem trabalha lá desce no ponto da XV com cara de enterro. Na volta, com cara de velório.
**Volta.** *19:20. O ônibus para no semáforo da Av. Brasil, 2650. Na calçada, um vendedor de bilhete fala alto com um amigo: "...e eu fiquei apertando o peito dele até a ambulância chegar, igual a moça do telefone mandou!"*
*Se a parada do D1 foi salva: o vendedor (Wellington) ri e chora ao mesmo tempo. Se não: ele fala baixo.* (sem escolha)

### D2 (ter) — O moleque do ponto
**Ida.** *No ponto, um moleque de uns quinze anos, mochila da Estadual nas costas, fone gigante, rindo do celular. Hoje não tem aula na Estadual.*
SEU AÍLTON: Esse aí pega o doze todo dia e não paga. Neto do Jairo da geladeira. Fala "bom dia" com o dedão.
1. **"Bom dia." (para o moleque)** → *Ele tira um lado do fone. "...Dia." Volta pro celular.* (`viu_biel_ponto`; no D16, a voz chorando no telefone ganha a nota do narrador: "Você já ouviu essa voz dizer 'dia' num ponto de ônibus.")
**Volta.** DONA DIRCE: Vi o homem do DAE na sua porta. Ô, que vergonha esse Nogueira. Dívida do inquilino de antes é do inquilino de antes. *(Se `brigou_nogueira`: "Ouvi você brigando no telefone daqui. Bem feito pra ele.")*

### D3 (qua) — A farmácia
**Ida.** *Garoa fina. A Drogaria do Gervásio ainda está de porta baixada. Placa: "FARMÁCIA POPULAR AQUI".*
**Volta.** *19:30. A drogaria fechou às sete. A placa da Farmácia Popular continua lá, acesa.*
NARRADOR (se a bombinha não foi comprada e não há bico): *Você conta as moedas no bolso no ponto. Oitenta reais não cabem num bolso.*
1. **Descer um ponto antes e ver se a farmácia 24h do Centro está aberta (R$ 80 se tiver saldo).** → compra a bombinha já na volta (`bombinha`, `bombinha_dia=3`); a cena da tosse em casa muda (você chega com a sacola). Se não tiver saldo, a escolha não aparece.

### D4 (qui) — A cruz no poste
**Ida.** *O 12 faz a curva da Av. Brasil. No poste do número 2400, uma cruz de madeira pintada de branco, com flor de plástico desbotada: "RAFAEL ✝ 2019". Seu Aílton faz o sinal da cruz sem tirar a mão do volante.*
1. **"Quem era?"** → SEU AÍLTON: *"Menino de moto. A ambulância demorou. Tá vendo o Regional ali? Quatro quadras. Quatro."* (pista R3; `viu_cruz`)
2. **Ficar quieto.** → *O ônibus passa. A flor de plástico balança com o vento do ônibus, como se alguém tivesse acenado.*
**Volta.** *O Bené te dá carona até o ponto na viatura recolhida (só se `promessa_bene`).* BENÉ: *"Não conta pro Peixoto. Viatura não é táxi. Mas regulador que promete PM pode ir até o ponto."* (intimBene +1)

### D5 (sex) — A garagem
**Ida.** *Na Vila Esperança, a base da USA 03 está com o portão fechado e um cadeado novo. Um papel A4: "BASE TEMPORARIAMENTE DESATIVADA — SAÚDE+ GESTÃO".*
DONA DIRCE: Fecharam a ambulância do bairro, {dr}. Agora se eu cair, eu caio mais longe.
**Volta.** *O Zé Carlos está no ponto, de roupa comum, com uma sacola de mercado. Remanejado para "a casa dele".* (se você sentou com ele no almoço: ele acena "Ipê-Roxo, três ruas!"; se não: ele não te conhece.)

### D6 (sáb) — O boné do Jairo
**Ida.** *Sábado. A padaria do Seu Toninho cheira a pão de queijo.*
SEU TONINHO: Pão pra Dona Zélia? O de sal pouco. Ela reclama que o meu tem sal. Não tem. É ela que tem pressão.
1. **Levar quatro pãezinhos (R$ 4).** → no café da noite, a Zélia: "Pão do Toninho de manhã e você só volta de noite. O pão envelheceu esperando você." (Laços +1)
**Volta.** *No ponto da XV, o mesmo moleque, agora com um boné vermelho: "JAIRO REFRIGERAÇÃO". Ele fala ao celular: "Vô, eu já tô indo, para de ligar."* (se a geladeira já foi consertada por Jairo hoje: o narrador liga as duas coisas — "O recibo na geladeira diz 'neto Gabriel'.")

### D7 (dom) — Domingo
**Ida.** *Domingo, o 12 passa de meia em meia hora. Você espera vinte minutos no ponto com a Dona Dirce, que vai à missa das sete.*
DONA DIRCE: A missa hoje é pelos plantonistas. Eu vou pedir por você. Pede você também, que santo gosta de ouvir a voz do interessado.
**Volta.** *Na Vila, um carro preto, vidro escuro, estacionado na sua rua. Um homem de terno no banco do motorista, falando ao celular: "Tá bom? Tá bom."* (é o Wagner, minutos antes de tocar a campainha — a cena do envelope começa daqui)

### D8 (seg) — O sobrado verde
**Ida.** *Seu Aílton está de mau humor.*
SEU AÍLTON: Ontem um menino desmaiou no ônibus, em jejum pra exame. Hoje vai ser outro. Esse ônibus já viu de tudo. Já viu até casamento. *(a ligação `d08_onibus` às 07:10 é dele)*
*Se `d6_avc_regional`: no ponto, Seu Ademir de bengala e a Dona Neide: "Doutor do telefone? O Aílton contou que é você. Ele toma café agora, viu? Reclama do café."*
**Volta (se não foi bico; se foi ao sarau, a volta é o caminho da escola).** *O ônibus passa pela Rua Ipê. No 112, um sobrado verde. Luz da cozinha acesa. Um carro preto na frente.* (pista R1)

### D9 (qui) — Dois dias de folga
**Ida.** *Dois dias de folga e você ainda ouve o telefone tocando no chuveiro. A cidade está cheia de abelha: na lixeira do ponto, na banca, no copo de caldo de cana do Seu Aílton.*
SEU AÍLTON: Calor de abelha, {dr}. Quem é alérgico, hoje, fica em casa.
**Volta.** *(Se a USA foi para a casa ou para a Márcia — a cidade é pequena.)* *No ônibus, duas mães falam da professora do 3º B. Você ouve "abelha", "ambulância", "Márcia". Uma delas olha para o seu crachá e para de falar.* (só se `marcia_morreu`) / *"...salvou com uma caneta vencida, acredita?"* (se viva)

### D10 (sex) — O carrinho
**Ida.** *(Se `d9_parto_regulado`)* *Na calçada da casa 88, o Diego empurra um carrinho de bebê azul. A Tainara acena da janela.*
DIEGO: Nasceu, doutor! Na ambulância pequena. Benício. A moça disse "foi a central". Foi você?
1. **"Foi a central."** → DIEGO: *"Então a central ganhou um afilhado."* (o Benício aparece em ida/volta até o D20, crescendo um pouco no carrinho)
*(Se o parto não foi regulado: "Nasceu no carro. De novo. Benício. Rápido igual o irmão.")*
**Volta.** *Na XV, o Seu Jacó baixa a porta da joalheria. Placa: "COMPRA-SE OURO".* (só a imagem: planta a aliança de hoje à noite)

### D11 (sáb) — Repelente
**Ida.** *O ônibus cheira a repelente. Uma senhora oferece o vidro a todo mundo.*
SEU AÍLTON: Dengue, doutor. Minha sogra pegou. Ela é ruim de pegar as coisas, mas a dengue pegou ela.
*Se a Zélia caiu ontem (`zelia_caiu_d10`):* *A Dona Dirce está no seu portão às seis: "Vi a ambulância rodando a Vila ontem de noite. Rodou, rodou, foi parar na Palmeiras. Eu gritei 'é na Acácias!' da janela. Ninguém ouve velha."*
**Volta.** *Seu Nogueira está no seu portão com a pasta de elástico (a cena do aluguel começa aqui).*

### D12 (dom) — O dente do Reginaldo
**Ida.** *No ponto, um homem com a bochecha inchada e um pano de prato amarrado no rosto.*
REGINALDO: Doutor? Do telefone? Sou eu, do dente! Do dia primeiro! ...Ainda não fui no dentista. Tô indo agora. Domingo. Tem dentista de domingo?
1. **"UPA Norte tem dentista de plantão."** → REGINALDO: *"Viu? Por isso que eu ligo pra vocês."* (no D19, a ligação do Reginaldo abre com "Fui na UPA que você mandou. Agora é o outro lado.")
**Volta.** *Domingo à noite, a rua está vazia. Na sua janela, a luz da sala acesa e uma silhueta de roupa de entrevista no varal.* (prepara a proposta da Têxtil)

### D13 (ter) — Água sanitária
**Ida.** *Um dia de folga. A rua inteira cheira a água sanitária: faxina de verão. Na calçada da Dona Dirce, um galão aberto ao sol.*
DONA DIRCE: Misturei com o pinho pra render. Ficou um cheiro de piscina.
1. **"Dona Dirce, não mistura água sanitária com desinfetante. Solta gás."** → DONA DIRCE: *"Ai, credo. Vou jogar no ralo."* (a Cida faz exatamente isso às 08:30 — o jogador sorri; humanidade +0, mas a Dirce passa a te chamar de "meu médico")
**Volta.** *O ônibus passa pela Rua XV, 1950. Na portaria do Ed. Aurora, um porteiro com uma cicatriz no peito aberta pela gola acena para o ônibus.* SEU AÍLTON: *"O Edson. Morreu e voltou, dizem. Agora acena pra todo ônibus, que nem criança."* (se `d01_parada` vivo; senão a portaria tem outro porteiro e um cartaz "Precisa-se de porteiro")

### D14 (qua) — Mormaço
**Ida.** *O Ozzy não late para a moto hoje. Está deitado na sombra do portão, de língua de fora.*
LIAM (da janela, de pijama): {Pai}! O Ozzy tá com calor! Pode pôr ele na geladeira?
1. **Encher a vasilha do Ozzy de água com gelo.** → *O Ozzy bebe, espirra e late para a moto atrasado.* (Laços +1 se Liam presente; se a família está em Rio Claro, o Liam não está na janela: o Ozzy está sozinho e a Zélia grita da cozinha "Deixa que eu ponho!")
**Volta.** *21h. Palmas no portão.* (a cena da Carla começa aqui: ela está encostada no muro com a mochila)

### D15 (sex) — O bolo
**Ida.** *Aniversário do Liam. Na padaria, o Seu Toninho anota no caderno do fiado com o lápis de trás da orelha.*
SEU TONINHO: O bolo de ambulância tá encomendado pra seis da tarde. Paga quando der, doutor. *(Faixa Folga/Sobra: "Já pagaram ontem. {Oconj} veio com o dinheiro contado." )*
**Volta.** *Volta tarde: o show, o MCI. O ônibus 12 está lotado de gente com a pulseira da Expo. Uma moça de camiseta de enfermagem cochila no seu ombro.* (se `d05_academia` vivo: é a Taís. Ela acorda: "Desculpa. Fiz massagem num menino hoje. Duas vezes na mesma semana, credo.")

### D16 (sáb) — O fiado
**Ida.** SEU TONINHO: O bolo tava bom? O menino gostou da sirene? *(pago)* / Sem pressa, doutor. O fiado de aniversário eu não cobro antes do mês virar. *(fiado; a dívida entra na conta do D19)*
*No ponto da XV, o Biel não está. Pela primeira vez em duas semanas.* (prepara as 10:40)
**Volta.** *Sábado à noite. Na portaria do Ed. Aurora, uma senhora de xale roxo conversa com o Edson.* (se aula de desenho: é a Dona Iolanda; o Liam não está, mas ela acena para o ônibus "como se soubesse quem está nele")

### D17 (seg) — A pé
**Ida.** *Um dia de folga e um temporal. O 12 não passa: a Av. Brasil virou rio. Você vai a pé, com a água na canela, até a XV.*
*Na esquina da Ipê-Roxo, o Zé Carlos tira água da casa de um vizinho com balde.* (se `tel_ze_carlos`: "Vai, doutor, que hoje a cidade precisa de telefone. Aqui eu me viro.")
**Volta.** *O Peixoto oferece carona (ele levou a Simone ao hospital à tarde). O carro dele cheira a desinfetante e a goiabada.*
PEIXOTO: Meu pai pediu goiabada no Regional. A enfermeira escondeu. Eu levei. Não conta.
1. **Aceitar a carona.** → no carro: PEIXOTO: *"Você acha que eu sou o vilão, né? Às vezes eu acho também. Aí eu olho a planilha e acho que o vilão é a planilha. É mais fácil."* (`carona_peixoto`; no D18, se ele for fonte, a fala das 07:40 lembra: "No carro, ontem, eu quase te contei.")
2. **Ir a pé.** → *A água baixou até o tornozelo. Você chega com o sapato fazendo barulho de sapo.* (desgaste +2)

### D18 (ter) — A Gazeta no ônibus
**Ida.** *No ônibus 12, metade dos passageiros está com a Gazeta aberta. A manchete da página um.*
SEU AÍLTON: Tão falando da central de vocês, doutor. Diz aqui que a ambulância tinha meta. Meta igual de vendedor?
1. **"Igual de vendedor."** → SEU AÍLTON: *"O finado Nestor dizia: ônibus não tem meta, tem horário. Ambulância nem horário devia ter."* (pista R5)
2. **"Não posso falar, Seu Aílton."** → SEU AÍLTON: *"Não precisa. Tá na sua cara."*
**Volta.** *Se a Zélia está internada (`zelia_internada_pe`): você desce no Regional. Quarto 7, observação. Ela está acordada, com o pé enfaixado: "Vai pra casa. Aqui tem enfermeira. Lá tem só o menino."* / *Se `mostra_desenho` (3 aulas): a volta passa pela Biblioteca Municipal — a Mostra dos Alunos. (cena curta: ver `casa.md` D18)*

### D19 (qui) — Um dia de folga e um aviso
**Ida.** *Um dia de folga. No ônibus, um rapaz de mochila te dá um bom-dia demorado.*
RAPAZ: Você é da Regulação? ...Nada. Bom dia. (é o Caio do D12, se `d12_caio_acolhido`; o narrador não diz)
SEU AÍLTON: Amanhã é o último dia do Bené, sabia? Foi ele que me ensinou a fazer a curva da Brasil. E quem ensinou ele foi o finado Nestor. Uma corrente, doutor. De volante.
**Volta.** *Você sai às 19:40, depois da Cida. O ônibus vem vazio. Seu Aílton não liga o rádio.*
SEU AÍLTON: Dia pesado? *(silêncio)* Eu não pergunto mais.

### D20 (sex) — O último
**Ida.** *Sol de outono. O Ozzy late para a moto e depois corre atrás do ônibus até a esquina, como nunca fez.*
SEU AÍLTON: Hoje eu vou buzinar duas vezes na frente da base. Pro Bené. Ele sabe o que é.
*(se `d19_onibus_acucar`: "O colega da linha 7 que desmaiou ontem? Tá bem. Disseram que o açúcar na boca segurou.")*
**Volta = abertura do final.** Ver `finais.md` ("O último ônibus"). *19:40. O ônibus 12 para no ponto da XV. Seu Aílton abre a porta antes de você fazer sinal.*
