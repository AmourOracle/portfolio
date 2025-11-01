Sywan Portfolio 專案開發指南 v4.32

這份文件是 Sywan 個人作品集網站的官方開發指南，旨在統一定義專案架構、開發流程與內容管理規範。

核心理念：內容與結構分離

本專案的核心架構理念是將「網站內容」與「網站結構」完全分離。

網站結構 (Structure): 由 .html, main.css, .js 等檔案定義。這些檔案負責網站的版面、外觀和互動邏輯。

網站內容 (Content): 所有的作品文字、圖片路徑和其他資訊，全部集中儲存在 data/projects.json 這個檔案中。

優點:

易於維護: 當您需要新增、刪除或修改一個作品時，您只需要編輯 data/projects.json 檔案，完全不需要更動任何 HTML 或 JavaScript 程式碼。

結構清晰: 程式碼保持乾淨，只專注於功能實現。

專案檔案結構 (v4.32)

所有檔案應依照以下結構進行組織：

/sywan-portfolio/
├─ index.html       // 載入動畫頁 (網站進入點)
├─ portfolio.html   // 網站首頁 (作品索引)
├─ project.html     // 專案內頁 (作品範本)
├─ gallery.html     // (新增) 攝影作品展示頁
├─ about.html       // 關於我頁面 (靜態內容)
│
├─ /data/
│  └─ projects.json  // 唯一的作品資料庫 (Single Source of Truth)
│
├─ /css/
│  └─ main.css       // 網站所有共用樣式表
│
├─ /js/
│  ├─ index.js       // 僅用於 portfolio.html 的腳本
│  ├─ project.js     // 僅用於 project.html 的腳本
│  └─ gallery.js     // (新增) 僅用於 gallery.html 的腳本
│
└─ /assets/
   └─ /images/       // (建議) 存放所有專案圖片
      └─ ...


內容管理 (data/projects.json)

data/projects.json 是整個作品集的心臟。它是一個 JSON 陣列 (Array)，陣列中的每一個物件 (Object) 都代表一個作品。

專案物件結構詳解:

{
  "id": "kinetic-poster",
  "number": "01",
  "category": "Visual",
  "title": "Kinetic Poster",
  "bio": "專案的簡短介紹，會顯示在首頁的 hover 預覽中。",
  "info": "專案的詳細資訊 (角色、年份等)，支援 <br> 換行。",
  "coverImage": "[https://placehold.co/180x320/](https://placehold.co/180x320/)...",
  "images": [
    "[https://placehold.co/1200x800/](https://placehold.co/1200x800/)...",
    "[https://placehold.co/1200x800/](https://placehold.co/1200x800/)..."
  ]
}


"id": [必要] 專案的唯一識別符 (小寫英文，可用 - 連接)。這個 ID 會被用在 URL 中 (例如 project.html?id=kinetic-poster)，絕對不能重複。

"number": [備用] 專案的編號 (目前僅作為備用欄位)。

"category": [必要] 專案的類別 (例如 "Visual", "Identity", "Photography")。此欄位用於首頁的篩選器以及 gallery.html 的資料抓取。

"title": [必要] 專案的完整標題。

"bio": [必要] 專案的簡短介紹 (1-2句話)，用於首頁的預覽區。

"info": [必要] 專案的詳細資訊 (例如角色、年份、工具)，用於專案內頁的 DOCS 區塊。可以使用 <br> 標籤來換行。

"coverImage": [必要] 首頁預覽時顯示的圖片路徑。

"images": [必要] 一個包含多張圖片路徑的陣列，用於 project.html 內頁或 gallery.html 展示區。

頁面邏輯 (v4.32)

index.html (載入動畫頁)

用途: 作為網站的進入點 (Entry Point)，以處理 GitHub Pages 預設讀取 index.html 的行為。

邏輯: 使用 <meta http-equiv="refresh"> 標籤，在 1.5 秒後自動跳轉到 portfolio.html。

portfolio.html (首頁 / 作品索引)

此頁面由 js/index.js 控制，具有桌面版和行動版兩套不同的互動邏輯。

[核心] 無縫迴圈邏輯 (v4.31):

