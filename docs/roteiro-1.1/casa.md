# Casa explorável — cômodos × 20 dias

## Como funciona (pedido à Fundação e à Arte)

- **A casa azul, Rua das Acácias, 40, Vila Esperança.** Pequena, de aluguel, piso vermelhão.
- **Cômodos** (os três primeiros já existem em `scenes.ts`; os outros são novos ou adaptados):
  1. **Cozinha** (existe) — mesa xadrez, geladeira com desenhos e o ímã da pizzaria do Toninho, lata de açúcar, filtro de barro, relógio atrasado, calendário, foto da família, aparador (rádio ou máquina de costura).
  2. **Sala** (existe) — sofá azul que vira **sofá-cama da Zélia** à noite, poltrona vermelha dela, TV de tubo com a novela, bordado "LAR DOCE LAR", canto da costura, **tapete onde o Ozzy dorme**.
  3. **Quarto do Liam** (existe) — parede azul com estrelinhas, cama, escrivaninha com lápis, guarda-roupa com adesivo de ambulância, caixa de brinquedos.
  4. **Quarto do casal** (novo) — cama de casal com colcha de fuxico, cômoda com o porta-retrato do casamento, mesinha com o guardanapo-mapa do Bené (se houver), cabide com o jaleco e o crachá, janela para o quintal.
  5. **Quintal** (novo) — varal, tanque, casinha do Ozzy (de caixote), pé de limão, tambor azul de água, cadeira de praia rasgada onde a Zélia toma sol de manhã.
  6. **Portão/calçada** (existe como `porta`/`calcada`) — portão baixo, número 40, a Dona Dirce do outro lado da rua, a casa 88 à esquerda.
- **Modos:**
  - **Ficar com a família** → anda por todos os cômodos (setas/portas), clica nos objetos marcados. A **cena principal do dia** (a que já existe no interlúdio) acontece no cômodo indicado e pode ser aberta a qualquer momento; o resto é opcional. Cada cômodo tem **uma coisa nova por dia** (abaixo). Clicar num objeto mostra o que se notou (item 58, "reparar": sem custo, sem pares); alguns liberam escolha.
  - **Descansar** → só **cozinha** (cena do dia, curta) e **quarto do casal** (dormir).
  - **Bico** → **madrugada**: casa no escuro; cada cômodo mostra **um objeto-bilhete** do que aconteceu sem você (abaixo, linha "Bico").
- **Ozzy** aparece em um cômodo por dia (marcado 🐶) fazendo algo diferente. "Brincar com o Ozzy" (sala) = ele corre em volta da sala latindo e cai dormindo no tapete (item 54; quadros novos `correndo0/1/2`, `latindo0/1`, trajeto em x).
- **Ausências:** de D13 a D17, se `lucia_fora`, o cônjuge e o Liam estão em Rio Claro de Minas: o quarto do Liam fica com a cama feita e os objetos mudam (marcado *fora:*). Se a Zélia morreu, a sala tem a poltrona com o xale e a cozinha a cadeira vazia (*sem Zélia:*). Se a Zélia está internada (D16–D18), *internada:*.
- **Dinheiro:** objetos mudam com a faixa de saldo e a origem (regra 3.1 do ROTEIRO): por exemplo, com **Sobra (vereador)** aparece uma TV nova ainda na caixa que ninguém abriu; com **ateliê**, retalhos e encomendas penduradas; com **bico**, o seu prato coberto com outro prato.

---

## Dia 1 (seg) — cena principal: **Cozinha**, bolo de fubá
| Cômodo | O que tem |
|---|---|
| Cozinha | Bolo de fubá com a vela reaproveitada (cena atual). **Ímã de pizzaria** prendendo o primeiro desenho do Liam (`desenho_geladeira`). |
| Sala | A novela "Amor de Cristal" na TV: "a Marta foge na garupa". ZÉLIA: *"Essa Marta é uma desmiolada. Igual eu fui."* |
| Quarto do Liam | Caixa de giz de cera de 12 cores, faltando o azul. LIAM: *"Gastei o azul na ambulância."* |
| Quarto do casal | O crachá novo no cabide: "{Dr} {nome} Moura — Regulação". Clicar: *"A foto do crachá é de antes de você dormir mal."* |
| Quintal | 🐶 O Ozzy cava embaixo do pé de limão. Clicar: ele traz uma tampinha de garrafa como troféu. |
| Portão | Dona Dirce do outro lado: *"Como foi o primeiro dia, {dr}? Pela cara, foi."* |
| **Bico** | Cozinha: o bolo inteiro com a vela torta. Quarto do Liam: o desenho caído do lado da cama. |

