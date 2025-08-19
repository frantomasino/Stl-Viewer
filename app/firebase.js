import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
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

// -------------------- Login con Google --------------------
export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
    return true;
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    return error.message;
  }
};

// -------------------- Login con Email/Contraseña (Firebase Auth) --------------------
export const loginWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch (error) {
    if (error.code === "auth/user-not-found") return "Usuario no encontrado";
    if (error.code === "auth/wrong-password") return "Contraseña incorrecta";
    return error.message;
  }
};

// -------------------- Logout --------------------
export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return error.message;
  }
};

// -------------------- Login con Firestore (email o nickname) --------------------
export const loginWithFirestoreUser = async (identifier, password) => {
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

    const userData = userSnap.data();

    // Comparar contraseña con bcrypt
    const isValid = await bcrypt.compare(password, userData.passwordHash || "");
    if (!isValid) return "Contraseña incorrecta";

    return {
      uid: userSnap.id,
      email: userData.email,
      nickname: userData.nickname,
      displayName: userData.nickname,
      photoURL: userData.photoURL || null
    };
  } catch (error) {
    console.error("Error al iniciar sesión con Firestore:", error);
    return "Error al iniciar sesión con Firestore";
  }
};

// -------------------- Obtener info extra de Firestore --------------------
export const getFirestoreUser = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;
    return userDoc.data();
  } catch (error) {
    console.error("Error al obtener usuario de Firestore:", error);
    return null;
  }
};

// -------------------- Cambiar contraseña --------------------
export const changePassword = async (currentPassword, newPassword, user) => {
  if (!user) return "Usuario no autenticado";
  try {
    // Reautenticación
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Actualizar contraseña
    await updatePassword(auth.currentUser, newPassword);
    return "Contraseña actualizada correctamente";
  } catch (error) {
    console.error(error);
    if (error.code === "auth/wrong-password") return "Contraseña actual incorrecta";
    if (error.code === "auth/weak-password") return "La nueva contraseña es demasiado débil";
    return "Error al actualizar la contraseña";
  }
};
