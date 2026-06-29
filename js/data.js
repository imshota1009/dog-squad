"use strict";
/* =========================================================
   DOG SQUAD: SQUIRREL SIEGE — data definitions
   ========================================================= */
const rnd=(a,b)=>a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const GRAV=30;

/* ---------- i18n ---------- */
let curLang='ja';
function T(key,vars={}){
  const d=I18N[curLang]||I18N.ja;
  let s=d[key]!==undefined?d[key]:(I18N.ja[key]||key);
  for(const k in vars)s=s.replace('{'+k+'}',vars[k]);
  return s;
}
const I18N={
  ja:{
    gameSub:"どんぐり武装のリス軍団から、わんこ隊で公園を守りぬけ！",
    coinLabel:"ほねコイン",hiscoreLabel:"ハイスコア",
    btnSolo:"ひとりで遊ぶ",btnMulti:"みんなで遊ぶ（最大6人）",btnMultiSub:"準備中",
    btnShop:"飼い主のショップ",btnSettings:"⚙ 設定",btnRanking:"🏆 ランキング",
    rankingTitle:"🏆 ランキング",rankAll:"すべて",rankLoading:"読み込み中…",rankEmpty:"まだ記録がありません",
    rankEntryLabel:"🏆 ランキングに登録しよう！",rankSubmit:"登録！",btnResRanking:"🏆 ランキング",
    ctrlText:"WASD / 矢印キー：移動　|　マウス：ねらう　|　クリック：骨ミサイル<br>SPACE：ワン!衝撃波　|　E / 右クリック：落とし穴　|　犬小屋を守れ！",
    setupTitle:"そうびを ととのえよう",pickBreed:"わんちゃんを えらぶ",
    pickStage:"ステージを えらぶ",pickDiff:"むずかしさを えらぶ",
    btnBack:"もどる",btnGo:"しゅつげき！",
    shopTitle:"飼い主のショップ — 永続パワーアップ",
    pauseTitle:"メニュー",btnResume:"ゲームにもどる",btnQuit:"あきらめる（終了）",
    quitConfirmTitle:"本当にやめる？",quitConfirmSub:"⚠️ あきらめると コインはもらえません！",
    quitConfirmYes:"やめる",quitConfirmNo:"もどる",
    resWin:"公園防衛 大成功！",resLose:"公園がリスに占領された…",
    resEndless:"WAVE {n} まで到達！",
    statLine1:"クリアタイム：{t} 秒",statLine2:"スコア：{s}　|　撃退数：{k} 匹",
    statLine3:"最大コンボ：×{c}　|　のこりHP：{h} / {m}",statLine4:"かくとく ほねコイン：+{n}",
    btnRetry:"もういちど！",btnToMenu:"メニューへ",btnToRoom:"ルームにもどる",
    resClearTime:"クリアタイム：",resSec:"秒",resScore:"スコア：",resKills:"撃退数：",resUnits:"匹",
    resCombo:"最大コンボ：×",resHp:"のこりHP：",resCoins:"かくとく ほねコイン：+",
    fsOff:"OFF にする",
    settingsTitle:"設定",langLabel:"言語 / Language",
    bgmLabel:"BGM 音量",sfxLabel:"効果音量",fsLabel:"フルスクリーン",fsOn:"ON にする",
    announceWave:"WAVE {n} 襲来!!",announceWaveSub:"リス軍団を ぜんぶ吹っとばせ！",
    announceWaveBoss:"ボスのにおいがする…！",
    allClear:"🎉 全WAVE クリア!",allClearSub:"公園を守りぬいた！",
    waveClear:"WAVE {n} クリア!",waveClearSub:"飼い主が なにか投げてくれるぞ!",
    ownerToss:"飼い主「ほら、つかえ!」",
    bossDown:"キング・どんぐり三世 げきは!!",
    bossAppear:"ボス出現!!",bossAppearSub:"キング・どんぐり三世のおでまし",
    waveClearShort:"クリア!",waveNextComing:"つぎが来るぞ…!",
    waveClearSub:"飼い主が なにか投げてくれるぞ!",
    snackTime:"おやつの時間だ！",snackTimeSub:"飼い主が口笛を吹いて全員集めた！",
    allyGotItem:"なかまが アイテムゲット!",
    trapSet:"落とし穴セット!",combo:"れんさ",homerun:"場外ホームラン!",chain:"チェイン!",
    buffDash:"ダッシュ",buffRapid:"れんしゃ",buffMega:"メガ爆風",
    menuBtn:"メニュー",
    ctrlMove:"移動",ctrlFire:"骨ミサイル",ctrlBark:"わん！衝撃波",ctrlTrap:"落とし穴",ctrlPause:"ポーズ",
    coinUnit:"コイン",
    skillClick:"クリック",skillBark:"わん！",
    webglError:"ゲーム画面(WebGL)の初期化に失敗しているため、ゲームを開始できません。ブラウザを再読み込みするか、LINEやDiscordなどのアプリ内ブラウザではなく、ChromeやSafariなどの標準ブラウザで開き直してください。",
    lobbyTitle:"みんなで遊ぶ — ルーム",
  },
  en:{
    gameSub:"Defend the park from the acorn-armed squirrel army!",
    coinLabel:"Bone Coins",hiscoreLabel:"Best",
    btnSolo:"Solo Play",btnMulti:"Multiplayer (up to 6)",btnMultiSub:"Coming Soon",
    btnShop:"Owner's Shop",btnSettings:"⚙ Settings",btnRanking:"🏆 Ranking",
    rankingTitle:"🏆 Ranking",rankAll:"All",rankLoading:"Loading…",rankEmpty:"No records yet",
    rankEntryLabel:"🏆 Register your score!",rankSubmit:"Register!",btnResRanking:"🏆 Ranking",
    ctrlText:"WASD / Arrows: Move　|　Mouse: Aim　|　Click: Bone Missile<br>SPACE: Woof Wave　|　E / Right Click: Pit Trap　|　Defend the doghouse!",
    setupTitle:"Gear Up!",pickBreed:"Choose your dog",
    pickStage:"Choose a stage",pickDiff:"Choose difficulty",
    btnBack:"Back",btnGo:"Charge!",
    shopTitle:"Owner's Shop — Permanent Upgrades",
    pauseTitle:"Menu",btnResume:"Back to Game",btnQuit:"Give Up",
    quitConfirmTitle:"Are you sure?",quitConfirmSub:"⚠️ You won't receive any coins if you quit!",
    quitConfirmYes:"Quit",quitConfirmNo:"Keep Playing",
    resWin:"Park Defended!",resLose:"The park has been overrun...",
    resEndless:"Reached WAVE {n}!",
    statLine1:"Time: {t}s",statLine2:"Score: {s}　|　Squirrels: {k}",
    statLine3:"Max Combo: ×{c}　|　HP Left: {h} / {m}",statLine4:"Bone Coins earned: +{n}",
    btnRetry:"Play Again!",btnToMenu:"Menu",btnToRoom:"Back to Room",
    resClearTime:"Time: ",resSec:"s",resScore:"Score: ",resKills:"Squirrels: ",resUnits:"",
    resCombo:"Max Combo: ×",resHp:"HP Left: ",resCoins:"Bone Coins: +",
    fsOff:"Exit",
    settingsTitle:"Settings",langLabel:"言語 / Language",
    bgmLabel:"BGM Volume",sfxLabel:"SFX Volume",fsLabel:"Fullscreen",fsOn:"Enter",
    announceWave:"WAVE {n} INCOMING!!",announceWaveSub:"Blast all the squirrels!",
    announceWaveBoss:"I smell a boss...",
    allClear:"🎉 ALL WAVES CLEARED!",allClearSub:"The park is safe!",
    waveClear:"WAVE {n} CLEAR!",waveClearSub:"The owner is throwing something!",
    ownerToss:"Owner: \"Here, use this!\"",
    bossDown:"King Acorn III is down!!",
    bossAppear:"BOSS INCOMING!!",bossAppearSub:"King Acorn III has arrived!",
    waveClearShort:"CLEAR!",waveNextComing:"The next wave is coming...",
    waveClearSub:"The owner is throwing something!",
    snackTime:"Snack time!",snackTimeSub:"The owner whistled and gathered everyone!",
    allyGotItem:"Ally grabbed an item!",
    trapSet:"Pit Trap Set!",combo:"Chain",homerun:"OUT OF THE PARK!",chain:"Chain!",
    buffDash:"Dash",buffRapid:"Rapid",buffMega:"Mega Blast",
    menuBtn:"Menu",
    ctrlMove:"Move",ctrlFire:"Bone Missile",ctrlBark:"Woof Wave",ctrlTrap:"Pit Trap",ctrlPause:"Pause",
    coinUnit:"Coins",
    skillClick:"Click",skillBark:"Woof!",
    webglError:"WebGL initialization failed. Please reload the page or open in Chrome/Safari instead of an in-app browser (LINE, Discord, etc).",
    lobbyTitle:"Multiplayer — Room",
  }
};

