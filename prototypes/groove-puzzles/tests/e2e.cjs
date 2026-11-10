// PROTOTYPE - NOT FOR PRODUCTION. End-to-end check for Groove Puzzles: node tests/e2e.cjs (needs Playwright + Chromium). Screenshots go to tests/shots/.
const { chromium } = require('playwright');
const path=require('path'); const URL='file://'+path.resolve(__dirname,'..','index.html'); process.chdir(__dirname);
const out=[]; const ok=(c,m)=>out.push((c?'PASS ':'FAIL ')+m);
(async () => {
  const b = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('console', m => { if(m.type()==='error'||m.type()==='assert') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERROR '+e.message));
  await p.goto(URL); await p.waitForTimeout(300);
  ok((await p.evaluate(()=>GP.state.verify.every(r=>r.ok))), 'all 18 levels verified solvable');
  await p.screenshot({path:'shots/title.png'});
  await p.click('#btn-start'); await p.waitForTimeout(300);
  ok(await p.evaluate(()=>GP.state.screen==='play' && GP.state.L.id==='first-kick' && GP.Seq.playing), 'Start opens level 1 and auto-plays');
  // click beat 1 cell via real mouse
  const box = await p.locator('#grid').boundingBox();
  const g = await p.evaluate(()=>({cw:GP_cw(), r:GP.state.L&&1})).catch(()=>null);
  const geo = await p.evaluate(()=>{ const c=document.getElementById('grid'); return {cw: c.clientWidth/GP.state.L.steps}; });
  await p.mouse.click(box.x + geo.cw*0.5, box.y + 24 + 15);
  ok(await p.evaluate(()=>GP.state.notes.length===1 && GP.state.notes[0].step===0), 'mouse click places kick on beat 1');
  ok(await p.evaluate(()=>GP.state.evalRes.requiredPass && GP.state.stars>=1), 'required rules pass -> 1 star');
  // keyboard: cursor to step 4 and Enter
  await p.focus('#grid'); for(let i=0;i<4;i++) await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter');
  ok(await p.evaluate(()=>GP.state.notes.some(n=>n.step===4)), 'keyboard Enter places kick on beat 3');
  ok(await p.evaluate(()=>GP.state.stars===3), '3 stars with 2 edits');
  // playhead progress
  const s1 = await p.evaluate(()=>GP.state.playStep); await p.waitForTimeout(700); const s2 = await p.evaluate(()=>GP.state.playStep);
  ok(s1!==s2 && s2>=0, `playhead advances (${s1} -> ${s2})`);
  // undo/redo
  await p.keyboard.press('Control+z'); ok(await p.evaluate(()=>GP.state.notes.length===1),'undo');
  await p.keyboard.press('Control+Shift+z'); ok(await p.evaluate(()=>GP.state.notes.length===2),'redo');
  await p.click('#btn-finish'); await p.waitForTimeout(200);
  ok(await p.isVisible('#modal'), 'finish shows result modal');
  ok((await p.textContent('#dialog')).includes('Unlocked'), 'result shows unlocks');
  await p.screenshot({path:'shots/result.png'});
  await p.click('#m-next'); await p.waitForTimeout(200);
  ok(await p.evaluate(()=>GP.state.L.id==='backbeat'), 'next level opens');
  // locked lane deny
  await p.mouse.click(box.x + 5, box.y + 24 + 15);
  ok(await p.evaluate(()=>GP.state.notes.length===2), 'locked kick lane cannot be edited');
  // go through each level with applySolution via unlockAll
  await p.evaluate(()=>{ GP.unlockAll(); });
  for (let i=0;i<18;i++){
    const r = await p.evaluate(i=>{ GP.openLevel(i); const pre=GP.state.evalRes.requiredPass; GP.applySolution(); return {pre, req:GP.state.evalRes.requiredPass, stars:GP.state.stars, g:GP.state.grooveRes.total, tip:GP.state.grooveRes.tip}; }, i);
    ok(!r.pre && r.req && r.stars===3, `L${i+1}: start fails, solution -> ${r.stars} stars, groove ${r.g}`);
  }
  // ghost flow L7
  await p.evaluate(()=>GP.openLevel(6)); await p.click('#btn-target'); await p.waitForTimeout(400);
  ok(await p.evaluate(()=>GP.Seq.source==='target' && GP.state.listens===1), 'hear target plays target and counts a listen');
  await p.waitForTimeout(400); await p.screenshot({path:'shots/ghost-listening.png'});
  await p.click('#btn-check'); ok(/of 5 right/.test(await p.textContent('#rules')), 'check shows mastermind feedback: '+(await p.textContent('#rules .det')));
  await p.click('#btn-reveal'); ok(await p.evaluate(()=>GP.state.hints===1 && GP.state.revealed.size===1), 'reveal a note');
  // fix L5: out of moves
  await p.evaluate(()=>GP.openLevel(4));
  const res = await p.evaluate(()=>{ const s=GP.state; let n=0; for(let st=0;st<8;st++){ /* remove hats 0..7 via toggle by clicking API */ } return true; });
  const box5 = await p.locator('#grid').boundingBox(); const cw5 = await p.evaluate(()=>document.getElementById('grid').clientWidth/16);
  const hatY = await p.evaluate(()=>{ return 24 + 38*2 + 19; });
  for (let st=0; st<8; st++) await p.mouse.click(box5.x + cw5*st + cw5/2, box5.y + hatY);
  ok(await p.evaluate(()=>GP.state.undo.length===7), 'fix level stops at the 7-move budget');
  ok(await p.isVisible('.fail-banner'), 'out-of-moves fail banner shows');
  await p.screenshot({path:'shots/fix-out-of-moves.png'});
  // fill L6: pinned initial notes cannot be removed
  await p.evaluate(()=>GP.openLevel(5)); const box6 = await p.locator('#grid').boundingBox();
  await p.mouse.click(box6.x + 5, box6.y + 24 + 19);
  ok(await p.evaluate(()=>GP.state.notes.some(n=>n.lane==='kick'&&n.step===0)), 'fill level: starting kick is pinned');
  // remove L8: cannot add
  await p.evaluate(()=>GP.openLevel(7)); const before = await p.evaluate(()=>GP.state.notes.length);
  const box8 = await p.locator('#grid').boundingBox(); const cw8 = await p.evaluate(()=>document.getElementById('grid').clientWidth/16);
  await p.mouse.click(box8.x + cw8*1.5, box8.y + 24 + 19); // kick step 1 is empty -> add denied
  ok(await p.evaluate(b=>GP.state.notes.length===b, before), 'remove level: adding is refused');
  await p.mouse.click(box8.x + cw8*2.5, box8.y + 24 + 19); // kick step 2 exists -> removed
  ok(await p.evaluate(b=>GP.state.notes.length===b-1, before), 'remove level: tap removes');
  // move tool drag on L10
  await p.evaluate(()=>GP.openLevel(9)); await p.click('#tools button:nth-child(2)');
  const geo10 = await p.evaluate(()=>{ const c=document.getElementById('grid'); return {cw:c.clientWidth/16}; });
  const box10 = await p.locator('#grid').boundingBox();
  // bass home row is last row; rows: kick, snare, hat(38 each) then 6 bass rows of 24 -> p0 at y=24+114+5*24
  const yb = 24 + 38*3 + 5*24 + 12;
  await p.mouse.move(box10.x + geo10.cw*1.5, box10.y+yb); await p.mouse.down(); await p.mouse.move(box10.x + geo10.cw*0.5, box10.y+yb, {steps:4}); await p.mouse.up();
  ok(await p.evaluate(()=>GP.state.notes.some(n=>n.lane==='bass'&&n.step===0&&n.pitch===0) && GP.state.undo.length===1), 'move tool drags bass note to step 1 in one move');
  // resize on L11
  await p.evaluate(()=>GP.openLevel(10)); await p.click('#tools button:nth-child(3)');
  const box11 = await p.locator('#grid').boundingBox();
  await p.mouse.move(box11.x + geo10.cw*0.5, box11.y+yb); await p.mouse.down(); await p.mouse.move(box11.x + geo10.cw*3.5, box11.y+yb, {steps:5}); await p.mouse.up();
  ok(await p.evaluate(()=>GP.state.notes.find(n=>n.lane==='bass'&&n.step===0).len===4), 'resize drag holds bass note for 4 steps');
  // velocity on L13
  await p.evaluate(()=>GP.openLevel(12)); const box13=await p.locator('#grid').boundingBox();
  await p.mouse.click(box13.x + geo10.cw*4.5, box13.y + 24 + 38 + 19);
  await p.click('#tools button:nth-child(3)'); await p.mouse.click(box13.x + geo10.cw*4.5, box13.y + 24 + 38 + 19);
  ok(await p.evaluate(()=>GP.state.notes.find(n=>n.lane==='snare').vel===3), 'velocity tool makes snare loud');
  // mid-game screenshot: house level partially built, playing
  await p.evaluate(()=>{ GP.openLevel(13); GP.applySolution(); const s=GP.state; s.notes=s.notes.filter(n=>!(n.lane==='bass'&&n.step===14)&&!(n.lane==='hat'&&n.vel===1&&n.step>8)); s.undo=[]; GP.state.L&&0; });
  await p.evaluate(()=>{ GP.Seq.start(); }); await p.evaluate(()=>{ const s=GP.state; s.notes=[...s.notes]; });
  await p.evaluate(()=>{ /* refresh panels */ GP.state.undo.push(GP.state.notes); }); 
  await p.evaluate(()=>{ GP.state.undo.pop(); });
  await p.evaluate(()=>{ const ev=new Event('x'); });
  await p.evaluate(()=>{ GP.state.notes = GP.state.notes.slice(); document.getElementById('btn-undo'); });
  await p.evaluate(()=>{ /* re-evaluate */ GP.state.edits=0; }); 
  await p.evaluate(()=>{ GP.state.L && window.GP; }); 
  await p.waitForTimeout(900);
  await p.screenshot({path:'shots/mid-game-house.png', fullPage:true});
  // sandbox
  await p.evaluate(()=>GP.openSandbox()); ok(await p.evaluate(()=>GP.state.L.kind==='sandbox' && GP.state.L.lanes.length===8), 'sandbox opens with all unlocked lanes');
  await p.screenshot({path:'shots/sandbox.png'});
  // level select
  await p.evaluate(()=>GP.goLevels()); await p.screenshot({path:'shots/levels.png', fullPage:true});
  // help
  await p.click('#nav-help'); ok(await p.isVisible('#modal'),'help opens'); await p.keyboard.press('Escape');
  // reduced motion
  await p.click('#nav-motion'); ok(await p.evaluate(()=>document.body.classList.contains('rm')), 'reduced motion toggles');
  // fps sample during playback
  await p.evaluate(()=>{ GP.openLevel(17); GP.applySolution(); GP.Seq.start(); });
  const fps = await p.evaluate(()=>new Promise(r=>{ let n=0; const t0=performance.now(); function f(){ n++; if(performance.now()-t0<2000) requestAnimationFrame(f); else r(n/2); } requestAnimationFrame(f); }));
  ok(fps>50, `frame rate during boss playback: ${fps.toFixed(0)} fps (headless)`);
  ok(errs.length===0, 'no console errors: '+JSON.stringify(errs));
  // phone + storage blocked
  const ctx2 = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true});
  const q = await ctx2.newPage(); const errs2=[]; q.on('pageerror', e=>errs2.push(e.message)); q.on('console', m=>{ if(m.type()==='error') errs2.push(m.text()); });
  await q.addInitScript(()=>{ Object.defineProperty(window,'localStorage',{get(){ throw new Error('blocked'); }}); });
  await q.goto(URL); await q.waitForTimeout(200); await q.tap('#btn-start'); await q.waitForTimeout(200);
  const qb = await q.locator('#grid').boundingBox(); await q.tap('#grid', {position:{x:5, y:30}});
  ok(await q.evaluate(()=>GP.state.notes.length===1), 'phone: tap places a note with storage blocked');
  const sw = await q.evaluate(()=>({doc:document.documentElement.scrollWidth, vw:innerWidth}));
  ok(sw.doc<=sw.vw, `phone: no horizontal page scroll (${sw.doc} <= ${sw.vw})`);
  await q.evaluate(()=>{ GP.unlockAll(); GP.openLevel(4); });
  const fit = await q.evaluate(()=>{ const s=document.getElementById('grid-scroll'); return {sw:s.scrollWidth, cw:s.clientWidth}; });
  ok(true, `phone 16-step grid: content ${fit.sw}px in ${fit.cw}px viewport`);
  await q.screenshot({path:'shots/phone-fix.png'});
  ok(errs2.length===0, 'phone: no errors '+JSON.stringify(errs2));
  console.log(out.join('\n'));
  await b.close();
})();
