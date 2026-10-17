# Notas dos protocolos de regulação do SAMU Fortaleza

Fonte: aplicativo de protocolos do NEP SAMUFor (SAMU 192 Regional Fortaleza); páginas RM0 a RM10, RC1 a RC25, RT1 a RT10, RO1 a RO2 e RP1 a RP2, lidas por inteiro. Resumo para o jogo "QAP — Emergency Dispatch" (Santa Aurora, cidade fictícia; só USA, USB e orientação por telefone). Índice das 539 páginas: `INDICE_SAMU.md`.

**Convenções**
- USA = suporte avançado (médico). USI = intermediário (enfermeiro e técnico; o jogo não tem). USB = básico. MR = médico regulador. TARM = telefonista auxiliar de regulação médica. RO = enfermeiro radioperador. OF = operador de frota.
- Cada protocolo tem três listas: **USA se**, **USI/USB se**, **Orientação se**; vale o discriminador mais alto presente (RM0). As listas são cópias fiéis, na ordem da fonte, com o rótulo da fonte (USA, USA/USI, USI/USB ou USB). Termos em *itálico* estão definidos na seção 8.
- Perguntas = as de RM3 mais as da página do protocolo (diferem em poucos itens); a pergunta genérica final "outras queixas ou doenças" foi omitida.
- Vale para todo RC, RT (menos RT3), RO e RP: roda depois que RM1 e RM2 descartam vermelho; a decisão gestora busca o serviço na Matriz de Competência do Anexo VII da Portaria 81 (ver `SAMU_GESTAO.md`) e avisa o destino; na orientação, a remoção (se necessária) é por transporte próprio.
- "(sic)" = erro da fonte que importa. Telefones, ramais e endereços foram omitidos.

---

## 1. Fluxo da ligação (RM0 a RM2)

### RM0 Acolhimento e classificação de risco
- **Os 3 "S"** (discriminadores gerais, buscados antes de tudo): forte valência social; etiologia potencialmente grave; semiologia potencialmente grave. Achou um: o MR assume na hora, guiado pelo MASTER (RM2), começa orientações por telemedicina (inclusive RCP e OVACE) e decide pelo discriminador específico mais alto do protocolo do "apelido" da ocorrência. Não achou: o TARM segue o MASTER, depois RM3, e passa ao MR atento a palavras, tom de voz, sons do ambiente e respostas.
- TARM: escuta qualificada, registra a história como dita, define queixa principal e apelido (nome do protocolo), quer o solicitante junto do paciente (para as primeiras orientações), garante endereço completo com referências. MR: registra se houve "S", o protocolo, o discriminador específico e a decisão justificada.
- **5 fases**: queixa principal; riscos imediatos; escolher o protocolo; discriminador específico mais alto; prioridade clínica. Como em Manchester: prioridade, não diagnóstico; sem discriminador, não urgente.

| Cor | Resposta (RM0) |
|---|---|
| Vermelho | máxima; APH iniciando em 10 a 15 min da decisão (RM4 diz até 10); MR em telemedicina até a equipe chegar |
| Amarelo | alta; APH iniciando em 30 min |
| Verde / azul | baixa / mínima; sem APH; orientação médica |

### RM1 Acolhimento telefônico
- Toda solicitação. Atender ao primeiro toque; nome e queixa no 1º minuto, endereço no seguinte (máximo 1 a 2 min no total).
- A fonte diz "oito fases" mas lista: 1 atender; 2 abrir a solicitação (telefone, no e-SUS SAMU); **I acolhimento** ("SAMU Fortaleza, com quem eu falo?", "qual a sua urgência?"; queixa, apelido de uma palavra, tipo e origem da ligação); **II endereço** (está no local? se não, pedir que vá ou que alguém do local ligue; endereço; fora de Fortaleza, transferir ao SAMU Ceará; avenida conhecida e pontos de referência); **III os 3 "S"**: se houver, passar ao MR ("Aguarde um momento enquanto eu transfiro a sua ligação para o médico regulador!"); se não, MASTER.
- Exemplos dos 3 "S": valência social = "Presidente da República caiu na rampa do Congresso" (a "morte" pode ser urgência mesmo com gravidade nula, havendo comoção); etiologia grave = "caiu do prédio", "baleado por uma 12", "atropelado por um Scania", "está parindo"; semiologia grave = "encontrei desmaiado", "está roxo", "não está respirando", "não está se mexendo". As primeiras palavras do solicitante costumam ser as mais fidedignas.

| Tipo de ligação (10) | Conduta do TARM |
|---|---|
| ATENDIMENTO / IMV (5 vítimas ou mais) | todas as fases |
| COBRANÇA (cobra remoção regulada) | confirma endereço; registra "pediu brevidade"; reaplica o MASTER; passa ao MR |
| DESISTÊNCIA (cancela remoção regulada) | confirma endereço; registra cancelamento e motivo; avisa OF e MR |
| QUEDA DE LIGAÇÃO | antes do item 2: encerra como TROTE; depois: marca QUEDA DE LIGAÇÃO, informa o MR e aguarda |
| TROTE | simulação, piada, xingamento, brincadeira, ou ninguém fala após insistência; desliga e registra como trote |
| REGULAÇÃO (destino, QTW, dúvida de caso regulado) | pede o nº da ocorrência e transfere ao MR |
| ENGANO | quer o SAMU Ceará: transfere; ligou errado: avisa |
| INFORMAÇÕES | endereço ou telefone de unidade: orientar o serviço de informações (número omitido); quem quer informar algo ou falar com o MR: ao MR |
| ORIENTAÇÃO | depois do item 2, ao MR ou ao enfermeiro gestor de qualidade |
| TRANSFERÊNCIA | no lugar do endereço: leito, andar, unidade e tempo de internação; ao médico coordenador |

### RM2 Protocolo MASTER
- Depois do RM1, para achar semiologia grave: **consciência** ("ele consegue falar? diz o que sente?"; se não, "bata no ombro dele e chame por ele"; "abre os olhos, mexe braços e pernas?"); **respiração** ("veja como está a respiração dele"); **circulação** ("a cor da pele está normal? quente ou fria? está sangrando? onde? quanto?"). Reconhece inconsciente, parada respiratória e PCR. Achou: passa ao MR; senão, RM3. Respostas vão para "Avaliação/Orientação". Máximo 1 a 2 min.

---

## 2. Perguntas e tempos (RM3, RM4)

### RM3 Abordagem por queixas
- Depois que RM1 e RM2 descartam vermelho, o TARM escolhe o apelido e pergunta só o que falta. É a introdução de cada protocolo clínico, de trauma, obstétrico e pediátrico, reunida: as perguntas estão em cada bloco das seções 5 a 7.

### RM4 Tempo-resposta e respostas ao solicitante
- **Tempos ideais**: 1 min de acolhimento (se estourar, avisar o MR; nunca mais de 3 min); 1 min de classificação e decisão no vermelho; 3 min nos demais; 20 s para o RO ativar; 30 s para a ambulância sair.

| Cor | Ambulância | Tempo-resposta |
|---|---|---|
| Vermelho (máxima) | USA, USI (ou USB) e motolância | até 10 min |
| Amarelo (alta) | USB (ou USI) e/ou motolância | até 30 min |
| Verde (baixa) | orientação médica | até 60 min (*) |
| Azul (mínima) | orientação médica | sem tempo |

(*) Nota da tabela: "Envio de USB em casos de valência social". Vermelho em geral: PCR, inconsciente ou alteração súbita da consciência, franca insuficiência respiratória ou circulatória, grandes hemorragias, dor intensa, alteração importante da temperatura. Amarelo em geral: dificuldade respiratória, alteração gradual da consciência ou história de inconsciência, hemorragia controlável, dor moderada.

