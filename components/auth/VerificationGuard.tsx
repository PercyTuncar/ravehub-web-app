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
            // We allow /verify-email obviously.
            const allowedPaths = ['/verify-email'];

            // If user is NOT verified
            if (!firebaseUser.emailVerified) {
                // And they are NOT on an allowed path
                if (!allowedPaths.includes(pathname)) {
                    // Redirect to verify email
                    router.push('/verify-email');
                }
            } else {
                // If user IS verified, they shouldn't be trapped on /verify-email if they reload
                // But maybe they want to see the success message. 
                // We will leave them there unless they navigate away.
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
    // Prevents content flash
    if (firebaseUser && !firebaseUser.emailVerified && pathname !== '/verify-email') {
        return null;
    }

    return <>{children}</>;
}
