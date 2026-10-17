# 08 — Análise de cada imagem (galeria de arte + telas do jogo)

Pasta das capturas: `/tmp/claude-0/-home-user/6e7d3fa3-585b-5285-8990-503647078a43/scratchpad/estudo/img/`
(todos os nomes abaixo são relativos a ela). Vite 6.4 em :5392, Chromium headless do Playwright, 1280×720 no jogo, 1600 px de largura na galeria.

Como cheguei nas telas: a galeria foi fotografada por seção (`gal-NN-<id>.png`), e as seções largas foram cortadas em painéis/mosaicos (`-p0..p2`, `-stack`, `-00..-11`) para enxergar o pixel. No jogo: menu e nova campanha clicando; plantão do dia 1 jogado à mão (Dona Cida); casa, Intervenção e fim de jogo carregando um estado novo pelo `window.__store` (`Game.load` com `phase:'casa'`); relatório, jornais dos dias 8 e 17, mesa do dia 17 e o final pelo bot `playBot` (perfil oráculo/experiente) rodando dentro da página.

**Total visto com a ferramenta Read: 97 imagens** (≈ 45 da galeria/recortes, 49 do jogo, 3 ícones), cobrindo ≈ 400 desenhos individuais (168 retratos × humor, 59 ícones, 2 mapas, 13 cenários × 2–3 variantes, 34 fotos de jornal, 11 vinhetas, Ozzy, ~200 quadros de vídeo).

---

## 1. Resumo para o dono (o que importa)

1. **A família NÃO segue as decisões do HANDOFF.** Em todos os lugares (retratos 64×64, sprites de corpo, cenas da casa, finais, game over):
   - **Lúcia** = negra, pele marrom escura (SKIN[3] `#8d5634`), cachos volumosos pretos, argolas douradas, blusa vermelha, fita métrica. Decisão: *asiática de pele clara, bonita* → **não atende** (nem a pele, nem o cabelo, nem os traços — `nose:'broad', lips:'full'`).
   - **Alex** = negro, pele marrom escura (SKIN[3]), cabelo crespo curto, barba cheia, camisa vermelha, fita métrica. Decisão: *branco de cabelo preto* → **não atende** (o cabelo é preto, mas a pele e o tipo de cabelo/barba não).
   - **Liam** (id DAVI) = pardo/moreno, pele marrom média (SKIN[2] `#b97b52`), cabelo crespo preto, camiseta listrada azul/branca. Decisão: *branco* → **não atende**.
   - O `docs/ARTE.md` ainda descreve a versão antiga ("Lúcia: cachos volumosos, pele morena"; "Alex: cachos curtos, barba cheia, pele morena") — precisa ser atualizado junto.
2. **Nomes antigos dentro da arte e da interface:** "Dr. Luan Moura"/"Dra. Amber Moura" no **crachá desenhado** (vinheta `cracha_prego`), na tela **Nova campanha**, na **Campanha da Simone** e nos rótulos da galeria. O crachá é bitmap (fonte 3×5) — com a opção de renomear, o nome tem de ser desenhado a partir do texto.
3. **Desgaste alto quebra a pele escura:** na coluna "blend .8" dos retratos, os rostos de pele escura (Dra. Paula, Rosângela, Wesley, Lúcia, Alex, Seu Bene) ficam **manchados de verde-cinza em placas** (parece camuflagem/doença), porque a transferência por âncoras desloca tons vizinhos para destinos diferentes. Pele clara esfria uniforme. Se a família mudar para pele clara isso some na família, mas continua nos NPCs.
4. **Cortes de layout no jogo** (todos visíveis a 1280×720):
   - Painel de perguntas da mesa: a última fileira ("Local seguro?", "Acalmar", "Conversar um pouco…") fica **cortada atrás do botão "Pôr em espera"**.
   - Final: a caixa de texto cresce até **passar da borda de baixo**; o botão "O que aconteceu depois" fica em y=702–723 (metade fora da tela) e a caixa tampa ~60 % do desenho do Liam, inclusive a assinatura.
   - Casa: a caixa de escolha/contas/"Antes de dormir" **tampa o Ozzy, as pernas da Lúcia e a Dona Zélia** (o ARTE.md diz que a cena sobe para ninguém ficar escondido — não sobe o suficiente).
   - Mapa: rótulos sobrepostos ("USB 04USA 03", "REGIONAL" escondido sob as ambulâncias, linha de rota cortando "MATERNIDADE" e "VILA NOVA", "USA 01 USB 04" empilhados na base Centro).
   - Relatório: os furos de formulário contínuo **param no meio da folha**.
   - Post-it da Simone (tutorial) cobre o topo do mapa e, no modo Inconsistência, o título do painel.
