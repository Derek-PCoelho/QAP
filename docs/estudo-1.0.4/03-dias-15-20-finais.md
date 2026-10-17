# Estudo 03 — Dias 15 a 20 e Finais (leitura integral)

Arquivos lidos 100% (linhas): d15.ts 904 · d16.ts 1092 · d17.ts 1116 · d18.ts 1065 · d19.ts 874 · d20.ts 1179 · endings.ts 218.
Apoio consultado: src/content/dsl.ts (77, inteiro), src/engine/types.ts (tipos CallDef/DayDef/Scene/Choice/ExtraQ/LinkDef), src/engine/endings.ts (inteiro), trechos de src/engine/shift.ts (MCI, vaga), docs/HANDOFF.md, docs/FEEDBACK-1.1.md.

Convenções da DSL relevantes: `fx.set/add/key/diary/board/doc`, `is.flag/not/v/key`; `{{trecho|pista}}` = marcação do Modo Discrepância; `links: [{a,b,insight,unlock}]` = pares de inconsistência; `extra[].locked` só aparece se um link/pergunta desbloquear; `Choice.needLink` só aparece após achar o link. `manual:xxx` em links = regra do Manual. Tokens: `{dr}`, `{Dr}`, `{m:masc|fem}` (gênero do protagonista), `{c:...|...}` (gênero do cônjuge), `{Oconj}/{doconj}`, `{Pai}`, `{nome}`, `{meu} {filho}`.

---------------------------------------------------------------------------
## DIA 15 — "O Show" (sexta-feira, 32 °C, Expo Aurora) — d15.ts
Manual novo: p.15 Múltiplas vítimas (START, reforço regional). goal: maxUSA 4, bônus 30.

### Enredo
- **Jornal** (d15.ts:276-302): manchete Expo Aurora (20 mil, show grátis 13–17h, uma saída só). Matérias condicionais: ciclista D14 (`d14_ciclista_obito`/`d14_ciclista_vivo`), pré-eclâmpsia D14 (`d14_preeclampsia_obito`/`_viva` — Jaqueline 24a), e `val('depoimento')==='aceitou'` → "Gazeta recebe relatos de dentro da Regulação" senão nota da Saúde+ Gestão (OS).
- **Passagem** (303-315): noturno = `noturnoFala` → PAULA se `denunciou_henrique`, senão HENRIQUE ("Noite tranquila... vinte mil pessoas, uma saída só"). Simone: sobrinho vai ao show.
- **Linha do tempo/rádio** (316-363): 07:02 COPOM avisa show; 12:30 Simone (fila desde 7h sem boné); 16:40 interfone Peixoto ("Manual p.15... Não me esvazia a cidade... reforço de Rio Claro, eu assino"); 17:01 COPOM/193 Bombeiros; 17:12 pedido Sgt. Rocha (libera quem anda = START / segura todo mundo → desgaste +2; padrão "segura", timeout 6); 17:25 cobrança se MCI não decidido; 17:35/17:52/18:12/18:28 `reforcoTroca` (USA de Rio Claro assume vítima após 28 min se `mci_reforco` e sem USA livre → libera USA da cidade); 17:45 `julianaRadio`; 18:16 e 18:36 `regionalLotado`; 18:45 encerramento.
  - `julianaRadio` (65-103): se Juliana salva → pedido "avisar o pai, Seu Antônio" (ou a mãe, se `key antonio==='perdido'`: "a mãe já perdeu o marido esse mês") → opção 5 min seta `juliana_pai_avisado` + humanidade+1. Se perdida → rádio óbito; com `juliana_cliente` cita "sacola de costura de um ateliê da Vila Esperança" (cliente de Lúcia, D11).
  - `regionalLotado` (105-128): USA/USB RETIDO no Regional ("corredor lotado, sem maca") → negociar 15 min (libera em 15) ou não ligar. **É o único "proto-vaga zero" de hoje: retenção de maca, não vaga zero.**
- **Casa** (interlude 885-902): aniversário do Liam. teaser varia; familyLacos 2; bico = −2 Laços. Conta `bolo_davi` R$60 (pago → `aniversario_pago`; não pago → `aniversario_fiado` + Laços −1).
  - `cenaAniversario` (133-245): se Liam ausente → telefone (casa da irmã do cônjuge se foi embora; ou Rio Claro com a tia se `lucia_fora`). Em casa: bolo de padaria com ambulância de plástico, fiado no Seu Toninho. Se `irritado` (café) → Liam esconde o desenho, seta `davi_desenho_escondido` ("A folha dobrada não aparece mais. Nem naquela noite, nem depois"). Se `marcia_morreu && val('d9_davi')==='USA'` → Liam de manga comprida a 32 °C (gancho de bullying/agressão, "🌱 manga comprida (D16)"). Presente da Cida (estojo de lápis, "Vó Cida") se `cida_conversou_d15` ou humanidade ≥ 6. `marcia_viva` → cartão "Tia Márcia". Juliana perdida + `juliana_cliente` → cônjuge chora ("minha primeira cliente").
  - Escolhas: promessa do domingo (affectionate; `promessa_davi`, Laços +1) / "tem plantão, a gente dá um jeito" / "Agora não... cansado" (só se irritado; Laços −1).
  - `bicoD15` (247-267): desenho no travesseiro "UM DIA INTEIRO" ou 3 chamadas perdidas + áudio "Parabéns pra mim".

### Ligações
| id | hora | quem | verdade | recurso certo | armadilha | âncora |
|---|---|---|---|---|---|---|
| d15_fratura (366) | 07:50 | Seu Ademar, 74, minimizador | fratura de antebraço c/ degrau | USB→UPA (amarelo) | "não é nada, vou de bicicleta" | comum (pool trauma_moderado) |
| d15_cida (409) ★ | 09:15 | Dona Cida (D1+) | lombalgia mecânica | ORI (UBS/casa) | sinais de alarme ausentes; extra "Conversar" 15 min → `cida_conversou_d15` + humanidade+1 | âncora |
| d15_fila (473) | 11:10 | Bianca (amiga) / paciente Camila 19 | síncope por calor+jejum, recuperada | ORI (best), USB aceita | noteWrong "Parece grave!" | comum (pool leve) |
| d15_insolacao (524) | 13:40 | Douglas (primo) / Felipe 23 | intermação | USA→REG, risco 50/120 | noteWrong "bêbado, coisa leve"; extra "resfriar" | comum (pool grave) |
| d15_mci (586) ★ | 17:00 | Sgt. Rocha (PM) | múltiplas vítimas (14: 3 vermelhas, 5 amarelas, 6 verdes, 0 pretas) | painel START; USA+PM→REG; reforço regional 28 min/2 unid.; redWindow 35 | Patrícia FR 34 mas anda → verde; Wanderson sangrando mas anda → verde; Kevin enchimento 4 → vermelho; Josué não obedece → vermelho | âncora; `nightDeath`; onResolve: óbito sem `mci_sem_obitos` → `key juliana = perdido` |
| d15_infarto (639) ★ | 17:20 | Dona Dalva / Seu Ernesto 70 | IAM (supra) | USA→REG (precisa USA guardada ou reforço) | "deve ser o pastel"; worsen 80 min → "desmaiou, ronco" → guia RCP | âncora |
| d15_trote (690) | 17:35 | rapaz, "outro tumulto no shopping, cem pessoas" | trote oportunista | TROTE | risadas/música, caixa postal | comum (pool trote) |
| d15_mae (728) | 17:50 | Dona Vera, 46 | crise de ansiedade (filho Lucas bem) | ORI (best)/USB; guia respiração | noteWrong "falta de ar forte"; extra "lista" (mensagem do filho chega) | comum |
| d15_bebado (797) | 18:10 | Seu Jorge (bar) | colisão em poste, embriagado, trauma moderado | USB+PM→REG (USA aceita) | cena insegura sem PM → radio unsafe | comum. Comentário `[validar]` (834-836) |
| d15_crianca (846) | 18:30 | Seu Zeca (pipoqueiro) / Yasmin 5 | criança perdida, joelho ralado | ORI + PM | noteWrong "criança ferida grave" | comum |

### Personagens
Dona Cida (D1…), Juliana Ferreira (filha do Seu Antônio, D3/D11 — cliente de costura de Lúcia em D11), Seu Antônio (D3), Sgt. Rocha (PM), Peixoto, Simone, Henrique/Paula (noturno), Dona Zélia, Liam, cônjuge, Seu Toninho (padaria), Tia Márcia (D9). Novos: Ademar, Camila/Bianca, Felipe/Douglas, Ernesto/Dalva, Vera/Lucas, Seu Jorge, Seu Zeca/Yasmin.

### Flags
- Lidas: `denunciou_henrique`, `d14_ciclista_obito/vivo`, `d14_preeclampsia_obito/viva`, `val depoimento`, `mci_reforco` (setada pelo motor shift.ts:1210), `juliana_cliente` (D11), `key antonio/juliana`, `lucia_fora`, `lucia_foi_embora`, `marcia_morreu`, `val d9_davi`, `marcia_viva`, `irritado` (estado), humanidade.
- Gravadas: `juliana_pai_avisado`, `cida_conversou_d15`, `cida_ligou_d15`, `davi_desenho_escondido`, `promessa_davi`, `aniversario_pago`, `aniversario_fiado`; motor: `mci_reforco`, `mci_sem_obitos` (shift.ts:1283).
- **Nunca lidas fora do dia (grep em src/):** `juliana_pai_avisado`, `davi_desenho_escondido` (o texto promete "nem depois" — sem consequência), `aniversario_pago`, `aniversario_fiado`. (`cida_ligou_d15`/`cida_conversou_d15` são lidas dinamicamente em d20.ts:264-271 para a conquista "Ela Só Queria Conversar"; `cida_conversou_d15` também libera o presente da Cida no aniversário.) `promessa_davi` é lida no D16; `mci_sem_obitos` no jornal do D16.

### Vaga zero hoje
Não há vaga zero. Só `regionalLotado` (retenção de maca no Regional, negociar 15 min). O motor também tem o pedido `kind:'vaga'` em `ShiftSim.onHospital`, mas o D15 não tem `noVacancy`.

### Ganchos
Manga comprida (→D16), promessa do domingo (→D16), desenho escondido (sem continuação), Juliana (→D20 Antônio cita), Gazeta/depoimento (→D16+), reforço regional.

### Discrepância (D15)
Todas as falas com `{{...|id}}`; links por ligação: d15.ts:396-399 (fratura), 459-462 (cida, `kind:'confirma'`), 505-508 (fila), 566-569 (insolação), 622-627 (MCI), 669-673 (infarto), 719-722 (trote), 778-781 (mãe), 829-832 (bêbado), 875-878 (criança). Nenhum `locked`, `needLink`, `unlock` ou `confronto_*` no D15 → remoção do modo não quebra o dia (os links são só "insights").

