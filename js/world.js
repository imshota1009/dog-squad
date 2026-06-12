"use strict";
/* =========================================================
   WORLD — three.js scene, stages, character builders
   ========================================================= */
let scene,camera,renderer,sun;
const camBase=V3(0,30,36);
let stageGroup=null,ownerRig=null,reticle,retDot;

function initWorld(){
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  document.getElementById("game").appendChild(renderer.domElement);

  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,250);
  camera.position.copy(camBase);camera.lookAt(0,0,0);

  addEventListener("resize",()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  scene.add(new THREE.HemisphereLight(0xeaf6ff,0x6aa84f,.95));
  sun=new THREE.DirectionalLight(0xfff2d8,.9);
  sun.position.set(22,38,14);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-48;sun.shadow.camera.right=48;
  sun.shadow.camera.top=48;sun.shadow.camera.bottom=-48;
  sun.shadow.camera.far=120;
  scene.add(sun);

  reticle=new THREE.Mesh(new THREE.RingGeometry(.55,.75,24),
    new THREE.MeshBasicMaterial({color:0xff4757,transparent:true,opacity:.85}));
  reticle.rotation.x=-Math.PI/2;reticle.position.y=.06;scene.add(reticle);
  retDot=new THREE.Mesh(new THREE.CircleGeometry(.12,10),
    new THREE.MeshBasicMaterial({color:0xff4757}));
  retDot.rotation.x=-Math.PI/2;retDot.position.y=.061;scene.add(retDot);
}

/* ---------- tiny mesh helpers ---------- */
const M=c=>new THREE.MeshLambertMaterial({color:c});
function box(w,h,d,c){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));}
function sph(r,c,s=10){return new THREE.Mesh(new THREE.SphereGeometry(r,s,Math.max(6,s-2)),M(c));}
function cyl(rt,rb,h,c,s=10){return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s),M(c));}
function cone(r,h,c,s=8){return new THREE.Mesh(new THREE.ConeGeometry(r,h,s),M(c));}
function shadowed(g){g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}

/* =========================================================
   STAGES
   ========================================================= */
