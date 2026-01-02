import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { User } from '@/lib/types';

// Cookie name for the session
const SESSION_COOKIE_NAME = 'session';

export async function verifySession() {
    if (!adminAuth) {
        throw new Error('Firebase Admin not initialized');
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedClaims;
    } catch (error) {
        // Session invalid or expired
        return null;
    }
}

export async function getCurrentUser(): Promise<User | null> {
    const claims = await verifySession();

    if (!claims || !adminDb) {
        return null;
    }

    try {
        const userDoc = await adminDb.collection('users').doc(claims.uid).get();
        if (!userDoc.exists) {
            return null;
        }

        // We need to match the User type from @/lib/types
        // Assuming the DB structure matches the type
        const userData = userDoc.data();
        return {
            id: userDoc.id,
            ...userData
        } as User;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/auth/login');
    }
    return user;
}

export async function requireAdmin() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/admin/login');
    }

    if (user.role !== 'admin' && user.role !== 'moderator') {
        // Redirect to home or unauthorized page
        redirect('/');
    }

    return user;
}

export async function createSessionCookie(idToken: string) {
    if (!adminAuth) throw new Error('Firebase Admin not initialized');

    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    try {
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        const cookieStore = await cookies();

        cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return { success: true };
    } catch (error) {
        console.error('Error creating session cookie:', error);
        return { success: false, error: 'Failed to create session' };
    }
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
