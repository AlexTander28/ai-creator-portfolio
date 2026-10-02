const response=await fetch(new URL('assets/banners/manifest.json',import.meta.url));
if(!response.ok)throw new Error('Banner manifest unavailable');
const bannerHashes=new Set();
// Reference-only imports stay on disk but do not belong in the author gallery.
const referenceBannerIds=new Set(['banner-01','banner-21','banner-22','banner-23','banner-24','banner-25','banner-26']);
export const banners=(await response.json()).filter(item=>{
 if(referenceBannerIds.has(item.id))return false;
 if(bannerHashes.has(item.sha256))return false;
 bannerHashes.add(item.sha256);return true;
});
const section=document.createElement('section');section.id='banners';section.className='work-section light banner-section';
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const card=(item,overview=false)=>'<button type="button" class="'+(overview?'banner-thumb':'banner-card')+'" data-banner-open="'+item.id+'" aria-label="Открыть обложку: '+escape(item.title)+'"><img src="'+item.preview+'" alt="'+escape(item.title)+'" width="'+item.width+'" height="'+item.height+'" loading="lazy" decoding="async">'+(overview?'<span>'+escape(item.title)+'</span>':'')+'</button>';
const rowSize=Math.ceil(banners.length/3);
section.innerHTML='<div class="section-heading"><div><p class="eyebrow">Баннеры / '+banners.length+' обложек</p><h2>Обложки,<br>которые цепляют.</h2></div><p>Прокручивайте вниз — обложки движутся навстречу.<br>Нажмите на баннер, чтобы рассмотреть оригинал.</p></div><div class="banner-journey"><div class="banner-stage" aria-label="Три ряда обложек, управляемых прокруткой">'+[0,1,2].map(row=>'<div class="banner-row"><div class="banner-track">'+banners.slice(row*rowSize,row*rowSize+rowSize).map(item=>card(item)).join('')+'</div></div>').join('')+'</div></div><details class="banner-overview"><summary>Все обложки ('+banners.length+')</summary><div class="banner-all">'+banners.map(item=>card(item,true)).join('')+'</div></details>';
document.querySelector('.hero-intro').after(section);
const bannerNav=document.createElement('a');bannerNav.href='#banners';bannerNav.textContent='Баннеры';
document.querySelector('.discipline-nav a[href="#covers"]').after(bannerNav);
const journey=section.querySelector('.banner-journey'),stage=section.querySelector('.banner-stage');
const rows=[...section.querySelectorAll('.banner-track')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let current=0,target=0,speed=0,frame=0,previous=0,inView=false;
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const stopped=()=>reduced.matches||document.hidden||document.body.classList.contains('is-paused')||!!document.querySelector('dialog[open]');
function measure(){
 const rect=journey.getBoundingClientRect(),travel=journey.offsetHeight-stage.offsetHeight;
 target=travel>0?clamp(-rect.top/travel):0;
}
function draw(){
 const geometry=rows.map(track=>({travel:Math.max(0,track.scrollWidth-stage.clientWidth),width:track.querySelector('.banner-card').offsetWidth}));
 section.dataset.bannerProgress=current.toFixed(4);
 rows.forEach((track,row)=>{
  if(reduced.matches){track.style.transform='none';track.querySelectorAll('.banner-card').forEach(button=>{button.style.transform='none';button.style.filter='none';});return;}
  const {travel,width}=geometry[row],offset=-(row%2?1-current:current)*travel;
  track.style.transform='translate3d('+offset+'px,0,0)';
  const gap=16,gutter=24;
  track.querySelectorAll('.banner-card').forEach((button,index)=>{
   const center=gutter+index*(width+gap)+width/2+offset;
   const distance=clamp(Math.abs(center-stage.clientWidth/2)/(width*1.25));
   const scale=1.035-distance*.095;
   const skew=clamp(speed*(row%2?1:-1)*1.5,-3,3);
   button.style.transform='scale('+scale.toFixed(4)+') skewX('+skew.toFixed(3)+'deg)';
   button.style.filter='blur('+Math.min(12,Math.abs(speed)*6).toFixed(3)+'px)';
  });
 });
}
function stop(){if(frame)cancelAnimationFrame(frame);frame=0;previous=0;speed=0;draw();}
function tick(now){
 frame=0;if(!inView||stopped()){stop();return;}
 const dt=previous?Math.min(64,now-previous):16.67;previous=now;
 const before=current;current+=(target-current)*(1-Math.exp(-dt/105));
 if(Math.abs(target-current)<.00005)current=target;
 const travel=Math.max(...rows.map(row=>Math.max(0,row.scrollWidth-stage.clientWidth)));
 speed+=( ((current-before)*travel/dt)-speed)*(1-Math.exp(-dt/65));
 if(Math.abs(speed)<.002)speed=0;
 draw();if(current!==target||speed!==0)frame=requestAnimationFrame(tick);else previous=0;
}
function wake(){measure();if(reduced.matches){current=target;draw();return;}if(inView&&!stopped()&&!frame)frame=requestAnimationFrame(tick);}
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)wake();else stop();},{threshold:0}).observe(journey);
window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',()=>{measure();current=target;draw();wake();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else wake();});
new MutationObserver(()=>{if(stopped())stop();else wake();}).observe(document.body,{attributes:true,attributeFilter:['class']});
reduced.addEventListener('change',()=>{stop();measure();current=target;draw();wake();});
section.querySelectorAll('.banner-card').forEach(button=>button.addEventListener('focus',()=>{
 if(reduced.matches)return;
 const track=button.closest('.banner-track'),row=rows.indexOf(track),index=[...track.children].indexOf(button);
 const width=button.offsetWidth,travel=Math.max(1,track.scrollWidth-stage.clientWidth);
 let position=clamp((24+index*(width+16)+width/2-stage.clientWidth/2)/travel);if(row%2)position=1-position;
 const top=journey.getBoundingClientRect().top+scrollY;
 scrollTo({top:top+position*(journey.offsetHeight-stage.offsetHeight),behavior:'instant'});
 current=target=position;speed=0;draw();
}));
const viewer=document.createElement('dialog');viewer.id='banner-dialog';viewer.className='banner-dialog';viewer.setAttribute('aria-labelledby','banner-dialog-title');
viewer.innerHTML='<div class="dialog-bar"><div><p class="eyebrow">Обложка / оригинал</p><h2 id="banner-dialog-title"></h2></div><button type="button" class="banner-close" aria-label="Закрыть обложку" autofocus>Закрыть ×</button></div><div class="dialog-media"></div>';
document.body.append(viewer);let opener=null,overflow='';
section.addEventListener('click',event=>{
 const button=event.target.closest('[data-banner-open]');if(!button)return;
 const item=banners.find(item=>item.id===button.dataset.bannerOpen);if(!item)return;
 opener=button;overflow=document.body.style.overflow;
 viewer.querySelector('h2').textContent=item.title;
 viewer.querySelector('.dialog-media').innerHTML='<img src="'+item.src+'" alt="Оригинал: '+escape(item.title)+'" width="'+item.width+'" height="'+item.height+'">';
 document.querySelectorAll('video').forEach(video=>video.pause());viewer.showModal();document.body.style.overflow='hidden';stop();
});
viewer.querySelector('.banner-close').onclick=()=>viewer.close();
viewer.addEventListener('close',()=>{document.body.style.overflow=overflow;opener?.focus({preventScroll:true});wake();});
measure();current=target;draw();
