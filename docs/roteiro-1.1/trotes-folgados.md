# Trotes e folgados

## Parte A — Redistribuição dos trotes

**Problema (jogador):** "Os trotes estão TODOS muito óbvios... Praticamente todos têm risadas no fundo... checar endereço deve ficar com a Simone; como médica eu devo ter outros meios de suspeitar."

**Regras novas:**
1. **Risada ao fundo só em 5 trotes "óbvios e engraçados"** (um a cada ~4 dias) — são o alívio cômico assumido.
2. **Todos os outros trotes sem risada.** A suspeita vem de **sinais que o médico ouve**, nunca do endereço (o endereço a Simone confere e escreve no post-it: "endereço ✓" ou "endereço ?"; e às vezes o endereço **confere** e é trote — aí a Simone escreve "endereço ✓" e o jogador precisa do resto).
3. **As cinco perguntas fixas** (Tem pulso? Respira? Cor da pele? Está acordado? O que aconteceu?) viram detectores naturais: trotista responde mal a perguntas concretas.
4. Manual p.2 reescrito (sinais do médico): **(a)** relato de cinema sem detalhe do corpo; **(b)** respostas rápidas demais ou contraditórias às perguntas fixas; **(c)** ambiente que não combina (silêncio onde devia ter desespero; TV, videogame, sinal de escola, eco de banheiro); **(d)** recusa em pôr o paciente ou alguém perto na linha; **(e)** pressa pela sirene ("manda com a sirene ligada!"); **(f)** "Ligar de volta" cai em caixa postal de adolescente, número inexistente ou desligado; **(g)** vídeo (VER) recusado ou "câmera quebrada"; **(h)** voz conhecida/número no quadro (o quadro **não prova** trote: 2019, Biel D16). E a frase da Simone continua: *"Na dúvida, liga de volta. Custa meia hora."*
5. Respostas padrão (`defaults.ts`) de trote **sem** "[risadinha]" por padrão; a risada é marcada à mão só nos 5 óbvios. `video.ts prankVideo`: tirar "[risadas]" dos 3 sorteios; manter "câmera quebrada" e "recusa".
6. Risada em ligação **real** continua (é a armadilha inversa, boa): tornozelo do D2, "ri de nervoso" do D10, festas.

### Tabela por trote (da 1.0.4) — o que muda

