專案開發指南與進度記錄 (v11.11)

這份文件旨在統整目前 (v11.11) 專案的最終架構、遇到的核心問題、修復策略，以及未來的優化方向。

專案目前狀態 (v11.11)

經過 v11.0 至 v11.11 的多次修正，專案已達到桌面版與手機版佈局/互動一致的穩定狀態。桌面版運行狀況良好。

portfolio.html (主頁):

桌面版 (v11.11):

佈局: v9.x 的三欄式佈局。

滾動: (v11.10) 恢復「JS 滾輪劫持」 (wheel) 模式，移除 CSS Scroll Snap，以實現精確的「iOS 鬧鐘選擇器」手感 (一格一跳)。

預覽: 啟用「JS 浮動預覽視窗」 (.random-preview-popup)，視窗大小、位置隨機。

連結: 導航連結 (Me/Gallery/Insta/Email) 已移至左欄底部。

手機版 (v11.11):

佈局: v10.0 的雙層 Footer 結構 (上層篩選器，下層聯絡連結)。

滾動: v4.13 的「JS 觸控劫持」 (touchstart, preventDefault())。

預覽: (v11.4) 啟用「JS 浮動預覽視窗」 (.random-preview-popup)，以匹配桌面版體驗。

project.html / about.html / gallery.html (內頁):

桌面版 (v11.11):

佈局: (v11.2) 恢復 v9.x 的二欄式佈局，並將容器高度鎖定為 calc(100vh - 60px)。

滾動: (v11.2) 滾動範圍限定在右側的內容欄位 (overflow: auto)。gallery.html 除外 (全頁鎖定)。

對齊: (v11.3) about.html 的左欄資訊區塊已垂直置中 (同 portfolio.html)。

gallery.html: (v11.7) 採用全螢幕無限畫布設計，Canvas 位於中層 (z-index: 1)，UI 位於底層 (z-index: 0) 與頂層 (z-index: 2)。

手機版 (v11.11):

佈局: (v11.2) 恢復 v9.9 的「原生 body 滾動」 (容器 height: auto)。gallery.html 除外 (全頁鎖定)。

導航: 導航按鈕 (Back/Next) 被放置在一個固定的 <footer> (.subpage-footer) 中。

核心檔案結構

專案的結構目前如下，js 和 css 分離，所有頁面共用 main.css。

/
├── index.html (載入頁面, 轉導至 portfolio.html)
├── portfolio.html (主頁/專案列表)
├── project.html (專案詳細頁模板)
├── about.html (關於我頁面)
├── gallery.html (畫廊/無限畫布頁面)
├── data/
├── css/
│   └── main.css (全站主要樣式表 v11.11)
└── js/
    ├── index.js (portfolio.html 邏輯 v11.10)
    ├── project.js (project.html 邏輯 v11.1)
    └── gallery.js (gallery.html 邏輯 v10.1)


主要問題與修復歷程 (v11.0 - v11.11)

我們近期的除錯集中在統一桌面版與手機版的體驗，並修復佈局錯誤。

A. 移除頁面轉場 (v11.1)
(同上)

B. 統一桌面版內頁 (project/about/gallery) 滾動機制 (v11.2)
(同上)

C. portfolio.html 佈局調整與 HTML 殘留清理 (v11.2 - v11.3)
(同上)

D. 啟用手機版浮動預覽視窗 (v11.4)
(同上)

E. 修復手機版 portfolio.html 佈局與 JS 錯誤 (v11.5)
(同上)

F. Gallery 頁面重構與優化 (v11.7 - v11.11)

問題: Gallery 頁面原本受限於 Grid 佈局，無法實現全螢幕畫布效果；Back 按鈕位置不一致且無法點擊；左側欄位會意外滾動。

修復 (v11.7): 將 Canvas 移出 Grid 結構，設為 fixed 全螢幕。調整 z-index 層級，確保 Back 按鈕 (z-index: 2) 在 Canvas (z-index: 1) 之上。

修復 (v11.9): 調整 Back 按鈕 CSS，使其與其他頁面底部對齊。

修復 (v11.11): 為 gallery.html 的 body 加上 .gallery-scroll-lock，並將 UI 容器高度設為 calc(100vh - 60px)，徹底解決左側欄位意外滾動的問題。

G. Project List 滾動手感優化 (v11.8 - v11.10)

問題: 原本嘗試使用 Native Scroll + CSS Snap 模擬 iOS 選擇器，但因 CSS 吸附過於強硬導致卡頓 (Stutter)，且缺乏機械段落感。

修復 (v11.8): 嘗試切換為 Native Scroll，但發現手感不符需求。

修復 (v11.9): 移除無限循環功能，專注於流暢度。加入上下 Padding (45vh) 讓首尾項目能置中。

修復 (v11.10): 恢復 JS 劫持 (JS Hijacking) 滾動邏輯。重新實作 wheel 與 touch 監聽器，移除 CSS scroll-snap，實現了精確的「一格一跳」 (Ratchet) 手感，並解決了卡頓問題。

未來可優化的方向 (v11.11 更新)

(同上，保留 A, B, C)