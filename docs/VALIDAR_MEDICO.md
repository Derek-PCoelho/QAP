# Revisão médica: o que validar

Gerado automaticamente a partir do conteúdo do jogo (`npx vite-node scripts/medical-review.ts`). Para cada ligação: o diagnóstico que o jogo considera verdadeiro, a gravidade, a decisão aceita como correta, o apoio, o destino, as perguntas obrigatórias e a janela de risco (em minutos desde a chegada da ligação: até `bom` o paciente sobrevive; depois de `ruim` não sobrevive; entre os dois, a chance cai em linha reta). Corrija direto no arquivo indicado e rode `npm test`.

Legenda: ⚖ = mais de uma decisão é aceita (a primeira é a preferida). Texto entre colchetes é marcação de cena. As falas foram encurtadas.

## Dia 1: Primeiro Plantão

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:04 | `d01_cida` ★<br>Aparecida (Dona Cida), 79 | Pressão levemente alta e solidão | 🟦 azul | Orientação → UBS/CASA |  |  |  |  |  |
| 07:30 | `d01_lurdes` ★<br>Lurdes Andrade, 80 | Provável fratura de fêmur | 🟨 amarelo | USB |  |  |  | 120/320 (USB) |  |
| 08:15 | `d01_et` ★<br>"ET ferido" | Trote | — trote | Trote |  |  |  |  |  |
| 09:10 | `d01_parada` ★<br>Homem não identificado, 55 | Parada cardiorrespiratória | 🟥 vermelho | USA |  |  |  | 30/75 +28 c/ orientação | rcp |
| 10:25 | `d01_febre`<br>Kauã, 3 | Virose (febre sem sinais de alarme) | 🟩 verde | Orientação → UBS/UPA/CASA |  |  |  |  |  |
| 11:35 | `d01_moto`<br>Matheus Rocha, 23 | Trauma moderado: corte profundo no braço e dor no ombro | 🟨 amarelo | USB |  |  |  |  |  |
| 12:55 | `d01_dente`<br>Reginaldo Prado, 34 | Dor de dente (caso odontológico) | 🟩 verde | ⚖ Orientação ou USB → UPA/UBS |  |  |  |  |  |
| 14:20 | `d01_dpoc`<br>Iracema Ferreira, 74 | Insuficiência respiratória (DPOC descompensada) | 🟥 vermelho | USA |  |  |  | 50/120 |  |

<details><summary>Aberturas das ligações</summary>

- **d01_cida** (07:04): Oi meu filho, é a Cida! Bom dia! Viu a novela ontem? / Ó, eu fui medir a pressão na farmácia e deu 14 por 9. A moça falou pra ficar de olho. Aí eu liguei, né? Pra ficar de olho junto.
- **d01_lurdes** (07:30): Alô, emergência? Minha mãe caiu aqui em casa! Ela tá no chão da cozinha, não consegue apoiar a perna! / [gemidos ao fundo] / MÃE: Ai, Sueli, não mexe... não mexe...
- **d01_et** (08:15): Alô? Emergência? Corre, corre! Tem um ET ferido aqui na Rua Saturno, 42! Ele tá verde e sangrando azul! / [risadas abafadas]
- **d01_parada** (09:10): Moço! Um homem caiu na calçada aqui na frente da loja! Ele não tá respirando! / [buzinas, gente gritando em volta]
- **d01_febre** (10:25): Bom dia, desculpa ligar... meu filho tá com febre de 38 desde ontem. É grave?
- **d01_moto** (11:35): Oi, um motoboy caiu aqui na Sete de Setembro! Ele tá sentado, conversando, mas cortou o braço feio.
- **d01_dente** (12:55): Doutor, pelo amor de Deus, eu tô morrendo... de dor de dente! Não aguento mais!
- **d01_dpoc** (14:20): Alô! Minha mãe tem DPOC, usa oxigênio... a boca dela tá roxa e ela não consegue falar! / [respiração rápida e chiada ao fundo]

</details>

## Dia 2: O Quadro

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:06 | `d02_biel` ★<br>"Homem esfaqueado" | Trote | — trote | Trote |  |  |  |  |  |
| 07:55 | `d02_convulsao`<br>Gustavo Teixeira, 17 | Pós-crise convulsiva em epiléptico (sem remédio, corte na testa) | 🟨 amarelo | USB |  |  |  | 100/280 (USB) |  |
| 08:45 | `d02_cida` ★<br>Aparecida (Dona Cida), 79 | Pressão controlada e vontade de conversar | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 09:35 | `d02_peixe`<br>"Amigo que engoliu um peixe" | Trote | — trote | Trote |  |  |  |  |  |
| 10:25 | `d02_faca`<br>Juarez Almeida, 46 | Hemorragia arterial no antebraço com sinais de choque | 🟥 vermelho | USA |  |  |  | 45/110 +15 c/ orientação | hemorragia |
| 11:20 | `d02_praca`<br>Cleiton Souza, 33 | Intoxicação alcoólica com queda (corte no supercílio) | 🟨 amarelo | USB |  |  |  | 110/300 (USB) |  |
| 12:15 | `d02_muda` ★<br>"Linha muda" | Ligação acidental (criança brincando com o telefone) | — trote | Trote |  |  |  |  |  |
| 13:20 | `d02_gestante`<br>Kelly Cristina Rocha, 24 | Início de trabalho de parto (39 semanas, bolsa íntegra) | 🟩 verde | ⚖ Orientação ou USB → MAT |  |  | contracoes, bolsa, sangramento, mexe |  |  |
| 14:35 | `d02_hda`<br>Sebastião Moreira, 70 | Hemorragia digestiva alta com sinais de choque | 🟥 vermelho | USA |  |  |  | 45/110 |  |
| 16:10 | `d02_tornozelo`<br>Maicon Rodrigues, 19 | Entorse de tornozelo | 🟩 verde | Orientação → UPA/UBS |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d02_biel** (07:06): Alô, emergência? Corre, corre! Tem um cara esfaqueado aqui na frente da Escola Estadual! Tá jorrando sangue, manda rápido! / [risadas abafadas, alguém cobrindo o fone]
- **d02_convulsao** (07:55): Moço, o meu filho teve crise. Ele tem epilepsia. Já parou, mas ele caiu e cortou a testa e agora tá ali no chão dormindo, roncando. Eu não consigo levantar ele sozinha! / [um ronco alto e regular, perto do fone]
- **d02_cida** (08:45): Bom dia, meu filho! É a Cida! É você, o doutor de ontem? Reconheci pela voz! / Ó, eu liguei pra dar notícia boa, pra variar: medi a pressão na farmácia do Seu Toninho e deu treze por oito! Treze por oito! Nem acreditei.
- **d02_peixe** (09:35): Moço da ambulância! Meu amigo engoliu um peixe vivo! Um lambari inteiro, ele apostou que conseguia e engoliu! / [gargalhadas, alguém batendo palma] / Ele tá dizendo que o peixe tá nadando dentro da barriga!
- **d02_faca** (10:25): Socorro! Meu marido cortou o braço com a faca de cozinha, o sangue não para! Ele tá branco e tonto! / HOMEM: Para, Cláudia... não precisa de ambulância, é um cortinho...
- **d02_praca** (11:20): Bom dia, moço. Aqui é o Dito, da pipoca da praça da Matriz. Tem um rapaz caído do lado do coreto, bêbado de cair. Caiu de cara no chão. / [ao fundo, uma voz enrolada xingando]
- **d02_muda** (12:15): [silêncio] / [um barulhinho de plástico, bem perto do fone] / [ao longe, a musiquinha de um desenho animado]
- **d02_gestante** (13:20): Oi... eu tô grávida de trinta e nove semanas e começou a dor. Tô sentindo que vai nascer agora, moço, é o meu primeiro, eu tô sozinha! / [respiração funda e lenta, que vai passando]
- **d02_hda** (14:35): Moço, meu pai tá com uma dor forte na barriga e vomitou sangue! Primeiro era escuro, agora veio vermelho vivo! / PAI: Para com isso, Rosilene... é a úlcera, já tive, passa...
- **d02_tornozelo** (16:10): Alô, emergência? Ai, ai, ai... quebrei o pé, moço! Tá torto! Pisei na bola e virou tudo! / [risadas e assobios: "foi frango, Maicon!"] / Para de rir, desgraça! Tá doendo de verdade!

</details>

## Dia 3: O Peito

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:05 | `d03_biel` ★<br>"Idoso engasgado com a dentadura" | Trote | — trote | Trote |  |  |  |  |  |
| 08:05 | `d03_antonio` ★ *(padrão)*<br>Antônio Ferreira, 58 | Infarto agudo do miocárdio | 🟥 vermelho | USA |  |  |  | 60/150 |  |
| 09:00 | `d03_muscular`<br>Patrícia Gonçalves, 35 | Dor muscular na parede do tórax (esforço) | 🟩 verde | ⚖ Orientação ou USB → UBS/CASA/UPA |  |  |  |  |  |
| 09:45 | `d03_cida` ★<br>Aparecida (Dona Cida), 79 | Dúvida sobre o horário do remédio (relógio parado) | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 10:40 | `d03_conceicao` ★<br>Conceição Aparecida Lopes, 67 | Infarto atípico (sem dor) em diabética | 🟥 vermelho | USA |  |  |  | 60/150 |  |
| 11:40 | `d03_bicicleta`<br>Enzo Batista, 9 | Fratura fechada de antebraço | 🟨 amarelo | USB |  |  |  | 100/280 (USB) |  |
| 12:50 | `d03_briga`<br>Leandro Nunes, 25 | Crise de ansiedade (hiperventilação) após agressão | 🟩 verde | ⚖ Orientação ou USB → CASA/UBS |  |  |  |  | respiracao |
| 14:00 | `d03_atropelamento`<br>Nilton Araújo, 61 | Traumatismo cranioencefálico grave (atropelamento) | 🟥 vermelho | USA |  |  |  | 45/110 +15 c/ orientação | trauma |
| 15:30 | `d03_acamado`<br>Osmar Cardoso, 84 | Provável infecção (urinária ou pulmonar) com confusão em idoso acamado | 🟨 amarelo | USB |  |  |  | 120/320 (USB) |  |

<details><summary>Aberturas das ligações</summary>

- **d03_biel** (07:05): Ô, emergência! Corre! Tem um véio aqui no ponto de ônibus que engoliu a dentadura! Tá ficando roxo, tá ficando ROXO! / [freio de ônibus, risada de três ou quatro adolescentes]
- **d03_antonio** (08:05): Bom dia, doutor, desculpa incomodar... é que eu tô com uma queimação aqui no estômago, deve ser o feijão. Minha mulher que mandou ligar. / [ao fundo, uma mulher: "Fala direito, Antônio! Fala do braço!"]
- **d03_muscular** (09:00): Oi, bom dia. Eu tô com uma dor no peito, tipo uma pontada, do lado esquerdo. Fiquei com medo de ser coração, minha mãe teve problema.
- **d03_cida** (09:45): Bom dia, meu filho! É a Cida! Ó, desculpa, é bobagem: o relógio da cozinha parou e eu não sei se já posso tomar o remédio das dez. / Que horas são aí, meu filho? A TV tá passando propaganda e propaganda não tem hora.
- **d03_conceicao** (10:40): Bom dia, doutor. Desculpa ligar por bobagem... é que eu tô com só um cansaço e um enjoo. A vizinha que insistiu pra eu ligar. / [respiração curta entre uma frase e outra]
- **d03_bicicleta** (11:40): Moço! Moço da ambulância! O Enzo caiu da bicicleta na descida e o braço dele ficou torto! Ele tá chorando muito! / [choro alto de criança ao fundo]
- **d03_briga** (12:50): Moço, meu coração tá disparado, não para! E as minhas mãos tão formigando, tão travando! Eu vou morrer? / [respiração rápida e curta]
- **d03_atropelamento** (14:00): Atropelaram o Seu Nilton da banca! Um carro pegou ele na faixa e fugiu! Ele tá no chão, não responde! / [buzinas, gente gritando "não mexe nele!"]
- **d03_acamado** (15:30): Boa tarde. Meu sogro é acamado, teve derrame faz dois anos. Desde ontem ele tá falando coisa com coisa... quer dizer, não tá falando coisa com coisa. E tá com febre de trinta e oito e meio.

</details>

## Dia 4: Cena Quente

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:10 | `d04_cida` ★<br>Aparecida (Dona Cida), 79 | Picada de agulha de costura no dedo (vacina antitetânica a conferir) | 🟦 azul | Orientação → UBS/CASA |  |  |  |  |  |
| 08:00 | `d04_exagerador`<br>Sirlene Pinto, 41 | Gastroenterite sem desidratação grave | 🟩 verde | Orientação → UPA/UBS |  |  |  |  |  |
| 09:00 | `d04_tiro` ★<br>Josué Batista, 34 | Ferimento por arma de fogo na coxa com hemorragia | 🟥 vermelho | USA | PM |  |  | 45/110 +15 c/ orientação | cena_insegura |
| 10:10 | `d04_facao`<br>Valmir Santana, 52 | Corte no couro cabeludo por agressão (agressor armado no local) | 🟨 amarelo | USB | PM |  |  | 100/280 (USB) |  |
| 11:15 | `d04_moto`<br>Wanderson Lima, 25 | Politrauma com TCE (colisão carro × moto) | 🟥 vermelho | USA |  |  |  | 45/110 +15 c/ orientação | trauma |
| 12:20 | `d04_escorpiao`<br>Lara Martins, 4 | Picada de escorpião com sinais sistêmicos (vômitos) em criança | 🟥 vermelho | USA |  |  |  | 50/120 +10 c/ orientação | escorpiao |
| 13:40 | `d04_enxaqueca`<br>Rosana Mendes, 50 | Crise de enxaqueca habitual, sem sinais de alarme | 🟩 verde | ⚖ Orientação ou USB → CASA/UBS/UPA |  |  |  |  |  |
| 14:50 | `d04_incendio`<br>"Cinco feridos em incêndio" | Trote | — trote | Trote |  |  |  |  |  |
| 16:00 | `d04_joelho`<br>Geraldo Freitas, 76 | Queda mecânica com escoriação no joelho | 🟩 verde | Orientação → CASA/UBS |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d04_cida** (07:10): Bom dia, meu filho! É a Cida! Ó, espetei o dedo na agulha, pregando um botão. Precisa tomar a vacina do tétano? / Eu costurava pra fora, sabe, meu filho? Quarenta anos de agulha e nunca me espetei assim. Tô ficando velha.
- **d04_exagerador** (08:00): Minha esposa tá MORRENDO, pelo amor de Deus, manda a ambulância! Manda agora!
- **d04_tiro** (09:00): Emergência! Deram tiro aqui no Bar do Neno! O Josué tá no chão sangrando! O cara ainda tá lá fora com o revólver, eu tô escondido atrás do balcão! / [gritos na rua, um estampido seco]
- **d04_facao** (10:10): Moço, o vizinho deu com o cabo do facão na cabeça do meu marido por causa do pé de jaca! Tá sangrando muito! / [ao fundo, um homem gritando: "Vem que tem mais! Vem!"]
- **d04_moto** (11:15): Eu bati nele! Eu não vi, juro que não vi! O motoqueiro voou por cima do meu carro e tá no chão, não se mexe! / [buzinas, alguém gritando "não tira o capacete!"]
- **d04_escorpiao** (12:20): Moço, um escorpião picou a minha filha! No pé, quando ela foi calçar o tênis! Ela tem quatro anos! / [choro agudo, e um barulho de ânsia]
- **d04_enxaqueca** (13:40): (voz baixinha) Oi... desculpa. É a enxaqueca de sempre. Tomei o meu remédio e não passou. Meu marido que mandou ligar.
- **d04_incendio** (14:50): Incêndio com cinco feridos! Tá pegando fogo num sobrado na Rua Pitangueira, 2950! Manda tudo, manda ambulância, manda tudo! / [ao fundo, só uma televisão num programa de auditório. Nenhuma sirene, nenhum grito, nenhum estalo de fogo]
- **d04_joelho** (16:00): Boa tarde. Olha, eu nem ia ligar, foi a minha filha que mandou por mensagem. Caí no quintal, mas já levantei. Só ralou o joelho.

</details>

## Dia 5: Corte

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:10 | `d05_infarto`<br>Nivaldo Pereira, 62 | Infarto agudo do miocárdio | 🟥 vermelho | USA |  |  |  | 60/150 |  |
| 07:50 | `d05_dedo`<br>Kléber Antunes, 24 | Corte superficial na ponta do dedo | 🟩 verde | Orientação → UBS/UPA |  |  |  |  |  |
| 08:40 | `d05_academia` ★ *(padrão)*<br>Marco Aurélio Teixeira, 48 | Parada cardiorrespiratória (fibrilação ventricular) | 🟥 vermelho | USA |  |  |  | 30/75 +28 c/ orientação | rcp |
| 09:40 | `d05_piscina`<br>Enzo Gabriel Martins, 4 | Afogamento leve (quase afogamento), consciente | 🟨 amarelo | ⚖ USB ou USA |  |  |  | 100/260 (USB) |  |
| 10:30 | `d05_cida` ★<br>Aparecida (Dona Cida), 79 | Medo da notícia do corte (pressão normal) | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 12:00 | `d05_pedreiro`<br>Gildásio Damasceno, 37 | Trauma raquimedular (queda de 6 metros) | 🟥 vermelho | USA |  |  |  | 45/110 +15 c/ orientação | queda_coluna |
| 13:20 | `d05_asma`<br>Patrícia Sampaio, 34 | Crise de asma moderada | 🟨 amarelo | USB |  |  |  | 110/280 (USB) |  |
| 14:40 | `d05_trote`<br>"Professora desmaiada" | Trote (alunos com celular na sala) | — trote | Trote |  |  |  |  |  |
| 15:50 | `d05_benedita`<br>Benedita Alves, 86 | Desidratação em idosa (calor e diurético) | 🟨 amarelo | USB |  |  |  | 120/320 (USB) |  |

<details><summary>Aberturas das ligações</summary>

- **d05_infarto** (07:10): Alô, emergência? É o meu pai! Ele tá com uma dor no peito que aperta, falou que parece um elefante sentado em cima! / [ao fundo, um gemido baixo e uma cadeira sendo arrastada]
- **d05_dedo** (07:50): Doutor, corre! Eu quase arranquei o dedo abrindo uma lata de sardinha! Tem sangue pra todo lado! / [respiração ofegante; um gato miando perto do telefone]
- **d05_academia** (08:40): Emergência?! O professor caiu da esteira! Ele não tá respirando! Uma aluna tá fazendo massagem nele! / [música eletrônica alta; alguém grita "desliga esse som!"]
- **d05_piscina** (09:40): Moço, meu neto caiu na piscina funda! Um rapaz pulou e tirou ele! Ele tá tossindo, tossindo e chorando muito! / [choro forte de criança; gente em volta falando alto]
- **d05_cida** (10:30): Oi, meu filho, é a Cida! Bom dia! Ó, eu li no jornal que tiraram duas ambulâncias. É verdade? / E se eu cair aqui sozinha, quem vem me buscar? / [TV: "...e a Marta entra na sala sem bater..."]
- **d05_pedreiro** (12:00): Doutor, o Gildásio caiu do andaime! Lá do segundo andar, uns seis metros! Ele tá no chão falando que não sente as pernas! / [betoneira ligada; alguém grita "desliga isso!"]
- **d05_asma** (13:20): Oi... eu tenho asma... tô com crise desde cedo. / [chiado audível a cada respiração] / Usei a bombinha três vezes... melhorou um pouco, mas não passa.
- **d05_trote** (14:40): Alô? É da ambulância? A professora caiu no chão e não acorda! / [risadinhas de várias crianças; alguém sussurra "fala que tá sangrando!"] / Ela tá... ela tá sangrando! Muito!
- **d05_benedita** (15:50): Boa tarde... eu sou vizinha da Dona Benedita. Ela tá fraquinha, deitada, faz dois dias que não come. Eu trouxe sopa e ela não quis. / BENEDITA: Não precisa, Sônia... eu tenho oitenta e seis anos e nunca precisei de ambulância...

</details>

## Dia 6: O Lado do Rosto

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:15 | `d06_tontura`<br>Camila Freitas, 30 | Tontura postural (jejum) | 🟩 verde | Orientação → CASA/UBS |  |  |  |  |  |
| 07:40 | `d06_avc` ★ *(padrão)*<br>Ademir Toledo, 67 | AVC isquêmico ("acordou assim"; visto bem às 05:00) | 🟥 vermelho | ⚖ USA ou USB |  |  | inicio, fast | 60/140 (USB) | avc |
| 09:00 | `d06_cachaca`<br>Gérson Lopes, 52 | Intoxicação alcoólica (vômitos e sonolência) | 🟨 amarelo | USB |  |  |  |  |  |
| 10:20 | `d06_hipo_mae` ★<br>Jaqueline Santos, 31 | Hipoglicemia grave (diabética em uso de insulina) | 🟥 vermelho | USA |  |  |  | 50/120 | hipoglicemia |
| 11:30 | `d06_cida` ★<br>Aparecida (Dona Cida), 79 | Dúvida sobre AVC (FAST normal) | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 13:00 | `d06_avc2`<br>Sebastião Ramos, 74 | AVC isquêmico na janela | 🟥 vermelho | ⚖ USA ou USB |  |  |  | 60/140 (USB) | avc |
| 14:20 | `d06_cabeca`<br>Bernardo, 1 | Trauma craniano leve em bebê (queda do beliche) | 🟨 amarelo | USB |  |  |  |  |  |
| 15:40 | `d06_lombar`<br>Valdemar Souza, 45 | Dor lombar crônica (sem sinais de alarme) | 🟩 verde | Orientação → UBS |  |  |  |  |  |
| 17:00 | `d06_trote`<br>"Avó com AVC" | Trote (avó "falando ao contrário") | — trote | Trote |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d06_tontura** (07:15): Oi, bom dia... desculpa ligar. Eu levantei da cama rápido e ficou tudo escuro. Sentei no chão do corredor. É normal isso?
- **d06_avc** (07:40): Doutor, meu marido acordou com a boca torta! Ele tá falando enrolado, tipo bêbado, mas ele não bebe! Não bebe nada! / [um rádio AM ao fundo; um homem tenta falar e as palavras saem emboladas]
- **d06_cachaca** (09:00): Moço, meu marido tá falando tudo enrolado, não para em pé! Será que é derrame? Passou na TV que derrame é assim! / [um homem cantando desafinado ao fundo: "...ai, ai, ai, meu coração..."]
- **d06_hipo_mae** (10:20): Moço... minha mãe não acorda. Ela tá no chão da cozinha. / [desenho animado na TV, uma musiquinha alegre] / Eu chamei, chamei... ela não fala.
- **d06_cida** (11:30): Oi, meu filho, é a Cida! Ó, passou no jornal da TV como é que a gente sabe se tá tendo derrame. Fiquei cismada. / Me ensina? / [TV: "...no próximo capítulo de Amor de Cristal..."]
- **d06_avc2** (13:00): Doutor, meu pai começou a falar enrolado no almoço. E o braço esquerdo dele tá caído, ele não consegue pegar o copo. / [talheres; uma criança pergunta "o vô tá bem?"]
- **d06_cabeca** (14:20): Moço, meu bebê caiu da cama de cima do beliche! Bateu a cabeça no chão! Chorou na hora, um berro! / [risadinha de bebê; um brinquedo musical tocando]
- **d06_lombar** (15:40): Doutor, boa tarde. Eu tô com uma dor nas costas que vai me matar. Manda uma injeção forte aí, que a dipirona não faz mais nem cócegas.
- **d06_trote** (17:00): Alô, emergência! Minha avó tá tendo um AVC! Ela tá falando tudo de trás pra frente! Fala "luza é uéc O"! / [risadas abafadas; música de videogame]

</details>