### Problemas D15
- Ordem do array `timeline`: 18:16 (`regional`) vem antes de 18:12 (`reforco3`) (d15.ts:350-351). Se o motor não ordenar, pode disparar fora de ordem — conferir em shift.ts.
- `juliana_pai_avisado` sem uso (o D20 tem Seu Antônio agradecendo, mas não depende disso).
- `davi_desenho_escondido` sem consequência apesar do texto "nem depois" (FEEDBACK item 3/9).
- Médico: Ernesto "ronco" após desmaio = gasping → RCP, ok. MCI coerente com START (Patrícia FR 34 andando = verde é correto no START). Bêbado marcado `[validar]` sobre USA×USB (d15.ts:834).
- Sem "SAMU"/"192" (só "COPOM/193", bombeiros — ok).
- `presente(c,'davi')` também retorna falso quando `lucia_fora` (intencional: Liam vai com o cônjuge).

> Nota D15: a ordem fora de sequência da timeline (18:16 antes de 18:12) é inofensiva — shift.ts:268-269 agenda cada evento pelo horário `hm(t.at)`.

---------------------------------------------------------------------------
## DIA 16 — "O Menino que Gritava Lobo" (sábado, 30 °C seco) — d16.ts
goal maxUSA 3, bônus 30. `onStart`: se `peixoto_pai` (anotação do D5 "meu pai nunca precisou de ambulância") → `doc('peixoto_pai')` na mesa (d16.ts:398). Exporta `GUIDES_EXTRA` (roteiros de orientação `queda_banheiro` 30-83 e `queda_laje` 86-131).

### Enredo
- **Jornal** (399-439): "Grade cai... fere 14". Sub conforme `mci_sem_obitos` / nº de entradas de diário `mci_*` mortas do dia 15 / sem triagem ("esperaram mais de uma hora"). Matéria Juliana: salva (com variação Antônio salvo/perdido) ou morta ("vítima mais jovem"; mãe viúva se Antônio perdido) ou laudo da grade. Pneumonia lota UBS ("Não tenha vergonha de chamar" — prenuncia Osvaldo). Bêbado do poste. Anúncio Jairo Refrigeração.
- **Passagem** (440-453): noturno (Paula/Henrique): vítimas do show até 2h; "o Peixoto passou às seis, num sábado... ia ver o pai, 'gripadinho', não atende". Simone: "Achei que ele tinha nascido de uma planilha".
- **Timeline** (454-488): 07:01 Bené (USA 01) "pressentimento... torresmo"; 14:20 script `rodovia`: se 2 USA livres, Regulação Estadual leva a USA02 (FORA até 16:20) — a "frota otimizada"; 14:38 `sem_usa`: Simone lamenta a USA 03 / base Vila Esperança fechada (corte); 17:40 `jairo_acordou` se Jairo salvo.
- **Pré-casa** `preD16` (137-206): pé da Zélia (fio D13: `pe_ferida`, `pe_ferida_escondida`, `curativo`). Tratado → Zélia de chinelo, Laços +1. Não tratado → queda no banheiro, febre 39, pé diabético infectado, internação no Regional (atende "a Dra. Paula" se denunciou, senão "o Henrique, voz arrastada" — Henrique ainda bebendo), `zelia.status='internado'`, risk +2, `zelia_internada_pe`, `sem_costura_hoje`.
- **Casa** `cenaD16` (211-361): se `apanhando` (Liam presente + `marcia_morreu` + `d9_davi==='USA'`): hematoma de 4 dedos, "Caí no recreio"; **escolha "Ir até o quarto" tem `needLink: 'davi_verdade'`** (d16.ts:245) — só aparece achando inconsistência na cena (inspect 297-314: objeto `desenho_raiva` na geladeira; links cai_recreio×hematoma, cai_recreio×desenho_raiva, hematoma×desenho_raiva → `unlock 'davi_verdade'`). Quarto: "O Pedro do 3º B" disse que o protagonista deixou a tia Márcia morrer pra mandar a USA pro filho. Escolhas: verdade (`davi_conversa_verdade`, humanidade+1; texto varia com `bombinha` — "eu errei"), mentira (`davi_mentira`), abraçar (affectionate, Laços+1). Senão: sábado comum (Márcia viva "marquinha da abelha"; morta "ipê no pátio"; ou show na TV) + promessa ("Celular desligado desde já").
- `bicoD16` (363-388): se apanhando e Laços ≥ 6 → bilhete do cônjuge ("O Liam tá apanhando... Segunda eu vou lá") → `davi_lucia_descobriu`; promessa + bico → "dorme até as três".
- **Interlude** (1072-1091): familyLacos 1. onFamily: promessa → `promessa_cumprida` + Laços+1; onRest: −1; onBico: −1 e −1 extra pela promessa.
- **Cena de fim de turno** `endScene` (1011-1071): Peixoto na porta. Osvaldo salvo → "Era o meu pai"; se `peixoto_avisado_d16` "Você me avisou pelo interfone... 'manda'"; escolhas → "É isso que me assusta". Osvaldo perdido → "Vou querer a gravação... cada minuto"; "Sente. Todo mundo sente." Painel de metas verde.

### Ligações
| id | hora | quem | verdade | certo | armadilhas | tipo |
|---|---|---|---|---|---|---|
| d16_biel_trote (491) ★ | 07:40 | Biel (9-8877) | trote (jacaré na Matriz) | TROTE | `q.confronto_quadro` (518) | âncora |
| d16_cida (530) ★ | 08:50 | Dona Cida | esquecimento isolado (sinal 1) | ORI (azul) | extra `esta_bem` **locked** (582) desbloqueado só por links (593-595 `unlock:'esta_bem'`, `onFind: set cida_sinal1`); conversar 15 min → `cida_conversou_d16` | âncora |
| d16_apendicite (613) | 09:50 | Rosimeire 40 | apendicite provável | USB→REG | noteWrong "cólica leve"; UPA = radio dest (transferir) | comum |
| d16_biel (658) ★ | 10:40 | Biel (Gabriel), 15, chorando | TCE do avô Jairo (key `jairo`) | USA→REG, risco 45/110 (+15 guia) | número no quadro de trotes; `confronto_quadro` (687) com choro; links `doc:jairo_end`/`doc:jairo_neto` (recibo do D? no quadro) `kind:'confirma'`; worsen 35 min (vômito) → guia `queda_banheiro`; conquista `o_menino` | âncora |
| d16_convulsao (732) | 12:00 | feirante / Tião 45 | pós-ictal em epiléptico sem remédio | USB→UPA/REG | noteWrong "parece parada"; extra orientar | comum |
| d16_trote (787) | 13:10 | "Beto, condutor da USB 03" | trote sofisticado | TROTE | conferir frota; retorno "Dudu" | comum |
| d16_osvaldo (831) ★ | 14:30 | Seu Osvaldo Peixoto 84 (pai do coordenador) | pneumonia com sepse (key `osvaldo`) | USA→REG, 60/150 | minimizador ("não precisa"); `noFollowup` (dispensado = morre sozinho); extras **locked** `filho_peixoto` (876, desbloqueado pelo link `osvaldo_nome × doc:peixoto_pai` 893) → `unlocks avisar_peixoto` (locked, 885) → `peixoto_avisado_d16`; 14:20 a USA02 pode sumir (rodovia) | âncora |
| d16_garganta (913) | 15:40 | Rodrigo 20, exagerador | amigdalite sem obstrução | ORI | "não engulo nem saliva" × iogurte | comum |
| d16_laje (960) | 16:50 | Josias / Seu Dirceu 51 | trauma grave queda 6 m (coluna+tórax) | USA→REG 45/110 | noteWrong "parece leve"; worsen 50 → guia `queda_laje` | comum (pool grave) |

### Personagens
Biel/Gabriel e Seu Jairo (D? — recibo no quadro; Jairo da geladeira, fio 🌾; endereço ADDR.jairo), Dona Cida (sinal 1 da demência/AVC → D19), Seu Osvaldo Peixoto e Dr. Peixoto ("Carlinhos"; anotação D5), Bené (USA 01), Simone, Henrique/Paula, Zélia (pé diabético, D13), Liam (Pedro do 3º B), Tia Márcia (D9), cônjuge, vizinha Dirce.

### Flags
- Lidas: `peixoto_pai` (D5), `denunciou_henrique`, `mci_sem_obitos`, `key juliana/antonio/jairo/osvaldo`, `pe_ferida`, `pe_ferida_escondida` (D13), `curativo`, `marcia_morreu/viva`, `val d9_davi`, `bombinha`, `promessa_davi` (D15), `lucia_fora`, Laços.
- Gravadas: `zelia_internada_pe`, `sem_costura_hoje` (lida por engine/home.ts), `davi_apanhando`, `davi_conversa_verdade`, `davi_mentira`, `davi_lucia_descobriu`, `cida_conversou_d16`, `cida_sinal1`, `cida_feijao` (lida só no diário do próprio D16), `cida_ligou_d16`, `peixoto_avisado_d16` (lida só no endScene D16), `promessa_cumprida`; conquista `o_menino` (lida em endings.ts).
- **Nunca lidas fora do D16:** `zelia_internada_pe`, `davi_apanhando`, `davi_conversa_verdade`, `davi_mentira`, `davi_lucia_descobriu`, `cida_sinal1` (!), `promessa_cumprida`. (`cida_ligou_d16`/`cida_conversou_d16` só servem à conquista do D20.) O arco "Liam apanhando" não tem continuação (a cena "verdade" promete ida à escola na segunda — o D17 não mostra). A ligação do D19 usa a **entrada de diário** `diario:d16_cida`, não a flag.

### Vaga zero hoje
Nenhuma. Pressão de frota: script `rodovia` tira uma USA (14:20–16:20) logo antes do Osvaldo (14:30); Simone cita a base fechada.

### Discrepância (D16) — dependências que QUEBRAM se o modo sair
- d16.ts:245 `needLink: 'davi_verdade'` → a conversa com o Liam (e as escolhas verdade/mentira/abraço) só existe via links da cena (`inspect.links` 309-313). **Sem o modo, o arco é inacessível** → precisa virar "reparar" (FEEDBACK 58).
- d16.ts:582 `esta_bem` **locked** (Cida, sinal 1 + `cida_feijao`) ← links 593-595 com `unlock:'esta_bem'` e `onFind: set cida_sinal1`. Sem o modo, `cida_sinal1` nunca é gravada (o diário fica na versão mais fraca).
- d16.ts:876/885 `filho_peixoto` e `avisar_peixoto` **locked** ← link 893 (`osvaldo_nome × doc:peixoto_pai`). Sem o modo, `peixoto_avisado_d16` nunca acontece (fala alternativa no endScene).
- d16.ts:518 e 687 `q.confronto_quadro` (confronto pelo quadro de trotes) — depende do modo.
- Links "confirma" com docs: 705-709 (`doc:jairo_end`, `doc:jairo_neto`, `manual:trote_quadro`).
- Demais links só informativos: 521-524, 644-647, 774-777, 821-825, 892-898, 948-951, 990-993.

