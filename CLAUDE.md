# BURNOUT · burnout.ec

Sitio estático (HTML, CSS y JS sin compilar) de la agencia BURNOUT. Las reglas de despliegue, la huella de versión `?v=` y las herramientas de medición están en `README.md` y `tools/LEEME.md`.

## Noctis
Área: Servicios
Nivel: L
Requerimientos: C:\Noctis\Clientes\burnout\proyectos\2026-09-burnout-web\desarrollo\ (sin `08-requerimientos.md`: es una landing)
Cambios: C:\Noctis\Clientes\burnout\proyectos\2026-09-burnout-web\desarrollo\cambios.md
ADR: docs/noctis/adr/
Plan: docs/noctis/plan.md
Estado: docs/noctis/estado.md
Decisiones: docs/noctis/decisiones.md
Verificación: node tools/verificar-paginas.js (sitio estático sin package.json, lint ni pruebas: solo coherencia entre páginas)
Verificación rápida: node tools/verificar-paginas.js
Verificación extra: `node tools/subir-version.js` — cada vez que cambie un CSS o JS · `node tools/validar-jsonld.js index.html <schemaorg-current-https.jsonld>` — cuando cambie el JSON-LD
CI: ninguno
Rama base: main
Plugin: C:\Projects\noctis-org
QA: docs/noctis/qa/
Despliegue: docs/noctis/despliegue/registro.md
Lecciones: docs/noctis/lecciones/
Marca: BURNOUT, sin manual registrado (C:\Noctis\Clientes\burnout\marcas\ está vacía; manda la identidad ya construida en `assets/css/style.css`). El pie «Powered by Noctis» sigue el Manual de Marca Noctis v4.0: C:\Noctis\Clientes\noctis\marcas\noctis\MARCA.md
Proyecto: C:\Noctis\Clientes\burnout\proyectos\2026-09-burnout-web\PROYECTO.md
Diseño: docs/noctis/diseno/bitacora.md
DevOps ejecuta en producción: no
Datos: solo sintéticos fuera de producción (ver noctis-datos)
Roles: @agent-noctis:<rol> (lista completa y estado: /noctis:equipo)
Construcción: Lander aprueba el plan con la línea «Aprobado: Lander — AAAA-MM-DD» y corre /noctis:construir