5. **Legibilidade da fonte Pixelify Sans em tamanho pequeno:** "5" parece "S" (R$ 150 → "R$ 1S0"), "Z" parece "8/B" ("Dona Zélia" → "Dona Bélia", em todo o jogo), "2" parece "8" ("20 dias" lido como "80"), "B" de "Bem" parece "8". O texto pequeno sai borrado (antialias, sem tamanho inteiro). Jacquard 24 com "A" maiúsculo vira "X" ("A médica do telefone" → "X médica…").
6. **Coisas que o FEEDBACK manda tirar ainda aparecem na tela:** botão "Inconsistência TAB" na barra da mesa (e o modo inteiro, com faixa vermelha), "Examinar TAB" em casa (com custo "Laços −1" — a Dona Zélia reclama), "Confirmar o endereço" nas perguntas do médico, perguntas antigas (sem "Tem pulso?/Cor da pele?", sem as 4 caixas coloridas).
7. **Qualidade geral é alta**: retratos com 7 humores bem legíveis, fotos de jornal excelentes, cenas de vídeo e da Intervenção ricas e coerentes, ícones nítidos, ícone do programa limpo.

---

## 2. Galeria de arte (`/tools/art-gallery.html`)

### Retratos

| Captura | O que se vê |
|---|---|
| `gal-00-portraits-zoom.png`, `gal-00b-familia-zoom.png` | Detalhe ×4 de EU_M, EU_F, LUCIA, ALEX, DAVI, ZELIA, SIMONE. Ótimo acabamento: rampa de pele com sombra rosada, brilho no olho, contorno seletivo, fundo de casa (bege dourado com quadro e retícula) e de central (verde). Família: ver §1. |
| `gal-01-portraits-0.png` | Grupo 1, 7 humores + blend .8. **Dr. Luan Moura** (rótulo antigo): ~30 anos, pele clara-média (SKIN[1]), cabelo preto curto alto, barba por fazer, olheiras, pijama cirúrgico verde em V com caneta no bolso. **Dra. Amber Moura**: ~30, mesma pele, coque baixo preto, cílios, pijama verde. **Lúcia**: ~30–35, negra, cachos volumosos, argolas, blusa vermelha, fita métrica amarela. **Alex**: ~35, negro, crespo curto, barba cheia, camisa vermelha de botão, fita métrica. **Liam**: ~8 anos, pardo, crespo curto, olhos grandes, bochecha corada, listrado azul/branco; lágrima no "triste", gota de suor no "preocupado". **Dona Zélia**: ~65–70, pele clara, coque grisalho alto, óculos redondos, blusa roxa florida, boca de canto ácido. Humores legíveis em todos. |
| `gal-02-portraits-1.png` | **Simone** (~50, pele clara, ruivo curtinho com franja de lado, headset preto, óculos de leitura, batom vermelho, jaqueta verde-azulada). **Peixoto** (~55, calvo, bigode, camisa social azul clara, gravata vermelha, crachá). **Dr. Henrique** (~35–40, branco, cabelo castanho bagunçado, barba cerrada pontilhada, olheiras, jaleco branco aberto, camiseta preta) — a barba em pontilhado parece sujeira/pele manchada, sobretudo no blend .8 (`gal-02b-henrique-blend.png`). **Seu Bene** (~60, pardo, bigode branco, boné laranja com cruz, uniforme laranja com faixa). **Carla** (~30, branca, chanel castanho assimétrico, caneta atrás da orelha, bloquinho, jaqueta verde-oliva). **Vereador Arlindo** (~60, branco, grisalho para trás, terno azul-marinho, gravata vermelha, alfinete). |
| `gal-03-portraits-2.png` | **Assessor** (~30, óculos escuros na cabeça, terno preto). **Dona Cida** (~80, cabelo branco crespo/armado, blusa rosa). **Seu Jairo** (~55, pardo escuro, boné azul, óculos, macacão). **Biel** (~15, pardo, boné vermelho, moletom com cordão). **Seu Nogueira** (~70, chapéu-coco preto, colete marrom, grisalho). **Juliana** (~25, parda, cabelo longo castanho, blusa verde-água). Bons. |
| `gal-04-portraits-3.png`, `gal-04b-blend-zoom.png` | **Seu Antônio** (~65, chapéu de pescador bege, xadrez vermelho, óculos). **Rosângela** (~40, negra, coque alto crespo com faixa vermelha, blusa roxa). **Wesley** (~20, capacete de moto vermelho, jaqueta preta com faixas). **Tia Márcia** (~40, branca, chanel castanho, óculos roxos, cardigã mostarda, crachá). **Dra. Paula** (~35, negra, pele escura, crespo curto, jaleco). **Plantonista** (~40, touca cirúrgica azul, máscara no queixo, barba rala). **Problema:** no blend .8, Paula/Rosângela/Wesley ficam com placas verdes irregulares na pele (zoom confirma). |

