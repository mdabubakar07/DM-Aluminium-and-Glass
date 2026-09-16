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
  deleted_at?: string;
  notification_status: string;
  created_at: string;
  updated_at?: string;
};

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
    void setDoc(
      doc(db, 'contact_submissions', entry.id),
      entry,
    ).catch(() => undefined);
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

      return snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .filter(
          (item) => !(item as SubmissionRecord).deleted_at,
        ) as SubmissionRecord[];
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
) {
  if (db) {
    try {
      const ref = doc(db, 'contact_submissions', id);

      await withFirebaseTimeout(
        updateDoc(ref, {
          status,
          updated_at: new Date().toISOString(),
          notification_status: 'sent',
        }),
      );

      return true;
    } catch (error) {
      void error;
    }
  }

  const items = readLocalSubmissions();

  const updated = items.map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          updated_at: new Date().toISOString(),
          notification_status: 'sent',
        }
      : item,
  );

  writeLocalSubmissions(updated);

  return true;
}

export async function updateCustomerLeadPaymentStatus(
  id: string,
  paymentStatus: 'done' | 'pending',
) {
  if (db) {
    try {
      const ref = doc(db, 'contact_submissions', id);

      await withFirebaseTimeout(
        updateDoc(ref, {
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        }),
      );

      return true;
    } catch (error) {
      void error;
    }
  }

  const items = readLocalSubmissions();

  const updated = items.map((item) =>
    item.id === id
      ? {
          ...item,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        }
      : item,
  );

  writeLocalSubmissions(updated);

  return true;
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
) {
  const updatedAt = new Date().toISOString();

  if (!db) {
    return false;
  }

  try {
    const ref = doc(db, 'contact_submissions', id);

    await withFirebaseTimeout(
      updateDoc(ref, {
        ...details,
        updated_at: updatedAt,
      }),
    );

    return true;
  } catch {
    return false;
  }
}

export async function deleteCustomerLead(id: string) {
  const deletedAt = new Date().toISOString();

  if (!db) {
    return false;
  }

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

    return true;
  } catch {
    return false;
  }
}

export async function restoreCustomerLead(id: string) {
  if (!db) {
    return false;
  }

  try {
    await withFirebaseTimeout(
      updateDoc(
        doc(db, 'contact_submissions', id),
        {
          deleted_at: null,
          updated_at: new Date().toISOString(),
        },
      ),
    );

    return true;
  } catch {
    return false;
  }
}

export async function permanentlyDeleteCustomerLead(id: string) {
  if (!db) {
    return false;
  }

  try {
    await withFirebaseTimeout(
      deleteDoc(
        doc(db, 'contact_submissions', id),
      ),
    );

    return true;
  } catch {
    return false;
  }
}
export async function purgeOldDeletedCustomerLeads(
  maxAgeDays: number,
): Promise<number> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  if (!db) {
    return 0;
  }

  try {
    const snapshot = await withFirebaseTimeout(
      getDocs(
        query(
          collection(db, 'contact_submissions'),
        ),
      ),
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
          deleteDoc(
            doc(
              db,
              'contact_submissions',
              docSnap.id,
            ),
          ),
        ),
      ),
    );

    return expired.length;
  } catch {
    return 0;
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
    await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );

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
    await sendPasswordResetEmail(
      auth,
      normalizedEmail,
    );

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

