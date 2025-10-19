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
  constructor(private collectionName: string) {}

  async get(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as unknown as T;
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
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
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
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
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
      const data = docs.slice(0, pageSize).map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
      const lastDoc = docs.length > 0 ? docs[docs.length - 1] : undefined;

      return { data, hasMore, lastDoc };
    } catch (error) {
      console.error(`Error paginating ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Blog collections
export const blogCollection = new FirestoreCollection('blog');
export const blogCategoriesCollection = new FirestoreCollection('blogCategories');
export const blogTagsCollection = new FirestoreCollection('blogTags');
export const blogCommentsCollection = new FirestoreCollection('blogComments');
export const blogRatingsCollection = new FirestoreCollection('blogRatings');
export const blogReactionsCollection = new FirestoreCollection('blogReactions');
export const commentReactionsCollection = new FirestoreCollection('commentReactions');

// Other collections
export const usersCollection = new FirestoreCollection('users');
export const eventsCollection = new FirestoreCollection('events');
export const configCollection = new FirestoreCollection('config');
export const countriesCollection = new FirestoreCollection('countries');
export const slugRedirectsCollection = new FirestoreCollection('slugRedirects');