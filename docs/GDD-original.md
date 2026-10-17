Roteiro e mecânicas para jogo de simulação estilo SAMU pedido

Partilhar

imagine um jogo estilo papers please. porem, voce é da regulaçao do SAMU. com base nas informaçoes que recebe na ligaçao, tem que definir se deve ou nao enviar uma ambulancia de suporte avançado, ou uma basica ou nenhuma. tem que perceber se a pessoa esta mentindo e se ela se , trote ou se ela se enquadra de fato como emergencia. enviando uma ambulancia, se for uma escolha errada, leva uma advertencia. tres adivertencias em um dia de trabalho gera demissao e da game over. sao 20 dias no total. quando a abulancia chega, se nao for uma escolha errada(se realmente for um paciente que precisa daquela ambulancia), voce recebe um bonus alem do valor fixo do seu plantao. tem que administrr seu dinheiro para pagar por aluguel, alimentaçao, energia, etc. voce tem uma familia e entre os plantoes, ocorre uma historia com sua familia. pode ter tres finais. um ruim, um normal e um bom. agora, pense muito sobre isso e me entregue todo um roteiro, especificaoes, gameplay, mecanicas, etc para esse jogo.

**192: PLANTÃO**

*"Cada segundo é uma escolha. Cada escolha tem um nome."*

Documento de design completo. Inclui conceito, mecânicas, economia, narrativa, roteiro dos 20 dias, exemplos de chamadas e finais.

**1. Visão geral**

**Gênero:** simulação de decisões sob pressão com dilema moral, no estilo *Papers, Please*. **Plataforma:** PC (mouse e teclado). Depois dá para portar para tablet, porque a interface é feita de cliques e arrastos. **Duração:** de 5 a 8 horas na primeira campanha. Cada plantão leva de 10 a 15 minutos reais. **Tom:** realista, tenso e humano, com humor seco aqui e ali. A crítica social está presente, mas o jogo não faz sermão. **Ambientação:** Santa Aurora, cidade fictícia de uns 300 mil habitantes no interior do Brasil. A Central de Regulação do SAMU 192 é administrada por uma Organização Social terceirizada, a "Saúde+ Gestão", que corta custos o tempo todo.

**Pilares de design:**

1.  **Informação imperfeita.** Ninguém diz a verdade inteira. Uns mentem, outros exageram, outros minimizam, e muitos simplesmente não sabem.

2.  **Recurso escasso.** Cada ambulância enviada deixa de estar disponível para a próxima ligação, e o erro de agora pode matar alguém daqui a vinte minutos.

3.  **Trabalho e casa se contaminam.** O dinheiro do plantão sustenta a família, e o cansaço que vem de casa piora o desempenho no plantão.

4.  **Consequência atrasada.** Você só descobre se acertou quando a ambulância chega e a equipe fala no rádio.

**2. Premissa e personagens**

**Protagonista: Dr. Rafael Moura (ou Dra. Rafaela Moura, à escolha do jogador), 29 anos.** Médico recém-formado, com a dívida do FIES nas costas. Aceitou um contrato precário de médico regulador porque era a única vaga com pagamento imediato. Mora de aluguel numa casa pequena no bairro Vila Esperança.

**A família:**

- **Lúcia, 31 anos, esposa.** Era costureira e perdeu o emprego quando a confecção fechou. É inteligente, prática e orgulhosa. Quer voltar a trabalhar por conta própria.

- **Davi, 8 anos, filho.** Tem asma moderada, gosta de desenhar ambulâncias e acha que o pai "salva gente pelo telefone".

- **Dona Zélia, 66 anos, mãe do protagonista.** Diabética e insulinodependente, mora com eles. Tem um humor ácido e esconde quando está passando mal para não dar despesa.

**No trabalho:**

- **Dr. Peixoto, coordenador da central.** Burocrata que vive de metas e cobra economia de viaturas. Ele mesmo não é exatamente vilão: também está sendo pressionado de cima.

- **Simone, TARM (técnica auxiliar de regulação médica).** Atende primeiro e passa a ligação para você. Veterana, cínica e leal. Às vezes deixa dicas num post-it.

- **Seu Bené, condutor da USA 01.** Faz os relatos pelo rádio. É ele quem dá a voz às consequências das suas decisões.

- **Vereador Arlindo Matos.** Político local que trata a central como serviço particular.

- **Carla Nunes, jornalista.** Está investigando mortes por demora no atendimento em Santa Aurora.

**Personagens recorrentes nas ligações:**

- **Dona Cida, 79 anos.** Viúva e solitária, liga em quase todo plantão por motivos pequenos.

- **"O número 9-8877".** Um adolescente, o Biel, que passa trote com frequência.

**3. Loop principal**

O ciclo se repete 20 vezes:

1.  **Manhã de plantão (07:00 às 19:00, em tempo comprimido):** as ligações chegam, você investiga, decide e administra a frota.

2.  **Fim do plantão:** relatório do dia com acertos, advertências, óbitos, bônus e notícias.

3.  **Em casa (interlúdio):** você paga as contas, acompanha um evento da família e toma decisões pessoais.

4.  **Jornal da manhã:** manchete do dia, regra nova da central e o próximo plantão.

**4. A tela da central**

A interface imita uma estação real de regulação, um pouco gasta.

**Lado esquerdo, painel de chamada:** o telefone, com a fila de ligações piscando, e a transcrição da conversa em tempo real. Embaixo ficam os botões de pergunta. O número de quem liga aparece no topo. Ruídos de fundo surgem como legendas em itálico, por exemplo *\[risadas abafadas\]*, *\[TV alta\]* ou *\[respiração ofegante\]*.

**Centro, mapa de Santa Aurora:** mostra bairros, ruas com numeração, as bases das ambulâncias (Centro, Norte e Vila Esperança), os hospitais e as viaturas se movendo em tempo real. Clicar num endereço mostra se ele existe e qual o tempo estimado de chegada.

**Lado direito, ficha de regulação:** é onde você registra classificação (vermelho, amarelo, verde ou azul), recurso (USA, USB, orientação ou trote), apoio (Polícia ou Bombeiros) e, a partir do dia 9, o hospital de destino. Por fim, um carimbo físico de "REGULADO".

**Parte de baixo, rádio:** as mensagens das equipes chegam aqui, com o status de cada viatura ("QRV", disponível; "em deslocamento"; "no local"; "em retorno").

**Mesa (elementos físicos):**

- **Manual de Regulação:** um livreto que ganha páginas novas a cada poucos dias. É o equivalente ao livro de regras do *Papers, Please*.

- **Quadro de cortiça:** lista de números de trote, frequentadores conhecidos e post-its que o próprio jogador pode escrever.

- **Copo de café:** um medidor visual de cansaço (ver "Desgaste").

- **Foto da família:** clicar nela pausa o jogo por um segundo e recupera um pouco de foco, mas só pode ser usado uma vez por plantão.

**5. Mecânica das ligações**

**5.1 Fluxo de uma chamada**

1.  A ligação toca e a fila cresce. Ligações esperando há muito tempo ficam vermelhas.

2.  Você atende. A pessoa faz um primeiro relato espontâneo.

3.  Você faz perguntas. Cada uma consome tempo do relógio do plantão.

4.  Você cruza as informações com o mapa, o manual e o quadro.

5.  Preenche a ficha e carimba.

6.  Minutos depois (no relógio do jogo), o rádio traz o resultado.

**5.2 Banco de perguntas**

As perguntas são liberadas aos poucos. Cada uma custa entre 5 e 20 segundos do relógio comprimido.

| **Pergunta**                            | **O que revela**                                         |
|-----------------------------------------|----------------------------------------------------------|
| "O que aconteceu?"                      | O relato base                                            |
| "Está acordado? Responde quando chama?" | Nível de consciência                                     |
| "Está respirando normalmente?"          | Via aérea e respiração                                   |
| "Qual a idade?"                         | Fator de risco                                           |
| "Desde que horas?"                      | Tempo de início, decisivo em AVC e infarto               |
| "Tem sangramento? Muito ou pouco?"      | Hemorragia                                               |
| "Tem alguma doença? Toma remédio?"      | Histórico                                                |
| "Posso falar com o paciente?"           | Testa a história diretamente                             |
| "Qual o ponto de referência?"           | Confirma o endereço                                      |
| "O local está seguro?"                  | Cena com violência                                       |
| **Ligar de volta** (ferramenta)         | Desmascara trote com número falso, mas custa 30 segundos |

Perguntas específicas vão sendo liberadas pelo manual, como o teste FAST para AVC (rosto, braço e fala) ou as perguntas sobre gestação.

**5.3 Modo Inconsistência**

Esse é o coração do jogo. Ao apertar a tecla **TAB**, você entra no modo de inspeção e pode ligar duas informações entre si:

- duas falas da transcrição;

- uma fala e o mapa (a pessoa disse "Rua das Palmeiras, 4000", mas a rua termina no 820);

- uma fala e o quadro (o número consta na lista de trotes);

- uma fala e um ruído de fundo ("ele está desacordado" contra *\[voz masculina ao fundo: "fala que eu tô morrendo!"\]*);

- uma fala e o manual (o sintoma descrito não combina com o quadro alegado).

Se as duas coisas realmente se contradizem, aparece um destaque vermelho e uma pergunta nova fica disponível para confrontar a pessoa ("O senhor disse que ele não acorda, mas estou ouvindo ele falar."). Se você ligar coisas que não se contradizem, perde tempo e a pessoa fica irritada ou desliga.

**5.4 Decisões possíveis**

| **Decisão**                                                | **Quando é correta**                                                                                                                        |
|------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| **USA (Suporte Avançado):** médico, enfermeiro e condutor  | Risco imediato de morte (vermelho): parada cardíaca, inconsciência, infarto, AVC dentro da janela de tempo, trauma grave, falta de ar grave |
| **USB (Suporte Básico):** técnico de enfermagem e condutor | Urgência sem risco imediato (amarelo): fraturas, queda de idoso, convulsão que já passou, trabalho de parto                                 |
| **Orientação (nenhuma ambulância)**                        | Casos leves (verde ou azul): orientar procurar UPA ou UBS, orientações por telefone                                                         |
| **Trote**                                                  | Ligação falsa. O número vai para o quadro                                                                                                   |
| **Apoio da PM ou dos Bombeiros**                           | Complemento obrigatório em cenas inseguras, resgate, enchente etc.                                                                          |

**5.5 Feedback pelo rádio**

A ambulância chega e a equipe relata o que encontrou. É aí que o jogador descobre o resultado:

*"Central, USA 01 no local. Paciente com entorse de tornozelo, deambulando. Vamos liberar. Precisava da gente aqui, doutor?"* (Advertência por excesso)

*"Central, USB 03. Paciente em parada. Precisamos de apoio avançado urgente!"* (Advertência por subestimar, com risco de óbito)

*"Central, USA 02. Paciente com supra de ST no eletro. Chegamos a tempo. Bom trabalho."* (Bônus)

**6. Frota e tempo**

**Frota inicial:** 3 USA e 5 USB. No dia 5 há corte de verba e passam a ser 2 USA e 4 USB.

Cada viatura enviada fica de 40 a 120 minutos fora (no relógio do jogo), entre ida, atendimento, transporte e retorno. A distância no mapa conta. Mandar a única USA livre do Norte para o extremo Sul deixa o Norte descoberto.

**Fila e tempo de espera:** casos graves pioram enquanto esperam. Uma parada cardíaca atendida em 8 minutos tem boa chance. A mesma parada atendida em 20 minutos quase sempre vira óbito. Um óbito por demora gera advertência se tiver sido causado por má gestão: por exemplo, você gastou uma USA num caso leve e por isso faltou viatura. Se não houve erro seu, não há advertência, mas o custo emocional continua.

**Óbitos inevitáveis:** algumas pessoas morrem mesmo com a decisão certa. Não há advertência, mas o Desgaste sobe. O jogo precisa ensinar que fazer tudo certo não garante salvar todo mundo.

**7. Advertências e demissão**

| **Erro**                                         | **Penalidade**                                                      |
|--------------------------------------------------|---------------------------------------------------------------------|
| USA para caso básico ou leve                     | 1 advertência                                                       |
| USB para caso que precisava de USA               | 1 advertência (e risco de óbito)                                    |
| Ambulância enviada para trote                    | 1 advertência                                                       |
| Emergência real tratada como orientação ou trote | 1 advertência e abertura de sindicância, com consequência narrativa |
| Cena insegura sem acionar a PM (equipe agredida) | 1 advertência                                                       |
| Hospital de destino errado (a partir do dia 9)   | 1 advertência                                                       |

Cada advertência também gera um desconto de R\$ 20 no pagamento. **Três advertências no mesmo plantão resultam em demissão e game over.** O contador zera a cada dia, mas o total acumulado fica registrado e pesa no final (ver seção 12).

**8. Tipos de quem liga**

O jogador aprende a reconhecer padrões. Os padrões foram feitos para serem quebrados de vez em quando.

1.  **Trotista.** Relato exagerado ou cinematográfico, risadas ao fundo, endereço inexistente, número já marcado no quadro. A partir do dia 10, os trotistas ficam mais espertos: usam endereços reais e vozes convincentes.

2.  **Exagerador.** O caso é real, mas leve. A pessoa diz "tá morrendo" para que a ambulância chegue mais rápido ou para usar a viatura como táxi até o hospital.

3.  **Minimizador.** O caso é grave, mas a pessoa não quer incomodar. É o perfil típico de idosos e homens de meia-idade. É o tipo mais perigoso.

4.  **Testemunha confusa.** Está em pânico, dá informações desencontradas e não sabe o endereço. Exige paciência e perguntas de referência.

5.  **Criança.** Pode ser trote. Pode ser a mãe desmaiada. O manual pede que você peça para falar com um adulto, mas e quando não há adulto consciente?

6.  **Frequentador.** Liga sempre. Em 95% das vezes é solidão, e na vez que importa é grave.

7.  **Embriagado ou agressivo.** Ofende, ameaça, mas às vezes está de fato ferido.

8.  **Profissional.** Policial, bombeiro ou enfermeira de UBS. Fala de forma objetiva e confiável. Às vezes pressiona por um recurso que não é necessário.

9.  **Pedido disfarçado.** A pessoa "pede uma pizza" ou fala de forma estranha porque o agressor está ouvindo.

10. **VIP.** Gente influente que exige privilégio.

**9. Economia**

**9.1 Receitas**

| **Fonte**                                                      | **Valor**              |
|----------------------------------------------------------------|------------------------|
| Valor fixo do plantão                                          | R\$ 260                |
| USA correta (confirmada pelo rádio)                            | +R\$ 25                |
| USB correta                                                    | +R\$ 15                |
| Orientação correta (auditoria do fim do dia)                   | +R\$ 5                 |
| Trote identificado                                             | +R\$ 10                |
| "Hora de ouro": caso vermelho regulado em menos de 60 segundos | +R\$ 10                |
| Bico extra numa UPA (opção no interlúdio)                      | +R\$ 150               |
| Ateliê da Lúcia (se a máquina de costura for comprada)         | +R\$ 40 por interlúdio |

**9.2 Despesas por interlúdio**

Cada interlúdio representa a folga de 36 horas.

| **Despesa**            | **Valor** | **Se não pagar**                                                                                          |
|------------------------|-----------|-----------------------------------------------------------------------------------------------------------|
| Transporte             | R\$ 20    | Desconto automático                                                                                       |
| Aluguel                | R\$ 100   | Acumula. 3 atrasos levam ao despejo                                                                       |
| Alimentação            | R\$ 80    | A família fica "Com fome". Dois interlúdios seguidos deixam alguém "Doente"                               |
| Energia                | R\$ 30    | Primeiro vem um aviso. Na segunda vez, corte: a insulina da Dona Zélia estraga e a religação custa R\$ 60 |
| Gás                    | R\$ 15    | Comida fria, os Laços Familiares caem                                                                     |
| Remédios da Dona Zélia | R\$ 35    | Ela piora. Dois interlúdios seguidos levam à internação                                                   |

**Total base:** R\$ 280. O plantão sozinho (R\$ 260) não cobre as despesas. É preciso acertar para sobreviver, e esse é o ponto central da economia.

**Saldo inicial:** R\$ 150.

**9.3 Despesas de eventos**

| **Evento**                                                 | **Valor** |
|------------------------------------------------------------|-----------|
| Bombinha e espaçador do Davi                               | R\$ 80    |
| Conserto da geladeira (ou isopor com gelo, R\$ 10 por dia) | R\$ 350   |
| Máquina de costura usada                                   | R\$ 450   |
| Aniversário do Davi                                        | R\$ 60    |
| Curativo especial para o pé da Dona Zélia                  | R\$ 90    |
| Conta de água atrasada do antigo inquilino                 | R\$ 70    |

**10. A vida em casa**

**10.1 A tela**

O interlúdio mostra uma ilustração da casa em pixel art. Os membros da família aparecem com ícones de estado: Bem, Com fome, Com frio, Doente, Triste, Crítico.

O jogador tem três tipos de ação:

1.  **Pagar contas,** marcando as despesas que quer quitar.

2.  **Acompanhar o evento do dia,** uma cena curta de diálogo com escolhas.

3.  **Escolher como usar a folga,** com uma única opção por interlúdio:

    - **Descansar:** Desgaste −15.

    - **Ficar com a família:** Laços +1 e Desgaste −10.

    - **Fazer um bico:** +R\$ 150, Desgaste +20, e você perde o evento familiar, que se resolve sem você e quase sempre de um jeito pior.

**10.2 Variáveis escondidas**

| **Variável**               | **Faixa** | **O que influencia**                                                                                                                                                |
|----------------------------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Desgaste**               | 0 a 100   | Acima de 60, o texto da transcrição treme. Acima de 80, surgem toques fantasmas na fila e o Modo Inconsistência fica mais lento. Chegar a 100 é colapso e game over |
| **Laços Familiares**       | 0 a 10    | Abaixo de 3, a Lúcia vai embora com o Davi                                                                                                                          |
| **Integridade**            | 0 a 10    | Cai com propina, fraude na ficha e privilégio ao VIP                                                                                                                |
| **Humanidade**             | 0 a 10    | Sobe quando você conversa com a Dona Cida, acalma quem liga, faz o luto de um paciente. Muda falas e o epílogo                                                      |
| **Pacientes-chave salvos** | 0 a 5     | Seu Antônio, Davi, a Dona Cida, o avô do Biel, as vítimas do show                                                                                                   |

O Desgaste sobe 5 pontos por plantão, 10 por óbito, 3 por advertência, e um pouco a cada vez que você ignora a foto da família.

**11. Manual de Regulação: as regras se acumulam**

| **Dia** | **Página nova**                                                                                                 |
|---------|-----------------------------------------------------------------------------------------------------------------|
| 1       | Classificação básica (vermelho, amarelo, verde e azul) e os critérios de USA e USB                              |
| 2       | Protocolo de trote: lista de números e a ferramenta "Ligar de volta"                                            |
| 3       | Dor no peito: mais de 40 anos, com suor frio e dor irradiada, é USA                                             |
| 4       | Cena insegura: violência em andamento exige PM antes da ambulância                                              |
| 5       | Corte de frota: passam a ser 2 USA e 4 USB                                                                      |
| 6       | AVC: teste FAST e janela de 4 horas e meia desde o início dos sintomas                                          |
| 7       | Obstetrícia: parto em período expulsivo vai de USB. Sangramento com convulsão ou pressão alta vai de USA        |
| 9       | **Destino hospitalar:** Hospital Regional (trauma e casos graves), UPA Norte (moderados), Maternidade Municipal |
| 11      | Epidemia de dengue: sinais de alarme (dor abdominal intensa, sangramento, vômitos persistentes)                 |
| 12      | Saúde mental: crise com risco tem USB e PM como apoio, mais acolhimento por telefone                            |
| 13      | Intoxicação em crianças: orientação imediata enquanto a viatura se desloca                                      |
| 15      | Múltiplas vítimas: triagem por cores e limite de viaturas por evento                                            |
| 17      | Chuvas: ruas alagadas no mapa e apoio obrigatório dos Bombeiros                                                 |
| 19      | Hospital Regional sem vaga: é preciso ligar e negociar "vaga zero"                                              |

