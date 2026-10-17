import { icon } from '../art';

export function Icon({ name, scale = 2, className, title }: { name: string; scale?: number; className?: string; title?: string }) {
  let src = '';
  try {
    src = icon(name as never, scale);
  } catch {
    src = '';
  }
  if (!src) return <span className={'icon-missing ' + (className ?? '')} title={title} />;
  return <img className={'px-icon ' + (className ?? '')} src={src} width={16 * scale} height={16 * scale} alt={title ?? ''} title={title} draggable={false} />;
}