function buildStage(key){
  if(stageGroup){scene.remove(stageGroup);}
  stageGroup=new THREE.Group();
  const st=STAGES[key];
  scene.background=new THREE.Color(st.sky);
  scene.fog=new THREE.Fog(st.sky,60,110);

  const ground=new THREE.Mesh(new THREE.CircleGeometry(42,48),M(st.ground));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;stageGroup.add(ground);
  const path=new THREE.Mesh(new THREE.RingGeometry(16,18.6,48),M(st.path));
  path.rotation.x=-Math.PI/2;path.position.y=.02;path.receiveShadow=true;stageGroup.add(path);

  if(key==="park")buildPark();
  else if(key==="beach")buildBeach();
  else buildSnow();

  buildDoghouseMesh();
  buildBench();
  scene.add(stageGroup);
}
function buildPark(){
  for(let i=0;i<14;i++){
    const a=i/14*Math.PI*2+rnd(-.15,.15),r=rnd(30,39),s=rnd(.8,1.35);
    const g=new THREE.Group();
    const t=cyl(.35*s,.5*s,2.4*s,0x8d6a4a);t.position.y=1.2*s;g.add(t);
    const c1=sph(1.7*s,0x4caf50);c1.position.y=3.2*s;g.add(c1);
    const c2=sph(1.2*s,0x66bb6a);c2.position.set(.9*s,2.6*s,.4*s);g.add(c2);
    g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);stageGroup.add(shadowed(g));
  }
  for(let i=0;i<5;i++){const a=rnd(0,Math.PI*2),r=rnd(21,26);
    const b=sph(rnd(.8,1.2),0x57b04e);b.position.set(Math.cos(a)*r,.5,Math.sin(a)*r);
    b.castShadow=true;stageGroup.add(b);}
  const cols=[0xff7eb3,0xffe34d,0xff9d5c,0xc792ff,0xffffff];
  for(let i=0;i<40;i++){const a=rnd(0,Math.PI*2),r=rnd(5,27);
    const f=sph(.16,cols[rndi(0,4)],6);
    f.position.set(Math.cos(a)*r,.16,Math.sin(a)*r);stageGroup.add(f);}
  for(let i=0;i<26;i++){const a=i/26*Math.PI*2;
    const p=box(.3,1.5,.3,0xbf9468);p.position.set(Math.cos(a)*41,.75,Math.sin(a)*41);
    stageGroup.add(p);}
}
function buildBeach(){
  for(let i=0;i<10;i++){ // palm trees
    const a=i/10*Math.PI*2+rnd(-.2,.2),r=rnd(31,39),s=rnd(.9,1.3);
    const g=new THREE.Group();
    const t=cyl(.28*s,.42*s,4.2*s,0xa9794f);t.position.y=2.1*s;t.rotation.z=rnd(-.15,.15);g.add(t);
    for(let k=0;k<6;k++){
      const a2=k/6*Math.PI*2;
      const leaf=box(2.4*s,.12,.7*s,0x3eb86b);
      leaf.position.set(Math.cos(a2)*1.1*s,4.2*s,Math.sin(a2)*1.1*s);
      leaf.rotation.y=-a2;leaf.rotation.z=-.35;g.add(leaf);
    }
    const c=sph(.3*s,0x8d6a4a);c.position.set(.4*s,3.9*s,.2*s);g.add(c);
    g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);stageGroup.add(shadowed(g));
  }
  for(let i=0;i<18;i++){ // shells + starfish
    const a=rnd(0,Math.PI*2),r=rnd(6,28);
    const m=Math.random()<.5?cone(.25,.2,0xfff1f1,8):sph(.2,0xff8a8a,5);
    m.position.set(Math.cos(a)*r,.12,Math.sin(a)*r);stageGroup.add(m);
  }
  const sea=new THREE.Mesh(new THREE.RingGeometry(42,80,48),M(0x4aa3df));
  sea.rotation.x=-Math.PI/2;sea.position.y=-.05;stageGroup.add(sea);
  for(let i=0;i<8;i++){ // beach balls / parasols
    const a=rnd(0,Math.PI*2),r=rnd(30,36);
    if(i%2){const b=sph(.6,[0xff5e7e,0x74b9ff,0xffe34d][i%3]);b.position.set(Math.cos(a)*r,.6,Math.sin(a)*r);b.castShadow=true;stageGroup.add(b);}
    else{const g=new THREE.Group();
      const pole=cyl(.08,.08,3,0xeeeeee,6);pole.position.y=1.5;g.add(pole);
      const top=cone(1.6,.9,i%4?0xff6b81:0x70a1ff,10);top.position.y=3.1;g.add(top);
      g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);stageGroup.add(shadowed(g));}
  }
}
function buildSnow(){
  for(let i=0;i<14;i++){ // conifers
    const a=i/14*Math.PI*2+rnd(-.15,.15),r=rnd(30,39),s=rnd(.9,1.4);
    const g=new THREE.Group();
    const t=cyl(.3*s,.4*s,1.6*s,0x6e4f33);t.position.y=.8*s;g.add(t);
    [[2.2,1.6],[1.7,2.6],[1.2,3.5]].forEach(p=>{
      const c=cone(p[0]*s,1.6*s,0x2f7d4f,8);c.position.y=p[1]*s;g.add(c);
      const snow=cone(p[0]*s*.85,.5*s,0xffffff,8);snow.position.y=(p[1]+.55)*s;g.add(snow);
    });
    g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);stageGroup.add(shadowed(g));
  }
  { // snowman
    const g=new THREE.Group();
    const b1=sph(1.3,0xffffff);b1.position.y=1.1;g.add(b1);
    const b2=sph(.9,0xffffff);b2.position.y=2.6;g.add(b2);
    const nose=cone(.16,.7,0xff8c42,6);nose.position.set(0,2.7,.95);nose.rotation.x=Math.PI/2;g.add(nose);
    [-1,1].forEach(s2=>{const e=sph(.1,0x222222,6);e.position.set(.3*s2,2.85,.78);g.add(e);});
    const hat=cyl(.5,.5,.6,0xc0392b,10);hat.position.y=3.6;g.add(hat);
    g.position.set(-20,0,-16);stageGroup.add(shadowed(g));
  }
  for(let i=0;i<24;i++){ // snow piles & ice
    const a=rnd(0,Math.PI*2),r=rnd(6,28);
    const m=sph(rnd(.3,.7),0xffffff,7);m.scale.y=.45;
    m.position.set(Math.cos(a)*r,.12,Math.sin(a)*r);stageGroup.add(m);
  }
}
function buildDoghouseMesh(){
  const g=new THREE.Group();
  const body=box(3.4,2.4,3.2,0xd9603b);body.position.y=1.2;g.add(body);
  const roof=cone(2.95,1.7,0x8d3b2a,4);roof.position.y=3.25;roof.rotation.y=Math.PI/4;g.add(roof);
  const door=cyl(.78,.78,.3,0x3a2417,12);door.rotation.x=Math.PI/2;door.position.set(0,.95,1.62);g.add(door);
  const sign=new THREE.Group();
  const bar=cyl(.13,.13,1.1,0xffffff,8);bar.rotation.z=Math.PI/2;sign.add(bar);
  [[-.55,.14],[-.55,-.14],[.55,.14],[.55,-.14]].forEach(p=>{
    const b2=sph(.2,0xffffff,8);b2.position.set(p[0],p[1],0);sign.add(b2);});
  sign.position.y=4.35;g.add(sign);
  const pole=cyl(.07,.07,3,0x6b4d2e,6);pole.position.set(2.2,1.5,-1);g.add(pole);
  const flag=box(1.2,.7,.06,0xffb13b);flag.position.set(2.87,2.7,-1);g.add(flag);
  stageGroup.add(shadowed(g));
  stageGroup.userData.flag=flag;
  stageGroup.userData.sign=sign;
}
function buildBench(){
  const g=new THREE.Group();
  const seat=box(4,.25,1.3,0xa9794f);seat.position.y=1;g.add(seat);
  const back=box(4,1.1,.2,0xa9794f);back.position.set(0,1.8,-.55);g.add(back);
  [[-1.7,.5],[1.7,.5]].forEach(p=>{
    const l=box(.25,1,1.1,0x7c5836);l.position.set(p[0],p[1],0);g.add(l);});
  g.position.set(19,0,13);g.rotation.y=-2.2;
  stageGroup.add(shadowed(g));
  ownerRig=buildOwner();
  ownerRig.position.set(19,0,13);ownerRig.rotation.y=-2.2;
  stageGroup.add(ownerRig);
}
/* ---------- the owner (飼い主) ---------- */
function buildOwner(){
  const g=new THREE.Group();
  const skin=0xf2c89b;
  [[-.3],[.3]].forEach(p=>{ // legs (sitting)
    const th=box(.42,.42,1.0,0x4a6fa5);th.position.set(p[0],1.15,.45);g.add(th);
    const sh=box(.4,.9,.4,0x4a6fa5);sh.position.set(p[0],.55,.85);g.add(sh);
    const ft=box(.45,.25,.7,0xffffff);ft.position.set(p[0],.13,1.0);g.add(ft);
  });
  const torso=box(1.2,1.3,.7,0xff8c42);torso.position.set(0,1.95,.1);g.add(torso);
  [-1,1].forEach(s=>{
    const arm=box(.32,1.0,.34,0xff8c42);arm.position.set(.75*s,1.9,.15);g.add(arm);
    const hand=sph(.17,skin,7);hand.position.set(.75*s,1.35,.2);g.add(hand);
  });
  const head=sph(.55,skin,12);head.position.set(0,3.0,.1);g.add(head);
  const capTop=sph(.56,0x2ecc71,10);capTop.scale.y=.55;capTop.position.set(0,3.3,.07);g.add(capTop);
  const brim=cyl(.55,.55,.08,0x27ae60,12);brim.position.set(0,3.18,.5);brim.scale.z=1.4;g.add(brim);
  [-1,1].forEach(s=>{const e=sph(.07,0x333333,6);e.position.set(.2*s,3.05,.6);g.add(e);});
  const mouth=box(.22,.05,.05,0xa05a2c);mouth.position.set(0,2.8,.62);g.add(mouth);
  // waving arm pivot (right arm duplicated as rig)
  const wave=new THREE.Group();
  const wa=box(.32,1.0,.34,0xff8c42);wa.position.y=-.45;wave.add(wa);
  const wh=sph(.17,skin,7);wh.position.y=-.95;wave.add(wh);
  wave.position.set(-.75,2.45,.15);wave.rotation.z=.3;
  g.add(wave);
  g.userData.wave=wave;
  return shadowed(g);
}

