"use strict";
/* =========================================================
   GAME — core logic, UI, progression, multiplayer glue
   ========================================================= */

/* ---------- persistent save ---------- */
let SAVE=(()=>{
  try{const s=JSON.parse(localStorage.getItem("dsq_save"));if(s&&s.up)return s;}catch(e){}
  return {coins:0,up:{},bestScore:0,wins:0};
})();
function persist(){try{localStorage.setItem("dsq_save",JSON.stringify(SAVE));}catch(e){}}

/* ---------- language ---------- */
try{const l=localStorage.getItem("dsq_lang");if(l==="ja"||l==="en")curLang=l;}catch(e){}
function applyLang(){
  // skip elements with child elements (handled separately below)
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    if(el.children.length===0)el.textContent=T(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el=>el.innerHTML=T(el.dataset.i18nHtml));
  // btnMulti has inner <small> so handle text node directly
  const mb=$("#btnMulti");
  if(mb){
    const first=mb.childNodes[0];
    if(first&&first.nodeType===3)first.textContent=T("btnMulti");
    const sub=mb.querySelector("#btnMultiSub");
    if(sub)sub.textContent="🚧 "+T("btnMultiSub");
  }
  // explicit critical UI labels
  const menuBtnEl=document.getElementById("menuBtn");
  if(menuBtnEl)menuBtnEl.textContent=T("menuBtn");
  // lang button sel state
  $("#btnLangJa").classList.toggle("sel",curLang==="ja");
  $("#btnLangEn").classList.toggle("sel",curLang==="en");
  // re-render pickers if visible
  if(!$("#scrSetup").classList.contains("hidden")){
    renderPicker("#breedRow","breed",BREEDORDER);
    renderPicker("#stageRow","stage",STAGEORDER);
    renderPicker("#diffRow","diff",DIFFORDER);
  }
  if(!$("#scrShop").classList.contains("hidden"))renderShop();
}
const upLv=k=>SAVE.up[k]||0;

/* ---------- dom ---------- */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
function show(id){$$(".scr").forEach(e=>e.classList.add("hidden"));if(id)$(id).classList.remove("hidden");}
function dogFaceHTML(b,mini){
  return '<span class="dogface '+b+(mini?' mini':'')+'">'
    +'<i class="ear l"></i><i class="ear r"></i><i class="fmuz"></i>'
    +'<i class="feye l"></i><i class="feye r"></i></span>';
}
const icHTML={
  bone:'<i class="ic bone s"></i>',bark:'<i class="ic bark s"><b></b></i>',
  trap:'<i class="ic trap s"></i>',house:'<i class="ic house s"></i>',
  star:'<i class="ic star s"></i>',crown:'<i class="ic crown s"></i>',
  meat:'<i class="ic meat s"></i>',flash:'<i class="ic flash s"></i>',
  blast:'<i class="ic blast s"></i>',coin:'<i class="ic coin s"></i>',
  squi:'<i class="ic squi s"><b></b><i></i></i>',paw:'<i class="ic paw s"></i>'
};

/* ---------- player stats (breed × permanent upgrades) ---------- */
function calcStats(breedKey){
  const b=BREEDS[breedKey];
  return{
    dmg:   2*(b.dmg||1)*(1+.2*upLv("pow")),
    cd:    .3/((b.rate||1)*(1+.07*upLv("rate"))),
    barkR: 8*(b.barkR||1)*(1+.08*upLv("bark")),
    barkCd:3.2*(b.barkCd||1)*(1-.1*upLv("barkCd")),
    spd:   11*(b.spd||1)*(1+.06*upLv("speed")),
    blast: 3.6*(b.blast||1)*(1+.1*upLv("blast")),
    traps: 3+(b.trap||0)+upLv("trap")
  };
}

/* ---------- selections ---------- */
const sel={breed:"shiba",stage:"park",diff:"normal"};

/* ---------- game state ---------- */
const game={
  state:"menu",mode:"solo",time:0,score:0,wave:0,timeScale:1,slowT:0,shake:0,
  combo:0,comboT:0,maxCombo:0,kills:0,
  spawnQueue:[],spawnT:0,spawnInterval:.5,waveDone:false,clearT:0,
  sqId:1,itemId:1,snapT:0,pinT:0,playersN:1,baseHp:10,baseMax:10,
  buffs:{dash:0,rapid:0,mega:0},ownerWaveT:0
};
const BASE_R=2.6;
const isSim=()=>game.mode!=="guest";
const myId=()=>Net.id||0;

const squirrels=[],bones=[],acorns=[],particles=[],rings=[],traps=[],ftexts=[],items=[];
let ghosts={};   // guest: id -> ghost squirrel
let remotes={};  // pid -> remote dog
let player=null,allies=[];

/* =========================================================
   EFFECTS
   ========================================================= */
const partGeo=new THREE.BoxGeometry(.22,.22,.22);
const starGeo=new THREE.OctahedronGeometry(.3);
function burst(pos,color,n,spd,star=false,up=6){
  for(let i=0;i<n;i++){
    const m=new THREE.Mesh(star?starGeo:partGeo,
      new THREE.MeshBasicMaterial({color,transparent:true}));
    m.position.copy(pos);scene.add(m);
    particles.push({m,v:V3(rnd(-spd,spd),rnd(up*.4,up),rnd(-spd,spd)),
      life:rnd(.5,.9),max:.9,spin:V3(rnd(-9,9),rnd(-9,9),rnd(-9,9))});
  }
}
function confetti(pos){
  const cols=[0xff5e7e,0xffe34d,0x55efc4,0x74b9ff,0xc792ff,0xff9d5c];
  for(let i=0;i<40;i++){
    const m=new THREE.Mesh(partGeo,new THREE.MeshBasicMaterial({color:cols[rndi(0,5)],transparent:true}));
    m.position.copy(pos);m.scale.set(rnd(.6,1.6),rnd(.2,.5),rnd(.6,1.6));
    scene.add(m);
    particles.push({m,v:V3(rnd(-8,8),rnd(6,15),rnd(-8,8)),life:rnd(.9,1.5),max:1.5,
      spin:V3(rnd(-12,12),rnd(-12,12),rnd(-12,12))});
  }
}
function ringFX(pos,color,maxR,dur=.4,y=.15){
  const m=new THREE.Mesh(new THREE.RingGeometry(.8,1.18,32),
    new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide}));
  m.rotation.x=-Math.PI/2;m.position.set(pos.x,y,pos.z);scene.add(m);
  rings.push({m,life:dur,max:dur,maxR});
}
function fxText(html,pos,cls=""){
  const el=document.createElement("div");
  el.className="ftx "+cls;el.innerHTML=html;
  $("#labels").appendChild(el);
  ftexts.push({el,p:pos.clone(),life:1.1,vy:2.6});
}
function addCombo(pos){
  game.combo++;game.comboT=2 + 0.4*upLv("combo");
  game.maxCombo=Math.max(game.maxCombo,game.combo);
  if(game.combo>=2){
    const c=$("#combo");
    c.textContent=T("combo")+" ×"+game.combo+" COMBO!";
    c.style.opacity=1;c.classList.remove("pop");void c.offsetWidth;c.classList.add("pop");
    addScore(50*game.combo,pos,false);
  }
}
function addScore(n,pos,showTx=true){
  game.score+=n;
  $("#score").textContent=game.score;
  if(showTx&&pos)fxText("+"+n,pos,"good");
}
function shakeCam(n){game.shake=Math.max(game.shake,n);}

/* =========================================================
   COMBAT / PHYSICS
   ========================================================= */
