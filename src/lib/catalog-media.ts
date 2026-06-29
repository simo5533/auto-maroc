/**
 * Sources images sans clé constructeur :
 * - Wikipédia REST (vignette article FR / AR / EN)
 * - Wikimedia Commons API (fichiers image « marque + modèle », licence CC)
 * - Pexels (optionnel, PEXELS_ACCESS_KEY ou PEXELS_API_KEY)
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const WM_UA =
  "AutoMarocCatalog/1.0 (https://meta.wikimedia.org/wiki/User-Agent_policy; catalogue démo locale)";

export type WikiBundle = { extract: string | null; thumbnailUrl: string | null };

function normWikiText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Vignette Wikipédia seulement si l’extrait évoque clairement la marque ou le modèle (évite articles homonymes). */
export function wikiBundleImageMatchesVehicle(bundle: WikiBundle, brandFr: string, modelFr: string): boolean {
  if (!bundle.thumbnailUrl || !bundle.extract) return false;
  const t = normWikiText(bundle.extract);
  const b = normWikiText(brandFr);
  const m = normWikiText(modelFr);
  if (b.length >= 2 && t.includes(b)) return true;
  if (m.length >= 2 && t.includes(m)) return true;
  for (const tok of m.split(/\s+/).filter((x) => x.length >= 3)) {
    if (t.includes(normWikiText(tok))) return true;
  }
  return false;
}

const pexelsMergedCache = new Map<string, string[]>();
const wikiFrBundleCache = new Map<string, WikiBundle>();
const wikiArBundleCache = new Map<string, WikiBundle>();
const wikiEnBundleCache = new Map<string, WikiBundle>();
const commonsImageCache = new Map<string, string[]>();

function wikiPageTitle(brandFr: string, modelFr: string) {
  return `${brandFr}_${modelFr}`.replace(/\s+/g, "_");
}

async function pexelsSearch(query: string, key: string, perPage: number): Promise<string[]> {
  const u = new URL("https://api.pexels.com/v1/search");
  u.searchParams.set("query", query);
  u.searchParams.set("per_page", String(Math.min(Math.max(perPage, 1), 15)));
  u.searchParams.set("orientation", "landscape");
  const res = await fetch(u.toString(), {
    headers: {
      Authorization: key,
      Accept: "application/json",
      "User-Agent": "AutoMarocCatalog/1.0 (Pexels API client)",
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { photos?: { src?: { large2x?: string; large?: string; original?: string } }[] };
  const out: string[] = [];
  for (const p of data.photos ?? []) {
    const url = p.src?.large2x ?? p.src?.large ?? p.src?.original;
    if (url && /^https:\/\//i.test(url)) {
      out.push(url);
      if (out.length >= perPage) break;
    }
  }
  return out;
}

/**
 * Plusieurs requêtes ciblées « automobile / SUV » pour limiter les photos hors-sujet.
 */
export async function fetchPexelsCarPhotos(
  brandFr: string,
  modelFr: string,
  bodyType: string,
  count: number,
): Promise<string[]> {
  const key = process.env.PEXELS_ACCESS_KEY?.trim() || process.env.PEXELS_API_KEY?.trim();
  const cacheKey = `${brandFr.toLowerCase()}|${modelFr.toLowerCase()}|${bodyType}`;
  if (pexelsMergedCache.has(cacheKey)) return pexelsMergedCache.get(cacheKey)!;
  if (!key) {
    pexelsMergedCache.set(cacheKey, []);
    return [];
  }

  try {
    const shape = bodyType === "SUV" || bodyType === "PICKUP" ? "SUV 4x4" : "berline citadine";
    const q1 = `${brandFr} ${modelFr} car vehicle`;
    const q2 = `${brandFr} ${modelFr} ${shape} automotive`;
    const batch = Math.min(count + 4, 15);
    const q3 = `${brandFr} ${modelFr} exterior`;
    const [a, b, c] = await Promise.all([
      pexelsSearch(q1, key, batch),
      pexelsSearch(q2, key, batch),
      pexelsSearch(q3, key, batch),
    ]);
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const u of [...a, ...b, ...c]) {
      if (seen.has(u)) continue;
      seen.add(u);
      merged.push(u);
      if (merged.length >= count) break;
    }
    pexelsMergedCache.set(cacheKey, merged);
    await sleep(400);
    return merged;
  } catch {
    pexelsMergedCache.set(cacheKey, []);
    return [];
  }
}

async function fetchWikiPage(host: string, pageTitle: string): Promise<WikiBundle> {
  const url = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": WM_UA,
      },
    });
    if (!res.ok) return { extract: null, thumbnailUrl: null };
    const j = (await res.json()) as {
      extract?: string;
      type?: string;
      thumbnail?: { source?: string };
    };
    if (j.type === "disambiguation") return { extract: null, thumbnailUrl: null };
    const extract =
      typeof j.extract === "string" && j.extract.length >= 40
        ? j.extract.replace(/\s+/g, " ").trim().slice(0, 1200)
        : null;
    const thumbnailUrl =
      typeof j.thumbnail?.source === "string" && /^https:\/\/upload\.wikimedia\.org\//i.test(j.thumbnail.source)
        ? j.thumbnail.source
        : null;
    return { extract, thumbnailUrl };
  } catch {
    return { extract: null, thumbnailUrl: null };
  }
}

