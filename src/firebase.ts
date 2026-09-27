import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { Supplier } from './types/index.ts';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Critical Constraint: Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

import { WORLDWIDE_SUPPLIERS } from './data/countries.ts';

export const DEFAULT_SUPPLIERS: Supplier[] = WORLDWIDE_SUPPLIERS;

export async function seedDemoSuppliersIfEmpty(): Promise<Supplier[]> {
  const suppliersPath = 'suppliers';
  try {
    const snap = await getDocs(collection(db, suppliersPath));
    if (snap.empty) {
      for (const sup of WORLDWIDE_SUPPLIERS) {
        await setDoc(doc(db, suppliersPath, sup.id), sup);
      }
      return WORLDWIDE_SUPPLIERS;
    }
    const list = snap.docs.map(d => d.data() as Supplier);
    return list.length > 0 ? list : WORLDWIDE_SUPPLIERS;
  } catch (error) {
    console.warn('Seeding fallback to worldwide suppliers:', error);
    return WORLDWIDE_SUPPLIERS;
  }
}
