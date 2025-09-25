"use client";

import Image from "next/image";
import { useTheme } from "@/components/theme-provider";

export function BrandLogo() {
  const { resolvedTheme } = useTheme();
  const src =
    resolvedTheme === "dark"
      ? "/logo/logoblanco.png"
      : "/logo/logo.png"; // 👈 renombrá el archivo para evitar espacios

  return (
    <Image
      src={src}
      alt="Lambda 3D"
      width={160}
      height={160}
      className="h-18 w-auto cursor-pointer"
      priority
    />
  );
}
