const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';

// ═══════════════════════════════════════════════════════════════
// デザインシステム — プレミアムかつ読みやすいデザイン
// ═══════════════════════════════════════════════════════════════
const F = 'メイリオ';

// カラーパレット
const C = {
  dark:     '0F172A',   // スレートダーク（表紙・締め）
  darkSub:  '1E293B',   // ダーク補助
  bg:       'F8FAFC',   // オフホワイト（本文背景）
  bgAlt:    'EFF6FF',   // 薄いブルー（交互スライド背景）
  primary:  '1E3A5F',   // ディープネイビー
  accent:   'F59E0B',   // アンバー（アクセント）
  accentAlt:'3B82F6',   // ブルーアクセント
  green:    '10B981',   // エメラルド
  red:      'EF4444',   // レッド
  text:     '1E293B',   // 本文テキスト
  textSub:  '64748B',   // サブテキスト
  white:    'FFFFFF',
  whiteOff: 'F1F5F9',
  gold:     'F59E0B',
  gradA:    '1E40AF',   // グラデ開始
  gradB:    '7C3AED',   // グラデ終了
  stripe:   'E2E8F0',   // ストライプ
  barBg:    '334155',
};

// パス
const brainDir = 'C:/Users/shota/.gemini/antigravity-ide/brain/8f8b578f-8f82-4529-a88c-78af7decba18';
const menuImg = path.join(brainDir, 'main_menu_screen_1783925997418.png');
const gameImg = path.join(brainDir, 'gameplay_screen_1783926436535.png');
const chartImg = path.join(__dirname, 'docs', 'python.png');

const TODAY = '2026年7月13日';

// ═══════════════════════════════════════════════════════════════
// ヘルパー: スライド上部にアクセントストライプを描画
// ═══════════════════════════════════════════════════════════════
function addTopBar(slide, color1, color2) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 0.08, fill: { color: color1 }
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0.08, w: '100%', h: 0.04, fill: { color: color2 }
  });
}

function addFooter(slide, pageNum, total, dark) {
  const col = dark ? '475569' : C.textSub;
  slide.addText(`${pageNum} / ${total}`, {
    x: 11.5, y: 7.0, w: 1.5, h: 0.3,
    fontSize: 10, color: col, align: 'right', fontFace: F
  });
  slide.addText('DOG SQUAD: SQUIRREL SIEGE — DDA × AI プロジェクト', {
    x: 0.5, y: 7.0, w: 6, h: 0.3,
    fontSize: 9, color: col, fontFace: F
  });
}

function addSectionTag(slide, label, color) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 0.5, w: 1.8, h: 0.38, fill: { color: color }, rectRadius: 0.1
  });
  slide.addText(label, {
    x: 0.8, y: 0.5, w: 1.8, h: 0.38,
    fontSize: 11, bold: true, color: C.white, align: 'center', fontFace: F
  });
}

const TOTAL = 8;

// ═══════════════════════════════════════════════════════════════
// スライド 1: 表紙
// ═══════════════════════════════════════════════════════════════
let s1 = pptx.addSlide();
s1.background = { fill: C.dark };

// 左のアクセントバー（縦）
s1.addShape(pptx.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.12, h: '100%', fill: { color: C.accent }
});

// タイトル
s1.addText('DOG SQUAD', {
  x: 1.2, y: 1.4, w: 11, h: 1.0,
  fontSize: 52, bold: true, color: C.white, fontFace: F
});
s1.addText('SQUIRREL SIEGE', {
  x: 1.2, y: 2.3, w: 11, h: 0.6,
  fontSize: 28, color: C.accent, fontFace: F, bold: true
});

// サブタイトル
s1.addText('遊ぶ人の強さに合わせて「難しさが自動で変わるAI」搭載プロジェクト', {
  x: 1.2, y: 3.3, w: 11, h: 0.5,
  fontSize: 16, color: C.whiteOff, fontFace: F
});

// 区切り線
s1.addShape(pptx.shapes.RECTANGLE, {
  x: 1.2, y: 4.1, w: 4, h: 0.04, fill: { color: C.accent }
});

