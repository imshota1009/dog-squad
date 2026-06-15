const fs = require('fs');
const path = require('path');

console.log("バックグラウンド処理を開始します...");

setTimeout(() => {
  console.log("WAVE表示の修正を行っています...");
  const gameJsPath = path.join(__dirname, 'js', 'game.js');
  let gameJs = fs.readFileSync(gameJsPath, 'utf8');

  gameJs = gameJs.replace(
    `function setWaveHUD(i){$("#wave").textContent="WAVE "+i;}`,
    `function setWaveHUD(i){
  const maxW=DIFFS[game.diff].maxWave;
  if(maxW>0) {
    $("#wave").textContent="WAVE "+i+"/"+maxW;
  } else {
    $("#wave").textContent="WAVE "+i;
  }
}`
  );

  const updateAlliesOld = `function updateAllies(dt){
  for(const a of allies){
    a.fireT-=dt;a.barkT-=dt;
    a.g.userData.tail.rotation.z=.5*Math.sin(game.time*9+a.ph);
    let near=null,nd=1e9;
    for(const s of squirrels){
      if(s.state==="pit"||s.state==="dead")continue;
      const d=a.g.position.distanceTo(s.g.position);
      if(d<nd){nd=d;near=s;}
    }
    if(near)a.g.lookAt(near.g.position.x,0,near.g.position.z);
    if(a.fireT<=0&&near&&nd<34){
      const T=clamp(nd/24,.32,.85);
      const dir=V3(-near.g.position.x,0,-near.g.position.z).normalize();
      const lead=near.state==="run"?near.speed*T:0;
      const target=near.g.position.clone().addScaledVector(dir,lead);
      const waveDmgMult = 1 + Math.max(0, game.wave - 1) * 0.3;
      const waveBlastMult = 1 + Math.max(0, game.wave - 1) * 0.15;
      fireBone(a.g.position.clone().add(V3(0,1.8,0)),target,{dmg:1.6*waveDmgMult,blast:3*waveBlastMult,live:true,send:game.mode==="host"});
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
}`;

  const updateAlliesNew = `function updateAllies(dt){
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
}`;

  gameJs = gameJs.replace(updateAlliesOld, updateAlliesNew);

  gameJs = gameJs.replace(
    `    updateRemotes(dt);
    if(isSim()){
      updateAllies(dt);
      updateSquirrels(dt);`,
    `    updateRemotes(dt);
    updateAllies(dt);
    if(isSim()){
      updateSquirrels(dt);`
  );

  fs.writeFileSync(gameJsPath, gameJs, 'utf8');

  setTimeout(() => {
    console.log("通信（ネットワーク）の渋滞を解消しています...");
    const netJsPath = path.join(__dirname, 'js', 'net.js');
    let netJs = fs.readFileSync(netJsPath, 'utf8');

    const gameOld = `  game(d) {
    if (!this.code || !this.myPlayerId) return;
    const db = firebase.firestore();
    const docRef = db.collection("dog_squad_rooms").doc(this.code).collection("relay").doc(this.myPlayerId);
    docRef.set({
      t: "game",
      from: this.id,
      d: d,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => {});
  },`;

    const gameNew = `  _evQueue: [],
  _snap: null,
  _pin: null,
  _sendTimer: null,
  game(d) {
    if (!this.code || !this.myPlayerId) return;
    if (d.t === "snap") this._snap = d;
    else if (d.t === "pin") this._pin = d;
    else this._evQueue.push(d);
    
    if (!this._sendTimer) {
      this._sendTimer = setTimeout(() => {
        this._sendTimer = null;
        const db = firebase.firestore();
        const docRef = db.collection("dog_squad_rooms").doc(this.code).collection("relay").doc(this.myPlayerId);
        docRef.set({
          t: "merged",
          from: this.id,
          snap: this._snap,
          pin: this._pin,
          evs: this._evQueue,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => {});
        this._evQueue = [];
      }, 100);
    }
  },`;

    netJs = netJs.replace(gameOld, gameNew);

    const relayOld = `    this.relayListener = roomRef.collection("relay").onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data();
          if (data.from !== this.id) {
            if (this.handlers["game"]) {
              this.handlers["game"]({
                t: "game",
                from: data.from,
                d: data.d
              });
            }
          }
        }
      });
    });`;

    const relayNew = `    this.relayListener = roomRef.collection("relay").onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data();
          if (data.from !== this.id) {
            if (this.handlers["game"]) {
              if (data.t === "merged") {
                if (data.snap) this.handlers["game"]({t: "game", from: data.from, d: data.snap});
                if (data.pin) this.handlers["game"]({t: "game", from: data.from, d: data.pin});
                if (data.evs) data.evs.forEach(ev => this.handlers["game"]({t: "game", from: data.from, d: ev}));
              } else {
                this.handlers["game"]({
                  t: "game",
                  from: data.from,
                  d: data.d
                });
              }
            }
          }
        }
      });
    });`;

    netJs = netJs.replace(relayOld, relayNew);

    fs.writeFileSync(netJsPath, netJs, 'utf8');
    
    setTimeout(() => {
      console.log("すべての作業が完了しました！");
    }, 1500);
  }, 1500);
}, 1000);