### Problemas D16
- `cida_sinal1` (gravada aqui) não é lida em nenhum outro arquivo; o fio "sinal 1 → D19" passa só pelo diário.
- Arco "Liam apanhando" (manga comprida D15 → D16) termina sem consequência (FEEDBACK 3/15).
- Liam "3º B": Liam tem ~8–9 anos? (aniversário no D15) — conferir idade em outros dias.
- Médico: Jairo "ronco" = obstrução/rebaixamento — guia correto (não mexer pescoço, lateralizar em bloco se vomitar). Osvaldo sepse ok. Apendicite USB→REG ok. Tião: RC7 comentado (pós-ictal alterado → USB) ok.
- Texto do noturno (Henrique "voz arrastada") quando não denunciado — consistente com o arco do álcool.
- Sem "SAMU"/"192".

---------------------------------------------------------------------------
## DIA 17 — "Água" (segunda-feira, temporal 112 mm) — d17.ts
Manual p.17 (Chuvas: Bombeiros obrigatório em resgate/ilhado/afogamento/desabamento/choque em área alagada). `flood: true` (ruas alagadas no mapa), `simoneAccuracy: 0.5`, goal maxUSA 3. `onStart: doc('boletim_chuva')` (DOCS_EXTRA 21-32: Defesa Civil 06:40, pistas `doc:beira_rio`, `doc:baixada`). Importa D16 para checar `TEM_D16_CIDA` (d17.ts:15).

### Enredo
- **Jornal** (294-312): "Temporal histórico: Rio Aurora transborda". Jairo salvo ("Neto adolescente salva o avô") / perdido; Osvaldo salvo/perdido ("Nunca precisou de ambulância, dizia o filho"); Saúde+ Gestão "frota preparada" (41 pontos de alagamento).
- **Passagem** (313-349): Paula (3 famílias ilhadas) ou Henrique ("O cheiro de menta chega antes dele. Hoje, a outra coisa por baixo chega junto" — álcool explícito). 07:12 Simone chega a pé, aperta a têmpora. Escolha "Simone, mediu a pressão?" → `d17_simone_perguntada` (nunca lida).
- **Timeline** (350-408): 07:00 USB01 FORA até 10:40 (base Vila Esperança alagada); Defesa Civil/Bombeiros; 11:00 e 12:45 Simone piorando; **13:00 `simone_sai`** → `shift.simoneAway=true` ("ligações sem pré-triagem"); 13:45 `peixoto_simone`: se a ficha da Simone ainda está na fila sem atender → desfecho "piorou", `d17_simone_dispensada`, lealSimone −2, Peixoto leva de carro; 15:00 Rose (RH) cobre a TARM até 19h; 15:10 mensagem da Simone (USA "Vieram me buscar de USA... tinha criança na água", USB "Você fez certinho... Não deixa a Rose triar dor no peito", ou "O Peixoto dirige muito mal"); 17:00 rio baixa; 18:40 Bené.
- **Casa** `casaD17` (37-247): goteiras. Variações: família fora (Rio Claro; telefone com cônjuge: 3 escolhas, todas dizem "a gente volta amanhã"), casa quieta, ou casa cheia de baldes. Inspect (69-92): `goteira`, `balde`, `desenhos` (Liam), `meia_mancha` (Zélia). Links → unlocks `goteira_nogueira`, `desenhos_molhados`, `zelia_meia`.
  - Nogueira (aluguel atrasado `bills.rentOverdue`; tom muda com `brigou_nogueira` D2/D11): "Reformei o telhado no ano passado" ({{telhado_novo}}). Escolha **`needLink:'goteira_nogueira'`** (d17.ts:161) → abate R$50 do `rentDebt`, `nogueira_abateu`.
  - Rosângela (key `rosangela` salva D? + `maquina` + cônjuge presente): vira ajudante do ateliê e reconhece a voz ("pedi uma pizza de calabresa" — ligação disfarçada de violência doméstica) → `rosangela_ajudante`; se cônjuge fora → bilhete `rosangela_bilhete`.
  - Fim: "Ver os desenhos" **`needLink:'desenhos_molhados'`** (95, Laços+1); "Mãe, a sua meia..." **`needLink:'zelia_meia'`** (99; reduz risk da Zélia se `pe_ferida`, Laços+1); subir no telhado (desgaste +3); dormir.
- `bicoD17` (249-282): lona azul; bilhetes (Nogueira abateu 50 automaticamente se cônjuge presente; Rosângela contratada; Zélia "Eles voltam amanhã... perguntou se você tava em casa. Eu disse que não").
- Conta `lona` R$25 → `telhado_lona` (nunca lida); não pagar → Laços −1 se Liam presente.

### Ligações
| id | hora | quem | verdade | certo | armadilhas | tipo |
|---|---|---|---|---|---|---|
| d17_telhado (411) | 07:10 | Leandro / Seu Sebastião 71 | IAM em ilhado | USA + BOMB → REG | noteWrong "ninguém ferido"; sem Bombeiros = unsafe; bateria 6% (extra poupar → `d17_telhado_bateria`, nunca lida); worsen 95 | comum (pool grave,cardio) |
| d17_cida (475) ★ | 08:15 | Dona Cida | casa alagando, sem lesão (sinal 2: repete frase) | ORI ou USB + BOMB | extra `repetiu` **locked** (531) ← link agua1×agua2 (551-557 `unlock:'repetiu'`); link `nome_novela × diario:d16_cida` (560-569) → `cida_sinal2`+`cida_sinais_cruzados`; extra luz → `d17_cida_luz`; onStamp BOMB → `d17_cida_bombeiros` | âncora |
| d17_crianca (590) | 09:10 | Fábio (tio) / Luan 7 | PCR por afogamento | USA + BOMB → REG, 30/75 (+28 guia) | noteWrong "já tiraram, tá bem"; guia rcp; `[validar]` 629-631 (ventilação primeiro em criança afogada) | comum |
| d17_choque (647) | 10:25 | Rosana / Edinho 42 | PCR por choque em área alagada | USA + BOMB → REG | noteWrong "choque leve"; extra chave geral; worsen 15 → "não respira"; guia `agua` | comum |
| d17_vidro (711) | 11:35 | Cleide 38, exageradora | corte profundo no pé, sangramento controlado | USB → UPA | "tá jorrando" × toalha | comum |
| d17_simone (763) ★ | 13:00 | **Simone (TARM)** 51 | crise hipertensiva sintomática sem déficit (PA 22×13) | USB → UPA; `must:['fast']` | ela recusa USA; `raw`; `special:'simone'` (pulado na campanha da Simone); `noFollowup`; onStamp USB → `d17_simone_usb`+`simone_crise_ok` (+2), USA → `d17_simone_usa`+`simone_crise_ok` (+1), outro → `d17_simone_dispensada` (−2); extra Wesley (se `wesley_atendido`/`simone_wesley_conversa`, D7/D8) | âncora |
| d17_trote (887) | 13:25 | voz calma | trote "ônibus no rio" | TROTE | `passei_carro × doc:beira_rio` (Beira-Rio interditada); sem barulho de chuva; número inexistente | comum (sem pré-triagem) |
| d17_insulina (929) | 14:10 | Dona Nair / Seu Hélio 68 (D9) | hiperglicemia 420 sem gravidade | USB → UPA | link `ja_ligou × diario:d09_helio` | comum |
| d17_muro (981) | 15:40 | Seu Joel / Seu Josué 61 | preso em desabamento com choque hemorrágico | USA + BOMB → REG | noteWrong "tá bem, conversando"; guia hemorragia | comum |
| d17_enxurrada (1045) | 17:20 | Patrícia / Miguel 4 | engoliu água, sem afogamento | ORI | `[validar]` 1086-1088 (deveria ir à UPA?) | comum |

### Personagens
Simone (crise; "demissão no fim do mês"; Wesley, D7/D8), Rose (RH), Peixoto, Bené, Joana (USB 01), Paula/Henrique, Dona Cida (sinal 2), Seu Hélio e Dona Nair (D9), Seu Nogueira (senhorio, D2/D11), Rosângela (D? — "pizza de calabresa", ajudante do ateliê, fio D18), cônjuge/Liam (fora D13–D17, voltam no D18), Zélia, cachorro "Pirata" (Rio Claro).

### Flags
- Lidas: `denunciou_henrique`, `key jairo/osvaldo/rosangela`, `lucia_fora/foi_embora`, `maquina`, `rosangela_ajudante`, `brigou_nogueira`, `pe_ferida`, `wesley_atendido`, `simone_wesley_conversa`, `d17_simone_dispensada/usa` (na própria timeline), `simone_crise_ok`.
- Gravadas: `d17_simone_perguntada`, `d17_telhado_bateria`, `d17_cida_luz`, `cida_sinal2`, `cida_conversou_d17`, `cida_sinais_cruzados`, `cida_ligou_d17`, `d17_cida_bombeiros` (→D18), `d17_choque_chave`, `d17_simone_usb/usa/dispensada` (→D18), `simone_crise_ok` (→D18–20), `nogueira_abateu`, `rosangela_ajudante` (→D18, home.ts), `rosangela_bilhete`, `telhado_lona`.
- **Nunca lidas:** `d17_simone_perguntada`, `d17_telhado_bateria`, `d17_cida_luz`, `cida_sinal2`, `cida_sinais_cruzados`, `d17_choque_chave`, `d17_simone_usb`, `nogueira_abateu`, `rosangela_bilhete`, `telhado_lona`. Observação: a campanha da Simone usa flags próprias (`sd16_cida_sinal`, `sd17_cida_sinal` em src/content/simone/days14_20.ts:339/522/942); na campanha principal os "sinais da Cida" só valem pelo diário.

### Vaga zero hoje
Nenhuma. Pressão: USB01 fora até 10:40, ruas alagadas, Bombeiros obrigatórios, TARM ausente 13:00–15:00, Rose depois.

### Discrepância (D17) — dependências
- d17.ts:531 `repetiu` **locked** ← link 551-557 (agua1×agua2). Sem o modo, `cida_sinal2` só sai se achar o link 560-569 (que também é do modo) → **a pista nunca acontece**.
- d17.ts:161 `needLink:'goteira_nogueira'`, :95 `needLink:'desenhos_molhados'`, :99 `needLink:'zelia_meia'` — escolhas de casa só aparecem via inspect/links (73-92). Precisam virar "reparar" (FEEDBACK 58).
- Links com docs/diário: 918 (`doc:beira_rio`), 969 (`diario:d09_helio`), 564 (`diario:d16_cida`).
- Demais links informativos: 455-459, 621-625, 689-693, 750-753, 834-852, 917-922, 968-973, 1024-1028, 1084.

