'use strict';
/* בועות של סבתא — original bubble shooter. All art drawn in code. */
(function(){
const COLS=11,R=20,D=R*2,RH=R*Math.sqrt(3),W=COLS*D,H=700,SHOOT_Y=630,MAXROW=15,DANGER_ROW=14,MAXLEVEL=10000;
const COLORS=[
 {c:'#ff3b4e',l:'#ffb3ba',d:'#a3001a',sym:'heart'},
 {c:'#2f9bff',l:'#b8e0ff',d:'#0a4aa8',sym:'drop'},
 {c:'#ffd21f',l:'#fff6b0',d:'#b07d00',sym:'star'},
 {c:'#3ccf4e',l:'#c4ffcb',d:'#14751f',sym:'leaf'},
 {c:'#b05cff',l:'#e6c9ff',d:'#5a1a9e',sym:'diamond'},
 {c:'#ff8a1f',l:'#ffd3a6',d:'#a84a00',sym:'square'}];
const $=id=>document.getElementById(id);
// ---------- storage ----------
const SKEY='grandmaBubbles.v1';
let save={unlocked:1,stars:{},best:{},mute:false,speed:1,symbols:true,last:1};
try{Object.assign(save,JSON.parse(localStorage.getItem(SKEY)||'{}'))}catch(e){}
const persist=()=>{try{localStorage.setItem(SKEY,JSON.stringify(save))}catch(e){}};
// ---------- RNG ----------
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const rowLen=r=>r%2?COLS-1:COLS;
const cellX=(r,c)=>R+c*D+(r%2?R:0), cellY=r=>R+r*RH;
function neighbors(r,c){const o=r%2?[[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]]:[[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]];
 const out=[];for(const[dr,dc]of o){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<=MAXROW&&cc>=0&&cc<rowLen(rr))out.push([rr,cc])}return out}
// ---------- level generation ----------
const PATTERNS=['full','pyramid','diamond','stripes','checker','zigzag','rings','heart','columns','vee','islands','wave'];
function maskFn(p,rows,rand){
 const cx=(COLS-1)/2;
 switch(p){
  case 'full':return()=>true;
  case 'pyramid':return(r,c)=>Math.abs(c-cx+(r%2?-.5:0))<=r*0.7+1.5;
  case 'diamond':return(r,c)=>{const m=rows/2;return Math.abs(c-cx+(r%2?-.5:0))<=(m-Math.abs(r-m))*1.1+1};
  case 'stripes':return(r,c)=>r%3!==2||r<2||c%4===0;
  case 'checker':return(r,c)=>r<1||((Math.floor(c/2)+Math.floor(r/2))%2===0);
  case 'zigzag':return(r,c)=>{const z=(r%6<3?r%6:6-r%6)*2;return r<1||Math.abs(c-z-2)>1};
  case 'rings':return(r,c)=>{const x=cellX(r,c)-W/2,y=cellY(r)-rows*RH/2,d=Math.hypot(x,y)/D;return r<1||(Math.floor(d)%2===0)};
  case 'heart':return(r,c)=>{const x=(cellX(r,c)-W/2)/(W/2.2),y=1.1-(cellY(r)/(rows*RH))*2.3;const v=x*x+y*y-1;return r<1||v*v*v-x*x*y*y*y<=0};
  case 'columns':return(r,c)=>r<1||c%3!==1;
  case 'vee':return(r,c)=>Math.abs(c-cx+(r%2?-.5:0))>=r*0.6-0.5||r<1;
  case 'islands':{const s=[...Array(4)].map(()=>[Math.floor(rand()*COLS),Math.floor(rand()*rows)]);return(r,c)=>r<1||s.some(([a,b])=>Math.hypot(cellX(r,c)-cellX(b,a),cellY(r)-cellY(b))<D*2.4)}
  case 'wave':return(r,c)=>r<1||r<rows-2+Math.round(2*Math.sin(c*0.9))||r<rows*0.6;
 }
}
function generateLevel(n){for(let a=0;a<6;a++){const L=genTry(n,a);if(L.cells>=Math.min(28,10+n)||a===5)return L}}
function genTry(n,attempt){
 const rand=rng(n*2654435761+97+attempt*7777);
 const t=Math.min(1,(n-1)/3000), wave=(n%10===0)?1:0;
 const nColors=n<=12?3:n<=60?4:n<=300?5:6;
 const rows=Math.min(11,Math.floor(4+Math.min(5,n/25)+rand()*2.5+wave));
 const pat=(n<=3||attempt>=4)?'full':PATTERNS[Math.floor(rand()*PATTERNS.length)];
 const mask=maskFn(pat,rows,rand);
 const cluster=0.62-0.28*t+(n<20?0.1:0);
 const pal=[...Array(6).keys()].sort(()=>rand()-.5).slice(0,nColors);
 const grid=[];
 for(let r=0;r<=MAXROW;r++){grid.push(new Array(rowLen(r)).fill(null))}
 for(let r=0;r<rows;r++)for(let c=0;c<rowLen(r);c++){
  if(!mask(r,c))continue;
  let col;const nb=neighbors(r,c).map(([a,b])=>grid[a][b]).filter(x=>x&&x.t==='c');
  if(nb.length&&rand()<cluster)col=nb[Math.floor(rand()*nb.length)].k;else{const use=pal.map(k=>0);grid.forEach(row=>row.forEach(g=>{if(g&&g.t==='c')use[pal.indexOf(g.k)]++}));col=rand()<.5?pal[use.indexOf(Math.min(...use))]:pal[Math.floor(rand()*nColors)]}
  grid[r][c]={t:'c',k:col};
 }
 // specials
 const pStone=n>25?Math.min(.1,.02+n/25000):0, pBomb=n>8?.025:0, pRain=n>15?.02:0;
 for(let r=1;r<rows;r++)for(let c=0;c<rowLen(r);c++){const g=grid[r][c];if(!g)continue;const x=rand();
  if(x<pStone)grid[r][c]={t:'s'};else if(x<pStone+pBomb)grid[r][c]={t:'b'};else if(x<pStone+pBomb+pRain)grid[r][c]={t:'r'}}
 // ensure top row anchored & non-empty
 if(!grid[0].some(Boolean))for(let c=0;c<COLS;c+=2)grid[0][c]={t:'c',k:pal[c%nColors]};
 dropFloating(grid,true);
 let cells=0;grid.forEach(row=>row.forEach(g=>{if(g&&g.t!=='s')cells++}));
 const ratio=1.55+1.25*t+(nColors-3)*0.12;
 const shots=Math.max(12,Math.ceil(cells/ratio)+4-(wave?2:0));
 return {n,grid,shots,nColors,pal,pattern:pat,cells,target:cells*14+shots*12};
}
function dropFloating(grid,silent){
 const seen=new Set(),q=[];
 grid[0].forEach((g,c)=>{if(g){seen.add('0,'+c);q.push([0,c])}});
 while(q.length){const[r,c]=q.pop();for(const[a,b]of neighbors(r,c))if(grid[a][b]&&!seen.has(a+','+b)){seen.add(a+','+b);q.push([a,b])}}
 const fell=[];
 for(let r=0;r<=MAXROW;r++)for(let c=0;c<rowLen(r);c++)if(grid[r][c]&&!seen.has(r+','+c)){fell.push({r,c,g:grid[r][c]});grid[r][c]=null}
 return fell;
}
// ---------- audio ----------
let actx=null;
function snd(type,i=0){
 if(save.mute)return;try{
 if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();
 if(actx.state==='suspended')actx.resume();
 const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);
 const P={shoot:[520,260,'triangle',.12,.15],pop:[600+i*70,1200+i*70,'sine',.18,.12],drop:[400,120,'sine',.15,.3],bounce:[300,340,'square',.04,.05],
  boom:[120,40,'sawtooth',.3,.45],win:[523,1046,'triangle',.2,.6],lose:[330,110,'triangle',.2,.7],click:[700,700,'sine',.08,.05],swap:[440,660,'sine',.1,.1],land:[220,180,'sine',.08,.08]}[type];
 o.type=P[2];o.frequency.setValueAtTime(P[0],t);o.frequency.exponentialRampToValueAtTime(P[1],t+P[4]);
 g.gain.setValueAtTime(P[3],t);g.gain.exponentialRampToValueAtTime(.001,t+P[4]);o.start(t);o.stop(t+P[4]+.02);
 if(type==='win'){[659,784,1046].forEach((f,k)=>{const o2=actx.createOscillator(),g2=actx.createGain();o2.connect(g2);g2.connect(actx.destination);o2.type='triangle';o2.frequency.value=f;g2.gain.setValueAtTime(.15,t+.15*(k+1));g2.gain.exponentialRampToValueAtTime(.001,t+.15*(k+1)+.3);o2.start(t+.15*(k+1));o2.stop(t+.15*(k+1)+.35)})}
 }catch(e){}
}
// ---------- sprites ----------
const sprites={};
function symbol(x,s,sym){
 x.save();x.fillStyle='rgba(255,255,255,.92)';x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=s*.08;x.beginPath();const k=s*.42;
 if(sym==='heart'){x.moveTo(0,k*.8);x.bezierCurveTo(-k*1.4,-k*.2,-k*.6,-k*1.2,0,-k*.45);x.bezierCurveTo(k*.6,-k*1.2,k*1.4,-k*.2,0,k*.8)}
 else if(sym==='drop'){x.moveTo(0,-k);x.quadraticCurveTo(k*.9,0,k*.6,k*.4);x.arc(0,k*.35,k*.6,0,Math.PI);x.quadraticCurveTo(-k*.9,0,0,-k)}
 else if(sym==='star'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?k*.45:k;x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}}
 else if(sym==='leaf'){x.moveTo(0,-k);x.quadraticCurveTo(k,0,0,k);x.quadraticCurveTo(-k,0,0,-k)}
 else if(sym==='diamond'){x.moveTo(0,-k);x.lineTo(k*.75,0);x.lineTo(0,k);x.lineTo(-k*.75,0)}
 else if(sym==='square'){x.rect(-k*.65,-k*.65,k*1.3,k*1.3)}
 x.closePath();x.fill();x.stroke();x.restore();
}
function makeSprite(key,draw){const s=R*2*3,cv=document.createElement('canvas');cv.width=cv.height=s;const x=cv.getContext('2d');x.translate(s/2,s/2);x.scale(3,3);draw(x);sprites[key]=cv}
function glossy(x,c,l,d){
 const g=x.createRadialGradient(-R*.35,-R*.4,R*.1,0,0,R);g.addColorStop(0,l);g.addColorStop(.45,c);g.addColorStop(1,d);
 x.fillStyle=g;x.beginPath();x.arc(0,0,R-1,0,7);x.fill();
 x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=1.2;x.stroke();
 x.fillStyle='rgba(255,255,255,.75)';x.beginPath();x.ellipse(-R*.35,-R*.48,R*.32,R*.18,-.5,0,7);x.fill();
 x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(R*.45,R*.45,R*.12,0,7);x.fill();
}
function buildSprites(){
 COLORS.forEach((p,i)=>{makeSprite('c'+i,x=>{glossy(x,p.c,p.l,p.d)});makeSprite('cs'+i,x=>{glossy(x,p.c,p.l,p.d);symbol(x,R,p.sym)})});
 makeSprite('s',x=>{const g=x.createRadialGradient(-6,-6,2,0,0,R);g.addColorStop(0,'#d9d4cc');g.addColorStop(1,'#6b645a');x.fillStyle=g;x.beginPath();x.arc(0,0,R-1,0,7);x.fill();
  x.strokeStyle='#4a443c';x.lineWidth=2;x.beginPath();x.moveTo(-10,-4);x.lineTo(-2,2);x.lineTo(6,-6);x.moveTo(-2,2);x.lineTo(0,12);x.stroke()});
 makeSprite('b',x=>{glossy(x,'#3a3a46','#9a9ab0','#111');x.fillStyle='#ffcc33';x.font='bold 20px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('✹',0,2)});
 makeSprite('r',x=>{const g=x.createConicGradient?x.createConicGradient(0,0,0):null;if(g){COLORS.forEach((p,i)=>g.addColorStop(i/6,p.c));g.addColorStop(1,COLORS[0].c);x.fillStyle=g}else x.fillStyle='#f0f';
  x.beginPath();x.arc(0,0,R-1,0,7);x.fill();x.fillStyle='rgba(255,255,255,.75)';x.beginPath();x.ellipse(-R*.35,-R*.48,R*.32,R*.18,-.5,0,7);x.fill();
  x.fillStyle='#fff';x.font='bold 18px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('★',0,2)});
}
const spriteFor=g=>g.t==='c'?sprites[(save.symbols?'cs':'c')+g.k]:sprites[g.t];
// ---------- background (jungle) ----------
let bgCanvas=null;
function buildBg(){
 const s=2;bgCanvas=document.createElement('canvas');bgCanvas.width=W*s;bgCanvas.height=H*s;const x=bgCanvas.getContext('2d');x.scale(s,s);
 let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#7fe0ff');g.addColorStop(.55,'#c8f5c0');g.addColorStop(1,'#5fbf4a');x.fillStyle=g;x.fillRect(0,0,W,H);
 const rr=rng(7);
 // distant hills & trees
 for(let layer=0;layer<3;layer++){x.fillStyle=['#8fd98a','#5fbf5a','#3d9e44'][layer];x.beginPath();x.moveTo(0,H);
  for(let i=0;i<=W;i+=20)x.lineTo(i,H-150+layer*45-Math.sin(i/60+layer*2)*25-rr()*10);x.lineTo(W,H);x.fill()}
 // palm/jungle leaves on sides
 const leaf=(px,py,ang,len,col)=>{x.save();x.translate(px,py);x.rotate(ang);x.fillStyle=col;x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(len*.5,-len*.25,len,0);x.quadraticCurveTo(len*.5,len*.25,0,0);x.fill();
  x.strokeStyle='rgba(0,60,0,.35)';x.lineWidth=1.5;x.beginPath();x.moveTo(0,0);x.lineTo(len*.95,0);x.stroke();x.restore()};
 for(let i=0;i<9;i++){leaf(-10,60+i*75,-.6+rr()*1.2,90+rr()*40,i%2?'#2e9e3e':'#1f7a30');leaf(W+10,40+i*75,Math.PI+.6-rr()*1.2,90+rr()*40,i%2?'#2e9e3e':'#1f7a30')}
 // vines from top
 x.strokeStyle='#2b7a2b';x.lineWidth=4;for(let i=0;i<5;i++){const vx=30+i*95+rr()*30;x.beginPath();x.moveTo(vx,0);x.bezierCurveTo(vx+20,60,vx-20,120,vx+5,170+rr()*60);x.stroke();
  for(let k=0;k<4;k++)leaf(vx+(k%2?4:-4),30+k*40,k%2?.6:Math.PI-.6,22,'#3fae3f')}
 // flowers
 for(let i=0;i<14;i++){const fx=rr()*W,fy=H-110+rr()*90;x.fillStyle=['#ff6fa1','#ffd23f','#ff8a1f','#fff'][i%4];for(let p=0;p<5;p++){x.beginPath();x.arc(fx+Math.cos(p*1.256)*5,fy+Math.sin(p*1.256)*5,4,0,7);x.fill()}x.fillStyle='#ffb400';x.beginPath();x.arc(fx,fy,3,0,7);x.fill()}
 // wooden top bar shade
 g=x.createLinearGradient(0,0,0,14);g.addColorStop(0,'rgba(60,30,10,.5)');g.addColorStop(1,'rgba(60,30,10,0)');x.fillStyle=g;x.fillRect(0,0,W,14);
 // danger line
 x.setLineDash([8,8]);x.strokeStyle='rgba(255,60,60,.45)';x.lineWidth=2;x.beginPath();x.moveTo(0,cellY(DANGER_ROW)+R);x.lineTo(W,cellY(DANGER_ROW)+R);x.stroke();x.setLineDash([]);
}
// monkey shooter character (original drawing)
function drawMonkey(x,t,mood){
 const cx=W/2+62,cy=SHOOT_Y+18,b=Math.sin(t/300)*2;
 x.save();x.translate(cx,cy+b);
 // body
 x.fillStyle='#8a4b22';x.beginPath();x.ellipse(0,26,24,22,0,0,7);x.fill();
 x.fillStyle='#f2c79a';x.beginPath();x.ellipse(0,30,14,13,0,0,7);x.fill();
 // tail
 x.strokeStyle='#8a4b22';x.lineWidth=6;x.lineCap='round';x.beginPath();x.moveTo(20,36);x.bezierCurveTo(48,40,44,8,30,12);x.stroke();
 // ears
 for(const s of[-1,1]){x.fillStyle='#8a4b22';x.beginPath();x.arc(s*24,-6,10,0,7);x.fill();x.fillStyle='#f2a7a0';x.beginPath();x.arc(s*24,-6,5.5,0,7);x.fill()}
 // head
 x.fillStyle='#9a5528';x.beginPath();x.arc(0,-6,22,0,7);x.fill();
 x.fillStyle='#f6d3a8';x.beginPath();x.ellipse(-7,-9,8,9,0,0,7);x.ellipse(7,-9,8,9,0,0,7);x.fill();x.beginPath();x.ellipse(0,3,13,9,0,0,7);x.fill();
 // eyes
 const blink=(Math.floor(t/2800)%2===0&&t%2800<140);
 x.fillStyle='#2a1a10';if(blink){x.fillRect(-10,-10,6,2);x.fillRect(4,-10,6,2)}else{x.beginPath();x.arc(-7,-9,3.6,0,7);x.arc(7,-9,3.6,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(-6,-10.5,1.3,0,7);x.arc(8,-10.5,1.3,0,7);x.fill()}
 // mouth
 x.strokeStyle='#5a2a10';x.lineWidth=2;x.beginPath();if(mood==='sad')x.arc(0,9,5,Math.PI*1.15,Math.PI*1.85);else x.arc(0,2,6,.2,Math.PI-.2);x.stroke();
 x.fillStyle='#f28b8b';x.beginPath();x.arc(-14,0,3,0,7);x.arc(14,0,3,0,7);x.fill();
 // leaf hat
 x.fillStyle='#3ccf4e';x.beginPath();x.ellipse(4,-30,12,5,-.4,0,7);x.fill();
 x.restore();
}
// ---------- game state ----------
const cv=$('cv'),ctx=cv.getContext('2d');let scale=1,dpr=1;
let L=null,grid=null,shotsLeft=0,score=0,cur=null,nxt=null,bullet=null,aim=null,parts=[],falling=[],floaters=[],state='idle',boost=null,boosts={b:1,r:1},combo=0,shake=0,mood='happy',levelN=1;
function present(){const s=new Set();grid.forEach(r=>r.forEach(g=>{if(g&&g.t==='c')s.add(g.k)}));return [...s]}
function randColor(){const p=present();const pool=p.length?p:L.pal;return {t:'c',k:pool[Math.floor(Math.random()*pool.length)]}}
function startLevel(n){
 levelN=n;L=generateLevel(n);grid=L.grid.map(r=>r.map(g=>g&&{...g}));shotsLeft=L.shots;score=0;bullet=null;parts=[];falling=[];floaters=[];combo=0;mood='happy';
 boosts={b:n>=5?1:0,r:n>=10?1:0};boost=null;cur=randColor();nxt=randColor();state='play';save.last=n;persist();
 $('hudLevel').textContent=n;updateHud();show('game');resize();
 if(n===1&&!save.seenTut)setTimeout(()=>{save.seenTut=1;persist();help(true)},300);
}
function updateHud(){
 $('hudScore').textContent=score;$('hudShots').textContent=shotsLeft;$('hudShots').parentNode.classList.toggle('low',shotsLeft<=5);
 const f=Math.min(1,score/L.target);$('starFill').style.width=(f*100)+'%';
 ['s1','s2','s3'].forEach((id,i)=>$(id).textContent=f>=[.33,.66,.96][i]?'⭐':'☆');
 $('nBomb').textContent=boosts.b;$('nRainbow').textContent=boosts.r;
 $('bstBomb').disabled=!boosts.b;$('bstRainbow').disabled=!boosts.r;
 $('bstBomb').classList.toggle('on',boost==='b');$('bstRainbow').classList.toggle('on',boost==='r');
}
// ---------- layout ----------
function resize(){
 const st=$('stage');const aw=st.clientWidth-8,ah=st.clientHeight-4;if(aw<=0||ah<=0)return;
 scale=Math.min(aw/W,ah/H);dpr=Math.min(3,window.devicePixelRatio||1);
 cv.style.width=W*scale+'px';cv.style.height=H*scale+'px';cv.width=Math.round(W*scale*dpr);cv.height=Math.round(H*scale*dpr);
}
window.addEventListener('resize',()=>{resize();if($('map').classList.contains('active'))renderMap()});
// ---------- aiming ----------
const SX=W/2,SY=SHOOT_Y;
function toLocal(e){const b=cv.getBoundingClientRect();return{x:(e.clientX-b.left)/scale,y:(e.clientY-b.top)/scale}}
function setAim(p){let dx=p.x-SX,dy=p.y-SY;if(dy>-15)dy=-15;let a=Math.atan2(dy,dx);const lim=0.12;a=Math.max(-Math.PI+lim,Math.min(-lim,a));aim=a}
function nearSwap(p){return Math.hypot(p.x-(SX-70),p.y-(SY+22))<34}
let dragging=false;
cv.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='play')return;const p=toLocal(e);if(nearSwap(p)){swap();return}dragging=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}setAim(p)});
cv.addEventListener('pointermove',e=>{if(state!=='play')return;const p=toLocal(e);if(dragging||e.pointerType==='mouse')setAim(p)});
cv.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;if(state!=='play')return;const p=toLocal(e);setAim(p);if(p.y<SY-10)shoot();else aim=null});
cv.addEventListener('pointercancel',()=>{dragging=false;aim=null});
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!dragging)aim=null});
function swap(){if(state!=='play'||bullet)return;[cur,nxt]=[nxt,cur];snd('swap');}
function traceAim(a){
 const pts=[[SX,SY]];let x=SX,y=SY,dx=Math.cos(a),dy=Math.sin(a),len=0;const step=4;
 while(len<1400){x+=dx*step;y+=dy*step;len+=step;
  if(x<R){x=R;dx=-dx;pts.push([x,y])}if(x>W-R){x=W-R;dx=-dx;pts.push([x,y])}
  if(y<R||hits(x,y)){pts.push([x,y]);break}}
 return pts;
}
function hits(x,y){const r0=Math.max(0,Math.floor((y-R)/RH)-1);for(let r=r0;r<=Math.min(MAXROW,r0+2);r++)for(let c=0;c<rowLen(r);c++){const g=grid[r][c];if(g&&Math.hypot(cellX(r,c)-x,cellY(r)-y)<D*.82)return true}return false}
function shoot(){
 if(bullet||aim==null||shotsLeft<=0)return;
 let g=cur;if(boost){g={t:boost==='b'?'b':'r'};boosts[boost]--;boost=null}else{shotsLeft--;cur=nxt;nxt=randColor()}
 bullet={x:SX,y:SY,dx:Math.cos(aim),dy:Math.sin(aim),g};aim=null;snd('shoot');updateHud();
}
function snap(x,y){
 let best=null,bd=1e9;let r0=Math.max(0,Math.round((y-R)/RH));
 for(let r=Math.max(0,r0-1);r<=Math.min(MAXROW,r0+1);r++)for(let c=0;c<rowLen(r);c++){if(grid[r][c])continue;
  const d=Math.hypot(cellX(r,c)-x,cellY(r)-y);if(d<bd&&(r===0||neighbors(r,c).some(([a,b])=>grid[a][b]))){bd=d;best=[r,c]}}
 if(!best){for(let r=0;r<=MAXROW;r++)for(let c=0;c<rowLen(r);c++)if(!grid[r][c]){const d=Math.hypot(cellX(r,c)-x,cellY(r)-y);if(d<bd){bd=d;best=[r,c]}}}
 return best;
}
function burst(r,c,g,delay=0){const col=g.t==='c'?COLORS[g.k].c:g.t==='s'?'#9a948a':g.t==='b'?'#ffb400':'#ffffff';
 const x=cellX(r,c),y=cellY(r);for(let i=0;i<10;i++){const a=Math.random()*7,s=1+Math.random()*3;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:1,col,size:3+Math.random()*4,delay})}
 parts.push({ring:1,x,y,life:1,col,delay});}
