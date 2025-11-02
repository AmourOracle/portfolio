document.addEventListener('DOMContentLoaded', () => {
    // 獲取 DOM 元素
    const projectListElement = document.getElementById('projectList');
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const categoryNavElement = document.getElementById('categoryNav');
    
    // (Request v3.16) 獲取手機版 Footer
    const mobileFooterElement = document.querySelector('.mobile-footer');
    
    // (v6.0) 新增統一的隨機預覽元素
    const randomPreviewPopup = document.getElementById('randomPreviewPopup');
    const randomPreviewImage = document.getElementById('randomPreviewImage');

    // (Request 3) 獲取 v2.1 中新增的 ID
    const previewLabelNo = document.getElementById('previewLabelNo');
    const previewLabelCategory = document.getElementById('previewLabelCategory');
    const previewBlockBio = document.getElementById('previewBlockBio');
    
    // (v3.11) 修正 ID 抓取
    const previewLabelInfo_Default = document.getElementById('previewLabelInfo_Default');
    const previewLabelDocs_Project = document.getElementById('previewLabelDocs_Project');

    // 儲存預設的資訊
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const previewInfoElement = document.getElementById('previewInfo');
    const defaultInfo = previewInfoElement ? previewInfoElement.textContent : '';

    // (FEAT_v4.13) 獲取轉場遮罩
    const pageTransitionOverlay = document.getElementById('pageTransitionOverlay');
    
    // 滾動與觸控變數
    let allProjectItems = [];
    
    let currentActiveIndex = 0; 
    let visibleItems = []; 
    
    // (FIX_v4.23) 將 centerColumn 移至頂層，以便 resize 函式存取
    const centerColumn = document.querySelector('.portfolio-container .center-column');

    // (MOD: v7.0) 滾動計時器
    let scrollTimer = null;

    // (v6.0) 新增輔助函式
    /**
     * 產生一個介於 min 和 max 之間的隨機浮點數
     */
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // (MOD: v7.1) 
    /**
     * 綁定滾動監聽器 (修復 v7.0 的 bug)
     */
    function bindScrollListeners() {
        if (!centerColumn) return;

        // 1. (v7.1) 移除所有舊的監聽器 (Bug Fix: 移除對 'handleWheelScroll' 等不存在函式的引用)
        // (v7.1) 假設 'handleFreeScroll' 是唯一的監聽器
        centerColumn.removeEventListener('scroll', handleFreeScroll);

        // 2. (MOD: v7.1) 
        // - 新增: 綁定 'scroll' 事件
        // - 將 { passive: false } 改為 { passive: true }
        // - 理由: 我們只是監聽滾動，沒有要阻止它，
        //   設為 true 可以大幅提升手機上的滾動效能。
        centerColumn.addEventListener('scroll', handleFreeScroll, { passive: true });
    }


    // 1. 獲取專案資料並生成列表
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) {
                // (FIX_v4.24) 拋出更明確的錯誤
                throw new Error(`Network response was not ok (HTTP ${response.status})`);
            }
            return response.json();
        })
        .then(projects => {
            if (!projects || projects.length === 0) {
                throw new Error("No projects loaded from JSON.");
            }

            projectListElement.innerHTML = ''; // 清空現有列表
            
            projects.forEach((project, index) => { 
                const listItem = document.createElement('li');
                listItem.className = 'project-item';
                listItem.setAttribute('data-index', index); 
                listItem.setAttribute('data-category', project.category);
                listItem.setAttribute('data-title', project.title);
                listItem.setAttribute('data-bio', project.bio);
                listItem.setAttribute('data-cover-image', project.coverImage);
                listItem.setAttribute('data-info', project.info); 
                
                listItem.innerHTML = `
                    <span class="project-category">${project.category}</span>
                    <a href="project.html?id=${project.id}">${project.title}</a>
                `;
                
                projectListElement.appendChild(listItem);
            });

            allProjectItems = Array.from(document.querySelectorAll('#projectList .project-item'));
            visibleItems = [...allProjectItems]; 
            
            if (visibleItems.length > 0) {
                currentActiveIndex = 0;
                // (MOD: v7.0) 
                // 初始載入時，立即滾動到頂部 (auto)，然後手動觸發一次滾動檢查
                // 這會高光第一個項目
                setActiveItem(currentActiveIndex, 'auto'); 
                handleFreeScroll();
            }

            // 綁定初始的滾動監聽器
            bindScrollListeners();

            // (Request 4) 監聽點擊事件
            projectListElement.addEventListener('click', handleItemClick);

            // (Request 3) 監聽篩選器點擊 (桌面版)
            if (categoryNavElement) {
                categoryNavElement.addEventListener('click', handleFilterClick);
            }
            // (Request v3.16) 監聽篩選器點擊 (手機版)
            if (mobileFooterElement) {
                mobileFooterElement.addEventListener('click', handleFilterClick);
            }
            
            // 監聽視窗大小改變，重新綁定滾動
            window.addEventListener('resize', () => {
                // (MOD: v7.0) 僅重新綁定
                bindScrollListeners();
            });
            
            // (FEAT_v4.13) 綁定轉場事件到 "Me" 連結
            bindTransitionLinks();
        })
        .catch(error => {
            // (FIX_v4.24) 顯示更詳細的錯誤訊息
            console.error('Error fetching projects:', error);
            if (projectListElement) {
                projectListElement.innerHTML = `<li>Error loading projects. Check fetch path. (${error.message})</li>`;
            }
        });

    // (Request 3) 設置啟用項目
    // (MOD: v7.0) 
    // smoothScroll: 
    //   true ('smooth') = 平滑滾動 (用於點擊)
    //   'auto' = 立即跳轉 (用於篩選)
    //   false = 僅更新 UI，不滾動 (用於 'scroll' 事件)
    function setActiveItem(index, smoothScroll = true) {
        
        if (visibleItems.length === 0) return; 

        // (v6.0) 關鍵：新增邊界檢查，防止索引超出範圍
        if (index < 0) {
            index = 0;
        }
        if (index >= visibleItems.length) {
            index = visibleItems.length - 1;
        }
        
        // (MOD: v7.0) 
        // 僅當索引真正改變時才更新，
        // 且 *不是* 來自 'scroll' 事件 (smoothScroll !== false) 時，才檢查
        if (smoothScroll !== false && index === currentActiveIndex) {
            return;
        }

        currentActiveIndex = index;

        // (FIX_v4.30) 還原 v4.26 的邏輯
        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
        });

        const targetItem = visibleItems[index];
        if (!targetItem) return; 

        targetItem.classList.add('is-active');

        // (MOD: v7.0) 滾動視圖 (僅在 smoothScroll 為 true 或 'auto' 時觸發)
        if (smoothScroll === true) { // 'smooth'
            targetItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        } else if (smoothScroll === 'auto') { // 'auto'
             targetItem.scrollIntoView({
                behavior: 'auto',
                block: 'center'
            });
        }
        // 若 smoothScroll === false (來自 scroll 事件)，則不執行任何滾動

        // 更新左側預覽文字
        const newTitle = targetItem.getAttribute('data-title');
        const newBio = targetItem.getAttribute('data-bio');
        const newImageSrc = targetItem.getAttribute('data-cover-image');
        const newCategory = targetItem.getAttribute('data-category'); 
        const newInfo = targetItem.getAttribute('data-info'); 

        if (previewTitleElement) previewTitleElement.textContent = newTitle;
        if (previewBioElement) previewBioElement.textContent = newBio;
        if (previewInfoElement) previewInfoElement.innerHTML = newInfo; 

        // (v6.0) 更新隨機預覽視窗
        updateRandomPreview(newImageSrc);

        // (Request 3.2) 更新左側欄位標籤
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'none';
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = newCategory;

            previewLabelInfo_Default.style.display = 'none';
            previewLabelDocs_Project.style.display = 'inline-block';

            if (previewBlockBio) previewBlockBio.classList.add('hide-section');
        }
    }
    
    // (v6.0) 新增：更新隨機預覽視窗
    function updateRandomPreview(imageSrc) {
        if (!randomPreviewPopup || !randomPreviewImage) return;

        if (imageSrc) {
            randomPreviewImage.src = imageSrc;

            // 定義隨機參數
            const scale = getRandomFloat(0.9, 1.3); // 隨機縮放
            const rotate = getRandomFloat(-15, 15); // 隨機旋轉
            
            // 定義安全區域 (避免遮擋左欄和列表)
            // 我們將其限制在畫面的右側
            const top = getRandomFloat(10, 60); // 10vh 到 60vh
            const left = getRandomFloat(45, 70); // 45vw 到 70vw

            // 應用樣式
            randomPreviewPopup.style.transform = `translate(${left}vw, ${top}vh) rotate(${rotate}deg) scale(${scale})`;
            randomPreviewPopup.classList.add('is-visible');
        } else {
            // 如果沒有圖片，隱藏視窗
            randomPreviewPopup.classList.remove('is-visible');
        }
    }


    // (Request 3.2) 恢復預設（當沒有項目時，例如篩選結果為空）
    function resetPreview() {
        if (previewTitleElement) previewTitleElement.textContent = defaultTitle;
        if (previewBioElement) previewBioElement.textContent = defaultBio;
        if (previewInfoElement) previewInfoElement.textContent = defaultInfo; 

        // (v6.0) 隱藏隨機預覽
        if (randomPreviewPopup) {
            randomPreviewPopup.classList.remove('is-visible');
        }

        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
        });


        // (Request 3.2) 恢復預設標籤
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'inline-block';
            previewLabelCategory.style.display = 'none';

            previewLabelInfo_Default.style.display = 'inline-block';
            previewLabelDocs_Project.style.display = 'none';

            if (previewBlockBio) previewBlockBio.classList.remove('hide-section');
        }
    }

    // (MOD: v7.0) 移除 handleWheelScroll
    // function handleWheelScroll(event) { ... }

    // (MOD: v7.0) 移除 handleTouchStart
    // function handleTouchStart(event) { ... }

    // (MOD: v7.0) 移除 handleTouchMove
    // function handleTouchMove(event) { ... }

    // (MOD: v7.0) 移除 handleTouchEnd
    // function handleTouchEnd(event) { ... }

    // (ADD: v7.0) 新增: 自由滾動處理 (iOS 選擇器邏輯)
    function handleFreeScroll() {
        // 使用計時器來實現 "debounce" (防抖)
        // 確保只在滾動停止時才觸發計算
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            if (!centerColumn || visibleItems.length === 0) return;

            // 1. 獲取滾動容器的中心點 (相對於 viewport)
            const containerRect = centerColumn.getBoundingClientRect();
            const containerCenter = containerRect.top + (containerRect.height / 2);

            let closestItem = null;
            let minDistance = Infinity;

            // 2. 遍歷所有可見項目，找到距離中心點最近的
            visibleItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.top + (itemRect.height / 2);
                const distance = Math.abs(containerCenter - itemCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestItem = item;
                }
            });

            // 3. 獲取最近項目的索引
            const newIndex = visibleItems.indexOf(closestItem);

            // 4. 如果索引有效，且不是當前啟用的索引，則更新
            if (newIndex !== -1 && newIndex !== currentActiveIndex) {
                // 傳入 'false' (不觸發滾動)，僅更新 UI
                setActiveItem(newIndex, false);
            }
        }, 100); // 100ms 延遲
    }

    // 點擊事件處理
    function handleItemClick(event) {
        // (MOD: v7.0) 移除 isScrolling 檢查
        /*
        if (isScrolling) {
            event.preventDefault();
            return;
        }
        */

        const clickedItem = event.target.closest('.project-item');
        if (!clickedItem) return;

        // 1. 獲取點擊項目的索引
        const newIndex = visibleItems.indexOf(clickedItem);
        if (newIndex === -1) return; // 點擊的項目不可見

        // 2. 檢查是否點擊了當前已啟用的項目
        if (newIndex === currentActiveIndex) {
            // 情況 2：項目已啟用 -> 執行頁面轉場
            const link = clickedItem.querySelector('a');
            if (link) {
                event.preventDefault(); // 阻止 <a> 標籤的預設跳轉
                handlePageTransition(link.href);
            }
        } else {
            // 情況 1：點擊了未啟用的項目 -> 滾動到該項目
            event.preventDefault();
            // (MOD: v7.0) 傳入 'true' (平滑滾動)
            setActiveItem(newIndex, true); 
        }
    }

    // 篩選器點擊事件處理
    function handleFilterClick(event) {
        const targetLink = event.target.closest('a[data-filter]');
        
        if (!targetLink) return;
        event.preventDefault(); 

        const filter = targetLink.getAttribute('data-filter');

        // 更新篩選器按鈕狀態
        if (categoryNavElement) { 
            categoryNavElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        }
        if (mobileFooterElement) { 
            mobileFooterElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        }
        const activeLinks = document.querySelectorAll(`a[data-filter="${filter}"]`);
        activeLinks.forEach(a => a.classList.add('active'));

        // (MOD: v7.0) 移除 isScrolling 鎖
        
        if (filter === 'all') {
            // 情況 A：切換回 "All"
            visibleItems = [...allProjectItems];
            allProjectItems.forEach(item => item.classList.remove('hide'));
        } else {
            // 情況 B：篩選特定類別
            visibleItems = allProjectItems.filter(item => {
                const itemCategory = item.getAttribute('data-category');
                if (itemCategory === filter) {
                    item.classList.remove('hide');
                    return true;
                } else {
                    item.classList.add('hide');
                    return false;
                }
            });
        }
        
        if (visibleItems.length > 0) {
            let targetIndex = 0; 
            setTimeout(() => {
                // (MOD: v7.0) 傳入 'auto' (立即跳轉)
                setActiveItem(targetIndex, 'auto');
                // (MOD: v7.0) 手動觸發一次滾動檢查，確保 UI 更新
                handleFreeScroll();
            }, 50);

        } else {
            resetPreview();
        }
    }

    // 頁面轉場
    const TRANSITION_DURATION = 400;

    function handlePageTransition(destination) {
        if (pageTransitionOverlay) {
            pageTransitionOverlay.classList.add('is-active');
            setTimeout(() => {
                window.location.href = destination;
            }, TRANSITION_DURATION);
        } else {
            window.location.href = destination;
        }
    }

    function bindTransitionLinks() {
        const desktopLinks = Array.from(document.querySelectorAll('#desktopContactLinks a'));
        const mobileLinks = Array.from(document.querySelectorAll('#mobileContactLinks a'));
        const allLinks = Array.from(new Set([...desktopLinks, ...mobileLinks]));

        allLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                // 檢查是否為內部連結、非 mailto 且非新開視窗
                if (link.hostname === window.location.hostname && !link.href.startsWith('mailto:') && !link.target) {
                    event.preventDefault(); 
                    handlePageTransition(link.href);
                }
            });
        });
    }
});
