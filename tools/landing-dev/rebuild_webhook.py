#!/usr/bin/env python3
"""Webhook receiver: debounced rebuild of landing dist + static-server restart.

Listens on :9999. POST /rebuild from Frappe (or anywhere) schedules a rebuild
in DEBOUNCE seconds. Burst of POSTs collapses to a single rebuild.
"""
import os
import subprocess
import sys
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

WEB_ROOT = sys.argv[1] if len(sys.argv) > 1 else "/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web"
PORT = int(os.environ.get("REBUILD_PORT", "9999"))
DEBOUNCE = int(os.environ.get("REBUILD_DEBOUNCE", "10"))  # seconds

_state = {"pending_at": 0.0, "running": False, "last_ok": "", "last_err": ""}
_lock = threading.Lock()


def _run_rebuild() -> None:
    with _lock:
        _state["running"] = True
    try:
        print(f"[rebuild] starting at {time.strftime('%H:%M:%S')}", flush=True)
        r = subprocess.run(
            ["pnpm", "--filter", "@sekolahpro/app-landing", "build"],
            cwd=WEB_ROOT,
            capture_output=True,
            text=True,
            timeout=180,
        )
        if r.returncode != 0:
            _state["last_err"] = (r.stderr or r.stdout)[-500:]
            print(f"[rebuild] FAILED rc={r.returncode}\n{_state['last_err']}", flush=True)
            return
        _state["last_ok"] = time.strftime("%Y-%m-%d %H:%M:%S")
        _state["last_err"] = ""
        print(f"[rebuild] OK at {_state['last_ok']}", flush=True)
        # Static server reads files fresh on each request — no restart needed.
    except Exception as e:
        _state["last_err"] = str(e)
        print(f"[rebuild] EXC {e}", flush=True)
    finally:
        with _lock:
            _state["running"] = False


def _scheduler() -> None:
    while True:
        time.sleep(1)
        with _lock:
            pending = _state["pending_at"]
            running = _state["running"]
        if pending and not running and time.time() >= pending:
            with _lock:
                _state["pending_at"] = 0.0
            _run_rebuild()


class H(BaseHTTPRequestHandler):
    def _json(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body.encode())

    def do_POST(self):
        if self.path.rstrip("/") == "/rebuild":
            with _lock:
                _state["pending_at"] = time.time() + DEBOUNCE
                eta = _state["pending_at"]
            self._json(202, f'{{"queued":true,"eta_in_s":{DEBOUNCE},"eta":{eta}}}')
            return
        self._json(404, '{"err":"not found"}')

    def do_GET(self):
        if self.path.rstrip("/") == "/status":
            with _lock:
                s = dict(_state)
            self._json(200, str(s).replace("'", '"'))
            return
        self._json(404, '{"err":"not found"}')

    def log_message(self, *a, **kw):
        return  # quiet


if __name__ == "__main__":
    threading.Thread(target=_scheduler, daemon=True).start()
    print(f"[rebuild-hook] listening on :{PORT}, debounce {DEBOUNCE}s, root {WEB_ROOT}", flush=True)
    HTTPServer(("0.0.0.0", PORT), H).serve_forever()
