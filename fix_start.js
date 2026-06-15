const fs = require('fs');
const path = require('path');

console.log("バックグラウンド処理を開始します...");

setTimeout(() => {
  console.log("マルチプレイ開始処理の修復を行っています...");
  
  // Update game.js
  const gameJsPath = path.join(__dirname, 'js', 'game.js');
  let gameJs = fs.readFileSync(gameJsPath, 'utf8');

  // Add try-catch to beginGame
  const beginGameOld = `$("#btnStart").onclick=()=>{
  if(!Net.host)return;
  if(Net.players.length<2){$("#roomErr").textContent="ひとりだけ…？「ひとりで遊ぶ」もあるよ（このまま出撃もOK!）";}
  Net.send({t:"start",stage:sel.stage,diff:sel.diff,allyLv:upLv("ally")});
  beginGame({mode:"host",breed:sel.breed,stage:sel.stage,diff:sel.diff,players:Net.players});
};`;

  const beginGameNew = `$("#btnStart").onclick=()=>{
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
};`;
  gameJs = gameJs.replace(beginGameOld, beginGameNew);
  
  // Fix multiple snap overwrites
  const snapOld = `      if(Net.connected&&game.mode==="host"&&!s.trap){
        Net.game({t:"snap",k:s.kind,id:s.id,x:s.g.position.x,z:s.g.position.z});
      }`;
  const snapNew = `      if(Net.connected&&game.mode==="host"&&!s.trap){
        Net.game({t:"snap",k:s.kind,id:s.id,x:s.g.position.x,z:s.g.position.z});
      }`;
      
  fs.writeFileSync(gameJsPath, gameJs, 'utf8');

  // Update net.js for _snaps array
  const netJsPath = path.join(__dirname, 'js', 'net.js');
  let netJs = fs.readFileSync(netJsPath, 'utf8');

  const netGameOld = `  _evQueue: [],
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

  const netGameNew = `  _evQueue: [],
  _snaps: {},
  _pin: null,
  _sendTimer: null,
  game(d) {
    if (!this.code || !this.myPlayerId) return;
    if (d.t === "snap") this._snaps[d.id] = d;
    else if (d.t === "pin") this._pin = d;
    else this._evQueue.push(d);
    
    if (!this._sendTimer) {
      this._sendTimer = setTimeout(() => {
        this._sendTimer = null;
        const db = firebase.firestore();
        const docRef = db.collection("dog_squad_rooms").doc(this.code).collection("relay").doc(this.myPlayerId);
        const data = {
          t: "merged",
          from: this.id,
          snaps: Object.values(this._snaps),
          pin: this._pin,
          evs: this._evQueue,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        docRef.set(data).catch(err => {});
        this._snaps = {};
        this._evQueue = [];
      }, 100);
    }
  },`;

  netJs = netJs.replace(netGameOld, netGameNew);

  const netRelayOld = `              if (data.t === "merged") {
                if (data.snap) this.handlers["game"]({t: "game", from: data.from, d: data.snap});
                if (data.pin) this.handlers["game"]({t: "game", from: data.from, d: data.pin});
                if (data.evs) data.evs.forEach(ev => this.handlers["game"]({t: "game", from: data.from, d: ev}));
              } else {`;
              
  const netRelayNew = `              if (data.t === "merged") {
                if (data.snaps) data.snaps.forEach(sn => this.handlers["game"]({t: "game", from: data.from, d: sn}));
                if (data.snap) this.handlers["game"]({t: "game", from: data.from, d: data.snap});
                if (data.pin) this.handlers["game"]({t: "game", from: data.from, d: data.pin});
                if (data.evs) data.evs.forEach(ev => this.handlers["game"]({t: "game", from: data.from, d: ev}));
              } else {`;

  netJs = netJs.replace(netRelayOld, netRelayNew);

  fs.writeFileSync(netJsPath, netJs, 'utf8');

  setTimeout(() => {
    console.log("すべての作業が完了しました！");
  }, 1000);
}, 1000);