## Dia 7: O Vereador

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:15 | `d07_sangramento`<br>Aline Barros, 26 | Sangramento pequeno na gestação (20 semanas), sem dor | 🟩 verde | ⚖ Orientação ou USB → MAT |  |  |  |  |  |
| 08:40 | `d07_vereador` ★<br>Odete Matos, 82 | Idosa estável (transporte para exame de rotina) | 🟦 azul | Orientação → UBS/CASA |  |  |  |  |  |
| 08:40 | `d07_eclampsia` ★<br>Kátia Cardoso, 29 | Eclâmpsia (34 semanas) | 🟥 vermelho | USA |  |  |  | 50/120 | eclampsia |
| 09:50 | `d07_parto`<br>Bianca Mendes, 22 | Parto em período expulsivo | 🟨 amarelo | ⚖ USB ou USA |  |  |  |  | parto |
| 10:50 | `d07_engasgo`<br>Geraldo Nascimento, 78 | Obstrução de via aérea (engasgo com carne) | 🟥 vermelho | USA |  |  |  | 25/60 +30 c/ orientação | desengasgo_rcp |
| 11:50 | `d07_cida` ★<br>Aparecida (Dona Cida), 79 | Queimadura pequena no dedo (forno) | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 13:00 | `d07_wesley` ★<br>Wesley Batista, 19 | Fratura exposta de perna (estável) | 🟨 amarelo | USB |  |  |  | 100/260 (USB) |  |
| 14:20 | `d07_febre`<br>Rodrigo Dias, 31 | Síndrome gripal (virose) | 🟩 verde | Orientação → CASA/UBS/UPA |  |  |  |  |  |
| 15:40 | `d07_trote`<br>"Tio desmaiado" | Trote (churrasco) | — trote | Trote |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d07_sangramento** (07:15): Bom dia... eu tô grávida, de vinte semanas. Fui no banheiro e tinha um pouquinho de sangue na calcinha. É normal? Tô com tanto medo...
- **d07_vereador** (08:40): Bom dia. Aqui é o vereador Arlindo Matos. Minha mãe tá fraquinha e eu quero a UTI móvel, a ambulância boa, pra levar ela no Regional fazer uns exames. / Você sabe com quem tá falando?
- **d07_eclampsia** (08:40): Socorro! Minha mulher tá se debatendo toda no chão! Ela tá grávida! A pressão dela tava alta no posto! / [um baque; um cachorro latindo sem parar; o homem gritando "Kátia! Kátia!"]
- **d07_parto** (09:50): Moço! Minha filha tá parindo no banheiro! Tô vendo a cabeça do bebê! Tá saindo! / [gritos ritmados de esforço; água correndo]
- **d07_engasgo** (10:50): Socorro! Meu pai tá engasgado com carne! Ele não consegue falar, tá com a mão no pescoço! / [gritos; alguém dando tapas nas costas dele; uma criança chorando]
- **d07_cida** (11:50): Oi, meu filho, é a Cida! Bom domingo! Ó, tô fazendo bolo de laranja pro grupo da igreja e queimei a pontinha do dedo no forno. / Passei pasta de dente, que a minha mãe ensinava. Fiz certo?
- **d07_wesley** (13:00): Doutor, um motoboy caiu aqui na frente da feira! O osso da perna tá aparecendo, saindo pela calça! / [gente em volta; alguém grita "não tira o capacete dele!"] / Ele tá pedindo pra avisar a mãe. Diz que a mãe trabalha aí na Regulação. Simone, o nome dela.
- **d07_febre** (14:20): Doutor... eu tô morrendo. Febre, dor no corpo inteiro. Até o cabelo dói. / ESPOSA: É gripe, Rodrigo! Gripe!
- **d07_trote** (15:40): Alô, emergência? O meu tio tá desmaiado, não respira! Manda a ambulância grande, rápido! / [voz de homem ao fundo, rindo: "Fala que eu tô morrendo! Fala que eu tô morrendo!"] / [gargalhadas; pagode alto]

</details>

## Dia 8: A Apresentação

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:10 | `d08_onibus`<br>Lucas Teles, 19 | Desmaio vasovagal (jejum e calor) | 🟩 verde | ⚖ Orientação ou USB → CASA/UPA/UBS |  |  |  |  |  |
| 08:10 | `d08_pizza` ★ *(padrão)*<br>Rosângela Ferraz, 38 | Violência doméstica (pedido disfarçado de pizza) | 🟨 amarelo | USB | PM |  |  | 120/300 (USB) |  |
| 09:20 | `d08_anticoag`<br>Otávio Cunha, 81 | Trauma craniano em idoso anticoagulado (vômitos e sonolência) | 🟥 vermelho | USA |  |  |  | 45/110 |  |
| 10:30 | `d08_convulsao`<br>Luciana Prates, 33 | Estado de mal epiléptico | 🟥 vermelho | USA |  |  |  | 50/120 | convulsao |
| 11:30 | `d08_cida` ★<br>Aparecida (Dona Cida), 79 | Provável fratura de punho (queda no banheiro) | 🟨 amarelo | USB |  |  |  | 120/320 (USB) |  |
| 12:40 | `d08_petequias`<br>Heitor, 2 | Suspeita de meningococcemia | 🟥 vermelho | USA |  |  |  | 50/120 |  |
| 14:00 | `d08_diarreia`<br>Tereza Siqueira, 77 | Diarreia aguda sem desidratação | 🟩 verde | Orientação → UBS/CASA |  |  |  |  |  |
| 15:20 | `d08_choque`<br>Cícero Bastos, 41 | Choque elétrico (220 V) com queimadura na mão | 🟨 amarelo | USB |  |  |  | 110/280 (USB) |  |
| 16:40 | `d08_trote`<br>"Pedido de pizza" | Trote (pedido de pizza) | — trote | Trote |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d08_onibus** (07:10): Bom dia, aqui é o motorista da linha 12. Um rapaz desmaiou aqui no ônibus, caiu em cima de uma senhora. Mas já acordou, tá sentado, tá falando. / [buzinas; passageiros reclamando do atraso]
- **d08_pizza** (08:10): Oi... queria pedir uma pizza. Grande. De calabresa. / Pra Rua Ipê, 112. Jardim Norte. / [voz masculina ao fundo, gritando: "Com quem você tá falando?!"]
- **d08_anticoag** (09:20): Doutor, meu pai caiu da escada de fora agora cedo. Bateu a cabeça no degrau. Ele diz que não foi nada, mas acabou de vomitar duas vezes. / OTÁVIO: Para de exagero, Juninho...
- **d08_convulsao** (10:30): A minha mulher tá tendo convulsão e não para! Já faz mais de dez minutos! / [batidas ritmadas no chão; o homem contando baixinho]
- **d08_cida** (11:30): Oi, meu filho... é a Cida. [uma risadinha sem graça] Hoje não é novela, não. / Escorreguei no banheiro. Tô sentada no chão aqui. Acho que torci o pulso. / [uma torneira pingando]
- **d08_petequias** (12:40): Meu filho tá com febre alta desde de manhã e apareceram umas manchinhas roxas na perna. Antes eram duas, agora tá cheio. / [um choro fraco, quase um gemido]
- **d08_diarreia** (14:00): Oi, boa tarde. Minha avó tá com diarreia faz dois dias. Ela é teimosa, não quer ir no médico. Fiquei com medo dela desidratar.
- **d08_choque** (15:20): Moço, meu colega levou um choque mexendo no quadro de luz de uma casa! Foi jogado pra trás! Ele tá acordado, mas a mão tá queimada! / [um homem gemendo; um cachorro latindo]
- **d08_trote** (16:40): Alô! É da pizzaria? Quero uma calabresa grande com borda recheada! E um refri de dois litros! / [gargalhadas; música alta; várias vozes: "pede de frango também!"]

</details>

## Dia 9: Linha Direta

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 06:52 | `d09_valdir`<br>Valdir Gomes, 71 | Hipertensão sem sinais de gravidade (sem remédio) | 🟩 verde | ⚖ Orientação ou USB → UBS/UPA |  | UPA | dorpeito, respira, fast, visao |  |  |
| 08:20 | `d09_moto` ★<br>Everton Lima, 22 | Traumatismo cranioencefálico grave | 🟥 vermelho | USA |  | REG |  | 45/110 +15 c/ orientação | trauma |
| 09:00 | `d09_cida` ★<br>Aparecida (Dona Cida), 79 | Coceira no gesso (fratura de punho em tratamento) | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 09:00 | `d09_cida_b` ★<br>Aparecida (Dona Cida), 79 | Fratura de punho não tratada (queda de ontem) | 🟨 amarelo | ⚖ USB ou USA |  | REG/UPA |  |  |  |
| 10:15 | `d09_parto` ★<br>Tainara (gestante), 27 | Trabalho de parto em período expulsivo | 🟨 amarelo | ⚖ USB ou USA |  | MAT |  |  | parto |
| 11:30 | `d09_trote`<br>"Dona Maria" | Trote sofisticado | — trote | Trote |  |  |  |  |  |
| 12:40 | `d09_helio`<br>Hélio Moreira, 68 | Hipoglicemia leve, já corrigida | 🟩 verde | Orientação → UBS/CASA |  |  |  |  |  |
| 13:30 | `d09_thais`<br>Pedro, 8 | Otite (dor de ouvido) sem sinais de gravidade | 🟩 verde | Orientação → UBS/UPA |  |  |  |  |  |
| 14:00 | `d09_casa` ★ *(padrão)*<br>Liam Moura, 8 | Crise de asma grave (tórax silencioso) | 🟥 vermelho | ⚖ USA ou USB |  | REG |  |  | varia |
| 14:00 | `d09_casa` ★ *(com bombinha)*<br>Liam Moura, 8 | Crise de asma moderada | 🟨 amarelo | USB |  | UPA/REG |  |  | varia |
| 14:00 | `d09_marcia` ★ *(padrão)*<br>Márcia Albuquerque Reis, 41 | Anafilaxia grave (picada de abelha) | 🟥 vermelho | ⚖ USA ou USB |  | REG |  | 28/70 +35 c/ orientação | anafilaxia |
| 14:00 | `d09_marcia` ★ *(com bombinha)*<br>Márcia Albuquerque Reis, 41 | Anafilaxia grave (picada de abelha) | 🟥 vermelho | USA |  | REG |  | 28/70 +35 c/ orientação | anafilaxia |
| 17:50 | `d09_bruna`<br>Bruna Santana, 19 | Crise de ansiedade (hiperventilação) | 🟩 verde | ⚖ Orientação ou USB → CASA/UBS |  | UPA | frases, labios, inchaco, dorpeito |  | respiracao |

<details><summary>Aberturas das ligações</summary>

- **d09_valdir** (06:52): Bom dia, doutor. Desculpa ligar cedo. Fui na farmácia medir a pressão e deu 18 por 11. A moça ficou assustada e mandou eu ligar.
- **d09_moto** (08:20): Um motoqueiro bateu num carro aqui na frente do posto, ele tá no chão, não responde! / [buzinas, motor ligado, alguém gritando "não mexe nele!"]
- **d09_cida** (09:00): Oi meu filho, é a Cida! Ó, o gesso tá coçando que é uma loucura. Posso enfiar uma agulha de tricô por dentro?
- **d09_cida_b** (09:00): O punho tá roxo e inchado desde ontem, meu filho. Não dormi. / [ela respira fundo] / Desculpa ligar de novo.
- **d09_parto** (10:15): Minha mulher tá ganhando neném! A bolsa estourou, ela diz que quer fazer força! / [gemidos ritmados; uma criança pequena pergunta: "mamãe tá dodói?"]
- **d09_trote** (11:30): Minha avó caiu da escada. Rua Ipê, 112, Jardim Norte. Manda rápido. / [música de videogame baixinha]
- **d09_helio** (12:40): Doutor, eu tremi todo, suei, achei que ia morrer. Aí minha mulher me deu um suco com açúcar e passou. Precisa de ambulância?
- **d09_thais** (13:30): O Pedro tá com dor no ouvido desde ontem, 38 de febre. Tá brincando, comendo... / A tia Márcia, do 3º B, mandou ele pra casa de manhã. Ela é um anjo, aquela mulher.
- **d09_casa** (14:00): LÚCIA: Luan! O Liam não tá respirando direito, a bombinha acabou faz dias, eu não sei o que fazer! / [um silêncio estranho] / ZÉLIA: Lúcia, a boquinha dele tá ficando roxa. / LÚCIA: Mas pelo menos parou de chiar, né? Isso é bom, né?
- **d09_marcia** (14:00): Moça! Doutor! Minha mulher tá roxa, ela não consegue respirar! Foi uma abelha, lá no pé de manga, ela é alérgica, pelo amor de Deus! / [respiração com um assobio agudo; cachorro latindo] / MÁRCIA (rouca): Marcos... a garganta...
- **d09_bruna** (17:50): [...roxa...] / Eu não consigo respirar! Minha boca tá formigando, minhas mãos tão travando! / [respiração rápida e curta, choro, uma porta batendo]

</details>

## Dia 10: Ninguém é Bobo

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:15 | `d10_igreja` ★<br>"José da Silva" | Trote sofisticado (endereço de igreja) | — trote | Trote |  |  |  |  |  |
| 08:10 | `d10_riso` ★<br>Geralda Ferreira Lopes, 74 | AVC na janela (afasia e fraqueza à direita) | 🟥 vermelho | ⚖ USA ou USB |  | REG |  | 60/140 (USB) | avc |
| 09:00 | `d10_cida` ★<br>Aparecida (Dona Cida), 79 | Palpitação após susto (tentativa de golpe por telefone) | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 10:00 | `d10_pulso`<br>Bianca Alves, 16 | Lesão autoprovocada no punho, sangramento contido por compressão | 🟨 amarelo | ⚖ USB ou USA |  | UPA/REG |  | 100/260 (USB) | d10_compressao |
| 11:05 | `d10_onibus`<br>"Crianças do ônibus escolar" | Trote (falso acidente com ônibus escolar) | — trote | Trote |  |  |  |  |  |
| 12:20 | `d10_icc`<br>Osmar Carvalho, 78 | Insuficiência cardíaca descompensada (edema agudo de pulmão) | 🟥 vermelho | USA |  | REG |  | 50/120 |  |
| 13:35 | `d10_joelho`<br>Kevin Santos, 15 | Entorse de joelho sem sinais de gravidade | 🟩 verde | Orientação → UPA/UBS |  |  |  |  |  |
| 14:50 | `d10_telhado`<br>Jorge Mendes, 52 | Queda de altura com provável fratura de bacia | 🟨 amarelo | ⚖ USB ou USA |  | REG | altura, cabeca, historico | 110/300 (USB) |  |
| 16:15 | `d10_biel`<br>"Amigo que engoliu o controle" | Trote | — trote | Trote |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d10_igreja** (07:15): Bom dia. Meu pai tá infartando. Rua Bahia, 300, Centro. Por favor, mandem a UTI. / [silêncio absoluto do outro lado: nenhum barulho de casa, de gente, de nada]
- **d10_riso** (08:10): Alô? É da emergência? É que a minha mãe... [ri] desculpa... ela tá falando tudo errado. / [uma risada nervosa, curta, que ele tenta engolir] / Ela pediu "o feijão da janela". Que feijão da janela, mãe? [ri] Desculpa, doutor. Desculpa.
- **d10_cida** (09:00): Oi meu filho, é a Cida! Ó, você não vai acreditar. / Ligaram aqui em casa dizendo que era do banco. Um moço educadíssimo, sabia o meu nome, o meu CPF, tudo. Queria a senha do cartão "pra cancelar uma compra". / Eu desliguei na cara dele! Fiz certo, né? Mas fiquei com o coração na boca.
- **d10_pulso** (10:00): Minha filha cortou o pulso. Rua das Mangueiras, 916. / [a voz é baixa, sem pressa, quase sem cor] / Ela tá no banheiro. Eu tô com ela.
- **d10_onibus** (11:05): Alô, emergência? Um ônibus escolar bateu e tombou aqui na Rua Ipê, na frente da Escola Estadual. Tem muita criança machucada. / [carros passando devagar. Nenhum grito, nenhuma sirene, nenhum choro de criança]
- **d10_icc** (12:20): Alô, moço... doutor? É o meu marido, o Osmar. Ele tá com uma falta de ar que vem piorando faz uns dias. Hoje ele não tá conseguindo nem terminar a frase. / [respiração rápida, molhada, com um chiado grosso no fundo]
- **d10_joelho** (13:35): Boa tarde, aqui é o Anderson, professor de Educação Física da Escola Estadual. Um aluno torceu o joelho no vôlei. / O protocolo da escola é chamar a ambulância. A diretora pediu pra eu ligar.
- **d10_telhado** (14:50): Moço, o meu vizinho caiu do telhado! Tava trocando a caixa d’água e escorregou! / SEU JORGE: Ai, o quadril... não mexe... não mexe!
- **d10_biel** (16:15): Alô, emergência? Corre, o meu amigo engoliu o controle do videogame! Inteiro! Com pilha e tudo! / [risadas de dois ou três moleques; um grita "fala do fio!"] / E o fio! O fio tá pra fora! [risada]

</details>

## Dia 11: Febre

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:10 | `d11_olhos`<br>Patrícia Rocha, 26 | Dengue sem sinais de alarme | 🟩 verde | Orientação → UBS |  |  |  |  |  |
| 07:55 | `d11_manchas`<br>Cícero Nascimento, 34 | Dengue sem sinais de alarme (exantema) | 🟩 verde | Orientação → UBS |  |  |  |  |  |
| 08:45 | `d11_barriga`<br>Thiago Moreira, 28 | Dengue com sinais de alarme (dor abdominal e vômitos persistentes) | 🟨 amarelo | USB |  | UPA |  | 100/260 (USB) |  |
| 09:35 | `d11_neusa`<br>Neusa Andrade, 81 | Dengue sem sinais de alarme em idosa (avaliação na UBS no mesmo dia) | 🟩 verde | Orientação → UBS/UPA |  |  |  |  |  |
| 10:30 | `d11_atestado`<br>Rodrigo Lima, 23 | Dengue sem sinais de alarme | 🟩 verde | Orientação → UBS |  |  |  |  |  |
| 11:30 | `d11_desmaio`<br>Larissa Teixeira, 19 | Desmaio vasovagal na coleta de sangue (dengue sem alarme) | 🟩 verde | ⚖ Orientação ou USB → UBS/CASA |  | UPA |  |  |  |
| 12:40 | `d11_gestante`<br>Daniele Ramos, 24 | Febre (provável dengue) em gestante de 30 semanas | 🟨 amarelo | ⚖ USB ou Orientação → MAT |  | MAT |  | 120/300 (USB) |  |
| 14:00 | `d11_idoso`<br>Sebastião Gonçalves, 82 | Dengue com sinais de alarme em idoso (sonolência e confusão) | 🟨 amarelo | USB |  | REG |  | 90/240 (USB) |  |
| 16:30 | `d11_febre`<br>Enzo Martins, 6 | Febre na epidemia (provável dengue sem alarme) | 🟩 verde | Orientação → UBS |  |  |  |  |  |
| 18:20 | `d11_dengue_grave` ★<br>Yuri Santana, 15 | Dengue grave (choque com sangramento) | 🟥 vermelho | USA |  | REG |  | 50/120 | d11_choque |

<details><summary>Aberturas das ligações</summary>

- **d11_olhos** (07:10): Bom dia... desculpa, é que eu tô com febre de 39 desde ontem e uma dor atrás dos olhos que parece que vai estourar. É dengue, né? Metade do meu prédio tá com dengue.
- **d11_manchas** (07:55): Bom dia. Eu tô com dengue faz quatro dias, já fiz o exame. Hoje acordei cheio de mancha vermelha no corpo. E coça que é uma desgraça. Isso é normal?
- **d11_barriga** (08:45): Moço, meu filho tá com dengue faz quatro dias. Hoje a dor na barriga piorou muito, e ele vomita tudo que põe na boca. Até água.
- **d11_neusa** (09:35): Alô? É do pronto-socorro? Aqui é a Neusa. Tô com uma febrinha desde ontem, e uma moleza. Meu filho mora em São Paulo, não atende. Aí eu liguei pra vocês.
- **d11_atestado** (10:30): Doutor, eu tô morrendo. Dengue. Tô com o corpo moído, febre de 38 e meio. E o meu supervisor falou que sem atestado eu tô na rua. Manda uma ambulância, que lá no hospital eles me dão o papel.
- **d11_desmaio** (11:30): Alô, emergência? Aqui é do laboratório da XV. Uma moça que veio fazer exame de dengue desmaiou na cadeira de coleta! / [sala de espera cheia; alguém pede "dá um ar pra ela"]
- **d11_gestante** (12:40): Oi, desculpa ligar. Deve ser dengue, todo mundo aqui na rua tá com... mas a minha sogra mandou eu ligar porque eu tô grávida. Febre de 38 e meio desde ontem.
- **d11_idoso** (14:00): Alô, meu avô tá com dengue, o exame saiu ontem. Hoje ele tá esquisito. Me chamou pelo nome do meu pai. E dorme o tempo todo: a gente acorda e ele apaga de novo.
- **d11_febre** (16:30): Oi, meu filho de seis anos tá com febre de 38 e pouco desde ontem. Aqui na rua tá todo mundo com dengue. Eu fico com medo, né, por causa do que passa na televisão.
- **d11_dengue_grave** (18:20): Moço, o meu filho tá com dengue faz cinco dias. Ontem a febre passou, eu achei que ele tava melhorando... / ...mas agora o nariz sangrou e a gengiva tá sangrando. E ele levantou pra ir no banheiro e caiu. Ele tá gelado, moço.

</details>

## Dia 12: Do Outro Lado da Linha

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:20 | `d12_surto`<br>Wanderley Souza, 31 | Crise psicótica com agitação e risco para terceiros | 🟨 amarelo | ⚖ USB ou USA | PM | UPA/REG |  | 100/260 (USB) |  |
| 08:15 | `d12_cida` ★<br>Aparecida (Dona Cida), 79 | Ligação para dar notícias (pressão controlada) | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 09:10 | `d12_crise` ★<br>Caio Ribeiro, 20 | Crise emocional com risco (ideação suicida) | 🟨 amarelo | ⚖ USB ou USA |  | UPA/REG |  |  | acolhimento |
| 10:10 | `d12_cartelas`<br>Lucas Ferreira, 17 | Intoxicação medicamentosa intencional com rebaixamento de consciência | 🟥 vermelho | USA |  | REG |  | 50/120 | d12_intox |
| 11:05 | `d12_rosangela`<br>Rosângela | Ligação de agradecimento (sem emergência) | 🟦 azul | Orientação → CASA |  |  |  |  |  |
| 11:50 | `d12_marido`<br>Odila Prado, 80 | Crise de ansiedade (marido atrasado) | 🟩 verde | ⚖ Orientação ou USB → CASA/UBS |  | UPA |  |  |  |
| 13:00 | `d12_masseira`<br>Josué Pereira, 35 | Mão presa em masseira (esmagamento) com necessidade de desencarceramento | 🟨 amarelo | ⚖ USB ou USA | Bombeiros | REG |  | 100/260 (USB) |  |
| 14:10 | `d12_cocaina`<br>Vinícius Cardoso, 24 | Dor torácica após uso de cocaína (risco de infarto e arritmia) | 🟥 vermelho | USA |  | REG |  | 60/150 |  |
| 15:25 | `d12_trote`<br>"Primo mordido pela capivara" | Trote | — trote | Trote |  |  |  |  |  |
| 16:35 | `d12_soluco`<br>Nilton Barbosa, 67 | Soluço persistente sem sinais de gravidade | 🟩 verde | Orientação → UBS/UPA |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d12_surto** (07:20): Moço, tem um rapaz aqui na rua gritando e quebrando os vasos da calçada! É o Wanderley, filho da Dona Ivone. Ele tá dizendo que a televisão manda recado pra ele! / [gritos ao fundo: "SAI DE PERTO! ELES TÃO ESCUTANDO!"; um vaso estoura no chão]
- **d12_cida** (08:15): Oi meu filho, é a Cida! Tava na comadre, sabia? Fui sábado cedinho e voltei agora de manhã. / Você nem sentiu a minha falta, né? Ficou preocupado? [risada]
- **d12_crise** (09:10): Alô... é da emergência? Eu não sei se é aqui que liga. / [uma respiração longa, de quem está segurando o choro] / Eu não tô bem. Eu não tô machucado. Eu só... eu não tô conseguindo mais.
- **d12_cartelas** (10:10): Moço, pelo amor de Deus! O meu filho tomou várias cartelas de remédio! Faz meia hora! Ele tá dormindo, mole, eu chamo e ele mal responde!
- **d12_rosangela** (11:05): Oi... desculpa ligar aqui, eu sei que é pra emergência. Não é emergência. / Meu nome é Rosângela. Eu pedi uma pizza de calabresa pra vocês, semana passada. / [alguém mexe uma panela ao fundo; um rádio toca baixinho] / Eu só queria agradecer quem atendeu. Eu não sei quem foi. A moça do abrigo deixou eu ligar.
- **d12_marido** (11:50): Moço, desculpa... o meu marido, o Euclides, foi na missa das sete e ainda não voltou. Já é quase meio-dia. Ele tem 84 anos. E se caiu na rua? E se... / [ela respira curto, rápido]
- **d12_masseira** (13:00): Socorro! O meu padeiro prendeu a mão na masseira! A mão tá lá dentro, presa no gancho! Eu desliguei a máquina, desliguei! Mas a mão não sai de jeito nenhum! / [um homem grita de dor; outro tenta acalmar: "calma, Josué, calma"]
- **d12_cocaina** (14:10): Ô, moço, o meu amigo tá com uma dor no peito muito forte, o coração tá disparado, ele tá suando. A gente só bebeu, juro. Desde ontem, no baile. / [música alta de fundo, alguém abaixa; uma respiração rápida, ofegante]
- **d12_trote** (15:25): Alô, emergência! Uma capivara atacou o meu primo aqui no Parque de Exposições! Ela mordeu a bunda dele e saiu correndo! / [gargalhada abafada de duas pessoas; uma delas tenta parar e não consegue]
- **d12_soluco** (16:35): Boa tarde, doutor, desculpa inco- [hic] -modar. É que eu tô com esse soluço faz dois dias. Não para nem pra [hic] dormir.

</details>