/* ---------- difficulty ---------- */
const DIFFS={
  easy:  {label:"やさしい", label_en:"Easy",    desc:"はじめての おさんぽ気分",       desc_en:"A relaxing walk in the park",    cnt:.75, spd:.85, hp:12, acorn:1.3, coin:.7,  maxWave:12},
  normal:{label:"ふつう",   label_en:"Normal",  desc:"歯ごたえバッチリの防衛戦",      desc_en:"A proper challenge",             cnt:1,   spd:1,   hp:10, acorn:1,   coin:1,   maxWave:12},
  hard:  {label:"むずかしい",label_en:"Hard",   desc:"リスの本気。生半可じゃ守れない", desc_en:"Squirrels at full strength!",    cnt:1.35,spd:1.18,hp:8,  acorn:.72, coin:1.5, maxWave:12},
  endless:{label:"エンドレス",label_en:"Endless",desc:"終わりなき戦い。どこまで耐えられる？",desc_en:"How long can you last?", cnt:1.1,spd:1.05,hp:10, acorn:.9, coin:1.8, maxWave:0 }
};
const DIFFORDER=["easy","normal","hard","endless"];

/* ---------- stages ---------- */
const STAGES={
  park: {label:"いつもの公園",     label_en:"City Park",       desc:"基本のステージ。リスの入門部隊", desc_en:"The basic stage. Rookie squirrels.", ground:0x7ecb5a, path:0xd8c08a, sky:0x9adcf5, music:"park"},
  beach:{label:"サンセットビーチ", label_en:"Sunset Beach",    desc:"ムササビ滑空部隊が来るぞ",       desc_en:"Watch out for gliding squirrels!",  ground:0xc9a96e, path:0xdbb878, sky:0xe8894a, music:"beach"},
  snow: {label:"ゆきやま広場",     label_en:"Snowy Mountain",  desc:"重装リスだらけの最難関",         desc_en:"The toughest stage. Heavy armor!",  ground:0xc8d8e8, path:0xb0c4d8, sky:0x7aaac8, music:"snow"}
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
    {mix:{norm:9,  scout:3},                              int:.50},
    {mix:{norm:9,  scout:4,  armor:3},                    int:.44},
    {mix:{norm:8,  scout:4,  armor:4,  tank:1},           int:.38, boss:true},
    {mix:{norm:11, scout:5,  armor:5},                    int:.36},
    {mix:{norm:11, scout:6,  armor:5,  tank:2},           int:.33, boss:true},
    {mix:{norm:12, scout:7,  armor:6,  tank:2, flyer:3},  int:.30},
    {mix:{norm:13, scout:7,  armor:7,  tank:3, flyer:4},  int:.28},
    {mix:{norm:13, scout:8,  armor:8,  tank:3, flyer:4},  int:.26, boss:true},
    {mix:{norm:14, scout:9,  armor:9,  tank:4, flyer:5},  int:.24},
    {mix:{norm:15, scout:10, armor:9,  tank:5, flyer:6},  int:.22},
    {mix:{norm:16, scout:11, armor:10, tank:5, flyer:7},  int:.20},
    {mix:{norm:18, scout:12, armor:12, tank:6, flyer:8},  int:.18, boss:true}
  ],
  beach:[
    {mix:{norm:8,  scout:5,  flyer:2},                    int:.45},
    {mix:{norm:8,  scout:5,  armor:3,  tank:1, flyer:3},  int:.39},
    {mix:{norm:8,  scout:6,  armor:4,  tank:2, flyer:4},  int:.34, boss:true},
    {mix:{norm:10, scout:6,  armor:4,  tank:2, flyer:4},  int:.32},
    {mix:{norm:11, scout:7,  armor:5,  tank:3, flyer:5},  int:.30, boss:true},
    {mix:{norm:12, scout:7,  armor:6,  tank:3, flyer:6},  int:.28},
    {mix:{norm:12, scout:8,  armor:7,  tank:4, flyer:6},  int:.26},
    {mix:{norm:13, scout:9,  armor:8,  tank:4, flyer:7},  int:.24, boss:true},
    {mix:{norm:14, scout:9,  armor:9,  tank:5, flyer:8},  int:.22},
    {mix:{norm:15, scout:10, armor:10, tank:5, flyer:9},  int:.20},
    {mix:{norm:16, scout:11, armor:11, tank:6, flyer:10}, int:.18},
    {mix:{norm:18, scout:13, armor:13, tank:7, flyer:12}, int:.16, boss:true}
  ],
  snow:[
    {mix:{norm:8,  scout:4,  armor:5,  flyer:3},          int:.42},
    {mix:{norm:9,  scout:5,  armor:5,  tank:2, flyer:4},  int:.36},
    {mix:{norm:10, scout:6,  armor:6,  tank:2, flyer:5},  int:.31, boss:true},
    {mix:{norm:11, scout:6,  armor:7,  tank:3, flyer:5},  int:.29},
    {mix:{norm:12, scout:7,  armor:7,  tank:3, flyer:6},  int:.27, boss:true},
    {mix:{norm:12, scout:8,  armor:8,  tank:4, flyer:6},  int:.25},
    {mix:{norm:13, scout:8,  armor:9,  tank:4, flyer:7},  int:.23},
    {mix:{norm:14, scout:9,  armor:10, tank:5, flyer:7},  int:.21, boss:true},
    {mix:{norm:15, scout:10, armor:11, tank:5, flyer:8},  int:.20},
    {mix:{norm:16, scout:11, armor:12, tank:6, flyer:9},  int:.18},
    {mix:{norm:17, scout:12, armor:13, tank:6, flyer:10}, int:.17},
    {mix:{norm:20, scout:14, armor:15, tank:8, flyer:12}, int:.15, boss:true}
  ]
};
const BOSS_HP_BY_STAGE={park:22,beach:28,snow:36};