**12. Roteiro dos 20 dias**

Formato: **\[regra nova\] · ligações-chave · em casa.**

**Dia 1. "Primeiro Plantão".** Tutorial guiado pela Simone. Dona Cida liga pela primeira vez porque a pressão está "14 por 9" e ela quer conversar sobre a novela. Também chega uma queda de idoso e o primeiro trote óbvio, com rua inexistente e risadas ao fundo. *Em casa:* a família comemora o novo emprego com bolo de fubá. Dona Zélia diz: "Médico do telefone, hein? Pelo menos não pega gripe."

**Dia 2. "O Quadro".** O número do Biel aparece pela primeira vez: ele diz que tem "um cara esfaqueado" em frente à escola, num horário em que a escola está fechada. *Em casa:* chega uma conta de água de R\$ 70 deixada pelo antigo inquilino. Pagar ou brigar com o proprietário? Se você brigar, a relação com ele piora e, no dia 14, o aluguel sobe R\$ 10.

**Dia 3. "O Peito".** Seu Antônio, 58 anos, liga pedindo desculpas pelo incômodo: está com uma "queimação no estômago", suor frio e formigamento no braço esquerdo. Ele é o minimizador clássico e o **Paciente-chave 1**. *Em casa:* a bombinha do Davi acabou. Comprar custa R\$ 80. Se não comprar agora, o evento do dia 9 fica muito mais grave.

**Dia 4. "Cena Quente".** Um tiroteio em bar com o atirador ainda no local. Mandar a ambulância sem acionar a PM resulta em equipe agredida e advertência. *Em casa:* Lúcia conta que quer voltar a costurar e precisa de uma máquina de R\$ 450. "Não precisa ser agora... mas pensa."

**Dia 5. "Corte".** Dr. Peixoto anuncia o corte de frota e uma nova "meta": um bônus extra de R\$ 30 se o dia terminar com menos de 4 USA enviadas. Isso é uma tentação para subestimar casos. *Em casa:* Davi pergunta por que o pai chega "com cara de quem chorou".

**Dia 6. "O Lado do Rosto".** Uma senhora diz que o marido "acordou estranho, com a boca torta". O jogador precisa perguntar a hora de início. Se forem mais de 4 horas e meia, a decisão muda. *Em casa:* **a geladeira quebra.** O conserto custa R\$ 350. A outra saída é o isopor com gelo, a R\$ 10 por interlúdio. Se você não fizer nenhum dos dois, a insulina da Dona Zélia estraga.

**Dia 7. "O Vereador".** Arlindo Matos liga pessoalmente. A mãe dele, de 82 anos, está "fraquinha" e ele quer "a ambulância boa" para levá-la a exames. Ela está estável e o caso é de orientação. Na mesma hora, chega uma gestante com convulsão. *Em casa:* um assessor do vereador aparece na porta com um envelope de R\$ 1.000, "pela atenção". Aceitar custa Integridade −4. Recusar deixa o vereador como inimigo, e ele vai reclamar de você ao Dr. Peixoto.

**Dia 8. "A Apresentação".** O plantão é normal, com volume crescente. *Em casa:* é a apresentação do Davi na escola, onde ele vai ler uma redação sobre o pai. Se você fizer o bico desse interlúdio, perde a apresentação, e os Laços caem 2.

**Dia 9. "Linha Direta".** É o momento central do jogo. Chega uma ligação da sua própria casa: Lúcia, em pânico, diz que o Davi está em crise de asma. Ao mesmo tempo, na fila, um homem desconhecido descreve a esposa "roxa, sem conseguir respirar". Só há uma USA livre.

- Se você comprou a bombinha no dia 3, a crise do Davi é moderada e a decisão correta é USB. Mandar a USA para ele é usar o cargo em benefício próprio, e a outra paciente pode morrer.

- Se você não comprou, a crise é grave, a USA é a decisão correta para o Davi, e a esposa do desconhecido fica sem viatura avançada.

O jogo nunca diz qual é a escolha "moral". Simone, no fim do dia, comenta só: "Eu vi o número, doutor. Não vou falar nada." O Davi é o **Paciente-chave 2**.

**Dia 10. "Ninguém é Bobo".** Os trotistas evoluem: endereços reais, vozes calmas, histórias plausíveis. Ligar de volta passa a ser essencial. *Em casa:* com o susto do dia 9, a família discute dinheiro. Dona Zélia oferece vender a aliança do falecido marido (+R\$ 200, Laços −1, mas uma cena bonita entre mãe e filho).

**Dia 11. "Febre".** A dengue explode na cidade. São 30 ligações de febre, e a maioria é verde. No meio delas estão três casos com sinais de alarme. É um teste de atenção dentro do volume. *Em casa:* a Lúcia começa a costurar para fora, se a máquina já tiver sido comprada.

**Dia 12. "Do Outro Lado da Linha".** Uma pessoa jovem liga em crise emocional. O jogador escolhe falas de acolhimento enquanto a equipe se desloca. A cena é tratada com cuidado, sem detalhar métodos, com foco em escuta e apoio. *Em casa:* Lúcia pergunta: "Você ainda tá aqui com a gente, ou tá lá na central?" Se os Laços estiverem abaixo de 5, ela começa a cogitar passar um tempo na casa da irmã.

**Dia 13. "Produto de Limpeza".** Uma criança engoliu soda cáustica. O manual pede orientação imediata por telefone, como não provocar vômito, enquanto a viatura vai. *Em casa:* o pé da Dona Zélia está com uma ferida que ela vinha escondendo. O curativo custa R\$ 90. Se não tratar, no dia 16 ela é internada.

**Dia 14. "Carla".** A jornalista Carla Nunes liga para a central se passando por paciente, para testar o tempo de resposta. Há um jeito de perceber: ela faz perguntas demais. *Em casa:* Carla aparece na sua porta pedindo um depoimento anônimo sobre as condições da central. Você aceita, recusa ou adia.

**Dia 15. "O Show".** Há um show sertanejo no Parque de Exposições e acontece um tumulto na saída: 14 vítimas. Pela regra de múltiplas vítimas, você precisa distribuir a frota toda enquanto a cidade continua ligando. As **vítimas do show são o Paciente-chave 4**: a meta é que nenhuma vítima vermelha morra. *Em casa:* aniversário do Davi, com bolo por R\$ 60. Ele pede de presente "um dia inteiro com o pai".

**Dia 16. "O Menino que Gritava Lobo".** O número 9-8877, do Biel, liga mais uma vez. A voz é a mesma, mas agora ele está chorando: "Meu vô caiu no banheiro e não acorda, juro, juro que não é brincadeira." Não há risadas ao fundo, só o som de um chuveiro aberto. O Modo Inconsistência não encontra nenhuma contradição. O avô dele é o **Paciente-chave 3**. *Em casa:* consequências da ferida da Dona Zélia, ou alívio, se ela foi tratada.

**Dia 17. "Água".** Chuvas fortes alagam ruas no mapa. As ambulâncias precisam de rotas alternativas e algumas ocorrências exigem os Bombeiros. *Em casa:* goteiras. O proprietário cobra o aluguel atrasado, se houver.

**Dia 18. "Escândalo".** Carla publica a matéria. Se você aceitou a propina, seu nome aparece. Se deu o depoimento, a central fica sob investigação e o Dr. Peixoto fica furioso, mas recebe ordem de reforçar a frota (+1 USA a partir do dia 19). Se não fez nada, a matéria sai mais fraca e nada muda. *Em casa:* o clima reflete as escolhas anteriores.

**Dia 19. "Dona Cida".** No fim do plantão, Dona Cida liga. Ela está diferente: fala devagar e enrolado e não menciona a novela. Diz que "o braço está meio bobo, mas não é nada não, meu filho, só queria ouvir uma voz". Ela é o **Paciente-chave 5**. O jogador que passou 18 dias tratando a Dona Cida como incômodo vai ter o reflexo de dispensá-la. O jogador que conversou com ela reconhece a diferença na voz. *Em casa:* a véspera do último dia. A família se senta junta, com ou sem comida na mesa.

**Dia 20. "Último Plantão".** É o dia de maior volume, com hospital sem vaga e todas as regras ativas ao mesmo tempo. A última ligação do jogo é uma parada cardíaca às 18:58, dois minutos antes da troca de turno, e o colega do próximo plantão ainda não chegou. Depois dela, o jogo segue para o final correspondente.

**13. Exemplos de chamadas completas**

**Chamada A: Trote (Dia 2)**

**Número:** (xx) 9-8877. *\[risadas abafadas\]* "Alô, SAMU? Tem um cara esfaqueado aqui na frente da Escola Estadual, tá jorrando sangue, manda rápido!" **Pistas:** horário 23:40 com a escola fechada · o número consta no quadro (a partir do dia 3) · "Ligar de volta" dá caixa postal com voz de adolescente · a pergunta "Ele está consciente?" é respondida com "Tá... não, tá morto, tá morto!" **Verdade:** trote. **Correto:** TROTE (+R\$ 10).

**Chamada B: Minimizador (Dia 3, Paciente-chave 1)**

"Boa tarde, doutor, desculpa incomodar... é que eu tô com uma queimação aqui no estômago, deve ser o feijão. Minha mulher que mandou ligar." **Se perguntar mais:** 58 anos · começou há 40 minutos · "tô suando um pouco, mas tá calor" · "o braço tá formigando, mas eu dormi em cima dele" · hipertenso, "parei o remédio". **Inconsistências:** "deve ser o feijão" contra suor e braço formigando, cruzados com a página de dor no peito do manual. **Verdade:** infarto. **Correto:** USA, Vermelho. Rádio: *"Supra de ST, chegamos a tempo."*

**Chamada C: Exagerador (Dia 4)**

"Minha esposa tá MORRENDO, pelo amor de Deus, manda a ambulância!" **Se perguntar:** "Ela tá vomitando desde ontem." · consciente? "Tá, tá falando." · "Posso falar com ela?" e a esposa responde: *"Tô enjoada, amor, fala que é só pra levar a gente na UPA, o carro tá sem gasolina."* **Verdade:** caso leve, a viatura seria usada como táxi. **Correto:** ORIENTAÇÃO, Verde. Mandar USB gera advertência.

**Chamada D: Criança (Dia 6)**

Voz de uma criança de uns 7 anos: "Moço... minha mãe não acorda. Ela tá no chão da cozinha." **Armadilha:** o manual diz para pedir um adulto, mas não há adulto em casa. **Se perguntar:** "Ela tá respirando? Põe a mão na barriga dela, sobe e desce?" e a resposta é "Sobe... devagarinho." · "Ela toma remédio?" e a resposta é "Toma injeção na barriga" (insulina) · *\[ao fundo: desenho animado na TV\]*. **Verdade:** hipoglicemia grave. **Correto:** USA, Vermelho. Classificar como trote por ser criança resulta em óbito, advertência e sindicância.

**Chamada E: Pedido disfarçado (Dia 8)**

Voz feminina, baixa: "Oi... queria pedir uma pizza grande, de calabresa, pra Rua Ipê, 112." **Pistas:** é o número do 192 · ela responde só "sim" ou "não" · *\[voz masculina ao fundo gritando\]* · a pergunta liberada é "Você está em perigo? Responda só sim ou não." e a resposta é "Sim, isso, calabresa." **Correto:** USB com apoio da PM. Tratar como trote gera advertência e um óbito noticiado no jornal do dia seguinte.

**Chamada F: VIP (Dia 7)**

"Aqui é o vereador Arlindo Matos. Minha mãe tá fraquinha e eu quero a ambulância boa, a UTI móvel, pra levar ela no Regional fazer uns exames. Você sabe com quem tá falando?" **Se pedir para falar com a paciente:** "Eu tô bem, meu filho, é ele que inventa." · sinais estáveis · ela está comendo normalmente. **Correto:** ORIENTAÇÃO. Ceder e mandar USA gera advertência, e na mesma hora a gestante com convulsão fica sem USA.

**Chamada G: Dona Cida, a virada (Dia 19, Paciente-chave 5)**

Nos dias 1 a 18, ela sempre começa assim: "Oi meu filho, é a Cida! Viu a novela?" No dia 19: "Oi... meu filho... é a... Cida." *\[pausa longa\]* "O braço tá... bobo. Não é nada não. Só queria ouvir uma voz." **Pistas:** fala lenta e arrastada (estilo de texto diferente na transcrição) · ela não menciona a novela · o post-it que o jogador escreveu talvez diga "Cida: só conversa", o que é a armadilha. **Se perguntar FAST:** "Sorri pra mim, Dona Cida?" e a resposta é "Tô sorrindo... acho." · início há 30 minutos. **Correto:** USA, Vermelho, AVC dentro da janela.

**14. Finais**

**Game overs (a qualquer momento)**

- **"Exonerado":** três advertências num plantão. Cena: você esvazia a gaveta, Simone tira o seu post-it do quadro sem dizer nada.

- **"Despejo":** três aluguéis atrasados. Cena: os móveis na calçada, o Davi segurando o desenho da ambulância.

- **"Colapso":** Desgaste chega a 100. Cena: o telefone toca, você não consegue atender, e a tela se apaga junto com o som do toque.

**Final RUIM: "Linha Ocupada"**

**Condição:** chegar ao dia 20 com qualquer um destes: um membro da família morto, Laços em 2 ou menos (Lúcia foi embora), ou Integridade em 2 ou menos (nome exposto no escândalo).

**Epílogo:** seis meses depois, você mora sozinho num quarto alugado e trabalha em outra central, em outra cidade. Uma noite, sentindo uma dor no peito, você liga para o 192. Ouve o toque, depois a voz cansada de um regulador novo, que pergunta "O que aconteceu?" num tom de quem já ouviu essa pergunta mil vezes. Tela preta. O jogo termina antes de você saber se ele vai acreditar em você.

**Final NORMAL: "A Gente Sobreviveu"**

**Condição:** chegar ao dia 20 sem cumprir nenhuma condição do final ruim nem todas as do final bom.

**Epílogo:** o contrato é renovado. Nada muda na central: mesma frota, mesmo Peixoto, mesmas metas. Em casa, as contas continuam apertadas, mas todos estão vivos. Na cozinha, Lúcia diz: "A gente sobreviveu, né?", e você não sabe se isso é um elogio ou um diagnóstico. A última imagem é o seu crachá pendurado no prego atrás da porta, pronto para o próximo plantão.

**Final BOM: "O Médico do Telefone"**

**Condição, tudo ao mesmo tempo:**

- chegar ao dia 20 com toda a família viva e com status "Bem";

- Laços em 7 ou mais;

- Integridade em 6 ou mais;

- pelo menos 3 dos 5 pacientes-chave salvos;

- ter dado o depoimento à Carla (a reportagem leva ao reforço da frota).

**Epílogo:** a matéria da Carla leva a uma investigação. A OS perde o contrato e a central ganha duas viaturas e um terceiro regulador por turno. O ateliê da Lúcia tem fila de clientes. Dona Zélia está controlando o açúcar e implicando com tudo. Numa tarde de domingo, alguém bate na sua porta: é o Seu Antônio, do dia 3, com a esposa, trazendo um bolo, porque descobriu o seu nome pela equipe. Se a Dona Cida foi salva, ela manda uma carta com letra tremida dizendo que voltou a assistir à novela. Na última cena, o Davi mostra um desenho novo. É o pai sentado à mesa, com um telefone, e em volta dele um monte de casinhas com as luzes acesas. O título do desenho é: "Meu pai salva as pessoas pelo telefone."

**Variações do epílogo:** cada paciente-chave salvo ou perdido acrescenta ou retira uma linha. Se você salvou o avô do Biel, aparece uma cena do Biel, mais velho, fazendo curso de socorrista. Se não salvou, ele aparece no velório, olhando o celular.

**15. Arte, som e interface**

**Visual:** pixel art de baixa resolução com uma paleta fria para a central (verde-acinzentado e luz fluorescente) e uma paleta quente para a casa (amarelo de lâmpada incandescente e marrom). As duas paletas se misturam conforme o Desgaste sobe: a casa vai ficando "fluorescente".

**Áudio:** este é o ponto mais importante. Cada ligação tem uma camada de ambiente: TV, chuva, festa, choro, silêncio, chuveiro aberto. Algumas pistas existem só no som, com legenda opcional para acessibilidade. As vozes podem ser balbucios ao estilo de *Papers, Please* ou dublagem parcial nas chamadas-chave. O toque do telefone muda sutilmente de tom ao longo do jogo e fica mais agressivo.

**Música:** quase nenhuma durante o plantão, só o zumbido da central. Em casa, um violão simples e melancólico, cujo tema varia conforme os Laços.

**Jornal do dia:** uma página de jornal local abre cada dia, com manchetes que reagem às suas ações ("Idosa morre à espera de ambulância no Jardim Norte", "Central do SAMU bate meta de economia").

**16. Curva de dificuldade**

| **Fase**     | **Dias** | **Ligações por plantão** | **Foco**                                                                    |
|--------------|----------|--------------------------|-----------------------------------------------------------------------------|
| Aprendizado  | 1 a 4    | 8 a 10                   | Ler o manual e os primeiros trotes                                          |
| Pressão      | 5 a 9    | 10 a 14                  | Escassez de viaturas e o primeiro dilema pessoal                            |
| Complexidade | 10 a 14  | 14 a 18                  | Trotes sofisticados, destino hospitalar, volume alto                        |
| Crise        | 15 a 20  | 16 a 22                  | Múltiplas vítimas, enchente, recompensa ou punição pelos padrões aprendidos |

**Regra de ouro do balanceamento:** um jogador médio deve terminar com saldo entre −R\$ 100 e +R\$ 300, e precisar sacrificar alguma coisa (o bico, uma conta, um evento) pelo menos três vezes ao longo do jogo.

**17. Extras**

- **Modo Plantão Infinito:** ligações geradas proceduralmente, sem história, com ranking.

- **Conquistas:** "Ouvido Absoluto" (identificar 10 trotes só pelo som), "Ela Só Queria Conversar" (conversar com a Dona Cida em todos os dias), "Nem Pelo Meu Filho" (resolver o dia 9 pelo protocolo), "Calabresa" (resolver a chamada da pizza).

- **Diário do regulador:** um caderno que registra o nome de cada paciente que morreu durante os seus plantões. Pode ser relido no final.

**18. Nota de responsabilidade**

Seria bom ter consultoria de médicos reguladores e TARMs de verdade, para que os protocolos simplificados do jogo não ensinem nada perigoso. Os créditos finais podem lembrar que o trote ao 192 tira ambulância de quem precisa e pode ser crime, e que, em caso de dúvida, o certo é ligar. A cena do dia 12 deve exibir recursos de apoio emocional, como o CVV (188), sem detalhar métodos.

Posso desenvolver qualquer parte em mais detalhe: o roteiro completo de todas as ligações de um dia específico, a árvore de diálogos de um evento familiar, ou uma planilha de balanceamento da economia.

amei. mas ai voce esta colocando uma chamada por dia. é muito pouco. tem que ser entre 5 e 10 mais ou menos com base no tempo que o jogador consegue ir atendendo, nao acha?

Concordo. E percebi que eu mesmo me contradisse: a tabela de dificuldade falava em 8 a 22 ligações por plantão, enquanto o roteiro só mostrava as chamadas-chave de cada dia, então ficou parecendo uma por dia. A sua ideia de **5 a 10 ligações, conforme a velocidade do jogador**, é melhor. Ela premia quem domina o sistema sem travar quem ainda está aprendendo, e é assim que *Papers, Please* funciona. Abaixo está a revisão: o sistema de tempo, a economia ajustada e as ligações de cada um dos 20 dias.

**REVISÃO 1: TEMPO E FLUXO DE CHAMADAS**

**1. O relógio do plantão**

