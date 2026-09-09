import { CheckIcon, ChecklistIcon, CopyIcon, FoldIcon, LinkExternalIcon, SyncIcon, XIcon } from '@primer/octicons-react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DEFAULT_AUTO_WINDOW_MS } from '../../shared/autosquash';
import { blogTitleOf } from '../../shared/blog';
import { cardIdsIn, type CompactChanges, countChanges } from '../../shared/changes';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import type { CardInfoMap } from '../components/Changelist';
import EntryCard, { type Entry, type Item } from '../components/EntryCard';
import { Button, Card, CardBody, Spinner, Toggle } from '../components/ui';
import { formatDateRange, relativeTime } from '../lib/format';
import { changesToMarkdown } from '../lib/markdown';
import { mergeChanges } from '../lib/merge';

const DAY = 24 * 60 * 60 * 1000;
const AUTO_WINDOWS = [
  { label: 'same day', ms: DAY },
  { label: '3 days', ms: 3 * DAY },
  { label: '7 days', ms: 7 * DAY },
];

const itemBlog = (item: Item) => [...item.entries].reverse().find((e) => e.blog)?.blog;

const itemTitle = (item: Item): string => {
  const first = item.entries[0];
  const last = item.entries[item.entries.length - 1];
  return item.title || blogTitleOf(itemBlog(item)) || formatDateRange(first.date, last.date);
};

const itemMarkdown = (item: Item, cards: CardInfoMap) =>
  changesToMarkdown(itemTitle(item), item.changes, cards, itemBlog(item)?.body);

