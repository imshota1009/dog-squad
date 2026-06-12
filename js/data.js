"use strict";
/* =========================================================
   DOG SQUAD vs SQUIRREL INVASION — data definitions
   ========================================================= */
const rnd=(a,b)=>a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const GRAV=30;

/* ---------- difficulty ---------- */
const DIFFS={
  easy:  {label:"やさしい", desc:"はじめての おさんぽ気分",       cnt:.75, spd:.85, hp:12, acorn:1.3, coin:.7 },
  normal:{label:"ふつう",   desc:"歯ごたえバッチリの防衛戦",      cnt:1,   spd:1,   hp:10, acorn:1,   coin:1  },
  hard:  {label:"むずかしい",desc:"リスの本気。生半可じゃ守れない", cnt:1.35,spd:1.18,hp:8,  acorn:.72, coin:1.5}
};
const DIFFORDER=["easy","normal","hard"];

/* ---------- stages ---------- */
const STAGES={
  park: {label:"いつもの公園",     desc:"基本のステージ。リスの入門部隊", ground:0x7ecb5a, path:0xd8c08a, sky:0x9adcf5, music:"park"},
  beach:{label:"サンセットビーチ", desc:"ムササビ滑空部隊が来るぞ",       ground:0xeed9a4, path:0xf7ecc9, sky:0xffc88a, music:"beach"},
  snow: {label:"ゆきやま広場",     desc:"重装リスだらけの最難関",         ground:0xeef4fb, path:0xd7e4f2, sky:0xbcd7f0, music:"snow"}
};
const STAGEORDER=["park","beach","snow"];

/* ---------- enemy kinds ---------- */
const KINDS={
  norm: {hp:2, spd:[4.8,6.2], r:.65, pts:100, scale:1,   resist:1},
  scout:{hp:1, spd:[8.5,10.5],r:.5,  pts:80,  scale:.78, resist:1,  noThrow:true, zigzag:true},
  armor:{hp:4, spd:[4.2,5.2], r:.7,  pts:150, scale:1.05,resist:.85},
  tank: {hp:9, spd:[2.3,2.7], r:1.15,pts:300, scale:1.7, resist:.5, bigAcorn:true},
  flyer:{hp:2, spd:[5.2,6.4], r:.6,  pts:150, scale:.9,  resist:1,  fly:3.1, noTrap:true},
  boss: {hp:22,spd:[2.1,2.4], r:1.6, pts:1000,scale:2.5, resist:.3, bigAcorn:true}
};
const KINDORDER=["norm","scout","armor","tank","flyer","boss"];

/* ---------- waves per stage (counts BEFORE difficulty mult) ---------- */
const WAVES={
  park:[
    {mix:{norm:9, scout:3},                           int:.5 },
    {mix:{norm:9, scout:4, armor:3},                  int:.42},
    {mix:{norm:8, scout:4, armor:4, tank:1},          int:.36, boss:true}
  ],
  beach:[
    {mix:{norm:8, scout:5, flyer:2},                  int:.45},
    {mix:{norm:8, scout:5, armor:3, tank:1, flyer:3}, int:.38},
    {mix:{norm:8, scout:6, armor:4, tank:2, flyer:4}, int:.32, boss:true}
  ],
  snow:[
    {mix:{norm:8, scout:4, armor:5, flyer:3},         int:.42},
    {mix:{norm:9, scout:5, armor:5, tank:2, flyer:4}, int:.34},
    {mix:{norm:10,scout:6, armor:6, tank:2, flyer:5}, int:.3,  boss:true}
  ]
};
const BOSS_HP_BY_STAGE={park:22,beach:28,snow:36};