### Problemas D17
- Médico: Simone com PA 22×13 + cefaleia + visão turva + "pontinhos brilhando" (escotomas) é tratada como urgência (USB→UPA). Sintoma visual com PA muito alta pode ser lesão de órgão-alvo (emergência hipertensiva/encefalopatia) — vale conferir em docs/fontes. O texto do link diz "sem déficit... urgência, não emergência".
- Afogamento infantil com guia só de compressões (`[validar]` 629) e Miguel (`[validar]` 1086).
- Henrique bebendo no plantão (D17 passagem) — coerente com o arco; no D16 a Zélia pode ser regulada por ele "com voz arrastada".
- Simone diz "Eu te ensinei o quadro, você me ensinou o manual" — ok.
- Sem "SAMU"/"192".

---------------------------------------------------------------------------
## DIA 18 — "Escândalo" (terça-feira, 24 °C) — d18.ts
A matéria da Carla Nunes sai. goal maxUSA 3. DOCS_EXTRA (20-49): `ramais_central` (pista `doc:ramal_coord` (17) 3321-4720 = NUM.peixoto; `doc:ramal_regional`; lista 193/190/199) e `materia_carla` ("QUANTO VALE UMA AMBULÂNCIA": Tiago Nunes, 26, 2019, 40 min na Av. Brasil; parágrafos por fonte; envelope cita o protagonista; Saúde+ Gestão em nome de Mauro Teixeira, cunhado do vereador Arlindo Matos; pista `doc:materia_tiago`).

### onStart (d18.ts:318-356) — cálculo da matéria ANTES do jornal
- Volta da família: se `lucia_fora && !lucia_foi_embora` → cônjuge e Liam `bem`, `away=false`, `unset lucia_fora`, `set lucia_voltou`.
- Fontes (`e.source`): `voce` se `val depoimento==='aceitou'`; `lucia` se `lucia_fonte` (D14); `bene` se `intimBene ≥ 5` (+ `bene_fonte`); `peixoto` se `key osvaldo==='salvo'`.
- `materia_publicada`; `materia_fontes = n`; **`materia_forte` se n ≥ 2**; **`peixoto_caiu` se n ≥ 2 e (voce ou peixoto)**; `reforco_frota` se depoimento aceito; `peixoto_endureceu` se Osvaldo perdido; `envelope_aceito` → integridade −3 + `nome_na_materia`.
- `henrique_piorando` se `encobriu_henrique` ou `omitiu_henrique` (motor usa nas ligações deixadas ao noturno, shift.ts).
- **Game over "sindicância por fraude de ficha"**: `encobriu_henrique && mentiu_9B` → `gameover_motivo='fraude_ficha'`, `gameover='sindicancia'` (lido em game.ts:246-250 logo após o onStart).

### Enredo
- **Jornal** (357-397): manchete por fonte dominante (forte+peixoto "Planilha interna..."; forte+voce "'A meta decide quem recebe ambulância'"; forte+bene "condutor quebra o silêncio"; forte "Salários atrasados..."; fraca "Família acusa demora; OS diz que 'nenhum paciente deixou de ser atendido'"). Matérias: envelope ("{tit} {nome} Moura... R$ 1.000"), Tiago, Bené ("Não tinha viatura. Tinha meta."), planilha ("menos de 4 USA por plantão"), ordem verbal (com `ordem_peixoto_registrada` D9/D14: "USA 01 só sai pra parada"), Lúcia ("A gente vive de bico"), dona da OS. Aviso: Câmara convoca a coordenação para sexta.
- **Passagem** (398-436): Paula (jornal de SP ligou) ou Henrique ("ele ri sozinho, alto demais"). Simone conforme D17: `d17_simone_usa` ("Não faz mais isso"), `simone_crise_ok` ("Obrigada por ontem. USB, sentada"), `d17_simone_dispensada` (fria até as 9). Envelope: "Na página três, o seu nome". Escolha "o que achou da matéria" (forte: "chorei no ônibus"; fraca: "página sete, do lado do horóscopo").
- **Timeline** (437-494): 07:05 pedido **Bené revela que era o condutor de 2019** (texto varia com intimBene ≥ 5); opções obrigado (+intimBene) / "Você lembra do Tiago?" (+humanidade; "Ninguém tinha ensinado nada pra ela no telefone") / silêncio. 07:40 Peixoto: se fonte → "a planilha... alguém entregou. Meu pai tá em casa, comendo goiabada"; se Osvaldo perdido → "Vou dar o nome de quem errou... Cuidado onde pisa"; se caiu → diretoria às 10; senão "Matéria fraca... meta normal". 10:30 rádio AM (vereador nega; "a mãe, Dona Odete, defende a Regulação"). 12:00 Simone: corte de TARM do dia 31 congelado (forte) ou lista pronta. 16:45 `peixoto_teste_fim`: se mandou USA/USB para a ligação-teste → Osvaldo perdido: `peixoto_culpou` + desgaste 5 ("com o seu nome"); senão "dentro do protocolo, fica entre nós". 18:40 Bené.
- **Pré-casa** `chegadaD18` (54-120): se `lucia_voltou` → mala azul "COZINHA"; Liam e o Pirata; se `lucia_fora_apoiada` (D12) → "A Têxtil quer me efetivar... Facção" → escolhas `lucia_faccao` (aceitar facção / "a gente se muda") ou abraço; senão abraço/mala/desculpa. Sem volta → Diego da casa 88 lendo a Gazeta.
- **Casa** `casaD18` (122-282): Gazeta circulada. Falas por fonte/envelope/Laços; Liam "na escola falaram que você pegou dinheiro do vereador". Escolhas: confessar (integridade +1) / negar (Laços −1) / "Fui eu, o regulador anônimo" / **"Mostrar o envelope" `needLink:'achou_envelope'`** (d18.ts:157; inspect 269-280: objetos `envelope` na caixa de costura e `carta` conta de luz paga em dinheiro; links `dou_conta×envelope`, `carta×envelope` → `unlock achou_envelope`) / jantar. Se `env` e não confrontado → `davi_acha` (Liam acha o dinheiro, Laços −1). Envelope: devolver R$700 (`envelope_devolvido`, integridade +1, "os outros 300 eu fico devendo") / ficar (+R$700, integridade −2, `envelope_usado`) / "Por que não me contou?". Rosângela (se ainda não ajudante) → bilhete "{c:A senhora é casada|...} com a voz do telefone" → `rosangela_ajudante`.
- `bicoD18` (284-309): maqueiro pergunta "é verdade aquilo"; envelope devolvido sozinho se Laços ≥ 5, senão `envelope_usado` ("um envelope que você nunca vai ver").

### Ligações
| id | hora | quem | verdade | certo | armadilhas | tipo |
|---|---|---|---|---|---|---|
| d18_desabafo (497) ★ | 07:10 | filha do Seu Nestor Gonçalves (morreu em 2022 após 55 min) | desabafo | TROTE (prankKind `desabafo`, encerrar com respeito) | extras ouvir/nome do pai (+humanidade) | âncora |
| d18_cida (561) ★ | 08:05 | Dona Cida | ligou para saber de você | ORI (azul) | "Eu conheço a sua voz" (se envelope); extra enchente (lê `d17_cida_bombeiros`); onAnswer humanidade+1 | âncora |
| d18_aorta (631) | 09:00 | Cláudia / Roberto 55 | dissecção de aorta | USA → REG | noteWrong "carregou peso"; PA 21×12 vs 15×9 nos braços | comum |
| d18_punho (689) | 10:00 | Bianca (neta) / Celina 84 | fratura de punho | USB → UPA | noteWrong "bateu a cabeça" | comum |
| d18_trote (730) | 11:00 | adolescente "vamos ver se demoram 50 min" | trote inspirado na matéria | TROTE | | comum |
| d18_bebe (766) | 12:10 | Raíssa / Heitor 3 m | infecção grave/meningite | USA → REG 50/120 | "é dente" | comum |
| d18_colica (819) | 13:15 | Vinícius 29 exagerador | cólica renal | USB → UPA | noteWrong "infarto?" | comum |
| d18_peixoto_teste (864) ★ | 14:20 | Peixoto disfarçado (NUM.peixoto; endereço do pai, apto 41) | ligação-teste da OS | TROTE (prankKind `teste`) | jargão médico; rádio da central ao fundo; extra **`desmascarar` locked** (899-919) ← links 923-925 (`num×doc:ramal_coord`, `retorno_peixoto×num`, `radio_fundo×sozinho`) com `onFind: set peixoto_desmascarado`; mandar viatura com Osvaldo perdido → `peixoto_culpou` | âncora (`type: 'disfarcado'`) |
| d18_odete (934) ★ | 15:30 | Vereador Arlindo / Dona Odete 82 | IAM atípico (inferior) | USA → REG | "azia", "colchão velho"; desta vez ela minimiza; onResolve → `odete_morreu`/`odete_salva` | âncora |
| d18_moto (1005) | 17:00 | motorista / Jonathan 26 | fratura exposta de fêmur com choque | USA → REG | noteWrong "parece leve"; guia hemorragia | comum |

### Personagens
Carla Nunes (repórter; irmão Tiago, 2019), Bené (condutor de 2019 — revelação), Peixoto (cai/endurece/testa), Seu Osvaldo, Vereador Arlindo Matos e Dona Odete (D7/D8 — VIP), Mauro Teixeira (cunhado, dono da OS), Simone, Rose (RH), Paula/Henrique, Dona Cida, Diego (casa 88), Rosângela, cônjuge/Liam (voltam), Zélia ("Seu pai era pedreiro... morreu devendo"), Seu Nestor Gonçalves (2022).

### Flags
- Lidas: `lucia_fora/foi_embora`, `lucia_fora_apoiada` (D12), `val depoimento` (D14?), `lucia_fonte` (D14), intimBene, `key osvaldo/rosangela`, `envelope_aceito`/`envelope_lucia` (D7/D8), `envelope_devolvido/usado`, `encobriu_henrique`, `omitiu_henrique`, `mentiu_9B` (D9/D12), `ordem_peixoto_registrada` (D9/D14), `denunciou_henrique`, `d17_simone_usa/dispensada`, `simone_crise_ok`, `d17_cida_bombeiros`, `maquina`, `rosangela_ajudante`, `materia_forte`, `peixoto_caiu`, Laços.
- Gravadas: `lucia_voltou`, `lucia_faccao`, `bene_fonte`, `materia_publicada` (→endings), `materia_fontes`, `materia_forte` (→D19/20, Simone), `peixoto_caiu` (→D19/20, engine/endings), `reforco_frota` (→base.ts frota, D19), `peixoto_endureceu`, `nome_na_materia`, `henrique_piorando` (→shift.ts), `gameover_motivo/gameover`, `envelope_devolvido`, `envelope_usado`, `rosangela_ajudante`, `peixoto_culpou`, `peixoto_desmascarado`, `odete_morreu/odete_salva` (→D19/D20), `cida_conversou_d18`, `cida_ligou_d18`.
- **Nunca lidas fora do D18:** `lucia_voltou` (só D18), `lucia_faccao`, `bene_fonte`, `materia_fontes`, `peixoto_endureceu`, `nome_na_materia`, `envelope_devolvido`/`envelope_usado` (só dentro do D18 — o FEEDBACK 7 pede que o dinheiro mude falas), `peixoto_culpou` (desgaste aplicado, mas o "nome no relatório da auditoria" não volta), `peixoto_desmascarado`. (`cida_ligou_d18`/`cida_conversou_d18` → só conquista do D20.)

