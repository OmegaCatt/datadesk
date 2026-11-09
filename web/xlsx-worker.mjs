import {validateArchive,inspectWorkbook,readSheet} from './xlsx-import.mjs';
let bytes;
self.onmessage=async event=>{
 const {id,action,data,name,headerRow}=event.data;
 try{
  if(action==='inspect'){bytes=new Uint8Array(data);await validateArchive(bytes);self.postMessage({id,result:inspectWorkbook(bytes)});}
  else if(action==='read'&&bytes)self.postMessage({id,result:readSheet(bytes,name,headerRow)});
  else throw Error('Neplatná operace importu.');
 }catch(error){self.postMessage({id,error:error.message||'Sešit nelze přečíst.'})}
};
