import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';import {createStaticServer} from './serve.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',response=>{if(response.status()>=400)failed.push(response.status()+' '+response.url())});
 const url=process.env.PORTFOLIO_QA_BASE_URL||`http://127.0.0.1:${server.address().port}/portfolio/`;
 const response=await p.goto(url);assert.equal(response.status(),200);assert.equal(await p.locator('article.case').count(),3);assert.equal(await p.locator('article').count(),7);
 for(const id of ['datadesk','companyatlas','shop-ops-kit','offerlens','releaseguard','planboard','flowbridge'])assert.equal(await p.locator('#'+id).count(),1);
 await p.locator('#additional-projects summary').click();await p.locator('#flowbridge').scrollIntoViewIfNeeded();
 await p.evaluate(()=>{for(const image of document.images)image.loading='eager'});await p.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
 await p.goto(url+'#flowbridge');await p.waitForFunction(()=>document.querySelector('#additional-projects').open);assert.equal(await p.locator('#flowbridge').evaluate(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}),true);
 await p.locator('#atlas-video').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('video').readyState>=1);const duration=await p.locator('video').evaluate(v=>v.duration);assert.ok(duration>20&&duration<60,'Actual recording must have a plausible duration');
 await p.locator('#play-atlas').click();await p.waitForFunction(()=>document.querySelector('video').currentTime>1);
 await p.locator('video').evaluate(v=>{v.pause();v.currentTime=14});await p.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-14)<1);
 await p.waitForFunction(()=>document.querySelector('track').readyState===2);const cues=await p.locator('video').evaluate(v=>[...v.textTracks[0].cues].map(c=>c.text));assert.ok(cues.some(c=>c.includes('Personální účet')));assert.ok(cues.some(c=>c.includes('AI je')));
 const metadata=await (await p.request.get(new URL('companyatlas-recording.json',url).href)).json();assert.deepEqual(metadata.verified,{year2024:12,studioJavor:5,peopleAccess:'denied',jsErrors:[]});
 const vtt=await p.request.get(new URL('companyatlas.vtt',url).href);assert.match(vtt.headers()['content-type'],/text\/vtt/);
 await p.goto(url);await p.waitForFunction(()=>document.querySelector('video').readyState>=2);await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.tagName),'A');await mkdir(root+'docs',{recursive:true});await p.screenshot({path:root+'docs/portfolio-desktop.png',fullPage:true});
 await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:root+'docs/portfolio-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 const result={url,checkedAt:new Date().toISOString(),primaryCases:3,totalProjects:7,videoSeconds:duration,captions:cues.length,playback:true,seek:true,mobile:true,jsErrors:errors,httpFailures:failed};await writeFile(root+'docs/portfolio-qa.json',JSON.stringify(result,null,2));console.log('PASS portfolio:',JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r))}
