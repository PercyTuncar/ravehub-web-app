import 'server-only';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { User } from '@/lib/types';

// Cookie name for the session
const SESSION_COOKIE_NAME = 'session';

export async function verifySession() {
    const adminAuth = await getAdminAuth();

    if (!adminAuth) {
        console.error('Firebase Admin not initialized - check environment variables');
        console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
        // Return null instead of throwing to prevent 500 errors
        return null;
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
    const adminDb = await getAdminDb();

    if (!claims || !adminDb) {
        return null;
    }

    try {
        const userDoc = await adminDb.collection('users').doc(claims.uid).get();

        if (!userDoc.exists) {
            return null;
        }

        const userData = userDoc.data();
        return {
            id: userDoc.id,
            email: userData?.email || claims.email || '',
            name: userData?.name || claims.name || '',
            role: userData?.role || 'user',
            ...userData,
        } as User;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    return user;
}

export async function requireAdmin() {
    const adminAuth = await getAdminAuth();
    const adminDb = await getAdminDb();

    if (!adminAuth || !adminDb) {
        console.error('Firebase Admin not initialized - check environment variables');
        console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
        // Redirect to login with error message instead of throwing 500
        redirect('/login?error=server_config&redirect=/admin');
    }

    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/admin');
    }

    if (user.role !== 'admin' && user.role !== 'moderator') {
        // Redirect to home or unauthorized page
        redirect('/');
    }

    return user;
}

export async function createSessionCookie(idToken: string) {
    const adminAuth = await getAdminAuth();

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