### Ícones
| `gal-05a-icons-esq.png`, `gal-05b-icons-dir.png` | 43 ícones 16×16 ×3 + 9 de status 12×12 + faixa ×2. Todos nítidos, contorno escuro, leitura imediata (telefone, ambulância USA/USB, hospital H, UPA, mamadeira, base, casa, headset, escola, igreja, árvore, escudo PM, sirene, café cheio/vazio, porta-retrato, manual, quadro, diário, rádio, carimbo, alerta, nota, dinheiro, pin, lupa, relógio, coração, estrela, check, X, cadeado, som/mudo, interfone, mapa, fila, post-it, envelope, bolo, termômetro, gota, raio, porta, prato, nuvem de chuva, floco, cruz vermelha, cama). Status: bem/fome/frio/doente/triste/crítico/internado/ausente/morto — "fome" e "frio" são pequenos demais para ler sem contexto. Não há ícone/adesivo do Ozzy (o FEEDBACK pede adesivos do Ozzy no quadro). |

### Mapa
| `gal-06-map.png` | Santa Aurora 512×320 ×2: quadras escuras com telhados, ruas com calçada, avenidas tracejadas, parques com árvores, rio animado embaixo, bairros em versalete (Santa Luzia, Jardim Norte, Bela Vista, Distrito Industrial, Centro, Jardim Primavera, Vila Esperança, Vila Nova, Parque das Exposições), "SUA CASA" com halo quente à esquerda, marcos 7×7, ambulâncias com ponto de status, rotas laranja/azul, alvo vermelho "RUA SÃO JOÃO", "? RUA SATURNO?". **Sobreposições:** "REGIONAL" coberto por USA 03; rota laranja atravessa "VILA NOVA"; "USB 02" em cima de "USA 01". |
| `gal-07-map-flood.png`, `gal-07b-map-flood-zoom.png` | Alagamento do dia 17: ruas hachuradas em azul, baixada molhada. **"USB 04USA 03" colados**, rota atravessa "MAT RNIDADE" e "VILA NO A" (letras apagadas pela linha). |

