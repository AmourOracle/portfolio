Sywan Portfolio 專案開發指南 v4.31

這份文件是 Sywan 個人作品集網站的官方開發指南，旨在統一定義專案架構、開發流程與內容管理規範。

核心理念：內容與結構分離

本專案的核心架構理念是將「網站內容」與「網站結構」完全分離。

網站結構 (Structure): 由 .html, main.css, .js 等檔案定義。這些檔案負責網站的版面、外觀和互動邏輯。

網站內容 (Content): 所有的作品文字、圖片路徑和其他資訊，全部集中儲存在 data/projects.json 這個檔案中。

優點:

易於維護: 當您需要新增、刪除或修改一個作品時，您只需要編輯 data/projects.json 檔案，完全不需要更動任何 HTML 或 JavaScript 程式碼。

結構清晰: 程式碼保持乾淨，只專注於功能實現。

專案檔案結構 (v4.31)

所有檔案應依照以下結構進行組織：

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
   └─ /images/       // (建議) 存放所有專案圖片
      └─ ...


內容管理 (data/projects.json) (v4.17)

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

"category": [必要] 專案的類別 (例如 "Visual", "Identity", "Photography")。此欄位用於首頁的篩選器以及左側預覽標籤。

"title": [必要] 專案的完整標題。

"bio": [必要] 專案的簡短介紹 (1-2句話)，用於首頁的預覽區。

"info": [必要] 專案的詳細資訊 (例如角色、年份、工具)，用於專案內頁的 DOCS 區塊。可以使用 <br> 標籤來換行。

"coverImage": [必要] 首頁預覽時顯示的圖片路徑。

"images": [必要] 一個包含多張圖片路徑的陣列，用於專案內頁的圖片展示區。

頁面邏輯 (v4.31)

index.html (載入動畫頁)

用途: 作為網站的進入點 (Entry Point)，以處理 GitHub Pages 預設讀取 index.html 的行為。

邏輯: 使用 <meta http-equiv="refresh"> 標籤，在 1.5 秒後自動跳轉到 portfolio.html。

portfolio.html (首頁 / 作品索引)

此頁面具有桌面版和行動版兩套完全不同的佈局和互動邏輯，由 main.css 和 index.js 控制。

[核心] 無縫迴圈邏輯 (Seamless Loop) (v4.31)

此版本解決了 v4.30 之前版本中「置中不協調」和「無限滾動視覺中斷」的核心問題。

舊問題: 舊版使用 padding-top 和 padding-bottom: calc(50vh ...) 來創造空間，讓 scrollIntoView 得以置中。這導致了兩個問題：

桌面版 behavior: 'smooth' (平滑滾動) 與滾動節流衝突，產生「不協調感」。

滾動到頂部/底部時，會看到大片空白的 padding，破壞了「無限迴圈」的沈浸感。

v4.31 解決方案 (複製體邏輯):

JS (index.js):

fetch 資料後，動態建立一個包含複製體的新列表 fullProjectList = [...clonesEnd, ...projects, ...clonesStart]。例如，若有 5 個真實項目，列表會變為 [3,4,5, 1,2,3,4,5, 1,2,3]。

頁面載入時，使用 setActiveItem(..., false) (立即) 將視圖定位到第一個 真實 項目 (索引為 cloneCount 的位置)。

handleWheelScroll (桌面版) 和 handleTouchEnd (手機版) 現在會正常滾動這個長列表。

JS (index.js) - checkLoopJump() 函式:

這是實現無縫跳轉的關鍵。

當 setActiveItem 執行後（桌面版立即執行，手機版在 setTimeout 500ms 後執行），此函式會檢查當前啟用的項目是否為「複製體」 (data-is-clone="true")。

如果是，它會立即（使用 setActiveItem(..., false)）將滾動位置無縫跳轉到列表中對應的 真實 項目上。

這個「跳轉」過程對使用者來說是不可見的，看起來就像列表真的在無限迴圈。

CSS (main.css):

main.css 中 .project-list 的 padding-top 和 padding-bottom 已被完全移除。

現在 scrollIntoView 能正確置中，是因為列表的上下兩端有了真實的（被複製的）項目可以滾動。

篩選器 (handleFilterClick):

篩選器邏輯被重構，以應對複製體。

當篩選「All」以外的類別時，所有「複製體」都會被 display: none (.hide)，只顯示 真實 項目。

當切回「All」時，會恢復所有複製體，並將視圖跳回第一個 真實 項目。

頁面轉場 (Page Transition) (v4.13)

