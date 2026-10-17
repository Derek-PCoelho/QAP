# Guia de autoria de conteúdo — QAP — Emergency Dispatch

Este guia é a referência para escrever os dias, ligações, cenas de casa, jornais e o banco de ligações variáveis.
O documento de design completo está em `docs/GDD-original.md` (leia as seções do seu dia: Revisão 2 = listas de ligações; v2.0 = Teia de conexões, arcos, finais; Bíblia do Dia 9 = modelo de detalhamento).

**Modelos prontos (copie o estilo):** `src/content/days/d01.ts` (tutorial) e `src/content/days/d09.ts` (dia mais complexo).
**Tipos:** `src/engine/types.ts`. **Ajudantes:** `src/content/dsl.ts` (`fx`, `is`, `call`, `day`, `NUM`, `ADDR`).

## Validação obrigatória
```bash
npx tsc --noEmit -p tsconfig.json          # tipos
npx vitest run tests/content.test.ts        # pistas, endereços, perguntas, cenas, tokens
npx vitest run tests/bot.test.ts            # bots jogam a campanha inteira sem exceção
```
Tudo precisa passar. O validador acusa: endereço inválido em caso real, pista de inconsistência que não existe em nenhuma fala, regra de manual inexistente ou ainda não liberada no dia, pergunta base que não existe no dia, token desconhecido, falante de cena desconhecido, nós de cena quebrados.

## Tempo e escala (importante para balancear)
- O plantão vai de 07:00 a 19:00 e dura ~12 min reais (1 s real ≈ 1 min de jogo). Cada pergunta "custa" 5–15 min de jogo; "Ligar de volta" custa 30.
- Uma ligação bem conduzida consome ~60–90 min de jogo. Por isso as **janelas de risco** (`truth.risk`) são em minutos comprimidos, contados **desde a chegada da ligação na fila**:

| Quadro | good | bad | guideBonus |
|---|---|---|---|
| Parada cardíaca | 30 | 75 | 25–30 (RCP) |
| Engasgo grave | 25 | 60 | 30 |
| Anafilaxia | 28 | 70 | 35 (caneta) |
| Trauma grave / TCE / hemorragia | 45 | 110 | 15 |
| Infarto / dissecção | 60 | 150 | — |
| AVC na janela | 60 | 140 | — |
| Hipoglicemia grave / eclâmpsia / meningococcemia | 50 | 120 | — |
| Amarelo (needs: 'USB') | 90–120 | 240–320 | — |

- Casos verdes/azuis não têm `risk`. Use `inevitable: true` para óbito mesmo com a decisão certa (raro, 0–1 por dia).
- **Piora dinâmica** (`worsen`): `after` em minutos de jogo desde o atendimento (90–120 = jogador demorou). Pode trocar a verdade (`truth: { sev, ok, dx }`) e abrir orientação (`guide`).

