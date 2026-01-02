import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

// Generic collection operations
export class FirestoreCollection<T extends DocumentData> {
  constructor(private collectionName: string) { }

  private serializeTimestamps(data: DocumentData): DocumentData {
    const serialized: DocumentData = {};

    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'toDate' in value) {
        // Convert Firestore Timestamp to plain object
        serialized[key] = {
          seconds: value.seconds,
          nanoseconds: value.nanoseconds,
        };
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively serialize nested objects
        serialized[key] = this.serializeTimestamps(value);
      } else if (Array.isArray(value)) {
        // Handle arrays
        serialized[key] = value.map(item =>
          item && typeof item === 'object' && 'toDate' in item
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
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firestore Timestamps to plain objects for client components
        const serializedData = this.serializeTimestamps(data);
        return { id: docSnap.id, ...serializedData } as unknown as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting ${this.collectionName} document:`, error);
      throw error;
    }
  }

  async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const serializedData = this.serializeTimestamps(data);
        return { id: doc.id, ...serializedData } as unknown as T;
      });
    } catch (error) {
      console.error(`Error getting all ${this.collectionName} documents:`, error);
      throw error;
    }
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating ${this.collectionName} document:`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error updating ${this.collectionName} document:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      console.error(`Error deleting ${this.collectionName} document:`, error);
      throw error;
    }
  }

  async query(conditions: Array<{ field: string; operator: any; value: any }>, orderByField?: string, orderDirection: 'asc' | 'desc' = 'desc', limitCount?: number): Promise<T[]> {
    try {
      let q = query(collection(db, this.collectionName));

      conditions.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });

      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const serializedData = this.serializeTimestamps(data);
        return { id: doc.id, ...serializedData } as unknown as T;
      });
    } catch (error) {
      console.error(`Error querying ${this.collectionName}:`, error);
      throw error;
    }
  }

  async paginate(
    conditions: Array<{ field: string; operator: any; value: any }>,
    orderByField: string,
    orderDirection: 'asc' | 'desc' = 'desc',
    pageSize: number,
    startAfterDoc?: QueryDocumentSnapshot
  ): Promise<{ data: T[]; hasMore: boolean; lastDoc?: QueryDocumentSnapshot }> {
    try {
      let q = query(collection(db, this.collectionName), orderBy(orderByField, orderDirection), limit(pageSize + 1));

      conditions.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      const hasMore = docs.length > pageSize;
      const data = docs.slice(0, pageSize).map(doc => {
        const docData = doc.data();
        const serializedData = this.serializeTimestamps(docData);
        return { id: doc.id, ...serializedData } as unknown as T;
      });
      const lastDoc = docs.length > 0 ? docs[docs.length - 1] : undefined;

      return { data, hasMore, lastDoc };
    } catch (error) {
      console.error(`Error paginating ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Blog collections
export const blogCollection = new FirestoreCollection<import('@/lib/types').BlogPost>('blog');
export const blogCategoriesCollection = new FirestoreCollection<import('@/lib/types').BlogCategory>('blogCategories');
export const blogTagsCollection = new FirestoreCollection<import('@/lib/types').BlogTag>('blogTags');
export const blogCommentsCollection = new FirestoreCollection<import('@/lib/types').BlogComment>('blogComments');
export const blogRatingsCollection = new FirestoreCollection<import('@/lib/types').BlogRating>('blogRatings');
export const blogReactionsCollection = new FirestoreCollection<import('@/lib/types').BlogReaction>('blogReactions');
export const commentReactionsCollection = new FirestoreCollection('commentReactions');

// Other collections
export const usersCollection = new FirestoreCollection('users');
export const eventsCollection = new FirestoreCollection('events');
export const eventDjsCollection = new FirestoreCollection('eventDjs');
export const eventCTAsCollection = new FirestoreCollection('eventCTAs');
export const ticketTransactionsCollection = new FirestoreCollection('ticketTransactions');
export const paymentInstallmentsCollection = new FirestoreCollection('paymentInstallments');
export const ordersCollection = new FirestoreCollection('orders');
export const productsCollection = new FirestoreCollection('products');
export const productCategoriesCollection = new FirestoreCollection('productCategories');
export const productVariantsCollection = new FirestoreCollection('productVariants');
export const productReviewsCollection = new FirestoreCollection('productReviews');
export const storeBannersCollection = new FirestoreCollection('storeBanners');
export const notificationsCollection = new FirestoreCollection('notifications');
export const newsletterSubscribersCollection = new FirestoreCollection('newsletter_subscribers');
export const newsletterFingerprintsCollection = new FirestoreCollection('newsletter_fingerprints');
export const configCollection = new FirestoreCollection('config');
export const countriesCollection = new FirestoreCollection('countries');
export const slugRedirectsCollection = new FirestoreCollection('slugRedirects');
export const visitorProfilesCollection = new FirestoreCollection('visitorProfiles');
export const djSuggestionsCollection = new FirestoreCollection('djSuggestions');
export const djsCollection = new FirestoreCollection('djs');
export const bioLinkEventsCollection = new FirestoreCollection('bio_link_events');