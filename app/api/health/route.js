import { getDatabase } from '../../../lib/mongodb.js';
import { databaseDiagnostic } from '../../../lib/database-diagnostic.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { await (await getDatabase()).command({ ping: 1 }); return Response.json({ status: 'ok', database: 'connected' }); }
  catch (error) {
    const code = databaseDiagnostic(error);
    console.error('[database-health]', code);
    return Response.json({ status: 'unavailable', database: 'disconnected', code }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