## Estrutura de uma ligação (`call({...})`)
- `id`: `dNN_slug` único. `at`: 'HH:MM' (06:50–18:58). Ordem de chegada = ordem da lista do design; espaçamento típico 40–90 min.
- `anchor: true` = âncora ★ da história (nunca desiste da fila, nota fixa da Simone). Não-âncoras recebem `pool` (etiquetas do banco: `leve`, `moderado`, `grave`, `trote`, `pediatria`, `respiratorio`, `cardio`, `trauma_moderado`, `obstetricia`, `dengue`, `psiq`, `intox`) — com "ligações variáveis" ligado podem ser trocadas por variantes do banco.
- `num`: telefone "(17) 9XXXX-XXXX" ou fixo "(17) 3XXX-XXXX". Recorrentes em `NUM` (Cida, Biel, casa...). O quadro compara os 5 últimos dígitos.
- `caller`: quem liga ("Sueli (filha)"). `callerName` aparece na transcrição. `type`: comum, trotista, exagerador, minimizador, testemunha, crianca, frequentador, embriagado, profissional, disfarcado, vip, familia, jornalista.
- `voice` (balbucio): homem, mulher, idoso, idosa, crianca, menino, adolescente, jovem_h, jovem_m, grave, aguda, bebado, profissional, simone, peixoto, henrique, bene, lucia, alex, davi, zelia, cida, radio. A ligação de casa usa `voice: 'lucia'`; com a protagonista mulher a interface toca a voz `alex` (homem adulto).
- `note`: pré-triagem da Simone (curta, coloquial). `noteWrong`: versão errada (a Simone erra ~10% até o dia 9, ~25% depois; 50% no dia 17). Âncoras: `noteFixed` implícito.
- `addr`: `{ rua, n, bairro, ref }` — **use a tabela abaixo**. Trotes podem usar rua inexistente ou número fora da faixa.
- `amb`: camadas de som de fundo: tv, chuva, festa, choro, silencio, chuveiro, rua, risadas, radio_am, passaros, cachorro, ventilador, buzinas, sirene, respiracao, videogame, gemidos, multidao, vento, agua, cozinha, bar, igreja, escola, maquina, tiros, gritos, bebe, desenho, onibus, academia, musica.
- `open`: relato espontâneo (1–3 falas). Strings: `"[ruído]"` vira legenda de ambiente em itálico; `"QUEM: fala"` muda o falante (ex.: `'MÃE: Ai, Sueli...'`).
- `q`: respostas às perguntas base — ids: oque, consciencia, respira, idade, inicio, sangramento, historico, paciente, referencia, seguranca, callback (use `callback:` no nível da ligação), dorpeito (dia ≥ 3), fast (≥ 6), gestacao (≥ 7), dengue (≥ 11), risco (≥ 12), ingestao (≥ 13), além de `confronto_quadro` / `confronto_endereco` (respostas aos confrontos automáticos). Perguntas sem resposta usam respostas padrão (`src/content/defaults.ts`) — **escreva as que importam** (mínimo 5–7 por ligação; âncoras: todas relevantes).
- `extra`: perguntas específicas `{ id, label, say, a, cost?, locked?, unlocks?, kind?: 'pergunta'|'confronto'|'fala', onAsk? }`. Ids não podem colidir com as base. `locked` só aparece depois que uma inconsistência (`links[].unlock`) ou outra pergunta (`unlocks`) libera — use para confrontos ("O senhor disse que ele não acorda, mas estou ouvindo ele falar.").
- **Pistas**: marque trechos com `{{trecho visível|idDaPista}}` em qualquer fala/ruído. No Modo Inconsistência (TAB) o jogador liga duas pistas.
- `links`: `{ a, b, kind?: 'contra'|'confirma', insight, unlock?, onFind? }`. Pistas globais disponíveis:
  - `num` (número de quem liga), `end` (endereço dito), `mapa` (resultado de "ver no mapa"; confronto automático se inválido);
  - `manual:<regra>` — regras do Manual liberadas até o dia (ver lista abaixo);
  - `doc:<id>` — documentos na mesa: `doc:jairo_end`, `doc:jairo_neto` (recibo do Seu Jairo, D6+), `doc:marcia` (bilhete da professora, D9+), `doc:rua_ipe` (jornal D9), `doc:ordem_peixoto` (D9), `doc:carla` (cartão, D14+), `doc:cida` (post-it). Novos documentos: adicione em `DOCS` (src/content/base.ts) e entregue com `fx.doc('id')` em `onStart`/efeitos;
  - `diario:<idDaLigação>` — entrada do diário criada por uma ligação de dia anterior (ex.: `diario:d09_helio`, `diario:d16_cida`);
  - `quadro:n<5 dígitos>` — número marcado como trote (o confronto do quadro é automático).
