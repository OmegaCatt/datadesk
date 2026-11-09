import {exportWorkbook} from './xlsx-report.mjs';
self.onmessage=event=>{try{const result=exportWorkbook(event.data);self.postMessage({result},[result]);}catch(e){self.postMessage({error:e.message})}};
