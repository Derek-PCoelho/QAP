// =============================================================================
// Ícones 16×16 (UI) e ícones de status 12×12 (familiares), em grades ASCII.
// Contorno escuro automático (legíveis sobre os painéis escuros) e centralização
// automática. icon(nome, escala) → dataURL (cache).
// =============================================================================
import { Pix, hasDOM } from './pix';
import type { Sprite } from './sprite';
import { spriteKey } from './sprite';
import type { MemberStatus } from '../../engine/types';

/** Paleta comum dos ícones (letra → cor). */
export const ICON_PAL: Record<string, string> = {
  k: '#0d1311',
  K: '#1b1a17',
  w: '#e6efd9',
  W: '#ffffff',
  e: '#efe6cf',
  E: '#cdbf9e',
  p: '#c4d4c0',
  s: '#8fa89a',
  m: '#5f7a6c',
  l: '#3d5248',
  d: '#26352f',
  r: '#e0483d',
  R: '#a02c24',
  a: '#e8a33d',
  A: '#a86e1c',
  g: '#7fd17a',
  G: '#3f8f4a',
  b: '#5aa7d6',
  B: '#2f6f9e',
  c: '#bfe3f2',
  u: '#eaf7fc',
  o: '#f07a2a',
  O: '#a8501a',
  y: '#f2d45c',
  Y: '#b8952a',
  n: '#8a5a32',
  N: '#5a3a22',
  t: '#c99a5e',
  T: '#a8763f',
  h: '#f2c46b',
  H: '#ffe2a3',
  f: '#e8b48a',
  F: '#b97b52',
  P: '#e8799a',
  Q: '#b04a6a',
  v: '#a477d6',
  V: '#6a4a9a',
  x: '#8a948f',
  X: '#4a5550',
  z: '#2a302d',
};

const OUTLINE = '#0d1311';

