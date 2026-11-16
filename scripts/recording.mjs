// Shared recorder implementation copied into each independent portfolio repository.
// Captures actual UI interactions; it never substitutes screenshots or AI responses.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {dismissGuide} from './guide-qa.mjs';

export async function pythonServer(root, temporary, envName, code, args=[]) {
  const child=spawn(process.env[envName]||'python',['-u','-c',code,...args],{
    cwd:root,windowsHide:true,env:{...process.env,OPENAI_API_KEY:'',PYTHONIOENCODING:'utf-8'},stdio:['ignore','pipe','pipe'],
  });
  let diagnostic='';child.stderr.on('data',data=>diagnostic+=data);
  try {
    const base=await new Promise((resolve,reject)=>{
      let output='';const timer=setTimeout(()=>reject(Error('Server startup timeout: '+diagnostic.slice(-2000))),20000);
      child.once('error',error=>{clearTimeout(timer);reject(error)});
      child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code+': '+diagnostic.slice(-2000)))});
      child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0])}});
    });
    return {base,stop:async()=>{if(child.exitCode===null){child.kill();await new Promise(resolve=>child.once('exit',resolve))}}};
  } catch(error) { if(child.exitCode===null)child.kill();throw error; }
}

export async function nodeServer(server,closeExtra=()=>{}) {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {base:`http://127.0.0.1:${server.address().port}`,stop:async()=>{await new Promise(resolve=>server.close(resolve));closeExtra()}};
}


async function presentation() {
  const ns='http://www.w3.org/2000/svg';
  const layer=document.createElement('div');layer.id='recording-overlays';layer.setAttribute('popover','manual');layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',maxWidth:'none',maxHeight:'none',margin:'0',padding:'0',border:'0',background:'transparent',pointerEvents:'none',overflow:'hidden'});
  const caption=document.createElement('div');caption.id='recording-caption';
  Object.assign(caption.style,{position:'absolute',left:'50%',bottom:'26px',transform:'translateX(-50%)',width:'max-content',maxWidth:'88vw',padding:'14px 22px',background:'rgba(12,16,20,.94)',color:'#ffffff',fontFamily:'Segoe UI,Arial,sans-serif',fontSize:'42px',fontWeight:'600',lineHeight:'1.24',textAlign:'center',whiteSpace:'normal',boxSizing:'border-box',borderRadius:'3px',pointerEvents:'none'});
  const pointer=document.createElement('div');pointer.id='recording-pointer';
  Object.assign(pointer.style,{position:'absolute',left:'0',top:'0',width:'36px',height:'42px',pointerEvents:'none',transform:'translate(38px,38px)'});
  const arrow=document.createElementNS(ns,'svg');arrow.setAttribute('viewBox','0 0 28 34');arrow.setAttribute('width','36');arrow.setAttribute('height','42');
  Object.assign(arrow.style,{width:'36px',height:'42px',maxWidth:'none',maxHeight:'none',display:'block',flexShrink:'0'});
  const shape=document.createElementNS(ns,'path');shape.setAttribute('d','M2 2 L2 25 L8 19 L14 31 L19 28 L13 17 L25 17 Z');shape.setAttribute('fill','white');shape.setAttribute('stroke','#111820');shape.setAttribute('stroke-width','1.8');shape.setAttribute('stroke-linejoin','round');arrow.append(shape);pointer.append(arrow);
  const ring=document.createElement('div');ring.id='recording-click';Object.assign(ring.style,{position:'absolute',width:'68px',height:'68px',border:'4px solid #d88818',borderRadius:'50%',transform:'translate(-34px,-34px)',display:'none',pointerEvents:'none',boxSizing:'border-box',background:'rgba(255,210,110,.22)'});
  layer.append(caption,ring,pointer);document.body.append(layer);layer.showPopover();
  let lastModal=null;const raise=()=>{const dialogs=[...document.querySelectorAll('dialog[open]')];const top=dialogs.at(-1)||null;if(top!==lastModal){lastModal=top;layer.hidePopover();layer.showPopover()}};
  new MutationObserver(raise).observe(document.body,{attributes:true,subtree:true,attributeFilter:['open']});
  document.addEventListener('pointermove',event=>{pointer.style.transform=`translate(${event.clientX}px,${event.clientY}px)`},{capture:true});
  let clickTimer;document.addEventListener('pointerdown',event=>{ring.style.left=event.clientX+'px';ring.style.top=event.clientY+'px';ring.style.display='block';clearTimeout(clickTimer);clickTimer=setTimeout(()=>ring.style.display='none',700)},{capture:true});
  window.__recordingPresentation={
    caption:text=>{caption.style.top='auto';caption.style.bottom='26px';caption.textContent=text;return new Promise(resolve=>requestAnimationFrame(()=>resolve({fontSize:getComputedStyle(caption).fontSize,height:caption.getBoundingClientRect().height,width:caption.getBoundingClientRect().width,topLayer:layer.matches(':popover-open')})))},
    avoidTarget:box=>{
      const intersects=()=>{const c=caption.getBoundingClientRect();return box.x<c.right+12&&box.x+box.width>c.left-12&&box.y<c.bottom+12&&box.y+box.height>c.top-12};
      let position=caption.style.top==='26px'?'top':'bottom';
      if(intersects()){
        position=position==='bottom'?'top':'bottom';
        caption.style.top=position==='top'?'26px':'auto';caption.style.bottom=position==='bottom'?'26px':'auto';
      }
      return {captionPosition:position,captionOverlapsTarget:intersects()};
    },
    info:()=>{const a=arrow.getBoundingClientRect(),s=getComputedStyle(shape),r=getComputedStyle(ring);return {topLayer:layer.matches(':popover-open'),pointer:!!document.getElementById('recording-pointer'),fontSize:getComputedStyle(caption).fontSize,pointerSvg:{width:a.width,height:a.height,fill:s.fill,stroke:s.stroke},clickMarker:{width:parseFloat(r.width),height:parseFloat(r.height),border:parseFloat(r.borderWidth),color:r.borderColor}}},
  };
}