- `patient`: `{ name, age, sex }` — nome completo realista (aparece no diário e no relatório).
- `truth`: `{ dx, sev: 'vermelho'|'amarelo'|'verde'|'azul'|'trote', ok: [...], sup?: ['PM'|'BOMB'], dest?: ['REG'|'UPA'|'MAT'] (dia ≥ 9, obrigatório se houver despacho), ref?: ['UBS'|'UPA'|'MAT'|'CASA'] (encaminhamento da orientação), must?: [perguntas obrigatórias das decisões defensáveis ⚖], risk?, inevitable?, key?: paciente-chave, prankKind?: 'trote'|'acidental'|'teste'|'desabafo', noPenalty?, best? }`. Pode ser função `(c) => TruthDef` quando depende de flags.
- `guide`: orientação ativa ao carimbar: rcp, respiracao (use `onOri: true`), desengasgo, desengasgo_rcp, parto, hemorragia, acolhimento, intoxicacao, anafilaxia, asma, asma_grave, convulsao, trauma, hipoglicemia, avc, agua, vagazero.
- `radio`: textos de rádio na chegada: ok, saved (após piora/orientação), excess, under, prank, unsafe, dead, late, dest, dismissed (fala de quem liga de novo após ser dispensado). Placeholders: `{central}` (Bené: "Central"/"{Dr}"/"{nome}" pela intimidade; demais: "Central"), `{unit}`, `{dx}`, `{Dx}`, `{name}`, `{hora}`, `{dest}`.
- `diary`: `{ alive, dead, ori, later: [{ day, text, when }] }` — o diário guarda vivos e mortos; `later` acrescenta "o que aconteceu depois" em dias futuros.
- Ganchos: `onAnswer`, `onStamp` (efeitos), `onResolve(e, { outcome, verdict, decision })` — use para gravar flags da Teia (ex.: `antonio_salvo`).
- Especiais: `impedimento` (dia 9), `mci` (dia 15: múltiplas vítimas), `nightDeath` (se ficar para o noturno, morre — dia 11), `raw` (chega sem nota da Simone — dia 17).

## Tokens de texto (gênero do protagonista e família)
A família: o protagonista é o **Dr. Luan Moura** ou a **Dra. Amber Moura**; o filho é o **Liam** (8 anos, o mesmo nas duas versões: escreva "Liam" direto); a Dona Zélia é a mãe do protagonista nas duas versões; o cônjuge muda com o gênero: com o Luan, a esposa **Lúcia**; com a Amber, o marido **Alex**. Lúcia e Alex têm o mesmo papel (mesmas cenas, mesmo ateliê, mesmas escolhas e consequências); muda só nome, gênero e concordância. Os nomes moram só em `src/engine/text.ts` (`PROTAGONIST_FIRST`, `SON_NAME`, `spouseName`).

Protagonista: `{dr}`/`{Dr}` doutor(a) · `{nome}`/`{NOME}` Luan/Amber · `{filho}`/`{Filho}` (Zélia e Cida falando com o protagonista) · `{pai}`/`{Pai}` (o Liam falando com o protagonista: pai/mãe) · `{o}`, `{ele}`, `{dele}`, `{um}`, `{obrigado}`, `{cansado}`, `{sozinho}`, `{meu}`, `{seu}`, `{medico}`, `{regulador}` · genérico: `{m:masculino|feminino}` (ex.: `{m:o senhor|a senhora}`, `{m:seu pai|sua mãe}`). Em falas de quem liga para o regulador, prefira "{dr}".

Cônjuge (forma com a Lúcia / com o Alex): `{conj}` Lúcia/Alex · `{CONJ}` LÚCIA/ALEX (rótulo de falante em transcrição: `'{CONJ}: ...'`) · `{oconj}`/`{Oconj}` a Lúcia/o Alex · `{doconj}` da Lúcia/do Alex · `{proconj}` pra Lúcia/pro Alex · `{c:forma da Lúcia|forma do Alex}` para pronome e concordância (ex.: `{Oconj} chegou {c:cansada|cansado}`, `({c:ela|ele} ri)`, `{c:a mãe|o pai} do Liam`). Como o cônjuge é sempre do gênero oposto, `{c:a|b}` equivale a `{m:a|b}`: use `{c:}` quando a palavra concorda com o cônjuge e `{m:}` quando concorda com o protagonista. Nas cenas, o cônjuge continua falando como `LUCIA` e o filho como `DAVI` (ids internos): a interface mostra "Lúcia"/"Alex" e "Liam" e escolhe o retrato e a voz certos.