| Dia/id | Hoje | 1.1 | Pista para o médico (não é o endereço) |
|---|---|---|---|
| D1 `d01_et` | óbvio, risadas | **ÓBVIO E ENGRAÇADO (fica)** — tutorial | "Sangrando azul"; pergunta "Tem pulso?" → "Tem três! Um em cada coração!" |
| D2 `d02_biel` | risadas, cochicho | **sem risada**; só o cochicho | "Tem pulso?" → "Tem, tem... *(cochicho: fala que não tem!)* ...não tem." Contradição na resposta fixa. Retorno: caixa postal "Fala aí, é o Biel...". |
| D2 `d02_peixe` | óbvio | **ÓBVIO E ENGRAÇADO (fica)** | "Cor da pele?" → "Prateada... de lambari." Cantoria ao fundo. |
| D2 `d02_muda` | acidental | fica (acidental; não é trote malicioso) | — |
| D3 `d03_biel` | xinga, cochicho | **sem risada**; o Biel tenta "voz de adulto" | "O véio tá roxo... ou verde, sei lá" (pergunta "Cor da pele?"). Número já no quadro (a Simone avisa; não prova). |
| D4 `d04_incendio` | TV de auditório | **difícil** | Ambiente: TV de auditório e nenhum grito, nenhuma sirene de vizinho, nenhum barulho de fogo; "cinco feridos" mas não sabe dizer nada de nenhum; "Está acordado?" → "Todos. Não. Uns." Retorno: número não existe. |
| D5 `d05_trote` (professora) | risadas de alunos | **difícil, sem risada** | Crianças **sérias demais**, sussurrando entre si a resposta antes de dizer; "Respira?" → "Respira. Não. Respira." Sinal de escola tocando ao fundo **e** "professora caída" sem nenhum adulto por perto em plena aula. Retorno: a própria professora atende, brava. (Prepara o D6: criança séria de verdade.) |
| D6 `d06_trote` (avó ao contrário) | óbvio | **ÓBVIO E ENGRAÇADO (fica)** | "luza é uéc O". |
| D7 `d07_trote` ("aqui é o morto") | óbvio, risada | **médio, sem risada**: o "tio" fala "Fala que eu tô morrendo!" uma vez, abafado | O "morto" responde à pergunta "Está acordado?" antes do sobrinho ("Tô!"). Churrasco animado ao fundo, ninguém em pânico. |
| D8 `d08_trote` (pizza do Kauê) | "Só se a pizza atrasar!" | **difícil** (espelho da Rosângela) | Voz baixa como a da Rosângela, mas a festa ao fundo **não para** e o "Você está em perigo?" é respondido com piada. Lição: a mesma senha não é a mesma ligação. |
| D9 `d09_trote` (neto, Ipê 112) | sofisticado | **difícil** (fica) | "Minha avó caiu... desmaiou... tá acordada" — muda a cada pergunta fixa; "Qual o nome dela?" → "Dona... Maria." Videogame pausado ao fundo (o som de pausa). |
| D10 `d10_igreja` | locked pelo modo | **difícil** | Silêncio absoluto num "infarto em casa"; sintomas de livro ("dor irradiada para o braço esquerdo e mandíbula"); "Posso falar com o seu pai?" → silêncio; ao fundo, **órgão de igreja**, baixinho. Pergunta "Posso ouvir o seu pai?" libera o confronto. |
| D10 `d10_onibus` | calmo | **difícil** (fica) | Mulher calma num "ônibus escolar tombado" sem nenhuma criança chorando ao fundo; ninguém mais ligou (Simone checa o rádio). |
| D10 `d10_biel` | óbvio | **óbvio sem risada** ("controle do videogame com pilha e tudo") | O próprio videogame tocando musiquinha. Retorno: "é o Biel, neto do Jairo da refrigeração" → libera "Gabriel, o seu avô sabe?". |
| D12 `d12_trote` (capivara) | óbvio | **ÓBVIO E ENGRAÇADO (fica)** | "A capivara mordeu a bunda do primo, doutor! Ele tá sentado de lado!" (risadas) |
| D13 `d13_trote` (soda) | crianças | **difícil, sem risada** | "Um litro inteiro" (impossível); espuma "igual sabão"; "faz voz de morto" (cochicho); a criança "envenenada" grita "MÃE, CADÊ O CARREGADOR?" ao fundo. |
| D14 `d14_trote` (avô no quintal) | sinal de escola | **difícil** (fica) | Sinal de escola; "Benedito Silva... eu sou o neto, Bruno" (nome mudado); "Tem pulso?" → "Tem... uns duzentos." |
| D15 `d15_trote` (tumulto no shopping) | risadas/música | **médio, sem risada** | "Cem pessoas" e nenhum detalhe; música de loja de shopping ao fundo, calma; liga **durante** o MCI real (oportunista). |
| D16 `d16_biel_trote` (jacaré) | quadro | **óbvio sem risada** — de propósito, antes do Biel real | "Um jacaré na fonte da Matriz!" — a última mentira do Biel. |
| D16 `d16_trote` ("Beto, condutor da USB 03") | sofisticado | **difícil** (fica) | Jargão errado ("QRR 5"); a Simone confere a frota: a USB 03 está na base. Retorno "Dudu". |
| D17 `d17_trote` (ônibus no rio) | calmo | **difícil** (fica) | Sem barulho de chuva no meio do temporal histórico. |
| D18 `d18_trote` ("vamos ver se demoram 50 min") | inspirado na matéria | **médio** | O trotista lê a manchete da Gazeta em voz alta; "Cor da pele?" → "Sei lá, normal, tô longe." |
| D19 `d19_trote` (desmaiado no shopping) | videogame | **difícil** | Fundo silencioso de quarto com ventilador; "Está acordado?" → "Não sei, não tô vendo ele." (mas diz que está do lado). |
| D20 `d20_trote` ("sargento Oliveira") | sofisticado | **difícil** (fica) | "QSL, QAP, positivo e operante" (jargão de rádio misturado); sirene em **loop** de áudio (o mesmo trecho repetindo). |
| D20 `d20_trote2` (gato virou morcego) | óbvio | **ÓBVIO E ENGRAÇADO (fica)** — o último riso do jogo | "Meu gato virou morcego! Tá pendurado de cabeça pra baixo na cortina!" |

