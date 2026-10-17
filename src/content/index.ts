// Registro de conteúdo do jogo.
import type { Content } from '../engine/content-api';
import type { DayDef } from '../engine/types';
import { QUESTIONS, MANUAL, FLEET, fleetForDay, manualUntil, DOCS, NAMES } from './base';
import { GUIDES } from './guides';
import { defaultAnswer } from './defaults';
import { FIELD_CASES } from './field';
import { HOME } from './home-base';
import { ENDINGS, ACHIEVEMENTS } from './endings';
import { BANK } from './bank/index';
import { SIMONE } from './simone/index';
import { buildVideo, remoteLines, VIDEO_FROM_DAY, VIDEO_CREDITS, VIDEO_INTRO } from './video';
import * as M01 from './days/d01';
import * as M02 from './days/d02';
import * as M03 from './days/d03';
import * as M04 from './days/d04';
import * as M05 from './days/d05';
import * as M06 from './days/d06';
import * as M07 from './days/d07';
import * as M08 from './days/d08';
import * as M09 from './days/d09';
import * as M10 from './days/d10';
import * as M11 from './days/d11';
import * as M12 from './days/d12';
import * as M13 from './days/d13';
import * as M14 from './days/d14';
import * as M15 from './days/d15';
import * as M16 from './days/d16';
import * as M17 from './days/d17';
import * as M18 from './days/d18';
import * as M19 from './days/d19';
import * as M20 from './days/d20';

import type { DeskDoc, GuideScript } from '../engine/content-api';

type DayModule = { DAY: DayDef; DOCS_EXTRA?: Record<string, DeskDoc>; GUIDES_EXTRA?: Record<string, GuideScript> };
const MODULES: DayModule[] = [M01, M02, M03, M04, M05, M06, M07, M08, M09, M10, M11, M12, M13, M14, M15, M16, M17, M18, M19, M20];
const DAYS: Record<number, DayDef> = {};
const ALL_DOCS: Record<string, DeskDoc> = { ...DOCS };
const ALL_GUIDES: Record<string, GuideScript> = { ...GUIDES };
for (const m of MODULES) {
  DAYS[m.DAY.day] = m.DAY;
  Object.assign(ALL_DOCS, m.DOCS_EXTRA ?? {});
  Object.assign(ALL_GUIDES, m.GUIDES_EXTRA ?? {});
}

export const CONTENT: Content = {
  version: '1.0.0',
  days: DAYS,
  simone: SIMONE,
  questions: QUESTIONS,
  manual: MANUAL,
  fleet: FLEET,
  guides: ALL_GUIDES,
  bank: BANK,
  endings: ENDINGS,
  achievements: ACHIEVEMENTS,
  home: HOME,
  docs: ALL_DOCS,
  defaults: defaultAnswer,
  field: { cases: FIELD_CASES },
  video: { fromDay: VIDEO_FROM_DAY, credits: VIDEO_CREDITS, build: buildVideo, remoteLines: (call) => remoteLines(call), intro: VIDEO_INTRO },
  names: NAMES,
  fleetForDay,
  manualUntil,
};
