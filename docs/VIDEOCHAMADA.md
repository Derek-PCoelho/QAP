# Videochamada de averiguação (Programa VER)

A ideia: em jogos como *Papers, Please*, a graça é olhar a pessoa e desconfiar. Numa central de regulação o médico não vê ninguém. Em QAP — Emergency Dispatch, a Prefeitura de Santa Aurora lança um piloto de videoatendimento depois de uma onda de trotes: o regulador pode pedir para quem ligou abrir a câmera do celular. É tudo simulado no jogo: a "imagem" é uma cena em pixel art desenhada a partir do que realmente está acontecendo na ligação. O jogo não usa câmera nenhuma.

O vídeo não substitui as perguntas. Ele é mais uma ferramenta, cara e limitada, que às vezes desmonta uma mentira e às vezes só faz perder tempo.

## 1. Enredo

- **Dia 2:** o quadro de trotes enche ("O Quadro").
- **Dia 3:** a Câmara aprova a lei municipal do trote (multa e registro policial para quem chama ambulância à toa) e a Prefeitura lança o **VER** com a OS Saúde+ Gestão. No primeiro minuto do plantão, o Peixoto avisa pelo sistema. A página **3-V** entra no Manual.
- O Peixoto ganha uma métrica nova ("trotes comprovados") e continua cobrando tempo médio de atendimento: o vídeo ajuda numa meta e atrapalha a outra.
- A Simone desconfia: "metade dos meus velhinhos tem celular de botão".

## 2. Regras

| | |
|---|---|
| Quando existe | A partir do dia 3 da campanha; sempre no Plantão Infinito; nunca na campanha da Simone (ela é TARM). |
| Franquia | 3 vídeos por plantão (o pacote de dados que a OS contratou). Só gasta franquia se conectar. |
| Pedir o link | 2 min de jogo, mesmo se der errado. Quem já recusou duas vezes não recebe novo pedido. |
| Conectar | 3 min (sinal bom), 5 min (fraco) ou 7 min (ruim), +1 às vezes. Sinal por bairro: bom no Centro, Jardim Norte, Bela Vista e Santa Luzia; fraco na Vila Esperança, Vila Nova, Jardim Primavera e Parque; ruim no Distrito Industrial. Chuva (dia 17) piora um nível. |
| "Peça para mostrar…" | Cada pedido custa 3 a 6 min (×1,3 com sinal fraco, ×1,6 com sinal ruim). Gera uma linha de vídeo na transcrição e muda o enquadramento. |
| Plano geral | Voltar para a cena inteira não custa nada. |
| Fim do vídeo | Ao encerrar, carimbar, pôr em espera ou se a ligação cair. Com o vídeo aberto, dá para espiar o mapa sem encerrar. |
| Prova de trote | Trote filmado e carimbado como TROTE: +R$ 10 e a gravação vai para a PM (lei do trote). Ligação acidental, ligação-teste e desabafo não contam. |

**O que a câmera mostra:** cor da pele (pálido, acinzentado, roxo, vermelho, amarelado), suor, olhos abertos ou fechados, boca torta, braço que cai, esforço para respirar (costelas afundando, frases cortadas), sangue, deformidade, queimadura, manchas na pele, objetos (remédios, embalagens, caneta de insulina), quem está em volta e o próprio lugar.

**O que não mostra:** pressão, glicemia, pulso, temperatura, saturação, pupila. Nem o que está fora do quadro: quem segura o celular escolhe o enquadramento, e pode esconder.

## 3. Quando vale a pena (e quando não)

Vale:
- **Suspeita de trote.** O trotista costuma recusar ("a câmera tá quebrada"), enrolar ou desligar. Se aceita, se entrega: gente rindo, ninguém no chão, ketchup.
- **Quem minimiza.** "É só o feijão" e o vídeo mostra alguém pálido e suando frio (infarto).
- **Pânico que pode ser exagero.** "Ele tá morrendo!" e a pessoa conversa sentada, corada.
- **Bêbado ou hipoglicemia?** A caneta de insulina em cima da mesa muda tudo.
- **Febre com manchas.** O teste do copo pelo vídeo: manchas roxas que não somem = púrpura (vermelho).
- **História discordante.** "Caiu da cama" e as marcas não combinam: suspeita de maus-tratos (Protocolo RM9).
- **Morte evidente.** Rigidez e livores: dá para constatar por telemedicina (Protocolo RM7) e não mandar ambulância para um corpo.

