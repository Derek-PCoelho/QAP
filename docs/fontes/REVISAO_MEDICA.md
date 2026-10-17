# Revisão médica com as fontes reais (15/10/2026)

O conteúdo clínico do jogo foi revisado contra os protocolos de regulação e de campo cedidos pela equipe de regulação (notas nesta pasta) e contra os manuais ACLS, PALS, AMLS, ATLS, PHTLS e Medicina de Emergência (USP). A revisão foi dividida em três partes; cada uma tem o seu registro, com ligação por ligação, antes → depois e o código do protocolo:

| Parte | Registro |
|---|---|
| Dias 1 a 10 (92 ligações) | [`REVISAO_MEDICA_d01-d10.md`](REVISAO_MEDICA_d01-d10.md) |
| Dias 11 a 20 (99 ligações) | [`REVISAO_MEDICA_d11-d20.md`](REVISAO_MEDICA_d11-d20.md) |
| Banco de ligações variáveis (45 modelos, 185 verdades), 18 roteiros de orientação por telefone, respostas padrão e Manual | [`REVISAO_MEDICA_banco-guias.md`](REVISAO_MEDICA_banco-guias.md) |

## O que mudou, em uma página

- **Nenhuma cor de classificação estava errada**, nem nos 20 dias nem no banco, e nenhuma resposta preferida mudou.
- **Alternativas defensáveis (⚖).** Em 49 verdades (27 ligações dos dias e 22 do banco), o protocolo aceita uma segunda resposta que o jogo punia como excesso ou falta (ex.: orientação preferida, mas USB aceita para dor intensa ou palpitação atual; USB preferida, mas USA aceita para parto iminente ou crise suicida). Elas agora contam como decisão defensável, pagando menos que a melhor.
- **AVC na janela e hipoglicemia com USB.** Onde o protocolo aceita USB, a chegada da USB passa a contar como cuidado adequado para o paciente (`risk.needs: 'USB'`).
- **Vermelho sem USA livre.** Regra nova do motor (RM4: "USA; na falta, USI ou USB"): se não há nenhuma USA livre na hora do carimbo, mandar USB num caso vermelho é decisão defensável, sem advertência. O desfecho continua dependendo do recurso que chegou.
- **Encaminhamento obrigatório na orientação.** Carimbar "Orientação" exige escolher para onde (UBS, UPA, Maternidade ou ficar em casa); encaminhamento fora do aceito zera o bônus.
- **Textos corrigidos** onde a fala de quem liga descrevia um achado de outra gravidade (osso "levantando a pele" numa fratura fechada, clavícula "marcando a pele", queimadura "extensa" de 5%), orientações por telefone ajustadas (pressionar antes de lavar; pressionar em volta de objeto encravado) e rádio sem antibiótico na ambulância (a lista de medicações de campo não tem).
- **Vídeo.** A cena gerada deixou de contradizer a verdade em alguns casos: dengue "sem sinais de alarme" não aparece mais encolhida de dor; corpo estranho sem obstrução (moeda, feijão no nariz, amigdalite) não aparece engasgado; trauma de crânio leve em idoso anticoagulado não aparece desacordado; fratura exposta de fêmur mostra a coxa; queimadura de braço mostra do cotovelo à mão; autolesão conta como cena em que pedir vídeo faz mal; a Dona Cida liga de telefone fixo.
- **Roteiros por telefone.** Os números da RCP seguem as notas de campo (100 a 120 por minuto, 5 a 6 cm, deixar o peito voltar, trocar a cada 2 minutos; criança e bebê com a profundidade própria); três escolhas que eram "neutras" passaram a "erradas" (esperar o engasgo passar, torniquete com cinto, deitar de barriga para cima na intoxicação); o roteiro de anafilaxia foi reescrito (deitado, pernas elevadas, nada de sentar). O metrônomo do minijogo de RCP passou a obedecer a faixa do roteiro.
- **Respostas padrão.** Quando a ligação não tem resposta escrita para uma pergunta, a resposta padrão nunca mais contradiz a verdade (7 contradições encontradas e corrigidas nos dias).
- **Marcações `[validar]`.** Eram cerca de 180 (dias, banco, roteiros e Manual). As que as fontes confirmaram viraram comentário com o código do protocolo. As que ficaram são perguntas reais para a equipe médica.

## Perguntas abertas para a equipe médica

Estão no fim de cada registro e marcadas `[validar]` no código. As principais:

1. Pacientes que andam e estão estáveis, com dor moderada (dente, enxaqueca habitual): orientação preferida e USB como alternativa, ou só orientação?
2. Criança de 18 meses após queda de mais de 1 m, galo mole, brincando: aceitar que a mãe leve por meios próprios?
3. Autolesão com risco alto de repetição, surto agressivo armado, mão esmagada roxa, colisão forte com airbag, queda de 4 m em anticoagulado, Glasgow 14 após queda: USA deveria ser a preferida?
4. Pré-eclâmpsia antes de convulsionar: aceitar USB, se só a USA leva sulfato de magnésio?
5. Febre na gestante (nenhum protocolo cobre): aceitar orientação para a Maternidade?
6. RCP guiada em criança afogada: incluir ventilações de resgate ou manter só compressões no roteiro para leigo?
7. Banco e roteiros (17 perguntas no registro próprio): hipoglicemia reativa, AVC só com sinais de Cincinnati, agitação psiquiátrica e abstinência, queimadura química no olho, pré-eclâmpsia e período expulsivo (USB ou USA); caneta de adrenalina vencida (usar ou não; o fio da história nos dias 9 e 10 depende disso); ingestão de bateria de botão; dengue (as notas não têm protocolo; foram usados os grupos A–D do Ministério da Saúde).
8. Os 14 casos da Intervenção (plantão na ambulância) estão listados em `docs/VALIDAR_MEDICO.md`, com cada conduta marcada como crítica, ajuda, neutra ou dano.

## Fontes

Ver [`../FONTES.md`](../FONTES.md). As diretrizes de RCP das notas de campo são de 2015; as mais novas (2020 e 2025) precisam ser conferidas pela equipe antes do lançamento.