### Vaga zero hoje
Nenhuma.

### Discrepância (D18) — dependências
- d18.ts:157 `needLink:'achou_envelope'` (casa) ← inspect 269-280. Sem o modo, o confronto do envelope só acontece pelo caminho "Jantar e não falar" → `davi_acha` (se `env`).
- d18.ts:902 `desmascarar` **locked** (confronto com o Peixoto) ← links 923-925. Sem o modo, nunca dá para desmascarar (a resposta certa TROTE continua possível pelos outros sinais).
- Links "confirma" com docs: 552 (`doc:materia_tiago`), 553/624 (`manual:azul`), 923 (`doc:ramal_coord`).
- Informativos: 668-674, 720-723, 756-760, 798-804, 851-854, 926, 979-984, 1033-1037.

### Problemas D18
- **Contradição Osvaldo**: jornal do D17 diz que ele "segue internado no Regional"; no D18 07:40 o Peixoto diz "Meu pai tá em casa, comendo goiabada escondido da cuidadora" (alta de pneumonia com sepse aos 84 anos em ~3 dias); e o rádio da ligação-teste diz "o 41 tá vazio desde a semana passada" (d18.ts:930) — se Osvaldo está em casa, o 41 não está vazio. Ajustar textos.
- `d18_cida` extra 'davi' (606-608): "O Liam? Tá pra voltar" com `when: lucia_voltou` — no onStart do mesmo dia eles já voltaram; aceitável (chegam à noite), mas a Zélia "me contou" pode soar estranho.
- O nome do protagonista na matéria aparece como "{tit} {nome} Moura" no jornal (381) e `protagonistName(c.g)` no documento (41) — conferir com a renomeação (FEEDBACK 10/11).
- Médico: dissecção (diferença de PA entre braços), meningite em lactente, IAM atípico em idosa diabética — corretos. Cólica renal USB ok.
- "SAMU"/"192": nada. Ramais citam 193/190/199 (ok).

---------------------------------------------------------------------------
## DIA 19 — "Dona Cida" (quinta-feira, 27 °C, céu limpo) — d19.ts
Manual p.19: Regional sem vaga → "vaga zero". **`noVacancy: true`** (d19.ts:270). Sem `goal`. `onStart`: docs `postit_cida` e `ramais_central`. Importa D16 (`TEM_D16_CIDA`). Exporta GUIDES_EXTRA `asma_crianca` (24-69) e `avc_cida` (72-117).
(Calendário: o jogo pula dias — D12 domingo → D13 terça, D14 quarta → D15 sexta, D18 terça → D19 quinta. Não é erro.)

### Enredo
- **Jornal** (272-296): "Regional opera com 160% da capacidade". Matérias: `peixoto_caiu` → coordenador afastado (se fonte `peixoto`: "Eu assinei as metas. Vou explicar quem escreveu"); `reforco_frota` → "USA 03 volta às ruas"; `odete_salva` ("Os mesmos que eu ataquei") / `odete_morreu`; sem `materia_forte` → "OS processa a Gazeta"; 312 desalojados.
- **Passagem** (297-341): Paula ("Noite de vaga zero... chama pelo nome, Marcelo") ou Henrique bêbado ("A voz dele arrasta nas vogais... Fala enrolada tem mais de um motivo" — eco com a Cida). Escolhas com Henrique: "você bebeu?" (com `encobriu_henrique`: "Você assinou embaixo, lembra?"), "vai pra casa dormir", "você tá bem?" (só se `henrique_perguntado`, D9/D12). Simone: 13×8 se `simone_crise_ok`; Peixoto saiu com caixa de papelão se `peixoto_caiu`.
- **Timeline** (342-357): 07:01 USA 03 (Zé Carlos) volta se `reforco_frota`; 07:02 Regional 160% ("Vaga zero só por contato direto do regulador"); 09:30 coordenação interina ("metas suspensas... anote tudo") / Peixoto-fonte ("Manda as que precisar") / Peixoto ("Negocia ou desvia"); 11:50 Simone: "A Dona Cida não ligou hoje de manhã... Da outra vez era a comadre"; 15:00 Bené: amanhã é o último (31 anos, bolo de fubá) — **aposentadoria do Bené no D20**.
- **Casa** `vesperaD19` (123-205): jantar conforme `bills.foodMissed`; Zélia morta (cadeira); `lucia_foi_embora` (duas cadeiras vazias); "Amanhã é o último plantão do contrato. Vinte dias."; Liam prepara desenho secreto para amanhã. Escolhas: contar da Cida (viva: Zélia é do grupo da igreja da Cida — "tinha um doutor na central que perguntava da novela de volta. Era você?"; morta: "Ela não morreu sozinha. Ela tava ligando pra alguém"), agradecer (Laços+1), **prometer chegar cedo (`prometeu_cedo` → D20)**, silêncio.
- `bicoD19` (207-222): USA 01 com o Márcio; desenho "SÓ PODE VER AMANHÃ".

### Ligações
| id | hora | quem | verdade | certo | armadilhas | tipo |
|---|---|---|---|---|---|---|
| d19_infarto (360) | 07:10 | Dona Zilda / Geraldo 74 | IAM | USA → REG + **vaga zero** (guia `vagazero` se dest REG) | noteWrong "azia"; onResolve: guia vagazero concluída com sucesso → `vaga_zero_negociada` + conquista `vaga_zero` | comum (pool grave,cardio) |
| d19_marimbondo (416) | 08:05 | Sandra / Lucas 17 | reação local | ORI | noteWrong "igual a da professora!"; link `diario:d09_marcia` | comum |
| d19_escada (470) | 09:00 | Toninho / Cícero 52 | fratura de clavícula | USB → UPA | noteWrong "parece grave" | comum |
| d19_parto (515) | 10:00 | Kelly / Jaqueline 31 (3º filho) | TP ativo | USB (best)/USA → MAT | worsen 80 → guia parto | comum |
| d19_trote (560) | 11:05 | jovem "desmaiado no shopping" | trote | TROTE | fundo silencioso com videogame | comum |
| d19_asma (597) | 12:40 | Dona Rita / Ana Clara 6 | asma grave, tórax silencioso | USA → REG 50/120 | "parou de chiar, melhorou"; noteWrong "melhorando"; link `diario:d09_casa` (Liam D9; texto muda com `bombinha`); guia asma_crianca | comum |
| d19_dente (657) | 14:10 | Reginaldo 34 (D1) | odontalgia sem sinal grave | ORI (best)/USB | link `diario:d01_dente` | comum |
| d19_onibus (708) | 16:05 | Seu Juvenal / Valter 54 | hipoglicemia grave | USA (best)/USB → REG | noteWrong "motorista bêbado"; FAST ok mas fala enrolada; extra açúcar → `d19_onibus_acucar` (muda rádio) | comum |
| d19_cida (775) ★ | 18:30 | **Dona Cida** | **AVC na janela** (key `cida`) | USA (best)/USB → REG, 60/140; vaga zero | fala arrastada (estilo `arrastada`); "Só queria ouvir uma voz"; nota muda se lealSimone ≥ 7; extras novela (`sem_novela`), porta/chave (`d19_cida_chave`), **`reconhecer` locked** (818-827 → `cida_reconhecida` + humanidade), ficar na linha (`cida_conversou_d19`); worsen 40 (telefone cai); `noFollowup`; guia `avc_cida`; diário later D20 ("acordou na UTI e perguntou do gato") | âncora |

### Personagens
Dona Cida (desfecho do arco: D15 costas → D16 sinal 1 → D17 sinal 2 → D18 pergunta de você → D19 AVC), Zélia (amiga da Cida no grupo da igreja), Henrique (bêbado), Paula, Simone, Bené (último dia amanhã), Márcio (USA 01), Zé Carlos (USA 03), Peixoto/coordenação interina, Marcelo (plantonista do Regional, citado), Reginaldo (D1), Liam (D9), Tia Márcia (D9), Seu Hélio (D9, citado).

### Flags
- Lidas: `peixoto_caiu`, sources.peixoto, `reforco_frota`, `odete_salva/morreu`, `materia_forte`, `denunciou_henrique`, `encobriu_henrique`, `henrique_perguntado`, `simone_crise_ok`, `bombinha`, lealSimone, `key cida`, `lucia_foi_embora`, Laços, `bills.foodMissed`.
- Gravadas: `prometeu_cedo` (→D20), `d19_cida_chave` (só rádio), `cida_reconhecida` (→D20), `cida_conversou_d19`, `cida_ligou_d19`, `vaga_zero_negociada` (→D20; também setada pelo motor shift.ts:1723 ao escolher "vagazero" no pedido de rádio), `d19_onibus_acucar` (só rádio); conquista `vaga_zero`; key `cida`.
- `cida_ligou_dNN`/`cida_conversou_dNN` (15–19) só são lidas pelo laço dinâmico da conquista "Ela Só Queria Conversar" (d20.ts:264-271: ligou ≥ 3 dias e conversou em todos). `d19_cida_chave` e `d19_onibus_acucar` só mudam o texto do rádio.

### Vaga zero hoje (como funciona na 1.0.4)
1. `noVacancy: true` → em `ShiftSim.onHospital` (shift.ts:1555-1600) toda viatura que chega ao Regional sem `vagaZero` fica retida +60 min e abre pedido de rádio `kind:'vaga'` ("Sem vaga, sem maca"): opções "Ligar e negociar vaga zero (10 min)" / "Desviar para a UPA Norte" / "Aguardar" (padrão aguardar, timeout 8). Escolher vagazero seta `vaga_zero_negociada` (shift.ts:1718-1723).
2. Na ligação d19_infarto existe ainda o roteiro de diálogo `vagazero` (src/content/guides.ts:635) aberto ao carimbar com destino REG; se concluído com sucesso → `vagaZero=true` na chamada, `vaga_zero_negociada`, conquista.
3. Manual/aviso do jornal: "negocie a vaga zero por telefone". Paula dá a dica do nome do plantonista (Marcelo) — não tem efeito mecânico.
Não há negociação com argumentos nem Peixoto como escalonamento (pedidos 27–32 do FEEDBACK).