Não vale:
- **Vermelho óbvio.** Parada, engasgo total, hemorragia em jato: decida primeiro. O minuto olhando é o minuto que a viatura não andou.
- **Vítima escondida de um agressor.** Ligar a câmera pode denunciar onde ela está. O jogo pune: a pessoa se assusta e a ligação piora.
- **Crise suicida.** "Pra quê? Pra ver se eu tô mentindo?" O acolhimento é pela voz.
- **Idoso com celular de botão, quem liga longe do paciente, lugar sem sinal.** Tempo perdido.
- **Franquia no fim.** O terceiro vídeo do dia é precioso.

## 4. Integração com o resto do jogo

- **Modo Inconsistência.** As descrições do vídeo trazem pistas marcadas (por exemplo, "lábios roxos", "não sobe nem desce", "manchas que não somem"). Ligadas a uma regra do Manual, viram confirmação: pálido e suado × dor torácica (p.3), boca torta × FAST (p.6), lábios roxos × asma grave (p.5-B), rigidez × morte evidente (3-V) e outras.
- **Ficha e carimbo.** Nada muda: a decisão continua sendo cor + recurso + apoio + destino.
- **Relatório.** O fim do dia mostra quantos vídeos foram usados e quantos trotes foram comprovados.
- **Tempo médio.** Cada vídeo entra no tempo de regulação daquela ligação.

## 5. Para quem escreve conteúdo

Toda ligação ganha uma cena gerada automaticamente a partir da verdade clínica (`src/content/video.ts`). Ligações importantes podem escrever a própria cena no campo `video` da ligação; o que estiver escrito substitui o gerado:

```ts
video: {
  scene: { place: 'cozinha', patient: { pose: 'sentado', age: 'idoso', sex: 'M', skin: 'palido', signs: ['suor', 'mao_no_peito'] }, props: ['remedios'] },
  first: ['[Seu Antônio sentado à mesa da cozinha, a mão no peito. Ao fundo, a esposa.]'],
  spots: [
    { id: 'rosto', label: 'Mostrar o rosto', focus: 'rosto', cost: 4, see: ['[{{Pálido e molhado de suor|video_palido_suor}}.]', 'Tô bem, doutor, é calor.'] },
    { id: 'mesa', label: 'Mostrar a mesa', focus: 'objeto', cost: 3, see: ['[Uma caixa de AAS fechada e um copo d’água.]'] },
  ],
  refuse: { lines: ['Ô, doutor, meu celular é de botão.'] }, // opcional
  remote: false,                                         // quem liga está longe?
  harmful: { lines: ['[sussurrando] Não dá...'], patience: 35 }, // pedir vídeo faz mal
  proof: true,                                            // trote: vale prova
}
```

Regras de escrita: linhas entre colchetes são o que a câmera mostra; linhas sem colchetes são falas de quem liga. O vídeo nunca contradiz a verdade clínica, nunca mede o que câmera não mede e nunca mostra método de suicídio ou violência explícita.

### Dica de cena (sem reescrever o vídeo inteiro)

Quase sempre basta dizer **onde** e **com quem**, e deixar o resto sair da verdade clínica. Nas ligações dos dias, a dica fica na tabela `AJUSTE` de `src/content/video.ts` (pelo id da ligação); no banco, no campo `cena` do modelo (vale para todas as verdades) ou da verdade (por cima do modelo):

```ts
cena: {
  place: 'bar_porta',                       // onde a história acontece
  pose: 'encostado',                        // sentado no meio-fio
  props: ['carro', 'poste'],                // o carro enfiado no poste
  signs: ['sangue_rosto', 'vomito'],
  cast: [{ role: 'curioso', act: 'filmando', at: 'fundo' }, { role: 'garcom', act: 'olhando', at: 'fundo' }],
  first: 'Um carro enfiado no poste em frente ao bar; o motorista sentado no meio-fio, sangrando na testa.',
}
```

Quem liga segura o celular: não entra no `cast`. `vazio: true` tira o paciente do quadro (casa vazia, porta trancada). Com o paciente grave deitado, alguém do `cast` se abaixa do lado dele sozinho.

### Vocabulário da cena (`VideoScene`, em `src/engine/types.ts`)

