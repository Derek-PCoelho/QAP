# Motor de áudio — QAP — Emergency Dispatch

Todo o som do jogo é **sintetizado em tempo real com a Web Audio API**: não há arquivos de áudio nem URLs externas. São vozes por formantes, violão Karplus–Strong, ruídos procedurais e sinos FM.

```ts
import { audio } from './audio';           // singleton
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
```

## Integração: o que precisa saber

1. **`unlock()` no primeiro gesto do usuário** (clique/tecla). O `AudioContext` é criado *de forma síncrona* dentro de `unlock()`, então `audio.unlock(); audio.playTheme('titulo')` no mesmo handler funciona. A função pode ser chamada quantas vezes quiser. Como alternativa, `audio.autoUnlock()` registra os ouvintes de gesto e também retoma o contexto se o navegador suspendê-lo (iOS).
2. **Estado pedido antes do unlock não se perde.** Zumbido, toque em loop, ambiente, música de casa, tema em loop, metrônomo e coração ficam guardados e começam quando o contexto é criado. Efeitos pontuais (`sfx`, `voice`, `radio`, `ringOnce`) chamados antes do unlock são descartados. `voice()` e `radio()` ainda devolvem a `duration` correta para sincronizar o texto.
3. **Sem `AudioContext`** (Node, vitest, SSR), todos os métodos viram no-ops e nunca lançam erro. Nada acessa DOM ou AudioContext na importação.
4. **As chamadas são idempotentes.** `startCentralHum()`, `ringLoop(true, x)`, `setAmbient(sameSet)`, `playTheme(sameKind)` e `startHomeMusic()` repetidos não reiniciam nada; só atualizam parâmetros.
5. **Canal das vozes.** Perfis de chamador (`homem`, `mulher`, `idosa`…) soam **pela linha telefônica** (banda de 260 Hz a 3,7 kHz) enquanto o zumbido da central está ligado (`startCentralHum`), ou seja, no plantão. Fora dele, os mesmos perfis soam "na sala" (cenas em casa). `simone`, `peixoto`, `henrique`, `bene`, `lucia`, `alex`, `davi` e `zelia` são sempre "sala"; `radio` é sempre rádio HT. Use `opts.channel` para forçar.

## API

| Método | Comportamento |
|---|---|
| `unlock(): Promise<void>` | Cria e retoma o contexto. Seguro chamar várias vezes. |
| `readonly ready: boolean` | `true` com o contexto em estado `running`. |
| `setVolumes(Partial<{master,music,sfx,ambient,voice}>)` | Valores de 0 a 1, com curva perceptual (x²). Padrão: master 0,8 · music 0,7 · sfx 0,8 · ambient 0,7 · voice 0,85. |
| `mute(m)` | Silencia ou volta (rampa de 20 ms). |
| `startCentralHum()` / `stopCentralHum()` | Zumbido fluorescente da central, com fade de 1,5 s na entrada e 0,8 s na saída. |
| `ringLoop(on, level)` | Telefone tocando enquanto há fila: 1 s ligado e cerca de 2 s desligado. `level` de 0 a 1 (progressão dos dias) deixa o toque mais agudo, áspero e rápido. |
| `ringOnce(level, {phantom?})` | Um toque de 1 s. É ignorado se o loop já estiver tocando (ou se houve outro há menos de 0,9 s), para não embolar. `phantom` sempre toca. |
| `setAmbient(layers, intensity = 0.6)` | Crossfade de 0,8 s para o conjunto de camadas da ligação. Camadas em comum continuam tocando sem reiniciar. `[]` = silêncio. Máximo de 4 camadas; ids inválidos são ignorados. |
| `voice(text, profile, {style?, rate?, channel?})` → `{stop(), duration}` | Balbucio "Papers, Please" sincronizado ao texto. Detalhes abaixo. |
| `radio(text, profile = 'radio')` → `{stop(), duration}` | Transmissão do rádio HT: squelch, balbucio em banda estreita, chiado e estalos, e o "kssht" final. As transmissões entram numa fila *half-duplex* (máx. 4); `duration` inclui a espera. |
| `sfx(name)` | Um dos 31 efeitos (tabela abaixo). Tem limite de taxa (`hover` 40 ms, `type` 25 ms) e os efeitos de baixa prioridade são descartados quando há mais de 24 tocando. |
| `metronome(bpm, on, onTick?)` | Bloco de madeira da RCP; a 30ª batida (e cada múltiplo de 30) é acentuada. Mudar o bpm com o metrônomo ligado não reinicia a contagem. `onTick(index, accent)` é chamado no momento do som, para sincronizar o visual. |
| `heartbeat(on, bpm = 72)` | "Tum-tum" grave; o bpm pode mudar ao vivo. |
| `startHomeMusic(mood, desgaste)` | Violão de casa. `mood` de 0 a 1 (Laços), `desgaste` de 0 a 100. Para qualquer tema que esteja tocando. |
| `updateHomeMusic(mood, desgaste)` | Atualiza ao vivo; a harmonia muda na virada do ciclo de 4 compassos. |
| `stopHomeMusic()` | Fade de 1,5 s. |
| `playTheme(kind)` | `titulo` e `final_*` tocam em loop até `stopTheme()`; `gameover` e `jornal` tocam uma vez. Para a música de casa. Se o mesmo tema já estiver tocando, nada acontece. |
| `stopTheme()` | Fade de 1,2 s (0,6 s nos temas curtos). |
| `stopAll()` | Para tudo (vozes, rádio, camadas, loops, música) e limpa o estado pendente. Não fecha o contexto. |

