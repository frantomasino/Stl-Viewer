"use client";

import Link from "next/link";
import Image from "next/image";

export default function TerminosCondiciones() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo/isologo-logo.png"
            alt="Lambda 3D"
            width={300}
            height={40}
            priority
          />
        </Link>
      </div>

      {/* Header */}
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">
          Términos y Condiciones
        </h1>
        <p className="text-muted-foreground">
          Última actualización: Octubre 2025
        </p>
      </header>

      {/* Content */}
      <section className="space-y-6 text-lg leading-relaxed text-muted-foreground">
        <p>
          El presente documento regula el uso del sitio web{" "}
          <strong>www.lambda3d.com.ar</strong> y del visualizador 3D de{" "}
          <strong>Lambda 3D</strong>. Al acceder o utilizar el sitio, aceptás
          estos términos.
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          1. Identificación
        </h2>
        <p>
          Lambda 3D es un proyecto dedicado al diseño y visualización de
          biomodelos. Contacto:{" "}
          <Link
            href="mailto:lambda3dbiomodelos@gmail.com"
            className="text-primary underline"
          >
            lambda3dbiomodelos@gmail.com
          </Link>
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          2. Objeto del sitio
        </h2>
        <p>
          El visualizador 3D es una herramienta de uso ilustrativo y educativo.{" "}
          <strong>
            No constituye software médico ni está aprobado para uso clínico o
            diagnóstico.
          </strong>
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          3. Uso permitido
        </h2>
        <ul className="list-disc list-inside space-y-2">
          <li>No usar el visualizador con fines clínicos o quirúrgicos.</li>
          <li>No reproducir ni distribuir contenidos sin autorización.</li>
          <li>No manipular ni alterar el software.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-foreground">
          4. Limitación de responsabilidad
        </h2>
<p>
  Lambda 3D no será responsable de ningún uso indebido de los modelos ni de eventuales daños directos,
  indirectos, incidentales o consecuentes derivados de la utilización del sitio o del visualizador.
  El software se proporciona <strong>sin garantía de adecuación para un fin particular</strong>, 
  ni explícita ni implícita, incluyendo pero no limitado a usos clínicos, diagnósticos o quirúrgicos.
</p>

        <h2 className="text-2xl font-semibold text-foreground">
          5. Propiedad intelectual
        </h2>
        <p>
          Todos los contenidos, imágenes y software son propiedad de Lambda 3D o
          sus titulares. Asimismo,{" "}
          <strong>Lambda 3D es una marca registrada</strong>. Queda prohibido su
          uso sin autorización expresa.
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          6. Jurisdicción
        </h2>
        <p>Estos términos se rigen por las leyes de la República Argentina.</p>
      </section>

      {/* Botón Home */}
      <div className="flex justify-center gap-8 mt-12">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-primary text-white font-medium shadow hover:bg-primary/90 transition"
        >
          Volver al inicio
        </Link>
        {/* Link hacia Privacidad */}
        <Link
          href="/politica-privacidad"
          className="flex items-center gap-2 text-primary hover:underline font-medium"
        >
          Ir Política de Privacidad
        </Link>
      </div>
    </main>
  );
}
