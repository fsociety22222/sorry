const qs  = s => document.querySelector(s);
const rnd = (a,b) => Math.random()*(b-a)+a;

/* ── PIN ─────────────────────────────────── */
let pin = '';
const CORRECT = '2303';

function fillDots() {
  document.querySelectorAll('.lk-dot').forEach((d,i) => {
    d.classList.toggle('filled', i < pin.length);
  });
}

function pressNum(n) {
  if (pin.length >= 4) return;
  pin += n;
  fillDots();
  if (pin.length === 4) setTimeout(checkPin, 180);
}

function delNum() {
  pin = pin.slice(0,-1);
  fillDots();
  qs('#lkErr').classList.remove('show');
}

function checkPin() {
  if (pin === CORRECT) {
    playSfx('unlock');
    const card = qs('.lk-card');
    card.classList.add('out');
    setTimeout(() => {
      qs('#lockscreen').style.opacity = '0';
      qs('#lockscreen').style.pointerEvents = 'none';
      setTimeout(startApp, 500);
    }, 380);
  } else {
    pin = '';
    fillDots();
    const card = qs('.lk-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    qs('#lkErr').classList.add('show');
    card.addEventListener('animationend', () => card.classList.remove('shake'), { once:true });
  }
}

document.querySelectorAll('.lk-num[data-n]').forEach(b => {
  b.addEventListener('click', () => { initAudio(); pressNum(b.dataset.n); });
});
qs('#lkDel').addEventListener('click', delNum);
document.addEventListener('keydown', e => {
  if (qs('#lockscreen').style.display === 'none') return;
  if (/^[0-9]$/.test(e.key)) { initAudio(); pressNum(e.key); }
  if (e.key === 'Backspace') delNum();
});

qs('#lkClueBtn').addEventListener('click', () => qs('#clueOverlay').classList.add('open'));
qs('#clueClose').addEventListener('click', () => qs('#clueOverlay').classList.remove('open'));
qs('#clueOverlay').addEventListener('click', e => {
  if (e.target === qs('#clueOverlay')) qs('#clueOverlay').classList.remove('open');
});

/* ── AUDIO ───────────────────────────────── */
let ctx, gain, musicOn = false;

function initAudio() {
  if (ctx) return;
  ctx  = new (window.AudioContext || window.webkitAudioContext)();
  gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  // gentle bg: 4 sine tones
  [261.63, 329.63, 392, 523.25].forEach((f,i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.value = 0.035 - i*0.004;
    o.connect(g); g.connect(gain); o.start();
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.35 + i*0.12; lg.gain.value = 0.008;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
  });
}

function toggleMusic() {
  if (!ctx) initAudio();
  if (ctx.state === 'suspended') ctx.resume();
  musicOn = !musicOn;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.linearRampToValueAtTime(musicOn ? 0.65 : 0, ctx.currentTime + 0.8);
  qs('#musicBtn').textContent = musicOn ? '🎵' : '🔇';
}

function playSfx(type) {
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  if (type === 'next') {
    o.frequency.setValueAtTime(500, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime+.15);
    g.gain.setValueAtTime(.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime+.22);
    o.start(); o.stop(ctx.currentTime+.25);
  } else if (type === 'unlock') {
    [0,.12,.24].forEach((t,i) => {
      const oo = ctx.createOscillator(), gg = ctx.createGain();
      oo.connect(gg); gg.connect(ctx.destination);
      oo.frequency.value = 480 + i*130;
      gg.gain.setValueAtTime(.18, ctx.currentTime+t);
      gg.gain.exponentialRampToValueAtTime(.001, ctx.currentTime+t+.2);
      oo.start(ctx.currentTime+t); oo.stop(ctx.currentTime+t+.25);
    });
  }
}

/* ── APP ─────────────────────────────────── */
let cur = 1;

function startApp() {
  qs('#app').classList.remove('hidden');
  qs('#musicBtn').classList.add('show');
  showSlide(1);
  spawnHearts();
  // animate card on slide 2
  setTimeout(() => qs('#cardMsg').classList.add('appear'), 100);
}

function showSlide(n) {
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
  qs(`#s${n}`).classList.add('active');
  cur = n;
}

function goTo(n) {
  playSfx('next');
  showSlide(n);
}

/* ── SLIDE 1 ─────────────────────────────── */
function spawnHearts() {
  const c = qs('#hearts');
  const em = ['🤍','💕','🌸','💗'];
  for (let i=0;i<20;i++) {
    const el = document.createElement('span');
    el.className = 'hrt';
    el.textContent = em[Math.floor(Math.random()*em.length)];
    el.style.cssText = `left:${rnd(0,100)}%;font-size:${rnd(.7,1.4)}rem;animation-duration:${rnd(7,14)}s;animation-delay:${rnd(0,10)}s;`;
    c.appendChild(el);
  }
}
qs('#btn1').addEventListener('click', () => {
  goTo(2);
  setTimeout(() => qs('#cardMsg').classList.add('appear'), 200);
});

/* ── SLIDE 2 ─────────────────────────────── */
qs('#btn2').addEventListener('click', () => {
  goTo(3);
  spawnFall('#fall', ['🌸','✨','💫','🍀']);
  setTimeout(startTypewriter, 400);
});

/* ── SLIDE 3 – TYPEWRITER ────────────────── */
const lines = [
  'aku beneran menyesal…',
  'aku harusnya lebih pengertian.',
  'kamu nggak pantas dapetin itu.',
  'dan aku minta maaf,',
  'dari hati yang paling dalam. 🤍'
];

function startTypewriter() {
  const area = qs('#typeArea');
  area.innerHTML = '';
  let li = 0;
  function typeLine(txt, el, cb) {
    let i = 0;
    const t = setInterval(() => {
      el.textContent += txt[i++];
      if (i >= txt.length) { clearInterval(t); setTimeout(cb, 500); }
    }, 65);
  }
  function next() {
    if (li >= lines.length) {
      setTimeout(() => qs('#btn3').classList.add('show'), 300);
      return;
    }
    const el = document.createElement('p');
    area.appendChild(el);
    setTimeout(() => el.classList.add('vis'), 60);
    typeLine(lines[li++], el, next);
  }
  next();
}
qs('#btn3').addEventListener('click', () => goTo(4));

/* ── SLIDE 4 – YES DODGE ─────────────────── */
qs('#s4Yes').addEventListener('mousemove', e => {
  const btn = qs('#s4Yes');
  const sl  = qs('#s4').getBoundingClientRect();
  const bw  = btn.offsetWidth, bh = btn.offsetHeight;
  const nx  = Math.max(bw/2, Math.min(sl.width-bw/2,  e.clientX - sl.left + rnd(-60,60)));
  const ny  = Math.max(bh/2, Math.min(sl.height-bh/2, e.clientY - sl.top  + rnd(-60,60)));
  btn.style.position = 'absolute';
  btn.style.left = (nx - bw/2) + 'px';
  btn.style.top  = (ny - bh/2) + 'px';
});
qs('#s4Yes').addEventListener('touchstart', () => {
  const sl = qs('#s4').getBoundingClientRect();
  const btn = qs('#s4Yes');
  btn.style.position = 'absolute';
  btn.style.left = rnd(10, sl.width-110)+'px';
  btn.style.top  = rnd(10, sl.height-60)+'px';
});

qs('#s4No').addEventListener('click', () => {
  goTo(5);
  spawnFall('#fall5', ['🌸','💗','🤍','🌷','✨']);
  setTimeout(() => qs('#finalCard').classList.add('appear'), 300);
});

/* ── FALL HELPER ─────────────────────────── */
function spawnFall(sel, emojis) {
  const c = qs(sel);
  c.innerHTML = '';
  for (let i=0;i<20;i++) {
    const el = document.createElement('span');
    el.className = 'ptl';
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    el.style.cssText = `left:${rnd(0,100)}%;font-size:${rnd(.7,1.3)}rem;animation-duration:${rnd(5,11)}s;animation-delay:${rnd(0,8)}s;`;
    c.appendChild(el);
  }
}

/* ── MUSIC ───────────────────────────────── */
qs('#musicBtn').addEventListener('click', toggleMusic);
