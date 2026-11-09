import test from 'node:test';import assert from 'node:assert/strict';
import {parseDate,parseCSV,reconcile} from '../web/engine.mjs';
import {mapColumns,encodeCase,restoreCase} from '../web/workspace.mjs';
import {getScenario,ORDER_COLUMNS} from '../web/datasets.mjs';
test('explicit date format never guesses ambiguous slashes and preserves raw values',async()=>{
 assert.equal(parseDate('03/04/2026'),null);assert.equal(parseDate('03/04/2026','dmy-slash'),'2026-04-03');assert.equal(parseDate('03/04/2026','mdy-slash'),'2026-03-04');assert.equal(parseDate('31/02/2026','dmy-slash'),null);assert.equal(parseDate('2026-04-03','dmy-slash'),null);assert.throws(()=>parseDate('x','invalid'));
 const scenario=getScenario('clean');scenario.orders[0].ordered_at='03/04/2026';
 scenario.orders=mapColumns(scenario.orders,Object.fromEntries(ORDER_COLUMNS.map(key=>[key,key])),'orders','dmy-slash');
 const result=reconcile(scenario.orders,scenario.shipments);assert.equal(result.orders[0].date,'2026-04-03');assert.equal(result.orders[0].raw.ordered_at,'03/04/2026');
 const saved=await restoreCase(await encodeCase({scenario,result,names:['a','b'],reviews:{},history:[]}));assert.equal(saved.result.orders[0].date,'2026-04-03');
 scenario.orders[0].__dateFormat='bad';assert.throws(()=>reconcile(scenario.orders,scenario.shipments));
});
test('manual CSV delimiter supports quoted pipes and rejects reserved metadata headers',()=>{
 const rows=parseCSV('id|title\n001|"a|b"','|');assert.equal(rows[0].id,'001');assert.equal(rows[0].title,'a|b');assert.throws(()=>parseCSV('id;__dateFormat\n1;iso'));assert.throws(()=>parseCSV('x','xx'));
});
