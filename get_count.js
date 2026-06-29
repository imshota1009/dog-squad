const fs = require('fs');
const https = require('https');

// config の読み込み
const configPath = 'C:\\Users\\shota\\.config\\configstore\\firebase-tools.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const tokens = config.tokens;

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: config.user?.aud || "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
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
            resolve(tokens.access_token);
          }
        } catch (e) {
          resolve(tokens.access_token);
        }
      });
    });

    req.on('error', (e) => {
      resolve(tokens.access_token);
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  const token = await getAccessToken();
  const projectId = 'dog-squad-game-app';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery`;
  
  const query = {
    structuredAggregationQuery: {
      structuredQuery: {
        from: [{ collectionId: 'dda_sessions' }]
      },
      aggregations: [{
        count: {},
        alias: 'total_count'
      }]
    }
  };

  const postData = JSON.stringify(query);

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json && json[0] && json[0].result && json[0].result.aggregateFields && json[0].result.aggregateFields.total_count) {
          console.log('COUNT_RESULT:' + json[0].result.aggregateFields.total_count.integerValue);
        } else {
          console.log('Unexpected response:', JSON.stringify(json));
        }
      } catch (e) {
        console.log('Error parsing response:', e.message, data);
      }
    });
  });

  req.on('error', (e) => {
    console.log('Request error:', e.message);
  });

  req.write(postData);
  req.end();
}

run();
