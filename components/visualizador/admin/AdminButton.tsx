"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // si usás shadcn
import { Shield } from "lucide-react";

export function AdminButton({ newTab = true }: { newTab?: boolean }) {
  const href = process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin-panel.vercel.app"; // fallback
  return (
    <Button asChild variant="outline">
      <Link href={href} target={newTab ? "_blank" : undefined} rel="noopener noreferrer">
        <Shield className="mr-2 h-4 w-4" />
        Admin
      </Link>
    </Button>
  );
}