export async function fetchWikipediaFrBundle(brandFr: string, modelFr: string): Promise<WikiBundle> {
  const title = wikiPageTitle(brandFr, modelFr);
  if (wikiFrBundleCache.has(title)) return wikiFrBundleCache.get(title)!;
  let page = await fetchWikiPage("fr.wikipedia.org", title);
  if (!page.extract && !page.thumbnailUrl) {
    page = await fetchWikiPage("fr.wikipedia.org", `${modelFr}_(automobile)`);
  }
  if (!page.extract && !page.thumbnailUrl && modelFr.includes(" ")) {
    const first = modelFr.split(/\s+/)[0]!;
    page = await fetchWikiPage("fr.wikipedia.org", `${first}_(automobile)`);
  }
  if (!page.extract && !page.thumbnailUrl) {
    page = await fetchWikiPage("fr.wikipedia.org", modelFr.replace(/\s+/g, "_"));
  }
  wikiFrBundleCache.set(title, page);
  await sleep(180);
  return page;
}

export async function fetchWikipediaArBundle(
  brandFr: string,
  modelFr: string,
  modelAr?: string | null,
): Promise<WikiBundle> {
  const title = wikiPageTitle(brandFr, modelFr);
  if (wikiArBundleCache.has(title)) return wikiArBundleCache.get(title)!;
  let page = await fetchWikiPage("ar.wikipedia.org", title);
  if (!page.extract && !page.thumbnailUrl && modelAr?.trim()) {
    page = await fetchWikiPage("ar.wikipedia.org", modelAr.trim().replace(/\s+/g, "_"));
  }
  if (!page.extract && !page.thumbnailUrl && modelFr.includes(" ")) {
    const first = modelFr.split(/\s+/)[0]!;
    page = await fetchWikiPage("ar.wikipedia.org", wikiPageTitle(brandFr, first));
  }
  wikiArBundleCache.set(title, page);
  await sleep(180);
  return page;
}

/** Vignette / extrait EN (souvent une autre photo de la fiche). */
export async function fetchWikipediaEnBundle(brandFr: string, modelFr: string): Promise<WikiBundle> {
  const title = wikiPageTitle(brandFr, modelFr);
  if (wikiEnBundleCache.has(title)) return wikiEnBundleCache.get(title)!;
  let page = await fetchWikiPage("en.wikipedia.org", title);
  if (!page.extract && !page.thumbnailUrl) {
    page = await fetchWikiPage("en.wikipedia.org", `${modelFr}_(car)`);
  }
  if (!page.extract && !page.thumbnailUrl) {
    page = await fetchWikiPage("en.wikipedia.org", `${modelFr}_(automobile)`);
  }
  if (!page.extract && !page.thumbnailUrl && modelFr.includes(" ")) {
    const first = modelFr.split(/\s+/)[0]!;
    page = await fetchWikiPage("en.wikipedia.org", wikiPageTitle(brandFr, first));
  }
  wikiEnBundleCache.set(title, page);
  await sleep(180);
  return page;
}

/** Titres Commons typiquement hors sujet (police, maquettes, schémas…) — la requête « car » matche trop large. */
const COMMONS_TITLE_REJECT = [
  /\bpolice\b|\bpolicia\b|\bpol[ií]cia\b|\bgendarmer/i,
  /\bambulance\b|\bfire\s*truck\b|\bpompier/i,
  /\bviatura\b|\bpatrol\b.*\b(car|vehicle|auto)/i,
  /\bsecurity\b.*\b(vehicle|car|van)\b|\bcampus\b.*\bsecurity\b/i,
  /\bmilitary\b|\barm(y|ee)\b.*\b(vehicle|truck|jeep)\b/i,
  /\baccident\b|\bcrash\b|\bwreck\b|\bfire\b.*\b(car|vehicle)\b/i,
  /\b(diagram|schematic|blueprint|vector\s*graphic)\b/i,
  /\b(diecast|scale\s+model|toy\s+car|model\s+car|rc\s+car)\b/i,
  /\b(corporate|wordmark)\s+logo\b|\blogo\s+only\b/i,
];

