專案開發指南與進度記錄 (v11.0)

這份文件旨在統整目前 (v11.0) 專案的最終架構、遇到的核心問題以及對應的修復策略。

1. 專案目前狀態 (v11.0)

經過 v8.x 以來的多次重構，專案目前達到一個桌面版與手機版邏輯分離的穩定狀態。

portfolio.html (主頁):

桌面版 (v11.0): 恢復 v9.x 的三欄式佈局。滾動採用「JS 滾輪劫持」 (wheel) 和「CSS 被動吸附」 (scroll-snap for Trackpad) 的混合模式。懸浮預覽視窗 (.random-preview-popup) 正常運作。

手機版 (v10.0): 滾動採用 v4.13 的「JS 觸控劫持」 (touchstart, preventDefault())。此方法繞過了行動裝置上 overflow: auto + grid 的渲染錯誤，確保列表可被滑動。懸浮預覽視窗在此模式下被 js/index.js 禁用，以防止觸控遮擋。

project.html / about.html (內頁):

桌面版 (v11.0): 恢復 v9.x 的二欄式佈局。Back/Next 按鈕已還原至 <aside class="left-column"> 的 .left-column-bottom 區塊中，佈局正常。

手機版 (v9.9): 採用原生 body 滾動。導航按鈕 (Back/Next) 被放置在一個固定的 <footer> (.subpage-footer) 中，懸浮於頁面底部。

gallery.html (畫廊頁):

桌面版 (v10.1): 顯示「無限畫布」，支援滑鼠拖曳 (mousedown) 和滾輪縮放 (wheel)。

手機版 (v10.1): 同樣顯示「無限畫布」，並支援「觸控拖曳」 (touchstart)。

佈局 (v11.0): HTML 結構已更新，Back 按鈕與 project.html 同步，放置於 .left-column-bottom 中，以修復桌面版佈局。

2. 核心檔案結構

專案的結構目前如下，js 和 css 分離，所有頁面共用 main.css。

/
├── index.html (載入頁面, 轉導至 portfolio.html)
├── portfolio.html (主頁/專案列表)
├── project.html (專案詳細頁模板)
├── about.html (關於我頁面)
├── gallery.html (畫廊/無限畫布頁面)
├── data/
│   └── projects.json (核心專案資料庫)
├── css/
│   └── main.css (全站主要樣式表 v11.0)
└── js/
    ├── index.js (portfolio.html 邏輯 v10.0)
    ├── project.js (project.html 邏輯 v1.x)
    └── gallery.js (gallery.html 邏輯 v10.1)


3. 主要問題與修復歷程 (v8.x - v11.0)

我們近期除錯的核心集中在兩個衝突點：

A. portfolio.html 手機版滾動失效

問題: 從 v8.x 開始，我們嘗試將 portfolio.html 的滾動從「JS 驅動」 (v4.13) 重構為「CSS 驅動」 (overflow: auto + scroll-snap)。

症狀: 此變更在桌面版有效，但在手機版 (iOS) 上，列表完全無法滾動。

除錯歷程:

v9.5: 懷疑 mask-image 或 transform 導致渲染錯誤。移除後，桌面版佈局跑版，手機版依舊無效。

v9.6: 懷疑 .random-preview-popup 的 pointer-events: none 在手機上失效，遮擋了觸控。在 JS 中禁用，問題依舊。

v9.8: 發現 css/main.css 中存在 overflow-y 規則衝突 (auto vs visible)。修正後，問題依舊。

最終修復 (v10.0 + v10.1):

結論: 手機瀏覽器 (iOS) 對 grid 佈局下的 overflow: auto 和 scroll-snap 組合存在渲染 Bug。

js/index.js (v10.0): 還原 v4.13 的 JS 驅動邏輯。在 isMobile() 判斷下，重新綁定 touchstart, touchmove, touchend 事件，並使用 event.preventDefault() 劫持原生觸控。

css/main.css (v10.1): 配合 JS，在手機 RWD 規則中，將 .portfolio-container .center-column 的 overflow-y 改回 visible，並移除 scroll-snap-type，將滾動控制權完全交還給 JavaScript。

B. project.html / about.html 桌面版佈局跑版

問題: 在 v9.9 版本中，為了修復內頁在手機版的 Back 按鈕佈局，我們錯誤地修改了 project.html 等檔案的 HTML 結構，將 .left-column-bottom (導航區) 從 <aside class="left-column"> 移出，放入了一個全域 <footer>。

症狀: 這導致桌面版的 grid 佈局失效。左側欄位的 margin-top: auto 壓縮了中間的 BIO/INFO 區塊，導致其消失；Back/Next 按鈕也因此錯位。

最終修復 (v11.0):

project.html / about.html / gallery.html (v11.0): 還原 HTML 結構。刪除 v9.9 引入的 <footer>，將 .left-column-bottom 區塊移回 <aside class="left-column"> 內部。

css/main.css (v11.0): 恢復 v9.x 的桌面版佈局。grid-template-columns (2 欄) 和 margin-top: auto (推底) 的 CSS 規則現在可以正確套用到統一的 HTML 結構上。

css/main.css (v11.0): 保留 v9.9 的手機版 fixed footer 邏輯。手機 RWD 規則現在會隱藏 .left-column-bottom (在 aside 內)，並顯示獨立的 .subpage-footer (在 body 層級)。

4. 關鍵架構決策 (v11.0)

目前專案採用了混合滾動模型 (Hybrid Scrolling Model)：

portfolio.html (主頁):

桌面版: JS (wheel) + CSS (scroll-snap)。

手機版: JS (touchstart + preventDefault)。

原因: 解決行動裝置上的 CSS 渲染 Bug。

gallery.html (畫廊):

桌面版: JS (mousedown + wheel)。

手機版: JS (touchstart + touchmove)。

原因: 統一所有裝置的「無限畫布」體驗。

project.html / about.html (內頁):

桌面版: CSS (overflow: auto on .project-content-column)。

手機版: CSS (overflow: auto on <body>)。

原因: 內容最單純，使用原生 (Native) 滾動最穩定。