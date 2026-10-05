import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px", color: "#1f2a24", fontFamily: "system-ui, sans-serif", lineHeight: 1.75 }}>
      <Link href="/" style={{ color: "#22543d" }}>← 回到論證 Research Atlas</Link>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, lineHeight: 1.15, marginTop: 28 }}>隱私與資料說明</h1>
      <p>最後更新：2026 年 10 月 6 日</p>

      <h2>搜尋資料怎麼流動</h2>
      <p>你輸入的研究主題會送到本站後端，再由後端向 OpenAlex 取得學術文獻，並視需要透過 MyMemory 翻譯搜尋詞與公開摘要；當主要翻譯服務無法使用時，Google 翻譯會作為備援。瀏覽器不會直接連到這些外部服務。為了降低重複請求與改善速度，查詢結果與翻譯可能暫存在伺服器快取。</p>

      <h2>帳號與保存內容</h2>
      <p>搜尋不需要登入。收藏的論文、自訂分類與最近研究目前只保留在你的瀏覽器，不會上傳到本站資料庫，因此不會自動同步到其他裝置或瀏覽器。</p>

      <h2>研究品質界線</h2>
      <p>本站使用可公開查詢的 OpenAlex 書目資料、引用數、主題、關鍵字與摘要進行探索及初篩。期刊的 ISSN 或公開刊名會送往 Clarivate Master Journal List，精確比對目前的 SCIE、SSCI、AHCI 與 ESCI 期刊層級狀態；TSSCI 則在本站後端比對 2025 年官方名單。這不等同於證明單篇文章在其出版年度已被 Web of Science 收錄。中文摘要為機器翻譯節錄，不取代原文。</p>

      <h2>你的控制權</h2>
      <p>你可以隨時取消收藏、調整分類，或清除瀏覽器網站資料來刪除所有本機保存內容。CSV、RIS 與 BibTeX 匯出只會在你的裝置上產生下載檔案。</p>
    </main>
  );
}
