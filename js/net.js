"use strict";
/* =========================================================
   NET — multiplayer client (rooms via WebSocket relay)
   ========================================================= */
const Net={
  ws:null,id:null,code:null,host:false,players:[],
  handlers:{},connected:false,

  defaultUrl(){
    if(location.hostname==="localhost"||location.hostname==="127.0.0.1"||!location.hostname){
      return "ws://localhost:3000";
    }
    // 無料の外部サーバー（例: Render等で公開したWebSocketサーバー）のURLを指定します
    return "wss://dog-squad-server.onrender.com";
  },
  connect(url){
    return new Promise((res,rej)=>{
      try{this.ws=new WebSocket(url);}catch(e){rej(e);return;}
      const to=setTimeout(()=>{try{this.ws.close();}catch(e){};rej(new Error("timeout"));},5000);
      this.ws.onopen=()=>{clearTimeout(to);this.connected=true;res();};
      this.ws.onerror=()=>{clearTimeout(to);rej(new Error("connect error"));};
      this.ws.onclose=()=>{
        this.connected=false;
        if(this.handlers.close)this.handlers.close();
      };
      this.ws.onmessage=ev=>{
        let m;try{m=JSON.parse(ev.data);}catch(e){return;}
        if(m.t==="roomed"){
          this.id=m.id;this.code=m.code;this.players=m.players;
          this.host=m.players.length&&m.players[0].id===m.id;
        }
        if(m.t==="players"){
          this.players=m.players;
          this.host=this.players.length&&this.players[0].id===this.id;
        }
        const h=this.handlers[m.t];
        if(h)h(m);
      };
    });
  },
  on(t,fn){this.handlers[t]=fn;},
  send(o){if(this.ws&&this.ws.readyState===1)this.ws.send(JSON.stringify(o));},
  game(d){this.send({t:"game",d});},
  leave(){if(this.ws){try{this.ws.close();}catch(e){}}this.ws=null;this.connected=false;this.players=[];this.code=null;}
};