## Dia 13: Produto de Limpeza

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:25 | `d13_soda` ★<br>Ana Clara Ribeiro, 3 | Ingestão de soda cáustica (criança de 3 anos) | 🟥 vermelho | USA |  | REG |  | 50/130 +20 c/ orientação | intoxicacao |
| 08:30 | `d13_cida` ★<br>Aparecida (Dona Cida), 79 | Inalação leve de vapor de produto de limpeza | 🟩 verde | Orientação → CASA/UBS |  |  |  |  |  |
| 09:30 | `d13_moeda`<br>Theo Marques, 4 | Moeda engolida, sem obstrução | 🟩 verde | Orientação → UPA |  |  |  |  |  |
| 10:30 | `d13_infarto`<br>Joaquim Batista Lopes, 68 | Infarto (reinfarto) | 🟥 vermelho | USA |  | REG |  | 60/150 |  |
| 11:40 | `d13_maionese`<br>Priscila Andrade, 32 | Gastroenterite (intoxicação alimentar) sem desidratação | 🟩 verde | Orientação → CASA/UBS/UPA |  |  |  |  |  |
| 13:00 | `d13_comprimidos` ★<br>Lorenzo Batista, 2 | Intoxicação por remédio de pressão (criança de 2 anos) | 🟥 vermelho | USA |  | REG |  | 50/120 +15 c/ orientação | intox_comprimido |
| 14:20 | `d13_cachorro`<br>Rubens Almeida, 64 | Mordida de cachorro superficial | 🟩 verde | Orientação → UPA/UBS |  |  |  |  |  |
| 15:30 | `d13_moto`<br>Renan Cardoso, 25 | Provável luxação de ombro (queda de moto) | 🟨 amarelo | USB |  | UPA/REG |  | 120/300 (USB) |  |
| 16:40 | `d13_trote`<br>"Irmão que bebeu soda" | Trote (crianças imitando a propaganda da TV) | — trote | Trote |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d13_soda** (07:25): Moço! Moço, minha filha bebeu soda cáustica! Eu tava limpando o forno, virei as costas e ela pegou o copinho! / [choro de criança pequena, engasgado, desesperado] / Eu vou enfiar o dedo na garganta dela pra ela vomitar, né? Fala que é pra fazer isso!
- **d13_cida** (08:30): Oi meu filho, é a Cida! Bom dia! Ó, eu fiz uma bobagem: misturei a água sanitária com aquele desinfetante de pinho pra limpar o banheiro e subiu um cheiro... ardeu o nariz, os olhos... / Mas já abri tudo e vim pra varanda. Liguei pra saber se eu morro, né? [risada]
- **d13_moeda** (09:30): Bom dia. Meu filho de quatro anos engoliu uma moeda de vinte e cinco centavos. Tá brincando normal... / MÃE: Fala que é grave, Anderson! Fala que é grave! / ...mas a mãe dele tá desesperada aqui.
- **d13_infarto** (10:30): Moço, é a Rosa. O Joaquim diz que tá infartando de novo. Todo mês ele acha que tá infartando, viu? Mas hoje... / Hoje ele tá suando que nem tampa de panela. / JOAQUIM: É igual à do meu infarto de antes, doutor. Igualzinha. Eu conheço essa dor.
- **d13_maionese** (11:40): Moço, manda ambulância que minha mulher tá morrendo de tanto vomitar! Desde ontem à noite! / Foi a maionese do aniversário da minha sobrinha, tenho certeza! Ficou no sol a festa inteira!
- **d13_comprimidos** (13:00): Doutor, desculpa... meu neto pegou a cartela do meu remédio de pressão. Eu deixei em cima da mesa, fui estender roupa... / [um menino pequeno resmungando, sonolento] / Mas ele tá bonzinho, brincando. Será que precisa mesmo de alguma coisa? Eu não quero fazer escândalo.
- **d13_cachorro** (14:20): Doutor, fui atacado por um cachorro! Me mordeu a perna! E se for raiva? Eu vi no jornal que raiva mata!
- **d13_moto** (15:30): Oi, um colega meu caiu de moto aqui na Santos Dumont! Ele tá sentado na calçada, consciente, mas o ombro dele tá esquisito, caído.
- **d13_trote** (16:40): Alô? É da emergência? Meu irmão bebeu soda cáustica! Um litro inteiro! Ele tá espumando pela boca igual sabão! / [risadinhas abafadas; alguém cochicha "fala do sabão, fala do sabão"]

</details>

## Dia 14: Carla

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:20 | `d14_cefaleia`<br>Gilberto Teixeira, 52 | Suspeita de hemorragia subaracnoide | 🟥 vermelho | USA |  | REG |  | 60/140 |  |
| 08:30 | `d14_carla` ★<br>"Cláudia Rezende", 44 | Ligação-teste da jornalista Carla Nunes | — trote | Trote |  |  |  |  |  |
| 09:40 | `d14_cida` ★<br>Aparecida (Dona Cida), 79 | Dúvida sobre chá e remédio (e saudade) | 🟦 azul | Orientação → UBS/CASA |  |  |  |  |  |
| 10:40 | `d14_idosa`<br>Tereza Gonçalves, 81 | Queda com longa permanência no chão (idosa confusa) | 🟨 amarelo | ⚖ USB ou USA |  | REG | anticoagulante, bateu_cabeca | 120/300 (USB) |  |
| 11:50 | `d14_queimadura`<br>Igor Fernandes, 22 | Queimadura de 2º grau no braço e na mão (óleo quente) | 🟨 amarelo | USB |  | UPA/REG |  | 120/300 (USB) |  |
| 13:00 | `d14_trote`<br>"Seu Benedito Silva" | Trote sofisticado (alunos ligando da escola) | — trote | Trote |  |  |  |  |  |
| 14:10 | `d14_preeclampsia` ★<br>Jaqueline Freitas, 24 | Pré-eclâmpsia grave (32 semanas) | 🟥 vermelho | USA |  | MAT |  | 50/120 |  |
| 15:20 | `d14_tosse`<br>Maria Eduarda Costa, 5 | Tosse viral sem sinais de alarme | 🟩 verde | Orientação → UBS/UPA |  |  |  |  |  |
| 16:30 | `d14_ciclista` ★<br>Wagner Dias, 34 | Hemorragia na coxa (atropelamento de ciclista) | 🟥 vermelho | USA |  | REG |  | 45/110 +15 c/ orientação | hemorragia |

<details><summary>Aberturas das ligações</summary>

- **d14_cefaleia** (07:20): Moço, meu marido tá com uma dor de cabeça que... ele disse que é a pior dor da vida dele. Ele nunca reclama de nada! / [um homem gemendo baixo; depois, alguém vomitando] / GILBERTO: Apaga essa luz, Sandra... pelo amor de Deus, apaga a luz...
- **d14_carla** (08:30): Bom dia. Eu tô com uma dor no peito, sabe? Do lado... esquerdo. / Queria saber: quanto tempo a ambulância leva pra chegar aqui no Centro? / [barulho de teclado, alguém digitando rápido]
- **d14_cida** (09:40): Oi meu filho, é a Cida! Bom dia! Ó, primeiro: e o Liam? Melhorou da asma, o menino? / A Zélia me contou que ele desenha ambulância. Eu fiquei com isso na cabeça a semana inteira.
- **d14_idosa** (10:40): Moço, cheguei agora na casa da minha mãe e ela tava caída no chão do quarto. Ela diz que caiu de madrugada! / Tá acordada, mas tá falando que hoje é domingo. Hoje é quarta!
- **d14_queimadura** (11:50): Doutor, o menino da fritura virou o tacho de óleo no braço! O braço inteiro, do cotovelo até a mão! / [um rapaz gritando; água correndo na pia] / Eu passei pasta de dente, que a minha mãe ensinava, mas ele tá gritando mais!
- **d14_trote** (13:00): Boa tarde. Meu avô caiu no quintal e não tá respondendo. Rua Ipê, 901, Jardim Norte. É uma casa amarela, de muro baixo. / [um sinal tocando ao longe; barulho de corredor]
- **d14_preeclampsia** (14:10): Oi... desculpa ligar. Eu tô grávida, e tô com uma dor de cabeça muito forte. Deve ser o calor, né? / É que a vista tá brilhando, tipo uns pontinhos de luz... e não passa.
- **d14_tosse** (15:20): Boa tarde. Minha filha tá tossindo há três dias, uma tosse de cachorro, de noite principalmente. Eu tô preocupada. / [tosse seca de criança; logo depois, uma risada]
- **d14_ciclista** (16:30): Um carro pegou o ciclista e fugiu! Aqui na Beira-Rio! Ele tá sangrando muito da perna, tá fazendo uma poça! / [gente gritando "aperta, aperta!"; uma bicicleta retorcida no asfalto]

</details>

## Dia 15: O Show

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:50 | `d15_fratura`<br>Ademar Fonseca, 74 | Fratura de antebraço (queda de escada) | 🟨 amarelo | USB |  | UPA |  | 120/300 (USB) |  |
| 09:15 | `d15_cida` ★<br>Aparecida (Dona Cida), 79 | Dor lombar mecânica (travou as costas) | 🟩 verde | Orientação → UBS/CASA |  |  |  |  |  |
| 11:10 | `d15_fila`<br>Camila Rodrigues, 19 | Desmaio por calor e jejum (recuperada) | 🟩 verde | ⚖ Orientação ou USB → UPA/CASA |  | UPA |  |  |  |
| 13:40 | `d15_insolacao`<br>Felipe Soares, 23 | Insolação grave (intermação) | 🟥 vermelho | USA |  | REG |  | 50/120 |  |
| 17:00 | `d15_mci` ★<br>Vítimas do tumulto no Parque de Exposições | Múltiplas vítimas | 🟥 vermelho | USA | PM | REG |  |  |  |
| 17:20 | `d15_infarto` ★<br>Ernesto Salles, 70 | Infarto | 🟥 vermelho | USA |  | REG |  | 60/150 |  |
| 17:35 | `d15_trote`<br>"Cem pessoas no shopping" | Trote oportunista | — trote | Trote |  |  |  |  |  |
| 17:50 | `d15_mae`<br>Vera Teodoro, 46 | Crise de ansiedade (o filho estava no show e está bem) | 🟩 verde | ⚖ Orientação ou USB → CASA |  | UPA |  |  | respiracao |
| 18:10 | `d15_bebado`<br>Motorista não identificado, 40 | Colisão em poste: motorista embriagado, trauma moderado | 🟨 amarelo | ⚖ USB ou USA | PM | REG |  | 110/280 (USB) |  |
| 18:30 | `d15_crianca`<br>Yasmin (5 anos), 5 | Criança perdida com escoriação leve no joelho | 🟩 verde | Orientação → CASA/UPA | PM |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d15_fratura** (07:50): Bom dia, doutor. Caí da escadinha arrumando a calha. O braço ficou meio torto, mas não é nada não. Queria saber se posso ir de bicicleta pro posto.
- **d15_cida** (09:15): Oi meu filho, é a Cida! Bom dia! Ó, varri o quintal inteiro e travou as costas. Fiquei torta igual um ponto de interrogação! [risada] / E hoje tem show no Parque, você vai? Eu ia, mas a Zélia disse que é muito empurra-empurra, que velha não tem que ir.
- **d15_fila** (11:10): Oi! Minha amiga desmaiou aqui na fila do show! A gente tá aqui desde as sete da manhã, no sol! / Ela já acordou, tá falando comigo, mas tá branca!
- **d15_insolacao** (13:40): Moço, meu primo tá passando mal aqui no estacionamento do Parque! Ele tá falando coisa com coisa, tá andando torto! / A gente bebeu umas, mas ele não é de ficar assim não!
- **d15_mci** (17:00): Central, aqui é o Sargento Rocha, da PM, no portão principal do Parque de Exposições. Caiu a grade da saída no fim do show e o povo passou por cima. / [multidão, gritos, apito, uma sirene da PM chegando] / Contando por alto, tenho umas quatorze vítimas no chão. Tem gente andando ferida, tem gente que não levanta. Preciso de tudo o que vocês tiverem!
- **d15_infarto** (17:20): Moço, o rádio tá falando do tumulto no show, eu sei que vocês tão ocupados... mas o meu marido tá com uma dor no peito que não passa. / ERNESTO: Não precisa, Dalva... deve ser o pastel da feira...
- **d15_trote** (17:35): Emergência?! Corre que tem outro tumulto no shopping! Tão pisoteando gente na escada rolante! Umas cem pessoas! / [música alta de carro, risadas, alguém grita "aumenta o som!"]
- **d15_mae** (17:50): Moço, o meu filho tava no show! Ele não atende o celular! Eu vi na TV a grade caindo... eu não consigo respirar, meu coração vai sair pela boca! / [respiração rápida, choro, a TV com o repórter falando do tumulto]
- **d15_bebado** (18:10): Moço, um carro saiu do estacionamento do show e enfiou no poste aqui na frente do meu bar! O motorista tá bêbado que nem um gambá! / MOTORISTA: Eu tô bem, caramba! Me dá a chave! Eu vou embora dirigindo!
- **d15_crianca** (18:30): Doutor, achei uma menininha chorando sozinha, perdeu a mãe no tumulto. Tá com o joelho ralado, sangrou um tiquinho. / Eu não posso sair daqui, tô com o carrinho. E tem muito homem estranho rodando, doutor. Ela não solta da minha mão.

</details>

## Dia 16: O Menino que Gritava Lobo

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:40 | `d16_biel_trote` ★<br>"Cachorro e jacaré" | Trote (o 9-8877 de sempre) | — trote | Trote |  |  |  |  |  |
| 08:50 | `d16_cida` ★<br>Aparecida (Dona Cida), 79 | Esquecimento isolado (sem urgência hoje) | 🟦 azul | Orientação → UBS/CASA |  |  |  |  |  |
| 09:50 | `d16_apendicite`<br>Rosimeire Campos, 40 | Provável apendicite | 🟨 amarelo | USB |  | REG |  | 120/300 (USB) |  |
| 10:40 | `d16_biel` ★<br>Jairo Bento Lima, 71 | Traumatismo craniano após queda no banheiro (rebaixamento de consciência) | 🟥 vermelho | USA |  | REG |  | 45/110 +15 c/ orientação | queda_banheiro |
| 12:00 | `d16_convulsao`<br>Sebastião "Tião" Moraes, 45 | Pós-crise convulsiva em epiléptico conhecido (sem o remédio) | 🟨 amarelo | USB |  | UPA/REG |  | 120/300 (USB) |  |
| 13:10 | `d16_trote`<br>"Equipe da USB 03" | Trote sofisticado (falso condutor da USB 03) | — trote | Trote |  |  |  |  |  |
| 14:30 | `d16_osvaldo` ★<br>Osvaldo Ribeiro Peixoto, 84 | Pneumonia com sepse | 🟥 vermelho | USA |  | REG |  | 60/150 |  |
| 15:40 | `d16_garganta`<br>Rodrigo Santos, 20 | Amigdalite sem sinais de obstrução | 🟩 verde | Orientação → UPA/UBS |  |  |  |  |  |
| 16:50 | `d16_laje`<br>Dirceu Pereira, 51 | Trauma grave (queda de 6 m): coluna e tórax | 🟥 vermelho | USA |  | REG |  | 45/110 +15 c/ orientação | queda_laje |

<details><summary>Aberturas das ligações</summary>

- **d16_biel_trote** (07:40): Alô, emergência? Corre! Tem um jacaré no laguinho da praça da Matriz comendo um cachorro! Já comeu a metade! / [risadas; alguém sussurra "fala do rabo, fala do rabo"]
- **d16_cida** (08:50): Oi meu filho, é a Cida! Bom dia! Viu ontem a novela? A... aquela... das seis, como é que chama mesmo? / [a TV ligada num programa de culinária] / Ai, tá na ponta da língua. Bom, você sabe qual é! A Marta foi embora de vez, meu filho!
- **d16_apendicite** (09:50): Moço, eu tô com uma dor do lado direito da barriga, embaixo que não me deixa nem ficar em pé. E febre.
- **d16_biel** (10:40): Moço... moço, meu vô caiu no banheiro e não acorda. Juro, juro que não é brincadeira. / [chuveiro aberto, a água batendo no chão; nenhuma risada] / Ele tava tomando banho e fez um barulho. Eu arrombei a porta. Ele tá no chão do box, a água caindo nele...
- **d16_convulsao** (12:00): Moço, um homem caiu aqui na feira e ficou se debatendo! Agora tá desacordado! Tá juntando gente! / [vozes em volta: "ele já fez isso antes", "é o Tião da banca de alho", "é epilepsia, gente"]
- **d16_trote** (13:10): Central, aqui é o Beto, condutor da USB 03! A gente bateu na Av. Norte, na frente do Posto Avenida! A Lia tá desacordada! / Tô ligando do meu celular porque o rádio quebrou. Manda uma USA, rápido!
- **d16_osvaldo** (14:30): Boa tarde, doutor. Aqui é o Osvaldo Peixoto. Desculpa incomodar num sábado... / É que eu tô com uma falta de ar desde ontem e uma febrinha. Não precisa mandar nada, não. Meu filho trabalha aí, eu não quero dar trabalho. / [tosse molhada; ele para pra respirar no meio das frases]
- **d16_garganta** (15:40): Doutor, eu não consigo engolir nem a saliva! A minha garganta tá fechando! Tá cheia de bolinha branca!
- **d16_laje** (16:50): Doutor, o mestre de obras caiu da laje! Do segundo andar, uns seis metros! Caiu de costas em cima do entulho! / Ele tá falando, mas tá dizendo que não sente as pernas!

</details>

## Dia 17: Água

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:10 | `d17_telhado`<br>Sebastião Souza, 71 | Infarto em idoso ilhado pela enchente | 🟥 vermelho | USA | Bombeiros | REG |  | 60/150 |  |
| 08:15 | `d17_cida` ★<br>Aparecida (Dona Cida), 79 | Casa alagando: idosa sozinha, sem lesão | 🟩 verde | ⚖ Orientação ou USB → CASA | Bombeiros | UPA |  |  |  |
| 09:10 | `d17_crianca`<br>Luan Cardoso, 7 | Parada por afogamento (criança) | 🟥 vermelho | USA | Bombeiros | REG |  | 30/75 +28 c/ orientação | rcp |
| 10:25 | `d17_choque`<br>Ednaldo Lopes, 42 | Parada cardíaca por choque elétrico em área alagada | 🟥 vermelho | USA | Bombeiros | REG |  | 30/75 +25 c/ orientação | agua |
| 11:35 | `d17_vidro`<br>Cleide Ramos, 38 | Corte profundo no pé (sangramento controlado) | 🟨 amarelo | USB |  | UPA |  | 120/300 (USB) |  |
| 13:00 | `d17_simone` ★<br>Simone Batista, 51 | Crise hipertensiva sintomática, sem déficit neurológico | 🟨 amarelo | USB |  | UPA | fast | 90/240 (USB) |  |
| 13:25 | `d17_trote`<br>"Ônibus no rio" | Trote aproveitando a enchente | — trote | Trote |  |  |  |  |  |
| 14:10 | `d17_insulina`<br>Hélio Moreira, 68 | Hiperglicemia sem insulina (perdida na enchente) | 🟨 amarelo | USB |  | UPA |  | 120/300 (USB) |  |
| 15:40 | `d17_muro`<br>Josué Fagundes, 61 | Vítima presa em desabamento, com choque hemorrágico | 🟥 vermelho | USA | Bombeiros | REG |  | 45/110 +15 c/ orientação | hemorragia |
| 17:20 | `d17_enxurrada`<br>Miguel, 4 | Engoliu água da enchente, sem sinais de afogamento | 🟩 verde | Orientação → UBS/CASA/UPA |  |  |  |  |  |

<details><summary>Aberturas das ligações</summary>

- **d17_telhado** (07:10): Alô! Alô! A gente tá em cima do telhado, a água subiu de madrugada! Eu, minha mulher, minhas duas filhas e o meu pai! / [vento forte; chuva batendo em telha; uma criança chorando perto do telefone] / E o meu pai tá com uma dor no peito desde que subiu a escada. A bateria tá em seis por cento, moço!
- **d17_cida** (08:15): Oi, meu filho, é a Cida. A água tá entrando em casa. / [chuva grossa no telhado; uma goteira estala dentro de uma panela; a TV chiando, fora do ar] / Tá vindo por baixo da porta da cozinha. Eu pus o pano de chão, pus o tapete, não adianta. / A água tá entrando em casa.
- **d17_crianca** (09:10): Socorro! O menino foi arrastado pela enxurrada, eu puxei ele do córrego, ele não acorda! / [chuva; gente gritando; uma mulher chorando alto: "LUAN! LUAN!"]
- **d17_choque** (10:25): Doutor! Meu marido foi mexer no quadro de luz e levou um choque, tá caído no chão da área, dentro da água! / [chuva; um zumbido elétrico; uma criança chorando] / ROSANA: Edinho! Edinho, fala comigo!
- **d17_vidro** (11:35): Moço, eu cortei o pé num vidro dentro da água, tá jorrando sangue! Eu vou morrer aqui! / [água batendo na parede; duas crianças chorando]
- **d17_simone** (13:00): [a cadeira da Simone arrasta no chão; o fone dela cai em cima da mesa] / SIMONE: Doutor... desculpa. Eu mesma abro a ficha, que é mais rápido. / SIMONE: Mulher, cinquenta e um anos. Dor de cabeça forte desde ontem, piorou agora. A vista tá embaçada. Hipertensa. Sem remédio faz três semanas. / [ela aperta as têmporas com as duas mãos] / SIMONE: Pode regular. Eu espero.
- **d17_trote** (13:25): Alô, emergência? Um ônibus caiu no rio na Av. Beira-Rio, perto da ponte do Parque! Tem umas trinta pessoas lá dentro! Eu tô vendo daqui, passei de carro agora! / [silêncio no fundo: nenhum barulho de chuva]
- **d17_insulina** (14:10): Boa tarde, doutor. Desculpa... é o Hélio, meu marido. A água desceu o morro e entrou pela garagem, derrubou a geladeira, a insulina dele foi embora na enxurrada. / Ele tá fraco, com uma sede que não passa.
- **d17_muro** (15:40): O muro do vizinho caiu! Pegou o Seu Josué pelas pernas, ele tá preso embaixo dos tijolos! / [chuva; gente gritando "não puxa, não puxa!"; um cachorro latindo] / Mas ele tá bem, tá conversando!
- **d17_enxurrada** (17:20): Oi, desculpa ligar por isso... meu filho caiu sentado na enxurrada brincando na porta e engoliu um golão daquela água suja. Isso faz mal?

</details>

## Dia 18: Escândalo

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:10 | `d18_desabafo` ★<br>Filha do Seu Nestor Gonçalves | Desabafo depois da matéria (não é emergência) | — trote | Trote |  |  |  |  |  |
| 08:05 | `d18_cida` ★<br>Aparecida (Dona Cida), 79 | Ligou para saber como você está | 🟦 azul | Orientação → CASA/UBS |  |  |  |  |  |
| 09:00 | `d18_aorta`<br>Roberto Nascimento, 55 | Dissecção de aorta | 🟥 vermelho | USA |  | REG |  | 60/150 |  |
| 10:00 | `d18_punho`<br>Celina Prado, 84 | Fratura de punho (queda da própria altura) | 🟨 amarelo | USB |  | UPA |  | 120/300 (USB) |  |
| 11:00 | `d18_trote`<br>"Homem na praça" | Trote inspirado na matéria | — trote | Trote |  |  |  |  |  |
| 12:10 | `d18_bebe`<br>Heitor (3 meses) | Infecção grave em lactente (suspeita de meningite) | 🟥 vermelho | USA |  | REG |  | 50/120 |  |
| 13:15 | `d18_colica`<br>Vinícius Prado, 29 | Cólica renal | 🟨 amarelo | USB |  | UPA |  | 120/320 (USB) |  |
| 14:20 | `d18_peixoto_teste` ★<br>"Paciente-teste" | Ligação-teste da coordenação | — trote | Trote |  |  |  |  |  |
| 15:30 | `d18_odete` ★<br>Odete Matos, 82 | Infarto atípico (idosa diabética) | 🟥 vermelho | USA |  | REG |  | 60/150 |  |
| 17:00 | `d18_moto`<br>Jonathan Alves, 26 | Fratura exposta de fêmur com choque hemorrágico | 🟥 vermelho | USA |  | REG |  | 45/110 +15 c/ orientação | hemorragia |

<details><summary>Aberturas das ligações</summary>

- **d18_desabafo** (07:10): É da emergência? Não é emergência. Eu liguei pra falar umas verdades. / Eu li a matéria. Meu pai morreu esperando vocês em 2022. Cinquenta e cinco minutos. Na calçada de casa, do lado do portão. / E vocês aí, sentadinhos no ar-condicionado, contando ambulância.
- **d18_cida** (08:05): Oi, meu filho, é a Cida! Eu li no jornal. Você tá bem? / Disseram que a central tá sem ambulância, que o povo espera... Você tá comendo direito, pelo menos?
- **d18_aorta** (09:00): Meu marido tá com uma dor nas costas que ele diz que tá rasgando, doutor! Ele tá gritando! / [um homem gemendo alto; um cachorro latindo sem parar] / CLÁUDIA: Calma, Beto, calma...
- **d18_punho** (10:00): Oi, bom dia. Minha vó escorregou no quintal, ainda tá com limo da chuva. Caiu com a mão no chão e o punho ficou torto, que nem um garfo. / [uma senhora gemendo baixinho: "ai, Bia, não mexe"]
- **d18_trote** (11:00): Alô? Emergência? Tem um cara caído ali na Praça da Matriz, manda a ambulância! Vamos ver se vocês demoram cinquenta minutos mesmo! / [risadas abafadas; alguém sussurra "grava, grava"]
- **d18_bebe** (12:10): Desculpa ligar... meu bebê tá molinho, não quer mamar desde a madrugada. Minha sogra disse que é dente nascendo, mas ele tá esquisito. / [um gemido fraco e ritmado, de bebê, a cada respiração]
- **d18_colica** (13:15): Doutor, eu tô morrendo! É uma dor do lado, aqui nas costas, que vem e vai, eu não paro quieto! / [alguém vomitando; passos de um lado pro outro]
- **d18_peixoto_teste** (14:20): Boa tarde. Eu estou com uma dor precordial em aperto, irradiando para o membro superior esquerdo. Início há vinte minutos. / [ao fundo, bem baixinho: um rádio chiando: "...USB 03, QRV na base Norte..."]
- **d18_odete** (15:30): ARLINDO: Doutor... aqui é o Arlindo. Arlindo Matos. Eu sei. Eu sei o que o senhor tá pensando. / ARLINDO: É a minha mãe de novo. Ela diz que não é nada. Mas ela tá esquisita. Ela nunca fica quieta assim. / [ao fundo, uma TV de notícias é desligada no meio de uma frase]
- **d18_moto** (17:00): Um motoboy bateu na traseira do ônibus aqui na Santos Dumont! Ele tá sentado, falando, mas a perna... / [buzinas; muita gente; alguém gritando "não tira o capacete dele!"]

