document.addEventListener('DOMContentLoaded', () => {
    // 獲取頁面上需要更新的元素
    const projectNumberElement = document.getElementById('projectNumber');
    const projectTitleElement = document.getElementById('projectTitle');
    const projectBioElement = document.getElementById('projectBio');
    const projectInfoElement = document.getElementById('projectInfo');
    const imageContainer = document.getElementById('projectImages');

    // 獲取 "Next Project" 按鈕的元素
    const nextProjectLink = document.getElementById('nextProjectLink');
    const nextProjectCategory = document.getElementById('nextProjectCategory');
    const nextProjectTitle = document.getElementById('nextProjectTitle');

    // 1. 從 URL 取得作品 id
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (projectId) {
        // 2. 讀取 JSON 檔案 (路徑相對於 project.html)
        fetch('./data/projects.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok (HTTP ${response.status})`);
                }
                return response.json();
            })
            .then(projects => {
                // 3. 找到對應 id 的作品
                const project = projects.find(p => p.id === projectId);

                if (project) {
                    // 4. 將作品資料填入頁面中
                    document.title = `Project - ${project.title}`; // 更新網頁標題
                    
                    projectNumberElement.textContent = project.category; 
                    
                    projectTitleElement.textContent = project.title;
                    projectBioElement.textContent = project.bio;
                    projectInfoElement.innerHTML = project.info;

                    // 5. 載入圖片
                    imageContainer.innerHTML = ''; // 清空預設圖片
                    project.images.forEach(imageUrl => {
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.alt = `${project.title} image`;
                        imageContainer.appendChild(img);
                    });

                    // 6. 載入隨機的「Next Project」
                    const otherProjects = projects.filter(p => p.id !== projectId);
                    
                    if (otherProjects.length > 0 && nextProjectLink) {
                        const randomProject = otherProjects[Math.floor(Math.random() * otherProjects.length)];
                        nextProjectLink.href = `project.html?id=${randomProject.id}`;
                        nextProjectCategory.textContent = randomProject.category;
                        nextProjectTitle.textContent = randomProject.title;
                    } else if (nextProjectLink) {
                        nextProjectLink.style.display = 'none';
                    }

                } else {
                    // 如果找不到對應的 project id
                    projectTitleElement.textContent = 'Project Not Found';
                    projectBioElement.textContent = 'Please check the project ID and try again.';
                    if (nextProjectLink) nextProjectLink.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching project data:', error);
                projectTitleElement.textContent = 'Error';
                projectBioElement.textContent = `Could not load project data. (${error.message})`;
                if (nextProjectLink) nextProjectLink.style.display = 'none';
            });
    } else {
        projectTitleElement.textContent = 'No Project Selected';
        projectBioElement.textContent = 'Please select a project from the main page.';
        if (nextProjectLink) nextProjectLink.style.display = 'none';
    }
});
