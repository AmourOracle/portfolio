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

    // --- (FIX_v4.25) 暫時停用 Tone.js 特效 ---
    /*
    let audioSynth = null;
    let audioStarted = false;
    if (typeof Tone !== 'undefined') {
        try {
            audioSynth = new Tone.Synth().toDestination();
        } catch (e) {
            console.error("Could not initialize Tone.js:", e);
        }
    } else {
        console.warn("Tone.js not loaded.");
    }

    function startAudioContext() {
        if (!audioStarted && Tone && Tone.context && Tone.context.state !== 'running' && Tone.start) {
            Tone.start();
            audioStarted = true;
        }
    }
    */
    // --- 結束 暫停特效 ---


    // --- (FIX_v4.23) 滾動與觸控變數 ---
    let allProjectItems = []; 
    let currentActiveIndex = 2; 
    let isScrolling = false; 
    let visibleItems = []; 
    
    // (FIX_v4.23) 將 centerColumn 移至頂層，以便 resize 函式存取
    const centerColumn = document.querySelector('.portfolio-container .center-column');

    // (Request v3.10) 觸控相關變數
    let touchStartY = 0;
    let touchEndY = 0;
    const touchThreshold = 50; 
    
    const DESKTOP_WHEEL_THROTTLE = 300; 
    const MOBILE_TOUCH_THROTTLE = 150;  

    // (Request v3.15) 動態設定手機版的 Padding
    function setDynamicPadding() {
        // (FIX_v4.23) 動態檢查 isMobile
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            // 如果是桌面版，確保 padding 被移除
            if (projectListElement) {
                projectListElement.style.paddingTop = '';
                projectListElement.style.paddingBottom = '';
            }
            return;
        }

        if (centerColumn && allProjectItems.length > 0) {
            const firstItem = allProjectItems[0];
            const containerHeight = centerColumn.clientHeight;
            // (FIX_v4.23) 確保 firstItem 存在且有高度
            const itemHeight = firstItem ? firstItem.clientHeight : 0;
            if (itemHeight === 0) return; // 如果項目高度為 0 (例如尚未渲染)，則跳過

            const padding = (containerHeight / 2) - (itemHeight / 2);
            const finalPadding = Math.max(0, padding); 
            
            projectListElement.style.paddingTop = `${finalPadding}px`;
            projectListElement.style.paddingBottom = `${finalPadding}px`;
        }
    }

    // --- (FIX_v4.23) 響應式滾動監聽器 ---
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
        
        // 3. (FIX_v4.23) 重新計算手機版的 Padding
        setDynamicPadding();
    }
    // --- End of (FIX_v4.23) ---


    // 1. 獲取專案資料並生成列表
    // --- (FIX_v4.25) 恢復 portfolioDevGuide.md 中指定的正確路徑 ---
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) {
                // (FIX_v4.24) 拋出更明確的錯誤
                throw new Error(`Network response was not ok (HTTP ${response.status})`);
            }
            return response.json();
        })
        .then(projects => {
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
            
            // (FIX_v4.23) 列表生成後，動態設定 Padding (針對手機版)
            setDynamicPadding();
            
            if (visibleItems.length > 0) {
                currentActiveIndex = (currentActiveIndex < visibleItems.length) ? currentActiveIndex : 0;
                setActiveItem(currentActiveIndex, false); 
            }

            // (FIX_v4.23) 綁定初始的滾動監聽器
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
            
            // (FIX_v4.23) 監聽視窗大小改變，重新綁定滾動並重設 Padding
            window.addEventListener('resize', () => {
                bindScrollListeners();
                setDynamicPadding(); // (v3.15)
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
        
        // (Request v3.11) 無限循環
        if (index < 0) {
            index = visibleItems.length - 1; 
        }
        if (index >= visibleItems.length) {
            index = 0; 
        }

        currentActiveIndex = index;

        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
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

        // (Task 3) 更新手機版懸浮視窗
        // (FIX_v4.23) 動態檢查 isMobile
        if (window.innerWidth <= 768 && mobilePreviewPopup && mobilePreviewImage) {
            if (newImageSrc) {
                mobilePreviewImage.src = newImageSrc;

                // --- (FIX_v4.25) 暫時停用隨機特效，改為固定位置 ---
                mobilePreviewPopup.style.top = `60vh`;
                mobilePreviewPopup.style.transform = `scale(1)`;
                mobilePreviewPopup.style.left = 'auto';
                mobilePreviewPopup.style.right = '5vw';
                // --- 結束 暫停特效 ---

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

        // (FIX_v4.23) 動態檢查 isMobile
        if (window.innerWidth <= 768 && mobilePreviewPopup) {
            mobilePreviewPopup.classList.remove('is-visible');
        }

        // (Request 3.2) 恢復預設標籤
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'inline-block';
            previewLabelCategory.style.display = 'none';

            previewLabelInfo_Default.style.display = 'inline-block';
            previewLabelDocs_Project.style.display = 'none';

            if (previewBlockBio) previewBlockBio.classList.remove('hide-section');
        }
    }

    // (Request 4) 滾輪事件處理 (僅桌面)
    function handleWheelScroll(event) {
        // startAudioContext(); // (FIX_v4.25) 暫停特效
        event.preventDefault(); 
        if (isScrolling) return; 
        isScrolling = true;

        setTimeout(() => { isScrolling = false; }, DESKTOP_WHEEL_THROTTLE); 

        const direction = event.deltaY > 0 ? 1 : -1; 
        let newIndex = currentActiveIndex + direction;

        // (Request v3.11) 無限循環邏輯
        if (newIndex < 0) {
            newIndex = visibleItems.length - 1;
        }
        if (newIndex >= visibleItems.length) {
            newIndex = 0;
        }

        if (newIndex !== currentActiveIndex) {
            /*
            if (audioSynth) { // (FIX_v4.25) 暫停特效
                audioSynth.triggerAttackRelease("G6", "50ms");
            }
            */
            setActiveItem(newIndex, true);
        }
    }

    // (Request v3.10) 觸控事件處理 (僅手機)
    function handleTouchStart(event) {
        // startAudioContext(); // (FIX_v4.25) 暫停特效
        
        // (FIX_v4.23) 動態檢查 isMobile
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
            event.preventDefault();

            isScrolling = true;
            setTimeout(() => { isScrolling = false; }, MOBILE_TOUCH_THROTTLE); 

            const direction = deltaY > 0 ? -1 : 1; 
            let newIndex = currentActiveIndex + direction;

            // (Request v3.11) 無限循環邏輯
            if (newIndex < 0) {
                newIndex = visibleItems.length - 1;
            }
            if (newIndex >= visibleItems.length) {
                newIndex = 0;
            }

            if (newIndex !== currentActiveIndex) {
                /*
                if (audioSynth) { // (FIX_v4.25) 暫停特效
                    audioSynth.triggerAttackRelease("G6", "50ms");
                }
                */
                setActiveItem(newIndex, true);
            }
        }
    }

    // --- (FIX_v4.23) 重構點擊事件處理 ---
    /**
     * 處理項目列表的點擊事件
     * 邏輯：
     * 1. 如果點擊的項目 *不是* 當前啟用的 -> 滾動到該項目 (選取)
     * 2. 如果點擊的項目 *是* 當前啟用的 -> 執行頁面轉場 (開啟)
     */
    function handleItemClick(event) {
        // startAudioContext(); // (FIX_v4.25) 暫停特效
        
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
            const link = clickedItem.querySelector('a');
            if (link) {
                event.preventDefault(); // 阻止 <a> 標籤的預設跳轉
                handlePageTransition(link.href);
            }
        } else {
            // 情況 1：項目未啟用 -> 滾動到該項目 (選取)
            event.preventDefault(); // 阻止 <a> 標籤的預設跳轉
            
            /*
            if (audioSynth) { // (FIX_v4.25) 暫停特效
                audioSynth.triggerAttackRelease("G6", "50ms");
            }
            */
            setActiveItem(newIndex, true);
        }
    }
    // --- End of (FIX_v4.23) ---

    // (Request 3) 篩選器點擊事件處理
    function handleFilterClick(event) {
        const targetLink = event.target.closest('a[data-filter]');
        
        if (!targetLink) return;
        event.preventDefault(); 
        
        // startAudioContext(); // (FIX_v4.25) 暫停特效

        const filter = targetLink.getAttribute('data-filter');

        // --- (FIX_v4.22) 修正篩選器 .active 狀態的同步邏輯 ---
        if (categoryNavElement) { 
            categoryNavElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        }
        if (mobileFooterElement) { 
            mobileFooterElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
        }
        const activeLinks = document.querySelectorAll(`a[data-filter="${filter}"]`);
        activeLinks.forEach(a => a.classList.add('active'));
        // --- End of Fix ---

        // 過濾 visibleItems
        visibleItems = allProjectItems.filter(item => {
            if (filter === 'all') {
                item.classList.remove('hide');
                return true;
            }
            const itemCategory = item.getAttribute('data-category');
            if (itemCategory === filter) {
                item.classList.remove('hide');
                return true;
            } else {
                item.classList.add('hide');
                return false;
            }
        });

        // 重置啟用項目
        if (visibleItems.length > 0) {
            /*
            if (audioSynth) { // (FIX_v4.25) 暫停特效
                audioSynth.triggerAttackRelease("G6", "50ms");
            }
            */
            setActiveItem(0, false); // 滾動到篩選後的第一個項目
        } else {
            // 如果篩選後沒有項目
            resetPreview();
            allProjectItems.forEach(item => item.classList.remove('is-active'));
        }
    }

    // --- (FEAT_v4.13) 頁面轉場 ---
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
        const desktopLinks = document.querySelectorAll('#desktopContactLinks a');
        const mobileLinks = document.querySelectorAll('#mobileContactLinks a');
        
        const allLinks = [...desktopLinks, ...mobileLinks];

        allLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                // startAudioContext(); // (FIX_v4.25) 暫停特效
                
                // 僅處理本地跳轉
                if (link.hostname === window.location.hostname && !link.href.startsWith('mailto:') && !link.target) {
                    event.preventDefault(); 
                    handlePageTransition(link.href);
                }
            });
        });
    }
});

