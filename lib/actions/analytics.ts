'use server';

import { bioLinkEventsCollection } from '@/lib/firebase/collections';
import { BioLinkEvent } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { headers } from 'next/headers';

export async function logBioEvent(
    eventType: BioLinkEvent['type'],
    metadata?: {
        targetId?: string;
        targetName?: string;
        country?: string;
    }
) {
    try {
        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || 'unknown';
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        // Note: x-forwarded-for can be multiple IPs.


        // Try to get country from headers (Vercel, Cloudflare, etc.)
        const countryFromHeader =
            headersList.get('x-vercel-ip-country') ||
            headersList.get('px-ip-country') ||
            headersList.get('cf-ipcountry') ||
            headersList.get('x-country');

        // Use header country if available, otherwise use metadata country, or fallback to 'Unknown'
        // If metadata country is explicitly provided (e.g. from client side geolocation), it takes precedence over unknown/null headers
        // But headers are usually more reliable for "real" origin if available.
        const country = countryFromHeader || metadata?.country;

        const newEvent: Omit<BioLinkEvent, 'id'> = {
            type: eventType,
            targetName: metadata?.targetName,
            country: country,
            userAgent,
            ip: Array.isArray(ip) ? ip[0] : ip.split(',')[0],
            timestamp: new Date() as any // Send as Date, collection handles serialization if needed, or it stores as Date. Firestore accepts Date.
        };

        console.log('📝 [ANALYTICS] Logging event:', JSON.stringify(newEvent, null, 2));

        // Using create method from FirestoreCollection
        const id = await bioLinkEventsCollection.create(newEvent as any);
        console.log('✅ [ANALYTICS] Event logged with ID:', id);

    } catch (error) {
        console.error('❌ [ANALYTICS] Failed to log bio event:', error);
        // We don't want to crash the UI tracking fails, so we swallow error but log it.
    }
}
