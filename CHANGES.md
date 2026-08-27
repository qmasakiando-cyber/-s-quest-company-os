# S-QUEST COMPANY OS — 今回の変更点

対象ファイル:

1. `src/components/os/PixelDesk.tsx`
   - 稼働状況オーラを追加（作業中=炎のパーティクル、待機中=z の休憩エフェクト）
   - 既存のドット絵デスク描画ロジックはそのまま維持

2. `src/components/os/JarvisCore.tsx`
   - オーブ表示から、目盛りリング＋進捗アーク＋方位ラベル(A〜F)付きの
     ブループリント風円形HUDゲージに再設計
   - `health` プロップを追加（会社の健全性を進捗アークに反映）

3. `src/components/os/QuestCore.tsx`
   - JarvisCore に health を渡すよう1行更新

4. `src/routes/index.tsx`
   - CEO指示バーに🎙音声入力ボタンを追加（Web Speech API / Chrome系ブラウザ対応）
   - 全社タスクパネルをローカルstate化し、その場でタスク追加・完了チェックができるように変更

5. `src/styles.css`
   - アニメーション用の keyframes / utility を追加
     (aura-work / aura-idle / ember-rise / zzz-float)
   - prefers-reduced-motion 対応にも追加済み

## 未着手（次のステップ候補）
- ダッシュボード埋め込みのカレンダーを月表示・予定追加できるインタラクティブ版に拡張
- JARVIS指示をチャット形式のモーダルにして、キーワードでA〜Fに自動ルーティングする機能
- company-data.ts のトーンをブランドカラー（プレイフルな配色）寄りに調整するかの検討

## 注意
この環境はネットワーク遮断のため npm install / dev server 起動によるビルド確認はできていません。
Lovable / ローカル環境に取り込んだ後、`npm run dev` で一度表示確認をお願いします。
