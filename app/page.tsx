"use client";

import { useState, useEffect } from "react";
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  loginWithFirestoreUser,
  logout,
  changePassword
} from "./firebase";
import STLViewer from "./STLViewer";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleEmailLogin = async () => {
    setError("");
    const mensaje = await loginWithEmail(identifier.trim(), password);
    if (mensaje !== true) setError(mensaje);
  };

  const handleFirestoreLogin = async () => {
    setError("");
    const trimmedIdentifier = identifier.trim();
    const result = await loginWithFirestoreUser(trimmedIdentifier, password);
    if (typeof result === "string") {
      setError(result);
    } else {
      setUser(result);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage("");
    const mensaje = await changePassword(currentPassword, newPassword, user);
    setPasswordMessage(mensaje);

    if (mensaje === "Contraseña actualizada correctamente") {
      setCurrentPassword("");
      setNewPassword("");
      setShowChangePassword(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result === true) setUser(null);
  };

  // -------------------- Pantalla login --------------------
  if (!user) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
  <div className="bg-white p-10 rounded-xl shadow-lg flex flex-col items-center gap-2 w-80">
    
    {/* Imagen arriba de todo */}
    <img
      src="/lambda-fulldev1.jpg"
      alt="Logo"
      className="w-100 h-100 object-contain mb-1"
    />

    <h2 className="text-2xl font-bold text-gray-700">Bienvenido</h2>
    <p className="text-gray-500 text-center">
      Inicia sesión para acceder al STL Viewer
    </p>

    <div className="flex flex-col gap-3 w-full mt-4">
      <input
        type="text"
        placeholder="Email o usuario"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        className="px-4 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-4 py-2 border rounded"
      />
      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={async () => {
          const m = await loginWithGoogle();
          if (m !== true) setError(m);
        }}
        className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200"
      >
        Iniciar sesión con Google
      </button>

      <button
        onClick={handleEmailLogin}
        className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
      >
        Iniciar sesión con Email
      </button>

      <button
        onClick={handleFirestoreLogin}
        className="px-8 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600"
      >
        Iniciar sesión con Usuario
      </button>
    </div>
  </div>
</div>


    );
  }

  // -------------------- Pantalla principal --------------------
  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-4 flex justify-between items-center bg-gray-200">
        <div className="flex items-center gap-3">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="Foto de perfil"
              className="w-10 h-10 rounded-full"
            />
          )}
          <span className="font-semibold">
            Hola, {user.displayName || user.nickname || user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-full">
        <div className="flex-1">
          <STLViewer />
        </div>

        {user.providerData?.some((p: any) => p.providerId === "password") &&
          showChangePassword && (
            <div className="p-4 bg-gray-100 w-full md:w-80">
              <h3 className="font-semibold mb-2">Cambiar contraseña</h3>
              <input
                type="password"
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="px-4 py-2 border rounded w-full mb-2"
              />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-4 py-2 border rounded w-full mb-2"
              />
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 w-full"
              >
                Actualizar contraseña
              </button>
              {passwordMessage && (
                <p
                  className={`mt-2 ${
                    passwordMessage.includes("incorrecta") ||
                    passwordMessage.includes("débil")
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  {passwordMessage}
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
