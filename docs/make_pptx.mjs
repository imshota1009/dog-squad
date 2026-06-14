import pptxgen from "pptxgenjs";

const prs = new pptxgen();
prs.layout = "LAYOUT_WIDE"; // 16:9

// ── カラーパレット ──
const BG    = "111111";
const ACCENT= "FFE34D";
const WHITE = "FFFFFF";
const GRAY  = "888888";
const GREEN = "4CAF50";
const BLUE  = "2196F3";

const font  = "Yu Gothic UI";

// ── 共通ヘルパー ──
function slide(title, subtitle){
  const s = prs.addSlide();
  s.background = { color: BG };
  if(title){
    s.addText(title, {
      x:0.5, y:0.3, w:12, h:0.7,
      fontSize:32, bold:true, color:ACCENT, fontFace:font
    });
  }
  if(subtitle){
    s.addText(subtitle, {
      x:0.5, y:1.05, w:12, h:0.4,
      fontSize:14, color:GRAY, fontFace:font
    });
  }
  return s;
}

function label(s, text, x, y, w, h, opts={}){
  s.addText(text, { x, y, w, h, fontFace:font, color:WHITE, fontSize:13, ...opts });
}

function box(s, text, x, y, w, h, bg=ACCENT, tc="111111", fs=13){
  s.addShape(prs.ShapeType.roundRect, { x, y, w, h, fill:{color:bg}, line:{color:bg}, rectRadius:0.1 });
  s.addText(text, { x, y, w, h, align:"center", valign:"middle", fontFace:font, color:tc, fontSize:fs, bold:true });
}

// ──────────────────────────────────────
// SLIDE 1: タイトル
// ──────────────────────────────────────
{
  const s = prs.addSlide();
  s.background = { color: BG };
  s.addText("DOG SQUAD: SQUIRREL SIEGE", {
    x:0.5, y:1.2, w:12.5, h:1.0,
    fontSize:40, bold:true, color:ACCENT, fontFace:font, align:"center"
  });
  s.addText("機械学習 × 動的難易度調整（DDA）実装計画", {
    x:0.5, y:2.4, w:12.5, h:0.6,
    fontSize:22, color:WHITE, fontFace:font, align:"center"
  });
  s.addText("NekoDev Studio  ／  2026", {
    x:0.5, y:3.4, w:12.5, h:0.5,
    fontSize:16, color:GRAY, fontFace:font, align:"center"
  });
  // 区切り線
  s.addShape(prs.ShapeType.line, { x:3.5, y:3.3, w:6.5, h:0, line:{color:ACCENT, width:2} });

  // dog face decorations (simple circles)
  for(let i=0;i<3;i++){
    s.addShape(prs.ShapeType.ellipse, {
      x: 1.5 + i*4.5, y:4.3, w:0.7, h:0.7,
      fill:{color:"333333"}, line:{color:"555555"}
    });
  }
}

// ──────────────────────────────────────
// SLIDE 2: ゲーム概要
// ──────────────────────────────────────
{
  const s = slide("🎮  ゲーム概要", "DOG SQUAD: SQUIRREL SIEGE とは");

  const items = [
    ["ジャンル", "ブラウザ 3D タワーディフェンス × アクション"],
    ["テック", "Three.js / Web Audio API / Firebase Firestore"],
    ["プレイ方法", "ブラウザで即プレイ — https://dog-squad-game-app.web.app"],
    ["マルチプレイ", "最大6人同時対戦（Firebase Firestore リレー）"],
    ["ステージ", "3ステージ（公園 / ビーチ / 雪）× 4難易度"],
    ["犬種", "6種の犬を選択、それぞれ異なるスキル"],
    ["ショップ", "ほねコインで永続強化できるオーナーショップ"],
  ];

  items.forEach(([k,v],i)=>{
    const y = 1.55 + i*0.54;
    s.addShape(prs.ShapeType.rect, { x:0.5, y, w:3.0, h:0.42, fill:{color:"222222"}, line:{color:"333333"} });
    s.addText(k, { x:0.5, y, w:3.0, h:0.42, fontFace:font, color:ACCENT, fontSize:12, bold:true, align:"center", valign:"middle" });
    s.addText(v, { x:3.65, y:y+0.04, w:9.2, h:0.34, fontFace:font, color:WHITE, fontSize:13 });
  });
}