export default function CubePage() {
  const { id = '' } = useParams();
  const cube = useQuery(api.cubes.get, { id });
  const cubeId = cube?.cubeId;
  const entries = useQuery(api.entries.byCube, cubeId ? { cubeId } : 'skip') as Entry[] | undefined;
  const squashes = useQuery(api.squashes.byCube, cubeId ? { cubeId } : 'skip');
  const cardIds = useMemo(() => {
    if (!entries) return [];
    const set = new Set<string>();
    for (const e of entries) for (const c of cardIdsIn(e.changes as CompactChanges)) set.add(c);
    return [...set];
  }, [entries]);
  const cardList = useQuery(api.cards.getMany, cardIds.length ? { ids: cardIds } : 'skip');
  const cards = useMemo<CardInfoMap>(() => {
    const map: CardInfoMap = {};
    for (const c of cardList ?? []) map[c.cardID] = c;
    return map;
  }, [cardList]);

  const sync = useAction(api.sync.syncCube);
  const updateSettings = useMutation(api.cubes.updateSettings);
  const createSquash = useMutation(api.squashes.create);
  const removeSquash = useMutation(api.squashes.remove);
  const removeAllSquashes = useMutation(api.squashes.removeAll);
  const renameSquash = useMutation(api.squashes.rename);
  const autoSquashNow = useMutation(api.squashes.autoSquash);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const autoSynced = useRef(false);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await sync({ id });
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  }, [id, sync]);

  useEffect(() => {
    if (cube === null && !autoSynced.current) {
      autoSynced.current = true;
      void runSync();
    }
  }, [cube, runSync]);

  const hideEdits = cube?.hideNonCardChanges ?? true;
  const netOut = cube?.netOut ?? true;
  const hideMaybeboard = cube?.hideMaybeboard ?? true;
  const autoOn = cube?.autoSquash ?? true;
  const autoWindow = cube?.autoSquashWindowMs ?? DEFAULT_AUTO_WINDOW_MS;

  const items = useMemo<Item[]>(() => {
    if (!entries) return [];
    const byId = new Map(entries.map((e) => [e.changelogId, e]));
    const inSquash = new Map<string, Doc<'squashes'>>();
    for (const s of squashes ?? []) for (const eid of s.entryIds) inSquash.set(eid, s);
    const seen = new Set<string>();
    const opts = { netOut, hideEdits };
    const visibleBoards = (changes: CompactChanges): CompactChanges =>
      hideMaybeboard
        ? Object.fromEntries(Object.entries(changes).filter(([board]) => board.toLowerCase() !== 'maybeboard'))
        : changes;
    const build = (group: Entry[], squash?: Doc<'squashes'>): Item => {
      const sorted = [...group].sort((a, b) => a.date - b.date);
      const boards = sorted.map((e) => visibleBoards(e.changes as CompactChanges));
      const changes = mergeChanges(boards, opts);
      return {
        key: squash ? `s:${squash._id}` : `e:${sorted[0].changelogId}`,
        kind: squash ? 'squash' : 'entry',
        entries: sorted,
        squashId: squash?._id,
        auto: squash?.auto,
        title: squash?.title,
        changes,
        counts: countChanges(changes),
        rawEdits: boards.reduce((n, c) => n + countChanges(c).edits, 0),
      };
    };
    const out: Item[] = [];
    for (const e of entries) {
      const s = inSquash.get(e.changelogId);
      if (s) {
        if (seen.has(s._id)) continue;
        seen.add(s._id);
        const group = s.entryIds.map((eid) => byId.get(eid)).filter((x): x is Entry => !!x);
        if (group.length) out.push(build(group, s));
      } else {
        out.push(build([e]));
      }
    }
    return out;
  }, [entries, squashes, hideEdits, netOut, hideMaybeboard]);

  const visible = useMemo(() => items.filter((it) => Object.keys(it.changes).length > 0), [items]);
  const hiddenCount = items.length - visible.length;

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClick = useRef<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
    lastClick.current = null;
  };

  const toggleSelect = (key: string, shift: boolean) => {
    const idx = visible.findIndex((it) => it.key === key);
    setSelected((prev) => {
      const next = new Set(prev);
      if (shift && lastClick.current !== null && idx >= 0) {
        const [a, b] = [Math.min(lastClick.current, idx), Math.max(lastClick.current, idx)];
        for (let i = a; i <= b; i++) next.add(visible[i].key);
      } else if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    lastClick.current = idx;
  };

  const squashRange = useMemo(() => {
    if (selected.size === 0) return null;
    const idxs = items.map((it, i) => (selected.has(it.key) ? i : -1)).filter((i) => i >= 0);
    if (idxs.length === 0) return null;
    const range = items.slice(Math.min(...idxs), Math.max(...idxs) + 1);
    const entryIds = range.flatMap((it) => it.entries.map((e) => e.changelogId));
    const replaceIds = range.flatMap((it) => (it.squashId ? [it.squashId] : []));
    const title = range.find((it) => it.title)?.title;
    const dates = range.flatMap((it) => it.entries.map((e) => e.date));
    return { entryIds, replaceIds, title, from: Math.min(...dates), to: Math.max(...dates) };
  }, [items, selected]);

  const doSquash = async () => {
    if (!cubeId || !squashRange || squashRange.entryIds.length < 2) return;
    setBusy(true);
    try {
      await createSquash({
        cubeId,
        entryIds: squashRange.entryIds,
        replaceIds: squashRange.replaceIds,
        title: squashRange.title,
      });
      exitSelect();
    } finally {
      setBusy(false);
    }
  };

  const setAutoSquash = async (on: boolean, windowMs = autoWindow) => {
    if (!cubeId) return;
    if (!on) {
      await updateSettings({ cubeId, autoSquash: false });
      return;
    }
    setBusy(true);
    try {
      await autoSquashNow({ cubeId, windowMs });
    } finally {
      setBusy(false);
    }
  };

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  };

  if (cube === undefined) {
    return (
      <div className="flex items-center justify-center py-24 text-text-secondary">
        <Spinner /> <span className="ml-2">Loading…</span>
      </div>
    );
  }

  if (cube === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        {syncing ? (
          <>
            <Spinner className="text-button-primary h-6 w-6" />
            <p className="mt-3 font-semibold">Pulling changelog history for “{id}” from Cube Cobra…</p>
            <p className="text-sm text-text-secondary">This can take a minute for a long-lived cube.</p>
          </>
        ) : (
          <>
            <p className="font-semibold">Cube “{id}” isn't synced yet.</p>
            {syncError && <p className="mt-2 text-sm text-button-danger">{syncError}</p>}
            <div className="mt-4 flex justify-center gap-2">
              <Button color="primary" onClick={runSync}>
                <SyncIcon size={14} /> Sync now
              </Button>
              <Link to="/" className={'text-link hover:text-link-active self-center text-sm'}>
                Back home
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  const squashCount = squashes?.length ?? 0;

  return (
    <div className="flex flex-col">
      <div className="relative bg-bg-secondary text-white">
        {cube.imageUri && (
          <img src={cube.imageUri} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_25%]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
        <div className="relative mx-auto max-w-5xl px-4 py-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold leading-tight">{cube.name}</h1>
            <p className="text-sm text-white/80 mt-1">
              {cube.ownerName && <>by {cube.ownerName} · </>}
              {cube.cardCount !== undefined && <>{cube.cardCount} cards · </>}
              {cube.entryCount} changelog entries
              {squashCount > 0 && <> · {squashCount} squashed</>}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <a
                href={`https://cubecobra.com/cube/overview/${cube.shortId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white underline underline-offset-2"
              >
                Overview <LinkExternalIcon size={12} />
              </a>
              <a
                href={`https://cubecobra.com/cube/about/${cube.shortId}?view=changelog`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white underline underline-offset-2"
              >
                Original changelog <LinkExternalIcon size={12} />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/80">
            <span>synced {relativeTime(cube.lastSyncedAt)}</span>
            <Button color="primary" onClick={runSync} disabled={syncing} title="Fetch new changelog entries">
              {syncing ? <Spinner /> : <SyncIcon size={14} />} Resync
            </Button>
          </div>
        </div>
        {cube.imageArtist && (
          <span className="absolute bottom-1 right-2 text-[10px] text-white/60">Art by {cube.imageArtist}</span>
        )}
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 flex flex-col gap-4">
        {syncError && <p className="text-sm text-button-danger">{syncError}</p>}

        <Card>
          <CardBody className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
            <Toggle
              checked={hideEdits}
              onChange={(v) => updateSettings({ cubeId: cube.cubeId, hideNonCardChanges: v })}
              label="Hide non-card changes"
              hint="Drop tag, status, finish, and printing edits"
            />
            <Toggle
              checked={hideMaybeboard}
              onChange={(v) => updateSettings({ cubeId: cube.cubeId, hideMaybeboard: v })}
              label="Ignore maybeboard"
              hint="Leave maybeboard changes out of the timeline"
            />
            <Toggle
              checked={netOut}
              onChange={(v) => updateSettings({ cubeId: cube.cubeId, netOut: v })}
              label="Net out squashed changes"
              hint="Cancel a card that was added and then cut inside the same squash"
            />
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {selecting ? (
                <>
                  <span className="text-sm text-text-secondary">
                    {selected.size === 0
                      ? 'Click entries to select. Shift-click for a range.'
                      : squashRange && squashRange.entryIds.length > 1
                        ? `Squash ${squashRange.entryIds.length} entries · ${formatDateRange(squashRange.from, squashRange.to)}`
                        : 'Select at least two entries'}
                  </span>
                  <Button
                    color="primary"
                    onClick={doSquash}
                    disabled={busy || !squashRange || squashRange.entryIds.length < 2}
                  >
                    <FoldIcon size={14} /> Squash
                  </Button>
                  <Button color="secondary" outline onClick={exitSelect}>
                    <XIcon size={14} /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button color="accent" onClick={() => setSelecting(true)} disabled={visible.length < 2}>
                    <ChecklistIcon size={14} /> Select to squash
                  </Button>
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={autoOn}
                      onChange={(v) => setAutoSquash(v)}
                      label="Auto-squash"
                      hint="Fold nearby entries into one update, anchored on blog posts"
                    />
                    <select
                      value={autoWindow}
                      onChange={(e) => setAutoSquash(true, Number(e.target.value))}
                      disabled={!autoOn || busy}
                      className="rounded border border-border bg-bg text-text text-sm px-2 py-1 focus:outline-none disabled:opacity-50"
                      title="Entries closer together than this get folded"
                    >
                      {AUTO_WINDOWS.map((w) => (
                        <option key={w.ms} value={w.ms}>
                          within {w.label}
                        </option>
                      ))}
                    </select>
                    {autoOn && (
                      <Button
                        color="primary"
                        outline
                        onClick={() => setAutoSquash(true)}
                        disabled={busy || items.length < 2}
                        title="Run auto-squash again now"
                      >
                        <FoldIcon size={14} /> Run
                      </Button>
                    )}
                  </div>
                  {squashCount > 0 && (
                    <Button
                      color="danger"
                      outline
                      onClick={() => {
                        if (confirm('Remove every squash for this cube and turn off auto-squash? The original entries are kept.')) {
                          removeAllSquashes({ cubeId: cube.cubeId });
                        }
                      }}
                    >
                      Unsquash all
                    </Button>
                  )}
                  <Button
                    color="secondary"
                    outline
                    disabled={visible.length === 0}
                    onClick={() =>
                      copy(
                        '__all__',
                        visible.map((it) => itemMarkdown(it, cards)).join('\n\n'),
                      )
                    }
                    title="Copy the whole visible timeline as Markdown"
                  >
                    {copiedKey === '__all__' ? <CheckIcon size={14} /> : <CopyIcon size={14} />} Copy all
                  </Button>
                </>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">
            Changes ({visible.length}
            {hiddenCount > 0 && <span className="text-text-secondary font-normal text-sm"> · {hiddenCount} hidden</span>})
          </h2>
        </div>

        {entries === undefined ? (
          <div className="py-12 text-center text-text-secondary">
            <Spinner /> Loading entries…
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-text-secondary">
            {entries.length === 0 ? 'This cube has no changelog history yet.' : 'Every entry is hidden by the current filters.'}
          </p>
        ) : (
          <ol className="relative ml-2 border-l-2 border-border pl-6 flex flex-col gap-4">
            {visible.map((item) => (
              <li key={item.key} className="relative">
                <span
                  className={
                    item.kind === 'squash'
                      ? 'absolute -left-[33px] top-3 h-4 w-4 rounded-full bg-button-primary ring-4 ring-bg'
                      : 'absolute -left-[31px] top-3.5 h-3 w-3 rounded-full bg-border-secondary ring-4 ring-bg'
                  }
                />
                <EntryCard
                  item={item}
                  cubeId={cube.cubeId}
                  cards={cards}
                  hideEdits={hideEdits}
                  selecting={selecting}
                  selected={selected.has(item.key)}
                  onToggleSelect={(shift) => toggleSelect(item.key, shift)}
                  onUnsquash={() => item.squashId && removeSquash({ id: item.squashId })}
                  onRename={(title) => item.squashId && renameSquash({ id: item.squashId, title })}
                  onCopy={() => copy(item.key, itemMarkdown(item, cards))}
                  copied={copiedKey === item.key}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