| Situação | O que dizer e fazer |
|---|---|
| Vermelho, com recurso | "a ambulância está sendo enviada do bairro..."; telemedicina até a chegada; acompanhar o tempo-resposta |
| Vermelho, sem nenhum | "todas as nossas ambulâncias estão em atendimento, sua urgência está sendo priorizada!"; telemedicina até chegar uma; só em caso extremo e de exceção o MR permite remoção por meios próprios (menor prejuízo); ligar de volta a cada 10 min |
| Amarelo, com recurso | "a ambulância está sendo enviada do bairro..."; reavaliar por telemedicina a cada 30 min |
| Amarelo clínico ou pediátrico, sem recurso | "todas as nossas ambulâncias estão em atendimento. A orientação da regulação médica é remover o paciente e não aguardar. Caso não ocorra a remoção favor nos informar." |
| Amarelo trauma ou obstétrico, sem recurso | previsão menor que 1 h: manter em "acolhimento com classificação de risco" e reavaliar a cada 30 min; maior que 1 h, com remoção própria possível e menor prejuízo: o MR permite |
| Verde com imperativo de remoção em decúbito ou valência social | valência social: agir como amarelo; transporte sanitário (TS) disponível: transferir; sem TS: "não há indicação de transporte por ambulância; o transporte do paciente deverá ser realizado por outros meios" |
| Verde sem imperativo, ou azul | a mesma frase de "não há indicação de transporte por ambulância..."; encerrar |

- **Quando orientar meios próprios** (registro do MR): "SEM RECURSO DISPONÍVEL": "Estamos sem recursos disponíveis. Oriento remoção por meios próprios, no intuito de não atrasar atendimento médico inicial, na unidade de saúde ... Reitero, remover e não aguardar... retornar ligação caso insucesso na remoção ou mudança de quadro clínico." "SEM INDICAÇÃO TÉCNICA DE REMOÇÃO POR AMBULÂNCIAS": "Paciente sem prejuízo da consciência, sem comprometimento respiratório ou circulatório e podendo deambular. Não há também valência social."
- **Deveres do MR**: regular no tempo previsto (1 min); regular direto com o solicitante todas as de prioridade máxima; acompanhar o tempo-resposta; SEMPRE checar a disponibilidade de recursos para a área; avisar o solicitante de uma possível demora. Declaração de Lisboa: autonomia e liberdade; benefício de todos; menor prejuízo possível; justiça, igualdade e solidariedade. Na decisão registra-se o recurso ideal e o enviado (ex.: RC5, "considerado o envio de USA; melhor recurso disponível é a USI; enviado USI").
- **USI preferida a USB** (20 protocolos de SBV): BC10 insuficiência respiratória, BC11 choque, BT4 choque no trauma, BC12 dor torácica, BC13 crise hipertensiva, BC14 AVC, BC16 convulsão, BC17 hipotermia, BC19 hipoglicemia, BC23 anafilaxia, BC26 dor, BC27 cólica nefrética, BC29 agitação, BC30 autoagressão, BPed11 choque, BPed14 convulsão, BPed17 hipoglicemia, BPed18 anafilaxia, BPed19 febre, BPed22 dor. No jogo, sem USI, vira USB.

---

## 3. Passagem de caso, rádio e frota (RM5, RM6)

### RM5 Orientação das equipes pelo médico regulador
- **QTW** (quadro do paciente), nesta ordem: (1) nome, idade, documento (opcional); (2) tipo de paciente (motorista, motociclista, ciclista, passageiro, garupeiro, pedestre, gestante, idoso); (3) queixa principal; (4) consciência (orientado, confuso, torporoso, inconsciente); (5) respiração (normal, alterada, ausente); (6) pulso (normal, fraco/lento, acelerado, ausente); (7) cor da pele (corado, pálido, cianótico, ictérico); (8) PA, oximetria, FC, FR, Glasgow, temperatura, glicemia (as duas últimas e a oximetria se disponíveis), escala de trauma (se feita); (9) narrativa dos achados e condutas.
- O MR confere a avaliação primária e a secundária (pelo menos o SAMPLA), orienta e tira dúvidas pelos protocolos e toma a **decisão gestora**: a melhor unidade de saúde segundo o diagnóstico situacional da central, avisando a equipe.
- Estrutura: pacotes de condutas iniciais (SAV: AC1/AC2, AT1/AT2, AGO1/AGO2, APed1/APed2; SBV: BC1/BC2, BT1/BT2, BGO1/BGO2, BPed1/BPed2), as 20 de SIV, PE0 a PE35, MOTO1 a MOTO6, AERO1 a AERO6 (sem páginas no aplicativo) e uma tabela "protocolo de regulação, protocolos de intervenção". SAV começa com A, SBV com B; "(SIV inclusive)" marca SBV com condutas de USI.
- Orientações mais comuns: PCR adulto AC5/BC5; engasgo AC3/BC3; choque AC16/BC11; dor torácica AC17/BC12; AVC AC21/BC14; convulsão AC26/BC16; hipoglicemia AC29/BC19; anafilaxia AC33/BC23; trauma AT1 a AT26 / BT1 a BT19; parto AGO3 a AGO9 / BGO3 a BGO7.

### RM6 Radioperação e operação de frota
- **Papéis**: o OF escolhe o recurso disponível mais próximo (menor tempo-resposta). O RO aciona, supervisiona a distância (enfermagem) e cobra que a equipe, ao chegar, passe logo o quadro ao MR. A responsabilidade pelo rádio é do RO e do condutor, com corresponsabilidade da equipe e da central.
- **Passagem do caso ao veículo**, nesta ordem: (i) apelido ou queixa; (ii) endereço (bairro, rua, número, referências); (iii) ritmo de deslocamento, QRR3 ou QRR2 (a fonte não liga cor a QRR; no exemplo, uma USB recebe QRR2); (iv) resumo do MR em Avaliação/Conduta. Confirmar que a equipe copiou (QSL); rastrear o deslocamento a cada 5 min, sempre que possível.
- **Tempos registrados**: QTY início do deslocamento (em até 30 s do recebimento); QUS chegada ao local; QTW passagem do quadro (cobrar até 10 min depois do QUS; se a equipe não consegue falar, telefonar); QUR saída do local; QUY chegada à unidade regulada; QUU saída da unidade; chegada à base. **Intercorrências**: QRU problema no veículo ou pessoal; QRF descanso/refeição; nº de ocorrências por veículo; material retido nas unidades.
- **Modulação** (a fonte não marca quem fala): "Central - USB 48!" / "USB 48 de QAP!" / "QTH?"; a central calcula o trajeto no Google Maps e passa a ocorrência; "Central - USB 48! / Aqui é uma QRR2 no endereço tal... Informe quando iniciar QTY". Na saída da base: "USB 48 - Central! / Central de QAP! / USB 48 de QTY!". Linguagem padrão, voz clara e lenta. Alfabeto fonético e numerais (QRR2 diz-se "Q, R dobrado, segundo"): PE27 em `SAMU_GESTAO.md`.

---

## 4. Situações especiais (RM7 a RM10)

### RM7 PCR e óbito no APH
- PCR recente, sinais de morte evidente ou constatação de óbito. Aplicar RM1 e RM2. Se o pedido vem de autoridade pública (PM, Bombeiro, Guarda Municipal, Polícia Civil, Defesa Civil, AMC), o MR se informa do caso e das condições locais para garantir a segurança da cena.

| Situação | Conduta |
|---|---|
| Sinais de morte evidente | sem ambulância: o MR constata o óbito por telemedicina e aciona o IML (morte não natural ou suspeita) ou o SVO (morte natural) |
| Morte evidente com forte valência social | MR pode enviar USA, ou USI na falta dela |
| PCR sem sinais de morte evidente | priorizar USA; sem USA, USI ou USB, e o MR pode constatar o óbito por telemedicina |
| PCR de tempo desconhecido, ou dados insuficientes (risco de morte) | enviar USI/USB e USA |
| PCR com manifestação prévia de não reanimar (CFM 1.995/2012), ou doença terminal com consenso da família (CFM 1.805/2006) | MR pode enviar USI/USB para constatar o óbito por telemedicina |

- Médico da USA acionado em óbito não assistido: **constata obrigatoriamente, mas não atesta**; avisa o MR, que aciona SVO ou IML. Morto e desacompanhado: o MR pede à PM ou Polícia Civil a preservação da cena e do corpo.
- **Sinais de morte evidente**: rigidez cadavérica; livores de hipóstase; decapitação; esmagamento de crânio com perda de massa encefálica e ausência de pulso central; carbonização; segmentação do tronco; decomposição evidente. Pedido de constatação de óbito = o solicitante diz que o paciente está sem responder e sem respirar há **mais de 60 minutos**.
- IML = mortes não naturais (acidente, homicídio, suicídio, causas externas ignoradas). SVO = confirma a morte e a causa natural em óbitos sem assistência médica, ou com assistência mas por moléstia mal definida.
- Telemedicina na urgência (Portaria GM/MS 2.546/2011): teleassistência (MR com paciente ou solicitante, ou equipes com MR); teleconsulta; teleconferência; teleconsultoria; segunda opinião formativa.

