"use strict";
/* =========================================================
   NET — multiplayer client (Firebase Firestore version)
   ========================================================= */
const Net = {
  id: null,
  code: null,
  host: false,
  players: [],
  handlers: {},
  connected: false,
  roomListener: null,
  relayListener: null,
  myPlayerId: null,

  defaultUrl() {
    return "";
  },

  async connect(url) {
    if (!firebase.auth().currentUser) {
      await firebase.auth().signInAnonymously();
    }
    this.connected = true;
    return Promise.resolve();
  },

  on(t, fn) {
    this.handlers[t] = fn;
  },

  async send(o) {
    const db = firebase.firestore();
    const myUid = firebase.auth().currentUser.uid;

    if (o.t === "create") {
      const code = this.generateCode();
      this.code = code;
      this.id = 1;
      this.myPlayerId = "1";
      this.host = true;

      const pInfo = { id: 1, name: o.name || "イヌ", breed: "shiba", uid: myUid };
      this.players = [pInfo];

      const roomRef = db.collection("dog_squad_rooms").doc(code);
      await roomRef.set({
        code: code,
        started: false,
        stage: "park",
        diff: "normal",
        players: this.players,
        hostUid: myUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.listenToRoom(code);

      if (this.handlers["roomed"]) {
        this.handlers["roomed"]({
          t: "roomed",
          code: code,
          id: 1,
          players: this.players
        });
      }
    }
    else if (o.t === "join") {
      const code = String(o.code).toUpperCase();
      const roomRef = db.collection("dog_squad_rooms").doc(code);
      const snap = await roomRef.get();

      if (!snap.exists) {
        if (this.handlers["err"]) this.handlers["err"]({ t: "err", msg: "ルームが見つかりません" });
        return;
      }

      const data = snap.data();
      if (data.started) {
        if (this.handlers["err"]) this.handlers["err"]({ t: "err", msg: "ゲームはもう始まっています" });
        return;
      }
      if (data.players.length >= 6) {
        if (this.handlers["err"]) this.handlers["err"]({ t: "err", msg: "ルームが満員です(最大6人)" });
        return;
      }

      const existingIds = data.players.map(p => p.id);
      let nextId = 1;
      while (existingIds.includes(nextId)) nextId++;

      this.code = code;
      this.id = nextId;
      this.myPlayerId = String(nextId);
      this.host = false;

      const newPlayer = { id: nextId, name: o.name || "イヌ", breed: "shiba", uid: myUid };
      const updatedPlayers = [...data.players, newPlayer];

      await roomRef.update({
        players: updatedPlayers
      });

      this.players = updatedPlayers;
      this.listenToRoom(code);

      if (this.handlers["roomed"]) {
        this.handlers["roomed"]({
          t: "roomed",
          code: code,
          id: nextId,
          players: updatedPlayers
        });
      }
    }
    else if (o.t === "breed") {
      if (!this.code) return;
      const roomRef = db.collection("dog_squad_rooms").doc(this.code);
      db.runTransaction(async (transaction) => {
        const snap = await transaction.get(roomRef);
        if (!snap.exists) return;
        const data = snap.data();
        const players = data.players.map(p => {
          if (p.id === this.id) {
            p.breed = o.breed;
          }
          return p;
        });
        transaction.update(roomRef, { players });
      });
    }
    else if (o.t === "cfg") {
      if (!this.code) return;
      const roomRef = db.collection("dog_squad_rooms").doc(this.code);
      await roomRef.update({
        stage: o.stage,
        diff: o.diff
      });
    }
    else if (o.t === "start") {
      if (!this.code) return;
      const roomRef = db.collection("dog_squad_rooms").doc(this.code);
      await roomRef.update({
        started: true,
        stage: o.stage,
        diff: o.diff
      });
    }
  },

  game(d) {
    if (!this.code || !this.myPlayerId) return;
    const db = firebase.firestore();
    const docRef = db.collection("dog_squad_rooms").doc(this.code).collection("relay").doc(this.myPlayerId);
    docRef.set({
      t: "game",
      from: this.id,
      d: d,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => {});
  },

  leave() {
    this.stopListening();
    if (this.code && this.id) {
      const code = this.code;
      const id = this.id;
      const db = firebase.firestore();
      const roomRef = db.collection("dog_squad_rooms").doc(code);

      db.runTransaction(async (transaction) => {
        const snap = await transaction.get(roomRef);
        if (!snap.exists) return;
        const data = snap.data();
        const updatedPlayers = data.players.filter(p => p.id !== id);
        if (updatedPlayers.length === 0) {
          transaction.delete(roomRef);
        } else {
          transaction.update(roomRef, { players: updatedPlayers });
        }
      }).catch(e => {});
    }

    this.connected = false;
    this.players = [];
    this.code = null;
    this.id = null;
    this.myPlayerId = null;
  },

  listenToRoom(code) {
    this.stopListening();
    const db = firebase.firestore();
    const roomRef = db.collection("dog_squad_rooms").doc(code);

    this.roomListener = roomRef.onSnapshot(snap => {
      if (!snap.exists) {
        if (this.handlers["close"]) this.handlers["close"]();
        return;
      }
      const data = snap.data();

      if (this.handlers["cfg"]) {
        this.handlers["cfg"]({ t: "cfg", stage: data.stage, diff: data.diff });
      }

      this.players = data.players;
      this.host = data.players.length && data.players[0].id === this.id;
      if (this.handlers["players"]) {
        this.handlers["players"]({ t: "players", players: data.players });
      }

      if (data.started) {
        if (this.handlers["start"]) {
          this.handlers["start"]({
            t: "start",
            stage: data.stage,
            diff: data.diff,
            players: data.players
          });
        }
      }
    });

    this.relayListener = roomRef.collection("relay").onSnapshot(snap => {
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
    });
  },

  stopListening() {
    if (this.roomListener) {
      this.roomListener();
      this.roomListener = null;
    }
    if (this.relayListener) {
      this.relayListener();
      this.relayListener = null;
    }
  },

  generateCode() {
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c = "";
    for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
    return c;
  }
};