function land(r,c,g){
 grid[r][c]=g;snd('land');let popped=[];
 if(g.t==='b'){popped=explode(r,c);snd('boom');shake=10}
 else{
  let color=g.t==='c'?g.k:null;
  if(g.t==='r'){let bestN=0;for(const[a,b]of neighbors(r,c)){const n=grid[a][b];if(n&&n.t==='c'){const s=flood(a,b,n.k).length;if(s>bestN){bestN=s;color=n.k}}}}
  if(color!=null){const grp=flood(r,c,color);if(grp.length>=3)popped=grp}
  // bombs adjacent to popped explode
  if(popped.length){const extra=[];popped.forEach(([a,b])=>neighbors(a,b).forEach(([p,q])=>{const n=grid[p][q];if(n&&n.t==='b'&&!extra.some(e=>e[0]===p&&e[1]===q))extra.push([p,q])}));
   popped.forEach(([a,b],i)=>{burst(a,b,grid[a][b],i*30/save.speed);grid[a][b]=null});popped.length&&snd('pop',0);
   extra.forEach(([p,q])=>{if(grid[p][q]){const ex=explode(p,q);popped=popped.concat(ex);snd('boom');shake=10}});
   popped.forEach(([a,b])=>{if(grid[a][b]){burst(a,b,grid[a][b]);grid[a][b]=null}});
  }
 }
 if(popped.length){
  combo++;const pts=popped.length*10*Math.min(5,combo);score+=pts;floater(cellX(r,c),cellY(r),'+'+pts);
  for(let i=1;i<Math.min(6,popped.length);i++)setTimeout(()=>snd('pop',i),i*60/save.speed);
  const fell=dropFloating(grid);if(fell.length){score+=fell.length*20;snd('drop');floater(W/2,cellY(r)+40,'נפילה! +'+fell.length*20);
   fell.forEach(f=>falling.push({x:cellX(f.r,f.c),y:cellY(f.r),vx:(Math.random()-.5)*3,vy:-Math.random()*3,g:f.g}))}
  if(popped.length+fell.length>=8)toast(['כל הכבוד! 👏','מדהים! 🌟','יופי של זריקה! 💖','וואו! 🎉'][Math.floor(Math.random()*4)]);
  mood='happy';
 }else{combo=0}
 updateHud();
 // check end
 if(!present().length&&!grid.some(row=>row.some(g=>g&&(g.t==='b'||g.t==='r')))){state='won';setTimeout(win,700/save.speed);return}
 if(!present().length){cur=nxt={t:'b'}}
 if(grid.slice(DANGER_ROW).some(row=>row.some(Boolean))){state='lost';mood='sad';setTimeout(()=>lose('הבועות הגיעו לקו האדום'),600);return}
 if(shotsLeft<=0&&!boosts.b&&!boosts.r){state='lost';mood='sad';setTimeout(()=>lose('נגמרו היריות'),600);return}
 if(shotsLeft<=0&&!boost){toast('נשארו רק עוזרים 💣🌈')}
 if(!present().includes(cur.k)&&cur.t==='c')cur=randColor();if(nxt.t==='c'&&!present().includes(nxt.k))nxt=randColor();
}
function flood(r,c,k){const out=[],seen=new Set([r+','+c]),q=[[r,c]];while(q.length){const[a,b]=q.pop();out.push([a,b]);for(const[p,s]of neighbors(a,b)){const n=grid[p][s];if(n&&!seen.has(p+','+s)&&((n.t==='c'&&n.k===k)||n.t==='r')){seen.add(p+','+s);q.push([p,s])}}}return out}
function explode(r,c){const out=[[r,c]];neighbors(r,c).forEach(([a,b])=>{out.push([a,b]);neighbors(a,b).forEach(n=>out.push(n))});
 const u=[];const s=new Set();out.forEach(([a,b])=>{if(grid[a][b]&&!s.has(a+','+b)){s.add(a+','+b);u.push([a,b])}});
 u.forEach(([a,b])=>{burst(a,b,grid[a][b]);grid[a][b]=null});return u}
