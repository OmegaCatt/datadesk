import {performance} from 'node:perf_hooks';import * as XLSX from '../web/vendor/xlsx-0.20.3.mjs';
import {makeDataset,ORDER_COLUMNS} from '../web/datasets.mjs';import {validateArchive,readSheet} from '../web/xlsx-import.mjs';import {exportWorkbook} from '../web/xlsx-report.mjs';
const dataset=makeDataset(20000),book=XLSX.utils.book_new();
XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([ORDER_COLUMNS,...dataset.orders.map(r=>ORDER_COLUMNS.map(k=>r[k]))]),'Export');
const bytes=new Uint8Array(XLSX.write(book,{type:'array',bookType:'xlsx',compression:true}));
let start=performance.now();const archive=await validateArchive(bytes),guardMs=performance.now()-start;
start=performance.now();const rows=readSheet(bytes,'Export'),readMs=performance.now()-start;
start=performance.now();const output=exportWorkbook({...dataset,names:['orders.xlsx','shipments.xlsx']}),reportMs=performance.now()-start;
console.log(JSON.stringify({rows:rows.length,compressedBytes:bytes.length,expandedBytes:archive.expandedBytes,guardMs:Math.round(guardMs),readMs:Math.round(readMs),reportBytes:output.byteLength,reportMs:Math.round(reportMs),node:process.version}));