// URL
s1.addText('🎮  https://dog-squad-game-app.web.app', {
  x: 1.2, y: 4.5, w: 11, h: 0.45,
  fontSize: 15, color: C.green, fontFace: F, bold: true
});
s1.addText('📂  https://github.com/imshota1009/dog-squad', {
  x: 1.2, y: 5.0, w: 11, h: 0.45,
  fontSize: 14, color: C.accentAlt, fontFace: F
});

// フッター
s1.addText(`制作: Yamawaki Shota (imshota1009)　　最終更新: ${TODAY}`, {
  x: 1.2, y: 6.5, w: 11, h: 0.4,
  fontSize: 11, color: '64748B', fontFace: F
});

addFooter(s1, 1, TOTAL, true);


// ═══════════════════════════════════════════════════════════════
// スライド 2: プロジェクトの背景と課題
// ═══════════════════════════════════════════════════════════════
let s2 = pptx.addSlide();
s2.background = { fill: C.bg };
addTopBar(s2, C.primary, C.accent);
addSectionTag(s2, 'BACKGROUND', C.primary);

s2.addText('なぜ「難しさの自動調整AI」が必要なのか？', {
  x: 3.0, y: 0.45, w: 9, h: 0.5,
  fontSize: 22, bold: true, color: C.primary, fontFace: F
});

// 課題カード × 2
// カード1: 簡単すぎ
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 1.5, w: 5.5, h: 2.0, fill: { color: C.white }, rectRadius: 0.15,
  shadow: { type: 'outer', blur: 6, offset: 2, color: '00000020' }
});
s2.addText('😴 簡単すぎると…', {
  x: 1.1, y: 1.6, w: 5, h: 0.4,
  fontSize: 15, bold: true, color: C.red, fontFace: F
});
s2.addText('プレイヤーは退屈して飽きてしまい、\n2回目のプレイに繋がりません。', {
  x: 1.1, y: 2.1, w: 5, h: 1.2,
  fontSize: 13, color: C.text, fontFace: F, lineSpacing: 22
});

// カード2: 難しすぎ
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 7.0, y: 1.5, w: 5.5, h: 2.0, fill: { color: C.white }, rectRadius: 0.15,
  shadow: { type: 'outer', blur: 6, offset: 2, color: '00000020' }
});
s2.addText('😫 難しすぎると…', {
  x: 7.3, y: 1.6, w: 5, h: 0.4,
  fontSize: 15, bold: true, color: C.red, fontFace: F
});
s2.addText('クリアを諦めてしまい、\nゲームを途中でやめてしまいます。', {
  x: 7.3, y: 2.1, w: 5, h: 1.2,
  fontSize: 13, color: C.text, fontFace: F, lineSpacing: 22
});

// 矢印的な解決カード
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 2.5, y: 4.0, w: 8.3, h: 2.3, fill: { color: C.bgAlt }, rectRadius: 0.15,
  shadow: { type: 'outer', blur: 6, offset: 2, color: '00000020' },
  line: { color: C.accentAlt, width: 1.5 }
});
s2.addText('💡 解決策: 動的難易度調整（DDA）', {
  x: 2.8, y: 4.1, w: 8, h: 0.5,
  fontSize: 16, bold: true, color: C.accentAlt, fontFace: F
});
s2.addText('プレイヤーの過去の戦績データを分析し、\n「その人にとって "ちょうど良い" 難しさ」をAIがリアルタイムに計算して自動で適用します。\n有料の外部サービスは一切使わず、プレイヤーのブラウザ内で完結する仕組みです。', {
  x: 2.8, y: 4.6, w: 7.7, h: 1.5,
  fontSize: 13, color: C.text, fontFace: F, lineSpacing: 22
});

// 右側にメニューイメージ
if (fs.existsSync(menuImg)) {
  s2.addImage({ path: menuImg, x: 0.8, y: 4.0, w: 1.5, h: 1.1,
    rounding: true
  });
}

addFooter(s2, 2, TOTAL, false);


// ═══════════════════════════════════════════════════════════════
// スライド 3: データの収集 (Phase 1)
// ═══════════════════════════════════════════════════════════════
let s3 = pptx.addSlide();
s3.background = { fill: C.bgAlt };
addTopBar(s3, C.green, C.accent);
addSectionTag(s3, 'PHASE 1', C.green);

