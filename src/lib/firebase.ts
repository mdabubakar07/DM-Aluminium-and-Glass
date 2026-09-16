import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseAuthSignOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export type SubmissionRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  project_type: string | null;
  message: string;
  status: string;
  payment_status?: 'done' | 'pending';
  deleted_at?: string | null;
  notification_status: string;
  created_at: string;
  updated_at?: string;
  _pending_sync?: boolean;
};

export type MutationResult = { persisted: boolean };

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim().length > 0,
);

let app: FirebaseApp | null = null;

if (hasFirebaseConfig) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseEnabled = !!app;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const ADMIN_EMAIL = 'dmaluminium01@gmail.com';

const LOCAL_SUBMISSIONS_KEY = 'dm-aluminium-contact-submissions';

export function readLocalSubmissions(): SubmissionRecord[] {
  if (typeof window === 'undefined') return [];

  const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as SubmissionRecord[];
  } catch {
    return [];
  }
}

function writeLocalSubmissions(items: SubmissionRecord[]) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(items));
}

function withFirebaseTimeout<T>(
  request: Promise<T>,
  timeoutMs = 1200,
): Promise<T> {
  return Promise.race([
    request,
    new Promise<T>((_, reject) => {
      window.setTimeout(
        () => reject(new Error('Firebase request timed out')),
        timeoutMs,
      );
    }),
  ]);
}

export async function saveCustomerLead(payload: {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
}) {
  const createdAt = new Date().toISOString();

  const entry: SubmissionRecord = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    project_type: payload.projectType || null,
    message: payload.message,
    status: 'new',
    payment_status: 'pending',
    notification_status: 'pending',
    created_at: createdAt,
    updated_at: createdAt,
  };

  const items = readLocalSubmissions();
  items.unshift(entry);
  writeLocalSubmissions(items);

  if (db) {
    try {
      await withFirebaseTimeout(
        setDoc(doc(db, 'contact_submissions', entry.id), entry),
      );
    } catch {
      const local = readLocalSubmissions();
      const marked = local.map((item) =>
        item.id === entry.id ? { ...item, _pending_sync: true } : item,
      );
      writeLocalSubmissions(marked);
    }
  }

  return entry;
}

export async function fetchCustomerLeads(): Promise<SubmissionRecord[]> {
  if (db) {
    try {
      const q = query(
        collection(db, 'contact_submissions'),
        orderBy('created_at', 'desc'),
      );

      const snapshot = await withFirebaseTimeout(getDocs(q));

      const remote = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter(
          (item) => !(item as SubmissionRecord).deleted_at,
        ) as SubmissionRecord[];

      mergePendingLocalIntoRemote(remote);

      return remote;
    } catch {
      return readLocalSubmissions().filter(
        (item) => !item.deleted_at,
      );
    }
  }

  return readLocalSubmissions().filter(
    (item) => !item.deleted_at,
  );
}

export async function fetchDeletedCustomerLeads(): Promise<SubmissionRecord[]> {
  const now = Date.now();
  const recycleLimit = 30 * 24 * 60 * 60 * 1000;

  if (db) {
    try {
      const q = query(
        collection(db, 'contact_submissions'),
        orderBy('created_at', 'desc'),
      );

      const snapshot = await withFirebaseTimeout(getDocs(q));

      return snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter((item) => {
          const deletedAt = (item as SubmissionRecord).deleted_at;

          return (
            deletedAt &&
            now - new Date(deletedAt).getTime() <= recycleLimit
          );
        }) as SubmissionRecord[];
    } catch {
      return readLocalSubmissions().filter((item) => {
        const deletedAt = item.deleted_at;

        return (
          deletedAt &&
          now - new Date(deletedAt).getTime() <= recycleLimit
        );
      });
    }
  }

  return readLocalSubmissions().filter((item) => {
    const deletedAt = item.deleted_at;

    return (
      deletedAt &&
      now - new Date(deletedAt).getTime() <= recycleLimit
    );
  });
}

