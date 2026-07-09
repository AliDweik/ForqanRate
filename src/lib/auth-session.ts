import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db, firebaseConfig } from "@/lib/firebase";
import { type Teacher } from "@/lib/firestore-data";

export const ADMIN_EMAIL = "admin@forqanratesystem.com";

export type SessionRole = "admin" | "teacher";

export type AuthSession = {
  ready: boolean;
  user: User | null;
  role: SessionRole | null;
  teacher: Teacher | null;
};

type ResolvedSession = {
  role: SessionRole;
  teacher: Teacher | null;
};

const FIREBASE_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), FIREBASE_TIMEOUT_MS);
    }),
  ]);
}

async function resolveTeacherByEmail(email: string): Promise<Teacher | null> {
  const snap = await withTimeout(
    getDocs(query(collection(db, "teachers"), where("email", "==", email))),
    "firestore-timeout",
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data() as Teacher;
  return { ...data, id: d.id };
}

async function resolveSession(user: User): Promise<ResolvedSession | null> {
  const email = user.email?.toLowerCase() ?? "";
  if (!email) return null;
  if (email === ADMIN_EMAIL) return { role: "admin", teacher: null };

  const teacher = await resolveTeacherByEmail(email);
  if (!teacher) return null;
  if (teacher.authUid && teacher.authUid !== user.uid) return null;
  return { role: "teacher", teacher };
}

export async function signInAndResolve(email: string, password: string): Promise<ResolvedSession> {
  const cred = await withTimeout(
    signInWithEmailAndPassword(auth, email, password),
    "auth-timeout",
  );
  const resolved = await resolveSession(cred.user);
  if (!resolved) {
    await signOut(auth);
    throw new Error("invalid-role");
  }
  return resolved;
}

export async function logout() {
  await signOut(auth);
}

export async function createTeacherAuthAccount(email: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  const data = (await response.json()) as { localId?: string; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? "auth-create-failed");
  }
  if (!data.localId) throw new Error("auth-create-failed");
  return data.localId;
}

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession>({
    ready: false,
    user: null,
    role: null,
    teacher: null,
  });

  useEffect(() => {
    let active = true;
    const signedOut: AuthSession = { ready: true, user: null, role: null, teacher: null };
    const timeout = window.setTimeout(() => {
      if (active) setSession(signedOut);
    }, FIREBASE_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          window.clearTimeout(timeout);
          if (active) setSession(signedOut);
          return;
        }

        try {
          const resolved = await resolveSession(user);
          window.clearTimeout(timeout);
          if (!active) return;
          if (!resolved) {
            setSession(signedOut);
            void signOut(auth);
            return;
          }

          setSession({
            ready: true,
            user,
            role: resolved.role,
            teacher: resolved.teacher,
          });
        } catch {
          window.clearTimeout(timeout);
          if (active) setSession(signedOut);
        }
      },
      () => {
        window.clearTimeout(timeout);
        if (active) setSession(signedOut);
      },
    );

    return () => {
      active = false;
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return session;
}
