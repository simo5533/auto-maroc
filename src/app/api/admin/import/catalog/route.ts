import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { catalogBundleSchema } from "@/lib/catalog-vehicle-zod";
import { upsertCatalogVehicle } from "@/lib/upsert-catalog-vehicle";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const source = typeof body.source === "string" ? body.source : "";

  let raw: string;
  if (source === "morocco-bundle") {
    raw = await readFile(join(process.cwd(), "data", "morocco-catalog.json"), "utf8");
  } else if (source === "json-body" && typeof body.data === "object") {
    raw = JSON.stringify(body.data);
  } else if (source === "json-body" && typeof body.payload === "string") {
    raw = body.payload;
  } else {
    return NextResponse.json(
      {
        error: "invalid_source",
        hint: 'Utilisez { "source": "morocco-bundle" } ou { "source": "json-body", "data": { "vehicles": [...] } }',
      },
      { status: 400 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = catalogBundleSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", details: parsed.error.flatten() }, { status: 400 });
  }

  const results: { id: string; action: "created" | "updated" }[] = [];
  for (const v of parsed.data.vehicles) {
    const r = await upsertCatalogVehicle(prisma, v);
    results.push({ id: r.id, action: r.action });
  }

  const created = results.filter((r) => r.action === "created").length;
  const updated = results.filter((r) => r.action === "updated").length;

  return NextResponse.json({
    ok: true,
    total: results.length,
    created,
    updated,
    version: parsed.data.version ?? null,
    source: parsed.data.source ?? null,
  });
}
