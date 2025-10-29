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
    // const previewLabelInfo = document.getElementById('previewLabelInfo'); // (v3.11) 修正 ID
    // const previewLabelDocs = document.getElementById('previewLabelDocs'); // (v3.11) 修正 ID
    const previewBlockBio = document.getElementById('previewBlockBio');
    
    // (v3.11) 修正 ID 抓取
    const previewLabelInfo_Default = document.getElementById('previewLabelInfo_Default');
    const previewLabelDocs_Project = document.getElementById('previewLabelDocs_Project');


    // 儲存預設的資訊
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const defaultImageSrc = previewImageElement.src;
    // (Request 3.2) 獲取預設 INFO (確保 previewInfo 存在)
    const previewInfoElement = document.getElementById('previewInfo');
    const defaultInfo = previewInfoElement ? previewInfoElement.textContent : '';

    // (FEAT_v4.13) 獲取轉場遮罩
    const pageTransitionOverlay = document.getElementById('pageTransitionOverlay');

    // (FEAT_v4.19) 互動音效
    let audioSynth = null;
    let audioStarted = false;
    // 檢查 Tone 是否成功載入
    if (typeof Tone !== 'undefined') {
        try {
            audioSynth = new Tone.Synth().toDestination();
        } catch (e) {
            console.error("Could not initialize Tone.js:", e);
        }
    } else {
        console.warn("Tone.js not loaded.");
    }

    /**
     * (FEAT_v4.19) 啟動音訊上下文
     * 瀏覽器要求音訊必須由使用者互動觸發
     */
    function startAudioContext() {
        if (!audioStarted && Tone && Tone.context && Tone.context.state !== 'running' && Tone.start) {
            Tone.start();
            audioStarted = true;
        }
    }


    let allProjectItems = []; // 用於儲存所有專案 DOM 元素
    let currentActiveIndex = 2; // (Request 3) 預設啟用索引 (第三個)
    let isScrolling = false; // 滾動節流閥
    let visibleItems = []; // 用於儲存篩選後可見的項目

    // (Request v3.10) 偵測是否為手機
    const isMobile = window.innerWidth <= 768;

    // (Request v3.10) 觸控相關變數
    let touchStartY = 0;
    let touchEndY = 0;
    const touchThreshold = 50; // 觸控滑動的最小距離 (px)
    
    // MOD: (FIX_v4.2) 定義不同裝置的節流時間
    const DESKTOP_WHEEL_THROTTLE = 300; // 桌面滾輪節流 (ms) - 較長以處理高頻事件
    const MOBILE_TOUCH_THROTTLE = 150;  // 手機觸控節流 (ms) - 較短以保持靈敏

    // (Request v3.15) 動態設定手機版的 Padding
    function setDynamicPadding() {
        // 僅在手機版執行
        if (!isMobile) return;

        // (Request v3.15) 修正選擇器
        const centerColumn = document.querySelector('.portfolio-container .center-column');
        
        // (Request v3.15) 檢查 allProjectItems 是否已填入
        if (centerColumn && allProjectItems.length > 0) {
            const firstItem = allProjectItems[0];
            const containerHeight = centerColumn.clientHeight;
            const itemHeight = firstItem.clientHeight;
            
            // 計算使項目能置中於容器的 padding
            const padding = (containerHeight / 2) - (itemHeight / 2);
            
            // 確保 padding 不為負數
            const finalPadding = Math.max(0, padding); 
            
            projectListElement.style.paddingTop = `${finalPadding}px`;
            projectListElement.style.paddingBottom = `${finalPadding}px`;
        }
    }


    // 1. 獲取專案資料並生成列表
    // MOD: (FIX_v4.6) 根據使用者的路徑確認，將 fetch 路徑還原為 './data/projects.json'
    // 理由：v4.5 的根路徑 'projects.json' 是錯誤的猜測。此路徑符合文件規範和使用者實際結構。
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(projects => {
            projectListElement.innerHTML = ''; // 清空現有列表
            projects.forEach((project, index) => { // (Request 3) 加入 index
                const listItem = document.createElement('li');
                listItem.className = 'project-item';
                listItem.setAttribute('data-index', index); // (Request 3) 儲存索引
                
                // (Request 1 & 3) 將分類儲存在 data-* 屬性中
                listItem.setAttribute('data-category', project.category);
                
                // 將所有需要的作品資料儲存在 data-* 屬性中
                listItem.setAttribute('data-title', project.title);
                listItem.setAttribute('data-bio', project.bio);
                listItem.setAttribute('data-cover-image', project.coverImage);
                
                // FIX: (Request 3.2) 補上缺少的 data-info 屬性
                listItem.setAttribute('data-info', project.info); 
                
                // (Request 1) 更新 innerHTML，加入分類標籤
                listItem.innerHTML = `
                    <span class="project-category">${project.category}</span>
                    <a href="project.html?id=${project.id}">${project.title}</a>
                `;
                
                projectListElement.appendChild(listItem);
            });

            // (Request 3) 抓取所有剛生成的專案 DOM 元素
            allProjectItems = Array.from(document.querySelectorAll('#projectList .project-item'));
            visibleItems = [...allProjectItems]; // 預設全部可見
            
            // (Request v3.15) 列表生成後，動態設定 Padding
            setDynamicPadding();
            
            // (Request 3) 預設啟用第三個 (索引 2)
            // 檢查確保列表不是空的
            if (visibleItems.length > 0) {
                 // 確保索引 2 在範圍內，否則啟用第 0 個
                currentActiveIndex = (currentActiveIndex < visibleItems.length) ? currentActiveIndex : 0;
                setActiveItem(currentActiveIndex, false); // false = 不要滾動
            }

            // (Request 4) 監聽滾輪事件 (監聽 .center-column)
            // (Request v3.15) 修正選擇器
            const centerColumn = document.querySelector('.portfolio-container .center-column');
            
            // (Request v3.10) 只有在非手機裝置上才綁定 wheel 事件
            if (centerColumn && !isMobile) {
                centerColumn.addEventListener('wheel', handleWheelScroll, { passive: false });
            }

            // (Request v3.10) 只有在手機裝置上才綁定 touch 事件
            if (centerColumn && isMobile) {
                centerColumn.addEventListener('touchstart', handleTouchStart, { passive: false });
                centerColumn.addEventListener('touchmove', handleTouchMove, { passive: false });
                centerColumn.addEventListener('touchend', handleTouchEnd, { passive: false });
            }

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
            
            // (Request v3.15) 監聽視窗大小改變，重新計算 Padding
            window.addEventListener('resize', setDynamicPadding);
            
            // (FEAT_v4.13) 綁定轉場事件到 "Me" 連結
            bindTransitionLinks();
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectListElement.innerHTML = '<li>Error loading projects.</li>';
        });

    // (Request 3) 設置啟用項目
    function setActiveItem(index, smoothScroll = true) {
        // (Request v3.11) 邊界檢查 (無限循環)
        if (visibleItems.length === 0) return; // (v3.11) 增加保護
        
        if (index < 0) {
            index = visibleItems.length - 1; // 從頂部循環到底部
        }
        if (index >= visibleItems.length) {
            index = 0; // 從底部循環到頂部
        }

        currentActiveIndex = index;

        // 移除所有 .is-active
        allProjectItems.forEach(item => {
            item.classList.remove('is-active');
        });

        // 獲取目標項目
        const targetItem = visibleItems[index];
        if (!targetItem) return; // 如果目標不存在（例如篩選後列表為空）

        // 啟用目標項目
        targetItem.classList.add('is-active');

        // (Request 4) 滾動到啟用項目
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

        // 更新左側預覽 (如果左側欄存在的話)
        const newTitle = targetItem.getAttribute('data-title');
        const newBio = targetItem.getAttribute('data-bio');
        const newImageSrc = targetItem.getAttribute('data-cover-image');
        const newCategory = targetItem.getAttribute('data-category'); // (Request 3.2)
        const newInfo = targetItem.getAttribute('data-info'); // (Request 3.2)

        if (previewTitleElement) previewTitleElement.textContent = newTitle;
        if (previewBioElement) previewBioElement.textContent = newBio;
        if (previewImageElement && newImageSrc) previewImageElement.src = newImageSrc;
        // (Request 3.2) 更新 INFO 欄位 (確保 previewInfoElement 存在)
        if (previewInfoElement) previewInfoElement.innerHTML = newInfo; 

        // (Task 3) 更新手機版懸浮視窗
        if (isMobile && mobilePreviewPopup && mobilePreviewImage) {
            if (newImageSrc) {
                mobilePreviewImage.src = newImageSrc;

                // --- (FEAT_v4.11) 隨機彈出視窗 ---
                // MOD: (FEAT_v4.12) 擴大垂直隨機範圍，加入上方區域
                // 1. 隨機垂直位置 (10% 到 80% 之間)
                // Math.random() * (max - min + 1) + min
                const randTop = Math.floor(Math.random() * 71) + 10; // 10% to 80%
                
                // 2. 隨機旋轉和縮放 (增加動態感)
                // MOD: (v4.19) 移除旋轉
                // const randRotation = Math.floor(Math.random() * 20) - 10; // -10deg to +10deg
                
                // MOD: (v4.19) 調整縮放範圍為 0.8 至 1.2 (20% 偏差)
                const randScale = Math.random() * 0.4 + 0.8; // 0.8 to 1.2 scale
                
                // 3. 應用隨機樣式 (transform 會在 .is-visible 添加時觸發 CSS 過渡)
                mobilePreviewPopup.style.top = `${randTop}vh`;
                
                // MOD: (v4.19) 移除旋轉
                mobilePreviewPopup.style.transform = `scale(${randScale})`;

                // 4. 隨機水平位置 (左或右側 "Gutter")
                // 透過 coin-flip 決定在左側 (true) 還是右側 (false)
                if (Math.random() > 0.5) {
                    // 在左側 (5vw 到 15vw 之間)
                    mobilePreviewPopup.style.left = `${Math.floor(Math.random() * 11) + 5}vw`;
                    mobilePreviewPopup.style.right = 'auto'; // 清除另一側
                } else {
                    // 在右側 (5vw 到 15vw 之間)
                    mobilePreviewPopup.style.right = `${Math.floor(Math.random() * 11) + 5}vw`;
                    mobilePreviewPopup.style.left = 'auto'; // 清除另一側
                }
                // --- End of (FEAT_v4.11) ---

                mobilePreviewPopup.classList.add('is-visible');
            } else {
                mobilePreviewPopup.classList.remove('is-visible');
            }
        }

        // (Request 3.2) 更新左側欄位標籤
        // (Request v3.11) 修正 ID 抓取
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            // 更新標籤
            previewLabelNo.style.display = 'none';
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = newCategory;

            previewLabelInfo_Default.style.display = 'none';
            previewLabelDocs_Project.style.display = 'inline-block';

            // 隱藏 BIO
            if (previewBlockBio) previewBlockBio.classList.add('hide-section');
        }
    }
    
    // (Request 3.2) 恢復預設（當沒有項目時，例如篩選結果為空）
    function resetPreview() {
        if (previewTitleElement) previewTitleElement.textContent = defaultTitle;
        if (previewBioElement) previewBioElement.textContent = defaultBio;
        if (previewImageElement) previewImageElement.src = defaultImageSrc;
        if (previewInfoElement) previewInfoElement.textContent = defaultInfo; // (Request 3.2)

        // (Task 3) 隱藏手機版懸浮視窗
        if (isMobile && mobilePreviewPopup) {
            mobilePreviewPopup.classList.remove('is-visible');
        }

        // (Request 3.2) 恢復預設標籤
        // (Request v3.11) 修正 ID 抓取
        if (previewLabelNo && previewLabelCategory && previewLabelInfo_Default && previewLabelDocs_Project && previewBlockBio) {
            previewLabelNo.style.display = 'inline-block';
            previewLabelCategory.style.display = 'none';

            previewLabelInfo_Default.style.display = 'inline-block';
            previewLabelDocs_Project.style.display = 'none';

            // 顯示 BIO
            if (previewBlockBio) previewBlockBio.classList.remove('hide-section');
        }
    }

    // (Request 4) 滾輪事件處理 (僅桌面)
    function handleWheelScroll(event) {
        // (FEAT_v4.19) 嘗試啟動音訊
        startAudioContext();
        
        event.preventDefault(); // 阻止頁面滾動

        if (isScrolling) return; // 節流
        isScrolling = true;

        // MOD: (FIX_v4.1) 延長節流時間，以處理高頻率滾輪事件 (例如 15" 筆電觸控板)
        // MOD: (FIX_v4.2) 使用桌面版節流時間
        setTimeout(() => { isScrolling = false; }, DESKTOP_WHEEL_THROTTLE); // 節流時間

        const direction = event.deltaY > 0 ? 1 : -1; // 1 = 向下, -1 = 向上
        let newIndex = currentActiveIndex + direction;

        // (Request v3.11) 無限循環邏輯
        if (newIndex < 0) {
            newIndex = visibleItems.length - 1;
        }
        if (newIndex >= visibleItems.length) {
            newIndex = 0;
        }

        if (newIndex !== currentActiveIndex) {
            // (FEAT_v4.19) 播放音效
            if (audioSynth) {
                audioSynth.triggerAttackRelease("G6", "50ms");
            }
            setActiveItem(newIndex, true);
        }
    }

    // (Request v3.10) 觸控事件處理 (僅手機)
    function handleTouchStart(event) {
        // (FEAT_v4.19) 嘗試啟動音訊
        startAudioContext();
        
        // (Task 3) 隱藏懸浮視窗
        if (isMobile && mobilePreviewPopup) {
            mobilePreviewPopup.classList.remove('is-visible');
        }
        
        // (Request v3.10) 阻止原生滾動 (例如下拉刷新或頁面平移)
        // event.preventDefault(); // (v3.15) 暫時移除，檢查是否為滾動的根本原因
        touchStartY = event.touches[0].clientY;
        touchEndY = event.touches[0].clientY; // (v3.10) 重置
    }

    function handleTouchMove(event) {
        // (Request v3.10) 阻止原生滾動
        event.preventDefault();
        touchEndY = event.touches[0].clientY;
    }