/* ---------- playable breeds (max 6 players) ---------- */
const BREEDS={
  shiba: {label:"柴犬ポチ",          label_en:"Shiba Pochi",   role:"バランス型の隊長",  role_en:"Balanced Leader",
          body:0xe8a25a, chest:0xfff3dc, ear:"point", earCol:0xd98c3f, band:0xe74c3c},
  golden:{label:"ゴールデンのゴル",  label_en:"Golden Gol",    role:"れんしゃ自慢",      role_en:"Rapid Gunner",
          body:0xe6c069, chest:0xf7e3b0, ear:"flop",  earCol:0xcfa44e, band:0x27ae60,
          dmg:.85, rate:1.35},
  dal:   {label:"ダルメシアンのダル",label_en:"Dalmatian Dal", role:"メガボイス使い",    role_en:"Mega Howler",
          body:0xf5f5f5, chest:0xffffff, ear:"flop",  earCol:0x222222, band:0x2980b9,
          spots:true, barkR:1.3, barkCd:1.3},
  corgi: {label:"コーギーのコロ",    label_en:"Corgi Koro",    role:"俊足アタッカー",   role_en:"Speed Runner",
          body:0xf0a868, chest:0xfff3dc, ear:"point", earCol:0xe09050, band:0xf39c12,
          short:true, spd:1.3, dmg:.9},
  husky: {label:"ハスキーのハク",    label_en:"Husky Haku",    role:"パワー砲手",        role_en:"Power Cannon",
          body:0x95a5b8, chest:0xf2f4f7, ear:"point", earCol:0x6c7a91, band:0x8e44ad,
          dmg:1.45, rate:.78},
  pug:   {label:"パグのプー",        label_en:"Pug Poo",        role:"トラップ名人",      role_en:"Trap Expert",
          body:0xd7b07f, chest:0xe9d3a9, ear:"flop",  earCol:0x5c4326, band:0x16a085,
          flat:true, trap:2, blast:1.15, spd:.92}
};
const BREEDORDER=["shiba","golden","dal","corgi","husky","pug"];

