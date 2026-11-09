import test from 'node:test';
import assert from 'node:assert/strict';
import {mapColumns,encodeCase,restoreCase} from '../web/workspace.mjs';
import {getScenario,ORDER_COLUMNS} from '../web/datasets.mjs';
import {reconcile} from '../web/engine.mjs';
test('source line metadata is bounded and never accepts an object or forged text',()=>{
 for(const value of [null,'3',{},-1,2.5,2_000_002]){const data=getScenario('clean');data.orders[0].__line=value;assert.throws(()=>reconcile(data.orders,data.shipments),/řádku zdroje/);}
});
test('mapping preserves source lines and identifiers and rejects reused columns',()=>{
 const source=[Object.assign(Object.fromEntries(ORDER_COLUMNS.map(k=>['cz_'+k,k==='order_id'?'001':'x'])),{__line:7})];
 const mapping=Object.fromEntries(ORDER_COLUMNS.map(k=>[k,'cz_'+k]));
 const mapped=mapColumns(source,mapping,'orders');
 assert.equal(mapped[0].order_id,'001'); assert.equal(mapped[0].__line,7); assert.equal(source[0].order_id,undefined);
 assert.throws(()=>mapColumns(source,{...mapping,shop:mapping.order_id},'orders'));
});
test('case restores original inputs and review; recalculates instead of trusting report',async()=>{
 const scenario=getScenario('issues'), result=reconcile(scenario.orders,scenario.shipments);
 const id=result.findings[0].id;
 const state={scenario,result,names:['a.csv','b.csv'],reviews:{[id]:{note:'Ověřeno ve zdroji',at:'2026-11-09T12:00:00Z'}},history:[]};
 const text=await encodeCase(state), saved=await restoreCase(text);
 assert.deepEqual(saved.result.stats,result.stats); assert.equal(saved.reviews[id].note,state.reviews[id].note);
 const changed=JSON.parse(text); changed.orders[0].customer='Změna';
 await assert.rejects(()=>restoreCase(JSON.stringify(changed)),/Otisk/);
 const forged=JSON.parse(text); forged.reviews.unknown=state.reviews[id];
 await assert.rejects(()=>restoreCase(JSON.stringify(forged)),/prověření/);
 await assert.rejects(()=>restoreCase('{'),/JSON/);
});