s3.addText('189回分のプレイデータを収集・分析', {
  x: 3.0, y: 0.45, w: 9, h: 0.5,
  fontSize: 22, bold: true, color: C.primary, fontFace: F
});

// データ項目をカード化
const dataItems = [
  { emoji: '🏆', title: '戦績データ', desc: '勝敗 / 残りHP% / 到達Wave / スコア' },
  { emoji: '🎮', title: '設定データ', desc: '選んだステージ / 犬種 / 難易度設定' },
  { emoji: '⚡', title: 'パワーアップ', desc: 'ショップでの各能力の合計強化レベル' },
];

dataItems.forEach((item, i) => {
  const y = 1.5 + i * 1.3;
  s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: y, w: 5.5, h: 1.0, fill: { color: C.white }, rectRadius: 0.12,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '00000015' }
  });
  s3.addText(`${item.emoji}  ${item.title}`, {
    x: 1.0, y: y + 0.05, w: 5, h: 0.4,
    fontSize: 14, bold: true, color: C.primary, fontFace: F
  });
  s3.addText(item.desc, {
    x: 1.0, y: y + 0.45, w: 5, h: 0.4,
    fontSize: 12, color: C.textSub, fontFace: F
  });
});

// 右側: ゲームプレイ画面（角丸風に影をつけて配置）
if (fs.existsSync(gameImg)) {
  s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.9, y: 1.4, w: 5.8, h: 4.3, fill: { color: C.dark }, rectRadius: 0.2,
    shadow: { type: 'outer', blur: 10, offset: 3, color: '00000030' }
  });
  s3.addImage({ path: gameImg, x: 7.05, y: 1.55, w: 5.5, h: 3.8 });
  s3.addText('実際のゲーム3D戦闘画面', {
    x: 7.0, y: 5.5, w: 5.6, h: 0.3,
    fontSize: 10, color: C.textSub, align: 'center', fontFace: F
  });
}

s3.addText('収集先: Firebase Firestore データベース\n分析ファイル: dda_sessions.xlsx / dda_sessions.csv', {
  x: 0.8, y: 5.5, w: 5.5, h: 0.8,
  fontSize: 11, color: C.textSub, fontFace: F, lineSpacing: 18
});

addFooter(s3, 3, TOTAL, false);


// ═══════════════════════════════════════════════════════════════
// スライド 4: AIの学習と精度検証 (Phase 2)
// ═══════════════════════════════════════════════════════════════
let s4 = pptx.addSlide();
s4.background = { fill: C.bg };
addTopBar(s4, C.accentAlt, C.accent);
addSectionTag(s4, 'PHASE 2', C.accentAlt);

s4.addText('AIの学習結果 — 驚異的な予測精度を実証', {
  x: 3.0, y: 0.45, w: 9, h: 0.5,
  fontSize: 22, bold: true, color: C.primary, fontFace: F
});

// 左側：ポイントカード
const aiPoints = [
  { icon: '🧠', title: 'ニューラルネットワーク構築', text: '直近5回の戦績から最適な難易度倍率（0.6x〜1.8x）を自動計算するAIを構築' },
  { icon: '📉', title: 'エラーの劇的低下', text: '学習を重ねるごとに予測のズレが 0.06 → 0.01 近くまで綺麗に減少（左グラフ）' },
  { icon: '🎯', title: '実用レベルの予測精度', text: '初心者救済（0.6x）や現状維持（1.0x）の判断精度はほぼ完璧に近い適合率（右グラフ）' },
];

aiPoints.forEach((item, i) => {
  const y = 1.5 + i * 1.35;
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: y, w: 5.5, h: 1.1, fill: { color: C.white }, rectRadius: 0.12,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '00000015' }
  });
  s4.addText(`${item.icon}  ${item.title}`, {
    x: 1.0, y: y + 0.05, w: 5, h: 0.4,
    fontSize: 13, bold: true, color: C.primary, fontFace: F
  });
  s4.addText(item.text, {
    x: 1.0, y: y + 0.45, w: 5.1, h: 0.5,
    fontSize: 11, color: C.textSub, fontFace: F, lineSpacing: 18
  });
});

