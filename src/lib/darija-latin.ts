/**
 * Darija marocaine en alphabet latin (franco-arabe / Arabizi).
 * Convertit le script arabe restant dans les avis vers le latin.
 */

const PHRASE_MAP: Array<[RegExp, string]> = [
  [/خاص غير تتبع الصيانة بانتظام\.?/g, "khass ghir ttab3 s-siana b-intidam."],
  [/النصيحة ديالي\s*:?/g, "n-nasi7a dyali:"],
  [/ما تشري\.?/g, "ma techri."],
  [/شي صعيب\.?/g, "chi s3ib."],
  [/استعمال اليومي\.?/g, "isti3mal l-yawmi."],
  [/فالسفر كانت مستقرة ومريحة\.?/g, "f-safar kanet msta9arra w mri7a."],
  [/مرتب وكيعطي إحساس نقي\.?/g, "mratteb w kay3ti i7sas n9i."],
  [/زوين وكيبان/g, "zwine w kayban"],
  [/ممكن تكون/g, "momkin tkoun"],
  [/واضح/g, "wade7"],
  [/معقول/g, "ma39oul"],
  [/منطقي/g, "manti9i"],
  [/عملي/g, "3amali"],
  [/مزيان/g, "mzyan"],
  [/واضحة/g, "wade7a"],
  [/شي\s+/g, "chi "],
  [/ماشي/g, "machi"],
  [/بنتظام/g, "b-intidam"],
  [/بانتظام/g, "b-intidam"],
  [/الصيانة/g, "s-siana"],
  [/تتبع/g, "ttab3"],
  [/غير/g, "ghir"],
  [/خاص/g, "khass"],
];

/** Lettres arabes → Arabizi marocain courant. */
const CHAR_MAP: Record<string, string> = {
  "ا": "a",
  "أ": "a",
  "إ": "i",
  "آ": "a",
  "ٱ": "a",
  "ء": "'",
  "ئ": "'",
  "ؤ": "'",
  "ى": "a",
  "ة": "a",
  "ب": "b",
  "ت": "t",
  "ث": "t",
  "ج": "j",
  "ح": "7",
  "خ": "kh",
  "د": "d",
  "ذ": "d",
  "ر": "r",
  "ز": "z",
  "س": "s",
  "ش": "ch",
  "ص": "s",
  "ض": "d",
  "ط": "t",
  "ظ": "d",
  "ع": "3",
  "غ": "gh",
  "ف": "f",
  "ق": "9",
  "ك": "k",
  "ل": "l",
  "م": "m",
  "ن": "n",
  "ه": "h",
  "و": "w",
  "ي": "i",
  "ّ": "",
  "ً": "",
  "ٌ": "",
  "ٍ": "",
  "َ": "",
  "ُ": "",
  "ِ": "",
  "ْ": "",
  "ٰ": "a",
  "،": ",",
  "؛": ";",
  "؟": "?",
  "٪": "%",
};

const ARABIC_RE = /[\u0600-\u06FF]/;

export function hasArabicScript(text: string): boolean {
  return ARABIC_RE.test(text);
}

function transliterateArabicChars(text: string): string {
  let out = "";
  for (const ch of text) {
    if (CHAR_MAP[ch] !== undefined) {
      out += CHAR_MAP[ch];
    } else if (ARABIC_RE.test(ch)) {
      // lettre arabe non listée → ignore
    } else {
      out += ch;
    }
  }
  return out;
}

/** Nettoie un texte d’avis : phrases connues + translittération du reste. */
export function toDarijaLatin(raw: string): string {
  let s = String(raw ?? "").trim();
  if (!s) return s;
  if (!hasArabicScript(s)) return s;

  for (const [re, repl] of PHRASE_MAP) {
    s = s.replace(re, repl);
  }

  if (hasArabicScript(s)) {
    s = transliterateArabicChars(s);
  }

  return s
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/([.!?]){2,}/g, "$1")
    .trim();
}
