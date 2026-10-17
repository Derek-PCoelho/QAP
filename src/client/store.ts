// Estado do cliente: jogo atual, telas, laço de tempo, áudio, saves e telemetria.
import { useSyncExternalStore } from 'react';
import { Game, type GameEvent } from '../engine/game';
import { SaveError } from '../engine/save-check';
import { setActiveProtagonist } from '../engine/text';
import { CONTENT } from '../content/index';
import type { Difficulty, Gender, Mode } from '../engine/types';
import { audio } from './audio';
import { api } from './api';
import {
  loadSettings, saveSettings, loadAchievements, saveAchievements, loadMeta, saveMeta, writeLocalSave, readLocalSave,
  listLocalSaves, type Settings, type Meta, type SaveSummary, type TrashEntry,
  backupLocalSave, trashLocalSave, savedInfo, replacingLosesProgress, listTrash, readTrash, purgeTrash, pruneTrash,
} from './settings';
import { startInfinite } from './infinite';
import { native } from './native';

/**
 * Facilidades de teste (?speed, ?dia, ?simone e window.__store). Definido no build (vite.config.ts e
 * vite.standalone.config.ts): a versão final do programa de desktop sai com false, e o código delas
 * nem entra no arquivo.
 */
declare const __QAP_DEV__: boolean;
const PARAMS = __QAP_DEV__ && typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
/** ?speed=N acelera o relógio (testes); ?dia=N começa o novo jogo nesse dia */
const DEV_SPEED = __QAP_DEV__ ? Math.max(0.1, Math.min(60, Number(PARAMS.get('speed')) || 1)) : 1;
const DEV_DAY = __QAP_DEV__ ? Number(PARAMS.get('dia')) || undefined : undefined;

export type Screen = 'titulo' | 'novo' | 'carregar' | 'opcoes' | 'conquistas' | 'creditos' | 'jogo' | 'ranking' | 'simone_novo' | 'como_jogar';
/** ?simone=1 libera a campanha 2 sem terminar a primeira (testes) */
export const DEV_SIMONE = __QAP_DEV__ && PARAMS.get('simone') === '1';

export interface UiToast {
  id: number;
  text: string;
  kind: 'bom' | 'ruim' | 'info' | 'dinheiro';
}

class Store {
  game: Game | null = null;
  screen: Screen = 'titulo';
  settings: Settings = loadSettings();
  achievements: string[] = loadAchievements();
  meta: Meta = loadMeta();
  paused = false;
  version = 0;
  serverOk = false;
  toasts: UiToast[] = [];
  private toastSeq = 0;
  private listeners = new Set<() => void>();
  private lastNotify = 0;
  private pendingNotify = false;
  private raf = 0;
  private lastT = 0;
  private unsubGame?: () => void;
  private started = false;
  private lastRingState = false;
  private lastActive: string | undefined;
  private prankQuick = 0;

  // ------------------------------------------------------------------ assinatura
  subscribe = (f: () => void) => {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  };
  getVersion = () => this.version;

  notify(immediate = true) {
    const now = performance.now();
    if (!immediate && now - this.lastNotify < 66) {
      this.pendingNotify = true;
      return;
    }
    this.lastNotify = now;
    this.pendingNotify = false;
    this.version++;
    for (const l of this.listeners) l();
  }

