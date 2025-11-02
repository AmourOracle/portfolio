document.addEventListener('DOMContentLoaded', () => {
    // 獲取 DOM 元素
    const projectListElement = document.getElementById('projectList');
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    // const previewImageElement = document.getElementById('previewImage'); // (v6.0) 移除靜態預覽
    const categoryNavElement = document.getElementById('categoryNav');
    
    // (Request v3.16) 獲取手機版 Footer
    const mobileFooterElement = document.querySelector('.mobile-footer');
    
    // (Task 3) 獲取手機版懸浮視窗元素
    // const mobilePreviewPopup = document.getElementById('mobilePreviewPopup'); // (v6.0) 移除
    // const mobilePreviewImage = document.getElementById('mobilePreviewImage'); // (v6.0) 移除

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
    // const defaultImageSrc = previewImageElement.src; // (v6.0) 移除
    const previewInfoElement = document.getElementById('previewInfo');
    const defaultInfo = previewInfoElement ? previewInfoElement.textContent : '';

    // (FEAT_v4.13) 獲取轉場遮罩
    const pageTransitionOverlay = document.getElementById('pageTransitionOverlay');
    
    // 滾動與觸控變數
    let allProjectItems = [];
    
    // (v6.0) 移除無縫迴圈變數
    // let originalProjectCount = 0;
    // const cloneCount = 3;
    let currentActiveIndex = 0; // (v6.0) 索引從 0 開始

    let isScrolling = false; 
    let visibleItems = []; 
    
    // (FIX_v4.23) 將 centerColumn 移至頂層，以便 resize 函式存取
    const centerColumn = document.querySelector('.portfolio-container .center-column');

    // (Request v3.10) 觸控相關變數
    let touchStartY = 0;
    let touchEndY = 0;
    const touchThreshold = 50; 

    // (v6.0) 新增輔助函式
    /**
     * 產生一個介於 min 和 max 之間的隨機浮點數
     */
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // 響應式滾動監聽器
    /**
     * 根據當前視窗寬度，綁定滾輪 (Wheel) 或觸控 (Touch) 事件
     */
    function bindScrollListeners() {
        if (!centerColumn) return;

        const isMobile = window.innerWidth <= 768;

        // 1. 移除所有現有的監聽器，防止重複綁定
        centerColumn.removeEventListener('wheel', handleWheelScroll, { passive: false });
        centerColumn.removeEventListener('touchstart', handleTouchStart, { passive: false });
        centerColumn.removeEventListener('touchmove', handleTouchMove, { passive: false });
        centerColumn.removeEventListener('touchend', handleTouchEnd, { passive: false });

        // 2. 根據裝置類型綁定正確的監聽器
        if (isMobile) {
            // 綁定觸控事件
            centerColumn.addEventListener('touchstart', handleTouchStart, { passive: false });
            centerColumn.addEventListener('touchmove', handleTouchMove, { passive: false });
            centerColumn.addEventListener('touchend', handleTouchEnd, { passive: false });
        } else {
            // 綁定滾輪事件
            centerColumn.addEventListener('wheel', handleWheelScroll, { passive: false });
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
            // (v6.0) 移除複製體邏輯
            // originalProjectCount = projects.length; 
            // const safeCloneCount = Math.min(cloneCount, originalProjectCount);
            // const clonesStart = projects.slice(0, safeCloneCount);
            // const clonesEnd = projects.slice(-safeCloneCount);
            // const fullProjectList = [...clonesEnd, ...projects, ...clonesStart];

            projectListElement.innerHTML = ''; // 清空現有列表
            
            // (v6.0) 直接遍歷原始 projects 陣列
            projects.forEach((project, index) => { 
                const listItem = document.createElement('li');
                listItem.className = 'project-item';
                listItem.setAttribute('data-index', index); // (v6.0) 索引現在是 0, 1, 2...
                listItem.setAttribute('data-category', project.category);
                listItem.setAttribute('data-title', project.title);
                listItem.setAttribute('data-bio', project.bio);
                listItem.setAttribute('data-cover-image', project.coverImage);
                listItem.setAttribute('data-info', project.info); 
                
                // (v6.0) 移除 data-is-clone 標記
                
                listItem.innerHTML = `
                    <span class="project-category">${project.category}</span>
                    <a href="project.html?id=${project.id}">${project.title}</a>
                `;
                
                projectListElement.appendChild(listItem);
            });

            allProjectItems = Array.from(document.querySelectorAll('#projectList .project-item'));
            visibleItems = [...allProjectItems]; 
            
            if (visibleItems.length > 0) {
                // (v6.0) 初始位置是 0
                currentActiveIndex = 0;
                setActiveItem(currentActiveIndex, false); // 立即跳轉
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
    function setActiveItem(index, smoothScroll = true) {
        
        if (visibleItems.length === 0) return; 

        // (v6.0) 關鍵：新增邊界檢查，防止索引超出範圍
        if (index < 0) {
            index = 0;
        }
        if (index >= visibleItems.length) {
            index = visibleItems.length - 1;
        }
        
        // (v6.0) 如果索引沒有實際變化，則不執行任何操作
        // 這可以防止在滾動到列表末端時重複觸發動畫
        if (index === currentActiveIndex && smoothScroll) {
            // (v6.0) 如果是平滑滾動（用戶觸發）且索引未變，則釋放鎖
            isScrolling = false; 
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

        // 滾動視圖
        if (smoothScroll) {
            targetItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        } else {
            targetItem.scrollIntoView({
                behavior: 'auto',
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
        // if (previewImageElement && newImageSrc) previewImageElement.src = newImageSrc; // (v6.0) 移除
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
        // if (previewImageElement) previewImageElement.src = defaultImageSrc; // (v6.0) 移除
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

    // (v6.0) 移除 checkLoopJump() 函式
    // function checkLoopJump() { ... }


    // 滾輪事件處理
    function handleWheelScroll(event) {
        event.preventDefault(); 
        if (isScrolling) return; 
        isScrolling = true; // 鎖定

        const direction = event.deltaY > 0 ? 1 : -1; 
        let newIndex = currentActiveIndex + direction;
        
        // (v6.0) 移除 checkLoopJump
        // if (newIndex !== currentActiveIndex) {
        setActiveItem(newIndex, true); // 開始滾動, setActiveItem 內部會處理邊界
        // }
        
        // (FIX_v5.2) 關鍵修復：
        // 無論如何，都在一個很短的延遲後釋放鎖。
        setTimeout(() => { isScrolling = false; }, 100);
    }

    // 觸控事件處理
    function handleTouchStart(event) {
        // (v6.0) 隱藏隨機預覽
        /* MOD: (v6.8) 根據使用者請求，在手機觸控時不再隱藏預覽
        if (randomPreviewPopup) {
            randomPreviewPopup.classList.remove('is-visible');
        }
        */
        
        touchStartY = event.touches[0].clientY;
        touchEndY = event.touches[0].clientY; 
    }

    function handleTouchMove(event) {
        event.preventDefault();
        touchEndY = event.touches[0].clientY;
    }

    function handleTouchEnd(event) {
        if (isScrolling) return; 

        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaY) > touchThreshold) {
            event.preventDefault(); // 僅在有效滑動時阻止預設行為
            isScrolling = true; // 鎖定

            const direction = deltaY > 0 ? -1 : 1; // 觸控方向與滾輪相反
            let newIndex = currentActiveIndex + direction;

            // (v6.0) 移除 checkLoopJump
            setActiveItem(newIndex, true);
        }

        // (FIX_v5.2) 關鍵修復：
        // 如果觸發了鎖定，也在 100ms 後釋放，以保持流暢。
        // (v6.0) 如果沒有觸發滾動 (isScrolling 仍為 false)，
        // 則在觸控結束時重新顯示預覽
        if (isScrolling) {
            setTimeout(() => { 
                isScrolling = false; 
            }, 100);
        } else {
            // 如果未觸發滾動，重新顯示當前的預覽
            const targetItem = visibleItems[currentActiveIndex];
            if (targetItem) {
                updateRandomPreview(targetItem.getAttribute('data-cover-image'));
            }
        }
    }

    // 點擊事件處理
    function handleItemClick(event) {
        if (isScrolling) {
            event.preventDefault();
            return;
        }

        const clickedItem = event.target.closest('.project-item');
        if (!clickedItem) return;

        // 1. 獲取點擊項目的索引
        const newIndex = visibleItems.indexOf(clickedItem);
        if (newIndex === -1) return; // 點擊的項目不可見

        // 2. 檢查是否點擊了當前已啟用的項目
        if (newIndex === currentActiveIndex) {
            // 情況 2：項目已啟用 -> 執行頁面轉場
            
            // (v6.0) 移除 data-is-clone 檢查
            
            const link = clickedItem.querySelector('a');
            if (link) {
                event.preventDefault(); // 阻止 <a> 標籤的預設跳轉
                handlePageTransition(link.href);
            }
        } else {
            // 情況 1：點擊了未啟用的項目 -> 滾動到該項目
            event.preventDefault();
            setActiveItem(newIndex, true); 
            // (v6.0) 移除 checkLoopJump
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

        isScrolling = true; 
        
        // (v6.0) 移除複製體相關邏輯
        // const realProjectItems = allProjectItems.filter(item => !item.hasAttribute('data-is-clone'));

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
            
            // (v6.0) 移除隱藏複製體的邏輯
        }
        
        // (v6.0) 滾動到新列表的頂部 (索引 0)
        if (visibleItems.length > 0) {
            let targetIndex = 0; 
            setTimeout(() => {
                setActiveItem(targetIndex, true);
                isScrolling = false;
            }, 50);

        } else {
            resetPreview();
            isScrolling = false;
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

