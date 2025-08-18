"use client"

import { useState, useEffect } from "react"
import { auth, loginWithGoogle, loginWithEmail, logout, changePassword } from "./firebase"
import STLViewer from "./STLViewer"

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u))
    return () => unsubscribe()
  }, [])

 const handleEmailLogin = async () => {
  setError("")
  try {
    await loginWithEmail(email, password)
  } catch (err) {
    // err es cualquier cosa, convertimos a mensaje
    const message = err?.code === "auth/wrong-password"
      ? "Contraseña incorrecta"
      : err?.code === "auth/user-not-found"
      ? "Usuario no encontrado"
      : "Error: " + (err?.message || err)
    setError(message)
  }
}

  const handleChangePassword = async () => {
    setPasswordMessage("")
    try {
      await changePassword(newPassword)
      setPasswordMessage("Contraseña actualizada correctamente")
      setNewPassword("")
    } catch (err: any) {
      setPasswordMessage("Error: " + err.message)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-10 rounded-xl shadow-lg flex flex-col items-center gap-6 w-80">
          <h2 className="text-2xl font-bold text-gray-700">Bienvenido</h2>
          <p className="text-gray-500 text-center">Inicia sesión para acceder al STL Viewer</p>

          {/* Botón Google */}
          <button
            onClick={loginWithGoogle}
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200"
          >
            Iniciar sesión con Google
          </button>

          {/* Formulario Email/Contraseña */}
          <div className="flex flex-col gap-3 w-full mt-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onClick={handleEmailLogin}
              className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
            >
              Iniciar sesión con Email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Barra superior */}
      <div className="p-4 flex justify-between items-center bg-gray-200">
        <div className="flex items-center gap-3">
          {user.photoURL && <img src={user.photoURL} alt="Foto de perfil" className="w-10 h-10 rounded-full" />}
          <span className="font-semibold">Hola, {user.displayName || user.email}</span>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Contenedor principal */}
      <div className="flex flex-col md:flex-row h-full">
        {/* STL Viewer */}
        <div className="flex-1">
          <STLViewer />
        </div>

        {/* Panel de usuario para cambiar contraseña (solo Email) */}
        {user.providerData.some((p: any) => p.providerId === "password") && (
          <div className="p-4 bg-gray-100 w-full md:w-80">
            <h3 className="font-semibold mb-2">Cambiar contraseña</h3>
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
            {passwordMessage && <p className="mt-2 text-green-500">{passwordMessage}</p>}
          </div>
        )}
      </div>
    </div>
  )
}