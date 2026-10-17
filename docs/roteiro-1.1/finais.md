# Finais — história, epílogos e encenação

> Pedido do jogador: "achei os finais interessantes mas podiam ser muito melhor trabalhados, seja em representação gráfica ou em história". Problemas listados no estudo (03, "Problemas nos finais"): Henrique contraditório; "mesmo Peixoto" no normal; "nome na matéria" sem envelope; bom repete Antônio/Cida; máquina da Cida sem preparo; Simone com `materia_publicada` (sempre verdadeira); fios que ignoram arcos inteiros.

## Estrutura nova

Todo final tem **quatro movimentos**:
1. **O último ônibus** (comum a todos, com variações): a volta do D20 vira a abertura do final.
2. **O corte de seis meses** (o final propriamente dito: ruim / normal / bom / secreto).
3. **O mural** (epílogos por fio): polaroides num quadro de cortiça (arte `mural` já existe) — cada fio é uma foto com legenda; o jogador passa com clique. A ordem é sempre: família → central → cidade.
4. **A última imagem** (o desenho do Liam, que muda com o final e com as aulas de desenho) + créditos.

Condições (motor `src/engine/endings.ts`) — **mantidas**, com três ajustes:
- **RUIM** se: algum familiar morto · Laços ≤ 2 · `lucia_foi_embora` · Integridade ≤ 2. (igual)
- **BOM** se não ruim e: família toda "bem" · Laços ≥ 7 · Integridade ≥ 6 · ≥ 4 de 7 pacientes-chave · **matéria forte**. Ajuste: as fontes novas (`saulo_fonte`, `rosangela_caderninho`) contam para a matéria forte → o bom fica um pouco mais alcançável (respeita "não pode ficar mais difícil").
- **SECRETO** elegível: `peixoto_caiu` · 3 ≤ Integridade ≤ 6 · saldo > R$ 500. (igual) — a oferta passa a incluir o **contrato dos leitos reservados** (R2).
- **NORMAL**: o resto.
- Fio **Simone** passa a usar `materia_forte` em vez de `materia_publicada`; a flag `simone_demitida` (d20.ts:135) passa a ser `!(lealSimone ≥ 6 && materia_forte)`.

---

## 1. O último ônibus (abertura comum)

*Cenário novo `onibus_noite`: interior do 12 às 19:40, luz fluorescente verde, janelas com a cidade passando; Seu Aílton de costas, o boné; o protagonista no banco da frente.*
**Música:** só o motor do ônibus e o rádio AM do Aílton bem baixo (uma moda de viola sem letra). Nada de trilha ainda.

Linhas (ordem; cada uma com sua condição):
1. NARRADOR: *19:40. O ônibus doze para no ponto da XV. Seu Aílton abre a porta antes de você fazer sinal.*
2. SEU AÍLTON: *"Último dia, né? Do Bené também. Eu buzinei duas vezes na frente da base hoje cedo. Ele buzinou três de volta. Três é 'obrigado' na língua da gente."*
3. (se `bene_ultima`) SEU AÍLTON: *"Disse no rádio que a última corrida dele foi com você. Falou o seu nome no rádio, doutor. O Bené não fala nome no rádio."*
4. (Henrique não denunciado, `henrique_sobreviveu`) NARRADOR: *O ônibus passa pela Rua XV, 1950. Na portaria do Ed. Aurora, o Edson lava a calçada. Tem uma mancha que não sai.* / (`henrique_morreu`) *A portaria do Ed. Aurora está com a luz apagada. Uma fita preta no interfone.* / (denunciado, `final_rua_salvo`) *No semáforo da Av. Brasil, 2650, o Wellington ainda está na calçada, sentado ao lado do Seu Dito, dividindo um café.*
5. (sempre) NARRADOR: *Av. Brasil, 2400. A cruz do Rafael no poste.* (se `carla_sabe_regulador` ou matéria forte) *Hoje tem flor nova. De verdade.*
6. (se `zelia_contou_alianca` ou `bene_contou_casamento`) SEU AÍLTON: *"Sabia que foi neste ônibus, doutor? O finado Nestor parou bem aqui. No meio da Brasil. Por causa de um pedido de casamento. O Bené contava."* — se R5 aconteceu no almoço: o protagonista sorri; se não: *"Você olha o corredor do ônibus. Não sabe por que tem vontade de chorar."*
7. (se `prometeu_cedo` e o noturno atrasou) NARRADOR: *Você prometeu chegar cedo. São quase oito.*
8. NARRADOR: *Rua das Acácias. A calçada varrida pela Dona Dirce. A luz da cozinha acesa.* (se a família foi embora: *A luz da cozinha apagada.*)
9. (se `prometeu_cedo` e atrasou, família presente) *O Liam dormiu no sofá com o desenho no peito. O Ozzy dorme no pé dele. Você não acorda nenhum dos dois.*

