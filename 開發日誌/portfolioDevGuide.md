Portfolio 網站開發指南 v1.0

這份文件旨在總結目前的開發進度，並提供一個清晰的後續開發與部署藍圖。

1. 專案進度總結

我們已經成功地完成了網站的核心頁面原型開發，包含了以下幾個關鍵部分：

載入動畫 (Loading Animation):

檔案: FEAT_portfolioLoader_v3.0_full-replication.html

特色: 採用了靈感參考中的動態字體排印 (Kinetic Typography) 風格，結合了多層次、多方向的滾動效果，視覺衝擊力強。

首頁 (Index Page):

檔案: FIX_portfolioIndex_v1.3_滾動修正.html

特色:

三欄式佈局: 參考專業設計網站，版面清晰、具現代感。

懸停預覽 (Hover Preview): 滑鼠懸停於作品列表時，左側欄位會即時更新對應的作品資訊，互動體驗流暢。

固定 Header: 頂部有固定的 Header 和 Logo，並帶有陰影效果，增加頁面深度感。

區域滾動: 鎖定整體頁面，僅讓中間的作品列表區域可以滾動，避免了版面混亂。

專案內頁 (Project Page):

檔案: FIX_portfolioProject_v1.1_滾動修正.html

特色:

佈局與首頁風格一致，維持視覺連貫性。

左側為固定的專案描述，右側為可獨立滾動的作品圖片展示區。

包含「返回 (Back)」按鈕，方便使用者導航。

2. 使用 JSON 管理作品內容

為了方便您未來新增、修改或刪除作品，我們將把所有作品資料從 HTML 中分離出來，集中存放在一個 projects.json 檔案中。

步驟 1: 建立 projects.json 檔案
這是一個範例檔案，您可以在此基礎上擴充您的作品集。(ADD_projectsData_v1.0_projects.json)

步驟 2: 修改首頁 (index.html) 以讀取 JSON
您需要在 HTML 中移除寫死的作品列表，並加入一段 JavaScript 程式碼，讓它在頁面載入時自動去讀取 projects.json，然後動態地生成列表。

// 範例 JavaScript 程式碼 (應放在 index.html 的 <script> 標籤中)
document.addEventListener('DOMContentLoaded', () => {
    const projectList = document.getElementById('projectList');

    fetch('./data/projects.json') // 讀取 JSON 檔案
        .then(response => response.json())
        .then(projects => {
            projectList.innerHTML = ''; // 清空現有列表
            projects.forEach(project => {
                const listItem = document.createElement('li');
                listItem.className = 'project-item';
                // 將作品資料儲存在 data-* 屬性中，供 hover 效果使用
                listItem.setAttribute('data-title', project.title);
                listItem.setAttribute('data-bio', project.bio);
                
                // 建立連結，並透過 URL 參數傳遞作品 id
                listItem.innerHTML = `<a href="project.html?id=${project.id}">${project.title}</a>`;
                
                projectList.appendChild(listItem);
            });
        });

    // ... 原有的 hover 預覽功能的程式碼需保留 ...
});


步驟 3: 修改專案內頁 (project.html) 以顯示對應內容
專案內頁需要知道該顯示哪一個作品的內容。我們利用 URL 參數 (例如 ?id=kinetic-poster) 來傳遞這個資訊。

// 範例 JavaScript 程式碼 (應放在 project.html 的 <script> 標籤中)
document.addEventListener('DOMContentLoaded', () => {
    // 1. 從 URL 取得作品 id
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (projectId) {
        // 2. 讀取 JSON 檔案
        fetch('./data/projects.json')
            .then(response => response.json())
            .then(projects => {
                // 3. 找到對應 id 的作品
                const project = projects.find(p => p.id === projectId);

                if (project) {
                    // 4. 將作品資料填入頁面中
                    document.title = `Project - ${project.title}`; // 更新網頁標題
                    document.getElementById('projectTitle').textContent = project.title;
                    document.getElementById('projectBio').textContent = project.bio;
                    document.getElementById('projectInfo').innerHTML = project.info; // 使用 innerHTML 以支援 <br> 換行

                    const imageContainer = document.getElementById('projectImages');
                    imageContainer.innerHTML = ''; // 清空預設圖片
                    project.images.forEach(imageUrl => {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.alt = `${project.title} image`;
                        imageContainer.appendChild(img);
                    });
                }
            });
    }
});


3. 檔案結構與部署建議

為了方便管理與部署到 Github Pages，建議您採用以下檔案結構：

/sywan-portfolio/
|
|-- index.html              // 您的首頁 (由 FIX_portfolioIndex... 改名)
|-- project.html            // 專案內頁範本 (由 FIX_portfolioProject... 改名)
|-- loader.html             // 載入動畫頁面 (可選)
|
|-- /data/
|   |-- projects.json       // 您的作品資料庫
|
|-- /css/
|   |-- main.css            // 主要樣式檔案
|
|-- /js/
|   |-- index.js            // 首頁專用的 JavaScript
|   |-- project.js          // 專案內頁專用的 JavaScript
|
|-- /assets/
    |-- /images/
        |-- kinetic-poster-01.jpg
        |-- aura-branding-01.jpg
        |-- ... (您所有的作品圖片)


Github Pages 部署流程:

建立倉庫: 在 Github 上建立一個新的公開倉庫 (repository)，例如命名為 sywan-portfolio。

上傳檔案: 將您整理好的專案檔案全部上傳到這個倉庫中。

啟用 Pages: 進入倉庫的 Settings -> Pages 頁面。

選擇來源: 在 Build and deployment -> Source 中選擇 Deploy from a branch。

選擇分支: 在 Branch 中選擇 main (或 master) 分支，資料夾選擇 /(root)，然後點擊 Save。

完成: 等待幾分鐘後，您的網站就會發佈在 https://<您的Github帳號>.github.io/sywan-portfolio/。

4. 下一步行動計畫

重構檔案: 依照上述「檔案結構建議」整理您現有的 HTML 檔案，並將 CSS 和 JavaScript 程式碼分離出來。

建立 JSON 資料: 根據 ADD_projectsData_v1.0_projects.json 的範本，填寫您自己的真實作品資料。

實現動態載入: 將上述 JavaScript 範例程式碼整合進您的 index.html 和 project.html 中，完成從 JSON 動態載入內容的功能。

修復 Bug: 解決您之前在 index 頁面提到的 Bug。

部署上線: 依照部署流程，將您的網站發佈到 Github Pages。

這份指南涵蓋了從現狀到一個結構清晰、易於維護的專業作品集網站的完整路徑。