## Cenas (casa, passagem de turno, fim de turno)
`{ id, bg, cast, nodes: { start: { lines, choices?, next?, onEnter? }, ... }, inspect? }`.
- `bg`: cozinha, sala, quarto, porta, escola, central, rua, hospital, mesa, preto, calcada, escritorio, igreja.
- Falantes válidos (LUCIA = o cônjuge, Lúcia ou Alex; DAVI = o Liam): LUCIA, DAVI, ZELIA, EU, NARRADOR, SIMONE, HENRIQUE, PEIXOTO, BENE, CARLA, ARLINDO, ASSESSOR, CIDA, JAIRO, NOGUEIRA, JULIANA, ROSANGELA, ANTONIO, BIEL, WESLEY, MARCIA, PAULA, PLANTONISTA, MARCOS, ODETE, OSVALDO, VIZINHA, PROFESSORA, DIRETORA, IRMÃ, CRIANÇA, MOÇA.
- `choices`: `{ label, next?, effect?, when?, needMoney?, affectionate? (bloqueada se o protagonista tomou café e chegou "Irritado"), needLink? }`.
- **Modo Inconsistência doméstico** (`inspect`): `objects: [{ id, label, desc, x, y, w, h }]` (coordenadas 320×180; objetos visuais disponíveis no desenho da cena: geladeira_quebrada, geladeira_ok, isopor, maquina, desenhos, cracha, prato_seco, xicara, lata_acucar, suco_escondido, insulina, meia_mancha, sapato_fechado, bolsa_passagem, roupa_varal, cartao_maquina, desenho_raiva, bolo, vela, goteira, balde, envelope, alianca, bombinha, mesa_vazia, carta, flores — use o mesmo id do objeto como id da pista) + `links` entre falas marcadas `{{...|id}}` e objetos. Escolhas com `needLink: 'idDoUnlock'` só aparecem depois da conexão (use `unlock: 'id'` no link). Usar TAB num dia sem nada escondido custa Laços −1.
- `interlude`: `{ teaser, scene, bico?, pre?, bills?, shop?, familyLacos?, onBico?, onFamily?, onRest?, noBico? }`. Se o jogador fizer bico, a cena `bico` substitui o evento (o evento se resolve sem ele, quase sempre pior — escreva isso, inclusive decisões do cônjuge).
- Contas de evento (`bills`): `{ id, label, amount, desc, when?, onPay?, onSkip? }`. Itens permanentes vão na loja (`shop`).

## Efeitos e condições (`fx` / `is`)
`fx.set('flag', v)`, `fx.add('lacos'|'integridade'|'humanidade'|'desgaste'|'lealSimone'|'lealHenrique'|'intimBene', ±n, 'motivo')`, `fx.money(±n, 'motivo')`, `fx.key('antonio', 'salvo')`, `fx.source('voce'|'lucia'|'bene'|'peixoto')`, `fx.doc('id')`, `fx.board({...})`, `fx.diary(texto, nome)`, `fx.ach('id')`, `fx.all(...)`.
`is.flag('x')`, `is.not('x')`, `is.v('lacos', '>=', 5)`, `is.money('<', 0)`, `is.key('cida','salvo')`, `is.present('lucia')`, `is.all(...)`, `is.any(...)`.

## Registro canônico de flags da Teia (use exatamente estes nomes)
| Dia | Flags que grava | Usadas em |
|---|---|---|
| 1 | cida_ligou_d1, cida_conversou_d1, henrique_maos_d1, desenho_geladeira | conquistas, D12 |
| 2 | pagou_agua · brigou_nogueira (aluguel D11: 140 em vez de 130) · cida_ligou/conversou_d2 | D11, D17 |
| 3 | bombinha (comprou) · antonio_salvo (+ key antonio) | D9, D11, D15, D20 |
| 4 | cida_costurava · d4_pm_ok | D13 |
| 5 | peixoto_pai (ele falou do pai) · d5_meta_batida | D16, D18 |
| 6 | geladeira_quebrada · geladeira_ok · jairo_desconto · doc recibo_jairo (prender no quadro: fx.doc + fx.board) · hipo_mae_salva | D10, D16 |
| 7 | envelope_aceito · envelope_recusado · envelope_lucia (o cônjuge aceitou sozinho) · vereador_inimigo · wesley_atendido · simone_wesley_conversa | D14, D18 |
| 8 | rosangela (key rosangela salvo/perdido) · cida_queda_regulada / cida_queda_dispensada · foi_apresentacao · marcia_alergia · henrique_coberto · calabresa (conquista) | D9, D12, D17 |
| 9 | ver d09.ts: d9_davi, d9_marcia, marcia_viva / marcia_morreu, sabia_que_era_marcia, d9_impedimento, mentiu_9B, henrique_perguntado, farmacia_popular, ordem_peixoto_registrada, d9_negociou | D10–D20 |
| 10 | zelia_hipo_percebida / zelia_caiu_d10 · alianca_vendida · henrique_atendeu_zelia | D12, finais |
| 11 | juliana_cliente · (aluguel: bills.rent = 130 ou 140) · noturno_obito_<id> (dengue grave deixada ao noturno) | D12, D15 |
| 12 | denunciou_henrique / encobriu_henrique / omitiu_henrique · lucia_proposta_descoberta · lucia_fora (D13–D17) · simone_demissao_anunciada · rosangela_ligou | D17, D18, D20 |
| 13 | pe_ferida · curativo · curativo_gratis · cida_maquina (→ flag maquina) | D16 |
| 14 | carla_teste_percebido · depoimento ('aceitou'/'recusou'/'adiou' → source voce) · lucia_fonte (→ source lucia) | D18 |
| 15 | key juliana · mci_sem_obitos · aniversario_pago · davi_desenho_escondido | D20, finais |
| 16 | key jairo · key osvaldo · cida_sinal1 · davi_apanhando | D18, D19 |
| 17 | simone_crise_ok · cida_sinal2 · rosangela_ajudante | D19, finais |
| 18 | materia_publicada · materia_forte (≥ 2 fontes) · peixoto_caiu · reforco_frota (+1 USA no D19) · odete_salva | finais |
| 19 | key cida · vaga_zero_negociada · cida_reconhecida | finais |
| 20 | henrique_morreu · antonio_agradeceu · bene_ultima | finais |
Conversas com a Dona Cida: `cida_ligou_dN` em `onAnswer` e `cida_conversou_dN` na pergunta "conversar" (+1 Humanidade) — conquista "Ela Só Queria Conversar".
Pacientes-chave (`key`): antonio, davi_marcia, rosangela, juliana, jairo, osvaldo, cida.

