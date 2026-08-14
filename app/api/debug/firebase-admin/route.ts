import { NextResponse } from 'next/server';

// Force dynamic to ensure this runs on every request
export const dynamic = 'force-dynamic';

export async function GET() {
    const logs: string[] = [];

    try {
        logs.push('Starting Firebase Admin initialization check...');

        const checks = {
            hasProjectId: !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID),
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
            environment: process.env.NODE_ENV,
        };

        logs.push(`Env checks: ${JSON.stringify(checks)}`);

        // Dynamic import to trigger initialization
        logs.push('Importing admin module...');
        const { getAdminDb, getAdminAuth } = await import('@/lib/firebase/admin');

        logs.push('Calling getAdminDb()...');
        const db = await getAdminDb();
        logs.push(`getAdminDb() returned: ${!!db}`);

        logs.push('Calling getAdminAuth()...');
        const auth = await getAdminAuth();
        logs.push(`getAdminAuth() returned: ${!!auth}`);

        return NextResponse.json({
            success: true,
            checks,
            dbInitialized: !!db,
            authInitialized: !!auth,
            logs,
        });
    } catch (error: any) {
        logs.push(`ERROR: ${error.message}`);
        logs.push(`Stack: ${error.stack}`);

        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            checks: {
                hasProjectId: !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID),
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
                privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
                environment: process.env.NODE_ENV,
            },
            logs,
        }, { status: 500 });
    }
}