**Exports:** `audio` (também como `default`), `AudioEngine`, `type SfxName`, `type ThemeKind`, `type VoiceChannel`, `type Volumes`, `type VoiceHandle`, `type VoiceOptions`, `AMBIENT_IDS`, `SFX_NAMES`, `THEME_KINDS`.

**Extensões compatíveis com a API pedida** (nenhuma quebra quem usa a assinatura original):
- `radio()` devolve um `VoiceHandle` (a assinatura pedida era `void`).
- `voice()` aceita `opts.channel: 'phone' | 'room' | 'radio'`.
- `metronome()` aceita um 3º argumento opcional, `onTick`.
- `autoUnlock(target?)`, `get volumes`, `get muted`.
- `AudioEngine.renderOffline(seconds, play, sampleRate?, preroll?)` para testes.

## Mixagem

```
vozes  (sala / linha telefônica / rádio HT) ─┐
ambiente da ligação → linha telefônica → duck ┤
ambiente da sala (zumbido)  ─────────────────┤→ barramentos (music, sfx, ambient, voice)
música  → duck ──────────────────────────────┤      → master → mute → compressor suave → limitador
sfx (+ sfx pelo fone: discagem/ocupado) ─────┘      → compensação do ganho de makeup → saída
envios de reverb (sala quente 2,4 s; ambiente tem reverb próprio dentro da linha)
```

- **Linha telefônica:** HP 260 + 170 Hz, LP 3,7 kHz, presença em 1,7 kHz e leve saturação. Os ambientes da ligação também passam por ela: você ouve a casa *de quem liga*. **Rádio HT:** 400 Hz a 2,5 kHz, saturado.
- **Ducking:** enquanto alguém fala ao telefone, o ambiente da ligação cai cerca de 5 dB; uma voz "na sala" abaixa a música cerca de 4 dB.
- **Compressor:** limiar −18 dB, razão 2,5. O `DynamicsCompressorNode` aplica um ganho de compensação fixo (~+6 dB), que é cancelado por um ganho de 0,502, para que os níveis sejam previsíveis.
- **Níveis medidos offline** (volumes padrão): vozes ao telefone ≈ −20 dB RMS (pico −9); ambientes ≈ −32 a −37 dB RMS, ou seja, 12 a 16 dB abaixo da voz, antes do ducking; música de casa ≈ −27 a −32 dB RMS; zumbido ≈ −43 dB RMS; sfx com picos de −10 dB (carimbo) a −25 dB (hover). Nenhum caso clipa.

## Vozes (`voice`)

Síntese por formantes. A fonte glotal é uma onda periódica com harmônicos em 1/n^tilt, somada a ruído. Ela passa por 3 filtros passa-banda paralelos (F1–F3), cujas frequências **e amplitudes** seguem a vogal de cada sílaba (tabela a/é/ê/i/ó/ô/u). Um único `ConstantSource` serve de envelope para o vozeamento e a soprosidade, e há ruído separado para fricativas e explosões. Cada fala usa cerca de 20 nós e é limpa ao terminar.