### RM8 Remoção de pacientes de unidades de saúde
- Todo pedido de remoção de paciente que está dentro de uma unidade de saúde.
- **Só USA, e só em "vaga zero"** (agudo, de alta complexidade, para continuar tratamento já iniciado): AVC na janela (pode ir USB se a situação informada não indicar gravidade elevada); IAM com supra; trauma grave; DHEG ou eclâmpsia; intercorrência aguda potencialmente fatal ou com risco iminente de morte. Vai a ambulância disponível mais próxima da unidade de origem. Falta de recurso humano ou material não justifica transferir se o hospital tem perfil para o caso (responsabilidade da direção técnica local); só com recursos essenciais à vida esgotados, em risco iminente de morte, vai por USA à unidade de referência.
- **USA também por valência social** (inclusive pedido de autoridades ou chefias), com pedido escrito ou por ligação gravada ao 192; o CMUr 24h registra. Pedidos da CRIFor de internação de alta complexidade fora da vaga zero: possíveis se não comprometerem o atendimento primário; uma transferência por vez, nunca simultâneas.
- **Não envia ambulância**: morte encefálica e doação de órgãos; abdome agudo inflamatório (vai à Central de Regulação das Internações; a remoção é da unidade de destino); transferência inter-hospitalar de internados e permuta de UTI; média ou baixa complexidade (da unidade de origem, regulada pelo CIRF); remoção para exames. Frase: "Não temos como priorizar o seu atendimento no momento. A orientação da regulação médica é remover o paciente por outros meios."
- Regras: **não se remove paciente instável hemodinamicamente**; fora da vaga zero nenhuma transferência começa sem contato e confirmação com o médico ou hospital de destino; a CRUFor não trabalha com leitos (Portaria GM 2048/2002: anuência expressa do destino, confirmada pelo MR).
- Definições: **alta complexidade** = crítico, grave ou potencialmente grave, em risco agudo de morte, que precisa de SAV, "tempo-resposta dependente", em unidade terciária. **Vaga zero** = recurso exclusivo e responsabilidade dos MR, para doença acima da capacidade local com risco de morte ou sofrimento intenso; o MR deve falar por telefone com o médico receptor e justificar; é exceção. **AVC na janela** = Cincinnati positivo e menos de 4,5 h de sintomas (da percepção, ou da última vez visto assintomático). **IAM com supra** = supradesnivelamento de ST em duas derivações contínuas no ECG. **Trauma grave** = trauma agudo (etiologia ou semiologia potencialmente grave) em cabeça, tórax ou abdome, em paciente que chegou à unidade há menos de 40 min, ou com síndrome hemorrágica importante e piora clínica visível observada por médico, que precisa de tratamento definitivo em unidade de maior resolutividade.

### RM9 Maus-tratos a criança, adolescente ou idoso
- Casos suspeitos ou confirmados, depois de decidir entre enviar o SAMU ou só orientar (descartado o vermelho; perguntas pertinentes de RM3). Nos três primeiros grupos: notificação compulsória (da violência ou da suspeita) e apoio policial imediato da delegacia especializada.
- **Criança ou adolescente** (maus-tratos ou história discordante): o solicitante avisa o Disque Denúncia; comunicar o Conselho Tutelar, o Centro de Defesa da Criança e do Adolescente e/ou a Promotoria e o Juizado da Infância e Juventude.
- **Mulher** (violência sexual ou física, ou história discordante): Delegacia da Mulher; encaminhar à Casa da Mulher Brasileira e/ou comunicar a Promotoria do Juizado de Violência Doméstica.
- **Idoso** (maus-tratos ou história discordante): o solicitante avisa o Disque Denúncia do Alô Idoso; Delegacia do Idoso e da Pessoa com Deficiência; comunicar o Centro Integrado de Atenção e Prevenção à Violência contra a Pessoa Idosa e/ou a Promotoria do Idoso.
- **Hipervulnerável ou em situação de rua**: só demanda social, comunicar a Secretaria de Direitos Humanos e Desenvolvimento Social; com necessidade de saúde, a Coordenação Regional de Saúde e o Consultório de Rua.
- PE31 (maus-tratos) e PE32 (abuso sexual) estão vazios no aplicativo: RM9 é o único protocolo do tema. *História discordante*: seção 8. Contatos omitidos.

### RM10 Casos especiais
- Pedido administrativo (PM, BM, PC, gestores): se o solicitante fala com a CMUr 24h ou a operação de frota, ver se está com alguém no local; se sim, RM1, RM2 e RM3 e a CMUr 24h decide; se não, pedir que alguém do local ligue. Se fala com o TARM: RM1, RM2 (descartado o nível 1, RM3), passa ao MR. Toda ligação deve ser acolhida.
- Intercorrência clínico-cirúrgica em clínica de diálise: a remoção é da própria clínica (RDC ANVISA 11/2014, art. 12; descumprir é infração sanitária, art. 63). Frase: "Não temos como priorizar o seu atendimento no momento. A orientação da regulação médica é remover o paciente por outros meios."

---

## 5. Protocolos clínicos (RC1 a RC25)

### RC1 Acidente Vascular Cerebral (AVC)
- Inclusão: sintomas de AVC iniciados entre 3 e 4,5 h; início súbito de déficit neurológico focal, em especial de um lado (face, força, sensibilidade), distúrbio da fala, alteração da consciência, 1ª crise convulsiva sem crise prévia nem trauma, cefaleia súbita e intensa sem causa conhecida, alteração visual súbita, vertigem ou perda do equilíbrio, dificuldade súbita para andar.
- Perguntas: quanto tempo faz (janela de 4 h); desmaio; convulsão; boca torta; fala; dormência de um lado; AVC prévio e tratamento.
- **USA**: Glasgow abaixo de 9; convulsões (tônico-clônicas ou parcial); necessidade de suporte ventilatório.
- **USI/USB**: assimetria facial recente (ao sorrir); diminuição recente da sensibilidade ou da força de um lado (ao elevar os dois braços); dificuldade recente de articular as palavras.
- **Orientação**: outras queixas.
- Notas: janela ideal de trombólise 3 h, estendida 4 h 30 min; Cincinnati: 1 parâmetro alterado = 72% de chance de AVC, os 3 = mais de 85%; início = último momento visto sem sintomas (se acordou com sintomas, o último momento antes de dormir); crise convulsiva só é AVC com sinal focal antes ou depois, senão vale o RC7.

### RC2 Alergia
- Inclusão: coceira, edema, erupções ou vesículas na pele ou mucosas, com ou sem alteração respiratória e com ou sem história alérgica.
- Perguntas: alérgico a algo; barulho ao respirar; fala direito; língua e rosto; desmaio; lesão na pele; tratamento.
- **USA**: *paciente não reativo*; *estridor laríngeo*; *frases entrecortadas*; edema facial (difuso ou de lábios) ou de língua; *história alérgica importante*; *alteração súbita da consciência*.
- **USI/USB**: não há lista (o protocolo não traz).
- **Orientação**: dor ou coceira intensas; *erupções ou vesículas disseminadas*; inflamação local; outras queixas.

### RC3 Asma
- Inclusão: sinais e sintomas de asma previamente conhecida.
- Perguntas: costuma sentir; completa uma frase; desmaio; usou a medicação e melhorou; outro tratamento; internação prévia por asma.
- **USA**: *história respiratória significativa*; *paciente não reativo*; *frases entrecortadas*; *alteração súbita de consciência*.
- **USI/USB**: não usou medicação (sem acesso a ela); *sem melhora com a medicação habitual*.
- **Orientação**: melhorou com a medicação habitual; dispneia leve (frases não entrecortadas) e de início recente; outras queixas.