// ──────────────────────────────────────
// SLIDE 3: なぜ機械学習？
// ──────────────────────────────────────
{
  const s = slide("🤔  なぜ機械学習を組み込むのか？");

  const problems = [
    "固定難易度では「簡単すぎる」か「難しすぎる」かのどちらかになりやすい",
    "プレイヤーごとにスキルレベルは大きく異なる",
    "ショップ強化によってプレイヤーの実力が変化する",
    "単純なルールベースでは対応しきれないパターンがある",
  ];
  s.addText("❌  現状の課題", { x:0.5, y:1.5, w:6, h:0.4, fontFace:font, color:"FF6B6B", fontSize:16, bold:true });
  problems.forEach((p,i)=>{
    s.addText("• "+p, { x:0.7, y:2.0+i*0.52, w:12, h:0.44, fontFace:font, color:WHITE, fontSize:13 });
  });

  s.addShape(prs.ShapeType.line, { x:0.5, y:4.25, w:12.5, h:0, line:{color:"333333", width:1} });

  const solutions = [
    "プレイデータを蓄積し、モデルが「最適な難しさ」を学習する",
    "upgrade_total を特徴量に入れ、強化済みプレイヤーも正しく評価",
    "ゲームを楽しく続けてもらえるリテンション向上につながる",
  ];
  s.addText("✅  機械学習で解決できること", { x:0.5, y:4.4, w:7, h:0.4, fontFace:font, color:GREEN, fontSize:16, bold:true });
  solutions.forEach((p,i)=>{
    s.addText("• "+p, { x:0.7, y:4.9+i*0.48, w:12, h:0.4, fontFace:font, color:WHITE, fontSize:13 });
  });
}

// ──────────────────────────────────────
// SLIDE 4: 3フェーズ全体像
// ──────────────────────────────────────
{
  const s = slide("🗺️  実装ロードマップ — 3フェーズ");

  const phases = [
    { num:"Phase 1", title:"データ収集", status:"✅ 完了", color:GREEN,
      items:["ゲーム終了時に Firestore へ自動保存","品質フィルター付き（60秒 / WAVE2以上）","やめた理由を4択で取得（汚染防止）","ショップ強化レベルも記録"] },
    { num:"Phase 2", title:"モデル訓練", status:"⏳ 待機中", color:ACCENT,
      items:["Firestore → CSV エクスポート","Python + scikit-learn でモデル訓練","入力: stage/diff/breed/score/upgrade_total","出力: 推奨難易度倍率 0.6〜1.8","TF.js フォーマットに変換"] },
    { num:"Phase 3", title:"ゲーム内推論", status:"⏳ 待機中", color:BLUE,
      items:["TF.js をゲームに組み込み","ゲーム開始前に過去成績から倍率推論","敵HP / 速度 / 出現間隔にリアルタイム適用","フォールバック: ルールベース維持"] },
  ];

  phases.forEach((p,i)=>{
    const x = 0.4 + i*4.4;
    s.addShape(prs.ShapeType.roundRect, { x, y:1.5, w:4.0, h:4.7, fill:{color:"1a1a1a"}, line:{color:p.color, width:2}, rectRadius:0.15 });
    s.addText(p.num, { x, y:1.6, w:4.0, h:0.35, fontFace:font, color:p.color, fontSize:11, bold:true, align:"center" });
    s.addText(p.title, { x, y:1.95, w:4.0, h:0.5, fontFace:font, color:WHITE, fontSize:18, bold:true, align:"center" });
    s.addShape(prs.ShapeType.roundRect, { x:x+0.3, y:2.5, w:3.4, h:0.32, fill:{color:p.color}, line:{color:p.color}, rectRadius:0.06 });
    s.addText(p.status, { x:x+0.3, y:2.5, w:3.4, h:0.32, fontFace:font, color:"111111", fontSize:12, bold:true, align:"center", valign:"middle" });
    p.items.forEach((item,j)=>{
      s.addText("• "+item, { x:x+0.2, y:3.0+j*0.52, w:3.6, h:0.44, fontFace:font, color:WHITE, fontSize:11 });
    });
  });
}

