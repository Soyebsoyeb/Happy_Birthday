/* ================================================================
   UTILITIES
   ================================================================ */
const $ = (s,ctx=document)=>ctx.querySelector(s);
const $$ = (s,ctx=document)=>[...ctx.querySelectorAll(s)];
const rand = (a,b)=> a + Math.random()*(b-a);
function resizeCanvas(cv){
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  cv.width = cv.clientWidth*dpr; cv.height = cv.clientHeight*dpr;
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  return ctx;
}

/* ================================================================
   1. LOADING SCREEN
   ================================================================ */
(function loader(){
  const cv = $('#loader-canvas');
  let ctx = resizeCanvas(cv);
  const particles = Array.from({length:90},()=>({
    x:rand(0,cv.clientWidth), y:rand(0,cv.clientHeight), r:rand(.5,2), s:rand(.2,.8), a:rand(.2,1)
  }));
  let raf;
  function draw(){
    ctx.clearRect(0,0,cv.clientWidth,cv.clientHeight);
    particles.forEach(p=>{
      p.y -= p.s; if(p.y<0) p.y = cv.clientHeight;
      ctx.beginPath();
      ctx.fillStyle = `rgba(243,205,124,${p.a})`;
      ctx.arc(p.x,p.y,p.r,0,7);
      ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize',()=>{ ctx = resizeCanvas(cv); });

  let pct = 0;
  const fill = $('#loader-fill'), label = $('#loader-pct');
  const tick = setInterval(()=>{
    pct += rand(4,12);
    if(pct>=100){ pct=100; clearInterval(tick); }
    fill.style.width = pct+'%';
    label.textContent = Math.floor(pct)+'%';
    if(pct===100){
      setTimeout(()=>{
        $('#loader').classList.add('done');
        cancelAnimationFrame(raf);
        document.body.style.overflow = 'auto';
        startTypedSub();
      },350);
    }
  },220);
})();

/* ================================================================
   2. CUSTOM CURSOR
   ================================================================ */
(function cursor(){
  const dot = $('.cursor-dot'), ring = $('.cursor-ring');
  let rx=0,ry=0, mx=0,my=0;
  window.addEventListener('mousemove', e=>{
    mx=e.clientX; my=e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  });
  function loop(){
    rx += (mx-rx)*0.15; ry += (my-ry)*0.15;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  loop();
  $$('button,.balloon,.gift,.candle,.polaroid,.envelope,a,#envelope').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('magnet'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('magnet'));
  });

  // trailing sparkles — spawned sparingly to stay smooth
  let lastSpark = 0;
  window.addEventListener('mousemove', e=>{
    const now = performance.now();
    if(now - lastSpark < 45) return;
    lastSpark = now;
    const s = document.createElement('div');
    s.className = 'cursor-spark';
    s.style.background = Math.random()<0.5 ? 'var(--teal-400)' : 'var(--gold-300)';
    s.style.left = e.clientX+'px'; s.style.top = e.clientY+'px';
    document.body.appendChild(s);
    s.animate([
      { transform:'translate(-50%,-50%) scale(1)', opacity:.8 },
      { transform:`translate(-50%,-50%) scale(0) translateY(14px)`, opacity:0 }
    ], { duration:600, easing:'ease-out' });
    setTimeout(()=>s.remove(), 600);
  });
})();

/* ================================================================
   3. ATMOSPHERE BACKGROUND — stars, aurora ribbons, drifting dust
   ================================================================ */
(function atmosphere(){
  const cv = $('#bg-canvas');
  cv.style.width='100vw'; cv.style.height='100vh';
  let ctx = resizeCanvas(cv);
  let W = cv.clientWidth, H = cv.clientHeight;

  const stars = Array.from({length:160},()=>({
    x:rand(0,W), y:rand(0,H), r:rand(.4,1.6), tw:rand(0,Math.PI*2), sp:rand(.02,.06)
  }));
  const dust = Array.from({length:40},()=>({
    x:rand(0,W), y:rand(0,H), r:rand(1,3), vy:rand(-.15,-.4), a:rand(.1,.5)
  }));
  const petals = Array.from({length:14},()=>({
    x:rand(0,W), y:rand(-H,H), rot:rand(0,7), vRot:rand(-.01,.01), vy:rand(.2,.5), sway:rand(.5,1.5), phase:rand(0,7), size:rand(5,9),
    hue: Math.random()<0.5 ? '203,168,255' : '255,180,210'
  }));
  let shooting = [];
  function spawnShooting(){
    shooting.push({ x:rand(W*.1,W*.7), y:rand(0,H*.3), len:rand(80,160), vx:rand(4,7), vy:rand(2,4), life:1 });
  }
  setInterval(()=>{ if(Math.random()<.5) spawnShooting(); }, 3800);

  let t=0;
  function draw(){
    t+=0.01;
    ctx.clearRect(0,0,W,H);

    // aurora ribbons
    for(let i=0;i<3;i++){
      const grad = ctx.createLinearGradient(0,0,W,H);
      const hueShift = Math.sin(t+i)*20;
      grad.addColorStop(0, `rgba(63,232,201,${0.02+i*0.01})`);
      grad.addColorStop(.5, `rgba(201,135,242,${0.03+i*0.01})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(W*0.5 + Math.sin(t+i)*W*0.2, H*0.15 + i*40, W*0.7, 160+i*30, 0, 0, 7);
      ctx.fill();
    }

    // stars
    stars.forEach(s=>{
      s.tw += s.sp;
      const alpha = 0.4 + Math.sin(s.tw)*0.4;
      ctx.beginPath();
      ctx.fillStyle = `rgba(248,243,232,${Math.max(alpha,0.05)})`;
      ctx.arc(s.x,s.y,s.r,0,7);
      ctx.fill();
    });

    // golden dust drifting up
    dust.forEach(d=>{
      d.y += d.vy; d.x += Math.sin(t*2+d.y*0.01)*0.15;
      if(d.y<-10){ d.y = H+10; d.x = rand(0,W); }
      ctx.beginPath();
      ctx.fillStyle = `rgba(243,205,124,${d.a})`;
      ctx.arc(d.x,d.y,d.r,0,7);
      ctx.fill();
    });

    // drifting petals
    petals.forEach(p=>{
      p.y += p.vy; p.rot += p.vRot; p.x += Math.sin(t*p.sway+p.phase)*0.6;
      if(p.y>H+20){ p.y=-20; p.x=rand(0,W); }
      ctx.save();
      ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(${p.hue},.35)`;
      ctx.beginPath();
      ctx.ellipse(0,0,p.size,p.size*0.55,0,0,7);
      ctx.fill();
      ctx.restore();
    });

    // shooting stars
    shooting.forEach(s=>{
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${s.life})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x,s.y);
      ctx.lineTo(s.x-s.len, s.y-s.len*0.4);
      ctx.stroke();
      ctx.restore();
      s.x+=s.vx; s.y+=s.vy; s.life-=0.02;
    });
    shooting = shooting.filter(s=>s.life>0);

    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize',()=>{ ctx = resizeCanvas(cv); W=cv.clientWidth; H=cv.clientHeight; });
})();

/* ================================================================
   4. HERO — typed subtitle + magic button glow + scroll + parallax tilt
   ================================================================ */
const subLine = "For someone who makes the ordinary feel a little magical.";
function startTypedSub(){
  const holder = $('#typed-sub span');
  let i=0;
  (function type(){
    if(i<=subLine.length){ holder.textContent = subLine.slice(0,i); i++; setTimeout(type, 28); }
  })();
}
$('#begin-btn').addEventListener('click', ()=> $('#wishes').scrollIntoView({behavior:'smooth'}));
$$('.magic-btn').forEach(btn=>{
  btn.addEventListener('mousemove', e=>{
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', (e.clientX-r.left)+'px');
    btn.style.setProperty('--my', (e.clientY-r.top)+'px');
  });
});
(function heroParallax(){
  const hero = $('#hero'), title = $('.hero-title');
  if(!hero || !title) return;
  hero.addEventListener('mousemove', e=>{
    const r = hero.getBoundingClientRect();
    const px = (e.clientX-r.left)/r.width - 0.5, py = (e.clientY-r.top)/r.height - 0.5;
    title.style.transform = `perspective(900px) rotateY(${px*6}deg) rotateX(${-py*6}deg)`;
  });
  hero.addEventListener('mouseleave', ()=>{ title.style.transform = 'perspective(900px) rotateY(0) rotateX(0)'; });
  title.style.transition = 'transform .5s var(--ease-soft)';
})();

/* ================================================================
   4b. SCROLL PROGRESS BAR + CHAPTER NAV
   ================================================================ */
(function scrollProgress(){
  const bar = $('#progress');
  window.addEventListener('scroll', ()=>{
    const h = document.documentElement;
    const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = pct+'%';
  }, { passive:true });
})();

(function chapterNav(){
  const nav = $('#chapter-nav');
  const chapters = $$('[data-chapter]');
  chapters.forEach(sec=>{
    const row = document.createElement('div');
    row.className = 'dot-row';
    row.innerHTML = `<span class="dot-label">${sec.dataset.chapter}</span><span class="dot"></span>`;
    row.addEventListener('click', ()=> sec.scrollIntoView({behavior:'smooth'}));
    nav.appendChild(row);
  });
  const rows = $$('.dot-row', nav);
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      const idx = chapters.indexOf(en.target);
      if(en.isIntersecting) rows.forEach((r,i)=> r.classList.toggle('active', i===idx));
    });
  }, { threshold:0.5 });
  chapters.forEach(sec=>io.observe(sec));
})();

