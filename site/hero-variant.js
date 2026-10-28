import {initLiquidHero} from './hero-liquid.js?v=fc7d219a36eb';

// Approved for publication; the previous Hero remains available by query.
const HERO_VARIANT='liquid';
const requested=new URLSearchParams(location.search).get('heroVariant');
const variant=['legacy','liquid'].includes(requested)?requested:HERO_VARIANT;
const tone=new URLSearchParams(location.search).get('heroTone')==='purple'?'purple':'amber';
const hero=document.querySelector('.hero-intro');
const media=document.querySelector('#hero-legacy-media');
document.documentElement.dataset.heroVariant=variant;
document.documentElement.dataset.responsive=new URLSearchParams(location.search).get('responsive')==='previous'?'previous':'polished';
document.documentElement.dataset.heroTone=tone;
document.documentElement.dataset.heroStage=new URLSearchParams(location.search).get('heroStage')==='previous'?'previous':'full';
if(tone==='amber')document.querySelectorAll('.site-header a[href="#contact"],.contact-links a').forEach(a=>{a.textContent=a.textContent.replace(/[↗\uFE0F]/g,'').trim();});
if(variant==='legacy'){
 hero.prepend(media.content.cloneNode(true));
}else{
 hero.classList.add('hero-liquid');
 document.querySelector('.site-header').classList.add('liquid-header');
 const surface=document.createElement('div');surface.className='liquid-surface';surface.setAttribute('aria-hidden','true');
 surface.innerHTML='<canvas class="liquid-canvas"></canvas>';hero.prepend(surface);
 const portrait=document.createElement('figure');portrait.className='liquid-portrait';
 portrait.innerHTML='<div class="portrait-shape"><img src="assets/hero-liquid-portrait.png" width="512" height="512" alt="Александр" fetchpriority="high" decoding="async"></div>';
 if(new URLSearchParams(location.search).get('portraitMotion')==='off')hero.classList.add('portrait-static');
 document.querySelector('.hero-content').append(portrait);
 if(new URLSearchParams(location.search).get('heroLayout')!=='previous'){
  hero.classList.add('hero-portrait-up');
  const title=hero.querySelector('h1'),composition=document.createElement('div');composition.className='liquid-composition';title.before(composition);composition.append(title,portrait);
  const caption=document.createElement('figcaption');caption.className='portrait-note';caption.innerHTML='<span>Сначала разбираюсь,<br>потом создаю.</span><svg viewBox="0 0 55 65" fill="none" aria-hidden="true"><path d="M12 5C3 22 35 16 28 36S43 44 36 60M36 60l-8-9M36 60l11-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  portrait.append(caption);
 }
 // Preserve the exact wording, with a three-line composition like the reference.
 const first=hero.querySelector('.hero-title-line-a');first.innerHTML=first.textContent.trim().replace(/\.\s+/g,'.<br> ');
 if(new URLSearchParams(location.search).get('heroCopy')!=='previous'){
  hero.classList.add('hero-process-copy');
  hero.querySelector('h1').innerHTML='<span class="hero-title-line hero-title-line-a">Сначала<br> разбираюсь,</span><span class="hero-title-line hero-title-line-b"> потом создаю.</span>';
 }
 if(document.documentElement.dataset.responsive==='polished'&&hero.classList.contains('hero-process-copy')&&hero.classList.contains('hero-portrait-up')){
  const mobile=matchMedia('(max-width:650px)'),composition=hero.querySelector('.liquid-composition'),note=hero.querySelector('.intro-note');
  const placePortrait=()=>{if(mobile.matches)note.after(portrait);else composition.append(portrait);};
  placePortrait();mobile.addEventListener('change',placePortrait);
 }
 initLiquidHero(hero);
}
media.remove();
