import test from 'node:test';import assert from 'node:assert/strict';
import * as XLSX from '../web/vendor/xlsx-0.20.3.mjs';
import {coverageRows,exportWorkbook} from '../web/xlsx-report.mjs';
import {getScenario} from '../web/datasets.mjs';
test('report coverage excludes duplicate identities and counts split shipments once',()=>{
 const orders=['001','002','dup','dup'].map(order_id=>({shop:'A',order_id}));
 assert.deepEqual(coverageRows(orders,[{shop:'A',order_id:'001'},{shop:'A',order_id:'001'}]),[{shop:'A',unique_orders:2,matched_orders:1,without_shipment:1}]);
});
test('workbook contains exact sources, physical rows, cached ratios and safe text cells',()=>{
 const d=getScenario('clean');d.orders[0].customer='=HYPERLINK("https://invalid.test")';d.orders[0].__line=9;
 const b=XLSX.read(exportWorkbook({...d,names:['orders.xlsx · Export','b.csv'],exportedAt:'2026-11-09T12:00:00Z'}),{type:'array',cellFormula:true});
 assert.deepEqual(b.SheetNames,['Přehled','Objednávky','Expedice','Nálezy','Pravidla']);
 assert.equal(b.Sheets.Objednávky.A2.v,9);assert.equal(b.Sheets.Objednávky.D2.t,'s');assert.equal(b.Sheets.Objednávky.D2.f,undefined);
 assert.equal(b.Sheets.Přehled.E12.f,'IF(B12=0,0,C12/B12)');assert.equal(b.Sheets.Přehled.E12.v,1);
 assert.ok(b.Sheets.Objednávky['!autofilter']);
});