→ Corte para preto. Um telefone toca uma vez, longe. **"SEIS MESES DEPOIS"** (crayonText, branco no preto).

---

## 2. Os quatro finais

### RUIM — "LINHA OCUPADA"
**Ideia:** o final ruim não é castigo, é **inversão**: você vira quem liga. E quem atende depende do que você fez com o Henrique.
**Correção:** ele acontece **em Santa Aurora** (não "outra cidade") — você foi afastado/desligado, mora num quarto alugado no Centro e faz plantões de clínica num posto. Assim a voz do Henrique na central faz sentido.

Abertura **pela causa** (só a primeira que se aplicar; a segunda vira linha curta):
- `lucia_foi_embora`: *"{Oconj} levou o Liam numa terça de manhã. Deixou a chave em cima da geladeira, presa com o ímã da pizzaria."*
- familiar morto — Zélia: *"O lugar da Dona Zélia na mesa ficou vazio. Ninguém teve coragem de tirar a cadeira. Depois, ninguém teve coragem de tirar a mesa."* / Liam: *"O quarto azul continua azul. As estrelinhas no teto acendem toda noite, sem ninguém para ver."* (com o máximo de delicadeza; sem detalhe) / cônjuge: *"A máquina de costura ficou com a agulha descida no meio de uma barra."*
- Laços ≤ 2 (sem ida): *"Ninguém foi embora. É pior. Vocês moram na mesma casa e falam pelo bilhete na geladeira."*
- Integridade ≤ 2: com `nome_na_materia`: *"Seu nome saiu na matéria, ao lado do envelope. O conselho abriu processo."* / sem: *"Uma auditoria leu as suas fichas. Leu o dia 9. Leu o resto. O contrato não foi renovado."*

Corpo:
1. *Seis meses depois, você mora {sozinho} num quarto alugado em cima da Drogaria do Gervásio. Dá plantão de clínica num posto. Ninguém lá liga de volta.*
2. *Uma noite de abril, sentindo uma dor no peito, você faz o que mandou tanta gente fazer.*
3. *Você liga para a Regulação.*
4. Toque. Toque. Atende — **variação pela voz**:
   - `henrique_morreu`: *a voz da Dra. Paula, rápida: "Regulação, boa noite. Fala o endereço primeiro."*
   - Henrique vivo (denunciado **ou** `henrique_sobreviveu`): *uma voz que você conhece. Lenta. Mas é lenta de cuidado, não de bebida. "Regulação, boa noite. Fala devagar que eu tô te ouvindo." É o Henrique. Sóbrio. Seis meses. Ele não reconhece a sua voz. Ou reconhece e não diz.*
   - (nenhuma das duas — fallback) *a voz cansada de um regulador novo.*
5. (Henrique vivo) HENRIQUE: *"Tem pulso? ...Conta pra mim. Eu espero."*
6. *Você conta. Oitenta e oito. Irregular.*
7. (Henrique vivo) HENRIQUE: *"Tô mandando. Fica na linha comigo."* — *Pela primeira vez em seis meses, alguém fica na linha com você.*
   (Paula / regulador novo) *"Fica na linha."* — *A tela fica preta antes de você saber se acreditaram em você.*

**Encenação:**
- Quadros: (1) `quarto_alugado` (existe: quarto, chuva, celular "SOS") **sem o Ozzy**; (2) **novo `central_noite_vista_de_fora`**: a janela da central acesa às três da manhã, vista da rua, chuva, um vulto de headset; (3) close no relógio do celular passando de 03:12 para 03:13 enquanto toca.
- Música: nenhuma. Só o tom de discagem, depois o "tuuu... tuuu". Na voz do Henrique sóbrio entra **uma nota** do tema principal, em piano, sustentada até o preto.
- Última imagem: o **desenho do Liam** no ímã da geladeira da casa **antiga**, fotografado pelo cônjuge e mandado por mensagem (a tela do celular): se o Liam foi embora, o desenho é de um ônibus indo embora; se o Liam ficou mas Laços ≤ 2, o desenho é a mesa com uma cadeira a mais, vazia, com um telefone em cima.

### NORMAL — "A GENTE SOBREVIVEU"
**Ideia:** a vida continua; algumas coisas mudaram por sua causa, outras não. O texto **não** pode afirmar o que o jogo desmentiu ("mesmo Peixoto").

