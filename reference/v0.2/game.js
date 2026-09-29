(() => {
'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const screen=document.querySelector('#screen'),hint=document.querySelector('#hint'),bar=document.querySelector('#bar');
const END=2100,SPEED=105,GRAVITY=850,CHECKPOINT=1080;
const art=new Image();art.src='assets/neighborhood.png';
let width=240,height=480,floor=350,scale=1,car=0,player,paused=true,finished=false,started=false,last=0,elapsed=0,checkpoint=0,death=0,buffer=null,muted=false,audio=null,beat=0,raf=0;
const keys=new Set();
// All positions are fixed world units. Art and collision use the same dimensions.
const objects=[{x:230,type:'mail',w:24,h:36},{x:445,type:'fence',w:55,h:32},{x:760,type:'car',w:100,h:37},{x:1260,type:'wall',w:64,h:63},{x:1470,type:'mail',w:24,h:36},{x:1870,type:'fence',w:74,h:35}];
const gaps=[[610,669],[1640,1710]];
const solids=objects.flatMap(o=>o.type==='car'?[{x:o.x,w:o.w,h:19},{x:o.x+27,w:48,h:o.h}]:[{x:o.x,w:o.w,h:o.h}]);
function resize(){const old=floor;scale=Math.max(.75,Math.min(innerWidth/240,innerHeight/420));width=Math.ceil(innerWidth/scale);height=Math.ceil(innerHeight/scale);floor=Math.round(height*.74);canvas.width=width;canvas.height=height;ctx.imageSmoothingEnabled=false;if(player)player.y+=floor-old;draw()}
function reset(at=0){car=at;elapsed=at/SPEED;checkpoint=at>=CHECKPOINT?CHECKPOINT:0;player={x:at,y:floor,vx:0,vy:0,on:true,angle:0,air:0,rotationDuration:1,kind:'jump',step:0,coyote:.09};death=0;buffer=null;finished=false}
reset();resize();addEventListener('resize',resize);
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function line(points,c,w=1){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineJoin='miter';ctx.lineCap='square';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.stroke()}
function xScreen(x,parallax=1){return width*.32+x-car*parallax}
function groundAt(x){return !gaps.some(([a,b])=>x>a&&x<b)}
function show(title,description,label){document.querySelector('#heading').innerHTML=title;document.querySelector('#description').textContent=description;document.querySelector('#start').textContent=label;screen.classList.remove('hidden');paused=true;cancelAnimationFrame(raf)}
function start(){if(finished)reset();screen.classList.add('hidden');paused=false;started=true;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);initAudio()}
function pause(){if(!started||finished)return;paused?start():show('Paused','The car waits.','CONTINUE')}
function initAudio(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audio){const ac=new AC(),gain=ac.createGain();gain.gain.value=muted?0:.055;gain.connect(ac.destination);audio={ac,gain}}audio.ac.resume()?.catch(()=>{})}catch{audio=null}}
function note(f,d=.4,v=.2){if(!audio||muted||paused)return;try{const t=audio.ac.currentTime,o=audio.ac.createOscillator(),g=audio.ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(audio.gain);o.start(t);o.stop(t+d)}catch{}}
function requestJump(kind){if(paused||death)return;buffer={kind,remaining:.13};if(player.on||player.coyote>0)doJump()}
function doJump(){if(!buffer)return;const kind=buffer.kind;buffer=null;player.on=false;player.coyote=0;player.kind=kind;player.vy=kind==='high'?-370:kind==='long'?-270:-305;player.vx=kind==='long'?53:kind==='high'?-10:4;player.air=0;player.rotationDuration=-2*player.vy/GRAVITY;player.angle=0;note(kind==='high'?440:330,.17,.2)}
function land(y){player.y=y;player.vy=0;player.on=true;player.coyote=.09;player.angle=0;player.air=0;}
function fail(){if(death)return;death=.6;hint.textContent='BACK TO THE CROSSING';note(110,.2,.12)}
function update(dt){if(death){death-=dt;if(death<=0)reset(checkpoint);return}elapsed+=dt;car+=SPEED*dt;beat+=dt;if(beat>.48){beat=0;const notes=[220,329.63,261.63,329.63,196,293.66,246.94,293.66];note(notes[Math.floor(elapsed/.48)%notes.length],.9,.12)}
 if(buffer){buffer.remaining-=dt;if(buffer.remaining<0)buffer=null}
 const oldX=player.x,oldY=player.y,wasOn=player.on;
 player.x+=(SPEED+player.vx)*dt;player.vx*=Math.exp(-dt*(player.on?5:1.6));
 player.on=false;player.vy+=GRAVITY*dt;player.y+=player.vy*dt;
 // Swept top collision: settle feet on the actual surface, never rotate the hitbox.
 let bestY=Infinity;
 for(const s of solids){const top=floor-s.h;if(player.x+5>s.x&&player.x-5<s.x+s.w){if(player.vy>=0&&oldY<=top+.5&&player.y>=top)bestY=Math.min(bestY,top);else if(oldX+5<=s.x+.1&&player.x+5>s.x&&player.y>top+1&&oldY>top+.5&&player.y-25<floor){player.x=s.x-5;player.vx=Math.min(player.vx,0)}}}
 if(groundAt(player.x)&&oldY<=floor+.5&&player.y>=floor&&player.vy>=0)bestY=Math.min(bestY,floor);
 if(bestY<Infinity)land(bestY);
 if(player.on){player.step+=dt*15;if(buffer)doJump()}
 else{player.coyote=wasOn?.09:Math.max(0,player.coyote-dt);player.air+=dt;if(player.kind!=='jump'){const phase=Math.min(1,player.air/player.rotationDuration);player.angle=(player.kind==='high'?-1:1)*Math.PI*2*phase}else player.angle=0}
 if(player.x<car-width*.32-12||player.y>floor+100)fail();
 if(player.x>car+width*.62){player.x=car+width*.62;player.vx=0}
 // Checkpoints only activate once both the car and runner have safely crossed.
 if(car>=CHECKPOINT&&player.x>=CHECKPOINT&&player.on)checkpoint=CHECKPOINT;
 if(car>=END){finished=true;show('End of<br>the block.','A 20-second drive. Take another run and try a different jump.','DRIVE AGAIN')}
 bar.style.width=Math.min(100,car/END*100)+'%';
 if(!death)hint.textContent=car<180?'TAP TO JUMP':car>510&&car<665?'SWIPE → FOR DISTANCE':car>1110&&car<1240?'SWIPE ← FOR HEIGHT':car>CHECKPOINT&&car<CHECKPOINT+70?'CHECKPOINT':'';
}
function draw(){
 rect(0,0,width,height,'#25214e');
 // Draw a persistent panorama. It moves at one quarter of the route speed.
 // Its tile index and culling use the same layer coordinate as rendering.
 const bgHeight=floor-4,tileWidth=bgHeight*3,offset=car*.24;
 if(art.complete&&art.naturalWidth){const first=Math.floor(offset/tileWidth);for(let i=first;i<=Math.floor((offset+width)/tileWidth);i++)ctx.drawImage(art,Math.round(i*tileWidth-offset),0,Math.ceil(tileWidth)+1,bgHeight)}
 // Background poles are retained across a full layer-space viewport, including wires.
 const par=.64,startX=car*par-width*.32;const firstPole=Math.floor((startX-340)/340)*340;
 for(let wx=firstPole;wx<startX+width+340;wx+=340){const x=xScreen(wx,par),top=floor-200;rect(x,top,5,200,'#25233e');rect(x+1,top,1,200,'#74504d');rect(x-16,top+13,36,4,'#30233e');for(let a=-12;a<=16;a+=14)rect(x+a,top+8,4,6,'#25233e');rect(x+6,top+34,9,23,'#47415b');line([[x,top+13],[x+85,top+28],[x+170,top+35],[x+255,top+28],[x+340,top+13]],'#27203c');}
 // Road and curb live beneath the playable path.
 rect(0,floor,width,height-floor,'#22243e');rect(0,floor,width,7,'#b98377');rect(0,floor+7,width,4,'#4d465c');rect(0,floor+11,width,3,'#b2817c');
 for(let i=-1;i<width/80+1;i++){const x=i*80-(car*1.15)%80;rect(x,floor+43,40,2,'#8b6882');rect(x+21,floor+27,30,1,'#443856')}
 for(let i=-1;i<width/100+1;i++){const x=i*100-car%100;rect(x,floor-6,100,6,'#443746');rect(x,floor-7,100,2,'#e5a56c');rect(x+24,floor-10,2,4,'#9c9949');rect(x+27,floor-12,2,6,'#586d40')}
 for(const [a,b]of gaps){const x=xScreen(a);rect(x,floor-8,b-a,24,'#141a2d');rect(x-2,floor-8,3,23,'#d49370');rect(x+b-a-1,floor-8,3,23,'#d49370');rect(x+7,floor+11,b-a-14,2,'#46445f')}
 for(const o of objects){const x=xScreen(o.x),y=floor-o.h;if(x+o.w<-5||x>width+5)continue;
 if(o.type==='mail'){rect(x+10,y+15,4,o.h-15,'#342038');rect(x+11,y+16,1,o.h-16,'#b87658');rect(x,y,o.w,16,'#29243d');rect(x+2,y+2,o.w-4,12,'#ac9aba');rect(x+3,y+3,2,10,'#d4baca');rect(x+1,y,o.w-2,2,'#ffcf7b');rect(x+18,y-5,2,15,'#d83b40');rect(x+19,y-5,6,4,'#f55c3e');rect(x+8,y+8,7,2,'#72516c')}
 else if(o.type==='fence'){for(let i=0;i<o.w;i+=8){rect(x+i,y,7,o.h,'#503241');rect(x+i+1,y+2,2,o.h-2,'#97604f');rect(x+i,y,7,2,'#ffd580');rect(x+i+4,y+7,1,8,'#291f35')}rect(x,y+o.h-8,o.w,3,'#33233a')}
 else if(o.type==='wall'){rect(x,y,o.w,o.h,'#382740');for(let row=0;row<Math.ceil(o.h/9);row++){for(let col=-1;col<5;col++){const bx=x+col*18+(row%2)*9;const left=Math.max(x,bx+1),right=Math.min(x+o.w,bx+17);if(right>left)rect(left,y+row*9+1,right-left,7,row%2?'#864653':'#a45251')}}rect(x,y,o.w,3,'#ffcc7b');rect(x,y+3,o.w,2,'#bd775c')}
 else{ // Side profile car. Roof collision only covers the roof; hood is a lower step.
 rect(x,floor-19,o.w,16,'#262a50');rect(x+2,floor-17,o.w-4,12,'#425895');rect(x+27,y,48,18,'#263b73');rect(x+27,y,48,2,'#ffce82');rect(x+31,y+4,17,11,'#a57587');rect(x+51,y+4,20,11,'#6f667f');rect(x+33,y+5,12,3,'#e7a67e');rect(x,floor-19,27,2,'#f9be74');rect(x+75,floor-19,25,2,'#f9be74');rect(x,floor-7,100,2,'#8795b2');rect(x+1,floor-16,4,5,'#ee5b40');rect(x+94,floor-16,5,4,'#ffe3a2');for(let wheel of [20,82]){rect(x+wheel-7,floor-9,14,12,'#181a30');rect(x+wheel-4,floor-6,8,8,'#77768d');rect(x+wheel-1,floor-4,2,4,'#c2a6ab')}}
 }
 if(checkpoint===CHECKPOINT){const x=xScreen(CHECKPOINT);for(let i=0;i<4;i++)rect(x+i*10,floor+16,5,15,'#b29b9d')}
 // Rotate around the torso, so a flip never swings the whole figure around its feet.
 const px=Math.round(xScreen(player.x)),py=Math.round(player.y);ctx.save();ctx.translate(px,py-14);ctx.rotate(player.angle);const phase=player.on?Math.sin(player.step):.55;
 function limb(p){line(p,'#17152c',4);line(p,'#fff8df',2)}
 rect(-4,-16,8,8,'#17152c');rect(-3,-15,6,6,'#fff8df');limb([[0,-7],[-1,0],[1,5]]);limb([[0,-5],[6,-1],[8,-5]]);limb([[-1,-4],[-6,0],[-8,4]]);limb([[1,5],[6+phase*3,9],[9+phase*4,14]]);limb([[1,5],[-4-phase*3,9],[-8-phase*4,14]]);ctx.restore();
 // Window edge is foreground framing, separate from the moving road.
 const sill=height-20;rect(0,sill,width,20,'#14182c');rect(0,sill,width,2,'#5d485f');rect(0,sill+3,width,2,'#2b3049');line([[0,height-69],[13,sill-5],[width-1,sill-5]],'#161a2b',6);line([[0,height-73],[15,sill-9],[width-1,sill-9]],'#d68c58',1);
 if(death)rect(0,0,width,height,`rgba(30,23,46,${Math.min(.7,death)})`);
}
function frame(now){if(paused)return;const dt=Math.min(.04,(now-last)/1000||.016);last=now;const n=Math.ceil(dt/.008);for(let i=0;i<n&&!paused;i++)update(dt/n);draw();if(!paused)raf=requestAnimationFrame(frame)}
document.querySelector('#start').onclick=start;document.querySelector('#pause').onclick=pause;document.querySelector('#sound').onclick=()=>{muted=!muted;document.querySelector('#sound').textContent=muted?'♪̸':'♪';if(audio)audio.gain.gain.value=muted?0:.055};
let pointer=null;canvas.addEventListener('pointerdown',e=>{if(paused)return;pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointerup',e=>{if(!pointer)return;const dx=e.clientX-pointer.x;pointer=null;requestJump(Math.abs(dx)>28?(dx>0?'long':'high'):'jump')});canvas.addEventListener('pointercancel',()=>pointer=null);
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowLeft','ArrowRight','KeyP'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyP')pause();if(e.code==='Space'||e.code==='ArrowUp')requestJump(keys.has('ArrowRight')?'long':keys.has('ArrowLeft')?'high':'jump')});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();if(started&&!paused&&!finished)pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused&&!finished)pause()});
art.onload=draw;draw();
// Opt-in local QA adapter, absent unless explicitly requested by URL.
if(new URLSearchParams(location.search).has('test'))window.gameQA={state:()=>({car,player:{...player},checkpoint,death,paused,finished,width,height,floor}),jump:requestJump,step:dt=>{update(dt);draw()},objects,solids,gaps};
})();
