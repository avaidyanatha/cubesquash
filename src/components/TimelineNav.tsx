import { BookIcon, FoldIcon } from '@primer/octicons-react';
import classNames from 'classnames';

import type { Item } from './EntryCard';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}`;
};
const monthLabel = (ms: number) => {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const itemAnchorId = (key: string) => `entry-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

interface Props {
  items: Item[];
  titles: Map<string, string>;
  hasPost: Set<string>;
  activeKey: string | null;
}

export default function TimelineNav({ items, titles, hasPost, activeKey }: Props) {
  const groups: Array<{ key: string; label: string; items: Item[] }> = [];
  for (const it of items) {
    const newest = it.entries[it.entries.length - 1].date;
    const key = monthKey(newest);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(it);
    else groups.push({ key, label: monthLabel(newest), items: [it] });
  }

  const jump = (key: string) => {
    const el = document.getElementById(itemAnchorId(key));
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <nav aria-label="Timeline" className="text-xs">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Timeline</div>
      <ol className="relative ml-1.5 border-l border-border">
        {groups.map((g) => (
          <li key={g.key} className="mb-3 last:mb-0">
            <div className="relative -ml-px pl-3.5 mb-1">
              <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-border-secondary" />
              <span className="font-semibold text-text-secondary">{g.label}</span>
            </div>
            <ol>
              {g.items.map((it) => {
                const active = it.key === activeKey;
                const day = new Date(it.entries[it.entries.length - 1].date).getDate();
                return (
                  <li key={it.key}>
                    <button
                      type="button"
                      onClick={() => jump(it.key)}
                      className={classNames(
                        'group flex w-full items-start gap-1.5 rounded py-0.5 pl-3.5 pr-1 text-left transition-colors',
                        active ? 'text-link font-semibold' : 'text-text hover:text-link',
                      )}
                    >
                      <span className="w-5 shrink-0 tabular-nums text-text-secondary group-hover:text-link">{day}</span>
                      <span className="min-w-0 flex-1 truncate">{titles.get(it.key)}</span>
                      <span className="shrink-0 flex items-center gap-0.5 text-text-secondary">
                        {hasPost.has(it.key) && <BookIcon size={10} />}
                        {it.kind === 'squash' && <FoldIcon size={10} className="text-button-primary" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  );
}