function floater(x,y,text){floaters.push({x,y,text,life:1})}
let toastT=0;function toast(t){const el=$('toast');el.textContent=t;el.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.add('hidden'),1300)}
// ---------- loop ----------
let lastT=0;
function frame(t){
 const dt=Math.min(40,t-lastT||16)/16.67;lastT=t;
 if($('game').classList.contains('active')&&grid){update(dt);draw(t)}
 requestAnimationFrame(frame);
}
function update(dt){
 if(bullet&&state==='play'){const sp=13*save.speed*dt;const n=Math.ceil(sp/4);
  for(let i=0;i<n;i++){bullet.x+=bullet.dx*sp/n;bullet.y+=bullet.dy*sp/n;
   if(bullet.x<R){bullet.x=R;bullet.dx=-bullet.dx;snd('bounce')}if(bullet.x>W-R){bullet.x=W-R;bullet.dx=-bullet.dx;snd('bounce')}
   if(bullet.y<=R||hits(bullet.x,bullet.y)){const s=snap(bullet.x,bullet.y);const g=bullet.g;bullet=null;if(s)land(s[0],s[1],g);break}}}
 parts.forEach(p=>{if(p.delay>0){p.delay-=16*dt;return}if(p.ring){p.life-=.06*dt*save.speed;return}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.15*dt;p.life-=.03*dt*save.speed});parts=parts.filter(p=>p.life>0);
 falling.forEach(f=>{f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=.5*dt*save.speed});falling=falling.filter(f=>f.y<H+R);
 floaters.forEach(f=>{f.y-=.8*dt;f.life-=.02*dt});floaters=floaters.filter(f=>f.life>0);
 if(shake>0)shake-=dt;
}
function draw(t){
 ctx.setTransform(scale*dpr,0,0,scale*dpr,0,0);
 if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 ctx.drawImage(bgCanvas,0,0,W,H);
 for(let r=0;r<=MAXROW;r++)for(let c=0;c<rowLen(r);c++){const g=grid[r][c];if(g)ctx.drawImage(spriteFor(g),cellX(r,c)-R,cellY(r)-R,D,D)}
 falling.forEach(f=>ctx.drawImage(spriteFor(f.g),f.x-R,f.y-R,D,D));
 // aim line
 if(aim!=null&&state==='play'&&!bullet){const pts=traceAim(aim);ctx.save();const col=boost?'#fff':cur.t==='c'?COLORS[cur.k].c:'#fff';
  let acc=0;for(let i=0;i<pts.length-1;i++){const[x1,y1]=pts[i],[x2,y2]=pts[i+1];const L2=Math.hypot(x2-x1,y2-y1);
   for(let d=(18-acc%18)%18;d<L2;d+=18){const k=d/L2,px=x1+(x2-x1)*k,py=y1+(y2-y1)*k;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,5,0,7);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(px,py,3.5,0,7);ctx.fill()}acc+=L2}
  const e=pts[pts.length-1];const s=snap(e[0],e[1]);if(s){ctx.globalAlpha=.4;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cellX(s[0],s[1]),cellY(s[0]),R-2,0,7);ctx.stroke()}ctx.restore()}
 // shooter base: wooden stump/launcher
 ctx.save();ctx.fillStyle='#7a4a20';ctx.beginPath();ctx.ellipse(SX,SY+38,46,14,0,0,7);ctx.fill();
 const lg=ctx.createLinearGradient(SX-34,0,SX+34,0);lg.addColorStop(0,'#a86a2e');lg.addColorStop(.5,'#d89a52');lg.addColorStop(1,'#8a5220');ctx.fillStyle=lg;
 ctx.beginPath();ctx.moveTo(SX-34,SY+38);ctx.lineTo(SX-28,SY+8);ctx.quadraticCurveTo(SX,SY-4,SX+28,SY+8);ctx.lineTo(SX+34,SY+38);ctx.fill();
 const a=aim!=null?aim:-Math.PI/2;ctx.translate(SX,SY);ctx.rotate(a+Math.PI/2);ctx.fillStyle='#ffe45c';ctx.beginPath();ctx.moveTo(-6,-R-4);ctx.lineTo(0,-R-16);ctx.lineTo(6,-R-4);ctx.fill();ctx.restore();
 if(!bullet&&state==='play'){const sg=boost?sprites[boost]:spriteFor(cur);ctx.drawImage(sg,SX-R,SY-R,D,D)}
 if(bullet)ctx.drawImage(spriteFor(bullet.g),bullet.x-R,bullet.y-R,D,D);
 // next bubble (tap to swap)
 ctx.save();ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(SX-70,SY+22,R*.85+6,0,7);ctx.fill();
 ctx.drawImage(spriteFor(nxt),SX-70-R*.85,SY+22-R*.85,D*.85,D*.85);
 ctx.fillStyle='#1d5a1d';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('הבא 🔄',SX-70,SY+60);ctx.restore();
 drawMonkey(ctx,t,mood);
 // particles
 parts.forEach(p=>{if(p.delay>0)return;ctx.globalAlpha=Math.max(0,p.life);if(p.ring){ctx.strokeStyle=p.col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,R*(1.6-p.life),0,7);ctx.stroke()}else{ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,7);ctx.fill()}});
 ctx.globalAlpha=1;
 floaters.forEach(f=>{ctx.globalAlpha=Math.max(0,f.life);ctx.font='bold 24px sans-serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#3b1583';ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle='#ffe45c';ctx.fillText(f.text,f.x,f.y)});ctx.globalAlpha=1;
}
// ---------- end screens ----------
function starsFor(){const f=score/L.target;return f>=.96?3:f>=.66?2:1}
function win(){
 const bonus=shotsLeft*50;score+=bonus;updateHud();const st=starsFor();snd('win');
 save.stars[levelN]=Math.max(save.stars[levelN]||0,st);save.best[levelN]=Math.max(save.best[levelN]||0,score);
 if(levelN>=save.unlocked&&levelN<MAXLEVEL)save.unlocked=levelN+1;persist();confetti();
 modal(`<h2>🎉 ניצחון! 🎉</h2><div class="bigstars">${'★'.repeat(st)}<span style="color:#ccc">${'★'.repeat(3-st)}</span></div>
 <p style="text-align:center">שלב ${levelN} הושלם<br>נקודות: <b>${score}</b> (בונוס יריות ${bonus})</p>
 ${levelN<MAXLEVEL?'<button class="btn big primary" data-a="next">לשלב הבא ▶</button>':'<p style="text-align:center">סיימת את כל 10,000 השלבים! 👑</p>'}
 <button class="btn" data-a="retry">🔁 שוב</button><button class="btn" data-a="map">🗺️ מפה</button>`);
}
function lose(reason){snd('lose');
 modal(`<h2>אוי! 😢</h2><p style="text-align:center">${reason}.<br>לא נורא — אפשר לנסות שוב!</p>
 <button class="btn big primary" data-a="retry">🔁 לנסות שוב</button><button class="btn" data-a="map">🗺️ מפה</button>`)}
