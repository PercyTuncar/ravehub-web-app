'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function VerificationGuard({ children }: { children: React.ReactNode }) {
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!loading && firebaseUser) {
            // List of paths allowed for unverified users
            const allowedPaths = [
                '/verify-email',
                '/login',
                '/register',
                '/forgot-password',
                '/admin',
            ];

            // Allow paths that start with these prefixes
            const allowedPrefixes = [
                '/profile',      // Allow all profile routes
                '/admin/',
                '/api/',
            ];

            // Check if current path is allowed
            const isAllowedPath = allowedPaths.includes(pathname) ||
                allowedPrefixes.some(prefix => pathname.startsWith(prefix));

            // If user is NOT verified
            if (!firebaseUser.emailVerified) {
                // And they are NOT on an allowed path
                if (!isAllowedPath) {
                    // Redirect to verify email
                    router.push('/verify-email');
                }
            }
        }
    }, [firebaseUser, loading, pathname, router]);

    // While loading auth state, show a loading spinner or nothing to prevent flash
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#141618]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // If unverified and not on allowed path, render nothing (while redirecting)
    const allowedPaths = ['/verify-email', '/login', '/register', '/forgot-password', '/admin'];
    const allowedPrefixes = ['/profile', '/admin/', '/api/'];
    const isAllowedPath = allowedPaths.includes(pathname) ||
        allowedPrefixes.some(prefix => pathname.startsWith(prefix));

    if (firebaseUser && !firebaseUser.emailVerified && !isAllowedPath) {
        return null;
    }

    return <>{children}</>;
}
