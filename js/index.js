document.addEventListener('DOMContentLoaded', () => {
    // 獲取 DOM 元素
    const projectListElement = document.getElementById('projectList');
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewImageElement = document.getElementById('previewImage');
    const categoryNavElement = document.getElementById('categoryNav');

    // (Request 3) 獲取 v2.1 中新增的 ID
    const previewLabelNo = document.getElementById('previewLabelNo');
    const previewLabelCategory = document.getElementById('previewLabelCategory');
    const previewLabelInfo = document.getElementById('previewLabelInfo');
    const previewLabelDocs = document.getElementById('previewLabelDocs');
    const previewBlockBio = document.getElementById('previewBlockBio');

    // 儲存預設的資訊
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const defaultImageSrc = previewImageElement.src;
    // (Request 3.2) 獲取預設 INFO (確保 previewInfo 存在)
    const previewInfoElement = document.getElementById('previewInfo');
    const defaultInfo = previewInfoElement ? previewInfoElement.textContent : '';


    let allProjectItems = []; // 用於儲存所有專案 DOM 元素
    let currentActiveIndex = 2; // (Request 3) 預設啟用索引 (第三個)
    let isScrolling = false; // 滾動節流閥
    let visibleItems = []; // 用於儲存篩選後可見的項目

    // ADD: (Request v3.8) 判斷是否為行動裝置
    const isMobile = window.innerWidth <= 768;

    // 1. 獲取專案資料並生成列表
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
            
            // (Request 3) 預設啟用第三個 (索引 2)
            // 檢查確保列表不是空的
            if (visibleItems.length > 0) {
                 // 確保索引 2 在範圍內，否則啟用第 0 個
                currentActiveIndex = (currentActiveIndex < visibleItems.length) ? currentActiveIndex : 0;
                setActiveItem(currentActiveIndex, false); // false = 不要滾動
            }

            // (Request 4) 監聽滾輪事件 (監聽 .center-column)
            const centerColumn = document.querySelector('.center-column');
            
            // MOD: (Request v3.8) 僅在非行動裝置上綁定 wheel 事件
            // 因為 wheel event + preventDefault() 會鎖死手機的觸控捲動
            // 手機版將改為只用 click 事件 (handleItemClick) 來互動
            if (centerColumn && !isMobile) {
                centerColumn.addEventListener('wheel', handleWheelScroll, { passive: false });
            }

            // (Request 4) 監聽點擊事件 (在手機和桌機上都會啟用)
            projectListElement.addEventListener('click', handleItemClick);

            // (Request 3) 監聽篩選器點擊
            if (categoryNavElement) {
                categoryNavElement.addEventListener('click', handleFilterClick);
            }
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectListElement.innerHTML = '<li>Error loading projects.</li>';
        });

    // (Request 3) 設置啟用項目
    function setActiveItem(index, smoothScroll = true) {
        // 邊界檢查
        if (index < 0 || index >= visibleItems.length) return;

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

        // 更新左側預覽
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

        // (Request 3.2) 更新左側欄位標籤
        if (previewLabelNo) { // (Request 3.2) 增加 null 檢查
            // 更新標籤
            previewLabelNo.style.display = 'none';
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = newCategory;

            previewLabelInfo.style.display = 'none';
            previewLabelDocs.style.display = 'inline-block';

            // 隱藏 BIO
            previewBlockBio.classList.add('hide-section');
        }
    }
    
    // (Request 3.2) 恢復預設（當沒有項目時，例如篩選結果為空）
    function resetPreview() {
        if (previewTitleElement) previewTitleElement.textContent = defaultTitle;
        if (previewBioElement) previewBioElement.textContent = defaultBio;
        if (previewImageElement) previewImageElement.src = defaultImageSrc;
        if (previewInfoElement) previewInfoElement.textContent = defaultInfo; // (Request 3.2)

        // (Request 3.2) 恢復預設標籤
        if (previewLabelNo) { // (Request 3.2) 增加 null 檢查
            previewLabelNo.style.display = 'inline-block';
            previewLabelCategory.style.display = 'none';

            previewLabelInfo.style.display = 'inline-block';
            previewLabelDocs.style.display = 'none';

            // 顯示 BIO
            if (previewBlockBio) previewBlockBio.classList.remove('hide-section');
        }
    }

    // (Request 4) 滾輪事件處理 (僅桌機)
    function handleWheelScroll(event) {
        event.preventDefault(); // 阻止頁面滾動

        if (isScrolling) return; // 節流
        isScrolling = true;

        setTimeout(() => { isScrolling = false; }, 150); // 節流時間

        const direction = event.deltaY > 0 ? 1 : -1; // 1 = 向下, -1 = 向上
        let newIndex = currentActiveIndex + direction;

        // 確保新索引在 visibleItems 範圍內
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= visibleItems.length) newIndex = visibleItems.length - 1;

        if (newIndex !== currentActiveIndex) {
            setActiveItem(newIndex, true);
        }
    }

    // (Request 4) 點擊事件處理 (桌機與手機)
    function handleItemClick(event) {
        const clickedItem = event.target.closest('.project-item');
        if (clickedItem) {
            const newIndex = visibleItems.indexOf(clickedItem);
            if (newIndex > -1 && newIndex !== currentActiveIndex) {
                setActiveItem(newIndex, true);
            }
        }
    }

    // (Request 3) 篩選器點擊事件處理
    function handleFilterClick(event) {
        event.preventDefault();
        const targetLink = event.target.closest('a[data-filter]');
        
        if (!targetLink) return;

        const filter = targetLink.getAttribute('data-filter');

        // 更新篩選器 .active 狀態
        categoryNavElement.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        targetLink.classList.add('active');

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
            setActiveItem(0, false); // 滾動到篩選後的第一個項目
        } else {
            // 如果篩選後沒有項目
            resetPreview();
            allProjectItems.forEach(item => item.classList.remove('is-active'));
        }
    }
});