用途: 為了隱藏 project.html 載入時的 "Loading..." 閃爍。

邏輯:

index.js 會攔截所有本地頁面跳轉點擊（包含作品連結和 "Me" 等導航連結）。

v4.31 更新: 點擊事件 (handleItemClick) 現在會檢查所點擊的是否為「複製體」。如果是，則阻止跳轉（因為只有真實項目可以被點擊開啟）。

點擊後，會先淡入一個全螢幕黑色遮罩 (.page-transition-overlay)。

等待 400ms 動畫結束後，才真正執行 window.location.href 頁面跳轉。

project.html (專案內頁)

邏輯 (project.js v4.16):

project.js 會讀取瀏覽器 URL 中的 ?id= 參數。

抓取 data/projects.json 的內容，並尋找 ID 相符的專案物件。

將 title, category, bio, info 填入左欄。

將 images 陣列動態生成 <img> 標籤並填入右欄。

Next Project: project.js 會再次抓取 data/projects.json，過濾掉當前專案，從剩下的專案中隨機挑選一個，顯示在左下角的「Next Project」按鈕上。

載入轉場 (Incoming Transition) (v4.14):

project.html 的 <main> 標籤擁有 id="projectMainContainer"。

CSS 預設將 #projectMainContainer 設為 opacity: 0 (透明) 且 filter: blur(10px) (模糊)。

project.js (v4.14) 會在 fetch 資料並將所有內容填入 DOM 之後，才為 #projectMainContainer 添加 .is-loaded class。

此 class 會觸發 CSS 動畫，使頁面內容平滑地淡入並恢復清晰，完全遮蔽 "Loading..." 字樣。

about.html (關於我頁面)

邏輯: 一個完全靜態的「關於我」頁面，不載入任何 js/index.js 或 js/project.js 腳本。

行動版佈局 (main.css): 與 project.html 的行動版佈局規則完全一致（單欄、可滾動）。

[新增] 除錯與最佳實踐 (v4.25)

根據近期的除錯經驗，新增以下開發守則：

驗證 fetch 路徑 (Verify fetch Path):

[最重要] 專案中最常發生的致命錯誤，是 index.js 或 project.js 中的 fetch() 路徑與本指南中定義的檔案結構不符。

路徑必須為：./data/projects.json。

如果 fetch 404 失敗，.then() 區塊將不會執行，導致所有 JS 功能（滾動、篩選、點擊）全部靜默失敗。

DOMContentLoaded 作用域 (Scoping):

所有需要與 DOM 互動的程式碼（例如 getElementById, addEventListener），必須被包裹在 document.addEventListener('DOMContentLoaded', () => { ... }); 事件監聽器之內。

響應式事件綁定 (Responsive Event Binding):

對於在桌面版（滾輪）和手機版（觸控）有不同互動的邏輯，事件監聽器必須在 window.resize 事件觸發時重新評估。

應使用一個專門的函式（如 bindScrollListeners()）來先「移除舊監聽器」，再「根據當前寬度綁定新監聽器」。

漸進式開發 (Incremental Development):

當新增複雜的非核心功能時（例如 Tone.js 音效），應在確保核心功能（滾動、篩選）穩定的基礎上，逐一添加。

[新增] 滾動邏輯演進 (v4.28 - v4.31)

問題 (v4.28): 置中 vs 平滑度衝突

我們發現在 padding 方案下，桌面版的 behavior: 'smooth' (平滑滾動) 與 300ms 的節流 (DESKTOP_WHEEL_THROTTLE) 存在根本性衝突。

這導致了滾動的「不協調感」，並且在滾動過快時，scrollIntoView 動畫會被中斷，導致最後一項無法正確置中。

決策 (v4.29): 體驗優先於動畫

我們決定，桌面版的滾動體驗應優先考慮「響應速度」和「協調性」。

index.js 中的 handleWheelScroll (桌面滾輪) 和 handleItemClick (桌面點擊) 被修改為使用 setActiveItem(..., false)。

這將滾動行為從 behavior: 'smooth' (平滑) 改為 behavior: 'auto' (立即貼齊)，徹底解決了桌面版的所有滾動延遲和置中失敗的問題。

手機版的 handleTouchEnd (觸控輕彈) 則保留 setActiveItem(..., true) (平滑)，以維持 iOS 般的滑動體驗。

決策 (v4.31): 解決視覺中斷

為了進一步解決 v4.29 方案中「空 padding」的視覺中斷問題，v4.31 引入了「無縫迴圈」架構，用「複製體」取代了 padding，實現了視覺和功能的雙重無限迴圈。