### Discrepância (D19) — dependências
- d19.ts:822 `reconhecer` **locked** ← `linksCida` (225-263): `fala_arrastada × diario:d17_cida`, `fala_arrastada × doc:cida` (post-it "só conversa"), `sem_novela × novela_tv`, e (se D16 existe) `fala_arrastada × diario:d16_cida`, `sem_novela × diario:d16_cida` — todos com `unlock:'reconhecer'`. **Sem o modo, `cida_reconhecida` nunca é gravada** → o D20 perde a variante "ela disse que você reconheceu a voz" e o diário a frase "Reconheci a voz". Precisa de gatilho novo (ex.: perguntar da novela → `sem_novela` libera "reconhecer").
- Links com diário: 462 (`diario:d09_marcia`), 634 (`diario:d09_casa`), 691 (`diario:d01_dente`); 391 (`manual:vaga_zero`), 246 (`manual:janela`).
- Informativos: 389-392, 460-463, 505-508, 544-547, 587-591, 629-640, 690-693, 751-755.

### Problemas D19
- O cabeçalho (d19.ts:3-5) diz que o reconhecimento depende de ligar a fala arrastada ao diário/post-it — mecânica do modo que sai.
- Henrique "tem mais de um motivo... Você sabe qual é o dele" (303) — bom eco; nenhuma escolha aqui altera o destino dele.
- Médico: Cida com AVC aceita USB (RC1/RM8 citados, comentário 843-845) — coerente com fontes. Hipoglicemia aceita USB. Ana Clara ok. Parto: Malinas ~7 (comentário 550).
- Sobrenome "Valter Nogueira" (motorista) colide com o senhorio Seu Nogueira; "Lucas Teixeira" com "Mauro Teixeira" (dono da OS) — só cosmético.
- Sem "SAMU"/"192".

---------------------------------------------------------------------------
## DIA 20 — "Último Plantão" (sexta-feira, 26 °C, sol de outono) — d20.ts
**Sem interlúdio** (vai direto ao final depois do relatório). `noVacancy: true`. DOCS_EXTRA `escala_noturno` (19-29; muda se `denunciou_henrique`; pista `doc:henrique_end` = Rua XV de Novembro, 1950, ap. 302, Ed. Aurora). GUIDES_EXTRA `prolapso` (35-76) e `intox_remedio` (79-119).
`onStart` (259-272): docs `escala_noturno` e `ramais_central`; conquista `vaga_zero` se `vaga_zero_negociada`; conquista **"Ela Só Queria Conversar"**: laço d=1..19 sobre `cida_ligou_d${d}` e `cida_conversou_d${d}` (ligou ≥ 3 dias e conversou em todos).

### Enredo
- **Jornal** (273-310): manchete pela Cida — salva + `cida_reconhecida` → "Regulador reconhece AVC pela voz de idosa que ligava todo dia"; salva → "Idosa... salva pela Regulação"; perdida → "Idosa morre sozinha... TV ligada na novela... telefone fora do gancho"; nenhuma → Regional sem vaga. Matérias: "Seu Bené se aposenta hoje"; Peixoto vai depor (fonte) ou comissão na Câmara (`peixoto_caiu`); vereador "mais ambulâncias" (`odete_salva`); corte de TARM do dia 31 suspenso (`materia_forte`) ou confirmado.
- **Passagem** (311-375): Henrique não denunciado → sentado na sua cadeira, "Me renovaram. Foi o dia mais feliz da minha vida... Depois ficou comprido... Hoje à noite eu volto. Eu sempre volto." Esquece a bala de menta no teclado. Escolhas: "Procura ajuda. Hoje." ("Amanhã eu procuro" = "deve ser o feijão"), "Até a noite", "Eu devia ter denunciado você" (só `encobriu_henrique`: "Mas aí quem ia te render às sete?"), "você tá bem?" (só `henrique_perguntado`: "Não, {nome}. Não tô."). Denunciado → Paula: recado do Henrique da clínica "Diz que hoje é o dia doze" (12 dias de sobriedade; bate com a denúncia no D12, domingo → D20 sexta = 12 dias). Simone: bolo de fubá pro Bené.
- **Timeline** (377-488): 07:01 Bené (31 anos, 4 meses e 11 dias); 07:02 Regional sem leito; 10:40 vaquinha do bolo (R$10 → intimBene +1, `vaquinha_bene`); 13:00 Bené última marmita ("micro-ondas novo da OS. Que ironia"); 15:30 coordenação: Peixoto-fonte pediu exoneração e vai depor ("Meu pai mandou perguntar se você gosta de goiabada") / interina ("seus relatórios estão impecáveis") / Peixoto com pai morto ("Eu ainda não assinei. Ainda.") / Peixoto ("Depende do relatório de hoje"); **18:50 script `noturno`**: estende o fim do turno para 19:25 (reordena o evento `endShift` em `shift.pending`); Paula presa na rodovia (denunciado) ou Simone "o Henrique não atende o celular"; **18:56 `ultima_corrida`**: libera a USA 01 se RETIDO/PANE/FORA (e limpa pedidos dela) ou, se ocupada e sem USA livre, libera outra USA retida; **18:59 `bene_corrida`**: quando a ligação final é decidida com a USA01, rádio do Bené ("É o Henrique, né?" / "Av. Brasil, 2650... seu primeiro dia"); reagenda a cada 2 min até 19:45.
- **Cena final do turno** `fimD20` (125-239, `endScene`): hora ≥ 19:25. Desfecho: Henrique salvo ("intubado, com pulso... 'intoxicação alcoólica, PCR revertida'. Agora está escrito. Ninguém vai conseguir encobrir.") / morto (crachá no chão do 302, foto sorrindo); Seu Dito salvo/morto ("Às vezes se faz tudo certo"). onEnter: `henrique_sobreviveu`/`henrique_morreu` (se não denunciado), `bene_ultima` se USA01, **`simone_demitida` se !(lealSimone ≥ 6 && materia_publicada)**. Bené no rádio (última foi com você / não deu; intimBene ≥ 7 fala seu nome e churrasco; ≥ 3 "foi bom"; vaquinha; "USA 01, Benedito. QRT."). Noturno: **Dr. Castro "da USA 01, ainda de macacão"** senta no noturno ("Ele vai ficar internado um tempo. Depois, tratamento. Dessa vez está escrito.") ou Paula chega correndo. Post-it da Simone por lealdade (≥8 "Foi uma honra ouvir você trabalhar"; 5–7 "Até segunda. Ou não."; <5 "Seu café ficou na minha mesa"), P.S. fica/supervisão ou "Dia 31 é o meu último dia", P.P.S. remédio (`simone_crise_ok`), bala de menta do Henrique. Fim: `prometeu_cedo` → "Já são quase oito" (promessa quebrada pelo atraso do noturno — sem consequência mecânica).

### Ligações
| id | hora | quem | verdade | certo | armadilhas | tipo |
|---|---|---|---|---|---|---|
| d20_antonio (491) ★ | 07:15 | Seu Antônio (D3), se `key antonio==='salvo'` | agradecimento | ORI (azul) | extra conversar (`conversaAntonio` 242-251: lê `antonio_parou` D3/D4, `key juliana`, `juliana_cliente`, `lucia_foi_embora`); onAnswer `antonio_agradeceu` + humanidade | âncora |
| d20_viuva (540) ★ | 07:15 | Dona Rosa (viúva), se Antônio não salvo | ligação da viúva | ORI (azul) | "Eu li a matéria... do outro lado do telefone tem gente"; Juliana salva/perdida ("perdi os dois no mesmo mês"); `viuva_antonio_ligou` | âncora |
| d20_faca (599) | 08:10 | Seu Zé (bar) | facada abdominal com choque | USA + PM → REG | agressor armado → unsafe; guia hemorragia | comum |
| d20_trote (658) | 09:10 | "sargento Oliveira" | trote sofisticado | TROTE | jargão "QSL, QAP, positivo e operante"; sirene em loop; caixa postal "Rafa" | comum |
| d20_cordao (706) | 10:10 | Anderson / Débora 24 | prolapso de cordão | USA → MAT | guia prolapso (genupeitoral); radio dest se hospital errado | comum |
| d20_intox (754) | 11:15 | Renata / Gustavo 2a | intoxicação por BZD de adulto | USA → REG | noteWrong "bala"; guia intox_remedio | comum |
| d20_dengue (802) | 12:30 | Vagner 41, minimizador | dengue com sinais de alarme | USB → UPA | | comum |
| d20_feijao (840) | 13:40 | Aline / Maria Luísa 4 | corpo estranho nasal | ORI (UPA por meios próprios) | noteWrong "engasgada!" | comum |
| d20_queda (886) ⚖ | 14:50 | Marli / Arnaldo 81 | TCE leve em anticoagulado | USB (best)/USA → REG; `must: historico, vomito` | `[validar]` 927-929 (Glasgow 14 → USA preferida?) | comum |
| d20_trote2 (938) | 16:10 | criança | trote infantil ("gato virou morcego", Rua Plutão) | TROTE | | comum |
| d20_edema (972) | 17:15 | Zulmira / Alcides 78 | EAP | USA → REG | noteWrong "gripe" | comum |
| **d20_final (1018) ★** | 18:58 | Dona Iolanda (vizinha do 301) — se Henrique NÃO denunciado | **PCR do Henrique Lacerda, 43** (álcool) | USA → REG, 30/75 (+28 guia RCP) | link `nome_henrique × doc:henrique_end`; garrafa no chão; `nightDeath`; onResolve `henrique_morreu`/`henrique_sobreviveu`; onStamp USA01 → `bene_ultima` | âncora |
| **d20_final_rua (1103) ★** | 18:58 | Wellington (D1) — se Henrique denunciado | PCR do Seu Dito (gari, 61) no semáforo do dia 1 (Av. Brasil, 2650) | USA → REG, 30/75 (+30 guia) | Wellington já massageia (fez curso dos Bombeiros); link `mesmo_lugar × diario:d01_parada`; onResolve `final_rua_obito/salvo` | âncora |

### Personagens
Henrique (fecho do arco), Paula, Dr. Castro (médico da USA 01), Dona Iolanda, Bené (aposentadoria), Simone (último post-it), Peixoto/coordenação interina, Seu Antônio e Dona Rosa (D3), Juliana (D15), Wellington (D1), Seu Dito, Carla (citada).