// prettier-ignore
const GRIDS: Record<string, string[]> = {
  phone: [
    '................',
    '..ppp...........',
    '.pwwpp..........',
    '.pwwwp..........',
    '.pwwwp..........',
    '.ppwp...........',
    '..pwp...........',
    '..pwwp..........',
    '...pwwp.........',
    '....pwwp...pp...',
    '.....pwwppwwwp..',
    '......ppwwwwwwp.',
    '........pwwwwwp.',
    '.........ppppp..',
  ],
  phone_ring: [
    '..........y.....',
    '...aaa.....y....',
    '..ayyaa..y..y...',
    '..ayyya...y.y...',
    '..ayyya...y.....',
    '..aaya..........',
    '...aya..........',
    '...ayya.........',
    '....ayya........',
    '.....ayya...aa..',
    '......ayyaayyya.',
    '.......aayyyyyya',
    '.........ayyyyya',
    '..........aaaaa.',
  ],
  usa: [
    '..Rrbb..........',
    '.wwwwwwwww......',
    '.wwwwrwwww......',
    '.wwwrrrwwwppp...',
    '.wwwwrwwwwpccp..',
    '.wwwwwwwwwpcccp.',
    '.rrrrrrrrrrrrrr.',
    '.wwwwwwwwwwwwww.',
    '.ppXXppppppXXpp.',
    '..XxxX....XxxX..',
    '...XX......XX...',
  ],
  usb: [
    '..aobb..........',
    '.wwwwwwwww......',
    '.wwwwowwww......',
    '.wwwooowwwppp...',
    '.wwwwowwwwpccp..',
    '.wwwwwwwwwpcccp.',
    '.oooooooooooooo.',
    '.wwwwwwwwwwwwww.',
    '.ppXXppppppXXpp.',
    '..XxxX....XxxX..',
    '...XX......XX...',
  ],
  hospital: [
    '...wwwwwwwwww...',
    '..wwwwwwwwwwww..',
    '..wwrrwwwwrrww..',
    '..wwrrwwwwrrww..',
    '..wwrrwwwwrrww..',
    '..wwrrrrrrrrww..',
    '..wwrrrrrrrrww..',
    '..wwrrwwwwrrww..',
    '..wwrrwwwwrrww..',
    '..wwrrwwwwrrww..',
    '..pwwwwwwwwwwp..',
    '...pppppppppp...',
  ],
  upa: [
    '..bbbbbbbbbbbb..',
    '.bbbbbbbbbbbbbb.',
    '.bbbbbbbbbbbbbb.',
    '.bwbwbwwbbbwbbb.',
    '.bwbwbwbwbwbwbb.',
    '.bwbwbwwbbwwwbb.',
    '.bwbwbwbbbwbwbb.',
    '.bwwwbwbbbwbwbb.',
    '.bbbbbbbbbbbbbb.',
    '.BbbbbbbbbbbbbB.',
    '..BBBBBBBBBBBB..',
  ],
  maternidade: [
    '.......PP.......',
    '......PPPP......',
    '......PPPQ......',
    '.....PPPPQQ.....',
    '.....aaaaAA.....',
    '.....cucccc.....',
    '.....cucccc.....',
    '.....bwwwwc.....',
    '.....wwwwwc.....',
    '.....bwwwwc.....',
    '.....wwwwwc.....',
    '.....bwwwwc.....',
    '......wwwc......',
  ],
  base: [
    '.......OO.......',
    '......OooO......',
    '.....OoowoO.....',
    '....OoowwwoO....',
    '...OoooowoooO...',
    '..OOOOOOOOOOOO..',
    '..oooooooooooo..',
    '..oXXXXXXXXXXo..',
    '..oppppppppppo..',
    '..osssssssssso..',
    '..oppppppppppo..',
    '..osssssssssso..',
    '..OppppppppppO..',
  ],
  casa: [
    '.......NN.......',
    '......NnnN......',
    '.....NnnnnN.....',
    '....NnnnnnnN....',
    '...NnnnnnnnnN...',
    '..NNNNNNNNNNNN..',
    '...tttttttttt...',
    '...tHhhtttttt...',
    '...thhhttNNNt...',
    '...tTTTttNNNt...',
    '...ttttttNNyt...',
    '...ttttttNNNt...',
    '...TTTTTTNNNT...',
  ],
  central: [
    '.....xxxxxx.....',
    '....x......x....',
    '...x........x...',
    '...x........x...',
    '..XXX......XXX..',
    '.XsssX....XsssX.',
    '.XsssX....XsssX.',
    '.XsssX....XsssX.',
    '..XXX......XXX..',
    '...x............',
    '....x...........',
    '.....xx.........',
    '.......rr.......',
  ],
  escola: [
    '.......Xggg.....',
    '.......Xgyg.....',
    '.......Xggg.....',
    '.......X........',
    '....RRRRRRRR....',
    '...RRRRRRRRRR...',
    '..yyyyyyyyyyyy..',
    '..ybbyybbyybby..',
    '..ybbyybbyybby..',
    '..yyyyyyyyyyyy..',
    '..ybbyyNNyybby..',
    '..ybbyyNNyybby..',
    '..YYYYYNNYYYYY..',
  ],
  igreja: [
    '.......ww.......',
    '......wwww......',
    '.......ww.......',
    '......ssss......',
    '.....ssssss.....',
    '.....pppppp.....',
    '.....ppXXpp.....',
    '..sssppppppsss..',
    '..pppppppppppp..',
    '..pppppXXppppp..',
    '..ppppXXXXpppp..',
    '..ppppXXXXpppp..',
    '..ssssXXXXssss..',
  ],
  parque: [
    '.....gggggg.....',
    '...gggggggggG...',
    '..gggggggggGGG..',
    '..ggggggggGGGG..',
    '..gggggggGGGGG..',
    '..ggggggGGGGGG..',
    '...ggGGGGGGGG...',
    '....GGGGGGGG....',
    '......GnnG......',
    '.......nn.......',
    '.......nn.......',
    '.....GGnnGG.....',
    '...GGGGGGGGGG...',
  ],
  policia: [
    '..BBBBBBBBBBBB..',
    '..BbbbbbbbbbbB..',
    '..BbbbbyybbbbB..',
    '..BbbbbyybbbbB..',
    '..ByyyyyyyyyyB..',
    '..BbyyyyyyyybB..',
    '..BbbyyyyyybbB..',
    '..BbbyybbyybbB..',
    '..BbyybbbbyybB..',
    '...BbbbbbbbbB...',
    '....BbbbbbbB....',
    '.....BbbbbB.....',
    '......BBBB......',
  ],
  bombeiros: [
    '.....rrrrrr.....',
    '....rrrrrrrR....',
    '...rrrrrrrrRR...',
    '...rryyyyyrRR...',
    '...rryaaayrRR...',
    '...rryyyyyrRR...',
    '...rrryyyrrRR...',
    '...rrrryrrrRR...',
    '..rrrrrrrrrRRR..',
    '.RRRRRRRRRRRRRR.',
    '..RRRRRRRRRRRR..',
  ],
  cafe: [
    '....p...p.......',
    '.....p...p......',
    '....p...p.......',
    '................',
    '..wwwwwwwwww....',
    '..wNNNNNNNNw....',
    '..wwwwwwwwwwww..',
    '..wwwwwwwwww.w..',
    '..wwwwwwwwww.w..',
    '..pwwwwwwwwwww..',
    '...pwwwwwwwp....',
    '.ssssssssssssss.',
    '..ssssssssssss..',
  ],
  cafe_vazio: [
    '..wwwwwwwwww....',
    '..wpppppppNw....',
    '..wwwwwwwwwwww..',
    '..wwwwwwwwww.w..',
    '..wwwwwwwwww.w..',
    '..pwwwwwwwwwww..',
    '...pwwwwwwwp....',
    '.ssssssssssssss.',
    '..ssssssssssss..',
  ],
  foto: [
    '.NNNNNNNNNNNNNN.',
    '.NnnnnnnnnnnnnN.',
    '.NnHHHHHHHHHHnN.',
    '.NnHHKKHHKKHHnN.',
    '.NnHHffHHffHHnN.',
    '.NnHHffHHffKKnN.',
    '.NnHbbbbrrrffnN.',
    '.NnbbbbbrrrrggN.',
    '.NnbbbbbrrrrggN.',
    '.NnnnnnnnnnnnnN.',
    '.NNNNNNNNNNNNNN.',
  ],
  manual: [
    '..GGgggggggggg..',
    '..Gxgggggggggg..',
    '..Gggggggggggg..',
    '..Gxggwwwwwwgg..',
    '..Gggwmmmmwwgg..',
    '..Gxggwwwwwwgg..',
    '..Gggggggggggg..',
    '..Gxgggrrrgggg..',
    '..Ggggrrrrrggg..',
    '..Gxgggrrrgggg..',
    '..Gggggggggggg..',
    '..Gxgggggggggg..',
    '..GGGGGGGGGGGG..',
    '...eeeeeeeeeee..',
  ],
  quadro: [
    '.nnnnnnnnnnnnnn.',
    '.nttttttttttttn.',
    '.ntyyyttwwwtttn.',
    '.ntyrytwwwwwttn.',
    '.ntyyyttwrwwttn.',
    '.ntttttttwwwttn.',
    '.nttwwwttttttTn.',
    '.nttwbwwtPPPttn.',
    '.nttwwwttPgPttn.',
    '.nttttttTPPPttn.',
    '.nnnnnnnnnnnnnn.',
    '..N..........N..',
  ],
  diario: [
    '...NNNNNNNNNN...',
    '...Nnnnnnnnnne..',
    '...Nnnnnnnnnne..',
    '...NnnttttnnnE..',
    '...NnnnnnnnnnE..',
    '...NnnttttnnnE..',
    '...NnnnnnnnnnE..',
    '...NnnnnnnnnnE..',
    '...NnnnnnnnnnE..',
    '...NnnnnnnrnnE..',
    '...NNNNNNNrNNN..',
    '..........r.....',
    '.........rr.....',
  ],
  radio: [
    '.........X......',
    '.........X......',
    '.........X......',
    '....XXXXXXXX....',
    '....XzzzzzzX....',
    '....XgggggzX....',
    '....XGGgggzX....',
    '....XzzzzzzX....',
    '....XxzxzxzX....',
    '....XzxzxzxX....',
    '....XxzxzxzX....',
    '....XzzrzzzX....',
    '....XXXXXXXX....',
  ],
  carimbo: [
    '......nnnn......',
    '.....nttttn.....',
    '.....nttttn.....',
    '......nttn......',
    '.......nn.......',
    '.......nn.......',
    '....NNNNNNNN....',
    '...NnnnnnnnnN...',
    '...XXXXXXXXXX...',
    '...rrrrrrrrrr...',
    '................',
    '..rrr.rr.r.rrr..',
  ],
  alerta: [
    '.......aa.......',
    '......aaaa......',
    '......aKKa......',
    '.....aaKKaa.....',
    '.....aaKKaa.....',
    '....aaaKKaaa....',
    '....aaaKKaaa....',
    '...aaaaaaaaaa...',
    '...aaaaKKaaaa...',
    '..aaaaaKKaaaaa..',
    '..AAAAAAAAAAAA..',
  ],
  nota: [
    '...eeeeeeeE.....',
    '...eeeeeeeEE....',
    '...emmmmmeEEE...',
    '...eeeeeeeeeee..',
    '...emmmmmmmmme..',
    '...eeeeeeeeeee..',
    '...emmmmmmmmme..',
    '...eeeeeeeeeee..',
    '...emmmmmmmeee..',
    '...eeeeeeeeeee..',
    '...emmmmmeeeee..',
    '...eeeeeeeeeee..',
    '...EEEEEEEEEEE..',
  ],
  dinheiro: [
    '................',
    '.GGGGGGGGGGGG...',
    '.GggggggggggG...',
    '.GgGGggggGgGG...',
    '.GgGwwGGgggggGG.',
    '.GggwwgggGGggggG',
    '.GgGGggggGgGgggG',
    '.GggggggggggGGgG',
    '.GGGGGGGGGGGGggG',
    '..........GGGGGG',
    '..yyyy..........',
    '.yaaaay.........',
    '.yaYYay.........',
    '.yaaaay.........',
    '..yyyy..........',
  ],
  pin: [
    '.....rrrrr......',
    '....rrrrrrR.....',
    '...rrrwwrrRR....',
    '...rrwwwwrRR....',
    '...rrwwwwrRR....',
    '...rrrwwrrRR....',
    '...rrrrrrrRR....',
    '....rrrrrRR.....',
    '....rrrrrRR.....',
    '.....rrrRR......',
    '.....rrRR.......',
    '......rR........',
    '......R.........',
  ],
  lupa: [
    '....XXXXX.......',
    '...XcccccX......',
    '..XcuucccX......',
    '..XcucccccX.....',
    '..XccccccccX....',
    '..XcccccccX.....',
    '...XcccccX......',
    '....XXXXXnn.....',
    '.........nNn....',
    '..........nNn...',
    '...........nNn..',
    '............nn..',
  ],
  relogio: [
    '.....xxxxxx.....',
    '...xxwwwwwwxx...',
    '..xwwwwKwwwwwx..',
    '..xwwwwKwwwwwx..',
    '.xwwwwwKwwwwwwx.',
    '.xwwwwwKwwwwwwx.',
    '.xwKwwwKKKKwKwx.',
    '.xwwwwwwwwwwwwx.',
    '.xwwwwwwwwwwwwx.',
    '..xwwwwwwwwwwx..',
    '..xwwwwKwwwwwx..',
    '...xxwwwwwwxx...',
    '.....xxxxxx.....',
  ],
  coracao: [
    '..rrr....rrr....',
    '.rWrrr..rrrrR...',
    '.rrrrrrrrrrrR...',
    '.rrrrrrrrrrrR...',
    '.rrrrrrrrrrRR...',
    '..rrrrrrrrRR....',
    '...rrrrrrRR.....',
    '....rrrrRR......',
    '.....rrRR.......',
    '......RR........',
  ],
  estrela: [
    '.......y........',
    '......yyy.......',
    '......yyy.......',
    '.yyyyyyyyyyyyy..',
    '..yyyyyyyyyyY...',
    '...yyyyyyyyY....',
    '....yyyyyyY.....',
    '....yyyYyyY.....',
    '...yyyY.YyyY....',
    '...yyY...YyY....',
    '..yY.......YY...',
  ],
  check: [
    '............gg..',
    '...........ggG..',
    '..........ggG...',
    '.........ggG....',
    '..gg....ggG.....',
    '..ggg..ggG......',
    '...ggggggG......',
    '....ggggG.......',
    '.....ggG........',
    '......G.........',
  ],
  xis: [
    '..rr......rr....',
    '..rrr....rrR....',
    '...rrr..rrR.....',
    '....rrrrrR......',
    '.....rrrR.......',
    '....rrrrrR......',
    '...rrrRrrrR.....',
    '..rrrR..rrrR....',
    '..rrR....rrR....',
    '...R......R.....',
  ],
  cadeado: [
    '.....xxxxx......',
    '....x.....x.....',
    '....x.....x.....',
    '....x.....x.....',
    '..aaaaaaaaaaa...',
    '..ayyyyyyyyyA...',
    '..ayyyyKyyyyA...',
    '..ayyyKKKyyyA...',
    '..ayyyyKyyyyA...',
    '..ayyyyKyyyyA...',
    '..ayyyyyyyyyA...',
    '..AAAAAAAAAAA...',
  ],
  som: [
    '......X.........',
    '.....XX......w..',
    '....XsX...w...w.',
    '.XXXssX....w..w.',
    '.XsssX..w..w...w',
    '.XsssX..w..w...w',
    '.XXXssX....w..w.',
    '....XsX...w...w.',
    '.....XX......w..',
    '......X.........',
  ],
  mudo: [
    '......X.........',
    '.....XX.........',
    '....XsX.........',
    '.XXXssX..r...r..',
    '.XsssX....r.r...',
    '.XsssX.....r....',
    '.XXXssX...r.r...',
    '....XsX..r...r..',
    '.....XX.........',
    '......X.........',
  ],
  interfone: [
    '...ttttttttt....',
    '...teeeeeeeT....',
    '...tEEEEEEET....',
    '...teeeeeeeT....',
    '...tEEEEEEET....',
    '...teeeeeeeT....',
    '...ttttttttT....',
    '...ttrrrtttT....',
    '...ttrrrtttT....',
    '...ttttttttT....',
    '...tttyttttT....',
    '...TTTTTTTTT....',
  ],
  mapa: [
    '.pppp.ssss.pppp.',
    '.pppp.ssss.pppp.',
    '.ppbp.ssss.pppp.',
    '.ppbbbsssr.pppp.',
    '.pppp.sbsrrppbp.',
    '.pppp.sbsrr.pbp.',
    '.pppp.sbbbbbbpp.',
    '.pgggpsssspgggp.',
    '.ggggpsssspgggp.',
    '.pppp.ssss.pppp.',
    '.pppp.ssss.pppp.',
    '.sppp.mmmm.sppp.',
  ],
  fila: [
    '.pp...ss...mm.',
    'pwwp.spps.smms',
    'pwwp.spps.smms',
    '.pp...ss...mm.',
    'wwww.pppp.mmmm',
    'wwww.pppp.mmmm',
    'wwww.pppp.mmmm',
  ],
  postit: [
    '..yyyyyyyyyyy...',
    '..yyyyyyyyyyy...',
    '..yYYYYYYYyyy...',
    '..yyyyyyyyyyy...',
    '..yYYYYYYyyyy...',
    '..yyyyyyyyyyy...',
    '..yYYYYYYYYyy...',
    '..yyyyyyyyyyy...',
    '..yYYYYyyyyYY...',
    '..yyyyyyyyYYa...',
    '..yyyyyyyyYa....',
    '..AAAAAAAAa.....',
  ],
  envelope: [
    '.eeeeeeeeeeeeee.',
    '.EeeeeeeeeeeeeE.',
    '.eEeeeeeeeeeeEe.',
    '.eeEeeeeeeeeEee.',
    '.eeeEeeeeeeEeee.',
    '.eeeeEErrEEeeee.',
    '.eeeeeerreeeeee.',
    '.eeeEeeeeeeEeee.',
    '.eeEeeeeeeeeEee.',
    '.eEeeeeeeeeeeEe.',
    '.EEEEEEEEEEEEEE.',
  ],
  bolo: [
    '.......a........',
    '......aya.......',
    '.......a........',
    '.......P........',
    '.......P........',
    '..hhhhhhhhhhhh..',
    '.hHHHHHHHHHHHHh.',
    '.hhhhhhhhhhhhhT.',
    '.hThhThhhThhThT.',
    '.hhhhhhhhhhhhhT.',
    '.hhhhhhhhhhhhTT.',
    '.TTTTTTTTTTTTTT.',
    'ppppppppppppppss',
  ],
  termometro: [
    '.......XX.......',
    '......XwwX......',
    '......XwwX......',
    '......XwwXX.....',
    '......XrrX......',
    '......XrrXX.....',
    '......XrrX......',
    '......XrrXX.....',
    '......XrrX......',
    '.....XrrrrX.....',
    '....XrrWrrrX....',
    '....XrrrrrrX....',
    '.....XrrrrX.....',
    '......XXXX......',
  ],
  gota: [
    '.......b........',
    '......bbb.......',
    '......bbb.......',
    '.....bbbbb......',
    '....bbbbbbb.....',
    '....bubbbbbB....',
    '...bbubbbbbbB...',
    '...bbubbbbbbB...',
    '...bbbubbbbbB...',
    '....bbbbbbbB....',
    '.....BBBBBB.....',
  ],
  raio: [
    '........yyyy....',
    '.......yyyY.....',
    '......yyyY......',
    '.....yyyY.......',
    '....yyyyyyyY....',
    '.......yyyY.....',
    '......yyyY......',
    '.....yyY........',
    '....yyY.........',
    '...yY...........',
  ],
  porta: [
    '...NNNNNNNNNN...',
    '...NnnnnnnnnN...',
    '...NnNNNNNNnN...',
    '...NnNnnnnNnN...',
    '...NnNnnnnNnN...',
    '...NnNNNNNNnN...',
    '...NnnnnnnnyN...',
    '...NnNNNNNNnN...',
    '...NnNnnnnNnN...',
    '...NnNnnnnNnN...',
    '...NnNNNNNNnN...',
    '...NnnnnnnnnN...',
    '..XXXXXXXXXXXX..',
  ],
  prato: [
    'x.x..........x',
    'x.x...ppp...xx',
    'xxx..pwwwp..xx',
    '.x..pwwpwwp.xx',
    '.x..pwpwpwp.xx',
    '.x..pwwpwwp..x',
    '.x...pwwwp...x',
    '.x....ppp....x',
    '.x...........x',
    '.x...........x',
  ],
  nuvem_chuva: [
    '.....pppp.......',
    '...ppwwwwpp.....',
    '..pwwwwwwwwppp..',
    '.pwwwwwwwwwwwwp.',
    '.pwwwwwwwwwwwwp.',
    '..sssssssssssss.',
    '................',
    '...b...b...b....',
    '..b...b...b.....',
    '................',
    '....b...b...b...',
    '...b...b...b....',
  ],
  floco: [
    '.......u........',
    '.....u.u.u......',
    '......uuu.......',
    '..u....u....u...',
    '...u...u...u....',
    'uu..uuuuuuu..uu.',
    '...u...u...u....',
    '..u....u....u...',
    '......uuu.......',
    '.....u.u.u......',
    '.......u........',
  ],
  cruz_vermelha: [
    '.....rrrrr......',
    '.....rrrrr......',
    '.....rrrrr......',
    '.....rrrrr......',
    'rrrrrrrrrrrrrrr.',
    'rrrrrrrrrrrrrrr.',
    'rrrrrrrrrrrrrrr.',
    'rrrrrrrrrrrrrrr.',
    'RRRRRrrrrrRRRRR.',
    '.....rrrrr......',
    '.....rrrrr......',
    '.....rrrrr......',
    '.....RRRRR......',
  ],
  cama_hospital: [
    '...........x....',
    '..x........xww..',
    '..x........xw...',
    '..x........x....',
    '..xww......x....',
    '..xwwwwwwwwwwwx.',
    '..xbbbbbbbbbbbx.',
    '..xxxxxxxxxxxxx.',
    '..x..........x..',
    '..x..........x..',
    '.XxX........XxX.',
    '..X..........X..',
  ],
};