export async function updateCustomerLeadStatus(
  id: string,
  status: string,
): Promise<MutationResult> {
  const updatedAt = new Date().toISOString();

  if (db) {
    try {
      await withFirebaseTimeout(
        updateDoc(doc(db, 'contact_submissions', id), {
          status,
          updated_at: updatedAt,
          notification_status: 'sent',
        }),
      );

      clearPendingFlag(id);
      return { persisted: true };
    } catch {
      void 0;
    }
  }

  const items = readLocalSubmissions();
  const updated = items.map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          updated_at: updatedAt,
          notification_status: 'sent',
          _pending_sync: true,
        }
      : item,
  );
  writeLocalSubmissions(updated);

  return { persisted: false };
}

export async function updateCustomerLeadPaymentStatus(
  id: string,
  paymentStatus: 'done' | 'pending',
): Promise<MutationResult> {
  const updatedAt = new Date().toISOString();

  if (db) {
    try {
      await withFirebaseTimeout(
        updateDoc(doc(db, 'contact_submissions', id), {
          payment_status: paymentStatus,
          updated_at: updatedAt,
        }),
      );

      clearPendingFlag(id);
      return { persisted: true };
    } catch {
      void 0;
    }
  }

  const items = readLocalSubmissions();
  const updated = items.map((item) =>
    item.id === id
      ? {
          ...item,
          payment_status: paymentStatus,
          updated_at: updatedAt,
          _pending_sync: true,
        }
      : item,
  );
  writeLocalSubmissions(updated);

  return { persisted: false };
}

export async function updateCustomerLeadDetails(
  id: string,
  details: {
    name: string;
    email: string;
    phone: string | null;
    project_type: string | null;
    message: string;
  },
): Promise<MutationResult> {
  const updatedAt = new Date().toISOString();

  if (db) {
    try {
      await withFirebaseTimeout(
        updateDoc(doc(db, 'contact_submissions', id), {
          ...details,
          updated_at: updatedAt,
        }),
      );

      clearPendingFlag(id);
      return { persisted: true };
    } catch {
      void 0;
    }
  }

  const items = readLocalSubmissions();
  const updated = items.map((item) =>
    item.id === id
      ? { ...item, ...details, updated_at: updatedAt, _pending_sync: true }
      : item,
  );
  writeLocalSubmissions(updated);

  return { persisted: false };
}

export async function deleteCustomerLead(id: string): Promise<MutationResult> {
  const deletedAt = new Date().toISOString();

  if (db) {
    try {
      await withFirebaseTimeout(
        updateDoc(
          doc(db, 'contact_submissions', id),
          {
            deleted_at: deletedAt,
            updated_at: deletedAt,
          },
        ),
      );

      clearPendingFlag(id);
      return { persisted: true };
    } catch {
      void 0;
    }
  }

  const items = readLocalSubmissions();
  const updated = items.map((item) =>
    item.id === id
      ? { ...item, deleted_at: deletedAt, updated_at: deletedAt, _pending_sync: true }
      : item,
  );
  writeLocalSubmissions(updated);

  return { persisted: false };
}

export async function restoreCustomerLead(id: string): Promise<MutationResult> {
  const updatedAt = new Date().toISOString();

  if (db) {
    try {
      await withFirebaseTimeout(
        updateDoc(
          doc(db, 'contact_submissions', id),
          {
            deleted_at: null,
            updated_at: updatedAt,
          },
        ),
      );

      clearPendingFlag(id);
      return { persisted: true };
    } catch {
      void 0;
    }
  }

  const items = readLocalSubmissions();
  const updated = items.map((item) =>
    item.id === id
      ? { ...item, deleted_at: undefined, updated_at: updatedAt, _pending_sync: true }
      : item,
  );
  writeLocalSubmissions(updated);

  return { persisted: false };
}

export async function permanentlyDeleteCustomerLead(id: string): Promise<MutationResult> {
  if (db) {
    try {
      await withFirebaseTimeout(
        deleteDoc(doc(db, 'contact_submissions', id)),
      );

      clearPendingFlag(id);
      return { persisted: true };
    } catch {
      void 0;
    }
  }

  const items = readLocalSubmissions();
  writeLocalSubmissions(items.filter((item) => item.id !== id));

  return { persisted: false };
}