### Cenários 320×180 (blend 0 / 0.8 / variante Alex)
| `gal-08-scene-cozinha-stack.png` | Cozinha: piso vermelhão, azulejo com friso azul, geladeira, filtro, garrafa térmica vermelha, fogão, máquina de costura, toalha xadrez, lâmpada no fio, relógio. Lúcia (negra, cachos) à esquerda, Liam atrás da mesa (só a cabeça/peito), Zélia sentada, Ozzy laranja, ícones de status (frio, doente). 3º painel: Alex (negro, barba). Blend .8 esfria bem. Gente muito pequena (sprite 16×32 numa sala 320 de largura). |
| `gal-09-scene-sala-stack.png` | Sala: sofá azul, janela com lua, TV de tubo, "LAR DOCE LAR", tapete de retalhos, Liam com ícone de comida, Lúcia/Alex no sofá, o protagonista em pijama verde em pé à direita, Ozzy no tapete. Boa. |
| `gal-10-scene-quarto-stack.png` | Quarto azul estrelado: cama de solteiro com Zélia deitada (ícone doente), desenhos do Liam na parede, escrivaninha, guarda-roupa, tapete verde oval, Lúcia/Alex + protagonista. Ozzy no tapete. |
| `gal-11-scene-porta-stack.png` | Porta da casa: casa azul, nº 40, janela acesa, vaso, cadeira azul, Ozzy dormindo na varanda, protagonista na porta, calçada de pedra portuguesa ondulada. Linda. |
| `gal-12-scene-escola-stack.png` | Festa da Família: palco com cortina vermelha, faixa "FESTA DA FAMÍLIA", casinhas de cenário, Liam no microfone, plateia de silhuetas, celular aceso. Ótima. |
| `gal-13-scene-central-stack.png` | Central: painel de mapa, mesas com monitores verdes, relógio "03:12", quadro de cortiça, protagonista. Blend 0 e .8 idênticos (esperado: não é casa). Vazia/estéril, poucos detalhes. |
| `gal-14-scene-rua-stack.png` | Rua à noite: casas coloridas geminadas, poste com cone de luz, carro azul, lua cheia, protagonista. Boa. |
| `gal-15-scene-hospital-stack.png` | Corredor de hospital em perspectiva, "UTI", "SILÊNCIO", maca com paciente, Lúcia/Alex sentado com ícone triste, cadeiras azuis. Boa leitura. |
| `gal-16-scene-calcada-stack.png` | Despejo: móveis na calçada (sofá, geladeira, máquina de costura, caixas, cadeiras, micro-ondas), aviso na porta 40, Liam e Lúcia/Alex. |
| `gal-17-scene-escritorio-stack.png` | Escritório da OS: telão "ÍNDICE 94", mesa enorme, persiana, planta. **O protagonista aparece em pé em cima/na frente do tampo da mesa** (pés na linha do tampo) — parece estar de pé sobre a mesa. |
| `gal-18-scene-igreja-stack.png` | Igreja: vitrais, cruz, velas, altar, tapete vermelho, bancos; Lúcia/Alex com Liam no corredor. Boa. |
| `gal-19-scene-mesa-stack.png` | Close da mesa ×2: telefone bege, crachá pendurado (rosto do protagonista), ficha com canetada azul, caneca, carimbo, porta-retrato da família, pasta verde "REG", post-its amarelo e rosa no monitor. Muito boa. |
| `gal-20-scene-preto-stack.png` | Tela preta (correto). |

### Fotos de jornal 144×96
| `gal-21-news-0.png`, `-1`, `-2` | 34 fotos em retícula tinta/papel, todas legíveis e com assunto único: ambulância "REGULAÇÃO" na farmácia, Hospital Regional/Pronto-Socorro, multidão "QUEREMOS AMBULÂNCIA", chuva com guarda-chuvas, retrato do vereador, casa com muro, prédio, polícia com fita, parque, termômetro "34 °C", abelhas, fogo, Escola Estadual, Fórum, enchente com barco, EXPO AURORA, Câmara Municipal, central com telão, igreja, coletiva "SAÚDE+ GESTÃO", garagem "BASE VILA ESPERANÇA / FORA DE SERVIÇO", VIP, rua com RCP diante da padaria, BAR DO NENO com viatura, mosquito da dengue, fumacê, veneno/SODA, cronômetro, grade/maca, corredor "SILÊNCIO", condutor "BENEDITO", planilha "USA POR PLANTÃO / CONFIDENCIAL", anônimo em contraluz, poltrona. **Ponto alto do jogo.** |

### Vinhetas de final 320×180
| `gal-22-end-desenho_davi-stack.png` | Desenho de giz do Liam: a mãe/pai ao telefone numa mesa, casinhas acesas, coração, lua, ambulância, Ozzy de giz, assinatura "LIAM". Encantador. A pessoa desenhada tem cabelo preto e pele clara (ok para Thiago/Camille). |
| `gal-23-end-desenho_cadeira-stack.png` | Desenho triste: você atrás de mesa cinza enorme, "94" verde/vermelho, ar-condicionado, casinhas cinzentas, bonequinho azul longe. Bom. |
| `gal-24-end-cracha_prego-stack.png` | Crachá pendurado num prego na porta: "REGULAÇÃO / DR. LUAN MOURA / MÉDICO / REGULADOR / MAT 0417-4" e versão "DRA. AMBER MOURA / MÉDICA / REGULADORA". **Nomes antigos desenhados.** |
| `gal-25-end-calcada_moveis-stack.png` | Despejo de perto: Lúcia (negra, cachos, blusa vermelha) e Alex (negro, barba) com Liam segurando desenho, máquina de costura, geladeira, porta 40. **Família fora da decisão.** |
| `gal-26-end-telefone_escuro.png` | Telefone tocando no escuro, mão estendida vindo da direita. A mão está "solta" (braço muito escuro, parece cortada no punho). |
| `gal-27-end-gaveta.png` | Gaveta aberta: pasta REG, livro marrom com fita, post-its, caneta; saco de papel ao lado. Boa. |
| `gal-28-end-quarto_alugado-stack.png` | Quarto alugado frio: cama, protagonista sentado, caixa "SOS"(?) na cama, janela com prédios, lixeira. O "SOS" lê como "SOS"/"505" — confuso. |
| `gal-29-end-escritorio_ar-stack.png` | Você sentado na cadeira do escritório "ÍNDICE 94", ar-condicionado. Boa. |
| `gal-30-end-mural-stack.png` | Quadro de cortiça com 8 molduras vazias e fio vermelho em zigue-zague, post-it, cartão. Bom, mas o fio vermelho lembra o Modo Inconsistência que vai sair. |
| `gal-31-end-bolo_porta-stack.png` | Seu Antônio e esposa na porta com bolo, Ozzy abanando, sol, casa. Ótima. |
| `gal-32-end-titulo.png` | Mesa à noite: janela com prédios e lua, cortiça, monitor com mapa, papéis, pasta REG, caneca, porta-retrato aceso, fone, telefone. Ótima. |

