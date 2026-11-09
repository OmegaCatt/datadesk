import * as XLSX from './vendor/xlsx-0.20.3.mjs';
import {MAX_ROWS,MAX_FILE_BYTES} from './engine.mjs';

export const MAX_EXPANDED_BYTES=32_000_000;
const fail=message=>{throw new Error(message)};

// Bound actual decompression before handing the archive to the workbook parser.
export async function validateArchive(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.byteLength>MAX_FILE_BYTES||bytes.byteLength<22)fail('XLSX musí být platný soubor ZIP do 2 MB.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),size=bytes.length;
 let end=-1;
 for(let i=size-22;i>=Math.max(0,size-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===size){end=i;break}
 if(end<0)fail('Poškozený nebo nepodporovaný XLSX archiv.');
 const count=view.getUint16(end+10,true),offset=view.getUint32(end+16,true),directorySize=view.getUint32(end+12,true);
 if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||view.getUint16(end+8,true)!==count||!count||count>256||offset+directorySize!==end)fail('XLSX má nepodporovanou strukturu nebo více než 256 částí.');
 let cursor=offset,total=0;const names=new Set();
 for(let i=0;i<count;i++){
  if(cursor+46>end||view.getUint32(cursor,true)!==0x02014b50)fail('Neplatný obsah XLSX archivu.');
  const flags=view.getUint16(cursor+8,true),method=view.getUint16(cursor+10,true),compressed=view.getUint32(cursor+20,true),expanded=view.getUint32(cursor+24,true);
  const nameLength=view.getUint16(cursor+28,true),extraLength=view.getUint16(cursor+30,true),commentLength=view.getUint16(cursor+32,true),local=view.getUint32(cursor+42,true);
  const next=cursor+46+nameLength+extraLength+commentLength;
  if(next>end||local+30>offset||view.getUint32(local,true)!==0x04034b50||flags&1||![0,8].includes(method)||view.getUint16(local+8,true)!==method)fail('Šifrovaný nebo nepodporovaný XLSX archiv.');
  const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(cursor+46,cursor+46+nameLength));
  if(names.has(name)||name.includes('..')||name.includes('\\')||name.startsWith('/'))fail('Nejednoznačné cesty v XLSX archivu.');names.add(name);
  if(/vbaProject|externalLinks|embeddings/i.test(name))fail('Sešit obsahuje makra, externí odkazy nebo vložené objekty. Použijte čistý export XLSX.');
  const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
  if(start+compressed>offset||expanded>MAX_EXPANDED_BYTES||total+expanded>MAX_EXPANDED_BYTES)fail('Rozbalený XLSX překračuje limit 32 MB.');
  const input=bytes.subarray(start,start+compressed);
  const stream=new Blob([input]).stream();
  let inflater;
  if(method===8){try{inflater=new DecompressionStream('deflate-raw')}catch{fail('Pro import XLSX použijte aktuální prohlížeč s podporou DecompressionStream deflate-raw.')}}
  const reader=(inflater?stream.pipeThrough(inflater):stream).getReader();
  let actual=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;actual+=value.byteLength;if(total+actual>MAX_EXPANDED_BYTES||actual>expanded)fail('Skutečná velikost XLSX překračuje deklarovaný limit.');}}
  finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
  if(actual!==expanded)fail('Velikost rozbalených dat XLSX nesouhlasí.');
  total+=actual;cursor=next;
 }
 if(cursor!==end||!names.has('[Content_Types].xml')||!names.has('xl/workbook.xml'))fail('Archiv není podporovaný sešit XLSX.');
 return {entries:count,expandedBytes:total};
}

export function inspectWorkbook(bytes){
 const book=XLSX.read(bytes,{type:'array',sheetRows:1,cellHTML:false,cellStyles:false});
 if(book.SheetNames.length>16)fail('Sešit může mít nejvýše 16 listů.');
 return book.SheetNames.filter((_,i)=>!book.Workbook?.Sheets?.[i]?.Hidden);
}

export function readSheet(bytes,name,headerRow=1){
 if(!Number.isInteger(headerRow)||headerRow<1||headerRow>25)fail('Hlavička musí být na řádku 1 až 25.');
 const book=XLSX.read(bytes,{type:'array',sheets:[name],sheetRows:MAX_ROWS+headerRow+1,cellHTML:false,cellStyles:false,cellFormula:true,cellNF:true,dateNF:'yyyy-mm-dd'});
 const index=book.SheetNames.indexOf(name),sheet=book.Sheets[name];
 if(index<0||!sheet||book.Workbook?.Sheets?.[index]?.Hidden)fail('Vybraný viditelný list neexistuje.');
 const range=XLSX.utils.decode_range(sheet['!fullref']??sheet['!ref']??'A1');
 if(range.e.c>=64||range.e.r>=MAX_ROWS+headerRow)fail('List může mít nejvýše 64 sloupců a 20 000 datových řádků.');
 if(sheet['!merges']?.some(m=>m.e.r>=headerRow-1))fail('Datová oblast obsahuje sloučené buňky. Použijte tabulkový export.');
 const value=(r,c)=>{
  const address=XLSX.utils.encode_cell({r,c}),cell=sheet[address];
  if(!cell)return '';
  if(cell.f||cell.F)fail(`Buňka ${address} obsahuje vzorec. Převeďte export na hodnoty.`);
  if(cell.t==='e')fail(`Buňka ${address} obsahuje chybu Excelu.`);
  const s=String(XLSX.utils.format_cell(cell));
  if(s.length>500||s.includes('\u0000'))fail(`Buňka ${address} obsahuje nepodporovanou hodnotu.`);
  return s;
 };
 const headers=Array.from({length:range.e.c+1},(_,c)=>value(headerRow-1,c).trim());
 if(headers.some(h=>!h||['__proto__','constructor','prototype','__line'].includes(h))||new Set(headers).size!==headers.length)fail('Hlavičky musí být neprázdné, jedinečné a nesmí používat vyhrazené názvy.');
 const rows=[];
 for(let r=headerRow;r<=range.e.r;r++){
  const cells=headers.map((_,c)=>value(r,c));
  if(!cells.some(v=>v.trim()))continue;
  rows.push(Object.assign(Object.create(null),Object.fromEntries(headers.map((h,c)=>[h,cells[c]])),{__line:r+1}));
 }
 if(!rows.length)fail('Vybraný list neobsahuje datové řádky.');
 return rows;
}
