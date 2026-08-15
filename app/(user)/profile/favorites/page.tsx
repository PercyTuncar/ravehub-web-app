'use client';

import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function FavoritesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h1 className="mb-2 text-2xl font-semibold">Inicia sesión para ver tus favoritos</h1>
            <p className="mb-6 text-muted-foreground">Guarda eventos para encontrarlos rápidamente aquí.</p>
            <Link href="/login"><Button>Iniciar sesión</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Eventos Favoritos</h1>
          <p className="text-muted-foreground">Los eventos que guardes aparecerán aquí.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">No tienes favoritos guardados</h2>
          <p className="mb-6 text-muted-foreground">
            La sincronización de favoritos aún no está disponible. No mostraremos eventos de ejemplo como si fueran tuyos.
          </p>
          <Link href="/eventos"><Button>Explorar eventos</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
