import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase.ts';
import type { UserProfile } from './types/index.ts';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<UserProfile | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;

    const userProfile: UserProfile = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Utilisateur',
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
    };

    // Store/merge user profile in Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, userProfile);
      }
    } catch (err) {
      console.warn('Could not sync user profile in Firestore:', err);
    }

    return userProfile;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out failed:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const profile: UserProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Utilisateur',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
      };
      callback(profile);
    } else {
      callback(null);
    }
  });
}
