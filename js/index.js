document.addEventListener('DOMContentLoaded', () => {
    const projectListElement = document.getElementById('projectList');
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewImageElement = document.getElementById('previewImage'); // 新增：獲取圖片元素

    // 儲存預設的資訊
    const defaultTitle = previewTitleElement.textContent;
    const defaultBio = previewBioElement.textContent;
    const defaultImageSrc = previewImageElement.src; // 新增：儲存預設圖片路徑

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
                listItem.setAttribute('data-title', project.title);
                listItem.setAttribute('data-bio', project.bio);
                listItem.setAttribute('data-cover-image', project.coverImage); // 新增：儲存封面圖路徑
                
                listItem.innerHTML = `<a href="project.html?id=${project.id}">${project.title}</a>`;
                
                projectListElement.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectListElement.innerHTML = '<li>Error loading projects.</li>';
        });

    // 使用事件委派處理滑鼠事件
    projectListElement.addEventListener('mouseover', (event) => {
        if (event.target.tagName === 'A') {
            const projectItem = event.target.parentElement;
            const newTitle = projectItem.getAttribute('data-title');
            const newBio = projectItem.getAttribute('data-bio');
            const newImageSrc = projectItem.getAttribute('data-cover-image'); // 新增：獲取圖片路徑
            
            // 更新左側欄位的內容
            previewTitleElement.textContent = newTitle;
            previewBioElement.textContent = newBio;
            if (newImageSrc) { // 新增：如果圖片路徑存在，則更新
                previewImageElement.src = newImageSrc;
            }
        }
    });

    projectListElement.addEventListener('mouseout', () => {
        // 滑鼠移出整個列表區域時，恢復預設內容
        previewTitleElement.textContent = defaultTitle;
        previewBioElement.textContent = defaultBio;
        previewImageElement.src = defaultImageSrc; // 新增：恢復預設圖片
    });
});