### RC4 Agitação e situação de violência
- Inclusão: hiperatividade, inquietude, angústia, irritabilidade e verborreia, ou atitude hostil, ameaçadora ou em franca agressão (física ou verbal).
- Perguntas: acompanhamento em saúde; nome da doença ou do remédio; drogas ou álcool; agressivo; agitado; fala em se matar; perdeu os sentidos; fala; falta de ar; orientado.
- **USA/USI**: *história de overdose ou envenenamento* com perda de consciência; *comportamento heteroagressivo*; *alto risco de agredir outros*; *alto risco de autoagressão* (ideação suicida).
- **USI/USB**: *agitação psicomotora* intensa (hipercinese); *comportamento ameaçador*; *risco moderado de autoagressão* (passado de autoagressão); história psiquiátrica importante; *comportamento conturbador*; *inquietação psicomotora* (acatisia).
- **Orientação**: *comportamento hostil*; expansividade; outras queixas.

### RC5 Autoagressão e risco de suicídio
- Inclusão: intenso sofrimento com desejo, impulso, ideação ou plano de autolesão (em geral dirigida à morte); autonegligência grave; desesperança ou culpa, conflitos interétnicos ou familiares, rupturas e perdas (doença grave ou terminal, luto, desemprego); pessoa em desespero em local de risco (ponte alta, viaduto, plataforma de trem/metrô, via de tráfego intenso, mar). Isolados, esses aspectos não bastam como critério de inclusão.
- Perguntas: tratamento psiquiátrico; drogas ou álcool; há quanto tempo; braços e pernas (deformidade); trauma na cabeça; sangramento (comprimir); desmaio; fala; orientado.
- **USA/USI**: *hemorragia exsanguinante*; *dispneia aguda*; *hemorragia maior incontrolável*; *alteração súbita da consciência*; *mecanismo de trauma significativo*; *alto risco de autoagressão* (ideação suicida) ou de nova autoagressão.
- **USI/USB**: intensa dor física; *hemorragia menor incontrolável*; *risco moderado de nova autoagressão* (passado de autoagressão); história psiquiátrica importante; *história discordante*; *distúrbio de coagulação*; *agitação psicomotora* intensa (hipercinese); *comportamento negligente* ou autopreservação parcial.
- **Orientação**: outras queixas.

### RC6 Cefaleia
- Inclusão: qualquer dor ao redor da cabeça sem relação com estrutura anatômica especial (couro cabeludo, fronte, nuca, região dos olhos); dor facial não entra.
- Perguntas: há quanto tempo; já teve; desmaio; orientado; trauma; sente mais algo; tratamento.
- **USA**: *paciente não reativo*; cefaleia com convulsão (tônico-clônica ou parcial); *início abrupto*; *alteração súbita da consciência*; *déficit neurológico agudo*; *perda aguda total da visão*; *sinais de meningismo*; *erupção cutânea fixa* ou *púrpura*; dor intensa (a pior dor de cabeça já sentida).
- **USI/USB**: *história de trauma craniano*; *história de inconsciência*; *distúrbio de coagulação*; *história discordante*; redução da acuidade visual na última semana; *vômitos persistentes*; *déficit neurológico novo*; dor moderada; febre alta.
- **Orientação**: dor à palpação no couro cabeludo temporal; febre; vômitos; dor leve recente; outras queixas.

### RC7 Convulsão
- Inclusão: movimentos tônicos ou clônicos em crise tipo grande mal, ou convulsão parcial.
- Perguntas: epilético e toma remédio; há quanto tempo; quantas vezes; febre (criança); bateu a cabeça; drogas ou álcool; orientado; mexe o pescoço.
- **USA**: história de diabetes; *paciente não reativo*; *déficit neurológico agudo* ou *sinais de AVC*; *sinais de meningismo*; *história de overdose ou envenenamento*; *erupção cutânea fixa* ou *púrpura*.
- **USI/USB**: criança menor de 2 anos; febre alta; *história de trauma craniano*; *déficit neurológico novo*; crise com duração de mais de 5 minutos; episódios recidivantes (mais de dois seguidos); *história discordante*; etilista ou usuário de drogas; estado pós-ictal alterado.
- **Orientação**: febre baixa; cefaleia discreta; convulsão não febril em paciente sabidamente epilético; outras queixas.

### RC8 Corpo estranho
- Inclusão: corpo estranho em qualquer parte da anatomia.
- Perguntas: como ocorreu; barulho ao respirar; sangramento (comprimir); perdeu os sentidos; orientado.
- **USA**: *estridor laríngeo*; *hemorragia maior incontrolável*; *mecanismo de trauma significativo*; *alteração súbita da consciência*.
- **USI/USB**: trauma ocular penetrante; dor intensa; *história discordante*; *hemorragia menor incontrolável*.
- **Orientação**: *inflamação ou infecção local*; olho vermelho; outras queixas.

### RC9 Crise em saúde mental
- Inclusão: prejuízo do comportamento pragmático por transtorno da crítica e da iniciativa pragmática (rotina de preservar o próprio bem-estar). Prejuízo da crítica: **grave** = incapaz de autocuidados e de interagir com o meio, mesmo orientado; **moderado** = só faz com orientação contínua de cuidador; **leve** = faz com eficiência, mas precisa de supervisão intermitente.
- Perguntas: perdeu os sentidos; orientado; doença mental; drogas ou álcool; agressivo; agitado; fala em se matar; está se alimentando.
- **USA/USI**: "necessidade de apoio à USB para contenção química" nas situações de: *comportamento heteroagressivo*; *alto risco de agredir outros*; *alto risco de autoagressão* (ideação suicida). (USA ou USI vai de apoio à USB.)
- **USI/USB**: história psiquiátrica importante; jejum há mais de três dias; risco moderado de autoagressão ou de heteroagressão; *comportamento conturbador*; *inquietação psicomotora* (acatisia); prejuízo grave da crítica e da iniciativa pragmática.
- **Orientação**: outras queixas.

### RC10 Diabetes
- Inclusão: pacientes sabidamente diabéticos, tipo I ou II.
- Perguntas: última refeição; glicemia medida; medicação; desmaio; orientado; convulsão; outro tratamento.
- **USA**: *paciente não reativo*; convulsão ou *convulsionando*.
- **USI/USB**: *alteração súbita da consciência*; dor abdominal intensa; *sinais de desidratação*; *vômitos persistentes*; *hipotermia*; hipoglicemia (se medida); hiperglicemia acima de 500 mg/dl (se medida).
- **Orientação**: febre; outras queixas.

### RC11 Diarreia e/ou vômitos
- Inclusão: diarreia e/ou vômitos, com ou sem sinais de desidratação.
- Perguntas: quantas vezes; "moleira" baixa (até 1 ano); fala; anda; urinou hoje; desmaiou; dor; sangue no vômito ou nas fezes.
- **USA**: *paciente não reativo*; *alteração súbita da consciência*; não reage aos pais; *evacuação de sangue vivo ou escurecido*; *vômito de sangue*; prostração, hipotonia; dor intensa.
- **USI/USB**: *fezes pretas ou em groselha*; *história aguda de vômito de sangue*; *sinais de desidratação*; *vômitos persistentes*.
- **Orientação**: febre; dor moderada; evento recente; outras queixas.

### RC12 Dispneia em adulto (não asmático)
- Inclusão: todo caso de dispneia em paciente não asmático.
- Perguntas: perdeu os sentidos; quando começou; completa uma frase; barulho ao respirar; alcoolizado; orientado; abalo emocional.
- **USA**: *estridor laríngeo*; baba-se; *dor precordial típica*; *frases entrecortadas*; início agudo após trauma; *pulso anormal* (se medido); *alteração súbita da consciência*; *exaustão*.
- **USI/USB**: dispneia em idoso acima de 60 anos; sibilância audível ou chiado; hemoptise; *dor pleurítica*; *história respiratória significativa*; hipertensão arterial sistêmica; *história cardíaca importante*.
- **Orientação**: febre; dor epigástrica; tosse produtiva; trauma torácico recente; história de hemoptise; outras queixas.

### RC13 Dor abdominal em adulto
- Inclusão: dor na região abdominal, com ou sem irradiação.
- Perguntas: trauma recente; quando iniciou; sangue no vômito ou nas fezes; gestante.
- **USA**: dor epigástrica ou dor irradiada para o dorso ou ombro; vômitos de sangue; *sangramento vaginal em gestantes acima de 20 semanas*.
- **USI/USB**: *evacuação de sangue vivo ou escurecido*; dor intensa; *possível gravidez*; dor irradiada para o ombro (sic: também aparece na lista USA); *fezes pretas ou em groselha*; *história aguda de vômitos de sangue*; *vômitos persistentes*.
- **Orientação**: febre ou vômitos; dor moderada; outras queixas.
- Notas: dor irradiada para o dorso pode indicar dissecção de aorta; com sangramento vaginal, gravidez ectópica ou abortamento.

