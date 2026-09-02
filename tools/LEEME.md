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