**Banco (`bank/trotes.ts`):** `trote_classico` (40 pastéis) fica óbvio **mas sem risada em 50% dos sorteios** (pista: "quarenta pastéis" + ketchup no vídeo); `trote_crianca` sem risadinha (cochicho e "mãe tem cem anos"); `desmaiou.trote` vira difícil (sem "alergia a prova de matemática"; pista: "Tem pulso?" → "Tem, forte, uns cento e vinte... não, tá fraco"); `trote_oportunista` e `trote_sofisticado` ficam. `confronto_endereco` sai (é da Simone); `confronto_quadro` vira pergunta comum ("Esse número já ligou aqui antes?") quando o número está no quadro.

---

## Parte B — Folgados (8 ligações para o banco)

**Regra:** são ligações de quem quer a ambulância como táxi, para furar a fila da UPA ou para levar parente a consulta/exame marcado. A conduta é **meios próprios** (botão Outros, branco). As frases do jogador (caixa **Outros**):
- **F1** "A ligação está sendo gravada." — acalma metade; a outra metade xinga mais baixo.
- **F2** "Paciente não é perfil do nosso serviço de urgências." — o folgado discute.
- **F3** "A indicação é levar o paciente por meios próprios." — aceita ou xinga.
- **F4** "Por motivo de conflitos, encerro a ligação." — só depois de conflito (xingamento ou ameaça); antes disso conta como "desligar na cara" (humanidade −1).

**Xingamento:** áudio com bipe **"piii"**; transcrição com símbolos. Os insultos **engraçados que não são palavrão** podem aparecer escritos ("songamonga", "mocorongo", "jumento de jaleco", "sacripanta"). O palavrão de verdade nunca: vira `#%!#@$`, `&%$#!`, `@#$%&*`.

**Pontuação:** acertar = carimbar **ORI** (meios próprios) + escolher a frase certa para o momento. Bônus de "alívio cômico" (desgaste −2) quando o jogador encerra corretamente uma ligação com xingamento. **Falso folgado:** 2 das 8 têm uma verdade "real" sorteável (peso baixo) — o folgado que tem um detalhe grave escondido (mantém a tensão; ver marcação ⚠).

Formato: modelo do banco (`tpl`), tag `folgado` + categoria `outros` (post-it **branco** da Simone, ou da cor errada quando ela erra).

### FG1 — "O Uber tá caro" (`folgado_uber`)
CALLER: Seu Clodoaldo, 52. Torceu o dedinho do pé na quina da cama há dois dias.
> CLODOALDO: Boa tarde, é da ambulância? Então, eu machuquei o dedo do pé e preciso ir na UPA. O Uber tá trinta e oito reais, é um assalto. Vocês tão passando aqui perto, né? É rapidinho.
- "O que aconteceu?" → "Bati o dedinho na quina. Ficou roxinho. Dói pra andar, mas eu ando."
- "Tem pulso?" → "No dedo? Sei lá, doutor. Tem dedo."
- **F3** → *"Meios próprios? Meu meio próprio é você, ué. Eu pago imposto!"* → **F2** → *"Perfil? Que perfil? Eu tenho perfil no Facebook, quer ver?"* → **F3** de novo → *"Seu... seu jumento de jaleco! Vai #%!#@$ com essa sua sirene! [piii]"* → **F4** (correto).
- Verdade: verde/azul, ORI → UPA/UBS por meios próprios.