function confetti(){for(let i=0;i<80;i++){const k=Math.floor(Math.random()*6);parts.push({x:Math.random()*W,y:-10,vx:(Math.random()-.5)*2,vy:Math.random()*3,life:2,col:COLORS[k].c,size:5,delay:Math.random()*400})}}
function modal(html){$('modalCard').innerHTML=html;$('modal').classList.remove('hidden')}
function closeModal(){removeArrow&&document.getElementById('iosArrow')&&document.getElementById('iosArrow').remove();$('modal').classList.add('hidden')}
$('modal').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;snd('click');const a=b.dataset.a;
 if(a==='next'){closeModal();startLevel(levelN+1)}else if(a==='retry'){closeModal();startLevel(levelN)}else if(a==='map'){closeModal();state='idle';openMap()}
 else if(a==='install'){closeModal();install();return}else if(a==='copy'){navigator.clipboard?.writeText(location.href).then(()=>toast('הקישור הועתק ✔'));return}
 else if(a==='resume'){closeModal();state='play'}else if(a==='close'){closeModal();if(state==='paused')state='play'}else if(a==='home'){closeModal();state='idle';show('home')}
 else if(a.startsWith('speed')){save.speed=+a.slice(5);persist();settings()}else if(a==='mute'){save.mute=!save.mute;persist();settings()}else if(a==='sym'){save.symbols=!save.symbols;persist();settings()}
 else if(a==='reset'){if(confirm('למחוק את כל ההתקדמות?')){save.unlocked=1;save.stars={};save.best={};persist();settings();homeInfo()}}
});
function pause(){if(state!=='play')return;state='paused';
 modal(`<h2>⏸ הפסקה</h2><button class="btn big primary" data-a="resume">▶ להמשיך</button><br><button class="btn" data-a="retry">🔁 להתחיל מחדש</button><button class="btn" data-a="map">🗺️ מפה</button><br>
 <button class="btn" data-a="mute">${save.mute?'🔇 צליל כבוי':'🔊 צליל פועל'}</button>${isStandalone()?'':'<br><button class="btn install" data-a="install">📲 הורדה לטלפון</button>'}`)}
