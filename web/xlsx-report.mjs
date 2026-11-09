import * as XLSX from './vendor/xlsx-0.20.3.mjs';
import {ORDER_COLUMNS,SHIPMENT_COLUMNS} from './datasets.mjs';
import {reconcile,RULES} from './engine.mjs';

// Same documented metric as analysis/coverage.sql, independently checked in QA.
export function coverageRows(orders,shipments){
 const groups=new Map(),links=new Map();
 const key=r=>JSON.stringify([String(r.shop??'').trim(),String(r.order_id??'').trim()]);
 for(const r of orders){const k=key(r);groups.set(k,(groups.get(k)??0)+1)}
 for(const r of shipments)links.set(key(r),true);
 const shops=new Map();
 for(const [k,copies] of groups){const [shop,id]=JSON.parse(k);if(copies!==1||!shop||!id)continue;
  if(!shops.has(shop))shops.set(shop,{shop,unique_orders:0,matched_orders:0,without_shipment:0});
  const row=shops.get(shop);row.unique_orders++;row[links.has(k)?'matched_orders':'without_shipment']++;
 }
 return [...shops.values()].sort((a,b)=>a.shop<b.shop?-1:a.shop>b.shop?1:0);
}
function sheet(rows,widths){
 const s=XLSX.utils.aoa_to_sheet(rows);s['!cols']=widths.map(w=>({wch:w}));return s;
}
export function reportWorkbook({orders,shipments,names,reviews={},exportedAt=new Date().toISOString()}){
 const result=reconcile(orders,shipments),book=XLSX.utils.book_new(),coverage=coverageRows(orders,shipments);
 const top=[['DataDesk – kontrola dat'],['Vytvořeno',exportedAt],['Objednávky',String(names?.[0]??'')],['Expedice',String(names?.[1]??'')],
 ['Definice','Párování podle jednoznačného ID a obchodu; neprokazuje množství ani včasnost.'],
 ['Obnovení','Znovu exportujte aktuální případ v aplikaci nebo použijte CLI. Nálezy jsou snímek.'],[],
 ['Objednávky v exportu',orders.length],['Záznamy expedice',shipments.length],[],
 ['Obchod','Jedinečné objednávky','Se zásilkou','Bez zásilky','Podíl se zásilkou']];
 const rows=[...top,...coverage.map(r=>[r.shop,r.unique_orders,r.matched_orders,r.without_shipment,r.matched_orders/r.unique_orders])];
 const first=12,last=11+coverage.length,totalRow=rows.length+2;
 rows.push([],['Celkem',0,0,0,0],[],['Chyby',result.stats.errors],['Upozornění',result.stats.warnings],['Otevřené nálezy',result.findings.filter(f=>!Object.hasOwn(reviews,f.id)).length]);
 const summary=sheet(rows,[34,30,22,22,22]);
 summary['!merges']=['A1:E1','B3:E3','B4:E4','B5:E5','B6:E6'].map(XLSX.utils.decode_range);
 for(let r=first;r<=last;r++){summary[`E${r}`]={t:'n',f:`IF(B${r}=0,0,C${r}/B${r})`,v:rows[r-1][4],z:'0.0%'}}
 for(const [col,field] of [['B','unique_orders'],['C','matched_orders'],['D','without_shipment']])summary[`${col}${totalRow}`]={t:'n',f:coverage.length?`SUM(${col}${first}:${col}${last})`:'0',v:coverage.reduce((n,r)=>n+r[field],0)};
 const totals=coverage.reduce((a,r)=>[a[0]+r.unique_orders,a[1]+r.matched_orders],[0,0]);
 summary[`E${totalRow}`]={t:'n',f:`IF(B${totalRow}=0,0,C${totalRow}/B${totalRow})`,v:totals[0]?totals[1]/totals[0]:0,z:'0.0%'};
 summary['!autofilter']={ref:`A11:E${Math.max(11,last)}`};
 XLSX.utils.book_append_sheet(book,summary,'Přehled');
 for(const [name,source,cols] of [['Objednávky',orders,ORDER_COLUMNS],['Expedice',shipments,SHIPMENT_COLUMNS]]){
  const s=sheet([['Řádek zdroje',...cols],...source.map((r,i)=>[r.__line??i+2,...cols.map(k=>String(r[k]??''))])],[16,...cols.map(k=>['customer','email'].includes(k)?30:20)]);
  s['!autofilter']={ref:s['!ref']};XLSX.utils.book_append_sheet(book,s,name);
 }
 const findings=sheet([['Závažnost','Pravidlo','Nález','Zdroj a řádek','Stav prověření','Poznámka'],...result.findings.map(f=>[f.severity,f.code,f.title,f.rows.map(r=>`${r.source}:${r.line}`).join(', '),Object.hasOwn(reviews,f.id)?'Prověřeno; data nezměněna':'K prověření',String(reviews[f.id]?.note??'')])],[16,28,42,42,32,65]);
 findings['!autofilter']={ref:findings['!ref']};XLSX.utils.book_append_sheet(book,findings,'Nálezy');
 XLSX.utils.book_append_sheet(book,sheet([['Pravidlo','Název','Význam'],...RULES],[30,42,95]),'Pravidla');
 book.Workbook={CalcPr:{calcMode:'auto',fullCalcOnLoad:true}};
 return book;
}
export function exportWorkbook(input){return XLSX.write(reportWorkbook(input),{type:'array',bookType:'xlsx',compression:true});}