/* =========================================================
   CHARACTERS
   ========================================================= */
function buildDog(breedKey){
  const opt=BREEDS[breedKey];
  const g=new THREE.Group();
  const body=box(1.35,1.05,2.05,opt.body);body.position.y=1.0;g.add(body);
  const chest=box(1.0,.62,.9,opt.chest);chest.position.set(0,.78,.72);g.add(chest);
  const head=box(1.05,.95,.95,opt.body);head.position.set(0,1.85,.85);g.add(head);
  const muzLen=opt.flat?.22:.5;
  const muz=box(.52,.42,muzLen,opt.chest);muz.position.set(0,1.66,1.42-(opt.flat?.12:0));g.add(muz);
  const nose=box(.2,.16,.14,0x222222);nose.position.set(0,1.78,opt.flat?1.5:1.68);g.add(nose);
  [-1,1].forEach(s=>{
    const e=sph(.1,0x1a1a1a,8);e.position.set(.26*s,1.97,1.31);g.add(e);
    const gl=sph(.035,0xffffff,6);gl.position.set(.26*s+.03,2.0,1.39);g.add(gl);
  });
  [-1,1].forEach(s=>{
    let ear;
    if(opt.ear==="point"){
      ear=cone(.22,.5,opt.earCol,4);ear.position.set(.34*s,2.5,.72);ear.rotation.z=-.18*s;
    }else{
      ear=box(.3,.62,.16,opt.earCol);ear.position.set(.56*s,2.05,.78);ear.rotation.z=.5*s;
    }
    g.add(ear);
  });
  [[-.42,.65],[.42,.65],[-.42,-.7],[.42,-.7]].forEach(p=>{
    const l=box(.3,opt.short?.36:.6,.32,opt.body);
    l.position.set(p[0],opt.short?.18:.3,p[1]);g.add(l);
  });
  let tail;
  tail=new THREE.Group();
  const t1=sph(.26,opt.chest,8);tail.add(t1);
  const t2=sph(.2,opt.body,8);t2.position.set(0,.22,-.18);tail.add(t2);
  tail.position.set(0,1.62,-1.05);
  g.add(tail);
  const band=cyl(.62,.78,.34,opt.band,10);band.position.set(0,1.42,.8);g.add(band);
  if(opt.spots){
    for(let i=0;i<8;i++){
      const sp=sph(rnd(.1,.18),0x222222,6);sp.scale.y=.4;
      sp.position.set(clamp(rnd(-.6,.6),-.68,.68),rnd(.7,1.4),rnd(-.9,.7));
      g.add(sp);
    }
  }
  if(opt.short){ // corgi: lower the whole body
    body.position.y=.8;chest.position.y=.6;head.position.y=1.6;
    muz.position.y=1.42;nose.position.y=1.54;tail.position.y=1.3;band.position.y=1.18;
    g.traverse(o=>{if(o.isMesh&&Math.abs(o.position.y-1.97)<.1)o.position.y=1.72;});
    g.traverse(o=>{if(o.isMesh&&Math.abs(o.position.y-2.5)<.1)o.position.y=2.25;});
    g.traverse(o=>{if(o.isMesh&&Math.abs(o.position.y-2.05)<.1)o.position.y=1.8;});
  }
  g.userData={tail};
  return shadowed(g);
}