### Ozzy
| `gal-33-ozzy.png` | Lulu laranja ao lado do Liam (pardo): sentado, deitado, dormindo (bola sem cabeça visível — lê como pão/almofada), brincando com bolinha azul; versões blend .8 (bege-cinza) e "retrato" sobre tapete. Fofo e consistente. |

### Vídeo (videochamada) e Intervenção
| `gal-34-video-lugares-00/10/20/30.png` | 40 lugares × dia/noite/escuro (lanterna do celular): sala, quarto, cozinha, banheiro, quintal, escada, porta, corredor, rua, calçada, ponto de ônibus "LINHA 12", praça, feira, estacionamento, posto, bar, alagado, telhado, praia, rio, piscina, campo, chácara, obra, bar interno "FIADO AMANHÃ", loja, mercado, padaria, academia, escritório, fábrica, escola "ADIÇÃO 3+4=7", quadra, igreja, salão "FELIZ ANIVERSÁRIO", hospital "RECEPÇÃO", central, ônibus, carro. Consistentes e bem iluminados. |
| `gal-35-video-poses-00.png` | 19 poses (em pé, sentado, cadeira, curvado, debruçado, encostado, cama, deitado, caído, lateral, bruços, convulsão, ajoelhado, agachado, parto ×2, preso no carro, colo). Ótimas. |
| `gal-36-video-pessoas-00/01/10/11.png` | Bebê/criança/adolescente/adulto/idoso × M/F × tons 0–4, com o close do rosto. Tons de pele variados e corretos; rostos claros e simpáticos. "bebe F tom 0" tem um tufo único de cabelo esquisito. |
| `gal-37-video-enquadramentos-00/01.png` | Mesma cena em geral/rosto/peito/mãos/pernas/ferida/objeto/chão/ambiente/pessoas: infarto na sala, bebê com meningite (petéquias), asma grave (tiragem, lábios roxos), moto com fratura exposta, facada no bar, AVC na idosa. Clínica legível. "AVC · objeto/chão" são só um vermelho liso (vazio). |
| `gal-38-video-sinais-00/01.png` | Olhos fechados+cianose, suor, face torta, inchaço+placas, tiragem, sangue no tronco, queimadura, manchas roxas, hematoma no olho, sangue no nariz/boca, baba+olhos revirados, vômito, deformidade da perna, tremor, grávida, convulsão. Bem legível, sem excesso de sangue. |
| `gal-39-video-situacoes-00/10.png` | Tiroteio com PM, parto em casa, bebê no peito, múltiplas vítimas, carro no poste, preso no banco, RCP no ponto de ônibus, afogamento na piscina, enchente/infarto no telhado, agrotóxico na chácara, surto na calçada, mão na masseira, RCP na esteira, desmaio no culto, joelho na quadra, trote com adolescentes rindo. Muito boas. |
| `gal-40-video-campo-00/10.png` | Cenas da Intervenção (vista da equipe): IAM inferior, PCR em FV, hipoglicemia, AVC, asma criança, anafilaxia (festa), moto/coxa, pneumotórax (carro), parto, convulsão, bar faca (perto/longe), trote na praça, afogamento, agrotóxico. Boas; a vítima de afogamento e as pessoas de pé têm escala ligeiramente diferente. |

---