export async function record({root,slug,start,walk}) {
  const output=path.resolve(root,process.argv[2]||'docs/videos');await mkdir(output,{recursive:true});
  const temporary=await mkdtemp(path.join(tmpdir(),'portfolio-video-hd-'));
  let server,browser,context,p;const cues=[],errors=[],actions=[];let started;let mouse={x:38,y:38};
  const timestamp=seconds=>new Date(Math.round(seconds*1000)).toISOString().slice(11,23);
  const cue=async text=>{
    const shown=await p.evaluate(text=>window.__recordingPresentation.caption(text),text);
    assert.equal(shown.fontSize,'42px');assert.equal(shown.topLayer,true);assert.ok(shown.height<140,'Keep captions within two readable lines');
    const now=(Date.now()-started)/1000;if(cues.length)cues.at(-1).end=now;cues.push({start:now,text});
  };
  try {
    server=await start(temporary);
    browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
    context=await browser.newContext({viewport:{width:1920,height:1080},screen:{width:1920,height:1080},deviceScaleFactor:1,acceptDownloads:true,recordVideo:{dir:path.join(temporary,'video'),size:{width:1920,height:1080}}});
    await context.addInitScript(repo=>{try{localStorage.setItem('portfolio-guide:'+repo+':v1','seen')}catch{}},slug);
    p=await context.newPage();const video=p.video();started=Date.now();
    p.on('pageerror',error=>errors.push(error.message));
    p.on('request',request=>assert.ok(!/api\.openai\.com|\/api\/extract(?:$|\?)/.test(request.url()),'Recording must not call AI'));
    await p.goto(server.base);await p.evaluate(presentation);
    const point=async locator=>{
      await locator.waitFor({state:'visible'});await locator.scrollIntoViewIfNeeded();
      await locator.evaluate(element=>element.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
      const box=await locator.boundingBox();assert.ok(box,'Visible target must have a bounding box');
      const placement=await p.evaluate(box=>window.__recordingPresentation.avoidTarget(box),box);
      assert.equal(placement.captionOverlapsTarget,false,'A caption must not hide the next control');
      const to={x:box.x+box.width/2,y:box.y+box.height/2,...placement};
      for(let i=1;i<=18;i++){await p.mouse.move(mouse.x+(to.x-mouse.x)*i/18,mouse.y+(to.y-mouse.y)*i/18);await p.waitForTimeout(22)}mouse=to;
      await p.waitForTimeout(480);return to;
    };
    const label=async locator=>(await locator.getAttribute('aria-label'))||(await locator.getAttribute('id'))||(await locator.innerText()).slice(0,100);
    const ui={
      click:async locator=>{const at=await point(locator);actions.push({kind:'click',target:await label(locator),...at,at:(Date.now()-started)/1000});await locator.click({delay:240});await p.waitForTimeout(500)},
      fill:async(locator,value)=>{const at=await point(locator);actions.push({kind:'fill',target:await label(locator),...at,at:(Date.now()-started)/1000});await locator.click({delay:180});await locator.fill(value);await p.waitForTimeout(500)},
      select:async(locator,value)=>{const at=await point(locator);actions.push({kind:'select',target:await label(locator),...at,at:(Date.now()-started)/1000});await locator.selectOption(value);await p.waitForTimeout(700)},
      check:async locator=>{await point(locator);await locator.check();await p.waitForTimeout(500)},
    };
    const hold=async(seconds=4)=>p.waitForTimeout(seconds*1000);
    const titles={datadesk:'DataDesk: kontrola objednávek a zásilek.',offerlens:'OfferLens: porovnání dodavatelských nabídek.','shop-ops-kit':'Shop Ops Kit: kontrola změn katalogu.',companyatlas:'CompanyAtlas: odpovědi z dokumentů a přístup podle role.',releaseguard:'ReleaseGuard: ověření e-shopu před vydáním.',planboard:'PlanBoard: zakázky, kapacity a provozní změny.',flowbridge:'FlowBridge: přenos objednávek do testovacího CRM.'};
    await cue(titles[slug]);await hold(3.5);
    const verified=await walk({p,base:server.base,cue,hold,output,ui});
    await p.screenshot({path:path.join(output,slug+'-poster.png')});
    await cue('Podrobný návod ke spuštění najdete v README projektu.');await hold(4);
    cues.at(-1).end=(Date.now()-started)/1000;assert.deepEqual(errors,[]);assert.ok(actions.length>=4);
    const overlay=await p.evaluate(()=>window.__recordingPresentation.info());assert.equal(overlay.topLayer,true);assert.equal(overlay.pointer,true);assert.deepEqual(overlay.pointerSvg,{width:36,height:42,fill:'rgb(255, 255, 255)',stroke:'rgb(17, 24, 32)'});assert.deepEqual(overlay.clickMarker,{width:68,height:68,border:4,color:'rgb(216, 136, 24)'});
    await context.close();context=null;const source=await video.path();const file=path.join(output,slug+'.mp4');
    // Explicitly omit audio. H.264/yuv420p and faststart support ordinary local players.
    execFileSync(process.env.PORTFOLIO_FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-ss','0.6','-i',source,'-an','-c:v','libx264','-crf','16','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',file],{windowsHide:true,stdio:['ignore','pipe','pipe'],timeout:180000});
    await writeFile(path.join(output,slug+'.vtt'),'WEBVTT\n\n'+cues.map((c,i)=>`${i+1}\n${timestamp(Math.max(0,c.start-.6))} --> ${timestamp(Math.max(0,c.end-.6))}\n${c.text}\n`).join('\n'));
    const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
    const sourceCode=await readFile(path.join(root,'scripts/record-demo.mjs')),helper=await readFile(path.join(root,'scripts/recording.mjs'));
    const metadata={recordedAt:new Date().toISOString(),sourceCommit:commit,scriptSha256:createHash('sha256').update(sourceCode).digest('hex'),helperSha256:createHash('sha256').update(helper).digest('hex'),videoSha256:createHash('sha256').update(await readFile(file)).digest('hex'),mode:'actual isolated local HTTP/browser; fictional data; AI disabled; silent Full HD app-only recording',presentation:{width:1920,height:1080,captionFontPixels:42,burnedInCaptions:true,visiblePointer:true,actualClickMarkers:true,audio:false,trimStartSeconds:.6,renderedOverlay:overlay},verified:{...verified,jsErrors:errors},captions:cues,actions};
    await writeFile(path.join(output,slug+'-recording.json'),JSON.stringify(metadata,null,2));
    console.log('Recorded silent Full HD '+slug+': '+cues.at(-1).end.toFixed(1)+'s, '+cues.length+' burned captions, '+actions.length+' visible actions.');
  } finally {
    await context?.close();await browser?.close();await server?.stop();
    if(path.dirname(path.resolve(temporary))!==path.resolve(tmpdir())||!path.basename(temporary).startsWith('portfolio-video-hd-'))throw Error('Unsafe recording cleanup path');
    await rm(temporary,{recursive:true,force:true});
  }
}