O plantão vai das 07:00 às 19:00 no jogo e dura **12 minutos reais**, ou seja, **1 minuto real equivale a 1 hora no jogo**. Uma ligação bem conduzida leva de 60 a 90 segundos reais. Uma ligação mal conduzida, com perguntas demais, inconsistências mal feitas ou hesitação, leva de 2 a 3 minutos. O resultado é este:

| **Perfil do jogador**  | **Ligações atendidas por plantão** |
|------------------------|------------------------------------|
| Iniciante ou hesitante | 5 a 6                              |
| Médio                  | 7 a 8                              |
| Experiente             | 9 a 10                             |

Cada pergunta custa de 5 a 15 minutos de jogo, o que dá de 5 a 15 segundos reais. "Ligar de volta" custa 30 minutos de jogo. O Modo Inconsistência não para o relógio, só deixa o tempo mais lento (50%).

**2. A fila**

Cada dia tem **10 ligações roteirizadas**, que chegam em horários fixos. Elas se acumulam na fila enquanto você está ocupado com outra.

- **Ligações ★ (âncora):** Simone marca essas com um post-it vermelho ("Doutor, pega essa agora"). Elas sempre chegam cedo o bastante para qualquer jogador alcançar, e são as que movem a história.

- **Pré-triagem da Simone:** cada ligação na fila aparece com uma nota curta, como "Senhora, parece nervosa" ou "Diz que é grave". As notas ajudam, mas a Simone também erra, principalmente a partir do dia 10.

- **Ligação esperando:** depois de 2 horas de jogo na fila, a pessoa pode desligar. Se o caso era leve, nada acontece. Se era grave, o paciente piora.

**Quando chega 19:00, o que sobrou na fila passa para o plantão noturno.** Esses casos não geram advertência, porque você não errou, só não chegou neles. Mas o jornal do dia seguinte conta o que aconteceu com eles. Se havia um caso vermelho entre os que ficaram, ele pode virar óbito pela demora, e isso aumenta o Desgaste (+5). A lição é que a lentidão também tem custo, mas um custo humano, não disciplinar.

**3. Frota ajustada ao novo ritmo**

Com menos ligações, as ambulâncias precisam ficar fora por mais tempo, senão nunca faltaria viatura. Cada uma fica fora **de 2 a 4 horas de jogo**, somando deslocamento, atendimento e a espera no hospital pela devolução da maca, a chamada "retenção de maca", que é um problema real. Com isso, se você manda duas USA de manhã, pode ficar sem nenhuma na hora do almoço.

**4. Economia rebalanceada**

| **Item**                                                                        | **Antes** | **Agora**   |
|---------------------------------------------------------------------------------|-----------|-------------|
| Valor fixo do plantão                                                           | R\$ 260   | **R\$ 220** |
| USA correta                                                                     | +25       | +25         |
| USB correta                                                                     | +15       | +15         |
| Orientação correta                                                              | +5        | +8          |
| Trote identificado                                                              | +10       | +10         |
| **Bônus de produtividade** (8 ou mais ligações atendidas e nenhuma advertência) | —         | **+R\$ 30** |

As despesas base continuam em R\$ 280 por interlúdio. O resultado é este:

| **Jogador**                    | **Ganho médio por dia** | **Saldo por dia**                  |
|--------------------------------|-------------------------|------------------------------------|
| Lento (5 ligações)             | ~R\$ 280                | ~R\$ 0 (não sobra para os eventos) |
| Médio (7 a 8 ligações)         | ~R\$ 330                | ~+R\$ 50                           |
| Rápido e preciso (10 ligações) | ~R\$ 400                | ~+R\$ 120                          |

Os eventos do jogo somam cerca de R\$ 1.150 (geladeira, máquina de costura, bombinha, curativo, aniversário e a conta de água). Um jogador médio consegue pagar mais ou menos metade deles, e é obrigado a escolher qual sacrificar. O jogador muito bom consegue pagar tudo, e esse é o prêmio da habilidade.

**REVISÃO 2: AS LIGAÇÕES DOS 20 DIAS**

**Como ler as tabelas:** a ordem é a ordem de chegada. **★** indica uma ligação âncora da história. As ligações 6 a 10 só são atendidas por quem é rápido. Do dia 9 em diante, a decisão inclui o hospital de destino: **REG** (Hospital Regional), **UPA** (UPA Norte) ou **MAT** (Maternidade).

**Dia 1: "Primeiro Plantão" (tutorial, com as ligações 1 a 4 guiadas pela Simone)**

| **\#** | **Ligação**                                                    | **O que é de verdade**            | **Decisão correta** |
|--------|----------------------------------------------------------------|-----------------------------------|---------------------|
| 1      | Dona Cida, pressão "14 por 9", quer falar da novela            | Pressão levemente alta, e solidão | Orientação (UBS)    |
| 2      | Idosa de 80 anos caiu e não consegue apoiar a perna            | Provável fratura de fêmur         | USB                 |
| 3      | "Tem um ET ferido na Rua Saturno!" *\[risadas\]*               | A rua não existe                  | Trote               |
| 4      | Testemunha: "Um homem caiu na calçada e não tá respirando"     | Parada cardíaca                   | USA                 |
| 5      | Mãe: criança com febre de 38 °C desde ontem, brincando         | Virose                            | Orientação          |
| 6      | Motociclista caiu, corte no braço com pouco sangue, consciente | Trauma leve a moderado            | USB                 |
| 7      | "Dor de dente insuportável"                                    | Caso odontológico                 | Orientação (UPA)    |
| 8      | Idosa com DPOC: "a boca dela tá roxa e ela não consegue falar" | Insuficiência respiratória        | USA                 |

**Dia 2: "O Quadro"**

| **\#** | **Ligação**                                                                                         | **O que é de verdade**      | **Decisão correta**                        |
|--------|-----------------------------------------------------------------------------------------------------|-----------------------------|--------------------------------------------|
| 1      | ★ Biel: "Cara esfaqueado na frente da escola!" (é domingo, a escola está fechada)                   | Trote                       | Trote                                      |
| 2      | Mãe: o filho epiléptico convulsionou, já parou e ele está dormindo                                  | Pós-crise estável           | USB                                        |
| 3      | Dona Cida                                                                                           | Conversa                    | Orientação                                 |
| 4      | "Meu amigo engoliu um peixe vivo!" *\[risadas\]*                                                    | Trote                       | Trote                                      |
| 5      | Homem cortou o braço com faca de cozinha: "o sangue não para, ele tá branco e tonto"                | Hemorragia com choque       | USA                                        |
| 6      | Bêbado caído na praça, responde e xinga                                                             | Intoxicação alcoólica       | USB                                        |
| 7      | Silêncio na linha. Ligar de volta: atende uma mãe envergonhada, foi a filha brincando com o celular | Ligação acidental           | Trote (o número **não** vai para o quadro) |
| 8      | Gestante de 39 semanas, contrações a cada 10 minutos, bolsa íntegra                                 | Início do trabalho de parto | Orientação (ir por meios próprios)         |
| 9      | Idoso de 70 anos com dor abdominal forte e vômito com sangue                                        | Hemorragia digestiva        | USA                                        |
| 10     | Rapaz torceu o tornozelo no futebol                                                                 | Entorse                     | Orientação                                 |

**Dia 3: "O Peito"**

| **\#** | **Ligação**                                                                       | **O que é de verdade**      | **Decisão correta**                |
|--------|-----------------------------------------------------------------------------------|-----------------------------|------------------------------------|
| 1      | Biel de novo (o número já está no quadro)                                         | Trote                       | Trote                              |
| 2      | ★ Seu Antônio, "queimação, deve ser o feijão"                                     | Infarto                     | USA                                |
| 3      | Mulher de 35 anos: dor em pontada que piora ao apertar, depois de carregar móveis | Dor muscular                | Orientação                         |
| 4      | Dona Cida                                                                         | Conversa                    | Orientação                         |
| 5      | Senhora de 67 anos, diabética: "só um cansaço e enjoo", suor frio                 | Infarto atípico (armadilha) | USA                                |
| 6      | Criança caiu da bicicleta, braço torto, consciente                                | Fratura                     | USB                                |
| 7      | Homem de 25 anos, coração disparado e mãos formigando depois de uma briga         | Crise de ansiedade          | Orientação, acalmando por telefone |
| 8      | Atropelamento, vítima não responde                                                | Trauma grave                | USA                                |
| 9      | Idoso acamado, confuso e com febre                                                | Provável infecção           | USB                                |

**Dia 4: "Cena Quente"**

| **\#** | **Ligação**                                                           | **O que é de verdade**         | **Decisão correta** |
|--------|-----------------------------------------------------------------------|--------------------------------|---------------------|
| 1      | Dona Cida                                                             | Conversa                       | Orientação          |
| 2      | "Minha esposa tá MORRENDO!" (ela vomitou e quer carona até a UPA)     | Exagerador                     | Orientação          |
| 3      | ★ Tiroteio no bar, atirador ainda no local                            | Cena insegura                  | USA + PM            |
| 4      | Briga de vizinhos, um com a cabeça sangrando, o outro ainda com facão | Cena insegura                  | USB + PM            |
| 5      | Colisão de carro com moto, motociclista não se mexe                   | Trauma grave                   | USA                 |
| 6      | Mãe: criança de 4 anos picada por escorpião, chorando e vomitando     | Escorpionismo grave em criança | USA                 |
| 7      | Mulher de 50 anos com "a enxaqueca de sempre"                         | Crônica                        | Orientação          |
| 8      | "Incêndio com cinco feridos!" no endereço de um terreno baldio        | Trote                          | Trote               |
| 9      | Idoso caiu, já levantou, só ralou o joelho                            | Leve                           | Orientação          |

**Dia 5: "Corte" (Peixoto oferece R\$ 30 extras se o dia tiver menos de 3 USA enviadas)**

| **\#** | **Ligação**                                                              | **O que é de verdade**       | **Decisão correta** |
|--------|--------------------------------------------------------------------------|------------------------------|---------------------|
| 1      | Homem de 62 anos com dor no peito clássica                               | Infarto                      | USA                 |
| 2      | Corte superficial no dedo                                                | Leve                         | Orientação          |
| 3      | ★ Parada cardíaca na academia, um aluno fazendo massagem                 | Parada                       | USA                 |
| 4      | Criança retirada da piscina, tossindo e chorando                         | Quase afogamento, consciente | USB                 |
| 5      | Dona Cida                                                                | Conversa                     | Orientação          |
| 6      | Pedreiro caiu de 6 metros: "não sinto as pernas"                         | Trauma raquimedular          | USA                 |
| 7      | Mulher com crise de asma, fala frases completas, a bombinha ajudou pouco | Moderada                     | USB                 |
| 8      | Trote com voz infantil                                                   | Trote                        | Trote               |
| 9      | Idosa fraca, sem comer há dois dias, consciente                          | Desidratação                 | USB                 |

*Nota de design:* o dia tem 3 casos de USA verdadeiros. A meta do Peixoto só pode ser cumprida errando de propósito, e o bônus de R\$ 30 é uma armadilha.

**Dia 6: "O Lado do Rosto"**

| **\#** | **Ligação**                                                       | **O que é de verdade**                                                         | **Decisão correta**                    |
|--------|-------------------------------------------------------------------|--------------------------------------------------------------------------------|----------------------------------------|
| 1      | Mulher de 30 anos, tontura ao levantar, comeu pouco               | Leve                                                                           | Orientação                             |
| 2      | ★ "Meu marido acordou com a boca torta"                           | AVC. Visto bem pela última vez há 3 horas: USA. Há mais de 4 horas e meia: USB | Depende da pergunta "Desde que horas?" |
| 3      | Homem com a fala enrolada e cheiro de cachaça. FAST normal        | Intoxicação, não AVC                                                           | USB                                    |
| 4      | ★ Criança: "minha mãe não acorda", "ela toma injeção na barriga"  | Hipoglicemia grave                                                             | USA                                    |
| 5      | Dona Cida                                                         | Conversa                                                                       | Orientação                             |
| 6      | Idoso com a fala enrolada há 1 hora e o braço caído               | AVC na janela                                                                  | USA                                    |
| 7      | Criança bateu a cabeça, chorou na hora, está acordada e brincando | Trauma leve                                                                    | USB                                    |
| 8      | Homem com dor lombar crônica quer "remédio forte"                 | Leve                                                                           | Orientação                             |
| 9      | Trote                                                             | Trote                                                                          | Trote                                  |

**Dia 7: "O Vereador"**

| **\#** | **Ligação**                                                         | **O que é de verdade**     | **Decisão correta**                    |
|--------|---------------------------------------------------------------------|----------------------------|----------------------------------------|
| 1      | Gestante de 20 semanas, pequeno sangramento, sem dor                | Sem urgência imediata      | Orientação (MAT por meios próprios)    |
| 2      | ★ Vereador Arlindo: "quero a UTI móvel pra minha mãe"               | Mãe estável                | Orientação                             |
| 3      | ★ Gestante de 34 semanas convulsionando, "a pressão dela tava alta" | Eclâmpsia                  | USA                                    |
| 4      | "Tô vendo a cabeça do bebê!"                                        | Parto em período expulsivo | USB + orientação de parto por telefone |
| 5      | Idoso engasgado com carne, não consegue falar                       | Obstrução de via aérea     | USA + orientar manobra de Heimlich     |
| 6      | Dona Cida                                                           | Conversa                   | Orientação                             |
| 7      | Motoboy caiu, osso aparecendo na perna, pouco sangue, consciente    | Fratura exposta estável    | USB                                    |
| 8      | Adulto com febre e dor no corpo                                     | Virose                     | Orientação                             |
| 9      | Trote                                                               | Trote                      | Trote                                  |

**Dia 8: "A Apresentação"**

| **\#** | **Ligação**                                                                | **O que é de verdade**      | **Decisão correta** |
|--------|----------------------------------------------------------------------------|-----------------------------|---------------------|
| 1      | Rapaz desmaiou no ônibus, já acordou, está bem, estava em jejum            | Leve                        | Orientação          |
| 2      | ★ "Queria uma pizza de calabresa..."                                       | Violência doméstica         | USB + PM            |
| 3      | Idoso que toma anticoagulante caiu da escada, bateu a cabeça e vomitou     | Trauma craniano de risco    | USA                 |
| 4      | Mulher convulsionando há mais de 10 minutos sem parar                      | Estado de mal epiléptico    | USA                 |
| 5      | Dona Cida                                                                  | Conversa                    | Orientação          |
| 6      | Criança de 2 anos com febre e manchinhas roxas que não somem quando aperta | Suspeita de meningococcemia | USA                 |
| 7      | Idosa com diarreia há 2 dias, consciente, bebendo líquidos                 | Leve                        | Orientação          |
| 8      | Eletricista levou choque, consciente, queimadura na mão                    | Moderado                    | USB                 |
| 9      | Trote                                                                      | Trote                       | Trote               |

**Dia 9: "Linha Direta" (começa a escolha de hospital de destino)**

| **\#** | **Ligação**                                                               | **O que é de verdade**                                      | **Decisão correta**    |
|--------|---------------------------------------------------------------------------|-------------------------------------------------------------|------------------------|
| 1      | Idosa caiu e está com o punho torto                                       | Fratura                                                     | USB → UPA              |
| 2      | Motociclista inconsciente na avenida                                      | Trauma grave                                                | USA → REG              |
| 3      | Dona Cida                                                                 | Conversa                                                    | Orientação             |
| 4      | Parto em período expulsivo                                                | Parto                                                       | USB → MAT              |
| 5      | ★ **14:00, chegam juntas:** a sua casa, com o Davi em crise de asma       | Moderada (se a bombinha foi comprada) ou grave (se não foi) | USB → UPA ou USA → REG |
| 6      | ★ **14:00, chegam juntas:** "Minha mulher tá roxa, não consegue respirar" | Anafilaxia                                                  | USA → REG              |
| 7      | Diabético com hipoglicemia leve, tomou açúcar e melhorou                  | Resolvido                                                   | Orientação             |
| 8      | Criança com dor de ouvido                                                 | Leve                                                        | Orientação             |
| 9      | Trote                                                                     | Trote                                                       | Trote                  |

*Nota de design:* o jogo está roteirizado para que, às 14:00, exista **apenas uma USA livre**, não importa o que o jogador tenha feito antes.

**Dia 10: "Ninguém é Bobo" (trotes sofisticados)**

| **\#** | **Ligação**                                                                                                               | **O que é de verdade**                       | **Decisão correta**     |
|--------|---------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|-------------------------|
| 1      | Voz adulta e calma: "Meu pai tá infartando, Rua Bahia, 300". Ligar de volta: número desligado. O endereço é de uma igreja | Trote sofisticado                            | Trote                   |
| 2      | Homem ri de nervoso enquanto conta que a mãe "tá falando tudo errado"                                                     | Real. O riso é nervoso (armadilha invertida) | USA → REG (AVC)         |
| 3      | Dona Cida                                                                                                                 | Conversa                                     | Orientação              |
| 4      | "Minha filha cortou o pulso" (a Simone anota "acho que é trote"). Ligar de volta: o pai atende chorando                   | Real                                         | USB + acolhimento → UPA |
| 5      | "Acidente com ônibus escolar!" Ligar de volta dá caixa postal, ninguém mais ligou sobre isso, o endereço é real           | Trote                                        | Trote                   |
| 6      | Idoso com falta de ar progressiva e as pernas inchadas                                                                    | Insuficiência cardíaca descompensada         | USA → REG               |
| 7      | Adolescente torceu o joelho                                                                                               | Leve                                         | Orientação              |
| 8      | Queda de telhado, consciente, dor no quadril                                                                              | Trauma moderado                              | USB → REG               |
| 9      | Trote clássico                                                                                                            | Trote                                        | Trote                   |

**Dia 11: "Febre" (epidemia de dengue, com volume alto e ligações curtas)**

| **\#** | **Ligação**                                                                | **O que é de verdade** | **Decisão correta** |
|--------|----------------------------------------------------------------------------|------------------------|---------------------|
| 1      | Febre e dor atrás dos olhos                                                | Dengue sem alarme      | Orientação          |
| 2      | Febre e manchas na pele                                                    | Dengue sem alarme      | Orientação          |
| 3      | Febre há 4 dias, "agora a dor na barriga piorou muito e vomita tudo"       | Dengue com alarme      | USB → UPA           |
| 4      | Dona Cida: "acho que tô com dengue" (não está)                             | Conversa               | Orientação          |
| 5      | Febre e dor no corpo                                                       | Dengue sem alarme      | Orientação          |
| 6      | Adolescente com sangramento na gengiva e no nariz, tontura, pele fria      | Dengue grave           | USA → REG           |
| 7      | "Ela tá com dengue e desmaiou" (desmaiou ao ver o próprio sangue no exame) | Leve                   | Orientação          |
| 8      | Febre em gestante                                                          | Risco aumentado        | USB → MAT           |
| 9      | Idoso com febre, confuso e sonolento                                       | Dengue com alarme      | USB → REG           |
| 10     | Febre                                                                      | Dengue sem alarme      | Orientação          |

*Nota de design:* esse dia testa a atenção. O jogador rápido corre o risco de entrar no automático e dispensar os casos 3, 6 e 9.

**Dia 12: "Do Outro Lado da Linha"**

| **\#** | **Ligação**                                                                       | **O que é de verdade**    | **Decisão correta**                                      |
|--------|-----------------------------------------------------------------------------------|---------------------------|----------------------------------------------------------|
| 1      | Homem agitado, gritando na rua, quebrando coisas                                  | Surto psicótico com risco | USB + PM                                                 |
| 2      | Dona Cida                                                                         | Conversa                  | Orientação                                               |
| 3      | ★ Pessoa jovem em crise emocional                                                 | Crise com risco           | Acolhimento por telefone + USB (a ligação não pode cair) |
| 4      | Mãe: o filho tomou várias cartelas de remédio (já faz 30 minutos), está sonolento | Intoxicação               | USA → REG                                                |
| 5      | Idosa com ansiedade porque o marido está demorando para voltar                    | Leve                      | Orientação + acalmar                                     |
| 6      | Acidente de trabalho, a mão presa numa máquina                                    | Trauma                    | USB + Bombeiros                                          |
| 7      | Rapaz com dor no peito e coração disparado depois de usar cocaína                 | Risco cardíaco            | USA → REG                                                |
| 8      | Trote                                                                             | Trote                     | Trote                                                    |
| 9      | Senhor com soluço há 2 dias                                                       | Leve                      | Orientação                                               |