## 3. Telas do jogo

| Captura | O que se vê / problemas |
|---|---|
| `jogo-01-titulo.png`, `jogo-01b-titulo-nota.png` | Título: "QAP" vermelho brilhante, "emergency dispatch" em gótica, frase de efeito, botões em 2 colunas, vinheta da mesa ao fundo (cortiça, monitor-mapa, porta-retrato, caneca, fone, telefone). Bonito. "Campanha da Simone 🔒". Nota "os mesmos 20 dias" lê como "80 dias" (Pixelify). |
| `jogo-02-nova-campanha.png` | Escolha **Dr. Luan Moura / Dra. Amber Moura** (nomes antigos, sem campo para renomear), dificuldade Narrativo/Padrão/Regulador Real, ligações variáveis, aviso de conteúdo. Metade de baixo vazia. |
| `jogo-03-inicio.png` | Gazeta do dia 1: manchete "Saúde+ Gestão assume a Regulação…", foto da coletiva, notas, rodapé "Central de Regulação" e anúncio pontilhado; "Dia 1 de 20 / Primeiro Plantão / Ir para o plantão". O vinco da dobra corta as colunas (proposital), grande espaço vazio embaixo à esquerda. |
| `jogo-04-mesa-entrada.png`, `jogo-05-dlg1.png`, `jogo-07-fila.png` | Mesa escurecida com caixa de diálogo: narração com **quadro de retrato vazio** (cinza listrado) quando é o narrador; depois Simone e Henrique com retrato. Escolhas "Obrigado. Vai descansar." / "(Reparar nas mãos dele…)". |
| `jogo-08-ligacao-chegando.png` | Mesa completa: relógio vermelho 7 seg., advertências, café ×2, fila com cartão branco + post-it amarelo da Simone, tela verde da transcrição, mapa no meio (pequeno, rótulos 3×5 a ×1, difícil de ler), 8 viaturas, rádio verde, ficha de papel na prancheta, barra "Manual/Quadro/Diário/Inconsistência TAB". Post-it-tutorial da Simone cobre o canto do mapa. |
| `jogo-10-ligacao-perguntas.png`, `jogo-12-ficha-preenchida.png` | Ligação da Dona Cida: transcrição verde com faixa amarela "TARM" que **cobre a primeira linha** ("chama?" cortado), [TV alta] em itálico; perguntas em 2 colunas com custo em minutos (✓ quando feitas); **a última fileira está cortada** atrás de "Pôr em espera". Ficha: classificação em 4 cores, recurso, apoio "Polícia (190)/Bombeiros (193)", encaminhar para UBS/UPA/Regional/Maternidade/Ficar em casa. Sem "192"/"SAMU" — ok. Perguntas ainda no modelo antigo. |
| `jogo-13-carimbo.png` | Carimbo "REGULADO" vermelho torto sobre a ficha — ótimo. |
| `jogo-14-ligacao2.png` | 2ª ligação (Sueli, mãe caiu): post-it rosado na fila (o FEEDBACK quer rosa só para GO), transcrição, mesma perda da fileira de baixo. |
| `jogo-40-quadro.png` | Quadro de cortiça: um cartão "Dona Cida (79)…", campo amarelo "Escreva um post-it…", Prender/Fechar. Enorme área vazia; sem mover/remover/cor/adesivos (itens 34 do FEEDBACK). |
| `jogo-41-manual.png` | Manual p.1 em papel creme, lista de cores e recursos. Legível, texto bem grande. |
| `jogo-42-diario.png` | Diário vazio ("As páginas ainda estão em branco"), papel pautado, "Reler os nomes". |
| `jogo-43-inconsistencia.png` | Modo Inconsistência: borda vermelha na tela inteira, faixa de instrução, mapa substituído por trechos do manual, pistas destacadas em amarelo ("14 por 9", telefone, endereço). Post-it da Simone cobre o título do painel. **Modo a remover.** |
| `jogo-46-mapa-mesa-zoom.png` | Mapa da mesa recortado: rótulos 3×5 legíveis só de perto; "USA 01 USB 04" sobrepostos na base Centro. |
| `jogo-50-relatorio-d1.png` | Relatório da impressora (VT323, papel com faixas verdes): lista de pacientes, recurso, veredito, desfecho, pontos; fixo/bônus/glosa/líquido/saldo. **Os furos laterais acabam no meio da folha.** Metade direita da tela vazia. |
| `jogo-51-jornal-d8.png`, `jogo-51-jornal-d17.png` | Gazetas dos dias 8 (foto da central) e 17 (enchente, "Temporal histórico"), "Ocorrências de ontem", anúncio. Muito boas. |
| `jogo-52-mesa-d8-entrada.png`, `jogo-53-mesa-d8-fila.png`, `jogo-53-mesa-d17-fila.png` | Dia 8: painel "Saúde+ USA hoje / Custo / Índice 100 :)" no topo, 6 viaturas. Dia 17: etiqueta "ruas alagadas", rios azuis no mapa, USB 01 "Fora", rádio da Defesa Civil/COPOM. O cartão da fila aparece **semitransparente e cortado em cima** (número "(17) 9…" parcialmente fora) e o post-it rosado com texto que **vaza** do cartão ("dor no peito" cortado). |
| `jogo-20-casa-M-d4-a.png`, `jogo-21-casa-M-d4-escolha.png` | Casa (Thiago/Luan): cozinha ×4, topo com retratos Lúcia/Liam/Dona Zélia ("Bem"), saldo, "Noite do dia 4"; caixa "Como usar a folga de 36 horas?" com 3 cartões (Descansar / Ficar com a família / Plantão extra). **A caixa tampa a Lúcia da cintura para baixo e o Ozzy** (só a cabeça laranja aparece); faixa preta embaixo da cena. Família não-conforme. |
| `jogo-22-familia-00.png`, `jogo-22-familia-04.png` | Sala com a família (Lúcia negra de cachos, Liam pardo, Zélia na poltrona, Ozzy no tapete), caixa de diálogo em madeira com retrato da Lúcia e 3 respostas. Bonito; o protagonista não aparece na cena. |
| `jogo-23-examinar.png` | "Examinar TAB": borda vermelha fina, fala da Zélia "Para de me examinar, Luan…" (nome antigo), "Laços −1". Item 58 pede trocar por "reparar" sem custo. |
| `jogo-24-step-10-contas_casa.png`, `jogo-24b-contas-zoom.png` | Contas: calculadora Saldo agora/Contas marcadas/Fica, lista com riscado nas não pagas. Funciona; "R$ 150" lê "R$ 1S0", "Zélia" lê "Bélia". **O painel cobre a Dona Zélia.** |
| `jogo-24-step-11-loja_casa.png` | "Antes de dormir": máquina de costura R$ 450, bombinha R$ 80, Brincar com o Ozzy, Ler o diário, Dormir. |
| `jogo-30-casa-F-d4.png` | Mesma cozinha com o **Alex** (negro, barba) — não-conforme. |
| `jogo-31-interv-00.png` | Intervenção — rádio: Seu Bene no retrato, "USA 01, QRR 3. QTH Rua Jacarandá, 215…", etiqueta "QRR 3 · prioridade absoluta" (já certo para USA), caixa amarela de instruções, "QSL, a caminho (QTY) ▸". |
| `jogo-31-interv-01.png`, `jogo-32-interv-sinais.png` | Cena do infarto: esposa em pé, Seu Lauro (61, mas desenhado bem mais velho, grisalho) no sofá; monitor verde com ECG, PA 86×54, FC 48, **SpO2 95 %** (já aparece), log em verde, 7 ações numeradas com cores por categoria, "Levar para". "Oxigênio em máscara" ainda é a única opção de O2; não há clopidogrel (itens 46–50). |
| `jogo-33-interv-resultado.png` | Resultado "Chegou vivo, mas instável — Infarto inferior com pressão baixa", texto didático, referência SAV, "+R$ 10". Bom. |
| `jogo-34-interv-next1.png` | Parto: mulher em pé (enfermeira/acompanhante) **grande demais** em relação à cama e à parturiente; ações com pré-requisito ("Antes: …") truncadas. |
| `jogo-60-final-mosaico.png`, `jogo-60-final-07.png` | Final bom (Camille/Alex): vinheta "bolo_porta" e depois o desenho do Liam com o título escrito em azul "Minha mãe salva as pessoas pelo telefone". Caixa preta com título em Jacquard ("A médica do telefone" — o "A" parece "X"). **A caixa cresce até sair da tela, tampa o desenho e a assinatura; o botão seguinte fica cortado na borda.** |
| `jogo-61-final-depois.png` | "Depois": 10 cartões de papel com o destino de cada personagem, estatísticas "20 plantões · 60 vidas · 0 óbitos · 7 de 7 · Saldo R$ 765", Créditos/Voltar. Fundo escurecido; boa leitura. |
| `jogo-70-simone-nova.png` | "Do outro lado da linha": retrato da Simone, escolha do regulador da Mesa 1 **"Dr. Luan Moura"/"Dra. Amber Moura"** (nomes antigos). |
| `jogo-72-simone-intro-3.png` | Mesa da TARM: narração da chegada da Simone com **retrato do Peixoto exibido antes de ele falar** (narração sem retrato próprio). |
| `jogo-73-simone-mesa.png` | Mesa TARM: "Pré-triagem · TARM", pressão, cards "Mesa 1 · Dr. Moura" (retrato EU_M) e "Mesa 2 · Dr. Henrique" com descrição **truncada** ("sem tirar os ol…"). |
| `jogo-80-casa-d12-desgaste85.png`, `jogo-81-casa-d12-cena.png` | Desgaste 85: a cozinha fica cinza-esverdeada, lâmpada branca — o efeito funciona e é bonito. Plantão extra bloqueado ("O Bené olha pra você…"). Cena: "Lúcia chega… cabelo preso de um jeito que você não conhece" — o sprite não muda. Retrato do Liam na caixa. |
| `jogo-83-ozzy-brincar-*.png` | Depois de "Brincar", o Ozzy dorme enrolado no tapete da pia (como no ARTE.md). Não vi a corrida latindo pela sala (item 54). Painel "Antes de dormir" (máquina, bombinha, fisioterapia, aula de desenho, pizza) **tampa a Dona Zélia**. |
| `jogo-90-gameover-despejo.png` | Game over "despejo": vinheta calcada_moveis em tela cheia (Lúcia negra, Liam), caixa preta embaixo **vazia** e botão "Título". Obs.: o texto vazio pode ser artefato do meu teste (montei `gameOver.text=''` direto no estado, sem passar por `toGameOver`); vale conferir num game over real. |

