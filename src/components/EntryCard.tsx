import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  FoldIcon,
  LinkExternalIcon,
  PencilIcon,
  ToolsIcon,
  UnfoldIcon,
  XIcon,
} from '@primer/octicons-react';
import classNames from 'classnames';
import { useState } from 'react';

import type { CompactChanges, Counts } from '../../shared/changes';
import { formatDateRange, formatDateTime } from '../lib/format';
import type { Id } from '../../convex/_generated/dataModel';
import Changelist, { type CardInfoMap } from './Changelist';
import { Badge, Button, Card, CardBody, CardFooter, CardHeader } from './ui';

export type Entry = {
  changelogId: string;
  date: number;
  cubeVersion?: number;
  changes: CompactChanges;
  counts: Counts;
};

export type Item = {
  key: string;
  kind: 'entry' | 'squash';
  entries: Entry[];
  squashId?: Id<'squashes'>;
  title?: string;
  changes: CompactChanges;
  counts: Counts;
  rawEdits: number;
};

interface Props {
  item: Item;
  cubeId: string;
  cards: CardInfoMap;
  hideEdits: boolean;
  selecting: boolean;
  selected: boolean;
  onToggleSelect: (shift: boolean) => void;
  onUnsquash: () => void;
  onRename: (title: string) => void;
  onCopy: () => void;
  copied: boolean;
}

export default function EntryCard({
  item,
  cubeId,
  cards,
  hideEdits,
  selecting,
  selected,
  onToggleSelect,
  onUnsquash,
  onRename,
  onCopy,
  copied,
}: Props) {
  const [showOriginals, setShowOriginals] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title ?? '');

  const first = item.entries[0];
  const last = item.entries[item.entries.length - 1];
  const isSquash = item.kind === 'squash';
  const { adds, removes, swaps, edits } = item.counts;

  const commitTitle = () => {
    setEditing(false);
    if (draft.trim() !== (item.title ?? '')) onRename(draft);
  };

  return (
    <Card
      className={classNames('transition-shadow', {
        'ring-2 ring-button-accent border-button-accent': selected,
        'cursor-pointer hover:shadow-md': selecting,
        'border-l-4 border-l-button-primary': isSquash,
      })}
    >
      <CardHeader className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div
          className="flex items-center gap-2 min-w-0"
          onClick={(e) => {
            if (selecting) onToggleSelect(e.shiftKey);
          }}
        >
          {selecting && (
            <span
              className={classNames(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                selected ? 'bg-button-accent border-button-accent text-white' : 'border-border-secondary',
              )}
            >
              {selected && <CheckIcon size={14} />}
            </span>
          )}
          {isSquash ? (
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Badge className="bg-button-primary text-button-text">
                <FoldIcon size={12} /> {item.entries.length} squashed
              </Badge>
              {editing ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTitle();
                    if (e.key === 'Escape') {
                      setDraft(item.title ?? '');
                      setEditing(false);
                    }
                  }}
                  placeholder="Give this update a title"
                  className="rounded border border-border bg-bg px-2 py-0.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/50"
                />
              ) : (
                <button
                  type="button"
                  className="group flex items-center gap-1 text-sm font-semibold text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!selecting) setEditing(true);
                  }}
                  title="Rename"
                >
                  <span>{item.title || formatDateRange(first.date, last.date)}</span>
                  <PencilIcon size={12} className="text-text-secondary opacity-0 group-hover:opacity-100" />
                </button>
              )}
              {item.title && (
                <span className="text-xs text-text-secondary">{formatDateRange(first.date, last.date)}</span>
              )}
            </div>
          ) : (
            <a
              href={`https://cubecobra.com/cube/changelog/${cubeId}/${first.changelogId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-link hover:text-link-active"
              onClick={(e) => selecting && e.preventDefault()}
            >
              {formatDateTime(first.date)}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-semibold text-text-secondary whitespace-nowrap">
            <span className="text-change-add">+{adds + swaps}</span>, <span className="text-change-remove">-{removes + swaps}</span>
            {edits > 0 && (
              <>
                , <ToolsIcon size={12} className="text-change-edit" /> {edits}
              </>
            )}
            {hideEdits && item.rawEdits > 0 && (
              <span className="ml-1 font-normal" title={`${item.rawEdits} non-card changes hidden`}>
                (<ToolsIcon size={10} /> {item.rawEdits} hidden)
              </span>
            )}
          </span>
          <Button color="secondary" outline onClick={onCopy} title="Copy as Markdown" className="px-1.5">
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          </Button>
          <Button
            color="accent"
            href={`https://cubecobra.com/cube/changelog/${cubeId}/${last.changelogId}/list`}
            title="View cube at this point in time"
            className="px-1.5"
          >
            <EyeIcon size={14} />
          </Button>
          {isSquash && (
            <Button color="danger" outline onClick={onUnsquash} title="Unsquash" className="px-1.5">
              <XIcon size={14} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <Changelist changes={item.changes} cards={cards} />
      </CardBody>
      {isSquash && (
        <CardFooter className="text-xs">
          <button
            type="button"
            className="flex items-center gap-1 font-semibold text-text-secondary hover:text-text"
            onClick={() => setShowOriginals((s) => !s)}
          >
            {showOriginals ? <FoldIcon size={12} /> : <UnfoldIcon size={12} />}
            {showOriginals ? 'Hide' : 'Show'} {item.entries.length} original entries
          </button>
          {showOriginals && (
            <ul className="mt-2 flex flex-col gap-1">
              {[...item.entries].reverse().map((e) => (
                <li key={e.changelogId} className="flex items-center gap-2">
                  <a
                    href={`https://cubecobra.com/cube/changelog/${cubeId}/${e.changelogId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-active"
                  >
                    {formatDateTime(e.date)} <LinkExternalIcon size={10} />
                  </a>
                  <span className="text-text-secondary">
                    +{e.counts.adds + e.counts.swaps}, -{e.counts.removes + e.counts.swaps}
                    {e.counts.edits > 0 && (
                      <>
                        , <ToolsIcon size={10} /> {e.counts.edits}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
