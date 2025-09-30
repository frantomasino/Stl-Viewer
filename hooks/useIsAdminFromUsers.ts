"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export function useIsAdminFromUsers() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      // Limpio suscripción previa
      if (unsubDoc) { unsubDoc(); unsubDoc = undefined; }

      if (!u) {
        // console.log("[useIsAdmin] sin usuario logueado");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // console.log("[useIsAdmin] uid actual:", u.uid, " email:", u.email);

      const ref = doc(db, "users", u.uid);
      unsubDoc = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            // console.warn("[useIsAdmin] /users/{uid} NO existe para uid:", u.uid);
            setIsAdmin(false);
            setLoading(false);
            return;
          }
          const data = snap.data() as any;
          const role = data?.role;
          // console.log("[useIsAdmin] doc leído:", snap.id, "role:", role);
          setIsAdmin(role === "ADMIN");
          setLoading(false);
        },
        (err) => {
          // console.error("[useIsAdmin] error leyendo /users/{uid}:", err);
          setIsAdmin(false);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return { isAdmin, loading };
}
