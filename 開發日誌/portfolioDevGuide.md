Portfolio 開發指南

這份文件說明了此作品集網站的專案結構、核心邏輯與資料流程。

專案結構

本專案是一個基於 HTML, CSS 和 JavaScript 的靜態網站。它不依賴任何前端框架（如 React 或 Vue），而是透過 JavaScript 抓取 JSON 資料來動態填充頁面內容。

檔案結構如下所示：

/
|-- index.html           (網站載入頁/啟動畫面)
|-- portfolio.html       (主要的作品集列表頁，也是網站首頁)
|-- project.html         (單一作品的詳情頁面)
|-- about.html           (關於我/個人資訊頁面)
|-- gallery.html         (攝影作品集錦頁面)
|
|-- data/
|   |-- projects.json    (唯一的資料來源，存放所有專案內容)
|
|-- css/
|   |-- main.css         (全站唯一的 CSS 樣式表)
|
|-- js/
|   |-- index.js         (用於 portfolio.html 的主要邏輯)
|   |-- project.js       (用於 project.html 的邏輯)
|   |-- gallery.js       (用於 gallery.html 的邏輯)
|
|-- assets/
    |-- images/
        |-- favicon.ico         (網站圖示)
        |-- apple-touch-icon.png (Apple 裝置圖示)



核心邏輯與頁面流程

本網站的核心概念是「資料分離」：所有專案內容都儲存在 data/projects.json 中，JavaScript 檔案負責讀取這些資料，並將其動態渲染到對應的 HTML 頁面中。

1. projects.json (資料來源)

這是全站唯一的資料中心 (Single Source of Truth)。

它是一個 JSON 陣列，每個物件代表一個專案。

主要欄位包含：id, title, category, bio, info, coverImage (用於列表頁) 和 images (用於詳情頁)。

2. 啟動流程 (index.html)

index.html 是一個純粹的載入動畫頁面（Splash Screen）。

它不包含任何 JS 邏輯，僅使用 <meta http-equiv="refresh"> 標籤，在 1.5 秒後自動將使用者重新導向到 portfolio.html。

3. 作品集列表頁 (portfolio.html + index.js)

這是使用者瀏覽的主要頁面，具有三欄式佈局（桌面版）。

資料載入：index.js 會在頁面載入時 fetch data/projects.json。

列表生成：index.js 根據抓取到的資料，動態生成中間欄 (.center-column) 的專案滾動列表 (.project-list)。

核心互動 (Picker Wheel)：

index.js 監聽中間欄的滾動事件 (wheel 和 scroll)。

它會計算目前哪個專案 (.project-item) 位於滾動區域的正中央。

當置中項目改變時，index.js 會讀取該項目的 data-* 屬性 (如 data-title, data-bio)。

最後，將這些資料動態更新到左側欄位 (.left-column) 的預覽區域 (#previewTitle, #previewBio 等)。

篩選邏輯：

index.js 同時監聽右側欄（桌面版）和底部 footer（手機版）的篩選按鈕點擊事件。

根據 data-filter 屬性，它會為不符條件的 .project-item 添加 .hide class，實現篩選效果。

頁面跳轉：

當使用者點擊已經置中的專案時，index.js 會觸發頁面轉場動畫 (.page-transition-overlay)。

動畫結束後，跳轉至 project.html?id={project-id}，並將該專案的 id 透過 URL 參數傳遞過去。

4. 作品詳情頁 (project.html + project.js)

這是一個兩欄式佈局的頁面，用於顯示單一專案的詳細資訊。

讀取參數：project.js 啟動時，會使用 URLSearchParams 讀取瀏覽器 URL 上的 id 參數。

資料載入：project.js 同樣會 fetch data/projects.json。

內容填充：

它會在 JSON 陣列中尋找與 URL id 相符的專案物件。

找到後，將該物件的 title, bio, info 和 images 陣列內容，填入到頁面對應的 HTML 元素中（#projectTitle, #projectInfo, #projectImages）。

"Next Project" 邏輯：

為了提供「下一個專案」按鈕，project.js 會從所有其他專案中隨機挑選一個，並將其連結填入 <a> 標籤中。

5. 攝影作品頁 (gallery.html + gallery.js)

這是一個互動式的「無限畫布」頁面，用於探索所有專案的圖片。

資料載入（變更）：gallery.js 抓取 data/projects.json，不過濾類別。

圖片彙整（變更）：它會彙整所有專案的 images 和 coverImage，建立一個大型圖片池。

佈局渲染與圖層（桌面版）：

此頁面採用 CSS Grid 堆疊佈局，分為三層：

下層 (z=10)：左側欄位 (.left-column)，包含 "Gallery" 標題。

中層 (z=20)：可互動的畫布 (.gallery-content-column / #pan-container)，gallery.js 會在此建立一個 5000x5000 像素的畫布，所有圖片使用 position: absolute 隨機散佈於此。

上層 (z=30)：Back 按鈕 (.left-column-bottom)，此按鈕被特意提升至最上層，確保恆定可點擊。

核心互動（桌面版）：

拖曳平移 (Pan)：使用者可按住滑鼠左鍵拖曳，gallery.js 會透過 transform: translate(x, y) 移動 pan-container。

慣性滑動 (Inertia)：拖曳結束後，畫布會帶有慣性繼續滑動並減速。

滾輪縮放 (Zoom)：使用者可使用滑鼠滾輪進行縮放，gallery.js 會透過 transform: scale(s) 實現。

手機版 (isMobile)：在手機上，此互動功能被禁用，並降級回 renderMobileGrid 函式，顯示為一個簡單的、可垂直滾動的 CSS 網格。

6. 關於我頁面 (about.html)

這是一個純靜態頁面，所有內容都直接寫在 HTML 中。

它不依賴任何 fetch 操作或特定的 JavaScript 檔案（除了全域的 main.css）。

樣式 (css/main.css)

全站所有頁面（包括 index.html 的載入動畫）共享同一份 main.css 檔案。

使用 CSS 變數 (Variables) 來統一定義顏色和字體 (例如 --background-color, --font-en)。

大量使用 CSS Grid (display: grid) 來定義主要的頁面佈局（例如 .portfolio-container 的三欄式佈局，.project-layout 的兩欄式佈局）。

響應式設計主要透過 @media (max-width: 768px) 媒體查詢來實現，在手機版上會將多欄佈局改為單欄堆疊。