### FG2 — "Fura a fila pra mim" (`folgado_fila_upa`)
CALLER: Dona Jurema, 45, **ligando de dentro da UPA**.
> JUREMA: {m:Moço|Moça}, eu tô na UPA Norte faz três horas com dor de garganta. Três horas! Manda uma ambulância me buscar aqui na porta e me entrar pela porta da emergência. Eu vi que quem chega de ambulância passa na frente.
- "Respira?" → "Respiro, ué. Tô aqui reclamando, não tô?"
- "Está acordado?" → "Acordadíssima. Faz três horas."
- **F2** → *"Não é perfil? E quem é perfil? Aquele homem que chegou de maca pra sentar no corredor?"* → **F1** → *"Grava! Grava que eu quero que o prefeito ouça!"* (acalma) → **F3** → *"Tá bom, tá bom. Vou ficar aqui. Mas se eu morrer de garganta, a culpa é sua."*
- Sem xingamento (contraste: F1 resolve).

### FG3 — "Ultrassom marcado às duas" (`folgado_exame_marcado`)
CALLER: Seu Abelardo, 70, pela esposa Dona Lindalva, 68.
> ABELARDO: É da ambulância? Minha esposa tem ultrassom marcado às duas da tarde no Regional, faz quatro meses que a gente espera, e o ônibus da Vila não passa hoje porque tá tendo obra. Vocês levam ela? Ela anda, mas devagarinho.
- "O que aconteceu?" → "Nada, doutor. Graças a Deus nada. Só o exame."
- **F3** → *"Mas é no hospital, ué. Vocês vão pro hospital mesmo."* → **F2** → *"Eu entendo, eu entendo. Não é culpa sua."* (sem xingamento; humanidade +1 se o jogador usar a pergunta extra "Quer que eu passe o telefone do transporte da Secretaria?" — existe, é o "TFD/transporte sanitário eletivo" [validar o nome local]).
- ⚠ **Variante real (peso 0,6):** "Ela tá com a barriga dura e não come desde ontem. Mas o exame é de rotina." → abdome agudo → **USB**. Ensina: folgado-com-motivo-real existe.

### FG4 — "O cachorro" (`folgado_veterinario`)
CALLER: Rodinei, 30.
> RODINEI: Ô, chefia. O meu cachorro comeu um pé de meia inteiro e tá tossindo. O veterinário é no Centro e o meu carro tá sem bateria. A ambulância é pra quem tá passando mal, né? Ele tá passando mal.
- "Cor da pele?" → "Caramelo, chefia. Ele é caramelo."
- "Está acordado?" → "Acordado e latindo. Ó." *(AU! AU!)*
- **F2** → *"Não é perfil? Ele é da família! Ele tem até perfil no Instagram!"* → **F3** → *"Seu... seu mocorongo! Pois quando você tiver um cachorro engasgado, que um #%!#@$ te atenda assim! [piii]"* → **F4**.
- (Easter egg: se o jogador perguntou "Tem pulso?", RODINEI: *"Ô, chefia, e eu lá sei achar pulso de cachorro? ...Achei. Tá rápido. Ele tá feliz."*)

### FG5 — "Mostrar os exames pro cardiologista" (`folgado_consulta`)
CALLER: Dona Neuzely, 58, pela mãe Dona Filomena, 84.
> NEUZELY: Boa tarde. A minha mãe tem consulta com o cardiologista amanhã cedo, no particular, pra mostrar os exames. Só que eu trabalho e não consigo levar. Vocês não fazem esse serviço de levar idoso? Pago a gasolina.
- "O que aconteceu?" → "Nada, ela tá ótima. É só pra mostrar o eletro."
- **F2** → *"Ah, mas pra levar o vereador vocês têm ambulância, né? Eu vi no jornal!"* (se `d7_vereador_usa`: a fala é mais dura; o jogador fica sem resposta boa — F3 encerra) → **F3** → *"Tá, entendi. Vou chamar minha cunhada. Ela dirige mal mas dirige."*
- ⚠ **Variante real (peso 0,5):** "Ela desmaiou hoje de manhã no banheiro, mas já tá bem, por isso que eu quero mostrar o exame." → síncope em idosa cardiopata → **USB** (ou USA se FC baixa no "Tem pulso?": "Tá devagarinho, uns quarenta").

