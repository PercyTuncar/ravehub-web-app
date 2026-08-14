import 'server-only';

// Helper to format private key correctly (handle newline characters)
const formatPrivateKey = (key: string) => {
    return key.replace(/\\n/g, '\n');
};

let adminAppInstance: any = undefined;
let adminAuthInstance: any = null;
let adminDbInstance: any = null;
let initPromise: Promise<any> | null = null;

async function initializeFirebaseAdmin() {
    // Return cached instance if already initialized
    if (adminAppInstance !== undefined) {
        console.log('[Firebase Admin] Returning cached instance');
        return { app: adminAppInstance, auth: adminAuthInstance, db: adminDbInstance };
    }

    // Return existing promise if initialization is in progress
    if (initPromise) {
        console.log('[Firebase Admin] Initialization already in progress, waiting...');
        return initPromise;
    }

    console.log('[Firebase Admin] Starting initialization...');

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('[Firebase Admin] Initializing with:', {
        hasProjectId: !!projectId,
        projectId: projectId?.substring(0, 20) + '...',
        hasClientEmail: !!clientEmail,
        clientEmail: clientEmail?.substring(0, 30) + '...',
        hasPrivateKey: !!privateKey,
        privateKeyLength: privateKey?.length || 0,
        privateKeyStart: privateKey?.substring(0, 50) + '...',
        environment: process.env.NODE_ENV
    });

    if (!projectId || !clientEmail || !privateKey) {
        console.error('[Firebase Admin] Missing credentials!');
        adminAppInstance = null;
        return { app: null, auth: null, db: null };
    }

    // Create initialization promise
    initPromise = (async () => {
        try {
            console.log('[Firebase Admin] Importing firebase-admin modules...');
            // Dynamic import to avoid ESM issues with Turbopack
            const { initializeApp, getApps, getApp, cert } = await import('firebase-admin/app');
            const { getAuth } = await import('firebase-admin/auth');
            const { getFirestore } = await import('firebase-admin/firestore');

            console.log('[Firebase Admin] Checking existing apps...');
            const existingApps = getApps();
            console.log('[Firebase Admin] Existing apps count:', existingApps.length);

            if (existingApps.length > 0) {
                console.log('[Firebase Admin] Using existing app');
                adminAppInstance = getApp();
            } else {
                console.log('[Firebase Admin] Creating new app...');
                const formattedKey = formatPrivateKey(privateKey);

                const serviceAccount = {
                    projectId,
                    clientEmail,
                    privateKey: formattedKey,
                };

                console.log('[Firebase Admin] Service account prepared, initializing app...');
                adminAppInstance = initializeApp({
                    credential: cert(serviceAccount),
                    projectId,
                });
                console.log('[Firebase Admin] App initialized successfully');
            }

            console.log('[Firebase Admin] Getting Auth instance...');
            adminAuthInstance = getAuth(adminAppInstance);
            console.log('[Firebase Admin] Auth instance obtained:', !!adminAuthInstance);

            console.log('[Firebase Admin] Getting Firestore instance...');
            adminDbInstance = getFirestore(adminAppInstance);
            console.log('[Firebase Admin] Firestore instance obtained:', !!adminDbInstance);

            console.log('[Firebase Admin] Successfully initialized:', {
                hasApp: !!adminAppInstance,
                hasAuth: !!adminAuthInstance,
                hasDb: !!adminDbInstance
            });

            return { app: adminAppInstance, auth: adminAuthInstance, db: adminDbInstance };
        } catch (error) {
            console.error('[Firebase Admin] Failed to initialize:', error);
            adminAppInstance = null;
            initPromise = null; // Reset promise to allow retry
            throw error;
        }
    })();

    return initPromise;
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

// Deprecated exports - kept for backward compatibility but should migrate to getAdminAuth/getAdminDb
export let adminAuth: any = null;
export let adminDb: any = null;
