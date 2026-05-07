#!/usr/bin/env python3
"""
Static H5 + /api reverse proxy (same behavior as Vite server.proxy in vite.config.js).
Plain "python -m http.server" cannot proxy; use this after npm run build:h5.

  python scripts/h5-static-proxy.py
  python scripts/h5-static-proxy.py --port 9000 --directory dist/build/h5

Override Emby origin (optional):
  set EMBY_PROXY_TARGET=https://your-emby.example.com
"""
from __future__ import annotations

import argparse
import os
import sys
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from urllib.request import Request, urlopen

HOP_BY_HOP = {
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'host',
}


def api_upstream_url(path: str, target: str) -> str:
    p = urlparse(path)
    if not p.path.startswith('/api'):
        return ''
    rest = p.path[4:] or '/'
    upstream_path = '/emby' + rest
    q = f'?{p.query}' if p.query else ''
    return f'{target.rstrip("/")}{upstream_path}{q}'


class Handler(SimpleHTTPRequestHandler):
    target: str = 'https://media.blueone-media.top'

    def _forward_headers(self) -> dict[str, str]:
        out: dict[str, str] = {}
        for k, v in self.headers.items():
            lk = k.lower()
            if lk in HOP_BY_HOP:
                continue
            out[k] = v
        return out

    def _proxy(self) -> None:
        url = api_upstream_url(self.path, self.target)
        if not url:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        length = self.headers.get('Content-Length')
        body = self.rfile.read(int(length)) if length else None
        req = Request(
            url,
            data=body,
            headers=self._forward_headers(),
            method=self.command,
        )
        try:
            with urlopen(req, timeout=120) as resp:
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    lk = k.lower()
                    if lk in HOP_BY_HOP or lk == 'transfer-encoding':
                        continue
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(resp.read())
        except Exception as e:
            self.send_error(HTTPStatus.BAD_GATEWAY, str(e))

    def do_OPTIONS(self) -> None:
        if urlparse(self.path).path.startswith('/api'):
            self._proxy()
        else:
            super().do_OPTIONS()

    def do_GET(self) -> None:
        if urlparse(self.path).path.startswith('/api'):
            self._proxy()
        else:
            super().do_GET()

    def do_POST(self) -> None:
        if urlparse(self.path).path.startswith('/api'):
            self._proxy()
        else:
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def do_PUT(self) -> None:
        if urlparse(self.path).path.startswith('/api'):
            self._proxy()
        else:
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def do_PATCH(self) -> None:
        if urlparse(self.path).path.startswith('/api'):
            self._proxy()
        else:
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def do_DELETE(self) -> None:
        if urlparse(self.path).path.startswith('/api'):
            self._proxy()
        else:
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write('%s - - [%s] %s\n' % (self.address_string(), self.log_date_time_string(), fmt % args))


def main() -> None:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    parser = argparse.ArgumentParser(description='Serve H5 build with /api Emby proxy')
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--directory', default='dist/build/h5')
    args = parser.parse_args()
    d_abs = os.path.normpath(os.path.join(root, args.directory))
    if not os.path.isdir(d_abs):
        print(f'Directory not found: {d_abs}\nRun: npm run build:h5', file=sys.stderr)
        sys.exit(1)
    target = os.environ.get('EMBY_PROXY_TARGET', 'https://media.blueone-media.top')

    class AppHandler(Handler):
        pass

    AppHandler.target = target

    server = ThreadingHTTPServer(
        ('', args.port),
        lambda rq, ca, srv: AppHandler(rq, ca, srv, directory=d_abs),
    )
    print(f'Serving {d_abs} on http://127.0.0.1:{args.port} (proxy /api -> {target}/emby...)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped')


if __name__ == '__main__':
    main()