function normalizeCommonsMatch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function commonsFileTitleNorm(title: string): string {
  return normalizeCommonsMatch(title.replace(/^file:/i, ""));
}

function isRejectedCommonsTitle(norm: string): boolean {
  return COMMONS_TITLE_REJECT.some((re) => re.test(norm));
}

/** Le titre du fichier doit évoquer le modèle série (marque + modèle, ou modèle numérique avec marque). */
function commonsTitleMatchesVehicle(norm: string, brandFr: string, modelFr: string): boolean {
  const brand = normalizeCommonsMatch(brandFr);
  const model = normalizeCommonsMatch(modelFr);
  if (!model.length) return false;
  if (brand.length < 2 || !norm.includes(brand)) return false;
  const modelShort = model.length <= 4 && /\d/.test(model);
  if (modelShort) {
    const boundary = new RegExp(`(^|[^0-9a-z])${model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^0-9a-z]|$)`, "i");
    return boundary.test(norm);
  }
  return norm.includes(model) || norm.includes(model.replace(/\s+/g, ""));
}

/** Fichiers où marque + une partie du nom du modèle apparaît (ex. « Aircross » sur « C3 Aircross »). */
function commonsTitleMatchesVehicleLoose(norm: string, brandFr: string, modelFr: string): boolean {
  const brand = normalizeCommonsMatch(brandFr);
  const model = normalizeCommonsMatch(modelFr);
  if (!model.length) return false;
  if (brand.length < 2 || !norm.includes(brand)) return false;
  if (commonsTitleMatchesVehicle(norm, brandFr, modelFr)) return true;
  if (norm.includes(model) || norm.includes(model.replace(/\s+/g, ""))) return true;
  const tokens = model.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.some((t) => norm.includes(t))) return true;
  if (model.length <= 5 && /\d/.test(model)) {
    const boundary = new RegExp(`(^|[^0-9a-z])${model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^0-9a-z]|$)`, "i");
    return boundary.test(norm);
  }
  return false;
}

function scoreCommonsCandidate(norm: string, brandFr: string, modelFr: string): number {
  const brand = normalizeCommonsMatch(brandFr);
  const model = normalizeCommonsMatch(modelFr);
  let s = 0;
  if (brand.length >= 2 && norm.includes(brand)) s += 5;
  if (model.length) {
    if (model.length <= 4 && /\d/.test(model)) {
      const boundary = new RegExp(`(^|[^0-9a-z])${model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^0-9a-z]|$)`, "i");
      if (boundary.test(norm)) s += 8;
    } else if (norm.includes(model)) s += 8;
  }
  if (/\b(20[0-2]\d|199\d)\b/.test(norm)) s += 2;
  return s;
}

async function commonsSearchFiles(
  gsrsearch: string,
  fetchLimit: number,
): Promise<{ title: string; url: string; mime: string }[]> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("generator", "search");
  api.searchParams.set("gsrsearch", gsrsearch);
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrlimit", String(Math.min(Math.max(fetchLimit, 1), 50)));
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|thumburl");
  api.searchParams.set("iiurlwidth", "1280");

  const res = await fetch(api.toString(), {
    headers: { "User-Agent": WM_UA, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { title?: string; imageinfo?: { url?: string; thumburl?: string; mime?: string }[] }> };
  };
  const pages = data.query?.pages;
  if (!pages) return [];

  const rows: { title: string; url: string; mime: string }[] = [];
  for (const p of Object.values(pages)) {
    const title = p.title ?? "";
    if (/\.svg/i.test(title)) continue;
    const ii = p.imageinfo?.[0];
    const mime = ii?.mime ?? "";
    if (/svg/i.test(mime)) continue;
    const url = ii?.thumburl || ii?.url;
    if (
      typeof url === "string" &&
      /^https:\/\/upload\.wikimedia\.org\//i.test(url) &&
      /\.(jpe?g|png|webp)(\?|$)/i.test(url)
    ) {
      rows.push({ title, url, mime });
    }
  }
  return rows;
}