function settings(){const inGame=state==='paused';
 modal(`<h2>⚙️ הגדרות</h2><p>מהירות המשחק:</p><div class="opt">${[[.6,'איטי 🐢'],[1,'רגיל'],[1.5,'מהיר 🐇']].map(([v,l])=>`<button class="btn ${save.speed==v?'sel':''}" data-a="speed${v}">${l}</button>`).join('')}</div>
 <div class="opt"><button class="btn ${save.mute?'':'sel'}" data-a="mute">${save.mute?'🔇 צליל כבוי':'🔊 צליל פועל'}</button>
 <button class="btn ${save.symbols?'sel':''}" data-a="sym">${save.symbols?'✔ סימנים על הבועות':'✖ בלי סימנים'}</button></div>
 <p style="font-size:17px">הסימנים (לב, טיפה, כוכב, עלה, יהלום, ריבוע) עוזרים להבדיל בין הצבעים.</p>
 ${isStandalone()?'':'<button class="btn install" data-a="install">📲 הורדה לטלפון</button><br>'}<button class="btn big primary" data-a="${inGame?'resume':'close'}">סגור</button><br><button class="btn small" data-a="reset">מחיקת התקדמות</button>`)}
function help(first){
 modal(`<h2>${first?'ברוכה הבאה! 👋':'❓ איך משחקים'}</h2><ul>
 <li>👆 <b>גוררים את האצבע</b> כדי לכוון — הנקודות מראות לאן הבועה תטוס.</li>
 <li>✋ <b>מרימים את האצבע</b> כדי לירות.</li>
 <li>🎯 מחברים <b>3 בועות או יותר</b> באותו צבע — והן מתפוצצות!</li>
 <li>🍃 בועות שנשארות בלי חיבור למעלה — נופלות ונותנות בונוס.</li>
 <li>🔄 נוגעים בבועה <b>"הבא"</b> כדי להחליף.</li>
 <li>🧱 אבן — נופלת רק כשמנתקים אותה או בפצצה. 💣 פצצה — מפוצצת את הסביבה. 🌈 קשת — מתאימה לכל צבע.</li>
 <li>⭐ ככה שמסיימים עם יותר יריות — יותר כוכבים.</li></ul>
 <h2 style="font-size:26px">📱 להוסיף למסך הבית</h2>
 <p><b>אייפון/אייפד:</b> פותחים בספארי ← לוחצים על כפתור <b>השיתוף</b> (ריבוע עם חץ למעלה) ← <b>"הוסף למסך הבית"</b> ← "הוסף".</p>
 <p><b>אנדרואיד:</b> פותחים בכרום ← <b>⋮</b> למעלה ← <b>"הוספה למסך הבית"</b> / "התקנת אפליקציה".</p>
 <p>אחרי זה המשחק נפתח כמו אפליקציה ועובד גם בלי אינטרנט.</p>
 <button class="btn big primary" data-a="close">הבנתי! 👍</button>`)}
