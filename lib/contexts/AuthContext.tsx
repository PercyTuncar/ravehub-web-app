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
  fetchSignInMethodsForEmail,
  linkWithCredential,
  AuthCredential,
  OAuthCredential,
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
  updateProfilePicture: (file: Blob) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  completeAccountLinking: () => Promise<void>;
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
        // Sync session with server
        await syncSession(firebaseUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
        // Clear server session
        await clearSession();
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

      // Capture device info
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;
      const screenSize = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '';

      // Simple device detection for friendly name
      let deviceName = 'Unknown Device';
      if (/mobile/i.test(userAgent)) deviceName = 'Mobile';
      else if (/tablet/i.test(userAgent)) deviceName = 'Tablet';
      else deviceName = 'Desktop';

      // Browser detection
      let browserName = 'Unknown Browser';
      if (userAgent.indexOf("Chrome") > -1) browserName = "Chrome";
      else if (userAgent.indexOf("Safari") > -1) browserName = "Safari";
      else if (userAgent.indexOf("Firefox") > -1) browserName = "Firefox";

      const lastLoginDevice = `${deviceName} - ${browserName}`;

      await updateDoc(doc(db, 'users', result.user.uid), {
        lastLoginAt: serverTimestamp(),
        lastLoginInfo: {
          device: userAgent,
          browser: browserName,
          ip: '', // IP capture usually requires server-side
        },
        userAgent,
        platform,
        language,
        screenSize,
        lastLoginDevice,
        failedLoginAttempts: 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const syncSession = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const { loginAction } = await import('@/lib/auth-actions');
      await loginAction(idToken);
    } catch (error) {
      console.error('Error syncing session:', error);
    }
  };

  const clearSession = async () => {
    try {
      const { logoutAction } = await import('@/lib/auth-actions');
      await logoutAction();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const signUpWithEmail = async (email: string, password: string, userData: Partial<User>) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Capture device info
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;
      const screenSize = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '';

      // Simple device detection
      let deviceName = 'Desktop';
      if (/mobile/i.test(userAgent)) deviceName = 'Mobile';

      let browserName = 'Browser';
      if (userAgent.indexOf("Chrome") > -1) browserName = "Chrome";
      else if (userAgent.indexOf("Safari") > -1) browserName = "Safari";

      const lastLoginDevice = `${deviceName} - ${browserName}`;

      const userDoc = {
        ...userData,
        id: result.user.uid,
        email,
        authProvider: 'email',
        emailVerified: false,
        failedLoginAttempts: 0,
        isActive: true,

        // Device info
        userAgent,
        platform,
        language,
        screenSize,
        lastLoginDevice,
        lastLoginInfo: {
          device: userAgent,
          browser: browserName
        },
        lastLoginAt: serverTimestamp(), // Set initial login time

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

      // Capture device info
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;
      const screenSize = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '';

      let deviceName = 'Desktop';
      if (/mobile/i.test(userAgent)) deviceName = 'Mobile';
      let browserName = 'Browser';
      if (userAgent.indexOf("Chrome") > -1) browserName = "Chrome";
      else if (userAgent.indexOf("Safari") > -1) browserName = "Safari";

      const lastLoginDevice = `${deviceName} - ${browserName}`;

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

          // Device info
          userAgent,
          platform,
          language,
          screenSize,
          lastLoginDevice,
          lastLoginInfo: {
            device: userAgent,
            browser: browserName
          },
          lastLoginAt: serverTimestamp(),

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', result.user.uid), userData);
      } else {
        // Existing user - update login info
        await updateDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: serverTimestamp(),
          lastLoginInfo: {
            device: userAgent,
            browser: browserName,
          },
          userAgent,
          platform,
          language,
          screenSize,
          lastLoginDevice,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);

      // Handle account linking
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const pendingCredential = GoogleAuthProvider.credentialFromError(error);

        if (email && pendingCredential) {
          // Store credential temporarily
          sessionStorage.setItem('pendingLinkCredential', JSON.stringify(pendingCredential));
          sessionStorage.setItem('pendingLinkEmail', email);

          throw new Error('AUTH_LINK_REQUIRED');
        }
      }

      throw error;
    }
  };

  // Helper to complete linking after password login
  const completeAccountLinking = async () => {
    const pendingCredentialString = sessionStorage.getItem('pendingLinkCredential');
    if (!pendingCredentialString || !auth.currentUser) return;

    try {
      const pendingCredential = GoogleAuthProvider.credential(JSON.parse(pendingCredentialString));
      await linkWithCredential(auth.currentUser, pendingCredential);

      // Clear storage
      sessionStorage.removeItem('pendingLinkCredential');
      sessionStorage.removeItem('pendingLinkEmail');

      // Update user doc
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        authProvider: 'email+google',
        googleLinked: true,
        updatedAt: serverTimestamp(),
      });

      // Refresh user data
      await loadUserData(auth.currentUser.uid);

      console.log('Account linked successfully');
    } catch (error) {
      console.error('Error completing account linking:', error);
      throw error;
    }
  };

  const linkGoogleAccount = async () => {
    if (!firebaseUser) throw new Error('No user logged in');
    if (!firebaseUser.email) throw new Error('Current user has no email');

    try {
      const provider = new GoogleAuthProvider();
      // Force account selection to avoid auto-linking the wrong account if multiple are logged in
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await linkWithPopup(firebaseUser, provider);
      const linkedEmail = result.user.email;

      // STRICT VALIDATION: Check if the linked Google email matches the current account email
      if (linkedEmail !== firebaseUser.email) {
        // If they don't match, immediate security unlink
        await unlink(firebaseUser, provider.providerId);
        throw new Error('EMAIL_MISMATCH');
      }

      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        authProvider: 'email+google',
        googleLinked: true,
        googleUID: result.user.uid, // This might differ from firebase uid if it came from provider data, but usually result.user IS firebaseUser. 
        // Actually result.user is the User object which is the same as firebaseUser after linking.
        // To get the google specific ID we might look at providerData but simply marking it linked is enough.
        updatedAt: serverTimestamp(),
      });

      // Update local state
      await loadUserData(firebaseUser.uid);

    } catch (error: any) {
      console.error('Error linking Google account:', error);
      if (error.message === 'EMAIL_MISMATCH') {
        throw new Error('El correo de Google debe coincidir con tu correo actual.');
      }
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

  const updateProfilePicture = async (file: Blob) => {
    if (!firebaseUser) throw new Error('No user logged in');

    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase/config');

      // Create a reference to 'users/{uid}/profile.jpg'
      const storageRef = ref(storage, `users/${firebaseUser.uid}/profile.jpg`);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the URL
      const photoURL = await getDownloadURL(storageRef);

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { photoURL });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        photoURL,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setFirebaseUser({ ...firebaseUser, photoURL });
      setUser(prev => prev ? { ...prev, photoURL } : null);

    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseUser) throw new Error('No user logged in');
    if (!firebaseUser.email) throw new Error('User has no email');

    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');

      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // 2. Update Password
      await updatePassword(firebaseUser, newPassword);

    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('La contraseña actual es incorrecta.');
      }
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
    updateProfilePicture,
    updateUserPassword,
    completeAccountLinking,
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