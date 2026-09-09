# Cube Squash

Live at [cubesquash.com](https://cubesquash.com).

A self-hosted viewer for your [Cube Cobra](https://cubecobra.com) changelog that lets you squash a run of small changelog entries into one readable update and hide non-card changes (tag, status, finish, and printing edits).

Cube Cobra has no API for editing or deleting changelog entries, so this tool never touches your cube. It mirrors the public history, stores your squash groups in Convex, and renders a cleaned-up timeline. Every entry still links back to the original changelog and the point-in-time list on Cube Cobra.

## What it does

- Paste a cube URL or ID and it syncs the full changelog history (incremental on re-sync).
- Select a range of entries and squash them into one group with a title. Squashed groups show the merged changelist and can be expanded to see the originals.
- "Net out" mode cancels a card that was added and then cut within the same group, and folds tag edits into the add.
- "Hide non-card changes" drops tag, status, finish, and printing edits everywhere. Entries that only contain those disappear from the timeline.
- Auto-squash groups entries that happened within a chosen window (same day, 3 days, 7 days).
- Copy any entry or group as Markdown to paste into a Cube Cobra blog post.

## Local development

```sh
npm install
npm run dev
```

The first `convex dev` run offers to start a local anonymous backend (no Convex account needed). Vite serves the app on http://localhost:5173.

Run the merge logic tests with `npm test`.

## Hosting on Convex cloud (recommended)

The frontend is served by the [static-hosting component](https://github.com/get-convex/static-hosting) from the same Convex deployment that runs the backend, so one `deploy` ships both. This is how abhivaidyanatha.com and svixtape.com are hosted.

```sh
npx convex login
npx convex dev --configure new   # create the project, pick the team
npm run deploy                    # pushes functions and uploads the built site
```

`npm run deploy` runs `convex deploy`, then `static-hosting deploy --skip-convex`, which builds with the production `VITE_CONVEX_URL` and uploads `dist/`. Never upload a plain `npm run build` output: it bakes the dev URL from `.env.local` into the bundle.

To serve it on your own domain, add the hostname as a custom domain on the production deployment in the Convex dashboard (Settings, Custom Domains), then add a CNAME for it pointing at `convex.domains` in your DNS. cubesquash.com does this from Cloudflare with CNAME records for `@` (flattened) and `www`, both DNS-only.

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys on every push to `main`. It needs a `CONVEX_DEPLOY_KEY` repository secret, generated from the production deployment's settings page.

## Self-hosting with Docker

If you would rather run the backend yourself, the stack is the Convex backend and dashboard from the [official self-hosted images](https://github.com/get-convex/convex-backend/tree/main/self-hosted), plus the static frontend served by nginx.

1. Copy `.env.example` to `.env.local`.
2. Start the backend and dashboard, then generate an admin key:

   ```sh
   docker compose up -d backend dashboard
   docker compose exec backend ./generate_admin_key.sh
   ```

3. Put the values in `.env.local`:

   ```sh
   CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
   CONVEX_SELF_HOSTED_ADMIN_KEY=<key from step 2>
   VITE_CONVEX_URL=http://127.0.0.1:3210
   ```

   `VITE_CONVEX_URL` must be the URL that browsers reach the backend on, so use your public hostname if the backend is exposed through a reverse proxy.

4. Push the Convex functions and build the web image:

   ```sh
   npx convex deploy
   VITE_CONVEX_URL=https://convex.example.com docker compose up -d --build web
   ```

The web app listens on port 8080 by default (`WEB_PORT`). The Convex dashboard is on 6791. State lives in the `data` Docker volume as SQLite; point `POSTGRES_URL` at a database if you want something sturdier. The static-hosting component also works on a self-hosted backend, so you can skip the nginx container and serve the site from port 3211 instead.

There is no auth. Anyone who can reach the site can create and remove squashes, so keep it behind your own proxy or VPN if that matters.

## How it talks to Cube Cobra

- `POST /cube/api/cubemetadata/:id` resolves a short ID to the internal cube ID and gives the name, image, and owner.
- `POST /cube/getmorechangelogs` pages through changelog bodies, newest first.
- `POST /cube/api/getdetailsforcards` resolves Scryfall IDs to names and images.

Changelog bodies are stored in a compact form (card ID plus tags, status, finish, and a few editable fields). Board indices are dropped because they are meaningless once entries are merged.
