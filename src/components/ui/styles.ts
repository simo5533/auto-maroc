/** Classes réutilisables — design system Auto Maroc (sans dépendance clsx). */

export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2";

export const btnPrimary =
  `inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] ${focusRing}`;

export const btnSecondary =
  `inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.98] ${focusRing}`;

export const btnGhost =
  `inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 ${focusRing}`;

export const inputBase =
  `w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-inner transition placeholder:text-zinc-400 hover:border-zinc-300 ${focusRing}`;

export const selectBase = inputBase;

export const cardBase =
  "rounded-2xl border border-zinc-200/90 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.04)]";

export const cardHover = "transition-shadow hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)]";
