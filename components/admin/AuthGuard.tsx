'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'moderator';
}

export function AuthGuard({ children, requiredRole = 'admin' }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        // Wait a bit for session to sync
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log('[AdminAuthGuard] User:', user);
        console.log('[AdminAuthGuard] User role:', user?.role);
        console.log('[AdminAuthGuard] Loading:', loading);

        if (!user) {
          console.log('[AdminAuthGuard] No user, redirecting to login');
          // Redirect to login with admin redirect
          router.push('/login?redirect=/admin');
          return;
        }

        if (!['admin', 'moderator'].includes(user.role)) {
          console.log('[AdminAuthGuard] User is not admin/moderator, redirecting to home');
          // Not authorized, redirect to home
          router.push('/');
          return;
        }

        if (requiredRole === 'admin' && user.role !== 'admin') {
          console.log('[AdminAuthGuard] User needs admin role, redirecting to /admin');
          // Need admin role but only have moderator
          router.push('/admin');
          return;
        }

        console.log('[AdminAuthGuard] User authorized, allowing access');
        setChecking(false);
      }
    };

    checkAuth();
  }, [user, loading, router, requiredRole]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-white/70 text-sm font-medium">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  if (!user || !['admin', 'moderator'].includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}