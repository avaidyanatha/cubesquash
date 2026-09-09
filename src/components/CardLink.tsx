import { useState } from 'react';

export type CardInfo = { name: string; imageNormal?: string; imageSmall?: string };

export default function CardLink({ cardID, info }: { cardID: string; info?: CardInfo }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const name = info?.name ?? 'Unknown card';

  const place = (x: number, y: number) => {
    const w = 244;
    const h = 340;
    const left = x + 16 + w > window.innerWidth ? x - w - 16 : x + 16;
    const top = Math.min(Math.max(8, y - h / 2), window.innerHeight - h - 8);
    setPos({ x: left, y: top });
  };

  return (
    <>
      <a
        href={`https://cubecobra.com/tool/card/${cardID}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link hover:text-link-active font-medium"
        onMouseEnter={(e) => place(e.clientX, e.clientY)}
        onMouseMove={(e) => place(e.clientX, e.clientY)}
        onMouseLeave={() => setPos(null)}
      >
        {name}
      </a>
      {pos && info?.imageNormal && (
        <img
          src={info.imageNormal}
          alt={name}
          className="fixed z-50 w-[244px] rounded-xl shadow-2xl pointer-events-none"
          style={{ left: pos.x, top: pos.y }}
        />
      )}
    </>
  );
}
