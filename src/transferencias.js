// Módulo simulado de transferencias de la billetera.
// Los datos se guardan en memoria: es una aplicación de ejemplo para la POC.


const cuentas = new Map([
  ['AP-0001', { titular: 'Cuenta de prueba 1', saldo: 150000 }],
  ['AP-0002', { titular: 'Cuenta de prueba 2', saldo: 80000 }],
]);

const MONTO_MAXIMO = 500000;

function consultarSaldo(cuenta) {
  const datos = cuentas.get(cuenta);
  if (!datos) {
    return { ok: false, error: 'Cuenta inexistente' };
  }
  return { ok: true, cuenta, saldo: datos.saldo };
}

function validarTransferencia(solicitud) {
  if (!solicitud || typeof solicitud !== 'object') {
    return 'Solicitud inválida';
  }
  const { origen, destino, monto } = solicitud;
  if (typeof origen !== 'string' || typeof destino !== 'string') {
    return 'Las cuentas de origen y destino son obligatorias';
  }
  if (!cuentas.has(origen) || !cuentas.has(destino)) {
    return 'Cuenta inexistente';
  }
  if (origen === destino) {
    return 'La cuenta de destino debe ser distinta de la de origen';
  }
  if (!Number.isInteger(monto) || monto <= 0 || monto > MONTO_MAXIMO) {
    return 'Monto inválido';
  }
  if (cuentas.get(origen).saldo < monto) {
    return 'Saldo insuficiente';
  }
  return null;
}

function transferir(datos) {
  // Combina la solicitud con los valores por defecto sin usar merge profundo,
  // para evitar la contaminación de prototipos (prototype pollution).
  const solicitud = { moneda: 'ARS', ...(datos && typeof datos === 'object' ? datos : {}) };
  const error = validarTransferencia(solicitud);
  if (error) {
    return { ok: false, error };
  }
  const { origen, destino, monto } = solicitud;
  cuentas.get(origen).saldo -= monto;
  cuentas.get(destino).saldo += monto;
  return { ok: true, origen, destino, monto, moneda: solicitud.moneda, saldoOrigen: cuentas.get(origen).saldo };
}

module.exports = { consultarSaldo, transferir, validarTransferencia };
