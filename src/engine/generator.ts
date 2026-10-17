// Geração procedural de ligações a partir do banco (mesma abertura, verdades diferentes).
import type { CallDef, GenParams, Gender } from './types';
import type { Content, TemplateDef, TemplateParams } from './content-api';
import { Rng } from './util';
import { randomAddress, invalidAddress } from './city/map';

const DDD = '(17)';

export function phoneNumber(rng: Rng, mobile = true): string {
  if (mobile) return `${DDD} 9${rng.int(8100, 9999)}-${String(rng.int(0, 9999)).padStart(4, '0')}`;
  return `${DDD} 3${rng.int(200, 899)}-${String(rng.int(0, 9999)).padStart(4, '0')}`;
}

const REL_LABEL: Record<string, [string, string]> = {
  proprio: ['O próprio paciente', 'A própria paciente'],
  filho: ['Filho do paciente', 'Filha do paciente'],
  esposa: ['Esposa', 'Esposa'],
  marido: ['Marido', 'Marido'],
  mae: ['Mãe', 'Mãe'],
  pai: ['Pai', 'Pai'],
  vizinho: ['Vizinho', 'Vizinha'],
  testemunha: ['Testemunha', 'Testemunha'],
  neto: ['Neto', 'Neta'],
  colega: ['Colega de trabalho', 'Colega de trabalho'],
  amigo: ['Amigo', 'Amiga'],
};

export function fillParams(c: Content, tpl: TemplateDef, gen: GenParams, day: number): TemplateParams {
  const rng = new Rng(gen.seed);
  const sex: Gender = tpl.sex === 'M' || tpl.sex === 'F' ? tpl.sex : rng.chance(0.5) ? 'M' : 'F';
  const [a0, a1] = tpl.age ?? [18, 80];
  const age = rng.int(a0, a1);
  const first = rng.pick(sex === 'M' ? c.names.m : c.names.f);
  const last = rng.pick(c.names.last);
  const rel = rng.pick(tpl.rel ?? ['proprio', 'filho', 'esposa', 'vizinho']);
  const relSex: Gender = rel === 'esposa' || rel === 'mae' ? 'F' : rel === 'marido' || rel === 'pai' ? 'M' : rng.chance(0.5) ? 'M' : 'F';
  const relFirst = rng.pick(relSex === 'M' ? c.names.m : c.names.f);
  const isPrank = tpl.tags.includes('trote');
  const addr = isPrank && rng.chance(0.6) ? invalidAddress(rng) : randomAddress(rng);
  const num = phoneNumber(rng, rng.chance(0.8));
  if (!gen.name) {
    gen.name = `${first} ${last}`;
    gen.age = age;
    gen.sex = sex;
    gen.addr = addr;
    gen.num = num;
    gen.caller = rel;
  }
  const relLabel = (REL_LABEL[gen.caller] ?? ['Quem liga', 'Quem liga'])[relSex === 'M' ? 0 : 1];
  return {
    name: gen.name,
    first: gen.name.split(' ')[0],
    age: gen.age,
    sex: gen.sex,
    addr: gen.addr,
    num: gen.num,
    rel: gen.caller,
    relName: `${relFirst} (${relLabel.toLowerCase()})`,
    day,
    rand: () => rng.next(),
    pick: <T,>(a: readonly T[]) => rng.pick(a),
  };
}

export function buildGeneratedCall(c: Content, gen: GenParams, id: string, day: number, at = '07:00'): CallDef {
  const tpl = c.bank.find((t) => t.id === gen.template);
  if (!tpl) throw new Error('template ' + gen.template);
  const tr = tpl.truths.find((t) => t.id === gen.truth) ?? tpl.truths[0];
  const p = fillParams(c, tpl, gen, day);
  const built = tr.build(p);
  const relLabel = (REL_LABEL[p.rel] ?? ['Quem liga', 'Quem liga'])[0];
  const def: CallDef = {
    id,
    at,
    num: p.num,
    caller: built.caller ?? (p.rel === 'proprio' ? p.name : relLabel),
    type: built.type ?? 'comum',
    note: built.note ?? 'Ligação comum.',
    addr: built.addr ?? p.addr,
    patient: built.patient ?? { name: p.name, age: p.age, sex: p.sex },
    ...built,
  } as CallDef;
  def.id = id;
  def.at = at;
  return def;
}
