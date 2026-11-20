# Informe de mejoras — burnout.ec

Fecha: 2026-11-18 · Rama: `chore/noctis-arranque` (nada subido ni fusionado) · Aprueba: Lander

Lo revisaron tres roles de Noctis por separado. Sus reportes completos están junto a este:

| Revisión | Archivo | Hallazgos |
|---|---|---|
| Código y mantenibilidad (tech lead) | `2026-11-18-tech-lead.md` | 2 bloqueantes · 9 importantes · 9 menores |
| Usabilidad, accesibilidad y diseño (UX/UI) | `2026-11-18-ux-ui.md` | 5 altas · 15 medias · 10 bajas |
| SEO técnico, SEO local y GEO | `2026-11-18-seo-geo.md` | 2 bloqueantes · 10 importantes · 9 menores |

Regla para todo lo aplicado: **no se tocó la identidad de BURNOUT**. Paleta, Poppins y JetBrains Mono, isotipo, tono, orden de bloques y escena siguen como estaban. El pie «Powered by Noctis» sigue el manual de Noctis v4.

## Veredicto

La página está bien hecha para una landing: no tiene dependencias, los comentarios explican el porqué, el consentimiento de medición es correcto, respeta el movimiento reducido, el visor de video es nativo y el formulario maneja errores, tiempo agotado y reintento. Lo que cuesta al mantenerla es que todo está copiado a mano en cuatro páginas y nada se verificaba solo. **Todavía no se puede publicar**: faltan datos del cliente (ver «Bloqueantes»).

## Lo que apliqué en local: un commit por mejora

Para revisar cada uno: `git show <commit>`. Si alguno no te convence, se quita con `git revert <commit>` sin tocar los demás.

| # | Commit | Qué cambia | Qué revisar | Origen |
|---|---|---|---|---|
| 1 | `1b29197` | Pie «POWERED BY» + logo de Noctis v4 a 32 px, enlace a noctisdev.com | Pie de las 4 páginas | Pedido |
| 2 | `6f2d810` | Arranque de Noctis: `CLAUDE.md`, `docs/noctis/`, plantilla de PR, `.claude/` | Solo archivos internos | Pedido |
| 3 | `03f66d1` | **Oktoberfest como pieza destacada** (dos columnas y dos filas, 846×1052 a 1440 px; antes 411×514). Botón «Ver más trabajo en Instagram · @burnout.ec» bajo el portafolio e **ícono de Instagram en la barra** de las 4 páginas, visible también en móvil | Portafolio y barra, escritorio y móvil | Pedido |
| 4 | `4b89b6c` | El bucle de video atiende a **todas** las tarjetas, no solo a la primera. Antes un segundo reel se quedaba muerto | Nada visible hoy; probado con dos videos | Tech lead I1 · UX A2 |
| 5 | `e1c31a6` | La barra aparece cuando se navega con teclado (antes el foco caía en enlaces invisibles). Los enlaces legales del paso 3 del formulario abren en otra pestaña (antes se perdía lo escrito). SVG decorativos ocultos a lectores de pantalla. Las tarjetas sin pieza ya no muestran la mano | Tabulador desde arriba; paso 3 del formulario | UX A1, A4, B3 · Tech lead M5, M6 |
| 6 | `a357d67` | Si falla JavaScript, la portada ya no queda tapada por el contador de carga | Nada visible con JS activo | Tech lead I8a · UX M2 |
| 7 | `470a955` | `.htaccess`: 403 para `.git/`, `.claude/`, `docs/` y archivos con punto; cuatro cabeceras de seguridad | **Solo se comprueba en el servidor** (ver abajo) | Tech lead I4, I5 |
| 8 | `2a7753b` | Título «BURNOUT — Agencia creativa en Quito y Loja, Ecuador» y descripción con la ubicación. Datos estructurados con los tres servicios, «BURNOUT AGENCY» y el correo. `lang="es-EC"`, enlaces a `/`, `sitemap.xml` con fecha y `llms.txt` | Pestaña del navegador y vista en buscadores | SEO I1, I2, I3, I5, M1–M3, M5 |
| 9 | `0f8d51a` | `tools/verificar-paginas.js` (comprueba que las 4 páginas sigan coherentes) y `tools/subir-version.js` (sube el `?v=` sin `sed` a mano). README y `CLAUDE.md` actualizados | Correr `node tools/verificar-paginas.js` | Tech lead I2a, I3a |

Todo lo visible lo revisé en el navegador a 1440 px y a 390 px: sin desbordes ni errores en la consola, y el video destacado se reproduce.