### RC14 Dor cervical
- Inclusão: dor na região cervical, com ou sem irradiação.
- Perguntas: quando iniciou; mexe a cabeça; dor de cabeça e luz incomoda; mancha vermelha no corpo; pancada no pescoço.
- **USA**: *sinais de meningismo*; *déficit neurológico agudo*; *erupção cutânea fixa* ou *púrpura*.
- **USI/USB**: dor intensa; febre alta; trauma direto no pescoço; *déficit neurológico novo*.
- **Orientação**: dor moderada; outras queixas.

### RC15 Dor lombar
- Inclusão: dor na região lombar, com ou sem irradiação.
- Perguntas: quando iniciou; trauma local; braços e pernas (movimento, sensibilidade) e anda; dor de barriga; urina.
- **USA**: *déficit neurológico agudo*; *mecanismo de trauma significativo*.
- **USI/USB**: dor abdominal; dor intensa; *déficit neurológico novo*; trauma direto no dorso; incapaz de andar; cólicas; *história discordante*.
- **Orientação**: dor moderada; febre; outras queixas.

### RC16 Dor testicular
- Inclusão: dor na região escrotal.
- Perguntas: quando iniciou; cor da pele dos testículos; cólica.
- **USA**: o protocolo não tem lista de USA.
- **USI/USB**: idade menor que 25 anos; gangrena de escroto; dor intensa; celulite de escroto; cólicas; *vômitos persistentes*.
- **Orientação**: dor moderada; trauma de escroto; febre e vômitos; outras queixas.

### RC17 Dor torácica
- Inclusão: dor torácica anterior, lateral ou posterior, com ou sem irradiação, com ou sem relação com a respiração.
- Perguntas: falta de ar; quando iniciou; como é (aperta, rasga, lateja, pontada); apertar as costelas dói; já sentiu antes; febre, dor no corpo ou vômitos; cateterismo ou doença do coração; abalo emocional.
- **USA**: *dor precordial típica*; dor intensa; *dispneia aguda*.
- **USI/USB**: *dor pleurítica*; *vômitos persistentes*; *história cardíaca importante*; dor moderada; história de hipertensão arterial; história de diabetes mellitus.
- **Orientação**: vômitos; dor leve recente; outras queixas.

### RC18 Hemorragia digestiva
- Inclusão: sangramento digestivo, com vômito de sangue vivo ou alterado, ou evacuação de sangue vivo ou alterado.
- Perguntas: desmaio; vômito ou fezes com sangue (encharca uma toalha), cor vermelha ou preta; quando começou; quantos episódios; sangramento anterior; costuma beber.
- **USA**: palidez e sudorese intensa (a fonte escreve "?", (sic)); *alteração súbita da consciência*.
- **USI/USB**: história de hemorragia digestiva importante; *evacuação de sangue vivo ou escurecido*; *fezes pretas ou em groselha*; *história aguda de vômito de sangue*; *vômitos persistentes*; dor intensa ou moderada.
- **Orientação**: vômitos; dor leve; outras queixas.

### RC19 Intoxicação ou abstinência alcoólica
- Inclusão: uso agudo ou crônico, comprovado ou suspeito, de álcool (hálito alcoólico, fala pastosa, alteração de humor, comportamento e consciência, náuseas e vômitos, taquicardia, hiper ou hipotensão, alucinações, agitação, fraqueza). Comum à intoxicação e à abstinência; sinais diferenciais da **abstinência**: tremores, febre, sudorese profusa, convulsão e delírio.
- Perguntas: doença mental; drogas ou álcool; bateu a cabeça; há quanto tempo sem álcool; perdeu os sentidos; orientado.
- **USA/USI**: paciente inconsciente em via pública; *convulsionando*; *déficit neurológico agudo*; história inadequada; *hipotermia*; *síndrome de abstinência alcoólica grave*.
- **USI/USB**: alteração da consciência não totalmente atribuível ao álcool; *déficit neurológico novo*; *história de trauma craniano*; *história de inconsciência*; *história discordante*.
- **Orientação**: "alteração do nível da consciência não totalmente atribuível ao álcool" (sic: o mesmo item da lista USI/USB; a definição de "totalmente atribuível" na página sugere que o item certo seja esse, o que é inferência); outras queixas.

### RC20 Mal súbito no adulto
- Inclusão: desmaio, síncope ou mal-estar no adulto.
- Perguntas: abalo emocional; alcoolizado; falta de ar; barulho ao respirar; convulsão; sangramento.
- **USA**: *dor precordial típica*; *história alérgica importante*; *dispneia aguda*; *alteração súbita da consciência*; *déficit neurológico agudo*.
- **USI/USB**: *convulsionando* (aqui é USI/USB; em RC10, RC19, RT2, RT5, RT6 e RT9 é USA); *história de trauma craniano*; *história de inconsciência*; *déficit neurológico novo*; história de dor intensa.
- **Orientação**: febre em adulto; dor leve ou moderada; outras queixas.

### RC21 Mordeduras e picadas
- Inclusão: de picadas de inseto a mordeduras de grandes animais, inclusive humana.
- Perguntas: falta de ar; barulho ao respirar; perdeu os sentidos; rosto ou língua inchados; sangramento (comprimir); dor ou coceira.
- **USA**: *estridor laríngeo*; *hemorragia exsanguinante*; edema facial; edema de língua; *frases entrecortadas*; *hemorragia maior incontrolável*; *história alérgica importante*; *envenenamento de alta mortalidade*; *alteração súbita da consciência*.
- **USI/USB**: *hemorragia menor incontrolável*; *erupção ou vesículas disseminadas*; *envenenamento de moderada mortalidade*.
- **Orientação**: dor ou coceira intensas; *inflamação ou infecção local*; outras queixas.
- Notas: considerar enviar imagem do animal e da lesão ao centro de controle de intoxicação (CIATOX).

### RC22 Palpitações
- Inclusão: sensação incômoda do coração batendo ou acelerado.
- Perguntas: dor torácica; abalo emocional; falta de ar; drogas ou álcool (há quanto tempo sem); perdeu os sentidos; doença do coração.
- **USA**: *dor precordial típica*; *dispneia aguda*; *história de overdose ou envenenamento*; *pulso anormal*; *alteração súbita da consciência*.
- **USI/USB**: palpitação atual; *história de inconsciência*; *história cardíaca importante*.
- **Orientação**: febre; outras queixas.

### RC23 Problemas odontológicos
- Inclusão: qualquer problema oral em dentes ou gengivas.
- Perguntas: começou quando; sangramento (comprimir).
- **USA**: *hemorragia maior incontrolável*.
- **USI/USB**: dor intensa; *hemorragia menor incontrolável*; avulsão dentária aguda; *distúrbio da coagulação*; *história discordante*; dor moderada.
- **Orientação**: edema facial; outras queixas.

### RC24 Problemas em extremidades
- Inclusão: qualquer queixa ou lesão em membros superiores ou inferiores, inclusive dor ou trauma.
- Perguntas: começou quando; perdeu os sentidos (se trauma); capacete ou cinto; falta de ar; cor da pele; temperatura; sangramento (comprimir); deformidade; osso aparecendo.
- **USA**: *dispneia aguda*; pele crítica; *comprometimento vascular distal*; *hemorragia maior incontrolável*.
- **USI/USB**: dor intensa; *dor pleurítica*; *deformidade grosseira*; fratura exposta; *hemorragia menor incontrolável*; *déficit neurológico novo*; *distúrbio da coagulação*; *história discordante*.
- **Orientação**: dor moderada; deformidade; edema; outras queixas.

### RC25 Problemas nos olhos
- Inclusão: dor ou outras sensações nos olhos, incluindo alteração aguda da visão.
- Perguntas: começou quando; trauma no olho; como está enxergando.
- **USA**: lesão ocular química aguda; trauma ocular penetrante; *perda aguda total da visão*; dor intensa.
- **USI/USB**: *redução recente da acuidade visual*; *história discordante*; dor moderada; febre alta.
- **Orientação**: olho vermelho; sensação de corpo estranho; diplopia; dor leve recente; outras queixas.

