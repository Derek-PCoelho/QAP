# Intervenção: o plantão extra na ambulância

Entre dois plantões da Regulação, a folga oferece três caminhos: descansar, ficar com a família ou pegar um **meio plantão noturno na USA 01** (19h à 1h), com o Seu Bené no volante e o Enf. Márcio atrás. É o antigo "bico na UPA", agora jogável: o jogador sai da cadeira de regulador e vai para a rua, onde vê e mede tudo o que a Regulação nunca vê.

A troca é a mesma de sempre no jogo: dinheiro contra tempo com a família e cansaço. Com o salário fixo de R$ 160 por plantão e contas de cerca de R$ 280 por noite, quem regula bem fecha o mês no azul; quem erra muito ou recusa o envelope do vereador precisa escolher entre a ambulância e a família.

| | Descansar | Família | Intervenção |
|---|---|---|---|
| Dinheiro | — | — | R$ 140 fixos + R$ 25 por paciente estável no hospital certo (R$ 10 se chegou vivo mas instável ou no destino errado) |
| Desgaste | −15 | −10 | +15 (+4 por óbito, +6 se a equipe se ferir); com desgaste 80 ou mais, o Bené não deixa você subir |
| Laços | — | +1 (ou o bônus do dia) | o evento do dia acontece sem você (efeito `onBico` do dia) |
| Plantão seguinte | normal | normal | **dormiu três horas**: três cochilos ao longo do dia |

## 1. Como se joga

Três ocorrências por noite (o trote nunca é a primeira). Cada uma passa por:

1. **Rádio.** A Regulação despacha a USA 01 com QRR, QTH e o que quem ligou disse. "QSL, a caminho (QTY)" leva à cena.
2. **Cena, em tempo real.** A cena é desenhada pelo mesmo gerador do videoatendimento, sem as limitações da câmera do celular. O **estado do paciente** cai a cada segundo depois de alguns segundos de leitura (6 s no padrão). Cada ação leva de 2 a 10 segundos da equipe e só uma acontece por vez.
   - **Crítica**: o que salva. Cada crítica feita reduz a velocidade da piora; com todas feitas, o paciente está estabilizado.
   - **Achado**: mede ou examina; liga sinais no monitor (PA, FC, FR, SpO₂, glicemia, temperatura, Glasgow, ritmo) e às vezes revela uma ação nova (a descompressão só aparece depois de auscultar).
   - **Ajuda**: melhora, mas não decide.
   - **Neutra**: gasta tempo (oxigênio com saturação normal, antialérgico sozinho na anafilaxia).
   - **Dano**: piora (nitrato no infarto inferior, AAS no AVC, colher na boca na convulsão, puxar a cabeça do bebê).
   - Pré-requisitos aparecem no botão ("Antes: Acesso venoso").
3. **Destino.** Regional, UPA Norte, Maternidade ou liberar no local. Levar antes de estabilizar é possível (e às vezes certo: no trauma e no AVC o tratamento definitivo é no hospital; depois do essencial, a piora continua mais lenta e vale chegar rápido). Destino que não resolve rebaixa o desfecho ("vai precisar de transferência"). No transporte não há os segundos de leitura: a piora conta desde o começo.
   - **Parada cardíaca** (`treatOnScene`): o pulso volta na cena, não na ambulância. Sair antes de estabilizar é óbito no caminho.
   - **Liberar no local** só resolve onde o caso aceita. Quem precisava de hospital e não foi estabilizado não resiste em casa; estabilizado, fica "vivo, instável".
4. **Resultado.** Desfecho, destino, tempo na cena, pagamento, o que era o caso e o que importava, com o protocolo de referência.

**Cena insegura** (Bar do Neno): a equipe só entra depois de esperar a PM a uma quadra. Entrar antes fere a equipe e encerra a ocorrência.

**Trote** (Praça da Matriz): não há vítima. A ocorrência só gasta tempo e uma vaga da noite; avisar a Regulação ("QTH sem vítima, QRU") encerra.

Atalhos: teclas 1 a 9 para as ações; Enter no rádio. Esc pausa.

## 2. A noite seguinte: dormir três horas

Noites seguidas pioram: a segunda noite seguida custa +5 de desgaste a mais (a terceira, +10…), e o plantão do dia seguinte tem 5 cochilos depois da segunda noite seguida e 7 a partir da terceira, com menos tempo para reagir (6, 5 e 4 minutos de jogo) e café mais curto (2 h, 1 h 30, 1 h). Uma noite em casa zera a conta. Cada noite na 01 também soma 1 de Intimidade com o Bené, e quem já fez plantão com ele é recebido de outro jeito na visita do dia 4.

No plantão seguinte da Regulação aparece o selo **DORMIU 3 H** e três cochilos acontecem em horários sorteados (por volta das 9h, 12h30 e 16h). A tela escurece devagar, como pálpebras fechando:

- clicar ou apertar qualquer tecla a tempo custa **1 minuto** (uma piscada longa);
- não reagir em 6 minutos de jogo custa **4 minutos** (cochilou na mesa).

