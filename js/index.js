document.addEventListener('DOMContentLoaded', () => {
    // (FIX_v9.4) 新增一個 class 到 body，用於 CSS 鎖定主頁滾動
    // 這比 :has() 選擇器更可靠
    document.body.classList.add('portfolio-scroll-lock');

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
    
    // (FIX_v4.23) 將 centerColumn 移至頂層
    const centerColumn = document.querySelector('.portfolio-container .center-column');

    // (MOD: v7.0) 'scroll' 事件的計時器 (Debounce)
    let scrollTimer = null;
    
    // (ADD: v8.0) 'wheel' 事件的計時器 (Throttle)
    let isWheeling = false;

    // (v6.0) 新增輔助函式
    /**
     * 產生一個介於 min 和 max 之間的隨機浮點數
     */
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // (ADD: v9.2) 新增裝置偵測
    /** 檢查是否為手機版 */
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // (MOD: v8.0) 
    /**
     * 綁定滾動監聽器 (升級)
     * (MOD: v9.2) 根據裝置類型綁定不同監聽器
     *
     * 我們現在綁定 *兩種* 監聽器：
     * 1. 'wheel' (主動): 用於接管滑鼠滾輪，必須 { passive: false }。(僅桌面版)
     * 2. 'scroll' (被動): 用於同步由 'wheel' 以外事件 (如拖動、觸控) 觸發的滾動。
     */
    function bindScrollListeners() {
        if (!centerColumn) return;

        // 1. 移除舊的監聽器 (確保安全)
        centerColumn.removeEventListener('scroll', handleFreeScroll);
        centerColumn.removeEventListener('wheel', handleWheelScroll);

        if (isMobile()) {
            // --- 手機版 ---
            // 僅綁定被動的 'scroll' 事件。
            // 滾動由 CSS scroll-snap 處理，JS 僅在滾動停止後同步 UI。
            centerColumn.addEventListener('scroll', handleFreeScroll, { passive: true });
        } else {
            // --- 桌面版 ---
            // 2. [v8.0] 綁定 'wheel' 事件 (主動控制)
            //    必須設為 'passive: false' 才能呼叫 event.preventDefault()
            centerColumn.addEventListener('wheel', handleWheelScroll, { passive: false });
            
            // 3. [v7.1] 綁定 'scroll' 事件 (被動同步)
            //    保持 'passive: true' 以獲得最佳效能
            centerColumn.addEventListener('scroll', handleFreeScroll, { passive: true });
        }
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
                
                // (MOD: v8.0) (Problem 1 Fix)
                // 1. 立即滾動到定位並更新UI (無延遲)
                //    這會立即將 'Kinetic Poster' 滾動到中央並更新左側面板。
                // (MOD: v9.2) 手機版現在會正確執行此 'auto' 滾動並觸發高光
                setActiveItem(currentActiveIndex, 'auto'); 
                
                // 2. 透過 short delay 觸發CSS入場動畫
                //    這讓DOM有足夠時間在 "is-loaded" class 添加前
                //    處理 'auto' 滾動。
                setTimeout(() => {
                    const mainContainer = document.querySelector('.portfolio-container');
                    if (mainContainer) {
                        mainContainer.classList.add('is-loaded');
                    }
                }, 50); // 50ms 延遲以確保DOM準備就緒
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
                // (MOD: v9.2) 裝置類型可能改變 (例如旋轉平板)，所以要重新綁定
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
    // (MOD: v8.0) 
    // smoothScroll: 
    //   true ('smooth') = 平滑滾動 (由 wheel/click 觸發)
    //   'auto' = 立即跳轉 (由 load/filter 觸發)
    //   false = 僅更新 UI (由 'scroll' 事件觸發)
    function setActiveItem(index, smoothScroll = true) {
        
        if (visibleItems.length === 0) return; 

        // 邊界檢查
        if (index < 0) {
            index = 0;
        }
        if (index >= visibleItems.length) {
            index = visibleItems.length - 1;
        }
        
        // (MOD: v8.0) 
        // 只有當 *不是* 'scroll' 事件 (false) 觸發時
        // 且索引相同時，才 'return'。
        // 這確保了 'scroll' 事件 *總是* 能更新 'currentActiveIndex'
        if (smoothScroll !== false && index === currentActiveIndex) {
            return;
        }

        // (MOD: v8.0) 
        // 滾動事件 (false) 會進到這裡，但不會觸發 'scrollIntoView'
        // 它只會更新 'currentActiveIndex' 和 UI
        currentActiveIndex = index;

        // 更新列表高光
        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
        });

        const targetItem = visibleItems[index];
        if (!targetItem) return; 

        targetItem.classList.add('is-active');

        // (MOD: v8.0) 
        // 只有 'true' (smooth) 或 'auto' 會觸發滾動
        // 'false' (來自 handleFreeScroll) 會跳過此區塊
        if (smoothScroll === true) { // 'smooth'
            targetItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        } else if (smoothScroll === 'auto') { // 'auto'
             // 'auto' 滾動在 v7.0 CSS 中已變為 'smooth'
             targetItem.scrollIntoView({
                behavior: 'auto', // CSS 的 scroll-behavior: smooth 會接管
                block: 'center'
            });
        }
        
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
        // (FIX_v9.6) 關鍵修正：
        // 只有在 *非* 手機版時才顯示隨機預覽圖。
        // 這個預覽圖 (randomPreviewPopup) 在某些手機瀏覽器上
        // 即使有 'pointer-events: none;' 
        // 也會錯誤地遮擋並「吃掉」觸控事件，導致列表無法滑動。
        if (!isMobile()) {
            updateRandomPreview(newImageSrc);
        }

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
            const top = getRandomFloat(10, 60); // 10vh 到 60vh
            const left = getRandomFloat(45, 70); // 45vw 到 70vw

            // 應用樣式
            randomPreviewPopup.style.transform = `translate(${left}vw, ${top}vh) rotate(${rotate}deg) scale(${scale})`;
            randomPreviewPopup.classList.add('is-visible');
        } else {
            // 如果沒有圖片，隱藏視Window
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

    // (ADD: v8.0) (Problem 2 Fix)
    /**
     * 接管 'wheel' (滑鼠滾輪) 事件
     * 這是實現「iOS 選擇器」滾動的核心
     */
    function handleWheelScroll(event) {
        // 阻止瀏覽器預設的滾動行為 (關鍵!)
        event.preventDefault(); 

        // 滾動節流 (Throttling)
        // 如果 50ms 內已經觸發過一次，則忽略
        if (isWheeling) {
            return;
        }
        isWheeling = true;
        
        // 50ms 後解除鎖定
        setTimeout(() => { isWheeling = false; }, 50);

        // 判斷滾動方向
        if (event.deltaY < 0) {
            // 向上滾動 (索引減少)
            if (currentActiveIndex > 0) {
                setActiveItem(currentActiveIndex - 1, true); // 'true' = smooth scroll
            }
        } else if (event.deltaY > 0) {
            // 向下滾動 (索引增加)
            if (currentActiveIndex < visibleItems.length - 1) {
                setActiveItem(currentActiveIndex + 1, true); // 'true' = smooth scroll
            }
        }
    }


    // (MOD: v8.0) 'scroll' 事件處理 (Debounced)
    /**
     * 處理 'scroll' 事件 (被動)
     * 職責: 僅在滾動 *停止* 後 (150ms)，
     * 同步 UI 到離中心最近的項目。
     * 這主要用於處理 "非 wheel" 事件 (如拖動滾動條, 觸控板)。
     */
    function handleFreeScroll() {
        // 使用計時器來實現 "debounce" (防抖)
        clearTimeout(scrollTimer);

        // (MOD: v7.3) 
        // 延遲 150ms，等待 'smooth' 或 'snap' 滾動動畫完成
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

            // 4. (MOD: v8.0) 
            // 僅在 JS 狀態 (currentActiveIndex) 與 
            // 實際 DOM 狀態 (newIndex) 不同步時才更新
            if (newIndex !== -1 && newIndex !== currentActiveIndex) {
                // 傳入 'false' (不觸發滾動)，僅更新 UI
                setActiveItem(newIndex, false);
            } else if (newIndex !== -1) {
                // 如果索引相同，我們手動更新 currentActiveIndex
                // (因為 setActiveItem 頂部的檢查會 'return')
                currentActiveIndex = newIndex;
            }
        }, 150); // 150ms 延遲
    }

    // 點擊事件處理
    function handleItemClick(event) {
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
            // 'true' (smooth scroll) 會觸發 'scrollIntoView'
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
                // CSS (v7.0) 中已新增 scroll-behavior: smooth，
                // 因此 'auto' 會觸發平滑滾動。
                setActiveItem(targetIndex, 'auto');
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

