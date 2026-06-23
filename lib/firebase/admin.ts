import 'server-only';
import admin, { ServiceAccount } from 'firebase-admin';

// Helper to format private key correctly (handle newline characters)
const formatPrivateKey = (key: string) => {
    return key.replace(/\\n/g, '\n');
};

function getAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        // In build time or if envs are missing, we might want to fail gracefully or throw
        // For safety in production, we throw.
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Missing Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
        }
        // Fallback for dev/build without creds (optional, but risky if logic depends on it)
        console.warn('Firebase Admin credentials missing. Admin SDK not initialized.');
        return undefined;
    }

    const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey: formatPrivateKey(privateKey),
    };

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
    });
}

const app = getAdminApp();

// Exports (check if app exists to avoid crashes if envs missing in dev)
export const adminAuth = app ? app.auth() : null;
export const adminDb = app ? app.firestore() : null;
