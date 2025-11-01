Sywan Portfolio 專案開發指南 v5.1

這份文件是 Sywan 個人作品集網站的官方開發指南，旨在統一定義專案架構、開發流程與內容管理規範。

v5.1 更新日誌：
本次更新 (v5.0/v5.1) 進行了全站的 HTML 結構重構，導入了統一的 header / main / footer 三層式佈局，以標準化所有頁面的導航體驗。

核心理念：內容與結構分離

本專案的核心架構理念是將「網站內容」與「網站結構」完全分離。

網站結構 (Structure): 由 .html, main.css, .js 等檔案定義。這些檔案負責網站的版面、外觀和互動邏輯。

網站內容 (Content): 所有的作品文字、圖片路徑和其他資訊，全部集中儲存在 data/projects.json 這個檔案中。

優點:

易於維護: 當您需要新增、刪除或修改一個作品時，您只需要編輯 data/projects.json 檔案，完全不需要更動任何 HTML 或 JavaScript 程式碼。

結構清晰: 程式碼保持乾淨，只專注於功能實現。

專案檔案結構 (v5.1)

所有檔案應依照以下結構進行組織：

/sywan-portfolio/
├─ index.html       // 載入動畫頁 (網站進入點)
├─ portfolio.html   // 網站首頁 (作品索引)
├─ project.html     // 專案內頁 (作品範本)
├─ gallery.html     // 攝影作品展示頁
├─ about.html       // 關於我頁面 (靜態內容)
│
├─ /data/
│  └─ projects.json  // 唯一的作品資料庫 (Single Source of Truth)
│
├─ /css/
│  └─ main.css       // 網站所有共用樣式表 (v5.1)
│
├─ /js/
│  ├─ index.js       // 僅用於 portfolio.html 的腳本
│  ├─ project.js     // 僅用於 project.html 的腳本
│  └─ gallery.js     // 僅用於 gallery.html 的腳本
│
└─ /assets/
   └─ /images/       // (建議) 存放所有專案圖片
      └─ ...


(新增) 全局架構 (v5.1)

自 v5.0 起，所有頁面 (不含 index.html) 均遵循統一的三層式 HTML 結構：

<body>
    <header>
        <!-- Logo (Fixed) -->
    </header>

    <main class="middle-container [layout-class]">
        <!-- 
          主要內容區 (Content Area)
          高度為 calc(100vh - 120px)
          [layout-class] 決定了此區域的 Grid 佈局
        -->
    </main>
    
    <!-- 
      v5.1 結構：
      portfolio.html 會在 main 標籤後方額外有一個 <footer class="mobile-footer"> 
      (僅用於手機版篩選器)
    -->

    <footer class="main-footer">
        <!-- 
          全站導航區 (Global Navigation)
          (Fixed, 60px)
          左側 (footer-left) / 右側 (footer-right)
        -->
    </footer>
</body>


<header> (頂部): 60px 高度，固定於頂部，僅包含 Logo。

<main class="middle-container"> (中部):

此為主要內容容器，高度固定為 calc(100vh - 120px) (即視窗高度減去 header 和 footer)。

所有頁面內容（如左欄資訊、中欄列表、右欄圖片）都在此區域內滾動。

[layout-class] (例如 .portfolio-container, .project-layout) 用於定義該頁面的 CSS Grid 欄位。

<footer class="main-footer"> (底部):

60px 高度，固定於底部（手機版為 static），作為全站統一的導航列。

.footer-left 用於放置「Back」按鈕。

.footer-right 用於放置「Next Project」和「外部連結 (Contact Links)」。

內容管理 (data/projects.json)

data/projects.json 是整個作品集的心臟。它是一個 JSON 陣列 (Array)，陣列中的每一個物件 (Object) 都代表一個作品。

(此處的物件結構定義與 v4.32 相同，保持不變)

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


頁面邏輯 (v5.1)

index.html (載入動畫頁)

用途: 作為網站的進入點。

邏輯: 使用 <meta http-equiv="refresh"> 標籤，在 1.5 秒後自動跳轉到 portfolio.html。

portfolio.html (首頁 / 作品索引)

結構 (v5.1):

<main class="middle-container portfolio-container"> (三欄式 Grid 佈局)。

本頁面包含兩個 <footer> 標籤：

<footer class="mobile-footer">：僅在手機版顯示，且僅包含作品篩選器 (.mobile-filter-nav)。

<footer class="main-footer">：全版本顯示，僅包含外部連結 (#desktopContactLinks, #mobileContactLinks)。

邏輯 (js/index.js):

(不變) 抓取 projects.json 並動態生成「無縫迴圈」列表。

(不變) 滾輪/觸控事件 (handleWheelScroll, handleTouchEnd) 用於切換 .is-active 項目。

(不變) 篩選器 (handleFilterClick) 透過 data-filter 屬性顯示/隱藏項目。

頁面轉場 (v5.1): bindTransitionLinks 函式現在會綁定位於 .main-footer 內的外部連結 (#desktopContactLinks, #mobileContactLinks) 以及 about.html 連結。

project.html (專案內頁)

結構 (v5.1):

<main class="middle-container project-layout"> (兩欄式 Grid 佈局)。

[重大變更] 舊的 .project-nav-bottom 和 .project-nav-right-wrapper 已被移除。

所有導航功能（Back, Next Project, Contact Links）現在統一由頁面底部的 <footer class="main-footer"> 處理。

邏輯 (js/project.js):

(不變) 讀取 URL 中的 ?id= 參數。

(不變) 抓取 projects.json，使用 .find() 尋找 ID 相符的專案。

(不變) 動態將 title, category, bio, info 和 images 填入 <main> 容器內的對應欄位。

(不變) 隨機抓取下一個專案並填入 #nextProjectLink (該元素現在位於 .main-footer 中)。

(新增) gallery.html (攝影作品展示頁)

結構 (v5.1):

<main class="middle-container gallery-layout"> (單欄式 Grid 佈局)。

導航功能（Back）由 <footer class="main-footer"> 處理。

邏輯 (js/gallery.js):

(不變) 抓取 projects.json 並篩選 category === "Photography" 的項目。

(不變) 合併所有圖片陣列為單一陣列。

(不變) 桌面版 (renderDesktopCollage) 執行隨機拼貼；手機版 (renderMobileGrid) 執行雙欄網格。

about.html (關於我頁面)

結構 (v5.1):

<main class="middle-container about-layout"> (兩欄式 Grid 佈局)。

靜態內容頁面。

導航功能（Back, Contact Links）由 <footer class="main-footer"> 處理。

邏輯: 無 JS 腳本。

除錯與最佳實踐 (v5.1)

驗證 fetch 路徑 (Verify fetch Path):

[最重要] 專案中最常發生的致命錯誤，是 JS 檔案中的 fetch() 路徑與本指南中定義的 data/projects.json 不符。

路徑必須為：./data/projects.json。

如果 fetch 404 失敗，.then() 區塊將不會執行，導致所有 JS 功能靜默失敗。

DOMContentLoaded 作用域 (Scoping):

(不變) 所有需要與 DOM 互動的程式碼，必須被包裹在 document.addEventListener('DOMContentLoaded', () => { ... }); 之內。

v5.1 佈局依賴：

main.css 中 .middle-container 的 height: calc(100vh - 120px) 是佈局的核心。如果 header (60px) 或 footer.main-footer (60px) 的高度發生變化，此 CSS 變數必須同步修改。