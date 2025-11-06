專案開發指南與進度記錄 (v11.7)

這份文件旨在統整目前 (v11.7) 專案的最終架構、遇到的核心問題、修復策略，以及未來的優化方向。

專案目前狀態 (v11.6)

經過 v11.0 至 v11.5 的多次修正，專案已達到桌面版與手機版佈局/互動一致的穩定狀態。

portfolio.html (主頁):

桌面版 (v11.6):

佈局: v9.x 的三欄式佈局。

滾動: 「JS 滾輪劫持」 (wheel) 和「CSS 被動吸附」 (scroll-snap for Trackpad) 的混合模式。

預覽: 啟用「JS 浮動預覽視窗」 (.random-preview-popup)，視窗大小、位置隨機。

連結: 導航連結 (Me/Gallery/Insta/Email) 已移至左欄底部。

手機版 (v11.6):

佈局: v10.0 的雙層 Footer 結構 (上層篩選器，下層聯絡連結)。

滾動: v4.13 的「JS 觸控劫持」 (touchstart, preventDefault())。

預覽: (v11.4) 啟用「JS 浮動預覽視窗」 (.random-preview-popup)，以匹配桌面版體驗。

project.html / about.html / gallery.html (內頁):

桌面版 (v11.6):

佈局: (v11.2) 恢復 v9.x 的二欄式佈局，並將容器高度鎖定為 100vh (同 portfolio.html)。

滾動: (v11.2) 滾動範圍限定在右側的內容欄位 (overflow: auto)。

對齊: (v11.3) about.html 的左欄資訊區塊已垂直置中 (同 portfolio.html)。

手機版 (v11.6):

佈局: (v11.2) 恢復 v9.9 的「原生 body 滾動」 (容器 height: auto)。

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
│   └── projects.json (核心專案資料庫)
├── css/
│   └── main.css (全站主要樣式表 v11.6)
└── js/
    ├── index.js (portfolio.html 邏輯 v11.4)
    ├── project.js (project.html 邏輯 v11.1)
    └── gallery.js (gallery.html 邏輯 v10.1)


主要問題與修復歷程 (v11.0 - v11.6)

我們近期的除錯集中在統一桌面版與手機版的體驗，並修復佈局錯誤。

A. 移除頁面轉場 (v11.1)

問題: 頁面轉場遮罩 (Page Transition Overlay) 雖然提供了平滑過渡，但也攔截了 <a> 標籤的預設行為，使點擊邏輯變得複雜。

修復 (v11.1): 移除了 index.js 中的 handlePageTransition 相關邏輯，並刪除了 portfolio.html 和 main.css 中的遮罩元素 (.page-transition-overlay)。

B. 統一桌面版內頁 (project/about/gallery) 滾動機制 (v11.2)

問題: 內頁 (如 about.html) 的左側欄位會隨內容滾動，與 portfolio.html 的鎖定體驗不一致。

修復 (v11.2):

main.css: 將 .middle-container (所有頁面的主要容器) 的 height 統一設為 calc(100vh - 60px)。

main.css: 將 .project-content-column (右側內容欄) 設為 overflow-y: auto。

結果: 桌面版所有頁面的左欄都被鎖定，僅右欄可滾動。

C. portfolio.html 佈局調整與 HTML 殘留清理 (v11.2 - v11.3)

問題: portfolio.html 的佈局與設計稿不符（連結位置錯誤、篩選器多餘、有舊版靜態預覽圖殘留）。

修復 (v11.2):

portfolio.html: 將右欄的導航連結 (#desktopContactLinks) 移至左欄的 .left-column-bottom。

portfolio.html: 移除了 "Comm. Photo" 篩選按鈕 (桌面版與手機版)。

修復 (v11.3):

portfolio.html: 徹底刪除了舊的靜態預覽圖區塊 (.profile-block)。

main.css: 將 about.html 的 .left-column-top 高度設為 50vh，使其資訊區塊 (BIO/CONTACT) 垂直對齊 portfolio.html。

D. 啟用手機版浮動預覽視窗 (v11.4)

問題: 根據 v10.0 指南，手機版的浮動預覽視窗被 index.js 中的 if (!isMobile()) 檢查禁用了，與 v11.6 的統一體驗需求不符。

修復 (v11.4):

js/index.js: 移除了 setActiveItem 函式中 updateRandomPreview 呼叫點的 if (!isMobile()) 條件。

js/index.js: 在 updateRandomPreview 函式中增加了邏輯，當偵測為 isMobile() 時，動態計算 px 位置以確保視窗置中。

css/main.css: 調整了手機版 .random-preview-popup 的 aspect-ratio 為 1 / 1。

E. 修復手機版 portfolio.html 佈局與 JS 錯誤 (v11.5)

問題: 啟用 v11.4 的 JS 後，手機版浮動視窗未出現，且 Footer 佈局錯誤 (篩選器與連結重疊)。

修復 (v11.5):

ID 錯誤: portfolio.html 中的預覽視窗 ID 為 #mobilePreviewPopup，而 index.js 尋找的是 #randomPreviewPopup。已將 HTML 中的 ID 修正為 #randomPreviewPopup 和 #randomPreviewImage。

HTML 結構錯誤: portfolio.html 中缺少了 .main-footer 標籤，導致聯絡連結被錯誤地放入 .mobile-footer。已還原 v10.0 的雙層 Footer 結構，將 .mobile-contact-links 移回獨立的 .main-footer 中。

未來可優化的方向 (v11.7 新增)

在 v11.6 版本中，我們專注於修復佈局與統一體驗。以下是我們在先前討論中提到，但尚未執行的未來優化項目，可在未來 2.0 版本中考慮實作：

A. 模組化與資料抓取 (Code Modularity & Data Fetching)

問題: 目前 index.js, project.js, gallery.js 三個檔案各自 fetch('./data/projects.json')。

優化方向: 建立一個共用的 dataService.js 模組，由它負責 fetch 資料一次並緩存 (cache) 結果。其他 JS 檔案透過 import 取得資料，可減少網路請求並統一資料入口。 (需將 <script> 標籤改為 type="module")。

B. gallery.html 的效能擴展性 (Scalability)

問題: gallery.js 會一次性將所有專案的所有圖片 (包含封面) 渲染為 DOM 元素。如果專案增加到 50 個 (150+ 圖片)，將導致頁面載入緩慢且消耗大量記憶體。

優化方向: 採用「虛擬化」 (Virtualization) 策略。JS 僅渲染當前視窗可見範圍內的圖片 DOM，並在圖片移出視窗時將其移除或回收。

C. 全站一致的頁面轉場 (Page Transitions)

問題: 我們在 v11.1 中移除了頁面轉場。如果未來決定重新啟用，舊架構的轉場是單向的 (僅離開 portfolio.html)。

優化方向: 如果重新實作，應建立一個共用的 transition.js，並在所有頁面載入。此腳本應攔截所有內部連結點擊，統一觸發「淡出」動畫，並在頁面載入時觸發「淡入」動畫，以確保全站體驗一致。