function parabolicVel(from,to,T){
  const v=V3((to.x-from.x)/T,0,(to.z-from.z)/T);
  v.y=(to.y-from.y)/T+.5*GRAV*T;
  return v;
}
function fireBone(from,target,o){
  // o:{dmg,blast,live,send}
  const m=makeBoneMesh(1);m.position.copy(from);scene.add(m);
  const d=Math.hypot(target.x-from.x,target.z-from.z);
  const T=clamp(d/24,.32,.85);
  bones.push({m,v:parabolicVel(from,target,T),dmg:o.dmg,blast:o.blast,live:o.live,
    spinAxis:V3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).normalize(),spinSpd:rnd(9,15)});
  sfx.shoot();
  if(o.send&&Net.connected)
    Net.game({t:"fire",f:[from.x,from.y,from.z],g:[target.x,target.y,target.z],dmg:o.dmg,blast:o.blast});
}
function boomFX(pos,R){
  sfx.boom();shakeCam(.35);
  ringFX(pos,0xffb13b,R+.6,.35);
  burst(pos,0xffd56b,14,7);
  burst(pos,0xffffff,6,5,true,8);
}
function explodeBone(pos,dmg,blast){
  boomFX(pos,blast);
  if(!isSim())return;
  let hits=0;
  for(const s of squirrels){
    if(s.state==="pit"||s.state==="dead")continue;
    const d=s.g.position.distanceTo(pos);
    if(d<blast+s.r){
      const dir=V3().subVectors(s.g.position,pos);dir.y=0;
      if(dir.lengthSq()<.01)dir.set(rnd(-1,1),0,rnd(-1,1));
      dir.normalize();
      const k=1-d/(blast+s.r);
      launchSquirrel(s,dir.multiplyScalar(10+14*k).add(V3(0,7+7*k,0)),dmg);
      hits++;
    }
  }
  if(hits>=3)fxText("まとめて "+hits+"匹!!",pos,"big");
  if(game.mode==="host"&&Net.connected)
    Net.game({t:"ev",k:"boom",p:[pos.x,pos.y,pos.z],r:blast});
}
function doBark(pos,R,txt,send){
  sfx.bark();shakeCam(.25);
  const p=pos.clone();p.y=0;
  ringFX(p,0x9be7ff,R,.45,.4);
  ringFX(p,0xffffff,R*.7,.3,.7);
  if(txt)fxText(txt,p.clone().add(V3(0,3,0)),"big");
  if(send&&Net.connected)Net.game({t:"bark",p:[p.x,p.z],r:R});
  if(!isSim())return;
  for(const s of squirrels){
    if(s.state==="pit"||s.state==="dead")continue;
    const d=s.g.position.distanceTo(p);
    if(d<R+s.r){
      const dir=V3().subVectors(s.g.position,p);dir.y=0;
      if(dir.lengthSq()<.01)dir.set(1,0,0);
      dir.normalize();
      const k=1-d/(R+s.r);
      launchSquirrel(s,dir.multiplyScalar(13+13*k).add(V3(0,8+5*k,0)),1);
    }
  }
}
function launchSquirrel(s,impulse,dmg){
  const resist=KINDS[s.kind].resist;
  s.hp-=dmg;
  if(s.state!=="fly"){s.state="fly";s.v.set(0,0,0);}
  s.v.add(impulse.clone().multiplyScalar(resist));
  s.spin.set(rnd(-14,14),rnd(-14,14),rnd(-14,14));
  s.flyT=0;
  sfx.boing();
  burst(s.g.position,0xfff3a0,3,3,true,5);
  if(s.hp<=0&&s.kind==="boss"&&!s._crowned){s._crowned=true;bossDown(s);}
}
function popSquirrel(s,bonusHtml){
  s.state="dead";
  game.kills++;
  sfx.pop();
  burst(s.g.position,0xffe34d,8,5,true,7);
  burst(s.g.position,squirrelPalette[rndi(0,6)],8,6);
  const pts=KINDS[s.kind].pts;
  addScore(pts,s.g.position);
  if(bonusHtml)fxText(bonusHtml,s.g.position,"big");
  addCombo(s.g.position);
  scene.remove(s.g);
  if(game.mode==="host"&&Net.connected)
    Net.game({t:"ev",k:"pop",id:s.id,pts,p:[s.g.position.x,s.g.position.y,s.g.position.z]});
}
function bossDown(s){
  game.timeScale=.22;game.slowT=1.1;
  sfx.big();shakeCam(.8);
  const p=s.g.position.clone().add(V3(0,2,0));
  confetti(p);
  fxText(icHTML.crown+" "+T("bossDown"),p.clone().add(V3(0,2,0)),"big");
  addScore(1000,s.g.position);
  if(game.mode==="host"&&Net.connected)
    Net.game({t:"ev",k:"bossdown",p:[p.x,p.y,p.z]});
  // ボスが全員倒されたらウェーブクリア（残り雑魚は消去）
  setTimeout(()=>{
    const remainingBosses=squirrels.filter(sq=>sq.kind==="boss"&&sq.state!=="dead"&&!sq._crowned);
    if(remainingBosses.length===0&&!game.waveDone){
      // 残りの雑魚を消去してウェーブ終了
      squirrels.filter(sq=>sq.state!=="dead").forEach(sq=>{
        sq.state="dead";scene.remove(sq.g);
      });
      squirrels.length=0;
      game.spawnQueue=[];
    }
  },1200); // slow-mo演出が終わってから
}
function bossDownFX(pos){
  game.timeScale=.22;game.slowT=1.1;
  sfx.big();shakeCam(.8);confetti(pos);
  fxText(icHTML.crown+" "+T("bossDown"),pos.clone().add(V3(0,2,0)),"big");
}
function throwAcorn(from,target,big,send){
  const m=makeAcornMesh(big?.55:.3);m.position.copy(from);scene.add(m);
  const t=target.clone();t.x+=rnd(-1.5,1.5);t.z+=rnd(-1.5,1.5);
  const d=Math.hypot(t.x-from.x,t.z-from.z);
  const T=clamp(d/(big?10:13),.5,big?1.5:1.2);
  acorns.push({m,v:parabolicVel(from,t,T),big,
    spin:V3(rnd(-8,8),rnd(-8,8),rnd(-8,8))});
  if(big)sfx.bonk();else sfx.throwA();
  if(send&&Net.connected)
    Net.game({t:"ev",k:"acorn",f:[from.x,from.y,from.z],g:[t.x,t.y,t.z],big:big?1:0});
}
function placeTrapAt(pos,send){
  if(game.state!=="play")return false;
  if(Math.hypot(pos.x,pos.z)<BASE_R+1.4){fxText("犬小屋の前はダメ!",pos);return false;}
  const g=new THREE.Group();
  const hole=cyl(1.1,1.1,.06,0x2e1d10,18);hole.position.y=.04;g.add(hole);
  const rim=new THREE.Mesh(new THREE.RingGeometry(1.1,1.4,18),M(0x6b4d2e));
  rim.rotation.x=-Math.PI/2;rim.position.y=.05;g.add(rim);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;
    const mound=sph(.22,0x8d6a4a,6);mound.scale.y=.5;
    mound.position.set(Math.cos(a)*1.32,.1,Math.sin(a)*1.32);g.add(mound);}
  g.position.set(pos.x,0,pos.z);scene.add(g);
  traps.push({g,uses:3});
  sfx.dig();
  burst(V3(pos.x,.3,pos.z),0x8d6a4a,8,4,false,4);
  fxText(icHTML.trap+" "+T("trapSet"),V3(pos.x,1.5,pos.z),"good");
  if(send&&Net.connected)Net.game({t:"trap",p:[pos.x,pos.z]});
  return true;
}
function removeTrapNear(p){
  let best=null,bd=2;
  for(const tr of traps){const d=tr.g.position.distanceTo(p);if(d<bd){bd=d;best=tr;}}
  if(best){scene.remove(best.g);traps.splice(traps.indexOf(best),1);}
}
function damageBase(n,from){
  if(game.state!=="play"||!isSim())return;
  setBaseHp(game.baseHp-n);
  shakeCam(.3);sfx.hurt();
  fxText(icHTML.house+" -"+n,V3(0,4.5,0));
  if(from)burst(from,0xff5e7e,6,4);
  if(game.mode==="host"&&Net.connected)Net.game({t:"ev",k:"base",hp:game.baseHp});
  if(game.baseHp<=0)endGame(false);
}
function healBase(n){
  setBaseHp(Math.min(game.baseMax,game.baseHp+n));
  fxText(icHTML.house+" +"+n,V3(0,4.5,0),"good");
  if(game.mode==="host"&&Net.connected)Net.game({t:"ev",k:"base",hp:game.baseHp});
}
function setBaseHp(v){
  game.baseHp=v;
  const pct=Math.max(0,game.baseHp/game.baseMax*100);
  $("#hpfill").style.width=pct+"%";
  $("#baseHpFloatFill").style.width=pct+"%";
  $("#baseHpFloatText").textContent="❤️ "+Math.max(0,game.baseHp)+"/"+game.baseMax;
}

/* ---------- owner items ---------- */
function ownerThrowItem(){
  if(!isSim())return;
  const ty=ITEMORDER[rndi(0,ITEMORDER.length-1)];
  const a=rnd(0,Math.PI*2),r=rnd(5,13);
  const p=V3(Math.cos(a)*r,0,Math.sin(a)*r);
  spawnItem(game.itemId++,ty,p);
  if(game.mode==="host"&&Net.connected)
    Net.game({t:"ev",k:"item",id:game.itemId-1,ty,p:[p.x,p.z]});
}
function spawnItem(id,ty,pos){
  const g=buildItemMesh(ty);
  const from=ownerRig?ownerRig.position.clone().add(V3(0,3,0)):V3(19,3,13);
  g.position.copy(from);scene.add(g);
  items.push({id,ty,g,from,to:pos.clone(),t:0,phase:"fly"});
  game.ownerWaveT=1.6;
  fxText(T("ownerToss"),from.clone().add(V3(0,1.5,0)),"good");
}
function applyItem(ty,pos){
  const it=ITEMS[ty];
  sfx.pickup();
  const itLabel=curLang==="en"&&it.label_en?it.label_en:it.label;
  fxText((ty==="meat"?icHTML.meat:ty==="dash"?icHTML.flash:ty==="rapid"?icHTML.bone:ty==="mega"?icHTML.blast:icHTML.trap)+" "+itLabel,pos.clone().add(V3(0,2,0)),"big good");
  if(ty==="meat"){if(isSim())healBase(3);}
  else if(ty==="trapup"){player.trapStock++;updTrapHUD();}
  else game.buffs[ty]=it.dur;
}
function pickupItem(item,byMe,byId){
  burst(item.g.position.clone().add(V3(0,1,0)),ITEMS[item.ty].col,10,5,true,7);
  scene.remove(item.g);
  items.splice(items.indexOf(item),1);
  if(byMe)applyItem(item.ty,item.g.position);
  else fxText(T("allyGotItem"),item.g.position.clone().add(V3(0,2,0)),"good");
  if(game.mode==="host"&&Net.connected)
    Net.game({t:"ev",k:"got",id:item.id,by:byId,ty:item.ty,p:[item.g.position.x,item.g.position.z]});
}
function updTrapHUD(){$("#trapN").textContent="×"+player.trapStock+" (E)";}

/* =========================================================
   INPUT
   ========================================================= */
const keys={};
addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(e.code==="Space"&&game.state==="play"){e.preventDefault();doPlayerBark();}
  if(e.code==="KeyE"&&game.state==="play")tryPlaceTrap();
  if(e.code==="Escape"){
    if(game.state==="play"){game.state="pause";show("#scrPause");}
    else if(game.state==="pause"){game.state="play";show(null);}
  }
});
addEventListener("keyup",e=>keys[e.code]=false);
// キーが押しっぱなしになるバグを防ぐ：ウィンドウがフォーカスを失ったら全キーリセット
addEventListener("blur",()=>{for(const k in keys)keys[k]=false;});
const mouseNDC=new THREE.Vector2();
const raycaster=new THREE.Raycaster();
const groundPlane=new THREE.Plane(V3(0,1,0),0);
addEventListener("mousemove",e=>{
  mouseNDC.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);
});
addEventListener("mousedown",e=>{
  if(game.state!=="play")return;
  if(e.target.closest("button"))return;
  if(e.button===0){keys["Mouse0"]=true;playerFire();}
});
addEventListener("mouseup",e=>{
  if(e.button===0)keys["Mouse0"]=false;
});
addEventListener("contextmenu",e=>{
  if(game.state==="play"){e.preventDefault();tryPlaceTrap();}
});
document.addEventListener("pointerdown",()=>initAudio(),{once:false});

function updateAim(){
  if(!player||!$("#scrPause").classList.contains("hidden"))return;
  raycaster.setFromCamera(mouseNDC,camera);
  const hit=V3();
  if(raycaster.ray.intersectPlane(groundPlane,hit)){
    const r=Math.hypot(hit.x,hit.z);
    if(r>40){hit.x*=40/r;hit.z*=40/r;}
    player.aim.copy(hit);
  }
  reticle.position.set(player.aim.x,.06,player.aim.z);
  retDot.position.set(player.aim.x,.061,player.aim.z);
}
function playerFire(){
  if(!player||player.fireCd>0)return;
  const waveCdMult = 1 / (1 + Math.max(0, game.wave - 1) * 0.2);
  player.fireCd=player.stats.cd*(game.buffs.rapid>0?.55:1)*waveCdMult;
  const fwd=V3().subVectors(player.aim,player.pos);fwd.y=0;fwd.normalize();
  const from=player.pos.clone().add(fwd.clone().multiplyScalar(1.2)).add(V3(0,1.7,0));
  const waveBlastMult = 1 + Math.max(0, game.wave - 1) * 0.15;
  const blast=player.stats.blast*(game.buffs.mega>0?1.45:1)*waveBlastMult;
  const waveDmgMult = 1 + Math.max(0, game.wave - 1) * 0.3;
  fireBone(from,player.aim,{dmg:player.stats.dmg*waveDmgMult,blast,live:isSim(),send:Net.connected});
  player.g.userData.tail.rotation.x=1;
}
function doPlayerBark(){
  if(!player||player.barkCd>0)return;
  player.barkCd=player.stats.barkCd;
  const waveBarkMult = 1 + Math.max(0, game.wave - 1) * 0.15;
  doBark(player.pos,player.stats.barkR*waveBarkMult,"ワンワンッ!!",Net.connected);
}
function tryPlaceTrap(){
  if(!player||player.trapStock<=0){sfx.deny();return;}
  if(placeTrapAt(player.aim,Net.connected)){
    player.trapStock--;updTrapHUD();
  }
}

