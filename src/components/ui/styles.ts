/** Classes réutilisables — design system Auto Maroc (sans dépendance clsx). */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

export const btnPrimary =
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-accent px-6 text-sm font-semibold text-accent-ink transition duration-200 hover:bg-accent-hover active:scale-[0.98] ${focusRing}`;

export const btnSecondary =
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-transparent px-6 text-sm font-semibold text-fg transition duration-200 hover:border-white/35 hover:bg-white/[0.03] active:scale-[0.98] ${focusRing}`;

export const btnGhost =
  `inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-fg-muted transition hover:bg-white/[0.05] hover:text-fg ${focusRing}`;

export const inputBase =
  `w-full min-h-11 rounded-[10px] border border-line bg-carbon px-3.5 text-sm text-fg transition placeholder:text-steel hover:border-line-strong ${focusRing}`;

export const selectBase = inputBase;

export const cardBase = "rounded-[14px] border border-line bg-graphite";

export const cardHover = "transition duration-200 hover:border-line-strong";

/** Conteneur de page pleine largeur (accueil, catalogue, fiche). */
export const container = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12";

/** Petit label éditorial (au-dessus des titres). */
export const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.22em] text-accent";
