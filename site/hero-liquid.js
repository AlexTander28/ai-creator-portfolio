// A single procedural material; no textures, video, libraries or wheel capture.
const vertex=`attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const fragment=`precision mediump float;
varying vec2 uv;uniform vec2 resolution;uniform vec2 mouse;uniform vec2 velocity;uniform float time;uniform float energy;uniform float warm;
void main(){
 float aspect=resolution.x/resolution.y;
 vec2 p=vec2(uv.x*aspect,uv.y),m=vec2(mouse.x*aspect,mouse.y);
 vec2 d=p-m;float influence=exp(-dot(d,d)*9.);
 p+=influence*(velocity*.12+vec2(sin(d.y*12.),cos(d.x*10.))*.065*energy);
 float t=time*.14;
 // Domain warping bends the surface, not just its outer silhouette.
 vec2 q=p;
 q.x+=.19*sin(p.y*5.2+t)+.13*sin(p.y*10.8-t*.7+p.x*2.);
 q.y+=.16*sin(p.x*4.4-t*.8)+.1*cos(p.y*6.+p.x*3.+t);
 q.x+=.09*sin(q.y*13.+q.x*4.-t*.5);
 float field=q.x*2.45+q.y*.35+.3*sin(q.y*4.5+q.x*2.-t)+.17*cos(q.y*9.2+t*.4+q.x*2.);
 float ridge=abs(sin(field*3.14159));
 float broad=exp(-ridge*ridge*6.);
 float shoulder=exp(-ridge*ridge*62.);
 float thickness=.018+.045*pow(.5+.5*sin(q.y*8.+q.x*3.-t),3.);
 float edge=exp(-ridge*ridge/(thickness*thickness));
 float gleam=exp(-pow((ridge-.075)*34.,2.));
 float flood=smoothstep(.15,.95,uv.x)*(.55+.45*sin(q.y*2.+t)*sin(q.x*1.7-t));
 vec3 dark=mix(vec3(.013,.008,.07),vec3(.045,.018,.004),warm);
 vec3 col=mix(dark,mix(vec3(.16,.015,.72),vec3(.58,.19,.012),warm),flood*.85);
 col+=mix(vec3(.12,.012,.56),vec3(.42,.1,.004),warm)*broad;
 col+=mix(vec3(.34,.055,.9),vec3(1.,.44,.018),warm)*shoulder*.85;
 col+=mix(vec3(.7,.45,1.),vec3(1.,.7,.18),warm)*gleam*.38;
 col=mix(col,mix(vec3(.91,.84,1.),vec3(1.,.93,.65),warm),edge*.96);
 // Keep a quiet reading area, with reflective ribbons strongest near the edges.
 float shade=exp(-pow((uv.x-.43)*2.6,2.)-pow((uv.y-.5)*2.,2.));
 col*=1.-shade*.8;
 gl_FragColor=vec4(col,1.);
}`;

export function initLiquidHero(hero){
 const canvas=hero.querySelector('canvas'),surface=canvas.parentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let gl,program,buffer,uniforms,frame=0,last=0,time=0,seen=true,lost=false,frames=0;
 let width=0,height=0,rect=hero.getBoundingClientRect();
 const pointer={x:.75,y:.55,tx:.75,ty:.55,vx:0,vy:0,tvx:0,tvy:0,power:0,target:0};
 const state={get frames(){return frames},get running(){return !!frame},get time(){return time},get pointer(){return {...pointer}}};
 Object.defineProperty(hero,'liquidState',{value:state,configurable:true});
 function stopped(){return reduced.matches||document.hidden||!seen||lost||document.body.classList.contains('is-paused')||!!document.querySelector('dialog[open]');}
 function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('shader compile');}return s;}
 function setup(){
  if(new URLSearchParams(location.search).get('heroRenderer')==='static')return;
  try{
   gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
   if(!gl)return;
   const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
   program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('shader link');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
   const attr=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
   uniforms=Object.fromEntries(['resolution','mouse','velocity','time','energy','warm'].map(k=>[k,gl.getUniformLocation(program,k)]));
   hero.dataset.renderer='webgl';resize();draw();sync();
  }catch{hero.dataset.renderer='static';gl=null;}
 }
 function resize(){
  rect=hero.getBoundingClientRect();const ratio=Math.min(devicePixelRatio||1,innerWidth<651?1:1.5);
  width=Math.max(1,Math.round(rect.width*ratio));height=Math.max(1,Math.round(rect.height*ratio));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  if(gl&&!lost){gl.viewport(0,0,width,height);if(uniforms)draw();}
 }
 function draw(){if(!gl||lost||!uniforms)return;gl.uniform2f(uniforms.resolution,width,height);gl.uniform2f(uniforms.mouse,pointer.x,pointer.y);gl.uniform2f(uniforms.velocity,pointer.vx,pointer.vy);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.energy,pointer.power);gl.uniform1f(uniforms.warm,document.documentElement.dataset.heroTone==='amber'?1:0);gl.drawArrays(gl.TRIANGLES,0,3);frames++;}
 function tick(now){
  frame=0;if(stopped())return;
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;
  const follow=1-Math.exp(-dt/.16),release=1-Math.exp(-dt/.75);
  pointer.x+=(pointer.tx-pointer.x)*follow;pointer.y+=(pointer.ty-pointer.y)*follow;
  pointer.vx+=(pointer.tvx-pointer.vx)*follow;pointer.vy+=(pointer.tvy-pointer.vy)*follow;
  pointer.power+=(pointer.target-pointer.power)*follow;
  pointer.tvx*=1-release;pointer.tvy*=1-release;pointer.target*=1-release;
  draw();frame=requestAnimationFrame(tick);
 }
 function sync(){
  if(stopped()||!gl){cancelAnimationFrame(frame);frame=0;last=0;hero.dataset.motion='paused';return;}
  if(!frame){hero.dataset.motion='running';last=0;frame=requestAnimationFrame(tick);}
 }
 function move(e){
  if(e.pointerType!=='mouse'||stopped())return;
  rect=hero.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width,y=1-(e.clientY-rect.top)/rect.height;
  pointer.tvx=Math.max(-1.5,Math.min(1.5,(x-pointer.tx)*14));pointer.tvy=Math.max(-1.5,Math.min(1.5,(y-pointer.ty)*14));
  pointer.tx=x;pointer.ty=y;pointer.target=1;sync();
 }
 function leave(){pointer.target=0;pointer.tvx=0;pointer.tvy=0;}
 hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',leave);
 const io=new IntersectionObserver(entries=>{seen=entries[0].isIntersecting;sync();});io.observe(hero);
 const ro=new ResizeObserver(resize);ro.observe(hero);
 const mo=new MutationObserver(sync);mo.observe(document.body,{attributes:true,attributeFilter:['class']});document.querySelectorAll('dialog').forEach(d=>mo.observe(d,{attributes:true,attributeFilter:['open']}));
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',()=>{sync();if(reduced.matches){canvas.style.visibility='hidden';}else{canvas.style.visibility='';}});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;hero.dataset.renderer='static';sync();});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;setup();});
 hero.dataset.renderer='static';if(!reduced.matches)setup();
 if(reduced.matches){const resume=()=>{if(!reduced.matches&&!gl)setup();};reduced.addEventListener('change',resume);}
 // Figma/banner modules create their sections after variant selection.
 if(document.readyState==='complete')initMenu();else document.addEventListener('DOMContentLoaded',initMenu,{once:true});

 function initMenu(){
  const header=document.querySelector('.liquid-header'),nav=header.querySelector('nav'),links=[...nav.querySelectorAll('a')];
  nav.id='liquid-navigation';const indicator=document.createElement('span');indicator.className='liquid-nav-indicator';indicator.setAttribute('aria-hidden','true');nav.prepend(indicator);
  const toggle=document.createElement('button');toggle.className='liquid-menu-toggle';toggle.type='button';toggle.setAttribute('aria-label','Открыть меню');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',nav.id);
  toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>';header.append(toggle);
  let current=null,focused=null,hovered=null;
  function mark(link){if(!link||innerWidth<=650){indicator.style.opacity='0';return;}indicator.style.opacity='1';indicator.style.width=link.offsetWidth+'px';indicator.style.transform='translateX('+(link.offsetLeft-5)+'px)';}
  function restore(){mark(focused||hovered||current);}
  function close(){header.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');}
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';header.classList.toggle('menu-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
  header.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('menu-open')){close();toggle.focus();}});
  document.addEventListener('pointerdown',e=>{if(!header.contains(e.target))close();},{passive:true});
  links.forEach(link=>{
   link.addEventListener('pointerenter',()=>{hovered=link;restore();});link.addEventListener('pointerleave',()=>{hovered=null;restore();});
   link.addEventListener('focus',()=>{focused=link;restore();});link.addEventListener('blur',()=>{focused=null;restore();});
   link.addEventListener('click',close);
  });
  const sectionObserver=new IntersectionObserver(()=>{
   const sections=links.map(l=>({link:l,node:document.querySelector(l.getAttribute('href'))})).filter(v=>v.node&&!v.node.hidden);
   const active=sections.filter(v=>v.node.getBoundingClientRect().top<=innerHeight*.55).at(-1);
   current=active?.link||null;links.forEach(l=>{if(l===current)l.setAttribute('aria-current','location');else l.removeAttribute('aria-current');});restore();
  },{rootMargin:'-10% 0px -40% 0px',threshold:[0,.1,.5,1]});
  links.forEach(l=>{const target=document.querySelector(l.getAttribute('href'));if(target)sectionObserver.observe(target);});
  const menuSize=new ResizeObserver(()=>{if(innerWidth>650)close();restore();});menuSize.observe(nav);
 }
}
