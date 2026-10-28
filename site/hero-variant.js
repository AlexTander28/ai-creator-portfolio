import {initLiquidHero} from './hero-liquid.js?v=3a91c3d7bc45';

// Approved for publication; the previous Hero remains available by query.
const HERO_VARIANT='liquid';
const requested=new URLSearchParams(location.search).get('heroVariant');
const variant=['legacy','liquid'].includes(requested)?requested:HERO_VARIANT;
const tone=new URLSearchParams(location.search).get('heroTone')==='purple'?'purple':'amber';
const hero=document.querySelector('.hero-intro');
const media=document.querySelector('#hero-legacy-media');
document.documentElement.dataset.heroVariant=variant;
document.documentElement.dataset.heroTone=tone;
if(tone==='amber')document.querySelectorAll('.site-header a[href="#contact"],.contact-links a').forEach(a=>{a.textContent=a.textContent.replace(/[↗\uFE0F]/g,'').trim();});
if(variant==='legacy'){
 hero.prepend(media.content.cloneNode(true));
}else{
 hero.classList.add('hero-liquid');
 document.querySelector('.site-header').classList.add('liquid-header');
 const surface=document.createElement('div');surface.className='liquid-surface';surface.setAttribute('aria-hidden','true');
 surface.innerHTML='<canvas class="liquid-canvas"></canvas>';hero.prepend(surface);
 const portrait=document.createElement('figure');portrait.className='liquid-portrait';
 portrait.innerHTML='<img src="assets/hero-liquid-portrait.png" width="512" height="512" alt="Александр" fetchpriority="high" decoding="async">';
 document.querySelector('.hero-content').append(portrait);
 // Preserve the exact wording, with a three-line composition like the reference.
 const first=hero.querySelector('.hero-title-line-a');first.innerHTML=first.textContent.trim().replace(/\.\s+/g,'.<br> ');
 initLiquidHero(hero);
}
media.remove();
