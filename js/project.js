document.addEventListener('DOMContentLoaded', () => {
    // 獲取頁面上需要更新的元素
    const projectNumberElement = document.getElementById('projectNumber');
    const projectTitleElement = document.getElementById('projectTitle');
    const projectBioElement = document.getElementById('projectBio');
    const projectInfoElement = document.getElementById('projectInfo');
    const imageContainer = document.getElementById('projectImages');

    // ADD: (Request 4) 獲取 "Next Project" 按鈕的元素 (Desktop)
    const nextProjectLink = document.getElementById('nextProjectLink');
    const nextProjectCategory = document.getElementById('nextProjectCategory');
    const nextProjectTitle = document.getElementById('nextProjectTitle');

    // (ADD_v20.2) 獲取手機版導航元素
    const mobileNextProjectLink = document.getElementById('mobileNextProjectLink');
    const mobileNextProjectCategory = document.getElementById('mobileNextProjectCategory');
    const mobileNextProjectTitle = document.getElementById('mobileNextProjectTitle');

    // (MOD_v16.0) 重新啟用並選取正確的容器 (middle-container) 以觸發進場動畫
    const projectMainContainer = document.querySelector('.middle-container');


    // 1. 從 URL 取得作品 id
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (projectId) {
        // 2. 讀取 JSON 檔案
        fetch('./data/projects.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(projects => {
                // 3. 找到對應 id 的作品
                const project = projects.find(p => p.id === projectId);

                if (project) {
                    // 4. 將作品資料填入頁面中
                    document.title = `Project - ${project.title}`;

                    // MOD: (Request 1) 修正資料存取邏輯，顯示 Category 而非 Number
                    projectNumberElement.textContent = project.category;

                    // (MOD_v18.3) 同步左側標題視覺效果 (換行 + 括號風格)
                    const match = project.title.match(/^(.*)[\s\u3000]+(.*)$/);
                    if (match) {
                        const name = match[1];
                        const type = match[2];
                        // 插入與 Portfolio 頁面一致的 HTML 結構
                        projectTitleElement.innerHTML = `${name}<br><span class="t-paren">(</span><span class="t-type">${type}</span><span class="t-paren">)</span>`;
                    } else {
                        projectTitleElement.textContent = project.title;
                    }

                    projectBioElement.textContent = project.bio;
                    projectInfoElement.innerHTML = project.info;

                    // 5. 載入圖片
                    imageContainer.innerHTML = '';
                    project.images.forEach(imageUrl => {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.alt = `${project.title} image`;
                        // (MOD_v20.2) 確保圖片有 loading="lazy" 以優化手機載入
                        img.loading = 'lazy';
                        imageContainer.appendChild(img);
                    });

                    // 6. ADD: (Request 4) 載入隨機的「Next Project」
                    const otherProjects = projects.filter(p => p.id !== projectId);

                    if (otherProjects.length > 0) {
                        const randomProject = otherProjects[Math.floor(Math.random() * otherProjects.length)];

                        // Update Desktop Link
                        if (nextProjectLink) {
                            nextProjectLink.href = `project.html?id=${randomProject.id}`;
                            nextProjectCategory.textContent = randomProject.category;
                            nextProjectTitle.textContent = randomProject.title;
                        }

                        // (ADD_v20.2) Update Mobile Link
                        if (mobileNextProjectLink) {
                            mobileNextProjectLink.href = `project.html?id=${randomProject.id}`;
                            mobileNextProjectCategory.textContent = randomProject.category;
                            mobileNextProjectTitle.textContent = randomProject.title;
                        }
                    } else {
                        if (nextProjectLink) nextProjectLink.style.display = 'none';
                        if (mobileNextProjectLink) mobileNextProjectLink.style.display = 'none';
                    }

                } else {
                    projectTitleElement.textContent = 'Project Not Found';
                    projectBioElement.textContent = 'Please check the project ID and try again.';
                    if (nextProjectLink) nextProjectLink.style.display = 'none';
                    if (mobileNextProjectLink) mobileNextProjectLink.style.display = 'none';
                }

                // (MOD_v16.0) 觸發進場動畫 (資料載入完成後)
                if (projectMainContainer) {
                    setTimeout(() => {
                        projectMainContainer.classList.add('is-loaded');
                    }, 50); // 小延遲確保 DOM 渲染
                }
            })
            .catch(error => {
                console.error('Error fetching project data:', error);
                projectTitleElement.textContent = 'Error';
                projectBioElement.textContent = 'Could not load project data.';
                if (nextProjectLink) nextProjectLink.style.display = 'none';

                // (MOD_v16.0) 即使出錯也要顯示 UI，以免頁面空白
                if (projectMainContainer) {
                    projectMainContainer.classList.add('is-loaded');
                }
            });
    } else {
        projectTitleElement.textContent = 'No Project Selected';
        projectBioElement.textContent = 'Please select a project from the main page.';
        if (nextProjectLink) nextProjectLink.style.display = 'none';

        // (MOD_v16.0) 即使沒有 ID 也要顯示錯誤訊息
        if (projectMainContainer) {
            projectMainContainer.classList.add('is-loaded');
        }
    }
});