import { getDatabase } from '../../../lib/mongodb.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { await (await getDatabase()).command({ ping: 1 }); return Response.json({ status: 'ok', database: 'connected' }); }
  catch { return Response.json({ status: 'unavailable', database: 'disconnected' }, { status: 503 }); }
}
