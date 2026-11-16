import {record,nodeServer} from './recording.mjs';
import {createStaticServer} from './serve.mjs';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as XLSX from '../web/vendor/xlsx-0.20.3.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
await record({root,slug:'datadesk',start:()=>nodeServer(createStaticServer()),walk:async({p,cue,hold,ui})=>{
  await cue('Dva exporty: objednávky a zásilky. Kontrola hledá nesrovnalosti a zachovává původní řádky.');await hold();
  await cue('Otevřeme konkrétní nalezený problém.');await hold(1.2);await ui.click(p.locator('#demo-finding'));await p.locator('#detail-dialog').waitFor({state:'visible'});assert.match(await p.locator('.source-record').first().innerText(),/řádek/);
  await cue('Konkrétní nález ukazuje očekávaný stav i původní záznamy.');await hold(4);
  await cue('Doplníme poznámku a nález označíme jako prověřený.');await ui.fill(p.locator('#review-note'), 'Prověřit rozdíl podle původního exportu skladu.');await ui.click(p.getByRole('button',{name:'Označit jako prověřené',exact:true}));assert.match(await p.locator('.review-note').innerText(),/Prověřit rozdíl/);
  await cue('Kontrolní poznámka nezmění zdrojová data. Pouze zachytí, co má kolega prověřit.');await hold();
  await cue('Vrátíme se k původním exportům.');await ui.click(p.locator('[data-close="detail-dialog"]'));await ui.click(p.locator('.demo-actions a'));assert.ok(await p.locator('.data-table tbody tr').count()>0);
  await cue('Zdrojové tabulky lze porovnat přímo v aplikaci.');await hold();
  await cue('Připravíme report a stáhneme jej do Excelu.');await ui.click(p.locator('#demo-export'));const pending=p.waitForEvent('download');await ui.click(p.locator('#workbook-export'));const workbook=XLSX.read(await readFile(await(await pending).path()),{type:'buffer'});assert.equal(workbook.SheetNames.length,5);
  await cue('Excel report obsahuje pět listů včetně zdrojových dat a nálezů.');await hold(4);await ui.click(p.locator('[data-close="export-dialog"]'));
  return {sourceRowsVisible:true,reviewNoteSaved:true,excelSheets:workbook.SheetNames};
}});