*Nota:* a ligação ★ exibe o CVV (188) e não descreve métodos. Durante essa ligação, o relógio fica mais lento, porque a pressa não pode atrapalhar o acolhimento.

**Dia 13: "Produto de Limpeza"**

| **\#** | **Ligação**                                                 | **O que é de verdade** | **Decisão correta**                        |
|--------|-------------------------------------------------------------|------------------------|--------------------------------------------|
| 1      | ★ Criança de 3 anos engoliu soda cáustica                   | Intoxicação grave      | USA → REG + orientar "não provoque vômito" |
| 2      | Dona Cida                                                   | Conversa               | Orientação                                 |
| 3      | Criança engoliu uma moeda, respira bem e está brincando     | Leve a moderado        | Orientação (UPA)                           |
| 4      | Idoso com dor no peito: "igual a do meu infarto de antes"   | Infarto                | USA → REG                                  |
| 5      | Mulher vomitando desde que comeu uma maionese de festa      | Gastroenterite         | Orientação                                 |
| 6      | Criança tomou "uns comprimidos da avó" (remédio de pressão) | Intoxicação de risco   | USA → REG                                  |
| 7      | Mordida de cachorro na perna, com pouco sangue              | Leve                   | Orientação                                 |
| 8      | Queda de moto, consciente, dor no ombro                     | Moderado               | USB → UPA                                  |
| 9      | Trote                                                       | Trote                  | Trote                                      |

**Dia 14: "Carla"**

| **\#** | **Ligação**                                                                                                                | **O que é de verdade**          | **Decisão correta**                                                |
|--------|----------------------------------------------------------------------------------------------------------------------------|---------------------------------|--------------------------------------------------------------------|
| 1      | Homem com dor de cabeça "a pior da minha vida", de repente                                                                 | Suspeita de hemorragia cerebral | USA → REG                                                          |
| 2      | ★ Carla se passando por paciente: "dor no peito", mas pergunta quanto tempo a ambulância demora e quantas viaturas existem | Falsa, é investigação           | Trote (sem penalidade se você perceber, e ela comenta isso depois) |
| 3      | Dona Cida                                                                                                                  | Conversa                        | Orientação                                                         |
| 4      | Idosa caída em casa há horas, consciente, confusa                                                                          | Moderado a grave                | USB → REG                                                          |
| 5      | Rapaz com queimadura de óleo quente no braço                                                                               | Moderado                        | USB → UPA                                                          |
| 6      | Trote sofisticado                                                                                                          | Trote                           | Trote                                                              |
| 7      | Gestante com dor de cabeça forte e a visão "brilhando"                                                                     | Pré-eclâmpsia grave             | USA → MAT                                                          |
| 8      | Criança com tosse há 3 dias                                                                                                | Leve                            | Orientação                                                         |
| 9      | Ciclista atropelado, sangrando muito pela perna                                                                            | Hemorragia                      | USA → REG                                                          |

**Dia 15: "O Show" (múltiplas vítimas)**

| **\#** | **Ligação**                                                                | **O que é de verdade**            | **Decisão correta**                                                                                                       |
|--------|----------------------------------------------------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| 1      | Idoso com fratura no braço                                                 | Moderado                          | USB → UPA                                                                                                                 |
| 2      | Dona Cida                                                                  | Conversa                          | Orientação                                                                                                                |
| 3      | ★ **Evento de múltiplas vítimas** (17:00): tumulto no show, 14 vítimas     | 3 vermelhas, 5 amarelas, 6 verdes | Triagem: USA para as vermelhas, USB para as amarelas, verdes para a UPA por conta própria. Pede reforço da cidade vizinha |
| 4      | Dor no peito em homem de 70 anos **durante** o evento                      | Infarto                           | USA (precisa reservar uma, ou pedir reforço)                                                                              |
| 5      | Trote: "outro tumulto no shopping!"                                        | Trote oportunista                 | Trote                                                                                                                     |
| 6      | Mulher com crise de ansiedade porque o filho estava no show (ele está bem) | Leve                              | Orientação                                                                                                                |
| 7      | Motorista bêbado bateu no poste saindo do show, consciente                 | Moderado                          | USB + PM → REG                                                                                                            |
| 8      | Criança perdida no tumulto, ferida leve                                    | Leve                              | Orientação + PM                                                                                                           |

*Nota:* o evento de múltiplas vítimas abre um mini-jogo próprio, com 14 cartões de vítimas para arrastar até as cores, enquanto o relógio continua correndo. Ele vale como 3 ligações para a conta de produtividade.

**Dia 16: "O Menino que Gritava Lobo"**

| **\#** | **Ligação**                                                                                       | **O que é de verdade**                          | **Decisão correta** |
|--------|---------------------------------------------------------------------------------------------------|-------------------------------------------------|---------------------|
| 1      | Trote do Biel (o costume de sempre)                                                               | Trote                                           | Trote               |
| 2      | Dona Cida                                                                                         | Conversa                                        | Orientação          |
| 3      | Mulher de 40 anos com dor forte no lado direito da barriga e febre                                | Apendicite                                      | USB → REG           |
| 4      | ★ Biel chorando: "meu vô caiu no banheiro e não acorda" *\[chuveiro aberto\]*                     | **Real**                                        | USA → REG           |
| 5      | Homem caído e desacordado, cercado de curiosos; a pessoa que liga diz que "ele já fez isso antes" | Convulsão em epiléptico conhecido, já acordando | USB                 |
| 6      | Trote sofisticado                                                                                 | Trote                                           | Trote               |
| 7      | Idosa com falta de ar e febre                                                                     | Pneumonia                                       | USB → REG           |
| 8      | Dor de garganta                                                                                   | Leve                                            | Orientação          |
| 9      | Trauma por queda de laje                                                                          | Grave                                           | USA → REG           |

**Dia 17: "Água" (chuvas, ruas bloqueadas no mapa)**

| **\#** | **Ligação**                                                      | **O que é de verdade**       | **Decisão correta**                                             |
|--------|------------------------------------------------------------------|------------------------------|-----------------------------------------------------------------|
| 1      | Família ilhada no telhado, um idoso com dor no peito             | Grave, com acesso impossível | USA + Bombeiros                                                 |
| 2      | Dona Cida: "a água tá entrando em casa"                          | Risco real e logístico       | Orientação + Bombeiros (a Dona Cida tem 79 anos e mora sozinha) |
| 3      | Criança arrastada pela enxurrada, resgatada, não respira         | Afogamento                   | USA + Bombeiros                                                 |
| 4      | Homem levou choque mexendo na fiação alagada, inconsciente       | Grave                        | USA + Bombeiros (desligar a energia)                            |
| 5      | Mulher cortou o pé num vidro dentro da água                      | Moderado                     | USB → UPA                                                       |
| 6      | Trote aproveitando o caos                                        | Trote                        | Trote                                                           |
| 7      | Idoso com diabetes que perdeu a insulina na enchente, consciente | Moderado                     | USB → UPA                                                       |
| 8      | Desabamento de muro, 1 vítima presa                              | Grave                        | USA + Bombeiros                                                 |

*Nota:* as ruas alagadas fazem as rotas mais longas e algumas viaturas ficam presas. Tempo de chegada vira variável.

**Dia 18: "Escândalo" (o volume é afetado pela matéria)**

| **\#** | **Ligação**                                                        | **O que é de verdade** | **Decisão correta**                           |
|--------|--------------------------------------------------------------------|------------------------|-----------------------------------------------|
| 1      | Pessoa liga só para xingar a central depois de ler a matéria       | Não é emergência       | Trote/encerrar (sem penalidade)               |
| 2      | Dona Cida: "li no jornal, você tá bem, meu filho?"                 | Conversa               | Orientação (+ Humanidade)                     |
| 3      | Homem de 55 anos com dor nas costas que "rasga" e vai para o peito | Dissecção de aorta     | USA → REG                                     |
| 4      | Idosa com queda e fratura de punho                                 | Moderado               | USB → UPA                                     |
| 5      | Trote                                                              | Trote                  | Trote                                         |
| 6      | Mãe: bebê de 3 meses "molinho, não quer mamar"                     | Grave                  | USA → REG                                     |
| 7      | Rapaz com cólica renal                                             | Moderado               | USB → UPA                                     |
| 8      | Ligação do próprio Peixoto testando você "como paciente"           | Teste                  | Orientação/trote, conforme o que ele inventar |
| 9      | Trauma de moto                                                     | Grave                  | USA → REG                                     |

**Dia 19: "Dona Cida" (o Regional começa a ficar sem vaga)**

| **\#** | **Ligação**                                                   | **O que é de verdade** | **Decisão correta**                                    |
|--------|---------------------------------------------------------------|------------------------|--------------------------------------------------------|
| 1      | Idoso com infarto                                             | Grave                  | USA → REG (se não houver vaga, negociar a "vaga zero") |
| 2      | Leve                                                          | Leve                   | Orientação                                             |
| 3      | Trauma moderado                                               | Moderado               | USB → UPA                                              |
| 4      | Gestante em trabalho de parto                                 | Parto                  | USB → MAT                                              |
| 5      | Trote                                                         | Trote                  | Trote                                                  |
| 6      | Criança com crise de asma grave                               | Grave                  | USA → REG                                              |
| 7      | Homem com dor de dente                                        | Leve                   | Orientação                                             |
| 8      | ★ **18:30:** Dona Cida, a voz arrastada, "o braço tá... bobo" | AVC                    | USA → REG                                              |

*Nota:* é a única vez que a Dona Cida aparece no fim do dia, e não no começo. A ligação dela é âncora: chega às 18:30 mesmo que o jogador seja lento.

**Dia 20: "Último Plantão" (todas as regras ativas)**

| **\#** | **Ligação**                                                        | **O que é de verdade** | **Decisão correta**             |
|--------|--------------------------------------------------------------------|------------------------|---------------------------------|
| 1      | Paciente que você salvou antes liga para agradecer (se houver)     | Não é emergência       | Orientação (+ Humanidade)       |
| 2      | Cena com violência, homem ferido a faca                            | Grave                  | USA + PM → REG                  |
| 3      | Trote sofisticado                                                  | Trote                  | Trote                           |
| 4      | Parto que complica: o cordão está saindo antes do bebê             | Prolapso de cordão     | USA → MAT                       |
| 5      | Intoxicação de criança                                             | Grave                  | USA → REG                       |
| 6      | Dengue com alarme                                                  | Moderado               | USB → UPA                       |
| 7      | Leve                                                               | Leve                   | Orientação                      |
| 8      | Queda de idoso                                                     | Moderado               | USB → REG                       |
| 9      | Trote                                                              | Trote                  | Trote                           |
| 10     | ★ **18:58:** parada cardíaca, o colega do noturno ainda não chegou | Parada                 | USA, mesmo com o turno acabando |

*Nota:* a ligação final é âncora. Se o jogador recusar ou a ambulância já estiver toda na rua, ele pode pedir uma viatura de outra base ou ficar orientando a massagem por telefone até ela chegar.

**5. Por que esse formato funciona**

O jogador lento atende as ligações principais, sobrevive e entende a história. O jogador médio vê a maior parte do conteúdo e se aperta no dinheiro. O jogador experiente vê tudo, ganha mais e pode bancar a família, mas, por atender mais ligações, também se expõe a mais risco de advertência. Ser rápido nunca é obrigatório; é uma aposta.

Se quiser, posso montar a próxima etapa: a ficha completa de diálogos de um dia inteiro, com as falas, as pistas sonoras e as respostas de cada pergunta para as 10 ligações. É o material que um roteirista ou programador precisaria para implementar.

como seria possivel melhorar ainda mais esse jogo?

Dá para melhorar bastante. Relendo o que montamos, encontrei alguns problemas de design que valem ser corrigidos antes de acrescentar coisas novas. Organizei por impacto, do mais importante ao menos.

**1. Problemas no design atual**

**A punição está simétrica, e não deveria estar.** Hoje mandar ambulância demais e mandar de menos valem a mesma advertência. Na regulação real, subestimar um caso é muito mais grave do que superestimar. Além disso, a punição igual ensina ao jogador que "na dúvida, não mande", que é a lição errada para um jogo sobre o SAMU. Minha sugestão:

| **Erro**                                                   | **Penalidade nova**                                        |
|------------------------------------------------------------|------------------------------------------------------------|
| Excesso (USA num caso de USB, USB num caso leve)           | **Nota de auditoria.** Duas notas viram uma advertência    |
| Falta (subestimar um caso grave, dispensar uma emergência) | **Advertência imediata**, com possibilidade de sindicância |
| Ambulância mandada para trote                              | Nota de auditoria                                          |

Assim o Peixoto e as metas de economia empurram o jogador para um lado, e a ética e o protocolo empurram para o outro. Esse é o conflito central de *Papers, Please*.

**A Dona Cida é previsível demais.** Ela liga todo dia, a resposta é sempre "Orientação", e a virada do dia 19 fica óbvia para quem já jogou alguma coisa do gênero. Para corrigir, as ligações dela podem variar. Em umas ela só quer conversar. Numa, lá pelo dia 8, ela tem uma queda leve de verdade que precisa de USB. Em outra, ela não liga, e no dia seguinte explica que estava "na casa da comadre". O jogador para de confiar no padrão sem perceber. Ajuda também espalhar sinais pequenos antes do AVC: no dia 16 ela esquece o nome da novela, no dia 17 repete uma frase. Quem prestou atenção percebe a piora com antecedência.

**O certo e o errado são binários demais.** A regulação real tem muita zona cinzenta. Proponho que 1 ou 2 ligações por dia sejam **defensáveis**: o protocolo aceita mais de uma decisão, e a auditoria só pune se você não tiver feito as perguntas que justificam a sua escolha. Com isso o jogo passa a avaliar o raciocínio, e não só o resultado.

**2. Mecânicas que aprofundam o jogo**

**Orientação ativa por telefone.** Hoje "orientar massagem" ou "orientar parto" é só um rótulo. Isso poderia virar um minijogo curto:

- **Massagem cardíaca por telefone:** um metrônomo de 100 a 120 batidas por minuto, e você precisa manter a pessoa no ritmo enquanto ela se cansa ("não aguento mais, doutor!").

- **Engasgo:** guiar a manobra de Heimlich passo a passo, e se a vítima desmaiar, mudar para a massagem.

- **Parto:** acalmar e orientar até a USB chegar.

Isso cria o momento mais intenso que o jogo pode ter: **o paciente piora no meio da ligação.** A pessoa diz "ele parou de respirar" e você precisa reclassificar o caso na hora.

**O Modo Inconsistência também em casa.** Essa é, para mim, a melhor melhoria possível. A Dona Zélia é uma minimizadora clássica, igual ao Seu Antônio. Se a mesma mecânica funcionar nos interlúdios, o jogador pode cruzar "tô ótima, filho" com as mãos tremendo e o copo de suco escondido e descobrir sozinho a hipoglicemia dela. O jogo amarra trabalho e família pela mecânica, e não só pela história: você aprende a ouvir os estranhos e a pergunta passa a ser se você ouve a sua própria família.

**Café com custo de verdade.** Hoje o copo de café é só um medidor visual. Ele pode virar uma escolha: tomar café deixa as perguntas mais rápidas por uma hora, mas aumenta o Desgaste à noite e piora o interlúdio (você chega em casa irritado e perde uma opção de diálogo).

**Rádio de mão dupla.** As equipes poderiam pedir coisas no meio do atendimento, como "Central, paciente recusa transporte, o que eu faço?" ou "Precisamos de USA, o caso é pior do que parecia". Isso dá voz e arco próprio ao Seu Bené e torna a frota menos mecânica.

**Painel de metas sempre visível.** Um canto da tela mostra as métricas do Peixoto em tempo real: viaturas enviadas, tempo médio, custo do dia. O jogador sente a pressão institucional o tempo todo, e não só no dia 5.

**3. Rejogabilidade**

O problema hoje é que tudo está roteirizado, então na segunda partida o jogador já sabe as respostas.

**Âncoras fixas e o resto variável.** As ligações ★ continuam fixas. As demais saem de um banco de mais ou menos 150 ligações. O mais importante é que a **mesma abertura pode ter verdades diferentes**: "Minha mãe tá falando enrolado" pode ser AVC numa partida, embriaguez em outra e hipoglicemia numa terceira. Decorar não serve, só investigar.

**Segunda campanha jogando como Simone.** Depois do primeiro final, abre a perspectiva da TARM: você atende primeiro, faz a pré-triagem e passa as ligações para um regulador controlado pela IA, que às vezes erra. É possível ver os mesmos 20 dias de outro ângulo e descobrir a história dela (um filho no tráfico? demissão iminente?).

**Modos de dificuldade:**

- **Narrativo:** mais tempo por ligação e dicas da Simone sempre certas.

- **Padrão:** o jogo como foi descrito.

- **Regulador Real:** sem manual visível (você precisa ter memorizado), a Simone erra com mais frequência e a demissão sai com duas advertências.

**4. Narrativa**

**Personagens do trabalho com arco próprio.** Hoje eles servem principalmente a você. Algumas ideias: a Simone esconde um problema de saúde e um dia desmaia na central. O Peixoto tem uma cena humana, quando um parente dele morre por falta de viatura no corte que ele mesmo aplicou. Um segundo regulador, colega de turno, comete um erro grave, e você pode encobrir ou denunciar.

**Lúcia com agência.** Por enquanto ela reage às suas escolhas. Ela poderia tomar decisões próprias: aceitar trabalho numa fábrica de outra cidade, confrontar o vereador, ou até ser a fonte da Carla sem você saber.

**Os três finais com camadas.** Os três finais continuam, mas cada um ganha de 5 a 8 variações de epílogo, conforme os pacientes salvos, a Integridade e as relações. Seria possível incluir também um **final secreto ambíguo**: o Peixoto cai e oferecem a coordenação a você, desde que você assine os cortes. Pode ser um final "bom" no dinheiro e "ruim" na alma.

**O Diário do Regulador como objeto vivo.** Em vez de só listar os mortos, ele guarda também os vivos, com uma linha sobre o que aconteceu depois ("Seu Antônio voltou a pescar"). Nos momentos de Desgaste alto, o jogador pode ler o diário para se lembrar por que continua.

**5. Alcance e impacto real**

**Valor educativo.** O jogo pode ensinar de forma natural o que um paciente deve dizer ao ligar para o 192: endereço com ponto de referência, se a pessoa respira, se está acordada, desde que horas. Os créditos podem trazer um "guia para quem liga". Isso abre portas para parcerias com secretarias de saúde, faculdades de medicina e campanhas contra trote.

**Consultoria real.** Vale entrevistar reguladores e TARMs e transformar histórias reais (anonimizadas) em ligações. Nenhum roteirista inventa melhor do que a realidade do 192.

**Acessibilidade.** Todas as pistas sonoras precisam de um equivalente visual opcional, e as pistas de texto, de um equivalente em áudio. Ajuda também uma opção de "ligações sem violência explícita" e um aviso de conteúdo sensível no início.

**Se eu tivesse que escolher só três**

1.  **Punição assimétrica.** É a correção mais barata e muda o significado de todo o jogo.

2.  **Modo Inconsistência em casa.** Amarra trabalho e família pela mecânica.

3.  **Banco de ligações com a mesma abertura e verdades diferentes.** Resolve a rejogabilidade e obriga o jogador a investigar de verdade.

Se quiser, posso reescrever o sistema de advertências e economia já com a punição assimétrica, ou montar a cena de interlúdio em que o jogador descobre a hipoglicemia da Dona Zélia com o Modo Inconsistência, com diálogos completos.

