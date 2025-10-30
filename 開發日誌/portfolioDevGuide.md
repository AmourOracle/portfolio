Sywan Portfolio 專案開發指南 v4.25

這份文件是 Sywan 個人作品集網站的官方開發指南，旨在統一定義專案架構、開發流程與內容管理規範。

核心理念：內容與結構分離

本專案的核心架構理念是將「網站內容」與「網站結構」完全分離。

網站結構 (Structure): 由 .html, main.css, .js 等檔案定義。這些檔案負責網站的版面、外觀和互動 logique。

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

頁面 logique (v4.25)

index.html (載入動畫頁)

用途: 作為網站的進入點 (Entry Point)，以處理 GitHub Pages 預設讀取 index.html 的行為。

logique: 使用 <meta http-equiv="refresh"> 標籤，在 1.5 秒後自動跳轉到 portfolio.html。

portfolio.html (首頁 / 作品索引)

此頁面具有桌面版和行動版兩套完全不同的佈局和互動 logique，由 main.css 和 index.js 控制。

[新增] 頁面轉場 (Page Transition) (v4.13)

用途: 為了隱藏 project.html 載入時的 "Loading..." 閃爍，index.js (v4.13) 實作了「送出轉場 (Outgoing Transition)」。

logique:

index.js 會攔截所有本地頁面跳轉點擊（包含作品連結和 "Me" 等導航連結）。

點擊後，會先淡入一個全螢幕黑色遮罩 (.page-transition-overlay)。

等待 400ms 動畫結束後，才真正執行 window.location.href 頁面跳轉。

[新增] 互動音效 (Interaction Sound) (v4.19)

用途: 提升滾動和點擊的互動體感。

logique:

portfolio.html 載入 Tone.js 音效庫。

index.js 會在首次使用者互動（滾動或點擊）時啟動音訊。

每當 setActiveItem 被呼叫時（即成功滾動到下一個項目），觸發一個短促的 "G6" 音效。

(註：此功能在 v4.25 中被暫時註解以進行除錯，但核心 logique 已準備就緒。)

桌面版 (Desktop) logique (v4.23)

佈局 (main.css):

採用 grid 佈局 (grid-template-columns: 28.57% 1fr 5vw;)。

左欄 (.left-column) 為預覽區，中欄 (.center-column) 為作品列表，右欄 (.right-column) 為篩選器與連結。

body 設為 overflow: hidden;，僅中欄可滾動。

互動 (index.js):

滾輪鎖定 (v4.23): bindScrollListeners() 函式會監聽中欄的 wheel (滾輪) 事件。

響應式綁定 (v4.23): window.resize 事件會觸發 bindScrollListeners()，確保在視窗大小改變時，能正確綁定/解綁 wheel 事件。

狀態切換: 滾動時，被鎖定在中央的項目會獲得 .is-active class，CSS 會使其放大並完全不透明。

點擊 logique (v4.23):

點擊非啟用 (.project-item) 項目：滾動並選取該項目。

點擊已啟用 (.is-active) 項目：觸發頁面轉場，前往 project.html。

預覽更新: setActiveItem 函式會觸發左側欄位更新 (讀取 data-* 屬性)，將標籤從 NO./BIO 切換為 [Category]/DOCS (並隱藏 BIO 區塊)。

行動版 (Mobile) logique (v4.23)

佈局 (main.css):

採用「懸浮視窗」概念，預設佈局為 Header + List + Footer。

portfolio-container 改為 grid 佈局 (grid-template-rows: 1fr auto;)。

body 設為 overflow: hidden; (鎖定頁面滾動)。

.center-column (作品列表) 佔據 1fr 空間，並設為 overflow-y: auto; (唯一可滾動區域)。

<footer class="mobile-footer"> 佔據 auto 空間，固定在底部，包含「篩選器」和「外部連結」。

桌面版的 .left-column 和 .right-column 被 display: none; 隱藏。

互動 (index.js):

觸控鎖定 (v4.23): bindScrollListeners() 函式會在 isMobile 為 true 時，綁定 touchstart, touchmove, touchend 事件。

響應式綁定 (v4.23): window.resize 同樣會觸發 bindScrollListeners() 以確保觸控事件正確綁定。

iOS 插槽效果: touchend 會計算手勢方向，並呼叫 setActiveItem，實現「iOS 鬧鐘選擇器」般的插槽滾動。