O café segura os cochilos por duas horas, mas continua cobrando em casa (você chega irritado).

## 3. Conexões com a história

- **Dia 10.** Se o cônjuge (a Lúcia ou o Alex) estiver em casa, o rádio despacha a USB 03 para a **Rua das Acácias, 40**: a sua casa. Quem regula é o Dr. Henrique, com a voz arrastada. O Bené pergunta se não é o seu endereço; a USA 01 não pode largar o paciente que está atendendo. No fim da noite você encontra a Dona Zélia na observação do Regional.
- As cenas de "bico" de cada dia continuam valendo: o que acontece em casa enquanto você está na ambulância (o bolo com a vela torta, a redação do Liam, o envelope do vereador).
- O Bené é o mesmo condutor que fala com você no rádio da Regulação ("Dezoito anos de ambulância").
- Conquistas: **Dobra** (fazer uma noite), **Noite Limpa** (todos estáveis e no hospital certo), **Equipe Inteira** (esperar a PM no Bar do Neno).

## 4. Para quem escreve casos

Os casos ficam em `src/content/field.ts`; o motor em `src/engine/field.ts`; a tela em `src/client/screens/home/Intervencao.tsx`.

```ts
{
  id: 'avc',
  title: 'AVC dentro da janela',
  qrr: 3,
  radio: '{unit}, QRR 3. QTH Rua dos Ipês, 410, Jardim Norte. Mulher, 67, ...',
  addr: { rua: 'Rua dos Ipês', n: 410, bairro: 'Jardim Norte' },
  scene: { place: 'sala', light: 'noite', patient: { pose: 'sentado', age: 'idoso', sex: 'F', signs: ['face_torta', 'braco_caido'] } },
  see: ['Primeira impressão, linha por linha.'],
  vitals: { pa: '178x96', fc: '88', glic: '104' },      // o que o monitor mostra quando medido
  vitalsAfter: { },                                     // opcional: depois de estabilizado
  start: 80, decay: 0.6,                                // estabilidade inicial e piora por segundo
  scoop: true,                                          // tratamento definitivo é no hospital
  // treatOnScene: true,                                // parada: sair sem estabilizar é óbito no caminho
  actions: [
    { id: 'glicemia', label: 'Glicemia capilar', group: 'neuro', cost: 3, kind: 'critico', shows: ['glic'], say: 'Glicemia 104.' },
    { id: 'aas', label: 'AAS 300 mg', group: 'med', cost: 3, kind: 'dano', delta: -18, say: 'Por que piora.' },
    // needs: ['acesso'] = pré-requisito · after: ['auscultar'] = só aparece depois · until: ['x'] = some depois
  ],
  dest: ['REG'],
  debrief: 'O que era e o que importava.',
  source: 'SAV AC21 · AP29',
  crew: ['BENÉ: fala que aparece durante a cena.'],
}
```

Regras de escrita: nada de "SAMU" nem "192"; doses só onde a fonte é padronizada; cada dano explica por que piora; o caso precisa fechar jogando "de livro" (o teste `tests/field.test.ts` joga todos assim e exige paciente estável no destino ideal).

## 5. Os 14 casos

| Caso | O que salva | Armadilha | Fonte |
|---|---|---|---|
| Infarto inferior com pressão baixa | ECG, AAS, acesso, Regional | nitrato | SAV AC17 |
| Parada em fibrilação ventricular | compressões, monitor, choque, adrenalina | intubar antes, pausar para o pulso | SAV AC5–AC8 |
| Hipoglicemia ("bêbado") | glicemia, acesso, glicose 50% | deixar com a PM | SAV AC29 |
| AVC dentro da janela | glicemia, hora do início, Cincinnati, Regional | AAS, baixar a PA, UPA | SAV AC21 |
| Asma grave em criança | oxímetro, O₂, broncodilatador | água destilada, deitar | SAV AC22, APed19 |
| Anafilaxia com choque | adrenalina IM, deitar com pernas elevadas, O₂ | sentar, adrenalina IV em bolus | SAV AC33 |
| Hemorragia na coxa (moto) | torniquete, cervical, O₂ | soro aberto, recolocar o osso | SAV AT21, AP19 |
| Pneumotórax hipertensivo | retirada, descompressão, O₂ | intubar antes de descomprimir | SAV AT12 |
| Parto iminente | avaliar, kit, amparar, aquecer, clampear | puxar a cabeça, segurar o parto | SAV AGO2, AGO4 |
| Crise que não para | proteger, O₂, glicemia, diazepam | colher na boca, segurar | SAV AC26 |
| Facada, cena insegura | esperar a PM, compressão, O₂, acesso | entrar antes | PE1, SAV AT1 |
| Trote na praça | avisar QTH sem vítima | procurar à toa | RM1 |
| Afogamento em criança | lateral, O₂, aquecer, hospital | apertar a barriga, liberar | SBV BPed26 |
| Inseticida agrícola | EPI, descontaminar, O₂, atropina | provocar vômito | SAV ATox8 |

Todos precisam da validação da equipe médica (ver `docs/VALIDAR_MEDICO.md`).
