import 'server-only';
import { getAdminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// IMPORTANT: FieldValue and Timestamp MUST come from firebase-admin/firestore
// in v14+ to ensure compatibility with the Admin SDK

// Helper interface to match DocumentData
interface DocumentData {
    [key: string]: any;
}

export async function createAdminDocumentId(collection: string): Promise<string> {
    const db = await getAdminDb();
    if (!db) throw new Error('Firebase Admin DB not initialized');
    return db.collection(collection).doc().id;
}

export async function commitAdminBatch(
    operations: Array<{ collection: string; data: DocumentData; id?: string }>
): Promise<string[]> {
    const db = await getAdminDb();
    if (!db) throw new Error('Firebase Admin DB not initialized');

    const batch = db.batch();
    const ids: string[] = [];

    for (const operation of operations) {
        const ref = operation.id
            ? db.collection(operation.collection).doc(operation.id)
            : db.collection(operation.collection).doc();
        ids.push(ref.id);
        batch.set(ref, operation.data);
    }

    await batch.commit();
    return ids;
}
export async function commitTicketPurchaseWithInventory({
    eventId,
    phaseId,
    tickets,
    transactionId,
    transactionData,
    installments = [],
}: {
    eventId: string;
    phaseId: string;
    tickets: Array<{ zoneId: string; quantity: number }>;
    transactionId: string;
    transactionData: DocumentData;
    installments?: DocumentData[];
}): Promise<void> {
    const db = await getAdminDb();
    if (!db) throw new Error('Firebase Admin DB not initialized');

    await db.runTransaction(async (transaction: any) => {
        const eventRef = db.collection('events').doc(eventId);
        const eventSnapshot = await transaction.get(eventRef);
        if (!eventSnapshot.exists) throw new Error('Event not found or not available');

        const event = eventSnapshot.data() as DocumentData;
        if (event.eventStatus !== 'published') throw new Error('Event not found or not available');

        const phases = Array.isArray(event.salesPhases) ? event.salesPhases : [];
        const phaseIndex = phases.findIndex((phase: DocumentData) => phase.id === phaseId);
        if (phaseIndex === -1) throw new Error('Sales phase not found');

        const phase = phases[phaseIndex];
        const zonesPricing = Array.isArray(phase.zonesPricing) ? [...phase.zonesPricing] : [];
        const zones = Array.isArray(event.zones) ? event.zones : [];

        for (const ticket of tickets) {
            if (!Number.isInteger(ticket.quantity) || ticket.quantity <= 0) {
                throw new Error('Invalid ticket quantity');
            }

            const zoneIndex = zonesPricing.findIndex((zone: DocumentData) => zone.zoneId === ticket.zoneId);
            if (zoneIndex === -1) throw new Error(`Zone pricing not found for zone ${ticket.zoneId}`);

            const zonePricing = zonesPricing[zoneIndex];
            const zone = zones.find((item: DocumentData) => item.id === ticket.zoneId);
            const available = Number(zonePricing.available ?? zone?.capacity ?? 0);
            if (!Number.isFinite(available) || available < ticket.quantity) {
                throw new Error(`Insufficient availability for zone ${ticket.zoneId}`);
            }

            zonesPricing[zoneIndex] = {
                ...zonePricing,
                available: available - ticket.quantity,
                sold: Number(zonePricing.sold || 0) + ticket.quantity,
            };
        }

        const updatedPhases = [...phases];
        updatedPhases[phaseIndex] = { ...phase, zonesPricing };
        transaction.update(eventRef, { salesPhases: updatedPhases, updatedAt: new Date().toISOString() });

        transaction.set(db.collection('ticketTransactions').doc(transactionId), transactionData);
        for (const installment of installments) {
            transaction.set(db.collection('paymentInstallments').doc(), installment);
        }
    });
}

export class AdminFirestoreCollection<T extends DocumentData> {
    constructor(private collectionName: string) { }

    private async getDb() {
        const db = await getAdminDb();
        if (!db) throw new Error('Firebase Admin DB not initialized');
        return db;
    }

    private serializeTimestamps(data: DocumentData): DocumentData {
        const serialized: DocumentData = {};

        for (const [key, value] of Object.entries(data)) {
            if (value instanceof Timestamp) {
                serialized[key] = {
                    seconds: value.seconds,
                    nanoseconds: value.nanoseconds,
                };
            } else if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
                // Handle other timestamp-like objects
                const date = value.toDate();
                serialized[key] = {
                    seconds: Math.floor(date.getTime() / 1000),
                    nanoseconds: (date.getTime() % 1000) * 1000000
                };
            }
            else if (value && typeof value === 'object' && !Array.isArray(value)) {
                serialized[key] = this.serializeTimestamps(value);
            } else if (Array.isArray(value)) {
                serialized[key] = value.map(item =>
                    item instanceof Timestamp
                        ? { seconds: item.seconds, nanoseconds: item.nanoseconds }
                        : item && typeof item === 'object' && !Array.isArray(item)
                            ? this.serializeTimestamps(item)
                            : item
                );
            } else {
                serialized[key] = value;
            }
        }

        return serialized;
    }

    async get(id: string): Promise<T | null> {
        try {
            const db = await this.getDb();
            const docSnap = await db.collection(this.collectionName).doc(id).get();
            if (docSnap.exists) {
                const data = docSnap.data() as DocumentData;
                const serializedData = this.serializeTimestamps(data);
                return { id: docSnap.id, ...serializedData } as unknown as T;
            }
            return null;
        } catch (error) {
            console.error(`Array Admin: Error getting ${this.collectionName} document:`, error);
            throw error;
        }
    }

    async getAll(): Promise<T[]> {
        // WARNING: This method should be avoided - use query() with limits instead
        console.warn(`[Firestore Admin] getAll() called on ${this.collectionName} - consider using query() with limits`);
        try {
            const db = await this.getDb();
            const querySnapshot = await db.collection(this.collectionName).get();
            return querySnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                const data = doc.data();
                const serializedData = this.serializeTimestamps(data);
                return { id: doc.id, ...serializedData } as unknown as T;
            });
        } catch (error) {
            console.error(`Admin: Error getting all ${this.collectionName} documents:`, error);
            throw error;
        }
    }

    /**
     * Get document count without fetching all documents
     */
    async count(conditions: Array<{ field: string; operator: string; value: any }> = []): Promise<number> {
        try {
            const db = await this.getDb();
            let query: FirebaseFirestore.Query = db.collection(this.collectionName);

            conditions.forEach(({ field, operator, value }) => {
                query = query.where(field, operator as FirebaseFirestore.WhereFilterOp, value);
            });

            const querySnapshot = await query.get();
            return querySnapshot.size;
        } catch (error) {
            console.error(`Admin: Error counting ${this.collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Get multiple documents by their IDs in a single batch query
     * Much more efficient than multiple get() calls
     */
    async getByIds(ids: string[]): Promise<T[]> {
        if (ids.length === 0) return [];

        try {
            const db = await this.getDb();
            const results: T[] = [];
            // Firestore 'in' operator is limited to 30 values per query
            const batchSize = 30;

            for (let i = 0; i < ids.length; i += batchSize) {
                const batchIds = ids.slice(i, i + batchSize);
                const querySnapshot = await db.collection(this.collectionName)
                    .where('__name__', 'in', batchIds)
                    .get();
                
                querySnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                    const data = doc.data();
                    const serializedData = this.serializeTimestamps(data);
                    results.push({ id: doc.id, ...serializedData } as unknown as T);
                });
            }
            
            return results;
        } catch (error) {
            console.error(`Admin: Error getting ${this.collectionName} by IDs:`, error);
            throw error;
        }
    }

    async create(data: Omit<T, 'id'>): Promise<string> {
        try {
            const db = await this.getDb();
            const docRef = await db.collection(this.collectionName).add({
                ...data,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error(`Admin: Error creating ${this.collectionName} document:`, error);
            throw error;
        }
    }

    async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
        try {
            const db = await this.getDb();
            await db.collection(this.collectionName).doc(id).update({
                ...data,
                updatedAt: FieldValue.serverTimestamp(),
            });
        } catch (error) {
            console.error(`Admin: Error updating ${this.collectionName} document:`, error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const db = await this.getDb();
            await db.collection(this.collectionName).doc(id).delete();
        } catch (error) {
            console.error(`Admin: Error deleting ${this.collectionName} document:`, error);
            throw error;
        }
    }

    async query(conditions: Array<{ field: string; operator: string; value: any }>, orderByField?: string, orderDirection: 'asc' | 'desc' = 'desc', limitCount?: number): Promise<T[]> {
        try {
            const db = await this.getDb();
            let q: FirebaseFirestore.Query = db.collection(this.collectionName);

            conditions.forEach(({ field, operator, value }) => {
                // Map Firestore operators to Admin SDK operators if needed
                // Admin SDK uses strings like '==', '<', etc. which match client largely.
                q = q.where(field, operator as FirebaseFirestore.WhereFilterOp, value);
            });

            if (orderByField) {
                q = q.orderBy(orderByField, orderDirection);
            }

            if (limitCount) {
                q = q.limit(limitCount);
            }

            const querySnapshot = await q.get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                const serializedData = this.serializeTimestamps(data);
                return { id: doc.id, ...serializedData } as unknown as T;
            });
        } catch (error) {
            console.error(`Admin: Error querying ${this.collectionName}:`, error);
            throw error;
        }
    }
}

// Export instances mirroring collections.ts
export const blogCollection = new AdminFirestoreCollection('blog');
export const blogCategoriesCollection = new AdminFirestoreCollection('blogCategories');
export const blogTagsCollection = new AdminFirestoreCollection('blogTags');
export const blogCommentsCollection = new AdminFirestoreCollection('blogComments');
export const blogRatingsCollection = new AdminFirestoreCollection('blogRatings');
export const blogReactionsCollection = new AdminFirestoreCollection('blogReactions');
export const commentReactionsCollection = new AdminFirestoreCollection('commentReactions');

export const usersCollection = new AdminFirestoreCollection('users');
export const eventsCollection = new AdminFirestoreCollection('events');
export const eventDjsCollection = new AdminFirestoreCollection('eventDjs');
export const eventCTAsCollection = new AdminFirestoreCollection('eventCTAs');
export const ticketTransactionsCollection = new AdminFirestoreCollection('ticketTransactions');
export const paymentInstallmentsCollection = new AdminFirestoreCollection('paymentInstallments');
export const ordersCollection = new AdminFirestoreCollection('orders');
export const productsCollection = new AdminFirestoreCollection('products');
export const productCategoriesCollection = new AdminFirestoreCollection('productCategories');
export const productVariantsCollection = new AdminFirestoreCollection('productVariants');
export const productReviewsCollection = new AdminFirestoreCollection('productReviews');
export const storeBannersCollection = new AdminFirestoreCollection('storeBanners');
export const notificationsCollection = new AdminFirestoreCollection('notifications');
export const newsletterSubscribersCollection = new AdminFirestoreCollection('newsletter_subscribers');
export const newsletterFingerprintsCollection = new AdminFirestoreCollection('newsletter_fingerprints');
export const bioLinkEventsCollection = new AdminFirestoreCollection('bioLinkEvents');
export const configCollection = new AdminFirestoreCollection('config');
export const countriesCollection = new AdminFirestoreCollection('countries');
export const slugRedirectsCollection = new AdminFirestoreCollection('slugRedirects');
export const visitorProfilesCollection = new AdminFirestoreCollection('visitorProfiles');
export const djSuggestionsCollection = new AdminFirestoreCollection('djSuggestions');
export const djsCollection = new AdminFirestoreCollection('djs');