// [ 2025-10-24 ]
// 說明：此處為 v4.2 修改點。
// 理由：原先 (v4.1) 桌面和手機版共用 300ms 節流，導致手機版觸控延遲感過重。
// 變更：將手機版 (handleTouchEnd) 的節流時間改為使用 MOBILE_TOUCH_THROTTLE (150ms)，
//      以大幅提升觸控滑動的靈敏度 (responsiveness)，使其更接近 iOS 原生體驗。
//      桌面版 (handleWheelScroll) 則維持 300ms (DESKTOP_WHEEL_THROTTLE) 以確保滾動穩定。

    function handleTouchEnd(event) {
        // (Task 2 Fix) 移除此處的 event.preventDefault()
        // event.preventDefault(); 
        
        if (isScrolling) return; // (v3.10) 如果還在滾動中，則不處理

        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaY) > touchThreshold) {
            // (Task 2 Fix) 判定為「滑動」手勢，此時才阻止預設行為
            event.preventDefault();

            // (Request v3.10) 視為滑動
            isScrolling = true;
            // MOD: (FIX_v4.2) 使用手機版節流時間，以增加靈敏度
            setTimeout(() => { isScrolling = false; }, MOBILE_TOUCH_THROTTLE); // 滾動動畫節流 (原為 300ms)

            const direction = deltaY > 0 ? -1 : 1; // 1 = 向下, -1 = 向上 (觸控方向相反)
            let newIndex = currentActiveIndex + direction;

            // (Request v3.11) 無限循環邏輯
            if (newIndex < 0) {
                newIndex = visibleItems.length - 1;
            }
            if (newIndex >= visibleItems.length) {
                newIndex = 0;
            }

            if (newIndex !== currentActiveIndex) {
                // (FEAT_v4.19) 播放音效
                if (audioSynth) {
                    audioSynth.triggerAttackRelease("G6", "50ms");
                }
                setActiveItem(newIndex, true);
            }
        }
        // (Task 2 Fix) 如果滑動距離不足 (視為點擊)，
        // 則不執行 preventDefault()，讓 'click' 事件可以觸發。
    }


    // (Request 4) 點擊事件處理
    function handleItemClick(event) {
        // (FEAT_v4.19) 嘗試啟動音訊
        startAudioContext();
        
        // (Request v3.10) 如果正在滾動，則忽略點擊
        if (isScrolling) {
            event.preventDefault();
            return;
        }

        const clickedItem = event.target.closest('.project-item');
        if (clickedItem) {
            // (Task 3) 點擊時，隱藏懸浮視窗 (因為即將滾動)
            if (isMobile && mobilePreviewPopup) {
                mobilePreviewPopup.classList.remove('is-visible');
            }

            // (FEAT_v4.13) 檢查這是否為一個導航點擊
            const link = clickedItem.querySelector('a');
            if (link) {
                // 這是導航，觸發轉場
                event.preventDefault(); // 阻止預設的點擊行為
                handlePageTransition(link.href);
                return; // 停止執行後續的 setActiveItem
            }

            // 如果不是導航 (例如點擊在 <li> 的 padding 處)，則執行滾動
            const newIndex = visibleItems.indexOf(clickedItem);
            if (newIndex > -1 && newIndex !== currentActiveIndex) {
                // (FEAT_v4.19) 播放音效
                if (audioSynth) {
                    audioSynth.triggerAttackRelease("G6", "50ms");
                }
                setActiveItem(newIndex, true);
            }
        }
    }

    // (Request 3) 篩選器點擊事件處理
    function handleFilterClick(event) {
        const targetLink = event.target.closest('a[data-filter]');
        
        if (!targetLink) return;
        event.preventDefault(); // (v3.16) 只有在確定是篩選器點擊時才阻止預設
        
        // (FEAT_v4.19) 嘗試啟動音訊
        startAudioContext();

        const filter = targetLink.getAttribute('data-filter');

        // (Request v3.16) 更新桌面版篩選器 .active 狀態
        if (categoryNavElement) { 
            categoryNavElement.querySelectorAll('a').forEach(a => a.classList.remove('active'));
            // (v3.16) 確保 targetLink 在 categoryNavElement 內
            if (categoryNavElement.contains(targetLink)) {
                targetLink.classList.add('active');
            }
        }
        // (Request v3.16) 更新手機版篩選器 .active 狀態
        if (mobileFooterElement) { 
            mobileFooterElement.querySelectorAll('a[data-filter]').forEach(a => a.classList.remove('active'));
             // (v3.16) 確保 targetLink 在 mobileFooterElement 內
            if (mobileFooterElement.contains(targetLink)) {
                targetLink.classList.add('active');
            }
        }

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
            // (FEAT_v4.19) 播放音效
            if (audioSynth) {
                audioSynth.triggerAttackRelease("G6", "50ms");
            }
            setActiveItem(0, false); // 滾動到篩選後的第一個項目
        } else {
            // 如果篩選後沒有項目
            resetPreview();
            allProjectItems.forEach(item => item.classList.remove('is-active'));
        }
    }

    // --- (FEAT_v4.13) 頁面轉場 ---
    
    // 轉場動畫的持續時間 (ms)，必須與 CSS 中的 transition-duration 一致
    const TRANSITION_DURATION = 400;

    /**
     * 處理頁面跳轉的函式
     * @param {string} destination - 目標 URL
     */
    function handlePageTransition(destination) {
        if (pageTransitionOverlay) {
            // 1. 啟用遮罩 (淡入)
            pageTransitionOverlay.classList.add('is-active');
            
            // 2. 等待遮罩動畫完成
            setTimeout(() => {
                // 3. 執行跳轉
                window.location.href = destination;
            }, TRANSITION_DURATION);
        } else {
            // 如果遮罩不存在，立即跳轉 (Fallback)
            window.location.href = destination;
        }
    }

    /**
     * 綁定所有需要轉場的 <a> 標籤
     */
    function bindTransitionLinks() {
        // (FEAT_v4.13) 根據 v4.13 HTML 檔案中新增的 ID 抓取
        const desktopLinks = document.querySelectorAll('#desktopContactLinks a');
        const mobileLinks = document.querySelectorAll('#mobileContactLinks a');
        
        const allLinks = [...desktopLinks, ...mobileLinks];

        allLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                // (FEAT_v4.19) 嘗試啟動音訊
                startAudioContext();
                
                // 僅處理本地跳轉 (而非 mailto: 或 target="_blank")
                if (link.hostname === window.location.hostname && !link.href.startsWith('mailto:') && !link.target) {
                    event.preventDefault(); // 阻止預設點擊
                    handlePageTransition(link.href);
                }
            });
        });
    }
});