### FG6 — "Saudade" (`folgado_bebado_carona`)
CALLER: Seu Ednilson, 39, embriagado, num bar.
> EDNILSON: Alô, ambulância? *(soluço)* Eu tô passando mal. De saudade. Da minha ex. Me leva pra casa, que o motoqueiro não quer me levar porque eu vomitei no capacete dele.
- "Respira?" → "Respiro, ué. Suspiro, mais que respiro."
- "Está acordado?" → "Mais do que eu queria."
- **F3** → *"Meio próprio eu não tenho, o meu meio próprio me largou!"* → **F1** → *"Tá gravando? Então grava aí: Rosenilda, volta pra mim! [soluço]"* → **F3** → *"Sua... sua lambisgoia de jaleco! Songamonga! #%!#@$! [piii] ...Desculpa. Desculpa, {dr}. Eu tô triste."* → F4 ou orientar ("Pede pro dono do bar chamar um táxi e bebe água.") — **as duas valem**; a segunda dá humanidade +1.
- ⚠ Sem variante real, mas a pergunta "Bateu a cabeça?" existe: "Bati, mas foi ontem." (se o jogador insistir, ele lembra que bateu hoje e vomitou duas vezes → **USB** — peso 0,4). Ensina: bêbado também tem TCE.

### FG7 — "A carteirada" (`folgado_vip`)
CALLER: Dr. Wanderlei (diz que é advogado), 50.
> WANDERLEI: Aqui é o doutor Wanderlei, advogado. Minha sogra precisa ir pra casa de repouso hoje, a vaga abriu. A ambulância de transporte particular cobra quatrocentos reais. Vocês são pagos com o meu imposto. Mandem uma, por favor, e me passem o nome de quem está atendendo.
- "O que aconteceu?" → "Mudança de endereço. Ela é acamada, mas estável. Muito estável. Mais estável que eu."
- **F2** → *"Eu vou te processar. Qual é o seu nome completo?"* → **F1** → *"Ótimo. Que fique gravado que fui mal atendido."* → **F3** → *"Seu... seu sacripanta de uma figa! Seu &%$#! [piii] Vou ligar pro Peixoto!"* → **F4**.
- Gancho: às 16h o interfone do Peixoto: *"Um tal de Wanderlei ligou aqui gritando. Disse que você é sacripanta. ...Você mandou viatura? Não? Então você é sacripanta com razão."*

### FG8 — "Tô na rodoviária" (`folgado_rodoviaria`)
CALLER: Dona Iracilda, 66.
> IRACILDA: Alô? Eu cheguei agora de Rio Claro na rodoviária e meu marido tá com a pressão meio assim. Ele mediu na farmácia, deu catorze por nove. Vocês buscam a gente? A gente mora longe e tá com três malas.
- "Tem pulso?" → "Tem, ele contou, deu oitenta e pouco."
- "Respira?" → "Respira e reclama das malas."
- "O que aconteceu?" → "Nada, só a pressão catorze. Ele toma o remédio, tomou hoje."
- **F3** → *"Mas é pressão, doutor! Pressão mata!"* → orientar (pergunta extra "Dor no peito? Falta de ar? Fala enrolada?" → "Não, não, nada.") → **F3** → *"Tá bom. A gente pega o táxi. Mas {m:o senhor|a senhora} carrega uma mala na consciência."*
- (Espelho cômico da Dona Cida: 14×9 sem sintoma = azul.)

**Distribuição:** os 8 entram no banco a partir do **D3** (FG2 só a partir do D11, com a dengue lotando a UPA; FG5 a partir do D8, depois do jornal do vereador). No máximo **1 folgado por plantão** sorteado, nunca no D9, D17, D19, D20 (dias pesados), e **sempre 1 no D12** e no **D16** (alívio antes/depois do Osvaldo).
