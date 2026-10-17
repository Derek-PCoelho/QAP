# Plano de trabalho da 1.1 (para as frentes paralelas)

Leia antes: `docs/PEDIDOS-1.1.md` (pedido do jogador, palavra por palavra), `docs/HANDOFF.md` (decisões já tomadas), `docs/FEEDBACK-1.1.md` (os 58 itens) e as notas do estudo integral em `docs/estudo-1.0.4/` (01–03 roteiro por dia, 04 banco/Simone/Intervenção, 05 motor, 06 interface/áudio, 07 arte, 08 imagens, 09 docs/servidor/testes).

## Regras para todas as frentes
- Português do Brasil no jogo, no estilo existente (interior, fala de telefone, humor seco, sem sermão). Nada de "SAMU" nem "192" no texto.
- Medicina conferida com `docs/fontes/`; o que for novo leva `// [validar]`. No infarto, O2 só com SpO2 < 90% (decisão do jogador).
- **NÃO pode ficar mais difícil.** Linha de base dos bots (1.0.4, 20 sementes): Lento 0/0/10/0 (50% chegam ao D20), Médio 2/6/8/0 (80%), Experiente 20/0/0/0, Oráculo 20/0/0/0. Rode `npm run simulate` (ou `npx vite-node scripts/simulate.ts`) e compare.
- Saves antigos (há um save do jogador no dia 6, campanha da ex-Amber) precisam continuar abrindo: migre, não quebre.
- Mantenha `npx tsc --noEmit -p tsconfig.json` e `npx vitest run` passando. Atualize/adicione testes.
- Não mude ids internos de família (`lucia`, `davi`, `zelia`), de flags existentes nem de ligações sem necessidade.
- Trabalhe SÓ nos arquivos da sua frente (lista abaixo). Se precisar mexer em arquivo de outra frente, faça a menor mudança possível e diga no relatório.
- Faça commits pequenos e descritivos na sua branch. Não faça push.

## Ondas
**Onda 1 (agora, em paralelo)**
- **Fundação** (motor + mesa): nomes Camille/Thiago + renomear; migração de save; remover o Modo Inconsistência e dar novo gatilho a tudo que ele trancava; novas perguntas (5 fixas + 4 caixas Clínico/GO/Trauma/Outros + frases de "meios próprios"); Simone confere o endereço; ganchos do motor para almoço às 13h, cenas de ida/volta do plantão e o "reparar" da casa; `vite-node` no package.json.
  Dona de: `src/engine/**` (exceto `field.ts`), `src/client/screens/desk/**`, `src/client/store.ts`, `src/client/screens/NewGame*`, `src/content/defaults.ts`, `src/content/dsl.ts`, gatilhos `locked/needLink/links` em `src/content/days/*` e `bank/*`, `tests/**`.
- **Arte**: família nova (Alex branco de cabelo preto; Lúcia asiática de pele clara, bonita; Liam branco) em retratos, corpos, foto de família, ícones e finais; crachá com o nome vindo do texto; Ozzy correndo/latindo/dormindo no tapete (quadros); legibilidade das fontes (5/S, Z/8, 2/8, A gótico); manchas de pele com Desgaste alto. Dona de: `src/client/art/**`, `docs/ARTE.md`.
- **Intervenção**: itens 43–53 + história própria das noites (arco que vale seguir). Dona de: `src/engine/field.ts`, `src/content/field.ts`, `src/client/screens/home/Intervencao.tsx`, `docs/INTERVENCAO.md`.
- **Roteiro (só documento)**: bíblia narrativa da 1.1 em `docs/ROTEIRO-1.1.md` — reviravoltas, personagens memoráveis, consequências de cada escolha, almoço dos 20 dias, ida/volta, casa por cômodo por dia, finais novos. Não mexe em código.

**Onda 2 (depois da Fundação)**: vaga zero negociada + rebalanceamento de recursos; mesa (post-its por cor, quadro de cortiça, trotes, folgados com "piii"); roteiro implementado (dias 1–10, dias 11–20 + finais); casa explorável.

**Onda 3**: arte dos finais, abordagem da PM/Bombeiros na tela, campanhas do Henrique, do Peixoto e do Bené.