const squirrelPalette=[0xf2a65a,0xf78fb3,0xa29bfe,0x55efc4,0xffd56b,0x74b9ff,0xff8a5c];
function buildSquirrel(kind){
  const k=KINDS[kind];
  const g=new THREE.Group();
  const col=kind==="boss"?0xe17055:kind==="tank"?0x9a6a45:squirrelPalette[rndi(0,squirrelPalette.length-1)];
  const belly=0xfff1d6;
  const body=sph(.5,col);body.position.y=.55;body.scale.set(.9,1.05,.95);g.add(body);
  const bl=sph(.34,belly);bl.position.set(0,.5,.3);g.add(bl);
  const head=sph(.36,col);head.position.set(0,1.18,.18);g.add(head);
  const mz=sph(.16,belly,8);mz.position.set(0,1.1,.5);g.add(mz);
  const no=sph(.06,0x4a2c14,6);no.position.set(0,1.13,.65);g.add(no);
  [-1,1].forEach(s=>{
    const e=sph(.085,0x1a1a1a,6);e.position.set(.16*s,1.27,.45);g.add(e);
    const w=sph(.032,0xffffff,5);w.position.set(.16*s+.025,1.3,.5);g.add(w);
    const ear=cone(.1,.24,col,5);ear.position.set(.2*s,1.55,.1);g.add(ear);
    const ch=sph(.09,0xffb3a0,6);ch.position.set(.24*s,1.06,.42);g.add(ch);
    const arm=sph(.11,col,6);arm.position.set(.3*s,.66,.4);g.add(arm);
    const ft=sph(.13,col,6);ft.position.set(.2*s,.1,.12);ft.scale.set(1,.6,1.4);g.add(ft);
  });
  const tail=new THREE.Group();
  const t1=sph(.26,col);t1.position.set(0,.1,0);tail.add(t1);
  const t2=sph(.3,col);t2.position.set(0,.55,-.12);tail.add(t2);
  const t3=sph(.24,0xffe9c9);t3.position.set(0,.95,.02);tail.add(t3);
  tail.position.set(0,.5,-.55);g.add(tail);
  const ac=makeAcornMesh(.16);ac.position.set(0,.72,.55);g.add(ac);

  if(kind==="armor"){
    const cap=sph(.4,0x6b4d2e);cap.scale.y=.62;cap.position.set(0,1.45,.16);g.add(cap);
    const st=cyl(.05,.05,.22,0x4a3215,6);st.position.set(0,1.72,.16);g.add(st);
  }
  if(kind==="scout"){
    const hb=cyl(.37,.37,.12,0xe74c3c,10);hb.position.set(0,1.42,.16);g.add(hb);
    const knot=box(.3,.1,.06,0xe74c3c);knot.position.set(0,1.42,-.22);knot.rotation.x=.4;g.add(knot);
  }
  if(kind==="tank"){
    const pot=cyl(.42,.5,.4,0x7f8c8d,10);pot.position.set(0,1.55,.16);g.add(pot);
    const knob=sph(.1,0x636e72,6);knob.position.set(0,1.8,.16);g.add(knob);
    const shield=cyl(.5,.5,.1,0x95a5a6,10);shield.rotation.x=Math.PI/2;shield.position.set(0,.6,.62);g.add(shield);
  }
  if(kind==="flyer"){
    [-1,1].forEach(s=>{ // glider membrane
      const mem=box(.7,.05,.9,0xd4956a);mem.position.set(.55*s,.62,.1);mem.rotation.z=.25*s;g.add(mem);
    });
    const gog=cyl(.12,.12,.34,0x444444,8);gog.rotation.z=Math.PI/2;gog.position.set(0,1.3,.42);g.add(gog);
  }
  if(kind==="boss"){
    const crown=cyl(.3,.36,.26,0xffd700,8);crown.position.set(0,1.66,.16);g.add(crown);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;
      const sp=cone(.07,.2,0xffd700,4);sp.position.set(Math.cos(a)*.3,1.85,.16+Math.sin(a)*.3);g.add(sp);}
    const cape=box(1.0,1.0,.08,0x8e44ad);cape.position.set(0,.62,-.5);cape.rotation.x=.25;g.add(cape);
  }
  g.scale.setScalar(k.scale);
  g.userData={tail};
  return shadowed(g);
}

