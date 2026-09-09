import { ArrowRightIcon, ArrowSwitchIcon, NoEntryIcon, PlusCircleIcon, ToolsIcon } from '@primer/octicons-react';
import classNames from 'classnames';

import type { CardPair, CompactChanges } from '../../shared/changes';
import { capitalize } from '../lib/format';
import { diffCards } from '../lib/merge';
import CardLink, { type CardInfo } from './CardLink';

export type CardInfoMap = Record<string, CardInfo | undefined>;

function EditRow({ pair, cards }: { pair: CardPair; cards: CardInfoMap }) {
  const diffs = diffCards(pair.from, pair.to);
  const printingChange = pair.from.cardID !== pair.to.cardID;
  return (
    <li className="flex items-start gap-1.5 leading-6">
      <span className="text-change-edit shrink-0 mt-0.5">
        <ToolsIcon size={16} />
      </span>
      <span className="min-w-0">
        {printingChange && <CardLink cardID={pair.from.cardID} info={cards[pair.from.cardID]} />}
        {printingChange && <ArrowRightIcon size={14} className="mx-1 text-text-secondary" />}
        <CardLink cardID={pair.to.cardID} info={cards[pair.to.cardID]} />
        {diffs.length > 0 && (
          <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
            {diffs
              .filter((d) => d.field !== 'printing')
              .map((d) => (
                <span
                  key={d.field}
                  className="rounded bg-bg-active border border-border px-1 text-xs text-text-secondary"
                  title={`${d.field}: ${d.from || '∅'} → ${d.to || '∅'}`}
                >
                  {d.field}: {d.from || '∅'} → {d.to || '∅'}
                </span>
              ))}
          </span>
        )}
      </span>
    </li>
  );
}

export default function Changelist({ changes, cards }: { changes: CompactChanges; cards: CardInfoMap }) {
  const boards = Object.entries(changes);
  if (boards.length === 0) {
    return <p className="text-sm text-text-secondary italic">Nothing to show for this entry.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {boards.map(([board, b]) => {
        const rows = b.adds.length + b.removes.length + b.swaps.length + b.edits.length;
        return (
          <div key={board}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-sm font-semibold">{capitalize(board)} changelist</span>
              <span className="text-xs font-semibold text-text-secondary whitespace-nowrap">
                <span className="text-change-add">+{b.adds.length + b.swaps.length}</span>,{' '}
                <span className="text-change-remove">-{b.removes.length + b.swaps.length}</span>
                {b.edits.length > 0 && (
                  <>
                    , <ToolsIcon size={12} className="text-change-edit" /> {b.edits.length}
                  </>
                )}
              </span>
            </div>
            <ul className={classNames('text-sm', rows > 10 && 'sm:columns-2 sm:gap-6')}>
              {b.adds.map((c, i) => (
                <li key={`a${c.cardID}${i}`} className="flex items-start gap-1.5 leading-6 break-inside-avoid">
                  <span className="text-change-add shrink-0 mt-0.5">
                    <PlusCircleIcon size={16} />
                  </span>
                  <CardLink cardID={c.cardID} info={cards[c.cardID]} />
                </li>
              ))}
              {b.removes.map((c, i) => (
                <li key={`r${c.cardID}${i}`} className="flex items-start gap-1.5 leading-6 break-inside-avoid">
                  <span className="text-change-remove shrink-0 mt-0.5">
                    <NoEntryIcon size={16} />
                  </span>
                  <CardLink cardID={c.cardID} info={cards[c.cardID]} />
                </li>
              ))}
              {b.swaps.map((p, i) => (
                <li
                  key={`s${p.from.cardID}${p.to.cardID}${i}`}
                  className="flex items-start gap-1.5 leading-6 break-inside-avoid"
                >
                  <span className="text-change-swap shrink-0 mt-0.5">
                    <ArrowSwitchIcon size={16} />
                  </span>
                  <span>
                    <CardLink cardID={p.from.cardID} info={cards[p.from.cardID]} />
                    <ArrowRightIcon size={14} className="mx-1 text-text-secondary" />
                    <CardLink cardID={p.to.cardID} info={cards[p.to.cardID]} />
                  </span>
                </li>
              ))}
              {b.edits.map((p, i) => (
                <EditRow key={`e${p.from.cardID}${p.to.cardID}${i}`} pair={p} cards={cards} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
