import {parseCSV,MAX_FILE_BYTES} from './engine.mjs';

function chooseSheet(names,filename){return new Promise((resolve,reject)=>{
 if(!names.length){reject(Error('Sešit nemá žádný viditelný list.'));return}
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Výběr listu XLSX');
 const title=document.createElement('h2');title.textContent='Vyberte list';
 const file=document.createElement('p');file.textContent=filename;
 const form=document.createElement('form');const label=document.createElement('label');label.className='file-input';label.textContent='List';
 const select=document.createElement('select');select.setAttribute('aria-label','List sešitu');
 for(const name of names){const o=document.createElement('option');o.value=name;o.textContent=name;select.append(o)}label.append(select);
 const headerLabel=document.createElement('label');headerLabel.className='file-input';headerLabel.textContent='Řádek hlavičky (1–25)';
 const header=document.createElement('input');Object.assign(header,{type:'number',min:'1',max:'25',value:'1',required:true});header.setAttribute('aria-label','Řádek hlavičky');headerLabel.append(header);
 const submit=document.createElement('button');submit.type='submit';submit.className='button primary';submit.textContent='Načíst list';
 const cancel=document.createElement('button');cancel.type='button';cancel.className='button secondary';cancel.textContent='Zrušit';cancel.onclick=()=>dialog.close();
 let chosen=false;
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;chosen=true;resolve({name:select.value,headerRow:Number(header.value)});dialog.close()};
 dialog.onclose=()=>{dialog.remove();if(!chosen)reject(Error('Import sešitu zrušen.'))};
 form.append(label,headerLabel,submit,cancel);dialog.append(title,file,form);document.body.append(dialog);dialog.showModal();
})}

export async function importFile(file){
 if(file.size>MAX_FILE_BYTES)throw Error('Každý soubor může mít nejvýše 2 MB.');
 if(file.name.toLowerCase().endsWith('.csv')){
  const text=await file.text();if(text.includes('\uFFFD')||text.includes('\u0000'))throw Error('CSV musí být v kódování UTF-8.');
  return {rows:parseCSV(text),name:file.name};
 }
 if(!file.name.toLowerCase().endsWith('.xlsx'))throw Error('Podporované jsou CSV a XLSX.');
 const worker=new Worker(new URL('./xlsx-worker.mjs',import.meta.url),{type:'module'});let serial=0;
 const call=(action,payload={})=>new Promise((resolve,reject)=>{
  const id=++serial,timer=setTimeout(()=>{worker.terminate();reject(Error('Čtení XLSX překročilo časový limit 20 sekund.'))},20000);
  worker.onmessage=event=>{if(event.data.id!==id)return;clearTimeout(timer);event.data.error?reject(Error(event.data.error)):resolve(event.data.result)};
  worker.onerror=()=>{clearTimeout(timer);reject(Error('Pracovní proces XLSX se nepodařilo spustit.'))};
  worker.postMessage({id,action,...payload});
 });
 try{
  const names=await call('inspect',{data:await file.arrayBuffer()});
  const selected=await chooseSheet(names,file.name);
  return {rows:await call('read',selected),name:`${file.name} · ${selected.name}`};
 }finally{worker.terminate()}
}
