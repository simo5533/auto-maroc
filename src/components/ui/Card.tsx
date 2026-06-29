import type { ReactNode } from "react";
import { cardBase, cardHover } from "./styles";

export function Card({
  children,
  className = "",
  padding = "p-5 sm:p-6",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
  hover?: boolean;
}) {
  return <div className={`${cardBase} ${hover ? cardHover : ""} ${padding} ${className}`.trim()}>{children}</div>;
}
