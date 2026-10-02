// Local user exports. No external design-file links are exposed on the site.
export const figmaProjects = [
 ['bike','Электровелосипеды'],['apartments','Продажа квартир'],
 ['office','Ремонт офисов'],['doors','Магазин дверей'],
 ['finance','Майнинг-платформа'],['beauty','Перманентный макияж'],
 ['gas','Доставка газа'],['realty','Агентство недвижимости'],
 ['water','Доставка воды'],['fences','Заборы'],['cosmetics','Косметика'],
 ['headphones','Наушники'],['audiobooks','Аудиокниги'],
 ['cargo','Авиаперевозки'],['gas-refill','Заправка газгольдера'],
 ['construction','Строительная компания']
].map(([id,title])=>({id,title,src:'assets/figma/'+id+(id==='cargo'?'.webp':'.png'),preview:'assets/figma/'+id+'-preview.webp'}));

const section=document.createElement('section');
section.id='figma';section.className='work-section light figma-section';
const available=figmaProjects.filter(p=>p.src);
section.innerHTML='<div class="section-heading"><div><p class="eyebrow">Веб-дизайн / '+available.length+' макетов</p><h2>От макета<br>к впечатлению.</h2></div><p>Сайты для разных задач и направлений.<br>Нажмите на работу — рассмотрите макет целиком.</p></div><div class="figma-featured">'+available.map(p=>'<article class="figma-project"><button type="button" class="figma-preview" data-figma-open="'+p.id+'" aria-label="Посмотреть полный макет: '+p.title+'"><img src="'+p.preview+'" alt="Первый экран макета: '+p.title+'" loading="lazy" decoding="async" width="1000" height="750"><span>Рассмотреть макет ↗</span></button><div class="figma-caption"><h3>'+p.title+'</h3></div></article>').join('')+'</div>';
document.querySelector('.hero-intro').after(section);
const gallery=section.querySelector('.figma-featured');gallery.id='figma-projects';
const extraProjects=[...gallery.children].slice(6);
extraProjects.forEach(project=>project.hidden=true);
const showMore=document.createElement('button');showMore.type='button';showMore.className='figma-more';
showMore.textContent='Смотреть больше ↓';showMore.setAttribute('aria-expanded','false');showMore.setAttribute('aria-controls',gallery.id);
section.append(showMore);
showMore.addEventListener('click',()=>{
 const expanded=showMore.getAttribute('aria-expanded')!=='true';
 if(!expanded)extraProjects.forEach(project=>resetPreview(project.querySelector('.figma-preview')));
 extraProjects.forEach(project=>project.hidden=!expanded);
 showMore.setAttribute('aria-expanded',String(expanded));
 showMore.textContent=expanded?'Свернуть ↑':'Смотреть больше ↓';
 if(!expanded)showMore.scrollIntoView({block:'nearest',behavior:'instant'});
});
const navLink=document.createElement('a');navLink.href='#figma';navLink.textContent='Макеты';
document.querySelector('.discipline-nav').prepend(navLink);

const viewer=document.createElement('dialog');viewer.id='figma-dialog';viewer.className='figma-dialog';viewer.setAttribute('aria-labelledby','figma-dialog-title');
viewer.innerHTML='<div class="dialog-bar"><div><p class="eyebrow">Веб-дизайн / полный макет</p><h2 id="figma-dialog-title"></h2></div><button type="button" class="figma-close" aria-label="Закрыть макет" autofocus>Закрыть ×</button></div><p class="figma-context">Автор макета — Александр. Ниже — полный дизайн страницы; это презентация работы, а не действующий сайт.</p><div class="figma-full" tabindex="0" aria-label="Прокручиваемый полный макет"></div><div class="figma-view-tools"><button type="button" class="figma-zoom" aria-pressed="false">Увеличить детали</button><a class="figma-original" target="_blank" rel="noopener">Оригинал ↗</a></div>';
document.body.append(viewer);
const hoverPointer=matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const previews=new Map();
const canAnimate=()=>hoverPointer.matches&&!reducedMotion.matches&&!document.hidden&&!viewer.open&&!document.body.classList.contains('is-paused');
function resetPreview(button){
 const state=previews.get(button);state.token++;
 state.animation?.cancel();state.animation=null;
 state.image?.remove();state.image=null;
 button.classList.remove('is-previewing');
}
async function startPreview(button){
 resetPreview(button);
 if(!canAnimate()||!button.matches(':hover'))return;
 const state=previews.get(button),token=state.token;
 const image=new Image();image.className='figma-scroll-image';image.alt='';image.setAttribute('aria-hidden','true');
 image.src='assets/figma/'+button.dataset.figmaOpen+'-scroll.webp';
 try{await image.decode();}catch{return;}
 if(token!==state.token||!canAnimate()||!button.matches(':hover'))return;
 state.image=image;button.append(image);
 const distance=Math.max(0,button.clientWidth*image.naturalHeight/image.naturalWidth-button.clientHeight);
 button.classList.add('is-previewing');
 state.animation=image.animate([{transform:'translateY(0)'},{transform:'translateY(-'+distance+'px)'}],{duration:Math.max(3000,distance/120*1000),easing:'linear',fill:'forwards'});
}
const previewVisibility=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)resetPreview(entry.target);}));
section.querySelectorAll('.figma-preview').forEach(button=>{
 previews.set(button,{token:0,image:null,animation:null});
 button.addEventListener('pointerenter',()=>startPreview(button));
 button.addEventListener('pointerleave',()=>resetPreview(button));
 previewVisibility.observe(button);
});
const resetAll=()=>previews.forEach((_,button)=>resetPreview(button));
document.addEventListener('visibilitychange',resetAll);
reducedMotion.addEventListener('change',resetAll);
hoverPointer.addEventListener('change',resetAll);
new MutationObserver(()=>{if(!canAnimate())resetAll();}).observe(document.body,{attributes:true,attributeFilter:['class']});
window.addEventListener('resize',resetAll);
let opener=null,previousOverflow='';
section.addEventListener('click',e=>{
 const button=e.target.closest('[data-figma-open]');if(!button)return;
 const project=available.find(p=>p.id===button.dataset.figmaOpen);if(!project)return;
 opener=button;previousOverflow=document.body.style.overflow;
 resetAll();
 viewer.querySelector('h2').textContent=project.title;
 viewer.querySelector('.figma-original').href=project.src;
 viewer.querySelector('.figma-zoom').setAttribute('aria-pressed','false');
 viewer.querySelector('.figma-zoom').textContent='Увеличить детали';
 viewer.classList.remove('is-zoomed');
 const media=viewer.querySelector('.figma-full');media.innerHTML='<img src="'+project.src+'" alt="Полный макет: '+project.title+'">';media.scrollTop=0;
 document.querySelectorAll('video').forEach(v=>v.pause());
 viewer.showModal();document.body.style.overflow='hidden';
});
viewer.querySelector('.figma-close').onclick=()=>viewer.close();
viewer.querySelector('.figma-zoom').onclick=()=>{
 const zoomed=viewer.classList.toggle('is-zoomed');
 const button=viewer.querySelector('.figma-zoom');
 button.setAttribute('aria-pressed',String(zoomed));
 button.textContent=zoomed?'Вписать в экран':'Увеличить детали';
};
viewer.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;opener?.focus({preventScroll:true});});
