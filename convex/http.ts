import { httpRouter } from 'convex/server';

import { api } from './_generated/api';
import { httpAction } from './_generated/server';

const SITE_URL = 'https://cubesquash.com';

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] ?? c);

const http = httpRouter();

http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(async () => new Response('ok')),
});

http.route({
  path: '/sitemap.xml',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const cubes = await ctx.runQuery(api.cubes.list);
    const urls = [
      `<url><loc>${SITE_URL}/</loc></url>`,
      ...cubes.map(
        (c) =>
          `<url><loc>${SITE_URL}/c/${escapeXml(c.shortId || c.cubeId)}</loc><lastmod>${new Date(c.lastSyncedAt).toISOString()}</lastmod></url>`,
      ),
    ];
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
    return new Response(body, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    });
  }),
});

export default http;
