import test from 'node:test';import assert from 'node:assert/strict';import {createStaticServer} from '../scripts/serve.mjs';
test('gallery serves directory, script, captions and bounded video ranges',async()=>{
 const server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  assert.equal((await fetch(base+'/portfolio/')).status,200);
  assert.match((await fetch(base+'/portfolio/walkthrough.js')).headers.get('content-type'),/javascript/);
  assert.match((await fetch(base+'/portfolio/companyatlas.vtt')).headers.get('content-type'),/text\/vtt/);
  const full=await fetch(base+'/portfolio/companyatlas.webm'),bytes=Buffer.from(await full.arrayBuffer());assert.equal(full.headers.get('content-type'),'video/webm');
  for(const [range,start,end] of [['bytes=0-7',0,7],['bytes=-8',bytes.length-8,bytes.length-1],['bytes=8-',8,bytes.length-1]]){
   const response=await fetch(base+'/portfolio/companyatlas.webm',{headers:{Range:range}});assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),`bytes ${start}-${end}/${bytes.length}`);assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes.subarray(start,end+1));
  }
  for(const range of ['bytes=999999999-','bytes=8-1','bytes=-0','bytes=-','bytes=0-1,4-5','invalid'])assert.equal((await fetch(base+'/portfolio/companyatlas.webm',{headers:{Range:range}})).status,416);
  const head=await fetch(base+'/portfolio/companyatlas.webm',{method:'HEAD'});assert.equal(Number(head.headers.get('content-length')),bytes.length);assert.equal((await head.arrayBuffer()).byteLength,0);
 }finally{await new Promise(r=>server.close(r))}
});