/* =========================================================
   WAVES (sim side) — ENDLESS MODE
   ========================================================= */
function announceW(title,sub,dur=1.4){
  const a=$("#announce");
  a.innerHTML="<h2>"+title+"</h2><p>"+sub+"</p>";
  a.style.opacity=1;
  clearTimeout(a._t);
  a._t=setTimeout(()=>a.style.opacity=0,dur*1000);
}
function setWaveHUD(i){
  const maxW=DIFFS[game.diff].maxWave;
  if(maxW>0) {
    $("#wave").textContent="WAVE "+i+"/"+maxW;
  } else {
    $("#wave").textContent="WAVE "+i;
  }
}
function isEndless(){return DIFFS[game.diff].maxWave===0;}
function startWave(i){
  game.wave=i;game.waveDone=false;
  setWaveHUD(i);
  const arr=WAVES[game.stage];
  const def=arr[Math.min(i-1,arr.length-1)];
  const diff=DIFFS[game.diff];
  const q=[];
  
  // Inflation: after wave 3 (endless only), enemies multiply
  const inflateVal = (isEndless() && i > 3) ? (i - 3) : 0;
  const countMult = 1 + inflateVal * 0.25;
  
  for(const k in def.mix){
    const baseCount = def.mix[k];
    const n=Math.max(1,Math.round(baseCount * countMult * diff.cnt*(1+.45*(game.playersN-1))));
    for(let j=0;j<n;j++)q.push(k);
  }
  for(let k=q.length-1;k>0;k--){const j=rndi(0,k);[q[k],q[j]]=[q[j],q[k]];}
  
  // Boss insertion
  if (isEndless() && i > 3) {
    if (i % 3 === 0) {
      const numBosses = Math.floor(i / 3);
      for(let b=0; b<numBosses; b++) {
        const insertAt = rndi(2, Math.max(2, q.length-2));
        q.splice(insertAt, 0, "boss");
      }
    }
  } else {
    if(def.boss)q.splice(rndi(2,5),0,"boss");
  }
  
  game.spawnQueue=q;
  game.spawnT=.6;
  game.spawnInterval= (isEndless() && i > 3) ? Math.max(0.1, def.int / (1 + inflateVal * 0.18)) : def.int;
  
  let subtitle = def.boss ? T("announceWaveBoss") : T("announceWaveSub");
  if (isEndless() && i > 3) {
    subtitle = T("announceWaveSub");
  }
  announceW("WAVE "+i+(curLang==="en"?" INCOMING!!":" 襲来!!"), subtitle);
  sfx.fanfare();
  if(game.mode==="host"&&Net.connected)Net.game({t:"ev",k:"wave",n:i,boss:!!def.boss});
}
function spawnSquirrel(kind){
  const a=rnd(0,Math.PI*2),R=36;
  const g=buildSquirrel(kind);
  g.position.set(Math.cos(a)*R,0,Math.sin(a)*R);
  scene.add(g);
  const k=KINDS[kind],diff=DIFFS[game.diff];
  let hp=k.hp;
  if (isEndless() && game.wave > 3) {
    hp = Math.round(hp * (1 + (game.wave - 3) * 0.25));
  }
  if(kind==="boss"){
    hp=BOSS_HP_BY_STAGE[game.stage];
    if(game.diff==="hard")hp=Math.round(hp*1.2);
    hp=Math.round(hp*(1+.35*(game.playersN-1)));
    if (isEndless() && game.wave > 3) {
      hp = Math.round(hp * (1 + (game.wave - 3) * 0.3));
    }
  }
  let enemySpeed = rnd(k.spd[0],k.spd[1])*diff.spd;
  if (isEndless() && game.wave > 3) {
    enemySpeed = enemySpeed * Math.min(2.0, 1 + (game.wave - 3) * 0.08);
  }
  squirrels.push({id:game.sqId++,g,v:V3(),spin:V3(),state:"run",kind,hp,
    r:k.r,speed:enemySpeed,
    throwT:rnd(1,2.5)*diff.acorn,hop:rnd(0,6),flyT:0,pitT:0,throwAnim:0,trap:null,
    fy:k.fly||0});
  if(kind==="boss"){
    announceW(icHTML.crown+" "+T("bossAppear"),T("bossAppearSub"),1.6);
    shakeCam(.4);sfx.bonk();
  }
}

/* =========================================================
   UPDATES
   ========================================================= */
function dogsList(){
  const arr=[];
  if(player)arr.push({pos:player.pos,id:myId()});
  for(const a of allies)arr.push({pos:a.pos,id:-1});
  for(const pid in remotes)arr.push({pos:remotes[pid].g.position,id:+pid});
  return arr;
}
function nearestDog(p,maxD){
  let best=null,bd=maxD;
  for(const d of dogsList()){
    const dd=Math.hypot(d.pos.x-p.x,d.pos.z-p.z);
    if(dd<bd){bd=dd;best=d;}
  }
  return best;
}
function updateSquirrels(dt){
  for(const s of squirrels){
    const p=s.g.position;
    const k=KINDS[s.kind];
    if(s.state==="run"){
      const dir=V3(-p.x,0,-p.z);const dist=dir.length();dir.normalize();
      p.addScaledVector(dir,s.speed*dt);
      if(k.zigzag){
        const perp=V3(-dir.z,0,dir.x);
        p.addScaledVector(perp,Math.sin(s.hop*1.1)*s.speed*.45*dt);
      }
      s.hop+=dt*10;
      if(k.fly){
        const ty=dist<7?.4:k.fly;
        s.fy+=(ty-s.fy)*dt*1.5;
        p.y=s.fy+Math.sin(s.hop*.7)*.3;
      }else{
        p.y=Math.abs(Math.sin(s.hop))*.4;
      }
      s.g.scale.y=k.scale*(1+.1*Math.sin(s.hop*2));
      s.g.lookAt(0,p.y,0);
      s.g.userData.tail.rotation.x=.4*Math.sin(s.hop*1.5);
      if(!k.noThrow){
        s.throwT-=dt;
        if(dist<16&&s.throwT<=0){
          s.state="throw";s.throwAnim=.55;
          s.throwT=(s.kind==="boss"?2.4:rnd(2.2,3.8))*DIFFS[game.diff].acorn;
        }
      }
      if(!k.noTrap&&p.y<1){
        for(const tr of traps){
          if(tr.uses<=0)continue;
          if(p.distanceTo(tr.g.position)<1.15+(s.kind==="boss"?.8:0)){
            if(s.kind==="boss"||s.kind==="tank"){
              tr.uses=0;burst(tr.g.position,0x8d6a4a,8,4);
              fxText("ふみつぶした!?",p.clone().add(V3(0,3,0)));
            }else{
              s.state="pit";s.pitT=0;s.trap=tr;tr.uses--;sfx.trap();
              if(game.mode==="host"&&Net.connected)Net.game({t:"ev",k:"pit",id:s.id});
            }
          }
        }
      }
      // Prevent stacking at bottom — push enemies that reach base radius outward if stuck
      if(dist<BASE_R+.6){
        const bonkDmg=s.kind==="tank"?2:s.kind==="boss"?3:1;
        damageBase(bonkDmg,p.clone().add(V3(0,1,0)));
        fxText("ガブッ!",p.clone().add(V3(0,2.5,0)));
        const away=V3(p.x,0,p.z).normalize();
        launchSquirrel(s,away.multiplyScalar(15).add(V3(0,9,0)),1);
      }
    }
    else if(s.state==="throw"){
      s.throwAnim-=dt;
      s.g.scale.y=k.scale*(1+.25*Math.sin(s.throwAnim*18));
      if(s.throwAnim<.25&&!s.thrown){
        s.thrown=true;
        const from=p.clone().add(V3(0,1.4*k.scale,0));
        const nd=nearestDog(p,18);
        const target=(nd&&Math.random()<.45)?nd.pos.clone().setY(.8):V3(0,1,0);
        throwAcorn(from,target,!!k.bigAcorn,game.mode==="host");
        if(s.kind==="boss"){
          throwAcorn(from,target.clone().add(V3(rnd(-4,4),0,rnd(-4,4))),true,game.mode==="host");
          throwAcorn(from,target.clone().add(V3(rnd(-4,4),0,rnd(-4,4))),true,game.mode==="host");
        }
      }
      if(s.throwAnim<=0){s.state="run";s.thrown=false;}
    }
    else if(s.state==="fly"){
      s.flyT+=dt;
      p.addScaledVector(s.v,dt);
      s.v.y-=GRAV*dt;
      s.g.rotation.x+=s.spin.x*dt;
      s.g.rotation.y+=s.spin.y*dt;
      s.g.rotation.z+=s.spin.z*dt;
      if(p.y<0){
        p.y=0;
        if(s.v.y<-4){burst(p,0xc9b690,4,3,false,3);sfx.boing();}
        s.v.y*=-.52;s.v.x*=.76;s.v.z*=.76;
        s.spin.multiplyScalar(.7);
        if(s.v.length()<2.4){
          if(s.hp<=0){s._pop=true;}
          else{
            s.state="run";s.g.rotation.set(0,0,0);
            s.g.scale.y=k.scale;s.fy=p.y;
            burst(p.clone().add(V3(0,1.5,0)),0xffe34d,3,2,true,3);
          }
        }
      }
      const spd=s.v.length();
      if(spd>6&&!s._pop){
        for(const o of squirrels){
          if(o===s||o.state==="fly"||o.state==="pit"||o.state==="dead")continue;
          if(p.distanceTo(o.g.position)<s.r+o.r+.4){
            const imp=s.v.clone().multiplyScalar(.7);imp.y=Math.max(imp.y,5.5)+3;
            launchSquirrel(o,imp,1);
            s.v.multiplyScalar(.55);
            fxText(T("chain"),o.g.position.clone().add(V3(0,2.5,0)));
            addScore(30,null,false);
            break;
          }
        }
      }
      if(Math.hypot(p.x,p.z)>41){s._pop=true;s._bonus=T("homerun")+" +200";game.score+=200;}
      if(s.flyT>4){
        if(s.hp<=0)s._pop=true;
        else{s.state="run";s.g.rotation.set(0,0,0);p.y=0;}
      }
      if(s._pop)popSquirrel(s,s._bonus);
    }
    else if(s.state==="pit"){
      s.pitT+=dt;
      const tp=s.trap.g.position;
      p.x+=(tp.x-p.x)*10*dt;p.z+=(tp.z-p.z)*10*dt;
      p.y-=2.6*dt;
      s.g.rotation.y+=14*dt;
      s.g.scale.setScalar(KINDS[s.kind].scale*Math.max(.05,1-s.pitT*1.3));
      if(s.pitT>.7){
        s.state="dead";game.kills++;
        addScore(150,tp.clone().add(V3(0,1.5,0)));
        fxText("ナイストラップ!",tp.clone().add(V3(0,2.5,0)),"good");
        addCombo(tp);sfx.pop();
        burst(tp.clone().add(V3(0,.5,0)),0x8d6a4a,8,4,false,5);
        scene.remove(s.g);
        if(game.mode==="host"&&Net.connected)
          Net.game({t:"ev",k:"pop",id:s.id,pts:150,p:[tp.x,1,tp.z]});
      }
    }
  }
  for(let i=squirrels.length-1;i>=0;i--)
    if(squirrels[i].state==="dead")squirrels.splice(i,1);
  for(let i=traps.length-1;i>=0;i--)
    if(traps[i].uses<=0){
      const p=traps[i].g.position.clone();
      scene.remove(traps[i].g);traps.splice(i,1);
      if(game.mode==="host"&&Net.connected)Net.game({t:"ev",k:"trapgone",p:[p.x,p.z]});
    }
}

