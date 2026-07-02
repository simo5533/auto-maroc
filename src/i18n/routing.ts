import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "fr"],
  defaultLocale: "fr",
  localePrefix: "always",
});
