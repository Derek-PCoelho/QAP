// Videochamada de averiguação (Programa VER): regras do motor e cena gerada.
import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/index';
import { Game } from '../src/engine/game';
import { buildVideo } from '../src/content/video';
import { FIELD_CASES } from '../src/content/field';
import { newGameState, makeCtx } from '../src/engine/state';
import { buildGeneratedCall } from '../src/engine/generator';
import { renderVideoFrame, VIDEO_W } from '../src/client/art/video';
import { PLACES as DRAWN_PLACES } from '../src/client/art/videoPlace';
import type { CallDef, GenParams, TruthDef, VideoFocus, VideoScene } from '../src/engine/types';

function shiftOn(day: number, seed = 11) {
  const g = Game.create(CONTENT, { gender: 'F', difficulty: 'padrao', seed, startDay: day });
  g.newspaper();
  g.beginShift();
  const sh = g.shift!;
  for (const m of [...sh.sh.modals]) sh.ackModal(m.id, m.options?.[0]?.id);
  return { g, sh };
}

function answerFirst(g: Game, pred: (defId: string) => boolean) {
  const sh = g.shift!;
  for (let i = 0; i < 6000; i++) {
    if (g.scene) {
      const ch = g.scene.choices().filter((x) => !x.disabled);
      if (ch.length) g.sceneChoose(ch[0].idx);
      else g.sceneContinue();
      continue;
    }
    for (const m of [...sh.sh.modals]) sh.ackModal(m.id, m.options?.[0]?.id);
    const q = sh.queue().find((c) => pred(c.def));
    if (q) {
      sh.answer(q.id);
      return sh.active()!;
    }
    g.tick(250);
  }
  throw new Error('ligação não chegou');
}

