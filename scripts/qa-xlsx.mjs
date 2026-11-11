import {verifyGuide,verifyGuideLinks,dismissGuide} from './guide-qa.mjs';
import assert from 'node:assert/strict';import {chromium} from 'playwright';import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import * as XLSX from '../web/vendor/xlsx-0.20.3.mjs';
import {createStaticServer} from './serve.mjs';import {getScenario,ORDER_COLUMNS,SHIPMENT_COLUMNS} from '../web/datasets.mjs';
const server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:950},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.DATADESK_QA_BASE_URL||`http://127.0.0.1:${server.address().port}`);await verifyGuide(page,{storageFailure:true});await page.locator('#new-button').click();
 const sample=getScenario('clean');
 for(const [kind,columns,id] of [['orders',ORDER_COLUMNS,'orders-file'],['shipments',SHIPMENT_COLUMNS,'shipments-file']]){
  const b=XLSX.utils.book_new();XLSX.utils.book_append_sheet(b,XLSX.utils.aoa_to_sheet([['Návod'],['Vyberte list Export']]),'Návod');
  const sheet=XLSX.utils.aoa_to_sheet([['Fiktivní export'],columns,...sample[kind].map(row=>columns.map(k=>row[k]))]);
  XLSX.utils.book_append_sheet(b,sheet,'Export');
  await page.locator('#'+id).setInputFiles({name:kind+'.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(XLSX.write(b,{type:'array',bookType:'xlsx',compression:true}))});
 }
 await page.locator('#import-form button[type=submit]').click();
 for(let i=0;i<2;i++){await page.getByLabel('List sešitu',{exact:true}).selectOption('Export');await page.getByLabel('Řádek hlavičky',{exact:true}).fill('2');await page.getByRole('button',{name:'Načíst list',exact:true}).click();}
 await mkdir(new URL('../docs/',import.meta.url),{recursive:true});await page.screenshot({path:fileURLToPath(new URL('../docs/preview-xlsx.png',import.meta.url)),fullPage:true});
 await page.getByRole('button',{name:'Potvrdit a zkontrolovat'}).click();
 await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Mapování potvrzeno'));
 assert.match(await page.locator('#content').innerText(),/vše v pořádku/);
 assert.match(await page.locator('#content').innerText(),/orders.xlsx · Export/);
 assert.equal(await page.locator('.source-card small').filter({hasText:'XLSX'}).count(),2);
 await page.locator('#demo-finding').click();assert.equal(await page.locator('#detail-dialog').isVisible(),false);assert.equal(await page.locator('#scenario').inputValue(),'custom');assert.match(await page.locator('.source-grid').innerText(),/orders.xlsx/);
 await page.locator('[data-view="data"]').click();assert.equal(await page.locator('.data-table tbody tr td').first().textContent(),'3');
 await page.locator('#export-button').click();const downloadPromise=page.waitForEvent('download');await page.locator('#workbook-export').click();
 const downloaded=await downloadPromise;assert.equal(downloaded.suggestedFilename(),'datadesk_report.xlsx');
 const {readFile}=await import('node:fs/promises');const workbook=XLSX.read(await readFile(await downloaded.path()),{type:'buffer'});
 assert.equal(workbook.Sheets.Objednávky.A2.v,3);assert.equal(workbook.Sheets.Přehled.E12.v,1);
 await page.locator('[data-close="export-dialog"]').click();
 const bad=XLSX.utils.book_new(),badSheet=XLSX.utils.aoa_to_sheet([ORDER_COLUMNS,...sample.orders.map(r=>ORDER_COLUMNS.map(k=>r[k]))]);badSheet.F2={t:'n',v:100,f:'50+50'};XLSX.utils.book_append_sheet(bad,badSheet,'Vzorce');
 await page.locator('#new-button').click();await page.locator('#orders-file').setInputFiles({name:'formula.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(XLSX.write(bad,{type:'array',bookType:'xlsx',compression:true}))});
 await page.locator('#import-form button[type=submit]').click();await page.getByRole('button',{name:'Načíst list',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#import-error').textContent.includes('vzorec'));
 assert.equal(await page.locator('.data-table tbody tr td').first().textContent(),'3');await page.locator('[data-close="import-dialog"]').click();
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('#sidebar').getBoundingClientRect().right<=0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log('XLSX browser QA passed: CSP/worker, sheet/header selection, mapping, source row, clean result, workbook download, formula rejection without state loss, mobile.');
}finally{await browser?.close();await new Promise(r=>server.close(r))}