## Dia 2 (ter) — cena principal: **Cozinha**, conta d'água / Nogueira
| Cômodo | O que tem |
|---|---|
| Cozinha | Envelope do DAE em cima do filtro (cena atual). Torneira pingando (se `agua_cortada`, seca). |
| Sala | O telefone fixo com o número do Nogueira escrito a caneta na parede. Clicar: abre a ligação da cena. |
| Quarto do Liam | Três garrafas pet "de reserva" enfileiradas embaixo da cama. LIAM: *"Se a água acabar, eu tenho três."* |
| Quarto do casal | Lâmpada nua: o Valdemar levou até o lustre. CÔNJUGE: *"Ele levou as lâmpadas, {nome}. Quem leva lâmpada?"* |
| Quintal | Tambor azul cheio pela metade. 🐶 O Ozzy bebe do balde do tanque. |
| Portão | O homem do DAE deixou o aviso preso no portão com fita crepe. |
| **Bico** | Cozinha: bilhete preso com o ímã de pizzaria por cima do desenho ("Paguei com o pote" / "Briguei com ele na porta"). |

## Dia 3 (qua) — cena principal: **Quarto do Liam**, a bombinha (23h)
| Cômodo | O que tem |
|---|---|
| Cozinha | Pote de margarina vazio no escorredor (se `lucia_pagou_agua`). |
| Sala | ZÉLIA na poltrona com a cartela de remédio na mão (se `zelia_ofereceu_remedio` for escolhida, ela tira um comprimido e devolve à cartela, três vezes). |
| Quarto do Liam | A bombinha vazia e o espaçador rachado com fita crepe. Cena da tosse. Se `d3_segurou_bombinha`: ele dorme sentado. |
| Quarto do casal | A receita do SUS vencida em janeiro em cima da cômoda. Clicar: *"Válida até 31/01. Renovação: 28/03."* |
| Quintal | 🐶 O Ozzy dorme encostado na porta do quarto do Liam, do lado de fora (o cão sabe). |
| Portão | Silêncio. A rua às 23h. Um gato na mureta. |
| **Bico** | Quarto do Liam: ele dormiu sentado, encostado na parede (ou: a bombinha nova da farmácia 24h na mesinha, se `bombinha_lucia`). |

## Dia 4 (qui) — cena principal: **Sala**, máquina de costura
| Cômodo | O que tem |
|---|---|
| Cozinha | A Gazeta com o anúncio do Bazar do Seu Tião circulado de caneta ("máquinas a partir de R$ 450"). |
| Sala | Retalhos e a fita métrica (cena atual). Clicar no manequim: *"Um paletó de ninguém, pendurado há dois anos."* |
| Quarto do Liam | Um pedaço de lençol azul cortado em forma de capa (se `maquina_prometida`: "com a estrela azul da ambulância", costurada à mão). |
| Quarto do casal | A caixa de costura com a tampa de biscoito. Clicar: agulhas, linha, uma foto 3×4 do cônjuge na confecção, de touca. |
| Quintal | Zélia de manhã na cadeira de praia: *"Sol é vitamina. E é de graça."* 🐶 O Ozzy no colo dela. |
| Portão | Um panfleto da "Academia Força Total — matrícula grátis" no portão. |
| **Bico** | Sala: a fita métrica esticada em cima da mesa, medindo o lugar da máquina. |

