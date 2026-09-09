import { ClockIcon, FoldIcon, TrashIcon } from '@primer/octicons-react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../../convex/_generated/api';
import { Button, Card, CardBody, Spinner } from '../components/ui';
import { parseCubeInput, relativeTime } from '../lib/format';

export default function HomePage() {
  const navigate = useNavigate();
  const cubes = useQuery(api.cubes.list);
  const sync = useAction(api.sync.syncCube);
  const removeCube = useMutation(api.cubes.remove);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const id = parseCubeInput(input);
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const result = await sync({ id });
      navigate(`/c/${result.shortId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-8">
      <Card className="overflow-hidden">
        <div className="bg-hero-bg text-white px-6 py-8 sm:px-10 sm:py-12">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="" className="h-16 w-16 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Squash your Cube Cobra changelog</h1>
              <p className="mt-1 text-white/80 max-w-2xl">
                Merge a pile of one-card updates into a single readable entry, and hide tag and printing
                edits that bury the real changes.
              </p>
            </div>
          </div>
        </div>
        <CardBody>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Cube ID or URL, e.g. https://cubecobra.com/cube/overview/warsawpeasant"
              className="flex-grow rounded border border-border bg-bg px-3 py-2 text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-focus-ring/50 focus:border-focus-ring"
              disabled={busy}
            />
            <Button color="primary" type="submit" disabled={busy || !input.trim()} className="px-4 py-2">
              {busy ? (
                <>
                  <Spinner /> Syncing history…
                </>
              ) : (
                'Load cube'
              )}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-button-danger">{error}</p>}
          <p className="mt-2 text-xs text-text-secondary">
            Works with any public cube. The first sync pulls the entire history, so a long-lived cube can take a
            minute.
          </p>
        </CardBody>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FoldIcon size={18} /> Your cubes
        </h2>
        {cubes === undefined ? (
          <Spinner className="text-text-secondary" />
        ) : cubes.length === 0 ? (
          <p className="text-sm text-text-secondary">No cubes synced yet. Paste one above to get started.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cubes.map((cube) => (
              <Card key={cube._id} className="overflow-hidden group">
                <Link to={`/c/${cube.shortId}`} className="block">
                  <div className="relative h-32 bg-bg-secondary">
                    {cube.imageUri && (
                      <img
                        src={cube.imageUri}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <div className="font-bold text-lg leading-tight truncate">{cube.name}</div>
                      {cube.ownerName && <div className="text-xs text-white/80">by {cube.ownerName}</div>}
                    </div>
                  </div>
                </Link>
                <CardBody className="flex items-center justify-between py-2 text-xs text-text-secondary">
                  <span>
                    {cube.entryCount} entries · <ClockIcon size={12} /> synced {relativeTime(cube.lastSyncedAt)}
                  </span>
                  <button
                    type="button"
                    className="text-text-secondary hover:text-button-danger"
                    title="Remove this cube from Cube Squash"
                    onClick={() => {
                      if (confirm(`Remove ${cube.name} and all of its squashes?`)) removeCube({ cubeId: cube.cubeId });
                    }}
                  >
                    <TrashIcon size={14} />
                  </button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
