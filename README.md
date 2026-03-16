# Keishin Hospital Redesign (Zero-base)

## 参考サイト（インスパイア元）
- URL: https://www.hanamorithp.jp
- 選定理由（学んだ点）
  - UX: ファーストビューで「受診者導線」が明確（外来/入院/アクセス等）
  - 情報設計: 階層が浅く、グロナビ＋カードで迷子になりにくい
  - 余白/タイポ: 余白設計が丁寧で、見出しと本文のメリハリが強い
  - モバイル: セクション単位の情報分割が適切で縦スクロールで読める
  - CTA: 電話・受診案内・採用導線が常に見つかる
  - アクセシビリティ: コントラスト、スキップリンク、意味的な見出し構造

> ※レイアウト原則のみを参照し、色・文言・写真・実装はオリジナルで再設計（クローン禁止）

## 実装
- 11ty + Tailwind CLI（CDN不使用）
- 共通レイアウト: `src/_includes/layout.njk`
- 出力: `dist/`（GitHub Pages配信用）
- SEO: title/description/OGP + MedicalOrganization JSON-LD + sitemap.xml

## ページ
- `/` トップ
- `/care/` 診療案内
- `/hospitalization/` 入院案内
- `/facilities/` 施設案内
- `/access/` アクセス
- `/news/` お知らせ一覧
- `/news/system-update/` お知らせ詳細テンプレ
- `/recruit/` 採用

## 既存画像資産の継承
- `assets/images/original/` の画像を各ページで実使用
- 不足画像は日本語プレースホルダー枠を残して明示

## 開発コマンド
```bash
npm ci
npm run build
npm run dev
npm run audit   # 事前に `npx http-server dist -p 8080` などで配信
```

## 監査
- Playwright監査レポート: `_audit_hanamori_style/playwright_audit.md`
- スクショ: `_audit_hanamori_style/*.png`

## スキル化メモ（再利用手順）
1. 参照サイトを1つ選び、UI原則だけ抽出（クローン禁止）
2. IA（必要ページ）を固定して from-scratch でレイアウト設計
3. 11ty の共通レイアウト + Tailwind Design Token を先に実装
4. 既存資産の差し込みと不足枠プレースホルダー運用
5. SEO/JSON-LD/sitemap をビルド工程に統合
6. PlaywrightでPC/SP巡回、スクショとconsole errorをレポート化
7. Pagesへデプロイして公開URL検証
