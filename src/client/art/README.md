# QAP — Emergency Dispatch — direção de arte

Toda a arte do jogo é **pixel art 2D de baixa resolução gerada em código**: grades ASCII e desenho procedural num buffer de pixels próprio (`Pix`). Não há nenhum arquivo de imagem, nenhuma URL externa e nada em 3D. Cores chapadas, sombreamento em faixas, *dithering* ordenado quando é preciso transição, contornos escuros para leitura rápida. O espírito é o de *Papers, Please*: formas grossas, poucas cores, informação legível de relance, e um mundo que pesa.

## A ideia central: duas luzes

O jogo vive entre dois lugares, e cada um tem a sua luz.

- **A Central** é luz fria de fluorescente: verdes-acinzentados, painéis escuros, telas. Os acentos (vermelho, âmbar, verde, azul) são informação: triagem, status de viatura, alertas.
- **A Casa** é luz quente de lâmpada incandescente pendurada no fio: madeira, reboco amarelado, tecido vermelho e azul, um halo dourado sobre a mesa.

**Desgaste.** Conforme o Desgaste sobe (0..100), a casa *vai ficando fluorescente*. Toda cena doméstica recebe `blend = Desgaste/100` e cada cor quente desliza para a sua contrapartida fria. Com desgaste alto, a luz de casa tremula como um tubo de escritório. O jogador sente a mudança antes de entender por quê.

No mapa da cidade, todo frio, existe **um único ponto quente**: a casinha "SUA CASA", com o brilho da lâmpada.

## Resolução e escalas

| Elemento | Tamanho nativo | Exibição |
|---|---|---|
| Cenas (casa, central, rua…) e vinhetas de final | 320×180 | ×4 (1280×720), `image-rendering: pixelated` |
| Mapa de Santa Aurora | 64×40 tiles; tile 8 → 512×320 | escala inteira |
| Retratos de diálogo (busto) | 64×64 | ×1, ×2 ou ×3 (64/128/192 px) |
| Rosto de paciente (videochamada) | 64×64, fundo transparente | dentro do quadro 128×96 do celular |
| Ícones de interface | 16×16 | ×2 (padrão) |
| Ícones de status da família | 12×12 (centrados em 16×16 via `icon()`) | ×2 |
| Corpo inteiro (família) | adulto 16×32 · Liam 12×24 · Dona Zélia 14×29 | dentro da cena |
| Ozzy, o lulu da família | sentado 16×13 · deitado 19×11 · dormindo 16×10 · correndo/latindo 19×10 (+contorno) | dentro da cena |
| Adesivos do Ozzy | 30×28 (borda branca de vinil) | ×2/×3 no quadro de cortiça |
| Fotos de jornal | 144×96 (retícula tinta-sobre-papel) | ×2 (recorte 96×64 nos dias de página cheia) |

Regra de ouro: **sempre escala inteira, nunca suavização**. As funções desenham em pixels nativos; a UI amplia com CSS.

## Paletas

### Central (trabalho, fluorescente)

| | | | | | |
|---|---|---|---|---|---|
| bg0 `#0d1311` | bg1 `#16201c` | bg2 `#1f2c27` | panel `#26352f` | panel2 `#2f4139` | line `#3d5248` |
| mid `#5f7a6c` | soft `#8fa89a` | pale `#c4d4c0` | light `#e6efd9` | paper `#efe6cf` | ink `#1b1a17` |
| red `#e0483d` | amber `#e8a33d` | green `#7fd17a` | blue `#5aa7d6` | samu `#f07a2a` | postit `#f2d45c` |

### Casa (incandescente) → contrapartida fria

| Casa | | vira (Desgaste 100) |
|---|---|---|
| bg0 `#140d08` · bg1 `#24170e` · bg2 `#3a2516` | → | bg0 · bg1 · bg2 da Central |
| wood `#5a3a22` · wood2 `#7a5030` | → | panel · panel2 |
| tan `#a8763f` | → | `#6f8a7b` |
| lamp `#f2c46b` · lampLight `#ffe2a3` | → | pale · light (a lâmpada vira tubo) |
| wall `#c99a5e` · wall2 `#b5844c` | → | soft · `#779182` |
| fabricRed `#a8413a` · fabricBlue `#3f5f8a` | → | `#55695d` · `#41595e` |
| plant `#5f8a4a` | → | mid |

### Triagem, pele e cabelo

