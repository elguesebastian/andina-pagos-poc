const test = require('node:test');
const assert = require('node:assert');
const { crearServidor } = require('../src/server');

let servidor;
let base;

test.before(async () => {
  servidor = crearServidor();
  await new Promise((resolve) => servidor.listen(0, resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

test.after(() => servidor.close());

test('la página principal responde con cabeceras de seguridad', async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
  assert.ok(res.headers.get('content-security-policy'));
});

test('consulta el saldo de una cuenta existente', async () => {
  const res = await fetch(`${base}/api/saldo?cuenta=AP-0001`);
  const cuerpo = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(cuerpo.saldo, 150000);
});

test('rechaza una transferencia con monto inválido', async () => {
  const res = await fetch(`${base}/api/transferencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origen: 'AP-0001', destino: 'AP-0002', monto: -10 }),
  });
  assert.strictEqual(res.status, 422);
});

test('realiza una transferencia válida', async () => {
  const res = await fetch(`${base}/api/transferencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origen: 'AP-0001', destino: 'AP-0002', monto: 1000 }),
  });
  const cuerpo = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(cuerpo.saldoOrigen, 149000);
});