/* ---------- permanent upgrades (owner's shop) ---------- */
const UPS={
  pow:  {label:"ほねパワー",       label_en:"Bone Power",      desc:"骨ミサイルの威力 +20%/Lv",           desc_en:"Missile damage +20%/Lv",      max:5, base:160},
  rate: {label:"れんしゃ訓練",     label_en:"Fire Training",   desc:"発射の間かく -7%/Lv",               desc_en:"Fire interval -7%/Lv",        max:5, base:160},
  bark: {label:"メガボイス",       label_en:"Mega Voice",      desc:"ワン波の範囲 +8%/Lv",               desc_en:"Bark range +8%/Lv",           max:5, base:140},
  speed:{label:"俊足トレーニング",  label_en:"Speed Training",  desc:"移動スピード +6%/Lv",               desc_en:"Move speed +6%/Lv",           max:5, base:140},
  house:{label:"犬小屋補強",       label_en:"Doghouse Upgrade",desc:"犬小屋HP +2/Lv",                    desc_en:"Doghouse HP +2/Lv",           max:5, base:220},
  trap: {label:"トラップ袋",       label_en:"Trap Bag",        desc:"落とし穴ストック +1/Lv",             desc_en:"Pit trap stock +1/Lv",        max:3, base:280},
  ally: {label:"お助けわんちゃん", label_en:"NPC Dogs",        desc:"いっしょに戦うNPC犬をふやす +1/Lv",  desc_en:"Ally NPC dogs +1/Lv",         max:2, base:400},
  blast:{label:"爆発トレーニング",  label_en:"Blast Training",  desc:"骨ミサイルの爆風範囲 +10%/Lv",       desc_en:"Explosion radius +10%/Lv",    max:4, base:180},
  combo:{label:"コンボマスター",   label_en:"Combo Master",    desc:"コンボ受付時間 +0.4秒/Lv",           desc_en:"Combo window +0.4s/Lv",       max:3, base:200},
  barkCd:{label:"早吠え",         label_en:"Quick Bark",       desc:"ワン波の待ち時間 -10%/Lv",           desc_en:"Bark cooldown -10%/Lv",       max:3, base:240}
};
const UPORDER=["pow","rate","bark","speed","house","trap","ally","blast","combo","barkCd"];
const upCost=(k,lv)=>Math.round(UPS[k].base*Math.pow(lv+1,2.1));

