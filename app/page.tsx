"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  loginWithFirestoreUser,
  logout,
  changePassword,
} from "./firebase";
import STLViewer from "./STLViewer";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 👇 importamos tu UserProfile
import { UserProfile } from "@/components/ui/user-profile";

// --- LOGIN SOLO CLIENTE PARA EVITAR HYDRATION ERROR ---
const ClientOnlyLogin = dynamic(() => Promise.resolve(LoginComponent), { ssr: false });

function LoginComponent({
  isLoading,
  error,
  identifier,
  password,
  setIdentifier,
  setPassword,
  handleEmailLogin,
  handleFirestoreLogin,
  handleGoogle,
}: any) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              3D Medical Viewer
            </CardTitle>
            <CardDescription className="text-gray-600">
              Iniciá sesión para acceder a tus archivos
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google */}
            <Button
              onClick={handleGoogle}
              variant="outline"
              className="w-full h-12 text-base bg-transparent"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>

            {/* separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  o continuar con email
                </span>
              </div>
            </div>

            {/* Email + Password */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailLogin();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email o usuario</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="doctor@hospital.com"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? "Ingresando..." : "Ingresar con Email"}
                </Button>
                <Button
                  type="button"
                  className="w-full h-12 text-base"
                  variant="secondary"
                  disabled={isLoading}
                  onClick={handleFirestoreLogin}
                >
                  {isLoading ? "Ingresando..." : "Ingresar con Usuario"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  const [user, setUser] = useState(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleEmailLogin = async () => {
    setError("");
    setIsLoading(true);
    const mensaje = await loginWithEmail(identifier.trim(), password);
    if (mensaje !== true) setError(mensaje);
    setIsLoading(false);
  };

  const handleFirestoreLogin = async () => {
    setError("");
    setIsLoading(true);
    const trimmedIdentifier = identifier.trim();
    const result = await loginWithFirestoreUser(trimmedIdentifier, password);
    if (typeof result === "string") {
      setError(result);
    }
    setIsLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    setIsLoading(true);
    const m = await loginWithGoogle();
    if (m !== true) setError(m);
    setIsLoading(false);
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

  // --- LOGIN ---
  if (!user) {
    return (
      <ClientOnlyLogin
        isLoading={isLoading}
        error={error}
        identifier={identifier}
        password={password}
        setIdentifier={setIdentifier}
        setPassword={setPassword}
        handleEmailLogin={handleEmailLogin}
        handleFirestoreLogin={handleFirestoreLogin}
        handleGoogle={handleGoogle}
      />
    );
  }

  // --- PANTALLA PRINCIPAL ---
  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="relative w-full bg-gray-200 flex justify-end items-center h-12 px-4">
        <UserProfile user={user} handleLogout={handleLogout} />
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        <div className="flex-1">
          {/* ✅ pasamos props */}
          <STLViewer user={user} handleLogout={handleLogout} />
        </div>

        {user?.providerData?.some((p) => p.providerId === "password") && showChangePassword && (
          <div className="p-4 bg-gray-100 w-full md:w-80">
            <h3 className="font-semibold mb-2">Cambiar contraseña</h3>
            <Input
              type="password"
              placeholder="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full mb-2"
              autoComplete="off"
            />
            <Input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-2"
              autoComplete="off"
            />
            <Button onClick={handleChangePassword} className="w-full">
              Actualizar contraseña
            </Button>
            {passwordMessage && (
              <p
                className={`mt-2 ${
                  passwordMessage.includes("incorrecta") || passwordMessage.includes("débil")
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