// ──────────────────────────────────────
// SLIDE 5: データ収集の設計
// ──────────────────────────────────────
{
  const s = slide("📊  Phase 1 — 収集データ設計");

  s.addText("Firestore: dda_sessions コレクション", { x:0.5, y:1.5, w:12, h:0.4, fontFace:font, color:ACCENT, fontSize:15, bold:true });

  const fields = [
    ["ゲーム文脈", "stage, diff, breed, mode"],
    ["結果", "win, rank, wave_reached, wave_pct"],
    ["パフォーマンス", "score, kills, max_combo, clear_time"],
    ["体力", "hp_remaining, hp_pct"],
    ["強化状態 ★新", "upgrades{}, upgrade_total"],
    ["やめた理由 ★新", "quit_reason: too_hard / gameover / bored / no_time / other"],
    ["メタ", "lang, ts（サーバータイムスタンプ）"],
  ];

  fields.forEach(([k,v],i)=>{
    const y = 2.05 + i*0.5;
    s.addShape(prs.ShapeType.rect, { x:0.5, y, w:3.2, h:0.4, fill:{color:"222222"}, line:{color:"333333"} });
    s.addText(k, { x:0.5, y, w:3.2, h:0.4, fontFace:font, color:ACCENT, fontSize:11, bold:true, align:"center", valign:"middle" });
    s.addText(v, { x:3.85, y:y+0.04, w:9.0, h:0.32, fontFace:font, color:WHITE, fontSize:12 });
  });
}

// ──────────────────────────────────────
// SLIDE 6: 品質フィルター & やめた理由
// ──────────────────────────────────────
{
  const s = slide("🔍  データ品質を守る2つの仕組み");

  // Left: Quality filter
  s.addText("① セッション品質フィルター", { x:0.5, y:1.5, w:6, h:0.4, fontFace:font, color:GREEN, fontSize:16, bold:true });
  const filters = [
    ["プレイ時間", "60秒以上", "短すぎるプレイを除外"],
    ["到達WAVE", "WAVE 2以上", "序盤離脱を除外"],
    ["やめた理由", "too_hard / gameover のみ採用", "難易度無関係の離脱を除外"],
  ];
  filters.forEach(([k,v,note],i)=>{
    const y = 2.05 + i*0.82;
    box(s, k, 0.5, y, 2.4, 0.38, "333333", ACCENT);
    s.addText("✅  "+v, { x:3.05, y:y+0.01, w:3.2, h:0.35, fontFace:font, color:WHITE, fontSize:12, bold:true });
    s.addText(note, { x:3.05, y:y+0.33, w:3.2, h:0.3, fontFace:font, color:GRAY, fontSize:10 });
  });

  // Right: Quit reason
  s.addShape(prs.ShapeType.line, { x:6.7, y:1.45, w:0, h:5.2, line:{color:"333333", width:1} });
  s.addText("② やめた理由モーダル", { x:7.0, y:1.5, w:6, h:0.4, fontFace:font, color:ACCENT, fontSize:16, bold:true });
  s.addText("「あきらめる」ボタンを押すと理由を4択で聞く", { x:7.0, y:1.95, w:6, h:0.35, fontFace:font, color:GRAY, fontSize:12 });

  const reasons = [
    ["😣 難しすぎた", "too_hard", GREEN, "DDA 学習に採用"],
    ["😴 飽きた",     "bored",    "555555", "DDA から除外"],
    ["⏰ 時間がなくなった","no_time","555555","DDA から除外"],
    ["🤔 その他",    "other",    "555555", "DDA から除外"],
  ];
  reasons.forEach(([label,code,color,note],i)=>{
    const y = 2.55 + i*0.72;
    box(s, label, 7.0, y, 3.4, 0.38, color==="555555"?"333333":color, color==="555555"?GRAY:WHITE, 12);
    s.addText(note, { x:10.55, y:y+0.04, w:2.6, h:0.32, fontFace:font, color:color==="555555"?GRAY:GREEN, fontSize:11 });
  });
}