/* guest-side squirrel ghosts */
function applySnap(m){
  const sq = typeof m.sq === 'string' ? JSON.parse(m.sq) : m.sq;
  const seen={};
  for(const e of sq){
    const [id,ki,x,y,z,st,ry]=e;
    seen[id]=true;
    let gh=ghosts[id];
    if(!gh){
      const kind=KINDORDER[ki];
      gh={g:buildSquirrel(kind),kind,state:0,hop:rnd(0,6),
        spin:V3(rnd(-10,10),rnd(-10,10),rnd(-10,10)),tgt:V3(x,y,z)};
      gh.g.position.set(x,y,z);
      scene.add(gh.g);
      ghosts[id]=gh;
    }
    gh.tgt.set(x,y,z);
    if(st===2&&gh.state!==2)gh.spin.set(rnd(-12,12),rnd(-12,12),rnd(-12,12));
    if(st!==2&&gh.state===2)gh.g.rotation.set(0,0,0);
    gh.state=st;gh.ry=ry;
  }
  for(const id in ghosts){
    if(!seen[id]){scene.remove(ghosts[id].g);delete ghosts[id];}
  }
  if(m.hp!==game.baseHp)setBaseHp(m.hp);
  game.score=m.sc;$("#score").textContent=m.sc;
  game.time=m.tm;
  if(m.wv!==game.wave){game.wave=m.wv;setWaveHUD(m.wv);}
}
function updateGhosts(dt){
  for(const id in ghosts){
    const gh=ghosts[id],p=gh.g.position,k=KINDS[gh.kind];
    p.lerp(gh.tgt,Math.min(1,12*dt));
    if(gh.state===0){
      gh.hop+=dt*10;
      if(!k.fly)p.y=Math.abs(Math.sin(gh.hop))*.4;
      gh.g.scale.y=k.scale*(1+.1*Math.sin(gh.hop*2));
      gh.g.lookAt(0,p.y,0);
    }else if(gh.state===2){
      gh.g.rotation.x+=gh.spin.x*dt;
      gh.g.rotation.y+=gh.spin.y*dt;
      gh.g.rotation.z+=gh.spin.z*dt;
    }else if(gh.state===3){
      gh.g.rotation.y+=14*dt;
      gh.g.scale.multiplyScalar(Math.max(.05,1-2*dt));
    }
  }
}

function updateProjectiles(dt){
  for(let i=bones.length-1;i>=0;i--){
    const b=bones[i];
    b.m.position.addScaledVector(b.v,dt);
    b.v.y-=GRAV*dt;
    b.m.rotateOnAxis(b.spinAxis,b.spinSpd*dt);
    let hit=false;
    if(b.live){
      for(const s of squirrels){
        if(s.state==="pit"||s.state==="dead")continue;
        if(b.m.position.distanceTo(s.g.position.clone().add(V3(0,.6,0)))<s.r+.55){hit=true;break;}
      }
    }
    if(hit||b.m.position.y<.18){
      const pos=b.m.position.clone();pos.y=Math.max(pos.y,.3);
      scene.remove(b.m);bones.splice(i,1);
      explodeBone(pos,b.dmg,b.blast);
    }
  }
  for(let i=acorns.length-1;i>=0;i--){
    const a=acorns[i];
    a.m.position.addScaledVector(a.v,dt);
    a.v.y-=GRAV*dt;
    a.m.rotation.x+=a.spin.x*dt;a.m.rotation.z+=a.spin.z*dt;
    const p=a.m.position;
    let gone=false;
    if(Math.hypot(p.x,p.z)<BASE_R-.2&&p.y<3.4){
      if(isSim())damageBase(a.big?2:1,p.clone());
      else burst(p.clone(),0xff5e7e,5,4);
      gone=true;
    }else if(player&&p.distanceTo(player.pos.clone().add(V3(0,1.2,0)))<(a.big?1.5:1.15)){
      player.knockT=.22;
      player.knockV=V3(a.v.x,0,a.v.z).normalize().multiplyScalar(a.big?13:9);
      fxText("イタッ!",player.pos.clone().add(V3(0,3,0)));
      sfx.bonk();shakeCam(.18);gone=true;
    }else if(p.y<.12){
      burst(p.clone().setY(.2),0xc98a4b,4,2.5,false,3);gone=true;
    }
    if(gone){scene.remove(a.m);acorns.splice(i,1);}
  }
}
function removeNearestBone(pos){
  let best=-1,bd=3;
  for(let i=0;i<bones.length;i++){
    const d=bones[i].m.position.distanceTo(pos);
    if(d<bd){bd=d;best=i;}
  }
  if(best>=0){scene.remove(bones[best].m);bones.splice(best,1);}
}

function updateItems(dt){
  for(let i=items.length-1;i>=0;i--){
    const it=items[i];
    if(it.phase==="fly"){
      it.t+=dt/1.1;
      const k=Math.min(1,it.t);
      it.g.position.lerpVectors(it.from,it.to,k);
      it.g.position.y=it.from.y*(1-k)+Math.sin(k*Math.PI)*5;
      if(k>=1){it.phase="idle";it.g.position.y=0;burst(it.to.clone().add(V3(0,.5,0)),ITEMS[it.ty].col,6,3);}
    }else{
      it.g.userData.core.rotation.y+=dt*3;
      it.g.userData.core.position.y=1+Math.sin(performance.now()/300)*0.18;
      if(isSim()){
        let taker=null;
        if(player&&player.pos.distanceTo(it.g.position)<1.5)taker={id:myId(),me:true};
        if(!taker)for(const pid in remotes){
          if(remotes[pid].g.position.distanceTo(it.g.position)<1.5){taker={id:+pid,me:false};break;}
        }
        if(taker){
          if(it.ty==="meat"&&!taker.me)healBase(3);
          pickupItem(it,taker.me,taker.id);
        }
      }
    }
  }
}