index.js 會 fetch 資料，並動態建立一個包含「複製體」的新列表 fullProjectList = [...clonesEnd, ...projects, ...clonesStart]。

頁面載入時，立即將視圖定位到第一個「真實」項目。

當使用者滾動到「複製體」上時，checkLoopJump() 函式會被觸發，立即將滾動位置無縫跳轉回對應的「真實」項目，實現視覺上的無限迴圈。

此邏輯取代了舊版 padding 方案，解決了列表頂部/底部的空白問題。

篩選器 (handleFilterClick):

(v4.32 更新) 篩選器邏輯 (handleFilterClick) 現在只會處理帶有 [data-filter] 屬性的 <a> 標籤。

"Comm. Photo" (現為 "Gallery") 連結已被移至底部連結列，並且不包含 [data-filter] 屬性，因此它不會觸發篩選，而是作為一個標準連結。

頁面轉場 (handlePageTransition):

(v4.32 更新) bindTransitionLinks() 函式已更新，會抓取所有 .nav-gallery-link class 的連結。

當使用者點擊作品連結、"Me" 連結、或新的 "Gallery" 連結時，腳本會攔截點擊，先淡入全螢幕黑色遮罩 (.page-transition-overlay)，等待 400ms 後才執行頁面跳轉。

project.html (專案內頁)

此頁面由 js/project.js 控制，作為動態內容範本。

邏輯: project.js 會讀取瀏覽器 URL 中的 ?id= 參數。

抓取 data/projects.json 的內容，並使用 .find() 尋找 ID 相符的專案物件。

將 title, category, bio, info 填入左欄。

將 images 陣列動態生成 <img> 標籤並填入右欄。

Next Project: project.js 會再次抓取 data/projects.json，過濾掉當前專案，從剩下的專案中隨機挑選一個，顯示在右下角的「Next Project」按鈕上。

(新增) gallery.html (攝影作品展示頁)

此頁面由 js/gallery.js 控制，是 v4.32 新增的攝影作品集展示牆。

邏輯 (js/gallery.js):

抓取資料: fetch('./data/projects.json')。

篩選資料: 過濾 projects 陣列，只保留 category === "Photography" 的項目。

合併圖片: 將所有 "Photography" 項目的 images 陣列合併 (flatten) 成一個包含所有圖片 URL 的單一陣列 allPhotographyImages。

響應式佈局: 腳本會檢查 window.innerWidth。

桌面版 ( > 768px): 執行 renderDesktopCollage()。此函式會遍歷所有圖片，為每張圖計算出隨機的 width (vw), top (vh), left (vw), transform: rotate() (deg) 和 z-index，並將其作為 inline-style 應用於 position: absolute 的 <div> 元素上，實現隨機拼貼效果。

手機版 ( <= 768px): 執行 renderMobileGrid()。此函式會放棄隨機佈局，改為將圖片填入一個標準的 CSS 雙欄網格中，並為容器添加 .is-mobile-grid class。

about.html (關於我頁面)

邏輯: 一個完全靜態的「關於我」頁面，不載入任何 js/index.js 或 js/project.js 腳本。

行動版佈局 (main.css): 與 project.html 的行動版佈局規則一致（單欄、可滾動）。

除錯與最佳實踐 (v4.31+)

驗證 fetch 路徑 (Verify fetch Path):

[最重要] 專案中最常發生的致命錯誤，是 index.js, project.js 或 gallery.js 中的 fetch() 路徑與本指南中定義的檔案結構不符。

路徑必須為：./data/projects.json。

如果 fetch 404 失敗，.then() 區塊將不會執行，導致所有 JS 功能（滾動、篩選、點擊、載入圖片）全部靜默失敗。

DOMContentLoaded 作用域 (Scoping):

所有需要與 DOM 互動的程式碼（例如 getElementById, addEventListener），必須被包裹在 document.addEventListener('DOMContentLoaded', () => { ... }); 事件監聽器之內。

響應式事件綁定 (Responsive Event Binding):

對於在桌面版（滾輪）和手機版（觸控）有不同互動的邏輯 (如 index.js 的 bindScrollListeners())，事件監聽器必須在 window.resize 事件觸發時重新評估。

應使用一個專門的函式來先「移除舊監聽器」，再「根據當前寬度綁定新監聽器」。