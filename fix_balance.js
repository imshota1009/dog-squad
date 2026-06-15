const fs = require('fs');
const path = require('path');

console.log("バックグラウンド処理を開始します...");

setTimeout(() => {
  console.log("ゲームのバランス（コインと価格）を調整しています...");
  
  // Update data.js
  const dataJsPath = path.join(__dirname, 'js', 'data.js');
  let dataJs = fs.readFileSync(dataJsPath, 'utf8');

  // Change upCost exponent from 1.6 to 2.1
  dataJs = dataJs.replace(
    'const upCost=(k,lv)=>Math.round(UPS[k].base*Math.pow(lv+1,1.6));',
    'const upCost=(k,lv)=>Math.round(UPS[k].base*Math.pow(lv+1,2.1));'
  );

  fs.writeFileSync(dataJsPath, dataJs, 'utf8');

  // Update game.js
  const gameJsPath = path.join(__dirname, 'js', 'game.js');
  let gameJs = fs.readFileSync(gameJsPath, 'utf8');

  // Change coin calculation
  gameJs = gameJs.replace(
    'const coins=Math.floor(stats.sc/15*DIFFS[game.diff].coin)+(win?Math.floor(200*DIFFS[game.diff].coin):0);',
    'const coins=Math.floor(stats.sc/45*DIFFS[game.diff].coin)+(win?Math.floor(80*DIFFS[game.diff].coin):0);'
  );

  fs.writeFileSync(gameJsPath, gameJs, 'utf8');

  setTimeout(() => {
    console.log("すべての作業が完了しました！");
  }, 1000);
}, 1000);