vamos aplicar todas menos acessibilidade. nao é minha preocipaçao atual. sobre consultoria, ja tenho isso. qualquer coisa absurda sera corrigida posteriormente por ume equipe de medicos da vida real. nao se preocupe. é importante ter conexoes ao longo da historia

**192: PLANTÃO, versão 2.0**

**Documento de design revisado**

Incorporei todas as melhorias, menos acessibilidade. Também reorganizei a história para que quase todo personagem apareça em mais de um lugar e quase toda escolha tenha consequência mais adiante. A seção 7, "A Teia", mostra essas conexões no detalhe.

**1. Sistema disciplinar**

**1.1 Punição assimétrica**

| **Erro**                                                                      | **Penalidade**                                                  | **Desconto** |
|-------------------------------------------------------------------------------|-----------------------------------------------------------------|--------------|
| **Excesso:** USA em caso de USB, USB em caso leve, viatura enviada para trote | **Nota de auditoria.** Duas notas viram uma advertência         | −R\$ 10      |
| **Falta:** subestimar caso grave, dispensar emergência real                   | **Advertência imediata.** Se o paciente morre, abre sindicância | −R\$ 20      |
| **Segurança:** cena insegura sem PM ou Bombeiros                              | Advertência imediata                                            | −R\$ 20      |
| **Destino errado** (a partir do dia 9)                                        | Nota de auditoria                                               | −R\$ 10      |

Três advertências no mesmo plantão levam à demissão. As notas de auditoria zeram a cada dia, mas aparecem no painel do Peixoto e mudam as falas dele.

O efeito é que existem duas pressões opostas sobre o jogador. O Peixoto e as métricas punem o excesso de um jeito suave e constante. O protocolo e a ética punem a falta de um jeito duro e imediato. O jogador fica sempre entre as duas.

**1.2 Decisões defensáveis ⚖**

De 1 a 2 ligações por dia aceitam mais de uma resposta. A auditoria não olha só a decisão, olha o raciocínio. Cada tipo de caso tem perguntas obrigatórias, e o critério é este:

| **Situação**                                      | **Resultado**                                   |
|---------------------------------------------------|-------------------------------------------------|
| Decisão aceitável e perguntas obrigatórias feitas | Correto, com bônus                              |
| Decisão aceitável sem as perguntas obrigatórias   | Nota de auditoria ("decisão sem justificativa") |
| Decisão fora das aceitáveis                       | Penalidade normal                               |

**Exemplo:** "Idosa caída em casa há horas, consciente e confusa." Tanto USB → REG quanto USA → REG são aceitáveis. Mas, se o jogador mandar USB sem perguntar "Toma anticoagulante?" e "Bateu a cabeça?", recebe uma nota. No relatório do fim do dia, a auditoria aparece como um carimbo vermelho nas perguntas que faltaram.

**1.3 Painel de Metas**

Um monitor no canto da mesa, com o logo da Saúde+ Gestão, fica sempre visível e mostra:

- **USA enviadas hoje**, com a meta do dia em amarelo.

- **Tempo médio de regulação.**

- **Custo operacional estimado**, em reais por viatura.

- **Índice de Eficiência**, de 0 a 100, com um rostinho sorridente ou triste.

Quando o índice cai, o Peixoto liga pelo interfone ("Doutor, terceira USA antes do almoço?"). Isso consome alguns segundos e é pressão psicológica pura, sem nenhuma penalidade mecânica. A partir do dia 5, aparece a meta com bônus: R\$ 30 se o dia terminar abaixo do limite de USA.

**2. Novas mecânicas de plantão**

**2.1 Orientação ativa por telefone**

Quando a decisão inclui orientar por telefone, abre um minijogo enquanto a viatura se desloca. O relógio continua correndo e a fila continua crescendo.

| **Minijogo**    | **Como funciona**                                                                                                                                                                                                                                                     | **Falhas possíveis**                                                                  |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| **RCP guiada**  | Um metrônomo visual pede que o jogador aperte ESPAÇO no ritmo de 100 a 120 por minuto, e a contagem é falada para quem está ligando. A cada 2 minutos a pessoa cansa ("não aguento, doutor!") e o jogador precisa mandar trocar de socorrista ("tem mais alguém aí?") | Ritmo errado ou pausa longa derrubam a "qualidade da RCP" e a chance de sobrevivência |
| **Desengasgo**  | O jogador escolhe a sequência de instruções. Se a vítima perder a consciência ("ele amoleceu!"), precisa mudar para RCP na hora                                                                                                                                       | Insistir na manobra com a vítima desacordada                                          |
| **Parto**       | Alterna instruções técnicas com falas de calma. Um medidor de "pânico" de quem liga não pode estourar                                                                                                                                                                 | Pânico alto faz a pessoa largar o telefone                                            |
| **Hemorragia**  | Compressão direta: "aperta forte", "não tira o pano, põe outro por cima"                                                                                                                                                                                              | Mandar retirar o pano encharcado                                                      |
| **Acolhimento** | Escolha de falas de escuta. O relógio fica mais lento e o jogo nunca deixa essa ligação cair por tempo                                                                                                                                                                | Falas apressadas ou julgadoras                                                        |

**2.2 Evolução dinâmica: o paciente piora durante a ligação**

Algumas ligações têm um gatilho escondido. Depois de certo número de segundos, ou se o jogador demorar a decidir, o quadro muda:

*"Doutor... ele parou de responder. Ele tá fazendo um barulho estranho."*

O botão **RECLASSIFICAR** fica disponível o tempo todo. Se a USB já estiver a caminho, o jogador pode:

- mandar uma USA também (gasta mais uma viatura);

- pedir pelo rádio que a USB acelere e encontre uma USA no caminho (manobra de "rendez-vous", que leva o mapa a calcular um ponto de encontro);

- começar a RCP guiada enquanto isso.

**2.3 Rádio de mão dupla**

As equipes chamam a central no meio do atendimento, e cada pedido é uma microdecisão:

| **Pedido da equipe**                             | **Opções**                                                                         |
|--------------------------------------------------|------------------------------------------------------------------------------------|
| "Paciente recusa transporte."                    | Liberar mediante assinatura de termo, insistir, ou falar com o paciente pelo rádio |
| "É pior do que parecia, precisamos de avançado." | Mandar USA (gasta frota) ou fazer rendez-vous                                      |
| "Regional sem maca, estamos retidos há 1 hora."  | Ligar para o hospital e negociar, ou desviar para a UPA                            |
| "Cena ficou hostil."                             | PM imediata ou ordem de recuar                                                     |
| "Óbito constatado no local."                     | Registrar e ouvir. Não há escolha, só o peso                                       |

**Seu Bené** é a voz principal do rádio e tem arco próprio (ver seção 6).

**2.4 Café**

Há uma garrafa térmica na mesa, com no máximo 2 copos por plantão. Cada copo:

- **Durante o plantão:** deixa as perguntas 30% mais rápidas por 2 horas de jogo.

- **Em casa:** Desgaste +8, e o protagonista chega com o estado "Irritado", que bloqueia a opção de diálogo mais carinhosa do interlúdio.

O café transforma o tempo da família em produtividade no trabalho. Quem usa muito fica rápido no plantão e áspero em casa.

**2.5 Diário do Regulador**

O caderno, que fica na gaveta, registra cada paciente que passou pelas suas mãos e o desfecho:

*"Antônio Ferreira, 58. Infarto. Vivo." → (dia 15) "...voltou a pescar no açude, segundo a filha."*

O diário se atualiza com notícias que chegam pelo jornal, pelo rádio e pelas conversas em casa. Quando o Desgaste passa de 70, o jogador pode lê-lo por 1 minuto real (com o jogo pausado) para recuperar Desgaste −10, mas só se o diário tiver mais vivos do que mortos. Se tiver mais mortos, a leitura aumenta o Desgaste em +5.

**3. Modo Inconsistência doméstico**

A mesma tecla TAB funciona nos interlúdios. Em casa não há transcrição de ligação: as pistas estão nas falas, nos objetos do cenário e no comportamento dos familiares.

**Regras:**

- Funciona em todos os interlúdios, mas só alguns têm algo escondido. Usar o modo à toa custa Laços −1, porque a família se sente vigiada ("Para de me examinar, Rafael. Eu sou sua mãe, não paciente.").

- Uma inconsistência encontrada libera uma pergunta de confronto em tom familiar.

**Casos domésticos:**

| **Dia** | **Quem**   | **O que esconde**                                             | **Pistas**                                                                                                         |
|---------|------------|---------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| 10      | Dona Zélia | Hipoglicemia: pulou refeições para sobrar comida              | "Tô ótima" × mãos tremendo × prato intacto na pia × suor na testa × copo de suco escondido atrás da lata de açúcar |
| 13      | Dona Zélia | Ferida no pé                                                  | "Só tô cansada" × mancando × meia com mancha × chinelo trocado por sapato fechado                                  |
| 12      | Lúcia      | Proposta de emprego em outra cidade                           | "Fui no centro" × passagem de ônibus na bolsa × roupa de entrevista no varal                                       |
| 14      | Lúcia      | Já conversou com a jornalista                                 | "Não conheço essa mulher" × cartão da Carla preso na máquina de costura                                            |
| 16      | Davi       | Está apanhando na escola, por causa da professora (ver dia 9) | "Caí no recreio" × machucado no braço × desenho rabiscado com raiva                                                |

Na prática, o jogador passa nove dias aprendendo a ouvir estranhos no telefone, e o jogo pergunta se ele faz o mesmo com a própria família.

**4. Economia revisada**

| **Receita**                                                         | **Valor**                                                       |
|---------------------------------------------------------------------|-----------------------------------------------------------------|
| Plantão fixo                                                        | R\$ 220                                                         |
| USA correta / USB correta / Orientação correta / Trote identificado | +25 / +15 / +8 / +10                                            |
| Decisão defensável bem justificada                                  | +5 extra                                                        |
| RCP guiada com sobrevivência                                        | +R\$ 20                                                         |
| Produtividade (8 ou mais ligações, nenhuma advertência)             | +R\$ 30                                                         |
| Meta do Peixoto                                                     | +R\$ 30 (armadilha)                                             |
| Bico na UPA                                                         | +R\$ 150 (você perde o evento familiar)                         |
| Ateliê da Lúcia                                                     | +R\$ 40 por interlúdio, ou +R\$ 60 com ajudante (ver Rosângela) |

**Despesas base:** R\$ 280 por interlúdio. Valem todas as consequências da versão anterior.

**Caminhos alternativos criados pelas conexões:**

| **Item**               | **Preço normal** | **Caminho alternativo**                                                                            |
|------------------------|------------------|----------------------------------------------------------------------------------------------------|
| Máquina de costura     | R\$ 450          | **Grátis:** a Dona Cida doa a máquina antiga dela, se Humanidade ≥ 6 no dia 13                     |
| Geladeira              | R\$ 350          | **R\$ 200:** o Seu Jairo dá desconto se você contar que é do SAMU e conversar com ele sobre o neto |
| Curativo da Dona Zélia | R\$ 90           | **Grátis:** amostras da UBS conseguidas pela Simone, se a lealdade dela for alta                   |

Ser humano no plantão é recompensado também no dinheiro, e o jogador demora a perceber isso.

**5. Rejogabilidade**

**5.1 Âncoras fixas e banco variável**

Cada dia tem de 3 a 4 âncoras ★ fixas. As outras 6 a 7 ligações são sorteadas de um banco de cerca de 150, filtradas pelas regras liberadas até aquele dia.

**5.2 Mesma abertura, verdades diferentes**

O banco é organizado por **aberturas**. Cada abertura tem de 3 a 5 verdades possíveis, e a semente da partida decide qual é a verdadeira.

| **Abertura**                     | **Verdades possíveis**                                                                                                                                                   |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| "Minha mãe tá falando enrolado." | AVC na janela (USA) · AVC fora da janela (USB) · hipoglicemia (USA) · embriaguez (USB) · dentadura solta e confusão leve (Orientação)                                    |
| "Ele desmaiou."                  | Desmaio vasovagal (Orientação) · arritmia (USA) · hipoglicemia (USA) · convulsão (USB) · trote                                                                           |
| "Tá sangrando muito!"            | Corte superficial com pânico (Orientação) · hemorragia arterial (USA + compressão) · sangramento vaginal na gestação (USA → MAT) · sangramento nasal em hipertenso (USB) |
| "Não consegue respirar."         | Crise de ansiedade (Orientação) · asma moderada (USB) · anafilaxia (USA) · engasgo (USA + desengasgo) · insuficiência cardíaca (USA)                                     |
| "Meu filho tá muito quente."     | Virose (Orientação) · convulsão febril (USB) · meningite (USA) · dengue com alarme (USB)                                                                                 |

As pistas mudam conforme a verdade sorteada: ruídos de fundo, respostas às perguntas, histórico. Decorar não adianta, só investigar.

A **pré-triagem da Simone** também é sorteada. A precisão dela é de 90% nos dias 1 a 9, 75% nos dias 10 a 20, e cai para 50% no dia 17 (ver o arco dela).

**5.3 Dificuldades**

| **Modo**           | **Diferenças**                                                                                                                                                          |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Narrativo**      | Ligações 40% mais longas, Simone sempre certa, minijogos com mais tolerância                                                                                            |
| **Padrão**         | O jogo como foi descrito                                                                                                                                                |
| **Regulador Real** | Manual sem consulta durante a ligação (só entre ligações), demissão com 2 advertências, verdades sorteadas também em algumas âncoras, RCP sem metrônomo visual (só som) |

**5.4 Campanha 2: "Simone"**

Abre depois do primeiro final. São os mesmos 20 dias, vistos como TARM:

- Você atende os primeiros 20 segundos, faz a pré-triagem, escreve a nota e decide **para qual regulador passar**: o protagonista, controlado pela IA, ou o Dr. Henrique (ver seção 6).

- A vida dela também aparece: o filho Wesley, a demissão anunciada, a pressão alta que ela não trata.

- O jogador descobre o que estava por trás da primeira campanha: quem escrevia os post-its anônimos, o que ela sabia sobre o Henrique, e que **no dia 9 foi ela quem decidiu passar a ligação da sua casa para você**. Na campanha dela, é possível desviar essa ligação para o Henrique e ver o que acontece.

**6. Personagens com arco próprio**

**Lúcia** passa a tomar decisões sozinha. Sempre que o jogador faz bico e perde o evento familiar, ela decide sem ele, com base nos Laços e no dinheiro:

| **Momento**                    | **Decisão da Lúcia**                                                                                                                                                                                          |
|--------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Dia 7, se você estiver no bico | Ela recebe o envelope do vereador. Com Laços ≥ 5, joga o envelope fora. Com Laços \< 5 e saldo negativo, aceita e esconde o dinheiro (Integridade −2, e você descobre no dia 18)                              |
| Dia 12                         | Recebe proposta de emprego numa fábrica em Rio Claro de Minas, a 200 km. Se os Laços estiverem abaixo de 5 e você não descobrir (Modo Inconsistência), ela aceita e vai embora com o Davi do dia 13 ao dia 17 |
| Dia 14                         | Revela-se que ela **já era fonte da Carla**, contando dos seus salários atrasados. Você pode apoiar, brigar ou usar isso como ponte para o seu próprio depoimento                                             |
| Dia 17                         | Se tem ateliê, pode contratar a Rosângela (ver seção 7)                                                                                                                                                       |

**Simone, TARM:**

- **Dia 7:** o motoboy com fratura exposta é **Wesley, filho dela**. Ela reconhece o nome e trava. Se você regular rápido e bem e falar com ela depois, a Lealdade dela sobe +2.

- **Dia 12:** ela conta que a OS vai cortar uma TARM por turno no fim do mês, e que provavelmente será ela.

- **Dia 17:** em pleno alagamento, ela tem uma crise hipertensiva na central. Você precisa regular a sua própria colega (USB para a central) enquanto atende a cidade sozinho. Durante 2 horas de jogo, sem pré-triagem, todas as ligações chegam "cruas".

- **Lealdade** (0 a 10): com nível alto, os post-its dela são mais certeiros e ela arranja amostras de curativo. Com nível baixo, ela passa a mandar para você as ligações chatas.

**Dr. Peixoto, coordenador:**

- **Dia 5:** aplica o corte. Comenta, orgulhoso: "Meu pai tem 84 anos e nunca precisou de ambulância. É hábito, doutor, o povo se acostumou mal."

- **Dia 16:** o pai dele, **Seu Osvaldo**, liga com falta de ar e febre (sepse por pneumonia). O sobrenome aparece na ficha e o Modo Inconsistência pode ligar o nome ao do coordenador. Por causa do corte, a frota pode estar vazia.

- **Dia 18:** se o pai sobreviveu, Peixoto entrega documentos à Carla em segredo, por culpa e gratidão. Se o pai morreu, ele se fecha, endurece e tenta culpar você na sindicância.

- Ele é peça-chave do final secreto.

**Dr. Henrique Lacerda, regulador do noturno.** É o colega que assume a fila que você deixa às 19:00, e é o seu espelho: o regulador que você pode virar.

- **Dia 1:** faz a passagem de turno mascando bala de menta. O Modo Inconsistência ainda não funciona em pessoas, mas o texto menciona "cheiro de menta e alguma outra coisa".

- **Dia 8:** chega 30 minutos atrasado e pede que você cubra. Cobrir custa Desgaste +5 e Lealdade dele +1.

- **Dia 10:** se a Dona Zélia desmaiar (ver seção 3), você mesmo liga para o 192 de casa, e **quem atende é o Henrique**, com a fala lenta. Você sabe exatamente o que essa voz significa.

- **Dia 11:** uma ligação que ficou na **sua** fila às 19:00 (se ficou) passa para ele. Ele orienta, e um adolescente com dengue grave morre de madrugada.

- **Dia 12:** sindicância. Ele pede que você confirme no sistema que "o paciente não relatou sangramento na triagem inicial". Isso é uma fraude. Você pode **encobrir** (Integridade −3, Lealdade do Henrique alta), **denunciar** (Integridade +2, ele é afastado e encaminhado para tratamento, a Simone fica dividida) ou **se omitir** (nada muda e o problema continua).

- **Dia 20:** a consequência aparece (ver seção 8).

**Seu Bené, condutor da USA 01:**

- Vai se aposentar. **O dia 20 é o último plantão dele também.**

- Em 2019, foi ele quem dirigiu a viatura que chegou tarde demais para o irmão da Carla, e ele é a fonte anônima original dela. Isso é revelado no dia 18.

- Pelo rádio, ele vai ficando mais íntimo conforme você acerta: no começo diz "Central", depois "Doutor", depois "Rafael".

**Dona Cida** agora tem padrão variável e sinais graduais:

| **Dia** | **Ligação**                                                                          | **Decisão**                                      |
|---------|--------------------------------------------------------------------------------------|--------------------------------------------------|
| 1 a 7   | Conversa: novela, pressão, solidão. Menciona que "costurava pra fora"                | Orientação                                       |
| 8       | **Queda real:** escorregou no banheiro e o punho está torto                          | **USB** (quebra o padrão)                        |
| 11      | **Não liga.** No dia 12 explica: "Tava na comadre, ficou preocupado?"                | —                                                |
| 14      | Pergunta pelo Davi pelo nome, porque lembra o que você contou                        | Orientação (+ Humanidade)                        |
| 16      | **Sinal 1:** esquece o nome da novela ("aquela... das seis")                         | Orientação (ou a pergunta "A senhora está bem?") |
| 17      | **Sinal 2:** a água está entrando na casa dela e ela repete a mesma frase duas vezes | Bombeiros                                        |
| 19      | AVC, às 18:30                                                                        | USA → REG                                        |

Quem cruzar os sinais dos dias 16 e 17 no Modo Inconsistência (usando o diário) libera, no dia 19, uma fala de reconhecimento imediato que poupa 30 segundos preciosos.

**Biel e Seu Jairo:**

- **Dias 2, 3 e 10:** trotes do número 9-8877.

- **Dia 6:** o técnico que conserta a geladeira, **Seu Jairo**, reclama do neto: "O Gabriel vive no celular. Já levou bronca por passar trote, me mata de vergonha." Ele deixa um recibo com o endereço, que o jogador pode prender no quadro de cortiça.

