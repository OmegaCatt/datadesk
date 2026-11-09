import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import * as XLSX from '../web/vendor/xlsx-0.20.3.mjs';
import {validateArchive,inspectWorkbook,readSheet} from '../web/xlsx-import.mjs';
function workbook(sheet,extra={}){const b=XLSX.utils.book_new();XLSX.utils.book_append_sheet(b,sheet,'Data');Object.assign(b,extra);return XLSX.write(b,{type:'array',bookType:'xlsx',compression:true})}
const bytes=b=>new Uint8Array(b);
test('vendored parser bytes match the documented upstream build',async()=>{
 const data=await readFile(new URL('../web/vendor/xlsx-0.20.3.mjs',import.meta.url));
 assert.equal(createHash('sha256').update(data).digest('hex'),'1a0fb062ee9781b13f6687371b202aaefc53b6ce55b530c027e01f9c087b77db');
});
test('XLSX validates actual expansion and reads formatted IDs, dates and source rows',async()=>{
 const s=XLSX.utils.aoa_to_sheet([['Export'],['ID','Datum','Částka'],[7,45292,1250.50],[],['008','2024-01-02','100']]);
 s.A3.z='00000';s.B3.z='yyyy-mm-dd';s.C3.z='0.00';
 const data=bytes(workbook(s));assert.ok((await validateArchive(data)).expandedBytes>0);assert.deepEqual(inspectWorkbook(data),['Data']);
 const rows=readSheet(data,'Data',2);assert.equal(rows[0].ID,'00007');assert.equal(rows[0].Datum,'2024-01-01');assert.equal(rows[0].Částka,'1250.50');assert.equal(rows[1].__line,5);
});
test('XLSX rejects formulas, error cells, duplicate headers, hidden sheets and huge dimensions',()=>{
 const base=()=>XLSX.utils.aoa_to_sheet([['ID','Cena'],['001',12]]);
 let s=base();s.B2={t:'n',v:12,f:'6+6'};assert.throws(()=>readSheet(bytes(workbook(s)),'Data'),/vzorec/);
 s=base();s.B2={t:'e',v:7};assert.throws(()=>readSheet(bytes(workbook(s)),'Data'),/chybu/);
 s=XLSX.utils.aoa_to_sheet([['ID','ID'],['001',12]]);assert.throws(()=>readSheet(bytes(workbook(s)),'Data'),/Hlavičky/);
 s=base();const hidden=bytes(workbook(s,{Workbook:{Sheets:[{Hidden:1}]}}));assert.deepEqual(inspectWorkbook(hidden),[]);assert.throws(()=>readSheet(hidden,'Data'),/viditelný/);
 s=base();s['!ref']='A1:BM2';assert.throws(()=>readSheet(bytes(workbook(s)),'Data'),/64 sloupců/);
});
test('archive guard rejects truncation, false expansion metadata and excessive expansion',async()=>{
 const original=bytes(workbook(XLSX.utils.aoa_to_sheet([['ID'],['001']])));
 await assert.rejects(()=>validateArchive(original.slice(0,-10)));
 const changed=original.slice(),v=new DataView(changed.buffer);let position=-1;
 for(let i=0;i<changed.length-46;i++)if(v.getUint32(i,true)===0x02014b50){position=i;break}
 assert.ok(position>=0);v.setUint32(position+24,1,true);await assert.rejects(()=>validateArchive(changed),/velikost|Velikost/);
 v.setUint32(position+24,33_000_000,true);await assert.rejects(()=>validateArchive(changed),/32 MB/);
});

test('XLSX rejects merged data, reserved headers and oversized row ranges',()=>{
 let s=XLSX.utils.aoa_to_sheet([['ID','Cena'],['001',12]]);s['!merges']=[XLSX.utils.decode_range('A2:B2')];assert.throws(()=>readSheet(bytes(workbook(s)),'Data'),/sloučené/);
 s=XLSX.utils.aoa_to_sheet([['__proto__'],['x']]);assert.throws(()=>readSheet(bytes(workbook(s)),'Data'),/Hlavičky/);
 s=XLSX.utils.aoa_to_sheet([['ID'],['001']]);s['!ref']='A1:A20002';assert.throws(()=>readSheet(bytes(workbook(s)),'Data'),/20 000/);
});
