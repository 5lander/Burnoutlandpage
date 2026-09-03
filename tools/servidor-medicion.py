"""
Servidor para auditar la medicion.

Sirve el sitio real (no una copia) y hace tres cosas que no hace el servidor
normal:

  1. Parchea al vuelo las dos constantes marcadas de assets/js/medicion.js:
     MEDICION_ID pasa a un identificador con forma valida y MEDICION_SRC apunta
     a este mismo servidor. Asi se prueba el camino completo de carga sin haber
     contratado la herramienta y sin llamar a ningun servicio de fuera. El
     archivo en disco no se toca.

  2. Anota TODAS las peticiones que recibe, con marca de tiempo. Ese registro es
     la prueba de que la analitica no se carga antes del consentimiento: no se
     mira el codigo, se mira el log de red.

  3. Inyecta un fragmento de tools/ en cualquier pagina, con ?frag=archivo.html.
     El fragmento se parte por <!--CUERPO-->: lo de arriba va al <head> (util
     para instrumentar antes de que corra ningun script del sitio) y lo de abajo
     antes de </body>.

Uso:
    python tools/servidor-medicion.py
    http://127.0.0.1:8734/tools/auditar-medicion.html
    http://127.0.0.1:8734/index.html?frag=auditar-medicion-raf.html

Endpoints propios:
    /analitica.js   hace de script de la herramienta; define __ANALITICA_CARGADA
    /log            devuelve el registro de peticiones en JSON
    /reset          vacia el registro
    /marca?t=texto  anota un hito del guion de pruebas en la misma linea temporal
    /resultado      recibe por POST el JSON final y lo escribe en tools/
"""
import http.server, socketserver, json, os, time
from urllib.parse import urlparse, parse_qs

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
PUERTO = 8734
SALIDA = os.path.join(AQUI, "resultado-medicion.json")

ID_PRUEBA = "G-PRUEBA1234"
SRC_PRUEBA = "http://127.0.0.1:%d/analitica.js?id=" % PUERTO

LOG = []
T0 = time.time()


def ms():
    return round((time.time() - T0) * 1000)


class H(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *a, **k):
        super().__init__(*a, directory=RAIZ, **k)

    def _enviar(self, cuerpo, tipo):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(cuerpo)

    def _json(self, obj):
        self._enviar(json.dumps(obj).encode("utf-8"), "application/json")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        with open(SALIDA, "w", encoding="utf-8") as f:
            f.write(self.rfile.read(n).decode("utf-8"))
        self._json({"ok": True})

    def do_GET(self):
        p = urlparse(self.path)
        q = parse_qs(p.query)

        if p.path == "/log":
            return self._json(LOG)
        if p.path == "/reset":
            LOG.clear()
            return self._json({"t": ms()})
        if p.path == "/marca":
            LOG.append({"t": ms(), "ruta": "MARCA:" + (q.get("t") or [""])[0]})
            return self._json({"t": ms()})

        LOG.append({"t": ms(), "ruta": p.path + (("?" + p.query) if p.query else "")})

        if p.path == "/analitica.js":
            return self._enviar(b"window.__ANALITICA_CARGADA=true;", "application/javascript")

        # medicion.js con las dos constantes marcadas sustituidas
        if p.path.endswith("/assets/js/medicion.js"):
            s = open(os.path.join(RAIZ, "assets", "js", "medicion.js"), encoding="utf-8").read()
            s = s.replace("'PENDIENTE_ID_MEDICION'", "'%s'" % ID_PRUEBA)
            s = s.replace("'https://www.googletagmanager.com/gtag/js?id='", "'%s'" % SRC_PRUEBA)
            return self._enviar(s.encode("utf-8"), "application/javascript")

        # inyeccion de un fragmento de tools/ en una pagina del sitio
        frag = (q.get("frag") or [None])[0]
        if frag and p.path.endswith(".html"):
            destino = os.path.join(RAIZ, p.path.lstrip("/").replace("/", os.sep))
            ruta_frag = os.path.join(AQUI, os.path.basename(frag))
            if os.path.isfile(destino) and os.path.isfile(ruta_frag):
                s = open(destino, encoding="utf-8").read()
                f = open(ruta_frag, encoding="utf-8").read()
                cabeza, _, cuerpo = f.partition("<!--CUERPO-->")
                s = s.replace("</head>", cabeza + "</head>", 1)
                s = s.replace("</body>", cuerpo + "</body>", 1)
                return self._enviar(s.encode("utf-8"), "text/html; charset=utf-8")

        super().do_GET()

    def log_message(self, *a):
        pass


class Hilos(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with Hilos(("127.0.0.1", PUERTO), H) as s:
        print("medicion en http://127.0.0.1:%d/  sirviendo %s" % (PUERTO, RAIZ))
        s.serve_forever()