function makeBoneMesh(s=1){
  const g=new THREE.Group();
  const bar=cyl(.1*s,.1*s,.85*s,0xfffbe8,8);bar.rotation.z=Math.PI/2;g.add(bar);
  [[-.43,.12],[-.43,-.12],[.43,.12],[.43,-.12]].forEach(p=>{
    const b=sph(.16*s,0xfffbe8,8);b.position.set(p[0]*s,p[1]*s,0);g.add(b);});
  return shadowed(g);
}
function makeAcornMesh(s=1){
  const g=new THREE.Group();
  const nut=sph(s,0xc98a4b,8);nut.scale.y=1.15;g.add(nut);
  const cap=sph(s*1.05,0x7a5230,8);cap.scale.y=.55;cap.position.y=s*.62;g.add(cap);
  const st=cyl(s*.16,s*.16,s*.5,0x5d3d20,5);st.position.y=s*1.05;g.add(st);
  return g;
}
function buildItemMesh(type){
  const it=ITEMS[type];
  const g=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.RingGeometry(.7,.95,20),
    new THREE.MeshBasicMaterial({color:it.col,transparent:true,opacity:.8,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.08;g.add(ring);
  let core;
  if(type==="meat"){
    core=new THREE.Group();
    const m=sph(.42,0xc0392b,9);m.scale.set(1,.8,1.2);core.add(m);
    const b=cyl(.09,.09,.5,0xfffbe8,6);b.rotation.x=Math.PI/2;b.position.z=.6;core.add(b);
    const k1=sph(.13,0xfffbe8,6);k1.position.set(.1,0,.88);core.add(k1);
    const k2=sph(.13,0xfffbe8,6);k2.position.set(-.1,0,.88);core.add(k2);
  }else if(type==="dash"){
    core=cone(.35,.8,it.col,4);
  }else if(type==="rapid"){
    core=makeBoneMesh(.8);
  }else if(type==="mega"){
    core=sph(.4,it.col,10);
    const r2=new THREE.Mesh(new THREE.TorusGeometry(.55,.07,8,18),M(0xfff1d6));
    core.add(r2);
  }else{
    core=cyl(.45,.45,.12,0x2e1d10,14);
  }
  core.position.y=1.0;g.add(core);
  g.userData.core=core;
  return shadowed(g);
}
