# 04 — Banco de ligações, campanha da Simone e arquivos-base de `src/content/`

Leitura integral (100% das linhas) de: `src/content/{base,defaults,dsl,field,guides,home-base,index,video}.ts`,
`src/content/bank/*.ts` (13 arquivos), `src/content/simone/*.ts` (6 arquivos). Para entender os campos li também
`src/engine/content-api.ts` (inteiro), os trechos de `src/engine/types.ts` com LineDef/ExtraQ/LinkDef/TruthDef/
WorsenDef/CallDef/FieldCaseDef/SceneDef/DayDef etc., e os trechos de sorteio em `engine/shift.ts:294-320`,
`engine/generator.ts`, `engine/infinite.ts:9-50`, `engine/field.ts:170-380`. Nada foi modificado.

| Arquivo | Linhas |
|---|---|
| base.ts | 262 |
| defaults.ts | 147 |
| dsl.ts | 77 |
| field.ts | 461 |
| guides.ts | 669 |
| home-base.ts | 177 |
| index.ts | 66 |
| video.ts | 905 |
| bank/cardio.ts | 457 |
| bank/clinico.ts | 401 |
| bank/dengue.ts | 297 |
| bank/idoso.ts | 683 |
| bank/index.ts | 18 |
| bank/kit.ts | 453 |
| bank/neuro.ts | 966 |
| bank/obstetricia.ts | 279 |
| bank/pediatria.ts | 869 |
| bank/psiq.ts | 273 |
| bank/resp.ts | 475 |
| bank/trauma.ts | 772 |
| bank/trotes.ts | 666 |
| simone/days1_7.ts | 630 |
| simone/days8_13.ts | 832 |
| simone/days14_20.ts | 1154 |
| simone/economy.ts | 85 |
| simone/endings.ts | 308 |
| simone/index.ts | 31 |
| simone/util.ts | 162 |
| **Total** | **12.575** (soltos 2.764 · bank 6.609 · simone 3.202) |

(`endings.ts` e `days/` ficaram de fora, como pedido.)

---

## 1. DSL e formato de autoria

### 1.1 `dsl.ts` (77 linhas)
- `fx` — efeitos: `set(flag, v=true)`, `unset`, `add(var, delta, motivo)`, `money(d, motivo)` (→ `e.pay`),
  `key(paciente, 'salvo'|'perdido')`, `source(s)` (fontes da matéria: voce/lucia/bene/peixoto), `doc(id)` (documento na mesa),
  `board(entrada)` (quadro de cortiça), `ach(id)` (conquista), `toast`, `diary(texto, nome, kind)`, `all(...)`, `when(cond, f, g?)`.
- `is` — condições: `flag`, `not`, `v(var, op, n)`, `money(op,n)`, `key`, `day(op,n)`, `all`, `any`,
  `present('lucia'|'davi'|'zelia')` (não ausente/morto/away), `alive(...)`.
  **Atenção:** internamente o filho Liam é `davi`, o cônjuge (Lúcia/Alex) é `lucia`, a mãe do protagonista é `zelia`.
- `call()`, `day()`, `scene()` — identidade tipada.
- `NUM` — telefones recorrentes (cida 3322-1408, biel 99209-8877, casa 3324-0040, vereador, carla 99812-3030, peixoto, jairo, rosangela, marcos, henrique_vizinha). O quadro de trotes compara os 5 últimos dígitos.
- `ADDR` — endereços recorrentes "validados contra o mapa" (cida Pitangueira 845 Bela Vista; **casa Rua das Acácias 40, Vila Esperança, casa azul**; jairo Quaresmeira 1720; marcia Jacarandá 215 Jd Primavera; rosangela Ipê 112; diego; escola Ipê 905; igreja_bahia Bahia 300; parque; central XV de Novembro 601; osvaldo Bem-te-vis 1480 ap 41; odete; henrique XV 1950 Ed. Aurora 302; antonio São João 1240).
- `g(m, f)` — texto pelo gênero do protagonista.

### 1.2 Tokens de texto (vistos em uso)
`{dr}`/`{Dr}`/`{DR}` (doutor/doutora), `{m:masc|fem}` (gênero do protagonista), `{nome}` (primeiro nome do protagonista),
`{o}`, `{ele}`, `{dele}`, `{doconj}`, `{oconj}`, `{conj}`, `{CONJ}`, `{c:Lú|Alex}` / `{c:a esposa|o marido}` (cônjuge),
`{filho}`/`{Filho}`, `{pai}` (como o Liam chama), `{unit}`, `{central}`, `{hora}`. Pistas: `{{trecho|idDaPista}}` (Modo Inconsistência).
Strings: `"[ruído]"` vira legenda de ambiente; `"QUEM: fala"` define falante.

### 1.3 Ligação (`CallDef`, types.ts:545)
Campos: `id`, `at` ('HH:MM'), `anchor`, `when`, `pool` (tags do banco — com "ligações variáveis" pode ser trocada por variante), `genOnly` (sempre sorteada),
`num`, `caller`, `callerName`, `type` (CallerType: comum, minimizador, exagerador, testemunha, crianca, trotista, frequentador, disfarcado, profissional, embriagado…),
`voice`, `note` (pós-it certo da Simone), `noteWrong` (pós-it errado), `noteFixed`, `addr` {rua,n,bairro,ref,comp}, `amb` (ambiente sonoro),
`open` (abertura), `q` (respostas por id de pergunta), `extra: ExtraQ[]` (perguntas específicas: id, label, say, cost, a, `locked`, `unlocks`, `when`, `onAsk`, kind pergunta/confronto/fala/acalmar, repeat),
`callback` (resposta do "Ligar de volta"), `links: LinkDef[]` (inconsistências: a,b,kind contra/confirma, insight, unlock, onFind),
`patient`, `truth: TruthDef` (dx, sev vermelho/amarelo/verde/azul/trote, ok: recursos aceitos, sup PM/BOMB, dest REG/UPA/MAT, ref UBS/UPA/REG/MAT/CASA, must: perguntas obrigatórias, risk {good,bad,needs,guideBonus}, inevitable, key, prankKind trote/acidental/teste/desabafo, noPenalty, best),
`worsen[]` (after min, linhas, truth parcial, resetRisk, guide), `guide` (roteiro de orientação: id, auto, when, onOri), `radio` (ok/excess/under/prank/unsafe/dead/late/dismissed/saved/dest/noReturn),
`diary` (alive/dead/ori/sequela/later), `onAnswer/onStamp/onResolve`, `patience`, `special` (mci/simone/peixoto_teste), `raw`, `nightDeath`, `noFollowup`, `mci`, `impedimento`, `video` (cena escrita), `cena` (dica para a cena gerada).

Exemplo mínimo (padrão dos dias):
```ts
call({ id:'d03_x', at:'09:10', num:NUM.cida, caller:'Dona Cida', type:'frequentador', note:'…', addr:ADDR.cida,
  open:['{Dr}, …'], q:{ oque:'…', respira:'…' }, patient:{name:'Aparecida', age:79, sex:'F'},
  truth:{ dx:'…', sev:'azul', ok:['ORI'], ref:['CASA'] } })
```

