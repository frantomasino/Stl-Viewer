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
  query,
  where,
  doc,
  getDoc
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
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

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