## Dia 5 (sex) — cena principal: **Sala**, "cara de quem chorou"
| Cômodo | O que tem |
|---|---|
| Cozinha | O extrato no celular "Bônus — meta de eficiência: R$ 30" (cena atual). |
| Sala | Liam acordado no sofá (cena). ZÉLIA: *"Na minha época o nome disso era outro."* (se resposta 'ar') |
| Quarto do Liam | A redação começada no caderno: "O que {m:meu pai|minha mãe} faz:" e o resto em branco. |
| Quarto do casal | O jaleco com um post-it da Simone grudado nas costas: "A META NÃO ESTÁ ACIMA DO MANUAL (P.5)". *Você andou de ônibus com isso nas costas.* |
| Quintal | 🐶 O Ozzy late para o portão da base da USA 03, que dá pra ver por cima do muro: fechada. |
| Portão | Dona Dirce: *"Fecharam a ambulância da Vila. Eu vou cair mais devagar, então."* |
| **Bico** | Sala: um bilhete do cônjuge: "Ele perguntou por que você chora. Eu disse que era o ar-condicionado. Ele não acreditou." |

## Dia 6 (sáb) — pré-cena: **Cozinha**, a geladeira; cena: Seu Jairo
| Cômodo | O que tem |
|---|---|
| Cozinha | Geladeira quebrada, a gota caindo; caixa de isopor do posto com a insulina da Zélia. Seu Jairo "auscultando" a geladeira. Recibo "neto Gabriel — 9-8877" depois. |
| Sala | Leite do Liam dentro de uma bacia com água fria. ZÉLIA: *"No meu tempo geladeira era o poço."* |
| Quarto do Liam | Liam desenhando o Seu Jairo com estetoscópio na geladeira: "O DOUTOR DA GELADEIRA". |
| Quarto do casal | Na cômoda, o cartão da JAIRO REFRIGERAÇÃO. Atrás, com letra de criança: "Biel ♥". |
| Quintal | 🐶 O Ozzy cheira a caixa de ferramentas do Jairo e espirra (graxa). |
| Portão | O Fusca do Jairo com o adesivo "JAIRO REFRIGERAÇÃO — ATENDO SÁBADO". |
| **Bico** | Cozinha: o recibo preso com o ímã de pizzaria, igual. |

## Dia 7 (dom) — cena principal: **Portão**, o envelope (20h)
| Cômodo | O que tem |
|---|---|
| Cozinha | A conta de luz presa no ímã (o cônjuge olha para ela durante a cena, se saldo < 300). |
| Sala | Missa da TV desligada; o terço da Zélia em cima da TV. |
| Quarto do Liam | Liam dormindo com a capa de lençol (se `maquina_prometida`). |
| Quarto do casal | **Depois da cena:** o envelope (se aceito) na gaveta da cômoda. Clicar: *"Notas de cinquenta, novas, em sequência. Uma cinta de papel: 'Câmara Municipal — Gab. 7'."* (pista R1) |
| Quintal | 🐶 O Ozzy rosna para o carro preto pela fresta do portão. *Ele nunca rosna.* |
| Portão | O assessor: aliança apertada, arranhão nas costas da mão, "Tá bom? Tá bom." (pista R1) |
| **Bico** | Portão: notas de cinquenta na calçada (se o cônjuge jogou) — a Dona Dirce varre uma para dentro do bueiro, sem querer. Quarto do casal: a caixa de costura pesada (se o cônjuge escondeu). |

## Dia 8 (seg) — cena principal: **fora de casa (escola)**, o sarau; casa à noite
| Cômodo | O que tem |
|---|---|
| Cozinha | O bolo de mel da Zélia num prato coberto (a Tia Márcia recusou: alergia a mel?). ZÉLIA: *"Ela disse que é alérgica até a abelha. Pois o bolo é de abelha. Eu levei de volta."* |
| Sala | O bilhete "Tia Márcia, 3º B (Márcia Albuquerque Reis)" no braço do sofá (você vai levar pra central). |
| Quarto do Liam | A redação lida no sarau, dobrada embaixo do travesseiro: "...porque aí eu chego lá e vejo se deu certo. {m:Meu pai|Minha mãe} nunca vê. Fim." |
| Quarto do casal | Se o envelope está na gaveta: a cinta "Gab. 7" de novo. Se o jogador clica nas duas noites (D7 e D8), o narrador: *"Gabinete sete. O mesmo vereador da mãe da UTI."* |
| Quintal | 🐶 O Ozzy dorme no varal, enrolado na roupa de sarau do Liam que caiu. |
| Portão | Volta do sarau: Liam dorme no seu braço no último trecho. |
| **Bico** | Quarto do Liam: "Ele procurou você na plateia. Duas vezes. Depois parou de procurar." (bilhete atual) |