// 右側: 分析グラフ
if (fs.existsSync(chartImg)) {
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.9, y: 1.4, w: 5.8, h: 4.3, fill: { color: C.white }, rectRadius: 0.2,
    shadow: { type: 'outer', blur: 10, offset: 3, color: '00000030' }
  });
  s4.addImage({ path: chartImg, x: 7.05, y: 1.55, w: 5.5, h: 3.8 });
  s4.addText('Google Colabでの学習結果グラフ（Python実行結果）', {
    x: 7.0, y: 5.9, w: 5.6, h: 0.3,
    fontSize: 10, color: C.textSub, align: 'center', fontFace: F
  });
}

addFooter(s4, 4, TOTAL, false);


// ═══════════════════════════════════════════════════════════════
// スライド 5: ゲームへの統合 (Phase 3)
// ═══════════════════════════════════════════════════════════════
let s5 = pptx.addSlide();
s5.background = { fill: C.bgAlt };
addTopBar(s5, C.accent, C.primary);
addSectionTag(s5, 'PHASE 3', C.accent);

s5.addText('AIの頭脳をゲームに組み込む — 自動調整の仕組み', {
  x: 3.0, y: 0.45, w: 9, h: 0.5,
  fontSize: 22, bold: true, color: C.primary, fontFace: F
});

// ステップフロー（横並びカード）
const steps = [
  { num: '1', color: C.green,     title: '戦績の読み込み', desc: 'ゲーム開始ボタンを押した瞬間、過去5回分の\n勝率・残りHP%・スコアを自動で振り返る' },
  { num: '2', color: C.accentAlt, title: 'AIが難易度を予測', desc: 'TensorFlow.jsが「難易度〇倍がベスト」と\n瞬時に計算（0.6倍〜1.8倍）' },
  { num: '3', color: C.accent,    title: '敵のパラメータに適用', desc: 'リスの「体力」「スピード」「攻撃間隔」に\n倍率を掛け合わせてリアルタイム調整' },
];

steps.forEach((step, i) => {
  const x = 0.6 + i * 4.2;
  
  // カード背景
  s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: x, y: 1.5, w: 3.8, h: 3.2, fill: { color: C.white }, rectRadius: 0.15,
    shadow: { type: 'outer', blur: 6, offset: 2, color: '00000020' }
  });
  
  // ステップ番号の丸
  s5.addShape(pptx.shapes.OVAL, {
    x: x + 1.3, y: 1.7, w: 1.2, h: 1.2, fill: { color: step.color }
  });
  s5.addText(step.num, {
    x: x + 1.3, y: 1.7, w: 1.2, h: 1.2,
    fontSize: 36, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: F
  });
  
  // タイトル
  s5.addText(step.title, {
    x: x + 0.2, y: 3.1, w: 3.4, h: 0.4,
    fontSize: 14, bold: true, color: C.primary, align: 'center', fontFace: F
  });
  
  // 説明
  s5.addText(step.desc, {
    x: x + 0.2, y: 3.5, w: 3.4, h: 1.0,
    fontSize: 11, color: C.textSub, align: 'center', fontFace: F, lineSpacing: 18
  });
});

// 矢印 (ステップ間)
s5.addText('→', { x: 4.2, y: 2.5, w: 0.8, h: 0.6, fontSize: 32, color: C.textSub, align: 'center', fontFace: F });
s5.addText('→', { x: 8.4, y: 2.5, w: 0.8, h: 0.6, fontSize: 32, color: C.textSub, align: 'center', fontFace: F });

// 補足
s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.6, y: 5.1, w: 12.1, h: 1.2, fill: { color: C.white }, rectRadius: 0.12,
  line: { color: C.green, width: 1.5 }
});
s5.addText('✅ 外部のAPIサービスを使わず、ブラウザの中だけでAIが完結して動作します\n✅ ゲーム中のWAVE表示の横に AI判定倍率「WAVE 1/12 (AI: 1.15x)」が表示されます\n✅ ゲーム終了時、今回の戦績をブラウザに自動保存 → 次回のAI判定に活用されます', {
  x: 0.9, y: 5.2, w: 11.5, h: 1.0,
  fontSize: 11, color: C.text, fontFace: F, lineSpacing: 18
});

addFooter(s5, 5, TOTAL, false);