1. *Seis meses depois. O contrato foi renovado.*
2. Central (uma linha, pela situação):
   - `peixoto_caiu` + fonte: *"O Peixoto depôs na Câmara e saiu. A Dra. Heloísa ficou. As metas ficaram também, com outro nome."*
   - `peixoto_caiu` sem fonte: *"O Peixoto foi transferido para uma central em outra cidade. A Dra. Heloísa trocou o rostinho do painel por um gráfico. O gráfico não sorri."*
   - Peixoto ficou: *"O Peixoto continua no interfone. Desligou o rostinho do painel. Diz que foi pane. Não foi pane."*
   - `reforco_frota`: *"A USA 03 voltou para a Vila Esperança. O Zé Carlos buzina na frente da sua casa às seis e meia."*
3. Casa, **pela faixa de saldo no D20** (regra do dinheiro):
   - Aperto/Justo: *"Em casa, as contas continuam apertadas. Mas todo mundo está vivo."*
   - Folga (salário/ateliê): *"Em casa, sobra um pouco no fim do mês. Pouco. O suficiente pra Zélia reclamar do preço do tomate sem medo."*
   - Folga/Sobra (vereador, envelope usado): *"Em casa, sobra. Ninguém fala de onde sobrou. A geladeira nova faz um barulho que a velha não fazia."*
   - (bico) *"Em casa, sobra quando você faz noite. Você faz noite."*
4. Ateliê: `maquina` → *"A máquina não para à noite. {Oconj} cantarola baixinho."* (+ `rosangela_ajudante`: *"A Rosângela vem às terças. As duas riem de coisa que você não entende."*) / `lucia_faccao` → *"{Oconj} costura para a Têxtil em casa. Pagam por peça. Pagam pouco. Pagam."* / sem máquina, com `maquina_prometida` → *"A máquina prometida nunca chegou. A capa de lençol do Liam ainda existe."* / sem nada → *"{Oconj} procura costura em todas as lojas do Centro."*
5. Na cozinha, {c:ela|ele} diz: *"— A gente sobreviveu, né?"*
6. *Você não sabe se isso é um elogio ou um diagnóstico.*
7. *Seu crachá fica pendurado no prego atrás da porta. Pronto para o próximo plantão.*

**Encenação:**
- Quadros: (1) `cracha_prego` (existe; com a luz quente do fim de tarde); (2) **novo `cozinha_seis_meses`**: a mesma cozinha, um objeto mudado por arco (máquina no aparador / geladeira nova / aliança na mão da Zélia / balde a menos); (3) o **mural** dos epílogos.
- Música: o tema principal em **caixinha de música**, andamento lento, terminando numa nota que não resolve (a melodia para um compasso antes do fim).
- Última imagem (desenho do Liam): **"A gente"** — a família à mesa, o protagonista com o crachá no pescoço; com 3+ aulas, o desenho tem perspectiva e o Ozzy embaixo da mesa; com `promessa_cumprida`, um quadradinho na parede do desenho mostra o açude.

### BOM — "{m:O MÉDICO|A MÉDICA} DO TELEFONE"
**Ideia:** o que você fez **se espalhou**. Não repete fios do mural no corpo (Antônio e Cida saem do corpo e ficam só no mural, com mais força).

1. *Seis meses depois. A matéria da Carla virou investigação.*
2. (se `saulo_fonte`) *"A folha das sete do Regional foi lida em voz alta na Câmara. Os seis leitos do quarto andar perderam a placa de 'reservado'."*
3. *"A Saúde+ Gestão perdeu o contrato. A central ganhou duas viaturas e um terceiro regulador por turno."*
4. (`reforco_frota`) *"A USA 03 voltou para a Vila Esperança."*
5. (Simone fica) *"A Simone é supervisora. Os post-its agora são oficiais: azul, rosa, verde e branco. Ninguém mais usa outra cor."*
6. *"{Oconj} tem fila no ateliê. A Dona Zélia controla o açúcar e implica com tudo."*
7. **Cena final nova — "O telefone":** *Uma manhã comum. Você está na mesa da central. O telefone toca.*
   - Variação da ligação (a primeira que se aplicar):
     - (`key jairo` salvo, `d10_biel_nome`) **Biel**, 16, voz grossa: *"Regulação? Aqui é o Gabriel, do curso de socorrista dos Bombeiros. Tô na Rua Ipê, um senhor caiu, eu já tô com a mão no peito dele. Ele respira. Eu só liguei pra você saber que dessa vez é verdade. ...E pra falar oi."*
     - (`key cida` salvo) **Dona Cida**: *"Desculpa incomodar, {meu} {filho}. Não é nada. A novela acabou ontem. A Marta ficou com o Henrique da fazenda. Eu precisava contar pra alguém que entende."*
     - (Ana Clara) **Ana Clara**, 7: *"Oi. A minha professora mandou ligar pro número de emergência pra agradecer. Ela disse que dá. Dá?"*
     - (fallback) *Uma voz desconhecida: "Meu pai tá com dor no peito." Você não pensa. Você pergunta: "Tem pulso?"*
   - *Você atende. "Regulação, bom dia."*