---

## 6. Protocolos de trauma (RT1 a RT10)

### RT1 Afogamento
- Inclusão: consciente ou inconsciente após submersão em água "e parada respiratória" (assim na fonte).
- Perguntas: mergulho de cabeça; trauma; falta de ar; perdeu os sentidos; espuma na boca ou nariz.
- **USA**: *mecanismo de trauma significativo*; espuma em boca ou nariz; *dispneia aguda*.
- **USB** (a fonte diz só "USB"): *história de inconsciência*; *história discordante*.
- **Orientação**: "se nenhum item anterior estiver presente": outras queixas.

### RT2 Agressão física
- Inclusão: queixas inespecíficas após agressão.
- Perguntas: quando foi; embriaguez; braços e pernas (deformidade); trauma na cabeça; sangramento (comprimir); perdeu os sentidos; convulsão; fala; orientado.
- **USA**: *hemorragia exsanguinante* ou incontrolável; *mecanismo de trauma significativo*; *convulsionando*; *dispneia aguda*; *alteração súbita da consciência* ou *déficit neurológico agudo*; múltiplas fraturas.
- **USB** (a fonte diz só "USB"): *história de inconsciência*; *déficit neurológico novo*; *deformidade aparente*; suspeita de TCE (equimose mastóide ou periorbitária, otorragia); *distúrbio de coagulação*; *história discordante*; dor intensa.
- **Orientação**: paciente embriagado; dor leve a moderada; edema; outras queixas.

### RT3 Desastres (incidentes com agentes QBRNE ou com múltiplas vítimas)
- Inclusão: todos os incidentes com múltiplas vítimas, relacionados ou não a produtos perigosos (químicos, radiológicos, nucleares, explosivos) ou agentes biológicos. Não há listas USA/USB/orientação: o MR decide a resposta pelo nível do desastre.
- Perguntas do MR: quantos pacientes; tamanho da área; fogo ou fumaça; rede elétrica ou postes; risco de desabamento (prédios, acessos, encostas, árvores, veículos); vazamento de combustível, tóxicos ou produtos perigosos e qual (placa laranja, números do painel); alguém perdeu os sentidos. Definir zonas de segurança (quente, morna, fria).
- **Distâncias**: 300 m a favor do vento se houver ruído de escape gasoso, pessoas fugindo ou desorientadas, animais mortos ou em fuga, vegetação descolorida; fogo: 50 m do foco em todas as direções; fogo em produto perigoso: 800 m; rede elétrica: equipes ficam antes do último poste intacto; sem informação do produto: equipe a no mínimo 100 m da zona quente, vento pelas costas.
- **Decisão gestora**: Plano de Contingência (PCAD-SAMUFor); considerar PMA e a Força Municipal de Saúde; SAMU Ceará conforme o nível; Comitê de Crise do SAMUFor; sugerir o CIOCS municipal conforme a magnitude. Proporção típica de gravidade: 10% vermelho, 30% amarelo, 45% verde, 15% cinza.

| Nível | Vítimas | Vermelhos | Amarelos | Verdes | Estrutura |
|---|---|---|---|---|---|
| 1 | 5 a 10 | 1 paciente: 1 USA | até 3: 3 USB | até 5: mais 2 USB | PC, área de espera (E), ACV |
| 2 | 11 a 30 | 2 a 3: até 3 USA | 4 a 9: até 9 USB | 5 a 14: mais até 6 USB | PMA na ACV; chamar SAMU Ceará |
| 3 | 31 a 70 | 4 a 7: 7 USA | 9 a 21: 21 USB | 13 a 31: viatura tipo A | PMA; SAMU Ceará |
| 4 | mais de 70 | como o nível 3 | como o 3 | como o 3 | como o 3, mais SCO Urgência completo e Comitê de Crise |

- Recursos: primeira resposta = 1 USA, 1 USB, 1 moto; remoção nível 1 = 4 USB; PMA = 3 USA, 2 USB, 3 motos; remoção nível 2 = 3 USA, 9 USB, 1 USB tipo A. Líder do recurso: USA = médico; USB = técnico de enfermagem; moto = motossocorrista. Força-tarefa 1 = primeira resposta mais viaturas de incêndio ou resgate, AMC e/ou PM; força-tarefa 2 = remoção nível 2 mais trem de socorro dos bombeiros, AMC, PM e/ou Defesa Civil. A fonte cita BTox10, 11, 12, 14, 15 e 16 (existem) e "BMV1 ao BMV7" (não existem; os de IMV são PMV1 a PMV5, em `SAMU_GESTAO.md`).

### RT4 Ferimentos pérfuro-penetrantes
- Inclusão: ferimentos diversos, incluindo por arma branca ou de fogo.
- Perguntas: quando foi; parte do corpo; sangramento (comprimir); perdeu os sentidos; convulsão; fala; orientado.
- **USA**: *hemorragia exsanguinante*; *hemorragia maior incontrolável*; dispneia súbita; *comprometimento vascular distal*; *alteração súbita da consciência*; ferimento por arma de fogo em cabeça, face, pescoço ou tórax; amputação traumática de membro.
- **USI/USB**: *história discordante*; *hemorragia menor incontrolável*; ferimento em abdome; *déficit neurológico agudo*; dor intensa.
- **Orientação**: *inflamação ou infecção local*; dor moderada ou leve após evento recente; outras queixas.

### RT5 Overdose e envenenamentos
- Inclusão: uso de drogas (cocaína, crack, anfetaminas/ecstasy, maconha, metanfetamina/cristal, outras estimulantes); contato certo ou suspeito, por qualquer via, com agente intoxicante (organofosforados, carbamatos, inseticida, raticida clandestino); agitação e violência com informação segura de que não há agravo de saúde mental prévio; qualquer paciente (bebê, criança ou adulto) com quadro inexplicado, súbito, com alteração da consciência, convulsões ou alteração hemodinâmica ou respiratória sem causa clara.
- Perguntas: substância e quantidade; há quanto tempo; convulsão; perdeu os sentidos; orientado; doença mental.
- **USA/USI**: *alteração súbita da consciência*; *convulsionando*; sialorreia e sudorese fria; substância de *mortalidade* alta; manutenção do comportamento agressivo apesar da tentativa de comunicação terapêutica.
- **USI/USB**: risco de nova autoagressão; substância de mortalidade moderada; história psiquiátrica importante; *história de inconsciência*; *agitação ou inquietação psicomotora*; *história discordante*.
- **Orientação**: "se nenhum item acima existir": outras queixas.
- Notas: o MR deve receber todo detalhe do agente e dos sinais para consultar o CIATOX ou o Disque-Intoxicação da Anvisa e definir o encaminhamento (de preferência hospital terciário).

### RT6 Queda
- Inclusão: queda da própria altura ou de altura.
- Perguntas: quando; de que altura; via pública; sangramento (comprimir); bateu a cabeça, perdeu os sentidos; convulsão depois; orientado; braços e pernas (deformidade); anda; alcoolizado.
- **USA**: *paciente não reativo*; *convulsionando*; *mecanismo de trauma significativo*; *hemorragia exsanguinante* ou *maior incontrolável*; suspeita de TCE (equimose mastóide ou periorbitária, otorragia); *déficit neurológico agudo*; *alteração súbita de consciência*; *hipotermia*.
- **USI/USB**: história de hipoglicemia; criança abaixo de 10 anos ou idoso acima de 70 anos, com fraturas e/ou dor intensa ou moderada; *história de inconsciência*; *distúrbio da coagulação*; *história discordante*; *hemorragia menor incontrolável*; *déficit neurológico novo*; *deformidade grosseira*; fratura exposta.
- **Orientação**: deformidade em membros superiores; edema ou inchaço; outras queixas.
- Notas: suspeitar de trauma grave em queda maior que 1,5 vez a altura do paciente.