function updateAllies(dt){
  for(const a of allies){
    a.fireT-=dt;a.barkT-=dt;
    a.g.userData.tail.rotation.z=.5*Math.sin(game.time*9+a.ph);
    let near=null,nd=1e9;
    if(isSim()){
      for(const s of squirrels){
        if(s.state==="pit"||s.state==="dead")continue;
        const d=a.g.position.distanceTo(s.g.position);
        if(d<nd){nd=d;near=s;}
      }
    }else{
      for(const id in ghosts){
        const s=ghosts[id];
        if(s.state===3)continue;
        const d=a.g.position.distanceTo(s.g.position);
        if(d<nd){nd=d;near=s;}
      }
    }
    if(near)a.g.lookAt(near.g.position.x,0,near.g.position.z);
    if(a.fireT<=0&&near&&nd<34){
      const T=clamp(nd/24,.32,.85);
      const dir=V3(-near.g.position.x,0,-near.g.position.z).normalize();
      const lead=(near.state==="run"||near.state===0)?(near.speed||5)*T:0;
      const target=near.g.position.clone().addScaledVector(dir,lead);
      const waveDmgMult = 1 + Math.max(0, game.wave - 1) * 0.3;
      const waveBlastMult = 1 + Math.max(0, game.wave - 1) * 0.15;
      fireBone(a.g.position.clone().add(V3(0,1.8,0)),target,{dmg:1.6*waveDmgMult,blast:3*waveBlastMult,live:isSim(),send:game.mode==="host"});
      a.fireT=1.25;
    }
    if(a.barkT<=0){
      if(near&&nd<7.5){
        const waveBarkMult = 1 + Math.max(0, game.wave - 1) * 0.15;
        doBark(a.g.position,7*waveBarkMult,"ワンッ!!",false);
        a.barkT=7.5;
      }
      else a.barkT=.4;
    }
  }
}
function updateRemotes(dt){
  for(const pid in remotes){
    const r=remotes[pid];
    r.g.position.x+=(r.tx-r.g.position.x)*Math.min(1,12*dt);
    r.g.position.z+=(r.tz-r.g.position.z)*Math.min(1,12*dt);
    r.g.position.y+=(r.fy-r.g.position.y)*Math.min(1,12*dt);
    r.g.rotation.y+=(r.ry-r.g.rotation.y)*Math.min(1,12*dt);
    r.g.userData.tail.rotation.z=.4*Math.sin(game.time*10);
  }
}
function updatePlayer(dt){
  if(!$("#scrPause").classList.contains("hidden"))return;
  const mv=V3();
  if(keys["KeyW"]||keys["ArrowUp"])mv.z-=1;
  if(keys["KeyS"]||keys["ArrowDown"])mv.z+=1;
  if(keys["KeyA"]||keys["ArrowLeft"])mv.x-=1;
  if(keys["KeyD"]||keys["ArrowRight"])mv.x+=1;
  const spd=player.stats.spd*(game.buffs.dash>0?1.5:1);
  if(player.knockT>0){
    player.knockT-=dt;
    player.pos.addScaledVector(player.knockV,dt);
  }else if(mv.lengthSq()>0){
    mv.normalize();
    player.pos.addScaledVector(mv,spd*dt);
    player.g.position.y=Math.abs(Math.sin(game.time*14))*.25;
  }else{
    player.g.position.y*=.8;
  }
  const r=Math.hypot(player.pos.x,player.pos.z);
  if(r>37){player.pos.x*=37/r;player.pos.z*=37/r;}
  if(r<BASE_R+1&&r>.01){const k2=(BASE_R+1)/r;player.pos.x*=k2;player.pos.z*=k2;}
  player.g.position.x=player.pos.x;player.g.position.z=player.pos.z;
  player.g.lookAt(player.aim.x,player.g.position.y,player.aim.z);
  player.fireCd=Math.max(0,player.fireCd-dt);
  player.barkCd=Math.max(0,player.barkCd-dt);
  if(keys["Mouse0"])playerFire();
  $("#cd0").style.height=clamp(player.fireCd/player.stats.cd*100,0,100)+"%";
  $("#cd1").style.height=clamp(player.barkCd/player.stats.barkCd*100,0,100)+"%";
  player.g.userData.tail.rotation.x*=.9;
  player.g.userData.tail.rotation.z=.4*Math.sin(game.time*10);
  // network pin
  if(Net.connected){
    game.pinT-=dt;
    if(game.pinT<=0){
      game.pinT=.08;
      Net.game({t:"pin",p:[player.pos.x,player.pos.z],ry:player.g.rotation.y,fy:player.g.position.y});
    }
  }
}
const BUFF_MAX={dash:10,rapid:10,mega:10};
function updateBuffs(dt){
  let html="";
  for(const k in game.buffs){
    if(game.buffs[k]>0){
      game.buffs[k]-=dt;
      if(game.buffs[k]>0){
        const nm=k==="dash"?T("buffDash"):k==="rapid"?T("buffRapid"):T("buffMega");
        const pct=Math.min(100,game.buffs[k]/(BUFF_MAX[k]||10)*100).toFixed(1);
        const sec=game.buffs[k].toFixed(0);
        html+=`<div class="buff">${nm} ${sec}s<div class="buff-bar-wrap"><div class="buff-bar" style="width:${pct}%"></div></div></div>`;
      }
    }
  }
  $("#buffs").innerHTML=html;
}
function updateFX(dt,rawDt){
  for(let i=particles.length-1;i>=0;i--){
    const pt=particles[i];
    pt.life-=dt;
    pt.m.position.addScaledVector(pt.v,dt);
    pt.v.y-=GRAV*.65*dt;
    pt.m.rotation.x+=pt.spin.x*dt;pt.m.rotation.y+=pt.spin.y*dt;
    pt.m.material.opacity=clamp(pt.life/pt.max,0,1);
    if(pt.life<=0){scene.remove(pt.m);pt.m.material.dispose();particles.splice(i,1);}
  }
  for(let i=rings.length-1;i>=0;i--){
    const r=rings[i];
    r.life-=dt;
    const k=1-r.life/r.max;
    const e=1-(1-k)*(1-k);
    r.m.scale.setScalar(1+(r.maxR-1)*e);
    r.m.material.opacity=.9*(r.life/r.max);
    if(r.life<=0){scene.remove(r.m);r.m.material.dispose();rings.splice(i,1);}
  }
  for(let i=ftexts.length-1;i>=0;i--){
    const f=ftexts[i];
    f.life-=rawDt;
    f.p.y+=f.vy*rawDt;
    const v=f.p.clone().project(camera);
    f.el.style.left=(v.x*.5+.5)*innerWidth+"px";
    f.el.style.top=(-v.y*.5+.5)*innerHeight+"px";
    f.el.style.opacity=clamp(f.life,0,1);
    if(f.life<=0){f.el.remove();ftexts.splice(i,1);}
  }
  if(game.combo>0){
    game.comboT-=dt;
    if(game.comboT<=0){game.combo=0;$("#combo").style.opacity=0;}
  }
}
function updateCamera(rawDt){
  game.shake=Math.max(0,game.shake-rawDt*1.6);
  const px=player?player.pos.x:0,pz=player?player.pos.z:0;
  const sx=(Math.random()-.5)*game.shake*1.6;
  const sy=(Math.random()-.5)*game.shake*1.6;
  const target=V3(camBase.x+px*.22+sx,camBase.y+sy,camBase.z+pz*.16);
  camera.position.lerp(target,.12);
  camera.lookAt(px*.25,0,pz*.18);
}

/* =========================================================
   NET — in-game message handling
   ========================================================= */
function handleGame(from,d){
  switch(d.t){
    case "pin":{
      const r=remotes[from];
      if(r){r.tx=d.p[0];r.tz=d.p[1];r.ry=d.ry;r.fy=d.fy||0;}
      break;
    }
    case "fire":
      fireBone(V3(d.f[0],d.f[1],d.f[2]),V3(d.g[0],d.g[1],d.g[2]),
        {dmg:d.dmg,blast:d.blast,live:isSim(),send:false});
      break;
    case "bark":
      doBark(V3(d.p[0],0,d.p[1]),d.r,"ワンッ!!",false);
      break;
    case "trap":
      placeTrapAt(V3(d.p[0],0,d.p[1]),false);
      break;
    case "snap":
      if(game.mode==="guest")applySnap(d);
      break;
    case "ev":handleEv(d);break;
  }
}
function handleEv(d){
  switch(d.k){
    case "boom":{const p=V3(d.p[0],d.p[1],d.p[2]);removeNearestBone(p);boomFX(p,d.r||3.6);break;}
    case "pop":{
      const gh=ghosts[d.id];
      const p=d.p?V3(d.p[0],d.p[1],d.p[2]):(gh?gh.g.position.clone():null);
      if(gh){scene.remove(gh.g);delete ghosts[d.id];}
      if(p){sfx.pop();burst(p,0xffe34d,8,5,true,7);burst(p,squirrelPalette[rndi(0,6)],8,6);
        fxText("+"+d.pts,p,"good");}
      break;
    }
    case "pit":{const gh=ghosts[d.id];if(gh){gh.state=3;sfx.trap();}break;}
    case "acorn":
      throwAcorn(V3(d.f[0],d.f[1],d.f[2]),V3(d.g[0],d.g[1],d.g[2]),!!d.big,false);
      break;
    case "item":spawnItem(d.id,d.ty,V3(d.p[0],0,d.p[1]));break;
    case "got":{
      const it=items.find(x=>x.id===d.id);
      if(it){
        burst(it.g.position.clone().add(V3(0,1,0)),ITEMS[it.ty].col,10,5,true,7);
        scene.remove(it.g);items.splice(items.indexOf(it),1);
      }
      const p=V3(d.p[0],1,d.p[1]);
      if(d.by===myId())applyItem(d.ty,p);
      else fxText(T("allyGotItem"),p.clone().add(V3(0,2,0)),"good");
      break;
    }
    case "wave":game.wave=d.n;setWaveHUD(d.n);
      announceW("WAVE "+d.n+" 襲来!!",d.boss?"ボスのにおいがする…！":"リス軍団を ぜんぶ吹っとばせ！");
      sfx.fanfare();break;
    case "clear":announceW("WAVE "+d.n+" "+T("waveClearShort"),T("waveNextComing"),1.2);sfx.fanfare();break;
    case "bossdown":bossDownFX(V3(d.p[0],d.p[1],d.p[2]));break;
    case "base":setBaseHp(d.hp);shakeCam(.3);sfx.hurt();break;
    case "trapgone":removeTrapNear(V3(d.p[0],0,d.p[1]));break;
    case "end":showResult(d.win,d.stats);break;
  }
}

/* =========================================================
   UI — pickers / menu / setup / shop / lobby / result
   ========================================================= */
