import assert from 'node:assert/strict';import {readFile,mkdir} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';import {createStaticServer} from './serve.mjs';import * as XLSX from '../web/vendor/xlsx-0.20.3.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
 const p=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.DATADESK_QA_BASE_URL||`http://127.0.0.1:${server.address().port}`);
 const sources=await p.locator('.source-grid').innerText();await p.locator('#demo-finding').click();await p.locator('#detail-dialog').waitFor({state:'visible'});assert.match(await p.locator('.source-record').first().innerText(),/řádek/);
 await p.locator('#review-note').fill('Ověřit nesrovnalost podle původního exportu.');await p.getByRole('button',{name:'Označit jako prověřené',exact:true}).click();assert.match(await p.locator('.review-note').innerText(),/Ověřit nesrovnalost/);
 await mkdir(root+'docs',{recursive:true});await p.screenshot({path:root+'docs/demo-finding.png'});await p.locator('[data-close="detail-dialog"]').click();assert.equal(await p.locator('.source-grid').innerText(),sources);
 await p.locator('.demo-actions a').click();await p.locator('.data-table').waitFor();assert.ok(await p.locator('.data-table tbody tr').count()>0);
 await p.locator('#demo-export').click();const wait=p.waitForEvent('download');await p.locator('#workbook-export').click();const book=XLSX.read(await readFile(await(await wait).path()),{type:'buffer'});assert.equal(book.SheetNames.length,5);assert.ok(book.SheetNames.includes('Nálezy'));
 await p.locator('[data-close="export-dialog"]').click();await p.locator('#scenario').selectOption('clean');await p.locator('#demo-finding').click();assert.equal(await p.locator('#detail-dialog').isVisible(),false);assert.match(await p.locator('#toast').innerText(),/není nález/);assert.equal(await p.locator('#scenario').inputValue(),'clean');
 await p.setViewportSize({width:390,height:844});await p.locator('.demo-walkthrough').scrollIntoViewIfNeeded();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:root+'docs/demo-mobile.png'});assert.deepEqual(errors,[]);
 console.log('PASS walkthrough: actual source finding, human review preserves source, source navigation, five-sheet Excel, clean scenario without invented finding, mobile.');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
