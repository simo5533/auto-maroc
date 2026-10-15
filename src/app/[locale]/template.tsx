import type { ReactNode } from "react";

export default function LocaleTemplate({ children }: { children: ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