function pickHTML(type,key){
  if(type==="breed"){const b=BREEDS[key];
    const lbl=curLang==="en"&&b.label_en?b.label_en:b.label;
    const rol=curLang==="en"&&b.role_en?b.role_en:b.role;
    return dogFaceHTML(key)+"<b>"+lbl+"</b><span>"+rol+"</span>";}
  if(type==="stage"){const s=STAGES[key];
    const lbl=curLang==="en"&&s.label_en?s.label_en:s.label;
    const dsc=curLang==="en"&&s.desc_en?s.desc_en:s.desc;
    return '<span class="stg '+key+'"></span><b>'+lbl+"</b><span>"+dsc+"</span>";}
  const dd=DIFFS[key];
  const lbl=curLang==="en"&&dd.label_en?dd.label_en:dd.label;
  const dsc=curLang==="en"&&dd.desc_en?dd.desc_en:dd.desc;
  const paws=icHTML.paw.repeat(key==="easy"?1:key==="normal"?2:key==="hard"?3:4);
  return '<div class="paws">'+paws+'</div><b>'+lbl+"</b><span>"+dsc+"</span>";
}
function renderPicker(elId,type,order,onPick){
  const el=$(elId);el.innerHTML="";
  order.forEach(key=>{
    const div=document.createElement("div");
    div.className="pick"+(sel[type]===key?" sel":"");
    div.innerHTML=pickHTML(type,key);
    div.onclick=()=>{sel[type]=key;sfx.click();renderPicker(elId,type,order,onPick);if(onPick)onPick(key);};
    el.appendChild(div);
  });
}
function renderMenu(){
  $("#menuCoins").textContent=SAVE.coins;
  $("#menuBest").textContent=SAVE.bestScore;
}
const TALKS_JA=[
  "おかえり！コインで きたえてあげよう。バトル中も ぼくがアイテムを投げ入れるからね！",
  "リスたちも わるい子じゃないんだけどね…どんぐりの投げすぎは こまったもんだ。",
  "ほねコインは スコアでたまるよ。むずかしいほど たくさんもらえる！",
  "トラップ袋を そろえると 落とし穴名人になれるぞ。",
  "つよくなったら「むずかしい」の雪山に ちょうせんだ！"
];
const TALKS_EN=[
  "Welcome back! Train up with coins. I'll toss items to you mid-battle!",
  "The squirrels aren't bad kids... they just throw too many acorns.",
  "Bone Coins come from your score — harder modes give more!",
  "Stock up on trap bags and become a pit trap master!",
  "Once you're strong enough, take on the snowy mountain on Hard!"
];
function renderShop(){
  $("#shopCoins").textContent=SAVE.coins;
  const talks=curLang==="en"?TALKS_EN:TALKS_JA;
  $("#ownerTalk").textContent=talks[rndi(0,talks.length-1)];
  const el=$("#upList");el.innerHTML="";
  UPORDER.forEach(k=>{
    const u=UPS[k],lv=upLv(k),cost=upCost(k,lv),maxed=lv>=u.max;
    const row=document.createElement("div");row.className="upRow";
    let dots="";for(let i=0;i<u.max;i++)dots+='<i class="'+(i<lv?"on":"")+'">';
    const uLabel=curLang==="en"&&u.label_en?u.label_en:u.label;
    const uDesc=curLang==="en"&&u.desc_en?u.desc_en:u.desc;
    row.innerHTML='<div class="nm"><b>'+uLabel+'</b><span>'+uDesc+'</span></div>'+
      '<div class="lvDots">'+dots+'</div>'+
      '<button class="buyBtn" '+(maxed||SAVE.coins<cost?"disabled":"")+'>'+
      (maxed?"MAX":cost+" "+T("coinUnit"))+'</button>';
    if(!maxed)row.querySelector(".buyBtn").onclick=()=>{
      if(SAVE.coins<cost){sfx.deny();return;}
      SAVE.coins-=cost;SAVE.up[k]=lv+1;persist();sfx.buy();renderShop();
    };
    el.appendChild(row);
  });
}
/* ---------- lobby ---------- */
function lobbyInit(){
  let nm="イヌタロウ";try{nm=localStorage.getItem("dsq_name")||nm;}catch(e){}
  $("#inName").value=nm;
  $("#lobbyConnect").classList.remove("hidden");
  $("#lobbyRoom").classList.add("hidden");
  $("#lobbyErr").textContent="";$("#roomErr").textContent="";
}
async function lobbyConnect(action){
  initAudio();
  const name=($("#inName").value||"イヌ").slice(0,10);
  try{localStorage.setItem("dsq_name",name);}catch(e){}
  $("#lobbyErr").textContent="接続中…";
  try{
    if(!Net.connected)await Net.connect();
  }catch(e){
    $("#lobbyErr").textContent="接続できませんでした。時間をおいてもう一度お試しください。";
    return;
  }
  $("#lobbyErr").textContent="";
  if(action==="create")Net.send({t:"create",name});
  else{
    const code=$("#inCode").value.trim().toUpperCase();
    if(code.length!==4){$("#lobbyErr").textContent="4文字の あいことばを入れてね";return;}
    Net.send({t:"join",code,name});
  }
}
function enterRoom(){
  $("#lobbyConnect").classList.add("hidden");
  $("#lobbyRoom").classList.remove("hidden");
  $("#roomErr").textContent="";
  Net.send({t:"breed",breed:sel.breed});
  renderRoom();
}
function renderRoom(){
  $("#roomCode").textContent=Net.code||"----";
  const slots=$("#slots");slots.innerHTML="";
  for(let i=0;i<6;i++){
    const p=Net.players[i];
    const div=document.createElement("div");
    if(p){
      div.className="slot full";
      div.innerHTML=dogFaceHTML(p.breed||"shiba",true)+"<div>"+p.name+
        (i===0?'<span class="tag">ホスト</span>':"")+
        (p.id===myId()?'<span class="tag" style="background:#2980b9">きみ</span>':"")+
        "</div>";
    }else{
      div.className="slot";div.textContent="あき";
    }
    slots.appendChild(div);
  }
  renderPicker("#breedRowL","breed",BREEDORDER,()=>Net.send({t:"breed",breed:sel.breed}));
  if(Net.host){
    $("#hostCfg").classList.remove("hidden");
    $("#btnStart").classList.remove("hidden");
    $("#waitHost").classList.add("hidden");
    renderPicker("#stageRowL","stage",STAGEORDER,()=>Net.send({t:"cfg",stage:sel.stage,diff:sel.diff}));
    renderPicker("#diffRowL","diff",DIFFORDER,()=>Net.send({t:"cfg",stage:sel.stage,diff:sel.diff}));
  }else{
    $("#hostCfg").classList.add("hidden");
    $("#btnStart").classList.add("hidden");
    $("#waitHost").classList.remove("hidden");
    $("#waitHost").textContent="ホストの開始を待っています…　ステージ: "+
      STAGES[sel.stage].label+" / むずかしさ: "+DIFFS[sel.diff].label;
  }
}
Net.on("roomed",enterRoom);
Net.on("players",()=>{
  if(!$("#lobbyRoom").classList.contains("hidden"))renderRoom();
});
Net.on("cfg",m=>{sel.stage=m.stage;sel.diff=m.diff;
  if(!$("#lobbyRoom").classList.contains("hidden"))renderRoom();});
Net.on("err",m=>{$("#lobbyErr").textContent=m.msg;$("#roomErr").textContent=m.msg;sfx.deny();});
Net.on("start",m=>{
  if(Net.host)return;
  sel.stage=m.stage;sel.diff=m.diff;
  beginGame({mode:"guest",breed:sel.breed,stage:m.stage,diff:m.diff,players:m.players,allyLv:m.allyLv});
});
Net.on("pleave",m=>{
  if(remotes[m.id]){scene.remove(remotes[m.id].g);delete remotes[m.id];}
});
Net.on("game",m=>handleGame(m.from,m.d));
Net.handlers.close=()=>{
  if((game.state==="play"||game.state==="end")&&game.mode!=="solo"){
    cleanup();game.state="menu";game.mode="solo";
    $("#hud").classList.add("hidden");
    // Return to lobby instead of menu for multiplayer
    lobbyInit();
    show("#scrLobby");
    Music.play("menu");
    announceW("せつぞくが切れた…","ルームにもどります",2);
  }else if(!$("#scrLobby").classList.contains("hidden")){
    lobbyInit();
  }
};

/* =========================================================
   GAME FLOW
   ========================================================= */
function beginGame(cfg){
  if(!scene){
    alert(T("webglError"));
    return;
  }
  applyLang();
  cleanup();
  game.mode=cfg.mode;game.stage=cfg.stage;game.diff=cfg.diff;
  game.state="play";game.time=0;game.score=0;game.wave=0;game.kills=0;game._quitReason=null;game._noCoins=false;
  $("#menuBtn").classList.remove("hidden");
  game.maxCombo=0;game.combo=0;game.comboT=0;game.timeScale=1;game.slowT=0;
  game.spawnQueue=[];game.waveDone=false;game.sqId=1;game.itemId=1;
  game.snapT=0;game.pinT=0;
  game.buffs={dash:0,rapid:0,mega:0};
  const diff=DIFFS[cfg.diff];
  const players=cfg.players||[];
  game.playersN=cfg.mode==="solo"?1:Math.max(1,players.length);
  game.baseMax=game.baseHp=diff.hp+2*upLv("house")+2*Math.max(0,game.playersN-1);
  buildStage(cfg.stage);
  Music.play(STAGES[cfg.stage].music);
  let idx=0;
  if(cfg.mode!=="solo")idx=Math.max(0,players.findIndex(p=>p.id===myId()));
  const a0=idx/6*Math.PI*2;
  const px=cfg.mode==="solo"?0:Math.cos(a0)*6;
  const pz=cfg.mode==="solo"?6:Math.sin(a0)*6;
  player={breed:cfg.breed,g:buildDog(cfg.breed),pos:V3(px,0,pz),aim:V3(0,0,14),
    fireCd:0,barkCd:0,knockT:0,knockV:V3(),stats:calcStats(cfg.breed),trapStock:0};
  player.trapStock=player.stats.traps;
  player.g.position.copy(player.pos);scene.add(player.g);
  
  // NPC allies: always 2 at base + more from upgrades
  const allyLv = cfg.allyLv !== undefined ? cfg.allyLv : upLv("ally");
  const numAllies = 2 + allyLv;
  const hostBreed = (players[0] && players[0].breed) || cfg.breed;
  const others = BREEDORDER.filter(b => b !== hostBreed);
  for(let i=0; i<numAllies; i++){
    const b = others[i % others.length];
    const g = buildDog(b);
    let apx = 0, apz = 0;
    if (i === 0) { apx = -7; apz = 2; }
    else if (i === 1) { apx = 7; apz = 2; }
    else if (i === 2) { apx = -4; apz = -4; }
    else { apx = 4; apz = -4; }
    const pos = V3(apx,0,apz);
    g.position.copy(pos);scene.add(g);
    allies.push({g,pos,fireT:rnd(.3,.9),barkT:3+i*2,ph:i*2});
  }
  
  if(cfg.mode!=="solo"){
    players.forEach((p,i)=>{
      if(p.id===myId())return;
      const a=i/6*Math.PI*2;
      const g=buildDog(p.breed||"shiba");
      g.position.set(Math.cos(a)*6,0,Math.sin(a)*6);
      scene.add(g);
      remotes[p.id]={g,breed:p.breed,tx:g.position.x,tz:g.position.z,ry:0,fy:0};
    });
  }
  setBaseHp(game.baseHp);
  $("#score").textContent="0";
  // 操作説明：ゲーム開始12秒後にフェードアウト
  $("#ctrlHint").classList.remove("fadeout","hidden");
  clearTimeout(game._ctrlHintTimer);
  game._ctrlHintTimer=setTimeout(()=>$("#ctrlHint").classList.add("fadeout"),12000);
  // 犬小屋HPバー表示
  $("#baseHpFloat").classList.remove("hidden");
  setWaveHUD(1);
  updTrapHUD();
  $("#hud").classList.remove("hidden");
  show(null);
  sfx.bark();
  if(isSim())startWave(1);
}
function cleanup(){
  squirrels.forEach(s=>scene.remove(s.g));squirrels.length=0;
  bones.forEach(b=>scene.remove(b.m));bones.length=0;
  acorns.forEach(a=>scene.remove(a.m));acorns.length=0;
  particles.forEach(p=>scene.remove(p.m));particles.length=0;
  rings.forEach(r=>scene.remove(r.m));rings.length=0;
  traps.forEach(t=>scene.remove(t.g));traps.length=0;
  items.forEach(i=>scene.remove(i.g));items.length=0;
  ftexts.forEach(f=>f.el.remove());ftexts.length=0;
  for(const id in ghosts)scene.remove(ghosts[id].g);
  ghosts={};
  for(const id in remotes)scene.remove(remotes[id].g);
  remotes={};
  allies.forEach(a=>scene.remove(a.g));allies=[];
  if(player){scene.remove(player.g);player=null;}
  $("#combo").style.opacity=0;
  $("#buffs").innerHTML="";
  $("#menuBtn").classList.add("hidden");
  game.timeScale=1;game.slowT=0;game.shake=0;
}
function endGame(win){
  if(game.state!=="play")return;
  game.state="end";game.timeScale=.25;
  const stats={sc:game.score,kills:game.kills,mc:game.maxCombo,
    tm:+game.time.toFixed(1),hp:Math.max(0,game.baseHp)};
  if(game.mode==="host"&&Net.connected)Net.game({t:"ev",k:"end",win,stats});
  showResult(win,stats);
}
/* ---------- minimum quality filter for DDA data ----------
   Only save sessions where the player genuinely played:
   - At least 60 seconds of play time
   - Reached at least WAVE 2
   - Did not quit out of boredom / time / other non-difficulty reasons
*/
function isQualifiedSession(stats){
  if(stats.tm<60) return false;   // under 1 minute — too short
  if(game.wave<2) return false;   // never reached wave 2
  return true;
}

