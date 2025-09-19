"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdminFromUsers } from "@/hooks/useIsAdminFromUsers";

export default function AdminGuardClient({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useIsAdminFromUsers();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/visualizador"); // adonde querés mandarlo
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) return null; // evita parpadeo y render no autorizado
  return <>{children}</>;
}