## Dia 9 (qui) — cena principal: **Quarto do Liam**, a noite da asma
| Cômodo | O que tem |
|---|---|
| Cozinha | **A Gazeta de quinta na mesa (R1):** "Três dias depois: a mulher que pediu pizza" — W.T., assessor. Cena curta do cônjuge (ROTEIRO R1, consequência imediata). |
| Sala | ZÉLIA na poltrona: falas por faixa (ROTEIRO 3.1-e). Sem Aperto: *"Dinheiro tinha. O que faltou foi alguém em casa pra ver o menino puxando ar."* (só se não houve bombinha) |
| Quarto do Liam | A cena da asma (atual). Bombinha nova ao lado do travesseiro. "Doze por minuto. Normal. Você conta de novo." |
| Quarto do casal | O telefone em cima da cama com duas chamadas perdidas da central (se `d9_lucia_religou`): *"Ligou duas vezes, {nome}."* |
| Quintal | 🐶 O Ozzy não sai do pé da cama do Liam (aparece no quarto, não no quintal). Quintal: abelhas no pé de limão. |
| Portão | A Tainara, da casa 88, com o bebê no colo, olha para a sua casa e faz sinal da cruz (se o parto foi regulado). |
| **Bico** | Cozinha: a Zélia lavando uma xícara limpa (atual). |

## Dia 10 (sex) — cena principal: **Cozinha**, a Zélia (começo da noite) e a queda (22h, banheiro → sala)
| Cômodo | O que tem |
|---|---|
| Cozinha | "Reparar": prato seco no escorredor; xícara que treme (tlec-tlec); gota de suor; insulina (isopor, se geladeira não consertada); lata de açúcar com o suco escondido atrás. Se `zelia_ligou_almoco`: o prato seco já vem marcado com brilho ("Arroz com ovo, ela disse ao telefone"). Aliança na mesa (por faixa × origem: ROTEIRO 3.1-e). |
| Sala | A novela; a Zélia tenta levantar do sofá e senta de novo. Clicar nela: *"Tô ótima. Calor."* (a mesma frase do Henrique no D9 — o narrador: "Tô ótima. Calor. Você já ouviu isso esta semana.") |
| Quarto do Liam | Liam faz lição; se a queda acontece, ele vê da porta → desenho "a ambulância perdida" amanhã. |
| Quarto do casal | O celular carregando. Se a queda acontece, é daqui que você liga (cena interativa: Henrique/Palmeiras — ROTEIRO 3.2). O guardanapo-mapa do Bené na mesinha mostra a Rua das Acácias (se `bene_mapa_guardanapo`) e libera a opção "ligar pro Bené". |
| Quintal | 🐶 O Ozzy late para o banheiro às 21:58 — dois minutos antes da queda (se a hipoglicemia não foi percebida). *É a única pista que não é de gente.* |
| Portão | Se a queda: a USB 01 passa na rua de cima, devagar, procurando número; a Dona Dirce grita da janela "É NA ACÁCIAS!". |
| **Bico** | Quarto do casal: a caixinha de veludo vermelho em cima do travesseiro com o bilhete da aliança (atual). Sala: o copo vazio atrás da lata de açúcar. |

## Dia 11 (sáb) — pré-cena: **Portão**, o Nogueira; cena: **Sala** (Juliana) ou **Cozinha** (dengue)
| Cômodo | O que tem |
|---|---|
| Cozinha | Na geladeira, o desenho do Liam: **"A AMBULÂNCIA PERDIDA"** (USB rodando entre placas "PALMEIRAS"). Clicar: grava o bilhete se não houver (`anotou_henrique_d10`, origem desenho). Se `alianca_vendida`: a Zélia passa o polegar no dedo vazio no jantar. |
| Sala | Ateliê (se máquina): a Juliana provando o terno do pai / a roupa preta (cena atual). Sem máquina: panfleto "10 minutos contra a dengue". |
| Quarto do Liam | Crachá de "FISCAL DA DENGUE" pendurado na maçaneta (se `marcia_morreu`: "A professora nova deu. A Tia Márcia ia dar."). Liam copiando o guardanapo-mapa do Bené (se houver): *"Tô fazendo a cidade, {pai}. Pra ambulância não se perder."* |
| Quarto do casal | O calendário com "6/3: máquina" circulado (se `maquina_prometida` e sem máquina — ver flags). |
| Quintal | Liam virando tampinhas e pratinhos de planta (criadouros). 🐶 O Ozzy bebe a água de um pratinho antes que ele vire. |
| Portão | O Nogueira com a pasta de elástico (cena do aluguel). "Ele também manca." (pista R4) |
| **Bico** | Cozinha: bilhete na máquina ("A Juliana veio. Disse que foi uma médica da Regulação..."). Quarto do Liam: "Fiscal da dengue. Você não veio." |