**Do texto ao balbucio.** Não é TTS, mas segue o português:
- As **vogais reais do texto** dão a cor de cada sílaba, com ditongos (ei, ou, ão…) e vogais nasais (ã, õ, am/em/an).
- A **tonicidade** segue as regras do PB: acentos gráficos; oxítonas em r/l/z/i/u/im/um; paroxítonas no resto; monossílabos átonos.
- O sotaque brasileiro aparece na redução átona final (e→i, o→u), em ti/di → "tchi/dji", no r forte gutural e no l final → u.
- **Pontuação:** `,` pausa curta com tom suspenso; `.` queda; `?` subida final; `!` mais alto e agudo; `...` hesitação longa. PALAVRAS EM CAIXA ALTA saem enfatizadas.
- **Colchetes viram efeitos:** `[risadinha]`/`[risos]` → risada; `[choro]`/`[soluço]` → soluço; `[tosse]`; `[suspiro]`; `[respira]`/`[ofegante]`. Outros colchetes viram pausa e não são "falados".
- A marcação de conteúdo `{{trecho|pista}}`, `{m:a|b}` e o prefixo `QUEM:` é limpa automaticamente.
- O ritmo dá cerca de 1 sílaba a cada 2,5 caracteres. Se a fala passar de **6 s**, ela é acelerada até 25% e, se ainda for longa, corta-se o meio, preservando a entonação final.
- É **determinístico**: a semente vem do hash de perfil + estilo + texto, então a mesma fala soa idêntica sempre.
- Uma nova fala do **mesmo perfil corta a anterior** (fade de 50 ms). No máximo **3 vozes** simultâneas; a mais antiga é cortada.

**Perfis** (f0 base; a mediana medida fica ~10% acima por causa do acento tônico):

| perfil | f0 | caráter |
|---|---|---|
| homem | 110 | adulto neutro |
| mulher | 210 | adulta, um pouco soprosa |
| idoso | 118 | lento, soproso, tremor (vibrato 5,2 Hz) |
| idosa | 190 | lenta, tremolo/vibrato 5,6 Hz |
| crianca | 300 | rápida, entonação larga |
| menino | 255 | rápido |
| adolescente | 168 | falsetes ocasionais (voz quebrando) |
| jovem_h / jovem_m | 125 / 222 | rápidos |
| grave / aguda | 85 / 265 | |
| bebado | 112 | arrastado, portamento, timing irregular |
| profissional | 128 | monótono, medido |
| simone | 180 | rouca (aspereza por modulação + ruído), sala |
| peixoto | 105 | seco, sílabas cortadas (staccato), sala |
| henrique | 115 | lento, sala |
| bene | 95 | quente (passa-baixa), sala |
| lucia | 205 | quente, sala |
| alex | 106 | homem adulto, quente, sala (o marido, com a protagonista mulher) |
| davi | 290 | criança (o Liam), sala |
| zelia | 185 | idosa com tremolo, sala |
| cida | 195 | alegre, entonação saltitante |
| radio | 120 | sempre pelo rádio HT (com squelch e estalos) |

**Estilos:**

| estilo | efeito |
|---|---|
| arrastada | 0,68× mais lenta, mais grave, com glissando e quase sem pausas |
| sussurro | só ruído pelos formantes |
| grito | +4 dB, f0 ×1,38, boca mais aberta (F1↑), mais brilho e saturação |
| choro | vibrato largo, tremolo, soluços (inspirações) com quebra de voz |
| tremida | jitter de pitch de ±45 cents e tremolo de 8 Hz |
| calma | mais lenta, menos variação, mais suave |
| ofegante | respirações entre palavras |
| rindo | rajadas de "ha-ha" entre palavras |
| fantasma | sussurro baixo com envelope invertido (sobe devagar e corta seco), muito reverb, na "sala" (dentro da cabeça) |

## Central

