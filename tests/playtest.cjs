const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'../dist');
const route=[[188,'jump'],[403,'jump'],[586,'long'],[739,'jump'],[1214,'high'],[1428,'jump'],[1630,'long'],[1827,'jump']];
const sizes=[[1440,900],[390,844],[844,390],[768,1024],[1024,768],[320,568],[568,320]];
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]).replace(/^\/window-runner\//,'');const file=path.join(root,name||'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':'text/html');res.end(data)})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/window-runner/?test`;
fs.mkdirSync('test-results',{recursive:true});
const engine=process.env.BROWSER==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
for(const [width,height]of sizes){const page=await browser.newPage({viewport:{width,height},hasTouch:width!==1440});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{}});
await page.goto(url);await page.waitForFunction(()=>document.querySelector('canvas').width>0);await page.screenshot({path:`test-results/${width}x${height}-menu.png`});
const bounds=await page.locator('#start').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=height,'start fits viewport');
await page.click('#start');
const result=await page.evaluate((route)=>{gameQA.reset();let next=0,landings=0,lastOn=true,cp=false;for(let frame=0;frame<3000;frame++){let s=gameQA.state();if(s.death)return {failed:true,s,next};if(s.finished)return {finished:true,landings,cp,elapsed:s.elapsed,x:s.player.x};if(next<route.length&&s.player.x>=route[next][0]){gameQA.jump(route[next++][1])}gameQA.step(1/120);s=gameQA.state();if(s.player.on&&!lastOn){landings++;if(s.player.angle!==0)throw Error('tilted landing')}lastOn=s.player.on;cp ||=s.checkpoint===1080}return {timeout:true,s:gameQA.state(),next}},route);
assert.equal(result.finished,true,JSON.stringify(result));assert(result.cp);assert(result.landings>=8);assert(Math.abs(result.elapsed-20)<.1);assert.match(await page.locator('#heading').innerText(),/Made it/);
await page.click('#start');await page.evaluate(()=>{gameQA.reset();gameQA.step(1)});await page.screenshot({path:`test-results/${width}x${height}-play.png`});
assert.deepEqual(errors,[]);console.log(`${process.env.BROWSER||'chromium'} ${width}x${height}: full course ${result.elapsed.toFixed(3)}s, ${result.landings} landings, checkpoint, finish, replay, menu fit, no JS errors`);await page.close()}

const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{}});await page.goto(url);await page.click('#start');
const state=()=>page.evaluate(()=>gameQA.state());
const reset=async(at=0)=>page.evaluate(at=>{gameQA.reset(at);gameQA.step(0)},at);
const step=async(t)=>page.evaluate(t=>gameQA.step(t),t);
// Exercise real keyboard events over the complete route.
await reset();for(const [x,kind]of route){await page.evaluate(x=>{for(let n=0;n<1000&&gameQA.state().player.x<x;n++)gameQA.step(1/120)},x);if(kind!=='jump')await page.keyboard.down(kind==='long'?'ArrowRight':'ArrowLeft');await page.keyboard.press('Space');if(kind!=='jump')await page.keyboard.up(kind==='long'?'ArrowRight':'ArrowLeft');assert.equal((await state()).player.kind,kind)}await step(4);assert((await state()).finished);await page.click('#start');
await reset();await page.touchscreen.tap(180,450);assert.equal((await state()).player.kind,'jump');assert.equal((await state()).player.on,false);
await reset();await page.mouse.move(180,450);await page.mouse.down();await page.mouse.move(230,451);assert.equal((await state()).player.kind,'long');await page.mouse.up();
await reset();await page.mouse.move(200,450);await page.mouse.down();await page.mouse.move(150,451);assert.equal((await state()).player.kind,'high');await page.mouse.up();
await reset();await page.mouse.move(180,450);await page.mouse.down();await page.mouse.move(181,520);await page.mouse.up();assert.equal((await state()).player.on,true,'vertical drag ignored');
await reset();await page.mouse.move(180,450);await page.mouse.down();await page.evaluate(()=>{const id=gameQA.state().pointer.id;document.querySelector('canvas').dispatchEvent(new PointerEvent('pointercancel',{pointerId:id}))});await page.mouse.up();assert.equal((await state()).player.on,true,'cancel cannot jump');
// Contact IDs prevent a second finger from replacing the initial gesture.
if(process.env.BROWSER!=='webkit'){const cdp=await page.context().newCDPSession(page);await reset();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:450,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:450,id:1},{x:230,y:500,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:225,y:450,id:1},{x:240,y:500,id:2}]});assert.equal((await state()).player.kind,'long');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await reset();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:220,y:450,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:175,y:450,id:1}]});assert.equal((await state()).player.kind,'high');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
await reset();await page.keyboard.press('Space');await step(.65);await page.keyboard.press('Space');assert((await state()).buffer);await step(.1);assert.equal((await state()).player.on,false,'buffered jump launched on landing');assert((await state()).player.vy<0);
await reset();await page.keyboard.press('Space');await step(.15);await page.keyboard.press('Space');await step(.6);assert.equal((await state()).player.on,true,'expired buffer does not launch');
await reset();await page.keyboard.down('ArrowLeft');await page.keyboard.press('Space');await page.keyboard.up('ArrowLeft');await step(.2);let before=await state();await page.setViewportSize({width:844,height:390});await page.waitForTimeout(40);let after=await state();assert.equal(after.player.x,before.player.x);assert.equal(after.player.vy,before.player.vy);assert(Math.abs((before.floor-before.player.y)-(after.floor-after.player.y))<1e-8);await step(.8);assert.equal((await state()).player.angle,0);
await page.keyboard.press('KeyP');before=await state();await step(1);assert.equal((await state()).car,before.car);await page.keyboard.press('KeyP');assert.equal((await state()).paused,false);assert.equal((await state()).buffer,null);
await reset(1080);await step(2);assert((await state()).death>0,'side collision respawns');await step(.7);after=await state();assert.equal(after.checkpoint,1080);assert(after.player.x>=1080&&after.player.x<1100);assert.equal(after.player.angle,0);assert.equal(after.buffer,null);
await reset(600);await step(1.1);assert((await state()).death>0,'gap fall');await step(.7);assert.equal((await state()).checkpoint,0);
await reset();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert((await state()).paused);await page.keyboard.press('KeyP');assert.equal((await state()).paused,false);
const css=await page.evaluate(()=>({touch:getComputedStyle(document.querySelector('canvas')).touchAction,overflow:getComputedStyle(document.body).overflow,scroll:scrollY}));assert.equal(css.touch,'none');assert.equal(css.overflow,'hidden');assert.equal(css.scroll,0);
console.log('PASS: keyboard full course; native touch tap; pointer swipes; touch swipes and multitouch (Chromium); vertical drag/cancel; input buffering/expiry; airborne rotation; upright landing; pause/resume; checkpoint and gap respawns; blur; scroll CSS');await page.close();
const retry=await browser.newPage();let loads=0;await retry.route('**/assets/neighborhood.png*',r=>++loads===1?r.abort():r.continue());await retry.goto(url);await retry.waitForFunction(()=>document.querySelector('#start').textContent==='RETRY LOADING');await retry.click('#start');await retry.waitForFunction(()=>document.querySelector('#start').textContent==='START THE DRIVE');assert.equal(await retry.locator('#start').isEnabled(),true);await retry.close();console.log('PASS: artwork load failure and retry');
}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