**Tras subir al servidor** (no se puede probar en local porque el servidor local ignora `.htaccess`):

```powershell
curl.exe -sI https://burnout.ec/.git/HEAD
```
```powershell
curl.exe -sI https://burnout.ec/.claude/settings.json
```

Los dos deben responder `403`, y `curl.exe -sI https://burnout.ec/` debe mostrar `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`.

## Bloqueantes para publicar (necesitan datos, no código)

1. **El formulario no envía**: falta la URL del webhook de n8n (`assets/js/app.js`, `ENDPOINT`), el WhatsApp (`WHATSAPP`), el ID de GA4 (`assets/js/medicion.js`) y los datos legales de `privacidad.html`. Los pone el cliente.
2. **El aviso «este sitio no usa cookies» será falso** en cuanto se active GA4, que escribe `_ga`. Hay dos salidas: modo de consentimiento con `analytics_storage: 'denied'` o cambiar el texto. Decide Lander con revisión legal.
3. **Bloqueo de indexación**: `noindex` en `index.html` y `Disallow: /` en `robots.txt` siguen puestos **a propósito**. Se quitan el día que se publique, y después se da de alta Search Console y se envía el sitemap.

## Mejoras propuestas que no apliqué

### Necesitan tu decisión

| Mejora | Por qué no la apliqué | Origen |
|---|---|---|
| Ordenar `style.css` por componente y pasar los 45 estilos en línea a clases | Es un refactor grande. No cambia nada visible, pero exige comparar la geometría antes y después a 1440, 768 y 390 px. Conviene hacerlo en un PR aparte | Tech lead I6, I7 |
| Envolver el formulario en `<form>`: Enter avanza y envía, y se valida cada paso al avanzar | Cambia cómo se comporta el formulario: hay que recorrerlo entero en QA | Tech lead M3 · UX M3, M4 |
| Letra de los campos a 16 px para que el iPhone no amplíe la página al tocarlos | Cambio visual pequeño (de 15 a 16 px) | UX M8 |
| Botón para pausar la marquesina y los bucles de video | Lo exige WCAG 2.2.2 (nivel A), pero añade un control a la interfaz | UX M10 |
| Qué hacer con «DURENO 1» y «La vuelta a Zamora» mientras no tengan video: ocultarlas, dejarlas o poner «Próximamente» | Contenido del cliente | UX A3 · SEO I10 |
| Seguro por tiempo si `app.js` no llega (ocultar el preloader a los ~4 s) | Toca el tiempo del preloader | Tech lead I8b |
| HSTS y una Content-Security-Policy | Se activan por etapas y con el sitio ya publicado | Tech lead I4 |
| GitHub Action que corra `verificar-paginas.js` en cada PR | Infraestructura nueva, aunque mínima | Tech lead I3b |
| Página 404 propia | Otra copia más de cabecera y pie que mantener | SEO M8 |
| Reemplazar las filas de ejemplo de `docs/noctis/plan.md` con estos paquetes | El plan lo aprueba Lander | Tech lead M8 |
| Video destacado más nítido: recodificarlo a 970×1214 desde el máster (`IMG_4722.MP4`) | Necesita ffmpeg, que no está instalado y cuya instalación se bloqueó | Pedido |

### Necesitan datos o aprobación del cliente

- Una frase visible en el pie: «BURNOUT es una agencia creativa de Quito y Loja, Ecuador». Es la mejora de visibilidad en respuestas de IA con más efecto (SEO I4).
- `VideoObject` para el video de Oktoberfest: falta la fecha de publicación, la tesis de la pieza y el enlace del reel en Instagram (SEO I6).
- Ficha de Google Business como negocio de área de servicio: ¿tiene oficina? ¿publicará un teléfono? (SEO I7)
- Los términos prohíben el rastreo y el entrenamiento de IA, mientras se busca que las IA citen a BURNOUT. Lo ve el abogado (SEO I8).
- Un solo nombre para la oferta (diagnóstico, sesión estratégica o auditoría) y un WhatsApp visible (UX M11, M13).
- Las piezas del portafolio con su tesis y sus derechos, si se suman más. No se incrustan desde Instagram, porque cargan cookies de Meta antes del consentimiento (UX y SEO).

## Siguiente paso

1. Revisa los commits 3 a 9 (`git show <commit>`) y dime cuáles quitas.
2. Con tu aprobación: push de `chore/noctis-arranque` y PR a `main`. Hostinger publica desde `main`, pero mientras sigan el `noindex` y el `Disallow` el sitio no aparece en buscadores.
3. Después del merge: los dos `curl.exe` de arriba.
