Sywan Portfolio 專案開發指南 v3.12

這份文件是 Sywan 個人作品集網站的官方開發指南，旨在統一定義專案架構、開發流程與內容管理規範。

核心理念：內容與結構分離

本專案的核心架構理念是將「網站內容」與「網站結構」完全分離。

網站結構 (Structure): 由 .html, main.css, .js 等檔案定義。這些檔案負責網站的版面、外觀和互動 logique。

網站內容 (Content): 所有的作品文字、圖片路徑和其他資訊，全部集中儲存在 data/projects.json 這個檔案中。

優點:

易於維護: 當您需要新增、刪除或修改一個作品時，您只需要編輯 data/projects.json 檔案，完全不需要更動任何 HTML 或 JavaScript 程式碼。

結構清晰: 程式碼保持乾淨，只專注於功能實現。

專案檔案結構

所有檔案應依照以下結構進行組織：

/sywan-portfolio/
├── loader.html             // 載入動畫頁 (網站進入點)
├── index.html              // 網站首頁 (作品索引)
├── project.html            // 專案內頁 (作品範本)
├── about.html              // [v3.12 新增] 關於我頁面
│
├── /data/
│   └── projects.json       // 唯一的作品資料庫 (Single Source of Truth)
│
├── /css/
│   └── main.css            // 網站所有共用樣式表
│
├── /js/
│   ├── index.js            // 僅用於 index.html 的腳本
│   └── project.js          // 僅用於 project.html 的腳本
│
└── /assets/
    └── /images/            // 存放所有專案圖片
        └── ...


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
  "coverImage": "assets/images/kinetic-poster-cover-01.jpg",
  "images": [
    "assets/images/kinetic-poster-main-01.jpg",
    "assets/images/kinetic-poster-main-02.jpg"
  ]
}


"id": [必要] 專案的唯一識別符 (小寫英文，可用 - 連接)。這個 ID 會被用在 URL 中 (例如 project.html?id=kinetic-poster)，絕對不能重複。

"number": [必要] 專案的編號 (目前僅作為備用欄位)。

"category": [v3.0 新增, 必要] 專案的類別 (例如 "Visual", "Identity", "Photography")。此欄位用於首頁的篩選器以及左側預覽標籤。

"title": [必要] 專案的完整標題。

"bio": [必要] 專案的簡短介紹 (1-2句話)，用於首頁的預覽區。

"info": [必要] 專案的詳細資訊 (例如角色、年份、工具)，用於專案內頁的 DOCS 區塊。可以使用 <br> 標籤來換行。

"coverImage": [必要] 首頁預覽時顯示的圖片路徑。

"images": [必要] 一個包含多張圖片路徑的陣列，用於專案內頁的圖片展示區。

圖片命名規範

所有專案圖片都應存放在 /assets/images/ 資料夾中，並遵循以下命名規則：

[專案ID]-[類型]-[編號].[副檔名]

[專案ID]: 對應 projects.json 中的 id。 (例如 kinetic-poster)

[類型]:

cover: 用於首頁的預覽圖。

main: 用於專案內頁的主要展示圖。

[編號]: 兩位數流水號，例如 01, 02。

如何新增一個專案 (標準作業流程)

準備圖片:

依照上述命名規範，準備好您的 cover 圖片和 main 圖片。

將所有圖片上傳到 /assets/images/ 資料夾中。

編輯 JSON:

打開 data/projects.json 檔案。

在 [ 和 ] 之間，複製貼上一個現有的專案物件 (從 { 到 }，包含大括號)。

注意: 請確保每個物件的 } 後面都有一個逗號 , (最後一個物件除外)。

修改這個新物件中的所有欄位 (id, number, category, title, bio, info, coverImage, images)，填入新專案的資料。

完成:

儲存 projects.json 檔案。網站將會自動讀取新的 JSON 資料，首頁列表和篩選器會自動更新。

頁面邏輯 (v3.12)

loader.html:

作為網站的進入點 (Entry Point)。

使用 <meta http-equiv="refresh"> 標籤，在 5 秒後自動跳轉到 index.html。

index.html (由 js/index.js 驅動):

互動核心 (滾輪鎖定): 完全移除了滑鼠 mouseover 邏輯。

js/index.js 現在會監聽中欄 .center-column 的滾輪 (wheel) 事件。

滾動時，js/index.js 會計算下一個應置中的項目，並將其平滑滾動到視窗中央。

狀態切換: 被鎖定在中央的項目會獲得 .is-active class，CSS 會使其放大 (scale(1)) 並完全不透明 (opacity: 1)。其他項目則會縮小並淡出，產生「滾輪/插槽」效果。

預覽更新: 只有 .is-active 的項目會觸發左側欄位更新 (讀取 data-category 和 data-info)，將標籤從 NO./BIO/INFO 切換為 [Category]/DOCS (並隱藏 BIO 區塊)。

預設狀態: 頁面載入時，會自動啟用 projects.json 中的第三個項目 (索引 2) 作為預設顯示。

篩選功能: js/index.js 會監聽右側 .category-nav 的點擊事件。點擊後，會過濾 projects.json 中 category 相符的項目，隱藏不符的項目，並自動滾動到篩選後的第一個項目。

連結: 右下角包含 "Me" 連結，指向 about.html。

project.html (由 js/project.js 驅動):

js/project.js 會讀取瀏覽器 URL 中的 ?id= 參數。

fetch (抓取) data/projects.json 的內容，並尋找 ID 相符的專案物件。

版面同步: 左側欄位版面已與 index.html 的「啟用狀態」同步 (顯示 Category 和 DOCS，隱藏 BIO)。

[v3.10 新增] Next Project: js/project.js 會再次抓取 data/projects.json，過濾掉當前頁面的專案，從剩下的專案中隨機挑選一個，並將其資訊和連結顯示在左下角的「Next Project」按鈕上。

about.html:

[v3.12 新增] 作為「關於我」頁面。

目前使用 index.html 的版面作為範本，您可以後續自行修改此頁面的內容。

字體系統

本專案使用中英文字體堆疊 (Font Stack)。

英文字體: DM Mono (由 index.html 和 project.html 中的 <link> 標籤從 Google Fonts 載入)。

中文字體: momochidori (由 index.html 和 project.html 中的 <script> 標籤從 Typekit (hcg4voj) 載入)。

CSS: main.css 中的 --font-main 變數負責定義這個堆疊，確保瀏覽器能正確渲染中英文。