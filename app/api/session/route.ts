import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const iss = process.env.SESSION_ISS!;
const aud = process.env.SESSION_AUD!;
const ttl = Number(process.env.SESSION_TTL_SECONDS || 3600);
const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });
const adminAuth = getAuth(app);

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: "" }));
  const jar = cookies();

  if (!token) {
    jar.delete("firebase_token");
    jar.delete("app_session");
    return NextResponse.json({ ok: true });
  }

  const decoded = await adminAuth.verifyIdToken(token, true);
  const role = (decoded.role as string) ?? "user";
  const uid = decoded.uid;

  jar.set("firebase_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });

  const appJwt = await new jose.SignJWT({ uid, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(iss)
    .setAudience(aud)
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(secret);

  jar.set("app_session", appJwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });

  return NextResponse.json({ ok: true });
}
