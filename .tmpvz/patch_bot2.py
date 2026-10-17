p='src/engine/bot.ts'
s=open(p).read()
def rep(old,new,cnt=1):
    global s
    if s.count(old)!=cnt:
        raise SystemExit(f"count {s.count(old)} != {cnt} for: {old[:80]}")
    s=s.replace(old,new)
rep("""  handled: number;
  bicos: number;
  errors: string[];
}""","""  handled: number;
  bicos: number;
  errors: string[];
  /** 1.1: uso de recursos na campanha */
  res: { coffee: number; videos: number; vz: number; vzOk: number; vzPeixoto: number; vzFail: number; saulo: number };
}""")
rep("""    handled: st.totals.handled,
    bicos: st.totals.bicos,
    errors,
  };""","""    handled: st.totals.handled,
    bicos: st.totals.bicos,
    errors,
    res: {
      coffee: st.totals.coffee,
      videos: Number(st.flags['videos_total']) || 0,
      vz: Number(st.flags['vz_total']) || 0,
      vzOk: Number(st.flags['vz_aceitas']) || 0,
      vzPeixoto: Number(st.flags['vz_peixoto_total']) || 0,
      vzFail: Number(st.flags['vz_recusadas']) || 0,
      saulo: Number(st.flags['saulo_confianca']) || 0,
    },
  };""")
open(p,'w').write(s)

p='scripts/simulate.ts'
s=open(p).read()
rep("""// Uso: npm run simulate -- [seeds=20] [--md arquivo.md]""","""// Uso: npm run simulate -- [seeds=20] [--md arquivo.md] [--extra] [--only lento,medio]
//  --extra acrescenta os perfis de comparação (ex.: Médio sem recursos)""")
rep("""import { playBot, PROFILES, type BotResult } from '../src/engine/bot';""","""import { playBot, PROFILES, EXTRA_PROFILES, type BotProfile, type BotResult } from '../src/engine/bot';""")
rep("""const mdFile = mdIdx >= 0 ? args[mdIdx + 1] : undefined;""","""const mdFile = mdIdx >= 0 ? args[mdIdx + 1] : undefined;
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? args[onlyIdx + 1].split(',') : undefined;
const ALL: Record<string, BotProfile> = args.includes('--extra') ? { ...PROFILES, ...EXTRA_PROFILES } : PROFILES;
const RUN = Object.fromEntries(Object.entries(ALL).filter(([k]) => !only || only.includes(k)));""")
rep("""for (const [key, prof] of Object.entries(PROFILES)) {
  const rs: BotResult[] = [];""","""for (const [key, prof] of Object.entries(RUN)) {
  const rs: BotResult[] = [];""")
rep("""out('');
out('Metas do documento de design:');""","""out('');
out('Recursos por campanha (média): cafés, vídeos, vagas zero negociadas (aceitas / pelo Peixoto / sem acordo) e a confiança do Saulo no fim.');
out('');
out('| Perfil | Cafés | Vídeos | Vagas zero | Aceitas | Peixoto | Sem acordo | Confiança do Saulo |');
out('|---|---|---|---|---|---|---|---|');
for (const [key, rs] of Object.entries(all)) {
  const r = (f: (x: BotResult) => number) => fmt(avg(rs.map(f)));
  out(`| ${RUN[key].name} | ${r((x) => x.res.coffee)} | ${r((x) => x.res.videos)} | ${r((x) => x.res.vz)} | ${r((x) => x.res.vzOk)} | ${r((x) => x.res.vzPeixoto)} | ${r((x) => x.res.vzFail)} | ${r((x) => x.res.saulo)} |`);
}
out('');
out('Metas do documento de design:');""")
rep("""for (const [k, t] of Object.entries(TARGET)) out(`- **${PROFILES[k]?.name ?? k}**: ${t}`);""","""for (const [k, t] of Object.entries(TARGET)) out(`- **${ALL[k]?.name ?? k}**: ${t}`);""")
open(p,'w').write(s)
print('ok')
