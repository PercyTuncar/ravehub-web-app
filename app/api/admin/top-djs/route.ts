import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-admin";
import {
  finalizeSuggestions,
  listAdminTopDjs,
  publishResults,
  updateCandidate,
  upsertCycle,
} from "@/lib/top-djs/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "moderator")
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  try {
    return NextResponse.json(
      await listAdminTopDjs(
        request.nextUrl.searchParams.get("cycleId") ?? undefined,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el ranking.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  if (user.role !== "admin" && user.role !== "moderator")
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  try {
    const body = await request.json();
    if (body.action === "save-cycle")
      return NextResponse.json({
        success: true,
        ...(await upsertCycle(body.cycle)),
      });
    if (body.action === "update-candidate") {
      await updateCandidate(body.candidateId, body.update);
      return NextResponse.json({ success: true });
    }
    if (body.action === "finalize-suggestions")
      return NextResponse.json({
        success: true,
        ...(await finalizeSuggestions(body.cycleId)),
      });
    if (body.action === "publish-results")
      return NextResponse.json({
        success: true,
        ...(await publishResults(body.cycleId)),
      });
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo completar la acción.",
      },
      { status: 400 },
    );
  }
}
