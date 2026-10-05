# Research Atlas｜跨語言學術檢索

以中文描述研究主題，自動擴展成多語言搜尋詞，從 OpenAlex 尋找國際論文，並以中文呈現每篇論文與研究主題的關聯性及摘要。

線上版本：[research-atlas-fullstack.vercel.app](https://research-atlas-fullstack.vercel.app)

## 功能

- 中文輸入後自動搜尋，不需要額外按下搜尋鍵
- 以概念、同義詞與多語言查詢擴展主題，不只比對原始字詞
- 整合 OpenAlex 論文資料與公開摘要
- 區分 SCI、SSCI、TSSCI 等索引的「已驗證」與「待驗證」狀態
- 顯示中文關聯性說明與中文摘要，方便使用者逐篇核對
- 支援收藏與研究專案；目前資料儲存在使用者瀏覽器
- 深色碳黑介面，以萊姆綠作為單一重點色

## 資料與驗證原則

Research Atlas 不會因為論文只出現某個關鍵字就直接納入。結果會綜合題名、摘要、主題概念與查詢擴展詞評估相關性，再呈現原始來源連結供使用者查證。

SCI、SSCI、TSSCI 屬於不同機構維護的索引。網站只在可取得權威名單並完成比對時標示為已驗證；無法確認時會明確顯示待驗證，不把推測當成認證。

翻譯功能會優先使用既有中文資料；需要備援時，搜尋詞與 OpenAlex 公開摘要可能送往 Google 翻譯。請勿輸入未公開或具識別性的研究資料。

## 本機執行

需要 Node.js 22.13 或更新版本。

```bash
npm ci
npm run dev
```

一般建置：

```bash
npm run build
```

Vercel 建置：

```bash
npm run build:vercel
```

程式碼檢查：

```bash
npm run lint
```

## 技術組成

- Next.js / React / TypeScript
- OpenAlex API
- Google 翻譯備援
- Vercel 部署

## 重要限制

- 搜尋結果與相關性說明是研究探索工具，不取代正式系統性文獻回顧。
- 期刊索引資格可能隨時間改變，投稿或引用前仍應回到 Clarivate、國科會等官方來源確認。
- OpenAlex 的中繼資料與摘要完整度依來源而異。

## 授權

目前尚未指定開源授權。公開瀏覽原始碼不等於授權他人重製、修改或再散布。
