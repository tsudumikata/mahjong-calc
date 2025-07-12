# 麻雀点数計算機 - ローカルファイル利用について

## 📁 ローカルファイルでの利用方法

### ✅ 推奨方法: ローカルサーバー経由
```bash
# npm serveを使用（推奨）
npm run serve
# http://localhost:3000 でアクセス

# または他のローカルサーバー
python -m http.server 3000
npx serve . -p 3000
```

### ⚠️ ファイル直接開きの制限事項

#### 問題
ブラウザで `index.html` を直接開く（file://プロトコル）と、点数表が表示されない場合があります。

#### 原因
- PWAマニフェスト（`manifest.json`）のCORSセキュリティ制限
- ブラウザのセキュリティポリシーによるファイル読み込み制限

#### 解決方法
**ローカルファイル専用版** `index-local.html` をご利用ください：

```
✅ index-local.html を直接ブラウザで開く
   → PWAマニフェストを無効化済み
   → 点数表が正常表示されます
```

## 🔧 技術的詳細

### CORSエラーの詳細
```
Origin null is not allowed by Access-Control-Allow-Origin
- manifest.json (PWAマニフェスト)
- favicon.ico
```

### 対応ファイル
| ファイル | 用途 | manifest.json |
|---------|------|---------------|
| `index.html` | Webサーバー用 | ✅ 有効 |
| `index-local.html` | ローカルファイル用 | ❌ 無効 |

## 🎯 利用環境別ガイド

### 📱 一般ユーザー
- **推奨**: `index-local.html` をダウンロードして直接開く
- **機能**: 全機能利用可能（PWA機能除く）

### 🖥️ 開発者
- **推奨**: `npm run serve` でローカルサーバー起動
- **機能**: PWA機能含む全機能利用可能

## 📞 サポート

ローカルファイルでの利用で問題が発生した場合：

1. `index-local.html` の利用を試す
2. ブラウザコンソールでエラー確認
3. GitHubリポジトリでissue報告

---

**作成日**: 2025年7月12日  
**対象バージョン**: v1.0.0以降