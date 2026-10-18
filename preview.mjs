import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const port = Number(process.env.PORT || 4174);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm', '.ttf':'font/ttf' };
// Byte ranges allow the original MP4 to seek exactly alongside the native timeline.
createServer((request, response) => {
  const fail = status => { response.writeHead(status); response.end(); };
  if (!['GET','HEAD'].includes(request.method)) return fail(405);
  let path, info;
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    path = resolve(root, `.${pathname}`);
    if (path !== resolve(root) && !path.startsWith(resolve(root) + sep)) return fail(403);
    info = statSync(path);
    if (info.isDirectory()) { path = resolve(path, 'index.html'); info = statSync(path); }
    if (!info.isFile()) return fail(404);
  } catch { return fail(404); }
  let start = 0, end = info.size - 1, status = 200;
  if (request.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if (!match || (!match[1] && !match[2])) return fail(416);
    if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (start > end || start >= info.size) { response.setHeader('Content-Range', `bytes */${info.size}`); return fail(416); }
    status = 206;
    response.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
  }
  response.writeHead(status, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Content-Length': end - start + 1, 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache' });
  if (request.method === 'HEAD' || info.size === 0) return response.end();
  const stream = createReadStream(path, { start, end });
  stream.on('error', () => response.destroy());
  response.on('close', () => stream.destroy());
  stream.pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Theater preview: http://127.0.0.1:${port}/`));