/* ---------- skins ---------- */
const SKINS={
  shiba:[
    {id:"shiba_snow",   label:"snow (雪柴)",    label_en:"Snow",    body:0xf0ede6, chest:0xffffff, band:0x5b8dd9, cost:5000,  rarity:"common"},
    {id:"shiba_kuro",   label:"kuro (黒柴)",    label_en:"Kuro",    body:0x2d2d2d, chest:0x5a5a5a, band:0xe74c3c, cost:7000,  rarity:"common"},
    {id:"shiba_sakura", label:"sakura (さくら柴)",label_en:"Sakura", body:0xf9b8c4, chest:0xfde8ea, band:0xff69b4, cost:12000, rarity:"rare"},
    {id:"shiba_ocean",  label:"ocean (オーシャン)",label_en:"Ocean", body:0x1a4a6b, chest:0x4a8ab0, band:0xffe34d, cost:15000, rarity:"rare"},
    {id:"shiba_galaxy", label:"galaxy (ギャラクシー)",label_en:"Galaxy",body:0x1a0a3d,chest:0x4a2090,band:0x00ffcc,cost:25000,rarity:"epic"},
    {id:"shiba_entei",  label:"炎帝 (えんてい)",label_en:"Inferno Emperor",body:0x8b0000,chest:0xff4500,band:0xffd700,cost:30000,rarity:"legendary"},
  ],
  golden:[
    {id:"golden_cream",  label:"cream (クリーム)",  label_en:"Cream",    body:0xfdf5dc, chest:0xffffff, band:0xe74c3c, cost:5000,  rarity:"common"},
    {id:"golden_choco",  label:"choco (チョコ)",    label_en:"Choco",    body:0x7b4a2d, chest:0xb07d56, band:0x27ae60, cost:8000,  rarity:"common"},
    {id:"golden_midnight",label:"midnight (ミッドナイト)",label_en:"Midnight",body:0x1a1a2e,chest:0x16213e,band:0xffd700,cost:12000,rarity:"rare"},
    {id:"golden_rose",   label:"rose (ローズ)",     label_en:"Rose",     body:0xe8a0b4, chest:0xfde8f0, band:0x9b59b6, cost:16000, rarity:"rare"},
    {id:"golden_aurora", label:"aurora (オーロラ)", label_en:"Aurora",   body:0x0d3b4a, chest:0x1a6b7a, band:0xff6ec7, cost:26000, rarity:"epic"},
    {id:"golden_angel",  label:"天使 (エンジェル)",label_en:"Angel",    body:0xfff8e7, chest:0xffffff, band:0xffd700, cost:30000, rarity:"legendary"},
  ],
  dal:[
    {id:"dal_night",   label:"night (ナイト版)",  label_en:"Night",    body:0x1e1e2e, chest:0x383860, band:0xff6b6b, cost:5000,  rarity:"common"},
    {id:"dal_tan",     label:"tan (タン)",        label_en:"Tan",      body:0xd4a574, chest:0xf5e6d3, band:0x2980b9, cost:7000,  rarity:"common"},
    {id:"dal_gold",    label:"gold (ゴールド版)", label_en:"Gold",     body:0xd4a017, chest:0xffe980, band:0x8e44ad, cost:14000, rarity:"rare"},
    {id:"dal_neon",    label:"neon (ネオン)",     label_en:"Neon",     body:0x0d0d0d, chest:0x1a1a1a, band:0x39ff14, cost:18000, rarity:"rare"},
    {id:"dal_prism",   label:"prism (プリズム)",  label_en:"Prism",    body:0x2d0a4e, chest:0x5a1a8a, band:0xff00ff, cost:27000, rarity:"epic"},
    {id:"dal_phantom", label:"ファントム",       label_en:"Phantom",  body:0x0a0a0a, chest:0x1a1a2e, band:0xcc00ff, cost:30000, rarity:"legendary"},
  ],
  corgi:[
    {id:"corgi_sakura", label:"sakura (さくら)",   label_en:"Sakura",   body:0xf9c6c9, chest:0xfde8ea, band:0xc0392b, cost:5000,  rarity:"common"},
    {id:"corgi_smoky",  label:"smoky (スモーキー)",label_en:"Smoky",    body:0x8a8a8a, chest:0xd6d6d6, band:0xf39c12, cost:6000,  rarity:"common"},
    {id:"corgi_mint",   label:"mint (ミント)",     label_en:"Mint",     body:0x7ec8a0, chest:0xc8f0dc, band:0x2c3e50, cost:13000, rarity:"rare"},
    {id:"corgi_lava",   label:"lava (ラバ)",       label_en:"Lava",     body:0x8b1a1a, chest:0xd44000, band:0xffd700, cost:16000, rarity:"rare"},
    {id:"corgi_crystal",label:"crystal (クリスタル)",label_en:"Crystal", body:0xa0d8ef, chest:0xe0f4ff, band:0x7b2fff, cost:25000, rarity:"epic"},
    {id:"corgi_thunder",label:"サンダー",         label_en:"Thunder",  body:0x2c2c5a, chest:0x4a4a8a, band:0xffff00, cost:30000, rarity:"legendary"},
  ],
  husky:[
    {id:"husky_dark",  label:"dark (ダーク)",    label_en:"Dark",     body:0x2c2c2c, chest:0xf2f4f7, band:0x9b59b6, cost:5000,  rarity:"common"},
    {id:"husky_ember", label:"ember (エンバー)", label_en:"Ember",    body:0xc0392b, chest:0xf5b7b1, band:0xf1c40f, cost:8000,  rarity:"common"},
    {id:"husky_arctic",label:"arctic (アークティック)",label_en:"Arctic",body:0xe8f4fd,chest:0xffffff,band:0x00bcd4,cost:14000, rarity:"rare"},
    {id:"husky_storm", label:"storm (ストーム)", label_en:"Storm",    body:0x2c3e50, chest:0x4a6fa5, band:0xe74c3c, cost:17000, rarity:"rare"},
    {id:"husky_void",  label:"void (ヴォイド)",  label_en:"Void",     body:0x050510, chest:0x0a0a20, band:0x6600ff, cost:28000, rarity:"epic"},
    {id:"husky_iceking",label:"アイスキング",    label_en:"Ice King", body:0xd0eaff, chest:0xf0f8ff, band:0x00cfff, cost:30000, rarity:"legendary"},
  ],
  pug:[
    {id:"pug_dark",   label:"dark (ブラックパグ)",label_en:"Dark Pug",body:0x1c1c1c, chest:0x3d3d3d, band:0x1abc9c, cost:5000,  rarity:"common"},
    {id:"pug_pink",   label:"pink (ピンクパグ)", label_en:"Pink Pug", body:0xf4a7b9, chest:0xfde8f0, band:0x9b59b6, cost:7000,  rarity:"common"},
    {id:"pug_tiger",  label:"tiger (タイガー)",  label_en:"Tiger",    body:0xe8821a, chest:0xffd080, band:0x2c2c2c, cost:13000, rarity:"rare"},
    {id:"pug_jade",   label:"jade (ジェイド)",   label_en:"Jade",     body:0x0a4a3a, chest:0x1a8a6a, band:0xffe34d, cost:16000, rarity:"rare"},
    {id:"pug_cosmic", label:"cosmic (コズミック)",label_en:"Cosmic",   body:0x0d0520, chest:0x2a0a50, band:0xff4dff, cost:25000, rarity:"epic"},
    {id:"pug_emperor",label:"パグ皇帝",         label_en:"Pug Emperor",body:0x4a0a0a,chest:0x8b0000,band:0xffd700,cost:30000, rarity:"legendary"},
  ],
};

