"use strict";
/* =========================================================
   DOG SQUAD vs SQUIRREL INVASION — room server
   serves the static game + relays multiplayer messages
   usage: npm install && npm start   (default port 3000)
   ========================================================= */
const http=require("http");
const fs=require("fs");
const path=require("path");
const {WebSocketServer}=require("ws");

const PORT=process.env.PORT||3000;
const MAXP=6;
const MIME={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".ico":"image/x-icon"};

const server=http.createServer((req,res)=>{
  let p=req.url.split("?")[0];
  if(p==="/")p="/index.html";
  const file=path.join(__dirname,path.normalize(p).replace(/^(\.\.[\/\\])+/,""));
  if(!file.startsWith(__dirname)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end("not found");return;}
    res.writeHead(200,{"Content-Type":(MIME[path.extname(file)]||"application/octet-stream")+"; charset=utf-8"});
    res.end(data);
  });
});

const wss=new WebSocketServer({server});
const rooms=new Map(); // code -> {clients:[{id,ws,name,breed}], started}
let nextId=1;

const code4=()=>{
  const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c="";for(let i=0;i<4;i++)c+=A[Math.floor(Math.random()*A.length)];
  return rooms.has(c)?code4():c;
};
const playersOf=r=>r.clients.map(c=>({id:c.id,name:c.name,breed:c.breed}));
const bcast=(r,o,except)=>{
  const s=JSON.stringify(o);
  r.clients.forEach(c=>{if(c.ws.readyState===1&&c.id!==except)c.ws.send(s);});
};

wss.on("connection",ws=>{
  const me={id:nextId++,ws,name:"イヌ",breed:"shiba",room:null};
  ws.on("message",raw=>{
    let m;try{m=JSON.parse(raw);}catch(e){return;}
    const r=me.room?rooms.get(me.room):null;
    switch(m.t){
      case "create":{
        me.name=String(m.name||"イヌ").slice(0,10);
        const code=code4();
        rooms.set(code,{clients:[me],started:false});
        me.room=code;
        ws.send(JSON.stringify({t:"roomed",code,id:me.id,players:playersOf(rooms.get(code))}));
        break;
      }
      case "join":{
        me.name=String(m.name||"イヌ").slice(0,10);
        const room=rooms.get(String(m.code||"").toUpperCase());
        if(!room){ws.send(JSON.stringify({t:"err",msg:"ルームが見つかりません"}));break;}
        if(room.clients.length>=MAXP){ws.send(JSON.stringify({t:"err",msg:"ルームが満員です(最大6人)"}));break;}
        if(room.started){ws.send(JSON.stringify({t:"err",msg:"ゲームはもう始まっています"}));break;}
        room.clients.push(me);me.room=String(m.code).toUpperCase();
        ws.send(JSON.stringify({t:"roomed",code:me.room,id:me.id,players:playersOf(room)}));
        bcast(room,{t:"players",players:playersOf(room)},me.id);
        break;
      }
      case "breed":{
        if(!r)break;
        me.breed=String(m.breed||"shiba");
        bcast(r,{t:"players",players:playersOf(r)});
        break;
      }
      case "cfg":{ // host -> all
        if(!r||r.clients[0]!==me)break;
        bcast(r,{t:"cfg",stage:m.stage,diff:m.diff},me.id);
        break;
      }
      case "start":{
        if(!r||r.clients[0]!==me)break;
        r.started=true;
        bcast(r,{t:"start",stage:m.stage,diff:m.diff,players:playersOf(r)});
        break;
      }
      case "game":{ // relay to everyone else in room
        if(!r)break;
        bcast(r,{t:"game",from:me.id,d:m.d},me.id);
        break;
      }
    }
  });
  ws.on("close",()=>{
    if(!me.room)return;
    const r=rooms.get(me.room);
    if(!r)return;
    r.clients=r.clients.filter(c=>c!==me);
    if(r.clients.length===0){rooms.delete(me.room);return;}
    bcast(r,{t:"players",players:playersOf(r)});
    bcast(r,{t:"pleave",id:me.id});
  });
});

server.listen(PORT,()=>{
  console.log("DOG SQUAD server running:");
  console.log("  http://localhost:"+PORT);
  console.log("  (LANのほかのPCからは http://<このPCのIP>:"+PORT+" )");
});