</details>

## Dia 19: Dona Cida

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:10 | `d19_infarto`<br>Geraldo Amaral, 74 | Infarto agudo do miocárdio | 🟥 vermelho | USA |  | REG |  | 60/150 | vagazero |
| 08:05 | `d19_marimbondo`<br>Lucas Teixeira, 17 | Picada de marimbondo, reação local | 🟩 verde | Orientação → UBS/CASA |  |  |  |  |  |
| 09:00 | `d19_escada`<br>Cícero Almeida, 52 | Fratura de clavícula (queda de escada) | 🟨 amarelo | USB |  | UPA |  | 120/300 (USB) |  |
| 10:00 | `d19_parto`<br>Jaqueline Rocha, 31 | Trabalho de parto ativo (terceiro filho, bolsa rota) | 🟨 amarelo | ⚖ USB ou USA |  | MAT |  |  |  |
| 11:05 | `d19_trote`<br>"Homem no banheiro" | Trote | — trote | Trote |  |  |  |  |  |
| 12:40 | `d19_asma`<br>Ana Clara Mendes, 6 | Crise de asma grave (tórax silencioso) | 🟥 vermelho | USA |  | REG |  | 50/120 +15 c/ orientação | asma_crianca |
| 14:10 | `d19_dente`<br>Reginaldo Prado, 34 | Dor de dente, sem sinal de infecção grave | 🟩 verde | ⚖ Orientação ou USB → UBS/UPA |  | UPA |  |  |  |
| 16:05 | `d19_onibus`<br>Valter Nogueira, 54 | Hipoglicemia grave (motorista diabético) | 🟥 vermelho | ⚖ USA ou USB |  | REG |  | 50/120 (USB) |  |
| 18:30 | `d19_cida` ★<br>Aparecida (Dona Cida), 79 | AVC na janela (idosa sozinha) | 🟥 vermelho | ⚖ USA ou USB |  | REG |  | 60/140 (USB) | avc_cida |

<details><summary>Aberturas das ligações</summary>

- **d19_infarto** (07:10): Bom dia, doutor. O Geraldo acordou com um aperto no peito e não passa. Ele não queria que eu ligasse. / [um rádio AM dando a previsão do tempo; uma colher batendo em xícara]
- **d19_marimbondo** (08:05): Bom dia. Meu filho foi picado por um marimbondo no dedo limpando a calha. Inchou o dedo todo! Dizem que picada mata, é verdade? / [um adolescente reclamando ao fundo: "Mãe, para, tá tudo bem"]
- **d19_escada** (09:00): O Cícero caiu da escada aqui na obra! Uns dois metros. Caiu em pé e depois de lado, em cima do ombro. / [uma betoneira girando vazia; alguém desliga]
- **d19_parto** (10:00): Minha irmã tá em trabalho de parto! A bolsa estourou faz uma hora, as dores tão vindo de três em três minutos! / [gemidos ritmados; uma criança pequena perguntando "a mamãe vai buscar o neném?"]
- **d19_trote** (11:05): Alô, tem um cara desmaiado no banheiro do Shopping Aurora, segundo andar. Tá caído no chão, todo branco. / [fundo silencioso, sem música nem movimento de shopping; um clique de controle de videogame]
- **d19_asma** (12:40): Moço, a minha neta tá com asma, ela não consegue falar! / [uma respiração curta, quase sem som; um ventilador girando] / Mas olha, parou de chiar agora. Melhorou, né?
- **d19_dente** (14:10): Doutor, aqui é o Reginaldo! Lembra de mim? O do dente! O mesmo dente, doutor. Eu tô morrendo de novo!
- **d19_onibus** (16:05): O motorista parou o ônibus no ponto da Rodoviária e tá passando mal! Tá suando, tremendo, falando enrolado! / [passageiros reclamando; um pisca-alerta tiquetaqueando]
- **d19_cida** (18:30): Oi... meu filho... é a... Cida. / [uma pausa longa; ao fundo, a novela das seis passando na TV] / O braço tá... bobo. Não é nada não. / Só queria ouvir... uma voz.

</details>

## Dia 20: Último Plantão

| Hora | Ligação | Diagnóstico (verdade) | Gravidade | Decisão correta | Apoio | Destino | Perguntas obrigatórias | Risco (bom/ruim) | Orientação |
|---|---|---|---|---|---|---|---|---|---|
| 07:15 | `d20_antonio` ★<br>Antônio Ferreira, 58 | Agradecimento (não é emergência) | 🟦 azul | Orientação → CASA |  |  |  |  |  |
| 07:15 | `d20_viuva` ★<br>Rosa Ferreira, 56 | Ligação da viúva (não é emergência) | 🟦 azul | Orientação → CASA |  |  |  |  |  |
| 08:10 | `d20_faca`<br>Rapaz não identificado, 30 | Ferimento por faca no abdome, com choque | 🟥 vermelho | USA | PM | REG |  | 45/110 +15 c/ orientação | hemorragia |
| 09:10 | `d20_trote`<br>"Vítima de atropelamento" | Trote sofisticado (falso policial) | — trote | Trote |  |  |  |  |  |
| 10:10 | `d20_cordao`<br>Débora Lopes (38 semanas), 24 | Prolapso de cordão umbilical | 🟥 vermelho | USA |  | MAT |  | 50/120 +25 c/ orientação | prolapso |
| 11:15 | `d20_intox`<br>Gustavo, 2 | Intoxicação por calmante de adulto (criança) | 🟥 vermelho | USA |  | REG |  | 50/120 +15 c/ orientação | intox_remedio |
| 12:30 | `d20_dengue`<br>Vagner Ribeiro, 41 | Dengue com sinais de alarme | 🟨 amarelo | USB |  | UPA |  | 90/240 (USB) |  |
| 13:40 | `d20_feijao`<br>Maria Luísa, 4 | Corpo estranho no nariz (feijão), sem obstrução | 🟩 verde | Orientação → UPA |  |  |  |  |  |
| 14:50 | `d20_queda`<br>Arnaldo Pimentel, 81 | Trauma de crânio leve em idoso anticoagulado | 🟨 amarelo | ⚖ USB ou USA |  | REG | historico, vomito |  |  |
| 16:10 | `d20_trote2`<br>"Gato-morcego" | Trote infantil | — trote | Trote |  |  |  |  |  |
| 17:15 | `d20_edema`<br>Alcides Duarte, 78 | Edema agudo de pulmão (insuficiência cardíaca) | 🟥 vermelho | USA |  | REG |  | 50/120 |  |
| 18:58 | `d20_final` ★<br>Henrique Lacerda, 43 | Parada cardiorrespiratória | 🟥 vermelho | USA |  | REG |  | 30/75 +28 c/ orientação | rcp |
| 18:58 | `d20_final_rua` ★<br>Seu Dito (gari), 61 | Parada cardiorrespiratória | 🟥 vermelho | USA |  | REG |  | 30/75 +30 c/ orientação | rcp |

<details><summary>Aberturas das ligações</summary>

- **d20_antonio** (07:15): Bom dia, doutor. Desculpa incomodar. Não é emergência, não. / É que eu descobri o seu nome com o pessoal da ambulância. Sou o Antônio, do dia três. Da queimação que não era o feijão. / Só queria agradecer. A Rosa, minha mulher, falou que eu tinha que ligar. Dessa vez eu obedeci de primeira.
- **d20_viuva** (07:15): Bom dia. Não é emergência. Desculpa ocupar a linha. / Eu sou a Rosa, esposa do Antônio. Antônio Ferreira, da São João, do lado do campinho. Ele ligou pra vocês no dia três. / Eu li a matéria da moça do jornal, que diz que do outro lado do telefone tem gente. Aí eu quis ligar.
- **d20_faca** (08:10): Esfaquearam um rapaz aqui no meu bar! Tá sangrando muito da barriga! / [gritos; uma garrafa quebrando; alguém: "solta isso, Zezinho!"]
- **d20_trote** (09:10): Central, aqui é o sargento Oliveira, da PM, câmbio. Atropelamento na Sete de Setembro, 4650. Vítima inconsciente. Solicito USA, QSL, QAP, positivo e operante. / [uma sirene que se repete igualzinha, como gravação em loop]
- **d20_cordao** (10:10): A bolsa da minha mulher estourou e saiu um cordão! Tá pendurado pra fora! O bebê não saiu ainda! / [uma mulher gemendo; um homem respirando muito rápido perto do telefone]
- **d20_intox** (11:15): Meu filho comeu os comprimidos de dormir da minha mãe! Achou a cartela na bolsa dela, achou que era bala! / [desenho animado alto na TV]
- **d20_dengue** (12:30): Oi... eu tô com dengue faz quatro dias. A febre até baixou, mas agora tô com uma dor na barriga que não deixa eu ficar em pé.
- **d20_feijao** (13:40): Oi, desculpa... a minha filha enfiou um feijão no nariz. Um feijão cru. Bem lá dentro. Isso é perigoso? / [uma criança fungando, depois rindo]
- **d20_queda** (14:50): Meu pai caiu no banheiro. Ele tá acordado, sentado no chão, mas bateu a cabeça na pia. / [um senhor reclamando: "eu tô bem, Marli, me levanta"]
- **d20_trote2** (16:10): Alô, é da ambulância? O meu gato subiu na antena e virou um morcego! Manda os bombeiro com a escada! / [risadas de várias crianças]
- **d20_edema** (17:15): O Alcides não consegue deitar, doutor! Se deita, afoga. Tá sentado na beira da cama desde ontem. / [uma respiração borbulhante, molhada]
- **d20_final** (18:58): Alô? É da emergência? O doutor do apartamento 302 tá caído, não respira... ele trabalha aí com vocês, não trabalha? / [uma porta batendo; um cachorro latindo no corredor; longe, uma TV num jogo de futebol] / A porta tava aberta. Ele tá no chão da sala, do lado do sofá. Tem garrafa no chão, doutor.
- **d20_final_rua** (18:58): Moço! Um homem caiu aqui na frente da loja, no ponto de ônibus! Ele não tá respirando! / [buzinas; muita gente; uma mulher gritando "é o gari! Ele varre aqui todo dia!"] / Eu já comecei a massagem! Do jeito que vocês ensinaram aquela vez!

</details>

## Roteiros de orientação por telefone

Cada passo mostra a fala de quem liga e as opções do jogador. ✅ = conduta que o jogo considera certa; ❌ = errada (aumenta o pânico ou piora a qualidade); 🤝 = acalma.

### RCP guiada por telefone (`rcp`, rcp)

*Mãos entrelaçadas no centro do peito, braços esticados. Afunde 5 a 6 cm (criança: cerca de 5 cm, com uma ou duas mãos; bebê com menos de 1 ano: dois dedos, cerca de 4 cm) e deixe o peito voltar todo. Aperte ESPAÇO (ou clique) a cada batida: 100 a 120 por minuto, sem pausas longas (menos de 10 segundos). Quando quem liga cansar (a cada 2 minutos, mais ou menos), mande trocar. Não pare até a equipe assumir.*
- Metrônomo: 100–120 compressões por minuto; troca de quem comprime a cada 12 s de jogo.
- Sucesso: Você manteve o ritmo até a equipe assumir.
- Falha: O ritmo se perdeu. A massagem foi fraca.

### Respiração guiada (`respiracao`, respiracao)

*Segure ESPAÇO (ou o botão) enquanto ela puxa o ar em 4 tempos; solte para soltar o ar em 4 tempos. Acompanhe o círculo.*
- Sucesso: A respiração dela desacelerou. O formigamento passou.
- Falha: Ela continua ofegante, mas está um pouco melhor.

### Múltiplas vítimas (`multiplas`, multiplas)

*Arraste cada vítima para a cor certa (START) e aloque as viaturas.*
- Sucesso: Triagem concluída.
- Falha: A triagem falhou.

### Desengasgo guiado (`desengasgo`, dialogo)

*Guie a manobra passo a passo. Instruções erradas aumentam o pânico de quem liga.*
1. **Quem liga:** Ele tá com a mão no pescoço, não sai som nenhum, tá vermelho!
   - ✅ Pergunte: "você está engasgado?". Se não consegue tossir nem falar, vamos agir.
   - ❌ Dá um copo d’água pra ele. → *Ele não consegue engolir nada!*
   - 🤝 Calma. Faz exatamente o que eu disser.
2. **Quem liga:** Ele balança a cabeça, não tosse!
   - ✅ Fique atrás dele e abrace pela cintura.
   - ❌ Enfia o dedo na garganta pra puxar. → *Empurrou mais pra dentro, {dr}!*
   - ❌ Deita ele no chão e espera a ambulância.
3. **Quem liga:** Tô atrás dele, abraçado!
   - ✅ Mão fechada acima do umbigo, a outra por cima. Puxe para dentro e para cima, com força.
   - ❌ Aperte o peito dele com as duas mãos.
   - ❌ Espera um pouco pra ver se passa sozinho. → *Ele tá ficando roxo, {dr}! Não dá pra esperar!*
4. **Quem liga:** Fiz! Fiz de novo! ...SAIU! Saiu um pedaço de carne! Ele tá tossindo!
   - ✅ Ótimo. Deixe ele sentado, respirando. A equipe vai examinar.
   - ❌ Dá água agora pra descer o resto.
- Sucesso: A via aérea foi desobstruída por telefone.
- Falha: A manobra não saiu como devia.

### Desengasgo guiado (`desengasgo_rcp`, dialogo)

*Guie a manobra. Fique atento: se a vítima perder a consciência, a conduta muda na hora.*
1. **Quem liga:** Meu pai tá engasgado com carne! Ele não fala, tá roxo!
   - ✅ Se ele não consegue tossir nem falar: fique atrás dele e abrace pela cintura.
   - ❌ Bate nas costas dele com ele deitado.
   - 🤝 Calma. Eu vou te guiar.
2. **Quem liga:** Tô atrás dele!
   - ✅ Mão fechada acima do umbigo, a outra por cima. Para dentro e para cima, com força.
   - ❌ Tenta puxar com o dedo. → *Não alcança, e parece que empurrei mais pra dentro!*
   - ❌ Aperta o peito.
3. **Quem liga:** Não sai! Já fiz três vezes!
   - ✅ Continue, com força, até sair ou até ele desmaiar.
   - ❌ Para, você vai machucar ele.
   - 🤝 Respira. Você está fazendo certo.
4. **Quem liga:** {DR}! ELE AMOLECEU! CAIU! NÃO TÁ RESPIRANDO!
   - ✅ Deite ele no chão de barriga pra cima. Massagem no peito AGORA. A cada rodada, olhe a boca: tire só o que estiver à vista, nunca às cegas.
   - ❌ Levanta ele e continua apertando a barriga! → *Ele não fica em pé!*
   - ❌ Joga água no rosto dele.
- Sucesso: Você trocou a conduta a tempo.
- Falha: Insistir na manobra com a vítima desacordada custou minutos preciosos.

### Parto guiado por telefone (`parto`, dialogo)

*Alterne instruções técnicas e falas de calma. Se o pânico estourar, ele larga o telefone.*
1. **Quem liga:** Ela tá gritando que vai nascer! O que eu faço?!
   - ✅ Deite ela de costas, joelhos dobrados e afastados, num lugar limpo. Separe toalhas e um cobertor limpos para o bebê.
   - ❌ Põe ela no carro e corre pra maternidade! → *Ela não consegue nem levantar!*
   - 🤝 Respira comigo. Você vai conseguir, eu fico na linha até a equipe chegar.
2. **Quem liga:** Tô vendo a cabeça! Tá saindo!
   - ✅ Não puxe. Deixe nascer devagar e só apoie a cabecinha com a mão, sem forçar.
   - ❌ Puxa a cabeça pra ajudar.
   - 🤝 Você está indo muito bem. Mãos lavadas, calma.
3. **Quem liga:** Saiu! Saiu inteiro! Tá molhadinho, meio roxinho!
   - ✅ Seque o corpo e a cabecinha com uma toalha limpa e tire a toalha molhada de perto dele.
   - ❌ Vira ele de cabeça pra baixo e bate no bumbum.
   - ❌ Corta o cordão agora com a tesoura.
4. **Quem liga:** ...CHOROU! Ele chorou forte!
   - ✅ Coloque o bebê de lado na barriga da mãe, pele com pele, e cubra os dois com um pano seco, inclusive a cabecinha (menos o rosto). Janelas fechadas, sem ventilador.
   - ❌ Dá um banho nele agora.
   - 🤝 Parabéns. Respira. Ainda falta pouco.
5. **Quem liga:** E esse cordão, {dr}? Puxo?
   - ✅ Não puxe o cordão e não corte: a equipe cuida disso. Se a placenta sair, guarde num saco plástico para levar.
   - ❌ Puxa devagar pra placenta sair.
   - ❌ Amarra com linha e corta.
- Sucesso: Mãe e bebê bem até a chegada da equipe.
- Falha: O pânico tomou conta, mas o bebê nasceu.

### Compressão guiada (`hemorragia`, dialogo)

*Oriente compressão direta. Nunca mande retirar o pano encharcado. Torniquete só em braço ou perna, quando a compressão não segurar, e nunca com cinto fino ou fio.*
1. **Quem liga:** É sangue pra todo lado!
   - ✅ Pegue um pano limpo e aperte forte em cima do corte.
   - ❌ Lava com água corrente pra ver o tamanho.
   - 🤝 Calma. Eu vou te dizer exatamente o que fazer.
2. **Quem liga:** O pano encharcou!
   - ✅ Não tire o pano. Coloque outro por cima e continue apertando.
   - ❌ Tira esse e põe um seco. → *Voltou a jorrar!*
   - ❌ Passa pó de café pra estancar.
3. **Quem liga:** Diminuiu... ele tá branco, tonto.
   - ✅ Deite ele e mantenha a pressão. Cubra com um cobertor. Se não houver fratura, levante as pernas.
   - ❌ Dá um copo de água com açúcar.
   - ❌ Faz um torniquete bem apertado com o cinto. → *Apertei o cinto, mas ficou frouxo e voltou a sangrar mais, {dr}!*
4. **Quem liga:** Ele tá falando comigo ainda.
   - ✅ Ótimo. Continue apertando e conversando com ele até a equipe chegar.
   - ❌ Deixa ele dormir um pouco.
   - 🤝 Você está salvando ele.
- Sucesso: O sangramento ficou controlado.
- Falha: A compressão foi interrompida. Perdeu-se sangue.

### Acolhimento (`acolhimento`, dialogo)

*Escute. Não apresse, não julgue, não minimize. O relógio anda mais devagar e esta ligação não vai cair.*
> Cartão exibido: CVV — Centro de Valorização da Vida · ligue 188 (24h, gratuito) · cvv.org.br. Em emergência médica, ligue para o serviço de emergência da sua cidade.
1. **Quem liga:** Eu nem sei por que eu liguei. Eu não aguento mais.
   - ✅ Que bom que você ligou. Eu estou aqui e vou ficar na linha com você.
   - ❌ Tenho outras ligações. Pode ser rápido? → *...Desculpa. Desculpa incomodar.*
   - ❌ Não fala assim, você é jovem, tem a vida inteira. → *Todo mundo fala isso.*
2. **Quem liga:** Ninguém ia nem perceber se eu sumisse.
   - ✅ Eu estou percebendo. Me conta o que está acontecendo.
   - ❌ Para de drama, vai. → *[silêncio longo]*
   - ❌ Pensa na sua família. → *Eles nem sabem.*
3. **Quem liga:** Tá tudo pesado demais. Faz dias que eu não durmo.
   - ✅ Parece que você está carregando muita coisa sem apoio. Faz sentido estar no limite. Posso perguntar: você tem pensado em se machucar ou em se matar?
   - ❌ Toma um chá e tenta dormir, que passa.
   - 🤝 Respira comigo um pouco. Sem pressa.
4. **Quem liga:** Eu tô sem ninguém aqui em casa.
   - ✅ Tem alguém de confiança que pode vir ficar com você? Uma equipe também está indo até aí.
   - ❌ Então eu desligo e a ambulância resolve. → *Não desliga... por favor.*
   - 🤝 Eu continuo aqui. Não vou a lugar nenhum.
5. **Quem liga:** ...Minha irmã. Ela mora aqui perto.
   - ✅ Vamos chamar ela juntos? E eu fico com você até a equipe chegar.
   - ❌ Por que não ligou pra ela em vez da emergência?
   - · Tá bom.
6. **Quem liga:** Tá. Eu fico na linha.
   - ✅ {m:Obrigado|Obrigada} por confiar em mim. Você não precisa passar por isso sem ninguém.
   - · Ok. Aguarde.
- Sucesso: A equipe chegou e a irmã também. Você ficou na linha o tempo todo.
- Falha: A equipe chegou. A ligação foi dura, mas não caiu.

### Orientação: intoxicação (`intoxicacao`, dialogo)

*Orientação imediata enquanto a viatura se desloca.*
1. **Quem liga:** Ele engoliu! Tá chorando, babando muito!
   - ✅ Não provoque vômito. Não dê nada para ele beber agora.
   - ❌ Enfia o dedo na garganta pra ele vomitar! → *Ele vomitou e gritou de dor!*
   - 🤝 Calma. Eu vou te ajudar até a ambulância chegar.
2. **Quem liga:** A boquinha tá vermelha, ele não para de babar.
   - ✅ Mantenha ele sentado. Se vomitar sozinho, vire de lado.
   - ❌ Lava a boca e faz ele engolir bastante água.
   - ❌ Deita ele de barriga pra cima. → *Ele engasgou com a baba, {dr}!*
3. **Quem liga:** Tô com a embalagem aqui na mão.
   - ✅ Guarde e entregue para a equipe. Me diga se a respiração mudar.
   - ❌ Joga fora, não precisa.
   - 🤝 Você está indo bem.
4. **Quem liga:** Ele tá respirando, tá chorando.
   - ✅ Chorar é bom sinal: está respirando. A equipe está chegando.
   - ❌ Dá um calmante pra ele dormir.
- Sucesso: Nada de vômito provocado, embalagem guardada, equipe recebida.
- Falha: Houve erro na orientação. A lesão pode ter piorado.

### Orientação: reação alérgica grave (`anafilaxia`, dialogo)

*Cada minuto conta. Afaste a causa, deite com as pernas para cima e, se ela tiver a caneta de adrenalina, use logo.*
1. **Quem liga:** A boca dela tá inchando, a garganta fechando!
   - ✅ Afaste o que causou a reação. Se ela tiver caneta de adrenalina receitada, aplique agora, na coxa, por cima da roupa se precisar.
   - ❌ Senta ela e manda respirar fundo. → *Ela quase desmaiou sentada!*
   - ❌ Dá um antialérgico de comprimido e espera. → *Ela não consegue engolir!*
2. **Quem liga:** Fiz o que você mandou! E agora?
   - ✅ Se usou a caneta, segure o tempo que ela manda (3 a 10 segundos) e anote a hora. Deite ela de costas.
   - · Agora é esperar.
   - 🤝 Você foi rápido. Muito bem.
3. **Quem liga:** Ela tá ficando mole, quer sentar...
   - ✅ Deixe deitada, com as pernas para cima. Não deixe sentar nem levantar de repente. Se faltar ar, levante só um pouco o tronco.
   - ❌ Faz ela andar pra não apagar.
   - ❌ Dá água pra ela.
4. **Quem liga:** Ela tá respirando... um pouco melhor.
   - ✅ Não dê nada pela boca. Fique do lado dela, a equipe está chegando.
   - ❌ Ótimo, então cancela a ambulância.
- Sucesso: O quadro foi mantido sob controle até a equipe chegar.
- Falha: A demora em agir piorou o quadro.

### Orientação: crise de asma (`asma`, dialogo)

*Quem está do outro lado é a sua família. A sua voz influencia o pânico dela.*
1. **{CONJ}:** Ele tá puxando o ar com força, {nome}!
   - ✅ Deixe ele sentado, inclinado pra frente. Não deite ele.
   - ❌ Deita ele na cama pra descansar.
   - 🤝 {c:Lú|Alex}, eu tô aqui. Fala comigo devagar.
2. **{CONJ}:** Afrouxei a camiseta. E a bombinha?
   - ✅ Repita a bombinha com o espaçador, como o médico ensinou.
   - ❌ Dá um xarope de tosse.
   - ❌ Espera passar.