**Encenação:**
- Quadros: (1) **novo `gazeta_capa`**: a capa da Gazeta com a manchete da investigação, sobre a mesa da cozinha, com uma xícara de café em cima; (2) `mural` dos fios; (3) **novo `central_manha`**: a central de manhã, com sol entrando, a Simone de crachá de supervisora colando um post-it azul, a Paula ou o Henrique (sóbrio) saindo do noturno, você chegando; (4) close no telefone tocando, sua mão atendendo.
- Música: o tema principal em **tom maior**, com violão e um assobio no lugar da melodia (o assobio do Bené no rádio do D1). Termina resolvido.
- Última imagem: **o desenho do Liam**:
  - 0 aulas: o atual (giz de cera: você à mesa com o telefone, casinhas acesas ligadas por fios pontilhados, título "{m:Meu pai|Minha mãe} salva as pessoas pelo telefone").
  - 1–2 aulas: o mesmo tema com traço firme e sombra; a Simone e o Bené aparecem.
  - 3+ aulas (`mostra_desenho`): o desenho da Mostra na moldura da Biblioteca, com a etiqueta "Liam Moura, 9 anos — 'A central'". Ao lado, colado com fita, o guardanapo do Nestor (se a Cida viva mandou: ver fio Cida).

### SECRETO — "A CADEIRA"
**Ideia:** o espelho. Você vira o Peixoto — e pior: você assina o que o Saulo lia.

`chairOffer` (tela da oferta; reescrita):
1. *Uma semana depois da matéria, o Peixoto não aparece mais na central.*
2. *A diretoria da Saúde+ Gestão te chama para uma sala com ar-condicionado e uma garrafa de água com gás. O Mauro Teixeira em pessoa. Ele é mais baixo do que no jornal.*
3. MAURO: *"A coordenação é sua, {dr}. Salário três vezes maior. Só precisamos de duas assinaturas."*
4. *Página 4 do Plano de Otimização: "retirada da USA 03 de circulação, com remanejamento de equipes."*
5. *Anexo II: "Convênio Saúde+ Vida — manutenção de leitos de retaguarda reservados no Hospital Regional (4º andar)."*
6. (se `saulo_fonte` ou o jogador sabe do quarto andar) *Você conhece esse anexo. É a folha das sete.*
→ Assinar / Recusar (como hoje).

**Assinar — texto:**
1. *Você assinou. A USA 03 saiu de circulação no mês seguinte.*
2. *A família está estável. Confortável, até. A Dona Zélia ganhou uma geladeira nova e não reclamou de nada por uma semana.* (com `alianca_vendida` sem recompra: *"Você comprou a aliança de volta com o primeiro salário. Ela não usa. Guarda na caixinha. Diz que pesa."*)
3. *Sua sala tem ar-condicionado. Você olha o painel de metas por dentro. O índice está em 94.*
4. *Às sete da manhã, a diretoria do Regional te manda a folha do dia. "Leitos disponíveis: 0." Você assina embaixo.*
5. *Às 15:10, o interfone. É {o} {dr} novo da mesa 1, com a voz que você tinha seis meses atrás:*
6. — *"Coordenação? O Regional tá negando vaga zero. Infarto com supra. O plantonista diz que tá lotado."*
7. *Você olha a folha. Você sabe do quarto andar.*
8. — *"Negocia ou desvia."*
9. *Lá embaixo, na central, um telefone toca. Você não ouve mais.*
10. Última imagem: o desenho do Liam mostra {m:o pai|a mãe} atrás de uma mesa grande. **Sem telefone.** (com 3+ aulas: o desenho é tecnicamente perfeito e frio — um retrato em grafite sem cor; o Liam assinou "LIAM MOURA" com sobrenome, como adulto.)

