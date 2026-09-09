import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';

import { REHYPE_PLUGINS, REMARK_PLUGINS } from '../markdown';

const CC = 'https://cubecobra.com';
const CDN = 'https://assets.cubecobra.com';

function HoverImage({ src, name, children }: { src: string; name: string; children: ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const place = (x: number, y: number) => {
    const w = 244;
    const h = 340;
    const left = x + 16 + w > window.innerWidth ? x - w - 16 : x + 16;
    const top = Math.min(Math.max(8, y - h / 2), window.innerHeight - h - 8);
    setPos({ x: left, y: top });
  };
  return (
    <>
      <span
        onMouseEnter={(e) => place(e.clientX, e.clientY)}
        onMouseMove={(e) => place(e.clientX, e.clientY)}
        onMouseLeave={() => setPos(null)}
      >
        {children}
      </span>
      {pos && (
        <img
          src={src}
          alt={name}
          className="fixed z-50 w-[244px] rounded-xl shadow-2xl pointer-events-none"
          style={{ left: pos.x, top: pos.y }}
        />
      )}
    </>
  );
}

type CardlinkProps = { name: string; id: string; dfc?: boolean };
const Cardlink = ({ name, id }: CardlinkProps) => {
  const idURL = encodeURIComponent(id);
  return (
    <HoverImage src={`${CC}/tool/cardimage/${idURL}`} name={name}>
      <a
        href={`${CC}/tool/card/${idURL}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link hover:text-link-active font-medium"
      >
        {name}
      </a>
    </HoverImage>
  );
};

type CardimageProps = { id: string; dfc?: boolean; showBackImage?: boolean };
// Spans throughout: these can land inside a <p>, where a <div> is invalid HTML.
const Cardimage = ({ id, dfc, showBackImage }: CardimageProps) => {
  const idURL = encodeURIComponent(id);
  const src = dfc && showBackImage ? `${CC}/tool/cardimageflip/${idURL}` : `${CC}/tool/cardimage/${idURL}`;
  return (
    <span className="inline-block w-1/2 lg:w-1/4 p-2 align-top">
      <a href={`${CC}/tool/card/${idURL}`} target="_blank" rel="noopener noreferrer" className="block">
        <img src={src} alt={id} className="w-full rounded-[4.75%]" loading="lazy" />
      </a>
    </span>
  );
};

const Symbol = ({ value }: { value: string }) => {
  if (!value) return null;
  const symbol = value.split('/').join('-').toLowerCase();
  return <img src={`${CDN}/content/symbols/${symbol}.png`} alt={`{${value}}`} className="w-5 h-5 inline align-text-bottom" />;
};

const Userlink = ({ name }: { name: string }) => (
  <a
    href={`${CC}/user/view/${encodeURIComponent(name)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-link hover:text-link-active"
  >
    @{name}
  </a>
);

const Anchor = ({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const ref = href ?? '';
  const absolute = /^https?:\/\//i.test(ref) ? ref : ref.startsWith('/') ? `${CC}${ref}` : ref;
  return (
    <a href={absolute} target="_blank" rel="noopener noreferrer" className="text-link hover:text-link-active">
      {children}
    </a>
  );
};

const components = {
  cardlink: Cardlink,
  cardimage: Cardimage,
  cardrow: ({ children }: { children?: ReactNode }) => <span className="flex flex-row flex-wrap">{children}</span>,
  symbol: Symbol,
  userlink: Userlink,
  a: Anchor,
  h1: ({ children }: { children?: ReactNode }) => <h1 className="text-2xl font-semibold mb-3 mt-4">{children}</h1>,
  h2: ({ children }: { children?: ReactNode }) => <h2 className="text-xl font-semibold mb-2 mt-4">{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 className="text-lg font-semibold mb-2 mt-3">{children}</h3>,
  h4: ({ children }: { children?: ReactNode }) => <h4 className="text-base font-semibold mb-1 mt-3">{children}</h4>,
  h5: ({ children }: { children?: ReactNode }) => <h5 className="text-sm font-semibold mb-1 mt-2">{children}</h5>,
  h6: ({ children }: { children?: ReactNode }) => <h6 className="text-sm font-semibold mb-1 mt-2">{children}</h6>,
  p: ({ children }: { children?: ReactNode }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-6 mb-3">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-6 mb-3">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="mb-0.5">{children}</li>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <div className="border border-border bg-bg-active mb-3 p-3">{children}</div>
  ),
  hr: () => <hr className="my-4 border-border" />,
  img: ({ src, alt, title }: { src?: string; alt?: string; title?: string }) => (
    <img className="max-w-full" src={src} alt={alt} title={title} loading="lazy" />
  ),
  code: ({ children, className }: { children?: ReactNode; className?: string }) =>
    className ? (
      <code className={`${className} font-mono text-xs`}>{children}</code>
    ) : (
      <code className="font-mono text-[0.85em] rounded bg-bg-active px-1">{children}</code>
    ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="overflow-x-auto max-w-full rounded border border-border bg-bg-active p-3 mb-3 text-xs">{children}</pre>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="table-auto border-collapse border border-border text-sm">{children}</table>
    </div>
  ),
  th: ({ children, style }: { children?: ReactNode; style?: React.CSSProperties }) => (
    <th className="border border-border bg-bg-active px-3 py-1.5 text-left font-semibold" style={style}>
      {children}
    </th>
  ),
  td: ({ children, style }: { children?: ReactNode; style?: React.CSSProperties }) => (
    <td className="border border-border px-3 py-1.5" style={style}>
      {children}
    </td>
  ),
} as unknown as Components;

export default function Markdown({ markdown }: { markdown: string }) {
  return (
    <div className="text-sm leading-relaxed break-words">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
