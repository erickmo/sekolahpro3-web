#!/usr/bin/env python3
"""Static server for vite-react-ssg flat HTML + /api proxy to Frappe."""
import os
import sys
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 4173
API_UPSTREAM = sys.argv[3] if len(sys.argv) > 3 else "http://sekolahpro.localhost:8000"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _proxy(self, method):
        upstream = f"{API_UPSTREAM}{self.path}"
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        req = urllib.request.Request(upstream, data=body, method=method)
        for h in ("Content-Type", "Accept", "Cookie", "X-Frappe-CSRF-Token"):
            v = self.headers.get(h)
            if v:
                req.add_header(h, v)
        req.add_header("Host", "sekolahpro.localhost")
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                self.send_response(r.status)
                for k, v in r.headers.items():
                    if k.lower() in ("transfer-encoding", "connection", "content-encoding"):
                        continue
                    self.send_header(k, v)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(r.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(f"upstream error: {e}".encode())

    def do_POST(self):
        if self.path.startswith("/api/"):
            return self._proxy("POST")
        self.send_response(405)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Frappe-CSRF-Token")
        self.end_headers()

    def send_head(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]

        if path.startswith("/api/"):
            self._proxy("GET")
            return None

        if path == "/" or path == "":
            self.path = "/index.html"
        elif "." not in os.path.basename(path):
            clean = path.rstrip("/")
            resolved = None
            for cand in (f"{clean}.html", f"{clean}/index.html"):
                full = os.path.join(ROOT, cand.lstrip("/"))
                if os.path.isfile(full):
                    resolved = cand
                    break
            self.path = resolved or "/index.html"

        return super().send_head()


if __name__ == "__main__":
    print(f"Serving {ROOT} on :{PORT}, /api -> {API_UPSTREAM}", flush=True)
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