**Recusar:** cai no bom ou no normal, com a linha: *"Ofereceram a cadeira. {m:Ele|Ela} preferiu o telefone."* (+ se sabe do anexo: *"E levou o Anexo II pra Carla, dobrado em quatro, num envelope de pão."* → no bom, a manchete da investigação muda.)

**Encenação:** `escritorio_ar` (existe) com a luz fria e o blend de desgaste no máximo; **novo** quadro do interfone com a sua mão apertando o botão; música de elevador (bossa de sala de espera) que **abafa** um telefone tocando ao longe — o telefone continua tocando por cima dos créditos e para no último nome.

---

## 3. O mural — epílogos por fio

Ordem: **Família** (Zélia, Liam, cônjuge) → **Central** (Simone, Henrique, Bené, Peixoto, Saulo) → **Cidade** (Cida, Antônio, Juliana, Márcia, Biel, Rosângela, Carla, Nogueira, Vereador/Odete, Wellington/Edson). Cada foto: título + 1–3 frases. Fotos "tristes" ficam em preto e branco no mural; as "boas", coloridas.

### Família
**Dona Zélia** *(novo)*
- Viva, bem, `alianca_vendida` e recompra: *"A aliança voltou para o dedo. Ela diz que ficou mais larga. Não ficou: ela que emagreceu de tanto implicar."*
- Viva, bem, aliança nunca vendida: *"Ela mostra a aliança para a Cida no grupo de terça. As duas contam a história do ônibus doze até o padre pedir silêncio."* (se a Cida está viva) / *"Ela mostra a aliança pro Liam e conta a história do ônibus. Ele desenhou."*
- Viva, `alianca_vendida` sem recompra: *"A caixinha de veludo vermelho continua no criado-mudo. Vazia. Ela abre de vez em quando, para conferir que continua vazia."*
- `zelia_espera ≥ 40` (D10) e viva: *"Ela ainda cobra o Henrique: 'Rua das Palmeiras, imagina. Palmeira é coisa de praia.'"*
- Internada no fim: *"Ela saiu do Regional em maio, de chinelo, xingando a comida. O pé sarou. O humor não."*
- Morta: *"A cadeira de praia no quintal. O Ozzy dorme nela toda manhã, no horário do sol."*

**Liam** *(novo)*
- `davi_conversa_verdade` (D16): *"A escola chamou os pais do Pedro. O Pedro pediu desculpa. Hoje os dois desenham juntos na aula da Dona Iolanda."* (se aula) / *"...Hoje os dois jogam bola no recreio. O Liam é goleiro. Ele diz que goleiro é o regulador do futebol."*
- `davi_mentira`: *"O Liam parou de contar as coisas da escola. Você descobre pelos desenhos."*
- Aulas ≥ 3: *"O desenho da central ficou na Biblioteca. Tem uma plaquinha. Ele passa na frente de propósito."*
- Aulas 0 e `davi_desenho_escondido`: *"Numa gaveta, embaixo de um manual velho, você acha a folha dobrada do aniversário: UM DIA INTEIRO. Você e ele no açude. Ele desenhou e escondeu. Você nunca foi ao açude."*
- `promessa_cumprida`: *"Vocês voltaram ao açude do Seu Antônio. Ele pescou um lambari e devolveu para a água. 'Pra ele ligar pra família.'"*

**{Oconj}** *(novo)*
- `maquina` + `rosangela_ajudante`: *"A placa do ateliê tem dois nomes."*
- `lucia_fora_apoiada` + voltou + `lucia_faccao`: *"Rio Claro ficou como um filme que {c:ela|ele} viu pela metade. A facção paga por peça. Às sextas, uma janta sem telefone. Combinado é combinado."*
- `lucia_ficou`: *"A Têxtil ligou mais duas vezes. {c:Ela|Ele} disse não. Diz que dizer não pra eles faz bem pra pele."*
- `lucia_fonte` revelada e apoiada: *"A Carla manda cartão de Natal endereçado a {c:ela|ele}. Não a você."*
- `lucia_foi_embora` (só no ruim — já no corpo).

### Central
**Simone**
- Fica (`lealSimone ≥ 6 && materia_forte`): *"Supervisora. Os post-its agora são oficiais: azul, rosa, verde e branco. O Wesley entrega marmita pra central toda sexta. Ela finge que não é ele."*
- Fica + `simone_crise_ok`: + *"Ela toma o remédio da pressão na frente de todo mundo, às oito em ponto. 'Pra ninguém dizer que eu sou mártir.'"*
- Demitida: *"A Simone foi cortada no dia 31. Hoje ela é TARM em Rio Claro e liga pra você uma vez por mês para perguntar quem está pondo os post-its. Ninguém."* (+ link: "Na campanha dela, você vê o resto.")
- `simone_2019_meio` + `carla_sabe_regulador`: + *"A nota dela de 2019 apareceu na matéria. A letra redonda. 'Regional segurando a maca.' Estava certa."*