describe('videochamada', () => {
  it('não existe antes do dia do piloto nem na campanha da Simone', () => {
    const { sh } = shiftOn(2);
    expect(sh.videoView().enabled).toBe(false);
    expect(sh.videoBudget().credits).toBe(0);
  });

  it('no dia do piloto: aviso, franquia de 3 e fluxo completo', () => {
    const g = Game.create(CONTENT, { gender: 'F', difficulty: 'padrao', seed: 5, startDay: 3 });
    g.newspaper();
    g.beginShift();
    const sh = g.shift!;
    // o aviso chega no primeiro minuto, depois da passagem de turno
    for (let i = 0; i < 400 && !sh.sh.modals.some((m) => /Programa VER/.test(m.text)); i++) {
      if (g.scene) {
        const ch = g.scene.choices().filter((x) => !x.disabled);
        if (ch.length) g.sceneChoose(ch[0].idx);
        else g.sceneContinue();
      } else g.tick(250);
    }
    expect(sh.sh.modals.some((m) => /Programa VER/.test(m.text))).toBe(true);
    for (const m of [...sh.sh.modals]) sh.ackModal(m.id);
    expect(sh.videoBudget().credits).toBe(3);
    const call = answerFirst(g, (id) => id === 'd03_antonio');
    const v0 = sh.videoView();
    expect(v0.enabled).toBe(true);
    expect(v0.canStart).toBe(true);
    const t0 = sh.sh.time;
    const r = sh.startVideo();
    expect(['conectou', 'recusou', 'remoto']).toContain(r);
    expect(sh.sh.time).toBeGreaterThan(t0); // pedir custa tempo
    if (r === 'conectou') {
      expect(sh.videoBudget().credits).toBe(2);
      const view = sh.videoView();
      expect(view.video?.state).toBe('ativo');
      expect(view.spots.length).toBeGreaterThan(1);
      const t1 = sh.sh.time;
      expect(sh.videoLook(view.spots[0].id)).toBe(true);
      expect(sh.sh.time).toBeGreaterThan(t1);
      expect(call.lines.some((l) => l.kind === 'video')).toBe(true);
      // carimbar encerra o vídeo
      sh.stamp({ color: 'vermelho', resource: 'USA', support: [] });
      expect(call.video?.state).toBe('encerrado');
    }
  });

  it('pôr em espera encerra o vídeo', () => {
    const { g, sh } = shiftOn(3, 21);
    const call = answerFirst(g, () => true);
    const r = sh.startVideo();
    if (r === 'conectou') {
      sh.hold();
      expect(call.video?.state).toBe('encerrado');
    }
  });

  it('franquia acaba', () => {
    const { g, sh } = shiftOn(5, 3);
    sh.videoBudget().credits = 0;
    answerFirst(g, () => true);
    expect(sh.videoView().canStart).toBe(false);
    expect(sh.startVideo()).toBe('sem_franquia');
  });

  it('cena gerada respeita a verdade clínica', () => {
    const st = newGameState({ gender: 'M', difficulty: 'padrao', seed: 1 });
    const c = makeCtx(st);
    const def = { id: 'x', at: '08:00', num: '9', caller: 'Filha', type: 'comum', note: '', addr: { rua: 'R', n: 1, bairro: 'Centro' }, open: [], patient: { name: 'Fulano', age: 70, sex: 'M' }, truth: {} } as unknown as CallDef;
    const mk = (dx: string, sev: TruthDef['sev']): TruthDef => ({ dx, sev, ok: ['USA'] });
    const pcr = buildVideo(def, mk('Parada cardiorrespiratória', 'vermelho'), c, 'a');
    const pcrScene = typeof pcr.scene === 'function' ? pcr.scene(c) : pcr.scene!;
    expect(pcrScene.patient?.skin).toBe('cinza');
    const avc = buildVideo(def, mk('AVC na janela', 'vermelho'), c, 'b');
    const avcScene = typeof avc.scene === 'function' ? avc.scene(c) : avc.scene!;
    expect(avcScene.patient?.signs).toContain('face_torta');
    const meningo = buildVideo({ ...def, patient: { name: 'B', age: 3, sex: 'F' } }, mk('Meningococcemia (febre com manchas roxas)', 'vermelho'), c, 'c');
    expect(JSON.stringify(meningo.spots)).toContain('video_purpura');
    const leve = buildVideo(def, { dx: 'Gripe sem sinais de gravidade', sev: 'verde', ok: ['ORI'] }, c, 'd');
    const leveScene = typeof leve.scene === 'function' ? leve.scene(c) : leve.scene!;
    expect(leveScene.patient?.skin).toBe('normal');
    // nada de prometer o que câmera não mede
    for (const v of [pcr, avc, meningo, leve]) expect(JSON.stringify(v)).not.toMatch(/press[aã]o (é|está) \d|glicemia (é|está|de) \d/i);
  });

  it('toda cena (dias, banco e Intervenção) tem lugar desenhado e renderiza em todos os enquadramentos', () => {
    const st = newGameState({ gender: 'F', difficulty: 'padrao', seed: 1 });
    const c = makeCtx(st);
    const drawn = Object.keys(DRAWN_PLACES);
    const all: { id: string; scene: VideoScene; focus: VideoFocus[] }[] = [];
    const take = (id: string, def: CallDef) => {
      const t = typeof def.truth === 'function' ? def.truth(c) : def.truth;
      const vd = buildVideo(def, t, c, id);
      const scene = typeof vd.scene === 'function' ? vd.scene(c) : vd.scene;
      if (scene) all.push({ id, scene, focus: (vd.spots ?? []).map((x) => x.focus ?? 'geral') });
    };
    for (const d of Object.values(CONTENT.days)) for (const def of d.calls) take(def.id, def);
    const gen = (template: string, truth: string): GenParams => ({ template, truth, seed: 5, name: '', age: 0, sex: 'M', addr: { rua: '', n: 0, bairro: '' }, num: '', caller: '' });
    for (const tp of CONTENT.bank) for (const tr of tp.truths) take(tp.id + '.' + tr.id, buildGeneratedCall(CONTENT, gen(tp.id, tr.id), 'g', 20));
    for (const f of FIELD_CASES) {
      all.push({ id: f.id, scene: f.scene, focus: ['rosto', 'peito', 'maos', 'pernas', 'ferida', 'ambiente'] });
      if (f.far) all.push({ id: f.id + ':longe', scene: f.far, focus: [] });
    }
    expect(all.length).toBeGreaterThan(300);
    // cada cena distinta uma vez (muitas variantes do banco dão a mesma cena)
    // desenha uma em cada quatro (todos os enquadramentos) e todas as da Intervenção, para o teste não pesar
    const field = new Set(FIELD_CASES.map((f) => f.id));
    const seen = new Set<string>();
    all.forEach((x, i) => {
      expect(drawn, x.id).toContain(x.scene.place);
      if (i % 4 !== 0 && !field.has(x.id.split(':')[0])) return;
      for (const focus of new Set<VideoFocus>(['geral', ...x.focus])) {
        const key = JSON.stringify(x.scene) + focus;
        if (seen.has(key)) continue;
        seen.add(key);
        const p = renderVideoFrame({ scene: x.scene, focus, signal: 'bom', t: 600, seed: 'teste' });
        expect(p.w, x.id).toBe(VIDEO_W);
      }
    });
  });

  it('nenhum quadro da animação quebra o desenho (respiração, compressões, convulsão)', () => {
    // um índice de cor calculado com a posição fracionária do peito (respiração) já derrubou o
    // desenho de alguns quadros: aqui cada caso da Intervenção é desenhado ao longo de 6 s
    // com todo o equipamento que a equipe pode pôr (eletrodos, máscara, soro…), como na Intervenção
    const GEAR = ['mascara_o2', 'soro', 'torniquete', 'colar', 'eletrodos', 'manta', 'compressa', 'tala', 'oximetro', 'ambu', 'toalha'] as const;
    for (const f of FIELD_CASES) {
      const scenes = [f.scene, f.scene.patient ? { ...f.scene, patient: { ...f.scene.patient, gear: [...GEAR] } } : f.scene];
      for (const scene of scenes)
      for (const focus of ['geral', 'rosto', 'peito', 'maos', 'pernas', 'ferida'] as VideoFocus[]) {
        for (let t = 0; t < 6000; t += 97) {
          const p = renderVideoFrame({ scene, focus, signal: 'bom', t, seed: 'quadros' });
          expect(p.w, `${f.id} ${focus} t=${t}`).toBe(VIDEO_W);
        }
      }
    }
  });

  it('trote: recusa, desliga ou se entrega — e o vídeo vale prova', () => {
    const st = newGameState({ gender: 'M', difficulty: 'padrao', seed: 1 });
    const c = makeCtx(st);
    const def = { id: 'x', at: '08:00', num: '9', caller: '?', type: 'trotista', note: '', addr: { rua: 'R', n: 1, bairro: 'Centro' }, open: [], patient: { name: '?' }, truth: {} } as unknown as CallDef;
    const kinds = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const v = buildVideo(def, { dx: 'Trote', sev: 'trote', ok: ['TROTE'], prankKind: 'trote' }, c, 'id' + i);
      kinds.add(v.refuse ? (v.refuse.hangup ? 'desliga' : 'recusa') : 'aceita');
      if (!v.refuse) expect(v.proof).toBe(true);
    }
    expect(kinds.size).toBe(3);
  });
});