- **Triagem:** vermelho `#d94436` · amarelo `#e8b931` · verde `#4fae5b` · azul `#4a8fd0`.
- **Pele:** `#f1c7a5` `#d9a57e` `#b97b52` `#8d5634` `#5e3a22`.
- **Cabelo:** `#1c1410` `#3b2516` `#6b4a2e` `#bdbdb5` `#e8e4dc`.
- **Status de viatura (ponto no mapa):** QRV verde · DESLOC âmbar · LOCAL vermelho · TRANSP azul · RETIDO roxo `#a477d6` · RETORNO pálido · PANE/FORA cinza.

### Como o Desgaste mistura as cores

`blendHome(t)` devolve a paleta da casa já misturada (cada cor andando em linha reta até a sua contrapartida). Para todo o resto — pele, objetos, sombras derivadas — `gradeHome(hex, t)` faz uma **transferência por âncoras**: as 13 cores da casa (mais os tons de pele e os neutros) são âncoras com destino conhecido, e qualquer outra cor segue o deslocamento das âncoras mais próximas (interpolação de Shepard). Cores muito saturadas (alertas, giz de cera) só perdem parte da cor, para a informação continuar legível. A gradação é aplicada pelo próprio buffer (`Pix.setMap(homeGrader(t))`), então nenhuma cena precisa pensar nisso. **A pele é a exceção**: tons vizinhos de pele escura caíam em âncoras diferentes (madeira, couro) e a pele ficava em placas verde-cinza; agora a pele dos retratos (máscara das partes rosto/orelha/pescoço) e dos sprites (`markSkinTones`) passa por `gradeSkin`, uma transformação contínua que tira cor e puxa para um cinza-esverdeado pálido por igual, em qualquer tom. Ícones de status sobre a cabeça da família **não** são gradados.

## Tipografia

- **VT323** — texto corrido, terminal, transcrição de ligações.
- **Pixelify Sans** — rótulos e títulos de interface.
- **Jacquard 24** — manchetes de jornal e o título do jogo.
- **Fonte bitmap 3×5 (versalete)** — dentro da arte: nomes de bairro e de rua no mapa, placas ("SILÊNCIO", "UTI", "40"), o crachá, o "94" do painel. Tem acentos do português (Á À Â Ã É Ê Í Ó Ô Õ Ú Ç) e é sempre nítida porque é desenhada pixel a pixel (`drawText`). O "2" tem topo redondo para não virar "Z".
- **Conserto de legibilidade** (`fontFix.ts`): na Pixelify pequena o "5" parece "S", o "Z" e o "2" parecem "8", o "B" parece "8"; na Jacquard o "A" parece "X". A arte gera em código duas fontes TrueType minúsculas só com esses glifos redesenhados em pixel — `'QAP Pixelify Fix'` (5 2 Z z B, pesos 400 e 600, mesma grade e métricas da Pixelify) e `'QAP Jacquard Fix'` (A Á À Â Ã) — e as registra com `installFontFixes()`. Basta pôr a família de conserto antes da original na pilha do CSS (`--f-ui`, `--f-mast`); o resto dos caracteres cai na fonte original.

## Personagens

Retratos 64×64 paramétricos (busto: cabeça ~60% da altura, pescoço e ombros), gerados em `portraits.ts` sobre o kit `portraitKit.ts`. Cada personagem combina formato do rosto, pele (rampa `SKIN`), cabelo, olhos, sobrancelhas, nariz, boca, barba, óculos, chapéu, roupa e acessórios, com 7 humores: `neutro`, `feliz`, `triste`, `bravo`, `preocupado`, `surpreso`, `cansado`. Quem carrega o humor são as sobrancelhas e as pálpebras, com toques de bochecha corada, lágrima, gota de suor e olheira.

Como são desenhados:
- **Uma luz só, de cima-esquerda.** Cada material (pele, cabelo, cada tecido) tem uma rampa de 5 tons (fundo, sombra, base, luz, brilho) com desvio de matiz em OKLCH: sombra puxando para o violeta (na pele, para o vermelho-rosado) e luz para o amarelo quente.
- **Planos do rosto:** frente quase lisa, lados que viram rápido, testa inclinada para cima, queixo e mandíbula para baixo; a sombra lateral é curva (meia-lua), não uma coluna reta. Por cima vêm toques desenhados: órbitas, maçã do rosto, ponta do nariz, sombra sob o lábio, luz no queixo.
- **Olhos:** linha da pálpebra, esclera (mais escura sob a pálpebra), íris colorida com parte de cima na sombra, pupila e 1 px de brilho sempre em cima-esquerda; cílios nas mulheres; pálpebra pesada e olheira no cansaço.
- **Cabelo:** liso em mechas com fios finos e anel de brilho quebrado; cachos e crespo em células (cada cacho é uma pequena esfera com sulco escuro embaixo-direita), silhueta recortada.
- **Contorno seletivo:** cor escura tingida pelo material vizinho, mais clara do lado da luz; luz de recorte do ambiente na borda direita; o cabelo e o chapéu fazem sombra na testa.
- **Fundo suave e de baixo contraste** por ambiente (casa, central, noite, rua, escritório, hospital, escola), com vinheta, para o personagem saltar. Nenhum texto dentro do retrato.
- O Desgaste (`blend`) continua esfriando a imagem inteira (`homeGrader`); retratos ficam em cache por personagem, humor e passo de desgaste. Para fotos pequenas (o crachá) existe `portraitThumbPix` (redução 2:1 que preserva traços escuros).