3. **{CONJ}:** Ele tá chorando, com medo...
   - ✅ Fala pra ele: "o ar entra pelo nariz, sai devagar pela boca". Fica perto dele.
   - ❌ Fala pra ele parar de chorar.
   - 🤝 Ele vai ficar bem. A ambulância tá indo.
4. **{CONJ}:** Tô ouvindo a sirene!
   - ✅ Pegue a bombinha, o espaçador e a receita pra equipe.
   - ❌ Sai correndo com ele pra rua.
- Sucesso: Ele chegou à equipe sentado, respirando com a bombinha.
- Falha: O pânico atrapalhou, mas a equipe chegou.

### Orientação: crise grave (`asma_grave`, dialogo)

*Sem bombinha. Ganhe tempo até a equipe chegar.*
1. **{CONJ}:** Ele tá com o olho pesado, {nome}! A boquinha roxa!
   - ✅ Sente ele, inclinado pra frente, roupa frouxa. Não deite.
   - ❌ Deixa ele dormir, ele tá cansado. → *Mas ele tá apagando!*
   - 🤝 {c:Lú|Alex}. Olha pra mim. Eu tô aqui.
2. **ZÉLIA:** {Filho}, abri a janela. O que mais?
   - ✅ Mãe, fala com ele, mantém ele acordado. Conta as respirações.
   - ❌ Faz um chá de alho.
   - ❌ Leva ele pro chuveiro quente.
3. **{CONJ}:** Ele parou de chiar... isso é bom, né?
   - ✅ Não, {c:Lú|Alex}. Isso é grave. Não deixa ele dormir, a equipe tá chegando.
   - ❌ É, deve estar melhorando. → *Então... eu espero?*
   - 🤝 Respira. Faz o que eu falar.
4. **{CONJ}:** Chegaram! Chegaram!
   - ✅ Abre a porta e entrega ele pra eles.
- Sucesso: A equipe recebeu o Liam acordado.
- Falha: Foi por pouco.

### Orientação: convulsão (`convulsao`, dialogo)

*Proteja a vítima e marque o tempo.*
1. **Quem liga:** Ela tá se debatendo toda no chão!
   - ✅ Afaste tudo em volta e proteja a cabeça dela com algo macio.
   - ❌ Segura a língua dela pra não enrolar! → *Ela mordeu meu dedo!*
   - ❌ Segura os braços com força.
2. **Quem liga:** Não para! Já faz um tempão!
   - ✅ Não coloque nada na boca. Olhe o relógio: quanto tempo?
   - ❌ Joga água fria nela.
   - 🤝 Eu tô com você. Fica do lado dela.
3. **Quem liga:** Parou... ela tá roncando, mole.
   - ✅ Vire ela de lado e deixe a boca para baixo.
   - ❌ Dá água com açúcar.
   - ❌ Sacode ela pra acordar.
- Sucesso: A vítima foi protegida até a equipe chegar.
- Falha: A orientação teve falhas.

### Orientação: trauma na via (`trauma`, dialogo)

*Não mexer na vítima. Sinalizar. Proteger a via aérea se vomitar.*
1. **Quem liga:** Ele tá no chão, de capacete, sangue no ouvido!
   - ✅ Não tire o capacete e não mexa nele. Peça para sinalizarem a pista.
   - ❌ Tira o capacete pra ele respirar.
   - ❌ Leva ele pra calçada.
2. **Quem liga:** Ele vomitou! Tá engasgando!
   - ✅ Virem ele de lado todos juntos, em bloco: cabeça, ombro e quadril de uma vez.
   - ❌ Sacode ele pra acordar.
   - ❌ Deixa como está. → *Ele tá afogando no vômito!*
3. **Quem liga:** Viramos. Tá respirando, fazendo barulho.
   - ✅ Mantenha assim e não deixe ninguém mexer. A USA está chegando.
   - ❌ Dá água pra ele.
- Sucesso: A vítima foi mantida imóvel e respirando.
- Falha: Mexeram na vítima mais do que deviam.

### Orientação: hipoglicemia (`hipoglicemia`, dialogo)

*Quem está do outro lado é uma criança. Fale simples.*
1. **CRIANÇA:** {m:Moço|Moça}... ela não acorda...
   - ✅ Você está sendo muito valente. Não dá nada pra ela comer ou beber, tá?
   - ❌ Coloca açúcar na boca dela. → *Ela não engole, {m:moço|moça}...*
   - 🤝 Eu tô aqui com você. Qual é o seu nome?
2. **CRIANÇA:** Ela tá deitada de costas...
   - ✅ Empurra ela devagarinho pra ficar de lado, com o rosto virado.
   - ❌ Sacode ela bem forte.
   - 🤝 Fica pertinho dela.
3. **CRIANÇA:** A porta tá trancada...
   - ✅ Você alcança a chave? Destranca a porta pro pessoal da ambulância entrar.
   - ❌ Sai na rua e espera a ambulância lá fora.
- Sucesso: A criança destrancou a porta e ficou na linha até a equipe entrar.
- Falha: A equipe teve dificuldade para entrar.

### Orientação: suspeita de AVC (`avc`, dialogo)

*Tempo é cérebro. Proteja a via aérea e anote a hora.*
1. **Quem liga:** Ele tá com a boca torta, o braço caído...
   - ✅ Anote a hora em que ele foi visto bem pela última vez.
   - ❌ Dá um remédio de pressão pra ele.
   - 🤝 A ambulância já está a caminho.
2. **Quem liga:** Ele quer água...
   - ✅ Não dê nada pela boca: ele pode engasgar.
   - ❌ Dá um pouquinho só.
3. **Quem liga:** Ele vomitou!
   - ✅ Vire de lado e separe os remédios que ele toma para a equipe.
   - ❌ Senta ele na cadeira.
- Sucesso: Hora anotada e via aérea protegida.
- Falha: Houve erro na orientação.

### Orientação: área alagada (`agua`, dialogo)

*Segurança de quem ajuda primeiro. Os Bombeiros estão a caminho.*
1. **Quem liga:** Ele levou choque, tá caído na água!
   - ✅ Não toque nele nem na água. Desligue a chave geral, se puder fazer isso sem entrar na água.
   - ❌ Puxa ele pelo braço rápido! → *Meu irmão levou choque também!*
   - 🤝 Calma. Primeiro a sua segurança.
2. **Quem liga:** Desliguei! Tirei ele! Não respira!
   - ✅ Deite ele de barriga pra cima em lugar seco. Vamos começar a massagem.
   - ❌ Espera os bombeiros.
- Sucesso: Ninguém mais se feriu e a RCP começou cedo.
- Falha: O resgate improvisado complicou tudo.

### Negociação: vaga zero (`vagazero`, dialogo)

*O plantonista do Regional está sem leito. Argumente com fatos clínicos.*
1. **PLANTONISTA:** {Dr}, não tem vaga. Tem paciente no corredor. Manda pra UPA.
   - ✅ É infarto com supra, janela de reperfusão. A UPA não tem hemodinâmica.
   - ❌ Você sabe com quem está falando? → *Sei. Com alguém que não tem leito pra me dar.*
   - 🤝 Eu sei que está pesado aí. Me escuta trinta segundos.
2. **PLANTONISTA:** Não tenho nem maca.
   - ✅ Vaga zero: recebe na sala vermelha e a regulação responde pela decisão.
   - ❌ Então eu deixo o paciente na porta e vou embora.
   - · Entendo. A equipe espera junto.
3. **PLANTONISTA:** ...Tá. Manda. Mas registra que fui eu que aceitei no grito.
   - ✅ Registrado. {m:Obrigado|Obrigada}.
- Sucesso: Vaga zero autorizada.
- Falha: A negociação travou.

### Orientação: cena com arma (`cena_insegura`, dialogo)

*A segurança de quem liga vem primeiro. Ninguém vira herói: abaixado, longe da porta, e só ajuda a vítima se der sem se expor.*
1. **Quem liga:** Ele ainda tá lá fora, {dr}! Tá andando de um lado pro outro com o revólver na mão!
   - ✅ Fique abaixado atrás do balcão, longe da porta e das janelas. Não saia e não chame a atenção dele.
   - ❌ Vai lá e tenta conversar com ele, acalmar. → *Eu não vou sair, não, {dr}! {m:Tá maluco|Tá maluca}?*
   - 🤝 Respira. Eu fico com você na linha o tempo todo.
2. **Quem liga:** O Josué tá gemendo aqui do lado, tá saindo muito sangue da perna dele!
   - ✅ Se ele estiver ao seu alcance sem você se levantar: pano limpo em cima do ferimento e aperte forte.
   - ❌ Arrasta ele pra calçada pra ambulância achar mais rápido. → *Pra calçada?! O cara tá na calçada!*
   - ❌ Amarra o fio da TV bem apertado na perna. → *O fio? Tô apertando com o pano mesmo, {dr}...*
3. **Quem liga:** [sirene ao longe] ...Ele correu! O cara correu pro beco!
   - ✅ Continue abaixado e apertando. Ele pode voltar. Só abra quando a polícia ou a equipe disserem que é seguro.
   - ❌ Corre atrás pra ver pra onde ele foi. → *Eu? Eu não!*
   - 🤝 Você está indo muito bem.
4. **Quem liga:** Tem gente de colete aí na porta mandando abrir...
   - ✅ Abra só quando eles se identificarem. Mantenha a pressão no ferimento até a equipe assumir.
   - ❌ Pode soltar o pano e ir lavar a mão. → *Soltei... voltou a sangrar!*
- Sucesso: Ninguém mais se feriu e o sangramento ficou contido até a equipe entrar.
- Falha: A cena foi um caos. A equipe entrou com a vítima ainda sangrando muito.

### Orientação: picada de escorpião (`escorpiao`, dialogo)

*Criança pequena com vômito depois da picada é caso grave. Oriente o que fazer — e principalmente o que NÃO fazer — enquanto a viatura vai.*
1. **Quem liga:** A vizinha falou pra amarrar a perna dela com um pano pro veneno não subir!
   - ✅ Não amarre nada. Não corte, não chupe, não passe nada no lugar da picada.
   - ❌ Amarra bem apertado acima do joelho. → *Ela tá gritando mais ainda, {m:moço|moça}!*
   - 🤝 Calma. Eu vou te dizer o que fazer até a ambulância chegar.
2. **Quem liga:** E agora? Ponho alho? Café? A minha mãe falava de querosene...
   - ✅ Nada disso. Só lave com água e sabão. Um pano morno em cima ajuda na dor.
   - ❌ Passa um pouco de alho amassado. → *Ficou vermelho e ela tá chorando mais...*
   - 🤝 Fica do lado dela, conversando.
3. **Quem liga:** Ela vomitou de novo... tá suando, babando, tremendo.
   - ✅ Deite de lado, com a cabeça virada, para não engasgar com o vômito. Não dê nada pela boca.
   - ❌ Dá água com açúcar pra ela se acalmar. → *Ela vomitou a água toda!*
   - 🤝 Ela vai receber o soro no hospital. A equipe está indo.
4. **Quem liga:** O bicho tá aqui num pote, eu matei com o chinelo. Levo?
   - ✅ Leve o pote fechado para a equipe, sem pegar com a mão. Ajuda o hospital.
   - · Joga fora, não precisa.
- Sucesso: Nada de torniquete nem de "simpatia". A Lara chegou de lado, respirando, e o soro foi preparado antes dela entrar.
- Falha: A orientação teve falhas. A Lara chegou pior do que precisava.

### Orientação: queda de altura (`queda_coluna`, dialogo)

*Suspeita de lesão de coluna. A regra é uma só: ninguém mexe na vítima até a equipe chegar com a prancha.*
1. **Quem liga:** Os meninos querem levantar ele e pôr na caminhonete! Dizem que é mais rápido!
   - ✅ Ninguém levanta ele. A ambulância está indo e ele vai na prancha, deitado.
   - ❌ Pode levar, se for mais rápido. → *Puxaram ele pelo braço... ele gritou, {dr}!*
   - 🤝 Calma. O senhor fez certo em me ligar. Eu vou te guiar.
2. **Quem liga:** Ele quer sentar, diz que tá desconfortável deitado em cima do tijolo.
   - ✅ Não deixa sentar. Alguém se ajoelha atrás da cabeça dele e segura a cabeça parada, alinhada com o corpo.
   - ❌ Ajuda ele a sentar devagarinho. → *Ele falou que o braço formigou agora!*
   - · Põe um travesseiro embaixo da cabeça. → *Travesseiro? Aqui só tem saco de cimento...*
3. **Quem liga:** Ele tá pedindo água, a boca tá seca.
   - ✅ Nada pela boca: ele pode precisar de cirurgia. Molha só os lábios com um pano.
   - ❌ Dá um copo d’água, coitado.
   - 🤝 Conversa com ele. Fala que a ajuda está chegando.
4. **Quem liga:** Ele tá tremendo, diz que tá com frio.
   - ✅ Cobre ele com uma lona ou um casaco, por cima, sem mexer no corpo.
   - ❌ Arrasta ele pra sombra. → *A gente puxou pela perna... ele nem sentiu.*
5. **Quem liga:** Tô ouvindo a sirene! Tá chegando!
   - ✅ Alguém vai até o portão guiar a equipe. Quem segura a cabeça não solta.
   - · Todo mundo corre pra rua acenar.
- Sucesso: Ninguém mexeu nele até a prancha chegar.
- Falha: Mexeram na vítima mais do que deviam.

### Orientação: convulsão na gestante (`eclampsia`, dialogo)

*Gestante depois de uma convulsão. Proteja a via aérea, deite do lado esquerdo e não deixe ninguém pôr nada na boca dela.*
1. **Quem liga:** Ela parou de tremer, mas tá roncando, babando, não acorda direito!
   - ✅ Vira ela de lado, de preferência para o lado esquerdo, com a boca virada pra baixo.
   - ❌ Senta ela e dá um copo d’água. → *Ela engasgou, tossiu tudo!*
   - 🤝 Respira. Você está fazendo tudo certo me ligando.
2. **Quem liga:** Ela começou a tremer de novo! A barriga tá dura!
   - ✅ Não segura ela. Afasta os móveis, protege a cabeça e olha o relógio.
   - ❌ Põe uma colher na boca pra ela não morder a língua! → *Ela mordeu a colher e quebrou um dente!*
   - ❌ Segura os braços dela com força.
3. **Quem liga:** Parou. Ela tá respirando fundo... E o bebê? E o bebê?
   - ✅ Deixa ela do lado esquerdo: é o melhor pra ela e pro bebê. A equipe vai ouvir o coração dele.
   - ❌ Aperta a barriga pra ver se o bebê mexe.
   - 🤝 Eu sei que dá medo. Fica do lado dela.
4. **Quem liga:** A sirene! Tão chegando!
   - ✅ Abre a porta, prende o cachorro e separa a carteirinha do pré-natal pra equipe.
   - ❌ Vai lá fora esperar e deixa ela sozinha.
- Sucesso: Ela chegou à equipe deitada de lado, respirando, sem nada na boca.
- Falha: A orientação teve falhas, mas a equipe chegou.

### Compressão e presença (`d10_compressao`, dialogo)

*Oriente a compressão e fique com o pai. Instruções simples, sem pressa e sem julgamento: ele precisa de alguém do outro lado da linha.*
> Cartão exibido: CVV — Centro de Valorização da Vida · ligue 188 (24h, gratuito) · cvv.org.br. Em emergência médica, ligue para o serviço de emergência da sua cidade.
1. **PAI:** A toalha tá ficando vermelha... eu não sei se tô fazendo certo.
   - ✅ Está fazendo certo. Aperte firme a toalha em cima do machucado, com a mão espalmada, e não solte.
   - ❌ Tira a toalha um instante pra ver o tamanho do corte. → *Voltou a sangrar mais! Eu pus de novo, eu pus de novo!*
   - 🤝 Respira, Seu Sérgio. Eu estou aqui com o senhor, e a equipe já saiu.
2. **PAI:** Ela fica pedindo desculpa. Fica falando "desculpa, pai".
   - ✅ Diz pra ela que ela não precisa pedir desculpa. Que o senhor está ali e não vai sair.
   - ❌ Pergunta pra ela por que ela fez isso. → *[ela começa a chorar mais alto] ...Ela virou o rosto, {dr}.*
   - ❌ Fala pra ela que foi bobagem, que isso passa. → *Ela fechou o olho. Não quer mais olhar pra mim.*
3. **PAI:** Molhou a toalha toda. Pego outra?
   - ✅ Não tire essa. Põe a outra por cima e continua apertando.
   - ❌ Troca por uma seca. → *Quando eu tirei, voltou...*
   - 🤝 O senhor está indo muito bem.
4. **PAI:** Ela tá branquinha. Disse que tá tonta.
   - ✅ Deita ela no chão mesmo, com as pernas um pouco pra cima, e continua apertando o braço.
   - ❌ Dá um copo de água com açúcar pra ela.
   - ❌ Levanta ela e leva pro sofá. → *Ela quase caiu quando levantou!*
5. **PAI:** Eu não vi, {dr}. Ela tava quieta faz meses e eu achei que era da idade.
   - ✅ O senhor viu agora, e está do lado dela. É isso que importa agora.
   - ❌ É... os pais precisam prestar mais atenção. → *[silêncio. Depois, um soluço.]*
   - 🤝 Respira comigo. Ela está ouvindo a sua voz.
6. **PAI:** Tão batendo no portão! Chegaram!
   - ✅ Abre pra eles e vai junto com ela na ambulância. Não solta a mão dela.
   - ❌ Deixa ela com a equipe e espera em casa.
- Sucesso: A equipe encontrou a Bianca acordada, com o sangramento contido, e o pai ainda apertando a toalha.
- Falha: A equipe chegou. Foi difícil, mas ela estava acordada, e o pai não saiu do lado dela.

### Orientação: dengue com choque (`d11_choque`, dialogo)

*Até a USA chegar: deitar, aquecer, nenhum remédio por conta própria. A mãe está sozinha com ele.*
1. **MÃE:** Ele tá sentado no chão do banheiro, todo mole!
   - ✅ Deita ele de barriga pra cima, no chão mesmo, e põe as pernas dele em cima de uma almofada.
   - ❌ Põe ele embaixo do chuveiro pra ele acordar. → *Ele ficou mais gelado ainda!*
   - 🤝 Dona Vera, eu estou com a senhora. A ambulância já saiu.
2. **MÃE:** Ele tá gelado, tremendo.
   - ✅ Cobre ele com um cobertor. Mantém ele aquecido e não deixa ele levantar.
   - ❌ Esfrega álcool no corpo dele. → *Ele reclamou que arde... e continua gelado.*
   - 🤝 Conversa com ele. Não deixa ele dormir.
3. **MÃE:** Eu tenho remédio pra dor aqui. Dou pra ele?
   - ✅ Não dê nenhum remédio agora, nem pra dor nem pra febre. A equipe cuida disso.
   - ❌ Dá um anti-inflamatório, que ajuda. → *Então eu dou? Eu dou?*
   - · Pode dar um pouquinho de água. → *Ele não consegue nem segurar o copo.*
4. **MÃE:** O nariz voltou a sangrar!
   - ✅ Aperta a ponta do nariz com os dedos, firme, e vira a cabeça dele de lado se descer sangue pra boca.
   - ❌ Inclina a cabeça dele pra trás. → *Ele engasgou com o sangue!*
   - 🤝 A senhora está fazendo tudo certo.
5. **MÃE:** Tô vendo a luz da ambulância na esquina!
   - ✅ Abre o portão e separa o exame de dengue dele pra entregar pra equipe.
   - ❌ Levanta ele e sai correndo com ele pra rua.
- Sucesso: A equipe encontrou o Yuri deitado, aquecido, com as pernas para cima e o exame na mão da mãe.
- Falha: A orientação teve falhas, mas a equipe chegou.

### Orientação: intoxicação por remédios (`d12_intox`, dialogo)

*Mantenha a mãe ao lado do filho: de lado, nada pela boca, embalagens guardadas. Sem julgamento — as perguntas podem esperar.*
> Cartão exibido: CVV — Centro de Valorização da Vida · ligue 188 (24h, gratuito) · cvv.org.br. Em emergência médica, ligue para o serviço de emergência da sua cidade.
1. **MÃE:** Ele tá dormindo de barriga pra cima! Eu sacudo e ele quase não abre o olho!
   - ✅ Vira ele de lado, com o rosto virado pro chão e o joelho de cima dobrado. Assim ele não engasga.
   - ❌ Senta ele e dá um café bem forte. → *Ele não consegue engolir, escorreu tudo!*
   - 🤝 Dona Sandra, eu fico com a senhora até a ambulância chegar.
2. **MÃE:** Eu faço ele vomitar? Ponho o dedo?
   - ✅ Não. Não provoque vômito e não dê nada pela boca. Se ele vomitar sozinho, mantém de lado.
   - ❌ Faz, e depois dá leite pra cortar o efeito. → *Ele engasgou quando eu tentei!*
   - 🤝 A senhora está fazendo tudo certo.
3. **MÃE:** As cartelas tão aqui na minha mão. Jogo fora?
   - ✅ Guarda todas, mesmo vazias, e entrega pra equipe. Isso ajuda muito.
   - ❌ Joga fora, não precisa.
4. **MÃE:** Ele tá respirando tão devagar...
   - ✅ Põe a mão nas costas dele e conta comigo cada vez que o peito sobe. Se parar, me fala na hora.
   - ❌ Deixa ele dormir, deve ser o remédio. → *Mas ele não acorda nem quando eu grito!*
   - 🤝 Respira comigo, Dona Sandra.
5. **MÃE:** Ele me pediu desculpa antes de fechar o olho. Desculpa por quê, meu Deus?
   - ✅ Agora ele precisa da senhora do lado dele. As perguntas podem esperar. Fala com ele: ele pode estar ouvindo.
   - ❌ Isso foi pra chamar atenção. → *[ela começa a chorar e solta o telefone por um instante]*
   - 🤝 A senhora está sendo muito corajosa.
6. **MÃE:** A sirene! Eles chegaram!
   - ✅ Abre a porta, entrega as cartelas e vai junto com ele.
- Sucesso: A equipe encontrou o Lucas de lado, respirando, com a mãe segurando as cartelas e a mão dele.
- Falha: A orientação teve falhas, mas a mãe não saiu do lado dele.

### Orientação: remédio de adulto em criança (`intox_comprimido`, dialogo)

*Quem está do outro lado é a avó, e a culpa dela grita mais alto que o menino. Orientação imediata enquanto a USA se desloca.*
1. **DONA IRENE:** Ele tá molinho no meu colo... Eu dou um leite pra cortar o efeito?
   - ✅ Não dê nada pela boca e não provoque vômito. Nem leite, nem água.
   - ❌ Dá leite, ajuda a cortar o efeito. → *Ele engasgou com o leite!*
   - 🤝 Dona Irene, a ambulância já está a caminho. Eu fico na linha com a senhora.
2. **DONA IRENE:** Ele quer dormir... Deixo ele dormir?
   - ✅ Deite ele de lado, cabeça apoiada, e fique chamando pelo nome. Me avise se ele não responder.
   - ❌ Deixa dormir. Sono ajuda. → *Ele tá apagando...*
   - ❌ Joga água fria no rosto dele. → *Ele nem abriu o olho!*
3. **DONA IRENE:** A cartela! Eu jogo fora pra ele não pegar mais?
   - ✅ Não. Separe a cartela e a caixa do remédio pra entregar na mão da equipe.
   - ❌ Joga fora, tanto faz agora.
   - 🤝 A senhora está indo muito bem.
4. **DONA IRENE:** Ele tá respirando devagarinho... Devagar demais?
   - ✅ Conte as respirações em voz alta pra mim. Se ele parar de respirar, eu te ensino a massagem.
   - ❌ Sacode ele pra acordar.
   - 🤝 A senhora não está sozinha. Eles estão chegando.
5. **DONA IRENE:** Tô ouvindo a sirene!
   - ✅ Abra a porta e entregue a cartela na mão do médico.
   - ❌ Leva ele correndo pra rua.
- Sucesso: Nada pela boca, cartela separada, menino de lado e chamado pelo nome até a equipe entrar.
- Falha: A avó fez o que achava certo. Nem tudo era.

### Orientação: o avô do Biel (`queda_banheiro`, dialogo)

*Do outro lado está um menino de quinze anos, sozinho com o avô. Frases curtas. Uma coisa de cada vez.*
1. **BIEL:** Ele tá no chão do box, a água caindo nele...
   - ✅ Biel, fecha o registro do chuveiro. Não puxa ele pelo braço.
   - ❌ Puxa ele pra fora do box! → *Ele escorregou da minha mão, bateu a cabeça de novo!*
   - 🤝 Biel, respira. Eu tô aqui com você.
2. **BIEL:** Fechei. Ele tá fazendo um barulho, tipo ronco...
   - ✅ Não mexe no pescoço dele. Se ele vomitar, vira ele de lado inteiro: cabeça e corpo juntos.
   - ❌ Joga água no rosto dele pra acordar. → *Ele nem mexeu...*
   - ❌ Senta ele encostado na parede. → *A cabeça dele caiu pro lado!*
3. **BIEL:** Tá saindo sangue da cabeça dele...
   - ✅ Pega uma toalha limpa e aperta de leve em cima do corte.
   - ❌ Lava com água pra ver o tamanho.
   - 🤝 Você tá sendo muito corajoso, Biel.