// prettier-ignore
const STATUS_GRIDS: Record<MemberStatus, string[]> = {
  bem: [
    '...gggg...',
    '.gggggggg.',
    '.ggKggKgg.',
    'gggKggKggg',
    'gggggggggg',
    'gKggggggKg',
    'ggKKKKKKgg',
    '.gggggggg.',
    '.GGggggGG.',
    '...GGGG...',
  ],
  fome: [
    '..x....x..',
    '..x.xx.x..',
    '..xxxx.x..',
    '...x...x..',
    'wwwwwwwwww',
    'wppppppppw',
    '.wwwwwwww.',
    '..aaaaaa..',
    '...AAAA...',
  ],
  frio: [
    '....u.....',
    '..u.u.u...',
    '...uuu....',
    'u..u.u..u.',
    '.uuuuuuu..',
    'u..u.u..u.',
    '...uuu....',
    '..u.u.u...',
    '....u.....',
  ],
  doente: [
    '...gggg...',
    '.gggggggg.',
    '.gKKggKKg.',
    'gggggggggg',
    'gggggggggg',
    'ggggKKgggg',
    'gggKggxxwr',
    '.gggggggr.',
    '..GGggGG..',
    '...GGGG...',
  ],
  triste: [
    '...bbbb...',
    '.bbbbbbbb.',
    '.bKbbbbKb.',
    'bbbKbbKbbb',
    'bbbbbbbbbb',
    'bbuKKKKbbb',
    'bbuKbbKbbb',
    '.bbbbbbbb.',
    '..BBbbBB..',
    '...BBBB...',
  ],
  critico: [
    '...rrrr...',
    '.rrrrrrrr.',
    '.rrrWrrrr.',
    'rrrrWrrrrr',
    'rWWWrWrWWW',
    'rrrrrWWrrr',
    'rrrrrrWrrr',
    '.rrrrrrrr.',
    '.RRrrrrRR.',
    '...RRRR...',
  ],
  internado: [
    'wwwwwwwwww',
    'wwwwrrwwww',
    'wwwwrrwwww',
    'wwrrrrrrww',
    'wwrrrrrrww',
    'wwwwrrwwww',
    'wwwwrrwwww',
    'pwwwwwwwwp',
    '.pppppppp.',
  ],
  ausente: [
    '...XXXX...',
    '...X..X...',
    'nnnnnnnnnn',
    'ntttttttTn',
    'ntttttttTn',
    'nnnnnnnnnn',
    'ntttttttTn',
    'ntttttttTn',
    'nNNNNNNNNn',
    '.X......X.',
  ],
  morto: [
    '...KKKK...',
    '..KXKKXK..',
    '..KK..KK..',
    '..KX..KK..',
    '...KKKK...',
    '...KXKK...',
    '..KXKKKK..',
    '.KXK..KKK.',
    'KXK....KKK',
    'KK......KK',
  ],
};

