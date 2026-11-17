export function LotusMark({ size = 40, gold = false }) {
  const c = gold
    ? { a: "#f4b740", b: "#eaa21d", c: "#f8cf77", d: "#d9930f" }
    : { a: "rgb(var(--brand-700))", b: "rgb(var(--brand-400))", c: "rgb(var(--brand-300))", d: "rgb(var(--brand-500))" };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M32 6c7 8 10 16 0 30C22 22 25 14 32 6z" style={{ fill: c.a }} />
      <path d="M32 38C20 36 12 28 8 20c12 0 22 6 24 18z" style={{ fill: c.b }} />
      <path d="M32 38c12-2 20-10 24-18-12 0-22 6-24 18z" style={{ fill: c.c }} />
      <path d="M32 42c-8 6-16 6-24 2 6 10 18 14 24 14s18-4 24-14c-8 4-16 4-24-2z" style={{ fill: c.d }} />
    </svg>
  );
}
export function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <LotusMark size={light ? 38 : 44} gold={light} />
      <div className="leading-tight">
        <div className={`font-bold ${light ? "text-[19px] tracking-[0.1em] text-white" : "text-[22px] tracking-[0.16em] text-brand-800"}`}>AYURAAURAA</div>
        <div className={`text-[10.5px] tracking-wide ${light ? "text-brand-200" : "text-brand-600"}`}>Ancient Wisdom. Better Health.</div>
      </div>
    </div>
  );
}
