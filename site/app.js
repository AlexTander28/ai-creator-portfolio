import './hero-variant.js?v=47562b8f9b21';
import {groups,featuredUi,videos,demos,imageWorks,categoryLabels} from './data.js?v=47562b8f9b21';
import {initRibbon} from './ribbon.js?v=47562b8f9b21';
import {initHeroDirector} from './hero-director.js?v=47562b8f9b21';
import './figma.js?v=47562b8f9b21';
import './banners.js?v=47562b8f9b21';
const $=selector=>document.querySelector(selector);
// Temporarily disabled by user request. Keep the section and all assets for restoration.
const videoSectionEnabled=false;
const adsSectionEnabled=false;
$('#ads').hidden=!adsSectionEnabled;
document.querySelectorAll('a[href="#ads"]').forEach(link=>link.hidden=!adsSectionEnabled);
$('#video').hidden=!videoSectionEnabled;
document.querySelectorAll('a[href="#video"]').forEach(link=>link.hidden=!videoSectionEnabled);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const dialog=$('#work-dialog');
let paused=false,opener=null,viewed=0,ribbon=null,heroDirector=null,previous=0,animationFrame=0;
const visible=new Map();
const stopped=el=>paused||reduced.matches||document.hidden||!!document.querySelector('dialog[open]')||!visible.get(el);
const image=(item,lazy=true)=>'<img src="'+item.src+'" alt="'+item.title+'" '+(lazy?'loading="lazy"':'')+' decoding="async">';
['site-showcase-label','poster-label','ui-label'].forEach(id=>{const node=$('#'+id);node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.setAttribute('aria-atomic','true');});
Object.entries(groups).forEach(([key,items])=>{
 const catalogue=$('[data-catalogue="'+key+'"]');
 if(catalogue)catalogue.innerHTML=items.map((item,i)=>'<button class="work-thumb" data-work-id="'+item.id+'" data-open="'+item.id+'" type="button" aria-label="Открыть: '+item.title+'">'+image(item)+'<span class="thumb-caption"><span>'+item.title+'</span><span class="thumb-index">'+String(i+1).padStart(2,'0')+'</span></span></button>').join('');
});
if(videoSectionEnabled)$('#video-grid').innerHTML=videos.map(item=>'<figure class="video-item"><video data-work-id="'+item.id+'" controls muted loop playsinline preload="metadata" poster="'+item.poster+'" aria-label="Сгенерированное AI-видео: '+item.title+'"><source src="'+item.src+'" type="video/mp4"></video><figcaption><span>'+item.title+'</span><small>● Сгенерировано / 5 сек</small></figcaption></figure>').join('');
$('#demo-list').innerHTML=demos.map((item,i)=>'<a class="demo-link" data-work-id="'+item.id+'" data-demo-link href="'+item.href+'"><span class="demo-num">'+String(i+1).padStart(2,'0')+'</span><h3>'+item.title+'</h3><p>'+item.description+'</p><span class="demo-arrow" aria-hidden="true">↗</span></a>').join('');
function renderViewer(){
 const item=imageWorks[viewed];$('#dialog-title').textContent=item.title;$('#dialog-category').textContent=categoryLabels[item.category];$('.dialog-media').innerHTML=image(item,false);$('#dialog-original').href=item.src;$('#dialog-count').textContent=(viewed+1)+' / '+imageWorks.length;
}
function openWork(item){
 if(!item)return;const index=typeof item==='number'?item:imageWorks.findIndex(work=>work.id===item.id||work.src===item.src);
 if(index<0)return;viewed=index;opener=document.activeElement;renderViewer();dialog.showModal();document.querySelectorAll('video').forEach(v=>v.pause());document.body.style.overflow='hidden';ribbon?.refresh?.();
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-open],[data-showcase-open]');if(button){const id=button.dataset.open||button.dataset.showcaseOpen;openWork(imageWorks.find(item=>item.id===id));}});
$('#dialog-close').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus({preventScroll:true});ribbon?.refresh?.();syncHeroVideo();wake();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
function stepViewer(direction){viewed=(viewed+direction+imageWorks.length)%imageWorks.length;renderViewer();}
$('#dialog-prev').onclick=()=>stepViewer(-1);$('#dialog-next').onclick=()=>stepViewer(1);
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();stepViewer(event.key==='ArrowLeft'?-1:1);}});
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{visible.set(entry.target,entry.isIntersecting);if(entry.target.tagName==='VIDEO'&&!entry.isIntersecting)entry.target.pause();if(entry.target.id==='site-showcase')ribbon?.refresh?.();});syncHeroVideo();wake();},{threshold:.08});
document.querySelectorAll('.motion-stage,video').forEach(el=>observer.observe(el));
document.querySelectorAll('video').forEach(video=>video.addEventListener('play',()=>document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();})));
const siteShowcase=$('#site-showcase');
ribbon=initRibbon(siteShowcase,featuredUi,{onOpen:openWork,isPaused:()=>stopped(siteShowcase)});
siteShowcase.addEventListener('ribbonchange',event=>{$('#site-showcase-label').textContent=(featuredUi[event.detail.index]?.title||'Сайты и интерфейсы')+' / desktop + mobile';});
const mosaic=$('#mosaic-stage'),rows=[];
const coverCatalogue=$('#covers .catalogue'),coverToolbar=$('#covers .stage-toolbar');
const coverControls=document.createElement('div');coverControls.className='cover-controls';
coverToolbar.before(coverControls);coverControls.append(coverToolbar,coverCatalogue);
const covers=$('#covers'),coverGallery=document.createElement('div'),coverModes=document.createElement('div');
coverGallery.className='cover-gallery';coverGallery.id='cover-gallery';
coverGallery.innerHTML=groups.cover.map(item=>'<button type="button" class="cover-art" data-open="'+item.id+'" aria-label="Рассмотреть обложку: '+item.title+'"><span class="cover-picture">'+image(item)+'</span><span class="cover-caption"><span>'+item.title+'</span><span class="cover-action">Рассмотреть ↗</span></span></button>').join('');
coverModes.className='cover-modes';coverModes.setAttribute('role','group');coverModes.setAttribute('aria-label','Вариант показа обложек');
coverModes.innerHTML='<span>Семь работ — каждый кадр целиком</span><div><button type="button" data-cover-mode="gallery" aria-controls="cover-gallery">Витрина</button><button type="button" data-cover-mode="mosaic" aria-controls="mosaic-stage">Мозаика</button></div>';
mosaic.before(coverModes,coverGallery);
let coverMode='gallery',coverFrame=0;
try{if(localStorage.getItem('ai-creator-cover-mode')==='mosaic')coverMode='mosaic';}catch{}
function setCoverMode(mode){
 coverMode=mode;covers.dataset.coverMode=mode;coverGallery.hidden=mode!=='gallery';mosaic.hidden=mode!=='mosaic';coverControls.hidden=mode!=='mosaic';
 coverModes.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.coverMode===mode)));
 try{localStorage.setItem('ai-creator-cover-mode',mode);}catch{}
 requestAnimationFrame(()=>{syncMosaicScroll();syncCoverGallery();});
}
coverModes.addEventListener('click',event=>{const button=event.target.closest('[data-cover-mode]');if(button)setCoverMode(button.dataset.coverMode);});
function syncCoverGallery(){
 if(coverMode!=='gallery'||coverFrame)return;
 coverFrame=requestAnimationFrame(()=>{coverFrame=0;
  const staticView=reduced.matches||innerWidth<=650;
  if(!staticView&&(paused||document.hidden||document.querySelector('dialog[open]')))return;
  const bounds=coverGallery.getBoundingClientRect();if(bounds.bottom<0||bounds.top>innerHeight)return;
  coverGallery.querySelectorAll('.cover-art').forEach(card=>{const rect=card.getBoundingClientRect(),distance=(rect.top+rect.height/2-innerHeight*.52)/(innerHeight*.65),focus=staticView?0:Math.max(0,1-Math.abs(distance));
   card.style.setProperty('--cover-scale',(1+focus*.06).toFixed(4));card.style.setProperty('--cover-drift',staticView?'0px':(Math.sign(distance)*(1-focus)*6).toFixed(2)+'px');
  });
 });
}
window.addEventListener('scroll',syncCoverGallery,{passive:true});window.addEventListener('resize',syncCoverGallery);reduced.addEventListener('change',syncCoverGallery);
for(let r=0;r<7;r++){
 const row=document.createElement('div');row.className='mosaic-row';
 for(let c=0;c<6;c++){
  const item=groups.cover[(r*3+c)%groups.cover.length],tile=document.createElement('button');tile.type='button';tile.className='mosaic-tile';tile.tabIndex=-1;tile.dataset.showcaseOpen=item.id;tile.setAttribute('aria-label','Открыть: '+item.title);tile.style.width=[36,32,40,34,38,35][(r+c)%6]+'%';tile.innerHTML=image(item);row.append(tile);
 }
 $('.mosaic-field').append(row);rows.push(row);
}
// Covers are a scroll scene, not an autoplay loop: the page's natural vertical
// scroll controls the passage of the covers.  Keep a small manual offset for the
// accessible toolbar buttons without taking control away from the page.
let mosaicProgress=reduced.matches ? .18 : 0, mosaicOffset=0;
function clamp(value,min=0,max=1){return Math.max(min,Math.min(max,value));}
function drawMosaic(){
 if(coverMode!=='mosaic')return;
 const height=mosaic.clientHeight;
 const growth=reduced.matches?1:1+mosaicProgress*.8;
 const tileWidth=Math.min(mosaic.clientWidth*.86,Math.max(280,mosaic.clientWidth*.40)*growth);
 const rowHeight=tileWidth*9/16,rowStep=rowHeight+10,cycleLength=rowStep*rows.length;
 const phase=reduced.matches ? .18 : ((mosaicProgress+mosaicOffset)%1+1)%1;
 const entrance=reduced.matches?1:clamp(mosaicProgress/.18);
  const exit= reduced.matches?0:clamp((mosaicProgress-.8)/.2);
  mosaic.style.setProperty('--mosaic-exit',String(exit));
  mosaic.style.setProperty('--mosaic-progress',String(mosaicProgress));
 rows.forEach((row,r)=>{
  const y=((r*rowStep-phase*cycleLength+cycleLength)%cycleLength)-rowHeight;
  const rowEntrance=clamp((entrance*1.35)-(r*.055));
  const scale=1;
  row.querySelectorAll('.mosaic-tile').forEach(tile=>{tile.style.width=tileWidth+'px';});
  row.style.transformOrigin='center center';row.style.height=Math.max(1,rowHeight-4)+'px';
  row.style.opacity=String(.15+rowEntrance*.85);
  row.style.transform='translate3d(0,'+y+'px,0) scale('+scale+')';
 });
}
function syncMosaicScroll(){
 if(coverMode!=='mosaic')return;
 if(reduced.matches){mosaicProgress=.18;drawMosaic();return;}
 const rect=mosaic.getBoundingClientRect(),viewport=Math.max(window.innerHeight,1);
 // Progress runs while the stage enters and leaves the viewport. This lets the
 // covers fly past during an ordinary downward page scroll, with no scroll hijack.
 mosaicProgress=clamp((viewport-rect.top)/(viewport+rect.height));
 const catalogueTop=rect.top+coverControls.offsetTop-mosaic.offsetTop;
 const takeover=clamp((viewport*.95-catalogueTop)/(viewport*.7));
 coverControls.style.setProperty('--catalogue-rise',(-takeover*Math.min(360,viewport*.42)).toFixed(1)+'px');
 drawMosaic();
}
window.addEventListener('scroll',syncMosaicScroll,{passive:true});
window.addEventListener('resize',syncMosaicScroll);
drawMosaic();
setCoverMode(coverMode);
const poster=$('#poster-stage');
let posterIndex=0,posterTime=0,posterPosition=groups.ad.length,posterMoving=false;
poster.querySelectorAll('.poster-panel').forEach(panel=>panel.remove());
const posterViewport=document.createElement('div'),posterTrack=document.createElement('div');
posterViewport.className='poster-viewport';posterTrack.className='poster-track';
posterViewport.append(posterTrack);poster.prepend(posterViewport);
const posterItems=[...groups.ad,...groups.ad,...groups.ad];
posterTrack.innerHTML=(adsSectionEnabled?posterItems:[]).map((item,i)=>'<button class="poster-card" type="button" data-showcase-open="'+item.id+'" aria-label="Открыть: '+item.title+'">'+image(item,i<groups.ad.length||i>=groups.ad.length*2)+'</button>').join('');
const posterCards=[...posterTrack.children];
function updatePosterState(){
 const item=groups.ad[posterIndex];
 $('#poster-label').textContent=(posterIndex+1)+' / '+groups.ad.length+' · '+item.title;
 $('#poster-open').setAttribute('aria-label','Открыть оригинал: '+item.title);
 posterCards.forEach((card,i)=>{
  const active=i===posterPosition;
  card.classList.toggle('is-active',active);
  card.setAttribute('aria-current',active?'true':'false');
  card.tabIndex=active?0:-1;
 });
}
function drawPosters(animate=false){
 const card=posterCards[posterPosition];if(!card)return;
 // Layout coordinates exclude each card's scale transition and include the real gap.
 const offset=poster.clientWidth/2-card.offsetLeft-card.offsetWidth/2;
 posterTrack.classList.toggle('is-moving',animate&&!paused&&!reduced.matches);
 posterTrack.style.transform='translate3d('+offset+'px,0,0)';
 updatePosterState();
}
function settlePoster(){
 posterMoving=false;posterTrack.classList.remove('is-moving');
 const count=groups.ad.length;
 if(posterPosition<count)posterPosition+=count;
 else if(posterPosition>=count*2)posterPosition-=count;
 drawPosters(false);
}
function movePoster(direction){
 if(!adsSectionEnabled)return;
 if(posterMoving)return;
 posterTime=0;posterIndex=(posterIndex+direction+groups.ad.length)%groups.ad.length;posterPosition+=direction;
 if(paused||reduced.matches){const count=groups.ad.length;if(posterPosition<count)posterPosition+=count;if(posterPosition>=count*2)posterPosition-=count;drawPosters(false);return;}
 posterMoving=true;drawPosters(true);
}
posterTrack.addEventListener('transitionend',event=>{if(event.target===posterTrack&&event.propertyName==='transform')settlePoster();});
// Resizing cancels the CSS transition, so also release the moving state.
new ResizeObserver(()=>settlePoster()).observe(poster);
poster.addEventListener('keydown',event=>{
 if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
 event.preventDefault();if(posterMoving)return;
 movePoster(event.key==='ArrowLeft'?-1:1);posterCards[posterPosition].focus({preventScroll:true});
});
$('#poster-open').onclick=()=>openWork(groups.ad[posterIndex]);drawPosters(false);
let uiIndex=0,uiTime=0,uiTransition=null,uiWheelIntent=0,uiWheelVelocity=0;
let uiAutoplayPaused=false,uiAutoVisible=false;
const uiStage=$('#ui-stage');
const uiAutoToggle=document.createElement('button');
uiAutoToggle.type='button';uiAutoToggle.className='ui-auto-toggle';
uiAutoToggle.textContent='Пауза карточек';uiAutoToggle.setAttribute('aria-pressed','false');
uiAutoToggle.setAttribute('aria-label','Приостановить автоматическое перелистывание UI/UX-карточек');
$('.ui-controls').append(uiAutoToggle);
uiAutoToggle.addEventListener('click',()=>{
 uiAutoplayPaused=!uiAutoplayPaused;uiTime=0;
 uiAutoToggle.setAttribute('aria-pressed',String(uiAutoplayPaused));
 uiAutoToggle.textContent=uiAutoplayPaused?'Продолжить':'Пауза карточек';
 uiAutoToggle.setAttribute('aria-label',uiAutoplayPaused?'Продолжить автоматическое перелистывание UI/UX-карточек':'Приостановить автоматическое перелистывание UI/UX-карточек');
 wake();
});
new IntersectionObserver(entries=>{uiAutoVisible=entries[0].isIntersecting;uiTime=0;wake();},{threshold:.35}).observe($('.ui-deck'));
uiStage.addEventListener('pointerenter',()=>{uiTime=0;});
uiStage.addEventListener('pointerleave',()=>{uiTime=0;wake();});
uiStage.addEventListener('focusin',()=>{uiTime=0;});
uiStage.addEventListener('focusout',()=>{uiTime=0;wake();});
document.querySelectorAll('dialog').forEach(viewer=>viewer.addEventListener('close',()=>{uiTime=0;wake();}));
$('.ui-deck').innerHTML=groups.ui.map(item=>'<button class="ui-card" type="button" data-showcase-open="'+item.id+'" aria-label="Открыть: '+item.title+'">'+image(item)+'<span>'+item.title+' / UI-концепт ↗</span></button>').join('');
const cards=[...document.querySelectorAll('.ui-card')];
const uiRotations=[0,5,-6,8];
function uiRotation(relative){
 const low=Math.floor(relative),high=Math.ceil(relative),mix=relative-low,from=uiRotations[Math.max(0,Math.min(3,low))]||0,to=uiRotations[Math.max(0,Math.min(3,high))]||0;
 return from+(to-from)*mix;
}
function drawUI(){
 const direction=uiTransition?.direction||0,progress=uiTransition?.progress||0,eased=progress*progress*(3-2*progress);
 cards.forEach((card,i)=>{
  let relative=(i-uiIndex+cards.length)%cards.length;
  if(direction<0&&relative===cards.length-1)relative=-1;
  if(direction)relative-=direction*eased;
  const shown=relative>-.99&&relative<3.99,opacity=Math.max(0,Math.min(1,relative<0?relative+1:4-relative)),depth=Math.max(0,relative);
  card.style.zIndex=String(20-Math.round(depth*2));card.style.visibility=shown?'visible':'hidden';card.style.opacity=String(opacity);card.style.pointerEvents=shown&&opacity>.55?'auto':'none';card.tabIndex=Math.abs(relative)<.01?0:-1;
  card.style.transform='translate3d('+(relative*19)+'%,'+(depth*5)+'px,'+(-depth*20)+'px) rotate('+uiRotation(relative)+'deg) scale('+(1-depth*.055-Math.max(0,-relative)*.035)+')';
 });
 const labelIndex=uiTransition&&progress>.5?(uiIndex+direction+cards.length)%cards.length:uiIndex;$('#ui-label').textContent=groups.ui[labelIndex].title;
}
function startUITransition(direction,duration=720){
 if(uiTransition){uiIndex=(uiIndex+uiTransition.direction+cards.length)%cards.length;uiTransition=null;}
 if(paused||reduced.matches){uiIndex=(uiIndex+direction+cards.length)%cards.length;uiTime=0;drawUI();return;}
 uiTransition={direction,progress:0,duration};uiTime=0;drawUI();wake();
}
function advanceUI(delta){
 if(uiTransition?.auto&&(uiAutoplayPaused||uiStage.matches(':hover')||uiStage.contains(document.activeElement)))return;
 if(uiTransition){
  uiTransition.progress=Math.min(1,uiTransition.progress+delta/uiTransition.duration);drawUI();
  if(uiTransition.progress>=1){uiIndex=(uiIndex+uiTransition.direction+cards.length)%cards.length;uiTransition=null;uiTime=0;drawUI();drainUIWheel();}
  return;
 }
 if(uiAutoplayPaused||!uiAutoVisible||uiStage.matches(':hover')||uiStage.contains(document.activeElement)){uiTime=0;return;}
 uiTime+=delta;
 if(uiTime>=3800){startUITransition(1,1100);uiTransition.auto=true;}
}
function drainUIWheel(){
 if(Math.abs(uiWheelIntent)<1)return;
 if(paused||reduced.matches){
  while(Math.abs(uiWheelIntent)>=1){const direction=Math.sign(uiWheelIntent);uiWheelIntent-=direction;uiIndex=(uiIndex+direction+cards.length)%cards.length;}
  uiTime=0;drawUI();return;
 }
 if(uiTransition)return;
 const direction=Math.sign(uiWheelIntent);uiWheelIntent-=direction;
 // Fast wheel movement shortens only the transition; the layout remains legible.
 const duration=Math.max(220,720/(1+Math.min(2.2,uiWheelVelocity)));
 uiWheelVelocity=Math.max(0,uiWheelVelocity-.35);
 startUITransition(direction,duration);
}
$('.ui-deck').addEventListener('wheel',event=>{
 // Vertical gestures belong to the page. Horizontal gestures cycle concepts.
 if(Math.abs(event.deltaX)<=Math.abs(event.deltaY)&&!event.shiftKey)return;
 const units=event.deltaMode===1?16:event.deltaMode===2?window.innerWidth:1;
 const delta=(event.shiftKey?event.deltaY:event.deltaX)*units;
 if(!delta)return;
 // Consume only the explicitly horizontal gallery gesture.
 event.preventDefault();
 uiWheelIntent+=delta/55;
 uiWheelIntent=Math.max(-18,Math.min(18,uiWheelIntent));
 uiWheelVelocity=Math.min(2.2,uiWheelVelocity+Math.abs(delta)/260);
 drainUIWheel();
},{passive:false});
drawUI();
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{
 const [stage,step]=button.dataset.step.split(':'),direction=Number(step);
 if(stage==='sites'){direction>0?ribbon.next?.():ribbon.prev?.();}
 if(stage==='poster')movePoster(direction);
 if(stage==='ui')startUITransition(direction);
 if(stage==='mosaic'){mosaicOffset+=direction*.14;drawMosaic();}
}));
function syncPause(){
 const motionStopped=paused||reduced.matches;
 document.body.classList.toggle('is-paused',motionStopped);
 $('#motion-toggle').setAttribute('aria-pressed',String(motionStopped));
 $('#motion-toggle').textContent=reduced.matches?'Движение ограничено системой':paused?'Продолжить движение':'Пауза движения';
 $('#motion-toggle').disabled=reduced.matches;
 if(motionStopped&&posterMoving){settlePoster();drawPosters(false);}
 if(motionStopped||document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());
 ribbon?.refresh?.();syncHeroVideo();syncCoverGallery();wake();
}
$('#motion-toggle').onclick=()=>{paused=!paused;syncPause();};document.addEventListener('visibilitychange',syncPause);
reduced.addEventListener('change',()=>{if(reduced.matches){mosaicProgress=.18;mosaicOffset=0;drawMosaic();posterTime=0;settlePoster();drawPosters(false);}else syncMosaicScroll();syncPause();});
const hero=$('.hero-intro'),heroVideo=$('#hero-video');
if(heroVideo){
 heroVideo.loop=true;
 // Native looping is preferred; this recovery only runs in engines that still emit `ended`.
 heroVideo.addEventListener('ended',()=>{heroVideo.currentTime=0;syncHeroVideo();});
}
function syncHeroVideo(){if(!heroVideo)return;heroDirector?.refresh();if(paused||reduced.matches||document.hidden||dialog.open||!visible.get(heroVideo)){heroVideo.pause();return;}if(heroDirector?.isManual())return;heroVideo.play().catch(()=>{});}
let heroPointing=false;
function pointingAtHeroText(time){return(time>=.05&&time<2.3)||(time>=4.6&&time<6.92);}
function syncHeroPointing(){
 if(!hero||!heroVideo)return;
 const active=!paused&&!reduced.matches&&pointingAtHeroText(heroVideo.currentTime);
 if(active===heroPointing)return;
 heroPointing=active;
 hero.classList.toggle('is-hero-pointing',active);
 if(!active)return;
 hero.classList.remove('hero-text-jitter');
 void hero.offsetWidth;
 hero.classList.add('hero-text-jitter');
}
heroVideo?.addEventListener('timeupdate',syncHeroPointing);
heroVideo?.addEventListener('seeking',syncHeroPointing);
heroVideo?.addEventListener('pause',syncHeroPointing);
heroVideo?.addEventListener('play',syncHeroPointing);
hero?.addEventListener('pointermove',event=>{if(!heroVideo||paused||reduced.matches||heroDirector?.isManual())return;const rect=hero.getBoundingClientRect(),amount=(event.clientX-rect.left)/rect.width-.5;hero.style.setProperty('--hero-shift-a',(amount*18).toFixed(2)+'px');hero.style.setProperty('--hero-shift-b',(-amount*14).toFixed(2)+'px');});
hero?.addEventListener('pointerleave',()=>{hero.style.setProperty('--hero-shift-a','0px');hero.style.setProperty('--hero-shift-b','0px');});
if(heroVideo)heroDirector=initHeroDirector(hero,heroVideo,{isStopped:()=>paused||reduced.matches||document.hidden||!!document.querySelector('dialog[open]')});
syncPause();
function wake(){if(!animationFrame){previous=0;animationFrame=requestAnimationFrame(frame);}}
function frame(now){
 animationFrame=0;
 if([poster,$('#ui-stage')].every(stopped))return;
 const delta=previous?Math.min(now-previous,70):0;previous=now;
 if(!stopped(poster)&&!posterMoving){posterTime+=delta;if(posterTime>=3600)movePoster(1);}
 if(!stopped($('#ui-stage')))advanceUI(delta);
 animationFrame=requestAnimationFrame(frame);
}
wake();