### 1.4 Dia (`DayDef`, types.ts:792)
`day, title, weekday, weather, manual[], fleet(c), goal {maxUSA,bonus}, newspaper(c), handover(c), calls[], timeline[]` (eventos de rádio/interfone/simone/script/pedido/aviso com opções e timeout),
`endScene(c), interlude` (casa: teaser, scene, bico, bills, shop, familyLacos, onBico/onFamily/onRest, noBico, **field** {cases, radio} = noite na Intervenção, pre),
`flood, noVacancy, reportField, simoneAccuracy, onStart, links` (inconsistências do dia), `tutorial`. Módulos de dia exportam `DAY`, `DOCS_EXTRA`, `GUIDES_EXTRA` (index.ts junta tudo).

### 1.5 Cena (`SceneDef`, types.ts:675)
`{ id, bg (cozinha/sala/quarto/porta/escola/central/rua/hospital/mesa/preto/calcada/escritorio/igreja), cast, nodes: { start: { lines: DLine[], choices?: Choice[], next?, onEnter? }, … }, inspect? }`.
`DLine {who, t, mood, when}`; `Choice {label, next, effect, when, needMoney, affectionate (bloqueada se "Irritado" — café), needLink (Inconsistência!), hint}`.
`inspect: { objects: HomeObject[] (id,label,desc,x,y,w,h na grade 320x180,sprite,when), links: LinkDef[] }` — é o "Examinar" da casa por pares (item 58).

### 1.6 `index.ts` (66)
Junta tudo em `CONTENT` (version '1.0.0' — **não é a versão do jogo**), dias 1–20, Simone, perguntas, manual, frota, guias (+ GUIDES_EXTRA dos dias), banco, finais, conquistas, HOME, docs (+ DOCS_EXTRA), defaults, field, video, names.

---

## 2. `base.ts` (262)

- **QUESTIONS** (17): oque(5 min), consciencia "Está acordado?"(8), respira "Respira normal?"(8), idade(5), inicio(8), sangramento(8), historico(10), paciente "Falar com o paciente"(15), **referencia "Ponto de referência"(8, confirma endereço — item 40 quer passar para a Simone)**, seguranca(8), callback "Ligar de volta"(30, dia 2), dorpeito(dia 3), fast(dia 6), gestacao(dia 7), dengue(dia 11), risco(dia 12), ingestao(dia 13).
  Faltam as fixas do item 35: **"Tem pulso?" e "Cor da pele?" não existem**; "Respira normal?" ≠ "Respira?". Grupos: base/ferramenta/protocolo (não há Clínico/GO/Trauma/Outros).
- **MANUAL**: p1 classificação (vermelho USA meta 10 min; amarelo USB 30 min; verde UPA/UBS; azul orientação; parada = não responde e respira esquisito; "não existe reserva técnica"), p2 trote (sinais: **risadas ao fundo**, relato cinematográfico, endereço inexistente, número no quadro "não prova trote", ligar de volta, criança), p3 dor torácica, **p3-V Programa VER (dia 3)**: link 2 min, conectar 3–8 min, "mostre" 3–6 min, vermelho não espera vídeo, vídeo NÃO mostra pressão/glicemia/pulso/temperatura/pupila, só com quem está junto (RM1), nunca para vítima escondida/crise suicida, teste do copo, maus-tratos (RM9), morte evidente por telemedicina (RM7), trote filmado = prova; p4 cena insegura (PM; Bombeiros para presos/afogamento/incêndio/fio), p5 corte de frota (2 USA + 4 USB), p5-B asma (moderada USB; grave = frases entrecortadas USA; tórax silencioso; ansiedade), p6 AVC (janela 4h30; **"dentro da janela, acordado e só FAST: USB já atende (USA se livre)"**; acordou = última vez visto bem; hipoglicemia imita AVC), p7 obstetrícia, p9-A destinos (REG/UPA NORTE/MAT >20 sem), p9-B concorrência, p9-C impedimento (não regular familiar), p11 dengue, p12 saúde mental (CVV 188), p13 intoxicação criança (pilha = USB), p15 START, p17 chuvas, **p19 vaga zero (só dia 19 — item 27 quer antes)**.
- **FLEET**: USA01 Centro (Seu Bené · Dr. Castro · Enf. Márcio), USA02 Norte (Tico · Dra. Fernanda · Enf. Sueli), USA03 V. Esperança (Zé Carlos · Dr. Ivo · Rita), USB01 Joana/Paulão, USB02 Ramon/Dida, USB03 Lia/Beto, USB04 Edu/Marcão, USB05 Neide/Juca. `fleetForDay`: dias 1–4 tudo; 5+ USA01/02 + USB01–04; dia ≥19 com flag `reforco_frota` volta USA03. Infinito: 6 viaturas.
- **DOCS** (documentos da mesa, cada um com `clues` para o Modo Inconsistência): recibo_jairo (neto Gabriel 9-8877), bilhete_marcia (Liam leu redação; "Tia Márcia, 3º B"), jornal_rosangela (até dia 9), ordem_peixoto ("USA 01 é reserva técnica, só sai pra parada"), cartao_carla, peixoto_pai ("Meu pai tem 84 anos… nunca precisou de ambulância" — Seu Osvaldo), postit_cida.
- **NAMES** m/f/last (40/40/40). Inclui "Wesley" e "Benedito" (nomes de personagens fixos podem sair sorteados).

Problemas: p1 põe "AVC na janela" como VERMELHO→USA e p6 diz que USB já atende — **contradição interna do manual** (o banco segue p6: `ok:['USA','USB'], best:'USA'`).

---

## 3. Banco de ligações variáveis

### 3.1 Como funciona o sorteio
- `kit.ts` monta cada modelo (`tpl`): **uma abertura falada igual** para todas as verdades + N verdades (`build(p) → Spec`). `assemble` cuida de endereço (casos reais sempre recebem endereço válido via `validAddr` → faixas `SAFE`; trotes usam o endereço sorteado, que em 60% é inexistente), ponto de referência (`REFS`, 16 frases), `q.referencia`, voz, caller, cena do vídeo (cena do modelo ⊕ cena da verdade).
- `P` (pessoa derivada): F, g(), cg() (gênero de quem liga), o/co, ele/Ele/dele, old (≥60), kid (≤12), self, PT (NOME para "PACIENTE: fala"), nome ("Seu José"/"Dona Maria"), tipo (para nota), quem/Quem ("minha mãe"), voc ("mãe", "vô"), cFirst, caller, voz, anos ("72 anos", "3 aninhos", "8 meses"), addrOk, refPoint, v (variação cosmética fixa), `at(lo,hi)` (mesma pessoa com outra idade, para a idade não entregar a verdade), pt().
- Ajudantes: `lk(a,b,insight)` (inconsistência), `lm(p, a, regraManual, insight)` (inconsistência com regra do manual, só se a regra já existe no dia), `must(p, ...ids)` (perguntas obrigatórias ⚖ filtradas pelo dia), `from`, `prankCallback` (retorno de trote: número inexistente / caixa postal / risada e desliga), `ex()` (ExtraQ), `guideIf(cond, id)` (roteiros têm gênero fixo: ex. `desengasgo`, `avc`, `hemorragia` só com paciente homem; `respiracao`, `anafilaxia`, `convulsao` só com mulher).
- Engine: `shift.ts:294 pickVariant` — ligação do dia com `pool: 'tag1,tag2'`; modelos cujas tags cruzam e `minDay ≤ dia`; RNG por `seed:dia:id:idx`; **35% das vezes mantém a ligação original** (a menos que `genOnly`); modelo uniforme; verdade **ponderada por `weight`** entre as com `minDay ≤ dia`. `generator.ts fillParams`: sexo do modelo ou 50/50, idade em `age` (padrão 18–80), nome dos 40+40 e sobrenomes, `rel` do modelo (padrão proprio/filho/esposa/vizinho), endereço (trote: 60% inválido), telefone 80% celular. Plantão Infinito (`infinite.ts`): 9+2×turno ligações (máx 22), qualquer modelo, sempre como dia 20.