**Rostos de paciente** (`faces.ts`, `patientFacePix(spec)`): close 64×64 para a videochamada, com aparência (rosto, cabelo, roupa, íris) pela seed e sinais clínicos legíveis de relance: palidez, cianose (lábios e contorno da boca azul-arroxeados), rubor, icterícia (pele e esclera amarelas), acinzentado, suor, olhos fechados/semicerrados/revirados, desvio de rima (lado do paciente), hematoma em volta do olho, inchaço de lábios e pálpebras, sangue (couro cabeludo/nariz), espuma na boca e petéquias.

- **Você** — Dr. Thiago Moura (cabelo curto escuro, barba por fazer, olheiras, pijama cirúrgico verde em V) ou Dra. Camille Moura (coque baixo, mesmo pijama). O jogador pode renomear: a arte recebe o primeiro nome por parâmetro (crachá desenhado: `EndingOpts.name`; rótulo: `characterName('EU_F', nome)`); sem nome, valem os padrões de `names.ts` (Thiago/Camille, sobrenome Moura).
- **Lúcia** — a esposa (com o Thiago): asiática de pele clara (`#f3d3b5`, marfim levemente dourado), cabelo preto liso e comprido com risca no meio caindo à frente dos ombros, olhos amendoados (formato `almond` em `EYE_SHAPES`: abertura mais baixa, canto externo puxado para cima), nariz pequeno, sobrancelha fina, brinquinhos, blusa vermelha e a fita métrica de costureira no pescoço. No corpo inteiro, o penteado `straight_long` (cortinas lisas até o peito).
- **Alex** — o marido (com a Camille), no mesmo papel da Lúcia (costureiro, fita métrica, camisa vermelha de botão): branco (`SKIN[0]`), ~37 anos, cabelo preto curto e liso com uma onda caindo na testa (`wavy`; no corpo, `wavy_m`), olhos azul-acinzentados, sobrancelha marcada e só uma sombra de barba (`facial: 'shadow'`). Retrato e sprite `ALEX`; no conteúdo ele fala como `LUCIA`.
- **Liam** — 8 anos, branco (`SKIN[0]`), cabelo castanho-escuro liso em cuia com franja (`kid_straight`), olhos grandes, camiseta listrada azul e creme, bochechas coradas (id interno `DAVI`).
- **Ozzy** — o lulu da pomerânia laranja da família (`dog.ts`): bola de pelo laranja, juba creme, orelhinhas em pé, rabo de pluma enrolado sobre as costas, olhinhos e focinho pretos. Poses `sentado` (abana o rabo), `deitado` (respira), `dormindo` (enrolado), `brincando` (pula atrás da bolinha azul), `correndo` (galope de lado em 4 quadros), `latindo` (em pé, "au! au!" com balão **AU!**) e `deitando` (esfinge de olhos pesados, entre o deitado e o dormindo). Fica no chão de cada cômodo da casa (cozinha, sala, quarto, varanda da porta), com a gradação do Desgaste. **Brincar com o Ozzy**: ele dá voltas correndo pela sala, para e late em cada canto, depois deita no tapete vermelho e pega no sono com "z z z" subindo (`SceneOpts.ozzyPlay` = ms desde o começo; `ozzyPlayAt(ms)` dá a posição e o quadro). Nunca aparece triste, doente ou machucado; nas vinhetas tristes ele simplesmente não está. **Adesivos** para o quadro de cortiça (`stickers.ts`, recorte de vinil com borda branca): feliz, dormindo, latindo, com coração, de chapéu de festa e de sirene.
- **Dona Zélia** — coque grisalho, óculos redondos, blusa florida, humor ácido no canto da boca.
- **Simone** — ruivo curtinho, fone de TARM, batom vermelho, óculos de leitura na corrente.
- **Peixoto** — calvo, bigode, camisa social de manga curta, gravata e crachá da Saúde+ Gestão.
- **Dr. Henrique** — cabelo bagunçado, barba cerrada, olheiras, jaleco aberto.
- **Seu Bene** — bigode branco, boné e uniforme laranja da ambulância com faixa refletiva.
- **Carla** — chanel assimétrico, caneta atrás da orelha, bloquinho.
- **Vereador Arlindo** — grisalho penteado para trás, terno, alfinete de gravata dourado, sorriso de canto.
- **Assessor**, **Dona Cida**, **Seu Jairo**, **Biel**, **Seu Nogueira**, **Juliana**, **Seu Antônio**, **Rosângela**, **Wesley**, **Tia Márcia**, **Dra. Paula**, **Plantonista** — cada um com silhueta própria (boné virado, chapéu de pescador, capacete de motoboy, touca cirúrgica com máscara no queixo…).

