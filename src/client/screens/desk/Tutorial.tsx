import { useStore } from '../../store';

/** Dicas da Simone no primeiro plantão (tutorial contextual). */
export function Tutorial() {
  const s = useStore();
  const g = s.game!;
  const sh = g.shift!;
  const S = sh.sh;
  const call = sh.active();
  let tip: string | null = null;
  let pos = 'left';
  if (S.guideCallId) return null;
  if (!call) {
    if (sh.queue().length) tip = 'O telefone tocou. Clique no cartão da fila para atender. Meu post-it diz o que eu achei, mas eu também erro.';
    else if (S.handled === 0) tip = 'Enquanto não toca, dá uma olhada no Manual (M). A página 1 é tudo que você precisa hoje.';
  } else {
    const def = sh.defOf(call);
    if (call.asked.length === 0) tip = 'Pergunte. Cada pergunta custa minutos do relógio, mas é aí que estão as pistas.';
    else if (def.id === 'd01_et' && call.asked.length < 3) {
      tip = 'Endereço é comigo: eu confiro no mapa e anoto no post-it. Esse aí não confere. Agora escuta o fundo da ligação e vê se a história fecha.';
      pos = 'right';
    } else if (def.id === 'd01_et') {
      tip = 'Rua que não existe, risada no fundo, ET sangrando azul... Na ficha, marca Trote e carimba. O número vai pro quadro.';
      pos = 'right';
    } else if (def.id === 'd01_parada' && call.asked.length >= 1) {
      tip = 'Não responde e respira esquisito é parada. USA na hora, e você fica na linha ensinando a massagem.';
      pos = 'right';
    } else if (call.asked.length >= 2) {
      tip = 'Na ficha: a cor da classificação, o recurso, a viatura. Depois, o carimbo. Na dúvida entre dois níveis, pergunta mais.';
      pos = 'right';
    }
  }
  if (!tip) return null;
  return (
    <div className={'tutorial-postit ' + pos}>
      <b>{pos === 'left' ? '◄ Simone' : 'Simone ►'}</b>
      <span>{tip}</span>
    </div>
  );
}