**Dr. Henrique** — **CORRIGIDO** (FEEDBACK 4). Mostrado se `day ≥ 12`. Uma das variantes:
- **Denunciado, vivo, `denuncia_com_prova`:** *Uma carta: "Eu te odiei por três semanas. Você anexou o papel da noite da sua mãe. Palmeiras. Eu li aquele papel umas cem vezes na clínica. Hoje faz sessenta dias que eu não bebo. A sua mãe mora na Acácias, quarenta. Eu sei de cor agora."*
- **Denunciado, vivo (sem prova):** *Uma carta: "Eu te odiei por três semanas. Hoje faz sessenta dias que eu não bebo."* (texto do GDD)
- **Não denunciado (encobriu ou omitiu), `henrique_sobreviveu`:** *"O Henrique ficou internado onze dias no Regional. O Saulo passava no quarto toda noite, de jaleco amassado, com um pacote de bolacha. Depois, tratamento em Rio Claro. Agora está escrito. Uma carta chega em maio: 'Trinta dias. Você não me denunciou e eu quase morri. Você me fez massagem pelo telefone e eu tô vivo. Eu não sei qual das duas eu te agradeço. Talvez as duas.'"* (+ `encobriu_henrique`: *"'Você assinou embaixo, lembra? Eu também lembro. Eu vou lembrar sóbrio, agora.'"*)
- **`henrique_morreu`:** *"O crachá do Henrique no quadro de cortiça, com uma fita preta."* (+ `guardou_bilhete` / bilhete no bolso: *"Ao lado, a Simone prendeu o seu papel das 22:07, que acharam no bolso da camisa dele. Ninguém tira."*)
- **Linha extra 2019** (qualquer vivo, `ligou_henrique_2019` ou `carla_sabe_regulador`): *"'Fui no poste da Av. Brasil. A irmã dele estava lá. Ela não me xingou. Me deu uma flor de plástico pra pôr. Eu pus.'"*
- (A variante "continua no noturno" **sai**: no D20, sem denúncia, ele sempre cai às 18:58 — ou sobrevive e é tratado, ou morre.)

**Seu Bené**
- `intimBene ≥ 7`: *"Churrasco de aposentadoria do Seu Bené. Você está lá. Ele te apresenta como '{m:o melhor regulador|a melhor reguladora} que eu já ouvi'."*
- + `bene_ultima`: *"Ele conta pra todo mundo que a última corrida foi com você no rádio. Conta errado de propósito, pra ficar mais bonita."*
- + R5 contada (escolha "era a minha mãe"): *"A Dona Zélia foi ao churrasco. Os dois contaram a história do ônibus doze. O Bené puxou palmas de novo, quarenta e sete anos depois."*
- + `desenho_bene`: *"O desenho do Liam está pendurado no lugar do retrovisor do carro dele."*
- + `bene_fonte`: *"Ele deu entrevista para a Gazeta. Trinta e um anos calado e falou numa terça."*
- `intimBene < 7`: *"O Seu Bené se aposentou sem ninguém saber o seu nome."* (com `bene_ultima`: *"...mas ele sabe a sua voz."*)

**Dr. Peixoto**
- Fonte (`sources.peixoto`): *"O Peixoto depôs na Câmara contra a Saúde+ Gestão. Levou a planilha das metas impressa. E a folha do quarto andar, que ele sabia desde sempre."* + (`peixoto_avisado_d16`) *"Todo dia 1º, chega na central um pote de goiabada. Sem bilhete. É do Seu Osvaldo."*
- `peixoto_endureceu` (pai morto): *"O Peixoto assumiu uma central em outra cidade, com as mesmas metas. Ele não liga o rostinho do painel. Diz que o rostinho é do pai."*
- `peixoto_caiu` sem fonte: *"O Peixoto vende seguro de vida em Rio Claro. Diz que é a mesma coisa que coordenar uma central, só que com comissão."*
- Ficou: *"O Peixoto ainda negocia uma vaga zero por plantão. Só uma. Diz que é regra. Ninguém escreveu essa regra."*
- `peixoto_desmascarado`: + *"Ele conta pra quem chega que um regulador o pegou pelo ramal numa ligação-teste. Conta rindo. Conta sempre."*

