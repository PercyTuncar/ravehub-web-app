import 'server-only';

// Helper to format private key correctly (handle newline characters)
const formatPrivateKey = (key: string) => {
    return key.replace(/\\n/g, '\n');
};

let adminAppInstance: any = undefined;
let adminAuthInstance: any = null;
let adminDbInstance: any = null;

async function initializeFirebaseAdmin() {
    if (adminAppInstance !== undefined) {
        return { app: adminAppInstance, auth: adminAuthInstance, db: adminDbInstance };
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('Firebase Admin credentials missing in production build. Admin features will be disabled.');
            adminAppInstance = null;
            return { app: null, auth: null, db: null };
        }
        console.warn('Firebase Admin credentials missing. Admin SDK not initialized.');
        adminAppInstance = null;
        return { app: null, auth: null, db: null };
    }

    try {
        // Dynamic import to avoid ESM issues with Turbopack
        const { initializeApp, getApps, getApp, cert } = await import('firebase-admin/app');
        const { getAuth } = await import('firebase-admin/auth');
        const { getFirestore } = await import('firebase-admin/firestore');

        if (getApps().length > 0) {
            adminAppInstance = getApp();
        } else {
            const serviceAccount = {
                projectId,
                clientEmail,
                privateKey: formatPrivateKey(privateKey),
            };

            adminAppInstance = initializeApp({
                credential: cert(serviceAccount),
                projectId,
            });
        }

        adminAuthInstance = getAuth(adminAppInstance);
        adminDbInstance = getFirestore(adminAppInstance);

        return { app: adminAppInstance, auth: adminAuthInstance, db: adminDbInstance };
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        if (process.env.NODE_ENV === 'production') {
            console.warn('Firebase Admin initialization failed during build. Admin features will be disabled.');
            adminAppInstance = null;
            return { app: null, auth: null, db: null };
        }
        throw error;
    }
}

// Lazy getters that initialize on first access
export const getAdminAuth = async () => {
    const { auth } = await initializeFirebaseAdmin();
    return auth;
};

export const getAdminDb = async () => {
    const { db } = await initializeFirebaseAdmin();
    return db;
};

// Backward compatibility exports (deprecated - use getAdminAuth/getAdminDb instead)
export let adminAuth: any = null;
export let adminDb: any = null;
