# Fontes médicas e de regulação

O jogo se passa em Santa Aurora, cidade fictícia, mas as decisões que ele considera certas seguem fontes reais. Este documento diz quais são, o que o jogo tirou de cada uma e o que foi simplificado de propósito para o jogo não virar burocracia.

**Nomes.** O jogo (QAP — Emergency Dispatch) não usa o nome SAMU nem o número 192. Em Santa Aurora, o serviço se chama **Regulação**: a Central de Regulação atende e regula, as ambulâncias (USA e USB) fazem a intervenção, e quem liga "liga pra emergência". As fontes abaixo aparecem com o nome real porque é delas que as regras vieram.

## 1. Protocolos do SAMU 192 Regional Fortaleza (SAMUFor)

Fonte principal: aplicativo de protocolos do NEP SAMUFor (samu.fortaleza.ce.gov.br/sgru). Foram lidas as 539 páginas do aplicativo (o índice completo está em `docs/fontes/INDICE_SAMU.md`). Os botões "PDF" do aplicativo abrem as mesmas páginas internas; não há PDFs separados.

| Grupo | Protocolos | Uso no jogo |
|---|---|---|
| Regulação: acolhimento | RM0, RM1, RM2, RM3 | Fluxo da ligação, perguntas por queixa, os "3 S" |
| Regulação: tempos e respostas | RM4 | Cores, recursos e tempo-resposta; frases ao solicitante |
| Regulação: rádio e frota | RM6, PE27 | Código Q, passagem de caso, tempos QTY/QUS/QUY |
| Regulação: situações especiais | RM7, RM9, RM10 | Parada e óbito, maus-tratos, casos administrativos |
| Regulação: clínica | RC1–RC25 | Discriminadores para USA, USB ou orientação |
| Regulação: trauma | RT1–RT10 | Idem, trauma |
| Regulação: obstetrícia e pediatria | RO1–RO2, RP1–RP2 | Idem |
| Suporte avançado, intermediário e básico | SAV (AC, AGO, APed, AT, ATox, AP, Medic, PE, PMV), SIV, SBV (BC, BGO, BPed, BT, BTox, BP, Moto) | O que a equipe faz na cena: mensagens de rádio, roteiros de orientação por telefone, triagem de múltiplas vítimas |
| Gestão | Regimento interno da CRUFor, Portaria SMS 81/2016 e Anexo VII | Papéis na central (TARM, médico regulador, rádio-operador, operador de frota) e destino hospitalar |

Notas detalhadas por grupo: `docs/fontes/SAMU_REGULACAO.md` (regulação), `docs/fontes/SAMU_CAMPO.md` (suporte avançado, intermediário e básico: o que a equipe faz e o que dá para orientar por telefone) e `docs/fontes/SAMU_GESTAO.md` (protocolos especiais, múltiplas vítimas, regimento da central e Portaria 81). As mudanças feitas no jogo a partir dessas fontes estão em `docs/fontes/REVISAO_MEDICA.md`.

### 1.1 O que o jogo adota da regulação do SAMUFor

**Cores e tempo-resposta (RM0, RM4).**

| Cor | Prioridade | Resposta | Tempo-resposta recomendado |
|---|---|---|---|
| Vermelho | Máxima | USA (na falta, USI ou USB) + orientação por telemedicina até a chegada | até 10 min |
| Amarelo | Alta | USB (ou USI) | até 30 min |
| Verde | Baixa | Orientação médica; transporte por meios próprios | até 60 min |
| Azul | Mínima | Orientação médica | — |

Vermelho, em geral: parada, inconsciência ou alteração súbita da consciência, insuficiência respiratória ou circulatória franca, grandes hemorragias, dor intensa. Amarelo, em geral: dificuldade respiratória, alteração gradual da consciência ou história de desmaio, hemorragia controlável, dor moderada.

**Os 3 "S" da regulação (RM1).** Três discriminadores gerais que fazem o médico assumir a ligação na hora:
- forte valência social (comoção pública, autoridade, morte com repercussão);
- etiologia potencialmente grave ("caiu do prédio", "levou tiro", "foi atropelado por caminhão", "está parindo");
- semiologia potencialmente grave ("encontrei desmaiado", "está roxo", "não respira", "não se mexe").

