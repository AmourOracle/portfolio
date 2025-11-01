document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.getElementById('galleryContainer');
    
    // 檢查容器是否存在
    if (!galleryContainer) {
        console.error('Gallery container (#galleryContainer) not found.');
        return;
    }

    // 1. 定義輔助函式 (Helper Functions)
    
    /**
     * 產生一個介於 min 和 max 之間的隨機整數
     */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 產生一個介於 min 和 max 之間的隨機浮點數
     */
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * 根據視窗寬度檢查是否為手機版
     */
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // 2. 抓取並處理資料
    // --- (FIX_v4.25) 恢復 portfolioDevGuide.md 中指定的正確路徑 ---
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok (HTTP ${response.status})`);
            }
            return response.json();
        })
        .then(projects => {
            // 3. 篩選 "Photography" 類別並合併所有圖片
            const photographyProjects = projects.filter(p => p.category === 'Photography');
            
            // 使用 flatMap 將所有 'images' 陣列合併為單一陣列
            const allPhotographyImages = photographyProjects.flatMap(project => 
                // 將圖片 URL 和對應的專案 ID 綁定 (未來可能用於點擊)
                project.images.map(imgUrl => ({
                    url: imgUrl,
                    projectId: project.id,
                    title: project.title
                }))
            );

            if (allPhotographyImages.length === 0) {
                galleryContainer.innerHTML = '<p style="color: var(--secondary-color);">No photography projects found.</p>';
                return;
            }

            // 4. 根據裝置類型渲染畫廊
            if (isMobile()) {
                // --- 手機版：簡單的網格 (由 CSS 控制) ---
                renderMobileGrid(allPhotographyImages);
            } else {
                // --- 桌面版：隨機拼貼佈局 ---
                renderDesktopCollage(allPhotographyImages);
            }
        })
        .catch(error => {
            console.error('Error fetching gallery data:', error);
            galleryContainer.innerHTML = `<p style="color: var(--secondary-color);">Could not load gallery data. (${error.message})</p>`;
        });

    /**
     * 渲染手機版的網格佈局
     * (樣式由 main.css 的 .gallery-content-column.is-mobile-grid 控制)
     */
    function renderMobileGrid(images) {
        // 為容器添加 class 以觸發 CSS Grid 樣式
        galleryContainer.classList.add('is-mobile-grid');
        
        images.forEach(imgData => {
            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = imgData.title || 'Gallery Image';
            img.loading = 'lazy'; // 延遲載入
            galleryContainer.appendChild(img);
        });
    }

    /**
     * 渲染桌面版的隨機拼貼佈局
     */
    function renderDesktopCollage(images) {
        // MOD: (FIX_v4.36) 
        // 移除對 .style.minHeight 的直接操作
        // CSS (v4.36) 已將容器設為 overflow-y: auto;
        // 我們將改為在 fragment 中添加一個 spacer 元素來撐開滾動高度。
        // galleryContainer.style.minHeight = `${images.length * 20}vh`;

        const fragment = document.createDocumentFragment();

        images.forEach((imgData, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            // --- 計算隨機樣式 ---
            // 寬度 (vw): 介於 15vw 到 35vw 之間
            const width = getRandomFloat(15, 35);
            // 位置 Top (vh): 介於 0% 到 180% (假設 min-height 200vh)
            const top = getRandomFloat(0, 180); 
            // 位置 Left (vw): 介於 0% 到 60% ( 100vw - 35vw(max) - 5vw(padding) )
            const left = getRandomFloat(0, 60);
            // 旋轉 (deg): 介於 -6 度到 6 度
            const rotate = getRandomFloat(-6, 6);
            // 堆疊順序
            const zIndex = getRandomInt(1, images.length);

            // 應用樣式
            item.style.width = `${width}vw`;
            item.style.top = `${top}vh`;
            item.style.left = `${left}vw`;
            item.style.transform = `rotate(${rotate}deg)`;
            item.style.zIndex = zIndex;

            // 建立圖片
            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = imgData.title || 'Gallery Image';
            img.loading = 'lazy'; // 延遲載入

            item.appendChild(img);
            fragment.appendChild(item);
        });

        // ADD: (FIX_v4.36) 
        // 新增一個間隔 (Spacer) 元素
        // 由於 .gallery-content-column (容器) 已被 CSS 設為 overflow: auto;
        // 我們需要在*內部*放置一個元素來定義總滾動高度。
        // 我們將其設為 190vh (略高於隨機 top 的最大值 180vh)。
        const spacer = document.createElement('div');
        spacer.style.position = 'absolute';
        spacer.style.top = '190vh';
        spacer.style.left = '0';
        spacer.style.height = '10px';
        spacer.style.width = '10px';
        spacer.style.pointerEvents = 'none'; // 避免干擾
        fragment.appendChild(spacer);
        // --- End of (FIX_v4.36) ---

        galleryContainer.appendChild(fragment);
    }
});