- **Lugares** — casa: `sala`, `cozinha`, `quarto`, `banheiro`, `quintal`, `escada`, `porta`, `corredor` · rua: `rua`, `calcada` (com `variant: 'farmacia'`), `ponto_onibus`, `praca`, `feira`, `estacionamento`, `posto`, `bar_porta`, `alagado`, `telhado` (com chuva vira enchente) · natureza: `praia`, `rio`, `piscina`, `campo`, `chacara`, `obra` · dentro: `bar`, `loja`, `mercado`, `padaria`, `academia`, `escritorio`, `fabrica`, `escola`, `quadra`, `igreja`, `salao`, `hospital`, `central`, `onibus`, `carro`.
- **Luz** — `dia` (padrão), `noite` (lâmpadas, postes; na rua, a lanterna do celular), `escuro` (só a lanterna). `rain: true` põe chuva.
- **Poses** — `em_pe`, `sentado`, `cadeira`, `curvado` (inclinado, mãos nos joelhos), `debrucado` (na mesa), `encostado` (sentado no chão), `cama` (na sala: deitado no sofá; bebê: no berço), `deitado`, `caido`, `lateral` (posição de recuperação), `brucos`, `convulsao`, `ajoelhado`, `agachado`, `parto`, `preso` (no banco do carro), `colo` (bebê ou criança no colo de um adulto).
- **Paciente** — `age` (`bebe`, `crianca`, `adolescente`, `adulto`, `idoso`), `sex`, `tone` (0–4), `skin` (`normal`, `palido`, `cinza`, `cianose`, `vermelho`), `signs`, `wear` (`casual`, `pijama`, `fralda`, `escolar`, `obra`, `motoboy`, `social`, `esporte`, `banho`, `vestido`, `farda`, `bombeiro`, `socorrista`, `seguranca`, `lanchonete`, `avental`, `uniforme`, `jaleco`, `sem_camisa`), `hat` (`capacete`, `capacete_obra`, `bone`, `touca`, `quepe`; `null` tira), `hold` (o que segura), `wound` (`{ kind, at }`: o close "Mostrar o ferimento"), `gear` (o que a equipe pôs: `colar`, `mascara_o2`, `ambu`, `soro`, `torniquete`, `tala`, `compressa`, `manta`, `eletrodos`, `oximetro`, `toalha`).
- **Sinais** — além dos de sempre: `sangue_nariz`, `sangue_boca`, `vomito_sangue`, `maos_no_pescoco` (engasgo), `maos_na_cabeca`, `placas` (urticária), `chorando`, `poeira`, `inchaco_pernas`, `recem_nascido` (bebê no peito da mãe).
- **Quem está em volta** — `cast: [{ role, act, at, age, sex, wear, hold }]`. Papéis: família (`mae`, `pai`, `esposa`, `marido`, `filho`, `filha`, `avo`, `neto`, `irmao`, `irma`, `familiar`, `crianca`, `bebe`), vizinhança (`vizinho`, `vizinha`, `curioso`), trabalho e serviço (`colega`, `professor`, `aluno`, `garcom`, `seguranca`, `motorista`, `passageiro`, `fiel`, `enfermeira`), resgate (`policial`, `bombeiro`, `socorrista`). Ações: `olhando`, `mao_na_boca`, `maos_na_cabeca`, `filmando`, `apontando`, `gritando`, `rindo`, `chorando`, `abanando`, `lanterna`, `segurando_crianca`, `sentado`, `agachado`, `escondido`, `ajoelhado`, `rcp`, `comprimindo`, `segurando_cabeca`, `segurando_mao`, `ventilando`, `deitado`, `ferido`, `de_costas`, `correndo`. `at`: `fundo`, `esq`/`dir` (perto da câmera, cortados pela borda), `cabeca`/`pes`.
- **Objetos** — remédios e embalagens (`remedios`, `cartela`, `caneta_insulina`, `glicosimetro`, `bombinha`, `produto`, `galao`, `termometro`, `mamadeira`, `fralda`…), casa (`berco`, `cadeira_rodas`, `andador`, `aquecedor`, `quadro_luz`, `fogao`, `panela`, `churrasqueira`, `vasos`…), rua e trabalho (`moto`, `carro`, `bicicleta`, `onibus`, `viatura`, `ambulancia`, `poste`, `cones`, `andaime`, `masseira`, `maquina`, `escada`, `tijolos`…), cena de trote (`ketchup`, `boneco`, `videogame`, `pipoca`).

O desenho é um palco montado uma vez por ligação (`src/client/art/video.ts`): o lugar, os móveis, os objetos, quem está em volta e o paciente com **uma aparência só** (tom de pele, cabelo, roupa) usada no plano geral e em todos os closes, inclusive no rosto. A galeria (`tools/art-gallery.html`, seções "Vídeo") mostra todos os lugares, poses, pessoas, enquadramentos e situações.