// ═══════════════════════════════════════════════════════════════
// スライド 6: その他の進化 (バグ修正・バランス調整)
// ═══════════════════════════════════════════════════════════════
let s6 = pptx.addSlide();
s6.background = { fill: C.bg };
addTopBar(s6, C.primary, C.green);
addSectionTag(s6, 'UPDATES', C.primary);

s6.addText('ゲームの全体的な進化 — バグ修正 ＆ バランス調整', {
  x: 3.0, y: 0.45, w: 9, h: 0.5,
  fontSize: 22, bold: true, color: C.primary, fontFace: F
});

// 改善カードx3
const updates = [
  { icon: '📡', title: 'マルチプレイ通信の快適化',
    desc: 'データを0.1秒ごとにまとめて送信する「バッチ処理」に変更し、\n最大6人対戦時のカクつきを大幅に解消しました。', color: C.accentAlt },
  { icon: '🛒', title: 'ショップに新しい強化が登場',
    desc: '「爆発トレーニング」（爆風範囲UP）「コンボマスター」（受付時間延長）\n「早吠え」（わん波クールダウン短縮）の3種類を追加しました。', color: C.green },
  { icon: '⚖️', title: 'ゲームバランスの見直し',
    desc: 'アップグレード費用の上昇カーブを引き上げ、コイン獲得量をマイルドに調整。\n繰り返し遊んで少しずつ強くなっていく「長く楽しめるバランス」に改善しました。', color: C.accent },
];

updates.forEach((item, i) => {
  const y = 1.4 + i * 1.8;
  // 左の色付きバー
  s6.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8, y: y, w: 0.1, h: 1.5, fill: { color: item.color }
  });
  // カード
  s6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1.0, y: y, w: 11.5, h: 1.5, fill: { color: C.white }, rectRadius: 0.12,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '00000015' }
  });
  s6.addText(`${item.icon}  ${item.title}`, {
    x: 1.3, y: y + 0.1, w: 10.5, h: 0.4,
    fontSize: 15, bold: true, color: C.primary, fontFace: F
  });
  s6.addText(item.desc, {
    x: 1.3, y: y + 0.55, w: 10.5, h: 0.8,
    fontSize: 12, color: C.textSub, fontFace: F, lineSpacing: 20
  });
});

addFooter(s6, 6, TOTAL, false);


// ═══════════════════════════════════════════════════════════════
// スライド 7: 使用技術 (TECH STACK)
// ═══════════════════════════════════════════════════════════════
let s7 = pptx.addSlide();
s7.background = { fill: C.bgAlt };
addTopBar(s7, C.accentAlt, C.primary);
addSectionTag(s7, 'TECH STACK', C.accentAlt);

s7.addText('プロジェクトを支える使用技術', {
  x: 3.0, y: 0.45, w: 9, h: 0.5,
  fontSize: 22, bold: true, color: C.primary, fontFace: F
});

// 左側：フロントエンド・ゲームエンジン
s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 0.8, y: 1.4, w: 5.6, h: 4.5, fill: { color: C.white }, rectRadius: 0.1,
  shadow: { type: 'outer', blur: 4, offset: 1, color: '00000015' }
});
s7.addText('🎨 フロントエンド ＆ ゲームエンジン', {
  x: 1.1, y: 1.6, w: 5.0, h: 0.4,
  fontSize: 14, bold: true, color: C.primary, fontFace: F
});
s7.addText('■ HTML / CSS\nUIやキャラクターアイコンなどをすべてCSSアートで独自描画しています。\n\n■ JavaScript\nゲームのメインロジック、通信処理、AIの推論をブラウザ上で実行します。\n\n■ Three.js\n迫力ある3Dグラフィックスをブラウザ上で軽量にレンダリングします。\n\n■ Web Audio API\nBGMや効果音をリアルタイムにプログラムで合成・再生します。', {
  x: 1.1, y: 2.2, w: 5.0, h: 3.5,
  fontSize: 12, color: C.text, fontFace: F, lineSpacing: 18
});

