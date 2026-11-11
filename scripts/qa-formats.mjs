import {verifyGuide,verifyGuideLinks,dismissGuide} from './guide-qa.mjs';
import {chromium} from 'playwright';import assert from 'node:assert/strict';import {readFile,mkdir} from 'node:fs/promises';
import {createStaticServer} from './serve.mjs';import {getScenario,ORDER_COLUMNS,SHIPMENT_COLUMNS} from '../web/datasets.mjs';
import {fileURLToPath} from 'node:url';
const server=createStaticServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.address().port}`);await verifyGuide(page,{storageFailure:true});
 const sample=getScenario('clean');sample.orders=[{...sample.orders[0],ordered_at:'03/04/2026'}];sample.shipments=[{...sample.shipments[0],shipped_at:'04/04/2026'}];
 await page.locator('#new-button').click();
 for(const [kind,columns,id] of [['orders',ORDER_COLUMNS,'orders-file'],['shipments',SHIPMENT_COLUMNS,'shipments-file']])await page.locator('#'+id).setInputFiles({name:kind+'.csv',mimeType:'text/csv',buffer:Buffer.from([columns.join('|'),...sample[kind].map(row=>columns.map(key=>row[key]).join('|'))].join('\n'))});
 await page.locator('#import-form button[type=submit]').click();
 for(let i=0;i<2;i++){await page.getByLabel('Oddělovač CSV',{exact:true}).selectOption('|');await page.getByRole('button',{name:'Načíst CSV',exact:true}).click();}
 const mapping=page.getByRole('dialog',{name:'Mapování sloupců'});await mapping.waitFor();
 for(const select of await mapping.locator('select[aria-label$="Formát data"]').all())await select.selectOption('dmy-slash');
 assert.match(await mapping.innerText(),/2026-04-03/);
 await mkdir(new URL('../docs/',import.meta.url),{recursive:true});await mapping.screenshot({path:fileURLToPath(new URL('../docs/formats.png',import.meta.url))});
 await page.getByRole('button',{name:'Potvrdit a zkontrolovat'}).click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Mapování potvrzeno'));assert.match(await page.locator('#content').innerText(),/vše v pořádku/);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Uložit případ',exact:true}).click();const saved=JSON.parse(await readFile(await(await download).path(),'utf8'));assert.equal(saved.orders[0].ordered_at,'03/04/2026');assert.equal(saved.orders[0].__dateFormat,'dmy-slash');
 await page.locator('#new-button').click();await page.locator('#import-form button[type=submit]').click();for(let i=0;i<2;i++){assert.equal(await page.getByLabel('Oddělovač CSV',{exact:true}).inputValue(),'|');await page.getByRole('button',{name:'Načíst CSV',exact:true}).click();}
 await mapping.waitFor();assert.equal(await mapping.locator('select[aria-label$="Formát data"]').first().inputValue(),'dmy-slash');await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log('PASS: explicit CSV separator, date preview/interpretation, original source + metadata export, saved profiles and mobile; no JS errors');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
