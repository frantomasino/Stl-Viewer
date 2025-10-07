import { initializeApp, type FirebaseError } from "firebase/app";

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

// Tipos auxiliares
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

const membershipId = (userId: string, projectId: string) => `${userId}_${projectId}`;

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

export async function unassignUserFromProject(userId: string, projectId: string): Promise<void> {
  await deleteDoc(doc(db, "memberships", membershipId(userId, projectId)));
}

export async function replaceUserMemberships(userId: string, targetProjectIds: string[]): Promise<void> {
  // Reemplaza TODO el set de proyectos de un usuario
  const qy = query(collection(db, "memberships"), where("userId", "==", userId));
  const snap = await getDocs(qy);
  const current = new Set(snap.docs.map(d => (d.data() as Membership).projectId));
  const target = new Set(targetProjectIds);

  const toAdd = [...target].filter(id => !current.has(id));
  const toDel = [...current].filter(id => !target.has(id));

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

// Leer projectIds de un user
export async function getUserProjectIds(userId: string): Promise<string[]> {
  const qy = query(collection(db, "memberships"), where("userId", "==", userId));
  const snap = await getDocs(qy);
  return snap.docs.map(d => (d.data() as Membership).projectId);
}

// Traer proyectos por IDs (chunk de 10)
export async function getProjectsByIds(ids: string[]): Promise<FirebaseProject[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

  const out: FirebaseProject[] = [];
  for (const group of chunks) {
    const qy = query(collection(db, "projects"), where(documentId(), "in", group));
    const snap = await getDocs(qy);
    out.push(...snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  }
  return out;
}

// =====================
// Configuración Firebase
// =====================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Auth y Firestore
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

// -------------------- Login con Email/Contraseña  --------------------
export const loginWithEmail = async (email: string, password: string): Promise<LoginResult> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc();
    return true;
  } catch (error: unknown) {
    const code = (error as FirebaseError)?.code;
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

    // Buscar por email
    const qEmail = query(usersRef, where("email", "==", identifier));
    let snapshot = await getDocs(qEmail);
    let userSnap = snapshot.docs[0];

    // Si no existe por email, buscar por nickname (minúscula)
    if (!userSnap) {
      const qNick = query(usersRef, where("nicknameLower", "==", identifier.toLowerCase()));
      snapshot = await getDocs(qNick);
      userSnap = snapshot.docs[0];
    }

    if (!userSnap) return "Usuario no encontrado";

    const userData = userSnap.data() as any;

    // Comparar contraseña con bcrypt
    const isValid = await bcrypt.compare(password, userData.passwordHash || "");
    if (!isValid) return "Contraseña incorrecta";

    const result: FirestoreLoginUser = {
      uid: userSnap.id,
      email: userData.email,
      nickname: userData.nickname,
      displayName: userData.nickname,
      photoURL: userData.photoURL || null,
    };
    return result;
  } catch (error: unknown) {
    console.error("Error al iniciar sesión con Firestore:", error);
    return "Error al iniciar sesión con Firestore";
  }
};

// -------------------- Obtener info extra de Firestore --------------------
export const getFirestoreUser = async (
  uid: string
): Promise<Record<string, unknown> | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;
    return userDoc.data() as Record<string, unknown>;
  } catch (error: unknown) {
    console.error("Error al obtener usuario de Firestore:", error);
    return null;
  }
};

// -------------------- Cambiar contraseña --------------------
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  user: User | null
): Promise<string> => {
  if (!user || !user.email) return "Usuario no autenticado";
  try {
    // Reautenticación
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser!, credential);

    // Actualizar contraseña
    await updatePassword(auth.currentUser!, newPassword);
    return "Contraseña actualizada correctamente";
  } catch (error: unknown) {
    console.error(error);
    const code = (error as FirebaseError)?.code;
    if (code === "auth/wrong-password") return "Contraseña actual incorrecta";
    if (code === "auth/weak-password") return "La nueva contraseña es demasiado débil";
    return "Error al actualizar la contraseña";
  }
};

export type UserRole = "ADMIN" | "USER" | "TRIAL";

export interface FirebaseUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "active" | "inactive";
  created?: Date;
  updatedAt?: Date;
}

