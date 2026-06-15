const fs = require('fs');
const path = require('path');

console.log("バックグラウンド処理を開始します...");

setTimeout(() => {
  console.log("ショップの品揃えと金額を変更しています...");
  
  // Update data.js
  const dataJsPath = path.join(__dirname, 'js', 'data.js');
  let dataJs = fs.readFileSync(dataJsPath, 'utf8');

  const oldUps = `const UPS={
  pow:  {label:"ほねパワー",      desc:"骨ミサイルの威力 +20%/Lv",  max:5, base:120},
  rate: {label:"れんしゃ訓練",    desc:"発射の間かく -7%/Lv",       max:5, base:120},
  bark: {label:"メガボイス",      desc:"ワン波の範囲 +8%/Lv",       max:5, base:100},
  speed:{label:"俊足トレーニング", desc:"移動スピード +6%/Lv",      max:5, base:100},
  house:{label:"犬小屋補強",      desc:"犬小屋HP +2/Lv",            max:5, base:150},
  trap: {label:"トラップ袋",      desc:"落とし穴ストック +1/Lv",    max:3, base:200},
  ally: {label:"お助けわんちゃん",  desc:"いっしょに戦うNPC犬をふやす +1/Lv", max:2, base:250}
};
const UPORDER=["pow","rate","bark","speed","house","trap","ally"];`;

  const newUps = `const UPS={
  pow:  {label:"ほねパワー",      desc:"骨ミサイルの威力 +20%/Lv",  max:5, base:160},
  rate: {label:"れんしゃ訓練",    desc:"発射の間かく -7%/Lv",       max:5, base:160},
  bark: {label:"メガボイス",      desc:"ワン波の範囲 +8%/Lv",       max:5, base:140},
  speed:{label:"俊足トレーニング", desc:"移動スピード +6%/Lv",      max:5, base:140},
  house:{label:"犬小屋補強",      desc:"犬小屋HP +2/Lv",            max:5, base:220},
  trap: {label:"トラップ袋",      desc:"落とし穴ストック +1/Lv",    max:3, base:280},
  ally: {label:"お助けわんちゃん",  desc:"いっしょに戦うNPC犬をふやす +1/Lv", max:2, base:400},
  blast:{label:"爆発トレーニング",  desc:"骨ミサイルの爆風範囲 +10%/Lv", max:4, base:180},
  combo:{label:"コンボマスター",    desc:"コンボ受付時間 +0.4秒/Lv",    max:3, base:200},
  barkCd:{label:"早吠え",          desc:"ワン波の待ち時間 -10%/Lv",    max:3, base:240}
};
const UPORDER=["pow","rate","bark","speed","house","trap","ally","blast","combo","barkCd"];`;

  dataJs = dataJs.replace(oldUps, newUps);
  fs.writeFileSync(dataJsPath, dataJs, 'utf8');

  // Update game.js
  const gameJsPath = path.join(__dirname, 'js', 'game.js');
  let gameJs = fs.readFileSync(gameJsPath, 'utf8');

  const calcOld = `    barkCd:3.2*(b.barkCd||1),
    spd:   11*(b.spd||1)*(1+.06*upLv("speed")),
    blast: 3.6*(b.blast||1),`;
  const calcNew = `    barkCd:3.2*(b.barkCd||1)*(1-.1*upLv("barkCd")),
    spd:   11*(b.spd||1)*(1+.06*upLv("speed")),
    blast: 3.6*(b.blast||1)*(1+.1*upLv("blast")),`;
  
  gameJs = gameJs.replace(calcOld, calcNew);

  const comboOld = `function addCombo(pos){
  game.combo++;game.comboT=2;
  game.maxCombo=Math.max(game.maxCombo,game.combo);`;
  const comboNew = `function addCombo(pos){
  game.combo++;game.comboT=2 + 0.4*upLv("combo");
  game.maxCombo=Math.max(game.maxCombo,game.combo);`;

  gameJs = gameJs.replace(comboOld, comboNew);
  fs.writeFileSync(gameJsPath, gameJs, 'utf8');

  setTimeout(() => {
    console.log("すべての作業が完了しました！");
  }, 1000);
}, 1000);