### RT7 Queimaduras e choque elétrico
- Inclusão: queimaduras de fonte elétrica, química, fogo, calor ou solar.
- Perguntas: quando; onde e bolhas; vapor, óleo, água ou fogo; falta de ar; barulho ao respirar; queda; perdeu os sentidos; orientado; ambiente fechado, fumaça.
- **USA**: *paciente não reativo*; estridor; edema facial; lesão por inalação; *dispneia aguda*; *mecanismo de trauma significativo*; *alteração súbita da consciência*.
- **USI/USB**: dor intensa; inalação de fumaça; *história discordante*; queimadura elétrica; queimadura química.
- **Orientação**: dor leve ou moderada; *inflamação ou infecção local*; outras queixas.

### RT8 Politraumatismo
- Inclusão: comprometimento simultâneo e grave de várias funções e sistemas por lesões de forças externas (objeto contra o corpo ou corpo contra objeto).
- Perguntas: quando e via pública; capacete ou cinto; falta de ar; barulho ao respirar; sangramento (comprimir); bateu a cabeça, perdeu os sentidos; orientado; braços e pernas (deformidade).
- **USA**: *paciente não reativo*; *hemorragia exsanguinante*; *dispneia aguda*; *hemorragia maior incontrolável*; *alteração súbita da consciência*; *déficit neurológico agudo*; *mecanismo de trauma significativo*.
- **USI/USB**: dor intensa; *história de inconsciência*; *distúrbio de coagulação*; *hemorragia menor incontrolável*; dor moderada.
- **Orientação**: outras queixas.
- Notas: esses pacientes quase nunca são menos que nível 2 (amarelo). Suspeitar de trauma grave em: queda maior que 1,5 vez a altura do paciente; atropelamento; colisão com veículo a mais de 30 km/h; ejeção; morte de ocupante do veículo; danos graves ao veículo; capotamento; ferimento penetrante de cabeça, pescoço, tórax, abdome, pelve e coxa.

### RT9 Trauma cranioencefálico (TCE)
- Inclusão: trauma na cabeça com alterações neurológicas e/ou equimose mastóide ou periorbitária e/ou otorragia, com ou sem politraumatismo.
- Perguntas: quando e via pública; capacete ou cinto; sangramento (nariz, ouvido); convulsão; perdeu os sentidos; orientado; braços e pernas (deformidade, movimento, sensibilidade).
- **USA**: *paciente não reativo*; *convulsionando*; *mecanismo de trauma significativo*; *hemorragia exsanguinante* ou *maior incontrolável*; *alteração súbita da consciência*; *déficit neurológico agudo*; dor intensa.
- **USI/USB**: *história de inconsciência*; *distúrbio de coagulação*; *hemorragia menor incontrolável*; *vômitos persistentes*; *déficit neurológico novo*; dor moderada; *história discordante*.
- **Orientação**: hematoma ou inchaço em couro cabeludo; vômito; dor leve recente; outras queixas.

### RT10 Trauma toracoabdominal
- Inclusão: trauma em tórax ou abdome com risco de vida, hemorragia e dor.
- Perguntas: quando; falta de ar; barulho ao respirar; sangramento (comprimir); deformidade no tórax; vísceras aparecendo; convulsão; perdeu os sentidos.
- **USA**: *hemorragia exsanguinante*; *dispneia aguda*; *hemorragia maior incontrolável*; *mecanismo de trauma significativo*; evisceração; dor intensa.
- **USI/USB**: *dor pleurítica*; *hemorragia menor incontrolável*; *distúrbio da coagulação*; *história discordante*.
- **Orientação**: *inflamação ou infecção local*; dor leve recente; outras queixas.

---

## 7. Obstétricos e pediátricos (RO1, RO2, RP1, RP2)

### RO1 Sangramento transvaginal
- Inclusão: perda de sangue por via vaginal, na gestação ou fora dela.
- Perguntas: gestante, de quantos meses; coágulos ou ultrapassa as roupas; dor abdominal e como é.
- **USA**: *hemorragia exsanguinante*; *alteração súbita de consciência*; *sangramento vaginal intenso*; dor intensa.
- **USI/USB**: dor abdominal com sangramento vaginal moderado; sangramento vaginal com mais de 20 semanas de gravidez (em RC13 o mesmo sinal é USA; em RO2 está entre as "perdas sanguíneas acentuadas").
- **Orientação**: sangramento vaginal não intenso; outras queixas.

### RO2 Gestante em trabalho de parto
- Inclusão: gestantes em trabalho de parto ou com alteração do curso normal da gestação.
- Perguntas: gestações, partos e abortos; tempo de gravidez; aparece parte do bebê; contrações (quantas em 10 min); sangramento ou perda de líquido; cesáreas prévias.
- **USA**: prolapso de cordão umbilical ou apresentação de partes fetais; **escore de Malinas maior que 7**; "co-morbidades:" (item vazio na fonte). A fonte põe, antes dessa lista e sem título, um bloco que parece ser de USA (inferência): trabalho de parto prematuro avançado (possível necessidade de atender o RN); perdas sanguíneas acentuadas (hemorragia exsanguinante, sangramento transvaginal intenso, sangramento vaginal com mais de 20 semanas, DHEG severa [convulsionando ou história de convulsão], dor intensa por risco de rotura uterina e choque).
- **USI/USB**: parto domiciliar ou iminente (garantir o melhor tempo-resposta enquanto aguarda o suporte avançado); história de trauma; pressão arterial elevada; *história discordante*; dor irradiada para o ombro; dor abdominal com sangramento vaginal; dor moderada; **escore de Malinas entre 5 e 7**.
- **Orientação**: **escore de Malinas menor que 5**; outras queixas.

| Pontos | Paridade | Duração do trabalho de parto | Duração das contrações | Intervalo entre contrações | Perda de líquido |
|---|---|---|---|---|---|
| 0 | um parto | menos de 3 h | menos de 1 min | "< 5 min" (sic; o padrão do escore é mais de 5 min) | não |
| 1 | dois | entre 3 e 5 h | 1 min | entre 3 e 5 min | recente (menos de 1 h) |
| 2 | três ou mais | mais de 6 h (a fonte deixa 5 a 6 h sem faixa) | mais de 1 min | menos de 3 min (pelo menos 2 em 5 min) | mais de 1 h |

- Com o mesmo escore, multíparas parem mais rápido; considerar o prazo de chegada à maternidade. Fatores de risco: idade abaixo de 14 ou acima de 40 anos; pré-termo; sem pré-natal; hipertensão e diabetes. Perda de líquido: claro = prever prematuridade; amarelado ou esverdeado = situação fetal, apresentação pélvica; com odor = risco de infecção. Investigar também tontura, síncope, convulsão, dispneia, escotomas.
- Toque vaginal no local, tempo até o parto (1º parto / 2 partos / multípara): **5 cm** 4 h / 3 h / 1 h 30; **7 cm** 2 h / 1 h / 30 min; **9 cm** 1 h / 30 min / a qualquer hora; dilatação completa = parto. Menos de 1 hora: parto no local; mais de 1 hora: transporte em decúbito lateral esquerdo, oxigênio e soro glicosado a 10%.

### RP1 Dispneia em criança
- Inclusão: queixa de falta de ar na criança.
- Perguntas: quando começou; barulho ao respirar; perdeu os sentidos; usou medicação.
- **USA**: *estridor laríngeo*; baba-se; *paciente não reativo*; esforço respiratório aumentado; *frases entrecortadas*; hemoptise; *história respiratória significativa*; início agudo após trauma; resposta à voz ou à dor apenas; *exaustão*.
- **USI/USB**: sibilância audível ou chiado; história de hemoptise; *história discordante*; *dor pleurítica*; doenças de base (asma, cardiopatia, fibrose cística ou mucoviscidose).
- **Orientação**: tosse produtiva; trauma torácico recente; outras queixas.

### RP2 Dor abdominal em criança
- Inclusão: dor na região abdominal, com ou sem irradiação.
- Perguntas: quando iniciou; sangue no vômito ou nas fezes; febre.
- **USA**: vômitos de sangue; *evacuação de sangue vivo ou escurecido*.
- **USI/USB**: criança muito quente; *sinais de dor intensa* ou moderada; *erupção cutânea fixa* ou *púrpura*; inconsolável pelos pais; massa abdominal visível; *fezes pretas ou em groselha*; *história aguda de vômitos de sangue*; *vômitos persistentes*; *história discordante*.
- **Orientação**: vômitos; dor leve recente; outras queixas.

---

## 8. Definições úteis

