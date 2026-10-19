import { auth, assertAuthConfigured } from "./auth";
import { isAdminRole } from "./admin-permissions";

export async function adminSession(request: Request) {
  assertAuthConfigured();
  const session = await auth.api.getSession({ headers: request.headers });
  return session && !session.user.banned && isAdminRole(session.user.role) ? session : null;
}

export function adminResponse(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
