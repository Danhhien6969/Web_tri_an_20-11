// Return only predefined codes. Driver messages can contain private connection details.
export function databaseDiagnostic(error) {
  const errors = [error]; const seen = new Set();
  for (let i = 0; i < errors.length && i < 20; i++) {
    const current = errors[i];
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (current.cause) errors.push(current.cause);
    if (current.reason?.servers instanceof Map) {
      for (const server of current.reason.servers.values()) if (server.error) errors.push(server.error);
    }
  }
  if (errors.some(e => e?.message === 'MONGODB_NOT_CONFIGURED')) return 'MONGODB_URI_MISSING';
  if (errors.some(e => e?.message === 'INVALID_ADMIN_CONFIG')) return 'ADMIN_CONFIG_INVALID';
  if (errors.some(e => e?.code === 18 || (e?.code === 8000 && /bad auth|authentication failed/i.test(e.message || '')))) return 'MONGODB_AUTH_FAILED';
  if (errors.some(e => e?.code === 13)) return 'MONGODB_PERMISSION_DENIED';
  if (errors.some(e => e?.name === 'MongoParseError')) return 'MONGODB_URI_INVALID';
  if (errors.some(e => /SSL|TLS/.test(String(e?.code || '')))) return 'MONGODB_TLS_FAILED';
  if (errors.some(e => ['ENOTFOUND', 'EAI_AGAIN', 'ESERVFAIL'].includes(e?.code))) return 'MONGODB_DNS_FAILED';
  if (errors.some(e => e?.name === 'MongoServerSelectionError' || e?.name === 'MongoNetworkError')) return 'MONGODB_NETWORK_FAILED';
  return 'DATABASE_UNAVAILABLE';
}
