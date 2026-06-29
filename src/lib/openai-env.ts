/**
 * Clé API OpenAI : OPENAI_API_KEY (recommandé), ou OPENAI_KEY en repli.
 * À définir dans .env ou .env.local à la racine du projet, puis redémarrer `npm run dev`.
 */
export function getOpenAiApiKey(): string | undefined {
  const k =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_KEY?.trim();
  return k || undefined;
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}