function saveDDASession(win,stats,rank,coins){
  if(!isQualifiedSession(stats)) return; // skip low-quality sessions
  try{
    const db=firebase.firestore();
    const hpPct=game.baseMax>0?Math.round(stats.hp/game.baseMax*100):0;
    const waveMax=DIFFS[game.diff].maxWave||99;
    const doc={
      // ---- game context ----
      stage:game.stage,
      diff:game.diff,
      breed:game.breed||sel.breed||"shiba",
      mode:game.mode,
      // ---- result ----
      win:win,
      rank:rank,
      wave_reached:game.wave,
      wave_max:waveMax,
      wave_pct:Math.round(game.wave/waveMax*100),
      // ---- performance ----
      score:stats.sc,
      kills:stats.kills,
      max_combo:stats.mc,
      clear_time:stats.tm,
      hp_remaining:stats.hp,
      hp_pct:hpPct,
      coins_earned:coins,
      // ---- shop upgrades (so ML can account for player power level) ----
      upgrades: Object.assign({}, SAVE.up||{}),
      upgrade_total: Object.values(SAVE.up||{}).reduce((s,v)=>s+(v||0),0),
      // ---- quit reason (null = natural game over) ----
      quit_reason: win ? null : (game._quitReason || "gameover"),
      // ---- meta ----
      lang:curLang,
      ts:firebase.firestore.FieldValue.serverTimestamp()
    };
    db.collection("dda_sessions").add(doc).catch(()=>{});
  }catch(e){}
}

function showResult(win,stats){
  game.state="end";game.timeScale=.25;
  if(win)sfx.big();else sfx.lose();
  const stageF={park:1,beach:1.15,snow:1.3}[game.stage]||1;
  const diffF={easy:.8,normal:1,hard:1.3,endless:1.5}[game.diff]||1;
  const norm=stats.sc/(stageF*diffF);
  const rank=!win?"-":norm>=4200?"S":norm>=3300?"A":norm>=2500?"B":"C";
  const coinsRaw=Math.floor(stats.sc/45*DIFFS[game.diff].coin)+(win?Math.floor(80*DIFFS[game.diff].coin):0);
  const coins=game._noCoins?0:coinsRaw;
  if(!game._noCoins)SAVE.coins+=coins;
  if(stats.sc>SAVE.bestScore)SAVE.bestScore=stats.sc;
  if(win)SAVE.wins=(SAVE.wins||0)+1;
  persist();
  saveDDASession(win,stats,rank,coins);
  setTimeout(()=>{
    if(win) $("#resTitle").textContent=T("resWin");
    else if(game.diff==="endless") $("#resTitle").textContent="WAVE "+game.wave+" "+T("resEndless");
    else $("#resTitle").textContent=T("resLose");
    $("#resRank").textContent=rank;
    $("#resStats").innerHTML=
      T("resClearTime")+stats.tm.toFixed(1)+" "+T("resSec")+"<br>"+
      icHTML.star+" "+T("resScore")+stats.sc+"　|　"+icHTML.squi+" "+T("resKills")+stats.kills+" "+T("resUnits")+"<br>"+
      T("resCombo")+Math.max(stats.mc,1)+"　|　"+icHTML.house+" "+T("resHp")+stats.hp+" / "+game.baseMax+"<br>"+
      icHTML.coin+" "+T("resCoins")+coins;
    // In multiplayer, show "back to room" instead of retry
    $("#btnRetry").classList.toggle("hidden",game.mode!=="solo");
    if(game.mode!=="solo"){
      $("#btnMenu").textContent=T("btnToRoom");
      $("#btnMenu").onclick=()=>toLobby();
    }else{
      $("#btnMenu").textContent=T("btnToMenu");
      $("#btnMenu").onclick=()=>toMenu();
    }
    // ranking entry area — store result for submission
    game._pendingRank={win,score:stats.sc,stage:game.stage,diff:game.diff,breed:game.breed||sel.breed,wave:game.wave,rank};
    $("#rankSubmitMsg").textContent="";
    $("#rankNameInput").value=localStorage.getItem("dsq_name")||"";
    // restore label text
    $("#rankEntryLabel")||($(".resRankEntryLabel")&&($(".resRankEntryLabel").textContent=T("rankEntryLabel")));
    $("#resRankEntry").classList.remove("hidden");
    $("#btnRankSubmit").disabled=false;
    $("#btnRankSubmit").textContent=T("rankSubmit");
    $("#hud").classList.add("hidden");
    show("#scrResult");
  },1200);
}