## Regras do Manual (ids para `manual:<id>`)
D1 vermelho, amarelo, verde, azul, parada, usa_criterio · D2 trote_sinais, trote_quadro, ligar_volta, crianca · D3 peito, atipico, muscular · D4 cena, cena_falta · D5 frota, meta, asma_mod, asma_grave, torax_silencioso, ansiedade · D6 fast, janela, acordou, hipoglicemia · D7 expulsivo, eclampsia, inicio_parto, sangramento_gest · D9 destino_reg, destino_upa, destino_mat, concorrencia, impedimento · D11 dengue_sem, dengue_alarme, dengue_grave, dengue_gestante · D12 surto, crise, acolher · D13 intox_orient, intox_grave, corpo_estranho · D15 start_verde, start_vermelho, start_amarelo, reforco · D17 alagamento, bombeiros · D19 vaga_zero.

## Frota
Dias 1–4: USA 01 (Centro, Bené), USA 02 (Norte), USA 03 (Vila Esperança), USB 01 (Vila Esperança, Joana), USB 02 (Centro, Ramon), USB 03 (Norte, Lia), USB 04 (Centro), USB 05 (Norte). Corte no dia 5: 2 USA + 4 USB (sem USA 03 e USB 05). Dia 19+: USA 03 volta se `reforco_frota`. Scripts de linha do tempo podem manipular viaturas (`c.setUnit(id, status, até, nota)`) — veja o dia 9.

## Linha do tempo do dia (`timeline`)
`{ at, kind: 'radio'|'interfone'|'simone'|'aviso'|'pedido'|'script', who?, text?, options?, run?, when? }`. Interfone/aviso pausam o relógio (modal). `simone` sem opções aparece como recado. `pedido` = rádio de mão dupla com opções. `script` recebe contexto com `setUnit`, `radio`, `modal(who, text, kind, options?)` (com opções vira uma escolha, com `effect`/`reply`/`cost` como nos eventos), `request`, `callStatus`, `sflag`, `extendShift(até)` (estende o fim do turno, ex.: o noturno atrasou).
- **`when` é avaliado na hora do evento**, não no começo do turno: uma entrada pode depender de algo que aconteceu de manhã.
- Na **campanha da Simone** (TARM), recados da Simone e interfones do Peixoto não aparecem (são para o regulador); a mesa de IA escolhe sozinha a última opção dos interfones com escolha. Avisos (`aviso`) e rádio aparecem normalmente.

