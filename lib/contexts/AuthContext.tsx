'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  unlink,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  unlinkGoogleAccount: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        await loadUserData(firebaseUser.uid);
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser({ ...userData, id: uid });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await updateDoc(doc(db, 'users', result.user.uid), {
        lastLoginAt: serverTimestamp(),
        lastLoginInfo: {
          device: navigator.userAgent,
          browser: navigator.userAgent,
        },
        failedLoginAttempts: 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, userData: Partial<User>) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userDoc = {
        ...userData,
        id: result.user.uid,
        email,
        authProvider: 'email',
        emailVerified: false,
        failedLoginAttempts: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', result.user.uid), userDoc);
      await sendEmailVerification(result.user);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        // New user - create profile
        const userData = {
          id: result.user.uid,
          email: result.user.email!,
          firstName: result.user.displayName?.split(' ')[0] || '',
          lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
          authProvider: 'google',
          googleLinked: true,
          emailVerified: true,
          photoURL: result.user.photoURL || '',
          failedLoginAttempts: 0,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', result.user.uid), userData);
      } else {
        // Existing user - update login info
        await updateDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const linkGoogleAccount = async () => {
    if (!firebaseUser) throw new Error('No user logged in');

    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(firebaseUser, provider);

      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        authProvider: 'email+google',
        googleLinked: true,
        googleUID: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error linking Google account:', error);
      throw error;
    }
  };

  const unlinkGoogleAccount = async () => {
    if (!firebaseUser) throw new Error('No user logged in');

    try {
      const provider = new GoogleAuthProvider();
      await unlink(firebaseUser, provider.providerId);

      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        authProvider: 'email',
        googleLinked: false,
        googleUID: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error unlinking Google account:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!firebaseUser) throw new Error('No user logged in');

    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      await loadUserData(firebaseUser.uid);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    linkGoogleAccount,
    unlinkGoogleAccount,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};