const COSTUMES=[
  {id:"flameCape", label:"炎帝のマント", label_en:"Inferno Cape", cost:15000, rarity:"epic", costume:"flameCape", desc:"背中に炎のマントと頭に王冠を装備します。", desc_en:"Equip an inferno cape and golden crown."},
  {id:"angelWings", label:"天使の翼", label_en:"Angel Wings", cost:20000, rarity:"legendary", costume:"angelWings", desc:"背中に白い翼と頭に光の輪を装備します。", desc_en:"Equip angelic wings and a shining halo."},
  {id:"phantomCloak", label:"ファントムケープ", label_en:"Phantom Cloak", cost:18000, rarity:"epic", costume:"phantomCloak", desc:"闇のケープと仮面を装備します。", desc_en:"Equip a dark phantom cloak and mask."},
  {id:"thunderHorns", label:"サンダーホーン", label_en:"Thunder Horns", cost:12000, rarity:"rare", costume:"thunderHorns", desc:"頭に雷のツノを装備します。", desc_en:"Equip lightning horns and band."},
  {id:"iceCrown", label:"氷雪の王冠", label_en:"Ice Crown", cost:15000, rarity:"epic", costume:"iceCrown", desc:"頭に氷の結晶の王冠を装備します。", desc_en:"Equip an ice crystal crown and shards."},
  {id:"emperorCrown", label:"皇帝の王冠", label_en:"Emperor Crown", cost:25000, rarity:"legendary", costume:"emperorCrown", desc:"赤い高貴なマントと宝石付きの王冠を装備します。", desc_en:"Equip a royal red cape and jeweled crown."}
];

