/**
 * Réponses sans clé API : extraits de la fiche par recoupement mots (pas d’appel externe).
 */

function trunc(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max).trim()}…`;
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

/**
 * Dernière question utilisateur dans l’historique — utilisée pour le mode hors ligne.
 */
export function answerCarQuestionOffline(
  locale: "ar" | "fr",
  context: string,
  question: string,
): string {
  const qNorm = normalizeForMatch(question);
  let qWords = new Set(qNorm.split(/\s+/).filter((w) => w.length > 2));
  if (qWords.size === 0) {
    qWords = new Set(qNorm.split(/\s+/).filter((w) => w.length >= 2));
  }

  const paragraphs = context
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 50);

  let best: { score: number; text: string } = { score: 0, text: paragraphs[0] ?? context.slice(0, 800) };

  for (const p of paragraphs) {
    const pl = normalizeForMatch(p);
    let score = 0;
    for (const w of qWords) {
      if (pl.includes(w)) score += 1;
    }
    if (score > best.score) {
      best = { score, text: p };
    }
  }

  const disclaimerFr =
    "\n\n— Réponse automatique à partir des textes de cette fiche (sans OpenAI). Pour un dialogue plus naturel, définissez la variable d’environnement OPENAI_API_KEY sur le serveur.";
  const disclaimerAr =
    "\n\n— إجابة تلقائية من نصوص هذه البطاقة فقط (بدون OpenAI). لحوار أكثر مرونة، عرّف OPENAI_API_KEY على الخادم.";

  const disclaimer = locale === "ar" ? disclaimerAr : disclaimerFr;

  if (best.score > 0) {
    return trunc(best.text, 1400) + disclaimer;
  }

  const emptyFr =
    "Je n’ai pas trouvé dans cette fiche un passage qui correspond clairement à votre question. Essayez des mots liés à la consommation, la motorisation, le coffre, ou consultez les blocs « Fiche technique » et FAQ sur la page.";
  const emptyAr =
    "لم أجد في هذه البطاقة مقطعًا يطابق سؤالك بوضوح. جرّب كلمات مثل الاستهلاك أو المحرك أو الصندوق، أو راجع أقسام المواصفات والأسئلة الشائعة في الصفحة.";

  return (locale === "ar" ? emptyAr : emptyFr) + disclaimer;
}