// ---------- screens & map ----------
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));if(id==='game')setTimeout(resize,0)}
const PER=10;let page=0;
function openMap(){page=Math.floor((save.unlocked-1)/PER);show('map');renderMap()}
function renderMap(){
 const el=$('levelGrid');const w=el.clientWidth,h=el.clientHeight;if(!w)return;
 const start=page*PER+1;let pts=[];
 for(let i=0;i<PER;i++){const y=h-40-(i*(h-80)/(PER-1));const x=w/2+Math.sin(i*0.9+page)*(w/2-60);pts.push([x,y])}
 let svg=`<svg viewBox="0 0 ${w} ${h}"><path d="M${pts.map(p=>p.join(',')).join(' L')}" fill="none" stroke="#f5deb3" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="M${pts.map(p=>p.join(',')).join(' L')}" fill="none" stroke="#c9975a" stroke-width="4" stroke-dasharray="6 12"/>`;
 for(let i=0;i<14;i++){const tx=(i*97+page*31)%w,ty=(i*61+page*17)%h;svg+=`<text x="${tx}" y="${ty}" font-size="30" opacity=".7">${['🌴','🌿','🌺','🍌'][i%4]}</text>`}
 svg+='</svg>';let html=svg;
 for(let i=0;i<PER;i++){const n=start+i;if(n>MAXLEVEL)break;const lk=n>save.unlocked,st=save.stars[n]||0;const col=COLORS[n%6];
  html+=`<button class="lvl ${lk?'locked':''} ${n===save.unlocked?'current':''}" style="right:${w-pts[i][0]}px;top:${pts[i][1]}px;background:radial-gradient(circle at 35% 30%,${col.l},${col.c} 50%,${col.d})" data-n="${n}" ${lk?'aria-disabled="true"':''}>${lk?'🔒':n}<small>${lk?'':('★'.repeat(st)+'☆'.repeat(3-st))}</small></button>`}
 el.innerHTML=html;
 $('pgLabel').textContent=`${start}–${Math.min(MAXLEVEL,start+PER-1)}`;$('pgPrev').disabled=page===0;$('pgNext').disabled=(page+1)*PER>=MAXLEVEL;
 $('starsTotal').textContent='⭐ '+Object.values(save.stars).reduce((a,b)=>a+b,0);
}
$('levelGrid').addEventListener('click',e=>{const b=e.target.closest('.lvl');if(!b)return;const n=+b.dataset.n;if(n>save.unlocked){toast('השלב עוד נעול 🔒');return}snd('click');startLevel(n)});
$('pgPrev').onclick=()=>{if(page>0){page--;renderMap();snd('click')}};$('pgNext').onclick=()=>{if((page+1)*PER<MAXLEVEL){page++;renderMap();snd('click')}};
$('pgCur').onclick=()=>{page=Math.floor((save.unlocked-1)/PER);renderMap()};
$('jumpGo').onclick=()=>{const n=Math.max(1,Math.min(MAXLEVEL,+$('jumpInput').value||1));page=Math.floor((n-1)/PER);renderMap();$('jumpInput').blur()};
$('mapBack').onclick=()=>{show('home');homeInfo()};
$('btnPlay').onclick=()=>{snd('click');startLevel(Math.min(save.unlocked,MAXLEVEL))};
$('btnMap').onclick=()=>{snd('click');openMap()};$('btnHelp').onclick=()=>help();$('btnSettings').onclick=()=>settings();
$('btnPause').onclick=pause;
// ---------- install (PWA) ----------
const ua=navigator.userAgent,isIOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const iosInApp=isIOS&&(/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|WhatsApp|Telegram|Twitter/i.test(ua)||!/Safari/i.test(ua));
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;toast('המשחק נוסף למסך הבית! 🎉');applyStandalone()});
function applyStandalone(){if(isStandalone()){document.body.classList.add('standalone');$('btnInstall').classList.add('hidden')}}
function arrow(cls){removeArrow();const a=document.createElement('div');a.className='ios-arrow '+(cls||'');a.id='iosArrow';a.textContent=cls==='top'?'⬆️':'⬇️';document.body.appendChild(a)}
function removeArrow(){const a=$('iosArrow');if(a)a.remove()}
async function install(){snd('click');
 if(isStandalone()){toast('המשחק כבר על המסך שלך 😊');return}
 if(deferredPrompt){deferredPrompt.prompt();try{const r=await deferredPrompt.userChoice;if(r.outcome==='accepted')toast('מעולה! האייקון נוסף 🎉')}catch(e){}deferredPrompt=null;return}
 if(iosInApp){modal(`<h2>📲 הורדה לטלפון</h2><p>כדי לשים את המשחק על מסך הבית צריך לפתוח אותו ב<b>ספארי</b> 🧭.</p>
  <div class="step"><b class="n">1</b><span>לחצי על <b>⋯</b> או על כפתור השיתוף בדפדפן הזה</span></div><div class="step"><b class="n">2</b><span>בחרי <b>"פתח בספארי"</b></span></div>
  <div class="step"><b class="n">3</b><span>בספארי לחצי שוב על <b>📲 הורדה לטלפון</b></span></div>
  <p style="text-align:center;direction:ltr;font-size:17px">${location.href}</p><button class="btn" data-a="copy">📋 העתקת הקישור</button><br><button class="btn big primary" data-a="close">הבנתי 👍</button>`);return}
 if(isIOS){const iPad=/iPad/.test(ua)||(navigator.platform==='MacIntel');arrow(iPad?'top':'');
  modal(`<h2>📲 הורדה לאייפון</h2>
  <div class="step"><b class="n">1</b><span>לחצי על כפתור <b>השיתוף</b> <span style="font-size:30px">⬆️⃞</span> (ריבוע עם חץ למעלה) — ${iPad?'למעלה בצד ימין':'בתחתית המסך'}</span></div>
  <div class="step"><b class="n">2</b><span>גללי ובחרי <b>"הוספה למסך הבית" ➕</b></span></div>
  <div class="step"><b class="n">3</b><span>לחצי <b>"הוסף"</b> למעלה — והאייקון יופיע על הטלפון! 🫧</span></div>
  <button class="btn big primary" data-a="close">הבנתי 👍</button>`);return}
 modal(`<h2>📲 הורדה לטלפון</h2>
  <div class="step"><b class="n">1</b><span>פתחי את המשחק בדפדפן <b>כרום</b></span></div>
  <div class="step"><b class="n">2</b><span>לחצי על <b>⋮</b> (שלוש נקודות למעלה)</span></div>
  <div class="step"><b class="n">3</b><span>בחרי <b>"הוספה למסך הבית"</b> או <b>"התקנת אפליקציה"</b></span></div>
  <button class="btn big primary" data-a="close">הבנתי 👍</button>`)}
