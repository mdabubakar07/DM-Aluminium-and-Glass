import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
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

export type PendingOperation =
  | 'create'
  | 'update_details'
  | 'update_status'
  | 'update_payment'
  | 'soft_delete'
  | 'restore'
  | 'permanent_delete';

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
  _pending_operation?: PendingOperation;
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

function removeFromLocalSubmissions(id: string) {
  const items = readLocalSubmissions();
  writeLocalSubmissions(items.filter((item) => item.id !== id));
}

function withFirebaseTimeout<T>(
  request: Promise<T>,
  timeoutMs = 6000,
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

function markPendingOperation(id: string, operation: PendingOperation) {
  const items = readLocalSubmissions();
  const updated = items.map((item) =>
    item.id === id
      ? { ...item, _pending_sync: true, _pending_operation: operation }
      : item,
  );
  writeLocalSubmissions(updated);
}

function clearPendingFlag(id: string) {
  const items = readLocalSubmissions();
  const updated = items.map((item) =>
    item.id === id
      ? { ...item, _pending_sync: undefined, _pending_operation: undefined }
      : item,
  );
  writeLocalSubmissions(updated);
}

export async function saveCustomerLead(payload: {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
}): Promise<MutationResult> {
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
      return { persisted: true };
    } catch {
      markPendingOperation(entry.id, 'create');
      return { persisted: false };
    }
  }

  markPendingOperation(entry.id, 'create');
return { persisted: false };
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
        })) as SubmissionRecord[];

      const merged = mergePendingLocalIntoRemote(remote);
      return merged.filter((item) => !item.deleted_at);
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

  const localPendingDeleted = readLocalSubmissions().filter((item) => {
    const deletedAt = item.deleted_at;
    return (
      deletedAt &&
      now - new Date(deletedAt).getTime() <= recycleLimit
    );
  });

  if (db) {
    try {
      const q = query(
        collection(db, 'contact_submissions'),
        orderBy('created_at', 'desc'),
      );

      const snapshot = await withFirebaseTimeout(getDocs(q));

      const pendingRestoreIds = new Set(
        readLocalSubmissions()
          .filter(
            (item) =>
              item._pending_sync && item._pending_operation === 'restore',
          )
          .map((item) => item.id),
      );

      const remote = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter((item) => {
          const record = item as SubmissionRecord;
          const deletedAt = record.deleted_at;
          return (
            deletedAt &&
            !pendingRestoreIds.has(record.id) &&
            now - new Date(deletedAt).getTime() <= recycleLimit
          );
        }) as SubmissionRecord[];

      const remoteIds = new Set(remote.map((r) => r.id));
      const localOnly = localPendingDeleted.filter(
        (item) => !remoteIds.has(item.id),
      );

      return [...localOnly, ...remote];
    } catch {
      return localPendingDeleted;
    }
  }

  return localPendingDeleted;
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
          _pending_operation: 'update_status' as PendingOperation,
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
          _pending_operation: 'update_payment' as PendingOperation,
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
      ? {
          ...item,
          ...details,
          updated_at: updatedAt,
          _pending_sync: true,
          _pending_operation: 'update_details' as PendingOperation,
        }
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
      ? {
          ...item,
          deleted_at: deletedAt,
          updated_at: deletedAt,
          _pending_sync: true,
          _pending_operation: 'soft_delete' as PendingOperation,
        }
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
      ? {
          ...item,
          deleted_at: undefined,
          updated_at: updatedAt,
          _pending_sync: true,
          _pending_operation: 'restore' as PendingOperation,
        }
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

      removeFromLocalSubmissions(id);
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
          _pending_sync: true,
          _pending_operation: 'permanent_delete' as PendingOperation,
        }
      : item,
  );
  writeLocalSubmissions(updated);

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

let removedCount = 0;
let failedCount = 0;

for (const docSnap of expired) {
  try {
    await withFirebaseTimeout(
      deleteDoc(doc(db, 'contact_submissions', docSnap.id)),
    );
    removeFromLocalSubmissions(docSnap.id);
    removedCount++;
  } catch {
    failedCount++;
    markPendingOperation(docSnap.id, 'permanent_delete');
  }
}

return {
  removed: removedCount,
  persisted: failedCount === 0,
};
    } catch {
      void 0;
    }
  }
const items = readLocalSubmissions();

