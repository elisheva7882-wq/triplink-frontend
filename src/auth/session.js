const NAME_ID = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const EMAIL = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const ROLE = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function buildSession(loginResponse, fallbackEmail) {
  const token = loginResponse?.token;
  const claims = token ? decodeJwt(token) : {};

  return {
    userId: Number(loginResponse?.userId ?? claims[NAME_ID] ?? claims.sub) || null,
    email: loginResponse?.email ?? claims[EMAIL] ?? claims.email ?? fallbackEmail ?? "",
    role: loginResponse?.role ?? claims[ROLE] ?? claims.role ?? "User"
  };
}

export function readSession() {
  const token = localStorage.getItem("triplink_token");
  if (!token) return null;

  try {
    const stored = JSON.parse(localStorage.getItem("triplink_user")) || {};
    return buildSession({ ...stored, token }, stored.email);
  } catch {
    return buildSession({ token }, "");
  }
}
