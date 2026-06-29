import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE } from "./session-cookie";
const TTL = "7d";

function secretKey(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string;
  role: Role;
  email: string;
};

export async function signSession(payload: SessionPayload) {
  const key = secretKey();
  if (!key) throw new Error("AUTH_SECRET manquant ou trop court (min 16 caractères)");
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const key = secretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const role = payload.role as Role | undefined;
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!sub || !role) return null;
    return { sub, role, email };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (!t) return null;
  return verifySessionToken(t);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 0 });
}
