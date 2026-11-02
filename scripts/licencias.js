// Verifica las licencias de las dependencias a partir del SBOM (CycloneDX).
// Bloquea si una dependencia declara una licencia que no está en la lista permitida.
const fs = require('node:fs');

const PERMITIDAS = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'BlueOak-1.0.0']);

const archivo = process.argv[2] || 'sbom.cdx.json';
const sbom = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const componentes = (sbom.components || []).filter((c) => c.type === 'library');

const rechazadas = [];
const sinLicencia = [];
for (const c of componentes) {
  const ids = (c.licenses || [])
    .map((l) => (l.license && (l.license.id || l.license.name)) || l.expression)
    .filter(Boolean);
  if (ids.length === 0) {
    sinLicencia.push(`${c.name}@${c.version}`);
  } else if (!ids.some((id) => PERMITIDAS.has(id))) {
    rechazadas.push(`${c.name}@${c.version} (${ids.join(', ')})`);
  }
}

console.log(`Componentes analizados: ${componentes.length}`);
if (sinLicencia.length) {
  console.log(`Sin licencia declarada (revisar manualmente): ${sinLicencia.join('; ')}`);
}
if (rechazadas.length) {
  console.error(`Licencias no permitidas: ${rechazadas.join('; ')}`);
  console.error('La versión se bloquea hasta la revisión de Legales y Cumplimiento.');
  process.exit(1);
}
console.log('Todas las licencias declaradas están permitidas.');
