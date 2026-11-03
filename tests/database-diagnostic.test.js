import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseDiagnostic } from '../lib/database-diagnostic.js';
test('diagnostics distinguish configuration, auth and nested TLS errors', () => {
  assert.equal(databaseDiagnostic(new Error('MONGODB_NOT_CONFIGURED')), 'MONGODB_URI_MISSING');
  assert.equal(databaseDiagnostic(new Error('INVALID_ADMIN_CONFIG')), 'ADMIN_CONFIG_INVALID');
  assert.equal(databaseDiagnostic({ code: 18 }), 'MONGODB_AUTH_FAILED');
  assert.equal(databaseDiagnostic({ code: 13 }), 'MONGODB_PERMISSION_DENIED');
  assert.equal(databaseDiagnostic({ name: 'MongoServerSelectionError', reason: { servers: new Map([['private-host', { error: { cause: { code: 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' } } }]]) } }), 'MONGODB_TLS_FAILED');
});
test('diagnostics never expose arbitrary driver details or credentials', () => {
  const error = new Error('mongodb+srv://private-user:secret@private-host/');
  assert.equal(databaseDiagnostic(error), 'DATABASE_UNAVAILABLE');
  error.cause = error;
  assert.equal(databaseDiagnostic(error), 'DATABASE_UNAVAILABLE');
});
