"use client";

/**
 * ---------------------------------------------------------------------------
 * DUMMY AUTH (frontend-only)
 * ---------------------------------------------------------------------------
 * There is no backend yet, so this validates against hardcoded demo
 * credentials and keeps a flag in sessionStorage. Replace `login()` with a
 * real API call + secure session cookie once the backend is available; the
 * rest of the app only depends on `isAuthenticated()` / `logout()`.
 * ---------------------------------------------------------------------------
 */

const SESSION_KEY = "lhp.staff.session";

/** Demo credentials — shown as a hint on the login screen. */
export const DEMO_CREDENTIALS = {
  email: "staff@lhp.com",
  password: "lhp1234",
};

export function login(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password;
  if (ok && typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  }
  return ok;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_KEY) === "1";
}
