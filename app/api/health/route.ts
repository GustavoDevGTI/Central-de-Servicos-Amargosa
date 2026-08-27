export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    status: 'ok',
    service: 'central-servicos-amargosa',
  });
}
