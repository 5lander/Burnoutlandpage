# BURNOUT — landing

Sitio de una sola página para [burnout.ec](https://burnout.ec/). HTML, CSS y JS
a mano: **sin framework, sin dependencias, sin paso de compilación**. Lo que hay
en el repositorio es exactamente lo que se sirve.

---

> ## ⚠️ ESTE DESPLIEGUE NO ES LANZABLE AL PÚBLICO
>
> Sirve para ver el sitio en su dominio y seguir trabajando contra producción.
> No para enseñárselo a un cliente ni para que lo encuentre nadie. Falta:
>
> - **El formulario no envía.** `ENDPOINT` sigue en marcador: valida, muestra el
>   payload y avisa en pantalla de que no está conectado. Ningún lead llega a
>   ninguna parte.
> - **No hay textos legales.** La política de privacidad son ocho apartados
>   marcados como pendientes, y el consentimiento del formulario y el aviso de
>   medición llevan una etiqueta naranja visible que dice *Texto pendiente de
>   abogado*.
> - **No hay medición.** `MEDICION_ID` sigue en marcador: el aviso de cookies
>   funciona y los eventos se registran en memoria, pero no se carga ninguna
>   herramienta y no sale ninguna petición.
> - **Dos de los tres reels del portafolio siguen siendo rectángulos de
>   color.** Solo *Oktoberfest Loja* es una pieza real.
>
> Por eso la indexación está bloqueada: ver
> [Bloqueo de indexación](#bloqueo-de-indexación). La lista completa de lo que
> falta está en [Marcadores pendientes](#marcadores-pendientes) y en
> [Antes de publicar](#antes-de-publicar).

---

## Índice

- [Cómo levantarlo en local](#cómo-levantarlo-en-local)
- [Estructura](#estructura)
- [Despliegue](#despliegue)
- [Bloqueo de indexación](#bloqueo-de-indexación)
- [`tools/` en producción](#tools-en-producción)
- [Qué revisar tras el primer push](#qué-revisar-tras-el-primer-push)
- [Marcadores pendientes](#marcadores-pendientes)
- [Antes de publicar](#antes-de-publicar)
- [El reel del portafolio](#el-reel-del-portafolio)
- [Datos estructurados](#datos-estructurados)
- [Reglas del proyecto](#reglas-del-proyecto)

---

## Cómo levantarlo en local

Hace falta Python 3 para el servidor y, para las herramientas de medida, Chrome
y Node. El sitio en sí no necesita nada.

```bash
python tools/servidor-pruebas.py          # http://127.0.0.1:8733/
python tools/servidor-pruebas.py --4g     # lo mismo, limitado a 4G lenta
```

**No abras `index.html` con doble clic.** Desde `file://` el navegador bloquea
las fuentes autoalojadas por CORS y verías el sitio con la tipografía de
respaldo. Siempre por `http://`.

El servidor además recibe el POST del formulario en `/webhook` (y en
`/webhook-500` si quieres provocar un error 500) y guarda el cuerpo en
`tools/recibido.json`. Para probar el envío de verdad, apunta `ENDPOINT` a
`http://127.0.0.1:8733/webhook` mientras trabajas, y **devuélvelo al marcador
antes de subir**.

Para auditar el consentimiento y la medición hace falta el otro servidor, que
parchea al vuelo las constantes marcadas y anota todas las peticiones:

```bash
python tools/servidor-medicion.py
# http://127.0.0.1:8734/tools/auditar-medicion.html
# http://127.0.0.1:8734/index.html?frag=auditar-medicion-raf.html
```

El detalle de cada herramienta está en [`tools/LEEME.md`](tools/LEEME.md).

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | La página. Markup, metadatos, Open Graph y JSON-LD. |
| `gracias.html` | Confirmación tras enviar el formulario. `noindex`. Es la que mide la conversión. |
| `privacidad.html` | Política de privacidad. `noindex`. Contenido pendiente de abogado. |
| `assets/css/style.css` | Toda la hoja de estilos, incluidas las 12 declaraciones `@font-face`. |
| `assets/js/scene.js` | Escena de partículas del canvas. Fases, easings y umbrales calibrados: **no se tocan**. |
| `assets/js/app.js` | Preloader, apariciones al hacer scroll y el formulario de tres pasos. |
| `assets/js/medicion.js` | Consentimiento, aviso de cookies y los seis eventos. Nada se carga antes de aceptar. |
| `assets/fonts/` | Poppins 300/400/500/700 y JetBrains Mono 400/500, subconjuntos latin y latin-ext. 10 archivos, 112 KB en disco, ~62 KB por visita. |
| `assets/img/og.jpg` | Imagen de compartición, 1200×630, 28 KB. Generada por código desde el path del isotipo. |
| `assets/video/` | El reel de *Oktoberfest Loja*, en WebM y MP4, más su fotograma de portada. Ver [El reel del portafolio](#el-reel-del-portafolio). |
| `assets/img/favicon.svg` · `assets/img/icono-512.png` | Iconos, derivados del mismo path. |
| `favicon.ico` · `apple-touch-icon.png` | En la raíz porque los navegadores los piden ahí. |
| `.htaccess` | HTTPS forzado, dominio sin www, caché, compresión, sin listados y `tools/` denegado. |
| `robots.txt` | **Hoy bloquea la indexación entera.** Ver [Antes de publicar](#antes-de-publicar). |
| `sitemap.xml` | Solo la portada. Las otras dos páginas son `noindex`. |
| `tools/` | Utilidades de desarrollo. No forman parte del sitio. Ver [`tools/LEEME.md`](tools/LEEME.md). |

## Despliegue

Integración Git de Hostinger apuntando a `public_html`. No hay build: Hostinger
clona la rama y copia los archivos tal cual.

1. Sube el repositorio a GitHub y comprueba que `main` está al día.
2. En hPanel, dominio → **Avanzado → GIT** (el panel puede llamarlo *Git
   Deployment*).
3. **Repositorio**: la URL del repo. **Rama**: `main`.
   **Directorio de instalación**: `public_html`.
4. Crea el despliegue y pulsa **Deploy** para el primer tirón.
5. Copia la **webhook URL** que da Hostinger y pégala en GitHub, en
   *Settings → Webhooks*, con content type `application/json`. A partir de ahí
   cada push a `main` despliega solo.
6. Recorre entera la lista de
   [Qué revisar tras el primer push](#qué-revisar-tras-el-primer-push).

Si `public_html` ya tiene archivos, Hostinger se niega a clonar encima. Hay que
vaciarlo antes (guarda copia de lo que hubiera).

## Bloqueo de indexación

Hoy hay dos cerrojos puestos, y se quitan los dos a la vez para publicar
(punto 1 de [Antes de publicar](#antes-de-publicar)):

| Dónde | Qué hace |
|---|---|
| `robots.txt` → `Disallow: /` | Impide **rastrear**. Ningún buscador descarga la página. |
| `index.html` → `<meta name="robots" content="noindex, nofollow">` | Impide **indexar**. Le dice al buscador que no la incluya aunque la haya leído. |

**Los dos juntos no suman: se estorban.** Un buscador solo lee el `meta
noindex` si puede rastrear la página, y el `Disallow` se lo impide. Mientras
convivan, el `meta` no llega a leerse, y sigue siendo posible que Google liste
la URL a secas —sin título ni descripción— si alguien enlaza el dominio. Que es
exactamente lo que se quería evitar.

**Si lo que importa es la garantía de no aparecer**, la combinación correcta es
la contraria: dejar `robots.txt` en `Allow: /` y quedarse solo con el `meta
noindex`. El buscador entra, lee que no debe indexar y obedece; no hay listado
de URL a secas posible. La contrapartida es que sí descarga la página.

Se han dejado los dos porque el `Disallow` es la única defensa frente a
rastreadores que ignoran el `meta`, y el `meta` es la única frente a los que
ignoran `robots.txt`. Pero **conviene decidirlo a conciencia**, no dejarlo así
por inercia.

## `tools/` en producción

**Respuesta corta: no, no hay forma de que `tools/` no llegue a `public_html`
con este montaje. La única defensa es el `.htaccess`, y hay que verificarla a
mano tras el primer push.**

El porqué:

- La integración Git clona la rama entera. Todo archivo versionado en `main`
  acaba en `public_html`.
- `.gitignore` no sirve: solo afecta a archivos sin versionar, y estos ya lo
  están.
- `.gitattributes` con `export-ignore` tampoco: solo actúa en `git archive`, no
  en el `clone`/`pull` que hace Hostinger.

Lo que sí hay montado, en dos capas, ambas con la misma dependencia — que el
servidor lea los `.htaccess`:

1. `tools/.htaccess` con `Require all denied`.
2. En el `.htaccess` raíz, `RewriteRule ^tools/ - [F,L]` y un `<FilesMatch>` que
   deniega cualquier `.py` y `.md` del sitio, estén donde estén.

**La única garantía estructural sería que la rama desplegada no contuviera
`tools/`**: mantener `main` para el sitio y otra rama para el desarrollo con las
herramientas, y apuntar Hostinger a `main`. Cuesta llevar dos ramas en paralelo,
así que lo dejo planteado y lo decides tú.

Qué habría dentro si la defensa fallara: dos servidores de pruebas en Python
(que en un hosting compartido se sirven como texto plano, no se ejecutan), los
arneses HTML de auditoría, y el `d` del path del isotipo, que de todos modos ya
va literal dentro de `index.html`. **No hay credenciales, ni claves, ni datos de
nadie.** La exposición real es que se indexen páginas de desarrollo y que quede
feo, no una fuga.

## Qué revisar tras el primer push

En este orden. Cada paso dice qué tiene que verse.

**1 · Han llegado los archivos**

Abre `https://burnout.ec/`. Debe verse el preloader con el contador subiendo a
100 y, al retirarse, la escena de partículas montando el isotipo al hacer
scroll. Si sale un índice de directorio o un 403, el despliegue no ha copiado
nada a `public_html`.

**Si sale un 500 en todo el sitio**, la causa casi seguro es el `.htaccess`: no
he podido comprobar su sintaxis contra un Apache real, no lo tengo aquí. La
primera sospechosa es la línea `Options -Indexes`, que algunos hospedajes no
permiten en un `.htaccess`. Coméntala y vuelve a subir. Si el 500 sigue, deja el
`.htaccess` en solo las cuatro líneas del bloque de HTTPS y ve devolviendo los
bloques de uno en uno.

**2 · HTTPS y dominio canónico**

```bash
curl -sI http://burnout.ec/       | head -n 3   # 301 -> https://burnout.ec/
curl -sI https://www.burnout.ec/  | head -n 3   # 301 -> https://burnout.ec/
curl -sI http://www.burnout.ec/   | head -n 3   # 301 -> https://burnout.ec/
```

Las tres deben acabar en `https://burnout.ec/`, con **una sola** redirección.

**3 · Que no haya bucle de redirecciones**

```bash
curl -sIL https://burnout.ec/ | grep -c "^HTTP/"
```

Debe imprimir `1`. Si imprime más, o `curl` corta por exceso de saltos, el
servidor termina TLS en un proxy y `%{HTTPS}` llega en `off`: la corrección está
comentada dentro del propio `.htaccess`.

**4 · `tools/` no se sirve**

```bash
curl -sI https://burnout.ec/tools/servidor-medicion.py | head -n 1   # 403 o 404
curl -sI https://burnout.ec/tools/auditar-medicion.html | head -n 1  # 403 o 404
curl -sI https://burnout.ec/README.md | head -n 1                    # 403 o 404
```

**Si alguna devuelve 200, para.** Significa que el servidor no está aplicando el
`.htaccess`. Solución inmediata: borrar `tools/` a mano por el gestor de
archivos de hPanel, y después decidir si se pasa al esquema de dos ramas
descrito arriba.

**5 · Sin listados de directorio**

```bash
curl -sI https://burnout.ec/assets/fonts/ | head -n 1    # 403
curl -sI https://burnout.ec/assets/img/   | head -n 1    # 403
```

**6 · Iconos, sin 404**

```bash
curl -sI https://burnout.ec/favicon.ico       | head -n 1   # 200
curl -sI https://burnout.ec/apple-touch-icon.png | head -n 1 # 200
```

Y en la consola del navegador, cero peticiones fallidas. El 404 de
`/favicon.ico` es el que más se cuela.

**7 · Caché y compresión**

```bash
curl -sI https://burnout.ec/assets/css/style.css | grep -iE "cache-control|expires"
curl -sI https://burnout.ec/assets/img/favicon.svg | grep -iE "cache-control|expires"
curl -sI https://burnout.ec/favicon.ico | grep -iE "cache-control|expires"
curl -sI -H "Accept-Encoding: gzip" https://burnout.ec/assets/css/style.css | grep -i content-encoding
```

Los tres primeros, caché larga (un año el CSS, seis meses los iconos). El
cuarto, `gzip`. El HTML no debe tener caché.

**8 · Nada sale a terceros**

Pestaña Red del navegador, recarga completa. Todas las peticiones deben ser a
`burnout.ec`. **Cero** peticiones a `fonts.googleapis.com`, `fonts.gstatic.com`
o `googletagmanager.com`. Las fuentes son unos 62 KB en `woff2` desde el propio
dominio.

**9 · El aviso de medición**

Aparece abajo al retirarse el preloader, con *Rechazar* y *Aceptar* del mismo
peso. Pulsa **Rechazar**, recarga: no debe reaparecer, y en la pestaña Red no
debe haber ni una petición nueva. Para volver a verlo, borra
`bo_consentimiento` del almacenamiento local.

**10 · El formulario, con el `ENDPOINT` sin conectar**

Rellena los tres pasos y envía. Debe aparecer en rojo, bajo el botón, el aviso
de que falta configurar `ENDPOINT` y de que los datos no se han enviado. **No
debe** redirigir a `gracias.html` ni fallar en silencio.

Prueba también los caminos de error: enviar sin marcar el consentimiento, y sin
teléfono. Los mensajes salen junto al campo y el foco salta al primero que
falla.

**11 · Movimiento reducido**

Activa *reducir movimiento* en el sistema y recarga. No debe haber preloader, y
la escena debe salir congelada con el isotipo ya montado.

**12 · `robots.txt`**

```bash
curl -s https://burnout.ec/robots.txt | head -n 20
```

Debe seguir diciendo `Disallow: /` mientras el sitio no sea lanzable.

**13 · Consola limpia**

Cero errores en las tres páginas: `/`, `/gracias.html` y `/privacidad.html`.

**14 · Anillo de foco** *(pendiente de verificación manual)*

Recorre el formulario con el tabulador en Chrome y en Firefox reales. Cada
campo y cada botón debe mostrar un contorno visible. En Chrome headless la
medición salía distinta de lo declarado en la hoja de estilos, así que este
punto no está verificado automáticamente.

## Marcadores pendientes

Lo primero que hay que mirar antes de publicar. Todos son `grep`-ables por
`PENDIENTE` o por `class="pend"`.

### Datos que faltan

| Qué | Dónde | Efecto mientras falte |
|---|---|---|
| URL del webhook de n8n | [`assets/js/app.js:42`](assets/js/app.js#L42) | El formulario valida y muestra el payload, pero no envía y lo dice en pantalla. |
| WhatsApp de contacto | [`assets/js/app.js:47`](assets/js/app.js#L47) | No se ofrece la vía alternativa cuando falla el envío. |
| ID de la propiedad de medición | [`assets/js/medicion.js:29`](assets/js/medicion.js#L29) | El aviso funciona y los eventos se registran en memoria, pero no se carga ninguna herramienta. |

### Textos que redacta el abogado

| Qué | Dónde |
|---|---|
| Consentimiento del formulario | [`index.html:274`](index.html#L274) |
| Texto del aviso de medición | [`assets/js/medicion.js:121`](assets/js/medicion.js#L121) |
| Política de privacidad, cabecera | [`privacidad.html:40`](privacidad.html#L40) |
| 1 · Responsable | [`privacidad.html:51`](privacidad.html#L51) |
| 2 · Datos que se recogen | [`privacidad.html:55`](privacidad.html#L55) |
| 3 · Finalidad | [`privacidad.html:60`](privacidad.html#L60) |
| 4 · Plazo de conservación | [`privacidad.html:65`](privacidad.html#L65) |
| 5 · Encargados de tratamiento | [`privacidad.html:68`](privacidad.html#L68) |
| 6 · Derechos | [`privacidad.html:73`](privacidad.html#L73) |
| 7 · Cookies y medición | [`privacidad.html:77`](privacidad.html#L77) |
| 8 · Cambios en la política | [`privacidad.html:86`](privacidad.html#L86) |

Los tres primeros salen en pantalla con una etiqueta naranja visible, a
propósito: es imposible publicarlos por descuido sin verlos.

### Contenido de relleno

| Qué | Dónde |
|---|---|
| Dos reels del portafolio siguen siendo rectángulos de color: *Dureno 1* y *La vuelta a Zamora* | [`index.html:232`](index.html#L232) y [`index.html:250`](index.html#L250) |
| El texto de la sección sigue diciendo «Reemplazar por reels reales» | [`index.html:230`](index.html#L230) |
| Dirección postal de la agencia | No está en el sitio. Ver [Datos estructurados](#datos-estructurados). |

## Antes de publicar

En orden. Los cinco primeros son bloqueantes.

1. **Quitar el bloqueo de indexación. Son DOS cambios, no uno**, y olvidar el
   segundo deja el sitio invisible sin que se note:
   1. En [`robots.txt`](robots.txt), cambiar `Disallow: /` por `Allow: /`.
   2. En [`index.html`](index.html), quitar
      `<meta name="robots" content="noindex, nofollow">` (y el comentario de
      encima). Está justo antes del `canonical`.

   Las otras dos páginas llevan `noindex, follow` a propósito y **se quedan
   como están**: `gracias.html` y `privacidad.html` no deben salir en
   buscadores ni antes ni después de publicar.
2. **Conectar el `ENDPOINT`** y probar un envío real de punta a punta, hasta ver
   el lead en n8n y aterrizar en `gracias.html`. El webhook tiene que responder
   con `Access-Control-Allow-Origin: https://burnout.ec` o el navegador
   bloqueará la petición.
3. **Poner los textos legales.** Los tres marcadores visibles y los ocho
   apartados de la política.
4. **Poner el teléfono** en el pie de las tres páginas, si va a haberlo. Hoy
   no hay línea de teléfono: se quitó el número de relleno, porque publicar un
   número inventado es peor que publicar una línea de menos.
5. **Sustituir los dos reels que faltan** por piezas reales, y revisar entonces
   el texto de la sección, que sigue diciendo «Reemplazar por reels reales».
6. Poner el `MEDICION_ID` y volver a pasar
   `tools/auditar-medicion.html` para confirmar que sigue sin cargar nada antes
   de aceptar.
7. Decidir sobre la dirección postal y, si llega, restaurar el nodo
   `LocalBusiness`.
8. Volver a comprobar el enlace pegado en WhatsApp, ya con el dominio en vivo.
   La tarjeta se comprobó simulando el rastreador, nunca contra WhatsApp de
   verdad.
9. Repasar el anillo de foco en Chrome y Firefox.

## El reel del portafolio

La tarjeta *Oktoberfest Loja* lleva un `<video>` con la clase `.bgw`, la misma
que el degradado al que sustituye, así que hereda posición, recorte y el zoom al
pasar el ratón sin tocar ninguna regla de las que ya había. Es decorativo: sin
sonido, `aria-hidden`, fuera del orden de tabulación.

**No cuesta nada hasta que hace falta.** Ni el vídeo ni el fotograma de portada
se piden al cargar la página: `app.js` los pone cuando la tarjeta se acerca a
pantalla, y pausa al salir. Con `prefers-reduced-motion` no se pide el vídeo en
ningún momento: se queda la portada quieta. La carga inicial de la portada sigue
siendo la misma que antes del reel, unos 128 KB.

La tarjeta lleva además la clase `.v`, que activa dos cosas que solo tienen
sentido sobre imagen y que **no afectan a las otras dos tarjetas**: un velo
inferior para que el título no caiga sobre la camiseta blanca del plano, y un
fondo bajo el círculo de *play*, que sin él desaparece contra el cielo.

### Añadir los otros dos reels

Los másteres **no se versionan** (ver `.gitignore`): al repositorio van solo las
codificaciones para web. El máster de este pesaba 22 MB en HEVC, que Chrome y
Firefox no reproducen, así que hay que recodificar siempre. Los comandos, con el
recorte a 4:5 que pide la tarjeta:

```bash
# recorte centrado de 16:9 a 4:5 + escalado a 720x900 + 25 fps, sin audio
C="crop=970:1214:595:0,scale=720:900:flags=lanczos,fps=25"

ffmpeg -i MASTER.MP4 -an -vf "$C" -c:v libx264 -profile:v high -pix_fmt yuv420p   -crf 30 -preset slow -g 50 -movflags +faststart assets/video/NOMBRE.mp4

ffmpeg -i MASTER.MP4 -an -vf "$C" -c:v libvpx-vp9 -crf 42 -b:v 0   -deadline good -cpu-used 2 -row-mt 1 -g 75 assets/video/NOMBRE.webm

# fotograma de portada, del segundo que mejor represente la pieza
ffmpeg -ss 15.5 -i MASTER.MP4 -frames:v 1   -vf "crop=970:1214:595:0,scale=720:900:flags=lanczos" -q:v 5 assets/video/NOMBRE.jpg
```

Los valores de `crop` dependen del máster: son `ancho=alto*4/5`, `x` centrado.
Para uno de 2160×1214 salen `970:1214:595:0`. Comprobado a tamaño real de la
tarjeta (411 px), bajar de estos ajustes no se distingue y subir solo engorda:
el resultado son ~1,3 MB en WebM y ~1,4 MB en MP4, de los que cada navegador se
descarga uno solo.

Después, en `index.html`, cambiar el `<div class="bgw"></div>` de la tarjeta por
el bloque `<video>` de la de Oktoberfest, añadir `v` a las clases del
`<article>`, y en `app.js` cambiar `querySelector` por `querySelectorAll` en el
bloque del reel. Y pasar `tools/auditar-reel.html`.

## Datos estructurados

`index.html` declara `Organization` y `WebSite`. **No declara `LocalBusiness`**,
y es una decisión, no un olvido:

- `LocalBusiness` exige dirección postal, y no la tenemos.
- Publicarla como marcador habría dejado `PENDIENTE_DIRECCION` indexable. Un
  dato falso indexado es peor que un campo ausente.
- Sin `address` válida Google no genera resultado enriquecido de
  `LocalBusiness`, así que se corría el riesgo sin ninguna ventaja.
- La página no muestra ninguna calle, y los datos estructurados tienen que
  coincidir con lo visible.

`areaServed` (Quito, Loja, Ecuador) se conservó dentro de `Organization`, así
que la señal geográfica no se pierde.

Cuando llegue la dirección, se recupera añadiendo este nodo al `@graph`, después
del de `Organization`:

```json
{
  "@type": "LocalBusiness",
  "@id": "https://burnout.ec/#negocio",
  "parentOrganization": { "@id": "https://burnout.ec/#organizacion" },
  "name": "BURNOUT",
  "url": "https://burnout.ec/",
  "email": "hola@burnout.ec",
  "image": "https://burnout.ec/assets/img/og.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "…",
    "addressLocality": "Quito",
    "postalCode": "…",
    "addressCountry": "EC"
  }
}
```

Y se valida con:

```bash
node tools/validar-jsonld.js index.html <schemaorg-current-https.jsonld>
```

El vocabulario se descarga de <https://schema.org/version/latest/schemaorg-current-https.jsonld>.
No se versiona: pesa varios megas y no forma parte del sitio.

## Reglas del proyecto

Valen para cualquiera que siga trabajando aquí.

1. **No se rediseña.** El resultado debe verse idéntico al prototipo aprobado en
   1440, 768 y 390 px. Cualquier diferencia visual es un error, no una mejora.
   Las únicas excepciones autorizadas hasta hoy son la reducción de partículas
   en equipos de pocos núcleos y las dos correcciones de contraste.
2. **No se toca el path del isotipo** (`<path id="iso">` ni el del preloader). Es
   el archivo maestro de la marca: no se redibuja, no se simplifica y no pasa
   por ningún optimizador que altere las curvas.
3. **No se toca la lógica ni los tiempos de la escena del canvas**: fases,
   easings, umbrales de scroll, densidad de partículas, el relevo de la O ni el
   acople al nav. Están calibrados.
4. **No se cambian los textos visibles.** Si hay un error, se reporta.
5. **No se inventan endpoints, teléfonos ni textos legales.** Si falta un dato,
   queda como constante configurable en un solo sitio y se avisa.

Para comprobar la paridad visual **no sirve comparar capturas**: la marquesina
animada mete alrededor de un 1 % de píxeles distintos entre dos capturas de la
*misma* versión. Se compara la geometría — alto de página, número de elementos,
caja, color y tamaño de cada uno — con el método descrito en el commit de P5.