### Flags
- Lidas: `denunciou_henrique`, `encobriu_henrique`, `henrique_perguntado`, `vaga_zero_negociada`, `cida_ligou_dN`/`cida_conversou_dN`, `key cida/antonio/juliana/osvaldo`, `cida_reconhecida`, sources.peixoto, `peixoto_caiu`, `odete_salva`, `materia_forte`, `materia_publicada`, `antonio_parou`, `juliana_cliente`, `lucia_foi_embora`, lealSimone, intimBene, `vaquinha_bene`, `simone_crise_ok`, `prometeu_cedo`.
- Gravadas: `antonio_agradeceu`, `viuva_antonio_ligou`, `henrique_morreu`, `henrique_sobreviveu`, `bene_ultima`, `simone_demitida`, `final_rua_obito`, `final_rua_salvo`, `vaquinha_bene`.
- **Nunca lidas:** `antonio_agradeceu`, `viuva_antonio_ligou`, **`henrique_sobreviveu`** (o epílogo não olha!), `bene_ultima`, `final_rua_obito`, `final_rua_salvo`.

### Vaga zero hoje
Igual ao D19: `noVacancy` → retenção +60 min e pedido de rádio "vaga" em toda chegada ao Regional; o roteiro de diálogo `vagazero` só existe no d19_infarto. O script `ultima_corrida` (18:56) "fura" a retenção da USA 01 para a última corrida.

### Discrepância (D20)
Nenhum `locked`/`needLink`/`unlock`. Links: d20.ts:533, 589-592, 638-641, 696-700, 734-737, 782-786, 830-833, 879, 922-925, 963-966, 1001-1004, 1061-1065 (`doc:henrique_end`), 1143-1147 (`diario:d01_parada`). Só informativos.

### Problemas D20
- **Epílogo do Henrique contraditório (FEEDBACK 4)**: não denunciado + `d20_final` salvo → a cena final diz "PCR revertida... Agora está escrito... internado... Depois, tratamento", mas o fio `henrique` em endings.ts:147-149 só é "ok" com `denunciou_henrique && !henrique_morreu`; caso contrário, sem `henrique_morreu`, mostra **"O Henrique continua no noturno. A voz dele fica mais lenta a cada mês."** A flag `henrique_sobreviveu` (d20.ts:186, 1077) existe mas nunca é lida. Também `henriqueVoice` no final ruim (endings.ts:5-9) devolve "uma voz arrastada que você conhece bem" para encobriu/omitiu mesmo se ele sobreviveu e foi tratado (e o protagonista está "em outra cidade").
- **Dr. Castro**: se a USA 01 (a equipe do Castro) foi ao 302/Av. Brasil, o médico dela estaria com o paciente, não "ainda de macacão" sentado na central às 19:25 (d20.ts:202-207).
- `fica` da Simone = `lealSimone ≥ 6 && materia_publicada`, mas `materia_publicada` é sempre setada no D18 (d18.ts:337) → na prática só lealdade. Com matéria fraca o jornal do D20 diz "OS confirma corte de técnicas" e mesmo assim a Simone pode "ficar promovida". Talvez devesse ser `materia_forte`.
- `prometeu_cedo` só muda uma linha (o atraso do noturno quebra a promessa sem custo/sem cena em casa — não há interlúdio no D20).
- Seu Antônio e Rosa se referem a "dia três" (meta-linguagem do jogo) — aceitável, mas soa estranho na boca deles.
- Médico: Henrique PCR por intoxicação alcoólica com FV revertida — plausível; edema agudo de pulmão, prolapso de cordão (genupeitoral), intox BZD: corretos. Arnaldo `[validar]`.
- Sem "SAMU"/"192".

---------------------------------------------------------------------------
## FINAIS — src/content/endings.ts (218 linhas) + src/engine/endings.ts (75)

### Como o final é escolhido
- Depois do relatório do D20 (sem interlúdio) → `Game.toEnding()` (src/engine/game.ts:498-516). Na campanha da Simone usa `content.simone.ending` e dá a conquista `outro_lado`.
- `checkEnding(st)` (engine/endings.ts:41-57):
  - **RUIM** se qualquer: algum familiar `morto`; `lacos ≤ 2` **ou** `lucia_foi_embora`; `integridade ≤ 2`.
  - **BOM** se não ruim e TODOS: família toda `bem` (cônjuge, Liam, Zélia — internada/doente/fome/frio reprova); Laços ≥ 7; Integridade ≥ 6; ≥ 4 de 7 pacientes-chave salvos (`antonio`, `davi_marcia`, `rosangela`, `juliana`, `jairo`, `osvaldo`, `cida`); `materia_publicada && sources ≥ 2` (= matéria forte).
  - **SECRETO elegível** se não ruim e `peixoto_caiu` e 3 ≤ Integridade ≤ 6 e dinheiro > R$500 → `flags.cadeira_oferecida`; a tela Ending.tsx mostra `chairOffer` (endings.ts:54-59: sala com ar-condicionado, "Plano de Otimização", página 4: retirada da USA 03) → `decideChair('assinar'|'recusar')`. Assinar = **A CADEIRA**; recusar = bom/normal + linha "Ofereceram a cadeira. Ela/Ele preferiu o telefone." (Integridade 6 permite bom + oferta ao mesmo tempo.)
  - Senão **NORMAL**.
- Conquistas por final (game.ts:530): `linha_ocupada`, `a_gente_sobreviveu`, `medico_do_telefone`, `a_cadeira`; `sem_cafe` se nenhum café.
- **Campanha da Simone** desbloqueada em `store.onFinished()` (src/client/store.ts:481-492): qualquer campanha principal com `ending` (qualquer final, inclusive ruim) → `meta.campaignsFinished++`, `meta.simoneUnlocked = true`. `simoneUnlocked()` (store.ts:201-203) também libera com `DEV_SIMONE` (`?simone=1` em build dev) ou build de teste. Game over NÃO desbloqueia (não há `ending`).

### Textos (endings.ts)
- **ruim "LINHA OCUPADA"** (12-23): cônjuge levou o Liam (se `lucia_foi_embora`); cadeira da Zélia (se `zelia_morreu`); "Seu nome saiu na matéria. O conselho abriu processo" (se integridade ≤ 2); seis meses depois, quarto alugado, outra central em outra cidade; liga para a emergência com dor no peito; atende `henriqueVoice` (morto → "voz nova, cansada"; encobriu/omitiu → "voz arrastada que você conhece bem"; senão "regulador novo"); "A tela fica preta antes de você saber se ele vai acreditar em você."
- **normal "A GENTE SOBREVIVEU"** (24-33): contrato renovado, "Nada mudou na central: mesma frota, mesmo Peixoto, mesmas metas"; contas apertadas; máquina de costura (`maquina`); "— A gente sobreviveu, né?"; crachá no prego.
- **bom "O MÉDICO/A MÉDICA DO TELEFONE"** (34-44): matéria virou investigação, OS perdeu o contrato, +2 viaturas e terceiro regulador; ateliê com fila; Zélia controla o açúcar; Seu Antônio com bolo (se salvo); carta da Cida "Voltei a assistir a novela" (se salva); desenho do Liam "Meu pai/Minha mãe salva as pessoas pelo telefone".
- **secreto "A CADEIRA"** (45-53): assinou o plano; USA 03 sai; família confortável; índice 94; "Lá embaixo, na central, um telefone toca. Você não ouve mais."; desenho do Liam sem telefone.
- **Game overs** (60-96): exonerado (3 advertências no plantão; 2 no "Regulador Real"), despejo (3 aluguéis atrasados; Nogueira com caminhão), colapso, sindicância (duas sindicâncias por óbito; ou `gameover_motivo==='fraude_ficha'` — ficha do Henrique + Anexo 9-B, D18).
- **Epílogos por fio** (`threads`, 97-173; mostrados em todos os finais; `when` filtra):
  | fio | quando aparece | ok se | bom | ruim |
  |---|---|---|---|---|
  | antonio | sempre | key antonio salvo | bate à porta com bolo de fubá, voltou a pescar | bilhete da viúva "Ele não quis incomodar" |
  | juliana | `juliana_cliente` ou key definida | key juliana salvo | 30 encomendas no ateliê | "O ateliê perdeu a primeira cliente" |
  | marcia | `marcia_viva`/`marcia_morreu` | `marcia_viva` | Márcia no aniversário de 9 anos do Liam | desenho no túmulo |
  | biel | day ≥ 16 | key jairo salvo | Biel, 17, curso de socorrista | velório do avô |
  | rosangela | sempre | key rosangela salvo | sócia do ateliê | nota de rodapé |
  | simone | sempre | lealSimone ≥ 6 && `materia_publicada` && !`simone_demitida` | supervisora, post-its oficiais | demitida no corte |
  | henrique | day ≥ 12 | `denunciou_henrique` && !`henrique_morreu` | carta "60 dias que eu não bebo" | morto → crachá com fita preta; senão **"continua no noturno"** |
  | peixoto | sempre | sources.peixoto | depõe na CPI com a planilha | assume central em outra cidade |
  | bene | sempre | intimBene ≥ 7 | churrasco de aposentadoria | se aposenta sem saber seu nome |
  | cida | day ≥ 19 | key cida salvo | carta: voltou à novela | "A máquina de costura da Dona Cida, na sala {doconj}, coberta com um pano" |
- Créditos (174-190) com guia para quem liga, CVV 188. 25 conquistas (193-218).

### Problemas nos finais
1. **Henrique** (FEEDBACK 4): ver D20 — usar `henrique_sobreviveu` (não denunciado + salvo → internado/tratamento) e ajustar `henriqueVoice`.
2. **Normal** afirma "mesmo Peixoto, mesmas metas" mesmo quando `peixoto_caiu` ou o Peixoto pediu exoneração (fonte) — contradiz D19/D20.
3. **Ruim**: "Seu nome saiu na matéria" sempre que integridade ≤ 2, mesmo sem `envelope_aceito`/`nome_na_materia` (a flag `nome_na_materia` existe e não é usada). Se a causa for Laços ≤ 2 sem `lucia_foi_embora`, o texto não explica nada. "outra central, em outra cidade" + voz do Henrique = incoerente.
4. **Bom** repete o fio do Antônio e o da Cida (a mesma informação aparece no texto e no epílogo). "O ateliê tem fila" mesmo sem `maquina`.
5. **Fio Cida (ruim)**: a "máquina de costura da Dona Cida" na casa do protagonista não é preparada nos D15–D20 (há `cida_costurava` citado no FEEDBACK item 3 como flag esquecida) — herança nunca mostrada.
6. **Fio Simone** usa `materia_publicada` (sempre verdadeira após o D18) — redundante com `simone_demitida`.
7. Fios ignoram arcos inteiros: Liam apanhando (D16), envelope/dinheiro do vereador (D18 `envelope_devolvido/usado`), Odete (`odete_salva` só no jornal), Biel/Jairo ok, Nogueira, desenho escondido (D15), Lúcia/facção (`lucia_faccao`), vaga zero.
8. A conquista `ela_so_queria_conversar` depende de `cida_conversou_dN` — o "conversar" custa 15 min em D15–D18 (pressão de tempo), e no D19 é "ficar na linha".

