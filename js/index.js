document.addEventListener('DOMContentLoaded', () => {
    const projectListElement = document.getElementById('projectList');
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewImageElement = document.getElementById('previewImage');
    const categoryNavElement = document.getElementById('categoryNav'); // (Request 3) 獲取篩選器導覽列

    // 儲存預設的資訊
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const defaultImageSrc = previewImageElement.src;

    let allProjectItems = []; // (Request 3) 用於儲存所有專案 DOM 元素

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
                // (Request 1 & 3) 將分類儲存在 data-* 屬性中
                listItem.setAttribute('data-category', project.category);
                
                // 將所有需要的作品資料儲存在 data-* 屬性中
                listItem.setAttribute('data-title', project.title);
                listItem.setAttribute('data-bio', project.bio);
                listItem.setAttribute('data-cover-image', project.coverImage);
                
                // (Request 1) 更新 innerHTML，加入分類標籤
                listItem.innerHTML = `
                    <span class="project-category">${project.category}</span>
                    <a href="project.html?id=${project.id}">${project.title}</a>
                `;
                
                projectListElement.appendChild(listItem);
            });

            // (Request 3) 抓取所有剛生成的專案 DOM 元素
            allProjectItems = document.querySelectorAll('#projectList .project-item');
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectListElement.innerHTML = '<li>Error loading projects.</li>';
        });

    // 使用事件委派處理滑鼠事件
    projectListElement.addEventListener('mouseover', (event) => {
        // 尋找 'A' 標籤或其父層 '.project-item'
        const projectItem = event.target.closest('.project-item');
        if (projectItem) {
            const newTitle = projectItem.getAttribute('data-title');
            const newBio = projectItem.getAttribute('data-bio');
            const newImageSrc = projectItem.getAttribute('data-cover-image');
            
            // 更新左側欄位的內容
            previewTitleElement.textContent = newTitle;
            previewBioElement.textContent = newBio;
            if (newImageSrc) {
                previewImageElement.src = newImageSrc;
            }
        }
    });

    projectListElement.addEventListener('mouseout', (event) => {
        // 確保滑鼠是真正移出列表區域，而不是在子元素間移動
        if (!projectListElement.contains(event.relatedTarget)) {
            previewTitleElement.textContent = defaultTitle;
            previewBioElement.textContent = defaultBio;
            previewImageElement.src = defaultImageSrc;
        }
    });

    // (Request 3) 新增篩選器點擊事件
    categoryNavElement.addEventListener('click', (event) => {
        // 檢查點擊的是否為 <a> 標籤
        if (event.target.tagName === 'A') {
            event.preventDefault(); // 防止頁面跳轉

            const filterValue = event.target.getAttribute('data-filter');

            // 1. 更新篩選器連結的 .active 狀態
            // 移除所有連結的 .active class
            categoryNavElement.querySelectorAll('a').forEach(a => {
                a.classList.remove('active');
            });
            // 為被點擊的連結加上 .active class
            event.target.classList.add('active');

            // 2. 過濾專案列表
            allProjectItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                // 檢查是否顯示
                if (filterValue === 'all' || itemCategory === filterValue) {
                    item.classList.remove('hide');
                } else {
                    item.classList.add('hide');
                }
            });
        }
    });
});
