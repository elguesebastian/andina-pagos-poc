// Evalúa el reporte JSON de ZAP: bloquea la versión si hay alertas de riesgo alto.
const fs = require('node:fs');

const archivo = process.argv[2] || 'zap/zap-base.json';
const reporte = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const NOMBRES = { 3: 'Alto', 2: 'Medio', 1: 'Bajo', 0: 'Informativo' };

const alertas = (reporte.site || []).flatMap((s) => s.alerts || []);
const conteo = { 3: 0, 2: 0, 1: 0, 0: 0 };
for (const a of alertas) conteo[Number(a.riskcode)] += 1;

console.log('Alertas de ZAP por riesgo:');
for (const r of [3, 2, 1, 0]) console.log(`  ${NOMBRES[r]}: ${conteo[r]}`);

const altas = alertas.filter((a) => Number(a.riskcode) >= 3);
if (altas.length) {
  console.error('Alertas de riesgo alto:');
  for (const a of altas) console.error(`  - ${a.name}`);
  console.error('La versión se bloquea (criterios de aprobación y bloqueo).');
  process.exit(1);
}
console.log('Sin alertas de riesgo alto: la versión puede continuar.');