// ──────────────────────────────────────
// SLIDE 7: ランキング機能
// ──────────────────────────────────────
{
  const s = slide("🏆  ランキング機能（新追加）");

  s.addText("プレイヤーのモチベーションを高めるグローバルランキング", {
    x:0.5, y:1.5, w:12.5, h:0.4, fontFace:font, color:GRAY, fontSize:14
  });

  const features = [
    { icon:"🏆", title:"グローバルランキング", desc:"スコア上位20名をリアルタイム表示\nFirestore onSnapshot で自動更新" },
    { icon:"🎖️", title:"ゲーム終了後に名前登録", desc:"リザルト画面から名前を入力して即登録\n過去の名前は自動で引き継ぎ" },
    { icon:"🔍", title:"フィルター機能", desc:"ステージ別（park/beach/snow）\n難易度別（easy/normal/hard/endless）" },
    { icon:"🥇🥈🥉", title:"メダル表示", desc:"1〜3位はゴールド/シルバー/ブロンズメダル\n自分のスコアはハイライト表示" },
  ];

  features.forEach((f,i)=>{
    const x = 0.4 + (i%2)*6.5;
    const y = 2.1 + Math.floor(i/2)*2.0;
    s.addShape(prs.ShapeType.roundRect, { x, y, w:6.1, h:1.7, fill:{color:"1a1a1a"}, line:{color:"333333"}, rectRadius:0.12 });
    s.addText(f.icon+" "+f.title, { x:x+0.2, y:y+0.15, w:5.7, h:0.45, fontFace:font, color:ACCENT, fontSize:15, bold:true });
    s.addText(f.desc, { x:x+0.2, y:y+0.65, w:5.7, h:0.85, fontFace:font, color:WHITE, fontSize:12 });
  });
}

// ──────────────────────────────────────
// SLIDE 8: Phase 2 モデル設計（予定）
// ──────────────────────────────────────
{
  const s = slide("🧠  Phase 2 — MLモデル設計（予定）", "データが100〜200セッション溜まったら着手");

  // Input
  s.addText("入力特徴量（X）", { x:0.5, y:1.6, w:5.5, h:0.38, fontFace:font, color:ACCENT, fontSize:15, bold:true });
  const inputs = ["stage（park/beach/snow）","diff（easy/normal/hard/endless）",
    "breed（6犬種）","avg_hp_pct（過去N回の平均残HP%）",
    "avg_wave_pct（平均進行率%）","win_rate（勝率）",
    "upgrade_total ★（アップグレード合計Lv）"];
  inputs.forEach((t,i)=>{
    s.addText("• "+t, { x:0.7, y:2.05+i*0.44, w:5.5, h:0.38, fontFace:font, color:WHITE, fontSize:12 });
  });

  // Arrow
  s.addShape(prs.ShapeType.line, { x:6.25, y:3.2, w:1.0, h:0, line:{color:ACCENT, width:3} });
  s.addText("➡", { x:6.3, y:3.0, w:0.9, h:0.5, fontFace:font, color:ACCENT, fontSize:22, align:"center" });

  // Output
  s.addText("出力（Y）", { x:7.4, y:1.6, w:5.5, h:0.38, fontFace:font, color:GREEN, fontSize:15, bold:true });
  box(s, "推奨難易度倍率\n0.6 〜 1.8", 7.4, 2.1, 5.5, 1.2, "1a3a1a", GREEN, 18);
  s.addText("hp_pct が 20〜70% に収まる倍率を学習", { x:7.4, y:3.45, w:5.5, h:0.4, fontFace:font, color:GRAY, fontSize:12 });

  s.addShape(prs.ShapeType.line, { x:0.5, y:4.2, w:12.5, h:0, line:{color:"333333", width:1} });
  s.addText("モデル候補:", { x:0.5, y:4.35, w:3, h:0.35, fontFace:font, color:GRAY, fontSize:12, bold:true });
  const models = [
    ["Random Forest", "100+ セッション向け\n解釈しやすい・過学習しにくい"],
    ["小規模NN（3層）", "200+ セッション向け\nTF.js に直接変換できる"],
    ["Gradient Boosting", "300+ セッション向け\n精度が高い"],
  ];
  models.forEach(([name,desc],i)=>{
    const x = 0.5 + i*4.3;
    s.addShape(prs.ShapeType.roundRect, { x, y:4.8, w:4.0, h:1.2, fill:{color:"1a1a1a"}, line:{color:"333333"}, rectRadius:0.1 });
    s.addText(name, { x, y:4.85, w:4.0, h:0.38, fontFace:font, color:ACCENT, fontSize:13, bold:true, align:"center" });
    s.addText(desc, { x:x+0.15, y:5.25, w:3.7, h:0.65, fontFace:font, color:WHITE, fontSize:11 });
  });
}