### 3.2 Modelos (63 modelos, ~265 verdades) — formato: verdade (peso) → recurso; categoria proposta para as "caixas" do item 36
Legenda: C = Clínico, GO, T = Trauma, O = Outros/folgado.

**neuro.ts** (6)
- `fala_enrolada` (dia 6+, 58–88, "{Dr}, minha mãe tá falando enrolado!") — avc_janela(3) V USA|USB best USA must inicio+fast → REG · avc_acordou(2) A USB · hipoglicemia(1.5) V USA|USB (piora → USA) · embriaguez(1.5) A USB (festa, risadas) · dentadura(1.2) azul ORI|USB. **C**
- `boca_torta` (dia 6+) — avc(2.5) V USA|USB · bell(2) verde ORI|USB → UPA · ait(1.2) A USB · sequela(0.8) azul ORI. **C**
- `desmaiou` ("Fulano desmaiou! Caiu duro") — vasovagal(4) verde ORI|USB · arritmia(2) V USA (pulso 8/15 s = 32) · hipoglicemia(1.2, d6) V USA · convulsao(1.5) A USB (piora estado de mal → USA) · **trote(1)** (risadinhas, "fala que tá morrendo"). **C**
- `convulsao` (só mulher, 18–65) — crise_cedeu(3) A USB · estado_mal(1.5) V USA · hipoglicemia(1, d6) V USA · calafrio(1.2) verde ORI|USB (pielonefrite). **C**
- `confuso` (70–93) — itu(3) A USB · desidratacao(2) A USB · hipoglicemia(1.5, d6) V USA · demencia(1.5) azul ORI. **C**
- `dor_cabeca` (próprio) — enxaqueca(3) verde ORI · hsa(1.3) V USA · hipertensao(2) verde ORI|USB · monoxido(0.8, d4) A USB + BOMB. **C**

**idoso.ts** (5)
- `desmaio_igreja` (mulher 62–86, culto) — calor_jejum(3) verde ORI|USB · hipoglicemia(1.5, d6) V USA|USB · parada(1) V USA + RCP · infarto_atipico(1, d3) V USA. **C**
- `idoso_sozinho` (vizinho, 74–93, "não atende a porta desde ontem") — caido(3) A USB · viajou(1.5) azul ORI (cena vazia) · coma(1.2) V USA · obito(0.6, d3) V USB|USA, inevitable · surdo(1.2) azul ORI. **C**
- `queda_idoso` ("caiu no banheiro") — femur(3) A USB · sem_lesao(2) verde ORI (extra "orientar a levantar") · tce_anticoagulado(1.2) V USA · sincope_cardiaca(1, d3) V USA · punho(1.5) verde ORI|USB. **T** (síncope é C)
- `febre_idoso` — gripe(2.5) verde ORI · sepse(1.3) V USA · pneumonia(2) A USB. **C**
- `remedios_idoso` (d13) — pressao_dobrada(2) A USB · diabetes_dobrada(1.2) V USA|USB (glibenclamida) · vitamina(2) azul ORI · calmante(1.2) A USB (piora → USA). **C**

**cardio.ts** (3)
- `dor_peito` (d3, próprio) — infarto(3) V USA · muscular(2) verde ORI · ansiedade(1.5) verde ORI · atipico(1.2) V USA · disseccao(0.6) V USA. **C**
- `coracao_disparado` (próprio) — ansiedade(3) verde ORI|USB (pulso 28/15 s) · tsv(1.5) A USB (48/15 s) · energetico(1.2) verde ORI|USB · hipo_leve(1, d6) verde ORI (orientar suco). **C**
- `pressao_alta` ("deu 20 por 12") — urgencia(3) verde ORI|USB · avc(1.2, d6) V USA|USB · edema_pulmao(1.2) V USA · aparelho(1.2) azul ORI (aparelho de pulso da feira). **C**

**resp.ts** (3)
- `nao_respira` — ansiedade(3.5) verde ORI|USB · asma_mod(2) A USB (**já corrigida**: frases curtas inteiras; piora → tórax silencioso USA) · anafilaxia(1.2) V USA · engasgo(1) V USA · icc(1) V USA. **C**
- `engasgo` (homem 60–90) — total(3) V USA (guia desengasgo / desengasgo_rcp se filho) · parcial(1.5) A USB|ORI (piora → total) · resolvido(1.5) verde ORI · aspiracao(1) A USB. **C**
- `chiado_crianca` (4–10) — asma_leve(2) verde ORI · asma_mod(2.5) A USB · asma_grave(1) V USA · crupe(1.5) verde ORI · corpo_estranho(0.8) A USB → REG. **C**

**trauma.ts** (6) — todos **T**
- `sangrando` — corte_superficial(3) verde ORI · arterial(1.3) V USA (guia hemorragia se homem) · epistaxe(1.5) A USB (C) · digestiva(1) V USA (C).
- `acidente_carro` (testemunha) — leve(2.5) verde ORI · presa(1.3, d4) V USA+BOMB · mal_subito(1, d6) V USA|USB (hipoglicemia ao volante, C) · embriagado(1.2, d4) A USB+PM.
- `moto` (homem 17–45) — escoriacoes(2.5) verde ORI · fratura_exposta(1.5) A USB → REG · tce(1.2) V USA · corte_braco(1.5) A USB · torax(0.8) V USA.
- `queda_altura` (calha) — coluna(1.5) V USA · entorse(2.5) verde ORI · fratura_braco(2) A USB · choque(0.8, d4) V USA+BOMB.
- `briga` (d4) — facada(2) V USA+PM · soco(2) verde ORI|USB · paulada(1.2) V USA · bebado_agressivo(1.2) A USB+PM.
- `acidente_trabalho` (colega) — corte_dedo(2.5) verde ORI · amputacao(1.2) A USB → REG · mao_presa(1, d4) V USA+BOMB · quimica(1) A USB|USA.