## Recursos do motor acrescentados durante a produção
- `radio.noReturn`: o que a Simone conta quando um caso `noFollowup` dispensado termina em óbito.
- `diary.sequela`: texto do diário para quem sobreviveu com sequela da demora.
- `worsen[].truth` pode ser função `(c) => Partial<TruthDef>`; `worsen[].resetRisk: true` faz a janela de risco contar a partir da piora (ex.: parada depois de esperar na fila). Se a piora muda `ok`, o `best` e as `must` antigas deixam de valer automaticamente.
- `onStamp(e, decisão)` recebe a decisão carimbada.
- Decisões ⚖ (`ok` com mais de uma opção): a melhor (`best`, ou a primeira) paga mais; as outras pagam o próprio valor.
- Orientação aceita como correta num caso amarelo (`ok` inclui `ORI`) não gera retorno de "dispensado".
- `radio.dismissed` é um único texto (a fala de quem liga de novo), não uma lista.
- `video` na ligação: cena escrita para o videoatendimento (substitui a gerada). Formato em [`VIDEOCHAMADA.md`](VIDEOCHAMADA.md).
- `interlude.bico` é a cena "enquanto você estava fora": hoje ela aparece depois do plantão extra na ambulância (meio plantão das 19h à 1h). Escreva como quem chega em casa de madrugada.
- `interlude.field`: ocorrências especiais do dia na Intervenção (`cases: ['id']`) e falas de rádio entre elas (`radio: [{ before: 1, who, text, when }]`). Exemplo no dia 10 (a USB despachada para a casa do protagonista). Casos novos vão em `src/content/field.ts`; formato em [`INTERVENCAO.md`](INTERVENCAO.md).
- Nada de "SAMU" nem "192" no texto do jogo: o serviço é a **Regulação** ("Central de Regulação"); quem liga diz "Alô, emergência?" ou "É da ambulância?"; "ligar pra emergência".

## Tom e qualidade
- Português do Brasil, interior paulista/mineiro, fala natural de telefone (hesitação, repetição, gíria leve), humor seco aqui e ali, sem sermão.
- Cada ligação tem que ser **investigável**: as respostas trazem as pistas que separam a verdade da aparência (exagerador × minimizador × trotista × testemunha confusa). Pelo menos 1–2 inconsistências (`links`) nas âncoras e nas ligações não triviais.
- Orientação clínica simplificada: marque com comentário `// [validar]` qualquer instrução clínica nova; a equipe médica do cliente revisará.
- Temas sensíveis: sem detalhar métodos de autolesão (dia 12 usa o roteiro `acolhimento` com CVV 188); violência sem gore.
- Sem marcas reais, sem pessoas reais.