A família também existe de corpo inteiro (em pé, sentado, deitado), respira (1 px), pisca e reage ao estado: com **frio** treme e ganha xale; **doente** e **crítico** empalidecem; **triste** baixa a cabeça. O ícone do estado flutua sobre a cabeça.

## Cenários (320×180)

Vista 3/4 de "casa de bonecas": parede ao fundo, piso visto de cima, gente pequena num cômodo grande. Treze cenários: `cozinha`, `sala`, `quarto`, `porta`, `escola`, `central`, `rua`, `hospital`, `calcada`, `escritorio`, `igreja`, `mesa` (close da mesa do regulador, tudo ×2) e `preto`.

Os detalhes que fazem a casa ser *esta* casa: piso vermelhão, azulejo com friso azul, filtro de barro, garrafa térmica vermelha, toalha xadrez, tapete de retalhos, botijão, relógio sempre atrasado, o bordado "LAR DOCE LAR" do ateliê de costura, a casa azul de muro baixo com o número 40, calçada de pedra portuguesa.

Objetos inspecionáveis (cada um com retângulo clicável por cenário, em `objectRect(bg, id)`): `geladeira_quebrada`, `geladeira_ok`, `isopor`, `maquina`, `desenhos`, `cracha`, `prato_seco`, `xicara`, `lata_acucar`, `suco_escondido`, `insulina`, `meia_mancha`, `sapato_fechado`, `bolsa_passagem`, `roupa_varal`, `cartao_maquina`, `desenho_raiva`, `bolo`, `vela`, `goteira`, `balde`, `envelope`, `alianca`, `bombinha`, `mesa_vazia`, `moveis_calcada`, `cadeira_vazia`, `flores`, `carta`.

## Mapa de Santa Aurora

Quadras escuras com telhadinhos que mudam por bairro (galpões ondulados no Distrito Industrial, prédios com fachada iluminada no Centro, piscinas raras na Bela Vista, casinhas apertadas na Vila Esperança), ruas claras com calçada, avenidas com faixa tracejada, o rio com brilho animado, parques com árvores, marcos com ícones 7×7, nomes de bairro em versalete com desvio de colisão. Alagamento do dia 17: ruas intransitáveis hachuradas em azul, ruas lentas em azul claro, quadras da baixada molhadas, chuva fina. Viaturas são ambulâncias de 9 px (faixa vermelha = USA, laranja = USB) com ponto de status, sirene piscando em deslocamento e cantoneiras âmbar na selecionada.

## Finais e título

Vinhetas 320×180: `desenho_davi` (giz de cera: você à mesa com o telefone, casinhas com a luz acesa em volta, fios pontilhados até elas; faixa de cima livre para o título escrito pela UI), `desenho_cadeira` (você atrás de uma mesa enorme, sem telefone, "94" na parede), `cracha_prego` (o nome do jogador desenhado no crachá: `EndingOpts.name`, até 2 linhas, corta com ponto se não couber), `calcada_moveis` (agora com o Desgaste), `telefone_escuro`, `gaveta`, `quarto_alugado`, `escritorio_ar`, `mural` (8 molduras vazias; os retângulos estão em `MURAL_FRAMES`), `bolo_porta` (com o Ozzy abanando o rabo; no `desenho_davi` ele é de giz de cera, os dois do final bom; a `calcada_moveis` mostra a Lúcia ou o Alex conforme o gênero) e `titulo` (a mesa da regulação à noite: tubo fluorescente, monitor com o mapa, telefone com a linha piscando — e o único calor da cena, o porta-retrato da família).

## Fotos de jornal

