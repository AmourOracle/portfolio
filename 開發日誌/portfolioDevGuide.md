Sywan Portfolio 專案開發指南 v4.32

這份文件是 Sywan 個人作品集網站的官方開發指南，旨在統一定義專案架構、開發流程與內容管理規範。

核心理念：內容與結構分離

本專案的核心架構理念是將「網站內容」與「網站結構」完全分離。

網站結構 (Structure): 由 .html, main.css, .js 等檔案定義。這些檔案負責網站的版面、外觀和互動邏輯。

網站內容 (Content): 所有的作品文字、圖片路徑和其他資訊，全部集中儲存在 data/projects.json 這個檔案中。

優點:

1.  易於維護: 當您需要新增、刪除或修改一個作品時，您只需要編輯 data/projects.json 檔案，完全不需要更動任何 HTML 或 JavaScript 程式碼。
2.  結構清晰: 程式碼保持乾淨，只專注於功能實現。


專案檔案結構 (v4.32)

所有檔案應依照以下結構進行組織。v4.32 關鍵：所有 .html 檔案載入資源時，都必須使用相對於 .html 檔案的「相對路徑」 (例如 data/projects.json 或 css/main.css)。

/sywan-portfolio/
├─ index.html       // 載入動畫頁 (網站進入點)
├─ portfolio.html   // 網站首頁 (作品索引)
├─ project.html     // 專案內頁 (作品範本)
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
│  └─ project.js     // 僅用於 project.html 的腳本
│
└─ /assets/
   └─ /images/       // 存放所有專案圖片
      ├─ favicon.ico
      └─ ... (其他專案圖片)


[新增] v4.32 更新日誌：Favicon 與路徑修正

-   [FEAT] 新增 Favicon:
    -   已將 `favicon.ico` 的 <link> 標籤添加至所有 `.html` 檔案 (`index.html`, `portfolio.html`, `project.html`, `about.html`)。

-   [FIX] 修正 GitHub Pages 部署路徑：
    -   [問題] 專案部署於 GitHub Pages 的子目錄 (e.g., `.../portfolio/`)，而 v4.31 及之前版本的 HTML 檔案使用「絕對路徑」 (e.g., `href="/css/main.css"`)。
    -   [錯誤] 這導致瀏覽器從根網域 (e.g., `user.github.io/css/...`) 請求資源，造成 404 錯誤。
    -   [解決] 已將所有 `.html` 檔案中的靜態資源連結 (CSS, JS, Favicon) 全部修改為「相對路徑」（e.g., `href="css/main.css"`），確保在任何環境下都能正確載入。


內容管理 (data/projects.json) (v4.17)

data/projects.json 是整個作品集的心臟。它是一個 JSON 陣列 (Array)，陣列中的每一個物件 (Object) 都代表一個作品。

[v4.32 關鍵提醒] 由於路徑修正，本檔案中所有的 coverImage 和 images 路徑 必須 使用「相對路徑」（e.g., "assets/images/..."）。

{
  "id": "kinetic-poster",
  "number": "01",
  "category": "Visual",
  "title": "Kinetic Poster",
  "bio": "專案的簡短介紹，會顯示在首頁的 hover 預覽中。",
  "info": "專案的詳細資訊 (角色、年份等)，支援 <br> 換行。",
  "coverImage": "assets/images/projects/cover.jpg",
  "images": [
    "assets/images/projects/img_01.jpg",
    "assets/images/projects/img_02.jpg"
  ]
}


(欄位說明...)

"id": [必要] 專案的唯一識別符 (小寫英文，可用 - 連接)。這個 ID 會被用在 URL 中 (例如 project.html?id=kinetic-poster)，絕對不能重複。

"number": [備用] 專案的編號 (目前僅作為備用欄位)。

"category": [必要] 專案的類別 (例如 "Visual", "Identity", "Photography")。此欄位用於首頁的篩選器以及左側預覽標籤。

"title": [必要] 專案的完整標題。

"bio": [必要] 專案的簡短介紹 (1-2句話)，用於首頁的預覽區。

"info": [必要] 專案的詳細資訊 (例如角色、年份、工具)，用於專案內頁的 DOCS 區塊。可以使用 <br> 標籤來換行。

"coverImage": [必要] [v4.32] 必須為相對路徑 (e.g., "assets/...")。

"images": [必要] 一個包含多張圖片路徑的陣列。[v4.32] 必須為相對路徑 (e.g., "assets/...")。

頁面邏輯 (v4.31)

(此區塊邏輯繼承 v4.31，保持不變)

