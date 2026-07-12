import { Injectable, signal } from '@angular/core';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { ADMIN_EMAIL, firebaseConfig, getFirebaseApp } from './firebase';

export type SessionRole = 'admin' | 'teacher';

export type TeacherSession = {
  id: string;
  name: string;
  email: string;
  authUid: string | null;
  classIds: string[];
};

export type AuthSession = {
  ready: boolean;
  user: User | null;
  role: SessionRole | null;
  teacher: TeacherSession | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly app = getFirebaseApp();
  private readonly auth = getAuth(this.app);
  private readonly db = getFirestore(this.app);

  readonly session = signal<AuthSession>({
    ready: false,
    user: null,
    role: null,
    teacher: null,
  });

  readonly error = signal<string | null>(null);

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.session.set({ ready: true, user: null, role: null, teacher: null });
        return;
      }

      const resolved = await this.resolveSession(user);
      if (!resolved) {
        await signOut(this.auth);
        this.session.set({ ready: true, user: null, role: null, teacher: null });
        return;
      }

      this.session.set({
        ready: true,
        user,
        role: resolved.role,
        teacher: resolved.teacher,
      });
    });
  }

  async login(email: string, password: string) {
    this.error.set(null);
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    const resolved = await this.resolveSession(credential.user);

    if (!resolved) {
      await signOut(this.auth);
      throw new Error('invalid-role');
    }

    this.session.set({
      ready: true,
      user: credential.user,
      role: resolved.role,
      teacher: resolved.teacher,
    });

    return resolved;
  }

  async logout() {
    await signOut(this.auth);
    this.session.set({ ready: true, user: null, role: null, teacher: null });
  }

  async createTeacherAuthAccount(email: string, password: string) {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );

    const data = (await response.json()) as { localId?: string; error?: { message?: string } };
    if (!response.ok || !data.localId) {
      throw new Error(data.error?.message ?? 'auth-create-failed');
    }
    return data.localId;
  }

  private async resolveSession(user: User) {
    const email = user.email?.toLowerCase().trim() ?? '';
    if (!email) return null;
    if (email === ADMIN_EMAIL) return { role: 'admin' as const, teacher: null };

    const teacher = await this.resolveTeacherByEmail(email);
    if (!teacher) return null;
    if (teacher.authUid && teacher.authUid !== user.uid) return null;

    return { role: 'teacher' as const, teacher };
  }

  private async resolveTeacherByEmail(email: string): Promise<TeacherSession | null> {
    const snapshot = await getDocs(query(collection(this.db, 'teachers'), where('email', '==', email)));
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      name: String(data['name'] ?? ''),
      email: String(data['email'] ?? ''),
      authUid: typeof data['authUid'] === 'string' ? data['authUid'] : null,
      classIds: Array.isArray(data['classIds']) ? data['classIds'].map(String) : [],
    };
  }
}