**Dr. Saulo** *(novo)*
- `saulo_confianca ≥ 4` ou `saulo_leito_cida`: *"O Saulo do Regional atende 'PS do Regional, Saulo' do mesmo jeito. Mas quando é você, ele diz: 'Manda.' antes de você terminar."*
- `saulo_fonte`: + *"Ele foi chamado na Câmara. Levou a folha das sete e um pacote de bolacha. Comeu a bolacha durante o depoimento. Ninguém teve coragem de pedir pra parar."*
- R3 completa (`sabe_2019_henrique` e Saulo ouviu): *"Ele e o Henrique se encontraram no corredor do Regional. Um disse 'sem maca'. O outro disse 'eu não insisti'. Não precisaram dizer mais nada."*
- `saulo_confianca ≤ 1`: *"O Saulo continua lendo a folha das sete. Ninguém nunca pediu pra ele parar."*

### Cidade
**Dona Cida**
- Salva + `cida_reconhecida`: *A carta de letra tremida: "Voltei a assistir a novela, {meu} {filho}. Você reconheceu a minha voz. Ninguém nunca reconheceu a minha voz, só o Nestor."*
- Salva (qualquer) + R5: + *"'O Nestor guardava o guardanapo daquele dia. O pedreiro desenhado de joelho no corredor do ônibus. Vai junto com a carta. É do seu pai. Sempre foi.'"* (o guardanapo aparece colado na carta: quadro de arte novo `carta_cida`)
- Salva + `cida_maquina`: + *"'E a máquina? Tem que dar um tapinha do lado.'"*
- Morta, `cida_maquina`: *"A máquina de costura da Dona Cida, na sala {doconj}, coberta com um pano. {Oconj} tira o pano às terças, que era o dia do grupo."*
- Morta, sem máquina: *"A máquina da Dona Cida foi vendida pela comadre num bazar. A televisão da casa ficou ligada na novela por três dias, até a Noêmia desligar."*
- `d19_cida_chave`: + *"'A vizinha disse que você mandou ela pegar a chave reserva. A Noêmia tá se achando heroína.'"*

**Seu Antônio**
- Salvo + `antonio_agradeceu`: *"Seu Antônio e a Dona Rosa batem à porta num domingo com um bolo de fubá queimado no fundo. Ele voltou a pescar no açude."* + (`juliana_sabe`) *"'A Juliana me disse que era você. Eu sabia que a voz era conhecida.'"*
- Morto + `viuva_antonio_ligou`: *"A Dona Rosa traz o bolo sozinha. 'Ele ia querer que viesse quente.'"*
- Morto, sem ligação: *"A viúva manda um bilhete: 'Ele não quis incomodar. Nunca quis.'"*

**Juliana**: salva → *"A Juliana leva trinta encomendas de uma vez para o ateliê. Entre elas, o terno do pai, para o casamento dela."* / perdida → *"O ateliê perdeu a primeira cliente. O caderninho ainda abre na página 'Juliana — 1ª cliente'."*

**Tia Márcia**: viva → *"A Tia Márcia foi ao aniversário de 9 anos do Liam e levou uma caneta de adrenalina **na validade** de presente pra ela mesma. 'Pra eu lembrar.'"* / morta → *"O Liam deixa um desenho no túmulo da Tia Márcia, preso com uma pedrinha."* (+ `d9_favorecimento`: *"A diretora da escola não te cumprimenta na reunião de pais."*)

**Biel e Seu Jairo**: salvo → *"Biel, 16, curso de socorrista dos Bombeiros. Primeiro da turma em RCP. O número 9-8877 saiu do quadro de cortiça. A Simone tirou com cerimônia."* / perdido → *"Biel no velório do avô, olhando o celular, sem conseguir ligar para ninguém."* (+ `d10_biel_nome`: *"Ele liga pra central uma vez por mês e fica em silêncio. A Simone já sabe quem é. Ela fica na linha."*)

**Rosângela**: salva → *"A Rosângela é sócia do ateliê. O nome dela está na placa."* + (`rosangela_caderninho`) *"O caderninho do Wagner virou prova num processo contra o gabinete 7. A página com o seu nome não estava lá."* (se `rosangela_protegeu`) / perdida → *"Uma nota de rodapé no jornal, entre a previsão do tempo e os classificados: 'Assessor parlamentar é preso em Minas, foragido desde março.'"*

