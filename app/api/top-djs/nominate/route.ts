import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-admin";
import { createNomination } from "@/lib/top-djs/server";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { error: "Inicia sesión para sugerir un DJ." },
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
    const body = await request.json();
    const result = await createNomination(user.id, body);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo registrar la sugerencia.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Ya sugeriste") ? 409 : 400 },
    );
  }
}