- **Zumbido:** 120 Hz (rede de 60 Hz) mais harmônicos até 960 Hz, um parcial a 120,4 Hz que bate devagar, chiado de reator e ar-condicionado. **Piscadas raras** a cada 25–70 s (a primeira entre 8 e 20 s): de 0,3 a 1,2 s de zumbido áspero picotado, com o zumbido principal falhando e os cliques do starter.
- **Toque:** dois tons alternados a 18–24 Hz (425 Hz e uma terça acima), com caráter de sino FM (índice decrescente), martelinho e caixa plástica. Com `level` → pitch +6%, warble mais rápido, mais saturação e intervalo menor (de 2,0 s para 1,3 s). O **fantasma** fica 4,5% mais grave, com a afinação derivando, entrada lenta de 0,25 s, abafado e com reverb.
- **Metrônomo:** bloco de madeira (1,2 kHz + parcial 2,4×; acento em 1,6 kHz, mais alto). **Coração:** "lub" 62→42 Hz e "dub" 72→50 Hz.

## Ambientes (`AmbientId`)

Cada camada é montada com ruídos compartilhados (branco, rosa e marrom em loops de 5 s; estalos; gotas; bolhas), osciladores e eventos aleatórios agendados. Tudo passa pela linha telefônica. A intensidade escala o nível (0,4 + 0,75·i) e a densidade dos eventos.

| id | som |
|---|---|
| tv | dois balbucios pelo alto-falante da TV + risadas de plateia |
| chuva | chiado rosa + gotas + respingos + trovão distante raro |
| festa | murmúrio, conversa, bumbo e baixo abafados a 120 bpm, "uhuu!", copos |
| choro | alguém chorando ao fundo (frases com soluço) + fungadas |
| silencio | tom de sala quase mudo, chiado da linha e um relógio (tic-tac) |
| chuveiro | ruído agudo constante com leve oscilação + respingos + reverb de banheiro |
| rua | ronco grave, carros passando, motos, buzina rara |
| risadas | risadinhas abafadas de adolescentes, "pff", "shh" (trote) |
| radio_am | locutor animado em banda AM + estalos + assobio de heterodinagem |
| passaros | piados FM variados, trinados e **bem-te-vi** |
| cachorro | latidos em grupos de 1 a 4, à distância |
| ventilador | ruído filtrado com varredura lenta (oscilação) + batida das pás + motor |
| buzinas | trânsito parado: buzinas frequentes (curtas e longas) + motos |
| sirene | sirene de dois tons distante, aproximando e afastando |
| respiracao | respiração ritmada no fone (mais rápida com a intensidade) |
| videogame | chiptune em pulso/triângulo a 140 bpm, baixinho |
| gemidos | gemidos graves ("ooh", "aai") |
| multidao | murmúrio denso + vozes + gritos ocasionais |
| vento | rajadas (passa-banda em passeio aleatório) + assobio |
| agua | água corrente (bolhas procedurais) |
| cozinha | fritura, panelas, **panela de pressão**, faca picando |
| bar | murmúrio, copos, risadas, pagode abafado (cavaquinho/violão) |
| igreja | órgão com reverb longo + murmúrio |
| escola | crianças, gritos, bola, sinal elétrico raro |
| maquina | zumbido industrial + batida metálica periódica + escape pneumático |
| tiros | estampidos distantes e raros com eco (discretos) |
| gritos | gritaria à distância |
| bebe | choro de bebê com inspirações |
| desenho | vozes fininhas de desenho animado, "boing", apito, xilofone |
| onibus | motor variando a rotação, rodagem, porta pneumática "pssh", campainha |
| academia | música eletrônica abafada a 128 bpm, anilhas, grunhidos |
| musica | música tocando no cômodo (violão, baixo e bateria abafados) |

## Efeitos (`SfxName`)

