Sywan Portfolio 專案開發指南 v4.18

這份文件是 Sywan 個人作品集網站的官方開發指南，旨在統一定義專案架構、開發流程與內容管理規範。

核心理念：內容與結構分離

本專案的核心架構理念是將「網站內容」與「網站結構」完全分離。

網站結構 (Structure): 由 .html, main.css, .js 等檔案定義。這些檔案負責網站的版面、外觀和互動邏輯。

網站內容 (Content): 所有的作品文字、圖片路徑和其他資訊, 全部集中儲存在 data/projects.json 這個檔案中。

優點:

易於維護: 當您需要新增、刪除或修改一個作品時，您只需要編輯 data/projects.json 檔案，完全不需要更動任何 HTML 或 JavaScript 程式碼。

結構清晰: 程式碼保持乾淨，只專注於功能實現。

專案檔案結構 (v4.15)

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

頁面邏輯 (v4.18)

index.html (載入動畫頁)

用途: 作為網站的進入點 (Entry Point)，以處理 GitHub Pages 預設讀取 index.html 的行為。

邏輯: 使用 <meta http-equiv="refresh"> 標籤，在 1.5 秒後自動跳轉到 portfolio.html。

portfolio.html (首頁 / 作品索引)

此頁面具有桌面版和行動版兩套完全不同的佈局和互動邏輯，由 main.css 和 index.js 控制。

[新增] 頁面轉場 (Page Transition) (v4.13)

為了隱藏 project.html 載入時的 "Loading..." 閃爍，index.js (v4.13) 實作了「送出轉場 (Outgoing Transition)」。

它會攔截所有頁面跳轉點擊（包含作品連結和 "Me" 等導航連結）。

點擊後，會先淡入一個全螢幕黑色遮罩 (.page-transition-overlay)，等待 400ms 動畫結束後，才真正執行 window.location.href 頁面跳轉。

桌面版 (Desktop) 邏輯 (v3.17)

佈局 (main.css):

採用 grid 佈局 (grid-template-columns: 28.57% 1fr 5vw;)。

左欄 (.left-column) 為預覽區，中欄 (.center-column) 為作品列表，右欄 (.right-column) 為篩選器與連結。

body 設為 overflow: hidden;，僅中欄可滾動。

互動 (index.js):

滾輪鎖定: js/index.js 會監聽中欄的 wheel (滾輪) 事件。

無限循環 (v3.11): 當滾動到列表頂部或底部時，會自動循環。

狀態切換: 滾動時，被鎖定在中央的項目會獲得 .is-active class，CSS 會使其放大並完全不透明。

預覽更新: setActiveItem 函式會觸發左側欄位更新 (讀取 data-* 屬性)，將標籤從 NO./BIO 切換為 [Category]/DOCS (並隱藏 BIO 區塊)。

行動版 (Mobile) 邏輯 (v4.13)

佈局 (main.css):

採用「懸浮視窗」概念，預設佈局為 Header + List + Footer。

portfolio-container 改為 grid 佈局 (grid-template-rows: 1fr auto;)。

body 設為 overflow: hidden; (鎖定頁面滾動)。

.center-column (作品列表) 佔據 1fr 空間，並設為 overflow-y: auto; (唯一可滾動區域)。

<footer class="mobile-footer"> 佔據 auto 空間，固定在底部，包含「篩選器」和「外部連結」。

桌面版的 .left-column (預覽區) 和 .right-column (篩選器) 被 display: none; 隱藏。

(v4.2 修正) Footer 篩選器 (.mobile-filter-nav) 採用 overflow-x: auto; 和 flex-wrap: nowrap; (水平滾動) 以避免換行。

互動 (index.js):

觸控鎖定 (v3.15): js/index.js 會在 isMobile 為 true 時，綁定 touchstart, touchmove, touchend 事件。

iOS 插槽效果: touchmove 會 preventDefault() 阻止瀏覽器原生平移；touchend 會計算手勢方向，並呼叫 setActiveItem，實現「iOS 鬧鐘選擇器」般的插槽滾動。

(v4.2 修正) 點擊修正: touchend 僅在偵測為「滑動」時才 preventDefault()，確保「點擊」手勢能觸發 handleItemClick。

動態 Padding (v3.15): [關鍵] 為了讓 scrollIntoView({ block: 'center' }) 能在 1fr 區域中正確置中，setDynamicPadding() 函式會動態計算 .project-list 所需的 padding-top 和 padding-bottom。

[修改] 行動版預覽懸浮視窗 (v4.13)

HTML: portfolio.html 中包含一個 <div id="mobilePreviewPopup"> 元素。

CSS (main.css): transition 屬性已加入 cubic-bezier 函式，提供「彈簧」般的彈出動畫 (v4.13)。

JS (index.js): setActiveItem 函式已更新 (v4.12)。

隨機定位 (Randomized Position): 彈窗不再固定於 top: 60%。setActiveItem 會在 10vh 至 80vh (垂直) 和螢幕左右兩側 5vw 至 15vw (水平) 的「安全區域 (Gutters)」內計算隨機位置、旋轉角度和縮放，確保彈窗不會遮擋中央的高光標題。

互動: 彈窗 CSS 設有 pointer-events: none (事件穿透)，且 handleTouchStart (手指觸碰) 會立即隱藏彈窗，確保 100% 不干擾列表滾動。

project.html (專案內頁)

邏輯 (project.js):

js/project.js 會讀取瀏覽器 URL 中的 ?id= 參數。

抓取 data/projects.json 的內容，並尋找 ID 相符的專案物件。

將 title, category, bio, info 填入左欄。

將 images 陣列動態生成 <img> 標籤並填入右欄。

Next Project: project.js 會再次抓取 data/projects.json，過濾掉當前專案，從剩下的專案中隨機挑選一個，顯示在左下角的「Next Project」按鈕上。

[修改] 佈局 (main.css v4.3):

.project-nav-bottom (包含 "Back" 和 "Next" 按鈕) 已從 <aside> (左側欄) 移至 <main> (主容器) 的末端。

CSS Grid (grid-template-rows: 1fr auto) 被用來確保此導航列在桌面版和手機版中，都固定顯示於所有內容的最下方。

[新增] 載入轉場 (Incoming Transition) (v4.14):

project.html 的 <main> 標籤擁有 id="projectMainContainer"。

CSS (main.css) 預設將 #projectMainContainer 設為 opacity: 0 (透明) 且 filter: blur(10px) (模糊)。

project.js (v4.14) 會在 fetch 資料並將所有內容（標題、圖片）填入 DOM 之後，才為 #projectMainContainer 添加 .is-loaded class。

此 class 會觸發 CSS 動畫，使頁面內容平滑地淡入並恢復清晰，完全遮蔽 "Loading..." 字樣，與 v4.13 的送出轉場達成無縫銜接。

about.html (關於我頁面)

邏輯: 一個完全靜態的「關於我」頁面，不載入任何 js/index.js 或 js/project.js 腳本。

行動版佈局 (main.css): 与 project.html 的行動版佈局規則完全一致（單欄、可滾動）。

字體系統

英文字體: DM Mono (由 <link> 標籤從 Google Fonts 載入)。

中文字體: momochidori (由 <script> 標籤從 Typekit (hcg4voj) 載入)。

CSS: main.css 中的 --font-main 變數負責定義這個堆疊 (var(--font-en), var(--font-zh))，確保瀏覽器能正確渲染中英文。