4. **BIEL:** O portão da frente tá trancado... a chave tá com ele...
   - ✅ Procura a chave, destranca o portão pra equipe e volta pro lado dele.
   - ❌ Sai pra rua e espera lá fora. → *E se ele parar de respirar sozinho?*
5. **BIEL:** Tô ouvindo a sirene... {m:moço|moça}, ele vai ficar bom?
   - ✅ Abre o portão e segura a mão dele. Você fez tudo certo, Biel.
   - 🤝 A equipe vai cuidar dele agora. Você não tá sozinho.
- Sucesso: O Biel fechou o chuveiro, protegeu o avô e destrancou o portão. A equipe entrou sem perder um minuto.
- Falha: O Biel fez o que conseguiu. Ele tem quinze anos.

### Orientação: queda de laje (`queda_laje`, dialogo)

*Ninguém mexe na vítima. Coluna protegida, via aérea protegida se vomitar.*
1. **JOSIAS:** Os meninos tão querendo levantar ele pra sombra!
   - ✅ Ninguém mexe nele. Nem pra sombra. Segure a cabeça dele parada, com as duas mãos.
   - ❌ Pode carregar, com cuidado. → *Ele gritou quando levantaram!*
   - 🤝 Josias, você tá indo bem. A USA está a caminho.
2. **JOSIAS:** Ele vomitou! Tá engasgando!
   - ✅ Vire ele de lado com mais dois, tudo junto: cabeça, ombro e quadril de uma vez.
   - ❌ Senta ele pra vomitar. → *Ele não consegue sentar, {dr}!*
   - ❌ Deixa como está. → *Ele tá afogando!*
3. **JOSIAS:** Tá sangrando da cabeça...
   - ✅ Um pano limpo, apertando de leve no corte, sem mexer o pescoço.
   - ❌ Lava com a mangueira da obra.
   - 🤝 Respira. Você tá fazendo tudo certo.
4. **JOSIAS:** Ele tá falando que tá com sono...
   - ✅ Fique conversando com ele: o nome, o dia, a obra. Não deixa ele dormir.
   - ❌ Deixa ele dormir, descansa.
- Sucesso: Ninguém moveu o Seu Dirceu até a equipe chegar. A coluna chegou inteira ao Regional.
- Falha: Mexeram nele mais do que deviam.

### Orientação: crise de asma grave (criança) (`asma_crianca`, dialogo)

*A avó está sozinha com a menina. Ganhe tempo até a USA chegar. Não deixe ela dormir.*
1. **AVÓ:** Ela tá deitadinha no sofá, quietinha...
   - ✅ Senta ela no colo, inclinada pra frente, com a roupa frouxa. Deitada, o ar entra menos.
   - ❌ Deixa ela deitada descansando, tá cansada. → *Mas ela tá ficando mais roxinha deitada!*
   - 🤝 Dona Rita, a senhora tá fazendo tudo certo. Fica comigo.
2. **AVÓ:** A bombinha dela tá aqui, mas tem pouquinho.
   - ✅ Usa com o espaçador, do jeito que o médico ensinou. Pode repetir enquanto a ambulância vem.
   - ❌ Guarda, que tá acabando. → *Ela tá puxando mais forte!*
   - ❌ Dá um xarope de mel.
3. **AVÓ:** O olhinho dela tá fechando...
   - ✅ Chama ela pelo nome, conversa, não deixa dormir. Conta as respirações em voz alta pra mim.
   - ❌ Deixa ela dormir, que melhora. → *Ela não tá respondendo direito!*
   - 🤝 Respira comigo, Dona Rita. A ambulância tá chegando.
4. **AVÓ:** Tô ouvindo a sirene!
   - ✅ Abre a porta e separa a bombinha e os papéis dela pra equipe.
   - ❌ Sai correndo com ela pra rua.
- Sucesso: A menina chegou à equipe sentada, acordada, chiando de novo: o ar voltou a passar.
- Falha: O pânico atrapalhou, mas a equipe chegou.

### Orientação: AVC — Dona Cida, sozinha (`avc_cida`, dialogo)

*Ela está sozinha e com a fala arrastada. Mantenha a Dona Cida sentada, acordada e na linha até a equipe entrar.*
1. **CIDA:** O gato... tá miando... na porta...
   - ✅ Dona Cida, fica sentada onde a senhora está. Não levanta.
   - ❌ Levanta e vai abrir a porta pro moço. → *[um baque surdo] ...caí... {meu} {filho}...*
   - 🤝 Eu tô aqui. Não vou desligar.
2. **CIDA:** Tô com sede... vou pegar... um copo d’água...
   - ✅ Não bebe nada agora. A senhora pode engasgar.
   - ❌ Pode beber, devagarinho. → *[tosse, engasgo] ...desceu... errado...*
   - 🤝 Daqui a pouco, Dona Cida. Fica comigo.
3. **CIDA:** Tô com... sono...
   - ✅ Fica acordada comigo. Me conta o nome do gato.
   - ❌ Pode cochilar, a ambulância já tá chegando. → *[silêncio comprido]*
   - 🤝 A senhora tá indo muito bem.
4. **CIDA:** Tão batendo... no portão...
   - ✅ É a equipe. Fala pra eles onde tá a chave.
   - ❌ Não abre pra ninguém.
- Sucesso: A Dona Cida ficou sentada, acordada e na linha até a equipe entrar.
- Falha: A equipe entrou, mas a orientação teve falhas.

### Orientação: cordão saindo antes do bebê (`prolapso`, dialogo)

*A cada contração, o bebê aperta o próprio cordão. Tire o peso de cima dele até a USA chegar.*
1. **Quem liga:** Tá saindo um cordão! O bebê não saiu ainda!
   - ✅ Ela fica de joelhos, com o peito encostado no chão e o quadril pro alto. Agora.
   - ❌ Empurra o cordão de volta pra dentro. → *Eu tentei e ela gritou!*
   - ❌ Puxa o cordão devagarinho, pra ajudar. → *Ele tá pulsando na minha mão!*
2. **Quem liga:** Ela tá de joelhos! E o cordão?
   - ✅ Não aperte nem puxe. Cubra com um pano limpo molhado em água morna.
   - ❌ Amarra com um barbante.
   - 🤝 Você está indo muito bem. Respira comigo.
3. **Quem liga:** Ela quer fazer força! Tá gritando que vai fazer força!
   - ✅ Não pode fazer força. A cada contração, respira curtinho, soprando.
   - ❌ Faz força, que nasce logo. → *O cordão ficou roxo!*
   - 🤝 Eu tô aqui. A equipe tá chegando.
4. **Quem liga:** Tô ouvindo a sirene!
   - ✅ Ela continua nessa posição até a equipe mandar mudar. Abre a porta.
   - ❌ Levanta ela e leva até a porta.
- Sucesso: A posição tirou o peso de cima do cordão até a equipe chegar.
- Falha: A orientação teve falhas. O cordão ficou apertado por mais tempo.

### Orientação: criança que engoliu comprimidos (`intox_remedio`, dialogo)

*Remédio de adulto em criança. Não provoque vômito, deixe de lado, guarde a cartela, observe a respiração.*
1. **Quem liga:** Ele tá mole, com sono... eu enfio o dedo pra ele vomitar?
   - ✅ Não. Não provoque vômito e não dê nada pela boca.
   - ❌ Isso, faz ele vomitar tudo. → *Ele engasgou com o vômito!*
   - 🤝 Calma. Eu fico com você até a ambulância chegar.
2. **Quem liga:** Ele dormiu no sofá, de barriga pra cima...
   - ✅ Vira ele de lado, com o rosto voltado pro chão, e fica do lado dele.
   - ❌ Deixa ele dormir, que passa. → *Ele tá roncando estranho...*
   - ❌ Sacode ele pra acordar.
3. **Quem liga:** Achei a caixa! Faltam seis da cartela!
   - ✅ Guarda a cartela e a caixa pra entregar pra equipe. Me avisa se a respiração mudar.
   - ❌ Joga fora, não precisa.
4. **Quem liga:** Ele tá respirando... devagar.
   - ✅ Conta as respirações em voz alta pra mim. A equipe tá chegando.
   - ❌ Dá leite pra cortar o efeito.
- Sucesso: Sem vômito provocado, de lado, cartela guardada: a equipe recebeu tudo certo.
- Falha: Houve erro na orientação, mas a equipe chegou.

## Intervenção: ocorrências do plantão extra na ambulância (USA 01)

Em tempo real: o estado do paciente cai a cada segundo até as condutas críticas serem feitas. ✅ crítica (o que salva) · 🔎 achado · ➕ ajuda · · neutra (só gasta tempo) · ❌ dano (piora). Ver docs/INTERVENCAO.md.

### Infarto inferior com pressão baixa (`iam_inferior`)
- Rádio: USA 01, QRR 3. QTH Rua Jacarandá, 215, Vila Nova. Homem, 61 anos, dor no peito há 40 minutos, suando frio. A esposa diz que "é o jantar".
- Na cena: Seu Lauro, 61, sentado no sofá, a mão fechada no peito. Pálido, molhado de suor. A esposa: "Ele tomou o remédio de pressão à tarde e disse que era o jantar."
- Sinais: PA 86x54, FC 48, FR 20, SAT 95%, GLIC 132, RITMO Supra de ST em DII, DIII e aVF
- Destino aceito: REG
  - ✅ **Monitor e ECG de 12 derivações** (7 s): ECG: supradesnível de ST em DII, DIII e aVF. Infarto inferior. PA 86x54, FC 48.
  - ✅ **AAS 300 mg mastigado** (3 s): Ele mastiga o AAS e faz careta. "Amargo, doutor(a)."
  - ✅ **Acesso venoso** (6 s): Acesso no antebraço, soro em gotejamento lento.
  - ➕ **Cabeceira a 45°, acalmar** (2 s): O Márcio ajeita as almofadas. Ele respira um pouco mais devagar.
  - 🔎 **Glicemia capilar** (3 s): Glicemia 132. Não é isso.
  - · **Oxigênio em máscara** (3 s): Saturação 95% sem falta de ar: oxigênio aqui não muda nada (só se SatO2 < 94% ou desconforto).
  - ❌ **Dinitrato sublingual** (3 s): A pressão despenca: 62x38. Ele fica cinza e apaga por um instante. Nitrato é contraindicado com PAS < 90, FC < 50 e no infarto inferior.
- Fechamento: Infarto inferior com pressão baixa e frequência lenta. O que salva: ECG cedo, AAS mastigado, acesso e transporte para a hemodinâmica do Regional, avisando antes. O nitrato, que parece o remédio óbvio de dor no peito, derruba a pressão justamente neste infarto.
- Referência: SAV AC17 (síndrome coronariana) · fichas de AAS e dinitrato

### Parada cardíaca em fibrilação ventricular (`pcr_fv`)
- Rádio: USA 01, QRR 3, prioridade absoluta. QTH Av. Brasil, 1500, Centro, ponto de ônibus. Homem caído, não respira. Um rapaz já está fazendo massagem.
- Na cena: Um homem de uns cinquenta anos no chão do ponto, roxo. Um rapaz de uniforme de lanchonete comprime o peito dele, contando alto. "Ele caiu do nada! Eu vi na TV que tinha que apertar!"
- Sinais: PA —, FC 0, FR 0, SAT —, RITMO Fibrilação ventricular → depois de estabilizado: PA 102x64, FC 96, FR 12, SAT 92%, RITMO Sinusal depois do choque
- Destino aceito: REG
  - ✅ **Assumir as compressões (30:2)** (4 s): O Márcio assume: 100 a 120 por minuto, 5 a 6 centímetros, deixando o peito voltar. O Bené prepara a bolsa-válvula-máscara.
  - ✅ **Pás do monitor no peito** (5 s): Ritmo: fibrilação ventricular. É chocável.
  - ✅ **Desfibrilar** (4 s; antes: monitor): "Todos afastados!" Choque. O Márcio volta direto às compressões, dois minutos antes de olhar o ritmo de novo.
  - ➕ **Acesso venoso** (6 s): Acesso no braço, sem parar a massagem.
  - ✅ **Adrenalina 1 mg IV** (3 s; antes: acesso): Adrenalina feita e flush de soro, braço elevado. Repete a cada 3 a 5 minutos.
  - · **Intubar antes de tudo** (10 s): O tubo entra, mas foram dez segundos de peito parado. Na parada, compressão e choque vêm antes da via aérea avançada.
  - ❌ **Parar tudo para sentir o pulso** (5 s): Pausa longa, nada de pulso. Cada segundo sem compressão derruba a chance de voltar. A checagem é rápida, a cada 2 minutos.
- Fechamento: Parada em fibrilação ventricular, presenciada, com massagem de leigo desde o primeiro minuto: o melhor cenário que existe. Compressões sem parar, choque cedo e adrenalina devolveram o pulso. Intubar não vem antes de compressão e choque.
- Referência: SAV AC5–AC8 (RCP, AHA 2015) · SBV BC5

### Hipoglicemia (não era bebedeira) (`hipoglicemia`)
- Rádio: USA 01, QRR 2. QTH Rua do Comércio, 230, Centro, em frente à farmácia. Homem caído, "bêbado", segundo quem ligou. Não responde direito.
- Na cena: Homem de uns quarenta anos encostado na porta da farmácia fechada, molhado de suor. Resmunga palavras soltas. O segurança: "Tá bêbado, doutor(a). Deixa que a PM leva."
- Sinais: PA 128x82, FC 112, FR 18, SAT 97%, GLIC 31, GLASGOW 12 → depois de estabilizado: GLIC 118, GLASGOW 15, FC 96
- Destino aceito: UPA ou REG
  - ✅ **Glicemia capilar** (3 s): Glicemia: 31 mg/dL.
  - 🔎 **Olhar a mochila** (3 s): Na mochila: uma caneta de insulina e um sanduíche intacto, ainda no plástico.
  - 🔎 **Sinais vitais e Glasgow** (4 s): PA 128x82, FC 112, saturação 97%. Glasgow 12: abre o olho ao chamado, fala confuso.
  - ✅ **Acesso venoso** (6 s): Acesso no dorso da mão. Ele tenta puxar o braço.
  - ✅ **Glicose 50% IV** (4 s; antes: glicemia, acesso): Glicose 50% em bolus. Em dois minutos ele pisca, olha em volta: "Onde eu tô? Cadê minha mochila?" Nova glicemia: 118.
  - · **Oxigênio** (3 s): Saturação 97%. O problema não é falta de ar.
  - ❌ **Deixar com a PM (embriaguez)** (3 s): O segurança ri. O homem para de resmungar e escorrega no chão. Isso não é sono. Todo "bêbado" desacordado merece uma glicemia.
- Fechamento: Hipoglicemia, não bebedeira. Suor frio, confusão e uma caneta de insulina na mochila: a glicemia capilar é o primeiro exame de quem parece bêbado ou está desacordado. Glicose 50% na veia e nova glicemia. Sozinho na rua de madrugada, vai para observação.
- Referência: SAV AC29 (hipoglicemia) · AC25 (inconsciência)

### AVC dentro da janela (`avc`)
- Rádio: USA 01, QRR 3. QTH Rua dos Ipês, 410, Jardim Norte. Mulher, 67, a filha diz que a boca entortou e a fala enrolou. Começou há uns 40 minutos.
- Na cena: Dona Neusa, 67, sentada no sofá, a boca puxada para um lado. Tenta falar e a palavra sai embolada. A filha: "Ela tava lavando a louça e conversando comigo!"
- Sinais: PA 178x96, FC 88, FR 16, SAT 96%, GLIC 104, GLASGOW 15
- Destino aceito: REG · tratamento definitivo no hospital: chegar rápido
  - ✅ **Glicemia capilar** (3 s): Glicemia 104. Não é hipoglicemia imitando AVC.
  - ✅ **Perguntar quando foi vista bem pela última vez** (3 s): A filha: "Faz uma hora ela tava lavando a louça e conversando. Uns vinte minutos depois a boca entortou." Dentro da janela para o trombolítico.
  - ✅ **Escala de Cincinnati** (4 s): Sorriso torto, braço direito cai, fala arrastada: as três alterações.
  - 🔎 **Sinais vitais** (4 s): PA 178x96, FC 88, saturação 96%, Glasgow 15.
  - ➕ **Acesso no braço que não está fraco** (6 s): Acesso no braço esquerdo, o bom.
  - ❌ **AAS 300 mg** (3 s): Sem tomografia ninguém sabe se é entupimento ou sangramento. Se for sangramento, o AAS piora. No AVC não se dá AAS antes da imagem.
  - ❌ **Baixar a pressão (captopril)** (3 s): A pressão cai e o braço fica mais fraco. No AVC não se baixa a pressão na rua, salvo PAS > 220 ou PAD > 120.
  - · **Oxigênio** (3 s): Saturação 96%: oxigênio não muda nada aqui.
- Fechamento: AVC dentro da janela. O que importa é tempo: glicemia para afastar hipoglicemia, a hora em que foi vista bem pela última vez, Cincinnati e transporte direto para o Regional, avisando o protocolo de AVC. Sem AAS e sem baixar a pressão antes da tomografia.
- Referência: SAV AC21 (AVC) · AP29 (Cincinnati) · AC19

### Asma grave em criança (`asma_crianca`)
- Rádio: USA 01, QRR 3. QTH Travessa Sete, 12, Vila Esperança. Menina de 9 anos com falta de ar, a bombinha acabou.
- Na cena: Kauane, 9, sentada na beira da cama, os ombros subindo a cada respiração. As costelas afundam. Fala duas palavras e para. A mãe sacode a bombinha vazia: "Acabou ontem. O posto só tem na segunda."
- Sinais: PA 104x66, FC 142, FR 44, SAT 88% → depois de estabilizado: SAT 94%, FR 32, FC 128
- Destino aceito: REG ou UPA
  - ✅ **Oxímetro e frequência** (3 s): Saturação 88%, FC 142, FR 44. Asma grave.
  - ✅ **Oxigênio em máscara** (3 s): Máscara com O2. A saturação sobe para 91%.
  - ✅ **Salbutamol com espaçador (série)** (5 s): Primeira série no espaçador com máscara. Aparece um chiado: bom sinal, o ar voltou a passar. Repete a cada 20 minutos.
  - ➕ **Corticoide (hidrocortisona IV)** (3 s; antes: acesso): Corticoide na primeira hora, para a crise não voltar.
  - ➕ **Acesso venoso** (7 s): Veia fina, segunda tentativa. Ela chora, o que gasta ar.
  - ❌ **Nebulizar com água destilada** (4 s): O chiado piora. Água destilada irrita o brônquio: o veículo da nebulização é soro fisiológico.
  - ❌ **Deitar a menina para descansar** (2 s): Deitada, ela puxa o ar pior ainda e senta sozinha, assustada. Falta de ar: sentada.
- Fechamento: Asma grave: frases curtas, tiragem e saturação 88%. Oxigênio, broncodilatador em série com espaçador e corticoide na primeira hora. Sempre sentada; nebulização nunca com água destilada.
- Referência: SAV AC22 (asma) · APed19 · SBV BC10

### Anafilaxia com choque (`anafilaxia`)
- Rádio: USA 01, QRR 3. QTH Rua Bahia, 77, Bela Vista, salão de festas. Homem, 34, comeu camarão, a boca inchou, falta de ar.
- Na cena: Festa de aniversário. Um homem sentado numa cadeira de plástico, o rosto inchado e vermelho, os lábios grossos. Respira com barulho. Uma mulher abana ele com um prato: "Ele sabia que não podia comer camarão!"
- Sinais: PA 78x40, FC 134, FR 30, SAT 90% → depois de estabilizado: PA 98x62, FC 112, SAT 95%
- Destino aceito: REG ou UPA
  - ✅ **Adrenalina IM na coxa (0,5 mg)** (3 s): Na face lateral da coxa, por cima da calça mesmo. O Márcio anota a hora no braço da luva.
  - ✅ **Deitar com as pernas elevadas** (3 s): Deitado no chão do salão, pernas na cadeira. Nada de sentar ou levantar de repente.
  - ✅ **Oxigênio em máscara** (3 s): Máscara com reservatório. Saturação 90% subindo.
  - 🔎 **Pressão e frequência** (3 s): PA 78x40, FC 134. Choque.
  - ➕ **Acesso e soro fisiológico** (7 s): Dois acessos, soro aberto. A pressão começa a subir.
  - · **Só antialérgico na veia** (4 s): Antialérgico não segura anafilaxia. Foram quatro minutos sem o remédio que importa.
  - ❌ **Sentar para respirar melhor** (2 s): Ele senta e quase apaga: com a pressão a 78x40, ficar em pé ou sentado pode parar o coração. Deitado, pernas para cima.
  - ❌ **Adrenalina IV pura, em bolus** (3 s): Frequência a 190, dor no peito. Na anafilaxia a adrenalina é na coxa; na veia, só diluída, em infusão lenta e com monitor.
- Fechamento: Anafilaxia com choque. Primeiro a adrenalina IM na coxa (0,5 mg no adulto, repetível), deitado com as pernas elevadas, oxigênio e soro. Antialérgico sozinho não trata; sentar ou levantar pode matar.
- Referência: SAV AC33 (anafilaxia) · SBV BC23 · ficha de adrenalina

### Hemorragia na coxa (moto) (`moto_coxa`)
- Rádio: USA 01, QRR 3. QTH Av. Beira-Rio, altura do 900, Parque. Motociclista caído, sangrando muito na perna. A USB mais perto está em outra ocorrência.
- Na cena: Um rapaz de jaqueta no asfalto, a perna direita torta. A calça empapada de sangue, uma poça crescendo embaixo da coxa. Um motorista de aplicativo segura uma lanterna: "A moto rodou sozinha, eu vi."
- Sinais: PA 88x60, FC 128, FR 26, SAT 94%
- Destino aceito: REG · tratamento definitivo no hospital: chegar rápido
  - ➕ **Compressão direta na coxa** (3 s): O Márcio aperta com compressas. O sangue encharca. Não tira: põe outra por cima, com mais força.
  - ✅ **Torniquete acima da ferida** (4 s): Torniquete na raiz da coxa, apertado até o sangramento parar. O Márcio escreve a hora: [hora].
  - ✅ **Estabilizar a cervical** (4 s): O Bené segura a cabeça alinhada. Capacete fora em dupla, colar e prancha.
  - ✅ **Oxigênio com reservatório** (3 s): Máscara com reservatório a 15 litros.
  - ➕ **Acesso e soro moderado** (6 s): Dois acessos. Soro só até a pressão sistólica de 80 a 90: mais que isso faz sangrar de novo.
  - ❌ **Correr dois litros de soro rápido** (5 s): A pressão sobe e o sangue volta a escorrer pelas bordas. No trauma, soro com moderação.
  - ❌ **Colocar o osso de volta no lugar** (4 s): Ele grita e o sangramento aumenta. Fratura exposta: cobrir, imobilizar como está, nunca recolocar o osso.
- Fechamento: Hemorragia de membro: compressão direta primeiro e, se não segura, torniquete logo acima da ferida, apertado, com a hora anotada. Cervical alinhada, oxigênio e transporte rápido para o Regional. Soro com moderação (PAS de 80 a 90).
- Referência: SAV AT1 · AT20 · AT21 · AP19/AP20 · SBV BT14

### Pneumotórax hipertensivo (`pneumotorax`)
- Rádio: USA 01, QRR 3. QTH Rodovia SP-310, km 214, Distrito Industrial. Carro contra poste. Motorista acordado, muita falta de ar. Bombeiros no local.
- Na cena: O volante amassado. O motorista, preso pelo cinto, respira curto e rápido, os lábios roxos. Agarra o peito do lado direito. O bombeiro: "Já desligamos o carro. Pode trabalhar."
- Sinais: PA 76x50, FC 138, FR 36, SAT 82% → depois de estabilizado: PA 98x64, FC 118, SAT 90%
- Destino aceito: REG · tratamento definitivo no hospital: chegar rápido
  - ✅ **Cervical e retirada do carro** (5 s): Colar, prancha, os bombeiros ajudam a tirar em bloco.
  - 🔎 **Examinar e auscultar o tórax** (4 s): Sem murmúrio à direita, som de tambor na percussão, jugulares cheias. PA 76x50, saturação 82%.
  - ✅ **Descompressão com agulha (lado direito)** (4 s): Ar sai assobiando pela agulha. A saturação sobe para 90%, a pressão volta: 98x64.
  - ✅ **Oxigênio com reservatório** (3 s): Máscara a 15 litros.
  - ➕ **Acesso venoso** (6 s): Acesso calibroso no braço.
  - ❌ **Intubar e ventilar com pressão** (9 s): Ar empurrado para dentro de um tórax que já não tem para onde expandir: a pressão cai mais. Primeiro descomprimir.
- Fechamento: Pneumotórax hipertensivo: trauma, choque, murmúrio ausente de um lado, timpanismo, jugulares cheias. A descompressão por agulha do lado afetado tira o paciente da morte; depois oxigênio e transporte rápido para o Regional, onde ele recebe o dreno.
- Referência: SAV AT12 (pneumotórax hipertensivo) · AT1 · ATLS