| nome | som | uso sugerido |
|---|---|---|
| stamp | carimbo de borracha: baque grave + corpo + mesa + descolar | carimbar a decisão |
| click | clique suave de UI | botões |
| hover | tique muito leve (limitado a 1 a cada 40 ms) | passar o mouse |
| paper | farfalhar de papel | abrir ficha/inspeção |
| type | tecla de máquina de escrever | digitação |
| warning | dois bipes graves (buzzer) | ADVERTÊNCIA |
| note | risco de caneta + "dum" grave descendente | nota de auditoria |
| money | moedas tilintando | pagamento/bônus |
| insight | corda do fio vermelho + ping brilhante | inconsistência encontrada |
| wrong | baque abafado | ligação errada/pista falsa |
| coffee | café sendo servido (ressonância subindo) + xícara | café |
| photo | clique de câmera + acorde quente; **a central silencia por ~1,4 s** | olhar a foto da família |
| interfone | zumbido nasal duplo | Dr. Peixoto no interfone |
| death | tom grave abafado e longo (discreto) | óbito |
| saved | tons suaves ascendentes | paciente salvo |
| tick | tique de relógio | passagem de tempo |
| door | maçaneta, rangido, porta batendo | casa/escritório |
| page | virar página | manual/diário |
| hangup | fone no gancho | desligar |
| pickup | tirar o fone do gancho + linha abrindo | atender |
| dialtone | tom de discagem de 425 Hz contínuo (1,6 s) | |
| busy | ocupado: 425 Hz, 250 ms ligado/desligado | chamador desligou |
| siren | sirene passando, com Doppler | viatura despachada |
| thread | fio esticando + dedilhado | ligar pistas no quadro |
| unlock | clique de fechadura + dois bipes subindo | nova pergunta liberada |
| error | "bonk" descendente | ação inválida |
| achievement | arpejo de sinos | conquista |
| paper_slide | papel deslizando na mesa | entregar documento |
| pen | rabisco de caneta | assinar/anotar |
| radio_on / radio_off | squelch abrindo / "kssht" + roger beep | rádio |

## Música

- **Casa:** violão de náilon em Karplus–Strong. A excitação é um triângulo mais ruído, com filtro de posição de ataque e afinação fracionária por all-pass, e as notas são pré-calculadas e cacheadas por nota. Passa por EQ de corpo, pan por corda e reverb quente. É **dedilhado** em colcheias com swing leve e humanização, a 66 + 8·mood bpm, e o padrão varia a cada compasso, com baixo caminhando na virada.
  - mood baixo (faixa 0): **Am–F–C–G** esparso, alternando com Am–Dm–E7–Am; timbre escuro e mais reverb.
  - mood médio: Am7–Fmaj7–C–G em arpejo.
  - mood alto: **C–Am–F–G** e Cadd9–Am7–Fmaj7–G (às vezes C–G/B–Am–F), dedilhado cheio e brilhante. As faixas têm histerese.
  - **desgaste > 60:** um zumbido fluorescente desafinado (119,2 + 121,1 Hz, batendo) invade a música. Acima de 80, as cordas também desafinam (até ±18 cents por corda).
- **Temas:**

| tema | descrição |
|---|---|
| `titulo` (loop) | drone frio, zumbido baixinho, violão Am–F–C–E7, o motivo "1-9-2" num sino elétrico (lá, si agudo, si) e um telefone fantasma distante de vez em quando |
| `final_bom` (loop) | violão cheio C–G/B–Am–F / C–G–F–C a 74 bpm + pad quente |
| `final_normal` (loop) | Am–F–C–G em arpejo |
| `final_ruim` (loop) | Am–Dm–E7–Am esparso e desafinado, zumbido alto e telefone fantasma |
| `gameover` (~7 s, uma vez) | drone grave, três notas descendentes, o zumbido falha e apaga |
| `jornal` (~8 s, uma vez) | teletipo, pulsos graves, motivo descendente em sino e acorde final |

## Desempenho

- Um único `AudioContext` (latência `interactive`), criado sob demanda.
- Ruídos, estalos, IRs e notas KS são gerados uma vez por contexto (JS puro → `AudioBuffer`).
- Relógio com *lookahead*: tick de 40 ms agendando até 0,3 s à frente (1,6 s com a aba oculta). Só roda enquanto há loops ativos.
- Toda fonte tem `stop()` agendado, e `onended` desconecta a cadeia inteira. Camadas, temas e loops cancelam seus agendamentos ao parar.
- Limites: 3 vozes, 4 camadas de ambiente, 4 rádios na fila e cerca de 24 sfx simultâneos (os de baixa prioridade são descartados).

## Laboratório e testes

- `npx vite` → abra **`/audio-lab.html`**, que tem botões para todos os sons, sliders de volume, nível do dia, bpm, mood/desgaste, um seletor de perfil/estilo/canal com texto livre e uma medição offline. A página não entra no build do jogo.
- `window.__audioLab.measureAll()` renderiza todos os casos num `OfflineAudioContext` e devolve RMS, pico e clipping. Use `preroll` ao medir: o compressor do Chrome começa "fechado" nos primeiros ~300 ms de um contexto novo.
- `AudioEngine.renderOffline(seconds, (e) => e.sfx('stamp'))` devolve um `AudioBuffer`, ou `null` sem Web Audio.