// ──────────────────────────────────────
// SLIDE 9: 必要データ量
// ──────────────────────────────────────
{
  const s = slide("📈  データ収集目標");

  const rows = [
    ["〜50 セッション",    "ほぼルールベースと同じ", "❌ 少なすぎ"],
    ["100〜200 セッション","簡単なパターンは学習可能","⚠️ 最低ライン"],
    ["200〜300 セッション","犬種・ステージ別の傾向も取れる","✅ 推奨"],
    ["500+",               "かなり精度が上がる",       "🌟 理想"],
  ];

  s.addText("目標: 友達 5〜10人 × 各 20〜30 回プレイ（合計 100〜300 セッション）", {
    x:0.5, y:1.55, w:12.5, h:0.42, fontFace:font, color:ACCENT, fontSize:14, bold:true
  });

  const cols = ["サンプル数","モデル精度","判定"];
  const colW = [4.5, 5.5, 2.5];
  const colX = [0.5, 5.1, 10.7];
  // Header
  cols.forEach((c,i)=>{
    s.addShape(prs.ShapeType.rect, { x:colX[i], y:2.1, w:colW[i]-0.1, h:0.4, fill:{color:"333333"}, line:{color:"444444"} });
    s.addText(c, { x:colX[i], y:2.1, w:colW[i]-0.1, h:0.4, fontFace:font, color:ACCENT, fontSize:12, bold:true, align:"center", valign:"middle" });
  });
  rows.forEach((row,i)=>{
    const y = 2.6 + i*0.65;
    const bg = i===2?"1a3a1a":"1a1a1a";
    row.forEach((cell,j)=>{
      s.addShape(prs.ShapeType.rect, { x:colX[j], y, w:colW[j]-0.1, h:0.55, fill:{color:bg}, line:{color:"333333"} });
      s.addText(cell, { x:colX[j]+0.1, y, w:colW[j]-0.2, h:0.55, fontFace:font, color:i===2?GREEN:WHITE, fontSize:12, valign:"middle" });
    });
  });

  s.addShape(prs.ShapeType.line, { x:0.5, y:5.3, w:12.5, h:0, line:{color:"333333", width:1} });
  s.addText("Phase 2 開始タイミング: Firestore の dda_sessions ドキュメント数が 100 を超えたら着手", {
    x:0.5, y:5.45, w:12.5, h:0.4, fontFace:font, color:GRAY, fontSize:12
  });
}