export type IconName = keyof typeof GRIDS;
export const ICON_NAMES = Object.keys(GRIDS) as IconName[];
export const STATUS_ICON_NAMES = Object.keys(STATUS_GRIDS) as MemberStatus[];

/** grade → Pix com contorno e centralização */
function build(rows: string[], size: number, outline: string | null): Pix {
  const src = new Pix(size, size);
  // bounding box
  let w = 0;
  for (const r of rows) w = Math.max(w, r.length);
  const h = rows.length;
  // pinta numa área temporária
  const tmp = new Pix(Math.max(w, 1), Math.max(h, 1));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (!ch || ch === '.' || ch === ' ') continue;
      const c = ICON_PAL[ch];
      if (c) tmp.px(x, y, c);
    }
  // caixa ocupada
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (tmp.get(x, y) >>> 24) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return src;
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const ox = Math.floor((size - bw) / 2) - x0;
  const oy = Math.floor((size - bh) / 2) - y0;
  src.blit(tmp, ox, oy);
  if (outline) src.outline(outline);
  return src;
}

const pixCache = new Map<string, Pix>();

/** Pix do ícone (16×16) — para compor em canvas do jogo. */
export function iconPix(name: IconName | MemberStatus | string, outline = true): Pix {
  const key = name + (outline ? '' : '#n');
  let p = pixCache.get(key);
  if (!p) {
    if (GRIDS[name]) p = build(GRIDS[name], 16, outline ? OUTLINE : null);
    else if ((STATUS_GRIDS as Record<string, string[]>)[name]) {
      // nomes de status (bem, fome, frio...) também funcionam em icon(): 12×12 centrado em 16×16
      p = new Pix(16, 16);
      p.blit(statusIconPix(name as MemberStatus), 2, 2);
    } else p = build(GRIDS.alerta, 16, outline ? OUTLINE : null);
    pixCache.set(key, p);
  }
  return p;
}

