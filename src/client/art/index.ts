// =============================================================================
// QAP — Emergency Dispatch — módulo de arte (pixel art 100% gerada em código).
// Importar é seguro em Node (nada toca o DOM no topo dos módulos); funções que
// devolvem dataURL retornam '' fora do navegador; renderX() devolvem Pix puro.
// =============================================================================
export * from './palette';
export * from './pix';
export * from './font';
export * from './sprite';
export * from './portraits';
/** rostos de paciente na videochamada (close 64×64) */
export * from './faces';
export * from './icons';
export * from './mapRender';
export * from './figures';
/** Ozzy, o lulu da família (corpo inteiro, poses animadas) */
export * from './dog';
/** adesivos do Ozzy para o quadro de cortiça */
export * from './stickers';
export * from './scenes';
export * from './newsPhotos';
export * from './endingArt';
/** nome do protagonista desenhado na arte (crachá) — padrões Thiago/Camille Moura */
export * from './names';
/** conserto de legibilidade das fontes web (5/S, Z/2/8, B/8 na Pixelify; A gótico na Jacquard) */
export * from './fontFix';
/** objetos/móveis desenháveis num Pix (uso avançado) */
export * as props from './props';

import { CENTRAL, HOME, TRIAGE, HOME_COLD, SKIN, HAIR, UNIT_STATUS_COLOR, MEMBER_STATUS_COLOR, mix, blendHome, cssVars, cssVarsText, gradeHome, homeGrader } from './palette';
import { spriteCanvas, spriteURL, drawSprite, seeded } from './sprite';
import { portrait, portraitPix, CHARACTERS, CHARACTER_IDS, MOODS, characterFor } from './portraits';
import { patientFacePix } from './faces';
import { icon, statusIcon, iconPix, statusIconPix, ICON_NAMES, STATUS_ICON_NAMES } from './icons';
import { drawCityMap, renderCityMap, mapPixelSize, tileFromPixel, landmarkTile, unitStatusColor } from './mapRender';
import { drawScene, renderScene, objectRect, objectsFor, OBJECT_RECTS, SCENE_BGS, SCENE_OBJECTS, SCENE_W, SCENE_H } from './scenes';
import { newsPhoto, newsPhotoPix, NEWS_KINDS } from './newsPhotos';
import { drawEnding, renderEnding, ENDING_KINDS, MURAL_FRAMES } from './endingArt';
import { dogPix, drawDog, DOG_POSES } from './dog';
import { drawText, textWidth } from './font';

/** API agrupada (o mesmo que os exports nomeados). */
export const art = {
  // paletas
  CENTRAL,
  HOME,
  HOME_COLD,
  TRIAGE,
  SKIN,
  HAIR,
  UNIT_STATUS_COLOR,
  MEMBER_STATUS_COLOR,
  mix,
  blendHome,
  cssVars,
  cssVarsText,
  gradeHome,
  homeGrader,
  // sprites
  spriteCanvas,
  spriteURL,
  drawSprite,
  seeded,
  // retratos
  portrait,
  portraitPix,
  CHARACTERS,
  CHARACTER_IDS,
  MOODS,
  characterFor,
  // pacientes (videochamada)
  patientFacePix,
  // ícones
  icon,
  statusIcon,
  iconPix,
  statusIconPix,
  ICON_NAMES,
  STATUS_ICON_NAMES,
  // mapa
  drawCityMap,
  renderCityMap,
  mapPixelSize,
  tileFromPixel,
  landmarkTile,
  unitStatusColor,
  // cenas
  drawScene,
  renderScene,
  objectRect,
  objectsFor,
  OBJECT_RECTS,
  SCENE_BGS,
  SCENE_OBJECTS,
  SCENE_W,
  SCENE_H,
  // Ozzy
  dogPix,
  drawDog,
  DOG_POSES,
  // jornal
  newsPhoto,
  newsPhotoPix,
  NEWS_KINDS,
  // finais
  drawEnding,
  renderEnding,
  ENDING_KINDS,
  MURAL_FRAMES,
  // texto em pixel
  drawText,
  textWidth,
};

export default art;
