import {readFile,writeFile,stat} from 'node:fs/promises';
import {restoreCase} from '../web/workspace.mjs';
import {exportWorkbook} from '../web/xlsx-report.mjs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Použití: node scripts/export-workbook.mjs pripad.json report.xlsx');
if((await stat(input)).size>8_000_000)throw Error('Případ smí mít nejvýše 8 MB.');
const data=await restoreCase(await readFile(input,'utf8'));
await writeFile(output,new Uint8Array(exportWorkbook(data)));
console.log('Excel report znovu vytvořen z ověřeného případu.');
