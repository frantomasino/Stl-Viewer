import { initializeApp, FirebaseError } from "firebase/app";

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
  query,
  where,
  doc,
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

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAQ0FZnhkUS21KeLF2_SD6DvQec4wT2OUU",
  authDomain: "stl-viewer-cac54.firebaseapp.com",
  projectId: "stl-viewer-cac54",
  storageBucket: "stl-viewer-cac54.appspot.com",
  messagingSenderId: "998564690654",
  appId: "1:998564690654:web:e65371fa213ecec699a04f"
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

    // Buscar   email
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
      photoURL: userData.photoURL || null
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




export type UserRole = "ADMIN" | "USER" | "TRIAL"

export interface FirebaseUser {
  id?: string
  name: string
  email: string
  role: UserRole
  department: string
  status: "active" | "inactive"
  created?: Date
  updatedAt?: Date
}
// User management functions
export const createUser = async (userData: Omit<FirebaseUser, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export const updateUser = async (userId: string, userData: Partial<FirebaseUser>) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export const deleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, "users", userId))
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

export const getUsers = async (): Promise<FirebaseUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"))
    console.log(querySnapshot)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseUser,
    )
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

export const getUsersByRole = async (role: UserRole): Promise<FirebaseUser[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", role))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseUser,
    )
  } catch (error) {
    console.error("Error fetching users by role:", error)
    throw error
  }
}


/////proyectos
export interface FirebaseProject {
  id?: string
  name: string
  description: string
  owner: string
  path: string
  status: string
  type: string
  created?: Date
  updatedAt?: Date
}

export const createProject = async (projectData: Omit<FirebaseProject, "id" | "created" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "projects"), {
      ...projectData,
      created: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}

export const updateProject = async (projectId: string, projectData: Partial<FirebaseProject>) => {
  try {
    const projectRef = doc(db, "projects", projectId)
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating project:", error)
    throw error
  }
}

export const deleteProject = async (projectId: string) => {
  try {
    await deleteDoc(doc(db, "projects", projectId))
  } catch (error) {
    console.error("Error deleting project:", error)
    throw error
  }
}

export const getProjects = async (): Promise<FirebaseProject[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "projects"))
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseProject,
    )
  } catch (error) {
    console.error("Error fetching projects:", error)
    throw error
  }
}

export const getProjectsByStatus = async (status: string): Promise<FirebaseProject[]> => {
  try {
    const q = query(collection(db, "projects"), where("status", "==", status))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseProject,
    )
  } catch (error) {
    console.error("Error fetching projects by status:", error)
    throw error
  }
}