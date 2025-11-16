document.addEventListener('DOMContentLoaded', () => {
    // (FIX_v9.4) 新增一個 class 到 body，用於 CSS 鎖定主頁滾動
    document.body.classList.add('portfolio-scroll-lock');

    // 獲取 DOM 元素
    const projectListElement = document.getElementById('projectList');
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const categoryNavElement = document.getElementById('categoryNav');
    
    const mobileFooterElement = document.querySelector('.mobile-footer');
    
    // (MOD_v11.0) 恢復 .random-preview-popup 的 JS 邏輯 (Req 1.2)
    const randomPreviewPopup = document.getElementById('randomPreviewPopup');
    const randomPreviewImage = document.getElementById('randomPreviewImage');

    const previewLabelNo = document.getElementById('previewLabelNo');
    const previewLabelCategory = document.getElementById('previewLabelCategory');
    const previewBlockBio = document.getElementById('previewBlockBio');
    
    const previewLabelInfo_Default = document.getElementById('previewLabelInfo_Default');
    const previewLabelDocs_Project = document.getElementById('previewLabelDocs_Project');

    // 儲存預設的資訊
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const previewInfoElement = document.getElementById('previewInfo');
    const defaultInfo = previewInfoElement ? previewInfoElement.textContent : '';

    // (MOD_v11.1) 移除頁面轉場遮罩元素
    // const pageTransitionOverlay = document.getElementById('pageTransitionOverlay');
    
    // --- (REFACTOR_v10.0) 滾動邏輯變數 ---
    let allProjectItems = [];
    let currentActiveIndex = -1; // (FIX_v11.8) 設為無效索引，以強制初始載入
    let visibleItems = []; 
    
    const centerColumn = document.querySelector('.portfolio-container .center-column');

    // (REFACTOR_v10.0) 
    // isManualScrolling 用於鎖定所有 JS 驅動的滾動 (wheel 和 touch)
    // 防止在動畫期間重複觸發
    let isManualScrolling = false; 
    
    // (REFACTOR_v10.0) 僅用於桌面版 trackpad 的被動滾動
    let scrollTimer = null; 

    // (REFACTOR_v10.0) 僅用於手機版的觸控變數
    let touchStartY = 0;
    let touchEndY = 0;
    const touchThreshold = 50; // 觸控滑動的最小距離 (px)
    // --- 結束 滾動邏輯變數 ---


    // (v6.0) 輔助函式：產生隨機浮點數
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // (v9.2) 輔助函式：檢查是否為手機版
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // (REFACTOR_v10.0) 
    /**
     * 綁定滾動監聽器 (核心重構)
     * 根據裝置類型，綁定不同的滾動控制邏輯
     */
    function bindScrollListeners() {
        if (!centerColumn) return;

        // 1. 移除所有現有的監聽器，防止重複綁定
        centerColumn.removeEventListener('scroll', handleFreeScroll, { passive: true });
        centerColumn.removeEventListener('wheel', handleWheelScroll, { passive: false });
        centerColumn.removeEventListener('touchstart', handleTouchStart, { passive: false });
        centerColumn.removeEventListener('touchmove', handleTouchMove, { passive: false });
        centerColumn.removeEventListener('touchend', handleTouchEnd, { passive: false });

        // 2. 根據裝置類型綁定正確的監聽器
        if (isMobile()) {
            // --- 手機版：還原 v4.13 的 JS 驅動觸控邏輯 ---
            // 我們將劫持觸控事件，並手動觸發 scrollIntoView
            centerColumn.addEventListener('touchstart', handleTouchStart, { passive: false });
            centerColumn.addEventListener('touchmove', handleTouchMove, { passive: false });
            centerColumn.addEventListener('touchend', handleTouchEnd, { passive: false });
        } else {
            // --- 桌面版：JS 驅動的滾輪 + 被動的 Trackpad 滾動 ---
            centerColumn.addEventListener('wheel', handleWheelScroll, { passive: false });
            centerColumn.addEventListener('scroll', handleFreeScroll, { passive: true });
        }
    }


    // 1. 獲取專案資料並生成列表
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok (HTTP ${response.status})`);
            }
            return response.json();
        })
        .then(projects => {
            if (!projects || projects.length === 0) {
                throw new Error("No projects loaded from JSON.");
            }

            projectListElement.innerHTML = ''; // 清空現有列表
            
            // (v9.x) 使用 v9.x 的簡單列表生成邏輯 (無 clone)
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
                // (FIX_v11.8) currentActiveIndex 初始值為 -1 (第 35 行)
                const initialIndex = 0;
                // (FIX_v11.8) 立即 ('auto') 跳轉到第一個項目並更新 UI
                setActiveItem(initialIndex, 'auto'); 
                
                // 觸發CSS入場動畫
                setTimeout(() => {
                    const mainContainer = document.querySelector('.portfolio-container');
                    if (mainContainer) {
                        mainContainer.classList.add('is-loaded');
                    }
                }, 50); 
            }

            // 綁定初始的滾動監聽器
            bindScrollListeners();

            // 監聽點擊事件
            projectListElement.addEventListener('click', handleItemClick);

            // 監聽篩選器點擊 (桌面版)
            if (categoryNavElement) {
                categoryNavElement.addEventListener('click', handleFilterClick);
            }
            // 監聽篩選器點擊 (手機版)
            if (mobileFooterElement) {
                mobileFooterElement.addEventListener('click', handleFilterClick);
            }
            
            // 監聽視窗大小改變，重新綁定滾動
            window.addEventListener('resize', () => {
                // 裝置類型可能改變 (例如旋轉平板)，所以要重新綁定
                bindScrollListeners();
            });
            
            // (MOD_v11.1) 移除轉場事件綁定
            // bindTransitionLinks();
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            if (projectListElement) {
                projectListElement.innerHTML = `<li>Error loading projects. Check fetch path. (${error.message})</li>`;
            }
        });

    /**
     * 設置啟用項目 (v9.x 邏輯，保持不變)
     * @param {number} index - 要啟用的項目索引
     * @param {string|boolean} scrollBehavior - 滾動行為 ('smooth', 'auto', 或 false)
     */
    function setActiveItem(index, scrollBehavior = 'auto') {
        
        if (visibleItems.length === 0) return; 

        // 邊界檢查 (v9.x 邏輯，因為我們沒有 v4.13 的 clone)
        if (index < 0) {
            index = 0;
        }
        if (index >= visibleItems.length) {
            index = visibleItems.length - 1;
        }
        
        // (FIX_v11.8) 
        // 初始 currentActiveIndex 為 -1，
        // 第一次呼叫 setActiveItem(0, 'auto') 時，
        // (0 === -1) 為 false，因此函式會繼續執行，解決了初始載入 Bug。
        // (FIX_v11.9)
        // 篩選器 (handleFilterClick) 會在呼叫此函式前將 currentActiveIndex 設為 -1，
        // 確保 (0 === -1) 為 false，強制更新 UI。
        if (scrollBehavior !== false && index === currentActiveIndex) {
            return;
        }

        currentActiveIndex = index;

        // 更新列表高光
        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
        });

        const targetItem = visibleItems[index];
        if (!targetItem) return; 

        targetItem.classList.add('is-active');

        // 觸發滾動
        if (scrollBehavior === true || scrollBehavior === 'smooth') {
            targetItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        } else if (scrollBehavior === 'auto') {
             targetItem.scrollIntoView({
                behavior: 'auto',
                block: 'center'
            });
        }
        // (如果 scrollBehavior === false，則不觸發滾動，僅更新 UI)
        
        // 更新左側預覽文字
        const newTitle = targetItem.getAttribute('data-title');
        const newBio = targetItem.getAttribute('data-bio');
        const newImageSrc = targetItem.getAttribute('data-cover-image');
        const newCategory = targetItem.getAttribute('data-category'); 
        const newInfo = targetItem.getAttribute('data-info'); 

        if (previewTitleElement) previewTitleElement.textContent = newTitle;
        if (previewBioElement) previewBioElement.textContent = newBio;
        if (previewInfoElement) previewInfoElement.innerHTML = newInfo; 

        // (MOD_v11.4) (Req 1) 
        // 移除 !isMobile() 檢查，允許手機版也顯示懸浮預覽圖
        updateRandomPreview(newImageSrc);

        // 更新左側欄位標籤
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'none';
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = newCategory;

            previewLabelInfo_Default.style.display = 'none';
            previewLabelDocs_Project.style.display = 'inline-block';

            if (previewBlockBio) previewBlockBio.classList.add('hide-section');
        }
    }
    
    // (MOD_v11.0) 恢復懸浮視窗 (Req 1.2)
    function updateRandomPreview(imageSrc) {
        if (!randomPreviewPopup || !randomPreviewImage) return;

        if (imageSrc) {
            randomPreviewImage.src = imageSrc;
            const scale = getRandomFloat(0.9, 1.3);
            const rotate = getRandomFloat(-15, 15);
            const top = getRandomFloat(10, 60); 
            const left = getRandomFloat(45, 70);
            
            // (MOD_v11.4) 手機版動態調整位置
            let finalTop = top;
            let finalLeft = left;
            
            if (isMobile()) {
                // 在手機上，強制位置在中間
                finalTop = getRandomFloat(30, 50); 
                finalLeft = getRandomFloat(10, 30); // (vw, 較小)
                // CSS 中已有 @media (max-width: 768px) { .random-preview-popup { width: 200px; } }
                // 但我們需要用 px 來計算
                const popupWidth = 200; 
                const windowWidth = window.innerWidth;
                // 將 vw 轉換為 px
                finalLeft = (windowWidth * (finalLeft / 100)) - (popupWidth / 2);
                
                // 確保 finalLeft 是 px 值
                randomPreviewPopup.style.transform = `translate(${finalLeft}px, ${finalTop}vh) rotate(${rotate}deg) scale(${scale})`;
            } else {
                 randomPreviewPopup.style.transform = `translate(${finalLeft}vw, ${finalTop}vh) rotate(${rotate}deg) scale(${scale})`;
            }
            
            randomPreviewPopup.classList.add('is-visible');
        } else {
            randomPreviewPopup.classList.remove('is-visible');
        }
    }


    // (v9.x) 恢復預設（當篩選為空時）
    function resetPreview() {
        if (previewTitleElement) previewTitleElement.textContent = defaultTitle;
        if (previewBioElement) previewBioElement.textContent = defaultBio;
        if (previewInfoElement) previewInfoElement.textContent = defaultInfo; 

        // (MOD_v11.0) 恢復懸浮視窗 (Req 1.2)
        if (randomPreviewPopup) {
            randomPreviewPopup.classList.remove('is-visible');
        }

        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
        });

        // 恢復預設標籤
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'inline-block';
            previewLabelCategory.style.display = 'none';

            previewLabelInfo_Default.style.display = 'inline-block';
            previewLabelDocs_Project.style.display = 'none';

            if (previewBlockBio) previewBlockBio.classList.remove('hide-section');
        }
        
        // (FIX_v11.8) 確保在重置時，索引也重置回無效狀態
        // (註：如果篩選為空，下一次點擊篩選器時，setActiveItem(0) 無論如何都會觸發)
        // (為求保險，我們仍將其設為 -1)
        currentActiveIndex = -1;
    }

    // --- (REFACTOR_v10.0) 桌面版滾輪事件 (v9.x 邏輯) ---
    /**
     * 接管 'wheel' (滑鼠滾輪) 事件 (僅桌面版)
     */
    function handleWheelScroll(event) {
        // 阻止瀏覽器預設的滾輪滾動
        event.preventDefault(); 

        if (isManualScrolling) return;
        isManualScrolling = true;
        
        // 50ms 節流 (Throttle)
        setTimeout(() => { isManualScrolling = false; }, 50);

        const direction = event.deltaY > 0 ? 1 : -1;
        let newIndex = currentActiveIndex + direction;
        
        // (FIX_v11.8) 修正初始滾動
        // 如果 currentActiveIndex 是 -1 (初始狀態)，滾動時應跳到 0
        if (currentActiveIndex === -1) {
            newIndex = 0;
        }

        // 邊界檢查 (v9.x 邏輯)
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= visibleItems.length) newIndex = visibleItems.length - 1;

        if (newIndex !== currentActiveIndex) {
            // 桌面版滾輪使用 'auto' 立即跳轉 (v4.13 邏輯)
            setActiveItem(newIndex, 'auto');
        } else {
            // 如果沒有變更，也必須釋放鎖
            isManualScrolling = false;
        }
    }

    // --- (REFACTOR_v10.0) 手機版觸控事件 (還原 v4.13 邏輯) ---
    /**
     * 處理 'touchstart' 事件 (僅手機版)
     */
    function handleTouchStart(event) {
        // 如果正在滾動，則忽略新的觸控
        if (isManualScrolling) return; 
        
        touchStartY = event.touches[0].clientY;
        touchEndY = event.touches[0].clientY; 
    }

    /**
     * 處理 'touchmove' 事件 (僅手機版)
     * 必須 `preventDefault` 來阻止瀏覽器原生滾動
     */
    function handleTouchMove(event) {
        // 阻止瀏覽器滾動 (關鍵！)
        event.preventDefault();
        touchEndY = event.touches[0].clientY;
    }

    /**
     * 處理 'touchend' 事件 (僅手機版)
     * 計算滑動方向並觸發滾動
     */
    function handleTouchEnd(event) {
        if (isManualScrolling) return; 

        const deltaY = touchEndY - touchStartY;

        // 檢查滑動距離是否足夠
        if (Math.abs(deltaY) > touchThreshold) {
            // 阻止可能的點擊事件 (例如 touchend 後的 click)
            event.preventDefault();

            // 鎖定滾動，防止重複觸發
            isManualScrolling = true;
            // 300ms 節流
            setTimeout(() => { isManualScrolling = false; }, 300); 

            // 判斷方向
            const direction = deltaY > 0 ? -1 : 1; // 往上滑 (Y 變小) 是 -1，往下 (Y 變大) 是 +1
            let newIndex = currentActiveIndex + direction;
            
            // (FIX_v11.8) 修正初始觸控
            if (currentActiveIndex === -1) {
                newIndex = 0;
            }

            // 邊界檢查 (v9.x 邏輯)
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= visibleItems.length) newIndex = visibleItems.length - 1;

            if (newIndex !== currentActiveIndex) {
                // 手機版觸控使用 'smooth' 平滑滾動 (v4.13 邏輯)
                setActiveItem(newIndex, true);
            } else {
                // 如果沒有變更，也必須釋放鎖
                isManualScrolling = false;
            }
        }
    }
    
    // --- (REFACTOR_v10.0) 桌面版被動滾動 (v9.x 邏輯) ---
    /**
     * 處理 'scroll' 事件 (僅桌面版，用於 Trackpad)
     * 被動同步 UI
     */
    function handleFreeScroll() {
        // 如果是 JS 正在手動滾動，則忽略
        if (isManualScrolling) return;

        // Debounce (防抖)
        clearTimeout(scrollTimer);

        scrollTimer = setTimeout(() => {
            // 再次檢查，防止在 setTimeout 期間被鎖定
            if (isManualScrolling || !centerColumn || visibleItems.length === 0) return;

            const containerRect = centerColumn.getBoundingClientRect();
            const containerCenter = containerRect.top + (containerRect.height / 2);

            let closestItem = null;
            let minDistance = Infinity;

            visibleItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.top + (itemRect.height / 2);
                const distance = Math.abs(containerCenter - itemCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestItem = item;
                }
            });

            if (!closestItem) return; // (FIX_v11.8) 增加保護

            const newIndex = visibleItems.indexOf(closestItem);

            if (newIndex !== -1 && newIndex !== currentActiveIndex) {
                // 傳入 'false' (不觸發滾動)，僅更新 UI
                setActiveItem(newIndex, false);
            } else if (newIndex !== -1) {
                currentActiveIndex = newIndex;
            }
        }, 150); // 150ms 延遲
    }

    // (MOD_v11.1) 簡化點擊事件處理
    function handleItemClick(event) {
        // 如果正在滾動，阻止點擊
        if (isManualScrolling) {
            event.preventDefault();
            return;
        }

        const clickedItem = event.target.closest('.project-item');
        if (!clickedItem) return;

        const newIndex = visibleItems.indexOf(clickedItem);
        if (newIndex === -1) return; 
        
        // (FIX_v11.8) 修正初始點擊
        // 如果 currentActiveIndex 是 -1 (初始狀態)，此時 newIndex 必定不是 -1
        // (newIndex === currentActiveIndex) 檢查 (例如 0 === -1) 會是 false
        
        if (newIndex === currentActiveIndex) {
            // 情況 2：項目已啟用 -> 允許預設的連結點擊行為
            // (不執行 event.preventDefault()，點擊事件將自然傳遞到 <a> 標籤)
        } else {
            // 情況 1：點擊了未啟用的項目 -> 滾動到該項目
            event.preventDefault(); // 阻止 <a> 標籤跳轉
            setActiveItem(newIndex, true); 
        }
    }

    // (v9.x) 篩選器點擊事件處理 (保持不變)
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
            
            // (FIX_v11.9) 
            // 在呼叫 setActiveItem 之前，重設索引
            // 確保 (0 === 0) 的檢查不會提早 return，強制 UI 更新
            currentActiveIndex = -1; 
            
            setTimeout(() => {
                // 篩選後使用 'auto' 立即跳轉
                setActiveItem(targetIndex, 'auto');
            }, 50);

        } else {
            resetPreview();
        }
    }

    // (MOD_v11.1) 移除頁面轉場相關函式
    // const TRANSITION_DURATION = 400;
    // function handlePageTransition(destination) { ... }
    // function bindTransitionLinks() { ... }
});