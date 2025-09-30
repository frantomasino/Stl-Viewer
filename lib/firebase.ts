// lib/firebase.ts
// "use client"; // si usás este archivo directamente en componentes cliente

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  writeBatch,
  documentId,
} from "firebase/firestore";
import bcrypt from "bcryptjs";

// ========== Tipos auxiliares ==========
type LoginResult = true | string;

export type FirestoreLoginUser = {
  uid: string;
  email: string;
  nickname: string;
  displayName: string;
  photoURL: string | null;
};

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const anyErr = error as { message?: string };
    if (anyErr.message) return anyErr.message;
  }
  return "Ocurrió un error inesperado";
}

// =========== MEMBERSHIPS ===========
export type ProjectMemberRole = "owner" | "editor" | "viewer";
export interface Membership {
  userId: string;
  projectId: string;
  role: ProjectMemberRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const membershipId = (userId: string, projectId: string) =>
  `${userId}_${projectId}`;

// ========= MEMBERSHIPS helpers =========
export async function assignUserToProject(
  userId: string,
  projectId: string,
  role: ProjectMemberRole = "viewer"
): Promise<void> {
  await setDoc(
    doc(db, "memberships", membershipId(userId, projectId)),
    {
      userId,
      projectId,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function unassignUserFromProject(
  userId: string,
  projectId: string
): Promise<void> {
  await deleteDoc(doc(db, "memberships", membershipId(userId, projectId)));
}

export async function replaceUserMemberships(
  userId: string,
  targetProjectIds: string[]
): Promise<void> {
  const qy = query(collection(db, "memberships"), where("userId", "==", userId));
  const snap = await getDocs(qy);

  const actuales = new Set(snap.docs.map(d => (d.data() as Membership).projectId));
  const objetivo = new Set(targetProjectIds);

  const toAdd = [...objetivo].filter(id => !actuales.has(id));
  const toDel = [...actuales].filter(id => !objetivo.has(id));

  const batch = writeBatch(db);

  for (const pid of toAdd) {
    batch.set(
      doc(db, "memberships", membershipId(userId, pid)),
      {
        userId,
        projectId: pid,
        role: "viewer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  for (const pid of toDel) {
    batch.delete(doc(db, "memberships", membershipId(userId, pid)));
  }

  await batch.commit();
}

// =========== Firebase Config ===========
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// -------------------- Login Google --------------------
export const loginWithGoogle = async (): Promise<LoginResult> => {
  try {
    await signInWithPopup(auth, provider);
    await ensureUserDoc();
    return true;
  } catch (error: unknown) {
    console.error("Error al iniciar sesión con Google:", error);
    return getErrorMessage(error);
  }
};

// -------------------- Login Email/Contraseña --------------------
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc();
    return true;
  } catch (error: any) {
    const code = error?.code;
    if (code === "auth/user-not-found") return "Usuario no encontrado";
    if (code === "auth/wrong-password") return "Contraseña incorrecta";
    return getErrorMessage(error);
  }
};

// -------------------- Logout --------------------
export const logout = async (): Promise<LoginResult> => {
  try {
    await signOut(auth);
    return true;
  } catch (error: unknown) {
    console.error("Error al cerrar sesión:", error);
    return getErrorMessage(error);
  }
};

// -------------------- Login con Firestore (email o nickname) --------------------
export const loginWithFirestoreUser = async (
  identifier: string,
  password: string
): Promise<string | FirestoreLoginUser> => {
  try {
    const usersRef = collection(db, "users");
    let snapshot = await getDocs(query(usersRef, where("email", "==", identifier)));
    let userSnap = snapshot.docs[0];

    if (!userSnap) {
      snapshot = await getDocs(
        query(usersRef, where("nicknameLower", "==", identifier.toLowerCase()))
      );
      userSnap = snapshot.docs[0];
    }

    if (!userSnap) return "Usuario no encontrado";
    const userData = userSnap.data() as any;

    const isValid = await bcrypt.compare(password, userData.passwordHash || "");
    if (!isValid) return "Contraseña incorrecta";

    return {
      uid: userSnap.id,
      email: userData.email,
      nickname: userData.nickname,
      displayName: userData.nickname,
      photoURL: userData.photoURL || null,
    };
  } catch (error) {
    console.error("Error al iniciar sesión con Firestore:", error);
    return "Error al iniciar sesión con Firestore";
  }
};

// -------------------- ensureUserDoc --------------------
export const ensureUserDoc = async (): Promise<void> => {
  const u = auth.currentUser;
  if (!u) return;

  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        uid: u.uid,
        name: u.displayName ?? "",
        email: u.email ?? "",
        role: "TRIAL",
        department: "",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    const curr = snap.data() as any;
    const patch: any = { updatedAt: serverTimestamp() };
    if (!curr?.uid) patch.uid = u.uid;
    if (!curr?.email && u.email) patch.email = u.email;
    if (!curr?.name && u.displayName) patch.name = u.displayName;
    await setDoc(ref, patch, { merge: true });
  }
};
