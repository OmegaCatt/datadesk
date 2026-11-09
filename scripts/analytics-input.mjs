import {readFile,stat} from 'node:fs/promises';
import {restoreCase} from '../web/workspace.mjs';
const file=process.argv[2];
try{
 if(!file||(await stat(file)).size>8_000_000)throw Error('Expected bounded DataDesk case');
 const saved=await restoreCase(await readFile(file,'utf8'));
 const result=saved.result;
 console.log(JSON.stringify({fingerprint:saved.fingerprint,orders:result.orders.map(row=>({shop:row.shop,id:row.id,date:row.date,cents:row.cents,currency:row.currency,sourceRow:row.line})),findings:result.findings.map(f=>({...f,reviewed:Object.hasOwn(saved.reviews,f.id)}))}));
}catch(error){console.error(error.message);process.exitCode=1}
