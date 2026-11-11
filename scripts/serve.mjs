import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../web/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webm':'video/webm', '.vtt':'text/vtt; charset=utf-8', '.json':'application/json; charset=utf-8' };
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export function createStaticServer() { return http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const target = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname+'index.html' : pathname));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(target);
    const headers={ 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', 'Accept-Ranges':'bytes' };
    if(req.method==='GET'&&req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start=0,end=body.length-1;
      if(match&&match[1]){start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),end)}
      else if(match&&match[2])start=Math.max(0,body.length-Number(match[2]));
      if(!match||(!match[1]&&!match[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=body.length||match[1]===''&&Number(match[2])===0){res.writeHead(416,{...headers,'Content-Range':`bytes */${body.length}`});res.end();return}
      const selected=body.subarray(start,end+1);res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${body.length}`,'Content-Length':selected.length});res.end(selected);return;
    }
    res.writeHead(200,{...headers,'Content-Length':body.length});
    res.end(req.method==='HEAD'?undefined:body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
}); }
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const server=createStaticServer();server.listen(4173,'127.0.0.1',()=>console.log('DataDesk: http://127.0.0.1:4173'));
}
