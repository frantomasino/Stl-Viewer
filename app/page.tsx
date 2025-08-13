"use client"

import { useState, useEffect } from "react"
import { auth, loginWithGoogle, logout } from "./firebase"
import STLViewer from "./STLViewer" 

export default function Page() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u)
    })
    return () => unsubscribe()
  }, [])

  if (!user) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-lg flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold text-gray-700">Bienvenido</h2>
        <p className="text-gray-500 text-center">Inicia sesión para acceder al STL Viewer</p>
        <button
          onClick={loginWithGoogle}
          className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200"
        >
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="h-screen w-screen">
      {/* Barra superior con datos del usuario */}
      <div className="p-4 flex justify-between items-center bg-gray-200">
        <div className="flex items-center gap-3">
          <img src={user.photoURL} alt="Foto de perfil" className="w-10 h-10 rounded-full" />
          <span className="font-semibold">Hola, {user.displayName}</span>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>

      {/* STL  protegido */}
      <STLViewer />
    </div>
  )
}
