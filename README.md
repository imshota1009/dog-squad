# DOG SQUAD vs SQUIRREL INVASION

ブラウザで動く 3DCG タワーディフェンス × アクションゲーム。
どんぐり武装のリス軍団から、わんちゃん隊で公園の犬小屋を守りぬけ！

絵文字は一切不使用（アイコンはすべてCSSアート）。BGM・効果音はWebAudioでリアルタイム合成。

## あそびかた

### ひとりで遊ぶ（サーバー不要）
`index.html` をブラウザで開くだけ。

### みんなで遊ぶ（最大6人・ルーム制）
```bash
npm install
npm start          # → http://localhost:3000
```
1. ホストがブラウザで `http://localhost:3000` を開く（同じWi-Fiの友だちは `http://ホストPCのIP:3000`）
2. メニュー →「みんなで遊ぶ」→「ルームを作る」
3. 表示された4文字の**あいことば**を友だちに伝える
4. 友だちは「あいことばで参加」→ ホストが「ぜんいん しゅつげき！」

> ポート開放やhttps環境にデプロイすればインターネット越しでも遊べます（Render / Railway / fly.io など、`npm start` がそのまま動きます）。

## 操作
| 操作 | キー |
|---|---|
| 移動 | WASD / 矢印キー |
| ねらう | マウス |
| 骨ミサイル（放物線・爆風） | 左クリック |
| ワン!衝撃波（ノックバック） | SPACE |
| 落とし穴トラップ | E / 右クリック |

## ゲーム内容
- **難易度3種**：やさしい / ふつう / むずかしい（敵数・速度・犬小屋HP・どんぐり頻度が変化）
- **ステージ3種**：いつもの公園 / サンセットビーチ / ゆきやま広場（敵編成・BGMが変化）
- **わんちゃん6犬種**：柴犬・ゴールデン・ダルメシアン・コーギー・ハスキー・パグ（性能が異なる）
- **敵リス6種**：ノーマル / 俊足スカウト / どんぐり兜の重装 / 鍋かぶりタンク / 滑空ムササビ / ボス「キング・どんぐり三世」
- **物理**：放物線弾道、ラグドール吹き飛び（バウンス・回転）、連鎖ふっとばしコンボ、場外ホームランボーナス
- **飼い主**：ベンチから応援。ウェーブクリアごとにアイテム（おにく / ダッシュ / れんしゃ / メガ爆風 / 落とし穴+1）を投げ入れてくれる
- **永続成長**：スコアで「ほねコイン」を獲得 → 飼い主のショップで永続アップグレード6種（localStorageに保存）

## ファイル構成
```
index.html        ゲーム本体（UI / 画面）
css/style.css     スタイル + CSSアイコン・CSSキャラアート
js/data.js        ゲームデータ定義（難易度・ステージ・敵・犬種・強化）
js/audio.js       効果音 + BGMシーケンサー（WebAudio）
js/world.js       three.js シーン・ステージ・3Dキャラビルダー
js/net.js         マルチプレイクライアント
js/game.js        ゲームロジック・UI・同期
server.js         静的配信 + ルーム中継サーバー（ws）
```

## Firebaseでの公開手順

このゲームはFirebase Hostingを利用して簡単にインターネット上に公開できます。

### 1. Firebaseツールがインストールされているか確認
```bash
firebase --version
```
※入っていない場合は `npm install -g firebase-tools` でインストールし、`firebase login` でログインしてください。

### 2. Firebaseへのデプロイ（公開）
プロジェクトフォルダ内で以下のコマンドを実行します。
```bash
firebase deploy --only hosting
```
実行が完了すると、専用の公開URL（例: `https://dog-squad-game.web.app`）が表示され、世界中から遊べるようになります。

---

## インターネット越しにマルチプレイ（みんなで遊ぶ）をする方法

通信サーバー（`server.js`）は不要になりました！
Firebase Firestoreを利用した**完全サーバーレスな通信システム**に移行したため、外部のサーバー（Render等）を準備することなく、そのままオンラインでの複数人マルチプレイが可能です。

### 1. 招待URLでの簡単参加
1. ゲームの「みんなで遊ぶ」画面から「ルームを作る」を押します。
2. 表示された画面の「コピー」ボタンを押すと、**お友だち招待用のURL（例: `https://dog-squad-game.web.app/?room=ABCD`）**がコピーされます。
3. そのURLをお友だちに送るだけで、お友だちはURLを開くだけで自動的に同じルームへ入室できます！

---

## Firebaseでの公開手順

このゲームはFirebase Hostingを利用して簡単にインターネット上に公開できます。

```bash
firebase deploy --only hosting
```

---

## GitHubへの公開手順

1. GitHub上に `dog-squad` という空のリポジトリを作成します。
2. フォルダ内で以下のコマンドを実行します。
```bash
git add .
git commit -m "feat: Serverless multiplayer with Firebase Firestore"
git branch -M main
git remote add origin https://github.com/imshota1009/dog-squad.git
git push -u origin main -f
```

## License
MIT
