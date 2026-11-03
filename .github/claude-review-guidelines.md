# Claude 自動レビューの観点（mahjong-calc 固有）

`.github/workflows/claude-review.yml` の自動レビューが参照する、このリポジトリ固有の観点です。
採用ルールや設計方針が変わったら、このファイルも更新してください。

## 1. 採用している点数ルール（仕様）

次の挙動は意図した仕様です。変更する PR では、仕様変更として説明とテストがあるかを確認してください。
仕様に沿ったコードを「一般的なルールと違う」という理由で指摘しないでください。

- **切り上げ満貫は採用しない。** 3翻60符・4翻30符は通常点。満貫は 5翻、3翻70符以上、4翻40符以上（`js/modules/calculator.js` の `isMangan`）。
- **点数名の境界:** 6翻〜跳満、8翻〜倍満、11翻〜三倍満、13翻以上は役満。
- **役満は 13翻として一律に扱う。** 複数役満の加算は未対応（Issue #8）。役満と通常役が同時に選ばれても通常役は加算しない（`js/modules/validator.js` の `calculateTotalHan`）。
- **有効な符数**（`js/data/constants.js` の `validFuByHan`）: 1翻は 30〜110符（20符・25符なし）、2〜4翻は 20・25・30〜110符、5翻以上は符を使わない。
- **固定符:** 七対子は 25符、平和はツモ 20符・ロン 30符。
- **ドラ（#7、PR #35 で対応）:** 役選択モードでドラ・赤ドラ・裏ドラの枚数を翻数に加える。
  - ドラは役ではないので、役が 1 つ以上あるときだけ加算する（ドラのみは 0翻で「役なし」）。
  - 役満にはドラを加算しない。通常役＋ドラが 13翻以上になったら数え役満として扱う。
  - 裏ドラは立直／ダブル立直のときだけ有効。立直を外して裏ドラが残った場合は黙って 0 にせず、役検証（`ura-dora-riichi`）で表示して計算を止める。
  - 上限はドラ 13・赤ドラ 3・裏ドラ 13（`DORA_LIMITS`）。手動入力モードは翻数を直接入力するためドラ入力の対象外。
- **未対応の機能:** 符の自動計算（#9）、手動入力での 25符（#22）、役のフィルタ（#6）。PR の対象外なら、未対応であることを不具合として指摘しない。

点数表 `js/data/scoreTable.js` や上記の閾値を変える差分は、親/子 × ロン/ツモの 4 通りすべてについて、標準的な点数表の値と照合してください。

## 2. 役の排他・複合ルール

- 役の組み合わせの検証は `js/modules/yakuValidation.js` の `validateYakuSelection` に一本化されている。UI 表示と計算直前の両方が `synchronizeYakuState` 経由でこれを使う。片方だけ別の判定を書く変更は、表示と計算結果の食い違いを生む（過去の不具合の原因）ので指摘する。
- 検証は「役の選択だけで確定できる制約」に限る方針。牌姿の成立判定・食い下がり・符計算は行わない。この範囲外の判定を求める指摘はしない。
- 役を追加・変更する場合は、`js/data/yakuData.js`、`yakuValidation.js` の排他ルール（`kokushiCompatible` などの許可リストを含む）、ルール根拠のコメントがそろって更新されているかを確認する。
- 役満と通常役の物理的に可能な複合は許可する方針。

## 3. 設計方針

- `js/modules/calculator.js` と `validator.js` は副作用のない純粋関数。DOM や状態への依存を持ち込む変更は指摘する。
- 状態は `StateManager`（`js/modules/stateManager.js`）が持ち、UI 更新は `stateSubscriptions.js` の購読で行う。DOM の値を正として直接読み書きする処理を新たに増やす変更は指摘する。
- ビルド工程はなく、素の ES Modules を `npm run serve`（http）で配信する。`file://` での起動は非対応。

## 4. セキュリティ（CSP）

`vercel.json` で厳しい CSP（`script-src 'self'`、`connect-src 'none'`、`form-action 'none'` など）を設定している。次は本番で動かなくなるか、防御を弱めるので指摘する。

- インラインの `<script>`、`onclick` などのインラインイベントハンドラ、`eval` / `new Function`
- 外部 CDN・外部フォント・外部 API への依存、`fetch` などの通信
- 表示データの `innerHTML` などによる HTML としての挿入。`js/modules/display.js` は `textContent` で描画する方針（`tests/security.spec.js` で検証）

## 5. テスト

- 計算・符・満貫の変更には Playwright テスト（`tests/calculation.spec.js`、`tests/mangan.spec.js`、`tests/yaku-fu.spec.js` など）の追加・更新があるか。
- 役の排他ルールの変更には、Node の単体テスト `tests/unit/yaku-validation.node.mjs` と `tests/yaku-consistency.spec.js` の更新があるか。
- CI は Chromium・モバイル Chrome の全テストと WebKit のスモークテスト（`tests/smoke.spec.js`）を実行する。iPhone の Safari に影響しそうな UI 変更で、スモークテストの範囲が足りているか。
- 固定時間の待機（`waitForTimeout`）を新たに増やすより、状態を待つ書き方を優先する。

## 6. UI

- スマホでの片手操作が主な用途。タップ領域の縮小、横スクロールの発生、モバイル Safari での表示崩れにつながる CSS 変更は指摘する（`tests/responsive.spec.js`）。
- 入力値を変えたら古い計算結果を隠す、という既存の挙動（`hideCalculationResult`）を壊していないか。
