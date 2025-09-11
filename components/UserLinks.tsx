"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlertIcon,Home } from "lucide-react";

export function GoToAdminLink() {
  return (
    
      <Link href="/admin">
            <ShieldAlertIcon className="mr-2 h-4 w-4 text-blue-500" />
            <span className="text-blue-500">Admin</span>
      </Link>
   
  );
}


export function HomeButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/">
        <Home className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Ir al inicio</span>
      </Link>
    </Button>
  );
}