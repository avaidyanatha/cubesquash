import staticHosting from '@convex-dev/static-hosting/convex.config';
import { defineApp } from 'convex/server';

// The static site owns "/"; any app HTTP routes in convex/http.ts live under /api.
const app = defineApp({ httpPrefix: '/api' });
app.use(staticHosting, { httpPrefix: '/' });

export default app;
