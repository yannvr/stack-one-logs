import * as RadixAvatar from '@radix-ui/react-avatar';

type Props = {
  /** Used to derive the fallback color deterministically. */
  id: string;
  name: string;
  src?: string;
  size?: number;
};

// 8 distinct hues, deterministic from the id so the same org always renders the
// same color (one of the critique items: the Figma uses random colors per row).
const PALETTE = [
  'var(--green-500)',
  'var(--purple-500)',
  '#0EA5E9',
  '#F97316',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#EAB308',
];

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({ id, name, src, size = 18 }: Props) {
  const initial = name.charAt(0).toUpperCase();
  const color = hashColor(id);
  return (
    <RadixAvatar.Root
      className="avatar"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      {src ? <RadixAvatar.Image src={src} alt="" /> : null}
      <RadixAvatar.Fallback className="avatar-fallback">{initial}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