// lib/firebase.ts  ➜ reemplazá tu ensureUserDoc por este
export const ensureUserDoc = async (): Promise<void> => {
  const u = auth.currentUser;
  if (!u) return;

  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // SOLO en la creación pongo role por defecto
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
        acceptedTerms: false,
        acceptedTermsAt: null,
      },
      { merge: true }
    );
    assignUserToProject(u.uid, "adnCLulIpxl9fH6tT6tq", "viewer")
  } else {
    // Si ya existe, NO toco role ni otros campos manuales
    // (solo actualizo updatedAt y relleno mínimos si faltan)
    const curr = snap.data() as any;
    const patch: any = { updatedAt: serverTimestamp() };
    if (curr?.uid == null) patch.uid = u.uid;
    if (curr?.email == null && u.email) patch.email = u.email;
    if (curr?.name == null && u.displayName) patch.name = u.displayName;
     if (typeof curr?.acceptedTerms === "undefined") patch.acceptedTerms = false;
    if (typeof curr?.acceptedTermsAt === "undefined") patch.acceptedTermsAt = null;

    await setDoc(ref, patch, { merge: true });
  }
  
};

// // User management functions
// export const createUser = async (userData: Omit<FirebaseUser, "id" | "createdAt" | "updatedAt">) => {
//   try {
//     const docRef = await addDoc(collection(db, "users"), {
//       ...userData,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });
//   return docRef.id;
//   } catch (error) {
//     console.error("Error creating user:", error);
//     throw error;
//   }
// };

export const updateUser = async (userId: string, userData: Partial<FirebaseUser>) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, "users", userId));
    await deleteDoc(doc(db, "profiles", userId));


    const q = query(collection(db, "memberships"), where("userId", "==", userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 500) {
        const slice = docs.slice(i, i + 500);
        const batch = writeBatch(db);
        slice.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }

  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getUsers = async (): Promise<FirebaseUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseUser
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUsersByRole = async (role: UserRole): Promise<FirebaseUser[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseUser
    );
  } catch (error) {
    console.error("Error fetching users by role:", error);
    throw error;
  }
};

// ----- proyectos -----
export interface FirebaseProject {
  id?: string;
  name: string;
  description: string;
  owner: string;
  path: string;
  status: string;
  type: string;
  created?: Date;
  updatedAt?: Date;
}

export const createProject = async (projectData: Omit<FirebaseProject, "id" | "created" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      ...projectData,
      created: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const updateProject = async (projectId: string, projectData: Partial<FirebaseProject>) => {
  try {
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    await deleteDoc(doc(db, "projects", projectId));
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

export const getProjects = async (): Promise<FirebaseProject[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseProject
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

export const getProjectsByStatus = async (status: string): Promise<FirebaseProject[]> => {
  try {
    const q = query(collection(db, "projects"), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseProject
    );
  } catch (error) {
    console.error("Error fetching projects by status:", error);
    throw error;
  }
};

/* =========================
   CONTACTO (con teléfono)
   ========================= */

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  // createdAt lo setea el server con serverTimestamp()
}

export const sendContactMessage = async (
  data: Omit<ContactMessage, "id">
): Promise<string> => {
  // Validaciones mínimas en front (las reglas vuelven a validar en servidor)
  if (!data.name?.trim()) throw new Error("Falta nombre");
  if (!data.email?.trim()) throw new Error("Falta email");
  if (!data.phone?.trim()) throw new Error("Falta teléfono");
  if (!data.message?.trim()) throw new Error("Falta mensaje");

  const ref = await addDoc(collection(db, "contactMessages"), {
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    message: data.message.trim(),
    createdAt: serverTimestamp(), 
  });
  return ref.id;
};

// Solo ADMIN podrá leer por reglas
export const getContactMessages = async (max: number = 50): Promise<ContactMessage[]> => {
  const qy = query(
    collection(db, "contactMessages"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(qy);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as ContactMessage) }));
};

// Helpers de proyectos por usuario
export async function getUserProjects(userId: string): Promise<FirebaseProject[]> {
  const ids = await getUserProjectIds(userId);
  return await getProjectsByIds(ids);
}

export async function getMyProjects(): Promise<FirebaseProject[]> {
  const u = auth.currentUser;
  if (!u) return [];
  return await getUserProjects(u.uid);
}

export async function getUserProjectsCount(userId: string): Promise<number> {
  const ids = await getUserProjectIds(userId);
  return ids.length;
}
