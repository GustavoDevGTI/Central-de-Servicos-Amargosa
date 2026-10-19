import { adminResponse, adminSession } from "../../../../lib/admin-session";
import { canManageUsers } from "../../../../lib/admin-permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await adminSession(request);
    return adminResponse(session ? { user: { id: session.user.id, name: session.user.name, role: session.user.role }, canManageUsers: canManageUsers(session.user.role) } : { user: null }, session ? 200 : 401);
  } catch {
    return adminResponse({ error: "Admin indisponível" }, 503);
  }
}
