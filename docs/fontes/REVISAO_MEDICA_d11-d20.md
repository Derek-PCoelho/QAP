# Revisão médica: dias 11 a 20

Revisão da regulação das ligações de `src/content/days/d11.ts` a `d20.ts`, feita em 15/10/2026. O foco foi a correção clínica de cada ligação: a verdade (`sev`, recursos aceitos em `ok`, `best`, `dest`, `ref`, `must`, `risk`) e as orientações que o regulador dá por telefone. O método é o mesmo da revisão dos dias 1 a 10 (`REVISAO_MEDICA_d01-d10.md`).

**Fontes.** Protocolos de regulação do SAMU 192 Regional Fortaleza (SAMUFor), pelas notas `SAMU_REGULACAO.md` (RM, RC, RT, RO e RP), `SAMU_CAMPO.md` (nos comentários do código aparece como "campo A5", "campo B3" etc.) e `SAMU_GESTAO.md` (Anexo VII, regimento). Nenhuma página do SAMUFor trata dengue: para ela foi usado o capítulo 58 do livro de Medicina de Emergência da USP (sinais de alarme, grupos A a D). Para o destino da queimadura de mão, a tabela 9-2 do ATLS (11ª ed., critérios da ABA). Para a mordida de cão, a profilaxia da raiva do Ministério da Saúde.

**Critério.** Vale o discriminador mais alto presente no protocolo da queixa (RM0). O jogo não tem USI: onde o protocolo diz "USI/USB", o jogo aceita USB. Quando o protocolo aceita uma segunda resposta e o caso clínico também a sustenta, ela entra como alternativa defensável (⚖). A resposta preferida (`best`) não mudou em nenhuma ligação. Em nenhum caso foi criada pergunta obrigatória nova.

## Resumo

- **99 ligações revisadas** (contando as variantes condicionais: d12_rosangela, d20_antonio/d20_viuva e d20_final/d20_final_rua), mais os 9 roteiros de orientação definidos nesses arquivos (`d11_choque`, `d12_intox`, `intox_comprimido`, `queda_banheiro`, `queda_laje`, `asma_crianca`, `avc_cida`, `prolapso`, `intox_remedio`).
- **Nenhuma cor (`sev`) estava errada.** Nenhuma resposta preferida mudou. Recursos aceitos mudaram em 13 ligações: em todas foi acrescentada uma alternativa ⚖ que o protocolo sustenta e que antes o jogo punia como excesso, falta ou dispensa.
- **Outras correções:**
  - 2 destinos ampliados (d13_moto, d14_queimadura) e 2 encaminhamentos ampliados (d14_tosse, d17_enxurrada). Um diagnóstico corrigido (d14_queimadura não é "extensa").
  - Falas de transcrição: d12_masseira (pista dos Bombeiros), d14_cida ("A Zélia me contou"), d19_escada (sem "pele crítica") e a vítima Edmilson da triagem do dia 15.
  - Orientações por telefone: d17_enxurrada e d20_faca. Insights: d13_cida, d14_preeclampsia e d14_queimadura.
  - Texto de rádio: d18_bebe (antibiótico fora da USA). Rádio `ok` e diário `alive` novos onde a USB passou a ser aceita.
  - "Yuri Batista" virou "Yuri Santana" nos meus arquivos. A flag `simone_demitida` passou a ser registrada no fim do dia 20.
- **Marcações `[validar]`: eram 48 nestes arquivos.** As fontes confirmaram todas: 47 viraram comentário "Conferido (código)" e a de d15_fila virou o comentário da mudança de decisão. Ficam **10 perguntas abertas** para a equipe médica, todas novas, listadas no fim deste documento.
- Nenhuma cena de vídeo foi escrita. Estes arquivos não têm campo `video` explícito. O gerador padrão tem contradições, listadas nas notas para o coordenador.
- O texto do jogo não ganhou "SAMU" nem "192". Os comentários citam só códigos de protocolo, como RC20, RT6 ou "campo A5".
- `npx tsc --noEmit -p .` e `npx vitest run` passam: 8 arquivos de teste, 84 testes, sem avisos de conteúdo.

## Mudanças na decisão aceita

