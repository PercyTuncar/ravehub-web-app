import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-admin";
import { saveBallot } from "@/lib/top-djs/server";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { error: "Inicia sesión para votar." },
      { status: 401 },
    );
  if (user.isActive === false)
    return NextResponse.json(
      { error: "Tu cuenta no está activa." },
      { status: 403 },
    );
  if (user.emailVerified === false)
    return NextResponse.json(
      { error: "Verifica tu correo antes de participar." },
      { status: 403 },
    );
  try {
    const { cycleId, choices } = await request.json();
    const result = await saveBallot(
      user.id,
      cycleId,
      Array.isArray(choices) ? choices : [],
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar tu voto.",
      },
      { status: 400 },
    );
  }
}
