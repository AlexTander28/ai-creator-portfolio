// Wheel-driven ribbon: only two bounded gestures per visit consume page scroll.
export function initRibbon(host, items, {onOpen = () => {}, isPaused = () => {}} = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:ew-resize;touch-action:pan-y';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'button');
  canvas.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Enter Space');
  host.append(canvas);
  const hint=document.createElement('p');hint.className='ribbon-hint';host.after(hint);

  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const images = items.map(item => {
    const image = new Image();
    image.dataset.src = item.src;
    image.onload = () => refresh();
    return image;
  });
  let width = 1, height = 1, frame = 0, last = 0, visible = false, dead = false;
  let position = 0, velocity = 0, selected = -1, cardWidth = 1, step = 1, hitCards = [];
  let wheelGestures=0,lastWheel=-Infinity,burstStart=0,wheelReleased=false;
  function wheelHint(){
    canvas.dataset.wheelGestures=String(wheelGestures);
    canvas.dataset.wheelReleased=String(wheelReleased);
    hint.textContent=wheelReleased?'Лента просмотрена — прокручивайте вниз. Для продолжения используйте стрелки.':'Четыре жеста колеса листают ленту. Пятый жест прокручивает страницу вниз.';
    canvas.setAttribute('aria-label',`Открыть концепт: ${items[logicalIndex()].title}. ${wheelReleased?'Прокручивайте вниз для следующего раздела.':'Четыре жеста колеса листают ленту, пятый прокручивает страницу вниз.'} Стрелки позволяют продолжить просмотр.`);
  }
  const copies = 6;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const modulo = (value, length) => ((value % length) + length) % length;
  const logicalIndex = () => modulo(Math.round(-position / step), items.length);

  function crop(image, w, h) {
    const iw = image.naturalWidth, ih = image.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale, sh = h / scale;
    return [(iw - sw) / 2, (ih - sh) / 2, sw, sh];
  }

  function announce() {
    const index = logicalIndex();
    if (selected === index) return;
    selected = index;
    const title = items[index].title;
    canvas.dataset.index = String(index);
    wheelHint();
    host.dispatchEvent(new CustomEvent('ribbonchange', {detail: {index}}));
  }

  function draw() {
    if (dead || !items.length) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f5f4f0';
    ctx.fillRect(0, 0, width, height);
    cardWidth = Math.min(width * (width < 650 ? .79 : .52), height * 1.586 * .86);
    step = cardWidth + clamp(width * .018, 12, 30);
    const center = width / 2 - cardWidth / 2;
    // Paint more than a screen on either side. The same five works repeat visually,
    // but the canvas stays a single accessible control rather than duplicate tab stops.
    const side = Math.ceil(width / step) + copies * items.length;
    const centreSlot = Math.floor(-position / step);
    const localOffset = modulo(position, step);
    hitCards = [];
    for (let relative = -side; relative <= side; relative++) {
      const slot = centreSlot + relative;
      const itemIndex = modulo(slot, items.length);
      const image = images[itemIndex];
      if (!image?.naturalWidth) continue;
      const ratio = image.naturalWidth / image.naturalHeight;
      const cardHeight = Math.min(height * .86, cardWidth / ratio);
      const x = center + relative * step + localOffset;
      // The centre work stays dominant. Neighbours recede a little more while
      // the wheel still has momentum, which makes the visitor-driven motion legible.
      const cardCenter = x + cardWidth / 2;
      const distance = Math.min(1, Math.abs(cardCenter - width / 2) / (width * .62));
      const momentum = Math.min(1, Math.abs(velocity) / 4.6);
      const scale = 1 - distance * (.07 + momentum * .05);
      const drawWidth = cardWidth * scale;
      const drawHeight = cardHeight * scale;
      const drawX = cardCenter - drawWidth / 2;
      const drawY = (height - drawHeight) / 2 + distance * height * .016;
      if (drawX > width || drawX + drawWidth < 0) continue;
      ctx.save();
      ctx.globalAlpha = 1 - distance * .06;
      // A quick wheel impulse compresses and shears cards very slightly.
      // The effect eases away with velocity, so the resting ribbon stays precise.
      const inertia = clamp(velocity / 4.6, -1, 1);
      const deformation = Math.abs(inertia) * (.35 + distance * .65);
      const blur = Math.pow(Math.abs(inertia), .7) * 7;
      canvas.dataset.motionBlur = blur.toFixed(2);
      ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
      ctx.transform(1 + deformation * .10, 0, inertia * .15 * (.65 + distance), 1 - deformation * .07, 0, 0);
      ctx.translate(-drawWidth / 2, -drawHeight / 2);
      ctx.filter = blur ? `blur(${blur.toFixed(2)}px)` : 'none';
      ctx.fillStyle = '#ebe9e4';
      ctx.fillRect(-2, -2, drawWidth + 4, drawHeight + 4);
      ctx.drawImage(image, ...crop(image, drawWidth, drawHeight), 0, 0, drawWidth, drawHeight);
      ctx.restore();
      hitCards.push({left: drawX, right: drawX + drawWidth, top: drawY, bottom: drawY + drawHeight, item: items[itemIndex]});
    }
    announce();
  }

  const active = () => visible && !document.hidden && !reduced.matches && !isPaused();
  function tick(now) {
    frame = 0;
    if (dead || !active() || Math.abs(velocity) < .012) return;
    const elapsed = Math.min(50, Math.max(0, now - last));
    last = now;
    position += velocity * elapsed;
    velocity *= Math.pow(.91, elapsed / 16.67);
    if (Math.abs(velocity) < .012) velocity = 0;
    draw();
    if (velocity) frame = requestAnimationFrame(tick);
  }
  function animate() {
    if (!frame && active() && velocity) { last = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function refresh() {
    if (dead) return;
    cancelAnimationFrame(frame); frame = 0; velocity = 0;
    if (reduced.matches) position = 0;
    draw();
  }
  function resize() {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    refresh();
  }
  function move(direction) {
    if (!items.length) return;
    velocity = 0;
    position -= direction * step;
    draw();
  }
  function openAt(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    const card = hitCards.find(entry => x >= entry.left && x <= entry.right && y >= entry.top && y <= entry.bottom);
    onOpen(card?.item || items[logicalIndex()]);
  }
  function onWheel(event) {
    const units=event.deltaMode===1?16:event.deltaMode===2?height:1;
    const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY)*units;
    if (!delta || event.ctrlKey || !event.cancelable || !active()) return;
    const now=performance.now();
    if(wheelReleased)return;
    if(now-lastWheel>240){
      if(wheelGestures>=4){wheelReleased=true;velocity=0;draw();wheelHint();return;}
      wheelGestures++;burstStart=now;
    }
    lastWheel=now;
    if(now-burstStart>650){wheelReleased=true;velocity=0;draw();wheelHint();return;}
    event.preventDefault();
    wheelHint();
    // Direct displacement preserves wheel speed; a short deceleration avoids a hard stop.
    position -= delta * .56;
    velocity = clamp(velocity - delta * .009, -4.6, 4.6);
    draw();
    animate();
  }
  function key(event) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(items[logicalIndex()]); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
  }

  canvas.addEventListener('click', openAt);
  canvas.addEventListener('keydown', key);
  canvas.addEventListener('wheel', onWheel, {passive: false});
  const observer = new IntersectionObserver(entries => {
    const wasVisible=visible;visible = entries[0].isIntersecting;
    if(visible&&!wasVisible){wheelGestures=0;lastWheel=-Infinity;wheelReleased=false;wheelHint();}
    if(visible)images.forEach(image=>{if(!image.getAttribute('src'))image.src=image.dataset.src;});
    refresh();
  }, {threshold: .05});
  observer.observe(host);
  const sizes = new ResizeObserver(resize); sizes.observe(host);
  document.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', refresh);
  resize();
  return {
    refresh,
    select: index => { position = -modulo(index, items.length) * step; velocity = 0; draw(); },
    next: () => move(1),
    prev: () => move(-1),
    destroy() {
      dead = true; cancelAnimationFrame(frame); observer.disconnect(); sizes.disconnect();hint.remove();
      document.removeEventListener('visibilitychange', refresh); reduced.removeEventListener('change', refresh); canvas.remove();
    }
  };
}
