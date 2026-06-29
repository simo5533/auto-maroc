"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { btnPrimary, inputBase } from "@/components/ui/styles";

export function AdminCreateCarForm() {
  const [json, setJson] = useState(`{
  "brandAr": "هيونداي",
  "brandFr": "Hyundai",
  "modelAr": "i20",
  "modelFr": "i20",
  "versionAr": "1.2",
  "versionFr": "1.2",
  "year": 2025,
  "priceNewEst": 210000,
  "conditionDefault": "NEW",
  "fuel": "PETROL",
  "transmission": "MANUAL",
  "bodyType": "CITY_CAR",
  "usageRecommended": ["CITY","FAMILY"],
  "descriptionAr": "سيارة مدينة حديثة.",
  "descriptionFr": "Citadine récente.",
  "specs": {
    "engineAr": "1.2",
    "fiscalPower": 6,
    "consumptionL100": 5.5,
    "seats": 5,
    "trunkL": 300,
    "maintenanceCostEst": 4000,
    "reliabilityScore": 80,
    "resaleScore": 78,
    "comfortScore": 77,
    "globalScore": 79,
    "partsAvailabilityAr": "جيدة في المدن الكبرى"
  }
}`);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    let body: unknown;
    try {
      body = JSON.parse(json);
    } catch {
      setMsg("JSON invalide");
      return;
    }
    const res = await fetch("/api/admin/cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error === "forbidden" ? "Non admin" : JSON.stringify(data.details ?? data));
      return;
    }
    setMsg("Voiture créée : " + data.car?.id);
  }

  return (
    <Card padding="p-6 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Créer une voiture</h2>
          <p className="mt-1 text-sm text-zinc-600">Corps JSON envoyé à <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">POST /api/admin/cars</code></p>
        </div>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className={`min-h-[280px] font-mono text-xs leading-relaxed ${inputBase}`}
          spellCheck={false}
        />
        <button type="submit" className={btnPrimary}>
          Envoyer
        </button>
        {msg && <p className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800 ring-1 ring-zinc-200">{msg}</p>}
      </form>
    </Card>
  );
}