  // ------------------------------------------------------------------ início
  init() {
    if (this.started) return;
    this.started = true;
    // cópias guardadas de saves: as que passaram de 30 dias saem
    try {
      pruneTrash();
    } catch {
      /* armazenamento indisponível */
    }
    this.applyVolumes();
    if (this.settings.profileId) api.setProfile(this.settings.profileId);
    api.available().then((ok) => {
      this.serverOk = ok;
      if (ok && !this.settings.profileId) {
        api.createProfile(this.settings.playerName || 'Regulador').then((p) => {
          if (p) {
            this.settings.profileId = p.id;
            saveSettings(this.settings);
          }
        });
      }
      this.notify();
    });
    const loop = (t: number) => {
      const dt = this.lastT ? Math.min(100, t - this.lastT) : 16;
      this.lastT = t;
      try {
        this.frame(dt);
      } catch (e) {
        // um erro no relógio do jogo não pode parar o laço (a tela congelaria): registra e pausa
        this.crashed(e);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    window.addEventListener('beforeunload', () => this.saveAuto());
    const n = native();
    if (n) {
      // desktop: a tela cheia mudou por fora (F11, Alt+Enter, botão verde do Mac) → guarda a preferência
      n.onFullscreenChange?.((on) => {
        if (this.settings.fullscreen !== on) this.updateSettings({ fullscreen: on });
      });
      // desktop: trocar de janela (Alt+Tab, Cmd+Tab) pausa o plantão e a ambulância
      window.addEventListener('blur', () => this.pauseOnBlur());
    }
  }

  private pauseOnBlur() {
    const g = this.game;
    if (!g || this.screen !== 'jogo' || this.paused) return;
    if (g.shift?.sh.guideCallId) return; // orientação por telefone em curso: os minijogos têm relógio próprio
    const ph = g.st.phase;
    if (ph === 'plantao' || (ph === 'casa' && g.st.home?.step === 'intervencao')) this.pause(true);
  }

  private frame(dt: number) {
    const g = this.game;
    if (g && this.screen === 'jogo' && !this.paused) {
      if (g.st.phase === 'plantao') {
        g.tick(dt * DEV_SPEED * (this.settings.ritmo || 1));
        this.syncCentralAudio();
        this.notify(false);
      }
    }
    if (this.pendingNotify && performance.now() - this.lastNotify > 66) this.notify();
  }

  // ------------------------------------------------------------------ preferências
  updateSettings(p: Partial<Settings>) {
    this.settings = { ...this.settings, ...p };
    saveSettings(this.settings);
    this.applyVolumes();
    this.notify();
  }
  applyVolumes() {
    const s = this.settings;
    audio.setVolumes({ master: s.master, music: s.music, sfx: s.sfx, ambient: s.ambient, voice: s.voice });
  }

  setScreen(s: Screen) {
    this.screen = s;
    if (s !== 'jogo') {
      audio.stopCentralHum();
      audio.ringLoop(false, 0);
      audio.setAmbient([]);
    }
    if (s === 'titulo') audio.playTheme('titulo');
    this.notify();
  }

  toast(text: string, kind: UiToast['kind'] = 'info') {
    this.toasts.push({ id: ++this.toastSeq, text, kind });
    if (this.toasts.length > 6) this.toasts.shift();
    this.notify();
  }

  // ------------------------------------------------------------------ jogos
  newGame(o: { gender: Gender; difficulty: Difficulty; variable: boolean; mode?: Mode; seed?: number; startDay?: number; name?: string }) {
    audio.stopTheme();
    const g = Game.create(CONTENT, { gender: o.gender, difficulty: o.difficulty, variable: o.variable, mode: o.mode ?? 'campanha', seed: o.seed, startDay: o.startDay ?? DEV_DAY, name: o.name });
    this.attach(g);
    if ((o.mode ?? 'campanha') === 'campanha') {
      api.track('campaign_start', { difficulty: o.difficulty, gender: o.gender, variable: o.variable, first: !this.meta.firstCampaignStarted });
      this.meta.firstCampaignStarted = true;
      saveMeta(this.meta);
    }
    this.paused = false;
    this.setScreen('jogo');
    this.saveAuto();
  }

  newSimone(o: { gender: Gender; difficulty: Difficulty }) {
    audio.stopTheme();
    const g = Game.createSimone(CONTENT, { gender: o.gender, difficulty: o.difficulty, startDay: DEV_DAY });
    this.attach(g);
    api.track('simone_start', { difficulty: o.difficulty });
    this.paused = false;
    this.setScreen('jogo');
    this.saveAuto();
  }

  simoneUnlocked(): boolean {
    return DEV_SIMONE || !!native()?.testBuild || this.meta.simoneUnlocked || this.meta.campaignsFinished > 0;
  }

  newInfinite(seedLabel: string) {
    audio.stopTheme();
    const g = startInfinite(CONTENT, seedLabel, this.settings);
    this.attach(g);
    this.paused = false;
    this.setScreen('jogo');
  }

  continueGame(slot = 'auto'): boolean {
    const raw = readLocalSave(slot);
    if (!raw) return false;
    try {
      const g = Game.load(CONTENT, raw);
      this.attach(g);
      this.paused = false;
      audio.stopTheme();
      this.setScreen('jogo');
      return true;
    } catch (e) {
      // o detalhe vai para o console (no programa de desktop, para o erros.log)
      if (e instanceof SaveError) console.error(`[save ${slot}] ${e.detail}`);
      this.toast((e as Error).message, 'ruim');
      return false;
    }
  }

  /** espaços em que já avisamos que não deu para guardar a cópia (um aviso por espaço) */
  private backupWarned = new Set<string>();
  private lastCrash = 0;
  /** erro durante o jogo: registra, pausa e avisa (no máximo um aviso a cada 10 s) */
  crashed(e: unknown) {
    const now = Date.now();
    if (now - this.lastCrash < 10_000) return;
    this.lastCrash = now;
    console.error('[jogo] erro:', e instanceof Error ? e.stack || e.message : String(e));
    if (this.game && this.screen === 'jogo') this.paused = true;
    this.toast('Algo deu errado e o jogo foi pausado. Se repetir, volte ao título e carregue o último save.', 'ruim');
    this.notify();
  }

  /** volta ao título sem gravar (depois de um erro, para não salvar um estado estragado por cima do save bom) */
  recoverToTitle() {
    this.unsubGame?.();
    this.game = null;
    setActiveProtagonist(null);
    this.paused = false;
    try {
      audio.stopAll();
    } catch {
      /* áudio indisponível */
    }
    this.setScreen('titulo');
  }

  async loadFromServer(slot: string): Promise<boolean> {
    if (!this.serverOk || !this.settings.profileId) return false;
    const s = await api.getSave(this.settings.profileId, slot);
    if (!s?.data) return false;
    writeLocalSave(slot, s.data, { ...(s.summary as SaveSummary), slot, savedAt: Date.now() });
    return this.continueGame(slot);
  }

  saves(): SaveSummary[] {
    return listLocalSaves();
  }

  /** apagar um save: uma cópia fica em "Saves guardados" (Carregar) por 30 dias */
  deleteSave(slot: string) {
    if (!trashLocalSave(slot, 'apagado por você')) {
      this.toast('Não consegui guardar uma cópia, então o save não foi apagado.', 'ruim');
      return;
    }
    if (this.serverOk && this.settings.profileId) api.deleteSave(this.settings.profileId, slot);
    this.toast('Save apagado. Uma cópia fica em "Saves guardados" por 30 dias.', 'info');
    this.notify();
  }

  /** cópias de saves apagados ou substituídos (mais novas primeiro) */
  trash(): TrashEntry[] {
    return listTrash();
  }

  /** carrega uma cópia guardada; ela volta a ser o salvamento automático (o que estava lá também é guardado) */
  restoreTrash(id: string): boolean {
    const raw = readTrash(id);
    if (!raw) return false;
    try {
      const g = Game.load(CONTENT, raw);
      this.attach(g);
      this.paused = false;
      audio.stopTheme();
      this.setScreen('jogo');
      this.saveAuto();
      this.toast('Save recuperado: agora ele é o "Continuar".', 'bom');
      return true;
    } catch (e) {
      if (e instanceof SaveError) console.error(`[save guardado ${id}] ${e.detail}`);
      this.toast((e as Error).message, 'ruim');
      return false;
    }
  }

  /** apaga de vez uma cópia guardada */
  purgeTrash(id: string) {
    purgeTrash(id);
    this.notify();
  }

  saveTo(slot: string) {
    const g = this.game;
    if (!g || (g.st.mode !== 'campanha' && g.st.mode !== 'simone')) return;
    const data = g.serialize();
    // o resumo descreve o que o save guarda: no meio de um trecho (plantão, Intervenção, cena) é o começo dele
    const st = JSON.parse(data) as typeof g.st;
    // outra campanha, um save ilegível ou um ponto mais adiantado desta campanha vai ser substituído:
    // antes, uma cópia vai para "Saves guardados"; sem a cópia, não grava por cima
    const loses = replacingLosesProgress(savedInfo(slot), { id: st.id, playSeconds: st.playSeconds ?? 0 });
    if (loses && !backupLocalSave(slot, loses)) {
      if (!this.backupWarned.has(slot)) {
        this.backupWarned.add(slot);
        this.toast('Sem espaço para guardar uma cópia do save anterior: ele não foi substituído.', 'ruim');
      }
      return;
    }
    const summary: SaveSummary = {
      slot,
      savedAt: Date.now(),
      day: st.day,
      phase: st.phase === 'plantao' ? 'jornal' : st.phase,
      mode: st.mode,
      money: st.money,
      gender: st.gender,
      difficulty: st.difficulty,
      gameId: st.id,
      playSeconds: st.playSeconds ?? 0,
      ...(st.name ? { name: st.name } : {}),
    };
    writeLocalSave(slot, data, summary);
    if (this.serverOk && this.settings.profileId) api.putSave(this.settings.profileId, slot, data, summary);
  }

  saveAuto() {
    this.syncAchievements();
    const g = this.game;
    if (!g || (g.st.mode !== 'campanha' && g.st.mode !== 'simone')) return;
    const pre = g.st.mode === 'simone' ? 'simone_' : '';
    if (g.st.phase === 'gameover' || (g.st.phase === 'final' && g.st.ending)) {
      // a campanha acabou: o "Continuar" some, mas o último salvamento automático fica guardado
      trashLocalSave(pre + 'auto', g.st.phase === 'gameover' ? 'a campanha acabou (fim de jogo)' : 'a campanha chegou ao final');
      return;
    }
    this.saveTo(pre + 'auto');
    if (g.st.phase === 'jornal') this.saveTo(pre + 'dia');
  }

  quitToTitle() {
    this.saveAuto();
    this.unsubGame?.();
    this.game = null;
    setActiveProtagonist(null);
    this.paused = false;
    audio.stopAll();
    this.setScreen('titulo');
  }

  private attach(g: Game) {
    this.unsubGame?.();
    this.game = g;
    setActiveProtagonist(g.st.mode === 'simone' ? g.st.shadow ?? g.st : g.st);
    const u1 = g.subscribe(() => this.notify(false));
    const u2 = g.onEvent((e) => this.onGameEvent(e));
    this.unsubGame = () => {
      u1();
      u2();
    };
    this.syncPhaseAudio();
  }

  // ------------------------------------------------------------------ eventos do jogo
  private onGameEvent(e: GameEvent) {
    const g = this.game;
    if (!g) return;
    switch (e.type) {
      case 'phase':
        this.syncAchievements();
        this.syncPhaseAudio();
        if (e.phase === 'relatorio') this.onReport();
        if (e.phase === 'final' || e.phase === 'gameover') this.onFinished();
        this.notify();
        return;
      case 'save':
        this.saveAuto();
        return;
      case 'telemetry':
        api.track(e.name, e.data);
        return;
      case 'achievement':
        this.unlockAchievement(e.id);
        return;
      case 'ring':
        audio.ringOnce(g.st.day / 20);
        return;
      case 'answer': {
        const sh = g.shift;
        if (!sh) return;
        const call = sh.sh.calls[e.callId];
        const def = call ? sh.defOf(call) : undefined;
        audio.sfx('pickup');
        audio.setAmbient(def?.amb ?? [], 0.8);
        return;
      }
      case 'radio':
        if (e.msg.from !== 'VOCÊ' && e.msg.from !== 'SISTEMA') audio.radio(e.msg.text, e.msg.from.includes('BENÉ') ? 'bene' : 'radio');
        return;
      case 'pass':
        return;
      case 'stamp': {
        audio.sfx('stamp');
        if (g.st.mode === 'simone') return;
        const sh = g.shift;
        const call = sh?.sh.calls[e.callId];
        if (sh && call) {
          api.track('call_time', { seconds: Math.round(call.realSec), day: g.st.day });
          const t = sh.truthOf(call);
          if (e.resource === 'TROTE' && t.sev === 'trote' && call.asked.length <= 1) {
            this.prankQuick++;
            if (this.prankQuick >= 10) g.eff().achievement('ouvido_absoluto');
          }
        }
        return;
      }
      case 'penalty':
        audio.sfx(e.kind === 'advertencia' ? 'warning' : 'note');
        return;
      case 'money':
        if (e.amount > 0) audio.sfx('money');
        return;
      case 'insight':
        audio.sfx(e.ok ? 'insight' : 'wrong');
        return;
      case 'death':
        audio.sfx('death');
        return;
      case 'saved':
        audio.sfx('saved');
        return;
      case 'modal':
        audio.sfx('interfone');
        return;
      case 'phantom':
        audio.ringOnce(Math.min(1, g.st.day / 20 + 0.2), { phantom: true });
        return;
      case 'gameover':
        audio.ringLoop(false, 0);
        return;
      default:
        return;
    }
  }

  private onReport() {
    const g = this.game;
    if (!g) return;
    const st = g.st;
    if (st.mode !== 'campanha') {
      this.saveAuto();
      return;
    }
    if (st.day === 9) {
      api.track('d9_choice', {
        scenario: st.flags['bombinha'] ? 'M' : 'G',
        davi: String(st.flags['d9_davi'] ?? 'NONE'),
        marcia: String(st.flags['d9_marcia'] ?? 'NONE'),
      });
      if (st.flags['rendezvous_d9']) api.track('rendezvous', { day: 9 });
    }
    if (st.day === 19) api.track('cida_d19', { recognized: st.keys.cida === 'salvo' });
    this.saveAuto();
  }

  private onFinished() {
    const g = this.game;
    if (!g) return;
    for (const a of g.st.achievements) this.unlockAchievement(a, true);
    if (g.st.mode === 'campanha' && g.st.ending) {
      this.meta.campaignsFinished++;
      this.meta.endings = Array.from(new Set([...this.meta.endings, g.st.ending.kind]));
      this.meta.simoneUnlocked = true;
      this.meta.lastGender = g.st.gender;
      saveMeta(this.meta);
    }
    this.saveAuto();
  }

  /**
   * Conquistas ganhas no plantão ou em casa (ShiftSim/HomeSim) só entram no estado da partida:
   * a mesa e a casa já mostram o próprio aviso. Copia para a lista global, sem repetir o aviso.
   * Antes isso só acontecia no fim da campanha (ou no game over): quem saía antes perdia as conquistas.
   */
  private syncAchievements() {
    const g = this.game;
    if (!g) return;
    for (const a of g.st.achievements) this.unlockAchievement(a, true);
  }

  /** recorde do Plantão Infinito: fica no meta, que sobrevive a fechar o jogo */
  recordInfinite(score: number) {
    if (!(score > this.meta.infiniteBest)) return;
    this.meta.infiniteBest = score;
    saveMeta(this.meta);
  }

  unlockAchievement(id: string, silent = false) {
    if (this.achievements.includes(id)) return;
    this.achievements.push(id);
    saveAchievements(this.achievements);
    if (!silent) {
      const a = CONTENT.achievements.find((x) => x.id === id);
      audio.sfx('achievement');
      this.toast(`Conquista: ${a?.name ?? id}`, 'bom');
    }
  }

  // ------------------------------------------------------------------ áudio por fase
  syncPhaseAudio() {
    const g = this.game;
    if (!g) return;
    const p = g.st.phase;
    if (p === 'plantao') {
      audio.stopHomeMusic();
      audio.stopTheme();
      audio.startCentralHum();
    } else {
      audio.stopCentralHum();
      audio.ringLoop(false, 0);
      audio.setAmbient([]);
      this.lastRingState = false;
    }
    if (p === 'casa') audio.startHomeMusic(g.st.vars.lacos / 10, g.st.vars.desgaste);
    else audio.stopHomeMusic();
    if (p === 'jornal') audio.playTheme('jornal');
    if (p === 'final') {
      const k = g.st.ending?.kind;
      audio.playTheme(k === 'bom' ? 'final_bom' : k === 'ruim' ? 'final_ruim' : 'final_normal');
    }
    if (p === 'gameover') audio.playTheme('gameover');
  }

  private syncCentralAudio() {
    const g = this.game;
    const sh = g?.shift;
    if (!g || !sh) return;
    const waiting = sh.queue().some((c) => c.status === 'fila');
    const ring = waiting && !sh.sh.activeId && !sh.sh.ended;
    if (ring !== this.lastRingState) {
      audio.ringLoop(ring, g.st.day / 20);
      this.lastRingState = ring;
    }
    if (this.lastActive !== sh.sh.activeId) {
      this.lastActive = sh.sh.activeId;
      if (!sh.sh.activeId) audio.setAmbient([]);
    }
  }

  pause(p: boolean) {
    // orientação por telefone em curso (RCP, respiração, roteiros) não pausa: os minijogos têm relógio próprio
    if (p && this.game?.shift?.sh.guideCallId) {
      this.game.shift.toast('Termine a orientação por telefone antes de pausar.', 'info');
      this.notify();
      return;
    }
    this.paused = p;
    if (p) audio.ringLoop(false, 0);
    this.lastRingState = false;
    this.notify();
  }
}

export const store = new Store();
// testes automáticos e depuração (fora da versão final)
if (__QAP_DEV__ && typeof window !== 'undefined') (window as unknown as { __store: Store }).__store = store;

export function useStore(): Store {
  useSyncExternalStore(store.subscribe, store.getVersion);
  return store;
}