| Ligação | Antes → depois | Fonte |
|---|---|---|
| d11_desmaio | ORI → ⚖ **ORI** (preferida) ou USB; `dest` UPA | RC20: desmaio testemunhado é "história de inconsciência" (USI/USB). Vasovagal típico: orientação preferida, como em d08_onibus |
| d11_gestante | USB → ⚖ **USB** ou ORI → Maternidade (`ref` MAT) | Nenhuma página trata dengue nem febre na gestante; sem discriminador, o RM4 orienta ida por meios próprios. USP cap. 58: gestante é grupo B (avaliação no mesmo dia). Antes, orientar a ir à maternidade dava sindicância. Ver `[validar]` 1 |
| d12_surto | USB → ⚖ **USB** ou USA | RC4: "comportamento heteroagressivo" e "alto risco de agredir outros" são USA/USI; no RC9, a USA vai de apoio à USB. Ver `[validar]` 2 |
| d12_crise | USB → ⚖ **USB** ou USA | RC5: "alto risco de autoagressão (ideação suicida)" é USA/USI. Igual a d10_pulso. Ver `[validar]` 3 |
| d12_marido | ORI → ⚖ **ORI** ou USB; `dest` UPA | RC22: "coração batendo na garganta" é palpitação atual; RC12: falta de ar acima de 60 anos. Os dois são USI/USB. Igual a d03_briga e d09_bruna |
| d12_masseira | USB → ⚖ **USB** ou USA | RC24: mão "esmagada, roxa" é comprometimento vascular distal (USA); AT23 (esmagamento) é conduta de USA. Igual a d09_cida_b. Ver `[validar]` 4 |
| d13_moto | `dest` UPA → UPA ou **REG** | Anexo VII, matriz 4: a UPA manda o perfil traumato-ortopédico a serviço especializado. Luxação não é "fratura simples" (Manual p.9-A) |
| d14_queimadura | `dest` UPA → UPA ou **REG**; dx "2º grau extensa no braço" → "2º grau no braço e na mão" | RT7: dor intensa → USI/USB. Antebraço e mão são cerca de 5% da superfície (campo B5): não é extensa. ATLS tab. 9-2: queimadura de 2º grau na mão é critério de centro de queimados |
| d14_tosse | `ref` UBS → UBS ou **UPA** | RP1: sem estridor nem esforço → orientação. Tosse "de cachorro" é laringite (campo B6/APed18), e a UPA tem o corticoide |
| d15_fila | ORI → ⚖ **ORI** ou USB; `dest` UPA | RC20 (igual a d11_desmaio) |
| d15_mae | ORI → ⚖ **ORI** ou USB; `dest` UPA | RC22: "meu coração vai sair pela boca" é palpitação atual. Igual a d03_briga |
| d15_bebado | USB → ⚖ **USB** ou USA | RT8: poste entortado e airbag aberto sugerem mecanismo de trauma significativo (USA). Ver `[validar]` 7 |
| d17_enxurrada | `ref` UBS/CASA → + **UPA** | Campo A9 (BPed26/APed33): criança que submergiu vai ao hospital mesmo sem sintoma. Ver `[validar]` 9 |
| d19_parto | USB → ⚖ **USB** ou USA | RO2: terceiro filho, bolsa rota e contrações a cada 3 min dão Malinas perto de 7 (acima de 7 é USA). Igual a d07_parto e d09_parto |
| d19_dente | ORI → ⚖ **ORI** ou USB; `dest` UPA | RC23: dor intensa ou moderada é USI/USB. Igual a d01_dente (a pergunta para a equipe está lá) |
| d19_onibus | USA → ⚖ **USA** ou USB; `risk.needs` USB | RC10: confuso mas responsivo dá USI/USB; USA só se não reativo ou convulsionando. A USB dá glicose 50% sob orientação médica (BC19). A preferida segue USA (Manual p.6) |
| d19_cida | USA → ⚖ **USA** ou USB; `risk.needs` USB | RC1: déficit de um lado e fala arrastada são USI/USB; RM8: AVC na janela pode ir de USB. Igual aos AVCs dos dias 6 e 10. A preferida segue USA e a cena da Dona Cida não muda |

