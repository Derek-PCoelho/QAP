import { portrait, type CharacterId } from '../art';
import { spouseName, SON_NAME } from '../../engine/text';

const MAP: Record<string, string> = {
  LUCIA: 'LUCIA', LÚCIA: 'LUCIA', ALEX: 'LUCIA', DAVI: 'DAVI', LIAM: 'DAVI', ZELIA: 'ZELIA', ZÉLIA: 'ZELIA', SIMONE: 'SIMONE', PEIXOTO: 'PEIXOTO', 'DR. PEIXOTO': 'PEIXOTO',
  HENRIQUE: 'HENRIQUE', BENE: 'BENE', BENÉ: 'BENE', CARLA: 'CARLA', ARLINDO: 'ARLINDO', ASSESSOR: 'ASSESSOR', CIDA: 'CIDA', JAIRO: 'JAIRO',
  NOGUEIRA: 'NOGUEIRA', JULIANA: 'JULIANA', ROSANGELA: 'ROSANGELA', ROSÂNGELA: 'ROSANGELA', ANTONIO: 'ANTONIO', ANTÔNIO: 'ANTONIO',
  BIEL: 'BIEL', WESLEY: 'WESLEY', MARCIA: 'MARCIA', MÁRCIA: 'MARCIA', PAULA: 'PAULA', 'DRA. PAULA': 'PAULA', PLANTONISTA: 'PLANTONISTA',
};

export function speakerId(who: string, gender: 'M' | 'F'): CharacterId | null {
  if (who === 'EU') return (gender === 'M' ? 'EU_M' : 'EU_F') as CharacterId;
  const id = MAP[who.toUpperCase()];
  // o cônjuge fala com o id LUCIA; com a protagonista mulher, o retrato é o do Alex
  if (id === 'LUCIA' && gender === 'F') return 'ALEX' as CharacterId;
  return (id as CharacterId) ?? null;
}

/** Nome exibido de quem fala: os ids internos da família viram nomes (o cônjuge depende do gênero). */
export function speakerName(who: string, gender: 'M' | 'F'): string {
  switch (who) {
    case 'LUCIA':
      return spouseName(gender);
    case 'DAVI':
      return SON_NAME;
    case 'ZELIA':
      return 'Dona Zélia';
    case 'EU':
      return 'Você';
    case 'NARRADOR':
      return '';
  }
  return who;
}

export function Portrait({ id, mood = 'neutro', size = 128, blend = 0 }: { id: CharacterId; mood?: string; size?: number; blend?: number }) {
  let src = '';
  try {
    src = portrait(id, mood as never, { blend });
  } catch {
    src = '';
  }
  // retrato nativo 64×64: só múltiplos inteiros de 64 mantêm o pixel nítido
  const px = Math.max(64, Math.round(size / 64) * 64);
  return src ? <img className="portrait" src={src} width={px} height={px} alt="" draggable={false} /> : <div className="portrait empty" style={{ width: px, height: px }} />;
}
