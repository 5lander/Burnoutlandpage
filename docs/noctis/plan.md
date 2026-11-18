# Plan — BURNOUT · web (burnout.ec)

Nivel: L · Inicio: [POR CONFIRMAR] · Entrega comprometida: [POR CONFIRMAR]

Aprobado: pendiente

> Cuando Lander aprueba el plan, cambia la línea de arriba por `Aprobado: Lander — 2026-11-05` (con la fecha real). Sin una fecha real, `/noctis:construir` no arranca.

## Paquetes

Un paquete es lo que se puede construir, revisar y verificar de una vez. Un hito agrupa paquetes que salen en un mismo PR: mantenlo por debajo de ~400 líneas de producción si el cambio es de riesgo (`noctis-stack/references/git.md`).

| Hito | Paquete | Qué entrega | Requerimientos | Rol | Depende de | Estado |
|---|---|---|---|---|---|---|
| H1 agendar | P1 | Endpoint para crear cita | RQ-01, RQ-02 | dev-backend | — | pendiente |
| H1 agendar | P2 | Pantalla de nueva cita | RQ-01 | dev-frontend | P1 | pendiente |

Estados: `pendiente` · `en curso` · `listo para revisión` (PR abierto) · `bloqueado (motivo)` · `hecho` (merge hecho por Lander).

La columna **Rol** es opcional: si se deja vacía, `/noctis:construir` elige el rol por lo que toca el paquete. **Depende de** puede nombrar paquetes del mismo hito o hitos completos; un hito que depende de otro espera su merge.

## Hitos
| # | Hito | Requerimientos | Responsable | Fecha | Estado |
|---|---|---|---|---|---|
| 1 | | RQ-01, RQ-02 | | (prov.) | pendiente |

## Bloqueos
- <qué falta, de quién, desde cuándo>

## Riesgos
- <riesgo> · probabilidad · impacto · qué hacemos

## Avance (una línea por día con trabajo)
- AAAA-MM-DD · <qué se hizo> · <qué sigue>