## Endereços válidos de Santa Aurora
| Rua | Bairro | Números válidos |
|---|---|---|
| Rua Paineira | Santa Luzia | 1–1999 |
| Rua Ipê | Jardim Norte | 1–2199 |
| Rua dos Bem-te-vis | Bela Vista | 1–2199 |
| Rua Sete de Setembro | Santa Luzia | 1–2000 |
| Rua Sete de Setembro | Jardim Norte | 2001–4200 |
| Rua Sete de Setembro | Bela Vista | 4201–6399 |
| Av. Santos Dumont | Santa Luzia | 1–2000 |
| Av. Santos Dumont | Jardim Norte | 2001–4200 |
| Av. Santos Dumont | Bela Vista | 4201–6399 |
| Rua das Indústrias | Distrito Industrial | 1–1999 |
| Rua XV de Novembro | Centro | 1–2199 |
| Rua Jacarandá | Jardim Primavera | 1–2199 |
| Av. Brasil | Distrito Industrial | 1–2000 |
| Av. Brasil | Centro | 2001–4200 |
| Av. Brasil | Jardim Primavera | 4201–6399 |
| Rua Pará | Distrito Industrial | 1–1999 |
| Rua Bahia | Centro | 1–2199 |
| Rua das Mangueiras | Jardim Primavera | 1–2199 |
| Rua das Acácias | Vila Esperança | 1–1999 |
| Rua Tiradentes | Vila Nova | 1–2199 |
| Rua do Parque | Parque das Exposições | 1–2199 |
| Rua das Palmeiras | Vila Esperança | 1–820 |
| Rua Sabiá | Vila Esperança | 1–1099 |
| Rua São João | Vila Nova | 1–2199 |
| Rua dos Expositores | Parque das Exposições | 1–2199 |
| Av. Beira-Rio | Vila Esperança | 1–2000 |
| Av. Beira-Rio | Vila Nova | 2001–4200 |
| Av. Beira-Rio | Parque das Exposições | 4201–6399 |
| Rua Goiás | Santa Luzia | 1–1400 |
| Rua Goiás | Distrito Industrial | 1401–2600 |
| Rua Goiás | Vila Esperança | 2601–3699 |
| Rua Minas Gerais | Santa Luzia | 1–1400 |
| Rua Minas Gerais | Distrito Industrial | 1401–2600 |
| Rua Minas Gerais | Vila Esperança | 2601–3699 |
| Rua Dom Pedro II | Santa Luzia | 1–1400 |
| Rua Dom Pedro II | Distrito Industrial | 1401–2600 |
| Rua Dom Pedro II | Vila Esperança | 2601–3699 |
| Rua Rui Barbosa | Jardim Norte | 1–1400 |
| Rua Rui Barbosa | Centro | 1401–2600 |
| Rua Rui Barbosa | Vila Nova | 2601–3699 |
| Av. Norte | Jardim Norte | 1–1400 |
| Av. Norte | Centro | 1401–2099 |
| Av. Sul | Centro | 1–500 |
| Av. Sul | Vila Nova | 501–1599 |
| Rua Marechal Deodoro | Jardim Norte | 1–1400 |
| Rua Marechal Deodoro | Centro | 1401–2600 |
| Rua Marechal Deodoro | Vila Nova | 2601–3699 |
| Rua Padre Anchieta | Jardim Norte | 1–1400 |
| Rua Padre Anchieta | Centro | 1401–2600 |
| Rua Padre Anchieta | Vila Nova | 2601–3699 |
| Av. Primavera | Bela Vista | 1–1400 |
| Av. Primavera | Jardim Primavera | 1401–2600 |
| Av. Primavera | Parque das Exposições | 2601–3699 |
| Rua Quaresmeira | Bela Vista | 1–1400 |
| Rua Quaresmeira | Jardim Primavera | 1401–2600 |
| Rua Quaresmeira | Parque das Exposições | 2601–3699 |
| Rua Pitangueira | Bela Vista | 1–1400 |
| Rua Pitangueira | Jardim Primavera | 1401–2600 |
| Rua Pitangueira | Parque das Exposições | 2601–3699 |
| Rua das Exposições | Bela Vista | 1–1400 |
| Rua das Exposições | Jardim Primavera | 1401–2600 |
| Rua das Exposições | Parque das Exposições | 2601–3699 |

**Marcos (pontos conhecidos):**

- Central de Regulação: Rua XV de Novembro, 601 — Centro
- Hospital Regional de Santa Aurora: Av. Brasil, 3301 — Centro
- UPA Norte 24h: Av. Norte, 801 — Jardim Norte
- Maternidade Municipal: Rua Tiradentes, 1301 — Vila Nova
- Base Centro (USA 01 · USB 02 · USB 04): Av. Brasil, 2301 — Centro
- Base Norte (USA 02 · USB 03 · USB 05): Av. Norte, 301 — Jardim Norte
- Base Vila Esperança (USA 03 · USB 01): Rua das Acácias, 901 — Vila Esperança
- Sua casa — Rua das Acácias, 40: Rua das Acácias, 40 — Vila Esperança
- Escola Estadual Prof. Aurélio Matos: Rua Ipê, 901 — Jardim Norte
- E.M. Monteiro Lobato (escola do Liam): Rua Sabiá, 501 — Vila Esperança
- Igreja Batista Nova Aliança: Rua Bahia, 300 — Centro
- Igreja Matriz de N. Sra. Aparecida: Rua XV de Novembro, 1201 — Centro
- Câmara Municipal: Rua XV de Novembro, 1601 — Centro
- Parque de Exposições: Rua do Parque, 1201 — Parque das Exposições
- Posto Avenida: Av. Norte, 1001 — Jardim Norte
- Shopping Aurora: Av. Brasil, 4801 — Jardim Primavera
- Rodoviária: Av. Brasil, 1501 — Distrito Industrial
- UBS Vila Esperança: Rua Sabiá, 1101 — Vila Esperança
- UBS Central: Rua Bahia, 1601 — Centro

**Bairros:** Santa Luzia, Jardim Norte, Bela Vista, Distrito Industrial, Centro, Jardim Primavera, Vila Esperança, Vila Nova, Parque das Exposições