/** Pix do ícone de status de familiar (12×12). */
export function statusIconPix(s: MemberStatus): Pix {
  const key = 'st:' + s;
  let p = pixCache.get(key);
  if (!p) {
    // a fita de luto é preta: contorno claro para não sumir nos painéis escuros
    p = build(STATUS_GRIDS[s] ?? STATUS_GRIDS.bem, 12, s === 'morto' ? '#8fa89a' : OUTLINE);
    pixCache.set(key, p);
  }
  return p;
}

const urlCache = new Map<string, string>();

/**
 * dataURL do ícone 16×16 em escala inteira (padrão 2 → 32×32). Aceita também
 * os nomes de status de familiar (bem, fome, frio, doente, triste, critico,
 * internado, ausente, morto), centrados no quadro 16×16.
 */
export function icon(name: IconName | MemberStatus | string, scale = 2): string {
  if (!hasDOM()) return '';
  const key = `${name}@${scale}`;
  let u = urlCache.get(key);
  if (!u) {
    u = iconPix(name).toDataURL(Math.max(1, Math.floor(scale)));
    urlCache.set(key, u);
  }
  return u;
}

/** dataURL do ícone de status (12×12) em escala inteira (padrão 2 → 24×24). */
export function statusIcon(s: MemberStatus, scale = 2): string {
  if (!hasDOM()) return '';
  const key = `st:${s}@${scale}`;
  let u = urlCache.get(key);
  if (!u) {
    u = statusIconPix(s).toDataURL(Math.max(1, Math.floor(scale)));
    urlCache.set(key, u);
  }
  return u;
}

/** Ícone como Sprite (para drawSprite), já com contorno. */
export function iconSprite(name: IconName | string): Sprite {
  const p = iconPix(name);
  // converte Pix → Sprite com paleta indexada
  const pal: Record<string, string | null> = {};
  const rev = new Map<number, string>();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&*+-=?@^_~';
  const rows: string[] = [];
  for (let y = 0; y < p.h; y++) {
    let row = '';
    for (let x = 0; x < p.w; x++) {
      const v = p.get(x, y);
      if (!(v >>> 24)) {
        row += '.';
        continue;
      }
      let ch = rev.get(v);
      if (!ch) {
        ch = chars[rev.size % chars.length];
        rev.set(v, ch);
        const r = v & 255;
        const g = (v >>> 8) & 255;
        const b = (v >>> 16) & 255;
        pal[ch] = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
      }
      row += ch;
    }
    rows.push(row);
  }
  const s: Sprite = { w: p.w, h: p.h, rows, pal };
  void spriteKey;
  return s;
}