---

## 4. Ícones do programa (`desktop/icons/`)

| Arquivo | O que se vê |
|---|---|
| `desktop/icons/icon-1024.png`, `icon.png` (512), `icon-64.png` (ampliado em `icone-64-ampliado.png`) | Quadrado arredondado verde-escuro com borda clara, giroflex vermelho/azul no topo, "QAP" em letras vermelhas grossas com sombra, ECG verde embaixo. Nítido em todos os tamanhos; no 64 px o ECG e as letras continuam legíveis. Sem problemas. (`.icns` e `.ico` não foram renderizados.) |

---

## 5. Lista de problemas visuais (para a fila de trabalho)

1. Família fora do HANDOFF (Lúcia, Alex, Liam) — `portraits.ts` (LUCIA/ALEX/DAVI: skin, style, nose, lips), sprites `figures.ts`, cenas, finais, game over; atualizar `docs/ARTE.md`.
2. Nomes Luan/Amber: crachá desenhado (`cracha_prego`, close `mesa`), Nova campanha, Simone, fala "Para de me examinar, Luan", rótulos da galeria.
3. Blend alto mancha pele escura em placas verdes (gradação por âncoras) — Paula, Rosângela, Wesley, Bene, família atual.
4. Barba pontilhada do Henrique parece pele suja.
5. Painel de perguntas: última fileira cortada.
6. Faixa TARM cobre a 1ª linha da transcrição.
7. Final: caixa de texto passa da tela, botão cortado, assinatura do Liam tampada.
8. Casa: caixas tampam Ozzy/Lúcia/Zélia.
9. Mapa: rótulos de viatura sobrepostos e rotas apagando nomes de bairro; mapa da mesa pequeno demais.
10. Relatório: furos laterais param no meio.
11. Cartão da fila nos dias 8/17: semitransparente, cortado em cima, post-it vazando.
12. Escritório: protagonista "em pé sobre a mesa".
13. Telefone_escuro: mão solta; quarto_alugado: "SOS" ambíguo; Ozzy dormindo sem cabeça visível.
14. Intervenção parto: escala da figura em pé grande demais.
15. Fonte Pixelify pequena: 5/S, Z/8, 2/8; texto borrado. Jacquard: "A" parece "X".
16. Narração sem retrato mostra quadro vazio ou o retrato de quem fala depois.
17. Ainda na tela: Inconsistência TAB, Examinar TAB (com custo), Confirmar endereço, perguntas antigas.
