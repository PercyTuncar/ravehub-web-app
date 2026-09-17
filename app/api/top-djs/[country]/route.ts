import { NextRequest, NextResponse } from "next/server";
import { getTopDjsCountry } from "@/lib/top-djs/config";
import { getPublicTopDjs } from "@/lib/top-djs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> },
) {
  const { country } = await params;
  if (!getTopDjsCountry(country))
    return NextResponse.json({ error: "País no disponible." }, { status: 404 });
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;
  if (yearParam && (!Number.isInteger(year) || Number(year) < 2024))
    return NextResponse.json({ error: "Año no válido." }, { status: 400 });

  try {
    const data = await getPublicTopDjs(country, year);
    return NextResponse.json(
      data ?? { cycle: null, candidates: [], history: [] },
    );
  } catch (error) {
    console.error("[Top DJs] Public read failed:", error);
    return NextResponse.json(
      { error: "No se pudo consultar el ranking en este momento." },
      { status: 503 },
    );
  }
}
