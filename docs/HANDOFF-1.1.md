# Passagem de plantão da 1.1 (17/10, fim do dia)

Esta passagem substitui o "Já feito nesta rodada" do `docs/HANDOFF.md`. As regras de trabalho e as decisões do HANDOFF continuam valendo.

**Leia nesta ordem:**
1. Este arquivo.
2. `docs/PEDIDOS-1.1.md`: o pedido do jogador, palavra por palavra. É a fonte principal.
3. `docs/PLANO-1.1.md`: regras e divisão em frentes.
4. `docs/ROTEIRO-1.1.md` e `docs/roteiro-1.1/*.md`: a bíblia narrativa da 1.1, com o "Roteiro do dia N" no fim.
5. Para consultar: `docs/estudo-1.0.4/` (estudo integral da 1.0.4, com arquivo:linha) e `docs/CONTEUDO.md` (formato do conteúdo, já atualizado).

O jogador escreve curto e simples. Responda em poucas linhas, em português, sem jargão.

## Onde está o código
- **GitHub `Derek-PCoelho/QAP`, branch `v1.1`**: a versão integrada, que é a base para continuar.
  - `main` ainda é a 1.0.4.
  - `JOGAR.html` na raiz da `v1.1` é a prévia jogável atual.
- **`wip/vaga-zero-recursos`**: a vaga zero e o rebalanceamento, no meio do trabalho. Ainda não entrou na `v1.1` (detalhes abaixo).
- Os outros ramos `wip/*` (mesa, roteiro-d01-d10, roteiro-d11-d20-finais, arte-2) já estão dentro da `v1.1`. Servem só de histórico.

Para atualizar a pasta local:
```
git fetch origin && git checkout v1.1 && git pull && npm ci
```

## Estado da `v1.1`
- `tsc` sem erros; `vitest` com 223 de 223 passando.
- Simulação com 100 sementes, campanhas que chegam ao D20: Lento 61%, Médio 76%, Experiente 99%, Oráculo 100%.
- Referência da 1.0.4 com 150 sementes (1001–1150): Lento 61%, Médio 78%, Experiente 97%.
- Ou seja, a dificuldade não subiu. O Médio está 2 pontos abaixo, o que fica dentro da oscilação; vale conferir de novo depois da vaga zero.

### Pronto e integrado
- **Fundação.**
  - Nomes Camille e Thiago, com campo de renomear.
  - SAVE_VERSION 4 com `migrate.ts`: o save v3 do dia 6 abre.
  - Modo Inconsistência removido. As perguntas trancadas usam gatilhos novos (`ExtraQ.unlockedBy`, tabela no relatório da Fundação em `docs/CONTEUDO.md`).
  - "Reparar" na casa (`HomeSim.noticeables/notice`).
  - Perguntas: 5 fixas e as caixas Clínico, GO, Trauma e Outros (`src/engine/categories.ts`). As frases de Outros têm efeito.
  - A Simone confere o endereço.
  - Ganchos `almoco`, `ida` e `volta` nos dias.
  - Origem do dinheiro: `renda_<origem>`, com `moneyOrigin`, `moneyBand`, `incomeRecent`, `bicosRecent`.
  - `vite-node` instalado. Bugs corrigidos: as contas que travavam, `dispensa_amarelo` e o QRR por viatura.
- **Arte 1.**
  - Família nova: Lúcia asiática de pele clara, Alex branco de cabelo preto, Liam branco.
  - Crachá com o nome por parâmetro.
  - Ozzy correndo, latindo e dormindo, com a API `ozzyPlayAt` e a opção `SceneOpts.ozzyPlay`.
  - 6 adesivos do Ozzy.
  - Fontes legíveis: 5, 2, Z, B, C e o A gótico, em `art/fontFix.ts`.
  - Pele escura sem manchas com o Desgaste; mapa e cenas corrigidos.
- **Intervenção.**
  - Itens 43–53 completos: QRR, hipoglicemia sem a mochila, SpO₂ sempre, O₂ só quando o jogador escolhe (DPOC 88–92%, IAM só abaixo de 90%), clopidogrel, cateter, Venturi, reservatório e intubação, leitura do ritmo com FV, TV, assistolia (CA-GA-DA) e AESP.
  - História das noites "O Sereno", em 7 capítulos com as flags `noite_*` (veja `docs/INTERVENCAO.md` §3).
- **Mesa.**
  - Post-it pela cor da caixa, com erro.
  - Post-it da TARM dentro da transcrição, sem cobrir o texto.
  - Quadro de cortiça: arrastar, remover, escolher a cor e colar adesivos (`GameState.cork`).
  - O "piii" com símbolos.
  - 8 folgados no banco (`folgadoSlot`).
  - Trotes do banco sem risada, com pistas.
  - Mesa da Simone com a conferência de endereço e a cor.