**pediatria.ts** (7)
- `filho_quente` (0–8) — virose(4) verde ORI · convulsao_febril(1.5) A USB · meningite(1) V USA (teste do copo) · dengue_alarme(1.2, d11) A USB · desidratacao(1.2) A USB. **C**
- `bebe_chorando` (0 anos) — colica(3) verde ORI (extra "e você, como está?") · invaginacao(1) A USB → REG · febre_neonatal(1.2) A USB|USA · hernia(0.8) A USB → REG. **C**
- `queimadura_crianca` — pequena(2.5) verde ORI · bolhas_braco(1.5) A USB · extensa(1) V USA · cha_morno(1) azul ORI. **T**
- `crianca_cabeca` — galo(3) verde ORI · vomitos(1.2) V USA · apagou(1.5) A USB · altura(0.8) V USA. **T**
- `afogamento` (2–12) — parada(1.2) V USA + RCP · tosse(2) A USB · susto(2) verde ORI→UPA · rio(0.8, d4) V USA+BOMB. **T/C**
- `engoliu` (d13, 1–5) — moeda(2.5) verde ORI · bateria(1.2) A USB → REG · remedio(1.2) V USA · achou(1) azul ORI. **C**
- `bebeu_produto` (d13) — sanitaria_diluida(2) verde ORI · soda(1.2) V USA · querosene(1.2) A USB → REG · agua(1) azul ORI. **C**

**obstetricia.ts** (2) — **GO**
- `gravida_dor` (d7) — inicio_parto(3) verde ORI → MAT · expulsivo(1.5) A USB|USA + guia parto · eclampsia(1) V USA|USB (piora convulsão → USA) · descolamento(0.8) V USA → MAT · ectopica(0.8) V USA → **REG** (7 semanas).
- `gravida_sangra` (d7, próprio) — pequeno_inicio(2.5) verde ORI · aborto(1) V USA · placenta_previa(1) V USA → MAT · tampao(1.5) verde ORI|USB.

**dengue.ts** (3, todos d11) — **C** (gestante = GO)
- `dengue_adulta` (mulher) — sem_alarme(3) verde ORI · alarme(2) A USB → UPA · choque(1) V USA · gestante(1.2) A USB → MAT.
- `dengue_idoso` — sem_alarme(1.5) · alarme_confuso(2.5) A USB → REG · choque(1.2) V USA.
- `dengue_crianca` (5–14) — melhorando(2) · alarme(2.5) A USB · grave(1) V USA.

**psiq.ts** (2, d12) — **C** (ou Outros)
- `surto` (homem) — psicose(2.5) A USB|USA + PM · droga(1.5) A USB|USA + PM · hipoglicemia(1) V USA|USB · discussao(1.2) azul ORI (vídeo "vazio") · abstinencia(1) A USB|USA.
- `crise_emocional` (próprio) — risco(2.5) A USB + guia acolhimento (CVV) · panico(2) verde ORI · solidao(1.5) azul ORI (extra "conversar" +1 humanidade).

**clinico.ts** (3) — tags sem categoria (só `leve`/`grave`)
- `bebado` ("homem caído na calçada, acho que é bêbado") — embriaguez(3.5) **verde, ok USB|ORI, best USB** · hipoglicemia(1.2, d6) V USA|USB · tce(1.2) V USA · coma_alcoolico(1) V USA. **C/T**
- `picada` — abelha_local(2.5) verde ORI · enxame(0.8, d4) V USA+BOMB · anafilaxia(1.2) V USA (caneta vencida) · escorpiao(1.5) verde ORI · cobra(1) A USB → REG. **C**
- `dor_barriga` (próprio) — gastro(3) verde ORI · apendicite(1.5) A USB · colica_renal(1.5) verde ORI|USB · infarto_atipico(0.8, d3) V USA. **C**

**trotes.ts** (5, tag `trote`) — ver 3.3.

### 3.3 Trotes existentes
Trote "de verdade" (`sev:'trote'`):
| Modelo/verdade | Peso no modelo | Tipo | Sinais |
|---|---|---|---|
| `desmaiou.trote` (neuro) | 1 de 10,7 | **óbvio** | risadinhas, "fala que tá morrendo", "alergia a prova de matemática", gargalhada |
| `trote_classico.trote` | 4 de 5,8 (69%) | **óbvio/engraçado** | "comeu quarenta pastéis e tá inchando igual balão", risadas, ketchup |
| `trote_crianca.trote` (d2) | 3,5 de 6,7 (52%) | **óbvio** | risadinhas, cochicho "fala que ela morreu", "mãe tem cem anos"; callback: a mãe atende |
| `trote_oportunista.vinganca` (d2) | 3,5 de 6,2 | **difícil** (sem risada) | voz tranquila, "manda com a sirene bem alto", vizinho do cachorro; relato muda (calçada × dentro de casa) |
| `trote_sofisticado.trote` (d10) | 4 de 5,7 (70%) | **difícil** | voz calma, endereço real, clique de teclado, hesita na idade/nome, número da casa muda ao confirmar |
| `linha_aberta.bolso` / `bebe_celular` (d2) | 3+1,5 de 6,1 | acidental (não malicioso, `prankKind:'acidental'`) | conversa de ônibus / balbucio |

Contagem: **3 trotes óbvios com risada** (desmaiou, classico, crianca), **2 difíceis** (oportunista, sofisticado), 2 acidentais. Cada modelo de trote tem verdades reais que imitam trote: skate (risada nervosa), coma_alcoolico (festa), hipoglicemia/caiu_escada/dormindo (voz de criança), **taxi** (folgado: dor de garganta, quer carona — único "folgado" do banco; item 37), real (vizinho brigado), pedido_silencioso (violência doméstica, `noFollowup`), avc_afasia (bate duas vezes), tecnica (técnica de enfermagem calma), choque (PCR, quem liga em choque).

**Risadas ao fundo (item 39)**: além dos 3 trotes óbvios, há risada em verdades reais: `fala_enrolada.embriaguez` (festa), `queda_idoso.sem_lesao` ("risada nervosa"), `afogamento.susto` (amb 'risadas'), `briga.soco` (bar), `filho_quente.virose` (risada de criança), `trote_classico.skate`, `trote_classico.coma_alcoolico`. Também `defaults.ts` (respostas padrão de trote: "[risadinha]", "[risadas]", "[sussurros e risadas]") e `video.ts prankVideo` ("[risadas]", "[alguém ri perto do telefone]", "[gargalhadas]"). O manual p.2 lista "risadas ao fundo" como sinal.

Trotes no banco dependem de `confronto_endereco`/`confronto_quadro` (respostas do confronto do Modo Inconsistência) e de links para `num` (o número no quadro).

### 3.4 Observações do banco
- Categoria clínica: a maioria das tags já dá para mapear (neuro/cardio/resp/idoso/pediatria/dengue/psiq/intox → Clínico; trauma/trauma_moderado → Trauma; obstetricia → GO). **`clinico.ts` (bebado, picada, dor_barriga) só tem `leve`/`grave`** — precisarão de tag de categoria.
- Muitas verdades usam `ok: ['ORI','USB']` com ⚖ (defensável). Comentários ⚖/[validar] citam o protocolo (RC1, RC10, RT6, RO2…).
- Respostas para perguntas novas (pulso, cor da pele): quase nenhuma verdade escreve `pulso`; existem extras `pulso` em desmaiou.arritmia (neuro:413) e coracao_disparado (cardio:214, 247, 280) e menções a pele em sepse/dengue/trauma. O resto terá de vir de `defaults.ts`/`video.ts`.

---

