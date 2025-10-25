document.addEventListener('DOMContentLoaded', () => {
    // --- (Request 3) 獲取左側欄位需要控制的元素 ---
    const previewTitleElement = document.getElementById('previewTitle');
    const previewImageElement = document.getElementById('previewImage');
    // 標籤
    const previewLabelNumber = document.getElementById('previewLabelNumber');
    const previewLabelInfo = document.getElementById('previewLabelInfo');
    // 區塊 (用於隱藏)
    const previewBlockBio = document.getElementById('previewBlockBio');
    // 內容
    const previewBioElement = document.getElementById('previewBio');
    
    // 獲取列表與篩選器
    const projectListElement = document.getElementById('projectList');
    const categoryNavElement = document.getElementById('categoryNav');

    // --- (Request 3) 儲存預設的資訊 ---
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const defaultImageSrc = previewImageElement.src;
    const defaultLabelNumber = previewLabelNumber.textContent;
    const defaultLabelInfo = previewLabelInfo.textContent;

    let allProjectItems = []; // 用於儲存所有專案 DOM 元素

    // --- (Request 3) MOD: 重構為可重複使用的函式 ---
    /**
     * 更新左側預覽區塊的內容
     * @param {Element | null} item - 要預覽的 .project-item 元素，或 null 以恢復預設
     */
    function updatePreview(item) {
        if (item) {
            // --- 情況 1: 預覽指定項目 ---
            // 獲取 data-* 屬性
            const newTitle = item.getAttribute('data-title');
            const newBio = item.getAttribute('data-bio');
            const newImageSrc = item.getAttribute('data-cover-image');
            const newCategory = item.getAttribute('data-category');
            
            // 更新內容
            previewTitleElement.textContent = newTitle;
            previewBioElement.textContent = newBio; // 雖然區塊隱藏，但仍更新
            if (newImageSrc) {
                previewImageElement.src = newImageSrc;
            }

            // (Request 3.2) 更新標籤
            previewLabelNumber.textContent = newCategory.toUpperCase(); // NO. -> CATEGORY
            previewLabelInfo.textContent = 'DOCS'; // INFO -> DOCS
            previewBlockBio.style.display = 'none'; // 隱藏 BIO 區塊
        } else {
            // --- 情況 2: 恢復預設 (Sywan) ---
            // (Request 3.1) 恢復預設內容
            previewTitleElement.textContent = defaultTitle;
            previewBioElement.textContent = defaultBio;
            previewImageElement.src = defaultImageSrc;

            // (Request 3.1) 恢復預設標籤
            previewLabelNumber.textContent = defaultLabelNumber;
            previewLabelInfo.textContent = defaultLabelInfo;
            previewBlockBio.style.display = 'flex'; // 恢復 BIO 區塊 (它是 flex 佈局)
        }
    }


    // 從 JSON 檔案獲取專案資料並生成列表
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
                
                // 將所有需要的作品資料儲存在 data-* 屬性中
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

            allProjectItems = document.querySelectorAll('#projectList .project-item');

            // --- (Request 3) ADD: 預設觸發第一個項目的 hover ---
            if (allProjectItems.length > 0) {
                updatePreview(allProjectItems[0]);
            }
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectListElement.innerHTML = '<li>Error loading projects.</li>';
        });

    // --- (Request 3) MOD: 更新滑鼠 HOVER 事件 ---
    projectListElement.addEventListener('mouseover', (event) => {
        const projectItem = event.target.closest('.project-item');
        if (projectItem) {
            updatePreview(projectItem); // 使用重構後的函式
        }
    });

    // --- (Request 3) MOD: 更新滑鼠 OUT 事件 ---
    projectListElement.addEventListener('mouseout', (event) => {
        if (!projectListElement.contains(event.relatedTarget)) {
            updatePreview(null); // 使用重構後的函式
        }
    });

    // 篩選器點擊事件
    categoryNavElement.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            event.preventDefault(); 

            const filterValue = event.target.getAttribute('data-filter');

            // 1. 更新篩選器連結的 .active 狀態
            categoryNavElement.querySelectorAll('a').forEach(a => {
                a.classList.remove('active');
            });
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
        }
    });
});

