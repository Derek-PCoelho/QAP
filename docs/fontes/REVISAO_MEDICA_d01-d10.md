# Revisão médica: dias 1 a 10

Revisão da regulação das ligações de `src/content/days/d01.ts` a `d10.ts`, feita em 15/10/2026. O foco foi a correção clínica de cada ligação: a verdade (`sev`, recursos aceitos em `ok`, `best`, `dest`, `ref`, `must`, `risk`) e as orientações que o regulador dá por telefone.

**Fontes.** Protocolos de regulação do SAMU 192 Regional Fortaleza (SAMUFor), pelas notas `SAMU_REGULACAO.md` (RM, RC, RT, RO e RP), `SAMU_CAMPO.md` (suporte básico e avançado, orientação a leigos; nos comentários do código aparece como "campo A5", "campo A13" etc.) e `SAMU_GESTAO.md` (Anexo VII, regimento). As páginas originais só foram abertas para dúvidas pontuais: RC1, RT1, RT2, RO2 e as definições dos discriminadores. Para escorpionismo, foi usado o livro de Medicina de Emergência da USP.

**Critério.** Vale o discriminador mais alto presente no protocolo da queixa (RM0). O jogo não tem USI: onde o protocolo diz "USI/USB", o jogo aceita USB. Quando o protocolo aceita uma segunda resposta e o caso clínico também a sustenta, ela entra como alternativa defensável (⚖). A resposta preferida (`best`) só mudou onde estava errada. Em nenhum caso foi criada pergunta obrigatória nova.

## Resumo

- **92 ligações revisadas**, mais as verdades que dependem do estado: a parada do Seu Antônio, a janela do AVC das 07:40, a Rosângela dispensada, o Davi e a Márcia com e sem bombinha, e as pioras de d05_infarto, d05_piscina, d05_asma e d10_telhado.
- **Nenhuma cor (`sev`) estava errada.** Nenhuma resposta preferida mudou. Recursos aceitos mudaram em 14 ligações: em todas foi acrescentada uma alternativa ⚖ que o protocolo sustenta e que antes o jogo punia como excesso ou falta.
- **Outras correções:**
  - 4 encaminhamentos ou destinos ampliados: `ref` de d01_febre e d08_onibus, `dest` de d09_cida_b e d10_pulso.
  - Falas de transcrição: d03_bicicleta e d09_casa.
  - Textos de rádio: d06_avc (2 textos) e d08_petequias.
  - Orientações por telefone: d05_dedo e o guia `cena_insegura`.
- **Marcações `[validar]`: eram 52 nestes arquivos.** As fontes confirmaram 51, que viraram comentário com o código do protocolo. A de d06_cabeca virou pergunta. Ficam 5 perguntas abertas para a equipe médica (3 delas novas), listadas no fim deste documento.
- Nenhuma cena de vídeo foi escrita. Estes arquivos não tinham campo `video` explícito.
- O texto do jogo não ganhou "SAMU" nem "192". Os comentários citam só códigos de protocolo, como RC17, RT6 ou "campo A5".
- `npx tsc --noEmit -p .` e `npx vitest run` passam: 7 arquivos de teste, 77 testes.

## Mudanças na decisão aceita