## 4. `defaults.ts` (147) — respostas padrão
`defaultAnswer(q, def, c)`: regra "nunca contradiz a verdade nem o que a ligação já disse". Linha aberta → só ruído. Detecta "sem resposta" por regex na resposta de `consciencia` ou no dx (parada/coma/óbito), desorientado, não coopera, obstrução total, ingestão já contada.
Casos: oque, idade (testemunha arredonda de 5 em 5), consciencia (vermelho: "não tá normal"), respira (vermelho: "meio diferente"; senão "normal"), inicio (dx com "ontem/crônico" → "mais de um dia"), sangramento ("Sangue não"), historico (>60: pressão alta), paciente, referencia (addr.ref ou "perto da padaria"), seguranca (com `sup` → "tem perigo"), dorpeito, fast (AVC no dx → positivo; senão normal), gestacao, dengue, risco, ingestao (embriaguez → bebida), **confronto_quadro / confronto_endereco** (Modo Inconsistência), default "Não sei dizer".
- **Não há** casos para `pulso`, `pele`/cor da pele, nem categorias (item 35/36). Para pele dá para derivar do `video.ts features().skin` (normal/palido/cianose/vermelho/cinza; `amarelado` existe no tipo mas nunca é usado).
- `sangramento` padrão "Sangue não, {dr}" pode contradizer verdade com sangue que não escreveu a resposta (ex.: dx "hemorragia" sem `q.sangramento`) — a regra de ouro não é verificada aqui.
- `prank` → respostas com risada (afeta item 39).

## 5. `video.ts` (905) — videochamada (Programa VER)
- `VIDEO_FROM_DAY = 3`, `VIDEO_CREDITS = 3`. `VIDEO_INTRO` (Peixoto): lei municipal do trote, franquia de 3, tempo entra na meta.
- `features(def, truth, idade, ajuste)`: deriva lugar/pose/**pele**/sinais/props/figurantes/frases (rosto, respira, corpo, volta, ferida, objeto) por regex no `dx`. Pele: vermelho → `palido` por padrão; parada/óbito/dengue grave/choque elétrico grave/sepse grave/HDA grave → `cinza`; asma/afogamento/engasgo grave → `cianose`; anafilaxia/insolação/engasgo leve → `vermelho`; hipoglicemia grave/infarto/hemorragias → `palido`; resto `normal`. **Esta é a fonte natural da resposta "Cor da pele?"** (o HANDOFF já aponta isso).
- `AJUSTE` (122–211): dica por id de ligação dos dias (d03_… a d20_final_rua) — lugar, pose, figurantes, primeira frase, `harmful` (d04_tiro), trotes que se entregam (d07/d13/d14/d19_trote). Variantes do banco usam `def.cena`.
- `prankVideo`: acidental (bebê/bolso), teste (recusa), desabafo (idosa sozinha), trote 40% recusa e desliga / 30% "câmera quebrada" / 30% aceita e mostra "vítima" de ketchup (`proof:true`).
- `buildVideo`: celular de botão (frequentador; ≥75 anos que liga do próprio aparelho, 50%), `remote` (quem liga longe), `harmful` (violência doméstica, suicídio — com fala diferente se é a própria pessoa), luz de noite depois de 18:45, spots: rosto(4), peito(5), ferida(4), corpo(4), objeto(3), em volta(3).
- Pistas `{{…|video_*}}` (48 ocorrências) — servem ao Modo Inconsistência (ex. video_palido_suor, video_cianose, video_nao_respira, video_trote, video_fio…).
- Detalhes: TCE grave sempre "não mexe direito o lado **direito**" (fixo); `buttonPhone` usa `% 2` sem `>>> 0` (funciona, sem viés relevante); regex de lugar com `\b` corrigidos.

## 6. `home-base.ts` (177) — casa, contas, loja
- **Contas fixas** (`baseBills`): transporte 20 (auto), aluguel (Seu Nogueira, valor `s.bills.rent`; 3 atrasos = despejo), alimentação 80/65/45 conforme presentes (2 faltas seguidas → alguém adoece), energia 30 (2ª falta = corte e a **insulina estraga**), gás 15 (sem gás: Laços caem), remédios da Dona Zélia 35 (2 faltas → internação).
- **Loja**: máquina de costura 450 (dia 4+, +R$40/interlúdio, Laços +1), bombinha do Liam 80 (grátis com `farmacia_popular` — ligado à Simone D3), conserto da geladeira 350/200 (`jairo_desconto`), isopor 10 (efeito tratado no engine `home.ts:584`), curativo do pé da Zélia 90/0 (`curativo_gratis` — amostras da Graça, Simone D13), fisioterapia 60 (dia 10+), **aula de desenho do Liam 50 (dia 10+, conta `aula_desenho` — item 9)**, pizza 45 (Desgaste −10, Laços +1).
- **Laços** sobe por compras e cenas (`fx.add('lacos', …)`); escolhas `affectionate` ficam bloqueadas quando o protagonista está "Irritado" (café) — o café em si não está nestes arquivos.
- `genericScene` (dia sem evento: janta; "ovo dividido em quatro" fixo mesmo se faltar alguém), `genericBico` (plantão extra à noite), **`pointlessInspect`** — frases quando o "Examinar" acerta nada ("Para de me examinar… Eu sou sua mãe, não paciente"; cônjuge; Liam). É o custo atual do Examinar (item 58 manda tirar custo e pares).
- **Ozzy não aparece em nenhum destes arquivos** (nem cômodos/objetos por dia — itens 54–56 são novos).

## 7. `field.ts` (461) — Intervenção (14 casos)
Estrutura `FieldCaseDef`: id, title, minDay, special, **qrr 1|2|3**, radio (despacho), addr, scene/far (cena insegura vista de longe), see, **vitals** (pa, fc, fr, sat, glic, temp, ritmo, glasgow), vitalsAfter, start (estabilidade), decay (pontos/s), actions [id, label, group cena/via/resp/circ/neuro/exp/med, cost s, kind info/critico/ajuda/neutro/dano, say, delta, needs, after, until, **shows** (sinais que passam a aparecer no monitor), scene, focus, secures, hurts, endsPrank], dest, scoop, treatOnScene, unsafe, prank, debrief, source, crew.
Motor (`engine/field.ts`): estabiliza quando **todas** as ações `critico` estão feitas; a piora por segundo cai 65% conforme a fração de críticas feitas; dest errado → instável; LOCAL sem estabilizar → óbito; parada (`treatOnScene`) sair sem pulso = óbito. `info` não conta para nada.

Casos: iam_inferior (QRR 3), pcr_fv (3), **hipoglicemia (QRR 2)**, avc (3, scoop), asma_crianca (3), anafilaxia (3), moto_coxa (3, scoop), pneumotorax (3, d3, scoop), **parto (QRR 2)**, convulsao (3), bar_faca (3, unsafe), **trote_praca (QRR 2, d2)**, afogamento (3, d4), agrotoxico (3, d5).