Notas sobre as mudanças acima:
- A tabela de bônus da revisão dos dias 1 a 10 vale aqui: a preferida sempre paga mais que a alternativa ⚖. Na ORI ⚖ de uma ligação amarela (d11_gestante), o bônus da orientação é 8 contra 20 da USB.
- **`risk.needs` USB** (d19_onibus, d19_cida): a USB que chega conta como cuidado adequado. Sem isso, a USB "defensável" pediria USA pelo rádio.
- **`dest` nas verdes com USB ⚖** (d11_desmaio, d12_marido, d15_fila, d15_mae, d19_dente): a partir do dia 9, toda ligação com despacho possível precisa de destino; sem ele o teste avisa. A UPA é o destino coerente para quem vai de USB.
- **Textos novos dessas ligações.** O rádio `excess` continua valendo para a USA, que segue como excesso. Para a USB entrou um rádio `ok` e um diário `alive` próprios, no lugar dos textos padrão ("paciente estável. QUR para UPA NORTE"). Em d11_gestante entrou o diário `ori`.
- **Fraturas simples ficaram só com UPA** (d15_fratura, d18_punho, d19_escada). O Manual p.9-A manda "fraturas simples" à UPA, e nenhuma delas tem comprometimento vascular nem exposição.

## Correções de texto (transcrição, orientação e rádio)

| Ligação | Antes → depois | Fonte |
|---|---|---|
| d12_masseira (abertura e `seguranca`) | Acrescentado "Mas a mão não sai de jeito nenhum!" e "Pra soltar, só desmontando a máquina, e aqui ninguém tem ferramenta pra isso." Os Bombeiros são obrigatórios (`sup`) e a fala não dava pista justa | Item do QA |
| d14_cida (abertura) | "Você me contou que ele desenha ambulância, lembra?" → "A Zélia me contou que ele desenha ambulância." O jogador nunca contou isso; a Zélia conversa com a Cida (cena do dia 13) | Item do QA |
| d19_escada (fala do Cícero) | "O osso da clavícula tá marcando a pele aqui" → "tá com um degrau aqui". A fala antiga descrevia "pele crítica", que o RC24 põe em USA, e contradizia a verdade (USB) | RC24, igual a d03_bicicleta |
| d15_mci (vítima Edmilson) | "…segura o braço com a outra mão" → "…; tentou levantar e as pernas bambearam de dor". O painel mostra "Não anda" e a fratura de braço sozinha não impede de andar: pelo START seria verde | PMV3 (START) |
| d14_preeclampsia (insight) | "Rosto e mãos inchados e dor em cima da barriga…" → "Inchada, com pressão de 16 por 11 e dor em cima da barriga…". Inchaço não é critério de gravidade; pressão de 160 por 110 é | Campo B4/AGO13 |
| d14_queimadura (insight) | "queimadura de segundo grau extensa. Amarelo → USB → UPA" → "queimadura de segundo grau, com dor intensa. Amarelo → USB → UPA (com a mão queimada, o Regional também serve)" | RT7, ATLS |
| d13_cida (insight) | Acrescentado "lavar os olhos com água corrente" (ela está com os olhos vermelhos) | Campo A10 |
| d17_enxurrada (orientação) | Uma lista só ("tosse, cansaço, vômito, diarreia ou febre → UBS") virou duas: tosse que não para ou cansaço → UPA na hora ou religar; febre, dor no corpo ou na batata da perna, vômito ou diarreia nos próximos dias → UBS, contando da enchente | Campo A9; sinais de leptospirose |
| d20_faca (orientação) | "Se a faca estiver nele, não tira." → "…não tira: aperta em volta dela." | Campo A5: objeto encravado, pressionar ao lado |
| d18_bebe (rádio `ok`) | "Acesso, antibiótico, seguimos {dest}" → "Acesso, soro correndo. Seguimos {dest}, já avisados pra ter antibiótico na porta". A lista de medicações da USA não tem antibiótico | Campo C (Medic1–57), igual a d08_petequias |
| d11_dengue_grave, ficha e jornal do dia 12 | "Yuri Batista" → "Yuri Santana" (paciente em `d11.ts`; ficha da sindicância e 3 subtítulos do jornal em `d12.ts`) | Item do QA |

## A flag `simone_demitida` (d20.ts)

Ninguém setava `simone_demitida`. Ela só era lida, em `d20.ts` (a variável `fica`, que escolhe o P.S. da Simone) e em `src/content/endings.ts:138` (epílogo). A condição era sempre verdadeira e não mudava nada.