// ──────────────────────────────────────
// SLIDE 10: 技術スタック全体像
// ──────────────────────────────────────
{
  const s = slide("🛠️  技術スタック全体像");

  const stacks = [
    { layer:"ゲーム（フロントエンド）", color:"2a2a5a",
      items:["HTML / CSS（CSSアートでキャラクター描画）","JavaScript（ゲームロジック・ネット同期）",
             "Three.js（3D描画）","Web Audio API（BGM・SE リアルタイム合成）",
             "TensorFlow.js（Phase 3: ブラウザ内 ML 推論）"] },
    { layer:"バックエンド / インフラ", color:"2a5a2a",
      items:["Firebase Hosting（ゲーム配信）",
             "Firebase Firestore（マルチプレイ通信 / DDA データ収集 / ランキング）",
             "Firebase Firestore Rules（セキュリティ設定）"] },
    { layer:"機械学習パイプライン（Phase 2）", color:"5a3a00",
      items:["Python + pandas（データ前処理）",
             "scikit-learn / TensorFlow（モデル訓練）",
             "tensorflowjs_converter（TF.js フォーマット変換）"] },
  ];

  stacks.forEach((stack,i)=>{
    const y = 1.5 + i*1.85;
    s.addShape(prs.ShapeType.roundRect, { x:0.4, y, w:12.8, h:1.7, fill:{color:stack.color}, line:{color:"444444"}, rectRadius:0.1 });
    s.addText(stack.layer, { x:0.6, y:y+0.1, w:5, h:0.4, fontFace:font, color:ACCENT, fontSize:13, bold:true });
    const half = Math.ceil(stack.items.length/2);
    stack.items.forEach((item,j)=>{
      const col = j<half?0:1;
      const row = j<half?j:j-half;
      const ix = 0.7 + col*6.5;
      const iy = y+0.55+row*0.46;
      s.addText("• "+item, { x:ix, y:iy, w:6.2, h:0.4, fontFace:font, color:WHITE, fontSize:11 });
    });
  });
}

// ──────────────────────────────────────
// SLIDE 11: まとめ & 今後
// ──────────────────────────────────────
{
  const s = prs.addSlide();
  s.background = { color: BG };

  s.addText("まとめ & 今後の展望", {
    x:0.5, y:0.3, w:12.5, h:0.7, fontFace:font, fontSize:32, bold:true, color:ACCENT, align:"center"
  });
  s.addShape(prs.ShapeType.line, { x:2, y:1.05, w:9.5, h:0, line:{color:ACCENT, width:2} });

  const done = [
    "✅  Firestore へのセッションデータ自動収集（Phase 1 完了）",
    "✅  セッション品質フィルター（60秒 / WAVE2 / やめた理由）",
    "✅  ショップ強化レベルを記録（モデルのバイアス防止）",
    "✅  グローバルランキング機能（リアルタイム更新）",
    "✅  やめた理由モーダル（DDAデータの汚染防止）",
  ];
  const next = [
    "⏳  データ収集中（友達5〜10人 × 20〜30回）",
    "⏳  Phase 2: Python でモデル訓練 → TF.js 変換",
    "⏳  Phase 3: ブラウザ内リアルタイム難易度調整",
  ];

  s.addText("達成済み", { x:0.5, y:1.3, w:6.2, h:0.38, fontFace:font, color:GREEN, fontSize:16, bold:true });
  done.forEach((t,i)=>s.addText(t, { x:0.7, y:1.8+i*0.52, w:6.0, h:0.44, fontFace:font, color:WHITE, fontSize:12 }));

  s.addShape(prs.ShapeType.line, { x:6.8, y:1.2, w:0, h:5.5, line:{color:"333333", width:1} });

  s.addText("これから", { x:7.2, y:1.3, w:6.0, h:0.38, fontFace:font, color:ACCENT, fontSize:16, bold:true });
  next.forEach((t,i)=>s.addText(t, { x:7.4, y:1.8+i*0.7, w:5.8, h:0.58, fontFace:font, color:WHITE, fontSize:12 }));

  s.addShape(prs.ShapeType.roundRect, { x:2.5, y:5.3, w:8.5, h:0.8, fill:{color:"1a1a1a"}, line:{color:ACCENT, width:2}, rectRadius:0.15 });
  s.addText("🎮  今すぐプレイ: https://dog-squad-game-app.web.app", {
    x:2.5, y:5.3, w:8.5, h:0.8, fontFace:font, color:ACCENT, fontSize:15, bold:true, align:"center", valign:"middle"
  });
}

// ── 出力 ──
await prs.writeFile({ fileName: "C:/Users/shota/.gemini/antigravity-ide/scratch/dog-squad/docs/DDA_presentation.pptx" });
console.log("✅ PPTX generated");