### Comparação com o feedback 43–53
- **43 (USA = QRR 3; QRR 2 só USB urgente):** todos os casos são da USA 01, mas `hipoglicemia` (field.ts:87-88), `parto` (272-274) e `trote_praca` (369-371) despacham **QRR 2**. Diverge.
- **44 (hipoglicemia sem punição por não abrir a bolsa):** no caso atual, críticas = glicemia, acesso, glicose; "Olhar a mochila" é `info` (98) e não pesa no motor. Não achei punição por "bolsa" no código; o que pode pesar: `acesso` é crítico (não há opção oral/IM), e o debrief fala da caneta na mochila. Precisa reproduzir o que o jogador viu (talvez fosse outra noite/caso). Verificar `Intervencao.tsx`.
- **45 (sinais vitais mostram a saturação):** a saturação só aparece por `shows`. Mostram sat: iam `ecg`, pcr nada, hipoglicemia `sinais`, avc `sinais`, asma `oximetro`, pneumotórax `auscultar`. **Não mostram sat no "sinais/monitor":** anafilaxia `sinais` (188: pa,fc,fr), bar_faca `sinais` (355: pa,fc,fr), agrotoxico `sinais` (450: pa,fc,fr), moto_coxa (só via o2/acesso), convulsão/afogamento (sat só via `o2`), parto (sem sat em vitals). Diverge.
- **46 (O2 só quando o jogador quiser):** o O2 é escolha do jogador, mas é **`critico`** em asma, anafilaxia, moto_coxa, pneumotórax, convulsão, bar_faca, afogamento, agrotóxico (obrigatório para estabilizar) e é a única ação que revela a sat em vários casos (acoplamento sat↔O2). Em iam/hipoglicemia/avc é `neutro` (não pune, mas gasta tempo).
- **47 (DPOC alvo 88–92%):** **não existe caso de DPOC.** Falta.
- **48 (infarto: O2 só com Sat < 90%):** iam_inferior `o2` diz "só se SatO2 < 94% ou desconforto" (field.ts:32). Diverge do pedido (<90%).
- **49 (clopidogrel junto com AAS):** não há clopidogrel no iam_inferior (só AAS 300 mg, 28). Falta.
- **50 (cateter nasal / Venturi / máscara com reservatório + intubação):** só "Oxigênio em máscara"/"com reservatório 15 L"; intubação aparece só como erro (`neutro` na PCR, `dano` no pneumotórax). Falta.
- **51 (interpretar o ritmo):** só há parada em FV; a ação "Pás do monitor" já diz "fibrilação ventricular. **É chocável**" (71) — o jogador não interpreta. Não há assistolia/AESP. Falta.
- **52 (não chocável: CA-GA-DA e adrenalina):** inexistente. Falta. (Na FV, adrenalina 1 mg IV não depende de "após o 2º choque" — simplificação.)
- **53 (fontes):** `source` cita "SAV AC5–AC8 (RCP, AHA 2015)" — diretriz de 2015 (há AHA 2020/2025). Comentário de cabeçalho cita `docs/fontes/SAMU_CAMPO.md` (nome de arquivo, não aparece ao jogador).
- Outros pontos médicos: iam_inferior com PA 86x54 recebe "soro em gotejamento lento" (no infarto de VD/hipotensão costuma-se dar bolus cauteloso); glicose 50% sem dose; atropina sem dose; asma usa hidrocortisona IV (ok) sem opção de sulfato de magnésio; pneumotórax não diz o local da punção.
- **Endereços** do field não batem com o mapa (`engine/city/map.ts`): "Rua dos Ipês" (o mapa tem Rua Ipê), "Travessa Sete", "Rua Guarani", "Rua do Comércio", "Estrada da Chácara Boa Vista", "Praça da Matriz", "Rodovia SP-310" não existem; "Rua Jacarandá, 215, **Vila Nova**" (iam_inferior) é o endereço da professora Márcia (Jd Primavera, `ADDR.marcia`); "Rua Pará, 300, Santa Luzia" e "Sete de Setembro, 45, Vila Esperança" fogem das faixas do kit. Só importa se o mapa for mostrado na Intervenção.
- Crew: Bené diz "Dezoito anos de ambulância" (field.ts:294) × Simone "Trinta e um anos de volante" (days1_7:113, days14_20:901/1032). Pode ser coerente (volante ≠ ambulância), mas soa contraditório.
- Não há "histórias próprias das noites" (item 19) — os casos são avulsos; `special`/`minDay` existem.

## 8. `guides.ts` (669) — orientação por telefone
Roteiros: `rcp` (minijogo de ritmo 100–120/min, troca a cada ~2 min; criança ~5 cm, bebê 2 dedos ~4 cm; só compressões), `respiracao` (4 tempos), `multiplas` (START), `desengasgo` (manobra abdominal; sem golpes nas costas em adulto, decisão comentada), `desengasgo_rcp` (vítima perde consciência → troca para RCP), `parto` (não puxar, secar, pele a pele, não cortar cordão, placenta no saco), `hemorragia` (não tirar pano; sem passo "certo" de torniquete; cinto fino = errado; elevar pernas [validar]), `acolhimento` (relógio ×0,12, sem timeout, cartão CVV 188, perguntar direto sobre suicídio), `intoxicacao` (não provocar vômito, sentado/de lado, embalagem), `anafilaxia` (caneta se receitada, deitar pernas elevadas), `asma` e `asma_grave` (família do protagonista: {CONJ}, Zélia "Mãe, fala com ele"), `convulsao`, `trauma` (capacete não tirar, virar em bloco), `hipoglicemia` (criança ao telefone, nada pela boca, de lado, destrancar porta), `avc` (hora, nada pela boca, de lado), `agua` (choque na água → desligar → RCP), **`vagazero`** (negociação: plantonista sem leito; "infarto com supra, UPA não tem hemodinâmica"; "vaga zero: recebe na sala vermelha e a regulação responde"). É a base do sistema de vaga zero dos itens 27–32, mas é fixo (um roteiro, sempre infarto).
Gênero fixo nos roteiros (comentado em `kit.guideIf`). Conteúdo clínico coerente com as fontes citadas.

---

## 9. Campanha da Simone (`simone/`, 3.202 linhas)

### 9.1 Mecânicas próprias
- Joga-se a **TARM** (pré-triagem) nos mesmos 20 dias; o regulador da campanha 1 vira IA (**mundo-sombra**, `c.s.shadow`): Mesa 1 = {Dr./Dra.} **Moura** (o protagonista, aqui com sobrenome; HANDOFF fala em Camille/Thiago — conferir como "Moura" convive com o nome novo), Mesa 2 = **Henrique** (Henrique Lacerda, 11 anos de central, alcoolismo escondido por bala de menta).
- **TMA** (tempo entre atender e passar): meta 45 min, 40 a partir do D13 (`tmaGoal`); `custaTMA(defId, min)` — conversar custa TMA. Advertências → `emprego`.
- Variáveis: `pressao` (0–10; tabela `PA` "12 por 8"…"21 por 13"; 10 na noite = susto, 2ª vez = colapso/game over), `wesley` (vínculo com o filho), `emprego`, `desgaste`, dinheiro.
- **Economia** (`economy.ts`): salário 120 (+bônus TMA ~15); aluguel 30 (até D6, Wesley paga o resto) → 48 inteiro (38 se o Wesley volta a trabalhar), ônibus 8, mercado 36 (pular = desgaste +4); **remédio da pressão 9 sempre a última conta** (pular sobe a pressão na 1ª noite e depois a cada duas); com `receita_nova` vira Farmácia Popular grátis e automático. Abaixo de −250: despejo.
- `escolhaUBS` (folgas D8, D12, D14, D18): renovar receita (pressão −1).
- `noite()` (util.ts:125): toda noite acrescenta o alarme da pressão e −3 de desgaste.
- Eventos `SimoneEvent` disparados por relógio ou ao atender uma ligação (`onCall`), com cena que para o relógio; `out` tira a TARM do turno (crise do D17, a Rose cobre).
- Escolhas da Simone que **gravam no mundo da campanha 1** (`sombraSet`): D3 bombinha/farmácia popular; D8 `d8_henrique_registrado`; D12 `denunciou_henrique`/`omitiu`/`encobriu`; D13 `curativo_gratis`; D14 `sombraFonte('simone')` e `depoimento`; D15 `bene_falou` (D18 limita `intimBene` do mundo-sombra a 4 sem ela); D18 usa o jornal do dia 18 da campanha 1 (`days/d18.ts`).

