const fs = require('fs');
const path = require('path');
const https = require('https');
const XLSX = require('xlsx');

// 設定
const projectId = 'dog-squad-game-app';
const configPath = 'C:\\Users\\shota\\.config\\configstore\\firebase-tools.json';

// トークンリフレッシュ関数
function getAccessToken(tokens, config) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
      client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token'
    });

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            resolve(json.access_token);
          } else {
            console.log("Failed to refresh token, using fallback.");
            resolve(tokens.access_token);
          }
        } catch (e) {
          resolve(tokens.access_token);
        }
      });
    });

    req.on('error', () => {
      resolve(tokens.access_token);
    });

    req.write(postData);
    req.end();
  });
}

// HTTPS GETリクエスト用ヘルパー
function getUrl(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => reject(e));
  });
}

// Firestoreフィールドの解析（フラット化）
function parseFirestoreFields(fields) {
  const obj = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) obj[key] = value.stringValue;
    else if (value.integerValue !== undefined) obj[key] = parseInt(value.integerValue, 10);
    else if (value.doubleValue !== undefined) obj[key] = parseFloat(value.doubleValue);
    else if (value.booleanValue !== undefined) obj[key] = value.booleanValue;
    else if (value.timestampValue !== undefined) obj[key] = value.timestampValue;
    else if (value.mapValue !== undefined) {
      // マップ（オブジェクト）はさらにフラット化するか、JSON文字列にする
      const nested = parseFirestoreFields(value.mapValue.fields || {});
      // ml用にオブジェクトのままか、あるいはキーを展開
      obj[key] = nested;
    } else if (value.arrayValue !== undefined) {
      obj[key] = (value.arrayValue.values || []).map(v => {
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        return v;
      });
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

async function run() {
  console.log("Firebase 認証トークンを更新中...");
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = await getAccessToken(config.tokens, config);
  
  console.log("Firestore からデータを取得中...");
  let documents = [];
  let pageToken = null;
  
  do {
    let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/dda_sessions?pageSize=300`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    
    const res = await getUrl(url, token);
    if (res.documents) {
      documents = documents.concat(res.documents);
    }
    pageToken = res.nextPageToken;
    console.log(`現在 ${documents.length} 件のデータを取得しました...`);
  } while (pageToken);

  console.log(`全 ${documents.length} 件のデータ取得が完了しました。データを整形します...`);

  const flatData = documents.map(doc => {
    const rawFields = parseFirestoreFields(doc.fields || {});
    
    // Excel用に完全に平坦化したオブジェクトを作る
    const row = {
      id: doc.name.split('/').pop(),
      stage: rawFields.stage || "",
      diff: rawFields.diff || "",
      breed: rawFields.breed || "",
      win: rawFields.win !== undefined ? rawFields.win : false,
      rank: rawFields.rank || "-",
      wave_reached: rawFields.wave_reached !== undefined ? rawFields.wave_reached : 0,
      wave_pct: rawFields.wave_pct !== undefined ? rawFields.wave_pct : 0,
      score: rawFields.score !== undefined ? rawFields.score : 0,
      kills: rawFields.kills !== undefined ? rawFields.kills : 0,
      max_combo: rawFields.max_combo !== undefined ? rawFields.max_combo : 0,
      clear_time: rawFields.clear_time !== undefined ? rawFields.clear_time : 0,
      hp_remaining: rawFields.hp_remaining !== undefined ? rawFields.hp_remaining : 0,
      hp_pct: rawFields.hp_pct !== undefined ? rawFields.hp_pct : 0,
      coins_earned: rawFields.coins_earned !== undefined ? rawFields.coins_earned : 0,
      upgrade_total: rawFields.upgrade_total !== undefined ? rawFields.upgrade_total : 0,
      lang: rawFields.lang || "",
      ts: rawFields.ts || ""
    };

    // upgrades マップを展開
    if (rawFields.upgrades) {
      for (const [upKey, upVal] of Object.entries(rawFields.upgrades)) {
        row[`upgrade_${upKey}`] = upVal;
      }
    }
    
    return row;
  });

  // Excel ファイルに保存
  console.log("Excel ファイルを作成中...");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(flatData);
  XLSX.utils.book_append_sheet(wb, ws, "dda_sessions");
  
  const excelPath = path.join(__dirname, '..', 'dda_sessions.xlsx');
  XLSX.writeFile(wb, excelPath);
  console.log(`Excelファイルを保存しました: ${excelPath}`);

  // CSV ファイルに保存 (機械学習のインプット用)
  console.log("CSV ファイルを作成中...");
  const csvData = XLSX.utils.sheet_to_csv(ws);
  const csvPath = path.join(__dirname, 'dda_sessions.csv');
  fs.writeFileSync(csvPath, csvData, 'utf8');
  console.log(`CSVファイルを保存しました: ${csvPath}`);
}

run().catch(err => {
  console.error("Error exporting data:", err);
});
