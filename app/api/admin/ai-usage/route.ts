import { adminResponse, adminSession } from "../../../../lib/admin-session";
import { getAiUsageDashboard, type AiUsagePeriodInput } from "../../../../lib/ai-usage";

export const dynamic = "force-dynamic";

function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado." }, 401);
    const params = new URL(request.url).searchParams;
    const mode = params.get("period");
    const requestedPage = Number(params.get("page") || 1);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    let period: AiUsagePeriodInput;

    if (mode === "all") {
      period = { mode: "all" };
    } else if (mode === "custom") {
      const startDate = params.get("start");
      const endDate = params.get("end");
      if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) {
        return adminResponse({ error: "Informe um período válido." }, 400);
      }
      const dayCount = Math.floor((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
      if (dayCount > 3660) return adminResponse({ error: "O período personalizado pode ter no máximo 10 anos." }, 400);
      period = { mode: "custom", startDate, endDate };
    } else {
      const requestedDays = Number(params.get("days") || 30);
      const days = [7, 30, 90, 365].includes(requestedDays) ? requestedDays : 30;
      period = { mode: "days", days };
    }

    return adminResponse(await getAiUsageDashboard(period, page));
  } catch (error) {
    console.error("[admin-ai-usage-error]", error);
    return adminResponse({ error: "Não foi possível carregar o uso da Amanda." }, 503);
  }
}