## Dia 12 (dom) — cena principal: **Cozinha**, a proposta da Têxtil
| Cômodo | O que tem |
|---|---|
| Cozinha | "Reparar": a bolsa na cadeira com a passagem "SANTA AURORA → RIO CLARO DE MINAS · IDA · AMANHÃ · 06:40"; a roupa de entrevista no varal (pela janela). Se `anotou_henrique_d10` e não usado no D12: o bilhete no bolso do jaleco pendurado na porta da área. |
| Sala | A Zélia finge assistir a TV e escuta a conversa da cozinha com o volume no 3. |
| Quarto do Liam | Liam desenhando um ônibus "pra você lembrar da gente" (se a proposta é aceita) ou um ônibus "pra quando a gente passear". |
| Quarto do casal | Na cômoda, o anúncio da Têxtil recortado do jornal ("Entrevistas neste domingo e na segunda"). |
| Quintal | 🐶 O Ozzy dorme em cima da mala que o cônjuge deixou no quintal pra tomar sol. |
| Portão | Domingo à noite; a rua vazia; a casa 88 com o bebê chorando. |
| **Bico** | Cozinha: a passagem rasgada embaixo da casca de batata (ficou) ou o bilhete "Você tava na central até quando estava aqui." (foi). |

## Dia 13 (ter) — cena principal: **Cozinha**, o pé da Zélia
| Cômodo | O que tem |
|---|---|
| Cozinha | "Reparar": sapato fechado (desenhar os pés da Zélia; corrigir o retângulo vazio citado no estudo), meia com mancha no cesto. Se `joana_viu_zelia`: a meia já vem marcada. *fora:* a Zélia conta do telefonema de Rio Claro ("Pra você mandou 'oi'"). |
| Sala | A Zélia conta da Cida do grupo (cena atual, nó `igreja`) e da história do ônibus: *"A Cida diz que o marido era motorista de ônibus. Eu não perguntei de qual."* (pista R5) |
| Quarto do Liam | **Se `aula_desenho ≥ 2`:** o desenho **"o moço da escada"** (homem sentado na escada do 3º andar, bala na mão). LIAM: *"Ele perguntou se eu queria ser médico. Eu disse que queria dirigir a ambulância grande. Ele riu e chorou junto."* *fora:* a cama feita, o urso de pelúcia sentado olhando a porta. |
| Quarto do casal | O bilhete das 22:07 (se guardado) no bolso do jaleco lavado: o cônjuge acha (cena curta; ROTEIRO 3.2). *fora:* a Zélia acha e não diz nada; põe o papel em cima do travesseiro. |
| Quintal | A máquina de costura da Cida chegando num carrinho de mão do vizinho (se aceita). 🐶 O Ozzy late para a máquina como se fosse gente. |
| Portão | Cheiro de água sanitária da rua inteira; a Dona Dirce jogando o galão no ralo (se você avisou na ida). |
| **Bico** | Cozinha: o sapato com a meia dentro do lado da cama da Zélia (atual) — corrigir: se `zelia_fechada`, é o chinelo. |