Discriminadores que se checam ao telefone, em *itálico* nas seções 5 a 7, cada um definido uma vez (resumo das páginas; os autoexplicativos ficaram de fora).

- **Alteração súbita da consciência**: mudança do Glasgow nas últimas 12 h; na dúvida, presumir. **Paciente não reativo**: não responde a comando verbal nem a dor. **Convulsionando**: convulsão em curso.
- **Déficit neurológico agudo**: perda de função neurológica (sensibilidade, força de membros, retenção urinária, alteração intestinal) em até 24 h; **novo**: há mais de 24 h. **História de inconsciência**: precisa de testemunha confiável; se o paciente não lembra do incidente, presumir.
- **Sinais de AVC** (RC7): os três itens USI/USB do RC1. **Sinais de meningismo**: rigidez de nuca com cefaleia e fotofobia. **Início abrupto**: em segundos ou minutos. **Perda aguda total da visão**: um ou ambos os olhos, últimas 24 h. **Redução recente da acuidade visual**: últimos 7 dias.
- **Hipoglicemia**: < 55 mg/dl. **Hipotermia**: pele fria; < 35 °C define.
- **Dispneia aguda**: falta de ar súbita ou piora repentina. **Frases entrecortadas**: não articula frases curtas numa só expiração. **Exaustão**: o esforço respiratório diminui apesar da insuficiência. **Estridor laríngeo**: ruído inspiratório e/ou expiratório, melhor com a boca aberta.
- **História respiratória significativa**: UTI prévia por condição semelhante, asma lábil, O2 domiciliar, VNI. **Sem melhora com a medicação habitual**: broncodilatador prescrito, pela história do paciente.
- **Dor precordial típica**: aperto ou peso intenso no meio do peito, pode irradiar para braço esquerdo ou pescoço, com sudorese, náuseas, lipotimia e/ou dor epigástrica. **Dor pleurítica**: em fincada, piora ao respirar, tossir ou espirrar.
- **Pulso anormal**: < 60/min, > 100/min ou irregular (criança varia com a idade). **História cardíaca importante**: arritmia recorrente ameaçadora, ou cardiopatia que pode piorar rápido (coronariana).
- **Hemorragia exsanguinante**: levará à morte se não for contida. **Maior incontrolável**: não cede à compressão direta e sustentada, flui forte ou encharca o curativo. **Menor incontrolável**: idem, mas flui levemente ou escorre. **Distúrbio de coagulação**: congênito ou adquirido (doença ou terapêutica).
- **Dor intensa**: intolerável, em geral "jamais sentida". **Dor moderada**: intensa, mas suportável. Bebê (RP2): intensa = berra continuamente, inconsolável, palidez e sudorese; moderada = chora intermitentemente, às vezes se consola.
- **Comprometimento vascular distal**: palidez, esfriamento, alteração da sensibilidade e/ou dor, com ou sem ausência de pulso distal. **Deformidade grosseira**: angulação ou rotação anormal inferida; **aparente**: em quadril ou membros inferiores, exige imobilização e remoção em USB.
- **Erupção cutânea fixa**: não empalidece à pressão (apertar com um copo); **púrpura**: idem, por pequenas hemorragias. **Erupção ou vesículas disseminadas**: secretante ou bolhosa em mais de 10% da superfície corporal. **Inflamação ou infecção local**: dor, inchaço e vermelhidão restritos a uma área, com ou sem pus. **História alérgica importante**: reação grave conhecida (nozes, camarão, picada de abelha).
- **Mecanismo de trauma significativo**: mergulho em águas rasas; trauma penetrante (facada, tiro); alta transferência de energia, como queda de altura e via de trânsito rápido (≥ 60 km/h), principalmente com ejeção, morte de outra vítima ou grande deformação do veículo. **História de trauma craniano**: trauma na cabeça (paciente, ou testemunha confiável se esteve inconsciente).
- **Agitação psicomotora**: muito perturbado, atividade excessiva e improdutiva, não fica em repouso mesmo quando solicitado. **Inquietação psicomotora**: hiperatividade ou fala ininterrupta que cede ao pedido para parar, ou acatisia (anda, senta e levanta).
- **Comportamento ameaçador**: raiva, indignação ou ultraje, com ameaças por palavras ou gestos. **Conturbador**: ameaçador ou não, atrapalha o dia a dia do local. **Heteroagressivo**: agride pessoas ou lança objetos na direção de pessoas ou coisas. **Hostil**: irritabilidade perceptível, colaborativo sem estressores. **Negligente**: ignora riscos ou omite atitudes essenciais à segurança, sem intenção declarada de autoagressão.
- **Risco de agredir outros**: alto = armas e vítimas potenciais por perto, ou perdeu o autocontrole; moderado = qualquer indício; avaliar postura e discurso; na dúvida, alto. **Risco de (nova) autoagressão**: alto = passado importante e está tentando se machucar ou ir embora para isso; moderado = passado importante e só manifesta o desejo; na dúvida, alto.
- **História de overdose ou envenenamento**: vem de terceiros ou se deduz de caixas de remédio vazias. **Mortalidade** do envenenamento: alta potência = alta; consultar o CIATOX; na dúvida, alto risco. **Síndrome de abstinência alcoólica grave**: agitação intensa, sudorese profusa, convulsão, desorientação, violência, pensamento delirante, alucinações.
- **História discordante**: a história não explica os achados físicos; pode marcar lesão não acidental (sentinela de abuso).
- **Vômitos persistentes**: contínuos ou sem alívio entre os episódios. **Sinais de desidratação**: língua seca, olhos fundos, turgor pastoso; em bebê, fontanela baixa.
- **Evacuação de sangue vivo ou escurecido**: sangramento digestivo maciço, sangue vermelho escuro (quanto mais lento o trânsito, mais escuro, até melena). **Fezes pretas**: qualquer escurecimento; **em groselha**: vermelho-escuras (intussuscepção). **História aguda de vômito de sangue**: hematêmese, borra de café ou sangue no vômito nas últimas 24 h.
- **Possível gravidez**: menstruação normal que não veio, ou idade fértil com vida sexual ativa e sem proteção. **Sangramento vaginal em gestante acima de 20 semanas**: qualquer pinga de sangue. **Sangramento vaginal intenso**: grandes coágulos, fluxo constante, ou que ultrapassa absorvente e roupa.

---

## 9. Inconsistências da própria fonte (para quem usa só USA e USB)

- Rótulos: USA/USI em RC4, RC5, RC9, RC19, RT5 e na valência social do RM7; USI/USB em quase todo o resto; USB só em RT1 e RT2. Sem USI: USA/USI lê-se USA; USI/USB lê-se USB. Vermelho do RM4 é "USA, USI (ou USB) e motolância".
- Listas faltando: RC2 sem USI/USB; RC16 sem USA; RT3 sem listas. RC10 aparece no RM3 como "Acidente Vascular Cerebral Diabetes (RC10)"; o índice do aplicativo chama o RC5 de "Tentativa de Suicídio" (RM3 e RM4: "Autoagressão e tentativa de suicídio") e o RC25 de "Problemas em Olhos".
- *Convulsionando*: USA em RC10, RC19, RT2, RT5, RT6, RT9; USI/USB em RC20.
- Sangramento vaginal com mais de 20 semanas: USA em RC13, USI/USB em RO1, "perdas sanguíneas acentuadas" em RO2. Dor irradiada para o ombro: USA e USI/USB em RC13.
- Mecanismo significativo: via de trânsito rápido a partir de 60 km/h (definição), colisão acima de 30 km/h e queda acima de 1,5 vez a altura (RT8, RT6); "queda de altura" sem metros.
- Idades de corte diferem: RC7 menos de 2 anos; RC12 idoso acima de 60; RC16 menos de 25; RT6 criança abaixo de 10 e idoso acima de 70; PMV4 até 8 anos; RO2 risco abaixo de 14 ou acima de 40.
- Tempo do vermelho: 10 a 15 min (RM0) ou até 10 min (RM4). Verde só recebe USB com valência social.
- RM5 cita BMV1 a BMV7 e AERO1 a AERO6; o aplicativo não tem essas páginas. Nenhuma das 539 páginas cita dengue ou "FAST" (o RC1 usa Cincinnati); não há RC de febre (ela só aparece como discriminador, mais o BPed19 no SBV).