| Ligação | Antes → depois | Fonte |
|---|---|---|
| d01_dente | ORI → ⚖ **ORI** (preferida) ou USB | RC23: "dor intensa" e "dor moderada" são USI/USB. RM4: sem indicação técnica de ambulância. Ver `[validar]` 1 |
| d01_febre | ref UBS/UPA → UBS/UPA/**CASA** | Febre há menos de 24 h, criança ativa, sem sinal de alarme: observar em casa também é correto. Com a regra nova de `ref`, CASA ficava sem bônus |
| d03_muscular | ORI → ⚖ **ORI** ou USB | RC17: a fisgada ao puxar o ar preenche "dor pleurítica" (USI/USB). O quadro muscular sustenta a orientação |
| d03_briga | ORI → ⚖ **ORI** ou USB | RC22: "palpitação atual" é USI/USB. Fica igual à ligação gêmea d09_bruna, que já era ⚖ |
| d04_enxaqueca | ORI → ⚖ **ORI** ou USB | RC6: "dor moderada" é USI/USB, sem nenhum sinal de alarme. Ver `[validar]` 2 |
| d05_piscina | USB → ⚖ **USB** ou USA | RT1: "dispneia aguda" (respira rápido e puxado, tosse que não para) é USA. BPed26: criança que submergiu vai ao hospital |
| d06_avc (na janela) | USA → ⚖ **USA** ou USB; `risk.needs` USB | RC1: assimetria facial, fraqueza de um lado e fala alterada são USI/USB. USA só com Glasgow abaixo de 9, convulsão ou suporte ventilatório. A preferida segue USA (Manual p.6) |
| d06_avc2 | USA → ⚖ **USA** ou USB; `risk.needs` USB | RC1 (igual ao anterior) |
| d10_riso | USA → ⚖ **USA** ou USB; `risk.needs` USB | RC1 (igual ao anterior) |
| d07_sangramento | ORI → ⚖ **ORI** ou USB | RO1: sangramento não intenso é orientação; "mais de 20 semanas" é USI/USB. Ela está com exatamente 20 semanas |
| d07_parto | USB → ⚖ **USB** ou USA | RO2: parto iminente é USI/USB "enquanto aguarda o suporte avançado"; "apresentação de partes fetais" está na lista de USA |
| d09_parto | USB → ⚖ **USB** ou USA | RO2 (igual ao anterior). O primeiro filho nasceu no carro |
| d08_onibus | ORI → ⚖ **ORI** ou USB; ref + **UBS** | RC20: desmaio testemunhado é "história de inconsciência" (USI/USB). Primeiro desmaio: UBS para eletrocardiograma também é correto |
| d09_cida_b | USB → ⚖ **USB** ou USA; dest UPA → **REG** ou UPA | RC24: dedos "inchados, meio dormentes" são comprometimento vascular distal (USA). Anexo VII: fratura que não é simples vai a serviço traumato-ortopédico |
| d10_pulso | USB → ⚖ **USB** ou USA; dest UPA → UPA ou **REG** | RC5: "alto risco de nova autoagressão" é USA/USI. O exemplo do RM4 é este caso: considerou USA e enviou USI. Ver `[validar]` 4 |

Notas sobre as mudanças acima:
- Em toda alternativa ⚖, a resposta preferida continua pagando mais:

  | Preferida | Alternativa ⚖ | Bônus da preferida | Bônus da alternativa |
  |---|---|---|---|
  | Orientação | USB | 20 | 15 |
  | USA | USB | 30 | 15 |
  | USB | USA | 30 | 25 |

  Cor diferente da verdade reduz o bônus à metade, como antes. As lições do jogo continuam de pé: o exagerado é verde e o AVC na janela é USA.
- **AVCs.** Com `risk.needs` USB, a USB que chega conta como cuidado adequado, porque o tratamento é no hospital. Sem isso, a USB "defensável" pediria USA pelo rádio.
- **d06_avc, texto de rádio.** O texto `ok` escolhia a versão "fora da janela" sempre que o recurso não era USA. Agora escolhe pela hora do carimbo.

## Correções de texto (transcrição, orientação e rádio)

| Ligação | Antes → depois | Fonte |
|---|---|---|
| d06_avc (`dismissed`) | "Agora nem a **mão esquerda** segura nada" → "Agora o **braço direito** não mexe mais nada". O déficit é à direita | Item do QA |
| d03_bicicleta (fala da Dona Cleide) | "dá pra ver o osso levantando a pele" → "entortado e inchado, mas a pele tá inteirinha". A fala antiga descrevia "pele crítica", que o RC24 põe em USA, e contradizia a verdade (fratura fechada, USB) | RC24, RT6 |
| d09_casa, cenário moderado (com bombinha) | O Davi falava "Pai... tô... cansado" e "Pai... você vai mandar... a ambulância grande?". Isso são "frases entrecortadas", discriminador de USA, e tornava injusta a punição por "favorecimento". Agora fala frases curtas, mas inteiras | RC3, RP1 |
| d05_dedo (orientação) | "Lava, aperta 10 min…" → "Aperta com pano limpo, sem soltar, 10 min, mão levantada; quando parar, lava e cobre" | Campo A5 (AP19/BP8): compressão até parar |
| d04, guia `cena_insegura` | "Amarra o fio da TV bem apertado na perna" passou de `neutro` para `errado`. Fio fino não serve de torniquete: o protocolo pede faixa de 10 cm ou mais, aplicada por profissional, depois de a compressão falhar | Campo A5 (AP19/AP20) |
| d08_petequias (rádio `ok`) | "Antibiótico na veia já no local" → "Acesso na veia, soro correndo. Regional avisado: antibiótico na porta". A lista de medicações da USA não tem antibiótico | Campo C (Medic1–57) |

## Marcações `[validar]` resolvidas

Estas viraram comentário "Conferido (código)", sem mudar a decisão:

- **d02:** convulsao (RC7: trauma craniano → USB), faca (RT4), praca (RC19), gestante (RO2: escore de Malinas 1 → orientação preferida), hda (RC18), tornozelo (RC24).
- **d03:** antonio (RC17, RM7), muscular (RC17), conceicao (RC17/RC20), bicicleta (RT6/RC24), briga (RC22/RC12), atropelamento (RT9/RT8), acamado (RM4).
- **d04:** guias (campo A5 e A12; USP), cida, exagerador (RC11), tiro (RT4), facao (RT2/RT9), moto (RT8/RT9), escorpiao (RC21/USP), enxaqueca (parte dos sinais de alarme, RC6), joelho (RT6).
- **d05:** queda_coluna (campo A13), infarto (campo A15), dedo (campo A5), academia/DEA (campo A1), piscina (campo A9), cida/prevenção de queda (sem protocolo, conselho seguro), pedreiro (RT6), asma (RC3), benedita (RC11).
- **d06:** tontura (RC20), avc (campo A15), cachaca (RC19), cida/FAST (RC1).
- **d07:** guia eclâmpsia (RO2, campo A4/A6), sangramento (RO1), eclampsia (campo A4/A6), cida/queimadura (campo A10), wesley (RC24/RT6, campo A13), febre (RC20).
- **d08:** onibus (RC20), anticoag (RT9), convulsao (RC7), cida (RT6), petequias/teste do copo (RC6/RC7/RC14), diarreia (RC11), choque (RT7).
- **d10:** guia compressão (campo A5/A15), icc (RC12), joelho (RC24).

## Revisado e mantido

- **d06_hipo_mae: USA.** O RC10 põe "alteração súbita da consciência" em USI/USB. Mas ela não acorda; só resmunga. Pelo MASTER (RM2) é inconsciente, portanto vermelho. E no jogo só a USA dá glicose na veia. Manual p.6 coerente.
- **d06_cachaca: USB.** RC19: sonolento e vomitando, sem glicemia medida e com suspeita de AVC conta como "alteração da consciência não totalmente atribuível ao álcool".
- **d02_gestante: ⚖ ORI/USB.** Malinas 1 (RO2) sustenta a orientação preferida. As 4 perguntas obrigatórias continuam.
- **d09_helio: orientação.** A hipoglicemia (54) já foi corrigida (112). O "hipoglicemia (se medida)" do RC10 vale para o estado atual.
- **d02_tornozelo, d06_lombar, d10_joelho: orientação.** Pelo RC24 e pelo RC15, dor moderada com marcha preservada é orientação; só "dor intensa" ou "incapaz de andar" é USB.
- **d07_vereador: orientação.** O RM8 manda não enviar ambulância para "remoção para exames".
- **d09_casa grave e d09_marcia sem bombinha: ⚖ com `noPenalty`.** Mantidos como estavam: é o dilema de roteiro.
- **Todas as vermelhas com USA exclusiva conferem:** RC17 (infartos), RC12 (DPOC, EAP), RT4 (hemorragias), RC18 (HDA), RT8 e RT9 (traumas), RC21 (escorpião), RC7 (estado de mal), RM7 (paradas), RC2 (anafilaxia), RC8 (engasgo), RO2 (eclâmpsia), RC6/RC14 (púrpura).
- **Janelas de risco.** São balanceamento de jogo e não foram alteradas. Ver a nota 3 para o motor.

## Perguntas abertas para a equipe médica (`[validar]` que ficaram no código)

1. **d01_dente** (`d01.ts`). O RC23 manda considerar USI/USB para dor de dente intensa ou moderada. O jogo prefere orientar (critério do RM4) e aceita USB como ⚖. A USB deveria ser só excesso?
2. **d04_enxaqueca** (`d04.ts`). A mesma pergunta para o RC6, "dor moderada", numa enxaqueca habitual sem sinal de alarme.
3. **d06_cabeca** (`d06.ts`). Bebê de 1 ano e meio, queda de mais de 1 m, hematoma mole fora da testa, brincando. O RT9 põe "hematoma em couro cabeludo" em orientação; o jogo exige USB por risco de fratura (RT6). Orientar a ida ao hospital por meios próprios deveria ser aceito?
4. **d10_pulso** (`d10.ts`). Lesão autoprovocada no punho, sangramento contido com compressão, adolescente calma com o pai. O jogo prefere USB e aceita USA, porque no RC5 "alto risco de nova autoagressão" está na lista USA/USI. A USA deveria ser a preferida?
5. **d10_telhado** (`d10.ts`). Queda de 4 m, em uso de anticoagulante, provável fratura de bacia, estável. O RT6 e o RT8 tratam queda de altura como "mecanismo de trauma significativo", ou seja, USA. O jogo prefere USB e aceita USA. A USA deveria ser a preferida desde o início?

Pergunta geral, para as 6 ligações verdes que viraram ⚖ por discriminador de dor ou de história (1, 2, d03_muscular, d03_briga, d07_sangramento, d08_onibus): a equipe concorda que o paciente que anda, sem comprometimento de consciência, respiração ou circulação, deva ter a orientação como preferida, com a USB defensável?

## Notas para o coordenador (fora dos meus arquivos)

1. **Vermelho sem USA livre (`grading.ts`).** Pelo RM4 e pelo RM7, na falta de USA vai a USI ou a USB. Hoje, se não há USA livre, o carimbo de USB numa vermelha com `ok: ['USA']` é avaliado como "falta", com advertência. Sugestão: avaliar como defensável quando nenhuma USA estava disponível na hora do carimbo.
2. **Gerador de vídeo (`src/content/video.ts`).**
   - **d10_pulso.** O diagnóstico "Lesão autoprovocada no punho…" cai no ramo de fratura (`/punho/`) e descreve "o punho inchado, com um degrau". Além disso, não entra no `harmful`, porque a expressão regular só reconhece `suicid|ideacao|crise emocional|desesperanca`. Sugestão: acrescentar `autoprovoc|autoagress|autoles` ao `harmful` e tirar esses casos do ramo de fratura.
   - **Dona Cida.** Ela liga de telefone fixo (3322-1408), mas a recusa padrão diz "meu celular é desses de botão". Muitos números fixos (3xxx-xxxx), como os de d03_antonio e d08_anticoag, recebem vídeo como se fossem de celular. É detalhe de ambientação.
3. **Janela de parada inconsistente.** Em d05_infarto, a piora para parada usa `{good: 60, bad: 150, +25}` contada desde a chegada da ligação, sem `resetRisk`. Em d03_antonio, a janela é 30/75 a partir do colapso. É decisão de balanceamento; não mexi.
4. **`docs/VALIDAR_MEDICO.md` precisa ser gerado de novo.** O script (`scripts/medical-review.ts`) vai listar as novas ⚖ e as 5 marcações `[validar]` restantes.