/* ================================================================
   5. SCROLL REVEALS
   ================================================================ */
(function reveals(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting) en.target.classList.add('in'); });
  }, { threshold:0.18 });
  $$('.reveal').forEach(el=>io.observe(el));
})();

/* ================================================================
   6. CAKE — candles + wish reveal
   ================================================================ */
(function cake(){
  const candles = $$('.candle');
  let outCount = 0;
  candles.forEach(c=>{
    c.addEventListener('click', ()=>{
      if(c.classList.contains('out')) return;
      c.classList.add('out');
      outCount++;
      // simple smoke puff
      for(let i=0;i<6;i++){
        const puff = document.createElement('div');
        puff.className='smoke';
        puff.style.left = '50%';
        puff.style.opacity = .6;
        c.appendChild(puff);
        const dx = rand(-10,10), dur = rand(600,1000);
        puff.animate([
          { transform:'translate(-50%,0) scale(1)', opacity:.6 },
          { transform:`translate(${dx}px,-40px) scale(2.4)`, opacity:0 }
        ], { duration:dur, easing:'ease-out' });
        setTimeout(()=>puff.remove(), dur);
      }
      if(outCount===candles.length){
        setTimeout(()=> $('#make-wish').classList.add('show'), 300);
      }
    });
  });
})();

