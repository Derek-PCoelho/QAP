# Simulação de balanceamento — 12 campanhas por perfil

| Perfil | Fim (bom/normal/ruim/secreto) | Game over | Chegou ao D20 | Dias jogados | Lig./dia | Saldo D5 | D10 | D15 | D19/20 | Noites na ambulância | Advert. | Notas | Óbitos | Chaves salvas | Laços | Integr. | Desgaste |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Lento | 0/0/5/0 | exonerado:4 sindicancia:2 colapso:1 | 42% | 15,8 | 5,7 | 375 | 554,2 | 564,2 | 385,7 | 1,7 | 6,3 | 14,5 | 28,8 | 3,5 | 6,9 | 2,8 | 63,5 |
| Médio | 1/3/5/0 | exonerado:3 | 75% | 19,1 | 8 | 446,3 | 624 | 737,1 | 678,7 | 0,1 | 6,3 | 13,6 | 4,6 | 6,3 | 9,4 | 3,3 | 46,9 |
| Experiente | 12/0/0/0 | 0 | 100% | 20 | 8,9 | 440 | 572,5 | 604,3 | 654,5 | 0 | 3,2 | 6,1 | 0,5 | 7 | 10 | 7,9 | 33 |
| Oráculo | 12/0/0/0 | 0 | 100% | 20 | 9,1 | 480 | 640 | 695 | 790 | 0 | 0,8 | 0 | 0,1 | 7 | 10 | 9,9 | 6 |

Metas do documento de design:
- **Lento**: termina negativo sem plantões extras (meta: −650 antes deles), 5–6 ligações/dia
- **Médio**: entre R$ 0 e R$ 400 o jogo todo, ~+105 no fim, 7–8 ligações/dia
- **Experiente**: ~+900 no fim, 9–10 ligações/dia, produtividade quase todo dia
- **Oráculo**: referência (jogo perfeito)

Nenhum erro de execução.

## Leitura (16/10/2026: correções do playtest, noites seguidas, tarde do dia 1)

**Economia.** Salário fixo de R$ 160 por plantão, mais bônus por decisão certa com teto de R$ 160 (antes: 190 e 140). As contas de cada noite somam cerca de R$ 280 (aluguel 100, comida 80, energia 30, remédios 35, gás 15, transporte 20), e o aluguel sobe para 130–140 no dia 11. Quem regula bem bate o teto quase todo dia e fecha o mês no azul; quem erra fica perto de zero e precisa escolher entre a família e a ambulância.

**O envelope do vereador.** Os perfis Lento e Médio costumam aceitar a propina do dia 7 (+R$ 1.000, integridade −4). É isso que deixa o saldo deles alto a partir do dia 7. Sem o envelope, o Médio termina por volta de −R$ 170 e o Lento bem abaixo de zero, que é a meta do documento de design.

**Intervenção (plantão extra na ambulância).** Paga R$ 140 + até R$ 75, custa +15 de desgaste (+5 a cada noite seguida, +4 por óbito, +6 com a equipe ferida), o evento da família e cochilos no dia seguinte (3, 5 ou 7, conforme as noites seguidas); com desgaste 80 ou mais, fica bloqueada. Os bots fazem a noite extra quando o saldo menos as contas da noite fica abaixo do limite do perfil e o desgaste está abaixo de 45. O Lento faz em média 1,7 noite e é o único perfil que chega ao colapso: ele já acumula desgaste pelos óbitos (quase 29 na campanha), e a noite extra cobra o resto. O bloqueio em 80 não impede que ela seja a última gota: de 67 para cima, uma noite ruim chega a 100, e o colapso acontece já em casa, no fim daquela noite. Por isso a escolha da folga avisa, a partir de 60 de desgaste, que uma noite ruim pode levar ao colapso. (Os bots não brincam com o Ozzy; o jogador que brinca toda noite tem 4 de desgaste a menos por dia.)

**Sobrevivência dos perfis.** Experiente e Oráculo chegam ao fim em todas as campanhas, quase sempre no final bom. O Médio chega em 75%, quase sempre no final normal ou no ruim. O Lento, de propósito o pior jogador possível (75% de acerto e 80 a 120 segundos por ligação), chega em 42%; com o sono pior em noites seguidas, ele faz menos noites na ambulância e cai mais por exoneração do que por colapso.
