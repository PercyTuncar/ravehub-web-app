import 'server-only';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { User } from '@/lib/types';

// Cookie name for the session
const SESSION_COOKIE_NAME = 'session';

export async function verifySession() {
    let adminAuth: any = null;

    try {
        adminAuth = await getAdminAuth();
    } catch (error) {
        console.error('Firebase Admin Auth initialization failed:', error);
        return null;
    }

    if (!adminAuth) {
        console.error('Firebase Admin Auth not initialized - check environment variables');
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
    let adminDb: any = null;

    try {
        adminDb = await getAdminDb();
    } catch (error) {
        console.error('Firebase Admin Firestore initialization failed while getting current user:', error);
        return null;
    }

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
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/admin');
    }

    if (user.role !== 'admin' && user.role !== 'moderator') {
        redirect('/');
    }

    return user;
}

export async function createSessionCookie(idToken: string) {
    let adminAuth: any = null;

    try {
        adminAuth = await getAdminAuth();
    } catch (error) {
        console.error('Firebase Admin Auth initialization failed while creating session:', error);
        return { success: false, error: 'Failed to initialize auth session' };
    }

    if (!adminAuth) {
        return { success: false, error: 'Firebase Admin Auth not initialized' };
    }

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
