Sywan Portfolio 專案進度總結 (v6.7)

本文件概述了專案截至 v6.7 的當前狀態，主要集中在架構的統一和互動體驗的優化。

1. 核心理念：內容與結構分離

專案嚴格遵守「內容與結構分離」的核心理念：

網站結構 (Structure): 由 .html, main.css, 和 .js 檔案定義。

網站內容 (Content): 所有作品資料（文字、圖片路徑）均儲存在 data/projects.json 中。

JS 檔案（index.js, project.js, gallery.js）作為橋樑，動態讀取 JSON 內容並將其注入 HTML 結構中。

2. 專案檔案結構 (v6.7)

目前的檔案結構與開發指南一致。

/sywan-portfolio/
├─ index.html       // 載入動畫頁 (1.5s 跳轉)
├─ portfolio.html   // 網站首頁 (作品索引)
├─ project.html     // 專案內頁 (作品範本)
├─ gallery.html     // 攝影作品展示頁
├─ about.html       // 關於我頁面 (靜態內容)
│
├─ /data/
│  └─ projects.json  // 唯一的作品資料庫 (Single Source of Truth)
│
├─ /css/
│  └─ main.css       // 網站所有共用樣式表 (v6.7)
│
├─ /js/
│  ├─ index.js       // 僅用於 portfolio.html (v6.1)
│  ├─ project.js     // 僅用於 project.html (v5.0)
│  └─ gallery.js     // 僅用於 gallery.html (v4.36)
│
└─ /assets/
   └─ /images/       // (建議) 存放所有專案圖片


3. 全局架構 (v6.7)

v6.x 版本已統一了所有頁面（index.html 除外）的桌面版 HTML 佈局，移除了 v5.x 的全局 <footer>。

<header> (頂部):

高度 60px，固定於頂部。

<main class="middle-container"> (中部):

這是所有頁面的主內容容器。

高度 (Height): 統一為 calc(100vh - 60px)，僅減去頂部 header 的高度。

安全區域 (Safe Area): 容器內部新增 padding-bottom: 60px;。這在視窗底部創造了一個 60px 的緩衝空間，確保所有放置在底部的導航按鈕不會被瀏覽器 UI（如 hover 狀態列）遮擋。

4. 內容管理 (data/projects.json)

此部分邏輯不變。projects.json 是一個 JSON 陣列，陣列中的每個物件都代表一個作品。

{
  "id": "kinetic-poster",
  "number": "01",
  "category": "Visual",
  "title": "Kinetic Poster",
  "bio": "專案的簡短介紹...",
  "info": "專案的詳細資訊 (角色、年份等)...",
  "coverImage": "[https://placehold.co/](https://placehold.co/)...",
  "images": [
    "[https://placehold.co/](https://placehold.co/)...",
    "[https://placehold.co/](https://placehold.co/)..."
  ]
}


5. 頁面邏輯 (v6.7 現況)

index.html (載入動畫頁)

邏輯: 無變更。使用 <meta http-equiv="refresh"> 在 1.5 秒後自動跳轉到 portfolio.html。

portfolio.html (首頁 / 作品索引)

結構: portfolio-container (三欄式 Grid 佈局)。

邏輯 (js/index.js):

滾動列表: 已移除「無縫迴圈複製體」。列表現在有明確的起點和終點。

置中高光: ul.project-list 已新增 padding: 40vh 0; 緩衝區，確保滾動時，scrollIntoView({ block: 'center' }) 能將第一個和最後一個項目都正確置於螢幕中央。

預覽效果: 滾動高光時，#randomPreviewPopup 會以隨機位置、大小 (80%-120%) 和角度出現在畫面右側安全區域。

導航: 外部連結 (#desktopContactLinks) 已固定放置在左欄底部的 .left-column-bottom 中。

project.html (專案內頁)

結構: project-layout (兩欄式 Grid 佈局)。

邏輯 (js/project.js): 讀取 URL 中的 ?id= 參數，抓取 JSON 並填入對應欄位。

導航: 導航按鈕位於 .left-column-bottom。

CSS 使用 justify-content: space-between;（左右分散對齊）。

Back 按鈕靠左，Next 按鈕靠右（對齊左欄寬度），符合 image_ee78e4.png 範圖。

gallery.html (攝影作品展示頁)

結構: gallery-layout (兩欄式 Grid 佈局)。

邏輯 (js/gallery.js):

抓取 JSON 並篩選 category === "Photography" 的項目。

桌面版: renderDesktopCollage 函式會將所有圖片以隨機位置、大小和角度渲染在右欄，實現拼貼效果（如 image_ed90e2.jpg 範圖所示）。

手機版: renderMobileGrid 執行雙欄網格。

導航: 左欄 .left-column-bottom 中包含 Back 按鈕（靠左對齊）。

about.html (關於我頁面)

結構: about-layout (兩欄式 Grid 佈局)。內容為靜態。

導航: 左欄 .left-column-bottom 中包含 Back 按鈕（靠左對齊）。