- **Roteiro dos dias 1–10, completo:** almoço, ida e volta, as reviravoltas R1 a R5 que caem nesses dias, a regra do dinheiro, o envelope, a queda interativa do D10, o bilhete das 22:07, as aulas de desenho, os trotes, o calendário e os nomes.
- **Roteiro dos dias 11–17, completo**, no mesmo padrão. Inclui a sindicância com o bilhete no D12, a virada R2 no D16 e a R4 no D17.
- **Arte 2, parte pronta.**
  - Quarto do casal, quintal e banheiro, com saídas entre cômodos e objetos por dia (`sceneKit.ts`).
  - Retrato do Dr. Saulo nos 7 humores.
  - Figuras de corpo inteiro: Simone, Henrique, Bené, Paula, Saulo, Peixoto e Carla.
  - Clímax da vaga zero: `renderVagaZero`/`drawVagaZero` em `art/vagaZero.ts`.

## O que falta (em ordem sugerida)
1. **Vaga zero e rebalanceamento** (`wip/vaga-zero-recursos`).
   - Já feito:
     - Motor: Saulo, argumentos, Peixoto 1 vez por plantão, viatura presa, confiança.
     - Recursos: café com foco, vídeo que responde o que se vê, perguntas à toa custando caro em caso grave.
     - Bots que usam os recursos.
     - Em andamento: a tela `VagaZero.tsx`, o CSS e o áudio `audio/vagazero.ts`.
   - Falta:
     - Ligar a arte do clímax (`drawVagaZero`, que já está na `v1.1`).
     - Dados por ligação em `src/content/vagazero.ts`, seguindo `roteiro-1.1/vaga-zero.md`.
     - Apagar `.tmpvz/`.
     - Calibrar com ≥ 100 sementes (meta: Lento ≥ 61%, Médio ≥ 78%).
     - Juntar à `v1.1`.
2. **Roteiro dos dias 18–20 e os finais**, que ainda não foram feitos.
   - D18: almoço com a revelação de 2019 (R3), a matéria com `nome_na_materia`/`rosangela_protegeu` e `noite_plano_noturno`, a Odete com leito em 4 minutos.
   - D19: a vaga zero da Cida (com a frente 1).
   - D20: a última marmita do Bené (R5), a flor na cruz e o Seu Anselmo.
   - `endings.ts` e `engine/endings.ts` conforme `roteiro-1.1/finais.md`, com o epílogo do Henrique corrigido (`henrique_sobreviveu` = internado e em tratamento).
3. **Arte 2, o que falta.**
   - As vinhetas novas dos finais (`finais.md`) e o "SOS" que parece "505" em `quarto_alugado`.
   - PM e Bombeiros em ação, com sequências por tipo: violência doméstica, arma de fogo, briga de bar, surto, alagamento, desabamento, preso em ferragem, incêndio, altura, choque elétrico e afogamento.
4. **Casa explorável**, frente ainda não começada.
   - Andar pelos cômodos e interagir.
   - Algo diferente em cada cômodo em cada um dos 20 dias (`roteiro-1.1/casa.md`).
   - Brincar com o Ozzy usando `ozzyPlay`.
   - Usar os cômodos da Arte 2.
5. **Acabamento.**
   - Cenário próprio para a ida e a volta (hoje rodam por cima da mesa, porque o `SceneOverlay` não desenha `bg`).
   - Retratos dos falantes novos: DIRCE, AÍLTON, IOLANDA, EDSON, REGINALDO, ANSELMO, TAÍS, SGT. ROCHA, HELOÍSA, MAURO etc. (lista no `tests/content.test.ts`).
   - Ligar a PM e os Bombeiros na tela, quando forem enviados.
6. **Onda 3:** as campanhas do Henrique, do Peixoto e do Bené (o Bené dirige a ambulância). As sementes estão em `roteiro-1.1/campanhas.md`.
7. **Fechar a 1.1.0.**
   - Subir a versão (`package.json`, `Report.tsx`/`GameOver.tsx` submitScore).
   - Marcar `docs/FEEDBACK-1.1.md`.
   - `npm run build` e `node desktop/build.mjs`.

## Como as frentes foram feitas
Cada frente trabalhou numa cópia separada (git worktree), com commits pequenos. Eu juntava na `v1.1` e rodava `tsc`, `vitest`, `simulate` e um teste no navegador com Playwright. Os textos completos dos pedidos de cada frente seguem o padrão: ler os docs acima, ficar só nos seus arquivos, não deixar o jogo mais difícil e verificar com capturas.
