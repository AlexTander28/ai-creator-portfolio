// The approved hero interaction, without a visible control panel.
export function initHeroDirector(hero,video,{isStopped}){
 const interactive=new URLSearchParams(location.search).get('hero')!=='autoplay';
 let manual=false,pointer=null,motionTimer=0,pointerPlayback=false;
 const available=()=>interactive&&!isStopped()&&hero.getBoundingClientRect().bottom>0&&Number.isFinite(video.duration)&&video.duration>0&&!video.error;
 function stopPointer(){
  clearTimeout(motionTimer);motionTimer=0;
  if(pointerPlayback){video.pause();video.playbackRate=1;}
  pointerPlayback=false;
 }
 function refresh(){if(!available()){stopPointer();pointer=null;}}
 hero.addEventListener('pointermove',event=>{
  if(!available()||event.pointerType!=='mouse'||event.target.closest('button,a,input,label')){stopPointer();pointer=null;return;}
  const next={x:event.clientX,y:event.clientY};
  if(pointer&&Math.hypot(next.x-pointer.x,next.y-pointer.y)<.25)return;
  pointer=next;manual=true;
  hero.classList.add('is-director-manual');
  hero.style.setProperty('--hero-shift-a','0px');hero.style.setProperty('--hero-shift-b','0px');
  pointerPlayback=true;video.playbackRate=2;
  if(video.paused)video.play().catch(()=>{if(pointerPlayback)stopPointer();});
  clearTimeout(motionTimer);motionTimer=setTimeout(stopPointer,260);
 });
 hero.addEventListener('pointerleave',()=>{stopPointer();pointer=null;});
 video.addEventListener('error',refresh);
 return {isManual:()=>manual,refresh};
}