function pickCommonsVehicleUrls(
  rows: { title: string; url: string }[],
  brandFr: string,
  modelFr: string,
  limit: number,
  minScore = 5,
  loose = false,
): string[] {
  const matchFn = loose ? commonsTitleMatchesVehicleLoose : commonsTitleMatchesVehicle;
  const scored: { url: string; score: number }[] = [];
  const seen = new Set<string>();
  for (const { title, url } of rows) {
    const norm = commonsFileTitleNorm(title);
    if (isRejectedCommonsTitle(norm)) continue;
    if (!matchFn(norm, brandFr, modelFr)) continue;
    const score = scoreCommonsCandidate(norm, brandFr, modelFr);
    if (score < minScore) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    scored.push({ url, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.url);
}

/**
 * Photos de série sur Wikimedia Commons : requête intitle (marque + modèle),
 * puis filtrage strict sur le nom de fichier (hors police, maquettes, schémas…).
 */
function dedupeRows(rows: { title: string; url: string; mime: string }[]): { title: string; url: string }[] {
  const byTitle = new Map<string, { title: string; url: string }>();
  for (const r of rows) {
    byTitle.set(r.title, { title: r.title, url: r.url });
  }
  return [...byTitle.values()];
}

function appendUniqueTitles(
  merged: { title: string; url: string }[],
  batch: { title: string; url: string; mime: string }[],
): void {
  const have = new Set(merged.map((r) => r.title));
  for (const r of batch) {
    if (!have.has(r.title)) {
      have.add(r.title);
      merged.push({ title: r.title, url: r.url });
    }
  }
}

function collectCommonsUrls(
  merged: { title: string; url: string }[],
  brandFr: string,
  modelFr: string,
  limit: number,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const rounds: [number, boolean][] = [
    [5, false],
    [4, false],
    [5, true],
    [4, true],
  ];
  for (const [minScore, loose] of rounds) {
    if (out.length >= limit) break;
    const batch = pickCommonsVehicleUrls(merged, brandFr, modelFr, limit - out.length, minScore, loose);
    for (const u of batch) {
      if (!seen.has(u)) {
        seen.add(u);
        out.push(u);
      }
    }
  }
  return out.slice(0, limit);
}

export async function fetchCommonsVehicleImages(brandFr: string, modelFr: string, limit: number): Promise<string[]> {
  const ck = `${brandFr.toLowerCase()}|${modelFr.toLowerCase()}|${limit}|v5`;
  if (commonsImageCache.has(ck)) return commonsImageCache.get(ck)!;

  try {
    const fetchPool = Math.min(45, Math.max(limit * 8, 28));
    const q1 = `intitle:${brandFr} intitle:${modelFr}`;
    const firstBatch = await commonsSearchFiles(q1, fetchPool);
    let merged: { title: string; url: string }[];
    if (firstBatch.length < limit * 3) {
      const q2 = `intitle:"${brandFr} ${modelFr}"`;
      const extra = await commonsSearchFiles(q2, fetchPool);
      merged = dedupeRows([...firstBatch, ...extra]);
    } else {
      merged = dedupeRows(firstBatch);
    }
    let out = collectCommonsUrls(merged, brandFr, modelFr, limit);

    if (out.length < limit) {
      const q3 = `${brandFr} ${modelFr} automobile`;
      appendUniqueTitles(merged, await commonsSearchFiles(q3, fetchPool));
      out = collectCommonsUrls(merged, brandFr, modelFr, limit);
    }

    if (out.length < limit) {
      const q4 = `${brandFr} ${modelFr}`;
      appendUniqueTitles(merged, await commonsSearchFiles(q4, fetchPool));
      out = collectCommonsUrls(merged, brandFr, modelFr, limit);
    }

    if (out.length < limit && modelFr.length >= 3) {
      const q5 = `intitle:${modelFr}`;
      appendUniqueTitles(merged, await commonsSearchFiles(q5, fetchPool));
      out = collectCommonsUrls(merged, brandFr, modelFr, limit);
    }

    commonsImageCache.set(ck, out);
    await sleep(450);
    return out;
  } catch {
    commonsImageCache.set(ck, []);
    return [];
  }
}

/** @deprecated utiliser fetchWikipediaFrBundle */
export async function fetchWikipediaExtractFr(brandFr: string, modelFr: string): Promise<string | null> {
  const b = await fetchWikipediaFrBundle(brandFr, modelFr);
  return b.extract;
}

/** @deprecated utiliser fetchWikipediaArBundle */
export async function fetchWikipediaExtractAr(brandFr: string, modelFr: string): Promise<string | null> {
  const b = await fetchWikipediaArBundle(brandFr, modelFr);
  return b.extract;
}