- `fica` agora é só `lealSimone >= 6` e `materia_publicada`, a mesma regra de antes sem o termo morto.
- O `onEnter` da cena `d20_fim` grava `simone_demitida` quando ela não fica. O P.S. "Dia 31 é o meu último dia" passa a ter um registro no estado, e o epílogo lê a mesma condição de um jeito coerente. Nenhum desfecho muda.

## Marcações `[validar]` resolvidas

Estas viraram comentário "Conferido (código)", sem mudar a decisão:

- **d11:** guia `d11_choque` (campo B3/A8/A5; USP cap. 58), manchas (USP: fase crítica na defervescência; mancha que some à pressão não é erupção fixa), barriga (RC11; USP), neusa (USP: idoso ou doença crônica, hemograma no mesmo dia), desmaio (RC20; campo B3), dengue_grave (campo B3; RM4; USP grupo D).
- **d12:** guia `d12_intox` (campo A12; RM2), cartelas (campo A12), masseira (campo B5/AT23; regimento, art. 26), cocaina (RC17; RT5).
- **d13:** guia `intox_comprimido` (campo A12/A2), soda (RT5; RC8/RP1; janela é balanceamento), cida (campo A12/A10; RC12; RC25), moeda (RC8), maionese (RC11), comprimidos ×2 (RT5; campo B6; janela é balanceamento), cachorro (RC21; profilaxia da raiva).
- **d14:** cida (RC17), queimadura (campo A10), preeclampsia (campo B4/AGO13), tosse (RP1; APed18).
- **d15:** cida (RC15), insolacao ×2 (primeiros socorros do calor; RM4; janela é balanceamento). A de d15_fila virou o comentário da mudança de decisão (RC20).
- **d16:** guias `queda_banheiro` e `queda_laje` (campo A13/A5), convulsao (campo A6/A12; RC7), osvaldo ×2 (RC12; RM4; janela é balanceamento), garganta (RC12).
- **d17:** cida (campo A11; PE1), choque (campo A11; PE1; campo A1), vidro (campo A5), insulina (RC10; campo B2), muro (RT3; campo B5/AT23), enxurrada (campo A9).
- **d18:** aorta (RC17; RC13), bebe (RC6/RC14; campo B1/B6).
- **d19:** guias `asma_crianca` (campo A15/C; RC3/RP1) e `avc_cida` (campo A15; RM2), marimbondo (RC21; RC2; campo A8), onibus (campo A7: açúcar pela boca só se engole bem).
- **d20:** guias `prolapso` (RO2; campo B4/AGO9) e `intox_remedio` (campo A12; RT5), faca (campo A5; RT4), feijao (RC8).

## Revisado e mantido

- **Dengue (dia 11 e d20_dengue).** Sem alarme: orientação e UBS (grupo A). Com alarme: USB → UPA; idoso confuso (d11_idoso): USB → Regional, como diz o Manual p.11. Choque: USA → Regional. d20_dengue tem alarme (dor intensa, vômitos, tontura ao levantar, gengiva sangrando), mas pele quente e lúcido: USB.
- **d17_simone: só USB.** Pressão 22 por 13 com cefaleia e vista embaçada, sem déficit, lúcida, lendo o crachá. No RC6, dor moderada e redução da acuidade visual são USI/USB; no AC19, a emergência hipertensiva pede encefalopatia, AVC, IAM, dissecção ou edema de pulmão. A USB dá captopril sob orientação médica (BC13).
- **d17_insulina, d17_vidro e d18_colica: USB.** Sem discriminador de USA, e nos três o texto deixa claro que não há como chegar à UPA. d17_insulina: glicemia 420, abaixo dos 500 do RC10, sem vômito nem respiração funda.
- **d16_convulsao: USB.** Pelo RC7, o epiléptico conhecido com crise única seria orientação, mas ainda confuso e sem o remédio é "estado pós-ictal alterado" (USI/USB).
- **d16_apendicite: USB → Regional.** RC13: dor intensa → USI/USB; abdome cirúrgico.
- **d14_idosa e d20_queda: ⚖ USB preferida, USA aceita, mantidos.** Viraram perguntas (`[validar]` 5 e 10).
- **d14_preeclampsia: só USA, mantida.** O sulfato de magnésio só vai na USA. Virou pergunta (`[validar]` 6).
- **d17_cida: ⚖ ORI/USB com Bombeiros, mantido.** O risco é a casa, não a clínica.
- **Todas as vermelhas com USA exclusiva conferem:** RC17 (d13_infarto, d15_infarto, d17_telhado, d18_odete, d19_infarto), RC6 (d14_cefaleia), RC6/RC14 (d18_bebe), RC13/RC17 (d18_aorta), RT4/RT8 (d14_ciclista, d18_moto, d20_faca, d17_muro), RT6/RT9 (d16_biel, d16_laje), RT5 (d12_cartelas, d13_soda, d13_comprimidos, d20_intox), RC3 (d19_asma), RC12 (d16_osvaldo, d20_edema), RO2 (d20_cordao), RM7 (d17_crianca, d17_choque, d20_final, d20_final_rua), RM4 (d15_insolacao), dengue grave (d11_dengue_grave) e a triagem de múltiplas vítimas (d15_mci; START das 14 vítimas conferido).
- **Azuis e trotes** (Dona Cida dos dias 12, 14, 16 e 18; d12_rosangela; d18_desabafo; d20_antonio; d20_viuva; ligações-teste e trotes): conferem.
- **Janelas de risco.** São balanceamento de jogo e não foram alteradas.