---------------------------------------------------------------------------
## DEPENDÊNCIAS DO MODO DISCREPÂNCIA (D15–D20) — resumo arquivo:linha
O que **some** se o modo sair sem novo gatilho:
| arquivo:linha | tipo | o que libera | efeito perdido |
|---|---|---|---|
| d16.ts:245 (+ inspect 297-314, links 309-313) | `needLink: 'davi_verdade'` | conversa com o Liam (verdade/mentira/abraço) | arco "Liam apanhando"; `davi_conversa_verdade`, `davi_mentira`, humanidade/Laços |
| d16.ts:518 | `q.confronto_quadro` (Biel trote) | confronto "esse número já passou trote" (auto via shift.ts:942) | só fala |
| d16.ts:582 (+ links 593-595) | `locked: esta_bem` | Cida confessa o feijão | `cida_sinal1`, `cida_feijao`, diário forte do D16 (usado no D17/D19 como `diario:d16_cida`) |
| d16.ts:687 | `q.confronto_quadro` (Biel verdade) | fala "juro por Deus" | só fala |
| d16.ts:876, 885 (+ link 893) | `locked: filho_peixoto` → `unlocks avisar_peixoto` (locked) | avisar o Peixoto pelo interfone | `peixoto_avisado_d16` (fala do endScene D16) |
| d17.ts:161 (+ links 74, 76) | `needLink: goteira_nogueira` | mostrar goteiras ao Nogueira | abatimento de R$50 no aluguel, `nogueira_abateu` |
| d17.ts:95 (+ link 79) | `needLink: desenhos_molhados` | secar desenhos do Liam | Laços +1 |
| d17.ts:99 (+ link 91) | `needLink: zelia_meia` | cuidar do pé da Zélia | risco da Zélia −1, Laços +1 |
| d17.ts:531 (+ links 551-557, 560-569) | `locked: repetiu` | Cida admite que repetiu | `cida_sinal2`, `cida_sinais_cruzados` (já sem uso) |
| d18.ts:157 (+ inspect 269-280) | `needLink: achou_envelope` | mostrar o envelope ao cônjuge | (alternativa `davi_acha` continua) |
| d18.ts:902 (+ links 923-925) | `locked: desmascarar` (`kind:'confronto'`) | desmascarar o Peixoto | `peixoto_desmascarado` (sem uso) e falas do Peixoto |
| d19.ts:822 (+ `linksCida` 225-263) | `locked: reconhecer` | reconhecer a voz da Cida | **`cida_reconhecida`** → manchete do D20 e diário |
Pistas de documentos/diário usadas por links: `doc:peixoto_pai` (D16), `doc:jairo_end`/`doc:jairo_neto` (D16), `doc:beira_rio` (D17), `diario:d09_helio` (D17), `diario:d16_cida` (D17/D19), `diario:d17_cida`, `doc:cida` (D19), `doc:ramal_coord`, `doc:materia_tiago` (D18), `diario:d09_marcia`, `diario:d09_casa`, `diario:d01_dente` (D19), `doc:henrique_end`, `diario:d01_parada` (D20). Total de linhas com `{{...|...}}`: d15 37 · d16 46 · d17 50 · d18 53 · d19 42 · d20 45 (podem ficar como texto).
Sugestões de gatilho (conforme HANDOFF): D16 Cida → pergunta "A senhora está bem mesmo?" liberada por perguntar da novela/conversar; D16 Osvaldo → liberar `filho_peixoto` ao perguntar o nome/ouvir "meu filho trabalha aí"; D18 Peixoto → liberar `desmascarar` ao "ligar de volta" (retorno cai na coordenação) ou perguntar a profissão; D19 Cida → liberar `reconhecer` ao perguntar da novela (`sem_novela`) ou pelo FAST; casa D16/D17/D18 → "reparar" nos objetos já definidos em `inspect.objects`.

---------------------------------------------------------------------------
## PROBLEMAS GERAIS (D15–D20 + finais)
- **"SAMU"/"192"**: nenhuma ocorrência nos 7 arquivos (só 190/193/199 e "COPOM/193").
- **Contradições**: Osvaldo internado (jornal D17) × "em casa comendo goiabada" (D18 07:40) × "o 41 tá vazio desde a semana passada" (d18.ts:930); Henrique tratado × "continua no noturno" (endings.ts:149); Dr. Castro na central × na USA 01 (d20.ts:202); final normal "mesmo Peixoto" × Peixoto afastado/exonerado; final ruim "nome na matéria" sem envelope; Simone "fica" × corte confirmado com matéria fraca.
- **Erros médicos a conferir**: Simone PA 22×13 + visão turva + escotomas tratada como urgência (d17.ts:838,855); afogamento infantil com guia só de compressões (`[validar]` d17.ts:629); Miguel (`[validar]` d17.ts:1086); bêbado do poste USA×USB (`[validar]` d15.ts:834); Arnaldo anticoagulado Glasgow 14 (`[validar]` d20.ts:927). Osvaldo com sepse em casa em 3 dias.
- **Flags gravadas e nunca lidas** (D15–D20): `juliana_pai_avisado`, `davi_desenho_escondido`, `aniversario_pago`, `aniversario_fiado`, `zelia_internada_pe`, `davi_apanhando`, `davi_conversa_verdade`, `davi_mentira`, `davi_lucia_descobriu`, `cida_sinal1`, `cida_feijao` (só diário D16), `peixoto_avisado_d16` (só endScene D16), `promessa_cumprida`, `d17_simone_perguntada`, `d17_telhado_bateria`, `d17_cida_luz`, `cida_sinal2`, `cida_sinais_cruzados`, `d17_choque_chave`, `d17_simone_usb`, `nogueira_abateu`, `rosangela_bilhete`, `telhado_lona`, `lucia_voltou` (só D18), `lucia_faccao`, `bene_fonte`, `materia_fontes`, `peixoto_endureceu`, `nome_na_materia`, `envelope_devolvido`/`envelope_usado` (só D18), `peixoto_culpou`, `peixoto_desmascarado`, `antonio_agradeceu`, `viuva_antonio_ligou`, `henrique_sobreviveu`, `bene_ultima`, `final_rua_obito`, `final_rua_salvo`. (`odete_salva/morreu` são lidas só em jornais.)
- **Bugs/código**: nenhum bug de execução evidente. Timeline do D15 fora de ordem é inofensiva. O script `noturno` do D20 manipula `shift.pending` à mão (frágil se a estrutura do agendador mudar). `fica` (d20.ts:135) duplicado em endings.ts:139.
- **Nomes que colidem**: Valter Nogueira × Seu Nogueira; Lucas Teixeira × Mauro Teixeira; "Lucas" (filho da Vera, D15) × "Lucas" (marimbondo, D19); "Bianca" (D15 e D18); "Jaqueline" (pré-eclâmpsia D14 e parto D19); "Josué" (MCI D15 e muro D17); "Yasmin" (D15 e D17); "Patrícia" (D15 e D17). Cosmético, mas o HANDOFF já pede renomear colisões.

---------------------------------------------------------------------------
## VISÃO GERAL — como a história fecha
**Estrutura dos últimos seis plantões**: D15 (evento de massa: START, reforço regional, guardar uma USA) → D16 (o trote que vira verdade, o pai do coordenador) → D17 (enchente: Bombeiros obrigatório; a TARM adoece) → D18 (a matéria sai; Bené era o condutor de 2019; ligação-teste do Peixoto; Odete) → D19 (vaga zero; Dona Cida tem o AVC) → D20 (último plantão: agradecimentos, Bené se aposenta, a parada das 18:58 que fecha o arco do Henrique).

**Arcos e como fecham**
- *Dona Cida* (D1→D20): costas (D15), esquece a novela (D16), repete a frase (D17), liga para saber de você (D18), AVC às 18:30 com fala arrastada e "Só queria ouvir uma voz" (D19, key `cida`); reconhecimento pela voz (`cida_reconhecida`) só vem pelo modo Discrepância; D20 manchete/diário; final bom e epílogo com a carta.
- *Henrique* (noturno alcoolista): D16–D19 mostra a piora (voz arrastada, menta, "Fala enrolada tem mais de um motivo"); D18 sindicância se encobriu + mentiu no 9-B; D20: não denunciado → às 18:58 a vizinha liga, PCR no 302 (salvar = "agora está escrito, tratamento"); denunciado → em tratamento ("dia doze") e a ligação vira o Seu Dito, salvo pelo Wellington do D1 no mesmo semáforo. Epílogo hoje inconsistente para o caso "salvo sem denúncia".
- *Peixoto/OS/vereador*: D16 o pai (Osvaldo) — salvá-lo torna o Peixoto fonte da matéria (D18) → cai/depõe na CPI; perdê-lo o endurece (ligação-teste, ameaça de não renovar). A matéria da Carla depende de 4 fontes (você, cônjuge, Bené, Peixoto); 2+ = forte → Peixoto cai, corte da Simone congelado, USA 03 volta (se você depôs). Odete (mãe do vereador) no D18 é o espelho do VIP do D7/D8. Envelope (D7) volta no D18 (nome no jornal / caixa de costura).
- *Bené*: confessa ser o condutor de 2019 (D18), aposenta-se no D20; a última corrida é a USA 01 indo ao Henrique/Seu Dito; intimBene ≥ 7 = churrasco.
- *Simone*: crise hipertensiva no D17 (regular de USB = melhor), lealdade decide o post-it final e se fica (supervisora) ou é demitida no dia 31.
- *Família*: aniversário e promessa do domingo (D15–D16), pé da Zélia (D16), Liam apanhando (D16, sem continuação), goteiras/Nogueira/Rosângela (D17), volta de Rio Claro e facção (D18), véspera (D19). D20 não tem casa.

**O que os finais exigem do jogador**
- Evitar o RUIM: ninguém da família morrer; Laços > 2 e cônjuge não ir embora; Integridade > 2.
- BOM: família toda "bem" no fim (curar/alimentar/aquecer; Zélia não pode estar internada), Laços ≥ 7, Integridade ≥ 6, 4 dos 7 pacientes-chave salvos (Antônio D3, Liam/Márcia D9, Rosângela, Juliana D15, Jairo D16, Osvaldo D16, Cida D19) e matéria com 2+ fontes (depor à Carla, cônjuge fonte no D14, intimidade com o Bené ≥ 5, salvar o Osvaldo).
- SECRETO: Peixoto cair (matéria forte com você ou Peixoto como fonte), Integridade 3–6 e mais de R$500 → aceitar a cadeira.
- Qualquer final (não game over) desbloqueia a campanha da Simone.