As primeiras palavras de quem liga costumam ser as mais fiéis ao que aconteceu. O jogo usa isso: o relato inicial traz as pistas mais confiáveis, e as respostas às perguntas podem confirmar ou contradizer.

**Protocolo MASTER (RM2).** Responsividade (fala? abre os olhos ao chamar e tocar no ombro?), respiração e circulação (cor e temperatura da pele, sangramento). No jogo: perguntas "Está acordado?", "Respira normal?" e "Tem sangramento?"; a cor da pele aparece na videochamada.

**Abordagem por queixa (RM3) e discriminadores (RC, RT, RO, RP).** Cada queixa tem perguntas próprias e três listas: "considerar USA se…", "considerar USI/USB se…", "orientação médica se…". A decisão segue o discriminador mais alto presente. As perguntas de protocolo do jogo (dor no peito, FAST, gestação, sinais de alarme da dengue, risco imediato, ingestão) vêm daí.

**Trote (RM1).** Ligação indevida que simula urgência, piada, xingamento ou silêncio após insistência. Registrar e encerrar. Número marcado não prova trote.

**Solicitante no local (RM1, RM10).** É importante que quem liga esteja junto do paciente, para que as primeiras orientações sejam feitas por ele. No jogo, a videochamada só funciona quando quem liga está na cena.

**Telemedicina (RM7).** A regulação já é teleassistência. O protocolo prevê constatar óbito por telemedicina quando há sinais de morte evidente (rigidez, livores, decomposição, lesões incompatíveis com a vida), acionando IML (morte não natural) ou SVO (natural). A videochamada do jogo nasce dessa ideia.

**História discordante (RC, RT, RM9).** Quando o relato não explica o que se vê. Pode indicar maus-tratos. O protocolo manda notificar e acionar apoio policial. É um dos melhores usos da videochamada.

**Rádio (RM6, PE27).** Código Q e alfabeto fonético. QAP (na escuta), QTH (endereço), QSL (entendido), QTY (a caminho), QUS (chegou ao local), QTW (quadro do paciente), QUR (saiu do local), QUY (chegou à unidade), QRU (problema), QRF (refeição), QRV (à disposição), QRX (aguarde), QRR 1/2/3 (prioridade baixa, moderada, absoluta). No jogo, as mensagens do rádio usam esses códigos com tradução ao passar o mouse.

### 1.2 O que foi simplificado

- **Sem USI.** Fortaleza tem Unidade de Suporte Intermediário (enfermeiro). Santa Aurora só tem USA e USB. Onde o protocolo diz "USI/USB", o jogo aceita USB; onde diz "USA/USI", o jogo aceita USA e, quando faz sentido, também USB (decisão defensável, marcada com ⚖).
- **Tempo comprimido.** No jogo, 1 segundo real vale 1 minuto. Uma ligação leva de 60 a 90 minutos de jogo, muito mais do que na vida real (1 a 3 minutos). Por isso as janelas de risco do jogo são maiores que os tempos-resposta reais; o que importa é a ordem de grandeza entre os casos.
- **Sem e-SUS, sem campos de sistema.** O registro é o carimbo (cor, recurso, apoio, destino) e o relatório do fim do dia.
- **Destinos.** Três: Regional (REG), UPA Norte (UPA) e Maternidade (MAT), no lugar da matriz de competência da Portaria 81.

## 2. Manuais de referência

Usados para conferir condutas clínicas e roteiros de orientação por telefone (RCP, engasgo, parto, hemorragia, hipoglicemia, anafilaxia, convulsão, queimadura, afogamento, trauma):

- ACLS — Suporte Avançado de Vida Cardiovascular (AHA).
- PALS — Pediatric Advanced Life Support Provider Manual (AHA).
- AMLS — Advanced Medical Life Support (NAEMT).
- ATLS, 11ª ed. (tradução) — Colégio Americano de Cirurgiões.
- PHTLS, 10ª ed. — NAEMT.
- Medicina de Emergência: Abordagem Prática, 16ª ed. (USP, 2022).

O texto dos manuais não está no repositório; as notas citam capítulo e assunto.

## 3. Como corrigir

As decisões de cada ligação estão em `src/content/days/dNN.ts` (campo `truth`) e no banco de ligações em `src/content/bank/`. `docs/VALIDAR_MEDICO.md` lista tudo em tabelas, com a decisão aceita, as perguntas obrigatórias e a janela de risco. Corrija direto no arquivo e rode `npm test`.