- **Dia 16:** Biel liga chorando: "Meu vô Jairo caiu no banheiro..." O Modo Inconsistência liga o endereço da chamada ao recibo do Seu Jairo no quadro, e a contradição aparece **ao contrário**: é a prova de que a ligação é verdadeira.

**Vereador Arlindo e Dona Odete:**

- **Dia 7:** exige USA para a mãe, que está estável.

- **Dia 18:** liga de novo pela mãe, mas desta vez **ela é a minimizadora**: "Tô bem, meu filho, é ele que inventa." Ela tem 82 anos, está suando frio e enjoada, e é um infarto atípico. O jogador que aprendeu que "vereador é exagero" vai errar.

- É revelado que a Saúde+ Gestão pertence ao cunhado dele.

**Carla Nunes, jornalista:** o irmão dela, Tiago, morreu em 2019 esperando uma ambulância. Ela aparece nos dias 14 e 18, e a matéria dela muda conforme quem colaborou: você, a Lúcia, o Bené, o Peixoto ou ninguém.

**7. A Teia: mapa de conexões**

Cada fio tem uma **semente** (onde é plantado), um **desenvolvimento** e uma **colheita** (onde a consequência aparece).

| **Fio**                 | **Semente**                                                                                         | **Desenvolvimento**                                                                                                          | **Colheita**                                                                                                                                                                                                    |
|-------------------------|-----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Seu Antônio**         | D3: infarto. "Minha filha vive dizendo pra eu ir no médico."                                        | D11: a filha, Juliana, vira a primeira cliente do ateliê da Lúcia ("meu pai disse que foi um médico do SAMU que salvou ele") | D15: Juliana é uma das vítimas vermelhas do show. D20: Antônio liga para agradecer, ou a viúva liga                                                                                                             |
| **Bombinha → Dia 9**    | D3: comprar ou não a bombinha                                                                       | D9: a gravidade da crise do Davi depende disso                                                                               | D9 à noite, e D16                                                                                                                                                                                               |
| **Tia Márcia**          | D8: a professora do Davi elogia a redação e comenta que "é alérgica a tudo, até a picada de abelha" | D9: a "mulher roxa" na fila é ela (anafilaxia). O jogador só sabe se lembrar do sobrenome                                    | D9, em casa: Davi conta que a professora quase morreu, ou que ela morreu. D16: Davi apanha na escola de colegas que dizem que "o pai dele deixou a professora morrer" (só se ela morreu e o Davi recebeu a USA) |
| **Seu Jairo e Biel**    | D6: geladeira e recibo                                                                              | D10: trote do Biel                                                                                                           | D16: a ligação real                                                                                                                                                                                             |
| **Vereador**            | D7: VIP e envelope                                                                                  | D14: Carla pergunta sobre ele. D18: matéria                                                                                  | D18: Dona Odete, de verdade                                                                                                                                                                                     |
| **Henrique**            | D1: bala de menta                                                                                   | D8: atraso. D10: atende a sua família. D11: o erro                                                                           | D12: sindicância. **D20: a ligação das 18:58**                                                                                                                                                                  |
| **Simone e Wesley**     | D7: o filho com fratura                                                                             | D12: a demissão anunciada                                                                                                    | D17: a crise dela. Campanha 2                                                                                                                                                                                   |
| **Peixoto e o pai**     | D5: "Meu pai nunca precisou de ambulância."                                                         | D16: Seu Osvaldo liga                                                                                                        | D18: Peixoto delata ou se fecha. Final secreto                                                                                                                                                                  |
| **Rosângela (a pizza)** | D8: pedido disfarçado                                                                               | D12: liga de um abrigo para agradecer (se foi salva). Se não, o jornal noticia                                               | D17: vira ajudante no ateliê da Lúcia (+R\$ 20 por interlúdio)                                                                                                                                                  |
| **Dona Cida**           | D1 a D7: "eu costurava pra fora"                                                                    | D8: queda real. D13: a Dona Zélia conta que elas se conhecem da igreja e a Cida oferece a máquina                            | D16 e D17: sinais. D19: AVC                                                                                                                                                                                     |
| **Dona Zélia**          | D6: a ligação da criança com a mãe em hipoglicemia ensina os sinais                                 | D6: geladeira e insulina                                                                                                     | D10: a hipoglicemia dela (Modo Inconsistência doméstico)                                                                                                                                                        |
| **Bené e Carla**        | D1: Bené no rádio                                                                                   | D14: Carla menciona o irmão                                                                                                  | D18: revelação. D20: a última corrida do Bené                                                                                                                                                                   |
| **Café e Laços**        | Qualquer dia                                                                                        | Estado "Irritado"                                                                                                            | D15: aniversário. Se você chegar irritado, o Davi esconde o desenho do presente                                                                                                                                 |

**Princípio de design:** nenhuma âncora existe isolada. Cada uma ou é semente de algo que vem depois, ou é colheita de algo que veio antes, e as melhores são as duas coisas ao mesmo tempo.

**8. Roteiro revisado dos 20 dias**

As listas completas de ligações continuam válidas, com as substituições indicadas abaixo. A tabela mostra as âncoras, a casa e os fios que avançam.

| **Dia** | **Plantão (âncoras)**                                                                                                                   | **Em casa**                                                                                                                      | **Fios**                                        |
|---------|-----------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| **1**   | Tutorial. Cida. Parada guiada com **o primeiro minijogo de RCP**. Henrique faz a passagem às 07:00                                      | Bolo de fubá. A Zélia menciona "o grupo de senhoras da igreja"                                                                   | 🌱 Henrique, Cida e Zélia, Bené                 |
| **2**   | Biel: trote 1. A ligação acidental da filha                                                                                             | Conta de água do antigo inquilino, discussão com o proprietário Nogueira                                                         | 🌱 Biel, Nogueira                               |
| **3**   | **Seu Antônio** (com piora no meio da ligação se você demorar mais de 90 s: "o braço ficou pesado"). Infarto atípico em diabética       | Bombinha do Davi                                                                                                                 | 🌱 Antônio e Juliana, bombinha                  |
| **4**   | Tiroteio. **Primeiro pedido de rádio:** "Cena hostil." Cida: "eu costurava pra fora"                                                    | A Lúcia fala da máquina de costura                                                                                               | 🌱 Máquina e Cida                               |
| **5**   | Corte. **O painel de metas aparece.** A meta de 3 USA (há 3 casos de USA reais). Peixoto fala do pai                                    | Davi: "cara de quem chorou"                                                                                                      | 🌱 Peixoto e Osvaldo                            |
| **6**   | AVC na janela (⚖ se o início for "acordou assim"). **Criança com a mãe em hipoglicemia**                                                | **Geladeira quebra.** Seu Jairo e o recibo                                                                                       | 🌱 Jairo, sinais de hipoglicemia                |
| **7**   | Vereador. Eclâmpsia. **Desengasgo guiado** que vira RCP. **Wesley, filho da Simone**                                                    | O envelope (a Lúcia decide se você estiver no bico)                                                                              | 🌱 Vereador e Odete, Simone e Wesley            |
| **8**   | Pizza: Rosângela. **Queda real da Cida (USB).** Criança com petéquias                                                                   | Apresentação do Davi, Tia Márcia e a alergia. Henrique atrasa e pede cobertura                                                   | 🌱 Márcia, Rosângela. ↺ padrão da Cida quebrado |
| **9**   | **Linha Direta:** Davi × **Tia Márcia** (anafilaxia), com uma USA só. Simone viu o número                                               | A revelação de quem era a outra paciente                                                                                         | 🌾 Bombinha, Márcia                             |
| **10**  | Trotes sofisticados. Riso nervoso real                                                                                                  | **Modo Inconsistência doméstico: hipoglicemia da Zélia.** Se você falhar, liga para o 192 e o Henrique atende. Oferta da aliança | 🌾 Zélia. ↺ Henrique                            |
| **11**  | Dengue: 3 alarmes no meio do volume. **A Cida não liga.** A ligação que pode sobrar para o Henrique                                     | Juliana, a primeira cliente (se houver ateliê)                                                                                   | ↺ Antônio, Henrique                             |
| **12**  | Crise emocional (acolhimento). Cida: "tava na comadre". Rosângela liga do abrigo. **Sindicância do Henrique.** Simone conta da demissão | Proposta de emprego da Lúcia (Modo Inconsistência). "Ainda tá aqui com a gente?"                                                 | 🌾 Henrique (decisão). ↺ Lúcia                  |
| **13**  | Soda cáustica (orientação ativa: não provocar vômito). Criança com remédio de pressão                                                   | **O pé da Zélia** (Modo Inconsistência). A Zélia conta da Cida, e a máquina é oferecida se Humanidade ≥ 6                        | 🌾 Máquina. ↺ Cida e Zélia                      |
| **14**  | Carla, ligação-teste. Pré-eclâmpsia. Hemorragia com compressão guiada. Cida pergunta pelo Davi                                          | A Carla na porta, o irmão Tiago. **A Lúcia já é fonte** (cartão na máquina)                                                      | ↺ Carla, Lúcia                                  |
| **15**  | **O Show**, múltiplas vítimas: **Juliana** é vermelha. Infarto durante o evento. Pedidos de rádio em sequência                          | Aniversário do Davi: "um dia inteiro com o pai"                                                                                  | 🌾 Juliana. ↺ Café e Laços                      |
| **16**  | **Biel: o vô Jairo** (o recibo prova a verdade). **Seu Osvaldo, pai do Peixoto.** Cida, sinal 1                                         | Consequências do pé da Zélia. **O Davi apanhando** (se a Márcia morreu)                                                          | 🌾 Jairo, Osvaldo. ↺ Cida                       |
| **17**  | Enchente. **Crise da Simone na central**: 2 horas sem pré-triagem. Cida, sinal 2 (Bombeiros)                                            | Goteiras. Proprietário. Rosângela no ateliê                                                                                      | 🌾 Simone, Rosângela                            |
| **18**  | **Dona Odete, de verdade** (infarto atípico). Ligação-teste do Peixoto. Cida: "li no jornal, você tá bem?"                              | **A matéria sai.** Variações conforme as fontes (você, a Lúcia, o Bené, o Peixoto). O envelope da Lúcia, se houve                | 🌾 Vereador, Peixoto, Bené e Carla              |
| **19**  | Regional sem vaga e vaga zero. **Cida às 18:30**                                                                                        | Véspera. A família reunida, ou não                                                                                               | 🌾 Cida                                         |
| **20**  | Antônio liga para agradecer, ou a viúva. **Última corrida do Bené.** Todas as regras ativas                                             | — (final)                                                                                                                        | 🌾 Tudo                                         |

🌱 = semente · ↺ = desenvolvimento · 🌾 = colheita

**A ligação das 18:58 (dia 20)**

Ela muda conforme o que você decidiu sobre o Henrique no dia 12:

- **Se você denunciou:** ele foi afastado e está em tratamento. Quem chega para o noturno é a substituta, Dra. Paula, presa no trânsito. A parada das 18:58 é de um desconhecido na rua. No epílogo, chega uma carta do Henrique: *"Eu te odiei por três semanas. Hoje faz 60 dias que eu não bebo."*

- **Se você encobriu ou se omitiu:** ele continuou trabalhando e piorando. Às 18:58, a vizinha dele liga: *"O doutor do apartamento 302 tá caído, não respira... ele trabalha aí com vocês, não trabalha?"* É por isso que o colega do noturno ainda não chegou. A RCP guiada mais difícil do jogo acontece com alguém que você conhece. A USA que vai até lá é a do Bené, na última corrida dele.

**9. Exemplos de cenas novas**

**9.1 Dia 10: a hipoglicemia da Dona Zélia**

*Cozinha. Fim de tarde. A Zélia está sentada, de costas para a pia.*

**ZÉLIA:** Chegou cedo hoje, filho. Senta, tem café requentado. **RAFAEL:** A senhora almoçou, mãe? **ZÉLIA:** Almocei, almocei. Arroz com ovo. Tava uma delícia.

*\[TAB: Modo Inconsistência\]* **Pistas no cenário:** prato limpo e seco no escorredor (nenhum prato usado hoje) · mão direita tremendo ao segurar a xícara · gota de suor na têmpora · caixa de isopor com a insulina aberta sobre a mesa · lata de açúcar com um copo de suco escondido atrás

**Conexão encontrada:** "Almocei" × prato seco → *Nova fala liberada* **RAFAEL:** Mãe, o prato tá seco. A senhora aplicou a insulina e não comeu? **ZÉLIA:** *\[pausa\]* ...É que o arroz tava acabando. O menino precisa mais do que eu.

**Conexão encontrada:** mão tremendo × suor × insulina → *a ficha mental mostra "Hipoglicemia: igual à mãe do dia 6"*

**Opções:** A) "Toma o suco agora. Agora, mãe." → Zélia estabiliza. Laços +1. Cena seguinte: os dois comem juntos o último ovo. B) "A senhora não pode fazer isso!" (bronca) → estabiliza, mas Laços −1 e a Zélia se fecha. No dia 13 ela esconde o pé com mais cuidado: menos pistas. C) Não perceber, ou ignorar → às 22:00, ela cai no banheiro. Você liga para o 192. *\[Toque. Voz arrastada.\]* \**"S-SAMU, Dr. Henrique... o que aconteceu?"*

**9.2 Dia 3: Seu Antônio com piora dinâmica**

**ANTÔNIO:** Desculpa incomodar, doutor... é uma queimação, deve ser o feijão. *\[Se o jogador demorar mais de 90 segundos sem decidir:\]* **ANTÔNIO:** Ô doutor... o braço ficou pesado agora. Tá... difícil de... *\[telefone cai\]* **ESPOSA (pegando o telefone):** ANTÔNIO! Ele caiu, doutor, ele não fala! *\[Botão RECLASSIFICAR pisca. Se já foi USB → opção de rendez-vous ou segunda viatura.\]* **"Ele está respirando? Põe a mão no peito dele."** **ESPOSA:** Não... não tá mexendo... → **RCP guiada** até a USA chegar.

*Rádio, minutos depois:* **BENÉ:** Central, USA 01. Pegamos ele em fibrilação, chocamos duas vezes, voltou. Quem tava contando no telefone, doutor? Contou bonito.

O Antônio sobrevive nos dois caminhos se o jogador fizer tudo certo, mas o jogador que decide rápido ganha a versão em que ele nunca chegou a parar.

**9.3 Dia 9 à noite: a revelação**

*Davi na cama, a bombinha do lado do travesseiro.*

**Se a USA foi para a Tia Márcia e o Davi foi de USB:** **DAVI:** Pai, a mãe disse que você mandou a ambulância pequena pra mim. **DAVI:** A tia Márcia também passou mal hoje, sabia? A ambulância grande salvou ela. Amanhã eu vou contar pra ela que foi meu pai.

**Se a USA foi para o Davi:** **LÚCIA (na porta, baixinho):** A escola ligou. A professora dele... a Márcia. Morreu hoje à tarde, em casa. Uma alergia. Disseram que a ambulância demorou. *\[O jogador lembra da fila. Do sobrenome na ficha. "Márcia Albuquerque".\]* **DAVI (da cama):** Pai? A tia Márcia vai voltar segunda?

*Nota:* se a bombinha foi comprada, o Davi estava moderado e a USA para ele seria favorecimento. Se não foi, ele estava grave e as duas escolhas são defensáveis pelo protocolo. Nesse segundo caso, a auditoria não pune nenhuma das duas, e a punição fica toda na história.

**10. Finais**

**Game overs**

Mantidos: **Exonerado**, **Despejo** e **Colapso**. Novo: **"Sindicância"**, que acontece se dois óbitos com sindicância se acumulam ao longo da campanha ou se você é pego fraudando a ficha do Henrique e outro regulador te denuncia.

**Final RUIM: "Linha Ocupada"**

**Condição** (basta uma): um familiar morto · Laços ≤ 2 · Integridade ≤ 2. Mantém o epílogo da ligação para o 192, e quem atende muda conforme os fios. Se o Henrique morreu no dia 20, atende uma voz nova e cansada. Se ele está vivo e você o encobriu, é a voz arrastada dele.

**Final NORMAL: "A Gente Sobreviveu"**

É o caso padrão. O crachá fica no prego, e os epílogos de cada fio aparecem como fotos num mural.

**Final BOM: "O Médico do Telefone"**

**Condição:** família viva e "Bem" · Laços ≥ 7 · Integridade ≥ 6 · pelo menos 4 dos 7 pacientes-chave salvos (Antônio, Davi ou Márcia, Rosângela, Juliana, Jairo, Osvaldo, Cida) · a matéria da Carla publicada com pelo menos duas fontes. **Epílogo:** o do documento anterior, com as variações dos fios abaixo.

**NOVO, Final SECRETO: "A Cadeira"**

**Condição:** o Peixoto cai (pela matéria, ou porque pede demissão depois do dia 16) · Integridade entre 3 e 6 · saldo acima de R\$ 500. A Saúde+ Gestão oferece a coordenação ao protagonista, com salário três vezes maior. Para assumir, ele precisa assinar o "Plano de Otimização", que tira a USA 03 de circulação.

- **Assinar:** a família fica estável e confortável. Na última cena, você está numa sala com ar-condicionado, olhando o painel de metas por dentro. O índice está em 94. Uma ligação toca lá embaixo, na central, e você não ouve mais. O desenho do Davi agora mostra o pai atrás de uma mesa grande, **sem telefone**.

- **Recusar:** cai para o final normal ou bom, com uma linha extra: *"Ofereceram a cadeira. Ele preferiu o telefone."*

**Variações de epílogo por fio**

| **Fio**      | **Se deu certo**                                     | **Se deu errado**                                                    |
|--------------|------------------------------------------------------|----------------------------------------------------------------------|
| Antônio      | Ele e a esposa batem à porta com um bolo             | A viúva manda um bilhete: "Ele não quis incomodar. Nunca quis."      |
| Juliana      | Ela leva 30 encomendas para o ateliê                 | O ateliê perde a primeira cliente                                    |
| Márcia       | Ela vai ao aniversário de 9 anos do Davi             | O Davi deixa um desenho no túmulo dela                               |
| Biel e Jairo | Biel, aos 17, num curso de socorrista                | Biel no velório, olhando o celular, sem conseguir ligar para ninguém |
| Rosângela    | Ela é sócia do ateliê                                | Uma nota de rodapé no jornal                                         |
| Simone       | Fica na central, promovida a supervisora             | É demitida. Na campanha 2 você vê para onde ela foi                  |
| Henrique     | Carta com 60 dias sem beber                          | O crachá dele no quadro de cortiça, com uma fita preta               |
| Peixoto      | Depõe na CPI contra a OS                             | Assume uma central em outra cidade, com as mesmas metas              |
| Bené         | Churrasco de aposentadoria, e você está lá           | Ele se aposenta sem ninguém saber o seu nome                         |
| Cida         | A carta de letra tremida: voltou a assistir à novela | A máquina de costura dela, na sala da Lúcia, coberta com um pano     |

**11. Variáveis do jogo, resumo final**

| **Variável**         | **Faixa** | **Principais influências**                            |
|----------------------|-----------|-------------------------------------------------------|
| Saldo                | R\$       | Economia e eventos                                    |
| Desgaste             | 0 a 100   | Plantões, óbitos, café, bicos, diário                 |
| Laços                | 0 a 10    | Folgas, falas, café, Modo Inconsistência à toa        |
| Integridade          | 0 a 10    | Envelope, Henrique, fraudes, meta do Peixoto          |
| Humanidade           | 0 a 10    | Cida, acolhimento, falas com quem liga e com a Simone |
| Lealdade da Simone   | 0 a 10    | Wesley, cobertura, tom com ela                        |
| Lealdade do Henrique | 0 a 10    | Coberturas e sindicância                              |
| Pacientes-chave      | 0 a 7     | Âncoras                                               |
| Fontes da matéria    | 0 a 4     | Você, Lúcia, Bené, Peixoto                            |

