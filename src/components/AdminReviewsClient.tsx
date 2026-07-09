"use client";

import type { Prisma } from "@prisma/client";
import { useState } from "react";

type Row = Prisma.ReviewGetPayload<{
  include: { car: { select: { brandAr: true; modelAr: true } } };
}>;

export function AdminReviewsClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);

  async function reload() {
    const res = await fetch("/api/admin/reviews?status=PENDING", { credentials: "same-origin" });
    const data = await res.json();
    setRows(data.reviews ?? []);
  }

  async function setStatus(id: string, status: "APPROVED" | "REJECTED") {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status }),
    });
    await reload();
  }

  if (rows.length === 0) return <p className="text-sm text-zinc-600">Aucun avis en attente.</p>;

  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.id} className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-semibold">
            {r.car.brandAr} {r.car.modelAr}
          </p>
          <p className="text-xs text-zinc-500">{r.displayLabel}</p>
          <p className="mt-2 text-zinc-800">{r.commentAr}</p>
          {r.commentFr ? <p className="mt-2 text-zinc-600">{r.commentFr}</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="button" className="rounded bg-emerald-700 px-3 py-1 text-white" onClick={() => setStatus(r.id, "APPROVED")}>
              Approuver
            </button>
            <button type="button" className="rounded border px-3 py-1" onClick={() => setStatus(r.id, "REJECTED")}>
              Rejeter
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
