"use client";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

export function BrandLogo() {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? "/logo/lambda3D -logo-light.png" : "/logo/logo.png"; // poné ambos en /public

  return (
    <Link href="/">
      <Image src={src} alt="Lambda 3D" width={160} height={160} className="h-18 w-auto" priority />
    </Link>
  );
}