// 右側：バックエンド・AI・インフラ
s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 6.8, y: 1.4, w: 5.6, h: 4.5, fill: { color: C.white }, rectRadius: 0.1,
  shadow: { type: 'outer', blur: 4, offset: 1, color: '00000015' }
});
s7.addText('☁️ バックエンド ＆ 機械学習', {
  x: 7.1, y: 1.6, w: 5.0, h: 0.4,
  fontSize: 14, bold: true, color: C.primary, fontFace: F
});
s7.addText('■ Firebase Firestore\nサーバーを立てずに、プレイヤーの戦績データの保存や、最大6人のリアルタイムオンライン対戦を実現しています。\n\n■ Firebase Hosting\nゲームをインターネットに公開し、誰でもすぐ遊べる環境を提供しています。\n\n■ TensorFlow.js\n学習済みのAI頭脳をブラウザに読み込み、高速に難易度を予測します。\n\n■ Python (Google Colab)\n189件のデータからAIモデルを訓練し、精度をグラフ化・検証しました。', {
  x: 7.1, y: 2.2, w: 5.0, h: 3.5,
  fontSize: 12, color: C.text, fontFace: F, lineSpacing: 18
});

addFooter(s7, 7, TOTAL, false);


// ═══════════════════════════════════════════════════════════════
// スライド 8: 締めくくり — プレイURL + GitHub
// ═══════════════════════════════════════════════════════════════
let s8 = pptx.addSlide();
s8.background = { fill: C.dark };

// 左のアクセントバー
s8.addShape(pptx.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.12, h: '100%', fill: { color: C.accent }
});

s8.addText('🎉 ぜひ遊んでみてください！', {
  x: 1.0, y: 0.8, w: 11, h: 0.7,
  fontSize: 30, bold: true, color: C.white, align: 'center', fontFace: F
});
s8.addText('AIがあなたの強さを自動で分析し、\nあなた専用の難易度のバトルをお届けします。', {
  x: 1.0, y: 1.6, w: 11, h: 0.7,
  fontSize: 14, color: 'CBD5E1', align: 'center', fontFace: F, lineSpacing: 22
});

// プレイURLカード
s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.5, y: 2.8, w: 10.3, h: 1.3, fill: { color: C.darkSub }, rectRadius: 0.15,
  line: { color: C.green, width: 2 }
});
s8.addText('🎮 ゲーム公開URL（ブラウザで即プレイ / スマホ・PC対応）', {
  x: 1.8, y: 2.85, w: 10, h: 0.4,
  fontSize: 12, color: C.green, fontFace: F, bold: true
});
s8.addText('https://dog-squad-game-app.web.app', {
  x: 1.8, y: 3.3, w: 10, h: 0.6,
  fontSize: 26, bold: true, color: C.white, fontFace: F
});

// GitHubカード
s8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.5, y: 4.5, w: 10.3, h: 1.3, fill: { color: C.darkSub }, rectRadius: 0.15,
  line: { color: C.accentAlt, width: 2 }
});
s8.addText('📂 GitHubリポジトリ（ソースコード・学習データ・分析結果を公開中！）', {
  x: 1.8, y: 4.55, w: 10, h: 0.4,
  fontSize: 12, color: C.accentAlt, fontFace: F, bold: true
});
s8.addText('https://github.com/imshota1009/dog-squad', {
  x: 1.8, y: 5.0, w: 10, h: 0.6,
  fontSize: 22, bold: true, color: C.white, fontFace: F
});

s8.addText('気になった方はぜひGitHubのリポジトリもご覧ください。\n189件分のプレイデータ・AIモデルの学習プログラム・分析結果がすべて公開されています。', {
  x: 1.5, y: 5.9, w: 10.3, h: 0.7,
  fontSize: 11, color: '94A3B8', align: 'center', fontFace: F, lineSpacing: 18
});

s8.addText(`最終更新日: ${TODAY}`, {
  x: 1.0, y: 6.8, w: 11, h: 0.3,
  fontSize: 11, color: C.accent, align: 'center', fontFace: F, bold: true
});

addFooter(s8, 8, TOTAL, true);


// ═══════════════════════════════════════════════════════════════
// ファイル出力
// ═══════════════════════════════════════════════════════════════
pptx.writeFile({ fileName: 'DOG_SQUAD_AI_Presentation.pptx' })
  .then(name => {
    console.log(`Premium presentation generated: ${name}`);
  })
  .catch(err => {
    console.error("Error:", err);
  });
