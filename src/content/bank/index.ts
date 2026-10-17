// Banco de ligações variáveis (mesma abertura, verdades diferentes) — usado nas
// ligações não-âncora com "ligações variáveis" ativado e no Plantão Infinito.
// Cada arquivo agrupa modelos por tema; o kit (./kit.ts) explica as regras de autoria.
// Validação: tests/bank.test.ts.
import type { TemplateDef } from '../../engine/content-api';
import { NEURO } from './neuro';
import { IDOSO } from './idoso';
import { CARDIO } from './cardio';
import { RESP } from './resp';
import { TRAUMA } from './trauma';
import { PEDIATRIA } from './pediatria';
import { OBSTETRICIA } from './obstetricia';
import { DENGUE } from './dengue';
import { PSIQ } from './psiq';
import { CLINICO } from './clinico';
import { TROTES } from './trotes';
import { FOLGADOS } from './folgados';

// 1.1: os folgados (etiqueta `folgado`) entram no fim: o sorteio dos outros modelos não muda
export const BANK: TemplateDef[] = [...NEURO, ...IDOSO, ...CARDIO, ...RESP, ...TRAUMA, ...PEDIATRIA, ...OBSTETRICIA, ...DENGUE, ...PSIQ, ...CLINICO, ...TROTES, ...FOLGADOS];
