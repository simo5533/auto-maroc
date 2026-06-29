"use client";

import { useState } from "react";

export function Car3DViewer({
  exteriorUrl,
  interiorUrl,
  title,
  tabExterior,
  tabInterior,
  missingText,
}: {
  exteriorUrl?: string | null;
  interiorUrl?: string | null;
  title: string;
  tabExterior: string;
  tabInterior: string;
  missingText: string;
}) {
  const [tab, setTab] = useState<"exterior" | "interior">("exterior");
  const currentUrl = tab === "exterior" ? exteriorUrl : interiorUrl;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
        <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("exterior")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === "exterior" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
          >
            {tabExterior}
          </button>
          <button
            type="button"
            onClick={() => setTab("interior")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === "interior" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
          >
            {tabInterior}
          </button>
        </div>
      </div>

      {currentUrl ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
          <iframe
            src={currentUrl}
            title={tab === "exterior" ? tabExterior : tabInterior}
            className="h-[480px] w-full"
            loading="lazy"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 p-5 text-sm text-zinc-600">
          {missingText}
        </div>
      )}
    </section>
  );
}