const EFFECTS=[
  {id:"fire", label:"烈火の足跡", label_en:"Fire Trail", cost:10000, rarity:"epic", effect:"fire", desc:"走ると足元から炎が噴き出します。", desc_en:"Spawn fire particles when you move."},
  {id:"holy", label:"光のオーラ", label_en:"Holy Trail", cost:15000, rarity:"legendary", effect:"holy", desc:"体から聖なる光とキラキラが出ます。", desc_en:"Spawn holy light and sparkles when you move."},
  {id:"shadow", label:"常闇の霧", label_en:"Shadow Trail", cost:8000, rarity:"rare", effect:"shadow", desc:"足元に紫の闇のモヤが出ます。", desc_en:"Spawn dark shadow mist when you move."},
  {id:"lightning", label:"迅雷의火花", label_en:"Lightning Trail", cost:12000, rarity:"epic", effect:"lightning", desc:"走ると足元で火花と雷が弾けます。", desc_en:"Spawn electric sparks and bolts when you move."},
  {id:"frost", label:"永久氷晶", label_en:"Frost Trail", cost:10000, rarity:"epic", effect:"frost", desc:"歩いた後に氷の結晶が舞います。", desc_en:"Spawn freezing ice shards when you move."},
  {id:"golden", label:"黄金の輝き", label_en:"Golden Trail", cost:20000, rarity:"legendary", effect:"golden", desc:"走ると眩い金の粒子が降り注ぎます。", desc_en:"Spawn sparkling golden dust when you move."}
];

