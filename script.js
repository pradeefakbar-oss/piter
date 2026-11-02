const slides=[...document.querySelectorAll(".slide")];
let current=0;
const count=document.getElementById("slideCount");
const bar=document.getElementById("progressBar");
function showSlide(index){
  current=Math.max(0,Math.min(slides.length-1,index));
  slides.forEach((s,i)=>s.classList.toggle("active",i===current));
  count.textContent=`${String(current+1).padStart(2,"0")} / ${String(slides.length).padStart(2,"0")}`;
  bar.style.width=`${((current+1)/slides.length)*100}%`;
}
document.getElementById("prevBtn").addEventListener("click",()=>showSlide(current-1));
document.getElementById("nextBtn").addEventListener("click",()=>showSlide(current+1));
document.querySelectorAll(".next-btn").forEach(b=>b.addEventListener("click",()=>showSlide(current+1)));
document.getElementById("replayBtn").addEventListener("click",()=>showSlide(0));
document.addEventListener("keydown",e=>{
  if(["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();showSlide(current+1)}
  if(["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();showSlide(current-1)}
});
let touchStartX=0;
document.addEventListener("touchstart",e=>{touchStartX=e.changedTouches[0].screenX},{passive:true});
document.addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].screenX-touchStartX;
  if(Math.abs(dx)>55)showSlide(current+(dx<0?1:-1));
},{passive:true});
showSlide(0);

// Ambience uses a gentle synthesized tone only after the visitor opts in.
let audioCtx=null,osc=null,gain=null,playing=false;
const soundBtn=document.getElementById("soundBtn");
soundBtn.addEventListener("click",()=>{
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(!playing){
    audioCtx.resume();osc=audioCtx.createOscillator();gain=audioCtx.createGain();
    osc.type="sine";osc.frequency.value=110;gain.gain.value=.018;
    osc.connect(gain);gain.connect(audioCtx.destination);osc.start();playing=true;
    soundBtn.innerHTML="♫ <span>AMBIENCE ON</span>";
  }else{
    gain.gain.setTargetAtTime(0,audioCtx.currentTime,.08);
    osc.stop(audioCtx.currentTime+.3);playing=false;
    soundBtn.innerHTML="♫ <span>AMBIENCE</span>";
  }
});

// Premium floating glass-bubble field: soft depth, highlights, glow and drift.
(() => {
  const canvas=document.getElementById("bubbleCanvas");
  if(!canvas) return;
  const ctx=canvas.getContext("2d",{alpha:true});
  const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduceMotion) return;
  let width=0,height=0,dpr=1,bubbles=[],last=0;
  const rand=(min,max)=>Math.random()*(max-min)+min;
  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,1.65);
    width=window.innerWidth;height=window.innerHeight;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    canvas.style.width=width+"px";canvas.style.height=height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const total=width<700?23:40;
    bubbles=Array.from({length:total},()=>({
      x:rand(0,width),y:rand(0,height),r:rand(5,width<700?24:38),
      vy:rand(.12,.48),vx:rand(-.18,.18),phase:rand(0,Math.PI*2),
      wobble:rand(.25,.85),alpha:rand(.12,.34),hue:Math.random()<.72?190:225,
      spin:rand(-.012,.012)
    }));
  }
  function drawBubble(b,t){
    const pulse=1+Math.sin(t*.0007+b.phase)*.055;
    const r=b.r*pulse;
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.sin(t*.00025+b.phase)*.12);
    ctx.globalAlpha=b.alpha;
    const glow=ctx.createRadialGradient(-r*.32,-r*.38,1,0,0,r*1.45);
    glow.addColorStop(0,`hsla(${b.hue},100%,96%,.32)`);
    glow.addColorStop(.22,`hsla(${b.hue},100%,78%,.12)`);
    glow.addColorStop(.72,`hsla(${b.hue},100%,58%,.025)`);
    glow.addColorStop(1,`hsla(${b.hue},100%,50%,0)`);
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*1.45,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=`hsla(${b.hue},100%,82%,.56)`;ctx.lineWidth=Math.max(.6,r*.025);
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=`hsla(${b.hue},100%,98%,.44)`;ctx.lineWidth=Math.max(.7,r*.045);
    ctx.beginPath();ctx.arc(-r*.04,-r*.04,r*.79,Math.PI*1.08,Math.PI*1.62);ctx.stroke();
    ctx.fillStyle="rgba(255,255,255,.62)";ctx.beginPath();ctx.ellipse(-r*.34,-r*.43,Math.max(1.1,r*.12),Math.max(.8,r*.055),-.55,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`hsla(${b.hue},100%,84%,.34)`;ctx.beginPath();ctx.arc(r*.43,r*.44,Math.max(.7,r*.035),0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function frame(t){
    if(t-last<28){requestAnimationFrame(frame);return;}last=t;
    ctx.clearRect(0,0,width,height);
    for(const b of bubbles){
      b.y-=b.vy*(width<700?.8:1);
      b.x+=b.vx+Math.sin(t*.00045+b.phase)*b.wobble*.16;
      if(b.y < -b.r*3){b.y=height+b.r*2;b.x=rand(0,width)}
      if(b.x < -b.r*2)b.x=width+b.r;
      if(b.x > width+b.r*2)b.x=-b.r;
      drawBubble(b,t);
    }
    // Tiny distant glints add a subtle premium starfield, not visual clutter.
    for(let i=0;i<9;i++){
      const x=(i*173.7+t*.004*(i%2?1:-1))%(width+20)-10;
      const y=(i*97.3+t*.009)%(height+20)-10;
      const a=.12+.18*(.5+.5*Math.sin(t*.001+i*3));
      ctx.fillStyle=`rgba(151,235,255,${a})`;ctx.fillRect(x,y,1.2,1.2);
    }
    requestAnimationFrame(frame);
  }
  resize();window.addEventListener("resize",resize,{passive:true});
  requestAnimationFrame(frame);
})();