O próximo passo natural seria a **bíblia de roteiro de um dia completo**, com todas as falas, ruídos de fundo, respostas a cada pergunta, gatilhos de piora e pedidos de rádio das 10 ligações. Sugiro o dia 9 ou o dia 16, que concentram mais fios. Também posso montar a **planilha de balanceamento** com a simulação de saldo de três perfis de jogador ao longo dos 20 dias. Qual dos dois você prefere?

aprovo que faça os dois

**192: PLANTÃO. Bíblia do Dia 9 e planilha de balanceamento**

Escolhi o **Dia 9, "Linha Direta"**, para a bíblia de roteiro. É o centro moral do jogo, e é nele que mais escolhas anteriores convergem: a bombinha, a apresentação do Davi, a Rosângela, a queda da Cida e a lealdade da Simone. As orientações clínicas que a sua equipe médica precisa revisar estão marcadas com **\[validar\]**.

**PARTE 1: BÍBLIA DE ROTEIRO, DIA 9, "LINHA DIRETA"**

**1.1 Ficha do dia**

| **Item**               | **Valor**                                                                                                          |
|------------------------|--------------------------------------------------------------------------------------------------------------------|
| Dia da semana          | Quinta-feira                                                                                                       |
| Clima                  | Calor seco de 33 °C, com as mangueiras floridas e as abelhas agitadas                                              |
| Regras novas no manual | **Pág. 9-A:** destino hospitalar. **Anexo 9-B:** concorrência de recursos. **Anexo 9-C:** impedimento do regulador |
| Meta do painel         | No máximo 3 USA                                                                                                    |
| Ligações               | 10, sendo 2 âncoras ★ (a 8 e a 9). As outras saem do banco; o que aparece aqui é a semente de referência           |

**Texto do manual, novas páginas:**

- **9-A, Destino.** O Regional (REG) recebe trauma grave, vermelhos clínicos e pediatria grave. A UPA Norte recebe amarelos adultos e pediátricos e fraturas simples. A Maternidade (MAT) recebe gestantes com mais de 20 semanas e partos.

- **9-B, Concorrência.** Quando há dois vermelhos e um só recurso avançado, o regulador prioriza, nesta ordem: o maior risco imediato de morte, o menor tempo de chegada e a possibilidade de suporte intermediário. A justificativa precisa ser registrada na ficha.

- **9-C, Impedimento.** O regulador não deve regular familiar nem pessoa com quem tenha vínculo. Nesses casos, aciona a coordenação.

**Frota às 07:00** (depois do corte do dia 5):

| **Viatura** | **Base**       | **Equipe**           | **Status**     |
|-------------|----------------|----------------------|----------------|
| USA 01      | Centro         | Seu Bené, Dr. Castro | Disponível     |
| USA 02      | Norte          | Tico, Dra. Fernanda  | Disponível     |
| USB 01      | Vila Esperança | Técnica Joana        | Disponível     |
| USB 02      | Centro         | Técnico Ramon        | Disponível     |
| USB 03      | Norte          | Técnica Lia          | Disponível     |
| USB 04      | Oficina        | —                    | Volta às 12:00 |

**Dependências que vêm de dias anteriores:**

| **Flag de origem**                       | **Efeito no Dia 9**                                                                                                                                                 |
|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| D3: bombinha comprada                    | Crise do Davi **Moderada (M)** ou **Grave (G)**                                                                                                                     |
| D8: foi à apresentação ou fez bico       | O bilhete da professora está na mesa nos dois casos. Se você foi, ela entregou em mãos. Se fez bico, a Lúcia colocou no seu jaleco: "A professora mandou pra você." |
| D8: Rosângela viva ou morta              | Muda a manchete do jornal e a ligação 5                                                                                                                             |
| D8: queda da Cida regulada ou dispensada | Muda a ligação 3                                                                                                                                                    |
| D8: cobriu o Henrique                    | Muda o tom da passagem de turno                                                                                                                                     |
| Lealdade da Simone ≥ 6                   | Ela oferece segurar a linha às 14:00                                                                                                                                |
| Intimidade com o Bené                    | Ele chama você de "Central", "Doutor" ou "Rafael"                                                                                                                   |

**1.2 Abertura**

**Jornal da manhã:**

- Se a Rosângela foi salva: *"Mulher pede socorro com 'pedido de pizza' e é resgatada. Agressor preso na Rua Ipê."*

- Se morreu: *"Mulher é morta em casa na Rua Ipê. Vizinhos dizem que ouviram gritos."*

- Em todas as versões, uma nota de rodapé: *"Calor multiplica enxames nas mangueiras do Jardim Primavera."* (É a semente da ligação 9.)

- Em todas as versões, um anúncio: *"Saúde+ Gestão comemora economia de 18% na frota do SAMU."*

**Passagem de turno, 07:00:**

*Henrique está de pé, jaleco aberto, mascando bala de menta. O cheiro de menta é forte demais para as sete da manhã.*

**HENRIQUE** (se você cobriu no D8): Rafael, meu herói. Te devo uma, sério. **HENRIQUE** (se não cobriu): Ah. Bom dia. *(não olha para você)* **HENRIQUE:** Noite tranquila. Deixei um velhinho de pressão na fila, ligou 06:52. Nada demais, você pega. *As mãos dele não param de mexer no crachá.* **HENRIQUE:** Vou dormir até as cinco. Se o Peixoto perguntar, eu saí sete e quinze.

**Opção:** "Henrique, você tá bem?"

**HENRIQUE:** Tô ótimo. Calor, né.

Isso grava a flag henrique_perguntado. No D12, ele lembra que você foi o único que perguntou.

**1.3 Linha do tempo**

| **Hora**       | **Evento**                                                                              |
|----------------|-----------------------------------------------------------------------------------------|
| 07:00          | Passagem de turno                                                                       |
| 07:05          | Ligação 1: Seu Valdir (na fila desde 06:52)                                             |
| 08:20          | Ligação 2: motociclista na Av. Norte                                                    |
| 09:00          | Ligação 3: Dona Cida                                                                    |
| 10:15          | Ligação 4: parto na Rua das Acácias                                                     |
| 11:00          | **Rádio:** USA 02 retida no Regional                                                    |
| 11:30          | Ligação 5: trote na Rua Ipê                                                             |
| 12:40          | Ligação 6: Seu Hélio                                                                    |
| 13:30          | Ligação 7: Thaís e o filho Pedro                                                        |
| 13:40          | USB 01 volta à base de Vila Esperança (roteirizado)                                     |
| 13:45          | **Interfone do Peixoto**                                                                |
| **14:00**      | **★ Ligações 8 e 9, juntas**                                                            |
| 14:00 às 17:00 | Janela de respiro intencional. Rádios, consequências e a fila acumulada de quem é lento |
| 17:50          | Ligação 10: Bruna, "não consigo respirar"                                               |
| 19:00          | Fim do plantão                                                                          |

**Nota de design:** as ligações da manhã chegam espaçadas, mas o jogador lento acumula fila, e as ligações 5 a 7 acabam invadindo a tarde. O bloco das 14:00, somado aos minijogos de orientação, consome de 1h30 a 3h de jogo. A tarde tem poucas ligações novas justamente para isso.

**Garantia de roteiro:** às 14:00 existe **exatamente uma USA livre**. Se o jogador mandou a USA 02 para o motociclista, ela é a viatura retida no Regional. Se mandou a USA 01, a retida é a 01 e a 02 fica livre (as falas mudam de acordo). Se não mandou USA nenhuma antes das 14:00, a USA 02 tem pane elétrica às 12:30 e só volta às 16:00.

**1.4 Ligações do dia (menos as âncoras)**

**Ligação 1: Seu Valdir, 07:05 ⚖ (decisão defensável)**

**Nota da Simone:** "Senhor educado. Pressão alta." **Ambiente:** *\[rádio AM dando notícias, passarinho de gaiola\]*

**VALDIR:** Bom dia, doutor. Desculpa ligar cedo. Fui na farmácia medir a pressão e deu 18 por 11. A moça ficou assustada e mandou eu ligar.

| **Pergunta**         | **Resposta**                                                                      |
|----------------------|-----------------------------------------------------------------------------------|
| Idade e doenças      | "71. Pressão alta há vinte anos."                                                 |
| Toma remédio?        | "Tomo, mas acabou no posto faz dois dias. Disseram que chega semana que vem."     |
| O que está sentindo? | "Uma dorzinha de cabeça, igual sempre."                                           |
| Dor no peito?        | "Não, senhor."                                                                    |
| Falta de ar?         | "Não."                                                                            |
| FAST                 | "Tô sorrindo pro senhor aqui." Levanta os dois braços. Repete a frase normalmente |
| Visão e confusão     | "Enxergo bem. Tô lúcido, doutor, sou contador aposentado."                        |
| Desde quando?        | "A dor de cabeça desde ontem."                                                    |

**Decisões aceitáveis:** Orientação (UBS hoje, remédio pela Farmácia Popular) ou USB para a UPA. **Perguntas obrigatórias:** dor no peito, falta de ar, FAST, visão e confusão. Sem elas, a decisão gera nota de auditoria. **USA:** nota (excesso). **Fios:** a ficha mostra "recebida 06:52, regulador: —". Foi o Henrique que deixou. A frase "acabou no posto" ecoa o remédio da Dona Zélia, e a Farmácia Popular reaparece (ver Parte 2, bombinha).

**Ligação 2: motociclista, 08:20**

**Nota da Simone:** "Acidente na Av. Norte. Vítima no chão." **Ambiente:** *\[buzinas, motor ligado, alguém gritando "não mexe nele!"\]*

**CLÉBER (frentista):** Um motoqueiro bateu num carro aqui na frente do posto, ele tá no chão, não responde!

| **Pergunta**  | **Resposta**                                               |
|---------------|------------------------------------------------------------|
| Respira?      | "Tá fazendo um barulho, tipo ronco."                       |
| Capacete?     | "Tá de capacete. Tá saindo sangue do ouvido."              |
| Se mexe?      | "Não."                                                     |
| Local seguro? | "O carro tá parado no meio da pista, tem gente desviando." |
| Referência    | "Posto Avenida, em frente."                                |

**Correto:** USA para o REG. Pelo mapa, a USA 02 chega em 6 minutos e a USA 01 em 14. **Orientação:** não tirar o capacete, não mexer na vítima, sinalizar a pista **\[validar\]**. **Gatilho de piora (mais de 100 segundos sem despacho):** "Ele vomitou! Tá engasgando!" O jogador orienta a lateralização em bloco **\[validar\]**. **Rádio, 08:55, Dra. Fernanda:** "Central, USA 02. TCE grave, Glasgow 6, intubado. Seguimos Regional." A vítima é Everton, 22 anos, entregador de aplicativo. **Fio:** se a Lealdade da Simone estiver alta, ela comenta baixinho: "Conheço esse menino. Entrega junto com o Wesley."

**Rádio das 11:00: retenção de maca**

**TICO (USA 02):** Central, USA 02 no Regional. Sem maca. Paciente intubado na nossa, não dá pra tirar. Previsão... não tem previsão.

| **Opção**                        | **Custo**          | **Resultado**                       |
|----------------------------------|--------------------|-------------------------------------|
| Ligar para o Regional e negociar | 15 minutos de jogo | A USA 02 é liberada às **14:20**    |
| Não ligar                        | 0                  | A USA 02 só é liberada às **15:30** |

**Nota de design:** nenhuma das opções libera a viatura antes das 14:00. Mas negociar agora é o que torna possível o rendez-vous das 14:20, que salva vidas no bloco das 14:00. O jogador não tem como saber disso de antemão. É a regra de "consequência atrasada" funcionando dentro de um único dia.

**Ligação 3: Dona Cida, 09:00**

**Variante A (a queda do D8 foi regulada):**

**CIDA:** Oi meu filho, é a Cida! Ó, o gesso tá coçando que é uma loucura. Posso enfiar uma agulha de tricô por dentro?

O jogador pergunta sobre os dedos: "Rosadinhos, mexendo." A orientação é não enfiar nada no gesso e procurar atendimento se os dedos ficarem roxos, inchados ou dormentes **\[validar\]**.

**CIDA:** Ah, e uma amiga minha da igreja falou que o netinho dela tem asma. Coitadinho. Meu falecido tinha, sabe? Eu deixava a bombinha sempre na bolsa, sempre. A gente nunca sabe a hora.

**Variante B (a queda do D8 foi dispensada):**

**CIDA:** O punho tá roxo e inchado desde ontem, meu filho. Não dormi.

Agora o correto é USB para a UPA, e o diário registra o atraso.

**Fios:** a "amiga da igreja" é a Dona Zélia, o que só se revela no D13. Para quem não comprou a bombinha, a fala sobre a bolsa é um soco no estômago cinco horas antes da crise.

**Ligação 4: parto, 10:15**

**Nota da Simone:** "Gestante, contrações. Marido no telefone." **Ambiente:** *\[gemidos ritmados, criança pequena perguntando "mamãe tá dodói?"\]* **Endereço:** Rua das Acácias, 88, Vila Esperança. No mapa, o ícone "SUA CASA" aparece a quatro casas dali.

**DIEGO:** Minha mulher tá ganhando neném! A bolsa estourou, ela diz que quer fazer força!

| **Pergunta**    | **Resposta**                           |
|-----------------|----------------------------------------|
| Semanas         | "39."                                  |
| Primeiro filho? | "Segundo. O primeiro nasceu no carro." |
| Vê a cabeça?    | "Tô vendo... cabelinho!"               |
| Sangramento     | "Pouquinho."                           |
| Pré-natal       | "Fez tudo, tudo normal."               |

**Correto:** USB 01 para a MAT, com o minijogo de orientação de parto. **Gatilho (mais de 120 segundos sem despacho):** o bebê nasce durante a ligação. O jogador orienta a secar o bebê, colocá-lo pele a pele com a mãe, cobrir os dois e não puxar o cordão **\[validar\]**. **Rádio, Joana (USB 01):** "Central, USB 01. Recém-nascido chorando forte, mãe bem. Seguimos Maternidade. Vizinha do senhor, né, doutor? A dona aqui disse que conhece sua esposa." **Fio:** a USB 01 volta à base às 13:40 e fica a 3 minutos da sua casa às 14:00. No interlúdio, a Lúcia comenta: "O Diego da 88 até ofereceu carona se a gente precisasse... mas tava na maternidade."

**Ligação 5: trote, 11:30**

**Nota da Simone:** "Neto, avó caiu da escada." **Ambiente:** *\[música de videogame baixinha\]*

**VOZ (adulto jovem, calmo):** Minha avó caiu da escada. Rua Ipê, 112, Jardim Norte. Manda rápido.

**Pistas:**

- O endereço é a casa da Rosângela, que aparece no jornal sobre a mesa. Se ela foi salva, a casa está vazia e ela está no abrigo. Se morreu, a casa está interditada.

- "Ligar de volta" dá "número inexistente" (chip descartável).

- "Qual o nome da sua avó?" é respondido com uma hesitação: "Dona... Maria."

- "Ela está consciente?" é respondido com "Tá, tá sim... não, desmaiou."

**Correto:** Trote. Se o jogador mandar viatura, recebe nota, e o rádio relata: "Central, casa fechada, fita da polícia na porta."

**Ligação 6: Seu Hélio, 12:40**

**Nota da Simone:** "Senhor diabético, diz que já melhorou."

**HÉLIO:** Doutor, eu tremi todo, suei, achei que ia morrer. Aí minha mulher me deu um suco com açúcar e passou. Precisa de ambulância?

| **Pergunta**       | **Resposta**                                                                            |
|--------------------|-----------------------------------------------------------------------------------------|
| Insulina?          | "Tomo de manhã."                                                                        |
| Comeu?             | "...Pulei o almoço. Minha mulher fala que eu pulo pra economizar, mas é falta de fome." |
| Mediu?             | "Tava 54. Agora deu 112 no aparelhinho."                                                |
| Consciência e fala | Normais                                                                                 |

**Correto:** Orientação. Comer agora, não aplicar mais insulina sem orientação, ir à UBS para ajustar a dose, ligar de novo se repetir **\[validar\]**. Mandar USB gera nota. **Fio:** o diário registra "Hélio: insulina e refeição pulada". No D10, o Modo Inconsistência doméstico consegue ligar essa entrada ao prato seco da Dona Zélia.

**Ligação 7: Thaís, 13:30**

**Nota da Simone:** "Mãe calma, criança com dor de ouvido."

**THAÍS:** O Pedro tá com dor no ouvido desde ontem, 38 de febre. Tá brincando, comendo... A tia Márcia, do 3º B, mandou ele pra casa de manhã. Ela é um anjo, aquela mulher.

**Correto:** Orientação (UBS ou UPA por meios próprios). **Fios:** o bilhete na mesa diz "3º B". Pedro é colega de turma do Davi. É a primeira menção à Márcia no dia, meia hora antes da ligação dela. No D16, se a Márcia tiver morrido, é o Pedro quem espalha na escola que "o pai do Davi deixou a professora morrer", porque a mãe dele leu a matéria.

**Interfone do Peixoto, 13:45**

**PEIXOTO:** Doutor, painel amarelo. Uma USA presa no Regional, a outra é a última. A 01 é reserva técnica: só sai pra parada, entendeu? Pra parada.

Essa ordem não está em lugar nenhum do manual. O Modo Inconsistência pode ligá-la à página 1 ("USA: risco imediato de morte"). Se o jogador fizer essa ligação, o diário registra **"ordem verbal sem respaldo"**, que pode ser entregue à Carla no D14 como prova.

**Ligação 10: Bruna, 17:50 ⚖**

**Nota da Simone:** "Moça, falta de ar." **Ambiente:** *\[respiração rápida e curta, choro, porta batendo\]*

**BRUNA:** Eu não consigo respirar! Minha boca tá formigando, minhas mãos tão travando!

| **Pergunta**              | **Resposta**                                  |
|---------------------------|-----------------------------------------------|
| Idade e doenças           | "19. Nada."                                   |
| Fala frases inteiras?     | Sim, entre soluços                            |
| Lábios roxos?             | "Não... tá normal."                           |
| Inchaço, picada, alergia? | "Não!"                                        |
| Chiado?                   | "Não, só não entra ar."                       |
| Dor no peito?             | "Aperta, mas é de nervoso."                   |
| O que aconteceu antes?    | "Briguei com meu namorado... ele foi embora." |

**Decisões aceitáveis:** Orientação com respiração guiada (minijogo de acolhimento, contando 4 tempos) ou USB. **Perguntas obrigatórias:** fala frases, cor dos lábios, inchaço ou alergia, dor no peito. **USA:** nota.

**Nota de design:** a abertura "não consigo respirar" é a mesma da Márcia. Um jogador abalado tende a mandar a USA por reflexo. Se a Márcia morreu e o Desgaste está acima de 60, a palavra "roxa" aparece por um instante na transcrição, mesmo que a Bruna nunca a diga.

**1.5 O bloco das 14:00**

**A fila às 14:00**

**CARTÃO A, linha 3:** "RES. RUA DAS ACÁCIAS, 40." Post-it da Simone: *"Doutor. É da sua casa."* Com Lealdade ≥ 6, ela acrescenta: *"Quer que eu fique na linha com ela enquanto o senhor pega a outra?"*

**CARTÃO B, linha 5:** "Homem. Esposa com falta de ar depois de picada de abelha. Muito nervoso." Endereço: Jardim Primavera, Rua Jacarandá, 215.

**O mapa às 14:00:**

| **Viatura** | **Status**                 | **Chegada à casa (A)**      | **Chegada à Márcia (B)**     |
|-------------|----------------------------|-----------------------------|------------------------------|
| USA 01      | Disponível, Centro         | 11 min                      | **7 min**                    |
| USA 02      | Retida no REG              | Liberação às 14:20 ou 15:30 | 13 min a partir da liberação |
| USB 01      | Disponível, Vila Esperança | **3 min**                   | 12 min                       |
| USB 02      | Disponível, Centro         | 10 min                      | 8 min                        |

