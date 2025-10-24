Sywan Portfolio 專案開發指南 v1.0

這份文件是 Sywan 個人作品集網站的官方開發指南，旨在統一定義專案架構、開發流程與內容管理規範。

1. 核心理念：內容與結構分離

本專案的核心架構理念是將「網站內容」與「網站結構」完全分離。

網站結構 (Structure): 由 index.html, project.html, main.css, index.js, project.js 等檔案定義。這些檔案負責網站的版面、外觀和互動邏S輯。

網站內容 (Content): 所有的作品文字、圖片路徑和其他資訊，全部集中儲存在 data/projects.json 這個檔案中。

優點:

易於維護: 當您需要新增、刪除或修改一個作品時，您只需要編輯 data/projects.json 檔案，完全不需要更動任何 HTML 或 JavaScript 程式碼。

結構清晰: 程式碼保持乾淨，只專注於功能實現。

高擴充性: 未來要增加更多類型的內容（例如部落格文章）也只需新增一個 JSON 檔案和對應的頁面範本即可。

2. 專案檔案結構

所有檔案應依照以下結構進行組織，以便部署至 Github Pages：

/sywan-portfolio/
|
|-- loader.html             // 載入動畫頁 (網站進入點)
|-- index.html              // 網站首頁 (作品索引)
|-- project.html            // 專案內頁 (作品範本)
|
|-- /data/
|   |-- projects.json       // 唯一的作品資料庫 (Single Source of Truth)
|
|-- /css/
|   |-- main.css            // 網站所有共用樣式表
|
|-- /js/
|   |-- index.js            // 僅用於 index.html 的腳本
|   |-- project.js          // 僅用於 project.html 的腳本
|
|-- /assets/
    |-- /images/            // 存放所有專案圖片
        |-- kinetic-poster-cover-01.jpg
        |-- kinetic-poster-main-01.jpg
        |-- aura-branding-cover-01.jpg
        |-- ...


3. 內容管理 (data/projects.json)

data/projects.json 是整個作品集的心臟。它是一個 JSON 陣列 (Array)，陣列中的每一個物件 (Object) 都代表一個作品。

專案物件結構詳解:

{
  "id": "kinetic-poster",
  "number": "01",
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

"number": [必要] 專案的編號，會顯示在專案內頁的 NO. 旁邊。

"title": [必要] 專案的完整標題。

"bio": [必要] 專案的簡短介紹 (1-2句話)，用於首頁的 BIO 預覽區。

"info": [必要] 專案的詳細資訊 (例如角色、年份、工具)，用於專案內頁的 INFO 區塊。可以使用 <br> 標籤來換行。

"coverImage": [必要] 首頁 hover 時顯示的預覽圖路徑。請務必遵循圖片命名規範。

"images": [必要] 一個包含多張圖片路徑的陣列，用於專案內頁的圖片展示區。

4. 圖片命名規範

為了方便管理，所有專案圖片都應存放在 /assets/images/ 資料夾中，並遵循以下命名規則：

[專案ID]-[類型]-[編號].[副檔名]

[專案ID]: 對應 projects.json 中的 id。 (例如 kinetic-poster)

[類型]:

cover: 用於首頁的預覽圖 (通常是直式)。

main: 用於專案內頁的主要展示圖。

detail: 專案細節圖。

[編號]: 兩位數流水號，例如 01, 02。

範例:

kinetic-poster-cover-01.jpg (首頁預覽圖)

kinetic-poster-main-01.jpg (專案內頁圖 1)

kinetic-poster-main-02.jpg (專案內頁圖 2)

5. 如何新增一個專案 (標準作業流程)

準備圖片:

依照上述命名規範，準備好您的 cover 圖片和 main 圖片。

將所有圖片上傳到 /assets/images/ 資料夾中。

編輯 JSON:

打開 data/projects.json 檔案。

在 [ 和 ] 之間，複製貼上一個現有的專案物件 (從 { 到 }，包含大括號)。

注意: 請確保每個物件的 } 後面都有一個逗號 , (最後一個物件除外)。

修改這個新物件中的所有欄位 (id, number, title, bio, info, coverImage, images)，填入新專案的資料。

完成:

儲存 projects.json 檔案。

您不需要做任何其他事情。 網站將會自動讀取新的 JSON 資料，首頁列表和專案內頁會自動生成。

6. 頁面邏輯

loader.html:

作為網站的進入點 (Entry Point)。

顯示全螢幕的載入動畫 (來自 FEAT_portfolioLoader... 的設計)。

使用 <meta http-equiv="refresh"> 標籤，在 5 秒後自動跳轉到 index.html。

index.html (由 js/index.js 驅動):

頁面載入時，js/index.js 會自動 fetch (抓取) data/projects.json 的內容。

動態生成中間欄位的作品列表 (<li><a>...</a></li>)。

將 title, bio, coverImage 存放在每個列表項的 data-* 屬性中。

監聽滑鼠 mouseover 事件，讀取 data-* 屬性並即時更新左側欄位的標題、BIO 和預覽圖。

project.html (由 js/project.js 驅動):

頁面載入時，js/project.js 會讀取瀏覽器 URL 中的 ?id= 參數 (例如 kinetic-poster)。

fetch (抓取) data/projects.json 的內容。

在所有作品中，尋找 id 與 URL 參數相符的那個專案物件。

找到後，將該物件中的 number, title, bio, info 和 images 陣列動態填入頁面範本中，完成專案頁面的渲染。