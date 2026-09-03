"""
Servidor de pruebas.

  /webhook, /webhook-500   reciben el POST del formulario y guardan el cuerpo
  /lento?ms=N              tarda N ms en responder un PNG de 1x1

El recurso lento sirve para retrasar el evento load y poder medir en tiempo
real: con --virtual-time-budget, Chrome headless mata el requestAnimationFrame
y cualquier medida de fotogramas sale falseada.

Opcionalmente aplica limitacion de ancho de banda y latencia para emular 4G:
  python srv2.py --4g
"""
import http.server, socketserver, os, sys, time, base64, threading
from urllib.parse import urlparse, parse_qs

# La raiz del repositorio, deducida de la ubicacion de este archivo.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8733
LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recibido.json")

# Slow 4G de Lighthouse: 1.6 Mbit/s de bajada, 150 ms de ida y vuelta
CUATRO_G = "--4g" in sys.argv
BAJADA_BPS = 1_600_000 / 8      # bytes por segundo
LATENCIA_S = 0.150 / 2          # se aplica una vez por peticion
# El tubo es uno solo: sin este candado, N descargas en paralelo obtendrian
# cada una el ancho de banda completo y la simulacion mediria de mas.
TUBO = threading.Lock()

PNG_1x1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)


class H(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n).decode("utf-8")
        with open(LOG, "w", encoding="utf-8") as f:
            f.write(raw)
        codigo = 500 if self.path.startswith("/webhook-500") else 200
        cuerpo = b'{"error":"boom"}' if codigo == 500 else b'{"ok":true}'
        self.send_response(codigo); self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_GET(self):
        p = urlparse(self.path)
        if p.path == "/lento":
            ms = int((parse_qs(p.query).get("ms") or ["3000"])[0])
            time.sleep(ms / 1000.0)
            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", str(len(PNG_1x1)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(PNG_1x1)
            return
        if CUATRO_G:
            time.sleep(LATENCIA_S)
        super().do_GET()

    def copyfile(self, source, outputfile):
        if not CUATRO_G:
            return super().copyfile(source, outputfile)
        # emulacion de ancho de banda: trozos de 8 KB con la pausa que toque
        trozo = 8192
        espera = trozo / BAJADA_BPS
        with TUBO:
            while True:
                datos = source.read(trozo)
                if not datos:
                    break
                outputfile.write(datos)
                time.sleep(espera)

    def log_message(self, *a):
        pass


class Hilos(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


with Hilos(("127.0.0.1", PORT), H) as httpd:
    print(f"sirviendo en {PORT}" + (" con 4G simulada" if CUATRO_G else ""))
    httpd.serve_forever()
