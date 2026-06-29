const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');

// パス設定
const csvPath = path.join(__dirname, 'dda_sessions.csv');
const modelDir = path.join(__dirname, 'model');

// ディレクトリ作成
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

// 簡易CSVパース関数
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    // カンマ区切りだが、単純なスプリット
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }
  return data;
}

// データ処理メイン
async function train() {
  console.log("CSV データを読み込み中...");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSVファイルが見つかりません: ${csvPath}`);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rawData = parseCSV(csvContent);
  console.log(`読み込み完了: ${rawData.length} 件`);

  // 1. タイムスタンプ順にソート (ts)
  rawData.sort((a, b) => new Date(a.ts) - new Date(b.ts));

  // 2. 特徴量エンコーディング用マップ
  const stageMap = { 'park': 0, 'beach': 1, 'snow': 2 };
  const diffMap = { 'easy': 0, 'normal': 1, 'hard': 2, 'endless': 3 };
  const breedMap = { 'shiba': 0, 'golden': 1, 'dal': 2, 'corgi': 3, 'husky': 4, 'pug': 5 };
  
  const diffMultMap = { 'easy': 0.8, 'normal': 1.0, 'hard': 1.3, 'endless': 1.5 };
  const stageFactMap = { 'park': 1.0, 'beach': 1.15, 'snow': 1.3 };

  // 全体平均を計算（最初の数セッションの過去平均代用値）
  let totalHpPct = 0;
  let totalWavePct = 0;
  let totalWinCount = 0;
  let totalScoreNorm = 0;
  
  rawData.forEach(row => {
    const hpPct = parseInt(row.hp_pct) || 0;
    const wavePct = parseInt(row.wave_pct) || 0;
    const win = row.win === 'TRUE';
    const score = parseInt(row.score) || 0;
    const stageFact = stageFactMap[row.stage] || 1.0;
    const diffFact = diffMultMap[row.diff] || 1.0;
    const scoreNorm = score / (stageFact * diffFact);

    totalHpPct += hpPct;
    totalWavePct += wavePct;
    if (win) totalWinCount++;
    totalScoreNorm += scoreNorm;
  });

  const globalAvgHpPct = totalHpPct / rawData.length;
  const globalAvgWavePct = totalWavePct / rawData.length;
  const globalWinRate = totalWinCount / rawData.length;
  const globalAvgScoreNorm = totalScoreNorm / rawData.length;

  const X = [];
  const Y = [];

  console.log("特徴量（インプット）と目標値（アウトプット）を作成中...");

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // 直近 5 件の平均値（過去セッションのシミュレート）
    let recentSessions = [];
    const lookback = 5;
    const startIdx = Math.max(0, i - lookback);
    
    for (let k = startIdx; k < i; k++) {
      recentSessions.push(rawData[k]);
    }

    let avg_hp_pct = globalAvgHpPct;
    let avg_wave_pct = globalAvgWavePct;
    let win_rate = globalWinRate;
    let avg_score_norm = globalAvgScoreNorm;

    if (recentSessions.length > 0) {
      let sumHp = 0, sumWave = 0, winCount = 0, sumScore = 0;
      recentSessions.forEach(s => {
        sumHp += parseInt(s.hp_pct) || 0;
        sumWave += parseInt(s.wave_pct) || 0;
        if (s.win === 'TRUE') winCount++;
        
        const score = parseInt(s.score) || 0;
        const stageFact = stageFactMap[s.stage] || 1.0;
        const diffFact = diffMultMap[s.diff] || 1.0;
        sumScore += score / (stageFact * diffFact);
      });

      avg_hp_pct = sumHp / recentSessions.length;
      avg_wave_pct = sumWave / recentSessions.length;
      win_rate = winCount / recentSessions.length;
      avg_score_norm = sumScore / recentSessions.length;
    }

    // 入力特徴量 (X) の正規化スケーリング [0, 1]
    const stageVal = (stageMap[row.stage] !== undefined ? stageMap[row.stage] : 0) / 2.0;
    const diffVal = (diffMap[row.diff] !== undefined ? diffMap[row.diff] : 1) / 3.0;
    const breedVal = (breedMap[row.breed] !== undefined ? breedMap[row.breed] : 0) / 5.0;
    
    const sc_avg_hp_pct = avg_hp_pct / 100.0;
    const sc_avg_wave_pct = avg_wave_pct / 100.0;
    const sc_win_rate = win_rate; // 既に 0〜1
    const sc_avg_score_norm = Math.min(1.0, avg_score_norm / 1000000.0);
    
    const upgradeTotal = parseInt(row.upgrade_total) || 0;
    const sc_upgrade_total = Math.min(1.0, upgradeTotal / 40.0);

    X.push([
      stageVal,
      diffVal,
      breedVal,
      sc_avg_hp_pct,
      sc_avg_wave_pct,
      sc_win_rate,
      sc_avg_score_norm,
      sc_upgrade_total
    ]);

    // 目標値 (Y): 難易度倍率の計算 (0.6 〜 1.8)
    const currentMult = diffMultMap[row.diff] || 1.0;
    const hpPct = parseInt(row.hp_pct) || 0;
    const win = row.win === 'TRUE';
    
    let targetMult = currentMult;
    if (win) {
      if (hpPct >= 20 && hpPct <= 70) {
        targetMult = currentMult; // ちょうど良い
      } else if (hpPct > 70) {
        targetMult = currentMult * 1.3; // 簡単すぎ -> 難易度を上げる
      } else {
        targetMult = currentMult * 0.8; // 難しすぎ -> 難易度を下げる
      }
    } else {
      targetMult = currentMult * 0.6; // 負けた -> 難易度を大幅に下げる
    }

    // クリップ
    targetMult = Math.max(0.6, Math.min(1.8, targetMult));
    
    // Y の正規化 [0, 1] (0.6 -> 0.0, 1.8 -> 1.0)
    const normalizedY = (targetMult - 0.6) / 1.2;
    Y.push(normalizedY);
  }

  // 3. テンソル化
  const xs = tf.tensor2d(X);
  const ys = tf.tensor2d(Y, [Y.length, 1]);

  console.log("モデルを構築中...");
  // 4. ニューラルネットワークモデルの定義
  const model = tf.sequential();
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu',
    inputShape: [8]
  }));
  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu'
  }));
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid' // [0, 1]の予測値を出力
  }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError'
  });

  console.log("モデルの訓練を開始します...");
  
  // 5. 訓練実行
  await model.fit(xs, ys, {
    epochs: 80,
    batchSize: 16,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 10 === 0) {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(6)}`);
        }
      }
    }
  });

  console.log("モデルの訓練が完了しました。保存します...");
  
  // 6. モデルの保存 (Node.js 用にカスタムハンドラーを実装)
  const saveResult = await model.save(tf.io.withSaveHandler(async (modelArtifacts) => {
    fs.writeFileSync(path.join(modelDir, 'model.json'), JSON.stringify({
      modelTopology: modelArtifacts.modelTopology,
      format: modelArtifacts.format,
      generatedBy: modelArtifacts.generatedBy,
      convertedBy: modelArtifacts.convertedBy,
      weightsManifest: [{
        paths: ['./weights.bin'],
        weights: modelArtifacts.weightSpecs
      }]
    }, null, 2));
    
    if (modelArtifacts.weightData) {
      fs.writeFileSync(path.join(modelDir, 'weights.bin'), Buffer.from(modelArtifacts.weightData));
    }
    
    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: 'JSON',
        modelTopologyBytes: JSON.stringify(modelArtifacts.modelTopology).length,
        weightSpecsBytes: JSON.stringify(modelArtifacts.weightSpecs).length,
        weightDataBytes: modelArtifacts.weightData ? modelArtifacts.weightData.byteLength : 0,
      }
    };
  }));

  console.log(`モデルを保存しました: ${modelDir}`);

  // メモリ解放
  xs.dispose();
  ys.dispose();
  model.dispose();
  
  console.log("AIモデル構築タスクがすべて完了しました！");
}

train().catch(err => {
  console.error("訓練エラーが発生しました:", err);
});
