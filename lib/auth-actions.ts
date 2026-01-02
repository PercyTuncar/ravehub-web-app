'use server';

import { createSessionCookie, clearSessionCookie } from '@/lib/auth-admin';
import { redirect } from 'next/navigation';

export async function loginAction(idToken: string) {
    const result = await createSessionCookie(idToken);
    if (result.success) {
        // Optionally redirect here or let client handle it
        return { success: true };
    }
    return { success: false, error: result.error };
}

export async function logoutAction() {
    await clearSessionCookie();
    return { success: true };
}
