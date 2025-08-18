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
  const [showPasswordPanel, setShowPasswordPanel] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u))
    return () => unsubscribe()
  }, [])

  const handleEmailLogin = async () => {
    setError("")
    try {
      await loginWithEmail(email, password)
    } catch (err: any) {
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

      // Ocultar panel después de 2 segundos
      setTimeout(() => {
        setShowPasswordPanel(false)
      }, 2000)

    } catch (err: any) {
      setPasswordMessage("Error: " + err.message)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#ffffff]">
        <div className="bg-[#1d1d1b] p-10 rounded-xl shadow-lg flex flex-col items-center gap-6 w-80">
          <h2 className="text-2xl font-bold text-[#33809d]">Bienvenido</h2>
          <p className="text-[#575756] text-center">Inicia sesión para acceder al STL Viewer</p>

          {/* Formulario Email/Contraseña */}
          <div className="flex flex-col gap-3 w-full mt-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border rounded border-[#33809d] placeholder-[#575756] text-[#1d1d1b]"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 border rounded border-[#33809d] placeholder-[#575756] text-[#1d1d1b]"
            />
            {error && <p className="text-red-500">{error}</p>}
          </div>

          {/* Botones uno arriba del otro */}
          <div className="flex flex-col gap-3 w-full mt-4">
            <button
              onClick={loginWithGoogle}
              className="px-8 py-3 bg-gradient-to-r from-[#1961ac] via-[#85be4c] to-[#f39325] text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition duration-200"
            >
              Ingresar con Google
            </button>
            <button
              onClick={handleEmailLogin}
              className="px-8 py-3 bg-[#33809d] text-white font-semibold rounded-lg shadow-md hover:bg-[#1961ac] transition duration-200"
            >
              Ingresar con Email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Barra superior */}
      <div className="p-4 flex justify-between items-center bg-[#33809d] text-white">
        <div className="flex items-center gap-3">
          {user.photoURL && <img src={user.photoURL} alt="Foto de perfil" className="w-10 h-10 rounded-full" />}
          <span className="font-semibold">Hola, {user.displayName || user.email}</span>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-[#f39325] text-white rounded hover:opacity-90"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Contenedor principal */}
      <div className="flex flex-col md:flex-row h-full">
        <div className="flex-1">
          <STLViewer />
        </div>

        {showPasswordPanel && user.providerData.some((p: any) => p.providerId === "password") && (
          <div className="p-4 bg-[#ffffff] w-full md:w-80 border-l border-[#575756]">
            <h3 className="font-semibold mb-2 text-[#33809d]">Cambiar contraseña</h3>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-4 py-2 border rounded w-full mb-2 border-[#33809d]"
            />
            <button
              onClick={handleChangePassword}
              className="px-4 py-2 bg-[#85be4c] text-white rounded hover:opacity-90 w-full"
            >
              Actualizar contraseña
            </button>
            {passwordMessage && <p className="mt-2 text-[#33809d]">{passwordMessage}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
