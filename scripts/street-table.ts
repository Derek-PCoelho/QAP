import { streetRanges, LANDMARKS, BAIRROS } from '../src/engine/city/map';
const rows = streetRanges();
console.log('| Rua | Bairro | Números válidos |');
console.log('|---|---|---|');
for (const r of rows) console.log(`| ${r.street} | ${r.bairro} | ${r.from}–${r.to} |`);
console.log('\n**Marcos (pontos conhecidos):**\n');
for (const l of LANDMARKS) console.log(`- ${l.name}: ${l.addr.rua}, ${l.addr.n} — ${l.addr.bairro}`);
console.log('\n**Bairros:** ' + BAIRROS.map(b => b.name).join(', '));