點擊 logique (v4.23): 同桌面版 logique，handleItemClick 函式會區分「選取」和「開啟」。

動態 Padding (v3.15): [關鍵] 為了讓 scrollIntoView({ block: 'center' }) 能在 1fr 區域中正確置中，setDynamicPadding() 函式會動態計算 .project-list 所需的 padding-top 和 padding-bottom。

行動版預覽懸浮視窗 (v4.19)

HTML: portfolio.html 中包含一個 <div id="mobilePreviewPopup"> 元素。

JS (index.js): setActiveItem 函式已更新。

隨機定位 (Randomized Position): 彈窗不再固定。setActiveItem 會在 10vh 至 80vh (垂直) 和螢幕左右兩側 5vw 至 15vw (水平) 的「安全區域」內計算隨機位置和 0.8x~1.2x 的隨機縮放。

互動: 彈窗 CSS 設有 pointer-events: none (事件穿透)，且 handleTouchStart (手指觸碰) 會立即隱藏彈窗，確保不干擾列表滾動。

(註：此隨機功能在 v4.25 中被暫時改為固定位置以進行除錯，但 v4.19 的隨機 logique 仍是最終目標。)

project.html (專案內頁)

logique (project.js v4.16):

project.js 會讀取瀏覽器 URL 中的 ?id= 參數。

抓取 data/projects.json 的內容，並尋找 ID 相符的專案物件。

將 title, category, bio, info 填入左欄。

將 images 陣列動態生成 <img> 標籤並填入右欄。

Next Project: project.js 會再次抓取 data/projects.json，過濾掉當前專案，從剩下的專案中隨機挑選一個，顯示在左下角的「Next Project」按鈕上。

佈局 (main.css v4.3):

.project-nav-bottom (包含 "Back" 和 "Next" 按鈕) 已從 <aside> (左側欄) 移至 <main> (主容器) 的末端。

CSS Grid (grid-template-rows: 1fr auto) 被用來確保此導航列在桌面版和手機版中，都固定顯示於所有內容的最下方。

[新增] 載入轉場 (Incoming Transition) (v4.14):

project.html 的 <main> 標籤擁有 id="projectMainContainer"。

CSS 預設將 #projectMainContainer 設為 opacity: 0 (透明) 且 filter: blur(10px) (模糊)。

project.js (v4.14) 會在 fetch 資料並將所有內容填入 DOM 之後，才為 #projectMainContainer 添加 .is-loaded class。

此 class 會觸發 CSS 動畫，使頁面內容平滑地淡入並恢復清晰，完全遮蔽 "Loading..." 字樣。

about.html (關於我頁面)

logique: 一個完全靜態的「關於我」頁面，不載入任何 js/index.js 或 js/project.js 腳本。

行動版佈局 (main.css): 與 project.html 的行動版佈局規則完全一致（單欄、可滾動）。

[新增] 除錯與最佳實踐 (v4.25)

根據近期的除錯經驗，新增以下開發守則：

驗證 fetch 路徑 (Verify fetch Path):

[最重要] 專案中最常發生的致命錯誤，是 index.js 或 project.js 中的 fetch() 路徑與 portfolioDevGuide.md 中定義的檔案結構不符。

路徑必須為：./data/projects.json。

如果 fetch 404 失敗，.then() 區塊將不會執行，導致所有 JS 功能（滾動、篩選、點擊）全部靜默失敗。

DOMContentLoaded 作用域 (Scoping):

所有需要與 DOM 互動的程式碼（例如 getElementById, addEventListener），必須被包裹在 document.addEventListener('DOMContentLoaded', () => { ... }); 事件監聽器之內。

若放在外部，程式碼可能在 DOM 尚未準備就緒時執行，導致抓取元素失敗 (返回 null)。

響應式事件綁定 (Responsive Event Binding):

對於在桌面版（滾輪）和手機版（觸控）有不同互動的 logique，事件監聽器必須在 window.resize 事件觸發時重新評估。

應使用一個專門的函式（如 bindScrollListeners()）來先「移除舊監聽器」，再「根據當前寬度綁定新監聽器」。

漸進式開發 (Incremental Development):

當新增複雜的非核心功能時（例如 Tone.js 音效、隨機動畫），應在確保核心功能（滾動、篩選）穩定的基礎上，逐一添加。

如果核心功能突然失效，應首先暫時註解 (停用) 新增的特效，以快速釐清問題是來自「核心 logique」還是「新特效」。