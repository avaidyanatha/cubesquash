import { type CompactChanges } from '../../shared/changes';
import { capitalize } from './format';
import { diffCards } from './merge';

export type CardNames = Record<string, { name: string } | undefined>;

export const nameOf = (names: CardNames, cardID: string): string => names[cardID]?.name ?? 'Unknown card';

export function changesToMarkdown(title: string, changes: CompactChanges, names: CardNames, body?: string): string {
  const lines: string[] = [`## ${title}`];
  if (body?.trim()) lines.push('', body.trim());
  for (const [board, b] of Object.entries(changes)) {
    const plus = b.adds.length + b.swaps.length;
    const minus = b.removes.length + b.swaps.length;
    lines.push('', `**${capitalize(board)}** (+${plus}, -${minus}${b.edits.length ? `, ${b.edits.length} edited` : ''})`, '');
    for (const c of b.adds) lines.push(`- ➕ ${nameOf(names, c.cardID)}`);
    for (const c of b.removes) lines.push(`- ➖ ${nameOf(names, c.cardID)}`);
    for (const p of b.swaps) lines.push(`- 🔁 ${nameOf(names, p.from.cardID)} → ${nameOf(names, p.to.cardID)}`);
    for (const p of b.edits) {
      const diffs = diffCards(p.from, p.to)
        .map((d) => `${d.field}: ${d.from || '∅'} → ${d.to || '∅'}`)
        .join('; ');
      lines.push(`- 🔧 ${nameOf(names, p.to.cardID)}${diffs ? ` (${diffs})` : ''}`);
    }
  }
  return lines.join('\n');
}