### 9.2 Personagens
Simone Aparecida Batista (51, 22 anos de central, letra redonda; escreve post-its anônimos de letra de forma para o Henrique), Wesley Campos (19, filho, motoboy de consórcio, capacete vermelho), Cláudio (pai do Wesley, em Sinop, só manda áudio), Dona Vera (casa 4) e Yuri (15), Graça (cunhada, técnica da UBS) e Ítalo (sobrinho, 17), Tati (TARM, 26, filha Manu), Dulce (TARM aposentada, almofada de crochê), Seu Bené (USA 01, aposentadoria no D20; esposa Nilza), Peixoto (coordenador; pai Osvaldo, 84), Rose (RH; filha Yasmin, 5), Carla Nunes (jornalista; irmão **Tiago Nunes**, 26, morto em 2019 na Av. Brasil — o HANDOFF manda renomear "Tiago" por colidir com Thiago), Dona Cida (Aparecida, 79, "xará", novela "Amor de Cristal"), Seu Edinho (banca de tomate), Everton (motoboy amigo), Dona Iolanda (vizinha do Henrique), Dra. Paula (noturno).

### 9.3 Enredo dia a dia (datas: D1 = segunda, 3 de março)
- **D1 (seg 3/3):** OS chega, TMA começa; Cida liga (ouvir novela custa TMA). Noite: Wesley contemplado no consórcio da moto (contra / capacete / deitar). Conta de luz.
- **D2 (ter):** Bené na padaria (faltam 18 plantões); trote do 9-8877 (pregar no quadro). Noite: Vera, dengue na vila, Yuri quer ser motoboy; bolos / post-it "BALA DE MENTA NÃO TIRA CHEIRO" / portão.
- **D3 (qua):** Henrique lê o post-it; 12:30 a Simone ouve o {dr} sem dinheiro para a bombinha do Liam → dica da Farmácia Popular (**muda a campanha 1**: `bombinha`, `farmacia_popular`); "eu tomei o remédio da pressão" (mentira se a cartela acabou). Botijão 105.
- **D4 (qui):** Tati; Bar do Neno (tiro). Noite: capacete bom 85 × do primo; encaixe na UBS com a Graça.
- **D5 (sex):** painel "META DO DIA: 2 USA" e bônus de R$ 30 ao regulador; post-it "A META NÃO ESTÁ ACIMA DO MANUAL (P.5)". Noite: documento da moto (emprestar / pedir ao pai / bolos). Conta de água.
- **D6 (sáb):** menina "minha mãe não acorda" (hipoglicemia d06_hipo_mae — 2 segundos achando que é trote). Noite: a moto chegou; garupa.
- **D7 (dom):** **Wesley cai de moto** (porta de carro, Av. Brasil 2780, fratura exposta de tíbia); a Simone tria o próprio filho (firme / ouvir o Wesley / olhar a Mesa 1). Desfecho por como foi triado: viatura / tarde / dispensado (Kombi da feira) / sem triagem. Seu Edinho. Noite no hospital (cadeira / casa / ligar pro pai).
- **D8 (seg):** Henrique de folga; Cida cai (punho torto — primeira vez que liga por dor); 19:32 Henrique chega atrasado, cheirando a menta, no dia da apresentação do Liam → livro da TARM / não vi / post-it "Rua Bahia, 300" (AA). Vaquinha da feira; remédios da alta 62.
- **D9 (qui):** Everton (TCE de moto); **14:00 duas linhas: a casa do {dr} (Rua das Acácias, 40 — Liam em crise de asma, Zélia ao fundo) × Márcia alérgica a abelha (Rua Jacarandá 215), uma USA livre** → a Simone decide a mesa (Moura / Henrique pela p.9-C / segurar a linha). Noite: contar ao Wesley, curativo.
- **D10 (sex):** "endereço duvidoso: ligar de volta"; Henrique bocheja enxaguante; Simone avisa a Tati que vai errar nota. Consórcio 165. Noite: Wesley com dengue (vigiar / UPA / cama).
- **D11 (sáb):** Cida não liga; Wesley vomita (perguntas / Vera / "bebe soro"); **Yuri** (15, dengue grave, fase crítica): 18:20 a Vera liga; se ficar na fila às 19h vai pro noturno (Henrique) → `yuriMorreu`/`sindicanciaYuri`.
- **D12 (dom):** velório do Yuri ou Yuri bem; Caio (crise emocional, CVV); comunicado do corte (uma TARM por turno a partir do dia 31); **sindicância** (a do Yuri, ou de uma senhora de 68): Henrique pede para marcar "não" → falar (denuncia, afastado) / calar (arquivada) / mentir (encobre). Chuveiro 45.
- **D13 (ter):** Mesa 2 vazia se denunciou; META TMA 40; amostras da Graça (dar metade ao {dr} → `curativo_gratis` na campanha 1); post-it "AINDA DÁ TEMPO". Raio-X 85.
- **D14 (qua):** Carla liga para cronometrar (número de 2019, Tiago Nunes, óbito); ponto de ônibus: desculpa / "hoje eu fico na linha" / recusa → virar fonte (anônima) e/ou mandar a Carla ao {dr}. Fiado 30.
- **D15 (sex):** Bené (falar com nome à Carla); show no Parque — Ítalo ("sai pela lateral"); MCI; **Yasmin** perdida (ligar pra Rose → `rose_yasmin`). Carnê 58.
- **D16 (sáb 22/3):** Cida esquece o nome da novela (anotar); 9-8877 de novo — é real (vô Jairo); **Osvaldo Peixoto** (pai do coordenador): avisar o Peixoto ou triar neutro. Noite: a moto (proibir / passar a moto / banca do Edinho / "decide você").
- **D17 (seg 24/3):** enchente; Cida repete a frase (anotar); 12:45 **crise hipertensiva** se pressão ≥7 (Moura regula "USB, sentada, pra UPA", a Rose cobre) ou escolha parar/continuar; UPA à noite (receita nova).
- **D18 (ter):** matéria da Carla (forte/fraca, depende do mundo-sombra); Bené no rádio: "o motorista de 2019 era eu"; **a lista** (Rose): `pesoLista` decide se o nome é dela ou da Tati; assinar a escala (secreto) / não / adiar; bolo do Bené (Nilza).
- **D19 (qui):** Cida não liga de manhã; 18:30 **AVC da Dona Cida** (com as duas anotações a Simone "não precisa de mais nada"). Bolo.
- **D20 (sex):** último dia do Bené; Henrique não dobra (ou está na clínica, "hoje é o dia doze"); **18:58 Henrique em PCR no Ed. Aurora** (d20_final) ou Av. Brasil 2650 (d20_final_rua, Wellington faz massagem); último post-it ao {dr}; Bené "QRT. Desligando".

