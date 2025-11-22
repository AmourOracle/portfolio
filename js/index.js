document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('portfolio-scroll-lock');

    // --- DOM Elements ---
    const projectList = document.getElementById('projectList');
    const centerColumn = document.querySelector('.center-column');

    // Left Column Info
    const previewTitleElement = document.getElementById('previewTitle');
    const previewBioElement = document.getElementById('previewBio');
    const previewInfoElement = document.getElementById('previewInfo');

    // Labels & Blocks
    const previewLabelNo = document.getElementById('previewLabelNo');
    const previewLabelCategory = document.getElementById('previewLabelCategory');
    const previewBlockBio = document.getElementById('previewBlockBio');
    const previewLabelInfo_Default = document.getElementById('previewLabelInfo_Default');
    const previewLabelDocs_Project = document.getElementById('previewLabelDocs_Project');

    // Random Preview
    const randomPreviewPopup = document.getElementById('randomPreviewPopup');
    const randomPreviewImage = document.getElementById('randomPreviewImage');

    // Filter Elements
    const categoryNavElement = document.getElementById('categoryNav');
    const mobileFooterElement = document.querySelector('.mobile-footer');

    // --- Global Variables ---
    let allProjectsData = [];
    let visibleItems = [];
    let currentFilter = 'all';
    let currentActiveIndex = -1;
    let pickerLoopId = null;
    let isScrolling = false;

    // --- Helper Functions ---
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    // --- 1. Initial Data Fetch ---
    fetch('./data/projects.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(projects => {
            if (!projects || projects.length === 0) throw new Error("No projects found.");

            allProjectsData = projects;

            // Initial Render
            renderProjectList('all');

            // Bind Events
            bindFilterEvents();
            bindScrollListeners();

            // Entrance Animation
            setTimeout(() => {
                const mainContainer = document.querySelector('.portfolio-container');
                if (mainContainer) mainContainer.classList.add('is-loaded');
            }, 50);
        })
        .catch(error => {
            console.error('Error:', error);
            if (projectList) {
                projectList.innerHTML = `<li class="project-item">Error: ${error.message}</li>`;
            }
        });

    // --- 2. Render & Filter Logic ---
    function renderProjectList(filterType) {
        projectList.innerHTML = '';
        visibleItems = [];
        currentActiveIndex = -1; // (MOD) Reset active index to force update

        let filteredProjects = [];
        if (filterType === 'all') {
            filteredProjects = allProjectsData;
        } else {
            filteredProjects = allProjectsData.filter(p => p.category === filterType);
        }

        if (filteredProjects.length === 0) {
            projectList.innerHTML = `<li class="project-item" style="justify-content: center; opacity: 1;"><span style="font-family: var(--font-mono); color: var(--secondary-color);">No projects found.</span></li>`;
            resetPreviewInfo();
            return;
        }

        filteredProjects.forEach((project, index) => {
            const item = createProjectItem(project, index);
            projectList.appendChild(item);
            visibleItems.push(item);
        });

        // Reset scroll position to top
        if (centerColumn) {
            centerColumn.scrollTop = 0;
        }

        // Initial Active Update
        setTimeout(() => {
            updateActiveItemOnScroll();
        }, 100);
    }

    function createProjectItem(project, index) {
        const li = document.createElement('li');
        li.className = 'project-item';

        li.setAttribute('data-id', project.id);
        li.setAttribute('data-index', index);
        li.setAttribute('data-category', project.category);
        li.setAttribute('data-title', project.title);
        li.setAttribute('data-bio', project.bio);
        li.setAttribute('data-cover-image', project.coverImage);
        li.setAttribute('data-info', project.info);

        li.innerHTML = `
            <span class="project-category">${project.category}</span>
            <a href="project.html?id=${project.id}" onclick="event.preventDefault()">${project.title}</a>
        `;

        // Click Event for Navigation
        li.addEventListener('click', (e) => {
            // If item is already active, navigate
            if (li.classList.contains('is-active')) {
                window.location.href = `project.html?id=${project.id}`;
            } else {
                // If not active, scroll to it
                e.preventDefault();
                li.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        return li;
    }

    // --- 3. Scroll & Picker Logic (The Core) ---
    function bindScrollListeners() {
        if (!centerColumn) return;

        centerColumn.addEventListener('scroll', handleScroll, { passive: true });

        // Start the visual loop
        startPickerLoop();
    }

    function startPickerLoop() {
        if (pickerLoopId) cancelAnimationFrame(pickerLoopId);
        pickerLoopId = requestAnimationFrame(renderPickerLoop);
    }

    function renderPickerLoop() {
        if (!centerColumn) return;

        const containerRect = centerColumn.getBoundingClientRect();

        // (MOD_v17.6) 修正中心點計算
        // Mobile: 使用螢幕中心，確保與視覺焦點一致
        // Desktop: 保持容器中心
        let containerCenter;
        if (isMobile()) {
            containerCenter = window.innerHeight / 2;
        } else {
            containerCenter = containerRect.top + containerRect.height / 2;
        }

        const range = containerRect.height / 2;

        let closestItem = null;
        let minDistance = Infinity;
        let closestIndex = -1;

        visibleItems.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height / 2;
            const distance = itemCenter - containerCenter;
            const absDistance = Math.abs(distance);

            // Track closest item for Active State
            if (absDistance < minDistance) {
                minDistance = absDistance;
                closestItem = item;
                closestIndex = index;
            }

            // Normalize distance (-1 to 1)
            let ratio = distance / range;

            // (MOD_v17.6) 分離 Desktop 與 Mobile 的視覺效果
            if (isMobile()) {
                // Mobile Transform Logic
                // 1. Scale: 放大效果 (1.0 -> 1.2)
                const mobileScale = Math.max(1.0, 1.2 - Math.abs(ratio) * 0.5);

                // (MOD_v17.7) 移除 TranslateX 左移邏輯
                // 理由：使用者希望完全置中，左移會破壞置中平衡
                /*
                let translateX = 0;
                if (Math.abs(ratio) < 0.3) {
                    translateX = -20 * (1 - (Math.abs(ratio) / 0.3));
                }
                */

                // 3. Opacity
                const opacity = Math.max(0.3, 1 - Math.pow(Math.abs(ratio), 1.5));

                // 僅應用 Scale 和 Opacity
                item.style.transform = `scale(${mobileScale})`;
                item.style.opacity = opacity;
                item.style.zIndex = Math.round(100 - Math.abs(ratio) * 100);

            } else {
                // Desktop 3D Cylinder Effect (Existing)
                let rotateX = -ratio * 45;
                if (rotateX > 90) rotateX = 90;
                if (rotateX < -90) rotateX = -90;

                const scale = Math.max(0.8, 1 - Math.abs(ratio) * 0.3);
                const opacity = Math.max(0.2, 1 - Math.pow(Math.abs(ratio), 1.5));

                item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) scale(${scale})`;
                item.style.opacity = opacity;
                item.style.zIndex = Math.round(100 - Math.abs(ratio) * 100);
            }
        });

        // Real-time Active State Update
        if (closestIndex !== -1 && closestIndex !== currentActiveIndex) {
            setActiveItem(closestIndex);
        }

        pickerLoopId = requestAnimationFrame(renderPickerLoop);
    }

    // Handle Logical Updates (Active State)
    function handleScroll() {
        // Logic managed by loop
    }

    function updateActiveItemOnScroll() {
        // Logic managed by loop
    }

    function setActiveItem(index) {
        if (index < 0 || index >= visibleItems.length) return;

        currentActiveIndex = index;
        const activeItem = visibleItems[index];

        // Update Classes
        visibleItems.forEach(item => {
            item.classList.remove('is-active');
            // (MOD_v17.6) 移除跑馬燈 class
            const link = item.querySelector('a');
            if (link) link.classList.remove('marquee-text');
        });

        activeItem.classList.add('is-active');

        // (MOD_v17.6) 檢查是否需要跑馬燈 (僅 Mobile)
        if (isMobile()) {
            const link = activeItem.querySelector('a');
            // 簡單判斷：如果文字長度大於一定字元，或者使用 scrollWidth > clientWidth
            // 由於 scale 變形可能影響 clientWidth 計算，這裡使用簡易字元長度判斷或直接套用
            // 為確保長標題一定能看到，我們直接對 Active 項目套用 marquee 規則
            // CSS 中會處理動畫
            if (link) link.classList.add('marquee-text');
        }

        // Update Left Column Info
        updateActiveContent(activeItem);
    }

    // --- 4. Filter Events ---
    function bindFilterEvents() {
        const handleFilter = (event) => {
            const targetLink = event.target.closest('a[data-filter]');
            if (!targetLink) return;

            event.preventDefault();
            const newFilter = targetLink.getAttribute('data-filter');

            if (newFilter === currentFilter) return;
            currentFilter = newFilter;

            updateFilterUI(newFilter);
            renderProjectList(newFilter);
        };

        if (categoryNavElement) {
            categoryNavElement.addEventListener('click', handleFilter);
        }
        if (mobileFooterElement) {
            mobileFooterElement.addEventListener('click', handleFilter);
        }
    }

    function updateFilterUI(activeFilter) {
        const allLinks = document.querySelectorAll('a[data-filter]');
        allLinks.forEach(link => {
            if (link.getAttribute('data-filter') === activeFilter) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // --- 5. Content Updates ---
    function updateActiveContent(activeItem) {
        if (!activeItem) return;

        const title = activeItem.getAttribute('data-title');
        const bio = activeItem.getAttribute('data-bio');
        const category = activeItem.getAttribute('data-category');
        const info = activeItem.getAttribute('data-info');
        const coverImage = activeItem.getAttribute('data-cover-image');

        if (previewTitleElement) previewTitleElement.textContent = title;
        if (previewBioElement) previewBioElement.textContent = bio;
        if (previewInfoElement) previewInfoElement.innerHTML = info;

        if (previewLabelNo && previewLabelCategory) {
            previewLabelNo.style.display = 'none';
            previewLabelCategory.style.display = 'inline-block';
            previewLabelCategory.textContent = category;
        }

        if (previewLabelInfo_Default && previewLabelDocs_Project) {
            previewLabelInfo_Default.style.display = 'none';
            previewLabelDocs_Project.style.display = 'inline-block';
        }

        if (previewBlockBio) {
            previewBlockBio.classList.add('hide-section');
        }

        updateRandomPreview(coverImage);
    }

    function resetPreviewInfo() {
        if (previewTitleElement) previewTitleElement.textContent = 'No Projects';
        if (previewBioElement) previewBioElement.textContent = '';
        if (previewInfoElement) previewInfoElement.textContent = '';
        updateRandomPreview(null);
    }

    // --- 6. Random Preview ---
    function updateRandomPreview(imageSrc) {
        if (!randomPreviewPopup || !randomPreviewImage) return;

        if (imageSrc) {
            randomPreviewImage.src = imageSrc;
            const scale = getRandomFloat(0.9, 1.3);
            const rotate = getRandomFloat(-15, 15);

            let top, left;
            if (isMobile()) {
                top = getRandomFloat(30, 50);
                left = getRandomFloat(10, 30);
                randomPreviewPopup.style.transform = `translate(${left}vw, ${top}vh) rotate(${rotate}deg) scale(${scale})`;
            } else {
                top = getRandomFloat(10, 60);
                left = getRandomFloat(45, 70);
                randomPreviewPopup.style.transform = `translate(${left}vw, ${top}vh) rotate(${rotate}deg) scale(${scale})`;
            }
            randomPreviewPopup.classList.add('is-visible');
        } else {
            randomPreviewPopup.classList.remove('is-visible');
        }
    }
});