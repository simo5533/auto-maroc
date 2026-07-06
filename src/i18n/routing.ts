import { defineRouting } from "next-intl/routing";

/** `ar` = darija (الدارجة), `fr` = français — pas d’autres langues. */
export const routing = defineRouting({
  locales: ["ar", "fr"],
  defaultLocale: "fr",
  localePrefix: "always",
});
