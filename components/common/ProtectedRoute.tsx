'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallbackPath?: string;
  redirectMessage?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  fallbackPath = '/login',
  redirectMessage
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Store current path for redirect after login
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterAuth', currentPath);
        
        if (redirectMessage) {
          // You could show a toast notification here
          console.log(redirectMessage);
        }
        
        router.push(fallbackPath);
      } else if (!requireAuth && user) {
        // User is logged in but trying to access public page (like login/register)
        const redirect = sessionStorage.getItem('redirectAfterAuth');
        if (redirect) {
          sessionStorage.removeItem('redirectAfterAuth');
          router.push(redirect);
        }
      }
    }
  }, [user, loading, requireAuth, fallbackPath, router, redirectMessage]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children if authentication check fails
  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}

// Hook for conditional authentication checks
export function useAuthGuard(requireAuth = true) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const checkAuth = (redirectMessage?: string) => {
    if (!loading && requireAuth && !user) {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterAuth', currentPath);
      
      if (redirectMessage) {
        console.log(redirectMessage);
      }
      
      router.push('/login');
      return false;
    }
    return true;
  };

  return { user, loading, checkAuth };
}