## Perguntas abertas para a equipe médica (`[validar]` que ficaram no código)

1. **d11_gestante** (`d11.ts`). Gestante de 30 semanas com febre na epidemia, estável, bebê mexendo, sem sangramento. O jogo prefere USB → Maternidade (Manual p.11) e agora aceita orientar a ida à maternidade hoje (⚖). A orientação deve ser aceita?
2. **d12_surto** (`d12.ts`). Crise psicótica, quebrando vasos e um carro, pedaço de pau na mão, ameaçando quem chega perto. RC4 dá USA/USI; no RC9 a USA vai de apoio à USB para contenção química. O jogo prefere USB + PM e aceita USA. A USA deveria ser a preferida?
3. **d12_crise** (`d12.ts`). Ideação suicida no dia, sozinho, sem tentativa nem passado de autoagressão, irmã a duas quadras. O jogo prefere USB e aceita USA (RC5). Concordam?
4. **d12_masseira** (`d12.ts`). Mão presa e "roxa" em masseira, à espera dos Bombeiros. RC24 (comprometimento vascular distal) e AT23 (esmagamento) apontam USA. O jogo prefere USB + Bombeiros e aceita USA. A USA deveria ser a preferida?
5. **d14_idosa** (`d14.ts`). 81 anos, 6 a 7 horas no chão, confusa, "gelada", possível anticoagulante, não lembra a queda. RT6/RT9 põem alteração súbita da consciência e hipotermia em USA. O jogo prefere USB e aceita USA. A USA deveria ser a preferida?
6. **d14_preeclampsia** (`d14.ts`). 32 semanas, cefaleia, escotomas, dor epigástrica, 16 por 11, sem convulsão. O RO2 só põe em USA a DHEG com convulsão; "pressão arterial elevada" é USI/USB. O jogo aceita só USA, pelo sulfato de magnésio. A USB deveria ser aceita como ⚖ antes da convulsão?
7. **d15_bebado** (`d15.ts`). Colisão em poste com airbag aberto, embriagado, corte na testa, dor no peito do cinto. RT8 trata dano grave ao veículo como mecanismo significativo (USA). O jogo prefere USB + PM e aceita USA. A USA deveria ser a preferida?
8. **d17_crianca** (`d17.ts`). Parada por afogamento numa criança de 7 anos. O campo A9 diz "A-B-C: via aérea e ventilação primeiro" na criança afogada, mas o roteiro `rcp` é só compressões e nenhuma página traz boca a boca para leigo. Na criança afogada, o telefone deve orientar ventilações de resgate?
9. **d17_enxurrada** (`d17.ts`). Criança de 4 anos caiu sentada em água na canela, engoliu e tossiu na hora; agora brinca e respira normal. BPed26/APed33 mandam ao hospital a criança que submergiu. O jogo aceita UBS, casa ou UPA. Deveria ser só UPA, no mesmo dia?
10. **d20_queda** (`d20.ts`). 81 anos, anticoagulado, bateu a cabeça, perguntou as horas duas vezes (Glasgow 14). Mudança de Glasgow nas últimas 12 h é "alteração súbita da consciência" (USA no RT9). O jogo prefere USB e aceita USA. A USA deveria ser a preferida?