const updated = items.map((item) => {
  if (
    item.deleted_at &&
    new Date(item.deleted_at).getTime() <= cutoff
  ) {
    return {
      ...item,
      _pending_sync: true,
      _pending_operation: 'permanent_delete' as PendingOperation,
    };
  }

  return item;
});

writeLocalSubmissions(updated);

return { removed: 0, persisted: false };
}

export async function syncPendingOperations(): Promise<{ synced: number; remaining: number }> {
  if (!db) return { synced: 0, remaining: getPendingCount() };

  const items = readLocalSubmissions();
  const pending = items.filter(
    (item) => item._pending_sync && item._pending_operation,
  );

  if (pending.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;

  for (const item of pending) {
    const operation = item._pending_operation!;

    try {
      switch (operation) {
        case 'create': {
          const {
            _pending_sync: _ps,
            _pending_operation: _po,
            deleted_at: _da,
            ...writeRecord
          } = item;
          void _ps;
          void _po;
          void _da;
          await withFirebaseTimeout(
            setDoc(doc(db, 'contact_submissions', item.id), writeRecord),
          );
          break;
        }
        case 'update_details': {
          await withFirebaseTimeout(
            updateDoc(doc(db, 'contact_submissions', item.id), {
              name: item.name,
              email: item.email,
              phone: item.phone,
              project_type: item.project_type,
              message: item.message,
              updated_at: item.updated_at ?? new Date().toISOString(),
            }),
          );
          break;
        }
        case 'update_status': {
          await withFirebaseTimeout(
            updateDoc(doc(db, 'contact_submissions', item.id), {
              status: item.status,
              updated_at: item.updated_at ?? new Date().toISOString(),
              notification_status: 'sent',
            }),
          );
          break;
        }
        case 'update_payment': {
          await withFirebaseTimeout(
            updateDoc(doc(db, 'contact_submissions', item.id), {
              payment_status: item.payment_status ?? 'pending',
              updated_at: item.updated_at ?? new Date().toISOString(),
            }),
          );
          break;
        }
        case 'soft_delete': {
          await withFirebaseTimeout(
            updateDoc(doc(db, 'contact_submissions', item.id), {
              deleted_at: item.deleted_at ?? new Date().toISOString(),
              updated_at: item.updated_at ?? new Date().toISOString(),
            }),
          );
          break;
        }
        case 'restore': {
          await withFirebaseTimeout(
            updateDoc(doc(db, 'contact_submissions', item.id), {
              deleted_at: null,
              updated_at: item.updated_at ?? new Date().toISOString(),
            }),
          );
          break;
        }
        case 'permanent_delete': {
          await withFirebaseTimeout(
            deleteDoc(doc(db, 'contact_submissions', item.id)),
          );
          removeFromLocalSubmissions(item.id);
          break;
        }
        default:
          break;
      }

      if (operation !== 'permanent_delete') {
        clearPendingFlag(item.id);
      }
      synced++;
    } catch {
      // Leave pending for next retry cycle
    }
  }

  const remaining = getPendingCount();

  return { synced, remaining };
}

export function hasPendingOperations(): number {
  return readLocalSubmissions().filter((item) => item._pending_sync).length;
}

export function getPendingCount(): number {
  return readLocalSubmissions().filter((item) => item._pending_sync).length;
}

export function getPendingRecordIds(): Set<string> {
  return new Set(
    readLocalSubmissions()
      .filter((item) => item._pending_sync)
      .map((item) => item.id),
  );
}

function mergePendingLocalIntoRemote(remote: SubmissionRecord[]): SubmissionRecord[] {
  const local = readLocalSubmissions();
  const pending = local.filter((item) => item._pending_sync);

  if (pending.length === 0) return remote;

  const pendingMap = new Map(pending.map((p) => [p.id, p]));

  const merged = remote.map((r) => {
    const pendingItem = pendingMap.get(r.id);
    return pendingItem ? { ...r, ...pendingItem } : r;
  });

  const remoteIds = new Set(remote.map((r) => r.id));
  const notInRemote = pending.filter(
    (p) => !remoteIds.has(p.id) && !p.deleted_at,
  );

  return [...notInRemote, ...merged];
}

export async function firebaseSignIn(
  email: string,
  password: string,
  persist: boolean = true,
) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!auth) {
    return {
      error: 'Firebase Authentication is not configured.',
    };
  }

  try {
    await setPersistence(
      auth,
      persist ? browserLocalPersistence : browserSessionPersistence,
    );

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
