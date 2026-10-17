// Código Q usado no rádio da central (fonte real em docs/FONTES.md
// e tabela de bolso das equipes). Usado nas mensagens de rádio e no Manual.
export const QCODES: Record<string, string> = {
  QAP: 'Na escuta (pede ou confirma atenção)',
  QAR: 'Desligar, abandonar a escuta',
  QBI: 'Doença transmissível',
  QBU: 'Paciente psiquiátrico',
  QRA: 'Nome (de quem opera ou da viatura)',
  QRF: 'Refeição / descanso da equipe',
  QRL: 'Ocupado, não interfira',
  QRM: 'Interferência (na regulação: diálogo difícil ou equipe hostil no destino)',
  QRQ: 'Transmitir mais devagar',
  QRS: 'Transmitir mais depressa',
  QRR: 'Prioridade do deslocamento: 1 baixa · 2 moderada · 3 absoluta',
  QRT: 'Silêncio no rádio',
  QRU: 'Novidade, problema (viatura ou pessoal)',
  QRV: 'À disposição (missão cumprida, viatura livre)',
  QRX: 'Aguarde',
  QRZ: 'Quem está chamando?',
  QSL: 'Entendido, confirmado',
  QSM: 'Repita a última mensagem',
  QSN: 'Copiou? / Fique alerta',
  QSV: 'Viatura (VTR)',
  QTA: 'Cancele a última mensagem',
  QTC: 'Mensagem, ocorrência',
  QTH: 'Local, endereço',
  QTI: 'Destino da viatura',
  QTO: 'Sanitário',
  QTR: 'Horário exato',
  QTU: 'Horário',
  QTW: 'Estado da vítima (avaliação feita no local)',
  QTX: 'Fora do alcance do rádio por tempo indeterminado',
  QTY: 'A caminho da ocorrência',
  QUE: 'Entre em contato por telefone',
  QUF: 'Viatura em perigo: acionar a polícia',
  QUJ: 'Destino do paciente',
  QUR: 'Saindo do local da ocorrência',
  QUS: 'Chegou ao local da ocorrência',
  QUU: 'Saindo da unidade de destino',
  QUY: 'Chegou à unidade de destino',
  NIHIL: 'Nada',
  TKS: 'Obrigado',
  VTR: 'Viatura',
};

/** divide um texto em pedaços, marcando os códigos Q conhecidos */
export function splitQ(text: string): { t: string; q?: string }[] {
  const out: { t: string; q?: string }[] = [];
  const re = /\b(Q[A-Z]{2}(?: ?[1-5])?|NIHIL|TKS|VTR)\b/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const code = m[1].slice(0, 3) === 'QRR' || m[1].startsWith('QRM') ? m[1].slice(0, 3) : m[1];
    if (!QCODES[code]) continue;
    if (m.index! > last) out.push({ t: text.slice(last, m.index) });
    out.push({ t: m[1], q: QCODES[code] + (m[1].length > 3 && /\d$/.test(m[1]) && code === 'QRR' ? ` (${m[1].slice(-1)})` : '') });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}