34 composições de 144×96 (a página mostra ×2; nos dias de página cheia, um recorte de 96×64 escolhido para cada foto): as 19 genéricas (`ambulancia`, `hospital`, `multidao`, `chuva`, `retrato`, `casa`, `predio`, `policia`, `parque`, `calor`, `abelhas`, `fogo`, `escola`, `tribunal`, `enchente`, `show`, `camara`, `central`, `generico`) e 15 feitas para manchetes (`coletiva`, `rua`, `bar`, `garagem`, `vip`, `dengue`, `fumace`, `veneno`, `cronometro`, `grade`, `planilha`, `anonimo`, `condutor`, `corredor`, `poltrona`). Cada uma tem um assunto só, com primeiro plano e fundo, em valores de foto de flash (claro sobre escuro ou escuro sobre claro), impressas em retícula ordenada limpa, sem grão nem desfoque, de tinta `#1b1a17` sobre papel `#efe6cf`. As peças reaproveitáveis (gente, ambulância com "REGULAÇÃO", viatura da PM, árvores) estão em `newsPhotoKit.ts`.

## Usando no código

```ts
import { portrait, icon, drawCityMap, tileFromPixel, drawScene, objectRect, newsPhoto, drawEnding, blendHome, cssVars } from './art';

portrait('LUCIA', 'preocupado', { blend: desgaste / 100 });     // dataURL 64×64 (a UI mostra a 64/128/192 px)
characterName('EU_F', nomeEscolhido);                            // "Dra. Ana Moura" (padrão: Camille/Thiago)
patientFacePix({ seed, age: 'adulto', sex: 'F', state: 'cianose' }); // Pix 64×64 transparente
icon('phone_ring', 2);  icon('fome');                            // dataURL 32×32
drawCityMap(ctx, { tile: 8, t: performance.now(), flood, showLabels: true, units, routes, markers, highlightStreet, hoverTile });
drawScene(ctx, { bg: 'cozinha', blend, objects: ['cracha', 'geladeira_quebrada'], cast, ozzy: 'sentado', time }); // cast: { id: 'ALEX' | 'LUCIA' | 'DAVI' | 'ZELIA' | …, pose, x }
drawScene(ctx, { bg: 'sala', blend, objects, cast, ozzyPlay: agora - inicioDaBrincadeira, time }); // Ozzy corre, late e dorme no tapete
const f = ozzyPlayAt(ms);                                        // { x, y, pose, flip, frame, phase, bark, done, t } — f.bark vira true no "au!"
drawDog(pix, x, y, 'brincando', time, { map, flip });          // o Ozzy num Pix qualquer: centro em x, patas na linha y
ozzySticker('festa', 3);                                         // adesivo do Ozzy (dataURL 90×84); OZZY_STICKERS lista os 6
newsPhoto('enchente', { crop: false });                           // dataURL 144×96 (ou recorte 96×64)
drawEnding(ctx, 'cracha_prego', { time, gender: 'F', blend: 0, name: nomeEscolhido }); // o nome vai desenhado no crachá
await installFontFixes();                                        // fontes de conserto (5/2/Z/B da Pixelify, A da Jacquard)
const vars = cssVars(blendHome(desgaste / 100), 'home');           // { '--home-wall': '#…' }
```

`renderScene`, `renderCityMap` e `renderEnding` devolvem um `Pix` novo a cada chamada (pode ser guardado); `drawScene`/`drawCityMap`/`drawEnding` reutilizam um buffer interno e são os que a UI deve chamar a cada quadro.

Todos os módulos são seguros para importar em Node (testes): nada acessa o DOM no topo; funções que devolvem dataURL retornam `''` fora do navegador e as `render*()` devolvem um `Pix` puro. Canvases e dataURLs são criados sob demanda e guardados em cache.

## Regras para quem for desenhar mais

1. Só cores das paletas acima (ou derivadas com `shade`/`mix`); acentos saturados só para informação.
2. Contorno escuro de 1 px em tudo que precisa ser lido sobre fundo escuro (ícones, retratos, viaturas).
3. Luz vem de cima-esquerda; sombra em faixas, nunca degradê contínuo. Para transição, *dithering* ordenado (`Pix.dith`, `vgrad`, `glow`).
4. Desenhe em pixels nativos e deixe a ampliação para o CSS. Nada de rotação ou escala fracionária.
5. Na casa, desenhe com as cores quentes e deixe `setMap(homeGrader(blend))` cuidar do Desgaste.
6. Visualize tudo na galeria (`npx vite` e abra `/tools/art-gallery.html`).