**Carla e Rafael** *(novo)*: matéria forte → *"A Carla ganhou um prêmio estadual. No discurso, falou o nome do irmão, Rafael, e o de uma senhora que ligava todo dia para a Regulação."* (se Cida) / fraca → *"A Carla foi demitida da Gazeta. Abriu um blog. Tem doze leitores. Um deles é você."* / + `carla_sabe_regulador`: *"Ela entrevistou o Henrique. Não publicou. Disse que tem matéria que é pra gente, não pro jornal."*

**Seu Nogueira** *(novo)*: salvo + `brigou_nogueira` → *"O Seu Nogueira manca das duas pernas agora. Cobra o aluguel em dia, mas traz um pé de alface da horta. 'Tudo tem volta, doutor. Até alface.'"* / salvo sem briga → *"O telhado da 40 não pinga mais. O Nogueira subiu na escada pessoalmente, de muleta, para mostrar."* / morto → *"O filho do Nogueira vendeu as casas da Baixada. A 40 ficou. 'Meu pai falava bem de você.'"* (ou, se brigou: *"'Meu pai dizia que tudo tem volta. Não voltou.'"*)

**Vereador e Dona Odete** *(novo)*: `odete_salva` → *"O vereador Arlindo votou contra a renovação do contrato da Saúde+. Disse que foi pela mãe. A Dona Odete disse que foi pela vergonha."* / `odete_morreu` → *"O vereador mandou uma coroa de flores para a central. A Simone devolveu com um post-it branco: 'Não sei classificar.'"* / envelope (`envelope_entregue_policia`) → *"Os mil reais do envelope estão num saco plástico, numa delegacia, com uma etiqueta: 'Prova 14'."*

**Wellington, Seu Dito e Edson** *(novo)*: `final_rua_salvo` → *"Um mês depois, o Wellington e o Seu Dito tomam café na mesma esquina da Av. Brasil."* / `final_rua_obito` → *"O Wellington pôs uma flor de plástico no semáforo. Do lado da cruz do Rafael."* / Edson (D1 vivo) e Henrique vivo → *"O Edson, porteiro do Ed. Aurora, fez o curso dos Bombeiros com o Wellington. Diz que agora 'devolveu'."*

---

## 4. Game overs (ajustes pequenos)
- **Sindicância por fraude de ficha (D18):** se `guardou_bilhete` (você registrou o erro do Henrique na hora), vira **advertência** em vez de game over (ROTEIRO 3.2). Texto da advertência: *"O seu papel das 22:07 estava na pasta. Mostra que você viu e registrou. Mostra também que você calou. Advertência."*
- **Despejo:** se `nogueira_perdoou`, a contagem de aluguéis atrasados zera uma vez.
- Demais: sem mudança.

## 5. Lista para a Arte (quadros novos)
| Id proposto | O que é | Final |
|---|---|---|
| `onibus_noite` | interior do 12, 19:40, luz verde, Seu Aílton de costas, a cidade nas janelas | todos (abertura) |
| `central_noite_fora` | janela acesa da central às 3h, chuva, vulto de headset | ruim |
| `cozinha_seis_meses` | a cozinha com 1 objeto mudado por arco | normal |
| `gazeta_capa` | capa da Gazeta + xícara | bom |
| `central_manha` | central com sol, Simone supervisora, você chegando | bom |
| `carta_cida` | carta de letra tremida com o guardanapo do Nestor colado (o pedreiro de joelho no corredor do ônibus) | mural (Cida + R5) |
| `churrasco_bene` | quintal com churrasqueira, Bené de avental, desenho no retrovisor | mural (Bené ≥ 7) |
| `cruz_poste` | a cruz do Rafael com flor nova; ao lado, a flor do Wellington | mural / ônibus |
| `mostra_biblioteca` | o desenho da central emoldurado, plaquinha "Liam Moura, 9 anos" | bom (3+ aulas) |
| `interfone_mao` | sua mão apertando o interfone na sala com ar-condicionado | secreto |
| `dois_caes_tapete` | Ozzy e o Pirata dormindo no tapete | casa D18 / normal |
| Desenho do Liam em 3 níveis | giz (0) / traço firme com sombra (1–2) / grafite e aquarela (3+) | todos (última imagem) |

## 6. Música (para o Áudio)
| Momento | Tema |
|---|---|
| O último ônibus | sem trilha: motor + rádio AM (viola) |
| Ruim | tom de discagem, "tuuu"; uma nota do tema em piano se o Henrique sóbrio atende |
| Normal | tema em caixinha de música, termina sem resolver |
| Bom | tema em tom maior, violão + assobio (o assobio do Bené), resolve |
| Secreto | bossa de elevador abafando um telefone que toca até o último crédito |
| Mural | pianinho com a melodia do tema, uma nota por foto |
