"use client";
import { auth } from "./firebase";
import { onIdTokenChanged } from "firebase/auth";

let wired = false;
export function initAuthSessionSync() {
  if (wired) return;
  wired = true;
  onIdTokenChanged(auth, async (u) => {
    const token = u ? await u.getIdToken() : "";
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  });
}
