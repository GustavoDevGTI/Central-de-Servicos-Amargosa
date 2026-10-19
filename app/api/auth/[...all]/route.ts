import { auth, assertAuthConfigured } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const publicAuthPaths = new Set([
  "/api/auth/sign-in/username", "/api/auth/sign-in/email",
  "/api/auth/sign-out", "/api/auth/get-session", "/api/auth/ok", "/api/auth/error",
]);

async function handle(request: Request) {
  try {
    assertAuthConfigured();
    // Account administration goes through our guarded gateway so direct plugin
    // endpoints cannot bypass self-access and last-administrator protections.
    const path = decodeURIComponent(new URL(request.url).pathname).replace(/\/+/g, "/").replace(/\/$/, "");
    if (!publicAuthPaths.has(path)) {
      return Response.json({ error: "Use o controle de usuários do admin." }, { status: 403 });
    }
    return await auth.handler(request);
  } catch (error) {
    console.error("Falha no endpoint de autenticação", error);
    return Response.json({ error: "Autenticação indisponível" }, { status: 503 });
  }
}

export const GET = handle;
export const POST = handle;