**Nota de design:** a geografia favorece a decisão de protocolo no cenário moderado. A USB fica perto da sua casa e a USA perto da Márcia. No cenário grave, a USB que chega em 3 minutos com oxigênio vira um argumento real a favor de mandar a USA para a Márcia, e o jogo não aponta qual é o certo.

**Três formas de entrar:**

1.  Atender a ligação A primeiro.

2.  Atender a ligação B primeiro. A Lúcia espera, ou a Simone segura a linha se a lealdade dela permitir.

3.  **Declarar impedimento** (Anexo 9-C). O jogador chama o Peixoto pelo interfone (custa 10 minutos). O Peixoto assume a ligação A na linha dele e o jogador fica livre para a ligação B.

Se o jogador demorar mais de 4 minutos para atender a ligação A, a Lúcia desliga e liga de novo, mais desesperada. No cenário grave, quem liga na segunda vez é a Zélia.

**Ligação 8 ★: Casa (Lúcia)**

**Abertura no cenário Moderado (bombinha comprada):**

**LÚCIA:** Rafael? É você? ...Ai, graças a Deus. É o Davi, ele tá com crise. Eu dei a bombinha com o espaçador, melhorou um pouco, mas ele tá chiando muito e o peito tá puxando. *\[ao fundo: chiado audível. ZÉLIA: "Devagar, meu anjo, o ar entra pelo nariz..."\]*

**Abertura no cenário Grave (sem bombinha):**

**LÚCIA:** Rafael! O Davi não tá respirando direito, a bombinha acabou faz dias, eu não sei o que fazer! *\[ao fundo: um silêncio estranho. ZÉLIA: "Lúcia, a boquinha dele tá ficando roxa."\]* **LÚCIA:** Mas pelo menos parou de chiar, né? Isso é bom, né?

| **Pergunta**        | **Moderado**                                                                   | **Grave**                                |
|---------------------|--------------------------------------------------------------------------------|------------------------------------------|
| Ele consegue falar? | "Fala, mas pouquinho. Davi, fala com o pai." **DAVI:** "Pai... tô... cansado." | "Ele não consegue, só balança a cabeça." |
| Lábios e unhas      | "Normais."                                                                     | "Roxinhos."                              |
| Está sonolento?     | "Não, tá assustado."                                                           | "Tá com o olho pesado, Rafael."          |
| O peito afunda?     | "Um pouco, embaixo da costela."                                                | "Muito, até no pescoço."                 |
| Bombinha            | "Dei há 15 minutos, como o médico ensinou."                                    | "Acabou."                                |
| Gripe ou febre?     | "Tava tossindo desde ontem."                                                   | Igual                                    |
| Desde quando?       | "Uma hora."                                                                    | "Uma hora e pouco, foi piorando."        |

**Inconsistência no cenário grave:** "parou de chiar, isso é bom" contra lábios roxos, sonolência e a página 5-B do manual (respiratório). Ligar essas pistas revela o **tórax silencioso**, que é sinal de gravidade. A Lúcia está minimizando sem saber. Nunca fica tão claro quanto aqui que você aprendeu a ouvir estranhos.

**Opção especial, "Falar com o Davi":**

- Moderado: **DAVI:** "Pai... você vai mandar... a ambulância grande?"

- Grave: **ZÉLIA:** "Ele tá ouvindo, filho. Fala com ele." O jogador escolhe uma fala de calma para o próprio filho.

**Foto da família:** se o jogador clicar nela durante essa ligação, o jogo não recupera foco. A única coisa que aparece é: *"Você olha a foto. Ele está nela."*

**Orientação ativa nos dois cenários:** manter o Davi sentado e inclinado para a frente, afrouxar a roupa, não deitá-lo. No moderado, repetir a bombinha conforme a receita **\[validar\]**. O medidor de pânico é o da Lúcia, e a sua voz influencia o dela.

**Evolução enquanto espera:** no moderado, o Davi fica estável por 25 minutos de jogo e depois piora para grave-leve. No grave, o quadro piora a cada 10 minutos sem recurso. **Regra de design: o Davi nunca morre no Dia 9.** O tempo de espera só altera o tempo de internação e o custo emocional. O jogo pesa a escolha, mas não executa uma criança por ela.

**Ligação 9 ★: Márcia**

**MARCOS:** Moça! Doutor! Minha mulher tá roxa, ela não consegue respirar! Foi uma abelha, lá no pé de manga, ela é alérgica, pelo amor de Deus! *\[ao fundo: respiração com um assobio agudo, cachorro latindo. MÁRCIA, rouca: "Marcos... a garganta..."\]*

**Na ficha:** "Márcia Albuquerque Reis, 41 anos."

| **Pergunta**       | **Resposta**                                                          |
|--------------------|-----------------------------------------------------------------------|
| Está acordada?     | "Tá, mas tá ficando mole."                                            |
| Respira?           | "Faz um barulho fino, tipo apito."                                    |
| Inchaço?           | "A boca e o olho tão inchando, tá cheio de mancha vermelha no braço." |
| Alergia conhecida? | "Abelha! Ela quase morreu uma vez, faz anos."                         |
| Tem adrenalina?    | "Tem                                                                  |

uma caneta, a médica deu, mas tá vencida desde o ano passado!" \| \| Que horas foi a picada? \| "Agora, faz uns cinco minutos." \| \| Endereço e referência \| "Rua Jacarandá, 215, casa do portão azul, tem um pé de manga enorme na frente." \| \| Ela é professora? (só se o jogador ligar o sobrenome ao bilhete) \| "É... do Estadual. Como o senhor sabe?" \|

**Correto:** USA para o REG. **Orientação ativa:** aplicar a caneta mesmo vencida, na coxa, por cima da roupa se necessário. Deixar a paciente sentada se respira melhor assim, ou deitada com as pernas elevadas se ficar mole. Não dar nada pela boca **\[validar\]**. **Inconsistência opcional:** "Márcia Albuquerque" contra o bilhete da professora na mesa ("Tia Márcia, 3º B") e a fala da Thaís às 13:30. A conexão não muda a decisão correta, só o peso dela. Ela grava a flag sabia_que_era_marcia, que muda a cena da noite.

**Evolução:**

- Caneta aplicada antes de 3 minutos: o quadro estabiliza por cerca de 15 minutos de jogo.

- Sem caneta, ou só com USB: aos 12 minutos ela perde a consciência e entra em parada. Abre a RCP guiada com o Marcos. Se a USA chegar até 8 minutos depois da parada, a chance é de 40%. Depois disso, óbito.

**Matriz de resolução do bloco das 14:00**

| **Cenário** | **Decisão**                                                                                 | **Resultado Davi**                                                | **Resultado Márcia**                                                                                              | **Disciplina**                                                                               |
|-------------|---------------------------------------------------------------------------------------------|-------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| **M**       | USA → Márcia, USB 01 → Davi                                                                 | Estável, UPA, alta à noite                                        | Viva                                                                                                              | Bônus (+25 e +15). **Conquista "Nem Pelo Meu Filho"**                                        |
| **M**       | USA → Davi, USB → Márcia                                                                    | Bem                                                               | Morre, a não ser que a caneta tenha sido aplicada e o rendez-vous das 14:20 seja feito (aí sobrevive com sequela) | **Advertência** (falta) + nota (excesso) + **sindicância** por favorecimento. Integridade −3 |
| **M**       | Impedimento declarado, Peixoto regula A                                                     | O Peixoto manda USB (correto)                                     | Você regula B livremente                                                                                          | Sem penalidade. Integridade +1. O Peixoto comenta: "Pelo menos isso você sabe."              |
| **G**       | USA → Márcia, USB 01 → Davi (com O₂)                                                        | Chega em 3 minutos, estabiliza a caminho do REG, 3 dias internado | Viva                                                                                                              | Nenhuma penalidade. Desgaste +15. A Lúcia fica fria por 2 dias (Laços −2)                    |
| **G**       | USA → Davi, USB → Márcia                                                                    | Bem, 1 dia internado                                              | Viva só com caneta + rendez-vous das 14:20. Sem isso, morre                                                       | **Nenhuma penalidade** (defensável). A punição é narrativa                                   |
| **G**       | Rendez-vous: USB 01 → Davi, USA → Márcia, USA 02 liberada às 14:20 → encontra a USB do Davi | Melhor desfecho possível                                          | Viva                                                                                                              | Bônus duplo. Só é possível se o jogador negociou com o Regional às 11:00                     |

**Nota de design:** o rendez-vous é a "terceira via" escondida. Ela premia quem fez a coisa chata e burocrática três horas antes. Esta é a mensagem do dia: no SAMU, salvar alguém às 14:00 começa às 11:00.

**Rádios pós-bloco**

**BENÉ (USA 01, Márcia viva):** Rafael, Márcia estabilizada. A caneta vencida segurou ela. Quem mandou aplicar? ...Achei. Bom trabalho. **BENÉ (Márcia morta):** Central... óbito constatado às 14:31. *(pausa)* O marido tá perguntando o nome do regulador. Eu não falei. **JOANA (USB 01, Davi):** Doutor, seu menino tá bem. Tá pedindo pra ver a sirene. Liguei ela um pouquinho, não conta pro Peixoto.

**Simone, 15:00 (sempre):**

**SIMONE:** Eu vi o número, doutor. Não vou falar nada. *(com Lealdade ≥ 8)* **SIMONE:** E, se quer saber, eu teria feito igual. Qualquer que fosse.

**1.6 Relatório do fim do dia**

O relatório tem um campo novo, **"Justificativa de concorrência (Anexo 9-B)"**, e o jogador precisa escolher uma de três frases:

1.  "Maior risco imediato de morte."

2.  "Menor tempo de chegada."

3.  "Vínculo pessoal." (Só aparece se o jogador mandou a USA para o Davi.)

Escolher a frase 1 ou 2 quando a frase 3 é a verdadeira conta como **fraude de ficha**: Integridade −2 e flag mentiu_9B. No D12, durante a sindicância do Henrique, ele usa isso: "Você também já ajeitou ficha, Rafael. Eu vi o dia 9."

**1.7 Interlúdio do Dia 9**

As variantes de revelação já estão no documento anterior (seção 9.3). Seguem os acréscimos:

- **Se sabia_que_era_marcia:** o jogador ganha uma fala extra antes do Davi falar: "Eu sabia quem era." É uma confissão para a Lúcia, que pode responder com Laços ≥ 6 "Você fez o que tinha que fazer" ou com Laços \< 6 "E mesmo assim?".

- **Custo:** se o Davi foi internado, a família paga R\$ 40 (táxi + farmácia) e a Lúcia não pode costurar nesse interlúdio.

- **A bombinha:** se não havia, a alta do Davi vem com receita. Pela Farmácia Popular sai de graça, mas só se o jogador lembrar disso (a fala do Seu Valdir na ligação 1 libera a opção). Sem isso, o custo é R\$ 80.

- **Folga:** "Ficar com a família" no Dia 9 vale Laços +2, o dobro do normal. Fazer bico neste dia gera Laços −3 e a fala da Zélia: "Você foi trabalhar. Hoje."

**PARTE 2: PLANILHA DE BALANCEAMENTO**

**2.1 Premissas**

| **Parâmetro**            | **Valor**                                                                                                                                                                                        |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Saldo inicial            | R\$ 150                                                                                                                                                                                          |
| Fixo                     | R\$ 220                                                                                                                                                                                          |
| Despesas base            | R\$ 280 por interlúdio (19 interlúdios; o D20 não tem)                                                                                                                                           |
| Eventos totais possíveis | Bombinha 80 · conta de água 70 · geladeira 350 (ou 200, ou isopor 10/dia) · máquina 450 (ou grátis) · aniversário 60 · curativo 90 (ou grátis) · internação do Davi 40 · religação de energia 60 |

**2.2 Perfis**

| **Perfil**         | **Ligações** | **Acerto** | **Advertências e notas**                    | **Bônus médio por dia**                  |
|--------------------|--------------|------------|---------------------------------------------|------------------------------------------|
| **Lento** (L)      | 5 a 6        | 75%        | 1 advertência a cada 3 dias, 1 nota por dia | R\$ 45                                   |
| **Médio** (M)      | 7 a 8        | 85%        | 1 nota por dia, raras advertências          | R\$ 85, produtividade em 1 a cada 3 dias |
| **Experiente** (E) | 9 a 10       | 95%        | Quase nenhuma                               | R\$ 150, produtividade quase todo dia    |

Os descontos já estão abatidos dos bônus.

**2.3 Ganho líquido por dia de plantão (antes de despesas)**

| **Perfil** | **Fixo + bônus**           | **Menos despesas base** | **Saldo diário** |
|------------|----------------------------|-------------------------|------------------|
| L          | R\$ 265                    | −280                    | **−R\$ 15**      |
| M          | R\$ 305 + 10 (prod.) = 315 | −280                    | **+R\$ 35**      |
| E          | R\$ 370 + 25 (prod.) = 395 | −280                    | **+R\$ 115**     |

**2.4 Simulação acumulada (sem bicos, sem ateliê)**

| **Ao fim do dia** | **L**                      | **M**                     | **E**                            | **Evento obrigatório ou provável** |
|-------------------|----------------------------|---------------------------|----------------------------------|------------------------------------|
| 0                 | 150                        | 150                       | 150                              | —                                  |
| 2                 | 120                        | 220                       | 380                              | Conta de água (−70)                |
| 3                 | 105 → **25**               | 255 → **175**             | 495 → **415**                    | Bombinha (−80)                     |
| 5                 | −5                         | 245                       | 645                              | —                                  |
| 6                 | **Geladeira:** só o isopor | 280 → 80 (desconto Jairo) | 760 → 410 (cheia) ou 560 (Jairo) | —                                  |
| 9                 | −80                        | 175                       | 870                              | Internação Davi (só se G)          |
| 13                | −140                       | 315                       | 1.330 → **880**                  | Máquina (−450, se não for doada)   |
| 15                | −170 → **−230**            | 385 → **325**             | 1.110 → **1.050**                | Aniversário (−60)                  |
| 16                | −245 → −335                | 360 → 270                 | 1.165 → 1.075                    | Curativo (−90, se não for grátis)  |
| 19                | **−380**                   | **375**                   | **1.420**                        | —                                  |

**Leitura:**

- **Lento** termina negativo sem medidas extras. Para não ser despejado, precisa de 3 a 4 bicos (+R\$ 150 cada, perdendo eventos) ou vender a aliança (+R\$ 200). É exatamente o sacrifício que o jogo quer forçar.

- **Médio** passa o jogo inteiro entre R\$ 0 e R\$ 400. Consegue pagar quase tudo, mas a máquina (R\$ 450) e a geladeira cheia competem entre si. Precisa escolher, ou ser humano o bastante para ganhar a máquina da Cida.

- **Experiente** termina rico demais (R\$ 1.420). **Isso é um problema** e precisa de ajuste (ver 2.6).

**2.5 Efeito das rotas alternativas (perfil Médio)**

| **Escolhas**                                                             | **Saldo final no D19**                                            |
|--------------------------------------------------------------------------|-------------------------------------------------------------------|
| Nenhuma rota humana, compra tudo cheio                                   | −R\$ 75 (aperto, 1 aluguel atrasado)                              |
| Desconto do Jairo + máquina da Cida + curativo da Simone                 | **+R\$ 765**                                                      |
| As três rotas + ateliê ativo desde o D11 (+40 × 8) + Rosângela (+20 × 2) | **+R\$ 1.125**                                                    |
| Aceitou o envelope do vereador (+1.000)                                  | +R\$ 1.075, mas Integridade cai e o final bom se torna impossível |

**Resultado:** a Humanidade vale aproximadamente o mesmo que o envelope de propina. Essa simetria é intencional e é a tese econômica do jogo: ser decente custa caro no curto prazo, e paga a mesma coisa no longo, só que sem o preço moral.

**2.6 Ajustes para o perfil Experiente**

O jogador experiente não pode passar a segunda metade do jogo sem pressão financeira. Três ajustes:

1.  **Aumento do aluguel no D11:** o proprietário Nogueira sobe de R\$ 100 para R\$ 130 ("o IGP-M, doutor"). Se brigou com ele no D2, sobe para R\$ 140. Efeito: −R\$ 270 a −360 até o final.

2.  **Teto de bônus por dia:** R\$ 150. Acima disso, a OS "glosa" o excedente ("ajuste de produtividade"). É mais uma pequena crítica ao sistema.

3.  **Gastos de conforto opcionais a partir do D10:** fisioterapia para a Zélia (R\$ 60, +Laços, reduz o risco no pé), aula de desenho para o Davi (R\$ 50 por interlúdio, +Laços, muda o desenho do final), uma noite de pizza em família (R\$ 45, Desgaste −10). Dinheiro sobrando vira escolha de afeto, e não acumulação.

**Saldo final revisado no D19:**

| **Perfil** | **Antes** | **Depois dos ajustes (sem gastos de conforto)** |
|------------|-----------|-------------------------------------------------|
| L          | −380      | −650 (precisa de bicos ou aliança)              |
| M          | +375      | +105                                            |
| E          | +1.420    | +900 (e o jogador tende a gastar em conforto)   |

**Atenção ao Final Secreto:** a condição "saldo \> R\$ 500" passa a ser atingível pelo Médio só com as rotas humanas, e pelo Experiente quase sempre. Isso é bom: a tentação da "Cadeira" chega justamente para quem está confortável.

**2.7 Desgaste, simulação do perfil Médio**

| **Fonte**                         | **Por ocorrência** | **Total esperado em 20 dias** |
|-----------------------------------|--------------------|-------------------------------|
| Plantão                           | +5                 | +100                          |
| Óbitos (cerca de 1 a cada 2 dias) | +10                | +100                          |
| Advertências e notas              | +3 / +1            | +25                           |
| Café (1 por plantão)              | +8                 | +160                          |
| Descanso ou família               | −15 / −10          | −230                          |
| Diário positivo                   | −10                | −30                           |
| Foto da família                   | −3                 | −60                           |
| **Saldo**                         |                    | **≈ +65**                     |

**Leitura:** o Médio sem café termina por volta de 25, confortável. Com 1 café por dia, termina por volta de 65 e passa o fim do jogo com o texto tremendo. Com 2 cafés por dia e bicos, chega a 100 lá pelo D16, e é Colapso. **O café é a principal alavanca de risco**, o que está correto.

**2.8 Metas de calibragem para o playtest**

| **Métrica**                                         | **Alvo**                                                   |
|-----------------------------------------------------|------------------------------------------------------------|
| Jogadores que chegam ao D20 na primeira tentativa   | 55 a 65%                                                   |
| Distribuição dos finais na primeira campanha        | Ruim 30% · Normal 50% · Bom 15% · Secreto 5%               |
| Bicos feitos por jogador médio                      | 2 a 4                                                      |
| Jogadores que mandam a USA para o Davi no cenário M | 35 a 50% (abaixo de 20% significa que o dilema está fraco) |
| Jogadores que descobrem o rendez-vous das 14:20     | 10 a 15% (é um segredo, não deve ser óbvio)                |
| Jogadores que reconhecem o AVC da Cida no D19       | 60% (abaixo de 40%, reforçar os sinais dos dias 16 e 17)   |
| Tempo médio por ligação                             | 75 a 95 segundos reais                                     |

Se algum número sair da faixa, os primeiros botões a mexer são, nesta ordem: o valor fixo do plantão, o preço da geladeira e o limite de cafés.

Ficaram dois documentos que a sua equipe médica já pode revisar a partir das marcações **\[validar\]**. A bíblia do Dia 9 serve de modelo para escrever os outros 19 dias no mesmo formato. Os números da planilha são o ponto de partida para o primeiro protótipo jogável.

defina tambem o design do jogo. nao quero nada com design 3d ou realista

Chat de IA [<u>limite de 5 horas</u>](https://www.genspark.ai/helpcenter/membership-plans#usage) atingido.

<img src="media/image1.png" style="width:0.83542in;height:0.83542in" alt="Claude Opus 5.5" />Claude Opus 5.5
