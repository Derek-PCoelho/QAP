// Atalho do cliente para criar uma partida do Plantão Infinito.
import { Game } from '../engine/game';
import type { Content } from '../engine/content-api';
import type { Settings } from './settings';

export function startInfinite(c: Content, seedLabel: string, _s: Settings): Game {
  return Game.createInfinite(c, seedLabel);
}

export function todaySeed(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
