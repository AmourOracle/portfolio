document.addEventListener('DOMContentLoaded', () => {
    // 獲取 DOM 元素
    const projectListElement = document.getElementById('projectList');
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewImageElement = document.getElementById('previewImage');
    const categoryNavElement = document.getElementById('categoryNav');
    
    // (Request v3.16) 獲取手機版 Footer
    const mobileFooterElement = document.querySelector('.mobile-footer');
    
    // (Task 3) 獲取手機版懸浮視窗元素
    const mobilePreviewPopup = document.getElementById('mobilePreviewPopup');
    const mobilePreviewImage = document.getElementById('mobilePreviewImage');

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
    const defaultImageSrc = previewImageElement.src;
    const previewInfoElement = document.getElementById('previewInfo');
    const defaultInfo = previewInfoElement ? previewInfoElement.textContent : '';

    // (FEAT_v4.13) 獲取轉場遮罩
    const pageTransitionOverlay = document.getElementById('pageTransitionOverlay');
    // 滾動與觸控變數
    let allProjectItems = [];
    
    // 無縫迴圈變數
    let originalProjectCount = 0;
    const cloneCount = 3;
    let currentActiveIndex = cloneCount;

    let isScrolling = false; 
    let visibleItems = []; 
    
    // (FIX_v4.23) 將 centerColumn 移至頂層，以便 resize 函式存取
    const centerColumn = document.querySelector('.portfolio-container .center-column');

    // (Request v3.10) 觸控相關變數
    let touchStartY = 0;
    let touchEndY = 0;
    const touchThreshold = 50; 
    
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
            originalProjectCount = projects.length; // 儲存真實的項目數量 (例如 5)

            // 確保 cloneCount 不大於真實項目數量
            const safeCloneCount = Math.min(cloneCount, originalProjectCount);
            if (safeCloneCount === 0) return; // 如果沒有項目，則停止

            const clonesStart = projects.slice(0, safeCloneCount);
            const clonesEnd = projects.slice(-safeCloneCount);
            
            // 建立包含複製體的完整列表 (例如: [3,4,5, 1,2,3,4,5, 1,2,3])
            const fullProjectList = [...clonesEnd, ...projects, ...clonesStart];

            projectListElement.innerHTML = ''; // 清空現有列表
            
            fullProjectList.forEach((project, index) => { 
                const listItem = document.createElement('li');
                listItem.className = 'project-item';
                listItem.setAttribute('data-index', index); // 這是 *完整列表* 中的索引
                listItem.setAttribute('data-category', project.category);
                listItem.setAttribute('data-title', project.title);
                listItem.setAttribute('data-bio', project.bio);
                listItem.setAttribute('data-cover-image', project.coverImage);
                listItem.setAttribute('data-info', project.info); 
                
                // 標記複製體
                if (index < safeCloneCount || index >= safeCloneCount + originalProjectCount) {
                    listItem.setAttribute('data-is-clone', 'true');
                }
                
                listItem.innerHTML = `
                    <span class="project-category">${project.category}</span>
                    <a href="project.html?id=${project.id}">${project.title}</a>
                `;
                
                projectListElement.appendChild(listItem);
            });

            allProjectItems = Array.from(document.querySelectorAll('#projectList .project-item'));
            visibleItems = [...allProjectItems]; 
            
            // (FEAT_v4.31) 移除 setDynamicPadding()
            
            if (visibleItems.length > 0) {
                // 初始位置必須是第一個 "真實" 項目
                currentActiveIndex = safeCloneCount;
                // 立即 (false) 跳轉到初始位置，不顯示動畫
                setActiveItem(currentActiveIndex, false); 
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
        // (FEAT_v4.31) 由於 checkLoopJump 的存在，我們不再需要 JS 的索引迴圈
        // if (index < 0) { ... } (已移除)
        // if (index >= visibleItems.length) { ... } (已移除)

        if (visibleItems.length === 0) return; 
        
        // (FEAT_v4.31) 確保索引在邊界內 (雖然 checkLoopJump 會處理，但作為安全防護)
        if (index < 0 || index >= visibleItems.length) {
            console.warn(`setActiveItem index out of bounds: ${index}`);
            return;
        }

        currentActiveIndex = index;

        // (FIX_v4.30) 還原 v4.26 的邏輯
        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
            // (FIX_v4.30) 移除 v4.27 鄰近狀態
        });

        const targetItem = visibleItems[index];
        if (!targetItem) return; 

        targetItem.classList.add('is-active');

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

        // 更新左側預覽
        const newTitle = targetItem.getAttribute('data-title');
        const newBio = targetItem.getAttribute('data-bio');
        const newImageSrc = targetItem.getAttribute('data-cover-image');
        const newCategory = targetItem.getAttribute('data-category'); 
        const newInfo = targetItem.getAttribute('data-info'); 

        if (previewTitleElement) previewTitleElement.textContent = newTitle;
        if (previewBioElement) previewBioElement.textContent = newBio;
        if (previewImageElement && newImageSrc) previewImageElement.src = newImageSrc;
        if (previewInfoElement) previewInfoElement.innerHTML = newInfo; 

        // 更新手機版懸浮視窗
        if (window.innerWidth <= 768 && mobilePreviewPopup && mobilePreviewImage) {
            if (newImageSrc) {
                mobilePreviewImage.src = newImageSrc;
                mobilePreviewPopup.style.top = `60vh`;
                mobilePreviewPopup.style.transform = `scale(1)`;
                mobilePreviewPopup.style.left = 'auto';
                mobilePreviewPopup.style.right = '5vw';
                mobilePreviewPopup.classList.add('is-visible');
            } else {
                mobilePreviewPopup.classList.remove('is-visible');
            }
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
    
    // (Request 3.2) 恢復預設（當沒有項目時，例如篩選結果為空）
    function resetPreview() {
        if (previewTitleElement) previewTitleElement.textContent = defaultTitle;
        if (previewBioElement) previewBioElement.textContent = defaultBio;
        if (previewImageElement) previewImageElement.src = defaultImageSrc;
        if (previewInfoElement) previewInfoElement.textContent = defaultInfo; 

        if (window.innerWidth <= 768 && mobilePreviewPopup) {
            mobilePreviewPopup.classList.remove('is-visible');
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

    // 無縫迴圈跳轉邏輯
    function checkLoopJump() {
        if (!visibleItems[currentActiveIndex]) return;

        const activeItem = visibleItems[currentActiveIndex];
        
        // 如果當前項目不是複製體，則無需跳轉
        if (!activeItem.hasAttribute('data-is-clone')) {
            return;
        }

        // 停止任何可能正在進行的滾動
        isScrolling = true;

        // 找出我們需要跳轉到的 "真實" 項目的索引
        const title = activeItem.getAttribute('data-title');
        let realIndex = -1;

        // 遍歷 "真實" 項目 (從 safeCloneCount 到 safeCloneCount + originalProjectCount)
        const safeCloneCount = Math.min(cloneCount, originalProjectCount);
        for (let i = safeCloneCount; i < safeCloneCount + originalProjectCount; i++) {
            if (visibleItems[i].getAttribute('data-title') === title) {
                realIndex = i;
                break;
            }
        }

        if (realIndex !== -1) {
            // 立即 (false) 跳轉到真實的項目
            setActiveItem(realIndex, false);
        }
        
        // 釋放滾動鎖
        // (必須在 setActiveItem 之後釋放，以防萬一)
        setTimeout(() => {
            isScrolling = false;
        }, 50); // 短暫延遲
    }


    // 滾輪事件處理
    function handleWheelScroll(event) {
        event.preventDefault(); 
        if (isScrolling) return; 
        isScrolling = true; // 鎖定

        const direction = event.deltaY > 0 ? 1 : -1; 
        let newIndex = currentActiveIndex + direction;
        
        if (newIndex !== currentActiveIndex) {
            setActiveItem(newIndex, true); // 開始滾動
            
            // (FIX_v5.2) 安排跳轉檢查。
            // 這個延遲 (500ms) 應該略長於 'smooth' 滾動的持續時間。
            setTimeout(checkLoopJump, 500); 
        }
        
        // (FIX_v5.2) 關鍵修復：
        // 無論如何，都在一個很短的延遲後釋放鎖。
        // 這消除了滾動到「複製體」時長達 500ms 的「黏滯」感。
        // 100ms 足以防止意外的雙重滾動，同時保持流暢。
        setTimeout(() => { isScrolling = false; }, 100);
    }

    // 觸控事件處理
    function handleTouchStart(event) {
        if (window.innerWidth <= 768 && mobilePreviewPopup) {
            mobilePreviewPopup.classList.remove('is-visible');
        }
        
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

            if (newIndex !== currentActiveIndex) {
                setActiveItem(newIndex, true);
                // (FIX_v5.2) 匹配滾輪邏輯，安排跳轉檢查
                setTimeout(checkLoopJump, 500); 
            } else {
                // (FIX_v5.2) 如果索引沒有變化（例如滑到底部/頂部），
                // 必須釋放鎖，否則會卡住。
                isScrolling = false;
            }
        }

        // (FIX_v5.2) 關鍵修復：
        // 如果觸發了鎖定，也在 100ms 後釋放，以保持流暢。
        if (isScrolling) {
            setTimeout(() => { isScrolling = false; }, 100);
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
        if (newIndex === -1) return; // 點擊的項目不可見 (理論上不會發生)

        // 2. 檢查是否點擊了當前已啟用的項目
        if (newIndex === currentActiveIndex) {
            // 情況 2：項目已啟用 -> 執行頁面轉場
            
            // (FEAT_v4.31) 如果點擊的是複製體，阻止跳轉
            if (clickedItem.hasAttribute('data-is-clone')) {
                event.preventDefault();
                return;
            }
            
            const link = clickedItem.querySelector('a');
            if (link) {
                event.preventDefault(); // 阻止 <a> 標籤的預設跳轉
                handlePageTransition(link.href);
            }
        } else {
            event.preventDefault();
            setActiveItem(newIndex, true); 
            setTimeout(checkLoopJump, 500);
        }
    }

    // 篩選器點擊事件處理
    function handleFilterClick(event) {
        const targetLink = event.target.closest('a[data-filter]');
        
        if (!targetLink) return;
        event.preventDefault(); 

        const filter = targetLink.getAttribute('data-filter');

        if (categoryNavElement) { 
            categoryNavElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        }
        if (mobileFooterElement) { 
            mobileFooterElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        }
        const activeLinks = document.querySelectorAll(`a[data-filter="${filter}"]`);
        activeLinks.forEach(a => a.classList.add('active'));

        isScrolling = true; 
        
        // 2. 獲取真實的項目 (排除複製體)
        const realProjectItems = allProjectItems.filter(item => !item.hasAttribute('data-is-clone'));

        if (filter === 'all') {
            // 情況 A：切換回 "All"
            // 我們需要*完整*的列表 (包含複製體)
            visibleItems = [...allProjectItems];
            // 隱藏 (hide) class 必須從所有項目中移除
            allProjectItems.forEach(item => item.classList.remove('hide'));
        } else {
            // 情況 B：篩選特定類別
            // 我們*只*使用真實項目
            visibleItems = realProjectItems.filter(item => {
                const itemCategory = item.getAttribute('data-category');
                if (itemCategory === filter) {
                    item.classList.remove('hide');
                    return true;
                } else {
                    item.classList.add('hide');
                    return false;
                }
            });
            
            // 隱藏所有複製體
            allProjectItems.forEach(item => {
                if (item.hasAttribute('data-is-clone')) {
                    item.classList.add('hide');
                }
            });
        }
        
        if (visibleItems.length > 0) {
            let targetIndex = 0;
            if (filter === 'all') {
                const safeCloneCount = Math.min(cloneCount, originalProjectCount);
                targetIndex = safeCloneCount;
            } else {
                targetIndex = 0; 
            }

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
                if (link.hostname === window.location.hostname && !link.href.startsWith('mailto:') && !link.target) {
                    event.preventDefault(); 
                    handlePageTransition(link.href);
                }
            });
        });
    }
});

