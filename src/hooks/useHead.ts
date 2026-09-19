import { useEffect } from 'react';

export const SITE_URL = 'https://cubesquash.com';
export const SITE_NAME = 'Cube Squash';
const DEFAULT_TITLE = 'Cube Squash: tidy up your Cube Cobra changelog';
const DEFAULT_DESCRIPTION =
  'Paste a Cube Cobra cube to get a cleaner changelog. Merge runs of small updates into one entry, hide tag and printing edits, and copy the result as Markdown.';
const DEFAULT_IMAGE = `${SITE_URL}/og.png`;

type Head = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
};

const setContent = (selector: string, content: string) => {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (el) el.content = content;
};

export function useHead({ title, description, path, image, noindex }: Head = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
    const text = description ?? DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${path ?? '/'}`;
    const img = image ?? DEFAULT_IMAGE;

    document.title = fullTitle;
    setContent('meta[name="description"]', text);
    setContent('meta[property="og:title"]', fullTitle);
    setContent('meta[property="og:description"]', text);
    setContent('meta[property="og:url"]', url);
    setContent('meta[property="og:image"]', img);
    setContent('meta[name="twitter:title"]', fullTitle);
    setContent('meta[name="twitter:description"]', text);
    setContent('meta[name="twitter:image"]', img);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;

    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex';
    } else {
      robots?.remove();
    }
  }, [title, description, path, image, noindex]);
}
