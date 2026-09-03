# tools/

Utilidades de desarrollo. No forman parte del sitio: `tools/.htaccess` bloquea
el acceso a este directorio en producción.

| Archivo | Qué hace |
|---|---|
| `iso-path.txt` | El atributo `d` del `<path id="iso">`, copiado literal de `index.html`. Fuente única de los iconos y la imagen OG. |
| `generar-imagenes.html` | Dibuja iconos e imagen OG en canvas, a partir del path y de Poppins 700 autoalojada. |
| `generar-imagenes.js` | Ejecuta lo anterior en Chrome headless y escribe los archivos. También empaqueta `favicon.ico`. |
| `validar-jsonld.js` | Valida el JSON-LD contra el vocabulario oficial de schema.org. |
| `simular-whatsapp.js` | Reproduce lo que hace el rastreador de WhatsApp al pegar el enlace. |
| `servidor-pruebas.py` | Servidor local: recibe el POST del formulario, sirve `/lento?ms=N` y opcionalmente limita el ancho de banda a 4G. |
| `medir-contraste.js` | Calcula el contraste WCAG de cada combinación de texto y fondo del sitio. |
| `medir-particulas.html` | Mide a partir de qué número de partículas el isotipo deja de leerse. |
| `medir-lcp-cls.html` | Fragmento: mide LCP, CLS, FCP y TTFB y envía el resultado al servidor. |
| `auditar-a11y.html` | Fragmento: árbol de accesibilidad, recorrido de teclado y qué controles pueden recibir foco. |
| `auditar-raf.html` | Fragmento: cuenta fotogramas dentro y fuera de la escena y con la pestaña oculta. |
| `auditar-rm.html` | Fragmento: comprueba que `prefers-reduced-motion` elimina el preloader y congela la escena. |
| `comparar-graphite.html` | Compara el gris `--graphite` actual con el propuesto para cumplir 4,5:1. |
| `servidor-medicion.py` | Sirve el sitio real parcheando al vuelo las constantes marcadas de `medicion.js`, anota todas las peticiones y sabe inyectar fragmentos con `?frag=`. |
| `auditar-medicion.html` | Comprueba el consentimiento entero: nada antes de aceptar, aceptar carga y vacía la cola, rechazar no carga ni reintenta, y los cinco eventos. |
| `auditar-medicion-raf.html` | Fragmento: censa los listeners de scroll y cuenta fotogramas, para verificar que el evento de la mitad de la escena no despierta el bucle. |
| `auditar-reel.html` | Comprueba que el vídeo del portafolio no se pide hasta acercarse a su tarjeta, que solo se descarga una de las dos codificaciones y que se pausa al salir de pantalla. |
| `auditar-visor.html` | Comprueba el visor: los 6,6 MB de la pieza completa no se piden hasta abrirlo, el foco entra y vuelve, cierran Escape, el botón y el fondo, y el bucle de la tarjeta se para y se reanuda. |

Los archivos marcados como **fragmento** no se abren solos: se inyectan antes de
`</body>` de una copia de `index.html`. Por ejemplo:

```bash
awk 'BEGIN{while((getline l < "tools/auditar-a11y.html")>0) s=s l "
"} /^<\/body>$/{printf "%s", s} {print}'     index.html > prueba.html
```

## Por qué las medidas no usan `--virtual-time-budget`

Con esa opción, Chrome headless deja sin fotogramas al `requestAnimationFrame`:
cualquier medida de animación sale falseada. Por eso `servidor-pruebas.py` ofrece
`/lento?ms=N`, que retrasa la respuesta y mantiene la página viva en tiempo real,
y los fragmentos envían su resultado por `fetch` en vez de dejarlo en el DOM.

Ojo: en este build, Chrome headless fija el ancho mínimo de ventana en 500 px,
así que `--window-size=390,...` no da un viewport de 390.

## Regenerar iconos e imagen OG

```bash
python -m http.server 8732      # servir la raíz del repositorio
node tools/generar-imagenes.js http://127.0.0.1:8732
```

Salida: `favicon.ico`, `apple-touch-icon.png`, `assets/img/og.jpg`,
`assets/img/icono-512.png`. El `favicon.svg` se escribe aparte, también desde
`iso-path.txt`.

## Comprobaciones

```bash
curl -sL https://schema.org/version/latest/schemaorg-current-https.jsonld -o /tmp/schema.jsonld
node tools/validar-jsonld.js index.html /tmp/schema.jsonld
node tools/simular-whatsapp.js http://127.0.0.1:8732/index.html
```

`simular-whatsapp.js` **no** es una previsualización real de WhatsApp: comprueba
lo que su rastreador leería y lo que descartaría. La previsualización de verdad
solo se puede ver pegando el enlace en un chat, ya con el sitio publicado.