## Dia 14 (qua) — cena principal: **Portão** (Carla) → **Sala** (o cartão na máquina)
| Cômodo | O que tem |
|---|---|
| Cozinha | O cartão da Carla embaixo do açucareiro (se bico) / na mão do cônjuge. |
| Sala | "Reparar": o cartão "Carla Nunes — Gazeta" preso na máquina ("Não é de hoje", a dobra gasta). |
| Quarto do Liam | Liam pergunta quem era a moça do portão: *"Ela tem cara de quem perdeu alguém."* *fora:* ligação de vídeo com o Liam do celular da Zélia: ele mostra o cachorro Pirata da tia. |
| Quarto do casal | A foto do casamento dos pais do protagonista na cômoda (só aparece a partir de hoje: a Zélia trouxe da sala): o pai magrelo de terno grande, a Zélia de vestido de renda, **dentro de um ônibus** ao fundo (pista visual R5; ninguém comenta). |
| Quintal | 🐶 O Ozzy dorme na sombra do tanque, de língua de fora (mormaço). |
| Portão | Carla encostada no muro, mochila, caderninho de capa dura. "Meu irmão, Rafael..." |
| **Bico** | Cozinha: verso do cartão com a letra do cônjuge: "Faz tempo que eu falo com ela, {nome}." |

## Dia 15 (sex) — cena principal: **Cozinha**, aniversário do Liam
| Cômodo | O que tem |
|---|---|
| Cozinha | O bolo por faixa × origem (ROTEIRO 3.1-e): fiado com ambulância de plástico / pago / com sirene / de dois andares. |
| Sala | **Presente da Cida** (se `cida_conversou_d15` ou humanidade ≥ 6): em vez do estojo, **um caderno de capa dura cheio de guardanapos colados — retratos a caneta do Seu Nestor**: "Pro Liam, que desenha. Era do meu falecido. — Vó Cida." (pista R5). Clicar no caderno: retratos de passageiros de ônibus; numa página, um casal de costas no corredor do ônibus (o jogador ainda não sabe). |
| Quarto do Liam | Se `davi_desenho_escondido`: a folha dobrada não aparece. *(Se aula: ela está com a Dona Iolanda — ROTEIRO 3.3.)* Se `marcia_morreu && d9_davi === 'USA'`: a camiseta de manga comprida a 32 °C no encosto da cadeira. |
| Quarto do casal | O cartão "Tia Márcia" (se viva) preso no espelho: "Pro meu aluno que lê redação melhor que eu." |
| Quintal | 🐶 O Ozzy com um chapéu de aniversário de papel, furioso. Clicar: ele tira com a pata e late. |
| Portão | Você chega tarde (MCI). A luz da cozinha acesa; vozes cantando parabéns baixinho para esperar você (se Laços ≥ 6) / já cantaram (se < 6). |
| **Bico** | Quarto do Liam: desenho no travesseiro "UM DIA INTEIRO" (atual) ou três chamadas perdidas e o áudio "Parabéns pra mim". |

## Dia 16 (sáb) — pré-cena: **Sala**, o pé da Zélia; cena: **Quarto do Liam** (apanhando) ou sábado comum
| Cômodo | O que tem |
|---|---|
| Cozinha | Na geladeira, um desenho com raiva (riscado com força) — "reparar" (atual `desenho_raiva`). |
| Sala | Zélia de chinelo (se tratado) / *internada:* a poltrona com o xale; 🐶 o Ozzy dorme em cima do xale. |
| Quarto do Liam | Hematoma de quatro dedos no braço ("Caí no recreio"). "Reparar" (atual) **ou** ligação da Dona Iolanda na pré-casa ("três meninos grandes e um pequeno no chão" — `iolanda_avisou`) **ou** bilhete do cônjuge (bico, Laços ≥ 6). |
| Quarto do casal | A promessa do domingo: "Celular desligado desde já." — clicar no celular: você desliga (o ícone some até o fim da cena; a promessa conta). |
| Quintal | Liam treinando chute contra o muro, sozinho, forte demais. |
| Portão | A Dona Dirce: *"O menino chegou da escola com a cara amarrada. Menino de cara amarrada tem coisa."* |
| **Bico** | Quarto do casal: "O Liam tá apanhando. Segunda eu vou lá." (atual) |

