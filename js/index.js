document.addEventListener('DOMContentLoaded', () => {
    // --- 獲取左側欄位需要控制的元素 ---
    const previewTitleElement = document.getElementById('previewTitle');
    const previewImageElement = document.getElementById('previewImage');
    const previewLabelNumber = document.getElementById('previewLabelNumber');
    const previewLabelInfo = document.getElementById('previewLabelInfo');
    const previewBlockBio = document.getElementById('previewBlockBio');
    const previewBioElement = document.getElementById('previewBio');
    
    // --- 獲取列表與篩選器 ---
    const centerColumnElement = document.querySelector('.center-column');
    const projectListElement = document.getElementById('projectList');
    const categoryNavElement = document.getElementById('categoryNav');

    // --- 儲存預設的資訊 ---
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const defaultImageSrc = previewImageElement.src;
    const defaultLabelNumber = previewLabelNumber.textContent;
    const defaultLabelInfo = previewLabelInfo.textContent;

    // --- 狀態變數 ---
    let allProjectItems = []; // 儲存所有專案 DOM 元素
    let currentIndex = -1; // 目前選中的項目索引
    let isWheeling = false; // 用於滾輪節流 (throttle)
    let wheelTimeout;

    // --- 核心函式 1: 更新左側預覽區塊 ---
    /**
     * 更新左側預覽區塊的內容
     * @param {Element | null} item - 要預覽的 .project-item 元素，或 null 以恢復預設
     */
    function updatePreview(item) {
        if (item && !item.classList.contains('hide')) {
            // --- 情況 1: 預覽指定項目 ---
            const newTitle = item.getAttribute('data-title');
            const newBio = item.getAttribute('data-bio');
            const newImageSrc = item.getAttribute('data-cover-image');
            const newCategory = item.getAttribute('data-category');
            
            previewTitleElement.textContent = newTitle;
            previewBioElement.textContent = newBio;
            if (newImageSrc) {
                previewImageElement.src = newImageSrc;
            }
            previewLabelNumber.textContent = newCategory.toUpperCase();
            previewLabelInfo.textContent = 'DOCS';
            previewBlockBio.style.display = 'none';
        } else {
            // --- 情況 2: 恢復預設 (Sywan) ---
            previewTitleElement.textContent = defaultTitle;
            previewBioElement.textContent = defaultBio;
            previewImageElement.src = defaultImageSrc;
            previewLabelNumber.textContent = defaultLabelNumber;
            previewLabelInfo.textContent = defaultLabelInfo;
            previewBlockBio.style.display = 'flex';
        }
    }

    // --- 核心函式 2: 設定當前啟用的項目 ---
    /**
     * 設定並滾動到指定的項目
     * @param {number} index - 要啟用的項目在 allProjectItems 中的索引
     * @param {boolean} [smooth=true] - 是否使用平滑滾動
     */
    function setActiveItem(index, smooth = true) {
        if (index < 0 || index >= allProjectItems.length) {
            // 如果索引無效 (例如篩選後無項目)，則恢復預設
            updatePreview(null);
            currentIndex = -1;
            return;
        }

        const newItem = allProjectItems[index];

        // 1. 更新 currentIndex
        currentIndex = index;

        // 2. 更新 .is-active class
        allProjectItems.forEach(item => item.classList.remove('is-active'));
        newItem.classList.add('is-active');

        // 3. 滾動到中央
        newItem.scrollIntoView({ 
            behavior: smooth ? 'smooth' : 'auto', 
            block: 'center' 
        });

        // 4. 更新左側預覽
        updatePreview(newItem);
    }

    // --- 核心函式 3: 尋找下一個可見項目 ---
    /**
     * 根據滾動方向尋找下一個可見的項目索引
     * @param {number} direction - 滾動方向 (1: 向下, -1: 向上)
     * @returns {number} - 下一個可見項目的索引，如果找不到則返回 -1
     */
    function findNextVisibleIndex(direction) {
        let nextIndex = currentIndex + direction;

        // 循環遍歷查找
        while (nextIndex >= 0 && nextIndex < allProjectItems.length) {
            if (!allProjectItems[nextIndex].classList.contains('hide')) {
                return nextIndex; // 找到了
            }
            nextIndex += direction;
        }
        return -1; // 到底部或頂部了
    }

    // --- 核心函式 4: 滾輪事件處理 (含節流) ---
    function handleWheelScroll(event) {
        event.preventDefault(); // 阻止頁面預設滾動

        if (isWheeling) return; // 節流
        isWheeling = true;

        // 150 毫秒後解除鎖定
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            isWheeling = false;
        }, 150); 

        const direction = event.deltaY > 0 ? 1 : -1;
        const nextIndex = findNextVisibleIndex(direction);

        if (nextIndex !== -1) {
            setActiveItem(nextIndex, true);
        }
    }

    // --- 事件綁定 1: 載入 JSON 資料 ---
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(projects => {
            projectListElement.innerHTML = ''; // 清空現有列表
            projects.forEach(project => {
                const listItem = document.createElement('li');
                listItem.className = 'project-item';
                listItem.setAttribute('data-category', project.category);
                listItem.setAttribute('data-title', project.title);
                listItem.setAttribute('data-bio', project.bio);
                listItem.setAttribute('data-cover-image', project.coverImage);
                
                listItem.innerHTML = `
                    <span class="project-category">${project.category}</span>
                    <a href="project.html?id=${project.id}">${project.title}</a>
                `;
                projectListElement.appendChild(listItem);
            });

            allProjectItems = Array.from(document.querySelectorAll('#projectList .project-item'));

            // 預設啟用第一個項目
            if (allProjectItems.length > 0) {
                setActiveItem(0, false); // 立即跳轉，不使用平滑滾動
            }
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectListElement.innerHTML = '<li>Error loading projects.</li>';
        });

    // --- 事件綁定 2: 滾輪事件 ---
    centerColumnElement.addEventListener('wheel', handleWheelScroll, { passive: false });

    // --- 事件綁定 3: 篩選器點擊事件 ---
    categoryNavElement.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            event.preventDefault();
            const filterValue = event.target.getAttribute('data-filter');

            // 1. 更新篩選器 .active 狀態
            categoryNavElement.querySelectorAll('a').forEach(a => a.classList.remove('active'));
            event.target.classList.add('active');

            // 2. 過濾專案列表
            allProjectItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                if (filterValue === 'all' || itemCategory === filterValue) {
                    item.classList.remove('hide');
                } else {
                    item.classList.add('hide');
                }
            });

            // 3. 自動跳轉到篩選後的第一個項目
            const firstVisibleIndex = allProjectItems.findIndex(item => !item.classList.contains('hide'));
            setActiveItem(firstVisibleIndex, true);
        }
    });

    // --- 事件綁定 4: 專案點擊事件 ---
    projectListElement.addEventListener('click', (event) => {
        const clickedItem = event.target.closest('.project-item');
        if (clickedItem && !clickedItem.classList.contains('hide')) {
            const index = allProjectItems.indexOf(clickedItem);
            if (index !== -1 && index !== currentIndex) {
                setActiveItem(index, true);
            }
        }
    });
});