/* ================================================================
   7. BALLOONS — float up, click to pop into confetti/hearts
   ================================================================ */
(function balloons(){
  const field = $('#balloon-field');
  const colors = [
    'linear-gradient(160deg,#ff8fb3,#ff5c8a)',
    'linear-gradient(160deg,#8fd9ff,#4fb3e8)',
    'linear-gradient(160deg,#ffe28f,#f0c36b)',
    'linear-gradient(160deg,#c9a3ff,#a06bf0)',
    'linear-gradient(160deg,#8fffcf,#3fe8c9)'
  ];
  const wishes = [
    "May this year surprise you, gently.",
    "Here's to more laughing until your stomach hurts.",
    "May kindness keep finding its way back to you.",
    "Wishing you softer mornings this year.",
    "May you feel as loved as you make others feel.",
    "Here's to adventures you haven't planned yet."
  ];
  function spawn(){
    const b = document.createElement('div');
    b.className = 'balloon';
    const left = rand(2,90);
    const dur = rand(9,16);
    b.style.left = left+'%';
    b.style.background = colors[Math.floor(rand(0,colors.length))];
    b.style.animationDuration = dur+'s';
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      pop(b);
    });
    field.appendChild(b);
    setTimeout(()=> b.remove(), dur*1000+200);
  }
  function pop(b){
    const rect = b.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    const cx = rect.left-fieldRect.left+rect.width/2, cy = rect.top-fieldRect.top+rect.height/2;
    b.remove();
    for(let i=0;i<18;i++){
      const p = document.createElement('div');
      p.textContent = Math.random()<0.35 ? '♥' : '';
      p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:6px;height:10px;background:${['#ff8fb3','#f0c36b','#8fd9ff','#c9a3ff'][Math.floor(rand(0,4))]};pointer-events:none;border-radius:2px;color:#ff8fb3;font-size:14px;`;
      field.appendChild(p);
      const ang = rand(0,Math.PI*2), dist = rand(40,140);
      p.animate([
        { transform:'translate(0,0) rotate(0deg)', opacity:1 },
        { transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist+60}px) rotate(${rand(-200,200)}deg)`, opacity:0 }
      ], { duration:900, easing:'cubic-bezier(.22,1,.36,1)' });
      setTimeout(()=>p.remove(),900);
    }
    const note = document.createElement('div');
    note.textContent = wishes[Math.floor(rand(0,wishes.length))];
    note.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;transform:translate(-50%,-100%);font-family:'Caveat',cursive;color:#f3cd7c;font-size:19px;white-space:nowrap;pointer-events:none;`;
    field.appendChild(note);
    note.animate([{opacity:0,transform:'translate(-50%,-80%)'},{opacity:1,transform:'translate(-50%,-140%)',offset:.25},{opacity:0,transform:'translate(-50%,-220%)'}],{duration:2200,easing:'ease-out'});
    setTimeout(()=>note.remove(),2200);
  }
  for(let i=0;i<7;i++) setTimeout(spawn, i*900);
  setInterval(spawn, 2600);
})();

