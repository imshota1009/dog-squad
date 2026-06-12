"use strict";
/* =========================================================
   AUDIO — WebAudio synth SFX + chiptune music sequencer
   ========================================================= */
let actx=null,master=null,musGain=null,noiseBuf=null,muted=false;

function initAudio(){
  if(actx)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  actx=new AC();
  master=actx.createGain();master.gain.value=muted?0:.45;master.connect(actx.destination);
  musGain=actx.createGain();musGain.gain.value=.55;musGain.connect(master);
  noiseBuf=actx.createBuffer(1,actx.sampleRate*.5,actx.sampleRate);
  const d=noiseBuf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  if(Music.pending){Music.play(Music.pending);Music.pending=null;}
}
function setMute(m){
  muted=m;
  if(master)master.gain.value=m?0:.45;
  try{localStorage.setItem("dsq_mute",m?"1":"0");}catch(e){}
}
function tone(f0,f1,dur,type,vol,when=0,dest){
  if(!actx)return;
  const t=actx.currentTime+when;
  const o=actx.createOscillator(),gn=actx.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(20,f0),t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  gn.gain.setValueAtTime(vol,t);
  gn.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(gn);gn.connect(dest||master);o.start(t);o.stop(t+dur+.02);
}
function noiseHit(dur,vol,fc,when=0,dest){
  if(!actx)return;
  const t=actx.currentTime+when;
  const s=actx.createBufferSource();s.buffer=noiseBuf;s.loop=true;
  const f=actx.createBiquadFilter();f.type="lowpass";f.frequency.value=fc;
  const gn=actx.createGain();gn.gain.setValueAtTime(vol,t);
  gn.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(gn);gn.connect(dest||master);s.start(t);s.stop(t+dur+.02);
}
const sfx={
  shoot(){tone(380,720,.09,"sine",.3);noiseHit(.05,.12,3000);},
  boom(){tone(120,45,.28,"sine",.5);noiseHit(.25,.4,900);},
  bark(){tone(160,70,.16,"square",.4);tone(320,140,.12,"square",.2,.03);noiseHit(.1,.2,1500);},
  boing(){tone(180,900,.22,"sine",.3);tone(160,700,.22,"triangle",.18,.02);},
  pop(){tone(500,1400,.08,"square",.25);noiseHit(.05,.15,4000);},
  bonk(){tone(220,60,.18,"triangle",.4);noiseHit(.08,.2,800);},
  throwA(){noiseHit(.12,.18,2200);tone(700,300,.1,"sine",.12);},
  trap(){tone(400,80,.3,"sine",.3);noiseHit(.2,.2,600);},
  dig(){noiseHit(.15,.25,1200);tone(150,90,.12,"triangle",.2);},
  hurt(){tone(300,90,.2,"sawtooth",.25);},
  pickup(){tone(523,1047,.12,"square",.25);tone(784,1568,.12,"square",.18,.06);},
  buy(){tone(659,659,.1,"square",.22);tone(880,880,.14,"square",.22,.1);},
  deny(){tone(220,160,.18,"square",.2);},
  click(){tone(700,900,.05,"square",.15);},
  fanfare(){[523,659,784,1047].forEach((f,i)=>tone(f,f,.16,"square",.2,i*.09));},
  big(){[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,f,.2,"square",.22,i*.08));noiseHit(.5,.3,2000);},
  lose(){[392,330,262,196].forEach((f,i)=>tone(f,f*.97,.3,"sawtooth",.2,i*.18));}
};

/* ---------- music sequencer (lookahead scheduler) ---------- */
const mf=n=>440*Math.pow(2,(n-69)/12);
const Music={
  cur:null,curName:null,pending:null,step:0,next:0,iv:null,
  play(name){
    if(this.curName===name&&this.iv)return;
    this.stop();
    this.curName=name;
    if(!actx){this.pending=name;return;}
    this.cur=MUSDEFS[name];
    if(!this.cur)return;
    this.step=0;this.next=actx.currentTime+.06;
    this.iv=setInterval(()=>this.tick(),70);
  },
  tick(){
    const d=this.cur;if(!d||!actx)return;
    const spb=60/d.bpm/2; // 8th note
    while(this.next<actx.currentTime+.22){
      const i=this.step%d.lead.length;
      const when=Math.max(0,this.next-actx.currentTime);
      const L=d.lead[i];
      if(L)tone(mf(L),mf(L),spb*.92,d.inst,.10,when,musGain);
      const B=d.bass[i%d.bass.length];
      if(B)tone(mf(B),mf(B)*.995,spb*.95,"triangle",.13,when,musGain);
      if(d.drums){
        if(i%8===0)tone(120,40,.1,"sine",.3,when,musGain);
        if(i%8===4)noiseHit(.07,.14,2500,when,musGain);
        if(i%2===0)noiseHit(.025,.05,8000,when,musGain);
      }
      this.next+=spb;this.step++;
    }
  },
  stop(){
    if(this.iv){clearInterval(this.iv);this.iv=null;}
    this.cur=null;this.curName=null;
  }
};
try{muted=localStorage.getItem("dsq_mute")==="1";}catch(e){}
