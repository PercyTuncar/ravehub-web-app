import 'server-only';
import { adminDb } from './admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Helper interface to match DocumentData
interface DocumentData {
    [key: string]: any;
}

// Generic collection operations using Admin SDK
export class AdminFirestoreCollection<T extends DocumentData> {
    constructor(private collectionName: string) { }

    private get db() {
        if (!adminDb) throw new Error('Firebase Admin DB not initialized');
        return adminDb;
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
            const docSnap = await this.db.collection(this.collectionName).doc(id).get();
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
        try {
            const querySnapshot = await this.db.collection(this.collectionName).get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                const serializedData = this.serializeTimestamps(data);
                return { id: doc.id, ...serializedData } as unknown as T;
            });
        } catch (error) {
            console.error(`Admin: Error getting all ${this.collectionName} documents:`, error);
            throw error;
        }
    }

    async create(data: Omit<T, 'id'>): Promise<string> {
        try {
            const docRef = await this.db.collection(this.collectionName).add({
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
            await this.db.collection(this.collectionName).doc(id).update({
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
            await this.db.collection(this.collectionName).doc(id).delete();
        } catch (error) {
            console.error(`Admin: Error deleting ${this.collectionName} document:`, error);
            throw error;
        }
    }

    async query(conditions: Array<{ field: string; operator: string; value: any }>, orderByField?: string, orderDirection: 'asc' | 'desc' = 'desc', limitCount?: number): Promise<T[]> {
        try {
            let q: FirebaseFirestore.Query = this.db.collection(this.collectionName);

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
export const configCollection = new AdminFirestoreCollection('config');
export const countriesCollection = new AdminFirestoreCollection('countries');
export const slugRedirectsCollection = new AdminFirestoreCollection('slugRedirects');
export const visitorProfilesCollection = new AdminFirestoreCollection('visitorProfiles');
export const djSuggestionsCollection = new AdminFirestoreCollection('djSuggestions');
export const djsCollection = new AdminFirestoreCollection('djs');
