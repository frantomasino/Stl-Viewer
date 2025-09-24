"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlertIcon, Home, LogIn, Play } from "lucide-react";

export function GoToAdminLink() {
  return (
    <Link href="/visualizador/admin" className="inline-flex w-full items-center gap-2">
      <ShieldAlertIcon className="mr-2 h-4 w-4 text-blue-500" />
      <span className="text-blue-500">Admin</span>
    </Link>
  );
}

// 👇 Antes llevaba a /visualizador. Ahora a /demo.
export function DemoButton() {
  return (
    <Button asChild variant="default" size="sm">
      <Link href="/demo">
        <Play className="h-[1.2rem] w-[1.2rem]" />
        <span className="ml-2">Ver Demo</span>
      </Link>
    </Button>
  );
}

export function HomeButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/visualizador">
        <Home className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Ir al inicio</span>
      </Link>
    </Button>
  );
}

// 👇 Botón aparte para login real
export function LoginButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/visualizador">
        <LogIn className="h-[1.2rem] w-[1.2rem]" />
        <span className="ml-2">Ingresar</span>
      </Link>
    </Button>
  );
}
