import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  firebaseResetPassword,
  firebaseSignIn,
  firebaseSignOut,
} from '@/lib/firebase';

type AuthContextValue = {
  session: { user: User | null } | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: User | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setSession(currentUser ? { user: currentUser } : { user: null });
      setIsAdmin(Boolean(currentUser));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await firebaseSignIn(email, password);

    if (error) {
      setIsAdmin(false);
    }

    return { error };
  }

  async function resetPassword(email: string) {
    const { error } = await firebaseResetPassword(email);
    return { error };
  }

  async function signOut() {
    await firebaseSignOut();
    setSession(null);
    setIsAdmin(false);
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}