/* ---------- weekly sale ---------- */
function getSaleMap(){
  const week=Math.floor(Date.now()/(7*24*60*60*1000));
  // collect all skins
  const all=[];
  for(const b of BREEDORDER)for(const s of SKINS[b])all.push(s.id);
  // simple LCG seeded by week
  let seed=week*1664525+1013904223;
  const next=()=>{seed=(seed*1664525+1013904223)&0x7fffffff;return seed;};
  const picked=new Set();
  while(picked.size<3){
    const idx=next()%all.length;
    picked.add(all[Math.abs(idx)]);
  }
  const map={};
  for(const id of picked)map[id]=0.6; // 40% off
  return map;
}

/* ---------- owner drop items ---------- */
const ITEMS={
  meat:  {label:"おにく! 犬小屋かいふく+3", label_en:"Meat! HP +3",       col:0xe17055, dur:0},
  dash:  {label:"ダッシュ! 10秒",           label_en:"Dash! 10s",         col:0xffe34d, dur:10},
  rapid: {label:"れんしゃ! 10秒",           label_en:"Rapid Fire! 10s",   col:0x74b9ff, dur:10},
  mega:  {label:"メガ爆風! 10秒",           label_en:"Mega Blast! 10s",   col:0xff9d2e, dur:10},
  trapup:{label:"落とし穴 +1",              label_en:"Pit Trap +1",       col:0x8d6a4a, dur:0}
};
const ITEMORDER=["meat","dash","rapid","mega","trapup"];

/* ---------- music themes (8th-note steps, midi numbers, 0=rest) ---------- */
const MUSDEFS={
  menu:{bpm:84, inst:"triangle", drums:false,
    lead:[72,0,76,0,79,0,76,0, 72,0,76,0,81,79,0,0, 71,0,74,0,79,0,74,0, 72,0,76,0,79,0,0,0],
    bass:[48,0,0,0,52,0,0,0, 45,0,0,0,52,0,0,0, 43,0,0,0,50,0,0,0, 48,0,0,0,43,0,0,0]},
  park:{bpm:146, inst:"square", drums:true,
    lead:[76,79,81,0,84,0,81,79, 76,0,74,76,79,0,76,0, 81,84,86,0,88,0,86,84, 81,0,79,0,76,74,72,0,
          74,76,79,0,81,0,79,76, 74,0,72,0,74,76,0,0, 79,81,84,0,86,84,81,0, 79,0,76,74,72,0,0,0],
    bass:[48,48,55,48,53,53,60,53, 48,48,55,48,50,50,57,50, 53,53,60,53,55,55,62,55, 48,48,55,48,43,43,50,43,
          45,45,52,45,48,48,55,48, 43,43,50,43,48,48,55,48, 53,53,60,53,50,50,57,50, 48,48,55,48,48,48,43,43]},
  beach:{bpm:112, inst:"triangle", drums:true,
    lead:[72,0,0,74,76,0,79,0, 81,0,79,0,76,0,74,0, 72,0,0,74,76,0,81,0, 84,0,81,79,76,0,0,0,
          79,0,0,81,84,0,86,0, 84,0,81,0,79,0,76,0, 74,0,0,72,74,0,76,0, 79,0,76,74,72,0,0,0],
    bass:[48,0,55,0,48,0,55,0, 52,0,55,0,52,0,55,0, 50,0,57,0,50,0,57,0, 53,0,57,0,53,0,57,0,
          45,0,52,0,45,0,52,0, 48,0,55,0,48,0,55,0, 50,0,57,0,53,0,57,0, 48,0,55,0,48,0,52,0]},
  snow:{bpm:88, inst:"sine", drums:true,
    lead:[72,0,76,0,79,0,84,0, 83,0,79,0,76,0,0,0, 71,0,74,0,79,0,83,0, 84,0,79,0,76,0,0,0,
          69,0,72,0,76,0,81,0, 79,0,76,0,72,0,0,0, 67,0,71,0,74,0,79,0, 76,0,72,0,69,0,0,0],
    bass:[48,0,0,52,55,0,0,0, 45,0,0,48,52,0,0,0, 43,0,0,47,50,0,0,0, 48,0,0,52,55,0,0,0,
          45,0,0,48,52,0,0,0, 48,0,0,52,55,0,0,0, 43,0,0,47,50,0,0,0, 48,0,0,52,48,0,0,0]}
};