/* ---------- playable breeds (max 6 players) ---------- */
const BREEDS={
  shiba: {label:"柴犬ポチ",         role:"バランス型の隊長",
          body:0xe8a25a, chest:0xfff3dc, ear:"point", earCol:0xd98c3f, band:0xe74c3c},
  golden:{label:"ゴールデンのゴル", role:"れんしゃ自慢",
          body:0xe6c069, chest:0xf7e3b0, ear:"flop",  earCol:0xcfa44e, band:0x27ae60,
          dmg:.85, rate:1.35},
  dal:   {label:"ダルメシアンのダル",role:"メガボイス使い",
          body:0xf5f5f5, chest:0xffffff, ear:"flop",  earCol:0x222222, band:0x2980b9,
          spots:true, barkR:1.3, barkCd:1.3},
  corgi: {label:"コーギーのコロ",   role:"俊足アタッカー",
          body:0xf0a868, chest:0xfff3dc, ear:"point", earCol:0xe09050, band:0xf39c12,
          short:true, spd:1.3, dmg:.9},
  husky: {label:"ハスキーのハク",   role:"パワー砲手",
          body:0x95a5b8, chest:0xf2f4f7, ear:"point", earCol:0x6c7a91, band:0x8e44ad,
          dmg:1.45, rate:.78},
  pug:   {label:"パグのプー",       role:"トラップ名人",
          body:0xd7b07f, chest:0xe9d3a9, ear:"flop",  earCol:0x5c4326, band:0x16a085,
          flat:true, trap:2, blast:1.15, spd:.92}
};
const BREEDORDER=["shiba","golden","dal","corgi","husky","pug"];

/* ---------- permanent upgrades (owner's shop) ---------- */
const UPS={
  pow:  {label:"ほねパワー",      desc:"骨ミサイルの威力 +20%/Lv",  max:5, base:120},
  rate: {label:"れんしゃ訓練",    desc:"発射の間かく -7%/Lv",       max:5, base:120},
  bark: {label:"メガボイス",      desc:"ワン波の範囲 +8%/Lv",       max:5, base:100},
  speed:{label:"俊足トレーニング", desc:"移動スピード +6%/Lv",      max:5, base:100},
  house:{label:"犬小屋補強",      desc:"犬小屋HP +2/Lv",            max:5, base:150},
  trap: {label:"トラップ袋",      desc:"落とし穴ストック +1/Lv",    max:3, base:200}
};
const UPORDER=["pow","rate","bark","speed","house","trap"];
const upCost=(k,lv)=>Math.round(UPS[k].base*Math.pow(lv+1,1.6));

/* ---------- owner drop items ---------- */
const ITEMS={
  meat:  {label:"おにく! 犬小屋かいふく+3", col:0xe17055, dur:0},
  dash:  {label:"ダッシュ! 10秒",           col:0xffe34d, dur:10},
  rapid: {label:"れんしゃ! 10秒",           col:0x74b9ff, dur:10},
  mega:  {label:"メガ爆風! 10秒",           col:0xff9d2e, dur:10},
  trapup:{label:"落とし穴 +1",              col:0x8d6a4a, dur:0}
};
const ITEMORDER=["meat","dash","rapid","mega","trapup"];

/* ---------- music themes (8th-note steps, midi numbers, 0=rest) ---------- */
const MUSDEFS={
  menu:{bpm:84, inst:"triangle", drums:false,
    lead:[72,0,76,0,79,0,76,0, 72,0,76,0,81,79,0,0, 71,0,74,0,79,0,74,0, 72,0,76,0,79,0,0,0],
    bass:[48,0,0,0,52,0,0,0, 45,0,0,0,52,0,0,0, 43,0,0,0,50,0,0,0, 48,0,0,0,43,0,0,0]},
  park:{bpm:138, inst:"square", drums:true,
    lead:[76,0,76,79,81,0,79,0, 76,0,72,0,74,0,76,0, 77,0,77,81,84,0,81,0, 79,0,76,0,72,0,74,0],
    bass:[48,48,55,48,53,53,60,53, 48,48,55,48,50,50,57,50, 53,53,60,53,55,55,62,55, 48,48,55,48,43,43,50,43]},
  beach:{bpm:118, inst:"triangle", drums:true,
    lead:[79,0,0,77,76,0,72,0, 0,74,0,76,77,0,76,0, 74,0,0,72,71,0,67,0, 0,69,0,71,72,0,0,0],
    bass:[48,0,55,0,52,0,55,0, 50,0,57,0,53,0,57,0, 43,0,50,0,47,0,50,0, 48,0,55,0,52,0,55,0]},
  snow:{bpm:96, inst:"sine", drums:true,
    lead:[69,0,72,0,76,0,72,0, 69,0,71,0,72,0,0,0, 65,0,69,0,72,0,69,0, 64,0,67,0,71,0,0,0],
    bass:[45,0,0,0,52,0,0,0, 41,0,0,0,48,0,0,0, 38,0,0,0,45,0,0,0, 40,0,0,0,47,0,0,0]}
};