### 9.4 Finais (`simone/endings.ts`)
Ordem: **SECRETO "A Lista"** (assinou a escala) → **RUIM** (demitida, Wesley ≤2 ou pressão ≥9: "O dia 31" / "A nuca" / "O quarto vazio", com epílogo "do outro lado da linha") → **BOM "Os post-its são oficiais"** (supervisora, Wesley ≥6, pressão ≤6) → **NORMAL "A mesma cadeira"**. Fios: emprego, Wesley, saúde, Henrique (tratamento/sobreviveu/morreu/piorando — "continua no noturno"), dia 9, Yuri, Cida, Carla ("todo dia 12 de abril, o dia do Tiago"), Bené, Peixoto. Game overs: exonerado, colapso/esgotada, despejo. Créditos com mensagem sobre pressão, trote e CVV.

### 9.5 Problemas encontrados na Simone
- **Contagem errada até o dia 31:** D18 (ter 25/3) "Dia 31. Faltam doze dias" (days14_20.ts:753) e D19 (qui 27/3) "Faltam onze dias pro dia 31" (days14_20.ts:900). Pelas datas do próprio texto (D16 = 22/3, D17 = 24/3) faltam 6 e 4 dias.
- Nome "Tiago" (Carla) em days14_20.ts:71, 159-166 e endings.ts:131 — renomear (decisão do HANDOFF).
- "Moura" como sobrenome do protagonista em toda a campanha (`util.mesa1`, textos "{O} {dr} Moura") — verificar com os nomes Camille/Thiago.
- Dona Cida conta da novela: "O Henrique, o da fazenda" (days1_7.ts:53) — mesmo nome do Henrique da central (pode ser piada, mas confunde).
- `Choice`/nós com `choices` **e** `next` ao mesmo tempo (folga: days8_13.ts:754-757; days14_20.ts:174-177, 770-773) — o `next` deve ser ignorado quando há escolhas; conferir no motor.
- Comentário de `economy.ts` (aluguel 30 → 48 no D7) bate com o código, mas o label "a sua parte" no D7+ com Wesley trabalhando cobra 38 — ok.
- `util.mesa2SeAfastado` é gambiarra declarada (motor só aceita `henrique.away` estático).

---

## 10. Dependências do Modo Inconsistência (item 42) — arquivo:linha
- **Mecânica de pares/links no banco**: todas as verdades têm `links` (lk/lm): ~231 `lk(` e ~85 `lm(` (neuro 43/15, idoso 26/8, cardio 17/8, resp 15/5, trauma 28/6, pediatria 30/9, obstetricia 8/7, dengue 4/10, psiq 7/6, clinico 16/3, trotes 36/7). Geradores em `bank/kit.ts:300-309` (`lk`, `lm` → `'manual:'+rule`) e `kit.ts:325-331` (`prankCallback` gera pista `retorno_*`, ligada a `'num'`). Os `insight` desses links são **a explicação didática** de cada caso — se o modo sair, esse texto some (dá para reaproveitar no relatório/debrief).
- **Marcação `{{trecho|id}}`** (pode ficar como texto): bank (~615 ocorrências: neuro 112, idoso 77, pediatria 76, trauma 73, trotes 67, resp 50, cardio 41, clinico 41, obstetricia 34, dengue 23, psiq 21, kit 3), `video.ts` (48: ex. 142, 188, 207-209, 264-265, 275-276, 284, 298, 308-310, 319, 322, 327, 349, 369, 378, 386, 413, 423, 432, 456, 466, 485, 487, 492, 495, 501, 540, 554, 570, 584, 591, 603, 612, 629, 636, 650, 652, 669, 793).
- **Desbloqueio dependente de inconsistência**: `bank/trotes.ts:323` (extra `confronto` com `locked: true`) liberado só por `trotes.ts:327-328` (`{ unlock: 'confronto' }`). Precisa de novo gatilho. (`trotes.ts:482-483` usa `unlocks` de pergunta — não depende do modo.)
- **Respostas de confronto** (perguntas `confronto_*` geradas pelo motor no modo): `bank/neuro.ts:532`, `bank/trotes.ts:43-44`, `trotes.ts:173`; `defaults.ts:138-143`.
- **Pistas de documentos** (`DeskDoc.clues`): `base.ts:214-216, 223, 230, 236, 242, 248, 254`; tipo em `engine/content-api.ts:124-125`.
- **Tipos**: `ExtraQ.locked` (types.ts:101), `LinkDef` (types.ts:109-116), `Choice.needLink` (types.ts:645-646), `InspectDef.links` (types.ts:669-673), `DayDef.links` (types.ts:815-816) — nenhum `needLink`/`inspect` nos arquivos lidos aqui (estão em `days/`).
- **Manual p.2** ("risadas ao fundo", "número já no quadro") e a pergunta `referencia` (base.ts:16) alimentam o confronto de endereço.
- Simone: **nenhuma** dependência (0 `{{`, 0 links).

## 11. Outros problemas e observações
- "SAMU"/"192": nenhuma ocorrência visível ao jogador. Só no comentário `field.ts:7` (`docs/fontes/SAMU_CAMPO.md`) e o nome "Samuel".
- Inconsistências de números dentro de uma mesma ligação: `neuro.ts` fala_enrolada.hipoglicemia — extra "deu 38" (115) × rádio "Glicemia 34" (123); `cardio.ts` hipo_leve — extra "Deu 104" (313) × rádio "Glicemia 110" (319). (Pode ser medida diferente, mas soa erro.)
- `trauma.ts:234` acidente_carro.mal_subito: a cena do vídeo diz sempre "**a motorista**" mesmo se o paciente for homem.
- `clinico.ts:23` bebado.embriaguez: `sev:'verde'` com `best:'USB'` — o manual diz verde = meios próprios; a melhor resposta ser USB contradiz a classificação.
- `home-base.ts:122` "um ovo dividido em quatro" fixo, independente de quantos estão em casa.
- Manual p.1 × p.6 (AVC na janela USA × USB) — ver §2.
- Vaga zero só no manual do dia 19 e no guia fixo `vagazero` (infarto) — itens 27–32 pedem sistema novo.
- Perguntas: não há "Tem pulso?"/"Cor da pele?"; "Confirmar endereço" (referencia) ainda é do médico; não há categorias Clínico/GO/Trauma/Outros nem frases de "Outros" (folgados). O único folgado do banco é `trote_oportunista.taxi`; não há xingamento/bipe.
- Post-its da Simone: `note`/`noteWrong` já existem em todas as verdades; falta a cor por categoria (item 33).
- `index.ts:125` `version: '1.0.0'` (versão do conteúdo, não do jogo — o jogo está em 1.0.4).
