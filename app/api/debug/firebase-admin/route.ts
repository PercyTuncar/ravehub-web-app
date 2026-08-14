import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';

export async function GET() {
    try {
        const checks = {
            hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !!process.env.FIREBASE_PROJECT_ID,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
            environment: process.env.NODE_ENV,
        };

        // Try to initialize
        const db = await getAdminDb();
        const auth = await getAdminAuth();

        return NextResponse.json({
            success: true,
            checks,
            dbInitialized: !!db,
            authInitialized: !!auth,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            checks: {
                hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !!process.env.FIREBASE_PROJECT_ID,
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
                privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
                environment: process.env.NODE_ENV,
            }
        }, { status: 500 });
    }
}
