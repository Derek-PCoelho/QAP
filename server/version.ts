// Versão do servidor = versão do package.json. O import nomeado faz o esbuild
// embutir só este campo no bundle (e não o package.json inteiro).
import { version } from '../package.json';

export const VERSION: string = typeof version === 'string' ? version : '0.0.0';