index.html (載入動畫頁)

用途: 作為網站的進入點 (Entry Point)，以處理 GitHub Pages 預設讀取 index.html 的行為。

邏輯: 使用 <meta http-equiv="refresh"> 標籤，在 1.5 秒後自動跳轉到 portfolio.html。

portfolio.html (首頁 / 作品索引)

[核心] 無縫迴圈邏輯 (Seamless Loop) (v4.31)

頁面轉場 (Page Transition) (v4.13)

(詳細邏輯請參考 v4.31 文件)

project.html (專案內頁)

邏輯 (project.js v4.16): 讀取 URL 的 ?id= 參數，fetch 資料並填入 DOM。

Next Project: 隨機挑選下一個專案。

載入轉場 (Incoming Transition) (v4.14): 使用 .is-loaded class 實現平滑淡入。

about.html (關於我頁面)

邏輯: 一個完全靜態的「關於我」頁面，不載入任何 js/index.js 或 js/project.js 腳本。

[更新] 除錯與最佳實踐 (v4.32)

根據近期的除錯經驗，新增以下開發守則：

[新增] 1. 靜態資源路徑 (Static Path)

-   [最重要] 由於專案託管於 GitHub Pages 子目錄，所有 HTML 檔案中的資源連結 **必須** 使用「相對路徑」。
-   [範例] href="css/main.css" (O), href="/css/main.css" (X)
-   [範圍] 這包括 <link> (CSS, Favicon) 和 <script> (JS) 標籤。


[原 v4.25] 2. 驗證 fetch 路徑 (Verify fetch Path)

-   [最重要] 專案中最常發生的致命錯誤，是 index.js 或 project.js 中的 fetch() 路徑與本指南中定義的檔案結構不符。
-   [路徑] 路徑必須為：`./data/projects.json` 或 `data/projects.json`。
-   [錯誤] 如果 fetch 404 失敗，.then() 區塊將不會執行，導致所有 JS 功能（滾動、篩選、點擊）全部靜默失敗。


[新增] 3. JSON 內部路徑 (JSON-Internal Path)

-   [最重要] 承上兩點，`data/projects.json` 檔案 **內部** 儲存的所有圖片路徑 (e.g., `coverImage`, `images` 陣列) **也必須** 使用「相對路徑」。
-   [範例] "coverImage": "assets/images/projectA.jpg" (O)
-   [範例] "coverImage": "/assets/images/projectA.jpg" (X)
-   [狀態] 這是 v4.32 之後需要立即檢查並修正的關鍵任務。


[原 v4.25] 4. DOMContentLoaded 作用域 (Scoping)

-   所有需要與 DOM 互動的程式碼（例如 getElementById, addEventListener），必須被包裹在 document.addEventListener('DOMContentLoaded', () => { ... }); 事件監聽器之內。


[原 v4.25] 5. 響應式事件綁定 (Responsive Event Binding)

-   對於在桌面版（滾輪）和手機版（觸控）有不同互動的邏輯，事件監聽器必須在 window.resize 事件觸發時重新評估。
-   應使用一個專門的函式（如 bindScrollListeners()）來先「移除舊監聽器」，再「根據當前寬度綁定新監聽器」。


[原 v4.25] 6. 漸進式開發 (Incremental Development)

-   當新增複雜的非核心功能時（例如 Tone.js 音效），應在確保核心功能（滾動、篩選）穩定的基礎上，逐一添加。


[新增] 滾動邏輯演進 (v4.28 - v4.31)

(此區塊邏輯繼承 v4.31，保持不變)

-   [問題 (v4.28)] 置中 vs 平滑度衝突
    -   我們發現在 padding 方案下，桌面版的 behavior: 'smooth' (平滑滾動) 與 300ms 的節流 (DESKTOP_WHEEL_THROTTLE) 存在根本性衝突。
    
-   [決策 (v4.29)] 體驗優先於動畫
    -   index.js 中的 handleWheelScroll (桌面滾輪) 和 handleItemClick (桌面點擊) 被修改為使用 setActiveItem(..., false)。
    -   這將滾動行為從 behavior: 'smooth' (平滑) 改為 behavior: 'auto' (立即貼齊)，徹底解決了桌面版的所有滾動延遲和置中失敗的問題。
    
-   [決策 (v4.31)] 解決視覺中斷
    -   為了進一步解決 v4.29 方案中「空 padding」的視覺中斷問題，v4.31 引入了「無縫迴圈」架構，用「複製體」取代了 padding，實現了視覺和功能的雙重無限迴圈。