/* ================================================================
   8. GIFT BOXES
   ================================================================ */
(function gifts(){
  const grid = $('#gift-grid');
  const data = [
    { top:'#ff8fb3', base:'#e8608f', ribbon:'#fff2a8', glow:'rgba(255,143,179,.5)', msg:'You make everything softer.' },
    { top:'#8fd9ff', base:'#4fa9d9', ribbon:'#fff2a8', glow:'rgba(143,217,255,.5)', msg:'Here\'s a whole year of good surprises.' },
    { top:'#c9a3ff', base:'#9a6bd9', ribbon:'#fff2a8', glow:'rgba(201,163,255,.5)', msg:'A wish, just for you: keep being the reason I smile.'},
    { top:'#f0c36b', base:'#d99f3f', ribbon:'#fff', glow:'rgba(240,195,107,.6)', msg:'✨ Sparkle, delivered. ✨' }
  ];
  data.forEach(d=>{
    const wrap = document.createElement('div');
    wrap.className='gift';
    wrap.innerHTML = `
      <div class="gift-box">
        <div class="gift-glow" style="background:${d.glow}"></div>
        <div class="gift-base" style="background:${d.base}"></div>
        <div class="gift-ribbon-v" style="background:${d.ribbon}"></div>
        <div class="gift-lid" style="background:${d.top}"></div>
        <div class="gift-bow" style="background:${d.ribbon}"></div>
      </div>
      <div class="gift-msg">${d.msg}</div>
    `;
    wrap.addEventListener('click', ()=>{
      if(wrap.classList.contains('opened')) return;
      wrap.classList.add('opened');
      burst(wrap);
    });
    grid.appendChild(wrap);
  });
  function burst(wrap){
    const rect = wrap.getBoundingClientRect();
    for(let i=0;i<14;i++){
      const s = document.createElement('div');
      s.textContent='✨';
      s.style.cssText = `position:fixed;left:${rect.left+rect.width/2}px;top:${rect.top+rect.height*0.3}px;pointer-events:none;font-size:${rand(10,18)}px;z-index:600;`;
      document.body.appendChild(s);
      const ang = rand(0,Math.PI*2), dist = rand(30,90);
      s.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist-40}px)`,opacity:0}],{duration:1000,easing:'ease-out'});
      setTimeout(()=>s.remove(),1000);
    }
  }
})();

/* ================================================================
   9. NIGHT SKY — constellations, clickable stars, wish notes
   ================================================================ */
(function sky(){
  const wrap = $('#sky-wrap');
  const cv = $('#sky-canvas');
  let ctx, W, H;
  function fit(){ ctx = resizeCanvas(cv); W=cv.clientWidth; H=cv.clientHeight; }
  fit(); window.addEventListener('resize',fit);

  const N = 70;
  const stars = Array.from({length:N},()=>({
    x:rand(0,1)*1, y:rand(0,1), r:rand(1,2.6), tw:rand(0,7), sp:rand(.02,.05)
  }));
  const wishes = [
    "may you always find your way back to wonder",
    "may your quiet moments feel just as good as the loud ones",
    "may you be brave in the small ways too",
    "may this year hold more than you expect",
    "may someone tell you how much you matter often",
    "may you rest, really rest, sometimes"
  ];
  let mouse = {x:-999,y:-999};
  wrap.addEventListener('mousemove', e=>{
    const r = wrap.getBoundingClientRect();
    mouse.x = (e.clientX-r.left)/W; mouse.y = (e.clientY-r.top)/H;
  });
  wrap.addEventListener('mouseleave', ()=>{ mouse.x=-999; mouse.y=-999; });

  wrap.addEventListener('click', e=>{
    const r = wrap.getBoundingClientRect();
    const cx = (e.clientX-r.left)/W, cy = (e.clientY-r.top)/H;
    let nearest=null, nd=999;
    stars.forEach(s=>{
      const d = Math.hypot(s.x-cx,s.y-cy);
      if(d<nd){ nd=d; nearest=s; }
    });
    if(nearest && nd<0.06){
      const note = document.createElement('div');
      note.className='sky-wish-note';
      note.textContent = wishes[Math.floor(rand(0,wishes.length))];
      note.style.left = (nearest.x*W)+'px';
      note.style.top = (nearest.y*H)+'px';
      wrap.appendChild(note);
      setTimeout(()=>note.remove(),2600);
    }
  });

  let t=0;
  function draw(){
    t+=0.015;
    ctx.clearRect(0,0,W,H);
    // connecting lines to nearby stars (constellation feel)
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    for(let i=0;i<stars.length;i++){
      for(let j=i+1;j<stars.length;j++){
        const a=stars[i], b=stars[j];
        const d = Math.hypot((a.x-b.x)*W,(a.y-b.y)*H);
        if(d<90){
          ctx.beginPath(); ctx.moveTo(a.x*W,a.y*H); ctx.lineTo(b.x*W,b.y*H); ctx.stroke();
        }
      }
    }
    stars.forEach(s=>{
      s.tw+=s.sp;
      const md = Math.hypot((s.x-mouse.x)*W,(s.y-mouse.y)*H);
      const boost = md<70 ? (70-md)/70 : 0;
      const alpha = 0.35+Math.sin(s.tw)*0.35+boost*0.5;
      ctx.beginPath();
      ctx.fillStyle = `rgba(248,243,232,${Math.min(alpha,1)})`;
      ctx.arc(s.x*W, s.y*H, s.r+boost*1.6, 0, 7);
      ctx.fill();
      if(boost>0.4){
        ctx.beginPath();
        ctx.strokeStyle = `rgba(243,205,124,${boost*.5})`;
        ctx.arc(s.x*W,s.y*H,s.r+6,0,7); ctx.stroke();
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ================================================================
   10. FIREWORKS
   ================================================================ */
(function fireworks(){
  const cv = $('#fw-canvas');
  let ctx, W, H;
  function fit(){ ctx = resizeCanvas(cv); W=cv.clientWidth; H=cv.clientHeight; }
  fit(); window.addEventListener('resize',fit);
  let particles = [];
  let rockets = [];
  const palette = ['#3fe8c9','#f3cd7c','#c987f2','#ff8fb3','#8fd9ff'];

  function explode(x,y){
    const color = palette[Math.floor(rand(0,palette.length))];
    const count = 52;
    for(let i=0;i<count;i++){
      const ang = (Math.PI*2/count)*i + rand(-.1,.1);
      const speed = rand(1.5,5.2);
      particles.push({
        x,y, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed,
        life:1, color, size:rand(1.4,2.6)
      });
    }
    // soft flash at the burst point
    particles.push({ x,y, vx:0, vy:0, life:1, color:'#ffffff', size:26, flash:true });
  }
  function launch(x, groundY, targetY){
    const color = palette[Math.floor(rand(0,palette.length))];
    rockets.push({ x, y:groundY, targetY, vy:rand(-6.5,-8.5), color, trail:[] });
  }
  function frame(){
    ctx.fillStyle = 'rgba(5,5,18,.24)';
    ctx.fillRect(0,0,W,H);

    // rockets rising with a soft trail
    rockets.forEach(r=>{
      r.trail.push({x:r.x,y:r.y});
      if(r.trail.length>10) r.trail.shift();
      r.y += r.vy; r.vy += 0.06;
      r.trail.forEach((t,i)=>{
        ctx.beginPath();
        ctx.fillStyle = r.color;
        ctx.globalAlpha = (i/r.trail.length) * 0.5;
        ctx.arc(t.x,t.y,1.6,0,7); ctx.fill();
        ctx.globalAlpha = 1;
      });
      if(r.y<=r.targetY || r.vy>=0){ explode(r.x,r.y); r.dead=true; }
    });
    rockets = rockets.filter(r=>!r.dead);

    // burst particles
    particles.forEach(p=>{
      if(p.flash){
        p.life -= 0.09;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(p.life,0)*0.5;
        ctx.arc(p.x,p.y,p.size*(1-p.life),0,7);
        ctx.fill(); ctx.globalAlpha=1;
        return;
      }
      p.vy += 0.02; p.x+=p.vx; p.y+=p.vy; p.life-=0.012;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.life,0);
      ctx.arc(p.x,p.y,p.size,0,7);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    particles = particles.filter(p=>p.life>0);
    requestAnimationFrame(frame);
  }
  frame();

  function finale(){
    let n=0;
    const iv = setInterval(()=>{
      launch(rand(W*0.15,W*0.85), H, rand(H*0.15,H*0.45));
      n++; if(n>6) clearInterval(iv);
    }, 320);
  }
  $('#fw-btn').addEventListener('click', finale);
  cv.parentElement.addEventListener('click', (e)=>{
    if(e.target.closest('.magic-btn')) return;
    const r = cv.getBoundingClientRect();
    launch(e.clientX-r.left, H, (e.clientY-r.top));
  });
})();

/* ================================================================
   11. LETTER
   ================================================================ */
(function letter(){
  const env = $('#envelope');
  const modal = $('#letter-modal');
  env.addEventListener('click', ()=>{
    env.classList.add('open');
    setTimeout(()=> modal.classList.add('show'), 500);
  });
  $('#letter-close').addEventListener('click', ()=> modal.classList.remove('show'));
  modal.addEventListener('click', e=>{ if(e.target===modal) modal.classList.remove('show'); });
})();

/* ================================================================
   12. MUSIC PLAYER
   ================================================================ */
(function player(){
  const audio = $('#audio');
  const btn = $('#play-btn');
  const bar = $('#p-progress');
  btn.addEventListener('click', ()=>{
    if(!audio.src || audio.src.endsWith(location.href)){
      btn.textContent='♪';
      setTimeout(()=>btn.textContent='▶',900);
      return; // no track loaded — swap the <source src> to enable playback
    }
    if(audio.paused){ audio.play(); btn.textContent='❚❚'; } else { audio.pause(); btn.textContent='▶'; }
  });
  audio.addEventListener('timeupdate', ()=>{
    if(audio.duration) bar.style.width = (audio.currentTime/audio.duration*100)+'%';
  });
})();

/* ================================================================
   13. FOOTER — closing starfield + floating hearts
   ================================================================ */
(function footerScene(){
  const cv = $('#footer-canvas');
  let ctx, W, H;
  function fit(){ ctx = resizeCanvas(cv); W=cv.clientWidth; H=cv.clientHeight; }
  fit(); window.addEventListener('resize',fit);
  const stars = Array.from({length:60},()=>({x:rand(0,1),y:rand(0,1),r:rand(.5,1.8),tw:rand(0,7),sp:rand(.01,.03)}));
  const hearts = Array.from({length:10},()=>({x:rand(0,1),y:rand(0,1),s:rand(10,18),vy:rand(.05,.15),a:rand(.2,.6)}));
  let t=0;
  function draw(){
    t+=0.01;
    ctx.clearRect(0,0,W,H);
    stars.forEach(s=>{
      s.tw+=s.sp;
      ctx.beginPath();
      ctx.fillStyle = `rgba(248,243,232,${0.3+Math.sin(s.tw)*0.3})`;
      ctx.arc(s.x*W, s.y*H, s.r, 0, 7); ctx.fill();
    });
    ctx.font = '16px serif';
    hearts.forEach(h=>{
      h.y -= h.vy/H*2; if(h.y<0) h.y=1;
      ctx.globalAlpha = h.a;
      ctx.fillStyle = '#c987f2';
      ctx.font = h.s+'px serif';
      ctx.fillText('♥', h.x*W, h.y*H);
      ctx.globalAlpha = 1;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ================================================================
   14. EASTER EGGS — double-click heart burst, Konami code heart rain
   ================================================================ */
(function easterEggs(){
  // Helper function for random numbers
  const rand = (min, max) => min + Math.random() * (max - min);
  
  document.addEventListener('dblclick', e=>{
    for(let i=0;i<8;i++){
      const h = document.createElement('div');
      h.textContent='♥';
      h.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;color:#ff8fb3;font-size:${rand(10,20)}px;pointer-events:none;z-index:9998;`;
      document.body.appendChild(h);
      const ang = rand(0,Math.PI*2), dist = rand(30,80);
      h.animate([
        {transform:'translate(0,0)', opacity:1},
        {transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px)`, opacity:0}
      ], {duration:800, easing:'ease-out'});
      setTimeout(()=>h.remove(),800);
    }
  });

  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let pos = 0;
  
  window.addEventListener('keydown', e=>{
    pos = (e.key===seq[pos]) ? pos+1 : (e.key===seq[0] ? 1 : 0);
    if(pos===seq.length){ 
      pos=0; 
      heartRain(); 
    }
  });
  
  function heartRain(){
    for(let i=0;i<60;i++){
      setTimeout(()=>{
        const h = document.createElement('div');
        h.className='heart-fall';
        h.textContent = Math.random()<0.5 ? '♥' : '✨';
        h.style.left = rand(0,100)+'vw';
        h.style.animationDuration = rand(3,6)+'s';
        document.body.appendChild(h);
        setTimeout(()=>h.remove(),6200);
      }, i*40);
    }
  }
})();
