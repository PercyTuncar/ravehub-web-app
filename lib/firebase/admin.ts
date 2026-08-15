import 'server-only';

const formatPrivateKey = (key: string) => key.replace(/\\n/g, '\n');

let adminAppInstance: any = undefined;
let adminAuthInstance: any = undefined;
let adminDbInstance: any = undefined;
let appInitPromise: Promise<any> | null = null;
let authInitPromise: Promise<any> | null = null;
let dbInitPromise: Promise<any> | null = null;

function getCredentials() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('[Firebase Admin] Missing credentials:', {
            hasProjectId: !!projectId,
            hasClientEmail: !!clientEmail,
            hasPrivateKey: !!privateKey,
            environment: process.env.NODE_ENV,
        });
        return null;
    }

    return { projectId, clientEmail, privateKey: formatPrivateKey(privateKey) };
}

async function getAdminApp() {
    if (adminAppInstance !== undefined) {
        return adminAppInstance;
    }

    if (appInitPromise) {
        return appInitPromise;
    }

    appInitPromise = (async () => {
        const credentials = getCredentials();
        if (!credentials) {
            adminAppInstance = null;
            return null;
        }

        try {
            const { initializeApp, getApps, getApp, cert } = await import('firebase-admin/app');

            if (getApps().length > 0) {
                adminAppInstance = getApp();
            } else {
                adminAppInstance = initializeApp({
                    credential: cert(credentials),
                    projectId: credentials.projectId,
                });
            }

            return adminAppInstance;
        } catch (error) {
            console.error('[Firebase Admin] App initialization failed:', error);
            adminAppInstance = null;
            appInitPromise = null;
            throw error;
        }
    })();

    return appInitPromise;
}

export async function getAdminDb() {
    if (adminDbInstance !== undefined) {
        return adminDbInstance;
    }

    if (dbInitPromise) {
        return dbInitPromise;
    }

    dbInitPromise = (async () => {
        const app = await getAdminApp();
        if (!app) {
            adminDbInstance = null;
            return null;
        }

        try {
            // Keep this import separate from firebase-admin/auth. In production,
            // firebase-admin/auth currently pulls jwks-rsa -> jose ESM and can fail
            // under Vercel/Turbopack CommonJS externals. Firestore does not need Auth.
            const { getFirestore } = await import('firebase-admin/firestore');
            adminDbInstance = getFirestore(app);
            return adminDbInstance;
        } catch (error) {
            console.error('[Firebase Admin] Firestore initialization failed:', error);
            adminDbInstance = null;
            dbInitPromise = null;
            throw error;
        }
    })();

    return dbInitPromise;
}

export async function getAdminAuth() {
    if (adminAuthInstance !== undefined) {
        return adminAuthInstance;
    }

    if (authInitPromise) {
        return authInitPromise;
    }

    authInitPromise = (async () => {
        const app = await getAdminApp();
        if (!app) {
            adminAuthInstance = null;
            return null;
        }

        try {
            const { getAuth } = await import('firebase-admin/auth');
            adminAuthInstance = getAuth(app);
            return adminAuthInstance;
        } catch (error) {
            console.error('[Firebase Admin] Auth initialization failed:', error);
            adminAuthInstance = null;
            authInitPromise = null;
            throw error;
        }
    })();

    return authInitPromise;
}

// Deprecated exports kept only to avoid breaking old imports. Do not use them in new code.
export let adminAuth: any = null;
export let adminDb: any = null;