function saveRankEntry(name){
  const e=game._pendingRank;
  if(!e)return;
  const safeName=name.slice(0,10).replace(/[^a-zA-Z0-9ぁ-んァ-ン一-龥\-_]/g,"_")||"guest";
  // doc ID = name_stage_diff → 1人1枠、自己ベストのみ保存
  const docId=(safeName+"_"+e.stage+"_"+e.diff).replace(/\s+/g,"_");
  try{
    const db=firebase.firestore();
    const ref=db.collection("rankings").doc(docId);
    db.runTransaction(async t=>{
      const doc=await t.get(ref);
      if(!doc.exists||doc.data().score<e.score){
        t.set(ref,{
          name:safeName,score:e.score,stage:e.stage,diff:e.diff,
          breed:e.breed,wave:e.wave,rank:e.rank,win:e.win,
          ts:firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }).catch(()=>{});
  }catch(ex){}
  game._pendingRank=null;
}

function getTierInfo(pos){
  // pos は 0始まり
  if(pos===0)   return {label:"LEGEND",  icon:"👑", cls:"tier-legend"};
  if(pos<=4)    return {label:"DIAMOND", icon:"💎", cls:"tier-diamond"};
  if(pos<=9)    return {label:"PLATINUM",icon:"💜", cls:"tier-platinum"};
  if(pos<=19)   return {label:"GOLD",    icon:"🥇", cls:"tier-gold"};
  if(pos<=34)   return {label:"SILVER",  icon:"🥈", cls:"tier-silver"};
  return             {label:"BRONZE",  icon:"🥉", cls:"tier-bronze"};
}

let _rankUnsubscribe=null;
function showRanking(){
  const filterStage=$("#rankFilterStage").value||"all";
  const filterDiff=$("#rankFilterDiff").value||"all";
  const list=$("#rankingList");
  list.innerHTML=`<div class="rankLoading">${T("rankLoading")}</div>`;
  if(_rankUnsubscribe){_rankUnsubscribe();_rankUnsubscribe=null;}
  try{
    const db=firebase.firestore();
    _rankUnsubscribe=db.collection("rankings").orderBy("score","desc").limit(200).onSnapshot(snap=>{
      let docs=snap.docs.map(d=>({...d.data()}));
      if(filterStage!=="all")docs=docs.filter(d=>d.stage===filterStage);
      if(filterDiff!=="all") docs=docs.filter(d=>d.diff===filterDiff);
      docs=docs.slice(0,50);
      if(!docs.length){list.innerHTML=`<div class="rankEmpty">${T("rankEmpty")}</div>`;return;}
      const si={park:"🌳",beach:"🏖️",snow:"❄️"};
      list.innerHTML=docs.map((d,i)=>{
        const tier=getTierInfo(i);
        return `<div class="rankRow">
          <span class="rankPos">${i+1}</span>
          <span class="rankTierBadge ${tier.cls}">${tier.icon} ${tier.label}</span>
          <span class="rankName">${d.name||"???"}</span>
          <span class="rankMeta">${si[d.stage]||""} ${d.diff||""}</span>
          <span class="rankScore">${(d.score||0).toLocaleString()}</span>
        </div>`;
      }).join("");
    },()=>{list.innerHTML=`<div class="rankEmpty">${T("rankEmpty")}</div>`;});
  }catch(_){list.innerHTML=`<div class="rankEmpty">${T("rankEmpty")}</div>`;}
  show("#scrRanking");
}

["rankFilterStage","rankFilterDiff"].forEach(id=>{
  $("#"+id).onchange=()=>showRanking();
});
$("#btnRankingBack").onclick=()=>{
  if(_rankUnsubscribe){_rankUnsubscribe();_rankUnsubscribe=null;}
  toMenu();
};
$("#btnRanking").onclick=()=>{try{sfx.click();}catch(e){}showRanking();};
$("#btnResRanking").onclick=()=>{try{sfx.click();}catch(e){}showRanking();};
$("#btnRankSubmit").onclick=()=>{
  const name=($("#rankNameInput").value||"").trim();
  if(!name){$("#rankSubmitMsg").textContent="名前を入力してね！";return;}
  try{localStorage.setItem("dsq_name",name);}catch(e){}
  saveRankEntry(name);
  $("#btnRankSubmit").disabled=true;
  $("#rankSubmitMsg").textContent="✅ 登録しました！";
};

function toLobby(){
  cleanup();
  game.state="menu";
  if(Net.host){
    const db = firebase.firestore();
    db.collection("dog_squad_rooms").doc(Net.code).update({ started: false }).catch(e=>{});
  }
  renderRoom();
  show("#scrLobby");
  $("#lobbyConnect").classList.add("hidden");
  $("#lobbyRoom").classList.remove("hidden");
  Music.play("menu");
}
function toMenu(){
  cleanup();
  game.state="menu";game.mode="solo";
  Net.leave();
  $("#hud").classList.add("hidden");
  renderMenu();show("#scrMenu");
  Music.play("menu");
}

/* ---------- buttons ---------- */
$("#btnSolo").onclick=()=>{
  try{sfx.click();}catch(e){}
  renderPicker("#breedRow","breed",BREEDORDER);
  renderPicker("#stageRow","stage",STAGEORDER);
  renderPicker("#diffRow","diff",DIFFORDER);
  show("#scrSetup");
};
$("#btnSetupBack").onclick=()=>{try{sfx.click();}catch(e){}renderMenu();show("#scrMenu");};
$("#btnSetupGo").onclick=()=>{initAudio();
  beginGame({mode:"solo",breed:sel.breed,stage:sel.stage,diff:sel.diff});};
$("#btnShop").onclick=()=>{try{sfx.click();}catch(e){}renderShop();show("#scrShop");};
$("#btnShopBack").onclick=()=>{try{sfx.click();}catch(e){}renderMenu();show("#scrMenu");};
$("#btnSettings").onclick=()=>{
  try{sfx.click();}catch(e){}
  $("#sliderBgm").value=Math.round(_bgmVol*100);
  $("#valBgm").textContent=Math.round(_bgmVol*100)+"%";
  $("#sliderSfx").value=Math.round(_sfxVol*100);
  $("#valSfx").textContent=Math.round(_sfxVol*100)+"%";
  show("#scrSettings");
};
$("#btnSettingsBack").onclick=()=>{try{sfx.click();}catch(e){}renderMenu();show("#scrMenu");};
$("#btnLangJa").onclick=()=>{
  try{sfx.click();}catch(e){}
  curLang="ja";try{localStorage.setItem("dsq_lang","ja");}catch(e){}
  applyLang();
};
$("#btnLangEn").onclick=()=>{
  try{sfx.click();}catch(e){}
  curLang="en";try{localStorage.setItem("dsq_lang","en");}catch(e){}
  applyLang();
};
$("#sliderBgm").oninput=function(){
  const v=parseInt(this.value)/100;
  setBgmVol(v);
  $("#valBgm").textContent=this.value+"%";
};
$("#sliderSfx").oninput=function(){
  const v=parseInt(this.value)/100;
  setSfxVol(v);
  $("#valSfx").textContent=this.value+"%";
};
$("#btnFullscreen").onclick=()=>{
  try{sfx.click();}catch(e){}
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen().catch(()=>{});
  }else{
    document.exitFullscreen().catch(()=>{});
  }
};
document.addEventListener("fullscreenchange",()=>{
  const btn=$("#btnFullscreen");
  if(btn)btn.textContent=document.fullscreenElement?T("fsOff"):T("fsOn");
});
$("#btnRetry").onclick=()=>beginGame({mode:"solo",breed:sel.breed,stage:sel.stage,diff:sel.diff});
$("#btnMenu").onclick=()=>toMenu();
$("#btnMulti").onclick=()=>{
  try{sfx.click();}catch(e){}
  lobbyInit();
  show("#scrLobby");
};
$("#btnLobbyBack").onclick=()=>{try{sfx.click();}catch(e){}Net.leave();renderMenu();show("#scrMenu");};
$("#btnCreate").onclick=()=>lobbyConnect("create");
$("#btnJoin").onclick=()=>lobbyConnect("join");
$("#btnLeave").onclick=()=>{Net.leave();lobbyInit();};
$("#btnCopy").onclick=()=>{
  try{
    const shareUrl = location.origin + location.pathname + "?room=" + Net.code;
    navigator.clipboard.writeText(shareUrl);
    alert("お友だち招待用のURLをコピーしました！ブラウザに貼り付けて参加できます。\n" + shareUrl);
  }catch(e){
    navigator.clipboard.writeText(Net.code);
  }
};
$("#btnStart").onclick=()=>{
  if(!Net.host)return;
  if(Net.players.length<2){$("#roomErr").textContent="ひとりだけ…？「ひとりで遊ぶ」もあるよ（このまま出撃もOK!）";}
  try {
    Net.send({t:"start",stage:sel.stage,diff:sel.diff,allyLv:upLv("ally")});
  } catch(e) {}
  try {
    beginGame({mode:"host",breed:sel.breed,stage:sel.stage,diff:sel.diff,players:Net.players});
  } catch(e) {
    alert("beginGame error: " + e.stack);
  }
};
function updMute(){$("#spkIc").classList.toggle("off",muted);}
$("#muteBtn").onclick=e=>{e.stopPropagation();initAudio();setMute(!muted);updMute();};
$("#menuBtn").onclick=()=>{
  try{sfx.click();}catch(e){}
  if(game.state==="play"){game.state="pause";}
  show("#scrPause");
};
$("#btnResume").onclick=()=>{
  try{sfx.click();}catch(e){}
  if(game.state==="pause"){game.state="play";}
  show(null);
};
$("#btnQuit").onclick=()=>{
  try{sfx.click();}catch(e){}
  show("#scrQuitConfirm");
};
$("#btnQuitConfirm").onclick=()=>{
  try{sfx.click();}catch(e){}
  game._quitReason="quit";
  game._noCoins=true;
  game.state="play";
  show(null);
  endGame(false);
};
$("#btnQuitCancel").onclick=()=>{
  try{sfx.click();}catch(e){}
  show("#scrPause");
};

// Name modal button
$("#btnNameOk").onclick=()=>{
  const nameVal = ($("#inNameModal").value || "イヌ").slice(0,10);
  try{localStorage.setItem("dsq_name",nameVal);}catch(e){}
  lobbyInit();
  $("#inName").value = nameVal;
  const pendingRoom = $("#inNameModal").dataset.room;
  if(pendingRoom){
    $("#inCode").value = pendingRoom;
  }
  show("#scrLobby");
};

/* =========================================================
   MAIN LOOP & BOOT
   ========================================================= */
const clock=new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  const rawDt=Math.min(clock.getDelta(),.04);
  if(game.slowT>0){game.slowT-=rawDt;if(game.slowT<=0)game.timeScale=1;}
  const dt=rawDt*game.timeScale;
  if(stageGroup){
    if(stageGroup.userData.flag)stageGroup.userData.flag.rotation.y=.25*Math.sin(clock.elapsedTime*3);
    if(stageGroup.userData.sign)stageGroup.userData.sign.rotation.y+=rawDt*.8;
  }
  if(ownerRig){
    if(game.ownerWaveT>0){game.ownerWaveT-=rawDt;
      ownerRig.userData.wave.rotation.z=.6+Math.sin(clock.elapsedTime*14)*.5;}
    else ownerRig.userData.wave.rotation.z=.3;
  }
  reticle.visible=retDot.visible=(game.state==="play");
  if(game.state==="play"){
    game.time+=dt;
    $("#timer").textContent=game.time.toFixed(1)+" s";
    // 残り敵数表示
    const alive=squirrels.filter(s=>s.state!=="dead").length;
    const queued=game.spawnQueue.length;
    const total=alive+queued;
    $("#enemyCount").textContent=total>0?"🐿 "+total:" ";
    // 15 minute (900 sec) forced end — non-endless only
    if(game.time>=900 && !isEndless()){
      game.state="play"; // ensure endGame won't be blocked
      announceW(T("snackTime"), T("snackTimeSub"), 2.2);
      sfx.fanfare();
      setTimeout(()=>{endGame(true);},2200);
    }
    updateAim();
    updatePlayer(dt);
    updateBuffs(dt);
    updateRemotes(dt);
    updateAllies(dt);
    if(isSim()){
      updateSquirrels(dt);
      if(game.spawnQueue.length>0){
        game.spawnT-=dt;
        if(game.spawnT<=0){spawnSquirrel(game.spawnQueue.shift());game.spawnT=game.spawnInterval;}
      }else if(squirrels.length===0&&!game.waveDone){
        game.waveDone=true;game.clearT=2.2;
        const maxW=DIFFS[game.diff].maxWave;
        if(maxW>0 && game.wave>=maxW){
          // Non-endless: game cleared after final wave
          announceW(T("allClear"),T("allClearSub"),2);
          sfx.fanfare();confetti(V3(0,4,0));
          if(game.mode==="host"&&Net.connected)Net.game({t:"ev",k:"clear",n:game.wave});
          setTimeout(()=>endGame(true),2200);
        }else{
          announceW("WAVE "+game.wave+" "+T("waveClearShort"),T("waveClearSub"),1.2);
          sfx.fanfare();
          if(game.mode==="host"&&Net.connected)Net.game({t:"ev",k:"clear",n:game.wave});
          ownerThrowItem();
        }
      }
      if(game.waveDone){
        const maxW=DIFFS[game.diff].maxWave;
        if(maxW>0 && game.wave>=maxW){
          // Don't start next wave, game is ending
        }else{
          game.clearT-=dt;
          if(game.clearT<=0){
            startWave(game.wave+1);
          }
        }
      }
      if(game.mode==="host"&&Net.connected){
        game.snapT-=dt;
        if(game.snapT<=0){
          game.snapT=.09;
          const sq=squirrels.filter(s=>s.state!=="dead").map(s=>[
            s.id,KINDORDER.indexOf(s.kind),
            +s.g.position.x.toFixed(2),+s.g.position.y.toFixed(2),+s.g.position.z.toFixed(2),
            s.state==="run"?0:s.state==="throw"?1:s.state==="fly"?2:3,
            +s.g.rotation.y.toFixed(2)]);
          Net.game({t:"snap",sq,hp:game.baseHp,sc:game.score,wv:game.wave,tm:+game.time.toFixed(1)});
        }
      }
    }else{
      updateGhosts(dt);
    }
    updateProjectiles(dt);
    updateItems(dt);
  }else if(game.state==="end"){
    if(isSim())updateSquirrels(dt);else updateGhosts(dt);
    updateProjectiles(dt);
    updateItems(dt);
  }
  updateFX(dt,rawDt);
  updateCamera(rawDt);
  if(renderer&&scene&&camera){
    renderer.render(scene,camera);
    // 犬小屋の上にHPバーを追従させる
    if(game.state==="play"||game.state==="pause"){
      const baseWorld=V3(0,4.2,0);
      const v=baseWorld.clone().project(camera);
      const el=$("#baseHpFloat");
      if(v.z<1){
        el.style.left=((v.x*.5+.5)*innerWidth)+"px";
        el.style.top=((-.5*v.y+.5)*innerHeight)+"px";
        el.classList.remove("hidden");
      }else{el.classList.add("hidden");}
    }else{$("#baseHpFloat").classList.add("hidden");}
  }
}

try {
  initWorld();
  buildStage("park");
} catch(e) {
  console.error("WebGL initialization failed:", e);
}
renderMenu();
updMute();
applyLang();
show("#scrMenu");
Music.play("menu");
loop();

// URLに ?room=ABCD がある場合に名前入力画面を表示してから入室
addEventListener("load", () => {
  const params = new URLSearchParams(location.search);
  const room = params.get("room");
  if (room && room.length === 4) {
    setTimeout(() => {
      // Show name modal first
      let savedName = "イヌタロウ";
      try { savedName = localStorage.getItem("dsq_name") || savedName; } catch(e){}
      $("#inNameModal").value = savedName;
      $("#inNameModal").dataset.room = room.toUpperCase();
      show("#scrNameModal");
      $("#inNameModal").focus();
    }, 800);
  }
});
