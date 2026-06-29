<div align="center">

# 🐶 DOG SQUAD: SQUIRREL SIEGE

**[日本語](#japanese) | [English](#english)**

🎮 **Play now:** https://dog-squad-game-app.web.app

</div>

---

<a name="english"></a>
## 🇺🇸 English

A browser-based 3D tower-defense action game built with Three.js and the Web Audio API.
Defend your doghouse from the acorn-armed squirrel army with your squad of dogs!

<div align="center">
  <img src="docs/dog_EN.gif" alt="DOG SQUAD gameplay (English)" width="720">
</div>

### 🎮 How to Play

#### Solo
Open the game in your browser, choose a stage, difficulty, and dog breed — then charge!

**Controls**

| Action | Key |
|---|---|
| Move | WASD / Arrow keys |
| Aim | Mouse |
| Bone Missile (arc + blast) | Left Click |
| Woof Wave (knockback) | SPACE |
| Pit Trap | E / Right Click |

#### Multiplayer (up to 6 players)
1. Click **Multiplayer** on the main menu
2. Host clicks **Create Room** → share the invite URL with friends
3. Friends open the URL to join automatically
4. Host clicks **Charge!** to start the game

#### Goal
Prevent squirrels from reaching the doghouse. Survive all 12 waves without the doghouse HP hitting zero!
Earn Bone Coins from your score and spend them at the Owner's Shop for permanent upgrades.

### 🐿️ Enemy Types
| Enemy | Description |
|---|---|
| Normal Squirrel | Basic enemy |
| Scout Squirrel | Fast, zigzag movement |
| Heavy Squirrel | High HP, slow |
| Tank Squirrel | Massive HP, huge |
| Gliding Squirrel | Flies through the air |
| Boss — King Acorn III | Extremely powerful, appears periodically |

### 🐾 Dog Breeds
| Breed | Trait |
|---|---|
| Shiba Pochi | Balanced all-rounder |
| Golden Goru | Fast fire rate |
| Dalmatian Dal | Wide Woof Wave range |
| Corgi Koro | High movement speed |
| Husky Haku | Powerful Bone Missiles |
| Pug Puu | More traps |

### 🛠️ Tech Stack
- **HTML / CSS** — UI & CSS art (all icons and characters drawn entirely in CSS)
- **JavaScript** — Game logic & network sync
- **Three.js** — 3D rendering
- **Web Audio API** — Real-time BGM & SFX synthesis
- **Firebase Firestore** — Serverless multiplayer relay
- **Firebase Hosting** — Game hosting

---

## 🐕 Dynamic Difficulty Adjustment (DDA) × Machine Learning Research Project

This repository includes a research and development project for "Dynamic Difficulty Adjustment (DDA)", which automatically shifts the game difficulty in real-time according to the player's performance.

### 1. Collected Data Overview (Phase 1)
We extracted detailed play session data (189 sessions) from Firebase Firestore and organized them into the following files:
- [dda_sessions.xlsx](dda_sessions.xlsx) : Spreadsheet for analysis containing upgrades, scores, remaining HP, and stages.
- [ml/dda_sessions.csv](ml/dda_sessions.csv) : Flat data format used for machine learning.

The variables include selected stage, difficulty, dog breed, win/loss status, remaining HP percentage, and total upgrade levels.

### 2. AI Model Construction (Phase 2)
We built a neural network model to predict the ideal "difficulty multiplier (0.6x to 1.8x)" for each player, using their recent performance (win rate, average remaining HP%, average normalized score, etc.) from the past 5 sessions.
- [ml/train_model.js](ml/train_model.js) : Training script to build the model on Node.js and save the model artifacts.
- [ml/train_dda.py](ml/train_dda.py) : Python code suitable for Google Colab to visualize training progress and prediction accuracy.
- [ml/model/](ml/model/) : The trained AI "brain files" (`model.json` and `weights.bin`).

#### 📊 AI Training & Validation Results
Running the script generates the following charts:

<div align="center">
  <img src="docs/python.png" alt="AI Training Results" width="800">
</div>

- **Left Plot (Training Progress)**:
  The prediction error (Loss) decreases steadily as the epoch counts increase, showing that the neural network has successfully learned from the training data.
- **Right Plot (Prediction Accuracy)**:
  The red dashed line represents the perfect prediction line. The actual session outcomes (orange dots) cluster tightly around the dashed line, showing high prediction accuracy for recommending the target difficulty.

For Phase 3, we plan to integrate this trained AI model into the game start flow to adaptively scale the enemy stats based on individual players' skill levels.

---

<a name="japanese"></a>
## 🇯🇵 日本語

Three.js と Web Audio API で作ったブラウザ 3D タワーディフェンス × アクションゲーム。
どんぐり武装のリス軍団から、わんちゃん隊で公園の犬小屋を守りぬけ！

<div align="center">
  <img src="docs/dog_JP.gif" alt="DOG SQUAD ゲームプレイ（日本語）" width="720">
</div>

### 🎮 遊び方

#### ひとりで遊ぶ
ブラウザで開くだけ。ステージ・難易度・犬種を選んでしゅつげき！

**操作**

| 操作 | キー |
|---|---|
| 移動 | WASD / 矢印キー |
| ねらう | マウス |
| 骨ミサイル（放物線・爆風） | 左クリック |
| ワン!衝撃波（ノックバック） | SPACE |
| 落とし穴トラップ | E / 右クリック |

#### みんなで遊ぶ（最大6人）
1. メニューの「みんなで遊ぶ」を押す
2. ホストが「ルームを作る」→ 表示される招待URLをお友だちに送る
3. お友だちはURLを開くだけで同じルームへ入室
4. ホストが「ぜんいん しゅつげき！」でゲーム開始

#### ゲームの目標
敵リスが犬小屋に到達するとHPが減る。WAVE 12 まで犬小屋のHPが0にならなければクリア！
スコアでほねコインを獲得し、飼い主のショップで永続強化できる。

### 🐿️ 敵の種類
| 敵 | 特徴 |
|---|---|
| ノーマルリス | 基本の敵 |
| スカウトリス | 素早くジグザグ移動 |
| 重装リス | HPが高く鈍い |
| タンクリス | 超高HP・でかい |
| 滑空リス（ムササビ） | 空中を飛んでくる |
| ボス キング・どんぐり三世 | 超強力！定期的に出現 |

### 🐾 わんちゃん犬種
| 犬種 | 特徴 |
|---|---|
| 柴犬ポチ | バランス型 |
| ゴールデンのゴル | 連射が速い |
| ダルメシアンのダル | ワン波の範囲が広い |
| コーギーのコロ | 移動速度が速い |
| ハスキーのハク | 骨ミサイルが強力 |
| パグのプー | トラップ数が多い |

### 🛠️ 使用言語・技術
- **HTML / CSS** — UI・CSSアート（アイコン・キャラクターをすべてCSSで描画）
- **JavaScript** — ゲームロジック・ネットワーク同期
- **Three.js** — 3DCGレンダリング
- **Web Audio API** — BGM・効果音をリアルタイム合成
- **Firebase Firestore** — サーバーレスなマルチプレイ通信
- **Firebase Hosting** — ゲームの公開

---

## 🐕 動的難易度調整（DDA）× 機械学習 研究プロジェクト

本リポジトリでは、遊ぶ人の実力に合わせてリアルタイムにゲームの難易度を変化させる「動的難易度調整（DDA）」の研究・開発を行っています。

### 1. 収集データの概要
プレイヤーがゲームを遊んだ時の詳細なプレイデータ（189件）をデータベースから抽出し、以下のファイルに整理しました。
- [dda_sessions.xlsx](dda_sessions.xlsx) : 分析用のエクセルファイル（ショップの強化レベルや、各ゲームでの残りHP、スコアなどを一覧にまとめています）
- [ml/dda_sessions.csv](ml/dda_sessions.csv) : AIの学習に使用した表データ

データ項目には、選択したステージ、難易度、犬種、勝敗、残りHP％、ショップでのパワーアップ合計値などが含まれています。

### 2. 難易度調整AIの構築（Phase 2）
プレイヤーの「直近5回分の戦績（勝率、残りHP％の平均、スコアの平均など）」から、その人に最適な「難易度の倍率（0.6倍〜1.8倍）」を自動で導き出すAIモデル（ニューラルネットワーク）を構築しました。
- [ml/train_model.js](ml/train_model.js) : サーバー側でAIを学習させてファイルに出力するためのプログラム
- [ml/train_dda.py](ml/train_dda.py) : Google Colabで学習の進み具合や結果をグラフで確認するためのPythonプログラム
- [ml/model/](ml/model/) : 学習が完了したAIの「頭脳ファイル」（`model.json` と `weights.bin`）

#### 📊 AIの学習結果の分析
Google Colab等でプログラムを実行した結果、以下のグラフが得られました。

<div align="center">
  <img src="docs/python.png" alt="AIの学習結果グラフ" width="800">
</div>

- **左のグラフ（学習の進捗）**:
  AIが学習を繰り返すたびに、予測のズレ（縦軸の数値）が順調に減っています。これは、AIがプレイデータを正しく理解し、学習に成功していることを示しています。
- **右のグラフ（予測の正確さ）**:
  赤い点線は「AIの予測が100%完璧だった場合」の理想ラインです。実際のプレイデータ（オレンジ色の点）がこの点線の周りにきれいに集まっており、AIがプレイヤーの実力に合わせた「ちょうど良い難易度（0.6倍〜1.8倍）」を高い精度で予測できていることがわかります。

今後は、この保存されたAIの頭脳ファイルをゲームの開始時に読み込ませ、遊ぶ人の実力に応じて敵の強さをリアルタイムに自動調整する仕組み（Phase 3）の実装を進めます。