Pergunta geral, como a dos dias 1 a 10, para as 5 ligações verdes que viraram ⚖ por discriminador de desmaio, palpitação ou dor (d11_desmaio, d12_marido, d15_fila, d15_mae, d19_dente): a equipe concorda que o paciente que anda, sem comprometimento de consciência, respiração ou circulação, tenha a orientação como preferida e a USB como defensável?

## Notas para o coordenador (fora dos meus arquivos)

1. **"Yuri Batista" na campanha da Simone.** Continua em `src/content/simone/days8_13.ts`, linhas 533 ("Yuri Batista: orientação…") e 658 (ficha da sindicância). Não editei. Para bater com os dias 11 e 12, trocar por "Yuri Santana". Outros pacientes "Batista" sem ligação com a Simone nos meus arquivos: Lorenzo Batista (d13_comprimidos) e Joaquim Batista Lopes (d13_infarto); não mexi.
2. **`simone_demitida` em `endings.ts:138`.** Não precisa mudar: a flag agora é gravada no fim do dia 20 quando a Simone não fica, e a condição do epílogo continua idêntica.
3. **Gerador de vídeo (`src/content/video.ts`).** Os vídeos padrão dos dias 11 a 20 contradizem a verdade em vários casos. Os que podem levar a uma decisão errada:
   - **Dengue sem alarme.** O teste `has(/alarme/, dx)` também casa "sem alarme" e "sem sinais de alarme". d11_olhos, d11_manchas, d11_neusa, d11_atestado, d11_desmaio e d11_febre mostram a pessoa "encolhida, com a mão na barriga", deitada: um sinal de alarme. Sugestão: tratar `sem (sinais de )?alarme` como sem alarme.
   - **Corpo estranho sem obstrução e amigdalite.** d13_moeda, d20_feijao e d16_garganta caem no ramo do engasgo: "as duas mãos no pescoço", "tossindo forte", "batendo na mesa". Isso sugere obstrução de via aérea (USA). Sugestão: só usar o ramo do engasgo quando o dx não disser "sem obstrução".
   - **d20_queda.** `anticoag` torna o quadro grave: olhos fechados, "roxo em volta dos olhos", ronco, "não mexe o lado direito". A verdade é TCE leve, acordado, FAST normal.
   - **d18_moto.** "O osso aparece pela pele da canela; sangra, mas não esguicha." A verdade é fêmur (coxa) com sangramento que empoçou e choque.
   - **d18_bebe.** Mostra púrpura nas pernas; a mãe diz que não há manchas.
   - **d19_dente.** "Encolhido debaixo do cobertor, com calafrio", mas ele não tem febre.
   - **d14_queimadura.** Com "extensa" no dx, o vídeo mostrava peito e barriga queimados; sem "extensa", mostra "uma área do tamanho da palma da mão". O certo é do cotovelo à mão, com bolhas e pele soltando. Falta um ramo de membro no gerador. Não use "antebraço" no dx: cai no ramo de fratura ("punho com degrau").
   - Menores: d20_faca não mostra sangramento; d17_muro mostra vítima "no asfalto" com "uma perna em posição estranha", mas ela está presa sob tijolos no quintal; d12_surto mostra "uma faca em cima da mesa", mas ele está na rua com um pau. Vários casos fora de casa aparecem "na sala" (d11_desmaio, d12_masseira, d15_fila, d19_escada).
4. **Edições concorrentes.** Durante a revisão apareceram outras mudanças em `d11.ts`, `d12.ts` e `d14.ts`, nos textos de narração das cenas do bico noturno ("A noite na ambulância acaba de madrugada…"). Não são minhas e não estão nas tabelas.
5. **`docs/VALIDAR_MEDICO.md` precisa ser gerado de novo.** O script (`scripts/medical-review.ts`) vai listar as novas ⚖ e as 10 perguntas abertas dos dias 11 a 20.