$('btnInstall').onclick=install;applyStandalone();
window.matchMedia('(display-mode: standalone)').addEventListener?.('change',applyStandalone);
$('bstSwap').onclick=swap;
$('bstBomb').onclick=()=>{if(boosts.b&&state==='play'){boost=boost==='b'?null:'b';updateHud();snd('click')}};
$('bstRainbow').onclick=()=>{if(boosts.r&&state==='play'){boost=boost==='r'?null:'r';updateHud();snd('click')}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('touchmove',e=>{if(!e.target.closest('.card'))e.preventDefault()},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault());
document.addEventListener('keydown',e=>{if(e.code==='Space'){swap();e.preventDefault()}if(e.code==='Escape')pause()});
function homeInfo(){const st=Object.values(save.stars).reduce((a,b)=>a+b,0);$('homeProgress').textContent=`שלב ${save.unlocked} מתוך 10,000 · ⭐ ${st}`}
buildSprites();buildBg();homeInfo();requestAnimationFrame(frame);
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
window.__gb={simulate:a=>{const p=traceAim(a),e=p[p.length-1],sn=snap(e[0],e[1]);if(!sn||cur.t!=='c')return 0;grid[sn[0]][sn[1]]=cur;const n=flood(sn[0],sn[1],cur.k).length;grid[sn[0]][sn[1]]=null;return n},generateLevel,startLevel,get state(){return state},get grid(){return grid},setAim:a=>{aim=a},shoot,get shots(){return shotsLeft}};
})();