## Dia 17 (seg) — cena principal: **Sala**, goteiras
| Cômodo | O que tem |
|---|---|
| Cozinha | Baldes no chão; a Zélia (ou o cônjuge) com o pano. "Reparar": goteira em cima do lugar onde o Nogueira disse que "reformou o telhado". |
| Sala | Desenhos do Liam molhados em cima do sofá (secar no varal da cozinha: Laços +1, atual `desenhos_molhados`). |
| Quarto do Liam | A cama molhada (se sem lona) → o Liam dorme com o casal hoje. *fora:* a cama vazia e molhada; o urso no varal. |
| Quarto do casal | Telefone tocando às 21h: **o filho do Nogueira** (R4): aluguel perdoado (salvo + briga) / abatido / cobrado educadamente (morto). |
| Quintal | O tambor azul transbordando; 🐶 o Ozzy dentro da casinha com a cabeça pra fora, ofendido com a chuva. |
| Portão | Água no meio-fio até o portão. A Dona Dirce em pé numa cadeira na varanda dela: *"A Baixada caiu, {dr}! Muro em cima de gente!"* (se ela ouviu no rádio AM — pista do nome não; só a notícia) |
| **Bico** | Sala: lona azul presa com tijolo no telhado (se paga); bilhetes (atual). |

## Dia 18 (ter) — pré-cena: **Portão**, a volta da família; cena: **Cozinha**, a Gazeta
| Cômodo | O que tem |
|---|---|
| Cozinha | A Gazeta circulada; falas por fonte e envelope (atual) + origem do dinheiro (envelope devolvido/usado/entregue/queimado). |
| Sala | A mala azul "COZINHA" no meio da sala (se `lucia_voltou`); o Liam e o Pirata correndo; 🐶 o Ozzy e o Pirata se estranham e depois dormem juntos no tapete (quadro de arte novo: dois cães no tapete). |
| Quarto do Liam | **Se `mostra_desenho` (3+ aulas):** o convite da Mostra dos Alunos na Biblioteca: "hoje, 20h". Escolha de ir (cena curta: o desenho da central na parede, a Dona Iolanda de xale roxo; se a Carla estiver, ela fotografa). |
| Quarto do casal | O envelope (se ainda escondido) na caixa de costura — "reparar" (atual `achou_envelope`). |
| Quintal | O telhado consertado (se `telhado_consertado`) — um pedreiro do Nogueira deixou uma telha nova encostada no muro com um bilhete: "sobra". |
| Portão | Rosângela no portão em pessoa (se `rosangela_bilhete`): *"Eu deixei um bilhete. Vim saber se é sim."* |
| **Bico** | Cozinha: "é verdade aquilo?" — o envelope devolvido sozinho (Laços ≥ 5) ou sumido. |

## Dia 19 (qui) — cena principal: **Cozinha**, véspera
| Cômodo | O que tem |
|---|---|
| Cozinha | Jantar por `bills.foodMissed` (atual). A conta "Fiado do Toninho" (se aniversário fiado). Se `alianca_vendida`: último dia para "Comprar a aliança de volta" (a Zélia recusa se for com dinheiro do envelope: *"Com esse dinheiro, não. Prefiro o dedo pelado."*). |
| Sala | **Se aula:** a Dona Iolanda passou e deixou o desenho escondido do aniversário com a Zélia: "UM DIA INTEIRO" (você e o Liam no açude). Clicar: Laços +1. |
| Quarto do Liam | O desenho secreto "SÓ PODE VER AMANHÃ" virado para a parede (atual). **Se aula:** o desenho da USA 01 com o motorista de bigode para o Bené (`desenho_bene`): *"Leva pro moço do rádio. Fala que é de um fã."* |
| Quarto do casal | O despertador. **Escolha "prometer chegar cedo"** (`prometeu_cedo`) fica aqui, no despertador. |
| Quintal | Noite limpa. A Zélia na cadeira de praia olhando a lua: *"A Cida dizia que a lua cheia é a novela de Deus."* (se Cida morreu: "dizia"; se viva: "diz") |
| Portão | A Dona Dirce dá boa-noite: *"Amanhã é o último? Então amanhã eu varro a calçada pra você chegar."* |
| **Bico** | Quarto do Liam: "SÓ PODE VER AMANHÃ" (atual). |

## Dia 20 (sex) — sem interlúdio: a **volta** abre o final
| Cômodo | O que tem |
|---|---|
| Portão | A calçada varrida pela Dona Dirce. A luz da cozinha acesa. (cena de abertura do final — ver `finais.md`) |
| Sala | Se `prometeu_cedo` e chegou tarde: o Liam dormiu no sofá com o desenho no peito. 🐶 O Ozzy dorme no pé dele. |
| Cozinha | O desenho final na geladeira — o que ele mostra depende do final e das aulas (ver `finais.md`). |
