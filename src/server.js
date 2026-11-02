const http = require('node:http');
const ms = require('ms');
const { consultarSaldo, transferir } = require('./transferencias');

const PUERTO = Number(process.env.PORT) || 3000;
const TAMANIO_MAXIMO = 10 * 1024;
const inicio = Date.now();

const CABECERAS_SEGURIDAD = {
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cache-Control': 'no-store',
};

function responder(res, estado, cuerpo, tipo = 'application/json; charset=utf-8') {
  res.writeHead(estado, { ...CABECERAS_SEGURIDAD, 'Content-Type': tipo });
  res.end(tipo.startsWith('application/json') ? JSON.stringify(cuerpo) : cuerpo);
}

const PAGINA = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Andina Pagos - POC</title></head>
<body><h1>Andina Pagos</h1><p>Aplicación de ejemplo para la prueba de concepto de seguridad en el desarrollo.</p></body></html>`;

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let datos = '';
    req.on('data', (parte) => {
      datos += parte;
      if (datos.length > TAMANIO_MAXIMO) {
        reject(new Error('Cuerpo demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(datos));
    req.on('error', reject);
  });
}

async function manejar(req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/') {
    return responder(res, 200, PAGINA, 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && url.pathname === '/health') {
    return responder(res, 200, { estado: 'ok', activo: ms(Date.now() - inicio) });
  }
  if (req.method === 'GET' && url.pathname === '/api/saldo') {
    const resultado = consultarSaldo(url.searchParams.get('cuenta'));
    return responder(res, resultado.ok ? 200 : 404, resultado);
  }
  if (req.method === 'POST' && url.pathname === '/api/transferencias') {
    let solicitud;
    try {
      solicitud = JSON.parse(await leerCuerpo(req));
    } catch {
      return responder(res, 400, { ok: false, error: 'JSON inválido' });
    }
    const resultado = transferir(solicitud);
    return responder(res, resultado.ok ? 201 : 422, resultado);
  }
  return responder(res, 404, { ok: false, error: 'No encontrado' });
}

function crearServidor() {
  return http.createServer((req, res) => {
    manejar(req, res).catch(() => responder(res, 500, { ok: false, error: 'Error interno' }));
  });
}

if (require.main === module) {
  crearServidor().listen(PUERTO, () => {
    console.log(`Andina Pagos POC escuchando en el puerto ${PUERTO}`);
  });
}

module.exports = { crearServidor };
