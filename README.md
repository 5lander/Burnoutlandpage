# BURNOUT — Landing

Sitio estático de una sola página. Sin framework, sin paso de compilación:
lo que está en este repositorio es exactamente lo que se sirve.

Dominio: burnout.ec · Hosting: Hostinger (despliegue por Git)

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | El marcado de la página |
| `assets/css/style.css` | Todos los estilos |
| `assets/js/scene.js` | Sistema de partículas y escena animada del canvas |
| `assets/js/app.js` | Preloader, reveals y formulario |
| `assets/fonts/` | Poppins y JetBrains Mono en woff2, autoalojadas |
| `.htaccess` | Fuerza HTTPS, canoniza sin `www`, cache y compresión |
| `robots.txt` | Indexación abierta + referencia al sitemap |
| `sitemap.xml` | Una sola URL por ahora |

## Estado

Esto es el **prototipo aprobado**, no la versión de producción. Antes de
lanzar hay que ejecutar los paquetes del brief (`BRIEF-claude-code-burnout.md`):
fuentes autoalojadas, formulario contra endpoint real con consentimiento,
metadatos y OG, accesibilidad y rendimiento, medición.

Se puede desplegar tal cual para ver el sitio en su dominio, pero **el
formulario todavía no envía nada** — solo muestra el payload en pantalla.

## Levantarlo en local

Abrir `index.html` en el navegador basta. Si se prefiere servidor:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Publicar

```bash
git init
git add .
git commit -m "Landing BURNOUT — prototipo aprobado"
git branch -M main
git remote add origin git@github.com:<usuario>/burnout-web.git
git push -u origin main
```

Después, en hPanel: la web → **Advanced → Git** → conectar el repositorio,
rama `main`, directorio `public_html`. Cada `git push` publica.

El directorio de destino debe estar **vacío** en el primer despliegue.