export async function purgeOldDeletedCustomerLeads(
  maxAgeDays: number,
): Promise<{ removed: number; persisted: boolean }> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  if (db) {
    try {
      const snapshot = await withFirebaseTimeout(
        getDocs(query(collection(db, 'contact_submissions'))),
      );

      const expired = snapshot.docs.filter((docSnap) => {
        const data = docSnap.data() as Partial<SubmissionRecord>;
        const deletedAt = data.deleted_at;

        return (
          !!deletedAt &&
          new Date(deletedAt).getTime() <= cutoff
        );
      });

      await Promise.all(
        expired.map((docSnap) =>
          withFirebaseTimeout(
            deleteDoc(doc(db, 'contact_submissions', docSnap.id)),
          ),
        ),
      );

      return { removed: expired.length, persisted: true };
    } catch {
      void 0;
    }
  }

  const items = readLocalSubmissions();
  const remaining = items.filter((item) => {
    if (!item.deleted_at) return true;
    return new Date(item.deleted_at).getTime() > cutoff;
  });
  const removed = items.length - remaining.length;
  writeLocalSubmissions(remaining);

  return { removed, persisted: false };
}

export async function syncPendingOperations(): Promise<{ synced: number; remaining: number }> {
  if (!db) return { synced: 0, remaining: 0 };

  const items = readLocalSubmissions();
  const pending = items.filter((item) => item._pending_sync);

  if (pending.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;

  for (const item of pending) {
    try {
      const { _pending_sync, ...cleanRecord } = item;
      void _pending_sync;

      if (item.deleted_at === undefined && !items.find((x) => x.id === item.id && x.deleted_at)) {
        const localCheck = readLocalSubmissions();
        const stillExists = localCheck.find((x) => x.id === item.id);
        if (!stillExists || stillExists.deleted_at) continue;

        await withFirebaseTimeout(
          setDoc(doc(db, 'contact_submissions', item.id), cleanRecord),
        );
      } else if (item.deleted_at) {
        await withFirebaseTimeout(
          updateDoc(doc(db, 'contact_submissions', item.id), {
            deleted_at: item.deleted_at,
            updated_at: item.updated_at ?? new Date().toISOString(),
          }),
        );
      } else {
        await withFirebaseTimeout(
          setDoc(doc(db, 'contact_submissions', item.id), cleanRecord, { merge: true }),
        );
      }

      clearPendingFlag(item.id);
      synced++;
    } catch {
      void 0;
    }
  }

  const remaining = readLocalSubmissions().filter((item) => item._pending_sync).length;

  return { synced, remaining };
}

export function hasPendingOperations(): boolean {
  return readLocalSubmissions().some((item) => item._pending_sync);
}

function clearPendingFlag(id: string) {
  const items = readLocalSubmissions();
  const updated = items.map((item) =>
    item.id === id
      ? { ...item, _pending_sync: undefined }
      : item,
  );
  writeLocalSubmissions(updated);
}

function mergePendingLocalIntoRemote(remote: SubmissionRecord[]): void {
  const local = readLocalSubmissions();
  const pending = local.filter((item) => item._pending_sync);

  if (pending.length === 0) return;

  for (const pendingItem of pending) {
    const remoteIndex = remote.findIndex((r) => r.id === pendingItem.id);
    if (remoteIndex >= 0) {
      remote[remoteIndex] = { ...remote[remoteIndex], ...pendingItem };
    } else if (!pendingItem.deleted_at) {
      remote.unshift(pendingItem);
    }
  }
}

export async function firebaseSignIn(
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!auth) {
    return {
      error: 'Firebase Authentication is not configured.',
    };
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );

    if (credential.user.email !== ADMIN_EMAIL) {
      await firebaseAuthSignOut(auth);
      return { error: 'Access denied. This account is not authorized for admin access.' };
    }

    return { error: null };
  } catch {
    return {
      error: 'Unable to sign in. Please check your credentials.',
    };
  }
}

export async function firebaseResetPassword(
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!auth) {
    return {
      error: 'Firebase Authentication is not configured.',
    };
  }

  try {
    await sendPasswordResetEmail(auth, normalizedEmail);
    return { error: null };
  } catch {
    return {
      error: 'Unable to send reset email. Please try again.',
    };
  }
}

export async function firebaseSignOut(): Promise<void> {
  if (auth) {
    await firebaseAuthSignOut(auth);
  }
}

export function getCurrentUser(): User | null {
  return auth?.currentUser ?? null;
}
