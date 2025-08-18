import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAQ0FZnhkUS21KeLF2_SD6DvQec4wT2OUU",
  authDomain: "stl-viewer-cac54.firebaseapp.com",
  projectId: "stl-viewer-cac54",
  storageBucket: "stl-viewer-cac54.appspot.com",
  messagingSenderId: "998564690654",
  appId: "1:998564690654:web:e65371fa213ecec699a04f",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Login con Google
export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    throw error;
  }
};

// Login con Email/Contraseña
export const loginWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    const code = error.code;
    if (code === "auth/wrong-password") throw { code, message: "Contraseña incorrecta" };
    if (code === "auth/user-not-found") throw { code, message: "Usuario no encontrado" };
    throw { code: code || "unknown", message: error.message || "Error desconocido" };
  }
};

// Registro con Email/Contraseña
export const registerWithEmail = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error al crear la cuenta:", error);
    throw error;
  }
};

// Cambiar contraseña (usuario logueado con email)
export const changePassword = async (newPassword) => {
  if (!auth.currentUser) throw new Error("No hay usuario logueado");
  try {
    await updatePassword(auth.currentUser, newPassword);
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    throw error;
  }
};

// Cerrar sesión
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }
};