### Parto iminente em casa (`parto`)
- Rádio: USA 01, QRR 2. QTH Rua Guarani, 51, Vila Nova. Gestante de 39 semanas, terceiro filho. O marido diz que "tá nascendo".
- Na cena: Jéssica, 27, na cama, agarrada na grade. Uma contração atrás da outra. "Eu quero fazer força! Eu PRECISO fazer força!"
- Sinais: PA 122x78, FC 104, FR 22
- Destino aceito: MAT
  - ✅ **Avaliar contrações e períneo** (4 s): Contração a cada 2 minutos, vontade de fazer força, a cabeça já aparece. Não dá tempo de chegar à Maternidade: o parto é aqui.
  - ✅ **Abrir o kit de parto e panos limpos** (4 s): Campos, clamps, compressas, manta aluminizada e um cobertor separado para o bebê. O Bené fecha a janela e desliga o ventilador.
  - ✅ **Proteger o períneo e amparar a cabeça** (5 s; antes: avaliar, kit): Uma mão no períneo, a outra segurando a cabeça sem puxar. Ombro de cima, ombro de baixo... nasceu. [hora].
  - ✅ **Secar e aquecer o bebê no colo da mãe** (3 s; antes: amparar): Secou, cobriu a cabeça, pele a pele com a mãe. Ele chora alto. A Jéssica ri e chora junto.
  - ✅ **Clampear o cordão (1 a 3 min depois)** (3 s; antes: aquecer): Dois clamps, corte entre eles. Ninguém puxou o cordão.
  - ❌ **Puxar a cabeça do bebê** (3 s): Nunca se puxa a cabeça. Ela sai sozinha, com a contração.
  - ❌ **Pedir para ela segurar e correr para a Maternidade** (3 s): Não se segura um parto iminente. Com a cabeça aparecendo, o parto se faz no local.
  - ❌ **Puxar o cordão para tirar a placenta** (3 s; antes: amparar): Sangramento. A placenta sai sozinha; se sair, vai num saco, junto com a mãe.
- Fechamento: Parto iminente: contrações a cada 2 minutos, vontade de fazer força e cabeça visível. O parto se faz no local: proteger o períneo, nunca puxar a cabeça, secar e aquecer o bebê (cabeça coberta, pele a pele), clampear em 1 a 3 minutos, não puxar o cordão. Mãe e bebê para a Maternidade.
- Referência: SAV AGO2 · AGO4 · SBV BGO4 · BPed9

### Crise convulsiva que não para (`convulsao`)
- Rádio: USA 01, QRR 3. QTH Rua Pará, 300, Santa Luzia. Homem, 28, epiléptico, convulsionando há uns 10 minutos.
- Na cena: Um rapaz no chão da sala, o corpo inteiro se sacudindo. Baba espumando no canto da boca. A mesinha de centro virou. O irmão segura uma colher: "Bota na boca dele? Ele vai enrolar a língua!"
- Sinais: PA 150x90, FC 126, FR 28, SAT 89%, GLIC 96 → depois de estabilizado: SAT 95%, FC 104
- Destino aceito: REG ou UPA
  - ✅ **Proteger a cabeça, afastar objetos** (3 s): O Bené tira a mesinha. Uma almofada embaixo da cabeça.
  - ✅ **Aspirar e oxigênio** (4 s): Aspiração da baba, máscara com O2. Saturação 93%.
  - ✅ **Glicemia capilar** (3 s): Glicemia 96. Não é hipoglicemia.
  - ➕ **Acesso venoso** (7 s): Acesso no braço, com o Márcio segurando sem forçar.
  - ✅ **Diazepam 10 mg IV lento** (4 s; antes: acesso): Em um minuto a crise para. Ele ronca: pós-ictal. Lateralizado.
  - ❌ **Colher na boca para não enrolar a língua** (2 s): Um dente quebra e a gengiva sangra. Ninguém engole a língua: nada na boca durante a crise.
  - ❌ **Segurar os braços e as pernas com força** (3 s): Segurar não para a crise e machuca. Só proteger.
- Fechamento: Estado de mal epiléptico (crise de mais de 5 minutos). Proteger a cabeça, aspirar, oxigênio, glicemia e benzodiazepínico na veia (diazepam 10 mg lento). Nada na boca, nada de segurar à força.
- Referência: SAV AC26 (convulsão) · ficha de diazepam · SBV BC16

### Facada no abdome, cena insegura (`bar_faca`)
- Rádio: USA 01, QRR 3. QTH Rua Sete de Setembro, 45, Vila Esperança, Bar do Neno. Homem esfaqueado na barriga. O agressor pode ainda estar no local. COPOM acionado.
- Na cena: Da esquina dá para ver a porta do Bar do Neno: gente gritando, um homem no chão segurando a barriga. Outro homem anda de um lado para o outro na calçada com uma garrafa quebrada na mão.
- Sinais: PA 92x60, FC 122, FR 24, SAT 95%
- Destino aceito: REG · tratamento definitivo no hospital: chegar rápido · cena insegura: esperar a PM
  - ➕ **Aguardar a PM a uma quadra (QRX)** (10 s): Vocês param a uma quadra, luzes apagadas. Em três minutos a PM chega e leva o homem da garrafa algemado. "Pode entrar, doutor(a)."
  - ❌ **Entrar já, o paciente está sangrando** (3 s): A garrafa voa da porta. O Márcio leva no ombro e cai. O Bené dá ré. Ninguém atende ninguém até a PM chegar.
  - ✅ **Compressão no ferimento** (3 s): Compressas sobre o corte, pressão firme. A faca está no chão, longe.
  - ✅ **Oxigênio com reservatório** (3 s): Máscara a 15 litros.
  - 🔎 **Pressão e frequência** (3 s): PA 92x60, FC 122. Sangrando por dentro.
  - ✅ **Acesso e soro moderado** (6 s): Dois acessos. Soro só até a sistólica de 80 a 90.
  - ❌ **Apalpar a barriga com força** (3 s): Ele grita e o sangramento aumenta. Ferida no abdome não se fica apertando para examinar.
- Fechamento: Em cena insegura a equipe não entra: espera a polícia a uma distância segura, porque equipe ferida não salva ninguém. Liberada a cena: compressão, oxigênio, acesso com soro moderado e transporte rápido. Sangramento dentro da barriga se resolve no centro cirúrgico.
- Referência: PE1 (segurança da cena) · SAV AT1 · AT16

### Trote na Praça da Matriz (`trote_praca`)
- Rádio: USA 01, QRR 2. QTH Praça da Matriz, Centro. Homem caído no banco da praça, não se mexe.
- Na cena: Bancos vazios, o coreto apagado. Do outro lado da praça, quatro adolescentes filmam a ambulância chegando.
- Destino aceito: (sem transporte)
  - · **Procurar a vítima pela praça** (8 s): Ninguém caído, ninguém sentado. Um saco de pipoca e as risadas do outro lado.
  - ➕ **Passar a descrição para a PM (lei do trote)** (3 s): "Central, USA 01: QTH sem vítima, QRU. Grupo de adolescentes filmando, a PM está ciente." A PM anota: "É o terceiro esta semana."
  - ➕ **Avisar a Regulação: QTH sem vítima** (2 s): "Central, USA 01: QTH sem vítima, QRU. Retornando à base."
- Fechamento: Trote. Enquanto a USA 01 rodava até a praça, o Centro ficou sem viatura avançada. É isso que a lei do trote tenta evitar, e é por isso que, na Regulação, ligação suspeita merece pergunta antes de ambulância.
- Referência: RM1 (trote)

### Afogamento em criança (`afogamento`)
- Rádio: USA 01, QRR 3. QTH Parque de Exposições, lago. Menino de 6 anos tirado da água, tossindo e vomitando.
- Na cena: Um menino ensopado na grama, tossindo, os lábios arroxeados. Um homem de bermuda, também ensopado, ajoelhado do lado. O pai: "Foi um minuto! Ele tava pescando comigo!"
- Sinais: PA 96x60, FC 128, FR 34, SAT 90%, TEMP 35,2 °C → depois de estabilizado: SAT 95%, TEMP 35,9 °C
- Destino aceito: REG
  - ✅ **De lado e aspirar** (3 s): De lado, o Márcio aspira água e vômito da boca.
  - ✅ **Oxigênio em máscara** (3 s): A saturação sobe de 90% para 95%.
  - ✅ **Tirar a roupa molhada e aquecer** (4 s): Manta aluminizada, cobertor. Temperatura 35,2 °C. Ele treme, o que é bom.
  - 🔎 **Auscultar os pulmões** (3 s): Estertores nas bases: entrou água no pulmão. FR 34.
  - ❌ **Apertar a barriga para tirar a água** (3 s): Só fez vomitar de novo, e vômito vai para o pulmão. Apertar a barriga não tira água do pulmão.
- Fechamento: Afogamento em criança: de lado, aspirar, oxigênio e aquecer. E hospital mesmo que melhore, porque o pulmão pode piorar horas depois. Liberar no local seria o erro mais fácil da noite.
- Referência: SBV BPed26 · SAV APed33 · AT26 (afogamento)

### Intoxicação por inseticida agrícola (`agrotoxico`)
- Rádio: USA 01, QRR 3. QTH Estrada da Chácara Boa Vista, km 3, Distrito Industrial. Homem, 45, passou veneno na plantação sem máscara. Babando, vomitando, falta de ar.
- Na cena: Um homem deitado na varanda da chácara, encharcado de suor, babando muito. Cheiro forte de veneno no ar. A esposa mostra um galão sem rótulo: "Ele tava passando isso no tomate."
- Sinais: PA 96x60, FC 46, FR 30, SAT 86% → depois de estabilizado: FC 88, SAT 93%
- Destino aceito: REG
  - ✅ **Luvas, máscara e avental antes de tocar** (3 s): Equipe protegida. Janelas da ambulância abertas.
  - ✅ **Tirar a roupa e lavar a pele** (5 s; antes: epi): Roupa cortada e num saco fechado, pele lavada com água corrente.
  - ✅ **Aspirar e oxigênio** (4 s; antes: epi): Muita secreção. Aspiração, máscara. Saturação 86% subindo devagar.
  - 🔎 **Monitor e pupilas** (4 s; antes: epi): FC 46, pupilas puntiformes, chiado no pulmão. Síndrome colinérgica.
  - ➕ **Acesso venoso** (6 s; antes: epi): Acesso no braço.
  - ✅ **Atropina IV (repetir até secar)** (4 s; antes: acesso): Doses repetidas até a secreção diminuir. A frequência sobe para 88. O alvo é secar o pulmão, não a pupila.
  - ➕ **Guardar o galão para o hospital** (2 s): O galão vai num saco, junto. O hospital precisa saber o que foi.
  - ❌ **Provocar vômito** (3 s): Nunca provocar vômito em intoxicação: mais risco de aspirar.
- Fechamento: Intoxicação por inseticida (síndrome colinérgica: baba, suor, pupila pequena, chiado, frequência baixa). Equipe protegida primeiro, descontaminação antes de embarcar, oxigênio e atropina até secar as secreções. Levar a embalagem; nunca provocar vômito.
- Referência: SAV ATox1 · ATox8 · SBV BTox1 · BTox6

## Manual de Regulação (como aparece no jogo)

### p.1 Classificação de risco e recursos (dia 1)
Toda ligação recebe uma cor e um recurso. Na dúvida entre dois níveis, faça as perguntas que justificam a sua escolha.
- VERMELHO — risco imediato de morte: parada, inconsciência ou mudança súbita da consciência, infarto, AVC na janela, trauma grave, grande hemorragia, falta de ar grave. Recurso: USA (meta de chegada: 10 min).
- AMARELO — urgência sem risco imediato: dor forte, fratura deformada ou exposta, queda de idoso, convulsão que já passou, desmaio com perda de consciência, hemorragia controlável, parto iminente. Recurso: USB (meta de chegada: 30 min).
- VERDE — casos leves: orientar procurar UPA ou UBS por meios próprios.
- AZUL — não urgente: orientação por telefone, UBS ou ficar em casa.
- Não responde e não respira (ou respira "esquisito", como ronco ou suspiro) = parada até prova em contrário. USA + RCP guiada.
- A USA (médico + enfermeiro + condutor) é para risco imediato de morte. Não existe "reserva técnica" fora deste manual.

### p.2 Protocolo de trote (dia 2)
O trote tira a ambulância de quem precisa. Mas tratar emergência real como trote é a falha mais grave da regulação.
- Sinais de trote: risadas ao fundo, relato cinematográfico, endereço inexistente, horário incompatível, número já no quadro.
- Números marcados como trote vão para o quadro de cortiça. Número no quadro NÃO prova trote: pessoas reais também ligam de números marcados.
- Ferramenta "Ligar de volta": desliga e retorna para o número (custa 30 min). Número inexistente ou caixa postal reforçam a suspeita.
- Criança ao telefone: peça para falar com um adulto. Se não houver adulto consciente, regule pelo que a criança descreve.

### p.3 Dor torácica (dia 3)
- Mais de 40 anos + suor frio + dor irradiada (braço, costas, queixo) = provável infarto. USA.
- Diabéticos, idosos e mulheres podem infartar sem dor clássica: cansaço, enjoo, "azia", suor frio. Desconfie.
- Dor em pontada que piora ao apertar o local, após esforço físico, em jovem sem fatores de risco: provavelmente muscular. Orientação.

### p.3-V Videoatendimento (Programa VER) (dia 3)
Programa VER (Videoatendimento de Emergência na Regulação). O sistema manda um link por mensagem; se quem liga aceitar, você vê a cena pela câmera do celular. Franquia de 3 vídeos por plantão.
- Use quando o relato não fecha: suspeita de trote, quem minimiza ("não é nada"), pânico que pode ser exagero, história que não explica o que aconteceu.
- Pedir o link custa 2 min, mesmo se a pessoa recusar. Conectar leva de 3 a 8 min (sinal fraco na Vila Esperança, Vila Nova, Jardim Primavera, Parque e Distrito). Cada "mostre" custa de 3 a 6 min.
- Vermelho evidente não espera vídeo: decida primeiro. O minuto gasto olhando é o minuto que a viatura não andou.
- O vídeo mostra cor da pele, postura, esforço para respirar, sangue, deformidade e o ambiente. NÃO mostra pressão, glicemia, pulso, temperatura nem a pupila. Quem segura a câmera escolhe o que você vê.
- Só funciona se quem liga estiver junto do paciente (Protocolo RM1).
- Nunca peça vídeo para quem está escondido de um agressor ou em crise suicida: a câmera expõe e afasta. Acolha pela voz.
- Teste do copo: febre + manchas roxas que NÃO somem quando se aperta um copo de vidro em cima = púrpura. Vermelho (USA).
- História discordante (o que se vê não combina com o que contam — "caiu da cama" com marcas de idades diferentes): suspeita de maus-tratos. Notificar e acionar apoio policial (Protocolo RM9).
- Sinais de morte evidente (rigidez, manchas roxas nas partes de baixo do corpo, decomposição): a constatação pode ser feita por telemedicina (Protocolo RM7). Morte natural: SVO; violenta ou suspeita: PM/IML.
- Trote filmado vale prova: registre como TROTE e a gravação vai para a PM (lei municipal do trote). Trotista costuma recusar, enrolar ou desligar quando você pede o vídeo.

### p.4 Cena insegura (dia 4)
- Violência em andamento (arma, agressor no local, briga): acionar PM junto com a viatura. A equipe não entra em cena insegura.
- Mandar equipe para cena insegura sem PM = advertência imediata.
- Vítima presa (ferragens, máquina, desabamento), afogamento com resgate, incêndio e choque elétrico com fio energizado: chame os Bombeiros junto com a ambulância. A equipe só se aproxima depois que eles liberarem a cena.

### p.5 Corte de frota (Saúde+ Gestão) (dia 5)
Comunicado da coordenação: a partir de hoje a frota opera com 2 USA e 4 USB.
- Frota: USA 01 (Centro), USA 02 (Norte), USB 01 a 04. A USA 03 e a USB 05 saem de circulação.
- Meta da OS: "uso racional" de USA. Painel de metas visível na mesa. (A meta não está acima deste manual.)

### p.5-B Respiratório e asma (dia 5)
- Asma moderada: chia e cansa, mas completa as frases, sem lábios roxos, melhora só em parte com a bombinha. USB.
- Asma grave: frases entrecortadas (palavras soltas) ou não consegue falar, lábios/unhas roxos, sonolência, peito afundando muito. USA.
- ATENÇÃO: "parou de chiar" em crise grave pode ser tórax silencioso — sinal de gravidade extrema, não de melhora.
- Crise de ansiedade: formigamento na boca e nas mãos, fala frases inteiras, lábios normais. Orientar respiração guiada.

### p.6 AVC (dia 6)
- Teste FAST: rosto torto ao sorrir, braço que cai, fala enrolada. Qualquer um positivo = suspeita de AVC.
- Janela de 4h30 desde a última vez em que foi visto bem. Dentro da janela, acordado e só com sinais do FAST: USB já atende (USA, se estiver livre) → Regional. Inconsciente, convulsionando ou com a via aérea em risco: USA → Regional. Fora da janela: USB.
- Acordou com os sintomas: o início é a última vez em que foi visto bem (mesmo de madrugada), não a hora em que acordou.
- Hipoglicemia imita AVC: diabético em uso de insulina, suado, confuso ou desacordado = USA. Se acordado e engolindo, açúcar.

### p.7 Obstetrícia (dia 7)
- Período expulsivo (vê a cabeça, vontade de fazer força): USB + orientação de parto por telefone. Cordão, pé, mão ou nádegas aparecendo antes da cabeça, hemorragia forte ou convulsão: USA.
- Gestante com convulsão, ou com pressão alta + dor de cabeça forte, dor na boca do estômago ou visão "brilhando": USA.
- Início de trabalho de parto (contrações espaçadas, bolsa íntegra): orientar ir à maternidade por meios próprios.
- Sangramento pequeno, sem dor, no início da gestação: orientação (maternidade/UBS). Com dor, ou depois de 20 semanas e mais que um fio de sangue: USB. Sangramento forte (coágulos, encharca a roupa), dor intensa ou tontura: USA.

### p.9-A Destino hospitalar (dia 9)
- REGIONAL (REG): trauma grave, vermelhos clínicos, pediatria grave.
- UPA NORTE (UPA): amarelos adultos e pediátricos, fraturas simples.
- MATERNIDADE (MAT): gestantes com mais de 20 semanas e partos.

### p.9-B Concorrência de recursos (dia 9)
- Dois vermelhos e um só recurso avançado: priorize (1) maior risco imediato de morte, (2) menor tempo de chegada, (3) possibilidade de suporte intermediário. Registre a justificativa.

### p.9-C Impedimento do regulador (dia 9)
- O regulador não deve regular familiar nem pessoa com quem tenha vínculo. Nesses casos, aciona a coordenação (declarar impedimento).

### p.11 Epidemia de dengue (dia 11)
- Dengue sem sinais de alarme: hidratação e UBS. Orientação.
- Sinais de alarme: dor abdominal intensa, vômitos persistentes, sangramento de mucosa, sonolência, tontura ao levantar. USB → UPA (idoso ou confuso: REG).
- Choque: pele fria, sangramento com tontura, desmaio, pulso fraco. USA → Regional.
- Gestante com febre: risco aumentado. USB → Maternidade.

### p.12 Saúde mental (dia 12)
- Agitação ou ameaça a terceiros: USB + PM como apoio. Com arma ou agressão em curso, a PM entra primeiro e a USA pode ir de apoio (sedação) se o risco for alto.
- Crise emocional com risco de se machucar: USB + acolhimento por telefone. Plano, meio à mão ou tentativa em curso: USA. A ligação não pode cair. Exiba o CVV (188).
- Acolher: escutar, não julgar, não apressar, não minimizar. Perguntar direto sobre suicídio (perguntar não induz) e se há alguém por perto. Não deixar a pessoa sozinha.

### p.13 Intoxicação em crianças (dia 13)
- Orientação imediata enquanto a viatura se desloca: NÃO provocar vômito, guardar a embalagem, observar a respiração.
- Produto cáustico (soda, água sanitária concentrada) ou remédio de adulto (pressão, diabetes, calmante) em criança: USA → Regional.
- Objeto engolido (moeda) sem dificuldade para respirar ou engolir: orientação, UPA por meios próprios. Pilha ou bateria de botão: urgência (USB), sem esperar sintomas.

### p.15 Múltiplas vítimas (dia 15)
- START: anda sozinho → VERDE (UPA por meios próprios).
- Respira > 30/min, enchimento capilar > 2 s ou não obedece comandos → VERMELHO (USA).
- Não anda, mas respira normal, perfunde e obedece → AMARELO (USB).
- Limite de viaturas por evento: peça reforço regional e preserve uma USA para a cidade, se possível.

### p.17 Chuvas (dia 17)
- Ruas alagadas aparecem no mapa. Rotas ficam mais longas; algumas viaturas podem ficar presas.
- Resgate, ilhados, afogamento, desabamento e choque elétrico em área alagada: Bombeiros obrigatório.

### p.19 Regional sem vaga (dia 19)
- Regional sem vaga: para vermelho, negocie "vaga zero" por telefone. O paciente grave não pode esperar na prancha.

## Trechos marcados com [validar] no código

