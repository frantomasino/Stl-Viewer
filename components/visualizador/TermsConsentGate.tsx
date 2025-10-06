"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";

type TermsConsentGateProps = {
  children: React.ReactNode;
};

import Link from "next/link";

export default function TermsConsentGate({ children }: TermsConsentGateProps) {
  const [needsConsent, setNeedsConsent] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [acceptEnabled, setAcceptEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // 1) Detectar usuario + si necesita aceptar
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setNeedsConsent(false);
        setUid(null);
        setLoadingCheck(false);
        return;
      }
      setUid(u.uid);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.data() as any | undefined;
        const accepted = !!data?.acceptedTerms;
        // Si no existe el campo o es false → mostrar modal
        setNeedsConsent(!accepted);
      } catch {
        // Si falla la lectura, por seguridad pedimos consentimiento
        setNeedsConsent(true);
      } finally {
        setLoadingCheck(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (needsConsent) setAcceptEnabled(false);
  }, [needsConsent]);

  // 2) Habilitar "Aceptar" cuando scrollea hasta abajo el texto
  useEffect(() => {
    if (!needsConsent) return;

    let cancelled = false;
    let cleanup: () => void = () => {};

    const attach = (el: HTMLDivElement) => {
      const update = () => {
        const noOverflow = el.scrollHeight <= el.clientHeight + 1;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
        setAcceptEnabled(noOverflow || atBottom);
      };

      const onScroll = () => update();
      el.addEventListener("scroll", onScroll, { passive: true });

      const ro = new ResizeObserver(update);
      ro.observe(el);

      // medir en el próximo frame (ya renderizado)
      requestAnimationFrame(update);

      cleanup = () => {
        el.removeEventListener("scroll", onScroll);
        ro.disconnect();
      };
    };

    const waitForRef = () => {
      if (cancelled) return;
      const el = scrollRef.current;
      if (el) {
        attach(el);
      } else {
        // el dialog aún no montó el contenido → reintentar en el próximo frame
        requestAnimationFrame(waitForRef);
      }
    };

    waitForRef();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [needsConsent]);

  const handleReject = async () => {
    await signOut(auth);
  };

  const handleAccept = async () => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, "users", uid), {
        acceptedTerms: true,
        acceptedTermsAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNeedsConsent(false);
    } catch (e) {
      // Podés mostrar un toast si querés
      console.error("No se pudo guardar la aceptación de términos", e);
    }
  };

  // Mientras chequea, render normal (o un loader si querés)
  if (loadingCheck) return <>{children}</>;

  return (
    <>
      {children}

      <AlertDialog
        open={needsConsent}
        onOpenChange={() => {
          /* bloqueado */
        }}
      >
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Términos y condiciones</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, leé y aceptá los términos para continuar usando la
              plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Cuerpo scrolleable: al llegar al fondo habilita "Aceptar" */}
          <div
            ref={scrollRef}
            className="max-h-64 overflow-y-auto rounded border p-3 text-sm space-y-3"
          >
            <p>
              Bienvenido/a. Este acuerdo regula el uso del Visualizador 3D
              desarrollado por FullDev en colaboración con Lambda 3D.
            </p>

            <p>
              1) <strong>Objeto del software:</strong> El Visualizador 3D es una
              herramienta destinada exclusivamente a la visualización de modelos
              tridimensionales con fines informativos, demostrativos y
              educativos. No constituye ni debe interpretarse como dispositivo
              médico ni como herramienta apta para diagnóstico, planificación
              quirúrgica o toma de decisiones clínicas.
            </p>

            <p>
              2) <strong>Alcance y limitaciones:</strong> El software se
              presenta “tal cual está” y podrá ser modificado, actualizado o
              discontinuado en cualquier momento sin previo aviso. Está
              prohibido su uso como sustituto de criterios médicos o
              quirúrgicos.
            </p>

            <p>
              3) <strong>Responsabilidad:</strong> Lambda 3D no asume
              responsabilidad alguna por el uso del Visualizador más allá de su
              propósito visual. Cualquier interpretación, decisión o acción
              tomada por el usuario en base a la información desplegada será
              bajo su exclusiva responsabilidad. Ni Lambda 3D ni FullDev
              garantizan que la información desplegada sea adecuada para fines
              médicos o quirúrgicos.
            </p>

            <p>
              4) <strong>Propiedad intelectual y colaboración:</strong> El
              software ha sido diseñado y desarrollado por FullDev, en
              colaboración con Lambda 3D, quien provee los modelos anatómicos y
              casos de prueba. Los derechos de propiedad intelectual del
              software corresponden a FullDev, sin perjuicio de los derechos que
              Lambda 3D conserva sobre los modelos y contenidos que provea.
            </p>

            <p>
              5) <strong>Aceptación de términos:</strong> El uso del
              Visualizador implica la aceptación expresa de estos términos y
              condiciones. En caso de no estar de acuerdo, el usuario deberá
              abstenerse de utilizar la plataforma.
            </p>
<p>
  Para más información, podés consultar el aviso legal y la política de privacidad en el pie de página{" "}
  <Link
    href="https://www.lambda3d.com.ar/terminos-condiciones"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 underline hover:opacity-80"
  >
    https://www.lambda3d.com.ar/terminos-condiciones
  </Link>
</p>
            <p>
              Para continuar, debés aceptar estos términos. Si seleccionás
              “Rechazar”, cerrarás automáticamente la sesión.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleReject}>
              Rechazar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              disabled={!acceptEnabled}
              aria-disabled={!acceptEnabled}
              className={!acceptEnabled ? "opacity-60 pointer-events-none" : ""}
            >
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
