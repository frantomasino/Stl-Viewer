"use client";

import Link from "next/link";
import Image from "next/image";

export default function PoliticaPrivacidad() {
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
          Política de Privacidad
        </h1>
        <p className="text-muted-foreground">
          Última actualización: Octubre 2025
        </p>
      </header>

      {/* Content */}
      <section className="space-y-6 text-lg leading-relaxed text-muted-foreground">
        <p>
          En <strong>Lambda 3D</strong> respetamos tu privacidad y protegemos
          tus datos conforme a la Ley Argentina Nº 25.326.
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          1. Datos que recopilamos
        </h2>
        <p>
          Nombre, correo electrónico, teléfono y mensajes enviados a través de
          formularios o WhatsApp.
        </p>

        <h2 className="text-2xl font-semibold text-foreground">2. Finalidad</h2>
        <p>
          Responder consultas, enviar presupuestos y gestionar la relación
          comercial.
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          3. Cesión de datos
        </h2>
        <p>
          No compartimos tus datos salvo con proveedores tecnológicos (ej.
          Vercel, Google, WhatsApp).
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          4. Conservación
        </h2>
        <p>
          Conservamos la información mientras exista relación comercial o hasta
          que solicites su eliminación.
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          5. Derechos de usuario
        </h2>
        <p>
          Podés ejercer tus derechos escribiendo a{" "}
          <Link
            href="mailto:lambda3dbiomodelos@gmail.com"
            className="text-primary underline"
          >
            lambda3dbiomodelos@gmail.com
          </Link>
        </p>

        <h2 className="text-2xl font-semibold text-foreground">6. Cookies</h2>
        <p>
          El sitio utiliza cookies técnicas necesarias. En caso de usar
          analítica (ej. Google Analytics) se pedirá consentimiento.
        </p>

        <h2 className="text-2xl font-semibold text-foreground">
          7. Visualizador 3D
        </h2>
        <p>
          El visualizador es solo de uso educativo.{" "}
          <strong>
            No procesa datos sensibles ni constituye herramienta clínica.
          </strong>
        </p>
      </section>

      {/* Botón Home */}
      <div className="flex justify-center gap-8 mt-12">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-primary text-white font-medium shadow hover:bg-primary/90 transition"
        >
          Volver al inicio
        </Link>

        <Link
          href="/terminos-condiciones"
          className="flex items-center gap-2 text-primary hover:underline font-medium"
        >
          Ir a Términos y Condiciones
        </Link>
      </div>
    </main>
  );
}
