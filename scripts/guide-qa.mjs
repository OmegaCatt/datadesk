import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
export async function dismissGuide(page){const dialog=page.locator('#guide-dialog');if(await dialog.count()&&await dialog.isVisible())await page.locator('#guide-start').click()}
export async function verifyLateGuideClose(page){
 await page.locator('#guide-tech').click();await page.locator('#guide-dialog').waitFor({state:'visible'});
 const focused=await page.evaluate(async()=>{
   const dialog=document.getElementById('guide-dialog');
   const closed=new Promise(resolve=>dialog.addEventListener('close',()=>resolve(document.activeElement.id),{once:true}));
   dialog.close();document.getElementById('guide-use').focus();return closed;
 });
 assert.equal(focused,'guide-use','A queued close must not steal an explicit later focus change');
 await page.keyboard.press('Enter');assert.match(await page.locator('#guide-title').innerText(),/Jak používat/);
 await page.locator('#guide-close').click();
}
export async function verifyGuideLinks(page){
 await page.locator('#guide-tech').click();await page.locator('#guide-dialog').waitFor({state:'visible'});assert.match(await page.locator('#guide-title').innerText(),/Technické informace/);assert.match(await page.locator('#guide-dialog a').getAttribute('href'),/^https:\/\/github.com\/OmegaCatt\/[a-z-]+#readme$/);assert.ok((await page.locator('.guide-content').innerText()).length>200);await page.keyboard.press('Escape');
 await page.locator('#guide-use').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#guide-title').innerText(),/Jak používat/);await page.locator('#guide-close').click();assert.equal(await page.locator('#guide-use').evaluate(e=>document.activeElement===e),true);await verifyLateGuideClose(page);
}
export async function verifyGuide(page,{login=false,storageFailure=false}={}){
 await page.locator('#guide-dialog').waitFor({state:'visible'});assert.match(await page.locator('#guide-title').innerText(),/Jak používat/);assert.equal(await page.locator('.guide-content ol li').count(),3);
 assert.equal(await page.locator('#guide-dialog').evaluate(e=>e.contains(document.activeElement)),true);await page.keyboard.press('Tab');assert.equal(await page.locator('#guide-dialog').evaluate(e=>e.contains(document.activeElement)),true);
 await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('#guide-start').evaluate(e=>document.activeElement===e),true);
 await page.getByRole('button',{name:'Technické řešení',exact:true}).click();assert.match(await page.locator('#guide-title').innerText(),/Technické informace/);await page.getByRole('button',{name:'Používání',exact:true}).click();
 await mkdir(new URL('../docs/',import.meta.url),{recursive:true});await page.locator('#guide-dialog').screenshot({path:fileURLToPath(new URL('../docs/guide.png',import.meta.url))});
 const viewport=page.viewportSize();await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await page.locator('#guide-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);await page.screenshot({path:fileURLToPath(new URL('../docs/guide-mobile.png',import.meta.url))});await page.setViewportSize(viewport);
 const repo=(await page.locator('#guide-dialog a').getAttribute('href')).match(/OmegaCatt\/([^#]+)/)[1];await page.locator('#guide-dialog').evaluate((dialog,key)=>{dialog.addEventListener('cancel',()=>{window.guideAckDuringCancel=localStorage.getItem(key)},{once:true})},'portfolio-guide:'+repo+':v1');
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.guideAckDuringCancel),'seen','Acknowledgement must already exist during cancel, before asynchronous close');assert.equal(await page.locator('#guide-dialog').isVisible(),false);await page.reload();assert.equal(await page.locator('#guide-dialog').isVisible(),false);
 if(!login)await verifyGuideLinks(page);
 if(storageFailure){const isolated=await page.context().browser().newContext();try{await isolated.addInitScript(()=>{const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(k){if(k.startsWith('portfolio-guide:'))throw Error('Storage unavailable');return get.call(this,k)};Storage.prototype.setItem=function(k,v){if(k.startsWith('portfolio-guide:'))throw Error('Storage unavailable');return set.call(this,k,v)}});const p=await isolated.newPage();await p.goto(page.url());await p.locator('#guide-dialog').waitFor({state:'visible'});await p.locator('#guide-start').click();assert.equal(await p.locator('#guide-dialog').isVisible(),false)}finally{await isolated.close()}}
 console.log('PASS guide: first visit, technical/use content, focus/Escape, persisted acknowledgement, GitHub links, mobile'+(login?' (header links after login tested separately)':''));
}
