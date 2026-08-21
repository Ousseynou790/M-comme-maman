"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Lit la date de fin passée en prop — jamais de valeur codée en dur.
 * Quand l'échéance est passée, le composant ne rend rien : la section disparaît
 * au lieu d'afficher 00:00:00:00 comme sur l'ancien site.
 */
export function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // La réserve tient la même hauteur que les cellules : rien ne saute à l'arrivée.
  if (now === null) return <div className="h-[87px]" aria-hidden />;

  const remaining = new Date(endsAt).getTime() - now;
  if (remaining <= 0) return null;

  const cells = [
    { value: pad(Math.floor(remaining / 86400000)), label: "Jours" },
    { value: pad(Math.floor(remaining / 3600000) % 24), label: "Heures" },
    { value: pad(Math.floor(remaining / 60000) % 60), label: "Min" },
    { value: pad(Math.floor(remaining / 1000) % 60), label: "Sec" },
  ];

  return (
    <div className="flex gap-2 sm:gap-3">
      {cells.map((c, i) => (
        <div
          key={c.label}
          className="min-w-0 flex-1 rounded-2xl bg-white/8 px-2 py-2.5 text-center sm:min-w-[78px] sm:flex-none sm:px-2.5"
        >
          <div
            key={i === 3 ? c.value : undefined}
            className={`text-[26px] font-extrabold tracking-tight tabular-nums sm:text-[30px] ${i === 3 ? "anim-tick" : ""}`}
          >
            {c.value}
          </div>
          <div className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[.1em] opacity-60">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
