# =====================================================================
# 【セル 1】ファイルのアップロードと読み込み
# =====================================================================
from google.colab import files
import pandas as pd

print("Excelファイル (dda_sessions.xlsx) または CSVファイルをアップロードしてください。")
uploaded = files.upload()

# アップロードされたファイル名を取得
filename = list(uploaded.keys())[0]
print(f"アップロードされたファイル: {filename}")

# 拡張子に合わせて読み込み方法を自動選択
if filename.endswith('.csv'):
    df = pd.read_csv(filename)
else:
    # Excelファイルを読み込む（openpyxl が必要な場合がありますが、Colabには標準搭載されています）
    df = pd.read_excel(filename)

print("データの読み込みに成功しました！")
# データの最初の数行を表示して確認
df.head()


# %%
# =====================================================================
# 【セル 2】データの加工・AIの学習・グラフ描画
# =====================================================================
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

# 時間順に並び替え
df['ts'] = pd.to_datetime(df['ts'])
df = df.sort_values('ts').reset_index(drop=True)

# 文字データを数値に変換するための設定
stage_map = { 'park': 0, 'beach': 1, 'snow': 2 }
diff_map = { 'easy': 0, 'normal': 1, 'hard': 2, 'endless': 3 }
breed_map = { 'shiba': 0, 'golden': 1, 'dal': 2, 'corgi': 3, 'husky': 4, 'pug': 5 }

diff_mult_map = { 'easy': 0.8, 'normal': 1.0, 'hard': 1.3, 'endless': 1.5 }
stage_fact_map = { 'park': 1.0, 'beach': 1.15, 'snow': 1.3 }

# スコアの補正と勝敗の数値化
df['stage_factor'] = df['stage'].map(stage_fact_map)
df['diff_factor'] = df['diff'].map(diff_mult_map)
df['score_norm'] = df['score'] / (df['stage_factor'] * df['diff_factor'])
df['win_num'] = df['win'].apply(lambda x: 1.0 if str(x).upper() == 'TRUE' else 0.0)

# 各プレイヤーの過去5回分の平均戦績をシミュレート
avg_hp_pct = []
avg_wave_pct = []
win_rate = []
avg_score_norm = []

global_avg_hp = df['hp_pct'].mean()
global_avg_wave = df['wave_pct'].mean()
global_win = df['win_num'].mean()
global_avg_score = df['score_norm'].mean()

for i in range(len(df)):
    if i == 0:
        avg_hp_pct.append(global_avg_hp)
        avg_wave_pct.append(global_avg_wave)
        win_rate.append(global_win)
        avg_score_norm.append(global_avg_score)
    else:
        recent = df.iloc[max(0, i-5):i]
        avg_hp_pct.append(recent['hp_pct'].mean())
        avg_wave_pct.append(recent['wave_pct'].mean())
        win_rate.append(recent['win_num'].mean())
        avg_score_norm.append(recent['score_norm'].mean())

df['avg_hp_pct'] = avg_hp_pct
df['avg_wave_pct'] = avg_wave_pct
df['win_rate'] = win_rate
df['avg_score_norm'] = avg_score_norm

# 入力データ (X) の整理とスケーリング (0〜1の範囲に揃える)
df['stage_val'] = df['stage'].map(stage_map).fillna(0) / 2.0
df['diff_val'] = df['diff'].map(diff_map).fillna(1) / 3.0
df['breed_val'] = df['breed'].map(breed_map).fillna(0) / 5.0

df['sc_avg_hp'] = df['avg_hp_pct'] / 100.0
df['sc_avg_wave'] = df['avg_wave_pct'] / 100.0
df['sc_avg_score'] = (df['avg_score_norm'] / 1000000.0).clip(0, 1.0)
df['sc_upgrade'] = (df['upgrade_total'] / 40.0).clip(0, 1.0)

X = df[['stage_val', 'diff_val', 'breed_val', 'sc_avg_hp', 'sc_avg_wave', 'win_rate', 'sc_avg_score', 'sc_upgrade']].values

# 目標の難易度調整倍率 (Y) の決定
Y_target = []
for idx, row in df.iterrows():
    curr_mult = diff_mult_map.get(row['diff'], 1.0)
    win = str(row['win']).upper() == 'TRUE'
    hp_pct = row['hp_pct']
    
    if win:
        if hp_pct >= 20 and hp_pct <= 70:
            t_mult = curr_mult # ちょうど良い
        elif hp_pct > 70:
            t_mult = curr_mult * 1.3 # 簡単すぎたので難易度を上げる
        else:
            t_mult = curr_mult * 0.8 # 難しすぎたので難易度を下げる
    else:
        t_mult = curr_mult * 0.6 # 負けたので難易度を大幅に下げる
        
    t_mult = max(0.6, min(1.8, t_mult))
    Y_target.append(t_mult)

df['target_multiplier'] = Y_target
# AIの学習用に 0〜1 の値に変換
Y = (df['target_multiplier'] - 0.6) / 1.2

print(f"データの準備完了: データ形状 {X.shape}, 目標形状 {Y.shape}")

# AIモデルの構築
model = tf.keras.Sequential([
    tf.keras.layers.Dense(16, activation='relu', input_shape=(8,)),
    tf.keras.layers.Dense(8, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid') # 出力を0〜1にする
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.01),
    loss='mean_squared_error'
)

print("AIモデルの学習を開始します...")
history = model.fit(
    X, Y,
    epochs=80,
    batch_size=16,
    verbose=1
)

# 予測結果を算出して元の倍率に戻す
predictions = model.predict(X)
predicted_multiplier = predictions * 1.2 + 0.6
df['predicted_multiplier'] = predicted_multiplier

print("学習完了！結果をグラフで表示します...")

# グラフの作成
plt.figure(figsize=(14, 5))

# グラフ1: 学習が進むにつれてエラーが減っているか
plt.subplot(1, 2, 1)
plt.plot(history.history['loss'], color='dodgerblue', lw=2)
plt.title('AI Learning Progress (Loss over Epochs)', fontsize=12)
plt.xlabel('Epochs (Repeat Count)')
plt.ylabel('Error (Loss)')
plt.grid(True, linestyle='--', alpha=0.6)

# グラフ2: 理想の調整値とAIの予測値の比較
plt.subplot(1, 2, 2)
plt.scatter(df['target_multiplier'], df['predicted_multiplier'], alpha=0.5, color='orange', label='Session')
plt.plot([0.6, 1.8], [0.6, 1.8], color='red', linestyle='--', label='Perfect Prediction')
plt.title('Target vs AI Predicted Difficulty Multiplier', fontsize=12)
plt.xlabel('Target Multiplier (Ideal)')
plt.ylabel('Predicted Multiplier (AI)')
plt.legend()
plt.grid(True, linestyle='--', alpha=0.6)

plt.tight_layout()
plt.show()
