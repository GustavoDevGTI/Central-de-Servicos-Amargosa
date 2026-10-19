import { activeCatalog } from '../../../lib/catalog-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (process.env.DATABASE_URL) await activeCatalog();
    return Response.json({ status: 'ok', service: 'central-servicos-amargosa' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ status: 'unavailable', service: 'central-servicos-amargosa' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