- `src/content/bank/cardio.ts:3` — Instruções clínicas marcadas com [validar].
- `src/content/bank/cardio.ts:193` — ⚖ RC22: "palpitação atual" é USB; orientação quando fala frases inteiras, sem dor, sem desmaio e sem história cardíaca. [validar] "pulso anormal" (>100) é USA no RC22, mas só "se medido" pela equipe.
- `src/content/bank/cardio.ts:229` — [validar] RC22: pulso anormal medido (>100) é USA; aqui o pulso é contado pelo leigo, então ficou amarelo/USB (UPA reverte).
- `src/content/bank/cardio.ts:278` — links: [lk('energetico', 'emagrecer', 'Energéticos e remédio para emagrecer, sem dormir: o coração acelerado tem causa. Sem dor no peito: UPA por meios próprios e nada de cafeína.')], // [validar]
- `src/content/bank/cardio.ts:307` — ex('suco', 'Orientar o açúcar', 'Orientar o açúcar', ['Tomei... [goles]', '[quinze minutos depois]', 'Deu 104, {dr}! O coração tá desacelerando.'], { kind: 'fala', say: 'Você está acordado e engolindo bem: toma meio copo
- `src/content/bank/clinico.ts:3` — barriga. Instruções clínicas marcadas com [validar].
- `src/content/bank/clinico.ts:119` — ex('lado', 'Orientar: virar de lado', 'Orientar: virar de lado', ['Virei! Saiu vômito da boca...', 'Tá respirando melhor, sem aquele barulho.'], { kind: 'fala', say: 'Vira ele de lado agora, com a boca para baixo, e não 
- `src/content/bank/clinico.ts:157` — ex('ferrao', 'Orientar o ferrão', 'Orientar o ferrão', 'Raspei com o cartão do banco, saiu. Pus gelo.', { kind: 'fala', say: 'Se o ferrão ficou, raspe com a borda de um cartão, sem apertar. Gelo no local.' }), // [valida
- `src/content/bank/clinico.ts:184` — lk('enxame', 'cinquenta', 'Mais de cinquenta picadas: risco de intoxicação pelo veneno, mesmo sem alergia. Vermelho, USA.'), // RC21: envenenamento de alta mortalidade = USA. [validar] o limiar de ~50 picadas é da toxico
- `src/content/bank/clinico.ts:210` — lk('estridor', 'alergia', 'Alérgico a abelha, boca inchando e respiração com apito: anafilaxia. Vermelho, USA. Caneta já, mesmo vencida.'), // [validar]
- `src/content/bank/clinico.ts:235` — links: [lk('escorpiao', 'so_dor', 'Escorpião em adulto, só dor no local, sem vômito nem suor: caso leve. Compressa morna e UPA para analgesia e observação.')], // RC21: dor intensa = orientação. [validar] compressa morna
- `src/content/bank/clinico.ts:256` — extra: [ex('orientar', 'Orientar os primeiros cuidados', 'Orientar os primeiros cuidados', 'Tá deitad' + p.o + ', parado, não amarramos nada.', { kind: 'fala', say: 'Deixe deitado e quieto, com a perna parada. Não amarre
- `src/content/bank/dengue.ts:4` — Instruções clínicas marcadas com [validar].
- `src/content/bank/dengue.ts:5` — [validar] As páginas do protocolo de regulação não trazem dengue (só febre como
- `src/content/bank/idoso.ts:3` — febre e tosse, remédios tomados errado. Instruções clínicas marcadas com [validar].
- `src/content/bank/idoso.ts:307` — [validar] RT6 (idoso >70 com fratura = USB) + Anexo VII (perfil traumato-ortopédico vai a serviço especializado): fêmur aceita UPA ou Regional.
- `src/content/bank/idoso.ts:353` — ex('levantar', 'Orientar a levantar', 'Orientar como levantar com segurança', ['Uma cadeira firme do lado, virar de lado, ficar de joelhos e apoiar na cadeira... peraí...', `${p.Ele} levantou! Tá sentad${p.o} na cadeira!
- `src/content/bank/idoso.ts:418` — [validar] RT6: idoso >70 com fratura = USB, mas "deformidade em membro superior" = orientação; ficou ⚖ ORI/USB (qual é a "melhor"?).
- `src/content/bank/idoso.ts:437` — links: [lk('garfo', 'anda', 'Pulso torto como um garfo, anda e não bateu a cabeça: fratura de punho sem gravidade. UPA por meios próprios, com o braço imobilizado.')], // [validar]
- `src/content/bank/idoso.ts:569` — lm(p, 'dois_comprimidos', 'intox_orient', 'Guardar a embalagem, não provocar vômito e observar a respiração (Manual p.13). Com tontura, deixar deitad' + p.o + '.', { kind: 'confirma' }), // campo A12 (BTox1). [validar] "
- `src/content/bank/idoso.ts:596` — lk('glibenclamida', 'glicemia', 'Glibenclamida em dobro e glicemia 41: a hipoglicemia pode voltar por horas. USA.'), // [validar]
- `src/content/bank/idoso.ts:630` — [validar] RT5: sonolência recente por sedativo + álcool pode contar como "alteração súbita da consciência" (USA/USI). Ficou amarelo/USB, com piora para USA.
- `src/content/bank/neuro.ts:3` — dor de cabeça. Instruções clínicas marcadas com [validar].
- `src/content/bank/neuro.ts:126` — [validar] RC19: alteração da consciência totalmente atribuível ao álcool = orientação; ficou amarelo/USB porque é idoso com fala arrastada (AVC não se descarta por telefone).
- `src/content/bank/neuro.ts:263` — lk('testa', 'torta', 'A paralisia pega o rosto inteiro de um lado, testa e olho incluídos: típico de paralisia facial periférica (de Bell), não de AVC. Precisa de médico hoje, na UPA.'), // [validar]
- `src/content/bank/neuro.ts:292` — lk('passou', 'repetiu', 'Sintomas de AVC que somem sozinhos e já tinham acontecido antes: ataque isquêmico transitório, aviso de AVC grande. Avaliação hoje: USB.'), // [validar]
- `src/content/bank/neuro.ts:419` — [validar] RC10: hipoglicemia medida com alteração da consciência é USI/USB; só "não reativo" ou convulsão é USA. Aqui só abre o olho e resmunga, sem condição de engolir: mantido USA.
- `src/content/bank/neuro.ts:577` — [validar] RC7 põe "crise >5 min" e "episódios recidivantes" em USI/USB; aqui é USA por estado de mal (cianose, sem acordar entre as crises) e pela medicação de resgate.
- `src/content/bank/neuro.ts:590` — links: [lk('dez_min', 'de_novo', 'Crise de mais de cinco minutos, ou uma atrás da outra sem acordar: estado de mal epiléptico. Vermelho, USA.')], // [validar]
- `src/content/bank/neuro.ts:642` — lk('febre', 'xixi', 'Febre de 39,5 com ardência para urinar e dor nas costas: infecção urinária alta. UPA hoje.'), // [validar]
- `src/content/bank/neuro.ts:683` — lk('xixi', 'agitado', 'Confusão nova em idoso, com xixi de cheiro forte, ardência e febre: infecção urinária causando delirium. Amarelo, USB.'), // [validar]
- `src/content/bank/neuro.ts:711` — lk('pouco_xixi', 'boca_seca', 'Quase sem xixi, boca seca, calor e diurético: desidratação causando confusão. Amarelo, USB.'), // [validar]
- `src/content/bank/neuro.ts:723` — [validar] RC10: hipoglicemia medida com alteração da consciência é USI/USB; só "não reativo" ou convulsão é USA. Aqui responde cada vez menos (RM4: alteração gradual = amarelo): mantido USA, a piora fecha em não reativo.
- `src/content/bank/neuro.ts:814` — [validar] RC6: "dor moderada" (intensa, mas suportável) é USI/USB e "dor leve recente" é orientação; enxaqueca habitual, igual às outras, sem sinal neurológico: ficou orientação.
- `src/content/bank/neuro.ts:926` — lk('todos', 'aquecedor', 'Família inteira com dor de cabeça e enjoo, aquecedor a gás com chama amarela em banheiro fechado: intoxicação por monóxido de carbono. Todos para fora, janelas abertas, Bombeiros.'), // [validar
- `src/content/bank/obstetricia.ts:4` — Instruções clínicas marcadas com [validar].
- `src/content/bank/obstetricia.ts:82` — ⚖ [validar] RO2: "pressão arterial elevada" é USI/USB e só "DHEG severa" (convulsão ou história de convulsão) é USA. Sem convulsão ainda, USB defensável; USA é a melhor (sulfato de magnésio); a piora para convulsão fecha
- `src/content/bank/obstetricia.ts:254` — ⚖ [validar] RO1/RC13: em gestante acima de 20 semanas "qualquer pinga de sangue" é USB (RC13: USA). Tampão com fio de sangue a termo, sem dor: orientação é defensável, USB também.
- `src/content/bank/obstetricia.ts:269` — links: [lk('tampao', 'semanas_39', 'Muco com raias de sangue a termo: tampão mucoso, o parto se aproxima. Ir à Maternidade quando as contrações ficarem regulares ou a bolsa romper.')], // [validar]
- `src/content/bank/pediatria.ts:3` — cabeça, afogamento, engoliu objeto, bebeu produto. Instruções clínicas: [validar].
- `src/content/bank/pediatria.ts:170` — links: [lk('sem_xixi', 'olho_fundo', 'Sem xixi, olho fundo e choro sem lágrima, mas ainda reage: desidratação. Amarelo, USB. Se estivesse mole e sem reagir, seria USA.')], // [validar]
- `src/content/bank/pediatria.ts:254` — ⚖ [validar] BPed19 (USI preferida a USB): RN febril e hipoativo; sem USI no jogo, USB é a melhor e USA é defensável (risco de sepse).
- `src/content/bank/pediatria.ts:270` — links: [lk('vinte_dias', 'febre', 'Febre em bebê com menos de três meses é sempre urgente: pode ser infecção grave. USB.')], // [validar]
- `src/content/bank/pediatria.ts:331` — links: [lk('so_mao', 'bolhinha', 'Queimadura pequena, só na mão, uma bolha: água corrente em temperatura ambiente (sem gelo), não estourar bolha, nada de pasta de dente. UBS.')], // campo A10 (BPed27): na criança água ge
- `src/content/bank/pediatria.ts:353` — links: [lk('braco', 'bolhas', 'Bolhas no braço inteiro de uma criança: queimadura de segundo grau extensa para o tamanho dela. Amarelo, USB.')], // [validar] RT7: dor intensa = USB; o RT7 não traz extensão da queimadura
- `src/content/bank/pediatria.ts:376` — links: [lk('panela', 'pele', 'Água fervendo no peito e na barriga, pele soltando: queimadura extensa em criança. Vermelho, USA → Regional.')], // [validar] RT7 não traz extensão; USA pelo risco de choque do grande queima
- `src/content/bank/pediatria.ts:565` — links: [lk('tosse', 'agua', 'Engoliu e aspirou água, ficou mole uns segundos e respira rápido: pode piorar nas próximas horas. USB para avaliar. Com falta de ar forte ou espuma, seria USA.')], // [validar] RT1
- `src/content/bank/pediatria.ts:587` — links: [lk('segundos', 'brincando', 'Poucos segundos submerso, sem tosse e já brincando: susto, sem urgência de ambulância. Mas criança que ficou debaixo da água deve ser vista na UPA, por meios próprios, mesmo sem sinto
- `src/content/bank/pediatria.ts:678` — links: [lk('bateria', 'baba', 'Bateria de botão engolida queima o esôfago em poucas horas, e já está babando: urgência. USB → Regional (endoscopia). Não provocar vômito.')], // [validar]
- `src/content/bank/pediatria.ts:769` — lk('diluida', 'sem_lesao', 'Um gole de água sanitária muito diluída, cuspido, sem lesão na boca: orientar e observar; UPA se aparecer dor ou vômito.'), // [validar]
- `src/content/bank/pediatria.ts:806` — [validar] RT5 (mortalidade moderada = USB) × RP1 (dispneia = USA): tosse e respiração rápida, mas sem esforço, saturando 93: mantido USB.
- `src/content/bank/pediatria.ts:821` — lk('querosene', 'rapido', 'Querosene que fez tossir e agora respiração rápida: foi para o pulmão. Não provocar vômito! USB → Regional.'), // [validar]
- `src/content/bank/psiq.ts:4` — roteiro "acolhimento" (CVV 188). Instruções clínicas marcadas com [validar].
- `src/content/bank/resp.ts:3` — Instruções clínicas marcadas com [validar].
- `src/content/bank/resp.ts:281` — links: [lk('saiu', 'respira_ok', 'Desobstruiu, respira e fala: engasgo resolvido. Orientar observar e passar na UBS para avaliar depois da manobra; se ficar com falta de ar, dor na barriga ou febre, procurar a UPA.')], /
- `src/content/bank/resp.ts:348` — [validar] RP1/RC3: "frases entrecortadas" e "esforço respiratório aumentado" (tiragem) são USA; aqui só tiragem leve e frases inteiras: USB, com piora para USA.
- `src/content/bank/resp.ts:431` — links: [lk('tosse_cachorro', 'chora', 'Tosse de cachorro e rouquidão em criança resfriada, que respira sem barulho nenhum, nem chorando: crupe leve. Acalmar e levar à UPA por meios próprios. Com chiado ou apito ao respir
- `src/content/bank/trauma.ts:4` — Instruções clínicas marcadas com [validar].
- `src/content/bank/trauma.ts:44` — links: [lk('parou', 'pequeno', 'Corte de dois centímetros que para com pressão, dedos mexendo: sangramento controlável. Compressão e UPA para os pontos.')], // [validar]
- `src/content/bank/trauma.ts:104` — ex('apertar', 'Orientar a compressão', 'Orientar a compressão', ['Inclinou pra frente... tô apertando...', '...diminuiu, mas ainda escorre um pouco.'], { kind: 'fala', say: 'Sente, incline a cabeça para FRENTE e aperte a
- `src/content/bank/trauma.ts:329` — links: [lk('osso', 'caiu', 'Osso aparecendo, consciente, sem trauma de cabeça: fratura exposta. Amarelo, USB → Regional (ortopedia). Cobrir com pano limpo, não empurrar o osso.')], // RT6/RC24: fratura exposta = USB; Ane
- `src/content/bank/trauma.ts:364` — [validar] RC24: "dor moderada" e edema são orientação e só "dor intensa"/"deformidade grosseira" são USB; corte fundo + ombro doendo depois de queda de moto: mantido USB.
- `src/content/bank/trauma.ts:492` — [validar] RT7 põe "queimadura elétrica" em USI/USB; USA aqui pelo choque de alta tensão com queda e coração "pulando" (arritmia).
- `src/content/bank/trauma.ts:509` — lk('fio', 'queimada', 'Choque de alta tensão com queimadura e coração "pulando": risco de arritmia. Vermelho, USA.'), // [validar]
- `src/content/bank/trotes.ts:60` — [validar] RT6: "deformidade grosseira" = USB, mas "deformidade em membros superiores" = orientação. Aqui o braço "tá torto" e ele chora de dor: USB.
- `src/content/bank/trotes.ts:111` — ex('lado', 'Orientar: virar de lado', 'Orientar: virar de lado', ['Virei! Saiu vômito da boca...', `${p.Ele} tá respirando melhor.`], { kind: 'fala', say: 'Vira de lado agora, com a boca para baixo. Ninguém dá água, café
- `src/content/bank/trotes.ts:590` — [validar] RT6 (idoso >70 com fratura = USB) + Anexo VII (perfil traumato-ortopédico vai a serviço especializado): fêmur aceita UPA ou Regional.
- `src/content/days/d01.ts:339` — [validar] RC23 (problemas odontológicos) lista "dor intensa" e "dor moderada" como discriminador de USI/USB.
- `src/content/days/d04.ts:607` — [validar] O RC6 põe "dor moderada" (dor intensa, mas suportável) em USI/USB: o jogo prefere orientar (crise
- `src/content/days/d06.ts:649` — [validar] RT9 põe "hematoma ou inchaço em couro cabeludo" em orientação; o jogo pede USB pela soma de menos
- `src/content/days/d10.ts:660` — [validar] RC5: "alto risco de nova autoagressão" está na lista USA/USI (o exemplo do RM4, "tentou cortar os
- `src/content/days/d10.ts:875` — [validar] RT6/RT8: queda de mais de 1,5 vez a própria altura é "mecanismo de trauma significativo" → USA, e ele
- `src/content/days/d11.ts:586` — [validar] Nenhuma página de regulação trata dengue ou febre na gestante. Estável, sem sangramento, bebê mexendo:
- `src/content/days/d12.ts:431` — [validar] RC4: quebrar vasos e o carro é "comportamento heteroagressivo" e o pau na mão com gente perto é "alto
- `src/content/days/d12.ts:540` — [validar] RC5 põe "alto risco de autoagressão (ideação suicida)" na lista USA/USI; pela definição, alto risco
- `src/content/days/d12.ts:751` — [validar] RC24: mão "esmagada, roxa" é "comprometimento vascular distal" (USA); dor intensa é USI/USB. O esmagamento
- `src/content/days/d14.ts:596` — [validar] RT6/RT9: confusão nova pode ser "alteração súbita da consciência" (na dúvida, presumir) e "tava gelada"
- `src/content/days/d14.ts:754` — [validar] O RO2 só põe em USA a DHEG com convulsão (ou história de convulsão); "pressão arterial elevada" é
- `src/content/days/d15.ts:834` — [validar] RT8: poste entortado e airbag aberto sugerem "mecanismo de trauma significativo" (USA). Acordado, com
- `src/content/days/d17.ts:629` — [validar] Campo A9 (BPed26/APed33): no afogamento da criança, A-B-C, via aérea e ventilação primeiro. O roteiro
- `src/content/days/d17.ts:1086` — [validar] Campo A9 (BPed26/APed33): criança que submergiu vai ao hospital mesmo sem sintoma. Ele caiu sentado em
- `src/content/days/d20.ts:927` — [validar] RT9: anticoagulante ("distúrbio de coagulação") e o corte que sangra mais são USI/USB; mas perguntar as
- `src/content/guides.ts:2` — [validar] Todas as instruções clínicas abaixo são simplificações de jogo e devem ser revisadas pela equipe médica.
- `src/content/guides.ts:15` — [validar] Roteiro leigo "só compressões" é prática padrão (AHA) para orientação por telefone; os protocolos de campo (BC5) descrevem a RCP da equipe (30:2).
- `src/content/guides.ts:44` — [validar] Adulto consciente: manobra abdominal (BC3). O protocolo do serviço não cita golpes nas costas em adulto/criança (só em bebê, BPed4); outras diretrizes (ex.: europeias) incluem 5 golpes nas costas antes das comp
- `src/content/guides.ts:119` — [validar] Inconsciente: compressões já (BC3/BC5); olhar a boca e tirar só o que estiver visível, nunca varredura às cegas (BPed3).
- `src/content/guides.ts:208` — [validar] Elevar as pernas em hemorragia: prática de primeiros socorros, sem texto no protocolo de campo (BC11/BT4 só falam em controlar o sangramento e aquecer).
- `src/content/guides.ts:335` — [validar] Protocolo de campo (BC23/AC33/BPed18): afastar a causa, deitar de costas com as pernas elevadas, NÃO deixar sentar nem levantar de repente;
- `src/content/guides.ts:469` — [validar] BC16/AC26: proteger a cabeça, anotar duração, não conter. "Nada na boca" e "virar de lado" são primeiros socorros padrão, não estão escritos literalmente nas páginas.
- `src/content/guides.ts:505` — [validar] Capacete: a equipe decide retirar (BP21); não há orientação escrita para leigo. "Não tirar" e "virar em bloco só se vomitar" seguem primeiros socorros padrão.
- `src/content/guides.ts:540` — [validar] Inconsciente: nada pela boca, de lado (BC19/AC29: o tratamento é glicose na veia, pela equipe). Açúcar só se acordado e engolindo é primeiros socorros padrão (única menção oral: APed24).
- `src/content/guides.ts:612` — [validar] Choque elétrico não tem página de campo: "desligar a fonte antes de tocar" é segurança de cena (PE1/BP16), não texto de protocolo.
- `src/content/simone/days14_20.ts:419` — { who: 'NARRADOR', t: 'Sessenta dias, disse o médico da clínica. Faz nove.', when: is.flag('raiox') }, // [validar]
- `src/content/simone/days14_20.ts:492` — { who: 'NARRADOR', t: 'A dor de cabeça é de ontem. Hoje tem uns pontinhos brilhando no canto do olho.', when: () => c.v('pressao') >= 6 }, // [validar]
- `src/content/simone/days14_20.ts:543` — { who: 'NARRADOR', t: 'Senta de novo. Abre uma ficha nova, por hábito, e digita: "Mulher, 51 anos. Dor de cabeça forte desde ontem. Vista embaçada. Hipertensa."' }, // [validar]
- `src/content/simone/days14_20.ts:545` — { who: 'NARRADOR', t: '{O} {dr} Moura levanta da Mesa 1, mede a pressão dela com o aparelho da gaveta, olha o FAST, e regula em voz alta: "USB, sentada, pra UPA."' }, // [validar]
- `src/content/simone/days14_20.ts:569` — { who: 'NARRADOR', t: 'Dor de cabeça desde ontem. Pontinhos brilhando no canto do olho. Ela sabe o nome disso. Ela ensina o nome disso por telefone.' }, // [validar]
- `src/content/simone/days14_20.ts:607` — { who: 'NARRADOR', t: '14:30. No meio de uma ligação, a Simone tira o fone, devagar, e vomita no lixo de papel.' }, // [validar]
- `src/content/simone/days14_20.ts:628` — { who: 'NARRADOR', t: '19:30. UPA Norte. Soro no braço, a pressão descendo: dezesseis por dez.' }, // [validar]
- `src/content/simone/days14_20.ts:653` — { id: 'remedios_upa', label: 'Remédios da UPA (o que faltava no posto)', amount: 30, when: is.flag('sd17_crise'), desc: 'Pra dor de cabeça e pro estômago, até a Farmácia Popular abrir.', onSkip: fx.add('pressao', 1, 'sem
- `src/content/simone/days14_20.ts:959` — { who: 'NARRADOR', t: 'Não está. Do jeito que a voz chega, não está.' }, // [validar]
- `src/content/simone/days14_20.ts:1065` — { label: '"Dona Iolanda, é a Simone, da central. Deita ele de costas no chão. Eu vou passar pr{o} {dr}, que vai te ensinar a massagem."', next: 'falou', effect: fx.all(custaTMA('d20_final', 2), fx.set('sd20_falou')) }, /
- `src/content/simone/days1_7.ts:560` — { who: 'NARRADOR', t: 'A viatura chegou, mas a ferida ficou aberta tempo demais. O ortopedista fala em antibiótico forte e internação comprida.' }, // [validar]
- `src/content/simone/days1_7.ts:566` — { who: 'NARRADOR', t: 'O ortopedista olha a ferida e não diz nada por um tempo. Depois diz: "Demorou."' }, // [validar]
- `src/content/simone/days1_7.ts:599` — { who: 'NARRADOR', t: '23:10. Cadeira de plástico no corredor da ortopedia. O Wesley saiu da cirurgia às dez: pino na tíbia, antibiótico na veia, a perna pra cima.' }, // [validar]
- `src/content/simone/days1_7.ts:600` — { who: 'NARRADOR', t: 'O ortopedista disse "noventa dias sem moto" e "antibiótico até quarta". Ferida que demorou: mais cuidado ainda.', when: () => ['tarde', 'dispensado'].includes(wesleyFim(c)) }, // [validar]
- `src/content/simone/days1_7.ts:602` — { who: 'NARRADOR', t: 'Três parcelas pagas. Faltam trinta e três. Noventa dias sem moto, disse o ortopedista.' }, // [validar]
- `src/content/simone/days8_13.ts:33` — { who: 'NARRADOR', t: 'Receita nova, de um ano. Na Farmácia Popular, sai de graça. Ela guarda a receita dentro do crachá, atrás da foto.' }, // [validar] programa Farmácia Popular: anti-hipertensivo gratuito com receita 
- `src/content/simone/days8_13.ts:54` — else lines.push({ who: 'NARRADOR', t: 'O Wesley ficou no Regional. Antibiótico na veia até quarta, disse a enfermeira.' }); // [validar]
- `src/content/simone/days8_13.ts:114` — desc: 'O que a farmácia do hospital não tinha: antibiótico e analgésico pra casa.', // [validar]
- `src/content/simone/days8_13.ts:123` — { who: 'NARRADOR', t: 'O Wesley vai ficar no Regional até quarta, pra terminar o antibiótico na veia. Na alta, uma receita: o que o hospital não tem, a família compra.' }, // [validar]
- `src/content/simone/days8_13.ts:198` — { who: 'SIMONE', t: '{conj}, é a Simone, da central. Senta ele inclinado pra frente. Afrouxa a roupa. Não deita ele. Eu tô passando agora.' }, // [validar]
- `src/content/simone/days8_13.ts:288` — bills: contas({ id: 'curativo', label: 'Gaze, soro e esparadrapo', amount: 24, desc: 'Pro curativo da perna do Wesley, duas vezes por dia.', onSkip: fx.all(fx.set('curativo_improvisado'), fx.add('wesley', -1, 'curativo d
- `src/content/simone/days8_13.ts:316` — { who: 'NARRADOR', t: 'Mão lavada, luva, soro, gaze, de dentro pra fora. Ele faz careta e presta atenção. Na segunda vez, faz sozinho. Torto, mas sozinho.' }, // [validar]
- `src/content/simone/days8_13.ts:355` — { who: 'NARRADOR', t: 'O termômetro que era da avó marca trinta e oito e meio. Dor atrás dos olhos, dor no corpo inteiro. A perna, quieta.' }, // [validar]
- `src/content/simone/days8_13.ts:360` — { label: 'Soro, dipirona e água. Nada de anti-inflamatório. E vigiar.', next: 'vigiar', effect: fx.all(fx.set('dengue_cuidou'), fx.add('wesley', 1, 'cuidou'), fx.add('desgaste', 3, 'acordou de hora em hora')) }, // [vali
- `src/content/simone/days8_13.ts:367` — { who: 'NARRADOR', t: 'Ela escreve num papel e prende na geladeira: DOR NA BARRIGA, VÔMITO, SANGRAMENTO, TONTURA = ME LIGA.' }, // [validar] sinais de alarme da dengue
- `src/content/simone/days8_13.ts:373` — { who: 'NARRADOR', t: 'UPA Norte com quatro horas de espera. Às duas da manhã, a médica diz o que ela já sabia: dengue, sem sinal de alarme, soro e repouso.' }, // [validar]
- `src/content/simone/days8_13.ts:405` — }, // [validar] fase crítica da dengue após a defervescência
- `src/content/simone/days8_13.ts:456` — { who: 'SIMONE', t: 'Soro. Um copo agora e um a cada hora. Qualquer coisa daquele papel da geladeira, me liga.' }, // [validar]
- `src/content/simone/days8_13.ts:488` — { who: 'NARRADOR', t: 'Febre que some. Sangramento. Tontura. Pele fria. A página 11 do manual inteira, na voz da vizinha.' }, // [validar]
- `src/content/simone/days8_13.ts:545` — bills: contas({ id: 'dengue_wesley', label: 'Dengue do Wesley: soro, dipirona, repelente', amount: 32, desc: 'Nada de anti-inflamatório, disse a moça da farmácia.', onSkip: fx.all(fx.add('wesley', -1, 'sem soro'), fx.add
- `src/content/simone/days8_13.ts:810` — { who: 'NARRADOR', t: 'O ortopedista do SUS marcou o retorno do Wesley pra maio. A clínica popular da Av. Sul faz o raio-X amanhã cedo por oitenta e cinco.' }, // [validar]
- `src/content/simone/days8_13.ts:812` — { who: 'NARRADOR', t: 'O curativo de hoje foi com as amostras da Graça. A ferida está seca, rosada nas bordas.' }, // [validar]
- `src/content/simone/days8_13.ts:823` — { who: 'NARRADOR', t: 'No raio-X, o osso ainda é dois, com um pino no meio. O médico da clínica fala devagar, olhando pro Wesley: "Sessenta dias sem moto. No mínimo."' }, // [validar]
- `src/content/simone/endings.ts:194` — out.push('Em abril, numa terça de manhã, a vista apaga pela metade no meio de uma ligação. Desta vez, quem regula é ela mesma, em voz alta, antes de cair: "Mulher, cinquenta e um anos."'); // [validar]
- `src/content/simone/endings.ts:206` — out.push(`Numa noite de ${mes}, a Dona Cida escorrega no banheiro da casa amarela. A Simone ajoelha no chão molhado, firma a cabeça dela com as duas mãos, sem deixar mexer, e liga pra emergência no viva-voz.`); // [valid
- `src/content/simone/endings.ts:209` — else out.push(`Numa noite de ${mes}, na volta do mercado, um senhor cai na calçada da vila. A Simone ajoelha do lado dele, olha se o peito sobe e liga pra emergência.`); // [validar]
- `src/content/simone/endings.ts:277` — 'A Simone passa onze dias no Regional. Volta pra casa devagar, segurando no braço do filho.', // [validar]
- `src/content/simone/util.ts:103` — [validar] correspondência entre a escala de pressão do jogo (0–10) e a leitura
- `src/content/simone/util.ts:129` — [validar] sinais de alarme de pressão muito alta (dor de nuca, visão turva)

---
Gerado em 2026-10-16. Horários em formato de jogo; 07:00 é o início do plantão.
